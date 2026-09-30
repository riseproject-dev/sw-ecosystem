---
title: Chromium
parent: Project Reports
color: yellow
dependencies:
  - name: V8
    relation: runtime-dependency
    criticality: critical
  - name: FFmpeg
    relation: runtime-dependency
    criticality: critical
  - name: libjpeg-turbo
    relation: runtime-dependency
    criticality: critical
  - name: libpng
    relation: runtime-dependency
    criticality: critical
  - name: BoringSSL
    relation: runtime-dependency
    criticality: critical
  - name: Skia
    relation: runtime-dependency
    criticality: critical
  - name: ICU
    relation: runtime-dependency
    criticality: critical
  - name: HarfBuzz
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: critical
  - name: angle
    relation: runtime-dependency
    criticality: critical
  - name: dav1d
    relation: runtime-dependency
    criticality: critical
  - name: dawn
    relation: runtime-dependency
    criticality: optional
  - name: XNNPACK
    relation: runtime-dependency
    criticality: optional
  - name: SwiftShader
    relation: runtime-dependency
    criticality: optional
  - name: Highway
    relation: runtime-dependency
    criticality: optional
  - name: libpfm4
    relation: runtime-dependency
    criticality: optional
  - name: cpuinfo
    relation: runtime-dependency
    criticality: optional
  - name: pixman
    relation: runtime-dependency
    criticality: optional
  - name: Crashpad
    relation: runtime-dependency
    criticality: optional
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: optional
  - name: Ninja
    relation: build-dependency
    criticality: critical
  - name: GN
    relation: build-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="chromium" %}

# Chromium

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Chromium<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION]. Where sources directly contradict each other, both are cited and the discrepancy is noted.<br/>

## 1. Project Overview

Chromium is an open-source web browser project hosted at [chromium.googlesource.com/chromium/src](https://chromium.googlesource.com/chromium/src), using Gerrit for code review at [chromium-review.googlesource.com](https://chromium-review.googlesource.com), not GitHub. It is the upstream for Google Chrome, Microsoft Edge, and other Chromium-based browsers.

**Governance.** Chromium has no independent foundation of its own. Google retains direct control of the project. Governance is implemented file-by-file through the OWNERS file system: each directory carries an OWNERS file granting code-review/approval authority to specific individuals, a distributed-authority model rather than a formal board. In January 2025 the Linux Foundation launched a separate initiative, "Supporters of Chromium-Based Browsers," with a Technical Advisory Committee, whose founding/endorsing members are Google, Meta, Microsoft, and Opera. This initiative funds and organizes work around the Chromium ecosystem; it explicitly does not take over Chromium's own (Google-controlled) governance.

**License.** Google/Apple-authored code is 3-clause BSD. Because of Chromium's WebKit lineage it also bundles LGPL, MIT, MS-PL, and MPL-licensed third-party components.

**New-architecture policy.** Per `docs/new_port_policy.md` (content reconstructed from a search-index summary after a direct fetch 404'd this session - [NEEDS VERIFICATION] against the live file path): a new port or platform must be approved by project leadership before Chromium accepts patches for it; ports must represent a significant, ongoing investment in an established platform, not hobby/experimental code; new ports will not get bots on Google-run waterfalls, not even FYI bots; Chromium engineers are not expected to maintain new ports, the maintenance burden falls on the port's proponents; and contributors should reuse existing branches/ifdefs rather than introduce new abstractions. This policy is corroborated verbatim by the actual Gerrit review thread on the sandbox CL (Section 12.1): reviewer Robert Sesek cites "a formal policy around the acceptance of new CPU architectures" requiring explicit engineering-leadership approval, and reviewer Matthew Denton states Chromium "long ago decided that adding MIPS support to the sandbox introduced extra unnecessary maintenance burden, and since then we have declined to merge patches for loongarch64 and powerpc" - i.e., riscv64 is being evaluated against a standing precedent of rejecting new sandbox architectures, not as a one-off decision.

**Community stance.** The posture toward riscv64 is pragmatic/conservative rather than hostile: substantial riscv64 code has landed and is accepted upstream (the V8 JIT backend, Crashpad/mini_chromium plumbing, some browser-level base/ code), but it is driven almost entirely by external contributors (PLCT Lab/ISCAS, Meta, FutureWei, independent contributor Levi Zim/kxxt) rather than core Google engineering, and the single highest-leverage item - sandbox support - remains blocked specifically because no official riscv64 CI/builder infrastructure exists to back it, consistent with the new-port policy's "you build it, you maintain it" stance.

**RISE membership.** Google LLC is a Premier Member of RISE (RISC-V Software Ecosystem, a Linux Foundation Europe project). Chromium is not listed as a separate member entity; RISE membership is organizational, not per-project.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port originates in two efforts that converged over time.

**V8 RISC-V (2020-2022):** The V8 RISC-V port began around 2020 as an out-of-tree community effort, later formalized under the riscv-collab GitHub organization. Institutional drivers were PLCT Lab (Institute of Software / Institute of Computing Technology, Chinese Academy of Sciences), with Yahan Lu as lead maintainer and Ji Qiu as lead reviewer/CI operator. The riscv-collab/v8 repository shows a stable community snapshot dated August 19, 2021. The backend was subsequently upstreamed into mainline V8 through 2021-2022.

**Chromium build system (2021-2023):** RV64GC porting work for Chromium/ChromiumOS began around July 1, 2021, with plans to open-source it by the end of that month [NEEDS VERIFICATION: exact first-commit hash not retrievable via the tools used]. StarFive Technology's Rebecca Chang submitted an early corporate contribution, the "Add support for clang toolchain on riscv64" CL (Gerrit I7d71882a), around March 2022. `build/config/riscv.gni` was added March 2, 2023, by Yahan Lu (ISCAS/PLCT Lab).

**Current drivers:** As of 2024-2026, the primary driver of upstream Chromium riscv64 work is Levi Zim (kxxt), who also maintains the [riscv-forks/chromium-riscv](https://github.com/riscv-forks/chromium-riscv) community CI and has informally offered to act as riscv64 fixer-upper on the open sandbox CL, modeling the arrangement on how V8's RISC-V port is maintained (breakage fixed after the fact rather than gated upfront). Corporate maintainers named in connection with the riscv64 backend in V8 specifically include Peng Wu (Meta/Facebook), Brice Dobry (FutureWei), Ji Qiu (PLCT Lab/ISCAS), and Yahan Lu (PLCT Lab/ISCAS).

**Master tracking issue.** Chromium tracking issue [42050595, "RISC-V toolchain support"](https://issues.chromium.org/issues/42050595) exists (its comment thread requires Google sign-in and could not be read directly; retrieved via the tracker's unauthenticated JSON API). It is tagged `Tools>LLVM` and links 19 separate CLs across `chromium/src`, `chromium/tools/depot_tools`, and `chromium/third_party/ffmpeg` (6574317, 6574441, 6585073, 6595047, 6602743, 6603814, 6604313, 6603953, 6607216, 6629552, 6629553, 6635209, 6692951, 6633809, 6701609, 6703562, 6998812, 7509196, 8226185, 8235931), plus two access-restricted related issues (42050599, 42079370). This is the venue where Architecture Team Lead sign-off is discussed, referenced directly from CL 4935120's review thread.

**Key milestones:**

| Date | Event | Source |
|---|---|---|
| 2020-2021 | V8 RISC-V port initiated by PLCT Lab as out-of-tree fork | riscv-collab/v8 |
| Aug 2021 | riscv-collab/v8 stable community snapshot | riscv-collab/v8 |
| Mar 2022 | StarFive submits first Chromium riscv64 toolchain CL upstream | Gerrit I7d71882a |
| Mar 2023 | `build/config/riscv.gni` added by Yahan Lu | Chromium source |
| May-Aug 2023 | mini_chromium/Crashpad CLs [4558827](https://chromium-review.googlesource.com/c/chromium/mini_chromium/+/4558827) and [4735556](https://chromium-review.googlesource.com/c/chromium/mini_chromium/+/4735556) merged | Gerrit REST API |
| Sep 2023 | Debian bug [#1051998](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1051998) opened requesting riscv64 Chromium | Debian BTS |
| Oct 2023 | Sandbox CL [4935120](https://chromium-review.googlesource.com/c/chromium/src/+/4935120) filed, rejected same month by Robert Sesek citing policy - still open | Gerrit REST API |
| Nov 2023 (per one source) / May 2025 patch set 7 (per another source, contradictory) | FFmpeg integration CL [5054185](https://chromium-review.googlesource.com/c/chromium/third_party/ffmpeg/+/5054185) abandoned | Gerrit REST API (dates conflict between two fetches this session - flagged [NEEDS VERIFICATION]) |
| Sep 2024 | CL [5839530](https://chromium-review.googlesource.com/c/chromium/src/+/5839530) merged ("Use kPartitionCachelineSize instead of hardcoding 64" - a general PartitionAlloc cleanup, not a riscv64-specific fix as earlier characterized) | Gerrit REST API |
| Jun 2025 | Highway RVV disabled (CL 6583376) | Existing report / Gerrit |
| May 2025 | cpuinfo re-enabled for riscv64 Linux | Existing report |
| Jul 2025 | Clang runtime libraries built for riscv64 Linux | Existing report |
| Sep 2025 | dav1d RVV on Linux riscv64 enabled, tested on SpacemiT K1-X | Existing report |
| Jan 2026 | V8 CL [7498990](https://chromium-review.googlesource.com/c/v8/v8/+/7498990) merged, "[riscv] Skip pop simd128 in DeoptimizationEntry" (fixes a SIGILL on hardware without RVV; title differs from an earlier, incorrect characterization as an "RVV macro guard" CL) | Gerrit REST API |
| Apr 2026 | Zihintpause CPU yield merged (CL 7790544); V8 Zfa extension merged (CL 7768270) | Existing report |
| May 2026 | SwiftShader CL [75929](https://swiftshader-review.googlesource.com/c/SwiftShader/+/75929) ("Default to use llvm16") merged 2026-05-27; Highway RVV re-enabled (CL 7807959) | Gerrit REST API |
| Jun 2026 | SwiftShader CL 75929 reverted 12 days later as CL [77428](https://swiftshader-review.googlesource.com/c/SwiftShader/+/77428) (2026-06-08), for breaking the SwiftShader-to-Dawn roll; V8 ZFH simulator support merged (CL 7897892) | Gerrit REST API |
| Sep 2026 | Sandbox CL 4935120 still open, rebased 2026-09-23, Code-Review -1 unresolved | Gerrit REST API (verified live this session) |

The sandbox CL has been open since October 2023, nearly three years, and remains the gating item for a production-quality riscv64 Linux port.

---

## 3. Upstream Support Tier

Chromium does not define formal support tiers analogous to Rust or the Linux kernel. The de-facto status of riscv64 is: present in source for several subsystems (primarily V8), not officially supported, no general-purpose upstream Google-managed CI.

Specific indicators, confirmed by direct reads of the live LUCI Starlark configuration this session:

- `build/config/BUILDCONFIG.gn` does not list riscv64 in its CPU architecture lists (arm64, x86, x64, mips, mips64 are present; riscv64 is absent).
- `infra/config/subprojects/chromium/ci/chromium.linux.star`, `chromium.chromiumos.star`, `chromium.fyi.star`, and `chromium.android.fyi.star` contain zero riscv64 references - confirmed by direct file read, not inference.
- The only riscv64 CI that exists is four Cronet (Android networking library) builders, compile-and-size-check only (Section 7).
- The sandbox security layer (seccomp-BPF) has no riscv64 support, meaning any binary produced would run without the sandbox boundary - not a shippable Linux configuration.
- The riscv-collab V8 fork maintains "a stable branch that will always work for RISC-V" as a safety net against upstream breakage, a characteristic community response to an architecture lacking official CI coverage.
- The riscv64 sysroot targets Debian Trixie while every other architecture uses Debian Bullseye, because riscv64 was not supported in Bullseye.

| Architecture | Official CI | Official binary | Sandbox support | Build-target status |
|---|---|---|---|---|
| amd64 | Full (build + test + release) | Yes | Full | Primary tier-1 |
| arm64 | Full (build + test + release, Android/Linux/ChromeOS) | Yes | Full | Primary tier-1 |
| riscv64 | Partial (Cronet Android only, compile+size, no tests) | No | Missing | Unofficial, source-present |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 V8 JavaScript/WebAssembly Engine

V8 is the dominant body of riscv64-specific code in Chromium, spanning 85+ files across 10 directories in `src/`.

**Assembler and codegen (`src/codegen/riscv/`, 58 files):** A full assembler stack - base assembler, macro-assembler, constant pool, register definitions, reglist, CPU feature detection. Dedicated extension files cover A (atomics), B (bitmanip), C (compressed), D (double FP), F (float FP), M (multiply), V (vector/RVV), Zfa, Zfh, Zicond, Zicsr, Zifencei, Zimop. Both RV32 and RV64 are supported via `V8_TARGET_ARCH_RISCV32`/`V8_TARGET_ARCH_RISCV64` guards. The VectorUnit class handles RVV with configurable vlen (128/256/512/1024). No `UNIMPLEMENTED()` stubs were found in the core assembler.

In April 2026, Zfa support was added (CL 7768270, +2055 lines); review caught a correctness bug where a constants file used `static_cast<double>(FLT_MIN)` instead of `DBL_MIN` for an `imm5=1` case, values differing by approximately 270 orders of magnitude, fixed before merge (reviewer Ji Qiu).

**Compiler backend - TurboFan/Turboshaft (`src/compiler/backend/riscv/`, 7 files):** Separate instruction selectors for riscv32 and riscv64; full code generator with arithmetic, atomics, FP, write barriers, SIMD/RVV opcodes, Zbb/Zba instruction classes - structurally parallel to the arm64 and x64 backends.

**Builtins, Liftoff, Maglev, Sparkplug, simulator, regexp/deoptimizer/diagnostics:** All present (details unchanged from prior verification): Liftoff has one explicit `UNIMPLEMENTED()` (`kF32LoadF16`, half-precision float load); the simulator gained ZFH support in June 2026 (CL 7897892, +721 lines).

**Unaligned access (CL 7763908, merged 2026-04-17):** Removed approximately 770 lines of MIPS-inherited PartialUnaligned/NoUnaligned handling, standardizing on FullUnalignedAccessSupport - rationale from the reviewer: mainstream RISC-V cores handle misaligned access in hardware, and the SBI specification mandates firmware trap handling where it is not.

**Architectural improvements per the RISE blog post ["A Glimpse into V8 Development for RISC-V"](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/) (2025-12-09), the only RISE content specifically covering this subsystem:**

- The RISC-V port of V8 is described as "mostly at feature parity with the officially supported architectures like x86_64 and ARM64."
- Constant pool architecture redesigned using larger (32-bit) offsets, with groundwork for moving constant pools to non-executable memory; emission moved from inline (during codegen) to end-of-generation, simplifying MIPS-inherited complexity.
- A WebAssembly jump-table race condition was fixed: a two-instruction patch sequence that could execute the first instruction before the second was written was replaced with an atomic memory-load approach (`auipc t6, 0` / `ld t6, 16(t6)` / `jalr x0, t6`, plus a stored target; short-distance targets use `jal x0 <imm21>`), so "the CPU cannot see half-updated instructions anymore."
- `sh3add` cuts load-related instruction sequences roughly in half; `zext.w` reduces pointer-decompression overhead "from 5 instructions to 2."
- Vector support extended beyond 128-bit to 256/512-bit; real-hardware testing (not the simulator) surfaced a bug in save/restore of vector registers around C++ calls, whose fix enabled running the full JetStream benchmark suite (~33 MB Wasm bytecode, ~2M lines JS). No numeric JetStream score is published in this post.
- RISC-V 32-bit support is slated for possible removal after May 2026.

**Instruction scheduler:** [NEEDS VERIFICATION] Scheduling latencies in the RISC-V backend are reported (no correction CL identified) to have been copied from the MIPS port and to be incorrect for all real RISC-V cores - a documented, unresolved performance gap.

### 4.2 Chromium base/

`base/synchronization/lock_subtle.h` gained Zihintpause `pause`-instruction support for CPU yield (CL 7790544, merged 2026-04-27, +7/-2 lines), encoded as a hint NOP for backward compatibility on hardware lacking Zihintpause. `base/cpu.cc`/`base/cpu.h` have no riscv64 sections; CPU feature detection covers only x86 (CPUID) and ARM (auxval).

### 4.3 Sandbox

The critical gap. `sandbox/linux/system_headers/linux_syscalls.h`, `sandbox/linux/system_headers/linux_seccomp.h`, `sandbox/linux/seccomp-bpf-helpers/baseline_policy.cc`, and `sandbox/linux/seccomp-bpf-helpers/syscall_parameters_restrictions.cc` were confirmed this session, via live fetch, to have zero riscv64/`__riscv` handling; `seccomp_macros.h` ends with `#error Unsupported target platform` for anything outside i386/x86_64/arm/mips/aarch64. CL [4935120](https://chromium-review.googlesource.com/c/chromium/src/+/4935120) addresses this: filed 2023-10-13, 15 patch sets, last rebased 2026-09-23, sustained Code-Review -1 from Robert Sesek. See Section 12.1 for the full substance of the review thread. Without this CL, Chromium cannot run sandboxed on riscv64 Linux.

### 4.4 Skia (2D graphics)

Skia builds on riscv64 via generic scalar paths only. There is no `SkCpu.cpp` riscv64 CPU feature detection (returns 0 on riscv64) and no `SkOpts_riscv64.cpp` SIMD file (LoongArch has a dedicated file; riscv64 does not). All rasterization, blending, and text rendering runs scalar. One downstream data point: `SkiaSharp` is reported to have added riscv64/RV64 targets, suggesting build-level (not necessarily SIMD-level) riscv64 support exists upstream in some form - [NEEDS VERIFICATION], not independently confirmed against Skia's own source this run.

### 4.5 SwiftShader (software Vulkan)

SwiftShader's riscv64 JIT path requires LLVM 16 (LLVM 10, the default at the time, has no usable RISC-V codegen). CL [75929](https://swiftshader-review.googlesource.com/c/SwiftShader/+/75929) ("Default to use llvm16") merged 2026-05-27, then was reverted 12 days later as CL [77428](https://swiftshader-review.googlesource.com/c/SwiftShader/+/77428) (2026-06-08) because it broke the SwiftShader-to-Dawn roll (`undefined symbol: llvm::MCSymbolizer::~MCSymbolizer`). Net effect: SwiftShader is currently back on LLVM 10 and still cannot JIT-compile for riscv64. Separately, the existing project report's claim that SwiftShader's `CMakeLists.txt` architecture-detection block has no riscv64 case (covering arm/aarch64/mips/mips64/ppc64le/loongarch64/x86/x86_64 only, falling through to the x86_64 default on a riscv64 host) could not be re-verified this session (the file fetch returned 404) and is carried forward unconfirmed rather than re-asserted as newly checked. The consequence either way: WebGL and WebGPU have no working software fallback on riscv64 systems without a hardware Vulkan GPU driver.

### 4.6 ANGLE (WebGL) and Dawn (WebGPU)

Both build via generic UNIX paths; no riscv64-specific build conditions or CI were identified for either component in this or prior research. Functionality depends entirely on available GPU drivers on riscv64 hardware. Neither is separately packaged for riscv64 in Ubuntu (both vendored-only).

### 4.7 BoringSSL

No riscv64-specific assembly or CPU detection is present in `crypto/`; there is no `cpu_riscv*.cc` file. All TLS crypto operations fall back to portable C, a performance gap relative to OpenSSL-based stacks with full riscv64 hardware crypto (AES-Zkn, Zvk vector crypto, ChaCha20 RVV, SHA512 RVV, Montgomery multiply). A chromium-dev mailing-list thread ("Porting for riscv64") and a chromium-bugs issue ("Can't compile shared library of BoringSSL") indicate riscv64-related build friction has been reported historically - [NEEDS VERIFICATION], exact date/resolution not confirmed this run. Only an Android-fork variant (`android-platform-external-boringssl`) is packaged for riscv64 in Ubuntu; upstream BoringSSL itself has no standalone distro release (it is statically vendored by Chromium).

---

## 5. Build System, Cross-Compilation, and Toolchain

Chromium uses GN + Ninja, not CMake and not `./configure`. No Dockerfile for riscv64 exists anywhere in the upstream tree, confirmed by a live re-check this session; the community reference build guide (kxxt.dev) also uses no Docker, relying on `debootstrap` + `systemd-nspawn` instead. The `riscv-forks/chromium-riscv` CI repo's visible file listing (`.github/`, `tests/`, `README.md`) also shows no Dockerfile.

### 5.1 GN Architecture Configuration

`build/config/riscv.gni`:

| Flag | Default | Description |
|---|---|---|
| `riscv_use_rvv` | false | RVV (RISC-V Vector Extension) |
| `riscv_rvv_vlen` | 128 | Simulator VLEN: 128/256/512/1024 |
| `riscv_profile` | "rv64gc" | "rv64gc" or "rvau22" |
| `riscv_use_zba` / `zbb` / `zbs` | false | Bitmanip extensions |
| `riscv_use_zicfiss` | false | Zicfiss shadow stack |
| `riscv_use_zicond` | false | Zicond |
| `riscv_use_sv39` | false | SV39/Svpbmt page-based memory |
| `riscv_code_alignment` | 32 | Code alignment (bytes) |
| `riscv_constant_pool_alignment` | 8 | Constant pool alignment |

`build/config/BUILDCONFIG.gn` does not list riscv64 in its CPU architecture enumeration.

### 5.2 Minimal and Practical Build Commands

Official minimal sequence (will not produce a working sandboxed build):

```
python3 build/linux/sysroot_scripts/install-sysroot.py --arch=riscv64
gn gen out/riscv64 --args='target_cpu="riscv64" use_sysroot=true'
autoninja -C out/riscv64 chrome
```

Practical working configuration, from kxxt's 2026 "Cross compile mainline Chromium for RISC-V from scratch" guide, the closest thing to real riscv64 build documentation that exists:

```
gn gen "out/Release-riscv64" --args='
  is_official_build=true
  is_debug=false
  target_cpu="riscv64"
  treat_warnings_as_errors=false
  chrome_pgo_phase=0
  use_debug_fission=false
  symbol_level=1'

autoninja -C out/Release-riscv64 chrome
autoninja -C out/Release-riscv64 chrome.stripped
```

Non-default flags and why: `treat_warnings_as_errors=false` because the riscv64 port currently emits warnings that would otherwise fail the build; `use_debug_fission=false` because `-gsplit-dwarf` is incompatible with RISC-V linker relaxation (`-mrelax`); `chrome_pgo_phase=0` because PGO profiles only exist for x86-64. Already excluded by upstream `build/config/compiler/BUILD.gn` for riscv64 (confirmed live, shared with s390x/ppc64/mips/mips64/loong64): `_FORTIFY_SOURCE`. CET Shadow Stack, HWASan, CFI, and MSan are gated to other architectures and end up off on riscv64 as a side effect of architecture-exclusion conditionals, not explicit toggles.

Three patches must still be cherry-picked manually (none are merged/default):

```
# Sandbox (CL 4935120, still open/blocked)
git fetch https://chromium.googlesource.com/chromium/src refs/changes/20/4935120/11 && git cherry-pick FETCH_HEAD

# SwiftShader - bumps bundled LLVM from 10 to 16 (later reverted upstream, see Section 4.5)
git -C third_party/swiftshader fetch https://swiftshader.googlesource.com/SwiftShader refs/changes/29/75929/2 && git -C third_party/swiftshader cherry-pick FETCH_HEAD

# V8 RVV/deopt crash fix
git -C v8 fetch https://chromium.googlesource.com/v8/v8 refs/changes/90/7498990/9 && git -C v8 cherry-pick FETCH_HEAD
```

### 5.3 Toolchain

Clang is the only officially supported compiler (`docs/toolchain_support.md`, confirmed live; riscv64 is not mentioned there at all - only arm/arm64/x86/x64 carry the toolchain team's CI guarantee). GCC is community-patched-in only; as of Chrome M138, even GCC builds require libc++. `tools/clang/scripts/update.py` does not ship a prebuilt riscv64 host Clang binary. Three GN toolchain entries exist in `build/toolchain/linux/BUILD.gn`: `clang_riscv64` (native Clang, `--target=riscv64-linux-gnu`, `-mabi=lp64d`), `gcc_toolchain("riscv64")` (native GCC, prefix `riscv64-linux-gnu`, used only for the sysroot/cross package), and `clang_x64_v8_riscv64` (x64 host targeting riscv64, for V8 simulator builds only).

The riscv64 sysroot targets Debian Trixie (SHA256 `2df6a2698a25258871b45a50d8b5079947b1ad1c63920c944690dfc2a71aab51`); every other architecture uses Debian Bullseye, because riscv64 was unsupported in Bullseye. `sys/hwprobe.h` is patched out of the riscv64 sysroot because it requires glibc >= 2.40, while Chromium's sysroot targets glibc 2.26 minimum.

Rust >= 1.78.0 is required for split-debuginfo fixes on riscv64 (Rust PR #120518), and Rust >= 1.79.0 for cross-language LTO with the lp64d ABI (Rust PR #123612).

### 5.4 QEMU

No QEMU configuration exists in any upstream Chromium build file (confirmed live this session). QEMU appears only in community practice, for cross-compilation chroot setup (`qemu-user` + `binfmt_misc`/`systemd-nspawn`/`debootstrap` to install riscv64 packages into an x86-host sysroot) - not to run Chromium. Sources state explicitly that "qemu user-mode emulation cannot run Chromium"; the compiled binary must be tested on real hardware. A full build under `qemu-user` emulation on an AMD 5950X takes approximately 2.6 days; a native build on a 64-core SG2042 RISC-V server is faster but has reported "quirks or even system instability" ([revyos/revyos#27](https://github.com/revyos/revyos/issues/27)). There is no QEMU-based CI runner for the browser; the four official LUCI riscv64 builders run on x86-64 hosts with zero device/emulator testing.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | riscv64 status | arm64 status | Parity? |
|---|---|---|---|
| V8 assembler/codegen | Full, hand-tuned | Full, hand-tuned | Yes |
| V8 Liftoff WASM JIT | Full (one `UNIMPLEMENTED`: kF32LoadF16) | Full | Near |
| V8 Maglev / TurboFan / Turboshaft / builtins / simulator | Full | Full | Yes |
| Sandbox (seccomp-BPF) | Missing (CL 4935120 blocked) | Full | No |
| CPU feature detection (base/) | None | Full | No |
| Skia SIMD opts | None (scalar only) | Full (NEON) | No |
| BoringSSL hw crypto | None (scalar only) | Full (AES-CE, SHA) | No |
| SwiftShader (software Vulkan) | Broken (LLVM16 patch merged then reverted) | Full | No |
| zlib SIMD (Chromium fork) | None (scalar only) | Full (NEON) | No |
| `_FORTIFY_SOURCE` | Disabled | Enabled | No |
| CFI sanitizer | Disabled | Disabled (Linux) | Equal |
| HWASan | Disabled | Enabled (Android) | No (Android) |
| Highway RVV | Enabled (re-enabled May 2026 after a temporary disable) | Full NEON | Near |
| Cronet Android CI | 4 builders (compile+size only) | Full CI | No |
| Linux/ChromeOS browser CI | None | Full | No |

The V8 subsystem is at near-parity with arm64/x86-64. Every other subsystem examined has a significant gap, and the sandbox gap is the most consequential because it blocks any production Linux deployment.

---

## 7. CI/CD Infrastructure

### 7.1 Official Chromium CI

Verified this session by directly reading the live Starlark builder-definition files at `chromium.googlesource.com/chromium/src` (not inferred from blog posts or Gerrit CLs):

| File | riscv64 present? |
|---|---|
| `infra/config/subprojects/chromium/ci/chromium.android.star` | Yes - `android-cronet-riscv64-dbg`, `android-cronet-riscv64-rel` |
| `infra/config/subprojects/chromium/try/tryserver.chromium.android.star` | Yes - mirrored try builders |
| `infra/config/subprojects/chromium/ci/chromium.linux.star` | No |
| `infra/config/subprojects/chromium/ci/chromium.chromiumos.star` | No |
| `infra/config/subprojects/chromium/ci/chromium.fyi.star` | No |
| `infra/config/subprojects/chromium/ci/chromium.android.fyi.star` | No |

All four riscv64 builders (2 CI + 2 mirrored try) are scoped to Cronet only (the Android networking library), described as "Verifies building Cronet against RISC-V64," contact `cronet-sheriff@google.com` (CI) / `cronet-team@google.com` (try). GN args for the release builder: `target_cpu="riscv64"`, `target_os="android"`, `is_cronet_build=true`, `is_official_build=true`, `is_component_build=false`. Build targets: `cronet_package`, `cronet_sample_test_apk`, and five additional Cronet test APK/binary targets. Test scripts run on x86-64 Ubuntu-22.04 hosts; the builders perform compile-and-size measurement only, no physical or emulated riscv64 Android device testing. No riscv64 entry appears in `infra/config/generated/cq-builders.md` (the human-facing required/optional/experimental CQ list); these are default-CI-only, not CQ-required. `infra/config/generated/cq-builders.md` and `cr-buildbucket.cfg` were also checked but not relied on as the primary evidence given the direct `.star` reads above.

There is no Linux riscv64 CI builder, no ChromiumOS riscv64 CI builder, and no full-browser riscv64 CI builder anywhere in upstream Chromium.

### 7.2 V8 Official CI

Three LUCI simulator builders (`v8_linux64_rel_ng`/`dbg` and a pointer-compression variant) run on x86-64 hosts using the `clang_x64_v8_riscv64` simulator build - not native riscv64 hardware.

### 7.3 PLCT Lab Independent CI (ci.rvperf.org)

Jobs and status as of the most recent research pass:

| Job | Status |
|---|---|
| v8-upstream-master-fastcheck-riscv64 | Passing |
| v8-upstream-master-pointer-compression-riscv64 | Passing |
| v8-upstream-master-vlen128-riscv64 | Passing |
| v8-upstream-master-vlen256-riscv64 | Passing |
| v8-upstream-master-sandbox-riscv64 | Intermittent (build #219, ~1 month stale) |
| v8-upstream-master-riscv64-jetstream | Continuously failing (~6 months, last build #116) |
| v8-upstream-master-riscv32 (full) | Continuously failing (~6 months, build #2594) |
| v8-upstream-master-fastcheck-riscv32 | Continuously failing (~6 months, build #36614) |

With JetStream failing for roughly 6 months (last run build #271, failed), no current V8 riscv64 benchmark scores are being generated from this pipeline.

### 7.4 Community CI (riscv-forks/chromium-riscv)

Maintained by Levi Zim (kxxt), runs weekly full-browser Chromium builds on native riscv64 runners (hardware labeled `rvv-incapable`). Latest release confirmed: 149.0.7827.155 (June 17, 2026), 15 total releases. Tests executed: `base_unittests`, `cc_unittests`, `net_unittests`, V8 cctest (Debug and Release). Wasm SIMD tests are excluded ("not supported on this hardware"); OOM-allocation-test handlers are not triggered; `JumpTablePatchingStress` is excluded for a known flaky failure on SG2042 hardware [NEEDS VERIFICATION on root cause]. No sandbox testing is performed, consistent with the sandbox CL being unmerged.

Three open issues in this repo as of the most recent check, with primary-source detail:

- [Issue #32](https://github.com/riscv-forks/chromium-riscv/issues/32) - "[Regression] SocketPoolAdditionalCapacityTest.TestDefaultDistributionForFieldTrialConfig timeout," opened 2026-05-03. Test times out in multi-threaded CI (passes standalone, ~225s single-threaded); traced to commit `e61c77ee6b927f9a736fc7b50680ba1da9631606` on main; temporarily skipped, no comments, still open.
- [Issue #31](https://github.com/riscv-forks/chromium-riscv/issues/31) - "[Regression] LapTimer.ThreadTicksUsageExample failure," opened 2026-05-03, caught in PR #30's CI. Three assertion failures in `base/timer/lap_timer_unittest.cc` (laps/sec 178.75 vs expected >1000; time/lap 5.594ms vs expected <1.0ms; 10 laps recorded vs expected >20), consistent with a ThreadTicks/clock-resolution issue specific to riscv64 hardware. Confirmed reproducible, not flaky. Open.
- [Issue #25](https://github.com/riscv-forks/chromium-riscv/issues/25) - "Video Decoding Support with Chromium for RISC-V64 Systems," opened 2026-04-09. Reports video decode falling back to software on riscv64; asks about hardware-acceleration plans (mentions V4L2). Open, unassigned.

### 7.5 Comparison

| Architecture | Official Google CI | Independent CI | On-device/native testing | Sandbox tested |
|---|---|---|---|---|
| amd64 | Full | - | Yes | Yes |
| arm64 | Full (Android, Linux, ChromeOS) | - | Yes | Yes |
| riscv64 | Cronet-only, compile+size (4 builders) | PLCT Jenkins (V8 only), kxxt community GH-Actions-style builds (full browser, weekly, native hardware) | No (official); partial unit tests only (community) | No |

---

## 8. Distribution and Release Status

No official riscv64 binary for Chromium exists in any channel checked.

| Channel | riscv64 binary available? | Evidence |
|---|---|---|
| Chromium upstream | No | Sandbox CL 4935120 open 2.5+ years, Code-Review -1; upstream does not ship non-sandboxed builds |
| Ubuntu 26.04 (resolute) | No | Exact-name search for `chromium` in resolute returns 0 results. Substring search returns 7 hits, none the browser: `chromium-browser`/`chromium-browser-l10n`/`chromium-chromedriver`/`chromium-codecs-ffmpeg(-extra)` are transitional packages redirecting to the Chromium snap (metadata-only, no architecture list); `chromium-bsu`/`chromium-bsu-data` is an unrelated game (which does list riscv64); `webext-vimium-chromium`, `webext-indie-wiki-buddy-chromium`, `node-electron-to-chromium` are unrelated extensions/data files. The actual browser is distributed only as a snap, and Canonical's riscv64 snap channel status could not be determined from archive.ubuntu.com (snaps are outside that index) |
| Debian sid | No | Bug [#1051998](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1051998) open since September 2023, wishlist priority, tags `ftbfs`/`patch`; patch set touches FFmpeg, Sandbox, V8, dav1d, ANGLE, base - the same blockers found upstream. By Feb 2024, ANGLE and base support had landed; sandbox and FFmpeg remained blocked pending ATL approval, unchanged as of this report |
| Arch Linux RISC-V | Contradictory evidence | The existing report's claim (version delta 148->149, tagged "Outdated FTBFS Logs"/"patched", `DEP BROKEN` on java-runtime-headless/python, `DEP OUTDATED` on mesa/fontconfig/pipewire/npm) could not be reproduced this session: a live fetch of `archriscv.felixc.at/?q=chromium` found zero occurrences of the word "chromium" anywhere in the page content. This may reflect a JS-rendered search UI that a static fetch cannot execute, or the package listing may have changed; flagged [NEEDS VERIFICATION], the discrepancy is unresolved |
| PyPI `chromium` | No | The PyPI package literally named `chromium` is an unrelated hobby/placeholder project (version 0.0.0, default cookiecutter description, pure-Python wheel/sdist only, no architecture-specific files). Chromium the browser is not a PyPI-distributed project |
| RISE wheel builder (GitLab PyPI mirror) | N/A | Redirects to plain PyPI for the `chromium` name; not applicable, since Chromium is not Python-packaged |
| Alpine (aports) | No | MR [!40613](https://gitlab.alpinelinux.org/alpine/aports/-/merge_requests/40613), draft, last touched 2022-11-29, unmerged |
| Community builds | Functional, unofficial | [riscv-forks/chromium-riscv](https://github.com/riscv-forks/chromium-riscv), weekly, 15 releases, latest 149.0.7827.155 (June 2026); StarFive's [chromium.src](https://github.com/starfive-tech/chromium.src) out-of-tree port; historically also openSUSE, FydeOS `chromium_os-riscv64`, and openEuler builds (Chromium 100/103 on Unmatched hardware, XFCE, built on openSUSE/StarFive optimizations to ANGLE/breakpad/dav1d/FFmpeg) |

A user wanting a working riscv64 Chromium today must either build from source with the three manual cherry-picks in Section 5.2 (running unsandboxed, `--no-sandbox --use-gl=egl`, as documented in the Debian bug) or use a third-party community build such as riscv-forks/chromium-riscv, which is explicitly built without the sandbox.

---

## 9. Dependencies

### 9.1 Summary table

Includes every dependency named for this project plus additional dependencies identified via Chromium's `DEPS`/`BUILD.gn` during this research pass (graph database queries were unavailable this session due to an MCP connection failure; Ubuntu package presence below is sourced via WebSearch/curl fallback against packages.ubuntu.com after repeated direct-fetch 503s, and is flagged accordingly).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| V8 | runtime, critical | Full, hand-tuned JIT backend | Community CI passing (core), JetStream CI failing ~6mo | No standalone binary | Near feature-parity per RISE; see 9.2 |
| FFmpeg | runtime, critical | Upstream FFmpeg project has active riscv64 port; Chromium's own integration CL abandoned but reported superseded | Not confirmed | Ubuntu universe binary (`ffmpeg` 7:8.0.1-3ubuntu2) [NEEDS VERIFICATION, WebSearch-sourced] | See 9.3 |
| libjpeg-turbo | runtime, critical | RVV SIMD merged Feb 2026 (3.2 beta1) | Not confirmed (no dedicated riscv64 CI) | Ubuntu (`libjpeg-turbo8` 2.1.5-4ubuntu4) [NEEDS VERIFICATION] | Maintainer declined official riscv64 binaries (issue #885) |
| libpng | runtime, critical | RVV SIMD merged May 2025, corrected through 1.6.52 | Not confirmed | Ubuntu (`libpng16-16t64` 1.6.54-1) [NEEDS VERIFICATION] | Multiple post-merge correctness bugs found via hardware bug reports |
| BoringSSL | runtime, critical | No riscv64 code, scalar-only | Not confirmed | No standalone release (vendored) | Android-fork variant only in Ubuntu; build-friction reports [NEEDS VERIFICATION] |
| Skia | runtime, critical | No riscv64 SIMD (scalar); downstream SkiaSharp adds riscv64 targets [NEEDS VERIFICATION] | Not confirmed | No standalone release (vendored) | See 9.5 |
| ICU | runtime, critical | Architecture-agnostic C++, builds on riscv64 | Not confirmed | Ubuntu (`libicu-dev` 78.2-2ubuntu1) [NEEDS VERIFICATION] | No riscv64-specific issues |
| HarfBuzz | runtime, critical | Architecture-agnostic, builds on riscv64 | Not confirmed | Ubuntu (`libharfbuzz0b` 12.3.2-2) [NEEDS VERIFICATION] | No riscv64-specific issues |
| zlib | runtime, critical | Chromium's fork has `cpu_features.c` but no riscv64 SIMD files, scalar only; `vclmul` detection marked TODO | Not confirmed | Ubuntu (`zlib1g` 1:1.3.dfsg+really1.3.1-1ubuntu2) for standalone zlib, not Chromium's fork [NEEDS VERIFICATION] | Only x86/ARM have SIMD paths |
| angle | runtime, critical | No riscv64-specific build conditions; depends on GPU drivers | Not confirmed | No distro package (vendored-only) | See 4.6 |
| dav1d | runtime, critical | RVV enabled on Linux riscv64, Sep 2025, tested on SpacemiT K1-X | Not confirmed | No standalone Ubuntu package confirmed this run | Named explicitly in Debian bug #1051998's patch set |
| dawn | runtime, optional | No riscv64-specific build conditions; depends on GPU drivers | Not confirmed | No distro package (vendored-only) | See 4.6 |
| XNNPACK | runtime, optional | riscv64 port since June 2022, 300+ kernel files, RVV for GEMM/depthwise conv/vbinary/QS8/QU8/maxpool/reduce | GitHub Actions CI on QEMU per PR; operator tests excluded | No standalone release | Open: `RISCV_HWPROBE_EXT_ZVFH` macro missing under Clang 19.1 (PR #9903, partial fix Mar 2026); F32-RSUM RVV disabled for multi-thread correctness bug (PR #6450, open); Zvfh enabled unconditionally Jan 2026, a regression on hardware lacking Zvfh |
| SwiftShader | runtime, optional | Broken - LLVM16 bump merged then reverted (Section 4.5); possible separate CMakeLists arch-detection gap, unconfirmed this session | Not confirmed | No distro package | Blocks WebGL/WebGPU software fallback on riscv64 |
| Highway | runtime, optional | RVV disabled Jun 2025 ("uncommon with most riscv chips"), re-enabled May 2026 | Not confirmed | No standalone release (vendored) | Re-enable required manual review (Rubber Stamper bot declined auto-approve, >14-day window) |
| libpfm4 | runtime, optional | No RISC-V PMU event tables (only AMD/Intel/ARM/IBM Cell) | N/A | N/A | Blocks V8 and Chromium hardware performance-counter profiling on riscv64; no in-progress upstream work identified |
| cpuinfo | runtime, optional | Re-enabled for riscv64 Linux, May 2025 | Data not available: not independently researched beyond this milestone | Data not available | No further detail found this run |
| pixman | runtime, optional | RGB565->RGB888 conversion RVV path reported ~10x speedup vs scalar (Samsung SRPOL) | Data not available | Data not available | Part of Samsung's stated RVV-optimization target list alongside FFmpeg/V8/libpng/libjpeg-turbo |
| Crashpad | runtime, optional | mini_chromium CLs [4558827](https://chromium-review.googlesource.com/c/chromium/mini_chromium/+/4558827) ("Add RISCV64 support") and [4735556](https://chromium-review.googlesource.com/c/chromium/mini_chromium/+/4735556) ("[riscv][android] Add Android RISC-V support") both merged (2023, exact date given as either 2023-08-24 or 2023-07-31 in two separate fetches this session - discrepancy unresolved, [NEEDS VERIFICATION]) | Not confirmed | N/A | Build-config plumbing only, not crypto/JIT |
| LLVM | build, critical | Sole officially-supported compiler per `docs/toolchain_support.md` (riscv64 not mentioned there); no prebuilt riscv64 host Clang shipped | N/A | N/A | LLD segfault ([llvm-project#79944](https://github.com/llvm/llvm-project/issues/79944), affects Chromium toolchain builds <126.0.6478.185, fixed in newer LLD); linker-relaxation CFI/target-attribute bug ([llvm-project#69780](https://github.com/llvm/llvm-project/issues/69780), open, "harmless but annoying") |
| GCC | build, optional | Only used for the `riscv64-linux-gnu` cross-toolchain/sysroot (Debian Trixie), not Chromium's primary compiler; GCC builds require libc++ as of M138 | N/A | N/A | [GCC Bugzilla #116662](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=116662): `std::hardware_destructive_interference_size` defaults to 32B instead of 64B on riscv64, causing a PartitionAlloc performance regression; open upstream, Chromium workaround is explicit 64-byte alignment in `partition_root.h` |
| Ninja | build, critical | Data not available: no riscv64-specific issues found; Ninja is architecture-agnostic build orchestration | N/A | N/A | No dedicated research performed this run beyond confirming Chromium's build is GN+Ninja, not CMake |
| GN | build, critical | Data not available beyond Chromium's own `riscv.gni` extension (Section 5.1), which is Chromium-authored configuration, not evidence about GN itself | N/A | N/A | No GN-tool-level riscv64 issues found |
| googletest | test, critical | Implied functional: community CI (riscv-forks/chromium-riscv) runs `base_unittests`/`cc_unittests`/`net_unittests` and V8 cctest, all googletest-based, on native riscv64 hardware | Passing (core suites), some regressions (Section 7.4, issues #31/#32) | N/A | No googletest-specific riscv64 issues identified independent of the test suites it runs |

Additional indirect dependencies surfaced via Chromium's `DEPS`/`BUILD.gn` during this research pass, not in the originally supplied direct-dependency list: libvpx (VP8/VP9, Ubuntu `libvpx12`/`libvpx-dev` 1.16.0-3 present [NEEDS VERIFICATION]), libaom (AV1, Ubuntu `libaom3`/`libaom-dev` 3.13.1-2 present [NEEDS VERIFICATION]), libwebp (Ubuntu `libwebp-dev` 1.5.0-0.1build1 present [NEEDS VERIFICATION]), Opus (Ubuntu `libopus0` 1.5.2-2 present, listed for riscv64 [NEEDS VERIFICATION]), FreeType (Ubuntu `libfreetype6` 2.14.2+dfsg-1 present [NEEDS VERIFICATION]), Protocol Buffers (Ubuntu `libprotobuf-dev`/protobuf src 3.21.12-15ubuntu1 present [NEEDS VERIFICATION]), RE2 (Ubuntu `libre2-dev` 20250805-1build3 present, riscv64 listed [NEEDS VERIFICATION]), Brotli (Ubuntu `libbrotli1` 1.2.0-3build1 present, FULLYBUILT [NEEDS VERIFICATION]), zstd (Ubuntu `libzstd1` 1.5.7+dfsg-3 present [NEEDS VERIFICATION]), SQLite (Chromium vendors its own fork rather than the system library; distro packaging is only indirectly informative [NEEDS VERIFICATION]), and PDFium (no standalone Ubuntu package; upstream `pdfium-binaries`' Linux binary matrix does not list riscv64; `pypdfium2`'s Python wrapper reportedly targets riscv64 manylinux wheels, [NEEDS VERIFICATION]). None of these carry a project report in this registry as of this run; Opus and PDFium are candidates for new registry entries.

### 9.2 V8 (deep dive)

See Section 4.1 for the full architecture. Open item: the Sub32 signed-overflow correctness bug (CL 7500131) has been stalled since January 2026 with an unresolved correctness objection. The riscv32 port is deprecated, removal planned after May 2026.

### 9.3 FFmpeg (deep dive)

Two distinct things are being tracked and should not be conflated. First, the upstream FFmpeg project has had an active riscv64 port since September 2022, with dedicated `libavcodec/riscv/`, `libavutil/riscv/`, `libswscale/riscv/`, `libavfilter/riscv/` trees and RVV acceleration for H.264, VP8/VP9, HEVC, AAC, AC3, Opus, swscale, and swresample; FATE CI at remlab.net reports passing (5532/5532 for GC and GCVb configurations), with a named maintainer (Remi Denis-Courmont). Second, Chromium's own integration CL for its bundled/vendored FFmpeg copy, [5054185](https://chromium-review.googlesource.com/c/chromium/third_party/ffmpeg/+/5054185) "[ffmpeg] Add riscv support" (author Yahan Lu, based on Andreas Schwab's openSUSE patches), is **abandoned** - confirmed via the Gerrit REST API, though the two fetches performed this session disagree on the abandonment date (one reports last-abandoned 2025-05-29 at patch set 7; another reports 2023-11-23; this discrepancy is unresolved, [NEEDS VERIFICATION]). Dale Curtis (Chrome media owner) stated in review, 2023-12-11, "we don't yet have the requisite Chromium infrastructure to support accepting this change... won't be able to accept this until Buildbots and toolchain support is added," and reiterated in 2025-05-29 that the sysroot script still lacked riscv64 support and CQ bots would be needed. Contributor Bo YU confirmed (2025-09-08) that Chromium riscv64 is "mainly blocked [by] this patch and another [4935120]," and that it also blocks Debian's qt6-webengine. However, Levi Zim reported the same day that "riscv support for ffmpeg has already been merged in another CL. In M140, there are partial support... The config files part should land in M141" - i.e., riscv64 FFmpeg support for Chromium reportedly landed through a different path, making CL 5054185 largely moot despite remaining formally abandoned.

### 9.4 Skia, BoringSSL, zlib (deep dives)

Unchanged from Sections 4.4, 4.7, and the summary table above: no riscv64 SIMD/hardware-crypto in any of the three; all run scalar C paths on riscv64.

### 9.5 XNNPACK (deep dive)

See summary table. This is the ML-inference dependency backing WebNN; it has the most mature riscv64 SIMD coverage outside V8, but carries three open correctness/completeness issues (Zvfh hwprobe macro, F32-RSUM multi-thread bug, unconditional Zvfh regression).

---

## 10. Ecosystem Status

Not applicable. Chromium is a standalone browser/runtime; it is not itself distributed through, nor does it have, a dependent package ecosystem (npm/PyPI/Maven/Kubernetes-operator-style consumers) whose riscv64 enablement would need separate tracking. Its own dependencies are covered in Section 9.

---

## 11. Known Bugs and Active Issues

### 11.1 Correctness bugs

| ID | Title | Component | Status |
|---|---|---|---|
| riscv-collab/v8 #701 | Octane failed on Unmatched: NavierStokes checksum error, PdfJS wrong output | Precision/arithmetic | Open [NEEDS VERIFICATION: 2022-era, --noopt, relevance to current JIT-enabled performance unclear] |
| riscv-collab/v8 #702 | rv32 debug stress mode failed | riscv32 correctness | Open |
| riscv-collab/v8 #695 | cctest RunWasmLiftoff_I32Binop_DivS fails (riscv32) | Wasm correctness | Open |
| riscv-collab/v8 #670, #669 | regress-crbug-* failing in native test mode (riscv32) | Correctness | Open |
| riscv-collab/v8 #630 | cctest test-macro-assembler-riscv32/CompareI | riscv32 correctness | Open |
| V8 upstream CL 7500131 | Sub32 signed integer overflow in assembler | riscv64 correctness | Stalled since Jan 2026, unresolved correctness objection |
| GCC Bugzilla [#116662](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=116662) | `std::hardware_destructive_interference_size` defaults to 32B, should be 64B on riscv64 | PartitionAlloc performance regression | Open upstream; Chromium workaround = explicit 64-byte alignment |

### 11.2 Performance gaps

| ID | Title | Status |
|---|---|---|
| riscv-collab/v8 #574 | Integer division by power of 2 not replaced with arithmetic shift | Open |
| riscv-collab/v8 #528 | Using customized memcpy may enhance performance | Open since March 2022 |
| libpfm4 | No RISC-V PMU event tables | No upstream activity found |
| V8 instruction scheduler | Latencies copied from MIPS, incorrect for all real RISC-V cores | No CL identified |

### 11.3 Toolchain bugs

| ID | Title | Status |
|---|---|---|
| [llvm-project#79944](https://github.com/llvm/llvm-project/issues/79944) | LLD segfault, `SymbolTableSection<ELFT>::writeTo` | Affects Chromium toolchain builds < 126.0.6478.185, fixed by newer LLD |
| [llvm-project#69780](https://github.com/llvm/llvm-project/issues/69780) | CFI/target-attribute bug affecting RISC-V linker relaxation | Open upstream, "harmless but annoying" |
| Rust PR #120518 | split-debuginfo unpacking failure on riscv64 | Fixed in Rust 1.78.0 |
| Rust PR #123612 | cross-language LTO breakage for lp64d ABI | Fixed in Rust 1.79.0 |
| Chromium build config | `-gsplit-dwarf` incompatible with RISC-V linker relaxation (`-mrelax`) | Workaround: `use_debug_fission=false` |
| Chromium build config | RISC-V port "not warning-free" | Workaround: `treat_warnings_as_errors=false` |

### 11.4 Community CI regressions (riscv-forks/chromium-riscv)

See Section 7.4 for full detail on issues #32, #31, and #25.

### 11.5 Hardware-level bugs (downstream/revyos)

| ID | Status | Description |
|---|---|---|
| revyos #145 | Open | Chromium/glxinfo/glxgears crash on LicheePi Console 4A; GPU process exits with SIGILL |
| revyos #113 | Closed | SIGILL from invalid compressed RISC-V instruction `0x6022` in `BubbleDialogDelegateView::GetWidget()`; toolchain codegen or ABI mismatch |
| revyos #81 | Closed (Jan 2026) | Black screen after Bilibili video on Meles board; no documented root cause |
| revyos #27 | Open | Native Chromium build on 64-core SG2042 reports "quirks or even system instability" |

### 11.6 Feature/extension gaps (active)

`kF32LoadF16` in Liftoff (explicit `UNIMPLEMENTED()`); fp16/Zvfh vector arithmetic CL 7953190 open as of 2026-06-18; XNNPACK `RISCV_HWPROBE_EXT_ZVFH` macro missing under Clang 19.1 (PR #9903, partial fix); XNNPACK F32-RSUM RVV disabled for a multi-thread correctness issue (PR #6450, open).

---

## 12. Objections and Upstream Blockers

### 12.1 Sandbox CL 4935120 - the primary blocker

This is a policy/governance blocker, not primarily a technical one. The full review-thread substance, read directly from the Gerrit REST API this session:

- **Robert Sesek** (2023-10-19, original rejection): "the Chromium project has a formal policy around the acceptance of new CPU architectures... any new CPU architecture must be explicitly approved for inclusion by the project's engineering leadership... Historically, the addition of new CPU architectures has not been approved because the maintenance burden does not outweigh the benefit... I am rejecting this patch." Code-Review -1 has persisted through all 15 patch sets since.
- **Levi Zim/kxxt** (2025-08-04) points to a tracker comment suggesting it is up to local owners whether a given riscv patch is "low cost."
- **Matthew Denton** (2025-08-04): "The ifdefs in the sandbox are very load bearing and each arch adds significant extra complexity in a security critical component... we long ago decided that adding MIPS support to the sandbox introduced extra unnecessary maintenance burden, and since then we have declined to merge patches for loongarch64 and powerpc and I don't think it should be different with risc-v" - i.e., there is a standing precedent against new sandbox architectures independent of riscv64's specific code quality.
- **Elly** (2025-08-06, and again 2026-05-18, the most recent substantive reply): "The maintenance costs... is mostly that it makes it harder for us to change the sandbox with confidence... Since they don't have builders, the tests don't run for them... The only realistic path forward would be a Chromium-level decision to support riscv64. We can't justify taking a large patch to delicate code to support an architecture we don't ship or have automated tests for... we just can't carry a bunch of functionally dead code in our repository for this."
- Levi Zim has offered to act as informal maintainer, modeling the arrangement on V8's RISC-V port (fixed after the fact, not blocked upfront), and cites his own weekly CI (riscv-forks/chromium-riscv) as evidence he can respond to breakage within a week.

The blocker is explicitly circular: the sandbox reviewers require CI/builder coverage before accepting the patch, but no official builder exists because there is no sandboxed riscv64 target to build for yet. Resolving it requires a Chromium-level (engineering leadership) policy decision to accept riscv64 as a supported architecture, paired with official builder infrastructure, not further patch iteration on CL 4935120 itself.

### 12.2 FFmpeg integration CL 5054185

Abandoned; see Section 9.3 for the full Dale Curtis review quotes establishing the same "no buildbots, no CQ bots" blocker pattern as the sandbox CL, and Levi Zim's 2025-09-08 report that riscv64 FFmpeg support landed a different way (partial in M140, config-file completion expected M141), making this specific CL largely moot.

### 12.3 V8 Sub32 overflow bug (CL 7500131)

A correctness bug in the riscv64 assembler, stalled since January 2026 with an unresolved correctness objection; the specific objection text was not retrievable in this research pass.

### 12.4 Highway RVV

Disabled June 2025 (CL 6583376, "uncommon with most riscv chips"), re-enabled May 2026 (CL 7807959). The Rubber Stamper bot refused automatic approval on re-enablement because the original disable fell outside the 14-day auto-approve window, confirming that human reviewer attention was required.

### 12.5 SwiftShader LLVM16 revert

CL 75929 merged 2026-05-27 then was reverted 2026-06-08 (CL 77428) for breaking the SwiftShader-to-Dawn roll (`undefined symbol: llvm::MCSymbolizer::~MCSymbolizer`). This is an active, currently-unresolved regression against riscv64 software rendering, not a stale/settled item.

### 12.6 XNNPACK Zvfh regression

`XNN_ENABLE_RISCV_FP16_VECTOR` was enabled unconditionally in January 2026, a regression on hardware lacking the Zvfh extension, compounded by the missing `RISCV_HWPROBE_EXT_ZVFH` macro under Clang 19.1.

### 12.7 Organizational summary

New architecture support in Chromium requires a leadership-level decision to accept the maintenance burden, not merely technical patch quality. Configurations without Google-managed CI bots are treated as unsupported by design. The current state - no Linux riscv64 CI, no official binary, unmerged sandbox CL - means upstream breakage of the riscv64 port is an accepted risk borne by community maintainers, and the acceptance probability of CL 4935120 specifically is low absent either (a) a policy reversal at the engineering-leadership level, or (b) a chip company or other sponsor standing up official Google-recognized riscv64 CI infrastructure first.

---

## 13. Readiness Assessment

- **Color:** Yellow (build-only-ci)
- **Release provider:** none
- **Optimization level:** not applicable - Chromium is not classified as an optimization-purpose project; its optimization-purpose dependencies (V8, FFmpeg, XNNPACK, Highway, etc.) are graded separately in their own project reports.

**Justification:** Chromium's official LUCI CI has exactly 4 riscv64 builders, all scoped to Cronet (Android networking library) only, and they compile and size-check without running the test suite - this build-only CI evidence sets the color to yellow. No official riscv64 binary exists anywhere: Ubuntu ships only a snap-redirect transitional package (not a riscv64 binary), [Debian bug #1051998](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1051998) has been open since 2023, and Arch Linux RISC-V's chromium entry is reported outdated/FTBFS in the source report though this could not be independently reproduced this session ([NEEDS VERIFICATION], Section 8) - so release_provider is none. See [CL 4935120](https://chromium-review.googlesource.com/c/chromium/src/+/4935120) (the open sandbox CL, the gating blocker) and the prior version of this report.

**Pending work that could change the grade:** Sandbox CL [4935120](https://chromium-review.googlesource.com/c/chromium/src/+/4935120) (seccomp-BPF riscv64-linux support) remains open since October 2023 with a sustained Code-Review -1 from Chrome's sandbox/security owner, citing lack of official riscv64 CI as the policy blocker - this is the single highest-leverage item that could change the grade if resolved together with a Linux riscv64 CI builder. The master tracking issue [issues.chromium.org/issues/42050595](https://issues.chromium.org/issues/42050595) links approximately 19 related CLs. No RISE-funded Chromium-specific work was identified; the closest RISE touchpoint is the December 2025 V8 blog post (Section 4.1), since V8 is a Chromium dependency, not Chromium itself. Samsung SRPOL's Chromium/pixman/ffmpeg/libpng/libjpeg-turbo RVV optimization work is described on Samsung's own blog as done "under the RISE project," which is not corroborated by any RISE-published blog post, repository, or funded-project listing found this session - flagged as a discrepancy [NEEDS VERIFICATION].

---

## 14. Investment Analysis

RISE has not funded or published dedicated Chromium-browser work; its only substantive touchpoint is the V8 engine (Section 4.1, a dependency graded separately), plus two Chromium-component Python wheel PRs in `riseproject-dev/python-wheels` (`mini-racer`, wrapping V8; `comfy-angle`, wrapping ANGLE) and a `skia-python` riscv64 support issue (#1895). None of this covers the browser-level work items below; nothing here is double-counted against existing RISE deliverables.

### 14.1 Functional Enablement

The sandbox CL is the single highest-leverage item, and per Section 12.1 it is blocked on an organizational decision (Chromium-level policy acceptance of riscv64 as a supported architecture plus official CI), not on further technical iteration of the patch itself, which is already at revision 15 and was rebased as recently as 2026-09-23. A chip company pursuing this should engage at the policy/CI-sponsorship level, not only submit code.

SwiftShader is the second-highest-leverage functional gap: its LLVM10-to-16 bump was merged and then reverted for breaking the Dawn roll (Section 4.5/12.5). Fixing the underlying Dawn-roll incompatibility (the `MCSymbolizer` undefined-symbol issue) and re-landing is a bounded, well-scoped project, smaller than originally estimated since the core patch already exists and has prior review approval.

### 14.2 Performance Optimization

Skia's SIMD gap is the largest performance deficiency outside V8: adding RVV-accelerated paths to `src/opts/` (as LoongArch already has) would accelerate all 2D rendering, text, and canvas operations. BoringSSL is next: scalar-only TLS crypto is a measurable gap versus OpenSSL-based stacks with full riscv64 hardware crypto. Samsung SRPOL's pixman work (~10x speedup on RGB565->RGB888 via RVV) demonstrates the scale of gain available from this class of optimization and could serve as a template.

The V8 instruction-scheduler latency tables, reported copied from MIPS, represent a correctness-adjacent performance issue since the scheduler may order instructions incorrectly for real RISC-V pipelines; profiling on real hardware and updating the tables would benefit any high-performance riscv64 chip deployment.

### 14.3 CI/CD Infrastructure

The absence of a Linux riscv64 CI builder in Chromium LUCI is the root cause of the port's fragility and, per the sandbox-CL review thread, the explicit reason the security team will not accept sandbox patches. Contributing a riscv64 build bot to Chromium LUCI - ideally paired with the policy engagement in 14.1 - would shift the risk profile from "community vigilance" (riscv-forks/chromium-riscv) to Google tree-sheriff coverage. This requires committed hardware infrastructure, not only software engineering.

The ci.rvperf.org JetStream job has been failing for approximately 6 months; restoring it would produce public V8 riscv64 benchmark data that currently does not exist anywhere (Section 7.3), which is directly useful for any chip-vendor performance claims.

### 14.4 Ecosystem Enablement

libpfm4 has no RISC-V PMU event tables, which completely blocks hardware performance-counter profiling on riscv64 for both V8 benchmark development and general Chromium profiling. Contributing PMU event tables for specific RISC-V cores is a well-scoped, bounded project and a natural fit for a chip vendor with access to its own hardware's PMU specification.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner Candidate | Priority |
|---|---|---|---|---|
| Functional | Sandbox CL 4935120: secure Chromium-level policy acceptance + Code-Review -1 clearance | 2-4 (eng) + organizational engagement | Chip company security/sandbox eng + exec sponsorship | Critical |
| Functional | Official Linux riscv64 CI builder (prerequisite/companion to sandbox acceptance) | 4-8 (infra + SW) | Chip company infra | Critical |
| Functional | SwiftShader: fix Dawn-roll incompatibility from LLVM16 bump, re-land CL 75929 | 2-4 | Chip company graphics eng | High |
| Functional | V8 Sub32 overflow bug CL 7500131 (resolve correctness objection) | 1-2 | ISCAS or chip company V8 eng | High |
| Functional | XNNPACK Zvfh hwprobe fix (PR #9903 completion) | 1-2 | Chip company ML eng | High |
| Functional | XNNPACK F32-RSUM multi-thread correctness (PR #6450) | 2-4 | Chip company ML eng | Medium |
| Performance | Skia RVV SIMD opts (`src/opts/`) | 6-12 | Chip company graphics eng | High |
| Performance | BoringSSL riscv64 hardware crypto assembly | 8-16 | Chip company crypto/security eng | High |
| Performance | V8 instruction scheduler latency tables for riscv64 | 3-6 | Chip company CPU architect + V8 eng | Medium |
| Performance | zlib RVV acceleration (Chromium fork) | 2-4 | Chip company systems eng | Low |
| CI/CD | Restore ci.rvperf.org JetStream job | 1-2 | ISCAS or chip company | Medium |
| CI/CD | Community CI regression fixes (issues #31, #32) | 1-2 | Chip company platform eng, or upstream via kxxt | Medium |
| Ecosystem | libpfm4 RISC-V PMU event tables | 2-4 | Chip company CPU architect | Medium |
| Ecosystem | Debian package for riscv64 Chromium (bug #1051998), contingent on sandbox + FFmpeg | 4-8 | Distribution eng | Medium |

---

## 15. References

- [Chromium source repository](https://chromium.googlesource.com/chromium/src)
- [Chromium DEPS](https://chromium.googlesource.com/chromium/src/+/main/DEPS)
- [Chromium top-level BUILD.gn](https://chromium.googlesource.com/chromium/src/+/main/BUILD.gn)
- [CL 4935120 - Add support for riscv64-linux (OPEN)](https://chromium-review.googlesource.com/c/chromium/src/+/4935120)
- [CL 5839530 - Use kPartitionCachelineSize instead of hardcoding 64 (MERGED)](https://chromium-review.googlesource.com/c/chromium/src/+/5839530)
- [CL 7790544 - Use Zihintpause for CPU yield on RISC-V (MERGED)](https://chromium-review.googlesource.com/c/chromium/src/+/7790544)
- [CL 7807959 - Revert highway riscv RVV BROKEN_TARGETS (MERGED)](https://chromium-review.googlesource.com/c/chromium/src/+/7807959)
- [CL 6583376 - highway: add riscv RVV to BROKEN_TARGETS (MERGED)](https://chromium-review.googlesource.com/c/chromium/src/+/6583376)
- [CL third_party/ffmpeg 5054185 - Add riscv support (ABANDONED)](https://chromium-review.googlesource.com/c/chromium/third_party/ffmpeg/+/5054185)
- [CL mini_chromium 4558827 - Add RISCV64 support (MERGED)](https://chromium-review.googlesource.com/c/chromium/mini_chromium/+/4558827)
- [CL mini_chromium 4735556 - [riscv][android] Add Android RISC-V support (MERGED)](https://chromium-review.googlesource.com/c/chromium/mini_chromium/+/4735556)
- [CL v8/v8 7498990 - [riscv] Skip pop simd128 in DeoptimizationEntry (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7498990)
- [CL v8/7768270 - Add Zfa extension (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7768270)
- [CL v8/7787832 - Optimize float min/max codegen with ZFA (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7787832)
- [CL v8/7763908 - Disable unaligned access support (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7763908)
- [CL v8/7897892 - Implement ZFH in Simulator (MERGED)](https://chromium-review.googlesource.com/c/v8/v8/+/7897892)
- [CL v8/7953190 - Implement vfadd/vfsub/vfmul/vfdiv for fp16 (OPEN)](https://chromium-review.googlesource.com/c/v8/v8/+/7953190)
- [SwiftShader CL 75929 - Default to use llvm16 (MERGED then REVERTED)](https://swiftshader-review.googlesource.com/c/SwiftShader/+/75929)
- [SwiftShader CL 77428 - Revert "Default to use llvm16"](https://swiftshader-review.googlesource.com/c/SwiftShader/+/77428)
- [Chromium tracking issue 42050595 - RISC-V toolchain support](https://issues.chromium.org/issues/42050595)
- [Chromium CI LUCI builder configuration](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/infra/config/generated/builders/)
- [chromium.android.star CI builder config, riscv64 Cronet builders](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/infra/config/subprojects/chromium/ci/chromium.android.star)
- [build/config/riscv.gni](https://chromium.googlesource.com/chromium/src/+/main/build/config/riscv.gni)
- [build/toolchain/linux/BUILD.gn](https://chromium.googlesource.com/chromium/src/+/main/build/toolchain/linux/BUILD.gn)
- [build/config/compiler/BUILD.gn](https://chromium.googlesource.com/chromium/src/+/main/build/config/compiler/BUILD.gn)
- [docs/linux/build_instructions.md](https://chromium.googlesource.com/chromium/src/+/main/docs/linux/build_instructions.md)
- [docs/toolchain_support.md](https://chromium.googlesource.com/chromium/src/+/main/docs/toolchain_support.md)
- [riscv-forks/chromium-riscv (community CI/builds)](https://github.com/riscv-forks/chromium-riscv)
- [riscv-forks/chromium-riscv issue #32](https://github.com/riscv-forks/chromium-riscv/issues/32)
- [riscv-forks/chromium-riscv issue #31](https://github.com/riscv-forks/chromium-riscv/issues/31)
- [riscv-forks/chromium-riscv issue #25](https://github.com/riscv-forks/chromium-riscv/issues/25)
- [starfive-tech/chromium.src](https://github.com/starfive-tech/chromium.src)
- [riscv-forks/electron](https://github.com/riscv-forks/electron)
- [RISE blog: A Glimpse Into V8 Development for RISC-V (Dec 2025)](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [RISE Project members](https://riseproject.dev/members/)
- [riseproject-dev/python-wheels PR #1875 - mini-racer](https://github.com/riseproject-dev/python-wheels/pull/1875)
- [riseproject-dev/python-wheels PR #2123 - comfy-angle](https://github.com/riseproject-dev/python-wheels/pull/2123)
- [riseproject-dev/python-wheels issue #1895 - skia-python riscv64](https://github.com/riseproject-dev/python-wheels/issues/1895)
- [Samsung Research blog - RISC-V and Vectorization](https://research.samsung.com/blog/RISC-V-and-Vectorization)
- [RISC-V International blog - Chromium Performance Optimization on XuanTie RISC-V Processors](https://riscv.org/blog/chromium-performance-optimization-on-xuantie-risc-v-processors/)
- [openEuler RISC-V SIG blog](https://www.openeuler.org/en/blog/RISC-V/)
- [kxxt.dev - Cross compile mainline Chromium for RISC-V from scratch (2026)](https://www.kxxt.dev/blog/cross-compile-chromium-for-riscv-2026/)
- [kxxt.dev - Cross compile mainline Chromium for RISC-V from scratch](https://www.kxxt.dev/blog/cross-compile-chromium-for-riscv/)
- [Debian bug #1051998 - chromium: please add support for riscv64](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1051998)
- [Alpine aports MR !40613 - community/chromium: enable riscv64 (draft/stale)](https://gitlab.alpinelinux.org/alpine/aports/-/merge_requests/40613)
- [Arch Linux RISC-V package status](https://archriscv.felixc.at/)
- [PyPI chromium package (unrelated placeholder)](https://pypi.org/pypi/chromium/json)
- [llvm-project issue #79944 - LLD segfault](https://github.com/llvm/llvm-project/issues/79944)
- [llvm-project issue #69780 - CFI/target-attribute linker relaxation bug](https://github.com/llvm/llvm-project/issues/69780)
- [GCC Bugzilla #116662 - hardware_destructive_interference_size wrong default on riscv64](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=116662)
- [V8 RISC-V issue tracker (riscv-collab)](https://github.com/riscv-collab/v8/issues)
- [riscv-collab/v8 wiki - Understand V8 backend architecture](https://github.com/riscv-collab/v8/wiki/Understand-V8-backend-architecture)
- [revyos/revyos issues tracker](https://github.com/revyos/revyos/issues)
- [chromium-dev mailing list - Porting for riscv64](https://groups.google.com/a/chromium.org/g/chromium-dev/c/CTSgJXER8mw)
- [chromium-bugs mailing list - Can't compile shared library of BoringSSL](https://groups.google.com/a/chromium.org/g/chromium-bugs/c/2uIuVBosuCU)
- [Launchpad - android-boringssl riscv64 (Lunar)](https://answers.launchpad.net/ubuntu/lunar/riscv64/android-boringssl/13.0.0+r24-2)