---
title: Haskell (GHC)
parent: Project Reports
color: blue
---

# Haskell (GHC)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Haskell (GHC)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

GHC (the Glasgow Haskell Compiler) is licensed BSD-3-Clause; copyright is held by the University Court of the University of Glasgow ([license text](https://www.haskell.org/ghc/license.html)).

Governance is not centralized in the Haskell Foundation. GHC is an independent open-source project with community input via GitLab, Matrix, Discourse and mailing lists, and a smaller "core group" (GHC HQ, tracked in the `ghc-hq` GitLab project) that makes larger strategic and release decisions. Language-level changes go through a separate GHC Steering Committee [NEEDS VERIFICATION - not confirmed against a primary source in this research pass; gitlab.haskell.org was blocked by an Anubis anti-bot challenge for this specific check]. The Haskell Foundation is a distinct nonprofit, chaired by Andres Loh (Well-Typed), that funds ecosystem/tooling work but does not directly govern the compiler.

Corporate sponsors and maintainer affiliations identified in research:
- **Well-Typed** is the de facto lead maintainer organization. It employs Ben Gamari (release manager, opened the master RISC-V tracking issue #16783) and Andreas Klebinger (contributed RISC-V NCG floating-point min/max support and RTS hardening work).
- **IOG (Input Output Global, formerly IOHK)** is a long-time major financial sponsor of GHC and a founding sponsor of the Haskell Foundation.
- **Anduril, Juspay, Mercury** funded general GHC dev-tooling/performance work per Well-Typed's late-2024 activity report.
- Other sponsors listed on haskell.org/ghc: DreamHost, Google Research, MacStadium, Packet, Tweag I/O, Serokell.

Source: [Well-Typed GHC activities report, September-November 2024](https://well-typed.com/blog/2024/12/ghc-activities-report-september-november-2024/).

Community stance on the RISC-V port specifically appears open and contribution-driven: the port was carried through the normal GitLab merge-request review process by a mix of Well-Typed staff (Andreas Klebinger), an independent contributor (Sven Tennie, who authored the headline NCG merge request as `supersven`), a distro packager (Sergei Trofimovich of Gentoo, who authored the earliest riscv-related autoconf fix in 2018), and later external contributors (ARATA Mizuki) fixing correctness bugs through 2026. No explicit policy statement restricting or gating new architecture ports was found.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-03-08 | Issue #14903 "RISC-V port" opened (earliest exploratory ticket, closed 2019-09-10, superseded by #16783) | [#14903](https://gitlab.haskell.org/ghc/ghc/-/issues/14903) |
| 2018-07-17 | Earliest riscv-related commit found (`5e63a2524`), by Sergei Trofimovich (Gentoo): autoconf triple-matching fix for `riscv*` targets | ghc-commits mailing list archive (per research) |
| 2019-06-08 | Issue #16783 "RISC-V support" opened by Ben Gamari - the master tracking issue. Proposed two paths: an LLVM-backend route or a native code generator (NCG), since GHC had neither at the time | [#16783](https://gitlab.haskell.org/ghc/ghc/-/issues/16783) |
| 2020-10-12 | Sven Tennie revives RISC-V work on `wip/riscv-revived` branch (commit `2faf4e51a`) | ghc-commits mailing list archive (per research) |
| 2020-10-20 | MR !4327 "Implement riscv64 LLVM backend" opened; closed unmerged 2021-03-04 (abandoned/superseded rather than merged directly) | [!4327](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/4327) |
| 2021-09-05 | MR !6460 "Correct load_load_barrier for risc-v" opened; merged 2021-11-04. Fixed an incorrect `fence w,r` (store-load) barrier used where a load-load barrier was required, modeled on the Linux kernel's `smp_rmb()` | [!6460](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/6460) |
| 2023-03-25 | Issue #23179 "RISC-V Native Code Generator" opened by Sven Tennie - "meant to raise awareness ... it would be a pity if someone else were working on the same thing" | [#23179](https://gitlab.haskell.org/ghc/ghc/-/issues/23179) |
| 2023-06-24 | MR !10714 "Hadrian: enable GHCi support on riscv64" opened; merged 2023-07-12 | [!10714](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/10714) |
| 2024-08-05 | MR !13105 "Add RISCV64 Native Code Generator (NCG) to master" opened by Sven Tennie, testsuite reported 100% passing (manual/local testing, not CI) | [!13105](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/13105) |
| 2024-09-12 | MR !13105 merged to master | [!13105](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/13105) |
| 2024-09-13 | Issue #23179 closed | [#23179](https://gitlab.haskell.org/ghc/ghc/-/issues/23179) |
| 2024-09-16 | Issue #16783 closed, superseded by completed NCG work | [#16783](https://gitlab.haskell.org/ghc/ghc/-/issues/16783) |
| GHC 9.12.1 | First release shipping the native riscv64 NCG. Release notes state verbatim: "GHC now has experimental support for native RISC-V code generation (#16783)" | [GHC 9.12.1 release notes](https://downloads.haskell.org/~ghc/9.12.1/docs/users_guide/9.12.1-notes.html) |

**Is it fully upstream?** Yes. The NCG lives in `compiler/GHC/CmmToAsm/RV64/` on master and shipped in an official GHC release (9.12.1) as an upstream-labeled "experimental" feature. It is not a downstream fork or vendor patch set. However, upstream's own release notes explicitly call it "experimental" rather than fully supported, and correctness fixes continued landing through at least August 2026 (see Section 11).

**Key contributors and affiliations:** Sven Tennie (NCG author, `supersven`; employer not stated in available sources), Andreas Klebinger (Well-Typed; floating-point min/max NCG support, RTS hardening), Ben Gamari (Well-Typed; opened tracking issue, release manager), Sergei Trofimovich (Gentoo; earliest autoconf fix), Takenobu Tani (author of the load-barrier fix, !6460), Andreas Schwab (GHCi enablement, !10714; tables-next-to-code attempt, !5471), Matthew Pickering (SIMD/vector gap work per Well-Typed report), ARATA Mizuki (independent; floating-point correctness fixes, !16164, 2026).

## 3. Upstream Support Tier

No formal Tier-1/Tier-2/Tier-3 platform classification for riscv64 could be confirmed from GHC's primary documentation - `gitlab.haskell.org` was blocked by an Anubis anti-bot challenge for the relevant wiki/MAINTAINERS-file fetches in this research pass. What can be established from CI configuration is that riscv64 is **not part of the default/gating validate pipeline**: the riscv64 cross-compile job is wrapped in `addValidateRule RiscV (...)` in `.gitlab/generate-ci/gen_ci.hs`, meaning it fires only on a nightly schedule or when a merge request carries the `RISC-V` GitLab label, unlike the unconditional "x86 -> aarch64" cross job defined immediately above it in the same source file (no `addValidateRule` wrapper). Source: [.gitlab/generate-ci/gen_ci.hs (via `git clone` of gitlab.haskell.org/ghc/ghc, master, commit `9a442c9`)](https://github.com/ghc/ghc/blob/master/.gitlab/generate-ci/gen_ci.hs).

One data point contradicts an older secondary source: the NixOS wiki (last edited ~May 2025) describes riscv64 as needing `--enable-unregisterised` due to segfaults in registerised builds. Current primary-source `m4/ghc_unregisterised.m4` on master lists riscv64 among the architectures where `UnregisterisedDefault=NO` (i.e. registerised by default, using the real NCG) - directly contradicting the NixOS wiki's characterization for current master. This is flagged as a discrepancy: NixOS wiki claim vs. `m4/ghc_unregisterised.m4` primary source. Source: [wiki.nixos.org RISC-V/GHC](https://wiki.nixos.org/wiki/RISC-V/GHC) vs. `m4/ghc_unregisterised.m4` (via git clone).

| Arch | CI runs by default (every push/MR) | CI test execution | Official upstream binary release |
|---|---|---|---|
| amd64 (x86_64) | Data not available: exact default-pipeline job listing was not exhaustively enumerated in this research; amd64 is GHC's host/bootstrap architecture and official bindists exist (e.g. `ghc-9.10.3-x86_64-deb12-linux.tar.xz`, used as the CI image's own bootstrap compiler) | Data not available (not explicitly enumerated) | Yes - confirmed via CI image bootstrap step referencing `downloads.haskell.org` bindists |
| arm64 (aarch64) | Yes - unconditional cross-compile job "x86 -> aarch64" in `gen_ci.hs`, no `addValidateRule` gate | Data not available (uses the same `crossConfig`/`CROSS_EMULATOR` mechanism as riscv64, which does run tests, but this was not independently confirmed for the aarch64 job specifically) | Data not available in this research pass |
| riscv64 | No - gated behind `addValidateRule RiscV`, runs nightly or when a "RISC-V" label is applied to an MR | Yes, when `CROSS_EMULATOR` is set (it is, for this job: `qemu-riscv64 -L /usr/riscv64-linux-gnu`) | No - issue [#23519 "RISC-V binary packages"](https://gitlab.haskell.org/ghc/ghc/-/issues/23519) (opened 2023-06-14) remains open, requesting official riscv64 release tarballs |

## 4. Technical Architecture and RISC-V-Specific Subsystems

MR !13105 added an entirely new native-code-generator backend module tree plus RTS ELF linker support (49 files touched). Source: [!13105](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/13105).

- **Native Code Generator (NCG):** `compiler/GHC/CmmToAsm/RV64/{CodeGen,Cond,Instr,Ppr,RegInfo,Regs}.hs`, `compiler/GHC/CmmToAsm/RV64.hs`, `compiler/GHC/Platform/RISCV64.hs`, register allocator integration in `compiler/GHC/CmmToAsm/Reg/Linear/RV64.hs`. `CodeGen.hs` contains `Note [RISCV64 far jumps]`, documenting a workaround for RISC-V's 12-bit conditional-branch immediate range. Source: [github.com/ghc/ghc/tree/master/compiler/GHC/CmmToAsm/RV64](https://github.com/ghc/ghc/tree/master/compiler/GHC/CmmToAsm/RV64).
- **RTS register mapping:** `rts/include/stg/MachRegs/riscv64.h`, sibling to arm64.h, ppc.h, s390x.h, x86.h - maps STG virtual registers to RISC-V physical registers.
- **RTS ELF linker/relocation:** `rts/linker/elf_plt_riscv64.{c,h}`, `rts/linker/elf_reloc_riscv64.{c,h}`, added specifically in !13105 (needed for GHCi/dynamic loading to work on riscv64).
- **Memory barrier correctness:** MR !6460 fixed `load_load_barrier()` to use the correct fence operands for RISC-V's weaker memory-ordering model (predates the NCG merge; was exercised via the LLVM-backend era).
- **LLVM backend:** riscv64 support via MR !4327 (2020) - the original, pre-NCG codegen path, still usable via `-fllvm`. `configure.ac` and `utils/ghc-toolchain/src/GHC/Toolchain/Program.hs` both pin `LlvmMinVersion=13` (inclusive) and `LlvmMaxVersion=24` (exclusive), i.e. LLVM 13 through 23 accepted; the official riscv64 CI image installs LLVM 21.
- **Atomics:** sub-word (`char`/`short`) atomics on riscv64 require `libatomic` linkage because the RISC-V "A" extension only natively guarantees word/doubleword atomics; `m4/fp_cc_supports__atomics.m4` auto-detects this and links `-latomic` when needed.
- **GHCi / bytecode interpreter:** enabled on riscv64 via MR !10714 (merged 2023-07-12); the interpreter itself is architecture-independent bytecode, but needed the RTS ELF linker work above to load object code at runtime.
- **Vector/SIMD (RVV):** no SIMD-dispatch code specific to riscv64 exists in the merged NCG. Full RVV (>=1.0) support is a separate, still-open **draft** MR !13467 (created 2024-10-20, last updated 2025-12-30), tracked by umbrella issue #25331. The author explicitly documents an unresolved design tension: GHC's codegen needs register widths at compile time (e.g. for stack spilling), but RVV's vector-register length is a runtime CPU property; the current workaround is a user-supplied `-mriscv-vlen` flag rather than true runtime-variable-width support. Source: [!13467](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/13467).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native Code Generator (NCG) | Yes (original backend) | Yes | Yes, merged 2024-09-12 (!13105), shipped 9.12.1, upstream-labeled "experimental" |
| LLVM backend | Yes | Yes | Yes (!4327, 2020) |
| GHCi / bytecode interpreter | Yes | Data not available | Yes, since !10714 (2023-07-12) |
| RTS ELF linker/PLT/relocation | Data not available (long-standing) | Data not available | Added specifically for riscv64 in !13105 |
| Vector/SIMD (RVV) support | Data not available | Data not available | Not merged; open draft !13467, tracked in [#25331](https://gitlab.haskell.org/ghc/ghc/-/issues/25331) |
| Registerised build by default | Yes | Yes | Yes, per `m4/ghc_unregisterised.m4` (contradicts older NixOS wiki claim, see Section 3) |

## 5. Build System, Cross-Compilation, and Toolchain

GHC does not use CMake. Its build system is **Autoconf** (`./configure`, `configure.ac`, `m4/*.m4`) for toolchain detection plus **Hadrian** (a Shake-based Haskell build system) for compilation. Options are `--enable-<feature>` / `--disable-<feature>` flags to `./configure`, not CMake `-D` cache variables. Source: repository clone of `gitlab.haskell.org/ghc/ghc` (master, commit `9a442c9`).

**Exact riscv64 CI job (`.gitlab/generate-ci/gen_ci.hs`):**
```
addValidateRule RiscV (validateBuilds Amd64 (Linux Debian13Riscv)
  (crossConfig "riscv64-linux-gnu" (Emulator "qemu-riscv64 -L /usr/riscv64-linux-gnu") Nothing))
```
resolves to job env: `CROSS_TARGET=riscv64-linux-gnu`, `CROSS_EMULATOR="qemu-riscv64 -L /usr/riscv64-linux-gnu"`, `CONFIGURE_ARGS="--with-intree-gmp --enable-strict-ghc-toolchain-check"`. Note riscv64 is not `unregisterised`, so `--enable-unregisterised` is not passed.

**Actual configure/build commands (`.gitlab/ci.sh`):**
```
python3 boot
./configure --enable-tarballs-autodownload --with-intree-gmp \
  --enable-strict-ghc-toolchain-check --disable-numa \
  --target=riscv64-linux-gnu GHC=$GHC
hadrian/build -j --docs=none --flavour=validate binary-dist-dir
```
Testing is gated on `CROSS_EMULATOR` being set; when set, every test binary runs through `qemu-riscv64 -L /usr/riscv64-linux-gnu <test-binary>`. `.gitlab/ci.sh` contains an explicit `TODO: Remove this check, see #25299` guarding the skip-if-unset behavior.

**Toolchain version requirements and why:** No hard minimum GCC/Clang version is pinned for riscv64 specifically. Instead, `m4/fp_cc_supports__atomics.m4` compiles a test program using sub-word atomics and links `-latomic` if the link fails without it - relevant because GCC versions older than approximately 12 lack inline sub-word atomics for riscv64 and require `libatomic`. LLVM 13-23 is accepted (see Section 4); the CI image installs LLVM 21. The Debian 13 (trixie) cross-toolchain packages used are `gcc-riscv64-linux-gnu` and `g++-riscv64-linux-gnu`, with no separate version pin beyond whatever Debian 13 ships.

**QEMU usage:** the `qemu-user` package provides `qemu-riscv64`; `CROSS_EMULATOR` env var carries the invocation, consumed by Hadrian's `hadrian/src/Settings/Builders/RunTest.hs`. Community/manual cross-testing (per the GitLab wiki's `RISCV64-Nix-cross-environment-(hacky)` page) uses `-fexternal-interpreter` because Template Haskell/GHCi splices must run on the host GHC, not be QEMU-emulated, and recommends reduced parallelism (`-j10`) and increased test timeouts because emulation is "much slower than native execution."

**Known build failures found in the issue tracker:**
- [#18928](https://gitlab.haskell.org/ghc/ghc/-/issues/18928) (2020, open): Hadrian build on Debian unstable/riscv fails linking due to missing `libatomic` symbols.
- [#19566](https://gitlab.haskell.org/ghc/ghc/-/issues/19566) (2021, open): `./configure --target=riscv64-unknown-linux-gnu` fails because LLVM 11's RISC-V backend doesn't support GHC's custom calling convention.
- [#20519](https://gitlab.haskell.org/ghc/ghc/-/issues/20519) (2021, open): stage2 binaries from an x64-to-riscv64 cross toolchain are unusable under `qemu-user-riscv64`.
- [#24678](https://gitlab.haskell.org/ghc/ghc/-/issues/24678) (2024, open): suspected "far branch" relocation-range issue in LLVM RISCV64 cross-builds; linker fails building `libHSCabal`.

**Official documentation gap:** there is no dedicated riscv64 entry in GHC's official Users Guide or release-notes prose beyond the single 9.12.1 line quoted in Section 2. The only first-party build guide is a wiki page explicitly titled "hacky" (`RISCV64/RISCV64-Nix-cross-environment-(hacky).md`), a community-contributed Nix recipe, not an official guide. The wiki's `platforms.md` table lists RISC-V (rv64), owner `@supersven`, with GHCi/NCG/Dyn-libs columns marked "No" - flagged by researchers as stale relative to the merged NCG, since the source tree confirms an NCG exists.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native code generator | Yes | Yes | Yes (experimental, since 9.12.1) |
| Official upstream binary release | Yes (bindists referenced in CI bootstrap) | Data not available | No (issue [#23519](https://gitlab.haskell.org/ghc/ghc/-/issues/23519) open) |
| Default/gating CI | Data not available (implied, host arch) | Yes (unconditional cross job) | No (label-gated / nightly only) |
| SIMD/vector codegen | Data not available | Data not available | No (draft, unmerged: !13467) |
| GHCi | Yes | Data not available | Yes (since 2023-07-12) |

**Functional gaps:** no official upstream riscv64 binary release forces users to cross-compile, use a third-party bootstrap ([skeuchel/riscv64-ghc-bindist](https://github.com/skeuchel/riscv64-ghc-bindist)), or rely on distro packages (Section 8). Vector/SIMD support is entirely absent from the merged NCG; RVV work remains an unmerged draft.

**Performance gaps:** no published GHC-specific benchmark data exists comparing riscv64 to amd64/arm64 (see Section 14 caveats). Because SIMD is unimplemented, any Haskell code path that would benefit from vectorization runs scalar on riscv64 regardless of hardware RVV support. [#25966](https://gitlab.haskell.org/ghc/ghc/-/issues/25966) (open) proposes using the RISC-V B-extension's dedicated sign-extend instructions instead of shift-pairs for sub-word sign extension - a concrete, open, codegen-efficiency gap.

**Security hardening gaps:** Data not available - no ASLR/stack-canary/CFI-specific riscv64 findings were located in this research.

**Floating-point/NaN semantics issues:** three distinct correctness bugs were found and fixed in mid-2026, all bundled in MR !16164 (author notes GHC's CI does not run tests on RISC-V, so these were caught only by manual cross-testing):
- [#27300](https://gitlab.haskell.org/ghc/ghc/-/issues/27300): `castFloatToWord32` can generate bad, signed `Word32`s on RISC-V, analogous to an old x86_64 bug (#16617).
- [#27303](https://gitlab.haskell.org/ghc/ghc/-/issues/27303): `truncate` incorrectly rounds-to-nearest instead of toward zero under the RISC-V NCG.
- [#27306](https://gitlab.haskell.org/ghc/ghc/-/issues/27306): floating-point variables can be clobbered by a function call because the NCG wrongly assigns caller-saved registers to FP variables live across a call, violating the RISC-V ELF psABI.

## 7. CI/CD Infrastructure

GHC's CI lives entirely on GitLab (`gitlab.haskell.org/ghc/ghc`), generated from `.gitlab/generate-ci/gen_ci.hs` into `.gitlab-ci.yml`/`.gitlab/jobs.yaml`. No riscv64 CI exists on GitHub Actions, Jenkins, or Buildbot. There is no evidence of RISE RISC-V runner usage anywhere in the research (GHC is not a RISE-tracked project; see Section 1 and Section 12).

**riscv64 job:** `nightly-x86_64-linux-deb13-riscv-cross_riscv64-linux-gnu-validate` - a cross-compilation job (x86_64 host to `riscv64-linux-gnu` target via QEMU user-mode emulation), not native riscv64 hardware. It runs nightly by schedule, and can additionally be triggered on-demand in a merge request via the `RISC-V` GitLab label. It is not part of the default gating validate pipeline. Test execution occurs via `qemu-riscv64` when `CROSS_EMULATOR` is set (it is, for this job), with `BUILD_FLAVOUR=validate`, `BIGNUM_BACKEND=gmp`, `CROSS_STAGE=2`; artifacts (junit.xml, test outputs) are retained 8 weeks.

Notably, a contributor working on the FP correctness fixes in June 2026 stated directly in an MR description: *"AFAIK, our CI does not run tests on RISC-V"* and manually cross-compiled/tested with QEMU rather than relying on CI. This is corroborated by two still-open items: issue [#25254 "Setup CI for RISCV64"](https://gitlab.haskell.org/ghc/ghc/-/issues/25254) (opened 2024-09-14, still open) and draft MR [!16176 "Draft: ci: run full testsuite for cross-compilers when label set"](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/16176) (opened 2026-06-12, still open/draft) - both indicate the riscv64 CI job's practical, day-to-day reliability/coverage is considered insufficient by contributors even though the job exists in configuration.

| Arch | Default pipeline | Hardware | Test execution | Gating |
|---|---|---|---|---|
| amd64 | Data not available (implied primary/host) | Native | Data not available | Data not available |
| arm64 | Yes, unconditional cross job | QEMU (`qemu-aarch64`) | Data not available (same mechanism as riscv64) | Yes (unconditional) |
| riscv64 | No - label-gated or nightly | QEMU (`qemu-riscv64`) | Yes, when triggered | No |

## 8. Distribution and Release Status

**Official upstream:** no riscv64 binary release tarballs found on `downloads.haskell.org`; issue [#23519 "RISC-V binary packages"](https://gitlab.haskell.org/ghc/ghc/-/issues/23519) (opened 2023-06-14) remains open, explicitly requesting this.

**PyPI/npm/Maven/OCI:** not applicable - GHC is a compiler toolchain, not published to any of these registries. (A literal PyPI search for "haskell-(ghc)" returned 404, as expected and not meaningful.)

**Linux distributions:**
- **Ubuntu 26.04 "Resolute":** package `ghc`, version `9.10.3-4`, built for amd64, arm64, armhf, ppc64el, riscv64, s390x. Confirmed via direct query of [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=ghc&suite=resolute&searchon=names&section=all). Appears to be an unpatched build from standard upstream source through Debian's riscv64 porter infrastructure (not independently verified against the `.debian/` packaging diff in this pass).
- **openSUSE Tumbleweed:** ships riscv64 `ghc-*` RPMs per research [NEEDS VERIFICATION - stated in research summary without a direct package-tracker link fetched].

**Third-party (not upstream, not distro):**
- [skeuchel/riscv64-ghc-bindist](https://github.com/skeuchel/riscv64-ghc-bindist): unofficial binary GHC packages for riscv64, intended as a bootstrap compiler for native builds.
- [felixonmars/archriscv-packages](https://github.com/felixonmars/archriscv-packages/tree/master/haskell-ghc-lib-parser): Arch Linux RISC-V packaging patches for `ghc-lib-parser`.

**What a user must do to get a working binary today:** install the distro package on Ubuntu 26.04 or openSUSE Tumbleweed riscv64, or cross-compile from x86_64/aarch64 following the community "hacky" Nix wiki recipe, or bootstrap using the third-party `skeuchel/riscv64-ghc-bindist` binaries. There is no path to an official, upstream-published riscv64 GHC binary as of this research.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| GMP (`libgmp-dev`) | Default `Integer` backend (ghc-bignum "gmp") | Yes (Ubuntu 26.04 resolute) | Presumed via Debian autopkgtest, not independently verified | Shipped | None identified |
| libffi | FFI calling-convention trampolines/closures | Yes, riscv64 merged 2018, in every release since 3.3 (2019) | Yes, in the `build-qemu` CI matrix per dependency research (release-blocking) | Shipped | None |
| ncurses/terminfo | GHCi line editor (haskeline) | Yes (Ubuntu 26.04 resolute, 6.6+20251231-1) | Data not available | Shipped | None identified |
| LLVM (`llc`/`opt`/`clang`) | Optional/alternate codegen backend; historically load-bearing pre-NCG (riscv64 GHC had no NCG before 9.12, so builds relied on LLVM or `--enable-unregisterised`) | Yes (Ubuntu 26.04 resolute, LLVM's own riscv64 backend is mature/tier-1) | Not confirmed independently for GHC's usage | Shipped | Historically the single point-of-failure dependency for riscv64 GHC; no longer load-bearing since NCG landed |
| libnuma | RTS `--numa` NUMA-aware GC placement (Linux, optional) | Yes (Ubuntu 26.04 resolute); one cosmetic `#warning` on riscv64 for `set_mempolicy_home_node` (ifdef list omits `__riscv`), no runtime effect | No upstream riscv64 CI job for this specifically | Shipped | Non-blocking cosmetic warning, no upstream issue filed |
| elfutils/libdw | Optional DWARF stack unwinding (`--enable-dwarf-unwind`) | Yes (Ubuntu 26.04 resolute, 0.194-4) | Fully upstream since 2018 riscv64 backend merge | Shipped | Issue [#25537](https://gitlab.haskell.org/ghc/ghc/-/issues/25537) (open): RTS's `Libdw.c` lacks a RISC-V64 implementation of `set_initial_registers` - a GHC-side gap, not an elfutils gap |
| zstd | Optional compressed-sections support (`FP_FIND_LIBZSTD`) | Yes (Ubuntu 26.04 resolute, 1.5.7+dfsg-3) | Passing per dependency research | Shipped | No correctness blockers for GHC's use |
| Python 3 | Build-time only (Hadrian/testsuite driver) | Yes (Ubuntu 26.04 resolute, 3.14.3-0ubuntu2) | Builds and runs | Shipped | Not linked into compiled Haskell programs |
| Perl | Build-time only (build system/testsuite tooling) | Yes (Ubuntu 26.04 resolute, 5.40.1-7build1, ports archive) | Mature riscv64 support | Shipped | None identified |
| Autoconf | Build-time only (`./boot`) | Yes (arch:all, architecture-independent) | N/A | Shipped | None |
| GHC itself (bootstrap compiler) | Self-hosting: `configure.ac` requires a pre-existing `ghc` binary | Yes (Ubuntu 26.04 resolute, `ghc` 9.10.3-4) | Confirms a working riscv64 bootstrap chain now exists in the Debian/Ubuntu archive | Shipped | Historically the sharpest blocker ("cannot bootstrap GHC on this platform" per NixOS wiki, pre-9.12); resolved at distro level |

**Deep-dive: LLVM.** Before the NCG merged (pre-9.12), riscv64 GHC builds depended on either the LLVM backend or `--enable-unregisterised`, since GHC had no native codegen for the architecture; registerised-NCG riscv64 output was reported to segfault pre-9.12 per the NixOS wiki. LLVM's own riscv64 backend is described as mature/upstream-tier-1 by researchers, and `configure.ac`/`ghc-toolchain` both accept LLVM 13 through 23. This dependency is no longer a single point of failure now that the native NCG exists, but the LLVM backend remains in use and in the CI toolchain (LLVM 21 in the official riscv64 CI image).

**Deep-dive: libffi.** Provides the FFI trampolines GHC's RTS relies on for `foreign import`/`foreign export`. riscv64 support merged into libffi in 2018 and has shipped in every libffi release since 3.3 (2019); it is in the `build-qemu` CI matrix per the dependency research pass (reported as release-blocking for libffi itself, per the project's own dependency status note - project-reports/libffi.md was referenced but not read directly in this pass).

## 11. Known Bugs and Active Issues

**Open (as of this research, most recent 2026-08-23):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#27733](https://gitlab.haskell.org/ghc/ghc/-/issues/27733) | Missing RISC-V NCG MachOp MO_S_Mul2 | Open (2026-08-23) | Correctness (panic) | Test `T27046` panics with `outOfLineCmmOp: MO_S_Mul2 W64 not supported here`. Most recent open item found |
| [#26260](https://gitlab.haskell.org/ghc/ghc/-/issues/26260) | Add metadata to registers | Open (2025-08-04) | Codegen quality | Excessive sign-extend/truncate code around sub-64-bit MachOps |
| [#26259](https://gitlab.haskell.org/ghc/ghc/-/issues/26259) | Suspicious special case for SRA-I | Open (2025-08-04) | Codegen consistency | `SRA` gets an `SRAI` special case in the pretty-printer but `SLL`/`SRL` don't |
| [#26248](https://gitlab.haskell.org/ghc/ghc/-/issues/26248) | Correctness issue: sub-word shifts | Open (2025-07-30) | Correctness | `uncheckedShiftLInt8#` etc. give wrong results; addressed in part by (closed, unmerged) !14592 |
| [#26108](https://gitlab.haskell.org/ghc/ghc/-/issues/26108) | Add LLVM RISC-V Vector GHC Calling-Convention | Open (2025-06-09) | Feature gap | LLVM's `ghc` calling convention lacks vector-register config for RVV via the LLVM backend |
| [#26105](https://gitlab.haskell.org/ghc/ghc/-/issues/26105) | Store RISC-V extension information in Arch | Open (2025-06-08) | Feature gap | NCG doesn't track targeted/available ISA extensions |
| [#25966](https://gitlab.haskell.org/ghc/ghc/-/issues/25966) | Better sign-extension instruction selection for sub-words | Open (2025-04-16) | Codegen efficiency | Proposes using B-extension dedicated instructions instead of shift-pairs |
| [#25738](https://gitlab.haskell.org/ghc/ghc/-/issues/25738) | allocMoreStack probably deallocates too little/too much | Open (2025-02-09) | Correctness (suspected) | Analogous to a known AArch64 issue (#25733); partially fixed by (closed, unmerged) !13923 |
| [#25594](https://gitlab.haskell.org/ghc/ghc/-/issues/25594) | GHC 9.12+ build process segfaults building cabal-install | Open (2024-12-18) | Correctness | On emulated Alpine linux/riscv64 via QEMU/binfmt in Docker |
| [#25537](https://gitlab.haskell.org/ghc/ghc/-/issues/25537) | Implement set_initial_registers (libdw) | Open (2024-12-01) | Feature gap | RTS DWARF unwinder lacks a riscv64 implementation |
| [#25331](https://gitlab.haskell.org/ghc/ghc/-/issues/25331) | RISC-V vector extension support (SIMD) | Open (2024-10-03) | Feature gap | Umbrella ticket; tracked via open draft MR !13467 |
| [#25254](https://gitlab.haskell.org/ghc/ghc/-/issues/25254) | Setup CI for RISCV64 | Open (2024-09-14) | Infrastructure | Proposes CI coverage despite the nightly job already existing |
| [#24678](https://gitlab.haskell.org/ghc/ghc/-/issues/24678) | Relocation errors on LLVM/RISCV64 cross-builds | Open (2024-04-15) | Build failure | Suspected "far branch" relocation-range issue |
| [#23957](https://gitlab.haskell.org/ghc/ghc/-/issues/23957) | Segfault in RISC-V programs built by a registerised GHC | Open (2023-09-14) | Correctness | Reported across GHC 9.2.7-9.6.2, predates the NCG merge; current status against 9.12+ not re-tested in these findings |
| [#23519](https://gitlab.haskell.org/ghc/ghc/-/issues/23519) | RISC-V binary packages | Open (2023-06-14) | Distribution | Requests official riscv64 release tarballs |
| [#20519](https://gitlab.haskell.org/ghc/ghc/-/issues/20519) | Cross-compiled riscv64 binary fails to execute under qemu-user-riscv64 | Open (2021-10-15) | Correctness | Stage2 binaries from x64-to-riscv64 cross toolchain unusable under QEMU |
| [#19566](https://gitlab.haskell.org/ghc/ghc/-/issues/19566) | riscv64 target fails to build with LLVM-11 | Open (2021-03-19) | Build failure | LLVM 11's RISC-V backend doesn't support GHC's custom calling convention |
| [#18928](https://gitlab.haskell.org/ghc/ghc/-/issues/18928) | GHC build on risc-v (unregisterised) fails: undefined refs to `__atomic_exchange` | Open (2020-11-06) | Build failure | Missing libatomic symbols on Debian unstable/riscv |

**Closed / fixed (correctness bugs, highlighted separately):**

| ID | Title | Closed | Fix |
|---|---|---|---|
| [#27569](https://gitlab.haskell.org/ghc/ghc/-/issues/27569) | RISC-V linker bug in flushInstructionCacheRISCV64 | 2026-08-25 | `__builtin___clear_cache` pointer-arithmetic bug corrupting i-cache flush range |
| [#27306](https://gitlab.haskell.org/ghc/ghc/-/issues/27306) | RISC-V NCG: FP variables may be clobbered in a function call | 2026-06-15 | Fixed via !16164; violated RISC-V ELF psABI |
| [#27303](https://gitlab.haskell.org/ghc/ghc/-/issues/27303) | RISC-V NCG: truncate does not truncate | 2026-06-15 | Fixed via !16164 |
| [#27300](https://gitlab.haskell.org/ghc/ghc/-/issues/27300) | castFloatToWord32 can generate bad, signed Word32s | 2026-06-15 | Fixed via !16164, analogous to old x86_64 #16617 |
| [#25314](https://gitlab.haskell.org/ghc/ghc/-/issues/25314) | registerArch advertises vector register support riscv doesn't have (panic) | 2024-10-03 | `registerArch` wrongly claimed `Separate` (vector) register support |
| [#25313](https://gitlab.haskell.org/ghc/ghc/-/issues/25313) | riscv backend doesn't implement MO_F_MIN and MO_F_MAX primops | 2024-10-03 | Fixed via !13325 |
| [#25312](https://gitlab.haskell.org/ghc/ghc/-/issues/25312) | Vector support test uses `csrr` instruction, illegal under user qemu | 2024-10-03 | Privileged instruction not permitted in QEMU user-mode |
| [#25306](https://gitlab.haskell.org/ghc/ghc/-/issues/25306) | riscv64 cross build broken after SIMD patches | 2024-10-17 | SIMD/vector-register patches briefly broke the cross-compiler build post-NCG merge |
| [#20567](https://gitlab.haskell.org/ghc/ghc/-/issues/20567) | ghc-stage2 internal error on RiscV64 platform | 2021-11-06 | Internal compiler error under real qemu-system-riscv64 |
| [#19792](https://gitlab.haskell.org/ghc/ghc/-/issues/19792) | ghc-stage1 panic! riscv64 cross compiling | 2021-05-04 | `.hi`-file inconsistency ("Can't find interface-file declaration") |
| [#19119](https://gitlab.haskell.org/ghc/ghc/-/issues/19119) | 8.10.3 fails to build on riscv64 | 2021-10-12 | Sub-word atomic ops needed libatomic linkage |

Note: several MRs referenced above (!14592, !13923, !16164) show state "closed" rather than "merged" in the GitLab API. Per the source research, GHC's workflow sometimes lands work via cherry-pick/rebase and closes the original MR rather than using GitLab's merge button - "closed" is not necessarily "rejected" for these, but this could not be independently confirmed against `gitlab.haskell.org`'s blocked UI in this pass.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. Ben Gamari's original 2019 ticket (#16783) framed riscv64 support as desirable work needing a volunteer, not something contested. The NCG was accepted through GHC's normal merge-request review process.

**Technical blockers (currently open):**
- CI coverage remains non-gating and, per a contributor's own admission in mid-2026, not trusted to run tests reliably (Section 7); tracked by open issue #25254 and open draft MR !16176.
- No official binary release channel; tracked by open issue #23519 (opened 2023, still open).
- SIMD/vector (RVV) support is unmerged; tracked by open draft MR !13467 and umbrella issue #25331, with an acknowledged unresolved design tension (compile-time-fixed register widths vs. RVV's runtime-variable vector length).
- A steady stream of correctness bugs continued to surface through August 2026 (Section 11), consistent with upstream's "experimental" labeling in the 9.12.1 release notes.

**Organizational blockers:** GHC/Haskell is **not** a RISE (riseproject.dev) project. RISE's `language-runtimes-wg` charter explicitly scopes only Java (OpenJDK), Go, Python, JavaScript (V8/SpiderMonkey), and .NET - confirmed by checking the RISE blog, the `riseproject-dev` GitHub org (49 repos, none Haskell-related), the `language-runtimes-wg` and `riscv-runner` repos, the wheel_builder page, and the RISE Confluence wiki. No RISE funding, hardware, or CI-runner support flows to this port. Source: [riseproject-dev/language-runtimes-wg](https://github.com/riseproject-dev) (per research; direct repo link not independently re-fetched in this consolidation pass).

**Acceptance probability:** high for continued incremental hardening - multiple contributors (Well-Typed staff and independents) actively fixed correctness bugs through August 2026, and the core NCG is merged and shipping. Probability of near-term promotion to gating/Tier-1 CI status or an official binary release is not determinable from available data; both remain open, unresolved tracking issues as of this research date (2026-09-10).

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro (Ubuntu 26.04 "Resolute" ships `ghc` 9.10.3-4 for riscv64; openSUSE Tumbleweed also packages it [NEEDS VERIFICATION for the openSUSE claim specifically]). Upstream itself does not publish riscv64 binaries - issue [#23519](https://gitlab.haskell.org/ghc/ghc/-/issues/23519) remains open requesting this.
- GHC is a general-purpose compiler/language runtime, not an optimization-purpose project under the color-coding model's Step 2 test (it would still deliver its core value - compiling and running Haskell programs - without RISC-V-specific hot-path optimizations, via its LLVM backend or the unregisterised fallback). The optimization-purpose modifier does not apply; **Optimization level** is therefore omitted from the header.
- **Justification:** GHC's GitLab CI defines a riscv64 cross-compilation job (`nightly-x86_64-linux-deb13-riscv-cross_riscv64-linux-gnu-validate`) that both builds and runs the testsuite under QEMU emulation when triggered - confirmed directly from [`.gitlab/generate-ci/gen_ci.hs`](https://github.com/ghc/ghc/blob/master/.gitlab/generate-ci/gen_ci.hs) and `.gitlab/ci.sh`. This satisfies the color table's "build: yes, test: yes" row. However, the job is gated behind the `addValidateRule RiscV` mechanism (nightly schedule or an MR label) rather than running by default, and no upstream riscv64 binary release exists (open issue [#23519](https://gitlab.haskell.org/ghc/ghc/-/issues/23519)), which rules out green (green requires an upstream-published riscv64 artifact). With build=yes, test=yes, release=no (release provided by distro rather than upstream), the primary-grade table places GHC at **blue**.
- **Pending work that could change the grade:** open draft MR [!16176](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/16176) (run full testsuite for cross-compilers when label set) and open issue [#25254](https://gitlab.haskell.org/ghc/ghc/-/issues/25254) (Setup CI for RISCV64) could promote riscv64 to default/gating CI. Open issue [#23519](https://gitlab.haskell.org/ghc/ghc/-/issues/23519), if resolved with an official upstream binary release, would change `release_provider` to `upstream` and clear the remaining prerequisite for green. No RISE involvement exists to accelerate any of this (Section 12).

## 14. Investment Analysis

RISE has no involvement in GHC (Section 12), so no RISE-funded prior work needs to be excluded from sizing below; all listed gaps are entirely open.

### 14.1 Functional Enablement
- Close remaining open correctness/feature-gap issues on the NCG: #27733 (missing MO_S_Mul2), #26260/#26259/#26105 (register metadata/codegen consistency/extension tracking), #25537 (libdw `set_initial_registers` for riscv64), #25254-adjacent CI reliability work.
- Drive issue #23519 (official upstream riscv64 binary release) to resolution - currently the single biggest gap preventing a `release_provider: upstream` and a path to green.

### 14.2 Performance Optimization
- Land the RVV/SIMD draft (MR !13467) - resolve the compile-time-fixed-width vs. runtime-variable-vector-length design tension the author has already flagged.
- Implement B-extension sign-extension optimization (#25966) to close a known, open codegen-efficiency gap.
- No GHC-specific riscv64 performance benchmark data exists to quantify current overhead; this is itself a gap (Data not available: no nofib or equivalent riscv64 numbers found in this or prior research).

### 14.3 CI/CD Infrastructure
- Promote the riscv64 cross job from label-gated/nightly to the default gating validate pipeline (complete the work started in issue #25254 and draft MR !16176).
- Investigate native riscv64 hardware CI (current job is QEMU-only cross-compilation); GHC has no relationship with RISE's runner infrastructure and would need to establish one or source hardware independently.

### 14.4 Ecosystem Enablement
Data not available: no Hackage (GHC's package ecosystem) riscv64 coverage data was gathered in this research pass. Section 10 is omitted per instructions since no findings characterize Hackage's riscv64 coverage as a distinct enablement problem for this report.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Land official upstream riscv64 binary release (resolve #23519) | Data not available - no effort estimate found in sources | Well-Typed / GHC HQ | High |
| Functional | Close open NCG correctness/codegen-consistency issues (#27733, #26260, #26259, #26105) | Data not available | GHC contributors (Sven Tennie, community) | Medium |
| CI/CD | Promote riscv64 job to default gating pipeline (#25254, !16176) | Data not available | GHC HQ / Well-Typed | High |
| Performance | Merge RVV/SIMD vector support (!13467) | Data not available | Sven Tennie | Medium |
| Performance | B-extension sign-extension optimization (#25966) | Data not available | GHC contributors | Low |
| Infrastructure | Investigate native riscv64 hardware CI (currently QEMU-only) | Data not available | GHC HQ | Low |

No person-week estimates were found in any source consulted; effort sizing would require direct engagement with GHC HQ/Well-Typed or independent scoping, which was outside the scope of this research pass.

## 15. Updates

No updates yet - initial report dated 2026-09-10.

## 16. References

- [Issue #16783 "RISC-V support" (master tracking issue)](https://gitlab.haskell.org/ghc/ghc/-/issues/16783)
- [Issue #14903 "RISC-V port" (earliest exploratory ticket)](https://gitlab.haskell.org/ghc/ghc/-/issues/14903)
- [Issue #23179 "RISC-V Native Code Generator" (NCG tracking ticket)](https://gitlab.haskell.org/ghc/ghc/-/issues/23179)
- [MR !13105 "Add RISCV64 Native Code Generator (NCG) to master"](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/13105)
- [MR !4327 "Implement riscv64 LLVM backend"](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/4327)
- [MR !6460 "Correct load_load_barrier for risc-v"](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/6460)
- [MR !10714 "Hadrian: enable GHCi support on riscv64"](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/10714)
- [MR !13467 "Draft: RISC-V vector support (RVV)"](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/13467)
- [MR !13923 "RISC-V 64 NCG: Fix switch jump tables and non-local jumps"](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/13923)
- [MR !14592 "RV64: Fix missing truncation to MO_S_Shr"](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/14592)
- [MR !16164 "RISC-V NCG: Fix three issues on floating-point numbers"](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/16164)
- [MR !16176 "Draft: ci: run full testsuite for cross-compilers when label set"](https://gitlab.haskell.org/ghc/ghc/-/merge_requests/16176)
- [Issue #23519 "RISC-V binary packages"](https://gitlab.haskell.org/ghc/ghc/-/issues/23519)
- [Issue #25254 "Setup CI for RISCV64"](https://gitlab.haskell.org/ghc/ghc/-/issues/25254)
- [Issue #25331 "RISC-V vector extension support (SIMD)"](https://gitlab.haskell.org/ghc/ghc/-/issues/25331)
- [Issue #25537 "Implement set_initial_registers (libdw)"](https://gitlab.haskell.org/ghc/ghc/-/issues/25537)
- [Issue #25966 "RISC-V: Better sign-extension instruction selection for sub-words"](https://gitlab.haskell.org/ghc/ghc/-/issues/25966)
- [Issue #27300](https://gitlab.haskell.org/ghc/ghc/-/issues/27300), [#27303](https://gitlab.haskell.org/ghc/ghc/-/issues/27303), [#27306](https://gitlab.haskell.org/ghc/ghc/-/issues/27306), [#27569](https://gitlab.haskell.org/ghc/ghc/-/issues/27569), [#27733](https://gitlab.haskell.org/ghc/ghc/-/issues/27733)
- [GHC 9.12.1 release notes](https://downloads.haskell.org/~ghc/9.12.1/docs/users_guide/9.12.1-notes.html)
- [.gitlab/generate-ci/gen_ci.hs (via GitHub read-only mirror)](https://github.com/ghc/ghc/blob/master/.gitlab/generate-ci/gen_ci.hs)
- [compiler/GHC/CmmToAsm/RV64 (GitHub mirror)](https://github.com/ghc/ghc/tree/master/compiler/GHC/CmmToAsm/RV64)
- [rts/include/stg/MachRegs (GitHub mirror)](https://github.com/ghc/ghc/tree/master/rts/include/stg/MachRegs)
- [Ubuntu 26.04 "Resolute" package search: ghc](https://packages.ubuntu.com/search?keywords=ghc&suite=resolute&searchon=names&section=all)
- [skeuchel/riscv64-ghc-bindist (third-party bootstrap binaries)](https://github.com/skeuchel/riscv64-ghc-bindist)
- [felixonmars/archriscv-packages: haskell-ghc-lib-parser](https://github.com/felixonmars/archriscv-packages/tree/master/haskell-ghc-lib-parser)
- [NixOS wiki: RISC-V/GHC](https://wiki.nixos.org/wiki/RISC-V/GHC)
- [Well-Typed GHC activities report, September-November 2024](https://well-typed.com/blog/2024/12/ghc-activities-report-september-november-2024/)
- [GHC license](https://www.haskell.org/ghc/license.html)
- [RISE Project blog](https://riseproject.dev/blog/) (no Haskell/GHC content found)
- [Mail-archive: ghc-devs, RISC-V NCG performance thread](https://www.mail-archive.com/ghc-devs@haskell.org/msg21511.html)