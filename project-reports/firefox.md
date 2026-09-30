---
title: Firefox
parent: Project Reports
color: orange
dependencies:
  - name: SpiderMonkey
    relation: runtime-dependency
    criticality: critical
  - name: NSS
    relation: runtime-dependency
    criticality: critical
  - name: NSPR
    relation: runtime-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: dav1d
    relation: runtime-dependency
    criticality: optional
  - name: libjpeg-turbo
    relation: runtime-dependency
    criticality: optional
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: Highway
    relation: runtime-dependency
    criticality: optional
  - name: libjxl
    relation: runtime-dependency
    criticality: optional
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: libwebrtc
    relation: runtime-dependency
    criticality: optional
  - name: libaom
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: libsrtp
    relation: runtime-dependency
    criticality: optional
  - name: libwebp
    relation: runtime-dependency
    criticality: optional
  - name: libffi
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="firefox" %}

# Firefox

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Firefox<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Firefox is a web browser developed by Mozilla Corporation, the commercial subsidiary of the Mozilla Foundation. The codebase is licensed MPL 2.0. Development occurs in Mozilla's internal repository; the GitHub repository [mozilla-firefox/firefox](https://github.com/mozilla-firefox/firefox) (13.3k+ stars, created 2024-07-30) is a read-only mirror of landed commits. Code review happens on Phabricator (phabricator.services.mozilla.com), and all bug/feature tracking happens on [Bugzilla](https://bugzilla.mozilla.org/), not GitHub Issues or Pull Requests: a live search of `riscv`/`riscv64` against both `mcp__github__search_issues` and `mcp__github__search_pull_requests` scoped to this repo returned `total_count: 0` in every attempt (repeated independently across multiple research passes). The mirror's only GitHub Actions workflow, `.github/workflows/close-pr.yml`, auto-closes any GitHub PR opened against it; it is not a CI pipeline.

Mozilla is not a RISE Project member. RISE's published Premier members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) contain no web-browser vendor. RISE's publicly documented funded work covers Java/OpenJDK, Go, Rust, LLVM/Clang, Python binary packages, V8 (Chrome's JS engine, not SpiderMonkey), Yocto, Android, the Linux kernel, and CI infrastructure (RISE RISC-V Runners). A full read of the RISE blog archive (riseproject.dev/feed/, ~30 posts, May 2024 through September 2026) and the RISE Python wheel builder's 89-package list found zero mentions of Firefox, Mozilla, or SpiderMonkey.

The JavaScript/WebAssembly engine is SpiderMonkey, which has a multi-tier JIT compiler (Baseline and Ion/Warp). JIT backends are architecture-specific; the riscv64 backend lives at `js/src/jit/riscv64/` in the tree. The riscv64 port was originated externally by PLCT Lab (Institute of Software, Chinese Academy of Sciences, ISCAS) and reviewed/gated by Mozilla SpiderMonkey engineers. Community stance: Mozilla accepts riscv64 patches through its normal Phabricator/Bugzilla review process, and since 2024-2025 Mozilla staff (notably Makoto Kato and Andre Bargull) have picked up ongoing riscv64 codegen maintenance themselves, indicating the port is treated as ordinary maintained code rather than experimental or quarantined -- but it remains externally initiated and has no dedicated Mozilla-funded maintainer.

## 2. Port History and Upstreaming Timeline

| Firefox version | Approximate date | Milestone | Bug / Commit |
|---|---|---|---|
| 79 | Jun 2020 | riscv64 architecture recognition in mozbuild; atomic operations via `AtomicOperations-feeling-lucky.h` | [Bug 1318905](https://bugzilla.mozilla.org/show_bug.cgi?id=1318905) |
| n/a | Dec 2021 | Preprocessor support for `__riscv`/`__riscv_xlen` macro detection (cherry-picked from libwebrtc) | commit `9dff2f865135` area / Bug 1738872 |
| ~91 | Jul 2021 | `riscv64` defines added to `build/build_config.h` | [Bug 1719115](https://bugzilla.mozilla.org/show_bug.cgi?id=1719115) |
| n/a | Sep 2021 | First successful native riscv64 Linux build reported by Makoto Kato (slow, interpreter-only, no JIT) | RISC-V International sw-dev mailing list, "[Now we have Firefox running on RISC-V Linux!](https://groups.google.com/a/groups.riscv.org/g/sw-dev/c/81caeTrQWLs)" (Sep 2021) |
| n/a | 2021-2022 | [meta] Linux/riscv64 Port bring-up | [Bug 1717203](https://bugzilla.mozilla.org/show_bug.cgi?id=1717203), RESOLVED FIXED |
| 106 | Sep 2022 | WebMIDI disabled on riscv64 (`midir` crate incompatible) | [Bug 1790800](https://bugzilla.mozilla.org/show_bug.cgi?id=1790800) |
| 111 | Jan 2023 | SpiderMonkey riscv64 JIT backend landed; Kraken benchmark shows 10x-20x average speedup, up to 40x, over interpreter-only | [Bug 1800431](https://bugzilla.mozilla.org/show_bug.cgi?id=1800431); openEuler blog, "[Firefox on openEuler RISC-V Boosts Performance](https://www.openeuler.org/en/blog/20230113-RISC/RISC.html)" |
| 114 | Apr 2023 | JIT enabled by default on riscv64 (`JS_CODEGEN_RISCV64`) | [Bug 1826741](https://bugzilla.mozilla.org/show_bug.cgi?id=1826741), commit `b0ae0f813e72` |
| 116 | Jun 2023 | WASM baseline compiler enabled on riscv64 | [Bug 1837111](https://bugzilla.mozilla.org/show_bug.cgi?id=1837111) |
| 125 | Mar 2024 | RISC-V disassembler wired to `disnative(f)` JS shell function | [Bug 1880366](https://bugzilla.mozilla.org/show_bug.cgi?id=1880366), commit `77bd0518b1e6` |
| 136 | Jan 2025 | Register allocation fix for `LAtomicTypedArrayElementBinop64` on RISCV | [Bug 1944011](https://bugzilla.mozilla.org/show_bug.cgi?id=1944011) |
| 139 | Apr 2025 | Seven JIT fixes ported from other architectures; JIT had been "long time broken" with no CI to catch it | [Bug 1957559](https://bugzilla.mozilla.org/show_bug.cgi?id=1957559) |
| 142 | Jul 2025 | WASM JSPI (JS Promise Integration / stack switching) implemented for riscv64, both simulator and native paths | [Bug 1975643](https://bugzilla.mozilla.org/show_bug.cgi?id=1975643) |
| 143 | Aug 2025 | JIT re-enabled by default on riscv64 after jit-tests confirmed green; Float32 NaN-boxing correctness bug fixed | [Bug 1982266](https://bugzilla.mozilla.org/show_bug.cgi?id=1982266); [Bug 1975867](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867) |
| 144 | Aug-Sep 2025 | Compilation failure from missed call site in `SharedICHelpers-riscv64-inl.h` fixed | [Bug 1974946](https://bugzilla.mozilla.org/show_bug.cgi?id=1974946) |
| 146 | late 2025 | CVE-2025-14330 intermittent JIT segfault (wrong bit-shift in `unboxGCThingForGCBarrier`) fixed, uplifted to ESR 140.6+ | [Bug 1997503](https://bugzilla.mozilla.org/show_bug.cgi?id=1997503) |
| n/a | Dec 2025 | Zbb bitmanip extension support landed | [Bug 2003218](https://bugzilla.mozilla.org/show_bug.cgi?id=2003218), commit `96837ab7824d` |
| n/a | May-Jun 2026 | Simulator fixes (xnor/binv/bset/c.srli), Zba specialization fix | Bug 2037888 (commit `b331d8c72b7d`), Bug 2042757 (commit `3f5253d103af`) |
| n/a | Aug 2026 | `-fstack-clash-protection` enabled on riscv64 for Clang >= 22.1.8 | [Bug 2066959](https://bugzilla.mozilla.org/show_bug.cgi?id=2066959), commit `520da1af89c2` (most recent riscv64 commit found) |

**Commit volume:** 51 commits matching `riscv`/`riscv64` were found on the GitHub mirror's default branch (Dec 2021 - Aug 2026), all merged (commits are immutable once landed; there is no "open" PR state on this repo). Activity is continuous through the most recent data point (Aug 27, 2026), not a one-time port that has since gone dormant.

**Key contributors and affiliations:** Lu Yahan (ISCAS/PLCT Lab) authored the bulk of the original 2022-2023 JIT port and WASM feature work. Rong Bao (independent, no stated institutional affiliation, webmaster@csmantle.top / GitHub CSharperMantle) is the most active contributor in 2025-2026, covering JSPI, simulator fixes, Zba/Zbb work, and build hardening. Makoto Kato and Andre Bargull (both Mozilla) perform ongoing register-allocation and correctness fixes, including resolving the "long time broken" JIT in Bug 1957559. Jan de Mooij and Nicolas B. Pierron (both Mozilla) are the primary SpiderMonkey reviewers/gatekeepers for riscv64 patches; Pierron filed and owns meta-bug 1987699.

**Is it fully upstream?** Yes, in the sense that all landed patches are in mozilla-central and synced to the public mirror; there is no out-of-tree fork required for functional riscv64 JS execution. However, "fully upstream" does not mean "fully supported": Firefox publishes no CI, no tier classification, and no official binary for riscv64 (see Sections 3, 7, 8). The original tracking meta-bug ([Bug 1717203](https://bugzilla.mozilla.org/show_bug.cgi?id=1717203)) was resolved FIXED for initial bring-up; ongoing work now tracks under a newer meta-bug, [Bug 1987699](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699) ("[meta] RISCV64 support in SpiderMonkey"), which is NEW, P3, and unassigned, with approximately 56 open sub-bugs.

## 3. Upstream Support Tier

Firefox's documented three-tier support policy (firefox-source-docs.mozilla.org/build/buildsystem/supported-configurations.html, per the prior review of this document):

- **Tier 1:** Android (x86-64, ARMv7, ARMv8-A), Linux (x86-64, AArch64), macOS (x86-64, AArch64), Windows (x86, x86-64, AArch64). Regressions trigger immediate reversion.
- **Tier 2:** Windows/x86 via mingw-clang only. Community-maintained.
- **Tier 3:** Linux ARM variants beyond Tier 1, PowerPC, x86; FreeBSD, OpenBSD, NetBSD, Solaris. No CI guarantees.

**riscv64 does not appear in the tier policy document at all.** This is corroborated directly by the CI evidence in Section 7: Firefox's actual Taskcluster pipeline definitions (`taskcluster/kinds/build/linux.yml`, `test-platforms.yml`, `spidermonkey/linux.yml`, `sysroot.yml`, `clang.yml`, `gcc.yml`) contain zero riscv64 entries. riscv64 sits below Tier 3: code exists and builds, but there is no CI enforcement, no official toolchain, and no automated regression protection.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Support tier | Tier 1 | Tier 1 | Unlisted / below Tier 3 |
| CI build coverage | Full | Full | None |
| CI test coverage | Full | Full | None |
| Official Mozilla binary | Yes | Yes | No |
| Regression-blocking | Yes | Yes | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 JIT Backend Structure

`js/src/jit/riscv64/` is a full, hand-written JIT codegen backend parallel to x64/arm64/loong64/mips64, gated by `JS_CODEGEN_RISCV64` (set in `js/moz.configure`). Independent GitHub code-search enumeration found 69+ matching files for riscv64 versus 18 for arm64 and 15 for x64; the larger count is inflated by RISC-V's convention of one file pair per ISA extension (A, C, D, F, M, V, Zicsr, Zicond, Zfa, Zfh, Zifencei), not 4x the functional coverage of x64. Component inventory:

| Component | Files (approx. LOC) | Status |
|---|---|---|
| `MacroAssembler-riscv64.{cpp,h,-inl.h}` | 7,274 / 1,292 / 2,256 | Full, with `atomicPause()` as `MOZ_CRASH("NYI")` |
| `Simulator-riscv64.{cpp,h}` | 4,614 / 1,261 | Full software simulator (cross-host JIT testing); FP rounding mode not fully respected, most CSRs crash, ICache methods commented out |
| `CodeGenerator-riscv64.{cpp,h}` | 2,838 / 100 | Scalar codegen full; all ~19 SIMD visitor functions are `MOZ_CRASH("No SIMD")`; `visitNearbyInt`/`visitNearbyIntF` are `MOZ_CRASH("NYI")` |
| `Disasm-riscv64.{cpp,h}` | 2,524 / 77 | Full (landed Firefox 125) |
| `Assembler-riscv64.{cpp,h}` | 1,402 / 729 | Full scalar encoder; explicit `MOZ_CRASH("RISCV64 does not support simd yet.")` for vector paths |
| `Lowering-riscv64.{cpp,h}` | 1,040 / 98 | Scalar full; all SIMD lowerings are `MOZ_CRASH("... SIMD NYI")` |
| `Architecture-riscv64.{cpp,h}` | 391 / 597 | Full; runtime extension detection via Linux `hwprobe` |
| `constant/*` (13 files) + `extension/*` (18 files) | ~4,300 total | Per-extension instruction encoding/disassembly tables, including the V (RVV) extension encoder |
| `base/*` (6 files) | ~2,200 | Base RV64I encode/decode helpers |
| `MoveEmitter-riscv64`, `Trampoline-riscv64` | 409+66+543 | Full; 128-bit VM argument passing is `MOZ_CRASH("NYI")` |

**ISA extensions recognized:** base G (I, M, A, F, D) plus Zba, Zbb, Zbs (bitmanip), Zfa, Zfhmin, Zicond, matching the RVA22U64/RVA23U64 profiles; `Architecture-riscv64.cpp` parses `-march`-style strings and supports runtime detection via the Linux `hwprobe` syscall. The `constant`/`extension` files also encode C (compressed), Zicsr, Zifencei, and V (vector) at the instruction-encoding/disassembler level.

**Confirmed, currently-missing subsystem: JIT SIMD.** The V-extension instruction encoder exists (`extension/extension-riscv-v.cc`, `Constant-riscv-v.h`) but is not wired into CodeGenerator or Lowering. Every WASM/Ion SIMD128 operation on riscv64 is an explicit, unambiguous `MOZ_CRASH` compile/runtime stop, contrasted with arm64, where `CodeGenerator-arm64.cpp` implements real NEON SIMD codegen and only falls back to `MOZ_CRASH` for a build-time-disabled configuration. This is a genuine, acknowledged gap, not a search artifact.

### 4.2 Graphics and Media SIMD (outside SpiderMonkey)

- **pixman** (`gfx/pixman/pixman/pixman/pixman-rvv.c`, 3,271 lines): full RVV-intrinsics implementation of compositing/blend operators, attributed to Samsung Electronics engineers (2024-2025). CPU detection via `riscv_hwprobe`/`RISCV_HWPROBE_IMA_V` in a companion 85-line file.
- **libpng** (`media/libpng/riscv/`): RVV-accelerated row filters (up/avg/paeth/sub, 3/4 bpp), gated by `PNG_RISCV_RVV_IMPLEMENTATION`, contributors through Dec 2025 including SpacemiT/OpenCV engineers.
- **libyuv** (`media/libyuv/libyuv/source/row_rvv.cc`, `scale_rvv.cc`, ~4,100 lines combined): RVV-accelerated YUV/RGB conversion, scaling, rotation, contributed by SiFive, plus a QEMU-based RISC-V CI toolchain script under `media/libyuv/libyuv/riscv_script/`.
- **snappy, xxhash**: partial RVV/`__riscv_vector` paths (C intrinsics, not hand-tuned assembly).
- **brotli**: `ARCH_RISCV64` detection macro only; no vectorized routine.
- **libvpx (VP8/VP9), libaom (AV1 encode), libdav1d (AV1 decode, Firefox's vendored copy), libjpeg-turbo (Firefox's vendored copy)**: an independent, targeted verification pass found **zero riscv-specific code** in any of these four vendored copies inside the Firefox tree -- all run pure generic scalar C on riscv64. `AOM_ARCH_RISCV` is defined but always 0 in every generated libaom config, and no `config/linux/riscv64/` directory exists (compare `config/linux/arm/`, `config/mac/arm64/`).

**Discrepancy flagged [NEEDS VERIFICATION]:** This zero-riscv-code finding for Firefox's vendored libdav1d and libjpeg-turbo directly contradicts other evidence gathered in this same research pass: `third_party/dav1d/meson.build` was separately reported to explicitly detect riscv64 (`host_machine.cpu_family().startswith('riscv')`) with a `src/riscv/64/` subdirectory, and upstream libjpeg-turbo is confirmed to have merged RVV SIMD in its 3.1.90/3.2-beta1 releases (Feb-Mar 2026), with [Bug 1984883](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883) open against a riscv64 build failure specifically in Firefox's embedded libpng/libjpeg-turbo code, implying riscv-specific code paths are present and currently broken, not absent. The two sets of findings cannot both be fully correct as stated; the most likely reconciliation is that Firefox's *vendored snapshot* of these libraries in-tree lags the upstream RVV work (i.e., dav1d's riscv support and libjpeg-turbo's RVV SIMD exist upstream but have not yet been re-vendored into `third_party/dav1d` and `media/libjpeg`), but this was not independently confirmed via direct diff of the vendored source against upstream in this research pass. Treat the exact current state of dav1d/libjpeg-turbo RVV code inside Firefox's tree as unresolved pending a direct file-level check.

### 4.3 Platform/ABI Glue (no JIT, scalar RV64)

- `js/src/ctypes/libffi/src/riscv/` (`ffi.c`, `ffitarget.h`, `internal.h`, `sysv.S`): full libffi RISC-V System V ABI support including a hand-written assembly trampoline (`sysv.S`, 317 lines), used by js-ctypes.
- `xpcom/reflect/xptcall/md/unix/{xptcinvoke_riscv64.cpp, xptcstubs_riscv64.cpp, xptcinvoke_asm_riscv64.S}`: full XPCOM method-invocation stubs including hand-written assembly, hard-float ABI only (`#error`s on soft-float).

### 4.4 Comparison Table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Scalar JIT (Baseline/Ion) | Full | Full | Full, hand-tuned |
| JIT SIMD (WASM/Ion SIMD128) | Full (SSE/AVX) | Full (NEON) | Missing -- `MOZ_CRASH` stubs throughout |
| JIT disassembler | Full | Full | Full (since Firefox 125) |
| JIT simulator | Full (x86 sim) | Full (arm64 sim) | Full, with noted gaps (FP rounding, CSRs, ICache) |
| WASM JSPI (stack switching) | Full | Full | Full (since Firefox 142) |
| 64-bit lock-free atomics | Full | Full | Full |
| Spectre mitigations | Full | Full | Deliberately disabled (same as MIPS64/LoongArch64) |
| pixman/libpng/libyuv SIMD | Full (SSE/NEON-equiv) | Full | RVV intrinsics (partial tier -- correctness bugs found post-merge) |
| libvpx/libaom/libdav1d/libjpeg codec SIMD | Full | Full | Scalar/missing in Firefox's vendored copies, per direct verification -- see 4.2 discrepancy note |
| libffi / XPCOM ABI glue | Full | Full | Full, hand-written assembly |

## 5. Build System, Cross-Compilation, and Toolchain

Firefox has no CMakeLists.txt, setup.py, Cargo.toml, or package.json at the repository root -- it is built via `mach` + `moz.configure`/`old-configure` + `moz.build`, a Python-based configure/build system with a Rust/Cargo component. This was directly confirmed: `CMakeLists.txt`, `cmake/riscv64.cmake`, and `cmake/toolchain-riscv64.cmake` all return 404 on the mirror; `mach` and `moz.configure` return 200.

**Architecture recognition** (`build/moz.configure/init.configure`, lines 581-583, confirmed by direct source read):
```python
elif cpu in ("riscv64", "riscv64gc"):
    canonical_cpu = "riscv64"
    endianness = "little"
```
The correct preprocessor macro is `__riscv` combined with `__riscv_xlen == 64`; `__riscv64` does not exist. `config.guess`/`config.sub` (vendored GNU autoconf helpers) recognize `riscv32`, `riscv32be`, `riscv64`, `riscv64be` as valid target triples.

**GCC minimum version, confirmed directly from `build/moz.configure/toolchain.configure` (lines 1375-1376, applies to all targets including riscv64):**
```python
def minimum_gcc_version():
    return Version("11.1.0")
```
This is enforced with a hard `FatalCheckError` if older. No equivalent general Clang minimum is hard-coded the same way.

**riscv64-specific Clang version gate** (`build/moz.configure/toolchain.configure`, lines 2928-2942, confirmed directly), narrow in scope -- it only additionally enables `-fstack-clash-protection` hardening, not a build-blocking minimum:
```python
if (
    c_compiler.type == "clang"
    and target.os not in ("WINNT", "OSX", "OpenBSD", "iOS")
    and (
        (c_compiler.version >= "11.0.1" and target.cpu in ("x86", "x86_64", "ppc64", "s390x"))
        or (c_compiler.version >= "18.1.0" and target.cpu == "aarch64")
        or (c_compiler.version >= "22.1.8" and target.cpu == "riscv64")
        or (c_compiler.version >= "23.1.0" and target.cpu == "loongarch64")
    )
):
    flags.append("-fstack-clash-protection")
```
Older Clang, or GCC >= 11.1.0, can still build riscv64 without this one hardening flag (landed as [Bug 2066959](https://bugzilla.mozilla.org/show_bug.cgi?id=2066959), commit `520da1af89c2`, Aug 2026).

**Native mozconfig** (sourced from Bug 1717203 comment history, validated on HiFive Unmatched hardware [NEEDS VERIFICATION -- single-source]):
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
`--without-wasm-sandboxed-libraries` is required; the WASM sandbox is not available for riscv64. Clang was reported to cause linker failures (`unable to find library -lgcc`) in this configuration; GCC is the recommended compiler.

**Cross-compilation:**
```
ac_add_options --target=riscv64-linux-gnu
ac_add_options --enable-bootstrap
```
Without `--enable-bootstrap`, a manual `--with-sysroot=<path>` is required. No official Mozilla sysroot exists for riscv64 -- `taskcluster/kinds/toolchain/sysroot.yml` was directly confirmed to define sysroots only for `i686-linux-gnu`, `x86_64-linux-gnu`, `aarch64-linux-gnu`, and `wasm32-wasi`.

**Simulator mode:** `--enable-simulator=riscv64` lets an x86-64 or aarch64 host run the riscv64 JIT simulator (a functional-level instruction interpreter ported from V8's RISC-V simulator, covering RVI/M/A/F/D/C/V). A dedicated CI variant file, `js/src/devtools/automation/variants/riscv64-sim` (`--enable-simulator=riscv64`, debug+optimize builds), exists in-tree, confirming the simulator configuration is at least exercised in some automation definition -- though whether that variant is actually scheduled and run on any live CI trigger could not be confirmed (see Section 7).

**Rust:** target `riscv64gc-unknown-linux-gnu` must be installed; Rust is a required build-dependency for the full Firefox build (not just SpiderMonkey).

**Known build failures:** [Bug 1968491](https://bugzilla.mozilla.org/show_bug.cgi?id=1968491), out-of-memory building Firefox v139 on riscv64 (rustc/gkrust OOM after ~30h build, 5GB+ RAM, UNCONFIRMED); [Bug 1984883](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883), build failure in `media/libpng/riscv` (NEW); [Bug 2049559](https://bugzilla.mozilla.org/show_bug.cgi?id=2049559), Firefox 152 fails to compile on riscv64 due to `Simulator-riscv64.h` being unconditionally included even when `JS_SIMULATOR_RISCV64` is not defined -- a fix has been proposed by the reporter but has not landed (UNCONFIRMED).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Baseline JIT | Full | Full | Full |
| Ion/Warp JIT (scalar) | Full | Full | Full |
| WASM baseline | Full | Full | Full |
| WASM SIMD | Full (SSE/AVX) | Full (NEON) | Missing -- compile-time/runtime `MOZ_CRASH` |
| WASM JSPI | Full | Full | Full (since Jul 2025) |
| JIT disassembler | Full | Full | Full (since Mar 2024) |
| `visitNearbyInt`/`visitNearbyIntF` | Full | Full | Missing (`MOZ_CRASH("NYI")`) |
| `atomicPause()` | Full | Full | Missing (`MOZ_CRASH("NYI")`) |
| 64-bit lock-free atomics | Full | Full | Full |
| Spectre mitigations | Full | Full | Disabled (deliberate) |
| CI coverage | Full (Taskcluster Tier 1) | Full (Taskcluster Tier 1) | None (Section 7) |
| Official Mozilla binary | Yes | Yes | No |
| GPU acceleration | Full | Full | Fails to detect GPU; falls back to software rendering ([Bug 1979242](https://bugzilla.mozilla.org/show_bug.cgi?id=1979242), UNCONFIRMED) |
| Hardware video decode | Full | Full | Not supported on tested boards (per PLCT QA report, Nov 2024) |
| Gecko Profiler (stack sampling) | Full | Full | Missing ([Bug 2023167](https://bugzilla.mozilla.org/show_bug.cgi?id=2023167), ASSIGNED) |

**Performance benchmark data** (the only quantitative published source found for Firefox-on-riscv64, PLCT Lab QA team report, November 2024, [github.com/QA-Team-lo/firefox_test](https://github.com/QA-Team-lo/firefox_test)):

- Hardware: Milk-V Pioneer Box (SG2042, 64-core C920 at 2.0GHz, 128GB DDR4, AMD R5 230 GPU) and Sipeed LicheePi 4A (TH1520, RISC-V C910 x4 at 2.0GHz, 16GB LPDDR4X).
- Speedometer 3: 0.747 (Milk-V Pioneer Box), 0.3249 (LicheePi 4A), versus an x86-64 reference range of 10-20 in the same report -- riscv64 is approximately 13x-27x slower on this specific hardware, which conflates CPU clock/microarchitecture limits with any JIT-specific gap.
- Basemark Web: 39.02 (Pioneer Box) versus ~2000 on an x86-64 reference (AMD RX 6600); LicheePi 4A returned "incompatible" (no GPU support).
- SpiderMonkey JIT vs interpreter (SiFive HiFive Unmatched, Nov 2022, pre-dating multiple JIT fix rounds [NEEDS VERIFICATION -- stale]): SunSpider total time ~3,353ms JIT-enabled vs ~24,693ms JIT-disabled (~7.4x speedup), with one regression noted (`regexp/dna` ran slower with JIT than without).
- mozjs115 jit-tests with `--enable-jit` (PLCT, Oct 2024): 390 failures out of 9,980 tests; no root-cause breakdown available.
- The separately sourced RISC-V International mailing-list figure of 10x-20x (up to 40x) Kraken JS speedup from JIT enablement (Jan 2023, cited in Section 2) is a before/after comparison on RISC-V hardware, not a riscv64-vs-arm64 comparison, and carries no disclosed methodology (hardware, Firefox version, run count).
- No published Speedometer 3, JetStream, Kraken, or MotionMark riscv64 scores from 2025 or 2026 were found in any source searched (Mozilla Hacks, riseproject.dev, Phoronix, OpenBenchmarking.org). No RISE publication contains a Firefox-specific benchmark; RISE's only related content is V8 (Chrome's engine) work, e.g. "[A Glimpse Into V8 Development for RISC-V](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)" (Dec 2025), which does not mention SpiderMonkey.

**Security hardening gap:** Spectre mitigations are deliberately disabled on riscv64 (same treatment as MIPS64/LoongArch64), and `-fstack-clash-protection` was only enabled in August 2026 (requires Clang >= 22.1.8). This is a materially thinner hardening posture than Tier-1 amd64/arm64 builds.

**Floating-point/correctness note:** [Bug 1975867](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867), a correctness bug where a Float32 value of 4.0 was corrupted to NaN due to RISC-V's canonical-NaN-boxing register requirement differing from other platforms (Wasm baseline compiler), was fixed in Firefox 143. This class of bug -- subtle architecture-specific FP semantics divergence -- is a recurring risk category given the absence of CI (Section 7).

## 7. CI/CD Infrastructure

**There is no riscv64 CI in Firefox's actual build/test pipeline.** This was directly confirmed by reading Mozilla's Taskcluster definition files, which contain zero riscv64 entries:

- `taskcluster/kinds/build/linux.yml` -- defines all Linux build tasks; architectures present: x86, x86_64, aarch64 only (one pass grepped this file at 1,789 lines with zero riscv hits; a separate pass described it at 2,156 lines, also zero riscv64 entries -- file has evidently grown between reads, but the zero-riscv64 result is consistent across both).
- `taskcluster/kinds/test/test-platforms.yml` -- lists all CI test platforms; no riscv64.
- `taskcluster/kinds/spidermonkey/linux.yml` -- SpiderMonkey build tasks include `sm-arm-sim-linux32` and `sm-arm64-sim-linux64`; no `sm-riscv64-sim-linux64` equivalent, despite the simulator itself existing in-tree (Section 5).
- `taskcluster/kinds/toolchain/sysroot.yml`, `clang.yml`, `gcc.yml`, `rust.yml`, `misc.yml` -- no riscv64 toolchain or sysroot entries.
- `.github/workflows/` on the public mirror contains exactly one workflow, `close-pr.yml`, which auto-closes incoming PRs; it performs zero build or test steps.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Taskcluster, full | Taskcluster, full | None |
| Test CI | Taskcluster, full | Taskcluster, full | None |
| JIT simulator CI variant | N/A (native) | `sm-arm64-sim-linux64` | None found (`js/src/devtools/automation/variants/riscv64-sim` exists as a config file, but no scheduled Taskcluster task references it) |
| Hardware | Mozilla-owned fleet | Mozilla-owned fleet | None |

**Consequence:** [Bug 1957559](https://bugzilla.mozilla.org/show_bug.cgi?id=1957559) (April 2025) demonstrated concretely that the riscv64 JIT had been silently broken for an extended period precisely because no CI exists to catch regressions; seven ported fixes were required to restore a buildable state. This is a structural, recurring risk: any architecture-neutral refactor that misses a riscv64 call site will silently break the port until a contributor manually tests on riscv64 hardware or the simulator.

At the original 2022 port submission, PLCT Lab stated an intent to contribute riscv64 CI to Mozilla's Taskcluster. This has not been delivered as of the most recent commit activity (Aug 2026). Separately, Mozilla's own RISE RISC-V Runners program (free native RISC-V CI on GitHub Actions, launched March 2026, "[Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)") removes the hardware-access barrier that would otherwise block standing up riscv64 CI, but Firefox has not adopted it. Community CI (ci.rvperf.org) exists but is not Mozilla-official and does not appear as a required check in any Taskcluster definition.

## 8. Distribution and Release Status

| Channel | riscv64 status | Evidence |
|---|---|---|
| Mozilla official releases (ftp.mozilla.org) | Not available | Release directories list amd64/arm64 (linux-x86_64, linux-aarch64) only; no linux-riscv64 directory. GitHub mirror releases page: "There aren't any releases here" (zero releases published at all on that mirror, since Firefox ships via mozilla.org, not GitHub release assets) |
| Ubuntu 26.04 "resolute" official archive | Not available | Package-detail page confirmed to list exactly three architectures: amd64, arm64, armhf; an arch-filtered search (`arch=riscv64`) drops the exact-match `firefox` package entirely, leaving only arch:all locale/transitional packages |
| Debian sid (unstable) | Unbuilt | firefox 152.0.1-1 riscv64 status: "Needs-Build," queued, no build machine assigned; blocks migration to Debian testing |
| Fedora 38 | Available (community QA-confirmed) | PLCT Lab QA report tested a usable riscv64 Firefox build on Fedora 38 (Milk-V Pioneer Box), Nov 2024 |
| openKylin 2.0 | Available (community QA-confirmed) | Same PLCT Lab QA report |
| Arch Linux RISC-V port (archriscv.felixc.at) | Available, actively maintained | `firefox-156.0.1-1-riscv64.pkg.tar.zst`, 88,885,332 bytes, confirmed live via HTTP 200/HEAD, last-modified 2026-09-28. Independently cross-validated byte-identical (filename, size, timestamp) on a second, separately operated mirror (riscv.mirror.pkgbuild.com), ruling out a single-source spoof. The project's own build-status dashboard lists `firefox` as up to date, not FTBFS |
| PyPI / GitHub releases on mirror | Not applicable | Firefox is not Python-packaged (no such PyPI project exists, 404); the GitHub mirror publishes no release assets |

**What a user must do to get a working riscv64 binary today:** there is no official Mozilla download. The only verified, currently-live, third-party binary distribution channel is the Arch Linux RISC-V port. Debian's build is queued and not yet available. Ubuntu ships no riscv64 `firefox` package in the 26.04 archive at all. Fedora 38 and openKylin 2.0 shipped working builds as of a November 2024 community QA pass, but the patch status of those distro builds against vanilla upstream source was not independently verified in that report -- per the project-color-coding skill's distribution-floor rule, this caps the overall readiness grade at orange (downstream-only) rather than yellow, since no upstream-official or fully-verified-clean distro build exists (see Section 13).

## 9. Dependencies

### Summary Table

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| SpiderMonkey | Runtime (in-tree JS/WASM engine) | Critical | Yes, full scalar JIT | Simulator-based jit-tests exist, no CI scheduling confirmed | Embedded in Firefox binary | Meta-bug 1987699 (56 open sub-bugs); WASM SIMD missing |
| NSS | Runtime (TLS/crypto) | Critical | Yes, scalar C only | No riscv64-specific crypto test coverage found | Not shipped by Mozilla for riscv64 | 0 open riscv64 issues on `mozilla/nss`; no AES-Zkn/Zvk/RVV acceleration |
| NSPR | Runtime (low-level platform runtime for NSS) | Critical | Assumed via generic POSIX path, not explicitly verified | None found | N/A | [Bug 1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232), FreeBSD/riscv64 NSPR support, UNCONFIRMED |
| Rust | Build (toolchain) | Critical | Target `riscv64gc-unknown-linux-gnu` required and available | N/A | N/A | Rust is a hard build dependency for the full browser, not only SpiderMonkey |
| GCC | Build (toolchain) | Critical | Minimum 11.1.0 (all targets, confirmed from source) | N/A | N/A | GCC is the recommended compiler for riscv64; Clang reported to cause linker failures in some configurations |
| dav1d | Runtime (AV1 decoder) | Optional | RVV support reported in `third_party/dav1d/meson.build`, but a separate verification pass found zero riscv matches in Firefox's vendored copy [NEEDS VERIFICATION -- see 4.2 discrepancy] | Not GitHub-hosted (GitLab/VideoLAN); no live issue check possible | N/A | Contradiction between sources on current vendored state |
| libjpeg-turbo | Runtime (JPEG codec) | Optional | Upstream RVV SIMD merged (3.1.90/3.2-beta1, Feb-Mar 2026); Firefox's embedded copy has an open build failure | -- | -- | [Bug 1984883](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883) (NEW, unassigned); upstream issue #902 "RVV needs to detect RVA23" (open, updated 2026-09-22) |
| libpng | Runtime (PNG codec) | Optional | RVV SIMD merged May 2025 | Post-merge correctness bugs found (issue #711 wrong RVV version; issue #769 Paeth wrong pixels on SpacemiT K1, 52 OpenCV failures, fixed ~1.6.52) | Same Bug 1984883 build failure affects Firefox's embedded copy | No CI for Firefox's embedded copy |
| Highway | Runtime (SIMD portability layer, used by JPEG-XL) | Optional | Builds with `-march=rv64gcv1p0` under `HWY_CMAKE_RVV` | 27 total riscv64 issues on `google/highway`; #3251 "Issues building highway on riscv64" closed 2026-08-21; #2854 "mold-linker problems on riscv64" still open | N/A | JPEG-XL disables RVV by default in Firefox due to test failures |
| libjxl | Runtime (JPEG-XL codec) | Optional | Builds but RVV disabled by default (`JPEGXL_ENABLE_SIZELESS_VECTORS=false`) | TODO comment: "compiles but does not pass tests" | Not active for RVV path in Firefox's embedded copy | PR #1429 abandoned Jun 2022 |
| jemalloc | Runtime (memory allocator) | Optional | Generic fallback, no riscv64-specific tuning | None found | Functional, unoptimized | Open issue #2399 "Does jemalloc support cross build for RISCV64" (since Jun 2024, still open) |
| libwebrtc | Runtime (WebRTC audio/video DSP) | Optional | Builds; `BUILD.gn` has no riscv64 condition, entirely scalar | Not GitHub-hosted (Google Git); no live search possible | N/A | No RVV path for any DSP operation |
| libaom | Runtime (AV1 encoder) | Optional | Builds; `AOM_ARCH_RISCV` defined but always 0; no `config/linux/riscv64/` directory | Not GitHub-hosted (Google Git); no live search possible | N/A | All-scalar AV1 encode |
| zstd | Runtime (compression) | Optional | Builds; partial RVV-adjacent optimization in progress | -- | Used for network compression | Open upstream PR #4622 "huf_decompress: enable 4-way fast loop on riscv64" (in progress, Mar 2026); abandoned Zicclsm PRs #4523/#4524 |
| libsrtp | Runtime (SRTP, WebRTC media encryption) | Optional | Builds | Open test-timeout issue #754 (Apr 2025) | N/A | Likely a test-harness timing issue, not a functional bug |
| libwebp | Runtime (WebP codec) | Optional | Scalar fallback only, no RVV acceleration | Not GitHub-hosted (Chromium Git); no live search possible | N/A | No open issues found |
| libffi | Runtime (used by js-ctypes) | Optional | Full RISC-V System V ABI support including hand-written assembly trampoline (`sysv.S`) | None found | Embedded in Firefox binary | Complete, not a stub |

### Deep-dive: SpiderMonkey, NSS, and codec/SIMD dependencies

See Section 4 for full detail on SpiderMonkey's JIT backend (the highest-effort component: full hand-tuned scalar JIT, missing SIMD) and the graphics/media SIMD libraries (pixman, libpng, libyuv: RVV C-intrinsics tier with post-merge correctness bugs; libvpx/libaom/libdav1d/libjpeg-turbo: scalar or contradictorily-reported in Firefox's vendored copies -- see the explicit discrepancy note in Section 4.2).

NSS (Network Security Services) handles TLS/crypto (AES-GCM, ChaCha20-Poly1305, RSA, ECDH, SHA, certificate validation). No riscv64-specific assembly exists in NSS's `freebl` crypto primitives library; all cryptographic operations run on scalar C fallback. A live check found 0 open riscv64 issues on `mozilla/nss`, indicating the gap has not generated active upstream bug reports, likely because no one has yet prioritized crypto acceleration for this target. This is a meaningful, unaddressed performance gap versus arm64 (hardware AES/SHA) and x86-64 (AES-NI) for TLS-heavy workloads, since RISC-V's Zkn/Zks/Zkr crypto extensions exist in the ISA but are not exploited anywhere in Firefox's TLS stack.

## 11. Known Bugs and Active Issues

| Bug | Title | Status | Component | Severity note |
|---|---|---|---|---|
| [1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232) | Add NSPR support for FreeBSD/riscv64 | UNCONFIRMED | NSPR | Platform gap |
| [1733512](https://bugzilla.mozilla.org/show_bug.cgi?id=1733512) | Enable RISC-V building | NEW, unassigned | Build System | Build |
| [1837852](https://bugzilla.mozilla.org/show_bug.cgi?id=1837852) | RISCV64 baseline wasm compiler results in black screen | UNCONFIRMED | Core: JS WebAssembly | Correctness / rendering |
| [1865601](https://bugzilla.mozilla.org/show_bug.cgi?id=1865601) | Allow gles backend in riscv64 | NEW | Graphics | Functional gap |
| [1968491](https://bugzilla.mozilla.org/show_bug.cgi?id=1968491) | Out of memory building Firefox v139 on riscv64 | UNCONFIRMED | Build System | Build |
| [1972506](https://bugzilla.mozilla.org/show_bug.cgi?id=1972506) | Misalignment of select drop-down menu on RISCV | UNCONFIRMED | WebPayments UI | UI |
| [1979242](https://bugzilla.mozilla.org/show_bug.cgi?id=1979242) | Fails to detect GPU, falls back to software rendering | UNCONFIRMED | Widget: Gtk | Performance-critical |
| [1980593](https://bugzilla.mozilla.org/show_bug.cgi?id=1980593) | YouTube video playback lags/freezes | UNCONFIRMED | Graphics: WebRender | User-facing |
| [1984883](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883) | Build failure in media/libpng/riscv | NEW | Graphics: ImageLib | Build-blocking |
| [1984989](https://bugzilla.mozilla.org/show_bug.cgi?id=1984989) | Browser tab crashes on launch, Firefox 143 | UNCONFIRMED | Graphics | Correctness-critical |
| [1985220](https://bugzilla.mozilla.org/show_bug.cgi?id=1985220) | Build error building Firefox v142 on RISCV-64 | UNCONFIRMED | Widget: Gtk | Build |
| [1986244](https://bugzilla.mozilla.org/show_bug.cgi?id=1986244) | YouTube video lags on riscv64 | UNCONFIRMED | Audio/Video | User-facing |
| [1987699](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699) | [meta] RISCV64 support in SpiderMonkey (~56 sub-bugs) | NEW, unassigned, P3 | JS Engine: JIT | Meta-tracker |
| [1998647](https://bugzilla.mozilla.org/show_bug.cgi?id=1998647) | Unable to login via reCAPTCHA/Cloudflare check | UNCONFIRMED | Web Compatibility | User-facing |
| [2023167](https://bugzilla.mozilla.org/show_bug.cgi?id=2023167) | Add Gecko Profiler support for RISCV64/LoongArch64 | ASSIGNED | Gecko Profiler | Tooling |
| [2040603](https://bugzilla.mozilla.org/show_bug.cgi?id=2040603) | Show assembler offsets in IONFLAGS=codegen for arm32/riscv64 | NEW | JS: WebAssembly | Tooling |
| [2043179](https://bugzilla.mozilla.org/show_bug.cgi?id=2043179) | Improve riscv64 instruction detection in WasmGC/WasmSummarizeInsn | ASSIGNED | JS: WebAssembly | Tooling |
| [2049559](https://bugzilla.mozilla.org/show_bug.cgi?id=2049559) | Firefox 152 fails to compile on riscv64 (`Simulator-riscv64.h` include guard) | UNCONFIRMED, fix proposed not landed | JS Engine: JIT | Build-blocking regression |
| [2071556](https://bugzilla.mozilla.org/show_bug.cgi?id=2071556) | Assertion failure (`label->used()...`) in codegen | ASSIGNED | JS Engine: JIT | Correctness |

**Correctness bugs (resolved, shown for pattern context -- these illustrate the CI-absence risk described in Section 7):** [Bug 1975867](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867), Float32 NaN-boxing corruption, fixed Firefox 143; [Bug 1997503](https://bugzilla.mozilla.org/show_bug.cgi?id=1997503) (CVE-2025-14330), intermittent JIT segfault from a wrong bit-shift, fixed and uplifted to ESR 140.6+; [Bug 1996840](https://bugzilla.mozilla.org/show_bug.cgi?id=1996840) (CVE-2025-14324), assertion failure/branch-offset overflow in JIT constant-pool veneer handling affecting both arm64 and riscv64, fixed. That two riscv64-specific CVEs were assigned in the recent period, on a port with no CI, is a direct illustration of the structural risk in Section 7 and Section 12.

Total open count: 18 bugs, of which 3 are ASSIGNED and the remainder are NEW or UNCONFIRMED with no active assignee.

## 12. Objections and Upstream Blockers

**1. No CI is the structural blocker underlying everything else.** [Bug 1957559](https://bugzilla.mozilla.org/show_bug.cgi?id=1957559) (April 2025) documented that the riscv64 JIT was silently broken for an extended period precisely because no CI existed to catch it -- confirmed structurally by the direct, zero-hit reads of `taskcluster/kinds/build/linux.yml`, `test-platforms.yml`, and `spidermonkey/linux.yml` in Section 7. This is not a one-time historical incident: the recurrence risk is structural and will repeat for as long as no automated riscv64 build/test task exists. PLCT Lab committed to contributing this CI at the original 2022 port submission and has not delivered it as of the latest commit activity (Aug 2026).

**2. The upstream sponsorship model is thin and informal.** The riscv64 JIT backend was authored primarily by PLCT Lab/ISCAS (Chinese Academy of Sciences funding). Active maintenance in 2025-2026 has substantially shifted to an independent contributor (Rong Bao) with no disclosed institutional affiliation, alongside occasional Mozilla-staff fixes (Makoto Kato, Andre Bargull) triggered reactively by breakage rather than a standing maintenance commitment. The current meta-bug ([Bug 1987699](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699), P3, unassigned, ~56 sub-bugs) has no owner. If the current volunteer contributor's involvement decreases, regressions will accumulate silently given the absence of CI.

**3. WASM SIMD is a confirmed, complete functional gap.** The RVV instruction encoder exists but has no CodeGenerator/Lowering/LIR integration; every SIMD128 operation is a `MOZ_CRASH` stub. This blocks any WebAssembly application that requires SIMD (image processing, codecs, ML inference) from functioning on riscv64 Firefox at all, not merely running it slower.

**4. GPU detection and video playback are broken or severely degraded.** [Bug 1979242](https://bugzilla.mozilla.org/show_bug.cgi?id=1979242) (GPU detection failure, software-rendering fallback), [Bug 1980593](https://bugzilla.mozilla.org/show_bug.cgi?id=1980593) and [Bug 1986244](https://bugzilla.mozilla.org/show_bug.cgi?id=1986244) (YouTube lag/freeze), and [Bug 1984989](https://bugzilla.mozilla.org/show_bug.cgi?id=1984989) (tab crash on launch, Firefox 143) are all open and unassigned/UNCONFIRMED. The PLCT QA report separately notes no hardware video decode on any tested riscv64 board. The combination of software rendering and no hardware video decode makes video-heavy usage impractical on current hardware independent of any JIT quality improvement.

**5. Performance is bottlenecked by hardware clock speed as much as by software.** The PLCT report notes the SG2042 and TH1520 SoCs' limited single-core performance directly caps Speedometer 3 results at 0.747 and 0.3249 respectively, versus an x86-64 reference of 10-20. JIT-only improvements have diminishing marginal return until higher-clock riscv64 SoCs are more widely available; this affects how the investment items in Section 14 should be prioritized.

**6. Debian's riscv64 build remains queued, blocking the primary Linux distro path.** Firefox 152.0.1-1 on riscv64 in Debian sid is "Needs-Build" with no assigned build machine, blocking migration to Debian testing. Ubuntu 26.04 ships no riscv64 `firefox` package at all.

**7. RISE, the primary RISC-V ecosystem-funding body, has no Firefox involvement and Mozilla is not a member,** meaning none of the standing funded-work channels (CI runners, wheel builders, working groups) that other RISC-V software efforts draw on apply to Firefox today without a deliberate new engagement.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- **Justification:** Firefox has no upstream riscv64 CI: the Taskcluster files that define Mozilla's actual build/test pipeline (`taskcluster/kinds/build/linux.yml`, `test-platforms.yml`, `spidermonkey/linux.yml`, `sysroot.yml`, `clang.yml`, `gcc.yml`) contain zero riscv64 entries, and the GitHub mirror's only GitHub Actions workflow (`.github/workflows/close-pr.yml`) just auto-closes PRs, so there is no build, test, or release pipeline for riscv64 ([mozilla-firefox/firefox](https://github.com/mozilla-firefox/firefox)). Mozilla ships no official riscv64 binary (ftp.mozilla.org release directories list linux-x86_64/aarch64 only) and Ubuntu 26.04/Debian sid do not have a built riscv64 `firefox` package (Debian is stuck at "Needs-Build"), but Fedora 38 and openKylin 2.0 did ship usable riscv64 Firefox builds per PLCT Lab's QA report ([QA-Team-lo/firefox_test](https://github.com/QA-Team-lo/firefox_test), Nov 2024) with unverified patch status against vanilla upstream source, which per the distribution-floor rule caps the grade at orange (downstream-only) rather than yellow.
- **Pending work that could change the grade:** Bugzilla meta-bug [1987699](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699) tracks ~56 open SpiderMonkey riscv64 sub-bugs, unassigned, P3. [Bug 1957559](https://bugzilla.mozilla.org/show_bug.cgi?id=1957559) (Apr 2025) showed the riscv64 JIT had been silently broken for an extended period precisely because there is no CI to catch regressions -- a structural risk that recurs without CI. PLCT Lab (ISCAS) pledged at the original port submission (2022) to contribute riscv64 CI to Mozilla's Taskcluster and never delivered it; Mozilla's own RISE RISC-V Runners program (launched Mar 2026) has not been adopted by Firefox despite removing the hardware-access barrier. Debian's riscv64 firefox build remains queued as "Needs-Build," blocking migration to Debian testing. Multiple open, unassigned/UNCONFIRMED Bugzilla issues remain (GPU detection failure [1979242](https://bugzilla.mozilla.org/show_bug.cgi?id=1979242), tab crash on launch [1984989](https://bugzilla.mozilla.org/show_bug.cgi?id=1984989), YouTube playback lag [1980593](https://bugzilla.mozilla.org/show_bug.cgi?id=1980593)/[1986244](https://bugzilla.mozilla.org/show_bug.cgi?id=1986244), libpng build failure [1984883](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883)) that would need resolution before a distro-shipped build could be considered solid. Separately, the Arch Linux RISC-V port's actively maintained, cross-mirror-verified `firefox` package (last updated 2026-09-28) is the strongest currently-available distribution channel and is the closest existing path to a de facto reliable downstream build, should its patch provenance be independently reconciled against vanilla upstream.

## 14. Investment Analysis

Before sizing any item below: RISE has funded no Firefox-adjacent work. Its relevant infrastructure -- the RISC-V Runners CI program and the Python wheel builder -- is generic and available to any open-source project, including Firefox, but nothing specific to Firefox, SpiderMonkey, or its dependency set (NSS, dav1d, libpng, etc.) has been funded or built by RISE. No item below can be treated as already covered by RISE; at most, the RISC-V Runners program lowers the cost of the CI/CD items in 14.3.

### 14.1 Functional Enablement

**WASM SIMD (RVV integration):** the RVV assembler encoding layer already exists (`extension/extension-riscv-v.cc`). Remaining work: (a) design and implement the Lowering layer for all SIMD LIR nodes on riscv64, (b) implement the ~19 stubbed CodeGenerator SIMD visitor functions, (c) write the SIMD LIR instruction definitions, (d) test and iterate on correctness. This is the single highest-value functional investment, given it is a complete functional gap rather than a performance gap. Data not available: precise person-week estimate; the existing encoding primitives reduce but do not eliminate the scope relative to the original arm64 NEON SIMD implementation.

**`visitNearbyInt`/`visitNearbyIntF` (Ion, `Math.round` family):** self-contained fix using RISC-V's FCVT.W.D-family rounding instructions; estimated 1-2 person-weeks.

**GPU detection fix ([Bug 1979242](https://bugzilla.mozilla.org/show_bug.cgi?id=1979242)):** requires diagnosing the GL/EGL initialization or hardware-capability-check path in the `Widget: Gtk` component. Data not available: root cause.

**Gecko Profiler riscv64 support ([Bug 2023167](https://bugzilla.mozilla.org/show_bug.cgi?id=2023167), ASSIGNED):** stack unwinding and CPU sampling. No timeline data available. This is a developer-tooling gap that blocks serious performance investigation on riscv64, so it is a prerequisite for much of Section 14.2's work, not merely a nice-to-have.

### 14.2 Performance Optimization

**NSS riscv64 crypto acceleration (AES-Zkn/Zks, SHA scalar optimization):** NSS runs all crypto on scalar C on riscv64 with zero open upstream issues tracking it, i.e. no one has yet prioritized this. RISC-V's Zkn/Zks/Zkr extensions exist specifically for this purpose. This directly reduces TLS overhead for every HTTPS connection and is separable, upstream-benefiting work (not Firefox-specific). Estimated effort: medium, comparable in scope to NSS's existing arm64 crypto implementation.

**jemalloc riscv64 tuning:** add a Zihintpause `pause` instruction for spin-wait loops. Low effort (~1 person-week), moderate impact on multi-threaded allocation contention.

**zstd Huffman fast loop:** upstream PR #4622 is already in progress; low effort remaining, and not Firefox-specific work.

**dav1d/libjpeg-turbo vendoring reconciliation:** before sizing further codec SIMD work, resolve the Section 4.2 discrepancy directly (diff Firefox's vendored `third_party/dav1d` and `media/libjpeg` against current upstream) to determine whether RVV support already present upstream simply needs a re-vendor, which would be substantially cheaper than net-new SIMD development. Estimated effort: 1 person-week to investigate, effort for the fix itself is unknown pending that investigation.

### 14.3 CI/CD Infrastructure

**Taskcluster riscv64 SpiderMonkey simulator task:** add `sm-riscv64-sim-linux64` to `taskcluster/kinds/spidermonkey/linux.yml`, analogous to the existing `sm-arm64-sim-linux64`. This runs jit-tests on riscv64 in a simulated environment on ordinary x86-64 CI hardware, without native riscv64 machines, and directly targets the Bug 1957559 regression class. Lower cost than native hardware CI. Estimated: 2-4 person-weeks.

**Taskcluster riscv64 native build task + sysroot:** add a `linux-riscv64/opt` build task, a riscv64 sysroot to `sysroot.yml`, and a riscv64 cross-compiler toolchain to `clang.yml`/`gcc.yml`. Prerequisite for catching regressions outside the JS engine (graphics, media, full-browser build). Estimated: 4-8 person-weeks.

**RISE RISC-V Runners adoption:** RISE's free native RISC-V CI program (launched March 2026) removes the hardware-procurement barrier for standing up either of the above tasks on native silicon rather than emulation. Firefox has not engaged with this program. Data not available on whether Mozilla has been approached. Estimated cost to initiate: 1-2 person-weeks of integration work, contingent on Mozilla engineering buy-in.

### 14.4 Ecosystem Enablement

**Debian riscv64 package unblock:** diagnose and resolve the "Needs-Build" status for firefox on riscv64 in Debian sid, unblocking migration to Debian testing and providing a stable package for the most widely deployed riscv64 Linux distribution ecosystem. Root-cause data not available from this research; likely requires Debian riscv64 porter engagement, not purely Mozilla-side work.

**Official Mozilla linux-riscv64 binary:** a longer-term goal dependent on the CI items in 14.3 landing first, plus release-engineering integration and a formal tier-policy decision. Not actionable as a standalone near-term item.

**Arch Linux RISC-V port provenance audit:** given this is currently the only actively maintained, cross-verified riscv64 Firefox binary distribution, a lightweight audit of its patch set against vanilla upstream (to confirm or refute clean-build status) would materially improve confidence in recommending it as an interim distribution path, and could itself move the grade toward yellow if it confirms no material patch divergence. Estimated: 1 person-week.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | WASM SIMD (RVV) -- Lowering + CodeGenerator + LIR integration | Data not available | Unassigned (upstream) | Critical |
| Functional | `visitNearbyInt`/`visitNearbyIntF` Ion stubs | 1-2 | Unassigned | High |
| Functional | GPU detection fix (Bug 1979242) | Data not available | Unassigned | High |
| CI/CD | SpiderMonkey riscv64 simulator CI task (`sm-riscv64-sim-linux64`) | 2-4 | Mozilla (with community support) | Critical |
| CI/CD | Taskcluster riscv64 native build task + sysroot | 4-8 | Mozilla (with community support) | High |
| CI/CD | RISE RISC-V Runners adoption | 1-2 | Mozilla / RISE | High |
| Performance | NSS riscv64 crypto assembly (Zkn, Zks) | 8-16 | Unassigned (NSS team) | High |
| Performance | dav1d/libjpeg-turbo vendoring reconciliation (investigation) | 1 | Unassigned | Medium |
| Performance | jemalloc Zihintpause pause instruction | 1 | Unassigned | Low |
| Performance | zstd Huffman fast loop (PR #4622, upstream) | Upstream (in progress) | Upstream | Low |
| Tooling | Gecko Profiler riscv64 stack unwinding (Bug 2023167) | Data not available | ASSIGNED (unknown) | Medium |
| Ecosystem | Debian riscv64 package unblock | Data not available | Debian maintainers | Medium |
| Ecosystem | Arch Linux RISC-V port provenance audit | 1 | Unassigned | Medium |
| Ecosystem | Official Mozilla linux-riscv64 binary | Data not available | Mozilla release engineering | Low (long-term) |

## 15. References

- [mozilla-firefox/firefox (GitHub read-only mirror)](https://github.com/mozilla-firefox/firefox)
- [Bug 1318905 -- Add riscv64 as target architecture to mozbuild](https://bugzilla.mozilla.org/show_bug.cgi?id=1318905)
- [Bug 1717203 -- [meta] Linux/riscv64 Port (RESOLVED FIXED)](https://bugzilla.mozilla.org/show_bug.cgi?id=1717203)
- [Bug 1711232 -- Add NSPR support for FreeBSD/riscv64 (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232)
- [Bug 1733512 -- Enable RISC-V building (open, unassigned)](https://bugzilla.mozilla.org/show_bug.cgi?id=1733512)
- [Bug 1790800 -- Disable WebMIDI support on Linux/riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1790800)
- [Bug 1800431 -- SpiderMonkey riscv64 JIT backend (RESOLVED FIXED Firefox 111)](https://bugzilla.mozilla.org/show_bug.cgi?id=1800431)
- [Bug 1826741 -- Enable JIT by default on riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1826741)
- [Bug 1837111 -- Enable wasm baseline compiler on riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1837111)
- [Bug 1837852 -- RISCV64 baseline wasm compiler results in black screen (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1837852)
- [Bug 1865601 -- Allow gles backend in riscv64 (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1865601)
- [Bug 1880366 -- Add RISC-V support to jit::Disassemble (RESOLVED FIXED Firefox 125)](https://bugzilla.mozilla.org/show_bug.cgi?id=1880366)
- [Bug 1944011 -- Fix register allocation for LAtomicTypedArrayElementBinop64 on RISCV (RESOLVED FIXED Firefox 136)](https://bugzilla.mozilla.org/show_bug.cgi?id=1944011)
- [Bug 1957559 -- Various SpiderMonkey riscv64 JIT fixes (RESOLVED FIXED Firefox 139)](https://bugzilla.mozilla.org/show_bug.cgi?id=1957559)
- [Bug 1968491 -- Out of memory building Firefox v139 on riscv64 (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1968491)
- [Bug 1972506 -- Misalignment of select drop-down menu on RISCV (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1972506)
- [Bug 1974946 -- Compilation failure SharedICHelpers-riscv64-inl.h (RESOLVED FIXED Firefox 144)](https://bugzilla.mozilla.org/show_bug.cgi?id=1974946)
- [Bug 1975643 -- Implement WASM JSPI for riscv64 (RESOLVED FIXED Firefox 142)](https://bugzilla.mozilla.org/show_bug.cgi?id=1975643)
- [Bug 1975867 -- Float32 NaN-boxing corruption on riscv64 (RESOLVED FIXED Firefox 143)](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867)
- [Bug 1979242 -- Firefox on RISCV-64 fails to detect GPU (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1979242)
- [Bug 1980593 -- YouTube video playback lags/freezes on riscv64 (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1980593)
- [Bug 1982266 -- JIT re-enabled by default on riscv64 (Firefox 143)](https://bugzilla.mozilla.org/show_bug.cgi?id=1982266)
- [Bug 1984883 -- riscv64: build failure in media/libpng/riscv (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1984883)
- [Bug 1984989 -- riscv64: Browser Tab Crashes upon Launch on Firefox 143 (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1984989)
- [Bug 1985220 -- Build error building Firefox v142 on RISCV-64 (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1985220)
- [Bug 1986244 -- YouTube video lags on riscv64 (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1986244)
- [Bug 1987699 -- [meta] RISCV64 support in SpiderMonkey (open, ~56 sub-bugs)](https://bugzilla.mozilla.org/show_bug.cgi?id=1987699)
- [Bug 1996840 -- CVE-2025-14324, assertion failure/branch-offset overflow (RESOLVED FIXED)](https://bugzilla.mozilla.org/show_bug.cgi?id=1996840)
- [Bug 1997503 -- CVE-2025-14330, intermittent JIT segfault on riscv64 (RESOLVED FIXED, uplifted ESR 140.6+)](https://bugzilla.mozilla.org/show_bug.cgi?id=1997503)
- [Bug 1998647 -- Unable to login via reCAPTCHA/Cloudflare check on riscv64 (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=1998647)
- [Bug 2023167 -- Add Gecko Profiler support for RISCV64 and LoongArch64 (ASSIGNED)](https://bugzilla.mozilla.org/show_bug.cgi?id=2023167)
- [Bug 2040603 -- Show assembler offsets in IONFLAGS=codegen for arm32/riscv64 (open)](https://bugzilla.mozilla.org/show_bug.cgi?id=2040603)
- [Bug 2043179 -- Improve riscv64 instruction detection in WasmGC/WasmSummarizeInsn (ASSIGNED)](https://bugzilla.mozilla.org/show_bug.cgi?id=2043179)
- [Bug 2049559 -- Firefox 152 fails to compile on riscv64 (open, fix proposed)](https://bugzilla.mozilla.org/show_bug.cgi?id=2049559)
- [Bug 2066959 -- Enable -fstack-clash-protection on riscv64 (Clang >= 22.1.8)](https://bugzilla.mozilla.org/show_bug.cgi?id=2066959)
- [Bug 2071556 -- Assertion failure in JIT codegen (ASSIGNED)](https://bugzilla.mozilla.org/show_bug.cgi?id=2071556)
- [Commit b0ae0f813e72 -- Enable JIT by default](https://github.com/mozilla-firefox/firefox/commit/b0ae0f813e721a06085ad313495a0f525bc5430e)
- [Commit 77bd0518b1e6 -- Add RISC-V support to jit::Disassemble](https://github.com/mozilla-firefox/firefox/commit/77bd0518b1e62800042b23f5099eeb7e837d0ddd)
- [Commit 96837ab7824d -- Support RISC-V Zbb extension](https://github.com/mozilla-firefox/firefox/commit/96837ab7824d38825845fa93dfaac2d6cae3d078)
- [Commit 520da1af89c2 -- Enable -fstack-clash-protection on riscv64](https://github.com/mozilla-firefox/firefox/commit/520da1af89c27f27806398283b079326681527f5)
- [PLCT QA Team Firefox RISC-V availability report (November 2024)](https://github.com/QA-Team-lo/firefox_test)
- [archriscv-packages firefox patches](https://github.com/felixonmars/archriscv-packages)
- [Arch Linux RISC-V port repository (archriscv.felixc.at)](https://archriscv.felixc.at/repo/extra/)
- [Firefox build system supported configurations](https://firefox-source-docs.mozilla.org/build/buildsystem/supported-configurations.html)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement (March 2026)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project members list](https://riseproject.dev/members/)
- [A Glimpse Into V8 Development for RISC-V (RISE, Dec 2025)](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [openEuler blog -- Firefox on openEuler RISC-V Boosts Performance (Jan 2023)](https://www.openeuler.org/en/blog/20230113-RISC/RISC.html)
- [RISC-V International mailing list -- Milestone Completed: Firefox JavaScript JIT acceleration for RISC-V](https://lists.riscv.org/g/apps-tools-software/message/284)
- [RISC-V International sw-dev mailing list -- Now we have Firefox running on RISC-V Linux! (Sep 2021)](https://groups.google.com/a/groups.riscv.org/g/sw-dev/c/81caeTrQWLs)