---
title: WebKit
parent: Project Reports
categories:
  - browser
---

# WebKit

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for WebKit<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

WebKit is the browser engine underlying Apple Safari, WPE WebKit (embedded Linux), and WebKitGTK. Its core JavaScript and WebAssembly engine is JavaScriptCore (JSC), which includes a multi-tier JIT stack: LLInt (bytecode interpreter), Baseline JIT, DFG JIT, and FTL (highest-tier optimizing JIT backed by B3/Air). The engine also includes separate WebAssembly JIT tiers: BBQJIT (fast baseline Wasm) and OMGJIT (optimizing Wasm).

The WebKit/WebKit repository is hosted at [https://github.com/WebKit/WebKit](https://github.com/WebKit/WebKit) with canonical upstream at git.webkit.org. Bug tracking uses [bugs.webkit.org](https://bugs.webkit.org). The project is Apple-controlled with no independent foundation.

The primary delivery vehicle for RISC-V is the WPE WebKit port (embedded Linux), maintained by Igalia. The GTK port is a secondary target. Apple platform ports (macOS, iOS) have no RISC-V relevance.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port was initiated by Igalia and has been developed incrementally since mid-2021. All dates and commits are from bugs.webkit.org and github.com/WebKit/WebKit.

| Date | Event | Author / Organization |
|---|---|---|
| 2021-07-27 | First commit: [CMake] Add WTF\_CPU\_RISCV64 (commit d007542, bug 228322). JIT, FTL, and sampling profiler disabled explicitly "until they are properly supported." | Zan Dobersek, Igalia |
| 2021-08-21 | [Bug 224134](https://bugs.webkit.org/show_bug.cgi?id=224134): "WebKitGTK constantly crashes on RISC-V 64" -- LLVM "Cannot select" errors, 100% crash rate. Status: NEW, open. | External reporter |
| 2021-10-27 | [Bug 232373](https://bugs.webkit.org/show_bug.cgi?id=232373): scratchRegister() is unsafe on RISCV64. Status: NEW, open. | Filed externally |
| 2021-12-28 | Define HAVE\_MACHINE\_CONTEXT, mcontext\_t accessors for RISCV64 (commit 6c2615d). | commit-queue |
| 2022-03-11 | [Bug 237775](https://bugs.webkit.org/show_bug.cgi?id=237775): "[JSC] RISC-V support in JavaScriptCore" meta/tracking bug filed, covering ~46 sub-bugs for LLInt, MacroAssembler, YARR, WebAssembly, B3/Air, calling conventions. ~40 sub-bugs resolved. | Zan Dobersek, Igalia |
| 2022-03-24 | Bug 238006 (B3/Air backend), Bug 238008 (C compressed extension) filed. Status: NEW, open. | Zan Dobersek, Igalia |
| 2022-05-01 | Bug 239707: "Enable FTL/B3/Air support" filed. Status: NEW, open. | Filed |
| 2022-10-03 | [PR #4929](https://github.com/WebKit/WebKit/pull/4929): RISCV64 support for WebAssembly -- merged. Major patch adding RISCV64 to JSC WebAssembly including baseline JIT and LLInt paths. | Juliana Sims |
| 2022-10-08 | [PR #5086](https://github.com/WebKit/WebKit/pull/5086): Use GOT for non-local symbols in RISCV64 JIT backend -- merged. | External |
| 2022-11-19 | [PR #6132](https://github.com/WebKit/WebKit/pull/6132): Fix RISC-V64 SIMD compilation issues -- merged. | External |
| 2023-03-10 | [PR #11358](https://github.com/WebKit/WebKit/pull/11358): Unreviewed build fixes for RISCV64 -- merged. | External |
| 2023-06-22 | [PR #14732](https://github.com/WebKit/WebKit/pull/14732): WPE cross-toolchain-helper: Add a RISCV64 target (commit efa0c0b). Adds --cross-target=qemu-riscv64 to the WPE Yocto cross-build system. | Carlos Lopez Perez (clopez), Igalia |
| 2023-09-01 | [PR #17348](https://github.com/WebKit/WebKit/pull/17348): Unreviewed RISCV64 build fix -- merged (commit bb7a34a). | Zan Dobersek, Igalia |
| 2023-10-25 | [PR #19543](https://github.com/WebKit/WebKit/pull/19543): Fix 32-bit shifts regression on RISCV64 -- merged. | External |
| 2024-02-04 | [PR #23829](https://github.com/WebKit/WebKit/pull/23829): Fix build failed for riscv64 -- merged (commit 6b46c24). | luyahan |
| 2024-08-01 | [PR #31401](https://github.com/WebKit/WebKit/pull/31401): Implement JITless JS entry thunk to Wasm on RISCV64 -- merged. | External |
| 2024-10 onwards | Wave of MacroAssemblerRISCV64 gap-filling patches from PLCT Lab (ISCAS, China). | trdthg (Mingzhu Yan), PLCT Lab |
| 2024-11-10 | [PR #36460](https://github.com/WebKit/WebKit/pull/36460): Set MacroAssemblerRISCV64 methods to public -- merged. [PR #36459](https://github.com/WebKit/WebKit/pull/36459): Add MacroAssemblerRISCV64 add8 implementations -- open. | External |
| 2024-11-19 | [PR #36461](https://github.com/WebKit/WebKit/pull/36461): Fix instruction requires 'D'/'F'/'M' extension -- merged. | External |
| 2024-12-09 | [PR #37639](https://github.com/WebKit/WebKit/pull/37639): Add lshift64 in MacroAssembler for RISCV -- merged. | External |
| 2024-12-11 | [PR #37767](https://github.com/WebKit/WebKit/pull/37767): Add OFFLINE\_ASM\_ALIGN\_TRAP for RISCV -- merged. | External |
| 2026-01-18 | [Bug 305745](https://bugs.webkit.org/show_bug.cgi?id=305745): "[GTK] Fails to build in riscv64: cannot tail-call" -- NEW, open. | Filed |
| 2026-05-05 | [PR #64268](https://github.com/WebKit/WebKit/pull/64268): Fix build for RISC-V -- open, no reviewer assigned. Discussion confirms JIT "completely nonfunctional." | andreas-schwab |
| 2026-05-13 | [PR #64755](https://github.com/WebKit/WebKit/pull/64755): Add RISCV64 support to GdbJIT ELF records -- merged (commit 2130a34). [PR #64756](https://github.com/WebKit/WebKit/pull/64756): Use std::integral in RISCV64 immediate helpers -- merged (commit 6b720e4). | Xeonacid |
| 2026-05-14 | [PR #64894](https://github.com/WebKit/WebKit/pull/64894): Add missing RISCV64 offlineasm register mappings -- open, merging-blocked. Approved by Constellation. | Xeonacid |
| 2026-05-25 | [PR #65621](https://github.com/WebKit/WebKit/pull/65621): Enable WebAssembly BBQJIT on RISCV64 -- open, merging-blocked. 32 commits, 99.88% Wasm test pass rate on StarFive VisionFive 2. | dangowrt (Daniel Golle, OpenWrt) |
| 2026-05-26 | [PR #65645](https://github.com/WebKit/WebKit/pull/65645), [#65646](https://github.com/WebKit/WebKit/pull/65646), [#65647](https://github.com/WebKit/WebKit/pull/65647), [#65648](https://github.com/WebKit/WebKit/pull/65648): Cluster of four offlineasm and AirArg fix PRs -- all open. | Xeonacid |
| 2026-05-28 | [PR #65885](https://github.com/WebKit/WebKit/pull/65885): WPE cross-toolchain-helper Clang improvements + layer features -- merged. | External |

**Assessment:** The port has had continuous but low-velocity investment since 2021. The dominant contributors are Igalia (port infrastructure, WPE), Juliana Sims (early Wasm work), trdthg/PLCT Lab (MacroAssembler gaps, 2024), Xeonacid (assembler/offlineasm fixes, 2026), and Daniel Golle/OpenWrt (BBQJIT enablement, 2026). Apple employees (Yusuke Suzuki, Justin Michaud) review and land patches but contribute no RISC-V code themselves. As of mid-2026, a cluster of 7 open PRs is attempting to enable BBQJIT but none have merged.

---

## 3. Upstream Support Tier

WebKit does not publish a formal architecture tier classification (no PLATFORMS.md, no SUPPORT.md, no TIER.md found in the repository). The inferred status is:

- **Not tier-1:** No CI, no release binaries from upstream, no Apple employee contributions to RISC-V code.
- **Community-supported port:** RISC-V patches are accepted when they do not break tier-1 platforms (Apple, x86\_64 Linux). Two open PRs (#36379, #42802) carry merging-blocked labels due to CI failures on non-RISC-V platforms, confirming this policy.
- **WPE is the delivery vehicle:** RISC-V work is overwhelmingly WPE-port-specific. The Yocto cross-build system includes a dedicated qemu-riscv64 target. GTK port has open build failures (Bug 305745).
- **No RISE membership:** WebKit is not a member of the RISE project (riseproject.dev). The RISE blog (27 posts, May 2024 -- June 2026) contains zero WebKit references. The RISE wheel builder and funded project list contain no WebKit entries.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Architecture-Specific Source Files

Seven substantive RISC-V source files exist, all in `Source/JavaScriptCore/`:

| File | Lines | Purpose | Completeness |
|---|---|---|---|
| `assembler/RISCV64Registers.h` | ~113 | 32 GPR + 32 FPR enums with ABI aliases, calling-convention metadata | Full |
| `assembler/RISCV64Assembler.h` | ~950 | Low-level instruction encoder. RV64IMFD + Zicsr + Zifencei. ImmediateLoader for 64-bit constant synthesis. Link/patch helpers. Copyright 2021 Igalia S.L. | Full for target ISA |
| `assembler/MacroAssemblerRISCV64.h` | 3,000+ | High-level MacroAssembler. Scalar integer and FP ops implemented. ~70+ vector methods are empty noop stubs via MACRO\_ASSEMBLER\_RISCV64\_TEMPLATED\_NOOP\_METHOD. rotateRight32/64 and countPopulation32/64 are noop stubs. supportsFloat16() returns false. supportsCountPopulation() returns false. | Scalar: full; SIMD/vector: fully stubbed |
| `assembler/MacroAssemblerRISCV64.cpp` | ~395 | probe() trampoline in `rv64gc` asm. Saves all 32 GPRs and 32 FPRs, calls executeJSCJITProbe, handles SP-modifying probes. | Full |
| `disassembler/RISCV64Disassembler.cpp` | ~465 | Custom (non-Capstone) disassembler. Covers RV32I/RV64I, Zifencei, M, A, F, D. No RVV. | Full for base ISA + IMFDA |
| `offlineasm/riscv64.rb` | ~950 | LLInt offlineasm backend. Integer, FP: implemented. Wasm atomics emit rv\_ebreak placeholders. SIMD ops emit rv\_ebreak with comment "WebAssembly placeholder for opcode X". | Scalar: functional; atomics/SIMD: ebreak stubs |
| `offlineasm/backends.rb` | 3 lines | RISCV64 registered in BACKENDS and WORKING\_BACKENDS arrays. | Full (registry only) |

### 4.2 Platform Detection and Feature Flag Files

`Source/WTF/wtf/PlatformCPU.h` detects RISC-V via `#if defined(__riscv) && defined(__riscv_xlen) && (__riscv_xlen == 64)`, defining `WTF_CPU_RISCV64 1` and `WTF_CPU_NEEDS_ALIGNED_ACCESS 1`.

`Source/JavaScriptCore/jit/GPRInfo.h` defines 8 argument GPRs (x10-x17), 11 callee-saves (regCS0-CS10), 13 JIT temporaries, and named special-purpose registers: returnValueGPR=x10, numberTag=x25, notCellMask=x26, JITData=x24.

`Source/JavaScriptCore/jit/FPRInfo.h` defines 18 FP temporaries, 8 argument FPRs (f10-f17), 12 callee-saves (f8, f9, f18-f27), returnValueFPR=f10.

### 4.3 ISA Profile Used

The implementation targets RV64IMFD + Zicsr + Zifencei only. Not used: RVV (all vector paths are stubs), Zba, Zbb, Zbc, Zbs, Zfh, C (compressed instructions -- Bug 238008 open). Bit manipulation operations that would use Zbb (clz, rotate, byteswap) are implemented as multi-instruction scalar sequences.

### 4.4 JIT Tier Status

| Tier | Build-time flag | Runtime state | Status |
|---|---|---|---|
| LLInt (bytecode interpreter) | ON | Active | Functional; 4 open PRs fixing offlineasm gaps |
| Baseline JIT | ON (ENABLE\_JIT=ON) | Active nominally | PR #64268 discussion states JIT "completely nonfunctional" as of May 2026 |
| DFG JIT | Not enabled | Disabled | No RISCV64 clause in ENABLE\_DFG\_JIT |
| FTL / B3 / Air | ON at build time | Forced OFF at runtime via Options.cpp: `useFTLJIT() = false` (Bug 239707) | B3/Air opcode table (AirOpcode.opcodes) has zero RISCV64 entries; B3 codegen absent |
| Wasm BBQJIT | `#undef ENABLE_WEBASSEMBLY_BBQJIT` / `#define ENABLE_WEBASSEMBLY_BBQJIT 0` in PlatformEnable.h | Build-disabled | PR #65621 enabling it open but unmerged as of June 2026 |
| Wasm OMGJIT | Build-disabled | Build-disabled | No RISCV64 implementation |
| Wasm SIMD / V128 | Guarded `#if CPU(X86_64) || CPU(ARM64)` | UNREACHABLE\_FOR\_PLATFORM() | Not implemented |
| Wasm IPInt | Guarded | RELEASE\_ASSERT\_NOT\_REACHED() with comment "IPInt only supports ARM64 and X86\_64 (for now)" | Not implemented |
| YARR JIT (regex) | Enabled | Active | Grouped with ARM64/x86\_64 in 64-bit path; arch-specific optimizations (ccmp folding, named register assignments) not present |
| Sampling profiler | ENABLE\_SAMPLING\_PROFILER OFF | Disabled | Explicitly disabled in cmake/WebKitFeatures.cmake |

The B3/Air gap is structurally critical. `b3/air/AirOpcode.opcodes` defines valid architecture keywords as: x86, x86\_32, x86\_64, arm, armv7, arm64. RISCV64 is entirely absent from this file. No RISCV64-specific Air opcodes exist. FTL cannot function without a B3/Air backend regardless of runtime flags.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Cross-Compilation System

The only documented build path for RISC-V is Yocto-based cross-compilation via the WPE port. No native riscv64 build host support is documented. No riscv64-specific Dockerfiles exist in the repository.

**Target configuration in `Tools/yocto/targets.conf`:**

```
[qemu-riscv64]
repo_manifest_path = riscv/manifest.xml
conf_bblayers_path = riscv/bblayers.conf
conf_local_path = riscv/local-qemu-riscv64.conf
image_basename = webkit-dev-ci-tools
image_types = tar.xz wic.xz wic.bmap
```

CMake flags set for qemu-riscv64 target: `-DENABLE_WPE_QT_API=OFF -DENABLE_DOCUMENTATION=OFF -DENABLE_INTROSPECTION=OFF -DENABLE_SPEECH_SYNTHESIS=OFF -DBWRAP_EXECUTABLE=/usr/bin/bwrap -DDBUS_PROXY_EXECUTABLE=/usr/bin/xdg-dbus-proxy -DUSE_VULKAN=OFF -DENABLE_SPELLCHECK=OFF`.

### 5.2 Build Commands

```
# One-time toolchain build (hours)
Tools/Scripts/cross-toolchain-helper --cross-target=qemu-riscv64 --build-toolchain

# Build WebKit WPE for riscv64
Tools/Scripts/build-webkit --wpe --release --cross-target=qemu-riscv64

# Enter cross-dev-shell for manual cmake/ninja
Tools/Scripts/cross-toolchain-helper --cross-target=qemu-riscv64 --cross-dev-shell
```

Build output directory: `WebKitBuild/WPE/Release_qemu-riscv64/`

### 5.3 Toolchain Requirements

- GCC minimum: **12.2.0** -- hard `FATAL_ERROR` in `Source/cmake/WebKitCommon.cmake`: "GCC 12.2 or newer is required to build WebKit."
- CMake minimum: **3.20**
- Swift: not applicable -- upstream Swift has no riscv64 target; `Tools/yocto/README.md` states: `qemu-riscv64 | no | gcc | upstream Swift has no riscv64 target`
- Clang: supported via the cross-toolchain-helper Clang improvements merged in PR #65885 (2026-05-28)

### 5.4 Yocto Layer Stack

From `Tools/yocto/riscv/manifest.xml` (scarthgap-based):

- poky (Yocto reference distro)
- meta-openembedded (meta-gnome, meta-multimedia, meta-networking, meta-oe, meta-perl, meta-python, meta-webserver)
- meta-riscv (github.com/riscv/meta-riscv)
- meta-webkit (github.com/Igalia/meta-webkit)

Machine: `qemuriscv64` (QEMU software emulation). Distro: `webkitdevci`. WPE backend: `wpebackend-fdo`.

### 5.5 CPU Detection

`Source/cmake/WebKitCommon.cmake`: `elseif (LOWERCASE_CMAKE_SYSTEM_PROCESSOR MATCHES "^riscv64")` sets `WTF_CPU_RISCV64 1`.

`Source/cmake/WebKitFeatures.cmake` riscv64 feature defaults:

```cmake
elseif (WTF_CPU_RISCV64)
    set(ENABLE_JIT_DEFAULT ON)
    set(ENABLE_FTL_DEFAULT ON)
    set(USE_SYSTEM_MALLOC_DEFAULT OFF)
    set(USE_MIMALLOC_DEFAULT ON)
    set(ENABLE_C_LOOP_DEFAULT OFF)
    set(ENABLE_SAMPLING_PROFILER_DEFAULT OFF)
```

Because `ENABLE_C_LOOP_DEFAULT OFF`, WebAssembly is enabled by default (`ENABLE_WEBASSEMBLY_DEFAULT ON`). This means the riscv64 CMake configuration targets a full-featured JIT build, not a reduced interpreter-only build -- but the runtime state contradicts this: B3/FTL are forced off, BBQJIT is build-disabled, and as of mid-2026 the JIT is described as nonfunctional.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | arm64 | amd64 | riscv64 |
|---|---|---|---|
| LLInt interpreter | Yes | Yes | Yes (with open fix PRs) |
| Baseline JIT | Yes | Yes | Nominally yes; PR #64268 states "completely nonfunctional" |
| DFG JIT | Yes | Yes | No |
| FTL / B3 / Air | Yes | Yes | No -- B3/Air backend absent; runtime-disabled |
| Wasm BBQJIT | Yes | Yes | No -- PR #65621 open, not merged |
| Wasm OMGJIT | Yes | Yes | No |
| Wasm SIMD / V128 | Yes | Yes | No -- UNREACHABLE\_FOR\_PLATFORM() |
| Wasm IPInt | Yes | Yes | No -- RELEASE\_ASSERT\_NOT\_REACHED() |
| YARR JIT | Yes (with ccmp optimizations) | Yes (with SSE) | Partial (64-bit path works; no arch-specific opts) |
| GdbJIT debug info | Yes | Yes | Yes -- merged 2026-05-13 |
| Sampling profiler | Yes | Yes | No -- explicitly disabled |
| SIMD in MacroAssembler | Yes | Yes | No -- all ~70 methods are empty noop stubs |
| Float16 | Yes | Yes | No -- supportsFloat16() returns false |
| Hardware popcount | Yes | Yes | No -- supportsCountPopulation() returns false |
| Hardware rotate | Yes | Yes | No -- noop stubs; emulated in offlineasm via shift+OR |
| Atomic memory ops in offlineasm | Yes | Yes | No -- emit rv\_ebreak placeholders |
| Compressed instructions (ISA-C) | N/A | N/A | Not implemented (Bug 238008 open) |
| Zbb/Zba extensions | N/A | N/A | Not used |
| Swift integration | Yes (macOS/iOS only) | Yes (macOS/iOS only) | No -- upstream Swift has no riscv64 target |
| Vulkan | Yes | Yes | No -- disabled in cross-build config |
| WPE Yocto cross-build | Yes | Yes | Yes (qemu-riscv64 target) |
| Native CI | Yes | Yes | No |
| Official binary packages | Yes | Yes | Debian unstable only (JIT-disabled) |

The structural gap is the absent B3/Air backend. This is not a matter of incomplete wiring or disabled flags -- the Air opcode file has no RISCV64 entries at all. Implementing B3/Air for RISC-V is a major engineering effort comparable to the original ARM64 B3 port.

---

## 7. CI/CD Infrastructure

**WebKit has no riscv64 CI of any kind.**

This was verified by examining:

1. `.github/` directory: contains only `CODEOWNERS` and `pull_request_template.md`. No `.github/workflows/` directory. No GitHub Actions workflow files exist in this repository.

2. WebKit's Buildbot CI (`build.webkit.org`) builder API (`/api/v2/builders?limit=500`) was enumerated. Non-x86 architecture builders present: JSCOnly-Linux-ARMv7-Thumb2-Release, JSCOnly-Linux-ARMv7-Thumb2-SoftFP-Release, JSCOnly-Linux-AArch64-Release, JSCOnly-Linux-MIPS32el-Release, WPE-Linux-ARM64-bit-Release-Debian-Stable-Build, WPE-Linux-ARM32-bit-Release-Debian-Stable-Build, WPE-Linux-RPi4 variants. No entry containing "riscv", "riscv64", "risc-v", or any variant.

3. EWS (Early Warning System, ews.webkit.org): No RISC-V queue is documented or visible. All open RISC-V PRs carry the `merging-blocked` label, indicating the Merge-Queue has not exercised any RISC-V builder.

4. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` found in the repository root.

The 99.88% Wasm pass rate reported in PR #65621 was obtained by the contributor running `JSTests/wasm.yaml` manually on their own StarFive VisionFive 2 board running OpenWrt. This is developer self-testing, not automated CI.

---

## 8. Distribution and Release Status

**Upstream WebKit/WebKit GitHub releases:** None. The releases page states "There aren't any releases here." WebKit is source-only on GitHub. No riscv64 binary assets exist from upstream.

**Debian unstable (sid):**
- Package: `libwebkit2gtk-4.1-0_2.52.4-1_riscv64.deb`
- Size: 22.6 MB
- SHA256: `02aa7c4f64da85859f16f5760db9b342d66b4eac11b2bd3e5eee24f980cb46a5`
- Status: Built and installed on build host `rv-osuosl-04`, approximately 16 days before report date
- Source: [buildd.debian.org webkit2gtk](https://buildd.debian.org/status/package.php?p=webkit2gtk&suite=sid)
- Caveat: This build uses --disable-jit (or equivalent). The JIT is nonfunctional on riscv64 as confirmed by PR #64268. The package compiles and installs but ships an interpreter-only JSC.

**Ubuntu 24.04 (Noble):**
- `libwebkitgtk-6.0-4` and related packages list riscv64 as a supported architecture
- Served via Ubuntu Ports (ports.ubuntu.com), not the main archive
- Source: [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=WebKit&suite=noble&searchon=names&section=all)

**PyPI:** No package named "webkit" exists on PyPI (HTTP 404). Not applicable.

**Arch Linux (official):** riscv64 is not a supported architecture. API query returns `{"valid": false, "results": []}` for riscv64. ArchPOWER (unofficial community port) reportedly carries webkit2gtk 2.46.6 [NEEDS VERIFICATION] but this is two major release cycles behind current 2.52.x and is flagged with known CVEs per Repology.

---

## 9. Dependencies

The following table covers dependencies of the WebKit GTK and WPE ports on riscv64. Apple-specific dependencies are excluded.

| Dependency | Role | riscv64 Build | riscv64 Binary Available | Blocking Issues |
|---|---|---|---|---|
| JavaScriptCore JIT (internal) | JS/Wasm JIT engine | Assembler files present; B3/FTL backend absent | N/A (internal) | JIT nonfunctional (PR #64268, Bug 239707); BBQJIT PR #65621 unmerged; B3/Air has zero riscv64 entries |
| mimalloc | Default heap allocator | Builds; SV39 fix merged Dec 2024 | Available in Debian | PRs #1296/#1299 (runtime VA detection via hwprobe) open mid-2026; mismatched MMU VA space causes segfaults across riscv64 systems; issue #640 (alignment warnings) open |
| ICU | Unicode, i18n | Builds; generic C++ | Available in Debian | No blocking issues |
| HarfBuzz | Text shaping | Builds; no RVV paths | Available in Debian | No blocking issues; scalar only |
| FreeType | Font rasterization | Builds; generic C | Available in Debian | No blocking issues |
| Cairo (GTK port) | 2D rasterization | Builds; no RVV pixman acceleration | Available in Debian | No riscv64 SIMD; scalar fallback only |
| libgcrypt | WebCrypto, TLS | Builds; riscv64-specific C files present for ChaCha20-RVV, GCM-Zbb/Zbc/Zvkg | Available in Debian (v1.12.2-1) | No blocking issues; hardware-accelerated paths require Zbb/Zbc/Zvkg |
| zlib (system) | HTTP compression | Builds; generic C | Available in Debian | No blocking issues; no RVV paths (unlike zlib-ng/cloudflare-zlib) |
| libjpeg-turbo | JPEG decoding | RVV SIMD merged Feb 2026 (3.1.90 / 3.2 beta1) | No: upstream maintainer declined riscv64 binary packages (issue #885); distros ship 3.0.x without RVV | GA 3.2 not yet released; no riscv64 CI; no official binaries |
| libpng | PNG decoding | Builds; RVV SIMD merged May 2025 (PR #666) | Available in Debian (v1.6.52+) | Correctness bugs post-merge: wrong RVV version targeting T-Head (issue #711); paeth3/paeth4 wrong pixels on SpacemiT K1 (issue #769, fixed ~v1.6.52); no automated riscv64 CI |
| libwebp | WebP decoding/encoding | Builds; generic C; no RVV paths | Available in Debian | No blocking issues; scalar fallback only |
| libavif (optional USE\_AVIF) | AVIF decoding | Builds; generic C | Available in Debian | No blocking issues |
| libjxl (optional USE\_JPEGXL) | JPEG XL codec | Builds; `-mrelax-all` clang fix merged Aug 2025 | Available in Debian | No open blocking issues |
| GStreamer | HTML5 media, WebRTC | Builds; generic C | Available in Debian | No riscv64 SIMD in core; plugin acceleration (dav1d, FFmpeg) depends on plugin selection |
| OpenSSL | DTLS/SRTP for WebRTC | Builds; riscv64 hardware crypto present (AES-Zkn, Zvk, ChaCha20-RVV, SHA512-RVV) | Available in Debian | No blocking issues |
| SQLite | IndexedDB storage | Builds; generic C | Available in Debian | No blocking issues |
| libxml2 | XML parsing | Builds; generic C | Available in Debian | No blocking issues |
| libsoup3 | HTTP networking | Builds; generic C | Available in Debian | No blocking issues |
| Epoxy | OpenGL function loading | Builds; generic C | Available in Debian | Depends on GPU driver availability |
| WOFF2 | Web font decompression | Builds; generic C++ | Available in Debian | No blocking issues |

**Priority summary for dependency issues:**

| Priority | Component | Issue |
|---|---|---|
| Critical | JSC JIT / B3 FTL | B3/FTL has no riscv64 codegen; BBQJIT PR unmerged |
| Critical | JSC offlineasm | 4 open PRs fixing missing opcode lowering (unmerged) |
| High | mimalloc | VA space detection PRs open; segfaults on heterogeneous riscv64 deployments |
| High | libjpeg-turbo | GA 3.2 unreleased; no upstream binary packages |
| Medium | libpng | Correctness bugs in RVV paths; requires v1.6.52+ |
| Low | HarfBuzz, Cairo, zlib, libwebp | No riscv64 SIMD; performance gap only |

---

## 10. Ecosystem Status

### 10.1 RISE Project

WebKit is not a RISE project member. The RISE blog (27 posts, May 2024 -- June 2026) contains zero WebKit references. The RISE wheel builder (80+ Python packages) does not include any WebKit package. No RISE RFP for WebKit exists in the public project listing. RISE members with potential WebKit interest: Google, ISCAS (hosts PLCT Lab, which contributes RISC-V MacroAssembler patches to WebKit).

### 10.2 Active Contributor Organizations (2024-2026)

| Organization | Role | Contributors |
|---|---|---|
| Igalia | WPE port steward, initial RISC-V author, Yocto infrastructure | Zan Dobersek, Carlos Lopez Perez, Adrian Perez de Castro |
| PLCT Lab / ISCAS | MacroAssembler gap-filling (2024) | trdthg (Mingzhu Yan) |
| OpenWrt | BBQJIT enablement (2026) | dangowrt (Daniel Golle) |
| openSUSE | Hardware testing, build failure reports | andreas-schwab |
| Apple | Code review, landing patches (no RISC-V code contribution) | Yusuke Suzuki (Constellation), Justin Michaud (justinmichaud) |

No semiconductor company is a named contributor to WebKit RISC-V work in the sources examined.

### 10.3 Hardware Used for Testing

The only documented hardware test platform is the **StarFive VisionFive 2** (SiFive U74, rv64gc, lp64d, 4 GiB DDR4, running OpenWrt). This was used by dangowrt for PR #65621. All other testing is QEMU-based via the Yocto qemu-riscv64 target.

---

## 11. Known Bugs and Active Issues

### 11.1 Open Pull Requests (all confirmed state=open, merged\_at=None as of 2026-06-21)

| PR | Title | Status | Blocking What |
|---|---|---|---|
| [#65648](https://github.com/WebKit/WebKit/pull/65648) | Fix AirArg FPImm64 validation for non-ARM64/X86\_64 builds | open, merging-blocked; approved by justinmichaud | B3/Air compile on riscv64 |
| [#65647](https://github.com/WebKit/WebKit/pull/65647) | Lower RISCV64 offlineasm sxb2p | open, merging-blocked | LLInt sign-extend correctness |
| [#65646](https://github.com/WebKit/WebKit/pull/65646) | Lower RISCV64 offlineasm transfer instructions | open | LLInt transfer ops |
| [#65645](https://github.com/WebKit/WebKit/pull/65645) | Allow RISCV64 offlineasm local labels for pcrtoaddr and call | open | LLInt label resolution |
| [#65621](https://github.com/WebKit/WebKit/pull/65621) | Enable WebAssembly BBQJIT on RISCV64 | open, merging-blocked | Wasm BBQJIT tier; latest failure 2026-05-29: transform.rb:636 "Unresolved 'IPIntCallCallee' at InPlaceInterpreter64.asm:512" |
| [#64894](https://github.com/WebKit/WebKit/pull/64894) | Add missing RISCV64 offlineasm register mappings | open, merging-blocked; approved by Constellation | LLInt FP register correctness; FP arg regs mapped as ft0-ft7 instead of fa0-fa7 |
| [#64268](https://github.com/WebKit/WebKit/pull/64268) | Fix build for RISC-V | open, no reviewer | Basic build without JIT |
| [#50226](https://github.com/WebKit/WebKit/pull/50226) | neon.h: Avoid -Wundef for SIMDE\_ARCH\_RISCV\_ZVFH | open, merging-blocked | Build warning on RISC-V ZVFH |
| [#42802](https://github.com/WebKit/WebKit/pull/42802) | Fix build errors on RISCV | open, merging-blocked; approved by xeenon | Missing include for std::error\_code |
| [#36459](https://github.com/WebKit/WebKit/pull/36459) | Add MacroAssemblerRISCV64 implementations for add8 | open | MacroAssembler completeness |
| [#36379](https://github.com/WebKit/WebKit/pull/36379) | Fix invalid application of sizeof to incomplete type in RISCV64 JSC | open, merging-blocked | C++ compile error |

### 11.2 Open Bugzilla Bugs

| Bug | Title | Filed | Type |
|---|---|---|---|
| [237775](https://bugs.webkit.org/show_bug.cgi?id=237775) | [JSC] RISC-V support in JavaScriptCore (meta) | 2022-03-11 | Meta tracking; B3/FTL sub-items open |
| [238006](https://bugs.webkit.org/show_bug.cgi?id=238006) | JSC RISCV64 support in B3/Air | 2022-03-24 | Missing optimizing compiler backend |
| [239707](https://bugs.webkit.org/show_bug.cgi?id=239707) | Enable FTL/B3/Air support for RISCV64 | 2022-05-01 | Missing highest JIT tier |
| [238008](https://bugs.webkit.org/show_bug.cgi?id=238008) | Support compressed instructions (C extension) | 2022-03-24 | Feature gap |
| [232373](https://bugs.webkit.org/show_bug.cgi?id=232373) | scratchRegister() is unsafe on RISCV64 | 2021-10-27 | Correctness / safety |
| [224134](https://bugs.webkit.org/show_bug.cgi?id=224134) | WebKitGTK constantly crashes on RISC-V 64 | 2021-08-21 | Crash; foundational |
| [254553](https://bugs.webkit.org/show_bug.cgi?id=254553) | WebAssembly build failure on RISCV64 | 2023-05-05 | Build |
| [276937](https://bugs.webkit.org/show_bug.cgi?id=276937) | Build failed for riscv64 | 2024-07-23 | Build |
| [279285](https://bugs.webkit.org/show_bug.cgi?id=279285) | SIGSEGV in IndexingHeader::preCapacity on RISC-V with GCC -O2 | 2025-09-18 | Potential miscompile; crash |
| [305745](https://bugs.webkit.org/show_bug.cgi?id=305745) | [GTK] Fails to build in riscv64: cannot tail-call (Skia, clang) | 2026-01-18 | GTK port build regression |
| [298377](https://bugs.webkit.org/show_bug.cgi?id=298377) | simde: Building on RISC-V with ISA RVA23S64 fails | 2025-09-11 | Newer RISC-V ISA profile breaks SIMDE |

### 11.3 NaN / Floating-Point Issues

No standalone NaN or floating-point correctness bugs are filed for riscv64 in Bugzilla or GitHub issues. One NaN correctness fix was found inside PR #65621 (commit `59838ed`: "Wasm: NaN-box f32 wasm args in JSToWasmEntryWrapperBuildFrame"): RISC-V hardware does not automatically canonicalize NaN payloads for 32-bit floats passed through the JS-to-Wasm entry wrapper. This is fixed within PR #65621, which is not yet merged.

---

## 12. Objections and Upstream Blockers

### 12.1 PR #65621 Dependency Chain

The BBQJIT enablement PR is the most significant pending change. Its current blocker state:

```
PR #64268 (Fix build, disable JIT) -- open since May 5, no reviewer
  |
  +-- PR #64894 (offlineasm register maps) -- approved by Constellation, EWS gated (unrelated iOS test failure)
  +-- PR #65645 (local labels in pcrtoaddr/call) -- LGTM from aoikonomopoulos, no formal reviewer
  +-- PR #65646 (transfer instructions) -- no review
  +-- PR #65647 (sxb2p sign-extend) -- LGTM from aoikonomopoulos, no formal reviewer
  +-- PR #65648 (AirArg u64 scope fix) -- approved by justinmichaud, EWS gated (unrelated Windows failure)
  |
  +-- PR #65621 (Enable BBQJIT) -- merging-blocked
        Latest failure 2026-05-29: transform.rb:636 Unresolved 'IPIntCallCallee'
        at InPlaceInterpreter64.asm:512.
        Reviewer justinmichaud has open questions on:
          - Calling convention design (why does rv act differently from arm64)
          - NaN-boxing approach for f32 wasm args
          - canTierUpToOMG return value
          - LLInt register naming (a0-7 vs t0-6 ABI names)
        Author (dangowrt): "My main goal was to get this working for myself (and OpenWrt
        downstream use). I don't have the resources to follow up and submit each commit
        individually."
```

### 12.2 Structural Concerns Raised by the Reviewer

Justin Michaud (Apple JSC reviewer) raised an architectural question in the PR #65621 review: "I am also wondering if we shouldn't just abandon the rv calling convention inside jit code... Take a look at how Windows uses the sysv convention as an example." This is an unresolved design question, not a minor fixup, and has not been addressed by the contributor.

### 12.3 Author Resource Constraint

The BBQJIT PR author explicitly stated he does not have resources to split the 32-commit PR into individual submissions. JSC reviewers prefer smaller, bisectable patches. This mismatch is a process-level blocker independent of technical correctness.

### 12.4 EWS Gatekeeping

Multiple approved RISC-V PRs (#64894, #65648) are blocked by unrelated pre-existing CI failures on Apple platforms. The EWS system does not differentiate between RISC-V-introduced regressions and pre-existing failures, so these PRs cannot proceed without either the pre-existing failures being fixed or Apple EWS bots being configured to ignore them for RISC-V patches.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The BBQJIT PR (#65621) represents 99.88% Wasm correctness on real hardware and is the most impactful near-term deliverable. Its technical issues are solvable but require sustained engagement with the reviewer (justinmichaud) on calling convention design. The IPIntCallCallee resolution failure in InPlaceInterpreter64.asm is a specific offlineasm lowering issue (76 `else error` arms need to become `else break` for RISCV64). The calling convention question could require a design document. Estimated work to merge #65621 and its prerequisites: 4-8 person-weeks of focused JSC contributor time.

B3/Air backend for FTL is a separate, much larger effort. The Air opcode table has zero RISCV64 entries. This is a months-long project (comparable effort to the original ARM64 B3 port), requiring deep JSC knowledge. No current contributor has started this work.

| Work Item | Estimated Effort | Current Status |
|---|---|---|
| Merge PR #65645-#65648 prerequisites | 1-2 person-weeks | Approved or LGTM; EWS gatekeeping only |
| Resolve BBQJIT PR #65621 calling-convention review + IPInt lowering | 3-6 person-weeks | Active review; author resource-constrained |
| Implement B3/Air RISCV64 backend (FTL prerequisite) | 20-40 person-weeks | Not started |
| Enable DFG JIT on RISCV64 | 4-8 person-weeks | Not started |
| Implement Wasm IPInt for RISCV64 | 4-8 person-weeks | Not started |

### 13.2 Performance Optimization

No performance benchmark data exists for WebKit on RISC-V. The FTL JIT is the primary driver of JavaScript performance on all supported platforms; it does not exist for RISC-V. Without FTL, WebKit on RISC-V runs JavaScript at Baseline JIT performance at best. Implementing the Zbb extension (clz, rotate, byteswap) and Zba (address generation) in MacroAssemblerRISCV64.h would be low-effort quality-of-life improvements (2-4 person-weeks) but would have minimal impact without FTL.

| Work Item | Estimated Effort | Expected Impact |
|---|---|---|
| Zbb/Zba extension use in MacroAssembler | 2-3 person-weeks | Minor (reduces instruction count in scalar JIT) |
| RVV in MacroAssembler SIMD stubs | 6-10 person-weeks | No impact until Wasm SIMD is wired (not started) |
| B3/Air backend (prerequisite for all FTL perf work) | 20-40 person-weeks | Critical -- enables all subsequent JS perf work |

### 13.3 CI/CD Infrastructure

No riscv64 CI exists. Adding a CI builder requires coordination with the WebKit infrastructure team (Apple-controlled). The EWS system is Buildbot-based and tightly managed. Community contributors cannot add CI builders unilaterally. A riscv64 CI bot would require: hardware (or QEMU), a builder registration in build.webkit.org config, and Apple infrastructure team agreement.

| Work Item | Estimated Effort | Blockers |
|---|---|---|
| Add riscv64 QEMU EWS builder | 4-8 person-weeks | Requires Apple infrastructure team agreement; QEMU riscv64 is slow for full JSC test suite |
| Add native riscv64 hardware CI bot | 6-12 person-weeks | Requires hardware procurement, hosting, Apple infrastructure agreement |

### 13.4 Ecosystem Enablement

Distribution binaries exist (Debian unstable, Ubuntu Noble) but are JIT-disabled. Once BBQJIT lands, distros will ship full-featured builds. No action needed here beyond upstreaming.

The mimalloc VA space detection issue (PRs #1296/#1299 in the mimalloc repository, unrelated to WebKit directly) is a potential source of riscv64-specific segfaults on heterogeneous hardware deployments and should be tracked.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Merge PR #65645-#65648 (offlineasm prerequisites) | 1-2 | riscv64 contributor with JSC commit rights | Critical |
| Functional | Resolve and merge BBQJIT PR #65621 (calling-convention design + IPInt lowering) | 3-6 | riscv64 contributor + justinmichaud engagement | Critical |
| Functional | Implement B3/Air RISCV64 backend (FTL prerequisite) | 20-40 | Senior JSC engineer with riscv64 expertise | High |
| Functional | Implement DFG JIT on RISCV64 | 4-8 | JSC contributor | High |
| Functional | Implement Wasm IPInt for RISCV64 | 4-8 | JSC contributor | Medium |
| Functional | Fix Bug 279285 (SIGSEGV with GCC -O2) | 1-3 | riscv64 + compiler expert | High |
| Functional | Fix Bug 305745 (GTK tail-call build failure, Skia/Clang) | 1-2 | WebKitGTK + Clang contributor | Medium |
| Performance | Zbb/Zba extension use in MacroAssembler | 2-3 | riscv64 contributor | Low |
| Performance | Wasm SIMD (after FTL and RVV MacroAssembler) | 6-10 | Senior JSC + RVV expert | Low (blocked on FTL) |
| CI/CD | Add riscv64 QEMU EWS builder | 4-8 | Contributor + Apple infra agreement | High |
| CI/CD | Add native riscv64 hardware CI bot | 6-12 | Contributor + hardware + Apple infra agreement | Medium |
| Ecosystem | Track mimalloc VA detection PRs (#1296/#1299) | 0 (monitor) | -- | High (watch item) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [bugs.webkit.org #237775 -- JSC RISC-V support (meta)](https://bugs.webkit.org/show_bug.cgi?id=237775)
- [bugs.webkit.org #238006 -- B3/Air RISCV64 support](https://bugs.webkit.org/show_bug.cgi?id=238006)
- [bugs.webkit.org #239707 -- Enable FTL/B3/Air for RISCV64](https://bugs.webkit.org/show_bug.cgi?id=239707)
- [bugs.webkit.org #228322 -- First commit: WTF\_CPU\_RISCV64](https://bugs.webkit.org/show_bug.cgi?id=228322)
- [bugs.webkit.org #224134 -- WebKitGTK crashes on RISC-V 64](https://bugs.webkit.org/show_bug.cgi?id=224134)
- [bugs.webkit.org #305745 -- GTK riscv64 tail-call build failure](https://bugs.webkit.org/show_bug.cgi?id=305745)
- [bugs.webkit.org #279285 -- SIGSEGV with GCC -O2 on RISC-V](https://bugs.webkit.org/show_bug.cgi?id=279285)
- [PR #65621 -- Enable WebAssembly BBQJIT on RISCV64](https://github.com/WebKit/WebKit/pull/65621)
- [PR #65648 -- Fix AirArg FPImm64 validation](https://github.com/WebKit/WebKit/pull/65648)
- [PR #65647 -- Lower RISCV64 offlineasm sxb2p](https://github.com/WebKit/WebKit/pull/65647)
- [PR #65646 -- Lower RISCV64 offlineasm transfer instructions](https://github.com/WebKit/WebKit/pull/65646)
- [PR #65645 -- Allow RISCV64 offlineasm local labels](https://github.com/WebKit/WebKit/pull/65645)
- [PR #64894 -- Add missing RISCV64 offlineasm register mappings](https://github.com/WebKit/WebKit/pull/64894)
- [PR #64268 -- Fix build for RISC-V](https://github.com/WebKit/WebKit/pull/64268)
- [PR #64755 -- Add RISCV64 support to GdbJIT ELF records](https://github.com/WebKit/WebKit/pull/64755)
- [PR #14732 -- WPE cross-toolchain-helper: Add RISCV64 target](https://github.com/WebKit/WebKit/pull/14732)
- [PR #4929 -- RISCV64 support for WebAssembly](https://github.com/WebKit/WebKit/pull/4929)
- [Debian buildd status: webkit2gtk](https://buildd.debian.org/status/package.php?p=webkit2gtk&suite=sid)
- [Ubuntu packages: WebKit Noble](https://packages.ubuntu.com/search?keywords=WebKit&suite=noble&searchon=names&section=all)
- [RISE project blog](https://riseproject.dev/blog)
- [WebKit homepage](https://webkit.org)
- [WebKit/WebKit GitHub repository](https://github.com/WebKit/WebKit)