---
title: Firefox
parent: Project Reports
categories:
  - browser
---

# Firefox

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Firefox<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Firefox is a web browser developed by Mozilla Corporation (commercial subsidiary of the Mozilla Foundation). The codebase is licensed MPL 2.0. Development occurs in mozilla-central ([https://hg.mozilla.org/mozilla-central/](https://hg.mozilla.org/mozilla-central/)); the GitHub repository [mozilla/gecko-dev](https://github.com/mozilla/gecko-dev) is a read-only mirror. All patches are submitted via Phabricator and tracked on [Bugzilla](https://bugzilla.mozilla.org/). GitHub pull requests are auto-rejected by a bot.

Mozilla is not a RISE Project member. RISE's publicly documented funded projects cover Java/OpenJDK, Go, Rust Tier-1, LLVM/Clang, Python binary packages, V8, Yocto, Android, Linux kernel, and CI infrastructure. Firefox and SpiderMonkey are absent from all RISE blog posts, working group outputs, funded RFP listings, and the Python wheel builder package list (confirmed by reading all 28 RISE blog posts from May 2024 through June 2026).

The JavaScript and WebAssembly engine is SpiderMonkey, which includes a multi-tier JIT compiler (Baseline and Ion/Warp) and a WebAssembly baseline compiler. The JIT backends are architecture-specific; the riscv64 backend lives at `js/src/jit/riscv64/` in mozilla-central.

---

## 2. Port History and Upstreaming Timeline

All milestones below are sourced from Bugzilla resolution records and mozilla-central commit metadata.

| Firefox version | Approximate date | Milestone | Bug |
|---|---|---|---|
| 79 | Jun 2020 | riscv64 architecture recognition in mozbuild; atomic operations via `AtomicOperations-feeling-lucky.h` | [Bug 1318905](https://bugzilla.mozilla.org/show_bug.cgi?id=1318905) |
| ~91 | Jul 2021 | `riscv64` defines added to `build/build_config.h` | [Bug 1719115](https://bugzilla.mozilla.org/show_bug.cgi?id=1719115) |
| 106 | Sep 2022 | WebMIDI disabled on riscv64 (`midir` crate incompatible) | [Bug 1790800](https://bugzilla.mozilla.org/show_bug.cgi?id=1790800) |
| 111 | Jan 2023 | SpiderMonkey riscv64 JIT backend landed; 6x+ speedup over interpreter on HiFive Unmatched | [Bug 1800431](https://bugzilla.mozilla.org/show_bug.cgi?id=1800431) |
| 114 | ~2023 | JIT enabled by default on riscv64 (`JS_CODEGEN_RISCV64`) | [Bug 1826741](https://bugzilla.mozilla.org/show_bug.cgi?id=1826741) |
| 116 | Jun 2023 | WASM baseline compiler enabled on riscv64 | [Bug 1837111](https://bugzilla.mozilla.org/show_bug.cgi?id=1837111) |
| ~116 | Jun 2023 | WebRTC allowed to build on Linux/riscv64 | [Bug 1830461](https://bugzilla.mozilla.org/show_bug.cgi?id=1830461) |
| ~117 | Jul 2023 | WASM huge memories enabled on riscv64 | [Bug 1817476](https://bugzilla.mozilla.org/show_bug.cgi?id=1817476) |
| ~119 | Oct 2023 | WASM multi-memory implemented for riscv64 | [Bug 1845676](https://bugzilla.mozilla.org/show_bug.cgi?id=1845676) |
| 125 | Mar 2024 | RISC-V disassembler wired to `disnative(f)` JS shell function | [Bug 1880366](https://bugzilla.mozilla.org/show_bug.cgi?id=1880366) |
| 136 | Jan 2025 | Register allocation fix for `LAtomicTypedArrayElementBinop64` on RISCV | [Bug 1944011](https://bugzilla.mozilla.org/show_bug.cgi?id=1944011) |
| 139 | Apr 2025 | Seven JIT fixes ported from other architectures; JIT was "long time broken" | [Bug 1957559](https://bugzilla.mozilla.org/show_bug.cgi?id=1957559) |
| 142 | Jul 2025 | WASM JSPI (JS Promise Integration) stack-switching implemented for riscv64 | [Bug 1975643](https://bugzilla.mozilla.org/show_bug.cgi?id=1975643) |
| 143 | Aug 2025 | JIT re-enabled by default on riscv64 after jit-tests confirmed green | [Bug 1982266](https://bugzilla.mozilla.org/show_bug.cgi?id=1982266) |
| 144 | Aug-Sep 2025 | Compilation failure from missed call site in `SharedICHelpers-riscv64-inl.h` fixed | [Bug 1974946](https://bugzilla.mozilla.org/show_bug.cgi?id=1974946) |

**Original port team:** Yahan Lu (LuYahan) at PLCT Lab / ISCAS (Institute of Software, Chinese Academy of Sciences), reviewed and gated by Jan de Mooij (jandem) and Nicolas B. Pierron (nbp) at Mozilla. The three core changesets for Bug 1800431 were pushed by jdemooij@mozilla.com: `478a50a67d75`, `e2d1f36939ee`, `74ac0beba129`.

**Active contributors as of 2025-2026:** Rong Bao (CSharperMantle, webmaster@csmantle.top) is the most active contributor with 20+ commits in mid-2025 covering JSPI, FloatRegister refactoring, simulator fixes, and build failures. Makoto Kato (makotokato, Mozilla) fixed the long-broken JIT in Bug 1957559. Andre Bargull (anba) handles register allocation fixes. Luyahan (PLCT Lab) contributed wasm features through 2023.

The master meta-bug tracking the original riscv64 port ([Bug 1717203](https://bugzilla.mozilla.org/show_bug.cgi?id=1717203)) was resolved FIXED circa 2022. A new meta-bug ([Bug 1987699](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699), P3, 56 dependent bugs, filed 2025-09-09 by nbp, last updated 2026-06-12) tracks ongoing SpiderMonkey riscv64 work. Bug 1733512 (enable riscv64 building -- a build fix sub-task) remains open and unassigned.

---

## 3. Upstream Support Tier

Firefox uses a documented three-tier support policy sourced from `firefox-source-docs.mozilla.org/build/buildsystem/supported-configurations.html`.

- **Tier 1:** Android (x86-64, ARMv7, ARMv8-A), Linux (x86-64, AArch64), macOS (x86-64, AArch64), Windows (x86, x86-64, AArch64). Regressions trigger immediate reversion.
- **Tier 2:** Windows/x86 via mingw-clang only. Community-maintained.
- **Tier 3:** Linux ARM variants beyond Tier 1, PowerPC, x86; FreeBSD, OpenBSD, NetBSD, Solaris. No CI guarantees.

**riscv64 is not listed in the tier policy document.** It falls into the unlisted/community-supported category below Tier 3. There is no CI, no official sysroot toolchain, and no automated test coverage for riscv64 in Mozilla's Taskcluster infrastructure. Mozilla developers have noted they lack reliable access to non-Tier-1 environments.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 JIT Backend File Structure

The riscv64 JIT backend at `js/src/jit/riscv64/` has 22 top-level source files plus three subdirectories: `constant/` (13 ISA-extension constant files covering I, M, A, F, D, C, V, Zicsr, Zifencei, Zba, Zbb, Zbc, Zbs), `disasm/` (2 files), and `extension/` (~20 files). By file count this is the largest JIT backend directory in gecko-dev, larger than x64 (15 files), arm64 (18 + vixl library), and arm32 (22 + 2 subdirs). The RVV assembler encoding layer (`extension/extension-riscv-v.cc`, ~490 lines) encodes RVV instructions but is not wired to any JIT SIMD operation.

### 4.2 Component Completeness

The following assessments are based on direct file content review of mozilla/gecko-dev.

| Component | Status | Key gaps |
|---|---|---|
| Architecture definitions (`Architecture-riscv64.h`) | Full | CPU flags detection hardcoded `true`; no runtime ISA query. `asSimd128()` is `MOZ_CRASH()` -- deliberate |
| ISA assembler (RVI/M/A/F/D/C) | Full | None |
| ISA assembler (RVV, encoding only) | Full (encoding layer only) | Not connected to JIT; wiring is completely absent |
| MacroAssembler | Partial | `atomicPause()` is `MOZ_CRASH("NYI")`; two design-question TODOs |
| CodeGenerator | Partial | 19 SIMD visitor functions are `MOZ_CRASH("No SIMD")`; `visitNearbyInt` and `visitNearbyIntF` are `MOZ_CRASH("NYI")`; `visitWrapInt64ToInt32` crashes on upper-half path |
| Lowering | Partial | All SIMD lowerings are `MOZ_CRASH("... SIMD NYI")` |
| LIR definitions | Partial | Defines only 4 LIR instruction classes; arm64 defines substantially more. Relies on generated boilerplate for the rest |
| Trampoline | Full | 128-bit VM argument passing is `MOZ_CRASH("NYI")` -- also present in some other architectures |
| SharedIC helpers | Full | None |
| Disassembler | Full | Landed Firefox 125 (Bug 1880366) |
| Simulator | Partial | FP rounding mode not fully respected (`TODO: use rm value`); most CSRs crash; ICache methods commented out; copy-paste artifact (`/* JS_SIMULATOR_MIPS64 */` comment in riscv64 file) |
| WASM baseline compiler | Full | None |
| WASM SIMD (`ENABLE_WASM_SIMD`) | Missing | `#error "Needs more careful logic if SIMD is enabled"` is a compile-time hard stop; RVV encoding exists, zero JIT integration |
| WASM JSPI | Full | Landed Firefox 142 (Bug 1975643, Jul 2025); both simulator and native assembly paths present |
| 64-bit atomics | Full | Lock-free on riscv64 via `__riscv` guard in `AtomicOperations-feeling-lucky-gcc.h` |
| Spectre mitigations | Disabled | Deliberately disabled for riscv64, same as MIPS64 and LoongArch64 |

### 4.3 Target ISA

The port targets **RV64IMAFDC** (64-bit, little-endian, `lp64d` ABI). Bug 2045021 (2026) adds support for Zbs, Zfa, Zfhmin, and Zicond extensions. Bug 2046847 (filed 2026-06-11, resolved 2026-06-17) uses Zicond and Zbb in `Clear_if_nan` routines and atomic operations. No RVV SIMD is wired to the JIT.

### 4.4 WASM JSPI (Stack Switching)

Bug 1975643 (resolved Firefox 142, July 2025) implemented full WASM JS Promise Integration for riscv64. Prior to this, `js/src/jit/CodeGenerator.cpp` and `js/src/wasm/WasmPI.cpp` contained `#error` directives and `MOZ_CRASH` stubs preventing use. The fix required both a simulator-mode stack-switching path and a native inline assembly path (four patches, reviewed by Yury Delendik). `WasmPI.cpp` now contains a complete `#elif defined(__riscv) && __riscv_xlen == 64` block for `CallOnMainStack()`.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Architecture Recognition

Firefox uses a custom Python configure system (`moz.configure`). In `build/moz.configure/init.configure`, the `split_triplet()` function accepts `riscv64` and `riscv64gc` as CPU values, setting `canonical_cpu = "riscv64"` with `endianness = "little"`. In `js/moz.configure`, `target.cpu == "riscv64"` sets `JS_CODEGEN_RISCV64`.

**Correct preprocessor macro:** `__riscv` (defined on all RISC-V) combined with `__riscv_xlen == 64`. Do not use `__riscv64`.

### 5.2 Native Build

A validated mozconfig for native build (sourced from Bug 1717203, Comment 7, validated on HiFive Unmatched hardware):

```
mk_add_options AUTOCLOBBER=1
ac_add_options --enable-application=browser
ac_add_options --disable-debug
ac_add_options --enable-optimize
ac_add_options --disable-tests
ac_add_options --without-wasm-sandboxed-libraries
export CC=gcc
export CXX=g++
```

`--without-wasm-sandboxed-libraries` is required; the wasm sandbox is not available for riscv64. Clang was attempted but caused linker failures (`unable to find library -lgcc`); GCC is recommended. Build time on HiFive Unmatched: approximately 8-9 hours [NEEDS VERIFICATION].

### 5.3 Cross-Compilation

Cross-compile target flags (from `firefox-source-docs.mozilla.org`):

```
ac_add_options --target=riscv64-linux-gnu
ac_add_options --enable-bootstrap
```

Without `--enable-bootstrap`, a manual `--with-sysroot=<path>` is required. No official Mozilla sysroot exists for riscv64. `taskcluster/kinds/toolchain/sysroot.yml` defines sysroots only for `i686-linux-gnu`, `x86_64-linux-gnu`, `aarch64-linux-gnu`, and `wasm32-wasi`. No riscv64 entry.

### 5.4 Toolchain Requirements

- GCC minimum 10.1.0 (from `toolchain.configure` `minimum_gcc_version()`; GCC recommended over Clang for riscv64)
- Clang minimum 17 if using Clang [NEEDS VERIFICATION]
- Rust target `riscv64gc-unknown-linux-gnu` must be installed
- Compiler flags (from FreeBSD build logs): `-march=rv64imafdc -mabi=lp64d -fstack-protector-strong -fPIC -D_REENTRANT -D_THREAD_SAFE`
- NSS extra flag for GYP/Ninja builds: `NSS_USE_64` must be set explicitly for riscv64

### 5.5 Simulator Mode

`--enable-simulator=riscv64` is available for cross-host testing on x86-64 or aarch64 hosts. The simulator is a functional-level instruction interpreter ported from V8's RISC-V simulator, covering RVI/M/A/F/D/C/V. Known gaps: FP rounding mode not fully respected; most CSRs crash; ICache methods are commented out.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 (x86-64) | arm64 | riscv64 |
|---|---|---|---|
| Baseline JIT | Full | Full | Full |
| Ion/Warp JIT (scalar) | Full | Full | Full |
| WASM baseline | Full | Full | Full |
| WASM SIMD | Full (SSE/AVX) | Full (NEON) | Missing -- `#error` hard stop |
| WASM JSPI | Full | Full | Full (landed Jul 2025) |
| JIT disassembler | Full | Full | Full (landed Mar 2024) |
| `visitNearbyInt` / `visitNearbyIntF` | Full | Full | Missing (`MOZ_CRASH("NYI")`) |
| `atomicPause()` | Full | Full | Missing (`MOZ_CRASH("NYI")`) |
| 64-bit lock-free atomics | Full | Full | Full |
| Spectre mitigations | Full | Full | Disabled (deliberate) |
| CI coverage | Full (Taskcluster Tier 1) | Full (Taskcluster Tier 1) | None |
| Official Mozilla binary | Yes | Yes | No |
| GPU acceleration | Full | Full | Not detected (Bug 1979242) |
| Hardware video decode | Full | Full | Not supported on tested boards |
| JIT simulator for cross-host testing | Yes (x86 sim) | Yes (arm64 sim) | Yes (`--enable-simulator=riscv64`) |
| Gecko Profiler (stack sampling) | Full | Full | Missing (Bug 2023167, ASSIGNED) |

The riscv64 port is at roughly the same completeness level as the arm32 backend: full scalar JIT, no SIMD, active bug fixes. The dominant functional gap is WASM SIMD.

---

## 7. CI/CD Infrastructure

**There is no riscv64 CI of any kind in Firefox's Taskcluster infrastructure.**

The following files in mozilla/gecko-dev were read and confirmed to contain zero riscv64 entries:

- `taskcluster/kinds/build/linux.yml` (2,156 lines) -- defines all Linux build tasks; architectures: x86, x86_64, aarch64 only
- `taskcluster/kinds/test/test-platforms.yml` -- lists all CI test platforms; no riscv64
- `taskcluster/kinds/spidermonkey/linux.yml` -- 23 SM build tasks; only `sm-arm-sim-linux32` and `sm-arm64-sim-linux64`; no `sm-riscv64-sim-linux64`
- `taskcluster/kinds/toolchain/sysroot.yml`, `rust.yml`, `clang.yml`, `gcc.yml`, `dist-toolchains.yml` -- no riscv64 entries
- `taskcluster/config.yml` -- defines SM simulator ridealong builds; arm and arm64 only
- `build/moz.configure/toolchain.configure` -- CPU architecture handling lists x86, x86_64, aarch64, arm, mips32, mips64, ppc, ppc64, sparc, s390x; riscv absent
- `taskcluster/docker/` -- 47 Docker image directories; none are riscv64

The GitHub Actions setup (`.github/workflows/`) contains exactly two files: a README and `close-pr.yml` (a bot that auto-closes all PRs). It has zero CI steps.

**Consequence:** Bug 1957559 (April 2025) revealed that the riscv64 JIT had been "long time broken" with no automated detection. Seven fixes were required to restore the JIT to a buildable state. This is a structural risk: every architecture-neutral refactor that misses a riscv64 call site causes a silent build failure that is only caught when a contributor manually tests on riscv64.

At the time of the initial port proposal (Bug 1800431, January 2023), PLCT Lab stated they were "working on adding the RISC-V platform into the mozilla CI." As of the research date (June 2026), this CI integration has not materialized.

Community CI (`ci.rvperf.org`) exists but is not Mozilla-official. No QEMU integration exists in Mozilla's CI.

---

## 8. Distribution and Release Status

| Channel | riscv64 status | Evidence |
|---|---|---|
| Mozilla official releases (ftp.mozilla.org) | Not available | Firefox 152.0 release directory contains: linux-x86_64, linux-aarch64, mac, win32, win64, win64-aarch64. No linux-riscv64 directory |
| Debian sid (unstable) | Unbuilt (current version) | firefox 152.0.1-1 on riscv64: status "Needs-Build," queued, no build machine assigned. Blocking migration to Debian testing |
| Debian testing | Blocked | Debian tracker shows "Missing build on riscv64" and "Autopkgtest deferred on riscv64: missing arch:riscv64 build" for migration |
| Ubuntu 24.04 (Noble) | Not available | `firefox` package is a transitional snap stub; supported architectures: amd64, arm64, armhf only |
| gecko-dev GitHub releases | Not applicable | Empty array -- zero releases; gecko-dev is a source mirror only |
| PyPI | Not applicable | Package does not exist (HTTP 404) |
| Arch Linux RISC-V (community) | Build patches exist | [archriscv-packages](https://github.com/felixonmars/archriscv-packages) maintains `firefox/riscv64.patch`; 47 closed PRs. PR #4894 (Aug 2025) re-enables PGO for riscv64. This is a source-patch repo, not a binary distribution. Pre-built binary hosting not confirmed |
| Fedora Rawhide | Builds available [NEEDS VERIFICATION] | Referenced in research as a distro shipping Firefox for riscv64; not independently verified via package repo URL |

A PLCT Lab QA report ([github.com/QA-Team-lo/firefox_test](https://github.com/QA-Team-lo/firefox_test), November 2024) tested distro-bundled Firefox on: Fedora 38 (Milk-V Pioneer Box), openKylin 2.0, and RevyOS. This confirms that at least Fedora 38 and openKylin 2.0 shipped usable Firefox builds for riscv64 as of late 2024.

---

## 9. Dependencies

### 9.1 SpiderMonkey JIT Backend

See Section 4 for full detail. The backend is a real, non-trivial implementation. The dominant functional gap is WASM SIMD: a compile-time `#error` prevents enabling `ENABLE_WASM_SIMD` on riscv64 despite the RVV assembler encoding layer existing. All SIMD CodeGenerator and Lowering visitors are `MOZ_CRASH` stubs.

### 9.2 NSS (Network Security Services)

NSS handles TLS/crypto (AES-GCM, ChaCha20-Poly1305, RSA, ECDH, SHA, certificate validation). `security/nss/lib/freebl/` contains no riscv64-specific assembly. All cryptographic operations run on scalar C fallback on riscv64. No AES-Zkn, Zvk, or RVV acceleration exists. No open upstream NSS bugs for riscv64 were found. This represents a significant performance gap vs arm64 (which has hardware AES and SHA) and x86-64 (which has AES-NI) for TLS-heavy workloads.

### 9.3 dav1d (AV1 decoder)

`third_party/dav1d/meson.build` explicitly detects riscv64 via `host_machine.cpu_family().startswith('riscv')`. A `src/riscv/64/` subdirectory exists covering CDEF, intra prediction, inverse transforms, and motion compensation. RVV assembler support is present; binutils >= 2.38 or clang >= 17 is required for RVV assembly. No open riscv64 issues were found in the dav1d GitHub tracker.

### 9.4 libjpeg-turbo (embedded as media/libjpeg/)

RVV SIMD was merged to the libjpeg-turbo dev branch February 2026 and released in 3.1.90 (3.2 beta1, March 2026). A build failure in Firefox's embedded copy is open: [Bug 1984883](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883) ("riscv64: build failure in media/libpng/riscv" -- component is Graphics: ImageLib, likely referring to the libjpeg-turbo embedded copy). This is a NEW bug with no assignee.

### 9.5 libpng (embedded as media/libpng/)

RVV SIMD was merged to libpng in May 2025. Post-merge correctness bugs were found on hardware: wrong RVV version (issue #711); paeth3/paeth4 wrong pixel values on SpacemiT K1 causing 52 OpenCV failures (issue #769, fixed ~v1.6.52). Bug 1984883 is also filed against Firefox's embedded copy. No automated CI exists for the embedded copy.

### 9.6 Highway (third_party/highway/)

Highway is a SIMD portability layer used by JPEG-XL. `HWY_RISCV` is detected via `__riscv`; `hwy/ops/rvv-inl.h` provides the RVV backend; `-march=rv64gcv1p0` is applied when `HWY_CMAKE_RVV` is enabled. Open issues include: Clang 20 compilation failures (issue #2554, April 2025, unresolved); `HwyDemoteTest` failure on riscv64/gcc15 (issue #2793); mold linker problems (issue #2854, open); wrong march flag for RVA23 platforms (issue #2738). JPEG-XL explicitly disables RVV by default (`JPEGXL_ENABLE_SIZELESS_VECTORS=false`) with the comment "TODO: JXL currently compiles but does not pass tests."

### 9.7 JPEG-XL (third_party/jpeg-xl/)

Builds on riscv64 but RVV is disabled by default with a TODO comment about test failures. PR #1429 "Add support for 64-bit RISC-V arch" was closed as abandoned in June 2022. No riscv64 SIMD image decoding is active in Firefox's embedded JPEG-XL copy.

### 9.8 jemalloc (memory/jemalloc/)

jemalloc builds via a generic fallback on riscv64. No riscv64 detection in `configure.ac`. Falls into catch-all `*` case: `HAVE_CPU_SPINWAIT=0`, `LG_VADDR` defaults from pointer size. No spin hint instruction (`pause` from Zihintpause). Functional but unoptimized.

### 9.9 libwebrtc (third_party/libwebrtc/)

`BUILD.gn` contains no riscv64 condition. Architecture-specific handling covers only arm64, arm, mipsel. No RVV path exists for any WebRTC DSP operation (audio processing, codec acceleration). Entirely scalar on riscv64.

### 9.10 aom (AV1 encoder, third_party/aom/)

`CMakeLists.txt` architecture-specific files cover only ARM/NEON, x86/SSE/AVX, MIPS. No riscv64 SIMD paths. All AV1 encoding is scalar on riscv64.

### 9.11 zstd (third_party/zstd/)

PR #4622 "huf_decompress: enable 4-way fast loop on riscv64" is open (March 2026, in progress). A prior build failure (#3134) was resolved in 2022. Abandoned Zicclsm PRs (#4523, #4524) suggest the unaligned memory access model for riscv64 remains an unresolved design question upstream.

### 9.12 NSPR (nsprpub/)

Linux riscv64 support is assumed via a generic POSIX path but not explicitly verified. [Bug 1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232) (FreeBSD/riscv64 NSPR support) remains UNCONFIRMED.

### 9.13 libsrtp (third_party/libsrtp/)

A test timeout on riscv64 is open (issue #754, April 2025). Likely a test harness timing issue rather than a functional correctness bug.

### 9.14 libwebp (media/libwebp/)

`src/dsp/` has no RVV acceleration. Scalar fallback only. No open riscv64 issues found in the GitHub tracker.

### 9.15 Summary Table

| Dependency | riscv64 build | SIMD/accelerated | Blocking issues |
|---|---|---|---|
| SpiderMonkey JIT | Yes | Scalar only (RVV not wired) | Bug 1987699 meta (56 sub-bugs); Bug 1837852 WASM black screen; Bug 1984989 tab crash Firefox 143 |
| NSS | Yes (scalar) | None | No riscv64 crypto assembly; performance gap vs aes-ni/hw-sha |
| dav1d | Yes | RVV present | None found |
| libjpeg-turbo | Broken | RVV 3.2 beta1 | Bug 1984883 build failure NEW |
| libpng | Yes | RVV 1.6.49+ | Bug 1984883; post-merge correctness bugs on SpacemiT K1 |
| Highway | Yes | RVV (when enabled) | Clang 20 breakage (#2554); RVV disabled in JPEG-XL due to test failures |
| JPEG-XL | Yes (scalar) | RVV disabled | RVV TODO about test failures |
| jemalloc | Yes (generic) | None | No arch-specific optimization |
| libwebrtc | Yes (scalar) | None | All DSP scalar |
| aom | Yes (scalar) | None | All AV1 encode scalar |
| zstd | Yes | Partial | PR #4622 Huffman fast loop not yet landed |
| NSPR | Yes (assumed) | N/A | Bug 1711232 FreeBSD/riscv64 UNCONFIRMED |
| libsrtp | Yes | N/A | Test timeout issue #754 |
| libwebp | Yes (scalar) | None | No issues found |

---

## 10. Ecosystem Status

### 10.1 Institutional Contributors

| Contributor | Affiliation | Role |
|---|---|---|
| Yahan Lu (luyahan) | PLCT Lab / ISCAS | Original JIT port author; wasm features through 2023 |
| Ji Qiu | PLCT Lab / ISCAS | Co-contributor to original port [NEEDS VERIFICATION] |
| Rong Bao (CSharperMantle) | Independent (webmaster@csmantle.top) | Most active contributor in 2025; JSPI, FloatRegister, simulator |
| Makoto Kato (makotokato) | Mozilla | Fixed long-broken JIT (Bug 1957559, Apr 2025); original meta-bug author |
| Jan de Mooij (jandem) | Mozilla | Primary SpiderMonkey reviewer for riscv64 patches |
| Nicolas B. Pierron (nbp) | Mozilla | Created meta-bug 1987699; original port gatekeeper |
| Yury Delendik (yury) | Mozilla | Reviewed WASM JSPI riscv64 patches |
| Andre Bargull (anba) | Mozilla | Register allocation fixes |
| Julian Seward (jseward) | Mozilla | Various JIT fixes; landed Bug 1982266 JIT default enablement |

PLCT Lab/ISCAS stated at port submission (2022) they would contribute riscv64 CI to Mozilla's Taskcluster. This has not occurred. By late 2024, PLCT's weekly report no longer included a SpiderMonkey section, suggesting reduced active involvement.

### 10.2 Performance Benchmarks

The only published quantitative benchmark data was found in a PLCT Lab QA team report dated November 2024 ([github.com/QA-Team-lo/firefox_test](https://github.com/QA-Team-lo/firefox_test)).

**Hardware tested:**
- Milk-V Pioneer Box: SG2042, 64-core C920 at 2.0 GHz, 128 GB DDR4, AMD R5 230 GPU
- Sipeed LicheePi 4A: TH1520, RISC-V C910 x4 at 2.0 GHz, 16 GB LPDDR4X

**Speedometer 3 (higher = better):**

| Platform | Score |
|---|---|
| Milk-V Pioneer Box (SG2042) | 0.747 |
| Sipeed LicheePi 4A (TH1520) | 0.3249 |
| x86-64 reference range (report) | 10-20 |

RISC-V is approximately 13-27x slower than x86-64 on Speedometer 3, on the specific hardware tested.

**Basemark Web (higher = better):**

| Platform | Score |
|---|---|
| Milk-V Pioneer Box (SG2042) | 39.02 |
| Sipeed LicheePi 4A (TH1520) | incompatible (graphics not supported) |
| x86-64 reference (AMD RX 6600) (report) | ~2000 |

**SpiderMonkey JIT vs interpreter (PLCT, November 2022, SiFive HiFive Unmatched U740):**

| Mode | SunSpider total time |
|---|---|
| JIT enabled | ~3,353 ms |
| JIT disabled | ~24,693 ms |

JIT delivers approximately 7.4x speedup over interpreter. One regression was noted: `regexp/dna` ran slower with JIT (868 ms) than without (429 ms), indicating a regexp handling regression in the riscv64 JIT at that time. High variance (25.1% confidence interval) in JIT results; interpreter results were stable (1-5%). [NEEDS VERIFICATION -- this data is from 2022 and predates multiple JIT fix rounds]

**mozjs115 jit-tests with `--enable-jit` (PLCT, October 2024):** 390 failures out of 9,980 tests. No analysis of the failure root causes was provided in the accessible source data.

No public Speedometer 3, JetStream 3, Kraken, or MotionMark scores for Firefox on RISC-V from 2025 or 2026 were found in any searched source (Mozilla Hacks, riseproject.dev, Phoronix, OpenBenchmarking.org). The 2024 PLCT QA report is the sole quantitative source.

### 10.3 RISE Project

RISE has no publicly documented Firefox project. Mozilla is not a RISE member. All 28 RISE blog posts from May 2024 through June 2026 were checked; none mention Firefox. RISE's RISC-V Runners CI program (launched March 2026) was not adopted by Firefox.

---

## 11. Known Bugs and Active Issues

Open Bugzilla bugs for riscv64 as of the research date (sourced from Bugzilla REST API):

| Bug | Summary | Status | Component |
|---|---|---|---|
| [1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232) | Add NSPR support for FreeBSD/riscv64 | UNCONFIRMED | NSPR |
| [1733512](https://bugzilla.mozilla.org/show_bug.cgi?id=1733512) | Enable RISC-V building (upstream local build fixes) | NEW, unassigned | Build System |
| [1837852](https://bugzilla.mozilla.org/show_bug.cgi?id=1837852) | RISCV64 baseline wasm compiler results in black screen | UNCONFIRMED | JavaScript: WebAssembly |
| [1865601](https://bugzilla.mozilla.org/show_bug.cgi?id=1865601) | Allow gles backend in riscv64 | NEW | Graphics |
| [1968491](https://bugzilla.mozilla.org/show_bug.cgi?id=1968491) | Out of memory issue with Firefox v139 on riscv64 | UNCONFIRMED | Build System / General |
| [1972506](https://bugzilla.mozilla.org/show_bug.cgi?id=1972506) | Misalignment of select drop-down menu in RISCV architecture | UNCONFIRMED | Firefox / WebPayments UI |
| [1979242](https://bugzilla.mozilla.org/show_bug.cgi?id=1979242) | Firefox on RISCV-64 fails to detect GPU and falls back to software rendering | UNCONFIRMED | Widget: Gtk |
| [1980593](https://bugzilla.mozilla.org/show_bug.cgi?id=1980593) | YouTube video playback lags and freezes on Firefox for riscv64 | UNCONFIRMED | Graphics: WebRender |
| [1984883](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883) | riscv64: build failure in media/libpng/riscv | NEW | Graphics: ImageLib |
| [1984989](https://bugzilla.mozilla.org/show_bug.cgi?id=1984989) | riscv64: Browser Tab Crashes upon Launch on Firefox 143 | UNCONFIRMED | Graphics |
| [1985220](https://bugzilla.mozilla.org/show_bug.cgi?id=1985220) | Build error when trying to build Firefox v142 on RISCV-64 | UNCONFIRMED | Widget: Gtk |
| [1986244](https://bugzilla.mozilla.org/show_bug.cgi?id=1986244) | YouTube video lags on Riscv64 | UNCONFIRMED | Audio/Video |
| [1987699](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699) | [meta] RISCV64 support in SpiderMonkey (56 sub-bugs) | NEW, unassigned | JavaScript Engine: JIT |
| [1998647](https://bugzilla.mozilla.org/show_bug.cgi?id=1998647) | Unable to login via reCAPTCHA/Cloudflare browser check on riscv64 | UNCONFIRMED | Web Compatibility |
| [2023167](https://bugzilla.mozilla.org/show_bug.cgi?id=2023167) | Add Gecko Profiler support for RISCV64 and LoongArch64 | ASSIGNED | Gecko Profiler |
| [2040603](https://bugzilla.mozilla.org/show_bug.cgi?id=2040603) | Show assembler offsets in IONFLAGS=codegen output for arm32 and riscv64 | NEW | JavaScript: WebAssembly |
| [2043179](https://bugzilla.mozilla.org/show_bug.cgi?id=2043179) | Improve riscv64 instruction detection in WasmGC/WasmSummarizeInsn | ASSIGNED | JavaScript: WebAssembly |

Total: 17 open bugs -- 2 ASSIGNED, 4 NEW, 11 UNCONFIRMED. Of the 17, only 2 have an active assignee.

**Recently resolved (June 2026):** [Bug 2046847](https://bugzilla.mozilla.org/show_bug.cgi?id=2046847) "[riscv64] Use Zicond and Zbb in Clear_if_nan and atomic ops" -- filed 2026-06-11, resolved 2026-06-17 (6 days). This used Zicond and Zbb ISA extensions to optimize NaN-clearing routines.

---

## 12. Objections and Upstream Blockers

**1. No CI is the structural blocker for everything else.**
Bug 1957559 (April 2025) documented that the riscv64 JIT had been silently broken for an extended period ("long time broken") because there was no CI to catch regressions. Seven patches were required to restore buildability. This will recur. Every refactor touching MacroAssembler, LIR, or code generation that is not also ported to riscv64 silently breaks the port. The original port authors (PLCT Lab) committed to CI in 2022 and never delivered it. No Mozilla employee is assigned to CI enablement.

**2. The upstream sponsorship model is unclear.**
The riscv64 JIT backend was written by PLCT Lab/ISCAS, which receives Chinese Academy of Sciences funding. Active maintenance in 2025 shifted to an independent contributor (Rong Bao, no stated institutional affiliation). Mozilla has no dedicated riscv64 maintainer. The meta-bug [Bug 1987699](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699) (P3) is unassigned. This creates a maintenance risk: if active community contributors reduce involvement, regressions will accumulate silently.

**3. WASM SIMD is completely absent.**
WASM SIMD is a hard compile-time error (`#error`) on riscv64. The RVV assembler encoding layer exists in `extension/extension-riscv-v.cc` but no CodeGenerator, Lowering, or LIR integration has been written. This is not a performance gap -- it is a missing feature that causes WebAssembly SIMD applications to fail entirely. Modern web workloads (image processing, codecs, ML inference) increasingly rely on WASM SIMD.

**4. GPU detection fails on riscv64.**
[Bug 1979242](https://bugzilla.mozilla.org/show_bug.cgi?id=1979242) (UNCONFIRMED) reports Firefox falls back to software rendering on riscv64. The November 2024 QA report tested on Milk-V Pioneer Box with AMD R5 230 GPU and Sipeed LicheePi 4A with no GPU support (Basemark returned "incompatible" for the LicheePi). Without hardware GPU acceleration, WebRender performance is severely degraded.

**5. Video playback is broken or severely degraded.**
Three open bugs report video playback failures: [Bug 1980593](https://bugzilla.mozilla.org/show_bug.cgi?id=1980593) (WebRender lag/freeze), [Bug 1986244](https://bugzilla.mozilla.org/show_bug.cgi?id=1986244) (YouTube lag), and the November 2024 QA report notes "Bilibili video playback fails" and "hardware video decode not supported on any tested RISC-V board." The combination of software rendering and no hardware video decode makes video-heavy web usage impractical at current clock speeds.

**6. Performance is constrained by single-core clock speed, not solely by JIT quality.**
The November 2024 QA report notes: "Limited by the single-core performance of SG2042 and TH1520, it cannot run very smoothly." The SG2042 (64 cores at 2.0 GHz) scores 0.747 on Speedometer 3 vs 10-20 on x86-64. JIT improvements will help at the margins but the fundamental bottleneck is hardware. This limits the return on JIT optimization investment until higher-clock riscv64 SoCs are widely available.

**7. Debian riscv64 builds are blocked from testing.**
Despite Debian sid having riscv64 build infrastructure, the current firefox package (152.0.1-1) is showing "Needs-Build" status on riscv64 and is blocking migration to Debian testing. This suggests the build is either queued and slow, or hitting a toolchain/dependency issue. Without a stable Debian riscv64 package, the primary Linux distro path for riscv64 Firefox is through Fedora or community-maintained packages.

---

## 13. Investment Analysis

This section describes the work items, estimated effort, and priority for a company seeking to improve Firefox's riscv64 status for engineering or product purposes.

### 13.1 Functional Enablement

These items fix missing functionality that prevents certain web content from working at all.

**WASM SIMD (RVV integration):** The RVV assembler encoding layer exists. The work required is: (a) design and implement the Lowering layer for all SIMD LIR nodes on riscv64, (b) implement the CodeGenerator SIMD visitors (~19 functions currently stubbed as `MOZ_CRASH`), (c) write the SIMD LIR instruction definitions, (d) write tests and iterate on correctness. This is the single highest-value functional investment. Estimated effort is large due to the number of SIMD operations. Reference: arm64 SIMD implementation size (CodeGenerator-arm64.cpp, Lowering-arm64.cpp) and the existing RVV encoding primitives in `extension/extension-riscv-v.cc`.

Data not available: Precise person-week estimates for WASM SIMD implementation. The arm64 SIMD implementation required multiple contributors over multiple months; riscv64 would benefit from having the encoding layer already present.

**`visitNearbyInt` / `visitNearbyIntF` (Ion, `Math.round` family):** Two functions currently `MOZ_CRASH("NYI")` in `CodeGenerator-riscv64.cpp`. RISC-V has round-to-nearest-integer FP instructions (FCVT.W.D with appropriate rounding mode). This is a self-contained fix, estimated 1-2 person-weeks.

**GPU detection (Bug 1979242):** Requires diagnosing why `Widget: Gtk` does not detect GPU on riscv64 boards. The fix is likely in the GL/EGL initialization path or a hardware capability check. Data not available: root cause analysis.

**Gecko Profiler riscv64 support (Bug 2023167, ASSIGNED):** Stack unwinding and CPU sampling for the Gecko Profiler. ASSIGNED but no timeline data available. This is a developer tooling gap, not a user-facing functional gap, but it blocks any serious performance work on riscv64 Firefox.

### 13.2 Performance Optimization

**NSS crypto assembly (AES-Zkn, Zvk, Zbkb, Zbkx, SHA256/512 scalar opt):** NSS runs all crypto on scalar C on riscv64. The RISC-V ISA includes AES and SHA extensions (Zkn, Zks, Zkr) specifically for hardware-accelerated crypto. Firefox uses NSS for all TLS. Implementing AES-GCM and ChaCha20-Poly1305 acceleration in NSS freebl for riscv64 would directly reduce TLS overhead. This is separable from Firefox itself and benefits all NSS users. Estimated effort: medium (comparable to the NSS arm64 crypto implementation).

**jemalloc riscv64 optimizations:** Adding a Zihintpause `pause` instruction for spin-wait loops and any riscv64-specific arena size configuration. Low effort, moderate impact on multi-threaded memory allocation.

**zstd Huffman fast loop (PR #4622):** Open upstream PR to enable 4-way Huffman decompression fast path on riscv64. Firefox uses zstd for network compression. This is an upstream contribution, not Firefox-specific. Estimated effort: low (PR is in progress upstream).

### 13.3 CI/CD Infrastructure

**Taskcluster riscv64 build task:** Add a `linux-riscv64/opt` build task to `taskcluster/kinds/build/linux.yml`, a corresponding sysroot to `taskcluster/kinds/toolchain/sysroot.yml`, and a riscv64 cross-compiler toolchain to `taskcluster/kinds/toolchain/clang.yml` or `gcc.yml`. This is a prerequisite for catching the class of regression demonstrated by Bug 1957559 (silent JIT breakage). Without this, any investment in riscv64 functionality will degrade over time as architecture-neutral changes silently break riscv64.

**Taskcluster riscv64 SpiderMonkey simulator task:** Add `sm-riscv64-sim-linux64` to `taskcluster/kinds/spidermonkey/linux.yml`, analogous to the existing `sm-arm64-sim-linux64`. This enables jit-tests to run on riscv64 in a simulated environment on x86-64 CI hardware, without requiring native riscv64 machines. This is lower cost than native hardware CI and directly addresses the regression risk.

**RISE RISC-V Runners adoption:** RISE launched a free native RISC-V CI program (RISE RISC-V Runners, March 2026). Firefox has not adopted it. This would provide native riscv64 CI without requiring Mozilla to procure riscv64 hardware. The program is available to open-source projects and was specifically designed to eliminate the barrier of hardware access. Data not available: whether Mozilla has been approached about RISE Runners adoption.

### 13.4 Ecosystem Enablement

**Debian riscv64 package:** Diagnose and fix the current "Needs-Build" status for firefox 152.0.1-1 on riscv64 in Debian sid. This would unblock migration to Debian testing and provide a stable package for the most widely deployed riscv64 Linux distro ecosystem. Root cause data not available from the research.

**Official Mozilla binary:** Mozilla does not ship an official linux-riscv64 binary. Adding riscv64 to the Mozilla release builds is a longer-term goal that depends on CI first. It requires a supported cross-compilation toolchain, release engineering integration, and a clear tier policy designation.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | WASM SIMD (RVV) -- Lowering + CodeGenerator + LIR integration | Data not available | Unassigned (upstream) | Critical |
| Functional | `visitNearbyInt` / `visitNearbyIntF` Ion stubs | 1-2 | Unassigned | High |
| Functional | GPU detection fix (Bug 1979242) | Data not available | Unassigned | High |
| CI/CD | SpiderMonkey riscv64 simulator CI task (`sm-riscv64-sim-linux64`) | 2-4 | Mozilla (with community support) | Critical |
| CI/CD | Taskcluster riscv64 build task + sysroot | 4-8 | Mozilla (with community support) | High |
| CI/CD | RISE RISC-V Runners adoption | 1-2 | Mozilla / RISE | High |
| Performance | NSS riscv64 crypto assembly (Zkn, Zks) | 8-16 | Unassigned (NSS team) | High |
| Performance | jemalloc Zihintpause pause instruction | 1 | Unassigned | Low |
| Performance | zstd Huffman fast loop (PR #4622, upstream) | Upstream (in progress) | Upstream | Low |
| Tooling | Gecko Profiler riscv64 stack unwinding (Bug 2023167) | Data not available | ASSIGNED (unknown) | Medium |
| Ecosystem | Debian riscv64 package unblock | Data not available | Debian maintainers | Medium |
| Ecosystem | Official Mozilla linux-riscv64 binary | Data not available | Mozilla release engineering | Low (long-term) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Bug 1318905 -- Add riscv64 as target architecture to mozbuild](https://bugzilla.mozilla.org/show_bug.cgi?id=1318905)
- [Bug 1717203 -- [meta] Linux/riscv64 Port (RESOLVED FIXED)](https://bugzilla.mozilla.org/show_bug.cgi?id=1717203)
- [Bug 1733512 -- Enable RISC-V building (open, unassigned)](https://bugzilla.mozilla.org/show_bug.cgi?id=1733512)
- [Bug 1790800 -- Disable WebMIDI support on Linux/riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1790800)
- [Bug 1800431 -- SpiderMonkey riscv64 JIT backend (RESOLVED FIXED Firefox 111)](https://bugzilla.mozilla.org/show_bug.cgi?id=1800431)
- [Bug 1826741 -- Enable JIT by default on riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1826741)
- [Bug 1837111 -- Enable wasm baseline compiler on riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1837111)
- [Bug 1837852 -- RISCV64 baseline wasm compiler results in black screen (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1837852)
- [Bug 1880366 -- Add RISC-V support to jit::Disassemble (RESOLVED FIXED Firefox 125)](https://bugzilla.mozilla.org/show_bug.cgi?id=1880366)
- [Bug 1944011 -- Fix register allocation for LAtomicTypedArrayElementBinop64 on RISCV (RESOLVED FIXED Firefox 136)](https://bugzilla.mozilla.org/show_bug.cgi?id=1944011)
- [Bug 1957559 -- Various SpiderMonkey riscv64 JIT fixes (RESOLVED FIXED Firefox 139)](https://bugzilla.mozilla.org/show_bug.cgi?id=1957559)
- [Bug 1974946 -- Compilation failure SharedICHelpers-riscv64-inl.h (RESOLVED FIXED Firefox 144)](https://bugzilla.mozilla.org/show_bug.cgi?id=1974946)
- [Bug 1975643 -- Implement WASM JSPI for riscv64 (RESOLVED FIXED Firefox 142)](https://bugzilla.mozilla.org/show_bug.cgi?id=1975643)
- [Bug 1979242 -- Firefox on RISCV-64 fails to detect GPU (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1979242)
- [Bug 1982266 -- JIT re-enabled by default on riscv64 (Firefox 143)](https://bugzilla.mozilla.org/show_bug.cgi?id=1982266)
- [Bug 1984883 -- riscv64: build failure in media/libpng/riscv (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883)
- [Bug 1984989 -- riscv64: Browser Tab Crashes upon Launch on Firefox 143 (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1984989)
- [Bug 1987699 -- [meta] RISCV64 support in SpiderMonkey (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699)
- [Bug 2023167 -- Add Gecko Profiler support for RISCV64 and LoongArch64 (ASSIGNED)](https://bugzilla.mozilla.org/show_bug.cgi?id=2023167)
- [Bug 2043179 -- Improve riscv64 instruction detection in WasmGC/WasmSummarizeInsn (ASSIGNED)](https://bugzilla.mozilla.org/show_bug.cgi?id=2043179)
- [Bug 2046847 -- Use Zicond and Zbb in Clear_if_nan and atomic ops (RESOLVED FIXED)](https://bugzilla.mozilla.org/show_bug.cgi?id=2046847)
- [gecko-dev mirror (read-only)](https://github.com/mozilla/gecko-dev)
- [gecko-dev PR #548 -- Build for Riscv64 (auto-closed)](https://github.com/mozilla/gecko-dev/pull/548)
- [PLCT Lab gecko-dev-riscv fork](https://github.com/plctlab/gecko-dev-riscv)
- [PLCT QA Team Firefox RISC-V availability report (November 2024)](https://github.com/QA-Team-lo/firefox_test)
- [archriscv-packages firefox patches](https://github.com/felixonmars/archriscv-packages)
- [Firefox build system supported configurations](https://firefox-source-docs.mozilla.org/build/buildsystem/supported-configurations.html)
- [Firefox cross-compilation documentation](https://firefox-source-docs.mozilla.org/build/buildsystem/cross-compile.html)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement (March 2026)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)