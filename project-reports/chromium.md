---
title: Chromium
parent: Project Reports
categories:
  - browser
  - android
---

# Chromium

**Author:** Ludovic HENRY `<ludovic.henry@qti.qualcomm.com>`
**Date:** 2026-06-18<br/>
**Scope:** RISC-V (riscv64/linux) support status for Chromium and its critical dependencies<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Chromium is an open-source web browser project hosted at [chromium.googlesource.com/chromium/src](https://chromium.googlesource.com/chromium/src). It is the upstream for Google Chrome, Microsoft Edge, and many other browsers. The current tip-of-tree version is 151.0.7904.1.

Chromium is architecturally composed of several distinct subsystems relevant to RISC-V evaluation: the V8 JavaScript and WebAssembly engine, the sandbox security layer, the Skia 2D graphics library, the Chromium networking library (Cronet), FFmpeg audio/video decoding, BoringSSL for TLS, and a set of GPU abstraction layers (ANGLE, SwiftShader, Dawn). Each subsystem has a different RISC-V readiness level.

The project is not governed by an independent foundation. Google is the de-facto owner and primary maintainer. The governance model is committer-based: OWNERS files grant per-directory review authority, changes land via Gerrit code review plus an automated Commit Queue, and Tree Sheriffs monitor build health. New platform additions require emailing chrome-atls@google.com and must demonstrate benefit outweighing maintenance cost. There is no formal tier system analogous to Rust or Linux kernel tier definitions.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port originates in two separate efforts that converged over time.

**V8 RISC-V (2020-2022):** In 2020, the V8 RISC-V port was developed as an out-of-tree community effort under the v8-riscv GitHub organization, later migrated to the riscv-collab organization. The institutional drivers were PLCT Lab (Institute of Computing Technology, Chinese Academy of Sciences / ISCAS) with Yahan Lu as the leading maintainer. The riscv-collab/v8 repository shows a stable community snapshot dated August 19, 2021. The V8 RISC-V JIT backend was subsequently upstreamed into the main V8 repository in the 2021-2022 timeframe based on community repository activity.

**Chromium build system (2022-2023):** StarFive Technology's Rebecca Chang submitted the earliest traceable corporate Chromium upstream contribution for riscv64: the CL "Add support for clang toolchain on riscv64" (Gerrit I7d71882a) in March 2022. The Chromium build system received its first RISC-V-specific GN configuration file (`build/config/riscv.gni`) on March 2, 2023, authored by Yahan Lu (ISCAS-PLCT).

**Current active contributor:** As of 2024-2026, the primary driver of upstream Chromium riscv64 work is kxxt (Levi Zim, rsworktech@outlook.com), who describes his focus as "RISC-V and downstream packaging improvements." Chromium upstream has 204+ commits mentioning riscv64 as of June 2026.

**Key milestones by date:**

| Date | Event |
|---|---|
| 2020 | V8 RISC-V port initiated by PLCT Lab as out-of-tree fork |
| Aug 2021 | riscv-collab/v8 stable community snapshot |
| Mar 2022 | StarFive submits first Chromium riscv64 toolchain CL upstream |
| Mar 2023 | build/config/riscv.gni added by Yahan Lu (ISCAS) |
| Oct 2023 | CL 4935120 "Add support for riscv64-linux" (sandbox) filed -- still open |
| Sep 2023 | Debian bug #1051998 opened requesting riscv64 Chromium |
| Jun 2025 | Highway RVV disabled (CL 6583376) |
| May 2025 | cpuinfo re-enabled for riscv64 Linux |
| Jul 2025 | Clang runtime libraries built for riscv64 Linux |
| Sep 2025 | dav1d RVV on Linux riscv64 enabled (tested on SpacemiT K1-X) |
| Jan 2026 | Debian package installer support added (Bug 42050595) |
| Apr 2026 | Zihintpause CPU yield merged (CL 7790544) |
| Apr 2026 | V8 Zfa extension merged (CL 7768270) |
| May 2026 | Highway RVV re-enabled (CL 7807959) |
| Jun 2026 | V8 ZFH simulator support merged (CL 7897892) |

The sandbox CL (4935120) has been open since October 2023. It is the gating item for a production-quality riscv64 Linux port and carries a Code-Review -1 as of May 2026.

---

## 3. Upstream Support Tier

Chromium does not define formal support tiers. The de-facto status of riscv64 is: **present in source, not officially supported, no upstream Google-managed CI**.

Specific indicators:

- `build/config/BUILDCONFIG.gn` does not list riscv64 in its CPU architecture lists (arm64, x86, x64, mips, mips64 are present; riscv64 is absent).
- There is no dedicated Linux riscv64 CI builder in the Chromium LUCI infrastructure.
- The sandbox security layer (seccomp-BPF) has no riscv64 support, meaning any binary produced would run without the seccomp-BPF boundary, which is not a shippable configuration.
- The riscv-collab fork explicitly maintains a "stable branch that will always work for RISC-V" as a safety net against upstream breakage, which is a characteristic community response to an architecture that lacks official CI coverage.
- The riscv64 sysroot targets Debian Trixie, while every other architecture uses Debian Bullseye. This is not a deliberate architectural choice but a consequence of riscv64 not being supported in Bullseye.

The RISE blog post from December 2025 describes the V8 RISC-V port as "mostly at feature parity with x86_64 and ARM64" and notes the community is "among the fastest to address breakages introduced by core V8 developers." However, the Chromium browser (as distinct from V8) has no equivalent characterization in any upstream document.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 V8 JavaScript Engine

V8 is the dominant body of riscv64-specific code. The implementation spans approximately 85+ files across 10 directories in `src/`.

**Assembler and codegen (`src/codegen/riscv/`, 58 files):**

The full assembler stack is present: base assembler, macro-assembler, constant pool, register definitions, reglist, and CPU feature detection. Dedicated extension implementation files cover: A (atomics), B (bitmanip), C (compressed), D (double FP), F (float FP), M (multiply), V (vector/RVV), Zfa, Zfh, Zicond, Zicsr, Zifencei, Zimop. Both RV32 and RV64 are supported via `V8_TARGET_ARCH_RISCV32`/`V8_TARGET_ARCH_RISCV64` guards. The VectorUnit class handles RVV with configurable vlen (128/256/512/1024). No UNIMPLEMENTED() stubs were found in the core assembler.

In April 2026, Zfa support was added (CL 7768270, +2055 lines). A correctness issue was caught during review: a constants file incorrectly used `static_cast<double>(FLT_MIN)` instead of `DBL_MIN` for an `imm5=1` case -- these values differ by approximately 270 orders of magnitude. The error was caught by reviewer Ji Qiu and corrected before merge.

**Compiler backend -- TurboFan/Turboshaft (`src/compiler/backend/riscv/`, 7 files):**

Separate instruction selector files for riscv32 and riscv64. Full code generator with arithmetic, atomics, FP, write barriers, SIMD/RVV opcodes (F32x4, I32x4 variants), and Zbb/Zba instruction classes. Structure mirrors the arm64 and x64 backends. Active Turboshaft wide-multiply CLs were merged April-May 2026.

**Builtins (`src/builtins/riscv/`, 1 file):**

Full macro-assembler implementations for JSConstructStub, InterpreterEntryTrampoline, ResumeGeneratorTrampoline, JSEntry, and dispatch table lookup. Includes shadow stack support (`#ifdef V8_ENABLE_RISCV_SHADOW_STACK`) and sandbox validation paths.

**Liftoff WebAssembly baseline JIT (`src/wasm/baseline/riscv/`, 3 files):**

Shared, riscv32, and riscv64 inline headers. Integer arithmetic, atomics (AMO + LR/SC), SIMD via RVV, type conversions are covered. One explicit `UNIMPLEMENTED()`: `kF32LoadF16` (half-precision float load). Big-endian RISC-V is blocked by a `#error` directive.

**Maglev optimizing JIT (`src/maglev/riscv/`, 3 files):**

Assembler inline header, assembler source, and IR source are all present.

**Sparkplug baseline JIT (`src/baseline/riscv/`, 2 files):**

Baseline assembler inline header and baseline compiler inline header are present.

**Simulator (`src/execution/riscv/`, 6 files):**

Full software simulator for cross-compilation builds. In June 2026, ZFH (half-precision float) simulator support was added (CL 7897892, +721 lines). A `clang_x64_v8_riscv64` toolchain exists for simulator builds.

**Regexp JIT, deoptimizer, disassembler, diagnostics:**

`src/regexp/riscv/` (2 files), `src/deoptimizer/riscv/` (1 file), `src/diagnostics/riscv/` (2 files including disassembler and unwinder) are all present.

**Unaligned access (CL 7763908, merged 2026-04-17):**

The RISC-V backend previously had PartialUnaligned and NoUnaligned code paths inherited from the MIPS port. CL 7763908 removed approximately 770 lines of that code and forces `FullUnalignedAccessSupport` as the only supported mode. The reviewer comment explains the rationale: mainstream high-performance RISC-V cores handle misaligned access in hardware, and for hardware lacking support, the SBI specification mandates firmware handle it via trap handlers.

**Constant pool (per RISE blog, December 2025):**

Constant pool emission was moved from inline (during code generation) to end-of-generation, leveraging RISC-V's up-to-32-bit load offsets. This reduces complexity inherited from the MIPS baseline.

**Atomic jump table patching (per RISE blog, December 2025):**

A race condition was identified and fixed where a CPU could execute the first of two jump-patching instructions before the second was written. The fix replaces the two-instruction sequence with a memory-load-based approach: `auipc t6, 0` / `ld t6, 16(t6)` / `jalr x0, t6` plus a stored target. For short-distance targets, `jal x0 <imm21>` is used.

**RVV register save/restore (per RISE blog, December 2025):**

A bug causing incorrect save/restore of vector registers around C++ calls was discovered only on real hardware (not caught by the simulator). The fix enabled running the complete JetStream benchmark suite.

**Instruction scheduler:**

[NEEDS VERIFICATION] Scheduling latencies in the RISC-V backend were copied from the MIPS port and are incorrect for all real RISC-V cores. This is documented as a known performance gap; no correction CL has been identified in the research findings.

### 4.2 Chromium base/

`base/synchronization/lock_subtle.h` received Zihintpause `pause` instruction support for CPU yield (CL 7790544, merged 2026-04-27, +7/-2 lines). The `pause` instruction is encoded as a hint NOP for backward compatibility on hardware lacking Zihintpause.

`base/cpu.cc` and `base/cpu.h` have no riscv64 sections. CPU feature detection covers only x86 (via CPUID) and ARM (via auxval). The broader CPU feature detection infrastructure remains x86/ARM-only.

### 4.3 Sandbox

The sandbox layer is the critical gap in the Chromium riscv64 port.

The following files have no riscv64 support: `sandbox/linux/system_headers/linux_syscalls.h` (includes x86_64, i386, ARM, MIPS, aarch64 syscall headers -- no riscv64), `sandbox/linux/system_headers/linux_seccomp.h` (no `EM_RISCV` or `AUDIT_ARCH_RISCV64`), `sandbox/linux/seccomp-bpf-helpers/baseline_policy.cc` (no riscv64 branch), `sandbox/linux/seccomp-bpf-helpers/syscall_parameters_restrictions.cc` (no `__riscv` ifdefs).

CL 4935120 ("Add support for riscv64-linux") addresses all of these. It was filed October 13, 2023, is at patch set 14, last rebased May 15, 2026, and carries a Code-Review -1 from reviewer Robert Sesek (rsesek@chromium.org). The last public comment was from Elly on May 18, 2026. No forward progress on clearing the -1 is evident from the available metadata. The CL has 1509 insertions and 59 deletions across approximately 28 files.

Without this CL, Chromium on riscv64 Linux cannot run with the sandbox enabled.

### 4.4 Skia (2D graphics)

Skia builds on riscv64 via generic scalar paths. There is no `SkCpu.cpp` riscv64 CPU feature detection (the function returns 0 on riscv64). There is no `SkOpts_riscv64.cpp` SIMD file in `src/opts/`. LoongArch has dedicated SkOpts files; riscv64 does not. All rasterization, blending, and text rendering runs on scalar code paths.

### 4.5 SwiftShader (software Vulkan)

SwiftShader is broken for riscv64. The `CMakeLists.txt` architecture detection covers arm/aarch64, mips/mips64, ppc64le, loongarch64, x86/x86_64 -- there is no riscv64 case. A riscv64 build host falls through to the x86_64 default, producing x86_64-targeted code on a riscv64 host. No dedicated riscv64 LLVM backend is wired into the SwiftShader LLVM submodule configuration.

The consequence is that WebGL and WebGPU have no software fallback on riscv64 systems without a hardware Vulkan GPU driver.

### 4.6 Dawn (WebGPU) and ANGLE (WebGL)

Both build via generic UNIX paths. No riscv64-specific build conditions exist. Functionality is entirely dependent on available GPU drivers on riscv64 hardware. No riscv64-specific CI is documented for either component.

### 4.7 BoringSSL

No riscv64-specific assembly or CPU detection is present in `crypto/`. There is no `cpu_riscv*.cc` file. All TLS crypto operations fall back to portable C. This is a performance gap relative to OpenSSL-based stacks, which have full riscv64 hardware crypto (AES-Zkn, Zvk vector crypto, ChaCha20 RVV, SHA512 RVV, Montgomery multiply). Note: Chromium uses BoringSSL, not OpenSSL.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 GN Architecture Configuration

`build/config/riscv.gni` defines the following RISC-V-specific build flags:

| Flag | Default | Description |
|---|---|---|
| `riscv_use_rvv` | false | RVV (RISC-V Vector Extension) |
| `riscv_rvv_vlen` | 128 | Simulator VLEN: 128/256/512/1024 |
| `riscv_profile` | "rv64gc" | "rv64gc" or "rvau22" |
| `riscv_use_zba` | false | Zba bitmanip |
| `riscv_use_zbb` | false | Zbb bitmanip |
| `riscv_use_zbs` | false | Zbs bitmanip |
| `riscv_use_zicfiss` | false | Zicfiss shadow stack |
| `riscv_use_zicond` | false | Zicond |
| `riscv_use_sv39` | false | SV39/Svpbmt page-based memory |
| `riscv_code_alignment` | 32 | Code alignment in bytes |
| `riscv_constant_pool_alignment` | 8 | Constant pool alignment |

`build/config/BUILDCONFIG.gn` does not list riscv64 in its CPU architecture enumeration (arm64, x86, x64, mips, mips64 are present).

### 5.2 Toolchain Definitions

Three riscv64 toolchain entries exist in `build/toolchain/linux/BUILD.gn`:

- `clang_riscv64`: Clang native toolchain with linker map output enabled (for binary size analysis).
- `gcc_toolchain("riscv64")`: GCC native toolchain with prefix `riscv64-linux-gnu`.
- `clang_x64_v8_riscv64`: Cross-compilation toolchain with x64 host and riscv64 V8 target, for simulator builds.

### 5.3 Compiler Flags

When `current_cpu == "riscv64"` on POSIX/non-Android with Clang:
- `--target=riscv64-linux-gnu` is added to both `cflags` and `ldflags`.
- `-mabi=lp64d` is unconditionally set (64-bit integer registers, 64-bit double FP).

### 5.4 Sysroot

The riscv64 sysroot targets Debian Trixie (`build/linux/debian_trixie_riscv64-sysroot/`). Every other architecture uses Debian Bullseye. The sysroot tarball SHA256 is `2df6a2698a25258871b45a50d8b5079947b1ad1c63920c944690dfc2a71aab51`. The Debian Trixie baseline was required because riscv64 was not supported in Bullseye.

`sys/hwprobe.h` is patched out of the riscv64 sysroot. The reason documented in `sysroot_creator.py`: it requires glibc >= 2.40, but Chromium's sysroot targets glibc 2.26 minimum.

### 5.5 Hardening Exclusions

From `build/config/compiler/BUILD.gn`: `_FORTIFY_SOURCE` is explicitly disabled for riscv64 (same exclusion applies to s390x, ppc64, mips, mips64, loong64).

Additional exclusions:
- CET Shadow Stack: x64-only, disabled on riscv64.
- HWASan: Android arm64-only, disabled on riscv64.
- CFI (`is_cfi`): x64-only on Linux, disabled on riscv64.
- MSan: x64-only, disabled on riscv64.

### 5.6 Toolchain Version

Chromium uses a bundled Clang at a pinned version. The `tools/clang/scripts/update.py` downloads Linux x64 host binaries only; no prebuilt riscv64 Clang host binary is provided by Chromium's toolchain scripts. The cross-compiler for the sysroot uses GCC 12 (available in Debian Trixie), with the `riscv64-linux-gnu` cross-compiler package on the build host.

The Chromium infra defines a single named riscv64 GN args config: `name="riscv64", args={"target_cpu":"riscv64"}` with no additional args (unlike arm64, which has `test_host_cpu` and other fields).

### 5.7 Minimal Build Command Sequence

```
# Install riscv64 sysroot
python3 build/linux/sysroot_scripts/install-sysroot.py --arch=riscv64

# Generate build directory
gn gen out/riscv64 --args='target_cpu="riscv64" use_sysroot=true'

# Build
autoninja -C out/riscv64 chrome
```

No Dockerfile or container build script for riscv64 exists in the upstream source tree. No QEMU configuration is documented in any upstream build file.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | riscv64 status | arm64 status | Parity? |
|---|---|---|---|
| V8 assembler/codegen | Full, hand-tuned | Full, hand-tuned | Yes |
| V8 Liftoff WASM JIT | Full (one UNIMPLEMENTED: kF32LoadF16) | Full | Near |
| V8 Maglev optimizing JIT | Full | Full | Yes |
| V8 TurboFan/Turboshaft | Full | Full | Yes |
| V8 builtins | Full | Full | Yes |
| V8 simulator | Full | Full | Yes |
| Sandbox (seccomp-BPF) | Missing (CL 4935120 blocked) | Full | No |
| CPU feature detection (base/) | None | Full | No |
| Skia SIMD opts | None (scalar only) | Full (NEON) | No |
| BoringSSL hw crypto | None (scalar only) | Full (AES-CE, SHA) | No |
| SwiftShader (software Vulkan) | Broken | Full | No |
| zlib SIMD (Chromium fork) | None (scalar only) | Full (NEON) | No |
| _FORTIFY_SOURCE | Disabled | Enabled | No |
| CFI sanitizer | Disabled | Disabled (Linux) | Equal |
| HWASan | Disabled | Enabled (Android) | No (Android) |
| Highway RVV | Enabled (May 2026 revert) | Full NEON | Near |
| Cronet Android CI | 2 builders (compile only) | Full CI | No |
| Linux browser CI | None | Full | No |

The V8 engine subsystem is at near-parity with arm64 and x86-64. All other Chromium subsystems have significant gaps. The sandbox gap is the most critical because it blocks production deployment on Linux.

---

## 7. CI/CD Infrastructure

### 7.1 Official Chromium CI

The Chromium LUCI infrastructure contains exactly four riscv64 builders. All four are scoped to Cronet (the Android networking library) only.

| Builder | Bucket | Group |
|---|---|---|
| `android-cronet-riscv64-rel` | ci | chromium.android |
| `android-cronet-riscv64-dbg` | ci | chromium.android |
| `android-cronet-riscv64-rel` | try | tryserver.chromium.android |
| `android-cronet-riscv64-dbg` | try | tryserver.chromium.android |

GN args for the release builder: `target_cpu="riscv64"`, `target_os="android"`, `is_cronet_build=true`, `is_official_build=true`, `is_component_build=false`.

Build targets: `cronet_package`, `cronet_sample_test_apk`, and five additional Cronet test APK/binary targets.

On-device testing: None. Test scripts run on x86-64 Ubuntu-22.04 hosts. The builders perform compile-and-size measurement only; no physical or emulated riscv64 Android device testing is configured.

There is no Linux riscv64 CI builder, no ChromiumOS riscv64 CI builder, and no full-browser riscv64 CI builder of any kind in the upstream Chromium infrastructure.

### 7.2 V8 Official CI

The V8 upstream project has three LUCI builders for RISC-V simulation: `v8_linux64_rel_ng` (sim), `v8_linux64_dbg` (sim-debug), and a pointer-compression variant. These run on x86-64 hosts using the `clang_x64_v8_riscv64` simulator build.

### 7.3 PLCT Lab Independent CI (ci.rvperf.org)

PLCT Lab (ISCAS) operates an independent Jenkins instance at ci.rvperf.org for V8 RISC-V. Jobs and current status as of June 2026:

| Job | Last Successful Build | Status |
|---|---|---|
| v8-upstream-master-fastcheck-riscv64 | Recent | Passing |
| v8-upstream-master-pointer-compression-riscv64 | Recent | Passing |
| v8-upstream-master-vlen128-riscv64 | Recent | Passing |
| v8-upstream-master-vlen256-riscv64 | Recent | Passing |
| v8-upstream-master-sandbox-riscv64 | ~1 month ago (build #219) | Intermittent |
| v8-upstream-master-riscv64-jetstream | ~6 months ago (build #116) | Continuously failing |
| v8-upstream-master-riscv32 (full) | ~6 months ago (build #2594) | Continuously failing |
| v8-upstream-master-fastcheck-riscv32 | ~6 months ago (build #36614) | Continuously failing |

The JetStream job produces benchmark scores as artifacts. However, with the job failing for approximately 6 months (last run: build #271, failed), no current scores are being generated.

### 7.4 Community CI (riscv-forks/chromium-riscv)

The [riscv-forks/chromium-riscv](https://github.com/riscv-forks/chromium-riscv) repository, maintained by kxxt (Levi Zim), publishes weekly Chromium builds for riscv64. The latest release as of the research date is 149.0.7827.155 (June 17, 2026), with 15 total releases. CI runs on hardware labeled `rvv-incapable` (native RISC-V runners). Tests executed: `base_unittests`, `cc_unittests`, `net_unittests`, V8 cctest (Debug and Release).

Known exclusions in this CI:
- Wasm SIMD tests excluded ("not supported on this hardware").
- OOM allocation test handlers not triggered (`AlignedAllocOOM`, `MallocedOperatorNewOOM`, `AccountingAllocatorOOM`).
- `JumpTablePatchingStress` is excluded due to a known flaky failure ("the SG2042 heisenbug") on SG2042 hardware [NEEDS VERIFICATION on root cause].

---

## 8. Distribution and Release Status

There is no official Chromium binary release for riscv64 in any distribution channel.

| Channel | riscv64 binary available? | Notes |
|---|---|---|
| Chromium upstream | No | Sandbox CL 4935120 open 2.5+ years, Code-Review -1 |
| Debian sid | No | Maintainer arch list excludes riscv64; bug #1051998 open since Sep 2023 |
| Ubuntu 24.04 (noble) | No | `chromium-browser` is a transitional snap redirect; only amd64/arm64/armhf |
| Arch Linux RISC-V | No | Marked OUTDATED + FTBFS; DEP BROKEN; patch set exists but does not produce installable binary |
| PyPI `chromium` | No | Only a hobby placeholder at version 0.0.0, architecture-independent stub |

The Arch Linux RISC-V port status from [archriscv.felixc.at](https://archriscv.felixc.at): the chromium entry shows version delta 148 -> 149 (one version behind), tagged "Outdated FTBFS Logs" and "patched", with `DEP BROKEN` on java-runtime-headless, python (make deps) and `DEP OUTDATED` on mesa, fontconfig, pipewire, npm. This reflects a community porting effort that is currently not producing successful builds.

The community CI repository riscv-forks/chromium-riscv produces functional builds (149.0.7827.155 as of June 2026) for testing purposes. These are not official distributions and are not built with the seccomp-BPF sandbox enabled due to CL 4935120 being unmerged.

---

## 9. Dependencies

### 9.1 V8

V8 is discussed above in Section 4.1. The key open issue is the Sub32 signed overflow correctness bug (CL 7500131), stalled since January 2026 with an unresolved correctness objection. The riscv32 port is deprecated with removal planned after May 2026.

### 9.2 FFmpeg

FFmpeg has an active riscv64 port since September 2022. Dedicated `libavcodec/riscv/`, `libavutil/riscv/`, `libswscale/riscv/`, `libavfilter/riscv/` source trees exist. RVV acceleration is present for H.264, VP8/VP9, HEVC, AAC, AC3, Opus, swscale, and swresample. Three FATE CI instances at remlab.net are all passing (5532/5532 for GC and GCVb configurations). There is a named maintainer (Remi Denis-Courmont). No out-of-tree patch queue.

Open items: H.264 qpel series (PR #12953) received LGTM but is stalled un-merged. Some RVV DSP paths are marked TODO.

### 9.3 libjpeg-turbo

RVV SIMD was merged in February 2026 to the dev branch (3,141 lines, 23 files) and released in 3.1.90 (3.2 beta1, March 2026). Measured performance on OrangePi RV2: 72% average compression speedup, 53% average decompression speedup vs scalar. GA release 3.2 is pending. No dedicated riscv64 CI. Maintainer explicitly declined to provide official riscv64 binary packages (issue #885, closed "won't implement").

### 9.4 libpng

RVV SIMD merged May 2025 (PR #666). Multiple correctness bugs were found post-merge: wrong RVV version targeting T-Head C920 (issue #711), paeth3/paeth4 producing wrong pixel values on SpacemiT K1, causing 52 OpenCV test failures (issue #769, fixed approximately in v1.6.52). All corrections were discovered via hardware user bug reports, not automated CI. Current stable: 1.6.52+.

### 9.5 BoringSSL

No riscv64-specific code. All TLS crypto is scalar. See Section 4.7 for detail.

### 9.6 Skia

No riscv64 SIMD. All rendering is scalar. See Section 4.4 for detail.

### 9.7 XNNPACK (ML inference, used for WebNN)

A Google-initiated riscv64 port exists since June 2022, with 300+ riscv64-specific kernel files. RVV acceleration covers GEMM, depthwise conv, vbinary, QS8/QU8, maxpool/avgpool, reduce. GitHub Actions CI runs on QEMU for every PR.

Open issues: `RISCV_HWPROBE_EXT_ZVFH` macro missing under Clang 19.1 (partial fix March 2026, PR #9903). F32-RSUM RVV disabled due to a multi-thread correctness issue (PR #6450, open). `XNN_ENABLE_RISCV_FP16_VECTOR` (Zvfh) was enabled unconditionally as of January 2026, introducing a regression when Zvfh is not present on hardware.

No native hardware CI. Operator tests are excluded from CI.

### 9.8 SwiftShader

Broken for riscv64. See Section 4.5 for detail.

### 9.9 ICU, HarfBuzz

Architecture-agnostic C++. No riscv64-specific issues. Both are available in Debian/Ubuntu for riscv64.

### 9.10 zlib (Chromium fork)

`cpu_features.c` is present but there are no riscv64 SIMD source files. The `riscv_cpu_enable_rvv` and `riscv_cpu_enable_vclmul` detection flags are referenced in V8's zlib config but `vclmul` detection is marked as TODO. All zlib operations run scalar on riscv64. Only x86 and ARM have SIMD-accelerated paths.

### 9.11 libpfm4 (performance counter profiling)

libpfm4 has no RISC-V PMU event table files. Only AMD, Intel, ARM, and IBM Cell event tables exist. This blocks all V8 and Chromium hardware performance counter profiling workflows on riscv64. Upstream contribution is required; no in-progress work was identified in the research findings.

---

## 10. Ecosystem Status

### 10.1 Corporate Contributors

Identified contributors to the Chromium riscv64 effort, by evidence in commits, CLs, or mailing lists:

| Contributor | Affiliation | Contribution |
|---|---|---|
| Yahan Lu (yahan@iscas.ac.cn) | ISCAS / PLCT Lab | Primary V8 RISC-V backend maintainer; build/config/riscv.gni author (Mar 2023); ongoing codegen work |
| Ji Qiu (qiuji@iscas.ac.cn) | ISCAS / PLCT Lab | Primary V8 RISC-V reviewer; operates ci.rvperf.org |
| Rebecca Chang (rebecca.chang@starfivetech.com) | StarFive Technology | Earliest corporate upstream contributor; clang toolchain + sysroot scripting (Feb-Jun 2022) |
| Levi Zim (rsworktech@outlook.com) | Independent | Primary current Chromium riscv64 upstream driver; Highway RVV, Zihintpause, installer Debian support |
| mark.zhuang@spacemit.com | SpacemiT | compiler-rt riscv fixes |
| aelliott@qti.qualcomm.com | Qualcomm | Zicfiss shadow-stack extension |

### 10.2 RISE Project Involvement

The RISE project has no dedicated Chromium-funded work. A search of all 27 RISE blog posts (May 2024 through June 2026) found zero posts mentioning Chromium. The RISE December 2024 webinar PDF lists browser/JS work under the Language Runtimes working group but identifies only "Added support to V8 and SpiderMonkey" as a 2024 achievement -- with no Chromium-specific RFP cited.

The only RISE content directly relevant to this assessment is the December 9, 2025 blog post ["A Glimpse Into V8 Development for RISC-V"](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/). It covers the V8 engine, not the Chromium browser.

Institutional connections exist: Google is a RISE Premier Member. SpacemiT and ISCAS are RISE General Members. These connections do not constitute funded Chromium project work.

### 10.3 Community Infrastructure

- [riscv-forks/chromium-riscv](https://github.com/riscv-forks/chromium-riscv): weekly riscv64 builds, 15 releases, maintained by kxxt.
- [riscv-forks/electron](https://github.com/riscv-forks/electron): Electron fork for riscv64 Linux, cross-compiled from x86-64 Debian Bookworm or natively on Arch Linux riscv64.
- ci.rvperf.org: PLCT Lab Jenkins for V8 RISC-V (not Chromium browser).
- Debian bug [#1051998](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1051998): open since September 2023, requesting riscv64 Chromium package. As of early 2024, sandbox and FFmpeg were identified as the two largest blockers.

---

## 11. Known Bugs and Active Issues

### 11.1 Correctness Bugs (V8, open)

| Issue | Title | Component |
|---|---|---|
| riscv-collab/v8 #701 | Octane failed on Unmatched: NavierStokes checksum error, PdfJS wrong output | Precision/arithmetic |
| riscv-collab/v8 #702 | rv32 debug stress mode failed | riscv32 correctness |
| riscv-collab/v8 #695 | cctest RunWasmLiftoff_I32Binop_DivS fails (riscv32) | Wasm correctness |
| riscv-collab/v8 #670 | regress-crbug-1041232.js failing in native test mode (riscv32) | Correctness |
| riscv-collab/v8 #669 | regress-crbug-1209152.js failing in native test mode (riscv32) | Correctness |
| riscv-collab/v8 #630 | cctest test-macro-assembler-riscv32/CompareI | riscv32 correctness |
| V8 upstream CL 7500131 | Sub32 signed integer overflow in assembler | riscv64 correctness -- stalled Jan 2026 |

The Octane PdFJS failure (expected output 939524096, actual 536870912) strongly suggests a floating-point precision or arithmetic error in the riscv64 backend on the SiFive Unmatched board. These results are from 2022 with --noopt (no JIT), so their relevance to current JIT-enabled performance is limited. However, no confirmed root cause or fix is documented in the research findings.

### 11.2 Performance Gaps

| Issue | Title | Status |
|---|---|---|
| riscv-collab/v8 #574 | Integer division by power of 2 not replaced with arithmetic shift | Open |
| riscv-collab/v8 #528 | Using customized memcpy may enhance performance | Open since March 2022 |
| libpfm4 | No RISC-V PMU event tables | No upstream activity found |
| V8 instruction scheduler | Latencies copied from MIPS, incorrect for all real RISC-V cores | No CL identified |

### 11.3 Hardware-Level Bugs (distribution, revyos)

| Issue | Status | Description |
|---|---|---|
| revyos #145 | Open | Chromium, glxinfo, glxgears crash on LicheePi Console 4A (20250930 build); GPU process exits with SIGILL; graphics stack regression |
| revyos #113 | Closed | SIGILL from invalid compressed RISC-V instruction `0x6022` in `views::BubbleDialogDelegateView::GetWidget()`; toolchain codegen bug or ABI mismatch |
| revyos #81 | Closed (Jan 2026) | Black screen after Bilibili video on Meles board; no root cause documented |

### 11.4 Extension/Feature Gaps (active)

- `kF32LoadF16` in Liftoff: explicit `UNIMPLEMENTED()`.
- fp16/Zvfh vector arithmetic (vfadd/vfsub/vfmul/vfdiv): CL 7953190 open as of June 18, 2026, pending Review-Enforcement requirement clearance.
- XNNPACK `RISCV_HWPROBE_EXT_ZVFH` macro missing under Clang 19.1: partial fix in progress (PR #9903).
- XNNPACK F32-RSUM RVV: disabled due to multi-thread correctness issue (PR #6450, open).

---

## 12. Objections and Upstream Blockers

### 12.1 Sandbox CL (primary blocker)

CL 4935120 is blocked by a Code-Review -1 from Robert Sesek (rsesek@chromium.org) and has been in this state since the CL was filed in October 2023. The CL is at revision 14, last rebased May 15, 2026. The research findings do not contain the specific technical objection raised by the -1 reviewer. This represents a 2.5+ year unresolved review situation.

Without this CL, a production-deployed riscv64 Chromium is not possible on Linux. The sandbox is not optional: it is the primary security boundary between the renderer process and the OS.

### 12.2 V8 Sub32 Overflow Bug (CL 7500131)

A correctness bug in the riscv64 assembler has been stalled since January 2026 with an unresolved correctness objection from a reviewer. The research findings do not contain the specific objection text. The bug has been open for approximately 5 months from the research date.

### 12.3 Highway RVV

Was disabled in June 2025 (CL 6583376) due to "uncommon with most riscv chips." Reverted in May 2026 (CL 7807959). The research findings note the Rubber Stamper bot refused automatic approval because the original was beyond the 14-day auto-approve window, confirming that human reviewer attention was needed for the re-enablement.

### 12.4 XNNPACK Zvfh Regression

`XNN_ENABLE_RISCV_FP16_VECTOR` was enabled unconditionally in January 2026. This is a regression on hardware lacking the Zvfh extension, compounded by the missing `RISCV_HWPROBE_EXT_ZVFH` macro under Clang 19.1.

### 12.5 Governance

New architecture support in Chromium requires demonstrating benefit to the project. Configurations without Google-managed CI bots are unsupported. The current state -- no Linux riscv64 CI, no official binary, unmerged sandbox CL -- means that upstream breakage of the riscv64 port is an accepted risk.

---

## 13. Investment Analysis

The following sections identify specific work items, assess effort, and assign priorities. Effort estimates are rough-order-of-magnitude in person-weeks. Items are assessed from the perspective of a chip company evaluating whether to invest engineering resources.

### 13.1 Functional Enablement

The sandbox CL is the single highest-leverage item. It has been open for 2.5+ years and is blocked by one reviewer. A chip company with an interest in shipping Chromium on riscv64 Linux should apply engineering attention here. The CL itself is at revision 14 and was last rebased in May 2026, so it is not stale -- it simply lacks the political momentum to clear the -1.

SwiftShader is the second highest-leverage functional gap. Without it, WebGL and WebGPU cannot run on riscv64 systems without a hardware GPU driver. Adding a riscv64 architecture case to SwiftShader's CMakeLists.txt and wiring up the LLVM riscv64 backend would restore the software fallback path. This is a tractable engineering project.

### 13.2 Performance Optimization

The Skia SIMD gap is the largest performance deficiency in the non-V8 stack. Adding RVV-accelerated paths to Skia's `src/opts/` (analogous to the LoongArch implementation) would accelerate all 2D rendering, text, and canvas operations. BoringSSL is the second priority: scalar TLS crypto is measurably slower than the hardware-accelerated paths available via OpenSSL on riscv64.

V8 instruction scheduler latencies copied from MIPS represent a correctness-adjacent performance issue: the scheduler may make incorrect decisions about instruction ordering, limiting IPC gains. Profiling on real hardware and updating the latency tables would benefit any high-performance riscv64 chip deployment.

### 13.3 CI/CD Infrastructure

The absence of a Linux riscv64 CI builder in Chromium LUCI is the root cause of the port's fragility. Contributing a riscv64 build bot to the Chromium LUCI infrastructure would change the risk profile from "community vigilance" to "Google tree sheriff coverage." This requires hardware infrastructure commitment, not just software engineering.

The ci.rvperf.org JetStream CI job has been failing for approximately 6 months. Restoring this job would produce public benchmark data that currently does not exist, enabling objective comparison of riscv64 V8 performance against arm64 and x86-64 baselines.

### 13.4 Ecosystem Enablement

libpfm4 has no RISC-V PMU event tables. This completely blocks hardware performance counter profiling on riscv64, which affects both V8 benchmark development and general Chromium profiling workflows. Contributing PMU event tables for specific RISC-V cores is a well-scoped, bounded project.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner Candidate | Priority |
|---|---|---|---|---|
| Functional | Resolve sandbox CL 4935120 (Code-Review -1 clearance + rebase) | 2-4 | Chip company security/sandbox eng | Critical |
| Functional | SwiftShader riscv64 architecture support | 4-8 | Chip company graphics eng | High |
| Functional | V8 Sub32 overflow bug CL 7500131 (resolve correctness objection) | 1-2 | ISCAS or chip company V8 eng | High |
| Functional | XNNPACK Zvfh hwprobe fix (PR #9903 completion) | 1-2 | Chip company ML eng | High |
| Functional | XNNPACK F32-RSUM multi-thread correctness (PR #6450) | 2-4 | Chip company ML eng | Medium |
| Performance | Skia RVV SIMD opts (src/opts/) | 6-12 | Chip company graphics eng | High |
| Performance | BoringSSL riscv64 hardware crypto assembly | 8-16 | Chip company crypto/security eng | High |
| Performance | V8 instruction scheduler latency tables for riscv64 | 3-6 | Chip company CPU architect + V8 eng | Medium |
| Performance | zlib RVV acceleration (Chromium fork) | 2-4 | Chip company systems eng | Low |
| CI/CD | Linux riscv64 LUCI build bot (Chromium upstream) | 4-8 (infra + SW) | Chip company infra | High |
| CI/CD | Restore ci.rvperf.org JetStream job | 1-2 | ISCAS or chip company | Medium |
| CI/CD | Chromium Linux riscv64 CI with on-device tests | 8-16 | Chip company infra | Medium |
| Ecosystem | libpfm4 RISC-V PMU event tables | 2-4 | Chip company CPU architect | Medium |
| Ecosystem | Debian package for riscv64 Chromium (bug #1051998) | 4-8 (depends on sandbox) | Distribution eng | Medium |

---

## 14. Updates

No updates. Initial report dated 2026-06-18.

---

## 15. References

- [Chromium source repository](https://chromium.googlesource.com/chromium/src)
- [CL 4935120 - Add support for riscv64-linux (OPEN)](https://chromium-review.googlesource.com/c/chromium/src/+/4935120)
- [CL 7790544 - Use Zihintpause for CPU yield on RISC-V (MERGED)](https://chromium-review.googlesource.com/c/chromium/src/+/7790544)
- [CL 7807959 - Revert highway riscv RVV BROKEN_TARGETS (MERGED)](https://chromium-review.googlesource.com/c/chromium/src/+/7807959)
- [CL 6583376 - highway: add riscv RVV to BROKEN_TARGETS (MERGED)](https://chromium-review.googlesource.com/c/chromium/src/+/6583376)
- [CL v8/7768270 - Add Zfa extension (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7768270)
- [CL v8/7787832 - Optimize float min/max codegen with ZFA (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7787832)
- [CL v8/7763908 - Disable unaligned access support (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7763908)
- [CL v8/7800114 - Fix signed integer overflow in GrowBuffer (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7800114)
- [CL v8/7819100 - Decouple SIMD from WebAssembly (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7819100)
- [CL v8/7889597 - Disable float16 (RVV lacks Zvfh) (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7889597)
- [CL v8/7897892 - Implement ZFH in Simulator (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7897892)
- [CL v8/7947903 - Add acquire-release for atomic.fence (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7947903)
- [CL v8/7953190 - Implement vfadd/vfsub/vfmul/vfdiv for fp16 (OPEN)](https://chromium-review.googlesource.com/c/v8/v8/+/7953190)
- [CL v8/7953184 - Implement CompareSmiAndAssert (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7953184)
- [CL v8/7953185 - Move DebugInfo to trusted space (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7953185)
- [riscv-forks/chromium-riscv (community builds)](https://github.com/riscv-forks/chromium-riscv)
- [RISE blog: A Glimpse Into V8 Development for RISC-V (Dec 2025)](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [Debian bug #1051998 - chromium: please add support for riscv64](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1051998)
- [Arch Linux RISC-V package status](https://archriscv.felixc.at/)
- [Chromium CI LUCI builder configuration - infra/config/generated/builders/](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/infra/config/generated/builders/)
- [V8 RISC-V issue tracker (riscv-collab)](https://github.com/riscv-collab/v8/issues)
- [revyos hardware issues tracker](https://github.com/revyos/revyos/issues)