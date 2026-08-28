---
title: GraalVM
parent: Project Reports
categories:
  - runtimes
---

# GraalVM

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for GraalVM
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items verified against only one source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

GraalVM is a polyglot virtual machine and compiler infrastructure developed by Oracle Labs. It provides two primary deployment modes: (1) the Graal JIT compiler, which operates as a drop-in replacement for HotSpot's C2 JIT inside OpenJDK via the JVMCI interface, and (2) Native Image (SubstrateVM), an ahead-of-time compiler that produces self-contained native binaries from Java and other JVM-language programs. GraalVM also hosts Truffle, a framework for implementing language runtimes (GraalPy, GraalJS, TruffleRuby, Espresso).

**Governance:** GraalVM is hosted under the `oracle` GitHub organization and is Oracle-controlled. There is no independent foundation governance. An Advisory Board with external members (Alibaba is a confirmed member) provides input, but decision authority rests with Oracle Labs. The project uses the Oracle Contributor Agreement (OCA) for external contributions. GraalVM is not a member of the RISE project.

**License:** Mixed by component. Compiler, SubstrateVM, Tools: GPL 2 with Classpath Exception. SDK, Truffle, GraalWasm, TRegex: Universal Permissive License (UPL). Sulong: 3-clause BSD. Espresso: GPL 2.

**Corporate maintainers:** All top contributors are Oracle Labs employees. Top committers by count: dougxc (Douglas Simon, 6124 commits), chumer (Christian Humer, 4804), zapster (Josef Eisl, 4713), gilles-duboscq (Gilles Duboscq, 3474), rschatz (Roland Schatz, 2924). OWNERS.toml for the compiler names only oracle.com email addresses. Active riscv64 contributors: @wirthi and @Zeavee (Oracle Labs, assignees on issue [#13351](https://github.com/oracle/graal/issues/13351)), @gounthar (external, OCA verified, author of the 2026 porting PRs).

**Community stance on new ports:** Oracle Lab engineers drive all architectural decisions. External contributions are accepted via OCA, but the riscv64 port did not begin until an external contributor (gounthar) opened the master tracking issue in April 2026 and submitted the initial PRs. No public roadmap for riscv64 support was found. The project does not publish a tier policy document.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| Apr 6, 2022 | commit c0dc96b1: libffi `ffi_prep_cif_var` added for RISC-V variadic calls; author notes "linux-riscv soon" based on OpenJDK progress | [commit c0dc96b](https://github.com/oracle/graal/commit/c0dc96b) |
| Jul 16, 2022 | PR [#4716](https://github.com/oracle/graal/pull/4716) merged: aligned `pthread_mutex_t` and `pthread_cond_t` on word boundary; RISC-V explicitly tested in review | [PR #4716](https://github.com/oracle/graal/pull/4716) |
| Jan 27, 2023 | commit 95dbcf58: varargs C helper added for `linux-riscv` and `darwin-aarch64` | [commit 95dbcf5](https://github.com/oracle/graal/commit/95dbcf5) |
| ~Jan 2023 | Initial riscv64 Native Image LLVM-backend target added (LLVM platform specific, CPU features, libchelper) -- cited as PR #4812 in research [NEEDS VERIFICATION: PR number] | internal |
| Jul 26, 2023 | PR [#7068](https://github.com/oracle/graal/pull/7068) merged: fixed riscv64 SVM test gate (Clang targeting riscv64, switched to lld) | [PR #7068](https://github.com/oracle/graal/pull/7068) |
| Nov 7, 2023 | PR [#7749](https://github.com/oracle/graal/pull/7749) merged: added `CPUTypeRISCV64`, removed reflection-based workarounds (`ShadowedRISCV64`, `RISCV64ReflectionUtil`) after dropping JDK 17 requirement | [PR #7749](https://github.com/oracle/graal/pull/7749) |
| Apr 2024 | Issue [#8684](https://github.com/oracle/graal/issues/8684) opened: MUSL_GCC_TOOLCHAIN missing for RISC-V; no assignee; stalled | [Issue #8684](https://github.com/oracle/graal/issues/8684) |
| Apr 2, 2024 | Issue [#8685](https://github.com/oracle/graal/issues/8685) opened: deadlock during native image build on slow riscv64 hardware | [Issue #8685](https://github.com/oracle/graal/issues/8685) |
| ~2024 | PR [#9156](https://github.com/oracle/graal/pull/9156) merged: made musl optional for RISC-V to unblock builds without musl toolchain | [PR #9156](https://github.com/oracle/graal/pull/9156) |
| Apr 17, 2026 | Issue [#13351](https://github.com/oracle/graal/issues/13351) opened by gounthar: master tracking issue for riscv64 native-image support; assigned to @wirthi and @Zeavee | [Issue #13351](https://github.com/oracle/graal/issues/13351) |
| Apr 22-23, 2026 | Issue [#13386](https://github.com/oracle/graal/issues/13386) and PR [#13391](https://github.com/oracle/graal/pull/13391): `pthread_key_t` type size bug causing shutdown crash on riscv64 | [Issue #13386](https://github.com/oracle/graal/issues/13386), [PR #13391](https://github.com/oracle/graal/pull/13391) |
| Apr 23, 2026 | PR [#13397](https://github.com/oracle/graal/pull/13397) opened and closed by author: fix for DeallocatorThread.class monitor contention on slow riscv64 hardware; closed because OCA not yet signed | [PR #13397](https://github.com/oracle/graal/pull/13397) |
| May 11, 2026 | Issue [#13516](https://github.com/oracle/graal/issues/13516) opened: LLVM backend fails on riscv64 because `cc487` (GraalCallingConvention) is not implemented in riscv64 `llc` | [Issue #13516](https://github.com/oracle/graal/issues/13516) |
| May 13, 2026 | LabsJDK jvmci-25.1-b18: first riscv64 artifact published by graalvm/labs-openjdk | [labs-openjdk releases](https://github.com/graalvm/labs-openjdk/releases) |
| Jun 18, 2026 | PR [#13826](https://github.com/oracle/graal/pull/13826) opened: implements fixed-parameter and return-saving calling convention for riscv64 in `SubstrateRISCV64RegisterConfig`; approved by @Zeavee, not yet merged | [PR #13826](https://github.com/oracle/graal/pull/13826) |

**Is the port fully upstream?** No. All structural code (register config, CPU feature detection, ELF relocation table, platform declarations) is upstream in the master branch. The Native Image native backend is explicitly disabled with a hard `GraalError.unimplemented()` guard. Two open PRs (#13391, #13826) carry fixes for blocking bugs but are not yet merged. No riscv64 native-image binary has ever been produced from the upstream build.

---

## 3. Upstream Support Tier

GraalVM publishes no formal tier or platform classification policy. No PLATFORMS.md or SUPPORT.md exists in oracle/graal.

**Evidence for effective tier status:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Official binary release | Yes | Yes | No |
| CI in upstream repo | Yes (ubuntu-22.04, ubuntu-24.04) | No (same as riscv64) | No |
| Release-blocking tests | Yes | No | No |
| Native Image functional | Yes | Yes | No |
| Musl variant | Yes | Yes | No |
| GraalVM JDK in OS packages | Partial (Homebrew, sdkman) | Partial | None |
| LabsJDK artifact available | Yes | Yes | Since b18 (May 2026) |

amd64 is the only tier-1 platform by all criteria. arm64 has official binaries and a working Native Image but no upstream CI -- it appears to be tested in an internal Oracle CI not exposed to the public repository. riscv64 has no official binary, no CI, and no functional Native Image.

The official GraalVM download page lists four supported platforms: linux-x64, linux-aarch64, macos-aarch64, windows-x64. riscv64 is absent. [Source: [graalvm/graalvm-ce-builds releases](https://github.com/graalvm/graalvm-ce-builds/releases), asset list for jdk-25.0.2, fully enumerated: 10 assets, none containing "riscv".]

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

GraalVM's architecture has two distinct compiler paths relevant to riscv64:

**Path A -- Graal JIT (HotSpot mode):** The Graal compiler runs inside HotSpot via JVMCI. The riscv64 JVMCI interface in OpenJDK is functional. GraalVM has stub files for this path (`RISCV64HotSpotBackendFactory.java`, `RISCV64HotSpotLoweringProvider.java`, `RISCV64NodeMatchRules.java`) but critical methods throw `GraalError.unimplementedOverride()`. The LIR layer and assembler layer required for code generation are entirely absent for riscv64.

**Path B -- Native Image (SubstrateVM, LLVM-delegated):** The native Graal backend is explicitly disabled. `SubstrateRISCV64Feature.java` throws `GraalError.unimplemented("The RISC-V native backend is currently unimplemented. Use the LLVM backend.")` at startup. All Native Image compilation for riscv64 must use `--tool:llvm-backend`, routing through a patched LLVM 20.1.4 fork hosted by Oracle (`graalvm/llvm-project`).

### Component-by-component status

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Reserved registers | Full | Full | Full | x23=thread, x27=heap base, x2=sp |
| CPU feature detection (AT_HWCAP) | Full | Full | Full | Detects I, M, A, F, D, C, V via `getauxval` |
| ELF relocation table | Full | Full | Full | 58 R_RISCV_* types, rv64gc e_flags |
| Platform declarations | Full | Full | Full | `Platform.LINUX_RISCV64` since GraalVM 22.2 |
| Register config (calling convention) | Full | Full | Partial | `getCallingConventionRegisters()` and `filterAllocatableRegisters()` throw `intentionallyUnimplemented()`; PR #13826 open |
| HotSpot backend factory | Full | Full | Stub | `newRegisterAllocationConfig()` and `newReferenceMapBuilder()` throw `GraalError.unimplementedOverride()` |
| HotSpot lowering provider | Full | Full | Stub | `lower()` throws `GraalError.unimplementedOverride()` |
| Node match rules (pattern matching) | ~100 rules | ~200 rules | Empty stub | riscv64 file is 3-line body, constructor only |
| LIR instruction layer | ~80 files | ~90 files | Missing (0 files) | No `lir/riscv64/` directory exists |
| Graal assembler / macro assembler | Full | Full | Missing | No `asm/riscv64/` directory; JDK JVMCI assembler exists but is not leveraged |
| SubstrateVM native backend | Full | Full | Missing | No `SubstrateRISCV64Backend.java` |
| Native Image via LLVM backend | N/A (not primary) | N/A (not primary) | Partially functional | Blocked by issue #13516 (cc487 calling convention); PR #13826 open |
| RVV (Vector extension) intrinsics | N/A | SVE2 partial | Missing | V extension is detected but no dispatch code exists |
| Zba/Zbb/Zbs B-extension support | N/A | N/A | Missing | Not in cpufeatures.h; not detected |
| Crypto intrinsics | Full (AES-NI etc.) | Full (ARMv8-A) | Missing | No riscv64 crypto backend |
| SIMD vectorized operations | Full (AVX-512) | Full (SVE/NEON) | Missing | No RVV dispatch in any GraalVM component |
| Musl libc variant for native-image | Full | Full | Missing | No musl GCC toolchain for riscv64 |

**ISA extension coverage:** The CPU feature detection layer (`riscv64cpufeatures.h`, `cpuid.c`) tracks I, M, A, F, D, C, and V (RVV). The B-extension (Zba, Zbb, Zbc, Zbs) is not tracked and not detected. There is no `AT_HWCAP2` parsing. Despite V being detected, there is no code that dispatches to RVV paths.

---

## 5. Build System, Cross-Compilation, and Toolchain

### Build system

GraalVM uses `mx`, a proprietary Python build tool from Oracle/GraalVM. There is no CMakeLists.txt, no autoconf, and no `-DUSE_X=OFF` cmake flags. The main build is:

```bash
git clone https://github.com/oracle/graal.git
git clone https://github.com/graalvm/mx
export PATH=/path/to/mx:$PATH
export JAVA_HOME=/path/to/labsjdk-riscv64
export MX_PYTHON=python3.8
cd graal/vm && mx --env ce build
```

### Required toolchain

| Component | Minimum | CI/dev target | Notes |
|-----------|---------|---------------|-------|
| GCC | 10.0 | 14.2.0 (riscv64 devkit) | C++17 required by SubstrateVM native libs; GCC 14.2.0 used in labs-openjdk devkit for riscv64 |
| make | 4.3 | 4.3 | |
| binutils | 2.36 | 2.43 (riscv64 devkit) | Gold linker skipped for riscv64; ld.bfd only (`--disable-gold` applied in devkit build) |
| Python | 3.8 | 3.8 | Set via `MX_PYTHON=python3.8` |
| mx | 7.83.0 | 7.83.0 | |
| LabsJDK (JVMCI) | jvmci-25.1-b18 | jvmci-25.1-b19 | First riscv64 artifact was b18 (May 13, 2026); before that, `mx fetch-jdk` would 404 on riscv64 |

The Gold linker is explicitly excluded for riscv64 in the labs-openjdk devkit Makefile (`--enable-gold=default` is skipped for riscv64). `--disable-multilib` is applied.

### LLVM backend toolchain (required for native-image on riscv64)

Native Image on riscv64 requires `--tool:llvm-backend`. The patched LLVM 20.1.4 bundle is defined in `sdk/mx.sdk/suite.py`:
- URL: `https://lafo.ssw.uni-linz.ac.at/pub/llvm/llvm-llvmorg-20.1.4-linux-riscv64.tar.gz`
- This is a fork of LLVM maintained at `graalvm/llvm-project`, patched to add `cc487` (GraalCallingConvention) support for x86_64 and aarch64 -- but NOT for riscv64 (the root cause of issue [#13516](https://github.com/oracle/graal/issues/13516)).
- `mx` downloads this automatically when building on linux/riscv64.

### Cross-compilation

Native Image does not support cross-compilation. Builds must run natively on the target riscv64 host. A LabsJDK riscv64 artifact has been available since jvmci-25.1-b18.

### QEMU

QEMU-based builds are feasible in principle but untested in the official workflow. The LabsJDK build invokes Java tools throughout; under QEMU user-mode emulation this adds approximately 10x overhead per Java invocation, pushing a full LabsJDK build to an estimated 10+ hours vs. approximately 3.5 hours on native Banana Pi F3 hardware. [Source: labs-openjdk PR #34 comments, [NEEDS VERIFICATION: exact figure].]

### `-march` options for native-image

Supported via `NativeImageOptions.MicroArchitecture`: `rv64gc` (default), `rv64imafdc`, `rv64imafdcv`, `rv64gcv`, `compatibility`, `native`. Source: `substratevm/src/com.oracle.svm.hosted/src/com/oracle/svm/hosted/util/CPUTypeRISCV64.java`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps (cannot do X at all on riscv64)

| Feature | amd64 | arm64 | riscv64 | Impact |
|---------|-------|-------|---------|--------|
| Native Image (native backend) | Yes | Yes | No -- explicitly disabled | Cannot produce native binaries via Graal code generator |
| Native Image (LLVM backend) | N/A | N/A | Blocked (issue #13516) | Cannot produce native binaries via LLVM path either |
| Graal JIT in HotSpot | Yes | Yes | Stub -- LIR/asm missing | GraalVM cannot JIT-compile on riscv64 |
| Musl native-image variant | Yes | Yes | No | No static-linked musl binaries |
| GraalVM distribution / download | Yes | Yes | No | No official binary to ship to users |

### Performance gaps (missing optimizations vs arm64 and amd64)

| Optimization | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| SIMD / vector intrinsics | AVX-512 | SVE2 partial | None | V extension detected but no dispatch |
| Crypto acceleration | AES-NI, SHA | ARMv8-A Crypto | None | No crypto intrinsic backend |
| Instruction selection (NodeMatchRules) | ~100 rules | ~200 rules | 0 rules | Stub class; no instruction combining |
| LIR optimization passes | Full | Full | None | LIR layer absent |
| B-extension (bitmanip) | N/A | N/A | Not tracked | Zba/Zbb absent from cpufeatures.h |

### Security hardening gaps

Data not available: no source was found describing shadow stack, CFI, pointer authentication, or similar hardening for the riscv64 GraalVM port. The musl variant (which is sometimes used for reduced attack surface) is absent for riscv64.

### Floating-point semantics

The libffi bundled in GraalVM's Truffle NFI component is version 3.4.8. A float argument marshaling bug is fixed in libffi PR #972, which is not present in v3.4.8 but is included in v3.6.0 (released 2026-06-20). Any Truffle language (GraalPy, GraalJS, TruffleRuby) making FFI calls with float arguments on riscv64 will produce incorrect results with the bundled libffi. [Source: [libffi status report](../libraries/libffi.md); primary: libffi issue tracker.]

---

## 7. CI/CD Infrastructure

**No riscv64 CI exists in oracle/graal.** All 17 workflow files in `.github/workflows/` were individually read and verified. None contain any reference to "riscv", "riscv64", or "linux/riscv64". The CI matrix covers `ubuntu-22.04`, `ubuntu-24.04` (x86_64), and `windows-2022` only. No QEMU emulation for non-x86 architectures is configured.

There is no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.travis.yml` in the repository root.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions runners | ubuntu-22.04, ubuntu-24.04 | None | None |
| RISE project runners | No | No | Not yet added |
| Test gate (SVM/native-image) | Yes | Not in public repo | No |
| Build gate | Yes | Not in public repo | No |
| Release-blocking | Yes | Unknown | No |

Issue [#13351](https://github.com/oracle/graal/issues/13351) notes that RISE `ubuntu-24.04-riscv` runners are available today and could be added. This is a feature request, not a description of existing CI. As of Jun 2026, no workflow file has been modified to add such a runner.

arm64 note: Oracle Labs appears to have internal CI for arm64 that is not reflected in the public `.github/workflows/` files. This is inferred from the availability of official arm64 binaries. The same inference does not apply to riscv64, which has no official binaries.

Hardware used for active riscv64 development: Banana Pi F3 (SpaceMiT K1, rv64gc, 16 GB RAM), contributed by the external contributor @gounthar and referenced in issues [#13396](https://github.com/oracle/graal/issues/13396), [#13516](https://github.com/oracle/graal/issues/13516), and [#13826](https://github.com/oracle/graal/pull/13826). This is not Oracle infrastructure.

---

## 8. Distribution and Release Status

**No riscv64 GraalVM binary exists in any surveyed distribution channel.**

| Channel | riscv64 available? | Evidence |
|---|---|---|
| [graalvm-ce-builds](https://github.com/graalvm/graalvm-ce-builds) (jdk-25.0.2) | No | Complete 10-asset enumeration: linux-x64, linux-aarch64, macos-aarch64, windows-x64, two source archives. No riscv64 asset. |
| PyPI (graalvm) | N/A | Package does not exist on PyPI (HTTP 404) |
| Debian | No | GraalVM is not packaged in Debian; tracker.debian.org returns 404 |
| Ubuntu (noble) | No | packages.ubuntu.com search returns no results for "graalvm" |
| Arch Linux RISC-V (archriscv.felixc.at) | No | Not listed in the Arch RISC-V package database |
| Repology | No | 38 graalvm entries tracked (Chocolatey, Homebrew, Solus, etc.); none are riscv64 builds |
| Mandrel (Red Hat) | No | Mandrel 25.0.2.0-Final has no riscv64 distribution; no riscv64 issues in graalvm/mandrel tracker |

**What a user must do today to get a working riscv64 GraalVM Native Image:** It is not possible. The LLVM backend cannot compile any GraalVM IR on riscv64 due to the missing `cc487` calling convention in `graalvm/llvm-project`'s `RISCVISelLowering.cpp` (issue [#13516](https://github.com/oracle/graal/issues/13516)). Even after that is fixed, PR [#13826](https://github.com/oracle/graal/pull/13826) (calling convention in `SubstrateRISCV64RegisterConfig`) and PR [#13391](https://github.com/oracle/graal/pull/13391) (`pthread_key_t` type fix) must also land before a working binary can be produced.

The Graal JIT inside HotSpot (as opposed to Native Image) is also non-functional on riscv64 because the LIR and assembler layers are absent. A user running `java -XX:+UseJVMCICompiler` on riscv64 LabsJDK would fall back to HotSpot C2.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| OpenJDK / LabsJDK (JVMCI) | JVM host; JVMCI interface; static .a libs for SubstrateVM | Build available since jvmci-25.1-b18 | No official riscv64 CI | riscv64 artifact available from b18 onward | labs-openjdk#33 resolved in b18; labs-openjdk#34 (static libs) open |
| LLVM 20.1.4 (graalvm/llvm-project fork) | Required JIT backend for Native Image on riscv64; native Graal backend is explicitly disabled | riscv64 binary distributed (lafo.ssw.uni-linz.ac.at) | Cannot compile any GraalVM IR: cc487 unsupported | No native-image binary produced | [oracle/graal#13516](https://github.com/oracle/graal/issues/13516): GraalCallingConvention missing from RISCVISelLowering.cpp; requires C++ patch in graalvm/llvm-project |
| JavaCPP LLVM presets (org.bytedeco:llvm) | Shadowed JAR delivering LLVM bitcode support; listed in suite.py as `llvm-shadowed-13.0.1-1.5.7-linux-riscv64.jar` | Listed in suite.py; Maven Central availability not verified | Unknown | Unknown | PR #13826 notes "LLVM bytedeco preset version mismatch" (LLVM 13 preset vs LLVM 20.1.4 objects) as a secondary blocker after calling convention fix |
| libffi 3.4.8 (bundled in Truffle NFI) | Truffle NFI backend; enables GraalPy, GraalJS, TruffleRuby to call native C functions | Builds on riscv64 | 3 open riscv64 bugs | libffi 3.6.0 released 2026-06-20; bundled 3.4.8 is outdated | Float marshal bug fixed in libffi PR #972 is NOT in bundled 3.4.8; any Truffle FFI call with float args returns wrong result on riscv64; libffi#466 (small int widening), #694 (struct_by_value), #777 (musl cross-compile) |
| musl libc + GCC toolchain (musl 1.2.5.1) | Static-linked native-image variant | No riscv64 toolchain | No | No | [Issue #8684](https://github.com/oracle/graal/issues/8684) open since Apr 2024; no assignee; libffi#777 (musl riscv64 cross-compile broken) compounds |
| glibc | Default libc for Linux native-image | Full (riscv64 since glibc 2.27, 2018) | Full | Full | No blocking issues |
| zlib 1.2.13 (bundled in musl toolchain) | Compression | Clean on riscv64 | CI includes riscv64 (PR #1139) | No blockers | No riscv64-specific issues |
| XZ / liblzma (org.tukaani:xz 1.10) | ICU4J compression in Truffle | Pure Java -- architecture-agnostic | Pure Java | Maven Central | None |
| JLine 3.28.0 (shaded) | Terminal support for native-image CLI | Native JLine disabled in GraalVM SDK; Java fallback only | No native code active | Patched | None after native loader patch |

### Deep-dive: LLVM dependency (critical path)

The LLVM backend is the only viable code generation path for GraalVM Native Image on riscv64. The required patch to `graalvm/llvm-project` -- adding a `case CallingConv::GraalCallingConvention:` handler in `RISCVISelLowering.cpp` -- is not present in the current LLVM 20.1.4 bundle. The issue description ([#13516](https://github.com/oracle/graal/issues/13516)) also identifies three secondary gaps: missing `emitMathUnsignedMin/Max` in `ArithmeticLLVMGenerator`, incorrect float-only intrinsics used for integer min/max, and the GC strategy `"compressed-pointer"` being unknown to LLVM 20's rewrite-statepoints pass. All four require changes in the LLVM C++ layer; the Java/GraalVM side cannot work around them.

### Deep-dive: libffi (correctness bug affecting Truffle languages)

GraalVM bundles libffi 3.4.8 as the Truffle NFI backend. libffi PR #972 (float argument marshaling fix for riscv64) was not merged until after 3.4.8 was tagged and is included only in 3.6.0 (released 2026-06-20). Any application using GraalPy, GraalJS, or TruffleRuby with native function calls involving float arguments will receive incorrect results on riscv64. This is a silent data corruption bug with no error message. [Source: [libffi status report](../libraries/libffi.md).]

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#13516](https://github.com/oracle/graal/issues/13516) | LLVM backend fails: cc487 (GraalCallingConvention) not implemented in riscv64 llc | Open | Critical | Complete blocker for native-image via LLVM path; requires C++ patch in graalvm/llvm-project; assigned @wirthi |
| [#13351](https://github.com/oracle/graal/issues/13351) | native-image: add riscv64 (linux-riscv_64) platform support | Open | Critical | Master tracking issue; no riscv64 GraalVM distribution exists; no CI; assigned @wirthi, @Zeavee |
| [#13826](https://github.com/oracle/graal/pull/13826) | fix(riscv64): implement fixed-parameter and return-saving calling convention | Open PR | High | Approved by @Zeavee; Java-side fix for SubstrateRISCV64RegisterConfig; build progresses through method compilation but linking still fails (bytedeco LLVM version mismatch) |
| [#13386](https://github.com/oracle/graal/issues/13386) | pthread_setspecific wrong arguments crash on shutdown -- riscv64 only | Open | High | Runtime crash on program exit; root: `pthread_key_tPointer` mapped to `size_t` (8 bytes) instead of `pthread_key_t` (4 bytes); glibc on riscv64 uses 64-bit comparison |
| [#13391](https://github.com/oracle/graal/pull/13391) | fix(posix): map pthread_key_tPointer to pthread_key_t instead of size_t | Open PR | High | Fix for #13386; awaiting final review from @Zeavee; OCA verified |
| [#8684](https://github.com/oracle/graal/issues/8684) | Add MUSL_GCC_TOOLCHAIN for RISC-V | Open | Medium | No musl toolchain for riscv64; `--libc=musl` native images impossible on riscv64; no assignee; stalled since 2024 |
| [#8685](https://github.com/oracle/graal/issues/8685) | Deadlock breaks the native image building process | Open | Medium | Deadlock on slow riscv64 hardware during native image build; fix in PR #13397 was closed without merging (OCA not signed) |
| libffi#466 (bundled) | Small integer return value widening | Open | High (correctness) | Silent data corruption for Truffle FFI calls; present in bundled libffi 3.4.8 |
| libffi float bug (bundled) | Float argument marshaling | Fixed in libffi 3.6.0 | High (correctness) | PR #972 fix not present in bundled 3.4.8; any Truffle language float FFI call gives wrong results on riscv64 |

**Correctness bugs summary:** Three silent correctness bugs affect riscv64 GraalVM today. (1) `pthread_key_t` type mismatch causes abort on shutdown. (2) libffi float argument marshaling produces wrong results for Truffle language FFI calls. (3) Small integer return value widening (libffi#466) produces wrong results for Truffle FFI calls returning small integer types. None of these produce visible errors during compilation -- they manifest at runtime.

---

## 12. Objections and Upstream Blockers

### Technical blockers (in dependency order)

1. **graalvm/llvm-project must be patched first.** Adding `case CallingConv::GraalCallingConvention:` to `RISCVISelLowering.cpp` is the hardest gate: it requires C++ LLVM backend knowledge, is in Oracle's private LLVM fork, and cannot be circumvented from the Java/GraalVM layer. Secondary LLVM gaps (#13516: missing emitMathUnsignedMin/Max, wrong intrinsics, unknown GC strategy) must also be fixed in the same LLVM layer. Without this, no native image binary is producible.

2. **PR #13826 must merge.** The Java-side calling convention fix in `SubstrateRISCV64RegisterConfig` is approved but not yet merged. Even after the LLVM patch, this PR is required.

3. **PR #13391 must merge.** The `pthread_key_t` shutdown crash fix is a correctness regression that will affect every native binary. It is awaiting a single reviewer's approval.

4. **Bytedeco LLVM preset version mismatch.** PR #13826 notes that even after method compilation succeeds, linking fails due to a LLVM 13 preset being used against LLVM 20.1.4 objects. This requires a bytedeco/javacpp-presets update or a workaround in GraalVM's build. [NEEDS VERIFICATION: specific required action is not fully characterized in the research.]

5. **libffi must be updated to 3.6.0** in GraalVM's bundled copy to fix the float marshaling correctness bug. This is a dependency bump in Truffle, not a new port.

### Organizational blockers

- **Oracle OCA requirement.** External contributors must sign Oracle's CLA. PR #13397 was closed specifically because the author's OCA was not yet signed at submission time. This adds friction to the external-contributor-driven port effort.
- **Oracle Labs drives all architectural decisions.** The riscv64 port is being driven by an external contributor (@gounthar) with Oracle engineers (@wirthi, @Zeavee) in review. Merge velocity depends on Oracle Labs reviewer availability. PR #13391 has been open since April 23, 2026 with one reviewer comment thread and no approval as of Jun 23, 2026 -- approximately 2 months of review latency.
- **No public roadmap.** Oracle has made no public commitment to ship riscv64 GraalVM. Issue #13351 has no milestone or target date.

### Acceptance probability

The foundational plumbing (CPU features, ELF relocations, register config, platform declarations) is already upstream. Oracle Labs engineers are assigned to the master tracking issue. Active PRs have received substantive review. The path to a working LLVM-backend native image is technically clear once the LLVM fork is patched. However, the native Graal backend (without LLVM) requires the entire LIR and assembler layer to be written from scratch -- a substantial multi-person-year effort with no current upstream momentum. Acceptance probability for the LLVM-backend path: high, given current trajectory. Acceptance probability for a native (non-LLVM) Graal backend for riscv64: low within a 12-month horizon.

---

## 13. Investment Analysis

RISE has no documented involvement with GraalVM. All active work is by an external contributor with Oracle Labs review. The items below are not covered by any known RISE or Oracle Labs commitment as of the research date.

### 13.1 Functional Enablement

The minimum viable path to a working riscv64 native-image is:

1. Patch `graalvm/llvm-project` `RISCVISelLowering.cpp` to add GraalCallingConvention (cc487) support. Also fix secondary gaps: emitMathUnsignedMin/Max, integer min/max intrinsics, compressed-pointer GC strategy.
2. Resolve the bytedeco LLVM preset version mismatch (LLVM 13 vs 20.1.4 objects).
3. Merge PR #13826 (SubstrateRISCV64RegisterConfig calling convention).
4. Merge PR #13391 (pthread_key_t type fix).
5. Update bundled libffi from 3.4.8 to 3.6.0 in Truffle NFI.
6. Add OCA-covered test coverage for the riscv64 path.

The LLVM C++ work (item 1) is the critical-path item. It requires an engineer with LLVM TableGen and instruction selection expertise, not just Java/GraalVM knowledge.

### 13.2 Performance Optimization

Not applicable until functional enablement is complete. No benchmarks exist because no binary can be produced. After functional enablement, the performance gap vs arm64 is large: no RVV dispatch, no B-extension use, no instruction selection rules (NodeMatchRules empty stub). An initial "working but unoptimized" native image will perform significantly below arm64.

Specific optimization work would include: (1) writing `RISCV64NodeMatchRules` for common patterns, (2) adding RVV dispatch for the Graal vector API, (3) implementing B-extension (Zba/Zbb) detection and use in the assembler. Each of these is a multi-month effort.

### 13.3 CI/CD Infrastructure

Adding riscv64 to the public GitHub Actions CI requires: (1) adding RISE `ubuntu-24.04-riscv` runners to `.github/workflows/main.yml` (or creating a new `riscv64.yml`), (2) adding a LabsJDK fetch step for the riscv64 artifact, and (3) scoping a test job that runs the SVM test gate. The infrastructure is available (RISE runners exist); the work is configuration and coordination with Oracle Labs.

### 13.4 Ecosystem Enablement

GraalVM is not a package ecosystem in the PyPI/npm sense. However, downstream projects that depend on GraalVM native-image are blocked on riscv64 (explicitly called out in issue #13351): JReleaser (jreleaser/jreleaser#2062 merged riscv64 recognition but cannot ship native binaries), Quarkus, and Micronaut cannot produce native riscv64 binaries. Enablement of those downstream tools follows automatically from GraalVM native-image enablement; no separate ecosystem investment is required.

Mandrel (Red Hat's GraalVM distribution) will also require a separate packaging effort once the upstream port is functional.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Patch graalvm/llvm-project: GraalCallingConvention in RISCVISelLowering.cpp + secondary LLVM gaps | 8-12 | LLVM/backend engineer | Critical |
| Functional | Resolve bytedeco LLVM preset version mismatch | 2-4 | GraalVM/build engineer | Critical |
| Functional | Merge PR #13826 (SubstrateRISCV64RegisterConfig) | 1 (review bandwidth) | Oracle Labs (@Zeavee) | Critical |
| Functional | Merge PR #13391 (pthread_key_t fix) | 1 (review bandwidth) | Oracle Labs (@Zeavee) | Critical |
| Functional | Update bundled libffi 3.4.8 to 3.6.0 in Truffle NFI | 1-2 | Truffle/GraalVM engineer | High |
| Functional | Add musl toolchain for riscv64 (issue #8684) | 4-6 | Build/toolchain engineer | Medium |
| CI/CD | Add riscv64 GitHub Actions CI job using RISE runners | 2-3 | DevOps + Oracle Labs coordination | High |
| Performance | Implement RISCV64NodeMatchRules (basic instruction selection) | 8-12 | Compiler engineer | Medium |
| Performance | Add RVV dispatch in Graal vector API for riscv64 | 12-20 | Compiler/SIMD engineer | Low |
| Performance | B-extension (Zba/Zbb) detection and use | 4-6 | Compiler engineer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [oracle/graal -- master tracking issue: native-image riscv64 support](https://github.com/oracle/graal/issues/13351)
- [oracle/graal -- Issue #13516: LLVM backend fails on riscv64 (cc487 not implemented)](https://github.com/oracle/graal/issues/13516)
- [oracle/graal -- Issue #13386: pthread_setspecific crash on shutdown, riscv64 only](https://github.com/oracle/graal/issues/13386)
- [oracle/graal -- Issue #8684: Add MUSL_GCC_TOOLCHAIN for RISC-V](https://github.com/oracle/graal/issues/8684)
- [oracle/graal -- Issue #8685: Deadlock during native image build (riscv64 slow hardware)](https://github.com/oracle/graal/issues/8685)
- [oracle/graal -- PR #13826: fix(riscv64) implement fixed-parameter and return-saving calling convention](https://github.com/oracle/graal/pull/13826)
- [oracle/graal -- PR #13391: fix(posix) map pthread_key_tPointer to pthread_key_t](https://github.com/oracle/graal/pull/13391)
- [oracle/graal -- PR #13397: fix(llvm) pre-warm DeallocatorThread (closed without merge)](https://github.com/oracle/graal/pull/13397)
- [oracle/graal -- PR #7749: Add CPUTypeRISCV64 and cleanup RISC-V reflection code](https://github.com/oracle/graal/pull/7749)
- [oracle/graal -- PR #4716: Align pthread_mutex_t and pthread_cond_t on word boundary](https://github.com/oracle/graal/pull/4716)
- [oracle/graal -- compiler/core/riscv64 source tree](https://github.com/oracle/graal/tree/master/compiler/src/jdk.graal.compiler/src/jdk/graal/compiler/core/riscv64)
- [oracle/graal -- compiler/hotspot/riscv64 source tree](https://github.com/oracle/graal/tree/master/compiler/src/jdk.graal.compiler/src/jdk/graal/compiler/hotspot/riscv64)
- [oracle/graal -- substratevm/core.graal.riscv64 source tree](https://github.com/oracle/graal/tree/master/substratevm/src/com.oracle.svm.core.graal.riscv64)
- [oracle/graal -- substratevm/core/riscv64 source tree](https://github.com/oracle/graal/tree/master/substratevm/src/com.oracle.svm.core/src/com/oracle/svm/core/riscv64)
- [oracle/graal -- riscv64cpufeatures.h](https://github.com/oracle/graal/blob/master/substratevm/src/com.oracle.svm.native.libchelper/include/riscv64cpufeatures.h)
- [graalvm/graalvm-ce-builds -- release jdk-25.0.2 (asset list)](https://github.com/graalvm/graalvm-ce-builds/releases/tag/jdk-25.0.2)
- [graalvm/labs-openjdk -- releases (riscv64 artifacts from jvmci-25.1-b18)](https://github.com/graalvm/labs-openjdk/releases)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project: Java on RISC-V blog post (May 2024)](https://riseproject.dev/2024/05/29/395/)
- [Repology: graalvm packages](https://repology.org/project/graalvm/versions)
- [Debian package tracker: graalvm (not found)](https://tracker.debian.org/pkg/graalvm)
- [libffi status report](../libraries/libffi.md)
- [OpenJDK status report](../runtimes/openjdk.md)
- [zlib status report](../libraries/zlib.md)
- [glibc status report](../libraries/glibc.md)