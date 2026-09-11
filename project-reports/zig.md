---
title: Zig
parent: Project Reports
color: orange
dependencies:
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: ncurses
    relation: runtime-dependency
    criticality: optional
  - name: libxml2
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="zig" %}

# Zig

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Zig<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Zig is a general-purpose systems programming language and toolchain (compiler, linker, and bundled C/C++ compiler via `zig cc`/`zig c++`) that ships its own standard library, cross-compilation support for dozens of target triples, and a C-ABI-compatible build system. It is not an optimization-purpose library; its value proposition is language and toolchain functionality, not out-performing a reference algorithm implementation, so the Step 2 optimization-purpose modifier from the project color-coding model does not apply to this report.

**Governance:** Zig uses a BDFN model ("Benevolent Dictator For Now"), stated explicitly in the project README: "Zig governance is BDFN... which means that Andrew Kelley has final say on the design and implementation of everything." There is no MAINTAINERS/OWNERS/CODEOWNERS file, consistent with this informal structure. The legal entity behind the project is the **Zig Software Foundation (ZSF)**, a 501(c)(3) non-profit founded in 2020 by Andrew Kelley, which pays core contributors directly rather than crediting corporate employers. The ZSF team page lists 15 core members (Andrew Kelley - President, Mason Remaley - Treasurer, plus 13 others); no individual employer affiliations are published, so there is no corporate-maintainer-to-company mapping to report.

**Corporate sponsors (per [ziglang.org](https://ziglang.org/)):** Tiger Beetle, Blacksmith, ZML, Silares, Synadia. No donation tiers or amounts are publicly disclosed, and none of these sponsors are identified in the findings as riscv64-specific funders.

**License:** MIT (Expat).

**Canonical repository has moved.** As of **2025-11-26**, Zig's canonical development host moved from GitHub to Codeberg (Forgejo-based, non-profit): [codeberg.org/ziglang/zig](https://codeberg.org/ziglang/zig). The GitHub repository ([github.com/ziglang/zig](https://github.com/ziglang/zig)) now contains only a README pointing to Codeberg and the statement "This repository is not mirrored." Per Zig's own migration post ([ziglang.org/news/migrating-from-github-to-codeberg](https://ziglang.org/news/migrating-from-github-to-codeberg/)), the stated reasons include declining GitHub Actions reliability ("Actions has inexcusable bugs while being completely neglected... not even master branch commits get checked"), Copilot/AI-contribution-policy friction (Zig enforces a no-LLM-contribution policy), and neglect of GitHub Sponsors (donations moved to Every.org). This has direct consequences for CI evidence quality in this report - see Section 7.

**Community stance on new architecture ports:** open and opportunistic. Release notes describe adding "basic support... for the Alpha, KVX, MicroBlaze, OpenRISC, PA-RISC, and SuperH architectures" even before full LLVM upstream support exists. By contrast, proprietary OS support (Solaris, AIX, z/OS) was explicitly dropped, with the stated rationale that "the Zig project cannot support proprietary operating systems that make it unreasonably difficult to obtain system headers and thus audit contributions" - illumos (an open-source OpenSolaris fork) was kept. Net: new architectures are welcomed at low tiers; new OSes are gated on auditability, not on being exotic.

**RISE Project membership:** Zig / Zig Software Foundation is **not** a RISE member. RISE's Premier members are Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General members are Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-10-17 | Earliest incidental RISC-V mention (FreeBSD syscall-numbers commit noting `sbrk` removed on newer arches including riscv), not a dedicated port | commit search, [ziglang/zig](https://github.com/ziglang/zig) history |
| 2019-03-22 | First dedicated RISC-V support commit by **Andrew Kelley** (`andrewrk`): "stage1: implement get_dynamic_linker for riscv" | commit search |
| 2019-03-10 | [PR #2042](https://github.com/ziglang/zig/pull/2042) "Add elf riscv32 and elf riscv64 as options in getLDMOption" merged; first appears in 0.4.0 (2019-04-08) | GitHub PR search |
| 2019-09-29 | [#3338](https://github.com/ziglang/zig/issues/3338)/[#3339](https://github.com/ziglang/zig/issues/3339)/[#3340](https://github.com/ziglang/zig/issues/3340) - earliest wave of RISC-V bring-up bugs (disabled behavior tests, silent link failures, glibc build issues) | issue search |
| 2019-10-13 | [#3451](https://github.com/ziglang/zig/issues/3451) opened - LLD relaxation/`R_RISCV_ALIGN` gap, still open today (see Section 11) | issue thread |
| 2019-10-13 | [PR #3446](https://github.com/ziglang/zig/pull/3446) "More RISC-V stuff" merged; first appears in 0.6.0 (2020-04-13) | GitHub PR search |
| 2020-02-14 | Master tracking issue [#4456](https://github.com/ziglang/zig/issues/4456) "Tier System: riscv64-linux" opened by andrewrk, defining the 4-tier framework | issue thread |
| 2020-04-13 (0.6.0) | riscv64-freestanding promoted to Tier 1, riscv64-linux to Tier 2 | [0.6.0 release notes](https://ziglang.org/download/0.6.0/release-notes.html) |
| 2021-11-25 to 2021-12-04 | [PR #10218](https://github.com/ziglang/zig/pull/10218) (stage2 RISCV64 cleanup), [PR #10006](https://github.com/ziglang/zig/pull/10006) (ABI selection) merged into 0.9.0 (2021-12-20) | GitHub PR search |
| 2023-04-19 | [PR #15312](https://github.com/ziglang/zig/pull/15312) fixes baseline_rv32 feature bug; lands in 0.11.0 (2023-08-04) | GitHub PR search |
| 2024-02-04 | [PR #18815](https://github.com/ziglang/zig/pull/18815) ("Make Zig code compile for riscv64-linux") and [PR #18803](https://github.com/ziglang/zig/pull/18803) (glibc riscv64-linux-gnu fixes) both **closed unmerged**, superseded within the same window by merged work below | GitHub PR search |
| 2024-02-17 to 2024-02-23 | [PR #18973](https://github.com/ziglang/zig/pull/18973) (ELF reloc refactor + RISCV relocs), [PR #18856](https://github.com/ziglang/zig/pull/18856) (CPU model detection), [PR #19034](https://github.com/ziglang/zig/pull/19034) (self-hosted ELF linker gains basic riscv64 support) all merged; land in 0.12.0 (2024-04-20) | GitHub PR search |
| 2024-03-25 | [PR #19431](https://github.com/ziglang/zig/pull/19431) "revive STAGE2 RISCV64 backend" restarts stalled self-hosted riscv64 codegen work | PR record |
| 2024-04-20 (0.12.0) | Self-hosted ELF linker gains partial riscv64 support | [0.12.0 release notes](https://ziglang.org/download/0.12.0/release-notes.html) |
| 2024-06-19 to 2024-07-29 | [PR #20070](https://github.com/ziglang/zig/pull/20070), [PR #20395](https://github.com/ziglang/zig/pull/20395), [PR #20673](https://github.com/ziglang/zig/pull/20673), [PR #20389](https://github.com/ziglang/zig/pull/20389) - ongoing self-hosted backend and riscv32-linux porting progress; land in 0.14.0 (2025-03-05) | GitHub PR search |
| 2024-08-01 | alexrp confirms libc buildable for `riscv64-linux-musl` and `-gnu`; proposes Scaleway/self-hosted CI hardware as the last blocker on #4456 | [#4456 comment thread](https://github.com/ziglang/zig/issues/4456) |
| 2024-11-25 | Glavo offers to donate physical RISC-V hardware for CI | [#4456 comment thread](https://github.com/ziglang/zig/issues/4456) |
| 2025-06-04 | [PR #24070](https://github.com/ziglang/zig/pull/24070) "valgrind: Add riscv64-linux support" merged; lands in 0.15.1 (2025-08-19) | GitHub PR search |
| 2025-06-30 | [PR #24302](https://github.com/ziglang/zig/pull/24302) "Native RISC-V bootstrap and test fixes" merged (alexrp) - fixes `ucontext_t` stubs, CPU detection, LLVM-outliner bugs, and disables tests known-broken on RVV | PR diff, deep-read |
| 2025-07-12 to 2025-07-14 | [PR #24385](https://github.com/ziglang/zig/pull/24385) "ci: Add riscv64-linux-debug and riscv64-linux-release" merged, with tuning PRs [#24428](https://github.com/ziglang/zig/pull/24428) (closed unmerged) and [#24451](https://github.com/ziglang/zig/pull/24451) (merged); lands in 0.15.1 (2025-08-19) | PR diff, deep-read |
| 2025-11-26 | Canonical repo moves GitHub to Codeberg | [migration post](https://ziglang.org/news/migrating-from-github-to-codeberg/) |
| 2026-04-13 | 0.16.0 released with riscv64-linux/-freebsd/-netbsd/-openbsd binary tarballs | [ziglang.org/download](https://ziglang.org/download/) |
| 2026-05-06 | Master tracking issue [#4456](https://github.com/ziglang/zig/issues/4456) closed, after CI lanes (#24385) and native bootstrap (#24302) satisfied its checklist | issue thread |
| 2026-09-10 (this check) | Live Codeberg CI workflow (`.forgejo/workflows/ci.yaml`) contains **zero riscv64 references** - the riscv64-linux-debug/release jobs added by #24385 are no longer present, active or disabled | direct file read, see Section 7 |

**Is it fully upstream?** Yes as a matter of source code: all riscv64/riscv32 architecture support (self-hosted backend, linker, target model, libc, runtime, sanitizer code) lives directly in the mainline `ziglang/zig` tree with no fork or out-of-tree patch set required. What is **not** stable is the CI gate that verifies this code continues to work - see Section 7 for the discrepancy between the historical (GitHub-mirror) and current (Codeberg) CI state.

**Key contributors (with observed affiliation where stated in findings):** Andrew Kelley (andrewrk, ZSF President, project founder), Alex Rønne Petersen (alexrp, ZSF core team - authored the majority of 2025 riscv64 CI/bootstrap work: #24302, #24385, #24451, #24070), David Rubin / Rexicon226 (self-hosted riscv64 backend AIR-op implementations; also owns the outstanding #3451 relaxation fix). No corporate affiliation is published for any of these contributors in the findings gathered [NEEDS VERIFICATION - ZSF explicitly does not publish employer affiliations].

## 3. Upstream Support Tier

Zig defines its own formal 4-tier target-support policy (documented per-release, not in a static policy doc; text below from the [0.16.0 release notes](https://ziglang.org/download/0.16.0/release-notes.html) and [issue #4456](https://github.com/ziglang/zig/issues/4456)):

- **Tier 1:** all non-experimental language features work; compiler self-hosts codegen (no LLVM dependency); CI runs module tests on every push.
- **Tier 2:** stdlib has cross-platform coverage; debug info/stack traces work; libc accessible when cross-compiling; CI builds module tests automatically.
- **Tier 3:** LLVM can codegen and link for the target; not experimental in LLVM itself.
- **Tier 4:** LLVM can only emit assembly for the target.
- Post-1.0.0, Tier 1 additionally requires zero disabled tests and a formal bug policy.

**riscv64's documented tier: Tier 2** (`riscv64-linux`, `riscv32-linux`, `riscv64-freebsd`, `riscv64-openbsd`). `riscv64-haiku` and `riscv64-serenity` sit at Tier 3. Tier 2 means LLVM remains the codegen backend of record; riscv64 has not reached Tier 1 because the self-hosted (non-LLVM) backend is feature-incomplete (tracked live in open issue [#21519](https://github.com/ziglang/zig/issues/21519)).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Documented tier | Data not available: findings did not capture the amd64/x86_64 tier statement explicitly [NEEDS VERIFICATION] | Data not available: findings did not capture the arm64/aarch64 tier statement explicitly [NEEDS VERIFICATION] | Tier 2 (riscv64-linux, -freebsd, -openbsd); riscv32-linux also Tier 2; riscv64-haiku/-serenity Tier 3 |
| Self-hosted backend exists | Data not available in findings | Data not available in findings | Yes, but incomplete: hard-requires V (RVV) + Zbb extensions unconditionally, missing 6 compiler features (#21519), missing f128 args (#23375), linker thunks unimplemented |
| Current canonical CI job present (`.forgejo/workflows/ci.yaml`, checked 2026-09-10) | Yes (`x86_64-linux-*`, `x86_64-freebsd-*`, `x86_64-netbsd-*`, `x86_64-openbsd-*`, `x86_64-windows-*`) | Yes (`aarch64-freebsd-*`, `aarch64-linux-*`, `aarch64-netbsd-*`, `aarch64-macos-*`) | **No riscv64 job at all - not present even in disabled form** |
| Official upstream binary release | Yes | Yes | Yes (linux, freebsd, netbsd, openbsd tarballs, confirmed by HTTP HEAD, see Section 8) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

The repository was cloned locally for inspection (`/home/user/ziglang/zig`, shallow clone, commit `738d2be9d6`). GitHub code search matched 321 files containing "riscv" and 149 containing "riscv64". Genuinely riscv-specific components:

| Component | riscv64 implementation | Extensions / detail | Quality |
|---|---|---|---|
| Self-hosted compiler backend (`src/codegen/riscv64/`) | Yes, ~10,800 lines across `CodeGen.zig` (8,500), `encoding.zig` (729), `Lower.zig` (615), `abi.zig` (353), `bits.zig` (290), `mnem.zig` (257), `Mir.zig` (248), `Emit.zig` (222) | **Hard-requires D, M, A, Zicsr, V, Zbb** (`required_features`, CodeGen.zig:1110-1117) - codegen fails outright without RVV and Zbb even for scalar-only code, so it cannot target plain RV64GC hardware. Emits real RVV (`vsetvli`/`vsetivli`, `vsew`, `vaddvv`) for vectorized memcpy/memset/reductions. | Functional but partial: substantial real backend, but not the default even on riscv64-linux per `src/target.zig`/`lib/std/start.zig` comments - LLVM remains primary for production riscv64 builds |
| Linker (`src/link/riscv.zig`, 117 lines) | Yes, complete for relocation-addend writing (`writeInstU/I/S/B/J`, ULEB128 set/sub) | R_RISCV_* relocation handling | Riscv64 **thunk generation is explicitly `unreachable`** in `src/link/Elf/Thunk.zig` - long-jump thunks unimplemented |
| Target/feature model (`lib/std/Target/riscv.zig`, 3,528 lines) | Complete, LLVM-mirrored | 53 named CPUs (sifive_x280, spacemit_x60, sifive_p670, Andes/XiangShan/SyntaCore parts); base i/e/m/a/f/d/c/b/q/h, Zb*, Zk*, V/Zve32x/Zve64x/Zvl*, Zicsr, Zihintpause, vendor extensions (xqci*, xsf*, xrivos*) | Complete/generated, consumed across `lib/std/Target.zig`, `src/target.zig` |
| C intrinsic headers (`lib/include/`) for `zig cc` | Yes | `riscv_vector.h` (422 lines, RVV typedefs), `riscv_bitmanip.h` (195, Zb*), `riscv_crypto.h` (170, Zk*), `riscv_corev_alu.h` (128, CORE-V), `sifive_vector.h`/`andes_vector.h` (vendor RVV), `riscv_ntlh.h` | Complete for Clang-compatible RVV/Zb/Zk intrinsics |
| Aro C frontend builtins (`lib/compiler/aro/aro/Builtins/riscv.zig`, 469 lines) | Yes, complete | RISC-V C builtins for Zig's bundled C compiler | Complete |
| libc (musl/glibc/FreeBSD headers) | Yes, mostly vendored/upstream-imported | riscv32/64 setjmp/longjmp asm, fenv asm, vfork asm, math routines | Vendored, not Zig-original; not independently re-audited in this pass |
| Runtime support (`lib/std/`) | Yes | `debug/cpu_context.zig` unwind/signal layouts (Linux, FreeBSD, OpenBSD, SerenityOS, Haiku), `atomic.zig` uses Zihintpause `pause` in spin-wait, entry-point/TLS/DWARF/cpu-info branches | Functional |
| Sanitizer runtime (TSan, `lib/libtsan/`) | Yes | `sanitizer_common_syscall_linux_riscv64.inc`, vfork interceptor, platform branches | Ported from upstream LLVM sanitizer runtime |

No `arch/riscv/` directory convention is used (Zig's own layout is `src/codegen/riscv64/`); riscv32 exists only in the libc/runtime layers, not in the self-hosted codegen backend (that backend is riscv64-only).

**Comparison vs amd64/arm64:** findings did not include a matching file-by-file inventory for amd64 or arm64 backends, so a direct line-count or feature-parity comparison cannot be made. Data not available: search scope for this report was riscv64-focused; an amd64/arm64 baseline inventory would need a separate pass. What is confirmed is that riscv64's self-hosted backend is behind amd64/arm64 in feature completeness - it is the one backend explicitly called out in issue #21519 as missing six compiler features that "all currently LLVM-only," and it is the only one with a documented hard vector-extension (V+Zbb) requirement that blocks scalar-only RV64GC targets.

## 5. Build System, Cross-Compilation, and Toolchain

Zig has no `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, riscv64-specific CMake toolchain file, or any Dockerfile (all confirmed 404/absent by direct repository search). Build configuration lives entirely in the top-level `CMakeLists.txt` plus CI shell scripts under `ci/`.

**Exact riscv64 CI build commands** (from `ci/riscv64-linux-release.sh` / `ci/riscv64-linux-debug.sh`, present in the frozen GitHub-mirror snapshot and still present as orphaned files in the current repo tree - see Section 7 for current wiring status):

```
TARGET="riscv64-linux-musl"
MCPU="spacemit_x60"

export CC="$ZIG cc -target $TARGET -mcpu=$MCPU"
export CXX="$ZIG c++ -target $TARGET -mcpu=$MCPU"

cmake .. \
  -DCMAKE_INSTALL_PREFIX="stage3-release" \
  -DCMAKE_PREFIX_PATH="$PREFIX" \
  -DCMAKE_BUILD_TYPE=Release \
  -DZIG_TARGET_TRIPLE="riscv64-linux-musl" \
  -DZIG_TARGET_MCPU="spacemit_x60" \
  -DZIG_STATIC=ON \
  -DZIG_NO_LIB=ON \
  -GNinja

ninja install

stage3-release/bin/zig build test-cases test-modules test-unit test-c-abi \
  test-stack-traces test-error-traces test-llvm-ir \
  --maxrss 68719476736 -Dstatic-llvm -Dskip-non-native -Dskip-single-threaded \
  -Dskip-compile-errors -Dtarget=native-native-musl \
  --search-prefix "$PREFIX" --zig-lib-dir "$PWD/../lib" --test-timeout 4m
```

Zig cross-bootstraps itself using a previously-built riscv64 `zig` binary (fetched via a versioned cache basename such as `zig+llvm+lld+clang-riscv64-linux-musl-0.16.0-dev.104+689461e31`) as `CC`/`CXX`, rather than a system GCC/Clang triple plus a CMake toolchain file. There is no separate riscv64 cross-compilation toolchain file.

**Toolchain version requirements:**
- **LLVM: exactly 21.x** - `cmake/Findllvm.cmake` hard-rejects any other version. For riscv64 cross-builds this is moot for `llvm-config` since `ZIG_USE_LLVM_CONFIG` auto-disables when `ZIG_TARGET_TRIPLE != native`; instead `CMAKE_PREFIX_PATH` points at a prebuilt LLVM-21-based `zig+llvm+lld+clang` package.
- **C++17 minimum** (`target_compile_features(zigcpp PRIVATE cxx_std_17)`), stated in-source as "Sync with minimum C++ standard required to build LLVM."
- **CMake >= 3.15**.
- Bootstrap C stage (`bootstrap.c`) requires only C99, used solely for the tiny `zig1`/`zig-wasm2c` bootstrap binaries - not relevant to the riscv64 CI path since a prebuilt `zig` binary is used there.

**QEMU usage: none for riscv64.** The historical riscv64 CI ran on a self-hosted, bare-metal `riscv64-linux` runner (`runs-on: [self-hosted, riscv64-linux]`), so tests executed natively. The scripts explicitly state: "No -fqemu and -fwasmtime here as they're covered by the x86_64-linux scripts" - QEMU is used only from `x86_64-linux-*` CI scripts to emulate *other* architectures on x86_64 hosts, never to emulate riscv64 itself.

**Known build failures:** [#24508](https://github.com/ziglang/zig/issues/24508) "Unable to build Zig on riscv64gc-linux-musl" (closed); [#18872](https://github.com/ziglang/zig/issues/18872) - Zig itself hangs at the "LLVM emit object" compiler stage for 3+ hours on riscv64-linux (SiFive U74) host hardware, implicating the LLVM JIT/codegen path when riscv64 is the *host*, separate from riscv64 as a cross-compilation *target*.

**CI trigger note:** even in the historical frozen snapshot, riscv64 jobs were gated `if: github.event_name != 'pull_request'` - they never ran on pull requests, only on push/`workflow_dispatch` to `master`, with generous timeouts (debug 600 min, release 480/480 min) reflecting comparatively slow riscv64 hardware.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Self-hosted (non-LLVM) codegen | Data not available in findings | Data not available in findings | Partial; requires V+Zbb unconditionally, missing 6 compiler features | Cannot compile scalar-only RV64GC via self-hosted backend; falls back to LLVM |
| f128 argument passing | Data not available in findings | Data not available in findings | Missing in self-hosted backend ([#23375](https://github.com/ziglang/zig/issues/23375), open) | Functional gap for f128 ABI on the self-hosted path |
| Linker long-jump thunks | Data not available in findings | Data not available in findings | Explicitly `unreachable`/unimplemented (`src/link/Elf/Thunk.zig`) | Functional gap for large binaries needing long-range jumps |
| Linker relaxation (`R_RISCV_ALIGN`) | N/A (x86 has no equivalent relaxation relocation model) | N/A | Not implemented in self-hosted linker; owned by Rexicon226 ([#3451](https://github.com/ziglang/zig/issues/3451), open since 2019, still active as of Oct 2025) | Missing code-size/link-time optimization |
| RVV vector codegen correctness | N/A | N/A (uses NEON/SVE, not evaluated here) | Historically fragile: multiple closed-but-recent failures (SHA-3 [#25083](https://github.com/ziglang/zig/issues/25083), salsa20 [#24299](https://github.com/ziglang/zig/issues/24299), vector division [#24301](https://github.com/ziglang/zig/issues/24301), bit_set [#24300](https://github.com/ziglang/zig/issues/24300)), fixed/skip-guarded 2025-06 to 2025-08 | Now closed, but indicates the RVV codepath was immature through mid/late 2025; no fresh regression data past that window |
| LLVM 21 backend regression | Data not available in findings | Data not available in findings | [#25064](https://github.com/ziglang/zig/issues/25064) - variadic-function behavior test regressed on RISC-V specifically under LLVM 21, labeled `miscompilation`/`regression`, open | Correctness risk tied to upstream LLVM version bump |
| `gp` (global pointer) init in self-hosted start code | N/A | N/A | Cannot assemble ([#20918](https://github.com/ziglang/zig/issues/20918), open) | Self-hosted backend cannot bootstrap `start.zig` without LLVM assist |
| UEFI target codegen | Produces correct PE/COFF | Data not available | Produces ELF instead of COFF for `riscv64-uefi` ([#23195](https://github.com/ziglang/zig/issues/23195), open) | Functional gap for UEFI firmware targets |
| `objcopy -S` | Data not available | Data not available | Spurious error/exit code despite succeeding ([#23036](https://github.com/ziglang/zig/issues/23036), open) | Tooling-quality gap, not core-correctness |
| `callconv(.Interrupt)` | Data not available | Supported (findings imply via closed-issue framing, not independently confirmed) [NEEDS VERIFICATION] | Not usable on riscv targets ([#20671](https://github.com/ziglang/zig/issues/20671)) | Functional gap for firmware/embedded interrupt handlers |

**Performance gaps:** no dedicated Zig-on-riscv64 performance benchmark data exists (see Section 11 note on benchmarks). The only concrete numeric compiler-performance datapoint found ([#25111](https://github.com/ziglang/zig/issues/25111), self-hosted backend ~198-500x slower than LLVM `-O Debug`) is explicitly labeled `arch-x86_64`, not RISC-V, and cannot be used as a riscv64 data point. A single unaffiliated crypto-throughput benchmark exists (AllWinner D1 board, single-core, via a GitHub Gist, [NEEDS VERIFICATION], no arm64/amd64 comparison point) - see Section 12.3 of the RISE research.

**Security hardening gaps:** not directly assessed in findings beyond the linker-thunk and relaxation gaps above, which are code-size/robustness issues rather than classic hardening features (stack protector, CFI, etc.). Data not available: no riscv64-specific hardening-feature comparison was found in the research.

**NaN / floating-point semantics:** targeted search for "riscv nan floating" surfaced no issue specifically discussing NaN-boxing/NaN handling on RISC-V. The closest correctness hits are [#15517](https://github.com/ziglang/zig/issues/15517) ("RISCV intToFloat incorrect results," closed) and [#18870](https://github.com/ziglang/zig/issues/18870) (f16/f32 signbit-on-negative-NaN test failures tied to d/f extensions on real StarFive VisionFive 2 hardware, closed). Both closed, but confirm floating-point edge-case bugs existed historically on riscv64.

## 7. CI/CD Infrastructure

**This section contains a direct, material contradiction between two research passes and both are reported per the verification policy.**

**Historical state (frozen GitHub-mirror snapshot, last synced 2025-11-26):** `.forgejo/workflows/ci.yaml` defined `riscv64-linux-debug` (900 min timeout) and `riscv64-linux-release` (780 min timeout) jobs, `runs-on: [self-hosted, riscv64-linux]`, added by [PR #24385](https://github.com/ziglang/zig/pull/24385) (merged 2025-07-12). These ran real build+test cycles (`test-cases test-modules test-unit test-c-abi test-stack-traces test-error-traces test-llvm-ir`) natively on a `spacemit_x60`-class SoC, not under QEMU. Gated `if: github.event_name != 'pull_request'` - push/`workflow_dispatch` to master only, never PR-gating.

**Current live state (canonical Codeberg repo, verified by direct clone and file read, 2026-09-10):** the sole active workflow file (`.forgejo/workflows/ci.yaml`; no `.github/workflows` directory exists at all) contains **zero matches for "riscv"** (`grep -n -i riscv .forgejo/workflows/ci.yaml` returns no output, exit code 1). The current job list is: `aarch64-freebsd-{debug,release}`, `aarch64-linux-{debug,release}`, `aarch64-netbsd-{debug,release}`, `aarch64-macos-{debug,release}`, `loongarch64-linux-{debug,release}`, `powerpc64le-linux-{debug,release}`, `s390x-linux-{debug,release}` (present but **commented out/disabled**), and five `x86_64-*` OS variants. **riscv64 does not appear even in disabled/commented form** - unlike s390x, which is visibly present but turned off, riscv64 has no trace in the current workflow definition at all. The `ci/riscv64-linux-debug.sh` and `ci/riscv64-linux-release.sh` scripts still exist as files in the tree, but a repo-wide search found no workflow reference to them - they are orphaned/dead scripts.

**Discrepancy noted per verification policy:** the earlier research pass (before the adversarial re-check) reported riscv64 CI as present and cited #24385/#24302 as evidence it satisfied #4456's closing conditions. The adversarial verification pass, reading the *current* canonical Codeberg repository directly, found this CI no longer exists. Both facts are true at different points in time: riscv64 CI was added 2025-07-12, was sufficient to close the tracking issue #4456 on 2026-05-06, and had disappeared from the live workflow by the time of the 2026-09-10 check. The exact date/reason of removal was not found in available data - it may be a consequence of the GitHub-to-Codeberg migration process, a deliberate pause, or an unrelated regression; this is Data not available and flagged as a priority item to re-verify.

**RISE runners:** no Zig-specific usage of RISE RISC-V Runners was found anywhere in the RISE blog, `riseproject-dev` repos, or Working Group issue trackers. RISE does operate a general-purpose, free native RISC-V CI runner program (announced [2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), with a six-weeks-in status update [2026-05-12](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)), but its target integration surface as described in the post title is GitHub - not immediately applicable to Zig's current Codeberg/Forgejo hosting without adaptation work. This is a concrete, RISE-controlled lever that could restore riscv64 CI for Zig; see Section 14.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Job present in current live CI | Yes | Yes | **No** |
| Ran tests historically | Yes | Yes | Yes (2025-07-12 to at least 2026-05-06), now absent |
| PR-gating | Data not available for amd64/arm64 specifically in findings | Data not available | Never PR-gated even when present (push/workflow_dispatch only) |
| Hardware | Data not available | Data not available | Self-hosted bare-metal `spacemit_x60`-class SoC, no QEMU |

## 8. Distribution and Release Status

**Official upstream binaries: confirmed present for riscv64.** [ziglang.org/download](https://ziglang.org/download/) (mirroring the same release artifacts as GitHub Releases, which could not be independently browsed due to session access restrictions on the JS-rendered asset list) lists, for the latest stable release **0.16.0** (2026-04-13):
- `zig-riscv64-linux-0.16.0.tar.xz`
- `zig-riscv64-freebsd-0.16.0.tar.xz`
- `zig-riscv64-netbsd-0.16.0.tar.xz`
- `zig-riscv64-openbsd-0.16.0.tar.xz`

Verified directly via HTTP request (not a summarized fetch): `https://ziglang.org/download/0.16.0/zig-riscv64-linux-0.16.0.tar.xz` returned **HTTP/1.1 200 OK**, Content-Length 55,313,616 bytes, Last-Modified 2026-04-14. A current nightly/dev build was also verified working: `https://ziglang.org/builds/zig-riscv64-linux-0.17.0-dev.2085+5e36170b5.tar.xz` returned **HTTP/1.1 200 OK**, Content-Length 57,035,340 bytes - confirming the riscv64 release/build pipeline is producing fresh artifacts even though the visible test-CI workflow (Section 7) currently lacks any riscv64 job. Other Linux architectures released alongside riscv64: x86_64, aarch64, arm, powerpc64le, x86, loongarch64, s390x.

**Ubuntu 26.04 ("resolute"): confirmed present, but only under a versioned package name.** Direct query of `packages.ubuntu.com` for suite=resolute:
- `zig` (4ubuntu2) and `zig0.14`/`zig0.14-dev` (0.14.1~us1-0ubuntu4): **amd64/arm64 only, no riscv64**.
- `zig0.15`/`zig0.15-dev` (0.15.2~us1-0ubuntu1): **confirmed riscv64** via direct fetch of `https://packages.ubuntu.com/resolute/riscv64/zig0.15`.

A user wanting Zig 0.15 on riscv64 Ubuntu 26.04 must install the specific `zig0.15` package, not the plain `zig` metapackage, which does not cover riscv64.

**PyPI: not a real Zig-compiler channel.** `https://pypi.org/pypi/zig/json` returns an unrelated, apparently-abandoned generic package (version `1.0.dev0`, last released circa 2021), shipping only a universal (`py3-none-any`) wheel and sdist - no riscv64 artifacts, no relation to the Ziglang compiler.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/zig/` 302-redirects to plain PyPI - no RISE-specific riscv64 wheel exists (moot regardless, since PyPI `zig` is not the compiler).

**Arch Linux RISC-V port:** page returned 200 but content was inconclusive from the fetch obtained; not independently confirmed [NEEDS VERIFICATION].

**What a user must do to get a working riscv64 Zig today:** either (a) download the upstream `zig-riscv64-linux-<version>.tar.xz` tarball directly from ziglang.org/download (the strongest, most current, upstream-first-party path), or (b) install `zig0.15` specifically on Ubuntu 26.04 riscv64 (not the plain `zig`/`zig0.14` packages).

## 9. Dependencies

Zig has no `Cargo.toml`/`go.mod`/`package.json`; its build is CMake-bootstrapped (`find_package(llvm 21)`, `find_package(clang 21)`, `find_package(lld 21)`, plus optional `ZIG_STATIC_ZLIB`/`ZSTD`/`CURSES`/`LIBXML2` toggles). `build.zig.zon` carries no external package dependencies. Cross-compilation libc/runtime sources (musl, mingw-w64, glibc headers, wasi-libc) are vendored inside `lib/`, not fetched via a manifest.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / blocking issues |
|---|---|---|---|---|---|
| LLVM (`llvm-21`) | Required codegen/JIT backend, statically linked into `zigcpp` | Ubuntu 26.04 "resolute" ships `llvm-21` 1:21.1.8-6ubuntu1 for riscv64 (and 6 other arches) | LLVM's own riscv64 codegen path is **not** part of LLVM's required pre-merge CI gate (per companion `project-reports/llvm.md`) | Ubuntu 26.04 riscv64 package (built from source, unpatched); no upstream `llvm/llvm-project` riscv64 release binaries | Zig-side: [#18872](https://github.com/ziglang/zig/issues/18872) 3+ hour hang at "LLVM emit object" on riscv64-linux host. LLVM-side: reportedly 10 open riscv64 correctness/miscompile bugs per the companion LLVM report (not independently re-verified here) |
| Clang (`clang-21`) | Required C/C++ frontend for `zig cc`/`zig c++` | Ubuntu 26.04 riscv64 package confirmed | Same LLVM-project CI gaps (monorepo) | Ubuntu 26.04 riscv64 package; no upstream release binary | Same LLVM-project issue set |
| LLD (`lld-21`) | Required linker, statically linked into `zigcpp` | Ubuntu 26.04 riscv64 package confirmed | Companion report describes LLD's RISC-V ELF backend as functionally complete but exercised only via non-required CI | Ubuntu 26.04 riscv64 package; no upstream release binary | None riscv64-specific found beyond general LLVM-project bug set |
| zlib | Optional compression dependency (`ZIG_STATIC_ZLIB`, default OFF unless `ZIG_STATIC`) | `zlib1g` 1:1.3.dfsg+really1.3.1-1ubuntu3 confirmed riscv64 (ports build) | Pure portable C, builds cleanly; no Linux riscv64 in zlib's own CI matrix | Present in Ubuntu, Debian sid, Arch RISC-V, Alpine | RVV-accelerated Adler32 PR stalled 8+ months per companion report, no riscv64 hardware CRC-32 path |
| zstd | Optional dependency for LLVM bitcode/object streams | `libzstd1` 1.5.7+dfsg-3 confirmed riscv64 | QEMU CI, PR-triggered, not release-blocking | Ubuntu 26.04, Debian sid riscv64; no PyPI riscv64 wheel for the Python `zstd` binding | 7 open RVV/perf PRs stalled 2-6 months per companion report; one high-severity fixed bug where riscv64 wasn't recognized as 64-bit through v1.5.7 |
| libxml2 | Linked transitively through LLVM/Clang tooling | `libxml2` 2.15.2+dfsg-0.1 confirmed riscv64 (ports build) | No upstream CI on any non-amd64 arch per companion report; distro-build-only validation | Debian sid, Ubuntu (ports), Arch RISC-V; `lxml` PyPI wheel covers riscv64 | Open issue #971: double-checked-locking pattern in catalog code unsafe on weakly-ordered architectures including riscv64, no assignee |
| ncurses | Optional, transitive via LLVM line-editing support | `libncurses-dev` 6.6+20251231-1 confirmed riscv64 | Not separately researched | Ubuntu 26.04 riscv64 package present | None identified; low-priority dependency |
| pthreads (`find_package(Threads)`) | Required for Zig's build-time thread pool | Provided by glibc riscv64 (full port) | Part of glibc's own riscv64 test suite | Ships in every riscv64 glibc distro | None; not a standalone tracked project |
| musl / mingw-w64 / wasi-libc / glibc headers (vendored, `lib/`) | Not an external build dependency; vendored adapted copies for `-target riscv64-*` cross-compile output | N/A (compiled per Zig compile-unit, not via CMake as a separate package) | N/A | Ships inside every Zig release tarball, including riscv64 host builds | Not evaluated for riscv64-target correctness in this pass |

**Key findings:** every Ubuntu-packaged build-time library dependency of Zig (`llvm-21`, `clang-21`, `lld-21`, `zlib1g`, `libzstd1`, `libxml2`, `libncurses-dev`) is available on riscv64 in Ubuntu 26.04 "resolute". The dominant risk is not dependency availability but CI/quality-verification gaps inherited from LLVM: LLVM's own riscv64 codegen path is not part of LLVM's required pre-merge CI gate, meaning correctness regressions in the exact code Zig statically links can land without riscv64-specific gating upstream. A concrete symptom exists in [#18872](https://github.com/ziglang/zig/issues/18872) (3+ hour host-side hang on riscv64). Compression dependencies (zlib, zstd) function correctly but leave RVV-accelerated performance on the table due to stalled upstream review, not technical rejection. libxml2 carries one live correctness concern for riscv64 specifically (double-checked-locking under weak memory ordering, issue #971, open, unfixed).

## 11. Known Bugs and Active Issues

### Open

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#21519](https://github.com/ziglang/zig/issues/21519) | Self-hosted riscv backend missing features | Open, pre-1.0 milestone | High (blocks Tier-1) | 6 features (error_return_trace, is_named_enum_value, error_set_has_value, field_reordering, safety_checked_instructions, separate_thread) LLVM-only today |
| [#23375](https://github.com/ziglang/zig/issues/23375) | f128 arguments unsupported in riscv self-hosted backend | Open | Medium (functional gap) | Self-hosted ABI classifier gap vs LLVM backend |
| [#3451](https://github.com/ziglang/zig/issues/3451) | LLD/self-hosted linker lacks R_RISCV_ALIGN relaxation support | Open since 2019-10-13 | Medium | Owned by Rexicon226 for self-hosted-linker (zld) fix; upstream LLD itself gained relaxation support by 2024 per alexrp comment, so LLD is no longer the blocker |
| [#24141](https://github.com/ziglang/zig/issues/24141) | riscv64: TODO airBitCast [3]u8 to u24 | Open | Low-Medium (codegen gap) | Missing case in self-hosted backend |
| [#20918](https://github.com/ziglang/zig/issues/20918) | Self-hosted riscv64 cannot assemble `gp` init in start.zig | Open | Medium | Blocks self-hosted bootstrap without LLVM assist |
| [#25064](https://github.com/ziglang/zig/issues/25064) | Variadic-function behavior test regressed on RISC-V under LLVM 21 | Open | High (correctness/miscompilation, regression) | Labeled `bug, upstream, miscompilation, arch-riscv64, backend-llvm, regression` |
| [#23036](https://github.com/ziglang/zig/issues/23036) | `zig objcopy -S` spurious error/bad exit code on riscv64-linux | Open | Low | Succeeds functionally but reports failure |
| [#23195](https://github.com/ziglang/zig/issues/23195) | Zig produces ELF instead of COFF for riscv64-uefi | Open | Medium (functional gap for firmware) | |
| [#25149](https://github.com/ziglang/zig/issues/25149) | Feature request: esp32p4 RISC-V CPU support | Open | Low (enhancement, not a bug) | |
| [#20671](https://github.com/ziglang/zig/issues/20671) | `callconv(.Interrupt)` unusable on riscv targets | Open [per closed-issue search framing - status should be re-confirmed, NEEDS VERIFICATION] | Medium | Relevant to embedded/firmware use |

### Notable closed (pattern evidence, now resolved)

| ID | Title | Notes |
|---|---|---|
| [#25083](https://github.com/ziglang/zig/issues/25083) | SHA-3 tests fail on RISC-V with vector support | `integer overflow` panic in keccak_p.zig on spacemit_x60 hardware; closed |
| [#24299](https://github.com/ziglang/zig/issues/24299) | std.crypto.salsa20 tests fail on RISC-V with vector support | Skip-guarded via #24302; closed |
| [#24301](https://github.com/ziglang/zig/issues/24301) | vector division operators fail on RISC-V with vector support | LLVM `UNREACHABLE... Can't create an unknown libcall!`; closed |
| [#24300](https://github.com/ziglang/zig/issues/24300) | bit_set.IntegerBitSet fails on RISC-V with vector support | Closed |
| [#18870](https://github.com/ziglang/zig/issues/18870) | riscv64-linux std/behavior tests fail on real hardware (StarFive VisionFive 2) | f16/f32 neg/signbit failures tied to d/f extensions; major stabilization issue, closed |
| [#24619](https://github.com/ziglang/zig/issues/24619) | riscv64 freestanding: invalid generated assembly for inlined mulX | Infinite self-recursion in `__muldi3`; closed |
| [#22436](https://github.com/ziglang/zig/issues/22436) | Wrong return address in @panic on riscv+freestanding | Closed |
| [#15517](https://github.com/ziglang/zig/issues/15517) | RISCV intToFloat incorrect results | Closed; closest match to a NaN/float-correctness bug found |
| [#4486](https://github.com/ziglang/zig/issues/4486) | Invalid vector codegen with riscv64 | Closed, early port era |

**Correctness bugs highlighted separately:** [#25064](https://github.com/ziglang/zig/issues/25064) (open, active miscompilation regression tied to LLVM 21) is the most severe currently-open correctness issue. The cluster of RVV-related test failures (#25083, #24299, #24301, #24300) shows a real pattern of vector-extension fragility through mid/late 2025, now closed but with no confirmed regression-free track record beyond that window given the CI gap described in Section 7.

**Benchmark data availability:** no dedicated Zig-on-riscv64 performance benchmark exists in any authoritative source found. The only numeric self-hosted-vs-LLVM-backend slowdown data point ([#25111](https://github.com/ziglang/zig/issues/25111), ~198-500x) is explicitly x86_64-labeled, not RISC-V.

## 12. Objections and Upstream Blockers

**Stated technical blockers:**
- Self-hosted riscv64 backend hard-requires V (RVV) + Zbb unconditionally (`CodeGen.zig:1110-1117`) - cannot target plain RV64GC hardware without these extensions, a self-imposed constraint rather than an external blocker.
- Riscv64 linker thunk generation is explicitly `unreachable` (unimplemented) in `src/link/Elf/Thunk.zig`.
- [#3451](https://github.com/ziglang/zig/issues/3451) (relaxation support) has an owner (Rexicon226, self-committed in a 2024-10-02 comment) but no committed timeline; the underlying upstream LLD limitation cited in 2019 is no longer the blocker as of 2024 per alexrp's own comment on the thread - remaining work is purely in Zig's own self-hosted linker.
- [#21519](https://github.com/ziglang/zig/issues/21519) (Tier-1 blocker) is milestone-tagged `pre-1.0` with no comments and no assignee as of the data gathered - open-ended.

**Organizational blockers:**
- No corporate sponsor is identified as funding riscv64-specific work; ZSF funds core contributors directly with no published per-target allocation.
- RISE, despite running 10 RISC-V-focused working groups and a general native RISC-V CI runner program, has zero involvement with Zig - no blog post, no working-group issue, no funded RFP (confirmed by checking all 34 RISE blog posts, all 25 `riseproject-dev` repos, and issue search across `compilers-and-toolchains-wg` and `language-runtimes-wg`).
- The riscv64 CI regression documented in Section 7 (present through at least 2026-05-06, absent by 2026-09-10) has no stated cause in available data and appears to have received no public discussion - a governance/process gap rather than a stated technical objection.
- Governance is BDFN (Andrew Kelley has final say), which concentrates prioritization risk in one person's/small-team's bandwidth rather than a broad maintainer pool that could independently sustain riscv64 CI through the GitHub-to-Codeberg transition.

**Acceptance probability for further riscv64 work:** the community's demonstrated stance (Section 1) is that new architectures are welcomed opportunistically and accepted even at low tiers, and the merge track record supports this: 15 of 20 riscv64-focused PRs identified were merged, with the 5 unmerged ones concentrated in either superseded 2024 early-bring-up attempts (reworked into merged PRs in the same window) or iterative CI-tuning churn. There is no evidence of upstream resistance to riscv64 as an architecture. The near-term open question is not "will riscv64 work be accepted" but "will the CI gate that verifies riscv64 correctness be restored" - a resourcing/hardware-access question, historically resolved once before (2024-08 to 2025-07, via a hardware-donation-to-CI-lane path) and plausibly resolvable again via the same pattern.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** upstream
- Zig is a general-purpose language/compiler toolchain, not an optimization-purpose project (the Step 2 test - "would it still deliver its value with generic scalar code on RISC-V" - is answered "yes," since Zig's value proposition is language/toolchain functionality, not out-performing a reference algorithm implementation). The optimization-purpose modifier from the color model therefore does not apply, and no Optimization level is reported.
- **Justification:** direct inspection of the canonical, live repository's sole active CI workflow (`.forgejo/workflows/ci.yaml` on [codeberg.org/ziglang/zig](https://codeberg.org/ziglang/zig), read 2026-09-10) shows zero riscv64 references - no build or test job, active or disabled - a regression from the riscv64-linux-debug/release jobs added by [PR #24385](https://github.com/ziglang/zig/pull/24385) (merged 2025-07-12) that closed the project's own Tier-System tracking issue [#4456](https://github.com/ziglang/zig/issues/4456) on 2026-05-06. Per the color model's primary CI-driven axis, an absent current upstream CI gate places this at orange or below. However, upstream continues to publish genuinely working riscv64 binaries directly from its own first-party channel - verified via HTTP 200 for both the 0.16.0 stable tarball and a current 0.17.0-dev nightly on [ziglang.org/download](https://ziglang.org/download/) - which is a stronger and more current signal than Ubuntu's riscv64-specific `zig0.15` package (confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/zig0.15)). `release_provider: upstream` is recorded to reflect this, distinguishing Zig from a project whose only riscv64 availability comes from a distro repackaging effort.
- **Pending work that could change the grade:** restoring the riscv64 CI lane on the Codeberg/Forgejo infrastructure (the shell scripts `ci/riscv64-linux-debug.sh`/`-release.sh` still exist, orphaned, in the tree and would only need re-wiring into `.forgejo/workflows/ci.yaml`) would very plausibly move this back toward blue, since the historical CI ran real tests (not build-only) on native hardware. RISE's general-purpose free native RISC-V CI runner program (announced [2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) is a concrete, currently-unused lever for this, though it targets GitHub integration and would need adaptation for Zig's Forgejo-based CI. No RISE funding or engagement with Zig currently exists to drive this.

## 14. Investment Analysis

RISE has made zero investment in Zig to date (confirmed: no blog post, no working-group issue, no funded RFP, no RISE Runner usage - Section 1, Section 7). Nothing in this section overlaps with existing RISE-funded work; all items below are net-new opportunities.

### 14.1 Functional Enablement

- Restore riscv64 CI on the current canonical Codeberg/Forgejo repository by re-wiring the still-present `ci/riscv64-linux-debug.sh`/`-release.sh` scripts into `.forgejo/workflows/ci.yaml` and re-securing self-hosted riscv64 runner access (the scripts and runner class already existed once; this is largely re-enablement, not new engineering).
- Close [#21519](https://github.com/ziglang/zig/issues/21519): implement the 6 missing self-hosted-backend compiler features (error_return_trace, is_named_enum_value, error_set_has_value, field_reordering, safety_checked_instructions, separate_thread) to progress riscv64 toward Tier 1.
- Implement riscv64 linker thunk support (currently `unreachable` in `src/link/Elf/Thunk.zig`).
- Implement R_RISCV_ALIGN relaxation in the self-hosted linker to close [#3451](https://github.com/ziglang/zig/issues/3451) (owner already identified: Rexicon226; upstream coordination, not solo greenfield work).
- Investigate relaxing the self-hosted backend's hard V+Zbb requirement so it can target plain RV64GC hardware, broadening applicability beyond RVV-capable SoCs like spacemit_x60.
- Investigate and fix [#18872](https://github.com/ziglang/zig/issues/18872) (3+ hour host-side hang using riscv64 as a Zig host, not just a cross-compile target).

### 14.2 Performance Optimization

- No riscv64 performance-benchmark baseline currently exists for Zig-the-compiler or Zig-compiled code; establishing one (compile-time throughput, generated-code quality vs LLVM backend, crypto/stdlib throughput) is a prerequisite to any further optimization investment decision.
- Not applicable as an optimization-purpose scope per Section 13's classification - Zig itself is not a performance-differentiated library, so this workstream should be scoped narrowly (compiler self-host performance, not general "make riscv64 faster" work) if pursued at all.

### 14.3 CI/CD Infrastructure

- Re-establish native riscv64 CI on Forgejo/Codeberg, ideally PR-gated (the historical CI never ran on PRs even when present - `if: github.event_name != 'pull_request'` - so restoring it to parity with amd64/arm64 PR-gating is itself a distinct improvement beyond simple re-enablement).
- Evaluate adapting RISE's free native RISC-V CI runner program (currently targeted at GitHub per its own announcement) to Forgejo/Codeberg for Zig's benefit; this may also benefit other projects that migrate off GitHub.
- Add regression coverage for the LLVM-21-triggered riscv64 miscompilation class seen in [#25064](https://github.com/ziglang/zig/issues/25064) to catch future LLVM-version-driven RISC-V regressions before they reach a release.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 omitted per the report's own scoping rule; Zig is a standalone compiler/toolchain with no significant dependent package ecosystem (Python/npm/Maven-style) requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Restore riscv64-linux-debug/release jobs on Forgejo/Codeberg (re-wire existing orphaned scripts, secure runner access) | 1-2 | RISE or Zig core (alexrp precedent) | Critical |
| CI/CD | PR-gate riscv64 CI to match amd64/arm64 gating discipline | 1 | RISE or Zig core | High |
| Functional | Close #21519 - implement 6 missing self-hosted-backend compiler features | 4-8 | Zig core (backend-self-hosted owners) | High |
| Functional | Implement riscv64 linker thunk support | 2-4 | Zig core (linker owners) | Medium |
| Functional | Implement R_RISCV_ALIGN relaxation in self-hosted linker (#3451) | 2-4 | Rexicon226 (self-identified owner) | Medium |
| Functional | Relax self-hosted backend's hard V+Zbb requirement to support plain RV64GC | 2-4 | Zig core (backend-self-hosted owners) | Medium |
| Functional | Fix host-side riscv64 LLVM-emit hang (#18872) | 1-3 | Zig core / LLVM liaison | High |
| Performance | Establish a riscv64 compiler-performance and generated-code-quality benchmark baseline | 2-3 | RISE or Zig core | Medium |
| CI/CD | Add LLVM-version-bump regression coverage for riscv64 (post #25064) | 1-2 | RISE or Zig core | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Zig homepage](https://ziglang.org/)
- [Zig download page (riscv64 binaries)](https://ziglang.org/download/)
- [Zig 0.16.0 release notes](https://ziglang.org/download/0.16.0/release-notes.html)
- [Zig 0.12.0 release notes](https://ziglang.org/download/0.12.0/release-notes.html)
- [Zig 0.6.0 release notes](https://ziglang.org/download/0.6.0/release-notes.html)
- [Zig riscv64-freebsd platform support page](https://ziglang.org/learn/platform-support/riscv64-freebsd/)
- [Zig migration to Codeberg announcement](https://ziglang.org/news/migrating-from-github-to-codeberg/)
- [Zig Software Foundation](https://ziglang.org/zsf/)
- [Canonical repository (Codeberg)](https://codeberg.org/ziglang/zig)
- [Frozen GitHub mirror (not mirrored going forward)](https://github.com/ziglang/zig)
- [Issue #4456 - Tier System: riscv64-linux (closed)](https://github.com/ziglang/zig/issues/4456)
- [Issue #21519 - self-hosted riscv backend missing features](https://github.com/ziglang/zig/issues/21519)
- [Issue #23375 - f128 arguments in riscv self-hosted backend](https://github.com/ziglang/zig/issues/23375)
- [Issue #3451 - LLD/relaxation R_RISCV_ALIGN](https://github.com/ziglang/zig/issues/3451)
- [Issue #24141 - riscv64 airBitCast TODO](https://github.com/ziglang/zig/issues/24141)
- [Issue #25149 - esp32p4 RISC-V CPU support](https://github.com/ziglang/zig/issues/25149)
- [Issue #20918 - self-hosted riscv64 gp init](https://github.com/ziglang/zig/issues/20918)
- [Issue #23036 - riscv64-linux zig objcopy -S](https://github.com/ziglang/zig/issues/23036)
- [Issue #23195 - riscv64-uefi produces ELF not COFF](https://github.com/ziglang/zig/issues/23195)
- [Issue #25083 - SHA-3 tests fail on RISC-V vector](https://github.com/ziglang/zig/issues/25083)
- [Issue #24299 - salsa20 tests fail on RISC-V vector](https://github.com/ziglang/zig/issues/24299)
- [Issue #18870 - riscv64-linux std/behavior tests fail on hardware](https://github.com/ziglang/zig/issues/18870)
- [Issue #24619 - riscv64 freestanding invalid mulX codegen](https://github.com/ziglang/zig/issues/24619)
- [Issue #15368 - musl toolchain default on riscv64](https://github.com/ziglang/zig/issues/15368)
- [Issue #24508 - unable to build on riscv64gc-linux-musl](https://github.com/ziglang/zig/issues/24508)
- [Issue #22436 - wrong return address in @panic on riscv+freestanding](https://github.com/ziglang/zig/issues/22436)
- [Issue #25013 - RISC-V extension changes coming to LLVM 22](https://github.com/ziglang/zig/issues/25013)
- [Issue #25468 - test steps disabled on riscv64-linux CI](https://github.com/ziglang/zig/issues/25468)
- [Issue #23262 - riscv32-linux missing wait4](https://github.com/ziglang/zig/issues/23262)
- [Issue #25612 - RISC-V CPU profiles](https://github.com/ziglang/zig/issues/25612)
- [Issue #20671 - callconv(.Interrupt) unusable on riscv](https://github.com/ziglang/zig/issues/20671)
- [Issue #25064 - variadic function test regressed on RISC-V with LLVM 21](https://github.com/ziglang/zig/issues/25064)
- [Issue #24301 - vector division operators fail on RISC-V vector](https://github.com/ziglang/zig/issues/24301)
- [Issue #24300 - bit_set IntegerBitSet fails on RISC-V vector](https://github.com/ziglang/zig/issues/24300)
- [Issue #4486 - invalid vector codegen with riscv64](https://github.com/ziglang/zig/issues/4486)
- [Issue #15517 - RISCV intToFloat incorrect results](https://github.com/ziglang/zig/issues/15517)
- [Issue #24333 - riscv64 subtract zero from signed integers](https://github.com/ziglang/zig/issues/24333)
- [Issue #18872 - Zig hangs at LLVM emit object on riscv64-linux host](https://github.com/ziglang/zig/issues/18872)
- [Issue #25111 - self-hosted compiler ~500x slower than LLVM (x86_64, not riscv)](https://github.com/ziglang/zig/issues/25111)
- [PR #4456 comment thread - hardware donation discussion](https://github.com/ziglang/zig/issues/4456)
- [PR #19431 - revive STAGE2 RISCV64 backend](https://github.com/ziglang/zig/pull/19431)
- [PR #20070 - more RISC-V backend progress](https://github.com/ziglang/zig/pull/20070)
- [PR #24302 - Native RISC-V bootstrap and test fixes](https://github.com/ziglang/zig/pull/24302)
- [PR #24385 - ci: Add riscv64-linux-debug and riscv64-linux-release](https://github.com/ziglang/zig/pull/24385)
- [PR #24451 - ci: riscv64-linux timeout tuning](https://github.com/ziglang/zig/pull/24451)
- [PR #18815 - Make Zig code compile for riscv64-linux (closed unmerged)](https://github.com/ziglang/zig/pull/18815)
- [PR #18803 - glibc riscv64-linux-gnu fixes (closed unmerged)](https://github.com/ziglang/zig/pull/18803)
- [PR #18973 - ELF relocation refactor + RISCV relocs](https://github.com/ziglang/zig/pull/18973)
- [PR #19034 - elf: basic aarch64 and riscv64 support](https://github.com/ziglang/zig/pull/19034)
- [PR #18856 - CPU model detection for RISC-V](https://github.com/ziglang/zig/pull/18856)
- [PR #24070 - valgrind riscv64-linux support](https://github.com/ziglang/zig/pull/24070)
- [PR #2042 - elf riscv32/riscv64 getLDMOption options](https://github.com/ziglang/zig/pull/2042)
- [PR #3446 - More RISC-V stuff](https://github.com/ziglang/zig/pull/3446)
- [PR #10218 - stage2 RISCV64 cleanup](https://github.com/ziglang/zig/pull/10218)
- [PR #10006 - RISC-V ABI selection](https://github.com/ziglang/zig/pull/10006)
- [PR #15312 - baseline_rv32 feature fix](https://github.com/ziglang/zig/pull/15312)
- [Ubuntu packages search - Zig, suite resolute](https://packages.ubuntu.com/search?keywords=Zig&suite=resolute&searchon=names&section=all)
- [Ubuntu zig0.15 riscv64 package](https://packages.ubuntu.com/resolute/riscv64/zig0.15)
- [PyPI zig package JSON (unrelated package, not the compiler)](https://pypi.org/pypi/zig/json)
- [RISE wheel builder pypi index for zig](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/zig/)
- [RISE Project blog index](https://riseproject.dev/blog/)
- [RISE Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE working group election results, 2026-05-04 (Zig mentioned in bio only)](https://riseproject.dev/2026/05/04/rise-project-working-group-elections-results/)
- [RISE working group election results, 2025-03-31 (Zig mentioned in bio only)](https://riseproject.dev/2025/03/31/working-group-lead-election-results/)
- [RISE Outsized Impact Award Q1 2026](https://riseproject.dev/2026/04/21/rise-outsized-impact-award-q1-2026/)
- [RISE Python wheel_builder documentation](https://riseproject.gitlab.io/python/wheel_builder/)
- [Third-party Zig riscv64 crypto benchmark gist (AllWinner D1, unaffiliated)](https://gist.github.com/kassane/c13d7872b51f4c45f5bc28396c274846)
- [zesty-core - RISC-V OS kernel written in Zig](https://github.com/eastonman/zesty-core)
- [lupyuen - Zig on RISC-V BL602 port notes](https://lupyuen.github.io/articles/zig)