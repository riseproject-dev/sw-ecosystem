---
title: .NET
parent: Project Reports
color: yellow
---

# .NET

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for .NET<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

.NET Runtime (`dotnet/runtime`) is the CoreCLR and Mono managed-execution runtime underlying the .NET platform: JIT/AOT compilers, garbage collector, base class libraries, and the NativeAOT ahead-of-time toolchain. It is governed as a **.NET Foundation** project under the **MIT license**, with copyright attributed to ".NET Foundation and Contributors." Microsoft is the corporate steward: it drives the roadmap, provides the majority of engineering staff, and operates the CI infrastructure (Azure DevOps `dnceng`) and container images (`mcr.microsoft.com/dotnet-buildtools/...`), while the .NET Foundation holds the neutral legal/IP wrapper (CLA at `cla.dotnetfoundation.org`).

There is no published top-down governance charter; support decisions are operationalized per-area through `docs/area-owners.md` (Lead/Owners mapped to GitHub teams) and pragmatic engineering philosophy documented in `docs/project/os-onboarding.md`, which favors "80% confidence" incremental validation over exhaustive testing before declaring OS/architecture support.

The RISC-V port is area-owned by **Samsung Electronics** (`@gbalykov`, lead for both `arch-riscv` and `os-tizen`; `@dotnet/samsung` GitHub team). The master CoreCLR tracking issue, [#84834](https://github.com/dotnet/runtime/issues/84834), carries the label `help wanted` and is pinned to milestone **"Future"** (no due date) - the project's own signal that RISC-V is a community/partner-driven, best-effort port rather than a Microsoft-committed release target. Neither Microsoft nor the .NET Foundation appear in RISE's Premier or General member lists (Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent as Premier; Akeana, Andes, Canonical, Microchip, ZTE and others as General).

Community culture toward the port has been broadly welcoming but resource-constrained: an early comment on #84834 (JakeSays, Apr 2023) pushed back on the size of the initially out-of-scope list (SIMD, crossgen2, full JIT optimizations); a Member (shushanhf, representing the LoongArch64 port) cautioned the RISC-V team not to destabilize shared cross-architecture JIT code; and the NativeAOT port ([#106223](https://github.com/dotnet/runtime/issues/106223)) stalled for roughly seven months (Sep 2024-Mar 2025) when the assigned reviewer (filipnavara) was reassigned to .NET 9 release work, before an independent contributor (am11) picked it back up.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-11-07 | Earliest RISC-V code in repo history: minimal Mono interpreter stubs (Bernhard Urban, Xamarin), migrated from `mono/mono`. Predates the CoreCLR effort. | Governance/history research |
| 2020-05-20 | Issue [#36748](https://github.com/dotnet/runtime/issues/36748) opened - original community request asking about .NET 5 RISC-V support | [#36748](https://github.com/dotnet/runtime/issues/36748) |
| 2020-07-30 | PR #40142 merged - build fixes and simple exception handling (pre-port infra) | PR merge-status research |
| 2022-08-04 | PR #73385 "Add initial riscv64 port" merged | PR merge-status research |
| 2023-02-22 to 2023-04-14 | Dong-Heon Jung (clamp03) lands foundational CoreCLR JIT/PAL/VM port PRs (#82379, #82380, #82381, #82382), based on the LoongArch64 port as a template | Deep-read of #84834 |
| 2023-04-03/06 | PRs #83714-#83716 "Port Mono for RISC-V 64 Arch" merged | PR merge-status research |
| 2023-04-14 | Issue [#84834](https://github.com/dotnet/runtime/issues/84834) opened - master CoreCLR JIT tracking issue | [#84834](https://github.com/dotnet/runtime/issues/84834) |
| 2023-04-25 | PR #85289 "[RISC-V] Add RISC-V CI" merged | PR merge-status research |
| 2023-09-13 | PR #90203 "Initial commit for libraries directory" merged, milestone **.NET 9.0** | PR merge-status research |
| 2024-08-10 | Issue [#106223](https://github.com/dotnet/runtime/issues/106223) opened - "RISC-V NativeAOT port" tracking issue | [#106223](https://github.com/dotnet/runtime/issues/106223) |
| ~Nov 2024 | .NET 9.0 GA - first release carrying experimental Linux riscv64 support | Timeline synthesis from PR milestone data |
| 2025-01-09 | PR #110688 "Add linux-riscv64 nativeaot runtime build" merged, milestone .NET 10.0 | PR merge-status research |
| 2025-02-27 | PR #112736 "Make linux-riscv nativeaot port robust" merged | PR merge-status research |
| 2025-11-10 | PR #121276 "Port coreclr interpreter to riscv64" merged, milestone .NET 11.0 | PR merge-status research |
| 2026-06-24 | Issue #106223 closed - `am11`: "Found one issue during the libs tests in AOT mode; reported here: [#129792](https://github.com/dotnet/runtime/issues/129792). Closing as done." | [#106223](https://github.com/dotnet/runtime/issues/106223) deep read |
| 2026-08-06 | Issue [#131926](https://github.com/dotnet/runtime/issues/131926) "RISC-V SIMD support" opened, unassigned, milestone 12.0.0 | [#131926](https://github.com/dotnet/runtime/issues/131926) |
| 2026-08-13 | PR #132229 "Fix RISC-V unwind scope calculations" merged, milestone .NET 11.0-rc1 (most recent merged milestone-confirmed PR) | PR merge-status research |
| 2026-08-31 | Microsoft engineer **jkotas**, on #36748: "we have no current plans to produce such [official Microsoft-built linux-riscv64] binaries" | [#36748](https://github.com/dotnet/runtime/issues/36748) deep read |
| 2026-09-01 | am11 (Member), on #36748: "The next bigger work item will be SIMD support [#131926](https://github.com/dotnet/runtime/issues/131926)" | [#36748](https://github.com/dotnet/runtime/issues/36748) deep read |
| 2026-09-07 | PR #133380 "Probe riscv64 and arm64 virtual memory address" opened - newest open PR touching riscv64 | PR merge-status research |

**Key contributors and organizations:**
- Dong-Heon Jung (clamp03) - authored the foundational CoreCLR JIT/PAL/VM port PRs (2023); company field on profile unaffiliated at time of contribution.
- @gbalykov, @dotnet/samsung team - **Samsung Electronics**; owns `arch-riscv` and `os-tizen`.
- t-mustafin, Mikhail Kurinnoi (@samsung.com emails) - **Samsung**; RISC-V debugger contributions and the GC/stackwalk crash investigation in [#105808](https://github.com/dotnet/runtime/issues/105808).
- am11 (Adeel Mujahid) - independent OSS contributor; NativeAOT port lead, ongoing CI/infra owner, and current de-facto community lead for RISC-V status questions as of 2026.
- filipnavara - Member; periodically blocking/unblocking on NativeAOT work due to competing .NET-release priorities; co-maintains the unofficial `filipnavara/dotnet-riscv` release fork.
- jakobbotsch - primary maintainer merging ongoing JIT codegen-quality/optimization PRs for RISC-V through 2026 (affiliation not stated in sources reviewed).
- Jan Kotas (jkotas@microsoft.com) - **Microsoft**; core architect, reviewed/co-authored RISC-V NativeAOT work, gave the official "no plans" statement on official binaries.
- Andy Ayers (andya@microsoft.com) - **Microsoft**; JIT lead, RISC-V JIT fixes.
- shushanhf, LuckyXu-HF - **Loongson**; owners of the parallel `arch-loongarch64` port that RISC-V's port was modeled on and shares code with.
- Bernhard Urban (lewurm) - **Xamarin** (later acquired by Microsoft); authored the original 2018 Mono RISC-V interpreter stub.

**Is it fully upstream?** Yes. Every substantive RISC-V change lives in `dotnet/runtime` proper, not a fork. A merge-status verification pass against ~320 riscv64/RISC-V-titled PRs found **2 open, 28 closed without merging, and approximately 290 merged** - the closed-unmerged items are almost entirely superseded work-in-progress PRs replaced by later, better versions (e.g. #113678 superseded by #113999; #112917 superseded by #112978), not rejected contributions.

## 3. Upstream Support Tier

`dotnet/runtime` does not publish a formal Tier 1/2/3 support policy (unlike Rust or LLVM). Support is governed pragmatically via `docs/project/os-onboarding.md`, which states support is declared "for all supported .NET releases" once validated in `main`, favoring incremental "80% confidence" pragmatism.

Concrete evidence of RISC-V's tier:
- CI builds riscv64 but does not execute the test suite on riscv64 (see Section 7) - not release-gating in the same sense as amd64/arm64.
- Tracking issue [#84834](https://github.com/dotnet/runtime/issues/84834) is labeled `help wanted` and pinned to milestone **"Future"** (no committed date).
- Microsoft engineer jkotas gave the definitive statement on official support, quoted in full: *"If by 'official' you mean Linux/riscv64 binaries built and supported by the Microsoft .NET team, we have no current plans to produce such binaries."* ([source](https://github.com/dotnet/runtime/issues/36748))

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes, every PR | yes, every PR | yes, but cross-compiled and path-filtered/rolling-only |
| CI runs tests | yes (Helix queues) | yes (Helix queues) | no (no riscv64 Helix test queues found in any helix config file) |
| Official Microsoft binaries | yes | yes | no - explicitly ruled out by Microsoft engineering (jkotas, above) |
| NativeAOT | complete | complete | complete (port closed as functionally complete, 2026-06-24) |
| Managed SIMD API surface | full (`System.Runtime.Intrinsics.X86`) | full (`System.Runtime.Intrinsics.Arm`) | absent |
| Support tier designation | officially supported release target | officially supported release target | community/best-effort (milestone "Future", label "help wanted") |

## 4. Technical Architecture and RISC-V-Specific Subsystems

RISC-V (RV64GC) has substantial, actively-maintained architecture-specific code across nearly every runtime subsystem. This is not a stub port.

**CoreCLR JIT backend** (`src/coreclr/jit/`):

| File | Lines | Purpose |
|---|---|---|
| `codegenriscv64.cpp` | 6,640 | Code generator (largest RISC-V file in CoreCLR) |
| `emitriscv64.cpp` | 5,715 | Instruction encoder/emitter |
| `unwindriscv64.cpp` | 2,103 | Unwind-info generation |
| `lowerriscv64.cpp` | 1,287 | IR lowering |
| `lsrariscv64.cpp` | 1,244 | Linear-scan register allocator |
| `emitriscv64.h` | 516 | Emitter declarations |
| `targetriscv64.h` | 282 | ABI/register/target definitions |
| `instrsriscv64.h` | 342 | Instruction table (RV64I/M/A/F/D + Zba/Zbb/Zbs/Zicond) |

**ISA extensions supported:** RV64GC base (I/M/A/F/D/C) plus **Zba, Zbb, Zbs, Zicond** bit-manipulation extensions, gated by `InstructionSet_Zba/Zbb/Zbs/Zicond` in `corinfoinstructionset.h` and detected at runtime via the Linux `riscv_hwprobe` syscall (`src/native/minipal/cpufeatures.c`, 848 lines).

**Vector (RVV) support is explicitly absent.** `emitriscv64.cpp` contains 32 `NYI_RISCV64(...)` stub calls covering all SIMD intrinsic codegen paths (`genSIMDIntrinsic` and its variants: Init, InitN, UnOp, Widen, Narrow, BinOp, RelOp, `getOpForSIMDIntrinsic`, `genGetSimdInsOpt`), each throwing "unimplemented on RISCV64 yet." There is no `hwintrinsiclistriscv64.h` and no `System.Runtime.Intrinsics.RiscV` managed namespace - unlike Arm64's `AdvSimd` or x86's `Sse`/`Avx` classes. Issue [#131926](https://github.com/dotnet/runtime/issues/131926) ("RISC-V SIMD support") is open, unassigned, milestone 12.0.0, and was explicitly named "the next bigger work item" by the lead community maintainer (am11, Sep 1 2026 comment on [#36748](https://github.com/dotnet/runtime/issues/36748)).

**Other subsystems present:**
- VM/execution engine (`src/coreclr/vm/riscv64/`): `stubs.cpp` (1,505 lines, JIT/PInvoke stubs, no NYI markers found), `singlestepper.cpp` (473 lines, debugger single-step), `virtualcallstubcpu.hpp` (542 lines).
- PAL/exception handling (`src/coreclr/pal/`): `context2.S`, `exceptionhelper.S`, `dispatchexceptionwrapper.S`, `asmconstants.h`.
- NativeAOT (`src/coreclr/nativeaot/`): `unixasmmacrosriscv64.inc` plus ~24 shared multi-arch files with `TARGET_RISCV64` branches.
- GC write barriers (`src/coreclr/runtime/riscv64/WriteBarriers.S`, 342 lines) and inline TLS (`InlineTls.inc`, 72 lines).
- Unwinder (`src/coreclr/unwinder/riscv64/unwinder.cpp`, 874 lines).
- Debugger (`src/coreclr/debug/`): register-access and instruction-walker support across `di/`, `ee/`, `daccess/riscv64/`.
- NativeAOT/R2R/ILCompiler C# tooling (`src/coreclr/tools/.../Target_RiscV64/`): emitter, register map, jump-stub, R2R helper node implementations.
- cDAC diagnostics contracts (managed, `Contracts/StackWalk/Context/RISCV64/RISCV64Unwinder.cs`, 742 lines).
- **Mono runtime** (`src/mono/`) has an entirely separate, independent riscv64 backend: `mini/mini-riscv.c` (5,807 lines, the largest single RISC-V file in the whole repository), `arch/riscv/riscv-codegen.h` (852 lines). Contains 92 combined `TODO`/`g_assert_not_reached`/`NOT_IMPLEMENTED` markers - actively developed but with known gaps.
- Vendored third-party RVV code exists only in `src/native/external/zlib-ng/arch/riscv/` (native C, build-time zlib-ng dependency, unrelated to the managed JIT) and is **disabled by default** (`WITH_RVV OFF` in `zlib-ng.cmake`, pending kernel RVV-detection maturity per an in-tree comment).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Scalar JIT codegen | full | full | full (RV64GC + Zba/Zbb/Zbs/Zicond) |
| Managed SIMD hw-intrinsics API | `Sse`/`Avx` classes | `AdvSimd` class | none - no `RiscV` namespace |
| GC write barriers | hand-tuned asm | hand-tuned asm | present (`WriteBarriers.S`) |
| NativeAOT | complete | complete | complete (port closed 2026-06-24) |
| Debugger support | complete | complete | present across di/ee/daccess |
| Independent Mono JIT backend | complete | complete | present, 92 TODO/NOT_IMPLEMENTED markers |

## 5. Build System, Cross-Compilation, and Toolchain

The official riscv64 CI leg (`eng/pipelines/common/templates/pipeline-with-resources.yml`) runs in an Azure-hosted x64 container using image `mcr.microsoft.com/dotnet-buildtools/prereqs:azurelinux-3.0-net11.0-cross-riscv64`, with `ROOTFS_DIR: /crossrootfs/riscv64` - an Azure Linux 3.0 cross-toolchain, cross-compiling for riscv64 rather than building natively.

Cross-rootfs generation is handled by `eng/common/cross/build-rootfs.sh` (`__QEMUArch=riscv64`, Alpine 3.22 pinned for riscv64 kernel headers). Native/managed build scripts (`eng/native/build-commons.sh`, `eng/build.sh`, `eng/common/native/init-os-and-arch.sh`) accept riscv64 as a valid `--arch` target.

**Documented build sequencing issue and fix** ([#97791](https://github.com/dotnet/runtime/issues/97791), opened 2024-01-31 by ashaurtaev): the naive single-command build failed with `NETSDK1084: There is no application host available for the specified RuntimeIdentifier 'linux-riscv64'`. Root-caused by am11 (2024-03-04) as a variant of a prior issue (#58109): "clr cross tools depend on live apphost and host managed depends on something from sfxproj." Fix required a specific multi-stage sequence: build `host.native` first, then `clr+libs` with the test subset, then `packs`, then `host` (or the simpler 3-command alternative confirmed by gbalykov: build core, then `libs.tests`, then coreclr tests via `src/tests/build.sh -Release -cross -riscv64`). The immediate blocker was fixed via stopgap PRs (#99354, #100905, #106201); a deeper cleanup (integrating `eng/targetingpacks.targets`) remained unstarted as of the last referenced activity (2026-04-17).

**Other known build failures:** "No usable version of clang found" ([#100215](https://github.com/dotnet/runtime/issues/100215), closed), `emitriscv64.cpp` signed/unsigned comparison build breaks ([#117550](https://github.com/dotnet/runtime/issues/117550), [#117586](https://github.com/dotnet/runtime/issues/117586), [#122553](https://github.com/dotnet/runtime/issues/122553), all closed within days), relocation-truncation link error against `ThrowExceptionHelper` ([#97337](https://github.com/dotnet/runtime/issues/97337), closed), crossgen2/ILC exit-code-139 crash on riscv64 ([#130145](https://github.com/dotnet/runtime/issues/130145), closed), `linux-musl-riscv64` build breakage (fixed by PR #130966, merged 2026-07-19).

**Native (non-cross) builds:** per filipnavara's Nov 2025 comment on [#36748](https://github.com/dotnet/runtime/issues/36748), native riscv64 compilation is possible with a bootstrap compiler and is used for local debugging, but is "impractical to do purely native builds" as an officially supported path even for x64 (Microsoft cross-compiles all its official pipelines for uniformity).

QEMU is used for community cross-build+execute testing (am11's `am11/CrossRepoCITesting` GitHub Actions pipeline, referenced in the #106223 thread), and separately for the CodeGen BringUp test runs cited in #84834 (both QEMU and StarFive VisionFive2 hardware).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 / arm64 | riscv64 |
|---|---|---|
| Scalar JIT | yes | yes |
| Bit-manipulation intrinsics | yes (BMI1/2, ARM equivalents) | yes (Zba/Zbb/Zbs/Zicond) |
| SIMD/vector hw intrinsics | yes (`Sse`/`Avx`/`AdvSimd`) | no - [#131926](https://github.com/dotnet/runtime/issues/131926), open |
| NativeAOT | yes | yes, complete |
| Runtime Async | yes | not yet enabled ([#124934](https://github.com/dotnet/runtime/issues/124934), open); Crossgen2 crashes compiling async methods on RISCV/LOONGARCH ([#126234](https://github.com/dotnet/runtime/issues/126234), open, riscv64-specific assertions were commented out rather than fixed in PR #125406) |
| W^X (WriteXorExecute) hardening | yes | disabled pending full support ([#103465](https://github.com/dotnet/runtime/issues/103465), open, milestone Future) |
| FP struct interop marshaling | correct at all sizes | silently mismatches native ABI for structs >16 bytes ([#107386](https://github.com/dotnet/runtime/issues/107386), open, milestone Future; proposal is to throw rather than silently corrupt) |
| Memory barriers in NativeAOT R2R asm helpers | present | missing ([#106219](https://github.com/dotnet/runtime/issues/106219), open) - risk of data races in multithreaded NativeAOT riscv64 apps |
| Official binaries | yes | no |

**Functional gaps:** no managed SIMD API surface for riscv64 (`Vector128`/`Vector256` types exist in the API but lack RVV-backed codegen and throw NYI in the JIT); Crossgen2 crash on async-method compilation for riscv64; silent FP-struct-interop corruption for structs above 16 bytes.

**Performance gaps:** every SIMD-eligible operation on riscv64 falls back to scalar codegen since RVV is entirely unimplemented in RyuJIT - the magnitude of this delta was not benchmarked in any source reviewed (see Section 11).

**Security hardening gaps:** W^X (write-xor-execute) is disabled on riscv64 pending full platform support ([#103465](https://github.com/dotnet/runtime/issues/103465)) - a meaningful gap versus amd64/arm64 for JIT-compiled code pages.

**NaN/floating-point semantics:** RISC-V hardware normalizes NaN outputs rather than propagating the input NaN, unlike x64/ARM64 (which follow the IEEE754-recommended behavior). This broke NaN-boxing techniques used by WebKit/WASM/SIMD algorithms and was fixed via [#119897](https://github.com/dotnet/runtime/issues/119897) (opened 2025-09-19, closed 2026-07-30) by aligning riscv64 codegen with other platforms in `Min`/`Max` codegen (PR #118589). The fix note explicitly states this "will represent a perf penalty in some cases," mitigated for perf-sensitive code via the `MinNative`/`MaxNative` APIs.

## 7. CI/CD Infrastructure

`dotnet/runtime` uses **Azure Pipelines**, not GitHub Actions, for its build/test CI. A full check of all 30 files in `.github/workflows/` found zero riscv64 references (one unrelated npm `package-lock.json` name coincidence). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository.

The riscv64 job is defined via `eng/pipelines/runtime.yml` referencing the shared `linux_riscv64` entry in `eng/pipelines/common/platform-matrix.yml`, which sets `crossBuild: true` and uses the container defined in `eng/pipelines/common/templates/pipeline-with-resources.yml` (`mcr.microsoft.com/dotnet-buildtools/prereqs:azurelinux-3.0-net11.0-cross-riscv64`, `ROOTFS_DIR: /crossrootfs/riscv64`) - an x64-hosted cross-compilation container, not native riscv64 hardware.

This leg is **gated on path filters**: it runs only when coreclr or installer paths changed in a PR, or on the rolling/scheduled build (`schedules: cron '0 8,20 * * *' UTC on main`) - not on every PR unconditionally. It builds `coreclr+libs+host+packs+tools.cdac` with `--bootstrap` but has **no dedicated Helix test-queue submission**: a targeted grep of `eng/pipelines/helix-platforms.yml`, `eng/pipelines/coreclr/templates/helix-queues-setup.yml`, `eng/pipelines/libraries/helix-queues-setup.yml`, and `eng/pipelines/runtime-extra-platforms.yml` found zero riscv64 matches in any of them. This confirms the riscv64 CI leg **builds but does not execute the test suite**.

RISE runners are not referenced anywhere in `dotnet/runtime`'s own CI configuration. Separately, RISE's own `riseproject-dev/riscv-runner` infrastructure consumes a .NET-8-built third-party GitHub Actions Runner binary inside its Ubuntu/riscv64 CI runner image - this is RISE *using* a tool built with .NET, not RISE providing CI infrastructure *for* the dotnet/runtime port.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI platform | Azure Pipelines | Azure Pipelines | Azure Pipelines |
| Runs on | every PR | every PR | path-filtered / rolling build only |
| Build | yes | yes | yes (cross-compiled, `crossBuild: true`) |
| Test execution | yes (Helix queues) | yes (Helix queues, some QEMU legs) | no (no riscv64 Helix queue entries found) |
| Hardware | native/VM | native/VM | x64 host, cross-compile container only |

## 8. Distribution and Release Status

**No official Microsoft riscv64 binaries exist or are planned.** Confirmed via jkotas's statement (Section 3), via the official `dotnet.microsoft.com` downloads page (Linux options limited to x64, Arm64, Arm32, plus Alpine variants - no riscv64), and via Ubuntu 26.04 (resolute) package search: `dotnet-runtime-10.0`, `dotnet-sdk-10.0`, `dotnet-host`, `dotnet-hostfxr-10.0`, `dotnet10` and related packages (16 total in the `dotnet` family) list only amd64, arm64, ppc64el, s390x - **no riscv64**.

**Community-maintained unofficial builds:**
- [filipnavara/dotnet-riscv](https://github.com/filipnavara/dotnet-riscv) - maintained by am11 and filipnavara (both `dotnet/runtime` Members); announced a community 10.0 GA riscv64 + linux-musl-riscv64 release (2025-11-17), using `--branding rtm` to strip preview-warning slugs from the version string so it presents as a normal release.
- [dkurt/dotnet_riscv](https://github.com/dkurt/dotnet_riscv) - SDK 8.0/9.0 riscv64 releases.
- `liberodark/dotnet_riscv` - third-party project targeting nixpkgs support [NEEDS VERIFICATION - repository URL not independently confirmed].

**What a user must do today** to get a working .NET riscv64 binary: either build from source using the documented cross-compilation toolchain (Section 5), or download an unofficial community build from one of the above forks - none of which carry Microsoft servicing, security-patch, or support guarantees.

**PyPI / NuGet / npm / Maven / OCI:** .NET is not a Python package; a PyPI check against name `-net` and the RISE GitLab wheel-builder mirror both returned HTTP 404, confirming (as expected) that no such artifact scheme applies to this project. No data was gathered on NuGet-package-level riscv64 native-dependency coverage; see Section 10 for why that ecosystem question is out of scope for this report.

## 9. Dependencies

`dotnet/runtime`'s own dependency manifest (`eng/Version.Details.xml`, 104 entries) is almost entirely NuGet build-tooling (Arcade, Roslyn, NuGet client, XHarness) with no JIT/SIMD/crypto/compression/allocator relevance. The dependencies that matter for this assessment are vendored native sources under `src/native/external/` plus one pinned toolchain (LLVM).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| OpenSSL | Crypto (`System.Security.Cryptography.Native`, dynamic link to libssl/libcrypto) | Ubuntu 26.04 riscv64 packages available (`libssl3t64`, post time_t64 rename); RV64 ASM AES/GCM via Zbb/Zbc, Zvk vector-crypto merged upstream | CI covers riscv64 via cross toolchain; `test_lhash` occasionally flaky on riscv64 CI ([openssl#30880](https://github.com/openssl/openssl/issues/30880), open) | Shipped in 3.x/4.0 series, distro-packaged | musl riscv extension-detection bug ([openssl#28118](https://github.com/openssl/openssl/issues/28118), open); see `project-reports/openssl.md` |
| zlib-ng | Compression, vendored, compiled into `System.IO.Compression.Native` | Vendored-source build; RVV + Zbc CRC32 optimizations merged upstream but `WITH_RVV` is set `OFF` by default in `zlib-ng.cmake` pending kernel RVV-detection maturity | Prior riscv64 CI breakages (unaligned-access, Zbc detection, undeclared `crc32_riscv64_zbc`) closed | Shipping since 2023 | No open riscv64-blocking issues found; see `project-reports/zlib-ng.md` |
| zstd | Compression, vendored | Ubuntu 26.04 riscv64 packages available (`libzstd1`, `libzstd-dev`); historical atomic-linking failure closed | No native riscv64 CI runner (CI on `ubuntu-24.04` x86-64 host only, per its own status report) | Distro packages available | Open: RVV support requested for XXH3 hashing ([zstd#4471](https://github.com/facebook/zstd/issues/4471)); riscv64 unaligned-access optimization ([zstd#4546](https://github.com/facebook/zstd/issues/4546)) - perf gaps, not correctness; see `project-reports/zstd.md` |
| brotli | Compression, vendored | Ubuntu 26.04 riscv64 packages available; base port merged 2018 | No dedicated upstream riscv64 CI - "untested, unofficially-supported" per upstream tier assessment | Distro packages ship riscv64 builds | RVV optimization PRs stalled with no maintainer engagement (single-maintainer bandwidth); see `project-reports/brotli.md` |
| LLVM (`dotnet/llvm-project` fork, v23) | `Microsoft.NETCore.Runtime.JIT.Tools` (SuperPMI/altjit) and Mono's optional LLVM AOT/JIT backend | Ubuntu 26.04 riscv64 packages available (`llvm-18`, `llvm-19`, `clang`); riscv64 is a mainline, actively-developed LLVM target | Upstream riscv64 backend has active CI/buildbots but open RVV correctness issues (loop-carried WAR hazard on RVV registers, [llvm#221163](https://github.com/llvm/llvm-project/issues/221163), open; EVL tail-folding, [llvm#123069](https://github.com/llvm/llvm-project/issues/123069), open) | LLVM release binaries and distro packages support riscv64 codegen | LLVM is not the primary .NET JIT; RyuJIT's own SIMD/RVV work ([#131926](https://github.com/dotnet/runtime/issues/131926)) is tracked separately. No status report in `project-reports/` for LLVM itself. |
| libunwind (+ vendored `llvm-libunwind`) | Stack unwinding / exception-handling / crash diagnostics | Ubuntu 26.04 riscv64 packages available (`libunwind8`); riscv64 port accepted upstream, but **CMake build support for riscv64 is absent** ([libunwind#765](https://github.com/libunwind/libunwind/issues/765), open since June 2024, no PR filed) - mitigated by .NET vendoring `llvm-libunwind` instead, which does have riscv64 CMake support | `Ltest-cxx-exceptions` fails on Ubuntu 20.04-riscv64 ([libunwind#519](https://github.com/libunwind/libunwind/issues/519), open) | Distro packages available, version lag on Ubuntu | CMake riscv64 gap is the one structural mismatch worth flagging against .NET's CMake-based native build; see `project-reports/libunwind.md` |
| Memory allocator | - | Not applicable - no jemalloc/mimalloc vendored; GC/allocation is self-contained in CoreCLR/Mono | - | - | N/A |
| SIMD/Numerics (RyuJIT intrinsics) | Not a third-party dependency - developed in-repo | - | - | - | Tracked entirely in-repo: see Section 4 and 6 |

**Deep dive - OpenSSL:** the most architecturally significant dependency given its direct linkage into every TLS/hashing/X.509 code path. Upstream RISC-V vector-crypto (Zvk) and Zbb/Zbc-accelerated AES/GCM paths are merged and treated as near first-class by the OpenSSL project; the primary open item is a musl-specific extension-detection bug, not a correctness or availability blocker for the glibc-based Ubuntu builds .NET's own CI targets.

**Deep dive - LLVM:** relevant only for `JIT.Tools`/altjit diffing and Mono's optional LLVM AOT backend, not RyuJIT itself. riscv64 is a fully mainline LLVM target with buildbot coverage, but open RVV-codegen correctness issues (loop-carried hazards, tail-folding) mean LLVM's own vector codegen is not yet a drop-in solution even if .NET wanted to lean on it for RVV support - RyuJIT's SIMD gap (Section 4) has to be closed independently in-repo.

The compression stack (zlib-ng, zstd, brotli) is in the best shape of any dependency category: all three build from vendored source on riscv64, all are separately distro-packaged, and the only open items are RVV performance-optimization requests, not correctness blockers. **None of these dependencies are the bottleneck for .NET-on-riscv64** - the gating factor is RyuJIT's own lack of RVV/SIMD codegen (Section 4/6).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [131926](https://github.com/dotnet/runtime/issues/131926) | RISC-V SIMD support | Open (2026-08-06) | High - functional/perf gap | Unassigned, milestone 12.0.0; explicitly called "the next bigger work item" by am11 |
| [103465](https://github.com/dotnet/runtime/issues/103465) | Re-enable WriteXorExecute on riscv64 | Open (2024-06-14) | High - security hardening | Milestone "Future", disabled since PR #103408 |
| [106219](https://github.com/dotnet/runtime/issues/106219) | Add memory barriers to native AOT asm helpers (LoongArch64/RISC-V) | Open (2024-08-10) | High - correctness (race risk) | ARM/ARM64 already fixed (PR #106004); riscv64 unassigned |
| [126234](https://github.com/dotnet/runtime/issues/126234) | Crossgen2 crashes compiling async methods on RISCV/LOONGARCH | Open (2026-03-28) | Medium-High - correctness | riscv64 assertions commented out, not fixed, in PR #125406 |
| [107386](https://github.com/dotnet/runtime/issues/107386) | FP structs larger than 16 bytes in interop | Open (2024-09-05) | Medium - correctness (silent ABI mismatch) | Milestone "Future"; proposal is to throw rather than silently corrupt |
| [105686](https://github.com/dotnet/runtime/issues/105686) | QEMU: `/proc/pid/stat` returns strange values | Open (2024-07-30) | Low - QEMU-only test artifact | Breaks `TestMaxWorkingSet`/`TestMinWorkingSet` under emulation only |
| [124934](https://github.com/dotnet/runtime/issues/124934) | Enable Runtime Async on RISC-V | Open (2026-02-27) | Medium - feature gap | - |
| [115296](https://github.com/dotnet/runtime/issues/115296) | Need to configure target RISC-V extension for coreclr build | Open (2025-05-05) | Low - build config | - |
| [97791](https://github.com/dotnet/runtime/issues/97791) | Failed to build tests for libs on Riscv64 | Open (2024-01-31) | Medium - build/test infra | Immediate blocker fixed via stopgap PRs; deeper `targetingpacks.targets` cleanup unstarted |
| [96117](https://github.com/dotnet/runtime/issues/96117) | Mono RISC-V porting progress tracking | Open (2023-12-18) | Tracking issue | Lower activity (4 comments) than CoreCLR/NativeAOT trackers |
| [84834](https://github.com/dotnet/runtime/issues/84834) | CoreCLR RISC-V architecture port | Open (2023-04-14) | Tracking issue | Parent issue for most items above |
| [119897](https://github.com/dotnet/runtime/issues/119897) | NaN propagation should occur where feasible | **Closed 2026-07-30** | Correctness (fixed) | Root cause: RISC-V hardware NaN-normalizes vs. IEEE754-propagate on x64/ARM64; perf penalty noted, mitigated via `MinNative`/`MaxNative` |
| [105808](https://github.com/dotnet/runtime/issues/105808) | GC crash on `DiagnosticSourceTest.AllSubscriberStress` | **Closed 2024-11-15** | Correctness (fixed) | Root cause: missing A0 register update in RISC-V `Hijack::UpdateRegDisplay()` relative to ARM64; intermittent GC/stackwalk race on VisionFive2 hardware |
| [106223](https://github.com/dotnet/runtime/issues/106223) | RISC-V NativeAOT port | **Closed 2026-06-24** | Tracking issue (completed) | 201 comments over ~22 months; one residual issue (#129792) spun off rather than blocking closure |

**Correctness bugs specifically:** #106219 (missing memory barriers, race risk), #126234 (Crossgen2 crash), #107386 (silent FP-struct ABI mismatch), and the now-fixed #119897 (NaN semantics) and #105808 (GC/stackwalk register-display bug) represent the class of subtle EH/GC/ABI bugs characteristic of a runtime port still stabilizing rather than one that has been in production for years.

## 12. Objections and Upstream Blockers

**Organizational/business blocker (primary):** Microsoft has explicitly stated it has no plans to build or support official Linux/riscv64 binaries (jkotas, [#36748](https://github.com/dotnet/runtime/issues/36748), 2026-08-31). This is a business decision, not a technical one - the underlying port is functionally advanced. It caps the release-provider ceiling at "third-party" regardless of how complete the JIT port becomes.

**Technical blockers:**
- SIMD/RVV codegen entirely unimplemented in RyuJIT (Section 4), unassigned as of the most recent research (issue #131926).
- W^X hardening disabled on riscv64 pending full support ([#103465](https://github.com/dotnet/runtime/issues/103465)).
- `libunwind`'s own CMake build support for riscv64 is absent upstream ([libunwind#765](https://github.com/libunwind/libunwind/issues/765), open since June 2024) - a structural mismatch against .NET's CMake-based native build, mitigated today by vendoring `llvm-libunwind` instead.

**Organizational/friction blockers:**
- Cross-architecture code-conflict risk flagged early by a LoongArch64 area owner (shushanhf) cautioning the RISC-V team not to destabilize shared JIT code paths.
- A multi-month contributor-availability stall (Sep 2024-Mar 2025) on the NativeAOT port when the assigned Member (filipnavara) was reassigned to .NET 9 release work - resolved when an independent contributor (am11) picked the remaining work back up rather than through any structural fix.
- No committed owner/assignee currently on the SIMD work item (#131926) - a resourcing gap, not a technical one.

**RISE-side status:** Neither Microsoft nor the .NET Foundation are RISE members. RISE has not funded or produced a dedicated .NET repository, blog post, or wheel-builder entry. .NET is listed as in-scope for RISE's Language Runtimes working group, with a project report queued but (until this one) unwritten, and a cross-org tracking issue exists at `riseproject-dev/language-runtimes-wg#4` ("Port .NET Runtime to RISC-V"), referenced by a contributor (luhenry) on 2026-06-19 directly inside the upstream tracking issue #84834. No RFP, grant, or funded-work announcement referencing .NET was found in RISE's blog search results or GitHub org search.

**Acceptance probability:** Technical acceptance of further RISC-V contributions is high - the port has nearly 290 merged PRs, an active corporate champion (Samsung), continuous Microsoft-engineer review/co-authorship, and a completed NativeAOT track. Acceptance of an *official Microsoft-shipped riscv64 binary* is explicitly ruled out for the foreseeable future; the durable distribution path for riscv64 users is the community-maintained `filipnavara/dotnet-riscv` fork, not upstream Microsoft releases.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** third-party
- Not an optimization-purpose project (general-purpose managed runtime - the test "would it still deliver its value with only generic scalar C and no architecture-specific optimizations" is yes, since .NET's value proposition is running managed C#/.NET code, not SIMD throughput). Optimization gap: N/A.
- **Justification:** The official Azure Pipelines CI builds riscv64 (cross-compiled, path-filtered/rolling-only leg using the `mcr.microsoft.com/dotnet-buildtools/prereqs:azurelinux-3.0-net11.0-cross-riscv64` container) but does not execute the test suite on riscv64 - no riscv64 Helix test-queue entries exist anywhere in `eng/pipelines/helix-platforms.yml`, `eng/pipelines/coreclr/templates/helix-queues-setup.yml`, `eng/pipelines/libraries/helix-queues-setup.yml`, or `eng/pipelines/runtime-extra-platforms.yml`. This is the textbook build-only-CI case: CI builds riscv64 (build step present) but test pass/fail is never established in CI. Microsoft has also explicitly ruled out producing an official riscv64 artifact ([jkotas, #36748](https://github.com/dotnet/runtime/issues/36748)), so the only consumable releases come from a community third party (`filipnavara/dotnet-riscv`, maintained by two `dotnet/runtime` Members but not an upstream-sanctioned channel).
- **Pending work that could change the grade:** landing riscv64 Helix test queues into CI (would move CI evidence from build-only toward tested, a precondition for blue); RVV/SIMD codegen in RyuJIT ([#131926](https://github.com/dotnet/runtime/issues/131926), open, unassigned - not grade-determining since this project is not optimization-purpose, but material to the "Feature Coverage" gap); resolution of the RISE-side `riseproject-dev/language-runtimes-wg#4` tracking effort could, if it results in funded CI/test-infrastructure work, shift the CI-test-execution evidence that currently caps this at yellow.

## 14. Investment Analysis

RISE has not funded any concrete .NET RISC-V engineering to date. Its only ties are: (a) using a .NET-8-built third-party GitHub Actions Runner inside its own `riscv-runner` CI image, and (b) listing .NET as in-scope for the Language Runtimes working group with a report queued (this document) and a cross-org tracking issue (`riseproject-dev/language-runtimes-wg#4`) opened/referenced 2026-06-19 with no visible deliverables yet. No prior RISE-funded work needs to be subtracted from the sizing below.

### 14.1 Functional Enablement

- Land riscv64 Helix test queues in CI so the test suite actually executes on riscv64 (currently build-only) - the single highest-leverage CI change, since it is a precondition for any grade improvement past yellow.
- Fix memory barriers in NativeAOT R2R asm helpers ([#106219](https://github.com/dotnet/runtime/issues/106219)) - correctness/race fix, small and well-scoped (ARM64's equivalent fix, PR #106004, is a direct template).
- Fix Crossgen2 crash on async-method compilation for riscv64 ([#126234](https://github.com/dotnet/runtime/issues/126234)) - riscv64-specific assertions were commented out rather than fixed in PR #125406, so the underlying work is not yet started.
- Resolve FP-struct interop marshaling for structs >16 bytes ([#107386](https://github.com/dotnet/runtime/issues/107386)) - either implement full ABI support or land the proposed throw-instead-of-corrupt safety fix.
- Re-enable W^X on riscv64 ([#103465](https://github.com/dotnet/runtime/issues/103465)) - security-hardening parity with amd64/arm64.

### 14.2 Performance Optimization

- Implement RVV-backed SIMD codegen in RyuJIT ([#131926](https://github.com/dotnet/runtime/issues/131926)) - the single largest engineering item identified in any source, spanning JIT lowering, code generation, and the managed `System.Runtime.Intrinsics.RiscV` API surface that does not yet exist. No effort estimate was found in any source reviewed; the issue is unassigned with no design timeline published.
- Zba/Zbb/Zbs/Zicond bit-manipulation support is already complete and runtime-detected - no further investment needed there.

### 14.3 CI/CD Infrastructure

- Add riscv64 Helix test queues (the change that would move CI evidence from "build-only" to "tests execute"), removing the current gap versus amd64/arm64's full Helix coverage.
- Remove or relax the path-filter gating so the riscv64 leg is exercised more consistently rather than only on coreclr/installer-path changes or the rolling build.
- Evaluate native riscv64 CI runners (currently cross-compile-only); no evidence any such native runner is provided by RISE for this project today, so this would be new infrastructure investment, not a RISE handoff.

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Land riscv64 Helix test queues in CI | Data not available: no effort estimate found in any source reviewed | Unassigned (candidate: Samsung `arch-riscv` team or RISE) | Critical |
| Functional | Fix NativeAOT R2R memory barriers ([#106219](https://github.com/dotnet/runtime/issues/106219)) | Data not available: no effort estimate found | Unassigned | High |
| Functional | Fix Crossgen2 async-method crash on riscv64 ([#126234](https://github.com/dotnet/runtime/issues/126234)) | Data not available: no effort estimate found | Unassigned | High |
| Functional | FP-struct interop >16 bytes fix ([#107386](https://github.com/dotnet/runtime/issues/107386)) | Data not available: no effort estimate found | Unassigned | Medium |
| Functional | Re-enable W^X on riscv64 ([#103465](https://github.com/dotnet/runtime/issues/103465)) | Data not available: no effort estimate found | Unassigned | Medium |
| Performance | RVV/SIMD codegen in RyuJIT ([#131926](https://github.com/dotnet/runtime/issues/131926)) | Data not available: unassigned, no design timeline published | Unassigned | High |
| CI/CD | Add riscv64 test execution to CI (Helix queues) | Data not available: no effort estimate found | Unassigned | Critical |
| CI/CD | Remove/relax path-filter gating on riscv64 CI leg | Data not available: no effort estimate found | Unassigned | Medium |

Note: no source reviewed contained person-week or engineering-time estimates for any RISC-V work item on this project; all effort figures above are marked "data not available" rather than estimated, per verification policy.

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [dotnet/runtime issue #36748 - RISC-V support](https://github.com/dotnet/runtime/issues/36748)
- [dotnet/runtime issue #84834 - CoreCLR RISC-V architecture port](https://github.com/dotnet/runtime/issues/84834)
- [dotnet/runtime issue #106223 - RISC-V NativeAOT port](https://github.com/dotnet/runtime/issues/106223)
- [dotnet/runtime issue #96117 - Mono RISC-V porting progress tracing](https://github.com/dotnet/runtime/issues/96117)
- [dotnet/runtime issue #73437 - API Proposal: architecture definitions for RISC-V ISA](https://github.com/dotnet/runtime/issues/73437)
- [dotnet/runtime issue #74071 - Missing risc-v implementations in mono mini](https://github.com/dotnet/runtime/issues/74071)
- [dotnet/runtime issue #75749 - Port CoreCLR PAL to linux-riscv64](https://github.com/dotnet/runtime/issues/75749)
- [dotnet/runtime issue #97791 - Failed to build tests for libs on Riscv64](https://github.com/dotnet/runtime/issues/97791)
- [dotnet/runtime issue #100215 - riscv64 builds fail: No usable version of clang found](https://github.com/dotnet/runtime/issues/100215)
- [dotnet/runtime issue #103465 - Re-enable WriteXorExecute on riscv64 architecture](https://github.com/dotnet/runtime/issues/103465)
- [dotnet/runtime issue #105686 - RISCV/QEMU: /proc/pid/stat returns strange values](https://github.com/dotnet/runtime/issues/105686)
- [dotnet/runtime issue #105808 - GC crash on DiagnosticSourceTest.AllSubscriberStress](https://github.com/dotnet/runtime/issues/105808)
- [dotnet/runtime issue #106219 - Add memory barriers to native AOT asm helpers](https://github.com/dotnet/runtime/issues/106219)
- [dotnet/runtime issue #107386 - FP structs larger than 16 bytes in interops](https://github.com/dotnet/runtime/issues/107386)
- [dotnet/runtime issue #119897 - NaN propagation should occur where feasible](https://github.com/dotnet/runtime/issues/119897)
- [dotnet/runtime issue #122043 - Large number of CLR tests failing on main](https://github.com/dotnet/runtime/issues/122043)
- [dotnet/runtime issue #124934 - Enable Runtime Async](https://github.com/dotnet/runtime/issues/124934)
- [dotnet/runtime issue #126234 - Crossgen2 crashes compiling async methods on RISCV and LOONGARCH](https://github.com/dotnet/runtime/issues/126234)
- [dotnet/runtime issue #129792 - RISCV64 stacktrace test fails with NativeAOT](https://github.com/dotnet/runtime/issues/129792)
- [dotnet/runtime issue #130145 - ILC failing with exit code 139 for risc-v build](https://github.com/dotnet/runtime/issues/130145)
- [dotnet/runtime issue #131543 - RISC-V32 support with Zacas](https://github.com/dotnet/runtime/issues/131543)
- [dotnet/runtime issue #131926 - RISC-V SIMD support](https://github.com/dotnet/runtime/issues/131926)
- [dotnet/runtime issue #115296 - Need to configure target RISC-V extension for coreclr build](https://github.com/dotnet/runtime/issues/115296)
- [microsoft/dotnet issue #1380 - RISC-V Support (org-level tracking)](https://github.com/microsoft/dotnet/issues/1380)
- [dotnet/sdk issue #49594 - RISC-V architecture support](https://github.com/dotnet/sdk/issues/49594)
- [dkurt/dotnet_riscv - community .NET SDK riscv64 builds](https://github.com/dkurt/dotnet_riscv)
- [filipnavara/dotnet-riscv - community .NET 10 linux-riscv64 build tracking](https://github.com/filipnavara/dotnet-riscv)
- [RISE Project Confluence - LR_04_001: Port .NET Runtime to RISC-V](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8587597/LR_04_001+Port+.NET+Runtime+to+RISC-V)
- [dotnet/BenchmarkDotNet PR #2647 - add RiscV64 platform recognition](https://github.com/dotnet/BenchmarkDotNet/pull/2647)
- [BenchmarkDotNet changelog](https://benchmarkdotnet.org/changelog/full.html)
- [PyPI package lookup for "-net" (not applicable, 404 confirmed)](https://pypi.org/pypi/-net/json)
- [RISE GitLab PyPI wheel mirror lookup for "-net" (not applicable, 404 confirmed)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/-net/)
- [.NET official downloads](https://dotnet.microsoft.com/)
- [dotnet/runtime README.md (.NET Foundation project, MIT license)](https://github.com/dotnet/runtime/blob/main/README.md)
- [dotnet/runtime docs/area-owners.md (arch-riscv / os-tizen ownership)](https://github.com/dotnet/runtime/blob/main/docs/area-owners.md)
- [dotnet/runtime docs/project/os-onboarding.md (support-tier philosophy)](https://github.com/dotnet/runtime/blob/main/docs/project/os-onboarding.md)
- [dotnet/runtime eng/pipelines/runtime.yml (main CI pipeline, riscv64 job definition)](https://github.com/dotnet/runtime/blob/main/eng/pipelines/runtime.yml)
- [dotnet/runtime eng/pipelines/common/platform-matrix.yml (linux_riscv64 platform template)](https://github.com/dotnet/runtime/blob/main/eng/pipelines/common/platform-matrix.yml)
- [dotnet/runtime eng/pipelines/common/templates/pipeline-with-resources.yml (riscv64 container image)](https://github.com/dotnet/runtime/blob/main/eng/pipelines/common/templates/pipeline-with-resources.yml)
- [riseproject.dev - RISE Project membership and blog](https://riseproject.dev/blog)
- [RISE Python wheel builder scope (no .NET listed)](https://riseproject.gitlab.io/python/wheel_builder/)
- [openssl/openssl issue #30880 - test_lhash flaky on riscv64 CI](https://github.com/openssl/openssl/issues/30880)
- [openssl/openssl issue #28118 - musl riscv extension detection](https://github.com/openssl/openssl/issues/28118)
- [facebook/zstd issue #4471 - RVV support for XXH3](https://github.com/facebook/zstd/issues/4471)
- [facebook/zstd issue #4546 - RISC-V unaligned-access optimization](https://github.com/facebook/zstd/issues/4546)
- [libunwind/libunwind issue #765 - CMake riscv64 build support absent](https://github.com/libunwind/libunwind/issues/765)
- [libunwind/libunwind issue #519 - Ltest-cxx-exceptions fails on Ubuntu 20.04-riscv64](https://github.com/libunwind/libunwind/issues/519)
- [llvm/llvm-project issue #221163 - RVV register hazard](https://github.com/llvm/llvm-project/issues/221163)
- [llvm/llvm-project issue #123069 - EVL tail-folding](https://github.com/llvm/llvm-project/issues/123069)