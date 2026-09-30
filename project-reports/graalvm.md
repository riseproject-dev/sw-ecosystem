---
title: GraalVM
parent: Project Reports
color: orange
dependencies:
  - name: OpenJDK
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: libffi
    relation: runtime-dependency
    criticality: optional
  - name: musl
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: JavaCPP
    relation: build-dependency
    criticality: critical
  - name: riscv-gnu-toolchain
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="graalvm" %}

# GraalVM

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for GraalVM<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

GraalVM is a polyglot virtual machine and compiler infrastructure developed by Oracle Labs. It provides two primary deployment modes: (1) the Graal JIT compiler, which operates as a drop-in replacement for HotSpot's C2 JIT inside OpenJDK via the JVMCI interface, and (2) Native Image (SubstrateVM), an ahead-of-time compiler that produces self-contained native binaries from Java and other JVM-language programs. GraalVM also hosts Truffle, a framework for implementing language runtimes (GraalPy, GraalJS, TruffleRuby, Espresso).

**Governance:** GraalVM is hosted under the `oracle` GitHub organization and is an Oracle-led open-source project, not governed by a neutral foundation (not Apache, Eclipse, or Linux Foundation). `CONTRIBUTING.md` defines a formal role ladder: Committer to Code Owner to Technical Area Lead to Security Lead / Developer Advocacy Lead to Project Lead. The Project Lead role is explicitly "Appointed by Oracle" and in turn appoints the Security Lead, Developer Advocacy Lead, and Technical Area Leads; the current Project Lead is Thomas Wuerthinger (Oracle, VP of GraalVM Development). Every `OWNERS.toml` file across all subprojects (compiler, truffle, substratevm, sdk, tools, espresso, wasm, vm) lists only oracle.com email addresses as code owners, meaning formal code-ownership and merge-veto authority is 100 percent Oracle-internal. External input is channeled through a non-binding Advisory Board (meets semi-annually by video, annually in person) with representatives from BellSoft, Broadcom, Microdoc, Gluon, Shopify, Red Hat, Neo4j, Amazon, Microsoft, and Alibaba, but board members hold no code-owner veto power. External contributions require a signed Oracle Contributor Agreement (OCA).

**License:** Mixed by component. Compiler, SubstrateVM/Native Image, and Tools: GNU GPLv2 with Classpath Exception. Espresso, IGV, and Web Image: GPLv2 plain. SDK, Truffle, GraalWasm, and TRegex: Universal Permissive License (UPL). Sulong: 3-clause BSD.

**Corporate maintainers and RISC-V-specific personnel:** All top overall committers are Oracle Labs employees (Douglas Simon, Christian Humer, Josef Eisl, Gilles Duboscq, Roland Schatz, by commit count). For the riscv64 port specifically, the master tracking issue [#13351](https://github.com/oracle/graal/issues/13351) is assigned to Oracle engineers `wirthi` and `Zeavee`. `Zeavee` authored the July 2026 "Revive RISC-V backend" PR ([#13926](https://github.com/oracle/graal/pull/13926)) from a branch named `scoppey/GR-76920/revive-RISC-V-backend`, which strongly suggests `Zeavee` is the GitHub handle of Sacha Coppey (sacha.coppey@oracle.com), the Oracle engineer who authored the original 2022-2023 riscv64 LLVM-backend port [NEEDS VERIFICATION: handle-to-identity mapping inferred from branch naming, not independently confirmed]. The active 2026 porting work is otherwise driven by an external, OCA-verified contributor, `gounthar`, testing on personally owned Banana Pi F3 (SpacemiT K1, rv64gc) hardware, with `oubidar-Abderrahim` co-assigned on one issue.

**Community stance on new ports:** Oracle Labs engineers drive all architectural decisions and hold exclusive code-owner authority. External contributions are accepted via OCA, and the current riscv64 revival effort was initiated by an external contributor who opened the master tracking issue in April 2026 and has authored most of the 2026 fix commits, with Oracle engineers reviewing and gatekeeping merges. No public roadmap or committed release date for riscv64 exists, and the project publishes no formal platform-tier policy document. Architecture ports are not blocked by explicit policy, but they receive no dedicated advisory-board seat and must clear Oracle-owned code review for anything non-trivial.

**RISE project membership:** GraalVM and Oracle are not listed as RISE members. RISE Premier Members are Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent; General Members are Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, and ZTE. RISC-V International is a RISE partner organization, separate from membership. The `riseproject-dev` GitHub organization's 26 repositories contain no GraalVM-related project, and no RISE blog post (checked via RSS feed and site search) mentions GraalVM.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-04-06 | Commit `c0dc96b`: `ffi_prep_cif_var` added to bundled libffi for RISC-V variadic calls; author notes "linux-riscv soon" | [commit c0dc96b](https://github.com/oracle/graal/commit/c0dc96b1ff6f63869230adc30ec53a07351bbb26) |
| 2022-07-16 | PR [#4716](https://github.com/oracle/graal/pull/4716) merged: aligned `pthread_mutex_t`/`pthread_cond_t` on word boundary, with RISC-V explicitly tested in review | [PR #4716](https://github.com/oracle/graal/pull/4716) |
| 2022-07-28 | First commit touching RISC-V proper, `34a8671` "Add RISC-V LLVM backend for Native Image", authored by Sacha Coppey (Oracle), committed 2023-01-10 | search_commits (oracle/graal) |
| 2023-01-12 | PR [#11611](https://github.com/oracle/graal/pull/11611), commit `293ee3d`, "[GR-36951] Create RISC-V target for Native Image", merged; author Sacha Coppey (Oracle). Confirmed in `substratevm/CHANGELOG.md`: "(GR-36951) Add RISC-V support for Native Image through the LLVM backend", shipped as part of GraalVM for JDK 17/20, internal version 23.0.0 | `substratevm/CHANGELOG.md`; search_commits |
| 2023-01-27 | Commit `95dbcf5`: varargs C helper added for `linux-riscv` and `darwin-aarch64` | [commit 95dbcf5](https://github.com/oracle/graal/commit/95dbcf58dd05e6802c2981aaefed7265d7cbb743) |
| 2023-07-26 | PR [#7068](https://github.com/oracle/graal/pull/7068) merged: fixed riscv64 SVM test gate (Clang targeting riscv64, switched to lld) | [PR #7068](https://github.com/oracle/graal/pull/7068) |
| 2023-11-07 | PR [#7749](https://github.com/oracle/graal/pull/7749) merged: added `CPUTypeRISCV64`, removed reflection-based `jdk.vm.ci.riscv64`/`hotspot.riscv64` workarounds after dropping JDK 17 compatibility requirement | [PR #7749](https://github.com/oracle/graal/pull/7749) |
| 2024-04-02 | Issue [#8684](https://github.com/oracle/graal/issues/8684) opened: MUSL_GCC_TOOLCHAIN missing for RISC-V; no assignee | [Issue #8684](https://github.com/oracle/graal/issues/8684) |
| 2024-08-06 | Issue [#9458](https://github.com/oracle/graal/issues/9458) opened and later closed: build-time "Missing CAP cache value" error compiling a HelloWorld on GraalVM 17.0.11, tied to missing riscv64 CPU-feature struct info; reflects support being incomplete/experimental at the time | [Issue #9458](https://github.com/oracle/graal/issues/9458) |
| 2026-04-17 | Issue [#13351](https://github.com/oracle/graal/issues/13351) opened by an external contributor: master tracking issue requesting an official GraalVM/Native Image distribution for linux-riscv64; assigned to `wirthi` and `Zeavee` (Oracle); notes that RISE riscv64 CI runners are already available and offered for adoption, framing the blocker as the SubstrateVM port itself, not CI infrastructure | [Issue #13351](https://github.com/oracle/graal/issues/13351) |
| 2026-04-22/23 | Issue [#13386](https://github.com/oracle/graal/issues/13386) opened: `pthread_setspecific` shutdown crash, riscv64-only, caused by `pthread_key_t` (4 bytes) being read as `size_t` (8 bytes) | [Issue #13386](https://github.com/oracle/graal/issues/13386) |
| 2026-04-23 | Issue [#13396](https://github.com/oracle/graal/issues/13396) opened: LLVM-backend native-image build hangs indefinitely on slow riscv64 hardware during "[6/8] Compiling methods", caused by a `DeallocatorThread.class` monitor-contention race that is latent on amd64/aarch64 but exposed by riscv64's slower first-time init | [Issue #13396](https://github.com/oracle/graal/issues/13396) |
| 2026-06-18 | PR [#13826](https://github.com/oracle/graal/pull/13826) opened by external contributor `gounthar`: implements fixed-parameter and return-saving calling convention for riscv64 in `SubstrateRISCV64RegisterConfig`, unblocking compilation past the first foreign call; explicitly framed as "part of reviving the riscv64 LLVM backend, discussed in #13351" | [PR #13826](https://github.com/oracle/graal/pull/13826) |
| 2026-06-29 | PR #13826 **merged** (merge commit `f77589d`, 2 parents confirmed). Review thread shows `Zeavee` (Oracle) requesting a dedicated `linuxNativeStackParameterAssignment` helper mirroring AArch64, which the author implemented before merge; tested on a Banana Pi F3 (SpacemiT K1, rv64gc) | [PR #13826](https://github.com/oracle/graal/pull/13826) |
| 2026-07-06 | PR [#13926](https://github.com/oracle/graal/pull/13926), "[GR-76920] Revive RISC-V backend", **merged** (merge commit `79539b8`, 2 parents confirmed). Fixes stack-map offset decoding, uses linked `HostedMethod` symbols for code ranges, strips incompatible `.riscv.attributes`, aligns JVMCI VM-config checks (`AvoidUnalignedAccesses`, `UseBlockZeroing`) with the current riscv64 JDK; also adds the (currently unwired) `riscv64_emulator` CI task | [PR #13926](https://github.com/oracle/graal/pull/13926) |
| 2026-07-08 | PR [#13391](https://github.com/oracle/graal/pull/13391), "fix(posix): map `pthread_key_tPointer` to `pthread_key_t` instead of `size_t`", **merged** (merge commit `2bcc043`, 2 parents confirmed), closing issue #13386. Verified on a Banana Pi F3 | [PR #13391](https://github.com/oracle/graal/pull/13391) |
| 2026-04-23 (opened), date unresolved (closed) | PR [#13397](https://github.com/oracle/graal/pull/13397), the proposed fix for issue #13396 (pre-warm the `DeallocatorThread.class` monitor before ForkJoin workers start), was **closed without merging**. A bot comment flagged that the author had not signed the Oracle Contributor Agreement at submission time; the author's own closing note is ambiguous on further rationale [NEEDS VERIFICATION: exact closing rationale, pending direct API access to the issue thread] | [PR #13397](https://github.com/oracle/graal/pull/13397) |

**Discrepancy note:** One source in this research pass initially characterized issue #13396 as "fixed via PR #13397." Direct verification of PR #13397's page shows it was **closed without merging**, blocked on a missing OCA signature. If issue #13396 is closed on GitHub, it was not closed by that PR landing; the underlying fix exists only in the external contributor's personal riscv64 fork as of this research pass. This should be treated as unresolved upstream unless independently reconfirmed.

**Is the port fully upstream?** Partially. Foundational plumbing (CPU feature detection, ELF relocation, register config skeleton, platform declarations, POSIX glue) is upstream on master. The two calling-convention and shutdown-crash fixes that were open as of the prior research cycle (PRs #13826 and #13391) have since merged, along with the broader "Revive RISC-V backend" PR (#13926). The master tracking issue #13351 remains open, and no riscv64 GraalVM distribution or CI has shipped. Whether the LLVM-side `cc487` (GraalCallingConvention) blocker tracked in issue [#13516](https://github.com/oracle/graal/issues/13516) has been resolved by the 2026-07-06/06-29 merges is unconfirmed in this research pass and should be re-verified directly against the issue.

---

## 3. Upstream Support Tier

GraalVM publishes no formal tier or platform classification policy; no `PLATFORMS.md` or `SUPPORT.md` exists in `oracle/graal`.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Official binary release | Yes | Yes | No |
| Public GitHub Actions CI | Yes (ubuntu-22.04, ubuntu-24.04) | No | No |
| Internal Oracle jsonnet gate CI (active) | Yes | Not confirmed in public repo | No (task defined, unwired) |
| Release-blocking tests | Yes | Not confirmed in public repo | No |
| Native Image functional | Yes | Yes | No (LLVM-backend path blocked/unverified; native backend explicitly disabled) |
| Musl variant | Yes | Yes | No |
| GraalVM JDK in OS packages | Partial (Homebrew, sdkman) | Partial | None found |
| LabsJDK (JVMCI) artifact available | Yes | Yes | Since jvmci-25.1-b18 (2026-05-13) |

amd64 is the only tier-1 platform by every criterion checked. arm64 has official binaries and a working Native Image despite no visible public-repo CI, implying an internal Oracle CI not exposed in `.github/workflows/`. riscv64 has no official binary, no active CI of any kind, and no functional Native Image confirmed end to end. The official GraalVM download page (`graalvm/graalvm-ce-builds`) lists four supported platforms as of the latest checked releases (through `graal-25.4.4.1.1`, published 2026-09-22): linux-x64, linux-aarch64, macos-aarch64, and windows-x64. No asset filename containing "riscv" appears in any release checked.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

GraalVM has two distinct compiler paths relevant to riscv64, and both are incomplete in different ways.

**Path A: Graal JIT inside HotSpot (JVMCI).** The riscv64 HotSpot backend exists as source but is a non-functional stub. `RISCV64HotSpotBackendFactory.java` registers the backend under the `"community"` tier name (not an officially supported tier), but `newRegisterAllocationConfig()` and `newReferenceMapBuilder()` both unconditionally `throw GraalError.unimplementedOverride()`. `RISCV64HotSpotLoweringProvider.java`'s `lower(Node, LoweringTool)` method, the core node-lowering entry point, also unconditionally throws `GraalError.unimplementedOverride()`. `RISCV64NodeMatchRules.java` is an empty 3-line subclass with zero `@MatchRule` patterns registered, versus 1,054 lines and hundreds of fused-instruction patterns in the AArch64 equivalent. Critically, there is no `RISCV64MacroAssembler`, `RISCV64Assembler`, or `RISCV64LIRGenerator` anywhere in the repository (confirmed via targeted code search returning zero results for each), and no `.S` assembly files exist for RISC-V at all. Without an assembler or LIR generator, this backend cannot emit machine code under any configuration; it is scaffolding for a future implementation.

**Path B: Native Image (SubstrateVM), LLVM-delegated.** The native (non-LLVM) Graal code generator is explicitly disabled for riscv64. `SubstrateRISCV64Feature.java` throws at startup unless `SubstrateOptions.useLLVMBackend()` is set: `"The RISC-V native backend is currently unimplemented. Use the LLVM backend."` By contrast, the equivalent AArch64 feature class registers a full native backend (`SubstrateAArch64BackendFactory`, lowering provider, graph-builder plugins, callee-saved registers, and a `VectorAArch64` SIMD path) when LLVM is not used. For riscv64, LLVM is not an optional acceleration path, it is the only path. All Native Image compilation for riscv64 must pass `--tool:llvm-backend`, routing through a patched LLVM 20.1.4 fork hosted by Oracle (`graalvm/llvm-project`).

### Component-by-component status

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Reserved registers | Full | Full | Full | `x2`=sp, `x23`=thread, `x27`=heap-base candidate |
| CPU feature detection (AT_HWCAP) | Full | Full | Full | `cpuid.c` reads `AT_HWCAP` for ISA bits I, M, A, F, D, C, V only; no `AT_HWCAP2`/B-extension parsing |
| ELF relocation table | Full | Full | Full | `ELFMachine.java` implements `R_RISCV_64`; sets `e_flags` for `RVC_DOUBLE_FLOAT_ABI` |
| Platform declarations | Full | Full | Full | `Platform.LINUX_RISCV64` listed as a "leaf platform" since GraalVM for JDK 17.0.7 / "22.2" |
| Register config / calling convention | Full | Full | Partial, functional after 2026-06/07 merges | `SubstrateRISCV64RegisterConfig.java` (377-434 lines depending on revision) now implements the custom-ABI fixed-parameter/return-saving convention per PR #13826; still contains `shouldNotReachHereUnexpectedInput`/"Placeholder assignment" branches and two `intentionallyUnimplemented()` throws |
| HotSpot backend factory (JIT) | Full | Full | Stub | `newRegisterAllocationConfig()`, `newReferenceMapBuilder()` throw `unimplementedOverride()` |
| HotSpot lowering provider (JIT) | Full | Full | Stub | `lower()` throws `unimplementedOverride()` |
| Node match rules (instruction selection) | ~100+ rules | 1,054 lines, extensive | Empty stub | 3-line constructor-only class, 0 rules |
| LIR instruction layer | ~80+ files | ~90+ files | Missing (0 files) | No `lir/riscv64/` directory |
| Assembler / macro assembler | Full | Full | Missing | No `asm/riscv64/` directory anywhere in the repo |
| SubstrateVM native (non-LLVM) backend | Full | Full | Missing, explicitly disabled | `SubstrateRISCV64Feature.java` throws unless LLVM backend is selected |
| Native Image via LLVM backend | N/A (not needed) | N/A (not needed) | Real, actively developed in 2026 (PRs #13826, #13926); compilation verified through all stages on real hardware (Banana Pi F3) per PR #13826's testing notes; whether the `cc487` calling-convention blocker in the LLVM fork itself (issue #13516) is resolved is unconfirmed | LLVM path is the only route to a riscv64 binary |
| RVV (Vector extension) intrinsics | N/A | SVE2 partial | Missing | V bit is detected in `cpuid.c` / `CPUTypeRISCV64.java` but nothing dispatches to vector instructions anywhere in the compiler or runtime |
| Zba/Zbb/Zbc/Zbs (bit-manipulation) | N/A | N/A | Missing | Not present in `riscv64cpufeatures.h` or `cpuid.c` |
| Crypto intrinsics (AES/SHA/CRC32 etc.) | Full | Full | Missing | No riscv64 crypto backend of any kind |
| SIMD vectorized array/string ops | Full (AVX-512) | Full (SVE/NEON), 80+ specialized LIR ops | Missing | Zero riscv64 equivalents of `AArch64AESDecryptOp`, `AArch64BigIntegerMulAddOp`, `AArch64ArrayCompareToOp`, GC-barrier LIR generators, etc. |

**ISA extension coverage:** Only the base/standard extensions I, M, A, F, D, C, and V (the `rv64gc`/`rv64gcv` profile) are referenced anywhere in the codebase, confirmed at both `CPUTypeRISCV64.java` (which defines `-march` types `rv64imafdc`, `rv64gc`, `rv64imafdcv`, `rv64gcv`) and the runtime HWCAP probe in `cpuid.c`. No B-extension (Zba/Zbb/Zbc/Zbs), Zicsr, or Zifencei sub-extensions appear anywhere. No `#ifdef __riscv` C-level guards exist; all riscv64-specific code is Java-side.

---

## 5. Build System, Cross-Compilation, and Toolchain

### Build system

GraalVM uses `mx`, a Python-based build tool maintained in a separate repository (`graalvm/mx`). There is no CMakeLists.txt, no autoconf/configure script for GraalVM itself, and no Dockerfile of any kind for riscv64 anywhere in the repository (confirmed absent at every expected location: `Dockerfile.riscv64`, `docker/Dockerfile.riscv64`, `.ci/docker/riscv64/Dockerfile`, `substratevm/ci/docker/riscv64/Dockerfile`, `.devcontainer/Dockerfile`). riscv64 toolchains and emulators are provisioned as versioned packages/downloads resolved by the internal CI tooling, not via in-repo container definitions.

Actual build sequence, from `vm/README.md` (live on master):

```bash
mkdir workspace; cd workspace
git clone https://github.com/oracle/graal.git
git clone https://github.com/graalvm/mx
cd mx && git checkout 7.86.0 && cd ..
export PATH=/path/to/mx:$PATH

git clone https://github.com/graalvm/labs-openjdk.git
cd labs-openjdk
git checkout <tag from common.json "labsjdk-ce-latest">
bash configure
make graal-builder-image
export JAVA_HOME="/path/to/labs-openjdk/build/<platform>/images/graal-builder-jdk"

cd ../graal/vm
mx --env ce build
mx --env ce graalvm-home
```

Note: `vm/README.md`'s own text is stale, still citing `mx` version 7.78.0, while `common.json` pins `mx_version: "7.86.0"` — a documentation/CI drift confirmed by direct comparison of both files on current master.

### Required toolchain

| Component | CI-pinned version | Notes |
|-----------|--------------------|-------|
| Python | `python3.8` (`MX_PYTHON`) | Pinned in `ci/common.jsonnet` |
| GCC | 12.2.1 (devtoolset 12) | Floor of GCC 10.0 stated in the prior version of this report; GCC 14.2 also confirmed working and is used in the labs-openjdk riscv64 devkit build |
| make | 4.3 | `ci/common.jsonnet` devtoolset entry |
| GNU binutils | 2.36 (devtoolset 12 baseline), 2.43 in the riscv64 devkit | Gold linker is explicitly excluded for riscv64 in the labs-openjdk devkit Makefile (`ld.bfd` only); `--disable-multilib` applied |
| `mx` | 7.86.0 | `common.json` |
| LabsJDK (JVMCI) | jvmci-25.1-b18 onward for riscv64 | First riscv64 artifact published 2026-05-13; before that, `mx fetch-jdk` would 404 on riscv64 |

### riscv64-specific CI toolchain requirements (defined but unwired, see Section 7)

From `substratevm/ci/ci_common/svm-gate.libsonnet` (live on master, confirmed by direct file read of a fresh clone at commit `82f8b44f3ff247743836848523c356f6dd3cc363`, cloned 2026-09-30):

```jsonnet
riscv64_emulator:: task_spec({
  packages+: {
    "git": "==2.9.3", "python": "==3.4.1", "make": "==3.83",
    "zlib": "==1.2.11", "qemu": "==4.0.0", "glib": "==2.56.1",
    "pcre": "==8.43", "sshpass": "==1.05"
  },
} + evaluate_late("riscv64-emulator", function(b) {
  downloads+: {
    QEMU_HOME       : {name : "qemu-riscv64", version : "1.0"},
    JAVA_HOME_RISCV : {name : "labsjdk", version : b.downloads.JAVA_HOME.version + "-linux-riscv64" }
  },
})),

riscv64_cross_compile:: $.riscv64_emulator + task_spec({
  mxgate_target_arch:: "riscv64",
  environment+: {CAPCACHE: "$HOME/capcache"},
  packages+: {
    "riscv-gnu-toolchain": "==8.3.0",
  },
} + evaluate_late("riscv64-svmtest", function(b) {
  downloads+: {
    C_LIBRARY_PATH : {name : "riscv-static-libraries", version : std.toString(b.jdk_version)},
  },
})),
```

This defines a cross-compile-plus-QEMU-emulation task: `riscv-gnu-toolchain` pinned to an exact version (8.3.0, an older GCC 8.3-based riscv64-linux-gnu cross toolchain, not a minimum), plus a separate `qemu-riscv64` download (version 1.0) and a riscv64-specific LabsJDK artifact. As detailed in Section 7, this task specification is not currently invoked by any active gate, tier, daily, weekly, or ondemand job.

### `-march` options and build-config toggles

Supported via `NativeImageOptions.MicroArchitecture`: `rv64gc` (default), `rv64imafdc`, `rv64imafdcv`, `rv64gcv`, `compatibility`, `native` (`substratevm/.../hosted/util/CPUTypeRISCV64.java`). Since GraalVM uses `mx`/jsonnet rather than CMake, there is no `-DUSE_X=OFF` equivalent; the comparable toggles are native-image builder arguments composed by the riscv64 gate: `--libc=musl --static` (static musl), `--libc=musl -H:+UnlockExperimentalVMOptions -H:-StaticExecutable -H:-UnlockExperimentalVMOptions` (dynamic musl), `-Ob` (quickbuild), `-O3`, and `-H:+UnlockExperimentalVMOptions --tool:llvm-backend -H:-UnlockExperimentalVMOptions` (select the LLVM backend riscv64 depends on). None of these flags are riscv64-exclusive.

### Cross-compilation and QEMU

Native Image does not support cross-compilation of the final binary; builds must run natively on the target riscv64 host, though the CI task spec above shows a cross-compile-plus-QEMU-test pattern is designed in principle. QEMU-based builds are feasible but add substantial overhead: an estimated 10x per Java-tool invocation under user-mode emulation, which the prior version of this report estimated could push a full LabsJDK build to 10+ hours versus roughly 3.5 hours on native Banana Pi F3 hardware [NEEDS VERIFICATION: exact figure, sourced from labs-openjdk PR discussion, not independently re-confirmed this pass].

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps (cannot do X at all on riscv64)

| Feature | amd64 | arm64 | riscv64 | Impact |
|---------|-------|-------|---------|--------|
| Native Image, native (non-LLVM) backend | Yes | Yes | No, explicitly disabled | Cannot produce native binaries via Graal's own code generator |
| Native Image, LLVM backend | N/A | N/A | Actively developed, status of the `cc487` calling-convention blocker (issue #13516) unconfirmed this pass | May or may not currently be able to produce a working binary; requires direct re-verification |
| Graal JIT in HotSpot | Yes | Yes | Stub; LIR/assembler layer entirely absent | GraalVM cannot JIT-compile on riscv64 under any configuration |
| Musl native-image variant | Yes | Yes | No | No static-linked musl binaries; issue #8684 open since April 2024 |
| Official GraalVM distribution | Yes | Yes | No | No binary to ship to users |

### Performance gaps (missing optimizations vs arm64 and amd64)

| Optimization | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD / vector intrinsics | AVX-512 | SVE2 partial | None |
| Crypto acceleration | AES-NI, SHA | ARMv8-A Crypto | None |
| Instruction selection (NodeMatchRules) | Extensive | 1,054 lines | 0 rules (empty stub) |
| LIR optimization passes | Full | Full | None, LIR layer absent |
| B-extension (bit-manipulation) | N/A | N/A | Not tracked or detected |

### Security hardening gaps

Data not available: no source in this research pass describes shadow-stack, control-flow integrity, pointer authentication, or comparable hardening specific to the riscv64 GraalVM port. The musl variant, sometimes used to reduce attack surface, is unavailable for riscv64.

### Floating-point and correctness semantics

The bundled libffi (3.4.8, used by Truffle's NFI backend) has a known float-argument-marshaling bug on riscv64 that is fixed upstream in libffi PR #972 and shipped only from libffi 3.6.0 (released 2026-06-20) onward; it is not present in the bundled 3.4.8. Any Truffle-hosted language (GraalPy, GraalJS, TruffleRuby) making an FFI call with float arguments on riscv64 would silently produce incorrect results. No GraalVM-specific NaN-boxing issue has been filed; the general RISC-V NaN-boxing gotcha (upper FLEN-n bits must all be 1 or the value is treated as canonical NaN) has affected other projects (SpiderMonkey, LLVM, Valgrind, Unicorn) but has not surfaced as a filed GraalVM issue [NEEDS VERIFICATION: absence of a filed issue does not confirm absence of the underlying defect, since no riscv64 JIT exists to exercise it].

---

## 7. CI/CD Infrastructure

**No riscv64 CI currently runs anywhere in oracle/graal**, confirmed by a direct, fresh-clone verification pass (commit `82f8b44f3ff247743836848523c356f6dd3cc363`, cloned 2026-09-30) that supersedes and corrects any looser reading of the commit history:

- **GitHub Actions (`.github/workflows/`):** all 21 workflow files (`build-graalvm.yml`, `cdt-inspect.yml`, `codespell.yml`, `macaron-check-github-actions.yml`, `main.yml`, `micronaut-future-defaults.yml`, `micronaut-template.yml`, `micronaut.yml`, `ni-layers.yml`, `quarkus-future-defaults.yml`, `quarkus-template.yml`, `quarkus.yml`, `reachability-metadata-dedicated-layer.yml`, `reachability-metadata-future-defaults.yml`, `reachability-metadata-layered-future-defaults.yml`, `reachability-metadata-layered.yml`, `reachability-metadata-template.yml`, `reachability-metadata.yml`, `spring-future-defaults.yml`, `spring-template.yml`, `spring.yml`) were grepped case-insensitively for "riscv": zero matches. The main "GraalVM Gate" workflow (`main.yml`) runs its build matrix exclusively on `ubuntu-22.04`/`ubuntu-24.04` and `windows-2022`; no aarch64 or riscv64 runner, and no QEMU step, appears anywhere.
- **`.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`:** confirmed absent at repository root.
- **Internal Oracle jsonnet gate system:** the only riscv64 CI task definitions repo-wide are `riscv64_emulator` and `riscv64_cross_compile` in `substratevm/ci/ci_common/svm-gate.libsonnet` (added by the Zeavee/gounthar commits around 2026-06-30 to 2026-07-06, see Section 5). A repo-wide search for `riscv64_cross_compile` and `riscv64_emulator` returns exactly one hit each, their own definitions. `substratevm/ci/ci.jsonnet`, the file that assembles the real build matrix (`task_dict` to `processed_builds` to `builds`), was read line by line: every actual job platform key is `linux:amd64`, `linux:aarch64` (declared but not targeted by any `platform_spec` override), `darwin:aarch64`, or `windows:amd64`. Neither riscv64 task spec is invoked by `mxgate(...)`, `task_dict`, `feature_map`, or any `platform_spec` entry anywhere in `substratevm/`, `ci/`, `vm/`, `compiler/`, `sdk/`, `wasm/`, `espresso/`, `sulong/`, `tools/`, `regex/`, or `truffle/`. **This is dead, orphaned scaffolding for a future gate job, not an active CI pipeline.**

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Public GitHub Actions runners | ubuntu-22.04, ubuntu-24.04 | None visible in public repo | None |
| RISE project runners | No | No | Available and offered for adoption per issue #13351, not yet wired in |
| Internal jsonnet test gate | Yes | Inferred, not confirmed in public files | Task defined, not wired to any active gate/tier/daily job |
| Release-blocking | Yes | Unknown | No |

Hardware used for all riscv64 development and manual testing observed in this research (issues #13386, #13396, PRs #13391, #13826, #13926): a Banana Pi F3 (SpacemiT K1, rv64gc, 16 GB RAM, Debian), owned by the external contributor `gounthar`, not Oracle infrastructure. Issue [#13351](https://github.com/oracle/graal/issues/13351) states that native riscv64 CI runners are available today via the RISE project and offers them for adoption into upstream CI; as of this research pass no workflow file or jsonnet gate definition has actually been wired to consume them.

---

## 8. Distribution and Release Status

**No riscv64 GraalVM binary exists in any channel checked.**

| Channel | riscv64 available? | Evidence |
|---|---|---|
| `graalvm/graalvm-ce-builds` releases (current distribution repo; `oracle/graal`'s own Releases page banner redirects here) | No | Checked through the latest release, `graal-25.4.4.1.1` (published 2026-09-22). Asset patterns present in every release checked: `linux-x64`, `linux-aarch64`, `macos-aarch64`, `windows-x64`, plus checksums/source archives. No filename containing "riscv" anywhere. |
| `oracle/graal` GitHub releases (legacy) | Moot | Stale since `vm-19.3.1`; the page itself states CE 19.3.0 and later moved to `graalvm/graalvm-ce-builds`. |
| PyPI (`pypi.org/pypi/graalvm/json`) | N/A | No package named `graalvm` exists on PyPI at all (HTTP 404, confirmed on repeated checks). |
| RISE GitLab wheel builder (`gitlab.com/.../packages/pypi/simple/graalvm/`) | No | Redirects (302) to the same nonexistent PyPI entry. |
| Ubuntu 26.04 "resolute" | No | `packages.ubuntu.com` search for "GraalVM" across all sections/architectures returns "Sorry, your search gave no results." |
| Debian | No | `tracker.debian.org` returns 404 for a `graalvm` package [not re-verified in the current pass; unchanged from the prior report]. |
| Arch Linux RISC-V port (archriscv.felixc.at) | No | Not listed in the Arch RISC-V package database at all. |
| Repology | No | 38 tracked `graalvm` package entries (Chocolatey, Homebrew, Solus, etc.); none are riscv64 builds [not re-verified in the current pass]. |
| Mandrel (Red Hat) | No | No riscv64 distribution as of the version checked in the prior report; not re-verified this pass. |

**What a user must do today to get a working riscv64 GraalVM Native Image:** Build from source using the LLVM backend (`--tool:llvm-backend`), on native riscv64 hardware (no supported cross-compilation of the final artifact), using the exact `mx`/LabsJDK toolchain described in Section 5. Whether this currently produces a working binary end to end depends on the unresolved status of the LLVM-side `cc487` GraalCallingConvention gap (issue #13516); this should be re-verified directly before being represented as either working or blocked. The Graal JIT (as opposed to Native Image) is non-functional on riscv64 under any configuration because the LIR and assembler layers are entirely absent; a user running `java -XX:+UseJVMCICompiler` on riscv64 LabsJDK falls back to HotSpot C2.

---

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|---|
| OpenJDK (LabsJDK / JVMCI) | Runtime dependency: JVM host, JVMCI interface, static `.a` libs for SubstrateVM | Critical | Available since LabsJDK jvmci-25.1-b18 (2026-05-13) | Data not available: no official riscv64 CI for LabsJDK was found in this research pass | riscv64 artifact published from b18 onward | `labs-openjdk#33` resolved in b18; `labs-openjdk#34` (static libs) reported open |
| LLVM (Oracle fork `graalvm/llvm-project`, 20.1.4) | Build dependency: the only code-generation backend for Native Image on riscv64 (native Graal backend is explicitly disabled) | Critical | riscv64 binary distributed by Oracle (lafo.ssw.uni-linz.ac.at); `mx` fetches it automatically | Status of the `cc487` (GraalCallingConvention) gap in `RISCVISelLowering.cpp` (issue #13516) is unconfirmed in this pass; it may have been superseded by the 2026-07-06/06-29 merges and should be re-verified directly | No independently confirmed riscv64 native-image binary produced end to end | [oracle/graal#13516](https://github.com/oracle/graal/issues/13516): GraalCallingConvention missing from `RISCVISelLowering.cpp`, requires a C++ patch in the private LLVM fork; status not reconfirmed since 2026-07-20 |
| GCC | Build dependency: compiles GraalVM's native components and the LabsJDK devkit | Critical | GCC 12.2.1 used in general CI (devtoolset 12); GCC 14.2.0 used specifically in the labs-openjdk riscv64 devkit; floor of GCC 10.0 stated as the practical minimum | Data not available | N/A (toolchain component, not shipped) | None riscv64-specific found |
| GNU binutils | Build dependency: linker/assembler toolchain | Critical | binutils 2.36 in general CI (devtoolset 12), 2.43 in the riscv64 devkit; Gold linker explicitly excluded for riscv64 (`ld.bfd` only) | Data not available | N/A | None riscv64-specific found beyond the Gold-linker exclusion, which is a deliberate config choice, not an open defect |
| glibc | Runtime dependency: default libc for Linux native-image | Critical | Full riscv64 support since glibc 2.27 (2018) | Full | Full | No blocking issues on glibc itself; however, glibc's riscv64 `pthread_setspecific` validation is stricter about invalid key values than on amd64, which is what exposed the GraalVM-side bug in issue #13386 (fixed by PR #13391) |
| libffi | Runtime dependency: Truffle NFI backend enabling GraalPy/GraalJS/TruffleRuby native calls | Optional | Builds on riscv64 (bundled version 3.4.8) | Three open riscv64 correctness bugs in the bundled version | Upstream libffi 3.6.0 (released 2026-06-20) contains the fix; GraalVM still bundles the outdated 3.4.8 | Float-argument marshaling bug fixed in upstream libffi PR #972, not present in bundled 3.4.8; libffi#466 (small-integer return widening); libffi#694 (struct-by-value); libffi#777 (musl cross-compile) |
| musl | Runtime dependency: static-linked native-image variant | Optional | No riscv64 toolchain available | No | No | [oracle/graal#8684](https://github.com/oracle/graal/issues/8684) open since April 2024, no assignee, stalled; compounded by libffi#777 (musl riscv64 cross-compile broken) |
| zlib | Runtime dependency: compression, bundled in the musl toolchain path | Optional | Clean on riscv64 (bundled version 1.2.13) | CI includes riscv64 per upstream PR #1139 | No blockers | None riscv64-specific |
| JavaCPP | Build dependency: delivers the shadowed LLVM-bitcode JAR (`org.bytedeco:llvm`) GraalVM's LLVM backend depends on, e.g. `llvm-shadowed-13.0.1-1.5.7-linux-riscv64.jar` | Critical | Listed in `suite.py`; Maven Central artifact availability not independently re-verified this pass | Unknown | Unknown | PR #13826 flags an LLVM-13-preset-vs-LLVM-20.1.4-objects version mismatch as a secondary blocker after the calling-convention fix; resolution status not confirmed |
| riscv-gnu-toolchain | Build dependency: cross-compilation toolchain used by the (currently unwired) CI gate | Optional | Pinned to exact version 8.3.0 in `svm-gate.libsonnet`; the CI task that consumes it is defined but not invoked by any active gate (see Section 7) | N/A, not run | N/A | Unwired CI, not a technical defect in the toolchain itself |
| QEMU | Test dependency: emulation for the (currently unwired) `riscv64_emulator` CI task | Optional | `qemu==4.0.0` package plus a `qemu-riscv64` (version 1.0) download, defined in `svm-gate.libsonnet` | Task not invoked by any active gate/tier/daily job (see Section 7) | N/A | Unwired CI, not a technical defect in QEMU itself |
| XZ / liblzma (`org.tukaani:xz` 1.10) | Indirect runtime dependency: ICU4J compression used inside Truffle | Not in direct-dependency scope; found via research | Pure Java, architecture-agnostic | Pure Java | On Maven Central | None |
| JLine (shaded, 3.28.0) | Indirect runtime dependency: terminal support for the native-image CLI | Not in direct-dependency scope; found via research | Native JLine is disabled in the GraalVM SDK on every architecture; Java fallback only | No native code path is active on any architecture, including riscv64 | Patched, no issue specific to riscv64 | None after the native-loader patch |

### Deep-dive: LLVM (critical path)

The LLVM backend is the only viable code-generation path for GraalVM Native Image on riscv64. Issue [#13516](https://github.com/oracle/graal/issues/13516) describes the blocking gap as a missing `case CallingConv::GraalCallingConvention:` handler in `RISCVISelLowering.cpp`, plus three secondary gaps: missing `emitMathUnsignedMin/Max` in `ArithmeticLLVMGenerator`, incorrect float-only intrinsics used for integer min/max, and an unrecognized `"compressed-pointer"` GC strategy in LLVM 20's rewrite-statepoints pass. All four require C++ changes in the LLVM fork itself and cannot be worked around from the Java/GraalVM layer. As flagged above, whether these were addressed by the 2026-07-06 ("Revive RISC-V backend", PR #13926) or 2026-06-29 (calling-convention, PR #13826) merges is not confirmed in this research pass; PR #13826's own testing notes describe substratevm compiling successfully through all method-compilation stages on real riscv64 hardware, which is consistent with but does not by itself confirm that #13516 is resolved, since #13516 targets the LLVM fork's `llc` rather than GraalVM's Java-side calling-convention code. This should be re-verified directly against issue #13516 before being treated as closed or open.

### Deep-dive: libffi (correctness risk for Truffle languages)

GraalVM bundles libffi 3.4.8 for Truffle's NFI backend. The float-argument-marshaling fix for riscv64 (upstream libffi PR #972) was not merged until after 3.4.8 was tagged and ships only in 3.6.0 (2026-06-20). Any GraalPy, GraalJS, or TruffleRuby application making a native function call with a float argument on riscv64 will silently produce incorrect results with the bundled version; this is a data-correctness defect with no build-time or runtime error signal.

---

## 10. Ecosystem Status

Not applicable. GraalVM itself is a runtime and compiler toolchain, not a package-distribution ecosystem such as PyPI, npm, or Maven Central. Its own bundled Java-level dependencies (JavaCPP, XZ, JLine) are covered individually in Section 9. Downstream projects that consume GraalVM Native Image (JReleaser, Quarkus, Micronaut) are discussed as consumers blocked on GraalVM's own riscv64 enablement in Sections 12 and 14, not as a dependent package ecosystem requiring separate per-package riscv64 enablement work.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#13516](https://github.com/oracle/graal/issues/13516) | LLVM backend: `cc487` (GraalCallingConvention) not implemented in riscv64 `llc` | Status unconfirmed this pass; last confirmed open 2026-07-20 | Critical if still open | Complete blocker for Native Image via the LLVM path if unresolved; requires a C++ patch in `graalvm/llvm-project`; should be re-verified directly, since the 2026-07-06/06-29 merges may have superseded it |
| [#13351](https://github.com/oracle/graal/issues/13351) | native-image: add riscv64 (linux-riscv_64) platform support | Open | Critical | Master tracking issue; no riscv64 GraalVM distribution or wired CI exists; assigned to `wirthi`, `Zeavee` (Oracle); notes RISE riscv64 CI runners are available and offered for adoption |
| [#13926](https://github.com/oracle/graal/pull/13926) | [GR-76920] Revive RISC-V backend | Merged, 2026-07-06 | High | Fixes stack-map offset decoding, code-range computation, ELF attribute stripping, and VM-config alignment for the LLVM-backend riscv64 path |
| [#13826](https://github.com/oracle/graal/pull/13826) | fix(riscv64): implement fixed-parameter and return-saving calling convention | Merged, 2026-06-29 | High | Java-side calling-convention fix in `SubstrateRISCV64RegisterConfig`; unblocked compilation past the first foreign call; first substantial external (non-Oracle) contribution to the riscv64 port |
| [#13386](https://github.com/oracle/graal/issues/13386) | `pthread_setspecific` wrong-arguments crash on shutdown, riscv64-only | Closed, fixed by #13391 | High | Root cause: `pthread_key_t` (4 bytes) allocated/read as `size_t` (8 bytes); glibc on riscv64 rejects the resulting garbage upper bits at validation, where amd64 silently tolerates them |
| [#13391](https://github.com/oracle/graal/pull/13391) | fix(posix): map `pthread_key_tPointer` to `pthread_key_t` instead of `size_t` | Merged, 2026-07-08 | High | Closes #13386; verified on a Banana Pi F3 |
| [#13396](https://github.com/oracle/graal/issues/13396) | [LLVM] native-image [6/8] Compiling methods hangs indefinitely on slow (riscv64) hardware | Closed per search metadata, but its stated fix (#13397) was never merged; treat resolution as unconfirmed | High | `DeallocatorThread.class` monitor-contention race, latent on amd64/aarch64 but exposed on riscv64's slower first-time init; see discrepancy note in Section 2 |
| [#13397](https://github.com/oracle/graal/pull/13397) | fix(llvm): pre-warm `DeallocatorThread.class` monitor before compilation workers start | Closed, not merged | N/A (unresolved fix) | Blocked on a missing Oracle Contributor Agreement signature at submission; fix exists only in the external contributor's personal fork |
| [#8684](https://github.com/oracle/graal/issues/8684) | Add `MUSL_GCC_TOOLCHAIN` for RISC-V | Open per the prior research cycle (2026-07-20); not reconfirmed this pass | Medium | No musl toolchain for riscv64; `--libc=musl` native images impossible on riscv64; no assignee |
| [#8685](https://github.com/oracle/graal/issues/8685) | Deadlock during native image build (riscv64, slow hardware) | Open per the prior research cycle; not reconfirmed this pass | Medium | Same symptom category (build-time hang on slow riscv64 hardware) as #13396, filed roughly two years earlier; possible recurrence or duplicate, not confirmed as the same root cause |
| [#9458](https://github.com/oracle/graal/issues/9458) | Missing CAP cache value for `RISCV64LibCHelperDirectives:StructInfo:CPUFeatures` | Closed | Low (historical) | Build-time error on GraalVM 17.0.11; reflects riscv64 support being incomplete/experimental at the time (2024-08) |
| [#5285](https://github.com/oracle/graal/issues/5285) | "Is graal going to support riscv64 platform????" | Closed | N/A (feature request) | Filed and closed 2022-10-25, no substantive discussion |
| libffi#466 (bundled) | Small-integer return-value widening | Open in bundled 3.4.8 | High (correctness) | Silent data corruption for Truffle FFI calls returning small integer types on riscv64 |
| libffi float-marshaling bug (bundled) | Float argument marshaling | Fixed in libffi 3.6.0, not in bundled 3.4.8 | High (correctness) | Any Truffle-language float FFI call gives wrong results on riscv64 |

**Correctness bugs summary:** At least two silent correctness bugs are confirmed to still affect riscv64 GraalVM as bundled: libffi float-argument marshaling and libffi small-integer return-value widening (libffi#466), neither fixed in the bundled 3.4.8. The `pthread_key_t` shutdown-crash bug (#13386) is resolved upstream via merged PR #13391. None of these produce a build-time error; they manifest as either a runtime crash (pthread case, now fixed) or silent wrong output (libffi cases, still open).

---

## 12. Objections and Upstream Blockers

### Technical blockers (in dependency order)

1. **LLVM fork status (issue #13516) requires direct re-verification.** If still unresolved, this is the hardest remaining gate: a C++ patch to `RISCVISelLowering.cpp` in Oracle's private `graalvm/llvm-project` fork, requiring LLVM TableGen and instruction-selection expertise rather than Java/GraalVM knowledge, and not something that can be worked around from GraalVM's own codebase.
2. **JavaCPP LLVM-preset version mismatch.** PR #13826 flags an LLVM 13 preset being used against LLVM 20.1.4 objects as a secondary blocker even after the calling-convention fix compiles successfully; resolution status is unconfirmed [NEEDS VERIFICATION].
3. **libffi must be updated from 3.4.8 to 3.6.0** in GraalVM's bundled Truffle NFI copy to fix the float-marshaling correctness bug; this is a dependency bump, not new port work, but it has not been made per the available research.
4. **musl toolchain for riscv64 remains absent** (issue #8684), blocking the static-linked native-image variant, compounded by a separate musl-cross-compile bug in libffi (libffi#777).
5. **The HotSpot JIT path (Path A) requires a ground-up implementation** of the assembler, LIR generator, and instruction-selection layers, none of which exist today. This is architecturally separate from, and does not benefit from, progress on the LLVM-backend Native Image path.

### Organizational blockers

- **Oracle Contributor Agreement friction.** PR #13397, a working fix for a riscv64-only compile-hang bug, was closed without merging specifically because the external author had not signed the OCA at submission time. This is a recurring friction point for the primary external contributor driving the 2026 riscv64 work.
- **Oracle Labs holds exclusive merge authority.** Every `OWNERS.toml` across all subprojects lists only oracle.com addresses; the riscv64 port, while substantially driven by an external contributor in 2026, still requires Oracle engineer (`Zeavee`/`wirthi`) review and approval for every merge.
- **No public roadmap or committed release date.** Issue #13351 carries no milestone or target date. GraalVM publishes no platform-tier policy that would obligate a riscv64 release once technical blockers clear.
- **No RISE funding or formal involvement.** GraalVM and Oracle are not RISE members, and no RISE blog post, repository, or funded-work listing references GraalVM. The one concrete RISE connection is issue #13351's note that RISE riscv64 CI runners are available and offered for upstream adoption, which has not yet been acted on.

### Acceptance probability

Foundational plumbing (CPU features, ELF relocations, register config, platform declarations, POSIX glue) is upstream and stable. Oracle engineers are assigned to the master tracking issue and have reviewed and merged substantial external contributions in June-July 2026 (PRs #13826, #13926, #13391). Given this trajectory, acceptance probability for eventually closing out the LLVM-backend riscv64 path is moderate to high, contingent on resolving the unconfirmed LLVM-fork blocker (#13516) and on continued external-contributor availability, which has already been disrupted once by OCA friction. Acceptance probability for a native (non-LLVM) Graal JIT/Native-Image backend for riscv64 remains low within a near-term horizon: it requires writing an entire assembler, LIR generator, and instruction-selection layer from scratch, a multi-person-year effort with no visible current momentum, distinct from the LLVM-path work.

---

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci)
- **Release provider:** none
- **Justification:** No upstream CI builds or tests riscv64 (zero hits across all `.github/workflows/*.yml`; the only riscv64 jsonnet CI task, `riscv64_emulator`/`riscv64_cross_compile` in `substratevm/ci/ci_common/svm-gate.libsonnet`, is defined but unwired to any active gate/tier/daily job), and no riscv64 release binary is published by upstream or any distro/registry checked (confirmed empty on GitHub releases, PyPI, Ubuntu, Debian, Repology, Mandrel); see [oracle/graal issue #13351](https://github.com/oracle/graal/issues/13351) and [graalvm/graalvm-ce-builds releases](https://github.com/graalvm/graalvm-ce-builds/releases). This is not "confirmed broken" (red) because the intended LLVM-backend riscv64 path has recent, real progress: [PR #13926 "Revive RISC-V backend"](https://github.com/oracle/graal/pull/13926) merged 2026-07-06 and [PR #13826](https://github.com/oracle/graal/pull/13826) merged 2026-06-29 with verified substratevm compilation on real riscv64 hardware, so it lands at orange: buildable/actively worked on, but with no upstream CI and no release.
- **Pending work that could change the grade:** The open tracking issue [oracle/graal#13351](https://github.com/oracle/graal/issues/13351) (assigned to Oracle engineers `wirthi`/`Zeavee`) remains open. Recently merged: PR #13926 "Revive RISC-V backend" (2026-07-06), PR #13826 calling-convention fix (2026-06-29), and PR #13391 (pthread_key_t shutdown-crash fix, merged 2026-07-08). PR #13397 (compile-hang fix) was closed without merging due to a missing Oracle Contributor Agreement signature, a recurring friction point for the external contributor (`gounthar`) driving much of this work. An earlier dated sub-report flagged issue [#13516](https://github.com/oracle/graal/issues/13516) (LLVM GraalCallingConvention `cc487` not implemented in riscv64 `llc`) as an open critical blocker as of 2026-07-20; its current status was not reconfirmed in the latest research pass and should be re-verified, since the 2026-07-06/06-29 merges may have superseded it. No RISE funding or membership involvement was found for GraalVM/Oracle, though issue #13351 notes RISE riscv64 CI runners are available and offered for adoption into upstream CI, which would be the clearest path to upgrading this grade.

---

## 14. Investment Analysis

RISE has no documented funding or membership involvement with GraalVM. All active riscv64 work identified is driven by a single external contributor with Oracle Labs review, plus the historical single-Oracle-engineer effort (Sacha Coppey) that established the original LLVM-backend port in 2022-2023. None of the items below are covered by any known RISE or Oracle Labs roadmap commitment.

### 14.1 Functional Enablement

The minimum viable path to a working, CI-verified riscv64 Native Image is:

1. Re-verify and, if still open, resolve issue #13516: patch `graalvm/llvm-project`'s `RISCVISelLowering.cpp` to add `GraalCallingConvention` (`cc487`) support, plus the three secondary gaps it identifies (`emitMathUnsignedMin/Max`, integer min/max intrinsics, `"compressed-pointer"` GC strategy support in LLVM 20's rewrite-statepoints pass).
2. Resolve the JavaCPP/bytedeco LLVM-preset version mismatch (LLVM 13 preset vs. LLVM 20.1.4 objects) flagged in PR #13826.
3. Update bundled libffi from 3.4.8 to 3.6.0 in Truffle NFI to close the float-marshaling correctness gap, and separately address libffi#466 (small-integer widening).
4. Add a musl cross-compile toolchain for riscv64 (issue #8684), accounting for the related musl-cross-compile defect in libffi (libffi#777).
5. Land a working, OCA-compliant version of the DeallocatorThread pre-warm fix abandoned in PR #13397, since the underlying compile-hang defect has not been confirmed resolved upstream.
6. Add automated, riscv64-specific test coverage, since none of the above can be regression-protected without it (see Section 14.3).

The LLVM C++ work in item 1, if still required, remains the critical-path item and requires an engineer with LLVM TableGen and instruction-selection expertise, distinct from general Java/GraalVM skills.

### 14.2 Performance Optimization

Not applicable until functional enablement is complete and independently confirmed; this is not an optimization-purpose project and GraalVM's own riscv64 support has no published performance benchmark beyond a single 2023 GraalVM-team blog comparison (Native Image startup approximately 300 ms versus plain JVM `java -jar` approximately 9,300 ms, roughly 31x, on a Micronaut "hello world" run under emulation). No comprehensive or official riscv64 benchmark suite (SPECjvm, Renaissance, DaCapo) result was found for GraalVM specifically. Once a working binary exists, the performance gap versus arm64 is structurally large: zero RVV dispatch, zero B-extension use, and an empty instruction-selection rule set (`RISCV64NodeMatchRules` is a 3-line stub versus 1,054 lines for AArch64). An initial working-but-unoptimized native image would perform well below arm64 until this work is done: (1) populate `RISCV64NodeMatchRules` with common fused-instruction patterns, (2) add RVV dispatch for the Graal vector API, (3) implement B-extension (Zba/Zbb) detection and use in code generation. None of this is meaningful to size further before functional correctness is confirmed.

### 14.3 CI/CD Infrastructure

The CI task definitions (`riscv64_emulator`, `riscv64_cross_compile`) already exist in `svm-gate.libsonnet` but are not wired into `substratevm/ci/ci.jsonnet`'s active build matrix. Wiring riscv64 into CI requires: (1) adding a `platform_spec` entry and a `task_dict`/`builds` reference that actually invokes `sg.riscv64_emulator`/`sg.riscv64_cross_compile`, (2) provisioning the RISE riscv64 runners that issue #13351 states are already available and offered, and (3) scoping which test gate tier (daily/weekly/ondemand versus full pre-merge gate) riscv64 should run in given emulation overhead. This is materially less effort than items in 14.1 since the task-spec code already exists; the remaining work is wiring and runner provisioning/coordination with Oracle Labs, not new CI-system development.

### 14.4 Ecosystem Enablement

Not applicable as a distinct package-ecosystem enablement effort (see Section 10). Downstream projects that depend on GraalVM Native Image are blocked transitively: issue #13351 itself was opened in the context of JReleaser adding recognition of `linux-riscv_64` as a valid platform but being unable to ship its own native riscv64 binary because no GraalVM target exists; Quarkus and Micronaut, both native-image-dependent frameworks, are similarly blocked. These are automatically unblocked once GraalVM's own riscv64 Native Image path is functional and released; no separate ecosystem-enablement investment is required beyond the work already sized in 14.1. Mandrel (Red Hat's GraalVM distribution) would require a separate downstream packaging effort once the upstream port is functional and released, which is not sized here as it depends on Red Hat's own roadmap, not Oracle's.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Re-verify and, if needed, patch `graalvm/llvm-project` for GraalCallingConvention (`cc487`) + secondary LLVM gaps (issue #13516) | 1 (verification) + 8-12 (if still required) | LLVM/backend engineer | Critical |
| Functional | Resolve JavaCPP/bytedeco LLVM-preset version mismatch | 2-4 | GraalVM/build engineer | Critical |
| Functional | Land an OCA-compliant DeallocatorThread pre-warm fix (supersede unmerged PR #13397) | 1-2 | Any engineer with signed OCA | High |
| Functional | Update bundled libffi 3.4.8 to 3.6.0 in Truffle NFI; address libffi#466 | 1-2 | Truffle/GraalVM engineer | High |
| Functional | Add musl toolchain for riscv64 (issue #8684), coordinate with libffi#777 fix | 4-6 | Build/toolchain engineer | Medium |
| Functional | Add automated riscv64 regression test coverage for the fixes above | 3-5 | GraalVM/build engineer | High |
| CI/CD | Wire existing `riscv64_emulator`/`riscv64_cross_compile` jsonnet tasks into the active `ci.jsonnet` build matrix, provision RISE runners | 2-3 | DevOps + Oracle Labs coordination | High |
| Performance | Implement `RISCV64NodeMatchRules` (basic instruction selection) | 8-12 | Compiler engineer | Medium |
| Performance | Add RVV dispatch in the Graal vector API for riscv64 | 12-20 | Compiler/SIMD engineer | Low |
| Performance | B-extension (Zba/Zbb) detection and use | 4-6 | Compiler engineer | Low |
| Architectural | Implement a native (non-LLVM) HotSpot JIT backend (assembler, LIR generator, node lowering) for riscv64 | 40+ (multi-person-year) | Compiler team | Low (long-horizon) |

---

## 15. References

- [oracle/graal, master tracking issue: native-image riscv64 platform support](https://github.com/oracle/graal/issues/13351)
- [oracle/graal, Issue #13516: LLVM backend cc487 (GraalCallingConvention) not implemented on riscv64](https://github.com/oracle/graal/issues/13516)
- [oracle/graal, Issue #13386: pthread_setspecific shutdown crash, riscv64 only](https://github.com/oracle/graal/issues/13386)
- [oracle/graal, Issue #13396: LLVM native-image compile hang on slow riscv64 hardware](https://github.com/oracle/graal/issues/13396)
- [oracle/graal, Issue #9458: Missing CAP cache value for RISCV64LibCHelperDirectives](https://github.com/oracle/graal/issues/9458)
- [oracle/graal, Issue #5285: Is graal going to support riscv64 platform](https://github.com/oracle/graal/issues/5285)
- [oracle/graal, Issue #8684: Add MUSL_GCC_TOOLCHAIN for RISC-V](https://github.com/oracle/graal/issues/8684)
- [oracle/graal, Issue #8685: Deadlock during native image build (riscv64 slow hardware)](https://github.com/oracle/graal/issues/8685)
- [oracle/graal, PR #13926: Revive RISC-V backend](https://github.com/oracle/graal/pull/13926)
- [oracle/graal, PR #13826: fix(riscv64) implement fixed-parameter and return-saving calling convention](https://github.com/oracle/graal/pull/13826)
- [oracle/graal, PR #13391: fix(posix) map pthread_key_tPointer to pthread_key_t](https://github.com/oracle/graal/pull/13391)
- [oracle/graal, PR #13397: fix(llvm) pre-warm DeallocatorThread monitor (closed without merge)](https://github.com/oracle/graal/pull/13397)
- [oracle/graal, PR #11611: Create RISC-V target for Native Image (GR-36951)](https://github.com/oracle/graal/pull/11611)
- [oracle/graal, PR #7749: Add CPUTypeRISCV64 and cleanup RISC-V reflection code](https://github.com/oracle/graal/pull/7749)
- [oracle/graal, PR #7068: riscv64 SVM test gate fix](https://github.com/oracle/graal/pull/7068)
- [oracle/graal, PR #4716: Align pthread_mutex_t and pthread_cond_t on word boundary](https://github.com/oracle/graal/pull/4716)
- [oracle/graal, commit c0dc96b: libffi ffi_prep_cif_var for RISC-V](https://github.com/oracle/graal/commit/c0dc96b1ff6f63869230adc30ec53a07351bbb26)
- [oracle/graal, commit 95dbcf5: varargs helper for linux-riscv/darwin-aarch64](https://github.com/oracle/graal/commit/95dbcf58dd05e6802c2981aaefed7265d7cbb743)
- [oracle/graal, compiler/core/riscv64 source tree](https://github.com/oracle/graal/tree/master/compiler/src/jdk.graal.compiler/src/jdk/graal/compiler/core/riscv64)
- [oracle/graal, compiler/hotspot/riscv64 source tree](https://github.com/oracle/graal/tree/master/compiler/src/jdk.graal.compiler/src/jdk/graal/compiler/hotspot/riscv64)
- [oracle/graal, substratevm/core.graal.riscv64 source tree](https://github.com/oracle/graal/tree/master/substratevm/src/com.oracle.svm.core.graal.riscv64)
- [oracle/graal, substratevm/core/riscv64 source tree](https://github.com/oracle/graal/tree/master/substratevm/src/com.oracle.svm.core/src/com/oracle/svm/core/riscv64)
- [oracle/graal, riscv64cpufeatures.h](https://github.com/oracle/graal/blob/master/substratevm/src/com.oracle.svm.native.libchelper/include/riscv64cpufeatures.h)
- [oracle/graal, substratevm/ci/ci_common/svm-gate.libsonnet](https://github.com/oracle/graal/blob/master/substratevm/ci/ci_common/svm-gate.libsonnet)
- [oracle/graal, discussion #8657: plans for RISC-V architecture support](https://github.com/oracle/graal/discussions/8657)
- [graalvm/graalvm-ce-builds, releases](https://github.com/graalvm/graalvm-ce-builds/releases)
- [graalvm/labs-openjdk, releases (riscv64 artifacts from jvmci-25.1-b18)](https://github.com/graalvm/labs-openjdk/releases)
- [GraalVM Native Image meets RISC-V (Medium, GraalVM team blog)](https://medium.com/graalvm/graalvm-native-image-meets-risc-v-899be38eddd9)
- [Platform.LINUX_RISCV64 Javadoc](https://www.graalvm.org/sdk/javadoc/org/graalvm/nativeimage/Platform.LINUX_RISCV64.html)
- [GraalVM for JDK 17 release notes](https://www.graalvm.org/release-notes/JDK_17/)
- [RISE Project, members](https://riseproject.dev/members/)
- [RISE Project, blog](https://riseproject.dev/blog/)
- [RISE Project, Java on RISC-V: RISE and Eclipse Adoptium Partnership (2024-05-29)](https://riseproject.dev/2024/05/29/395/)
- [RISE Project, OpenJDK: Supercharging Vectorized Math with SLEEF (2025-09-24)](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/)
- [RISE Project, OpenJDK: CMoveX and Vectorization (2025-07-23)](https://riseproject.dev/2025/07/23/cmovex-vectorization/)
- [Glavo/JRISC-V, pure-Java RISC-V emulator with optional GraalVM Native Image packaging](https://github.com/Glavo/JRISC-V)
- [Repology, graalvm packages](https://repology.org/project/graalvm/versions)
- [Debian package tracker, graalvm (not found)](https://tracker.debian.org/pkg/graalvm)
- [libffi status report](../libraries/libffi.md)
- [OpenJDK status report](../runtimes/openjdk.md)
- [zlib status report](../libraries/zlib.md)
- [glibc status report](../libraries/glibc.md)