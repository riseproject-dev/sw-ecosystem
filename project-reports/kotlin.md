---
title: Kotlin
parent: Project Reports
color: orange
dependencies:
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: libffi
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: OpenJDK
    relation: runtime-dependency
    criticality: critical
  - name: WasmEdge
    relation: test-dependency
    criticality: optional
  - name: Wasmtime
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="kotlin" %}

# Kotlin

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Kotlin<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Kotlin is a statically-typed, general-purpose programming language developed primarily by [JetBrains](https://kotlinlang.org/), with governance administered by the **Kotlin Foundation** (trademark and ecosystem governance body). Kotlin Foundation members, per kotlinlang.org, are JetBrains, Google, Meta, Gradle, Touchlab, Uber, Kotzilla, and Block. The project is licensed under Apache License 2.0.

Kotlin ships in two functionally distinct forms:
- **Kotlin/JVM**: the compiler (`kotlinc`) emits architecture-neutral JVM bytecode. This is the overwhelming majority of real-world Kotlin usage and depends only on a working JVM at the target architecture.
- **Kotlin/Native**: an LLVM-based compiler backend that produces standalone native binaries for a fixed, explicitly enumerated set of target triples (`KonanTarget.kt`), analogous in scope to a systems-language compiler backend.

No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file was located via the tools available this session; this should be read as "not found by available tools," not confirmed absence, given repository-clone integrity issues documented mid-research [NEEDS VERIFICATION].

**Community culture on new ports:** No public tiering/RFC process for adding new Kotlin/Native targets was located. The concrete evidence found points away from an open-door posture toward new architecture ports: two Gradle-plugin tests (`UnsupportedKotlinNativeHostTest.kt`, `MppUnsupportedKotlinNativeHostIT.kt`) exist specifically to assert that a riscv64 host is **rejected** as unsupported for Kotlin/Native, rather than accepted or flagged experimental. JetBrains/Kotlin Foundation is not a member of the [RISE project](https://riseproject.dev/) (checked against both the Premier Members list - Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent - and the General Members list - Akeana, Andes, Beijing ESWIN, BOSC, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-12-09 | [KT-43854](https://youtrack.jetbrains.com/issue/KT-43854) "Kotlin/Native: Linux RISC-V targets" opened as the master tracking request to add Linux RISC-V (32/64-bit) as a Kotlin/Native compile target | JetBrains YouTrack |
| 2025-02-17 | KT-43854 last updated; still unresolved | JetBrains YouTrack |
| 2025-05-31 | [KT-77977](https://youtrack.jetbrains.com/issue/KT-77977) opened: Gradle plugin 2.1.20 regression, `TargetSupportException: Unknown hardware platform: riscv64` on plain JVM builds (`HostManager.hostArch` did not recognize riscv64 even for non-Native builds); reporter supplied a minimal repro ([zachbr/KT-77977](https://github.com/zachbr/KT-77977)) on a StarFive board running JVM 21/Ubuntu riscv64 | JetBrains YouTrack |
| 2025-06-16 | KT-77977 fixed, shipped in the Kotlin 2.2.x line | [ChangeLog-2.2.X.md](https://github.com/JetBrains/kotlin/blob/master/docs/changelogs/ChangeLog-2.2.X.md) |
| ~2020-2026 | No implementation PR for riscv64 as a Kotlin/Native target has been opened or merged on GitHub at any point | GitHub PR/commit search, 0 results (see Section 12) |

**Key contributors:** No named individual or organizational contributor is associated with riscv64 Kotlin/Native work in the official repository - the only identified riscv64-adjacent contributor is the external reporter of KT-77977 (community bug report on JVM tooling, not a Native-target implementation). A Slack thread in the Kotlin community's #kontributors channel titled "Contribution Announcement: Kotlin Native supporting RiscV" indicates community interest in an independent contribution effort, but no corresponding GitHub PR exists in `JetBrains/kotlin` [NEEDS VERIFICATION - Slack source only, not corroborated by any GitHub artifact].

**Is it fully upstream?** No. Kotlin/Native has zero riscv64 target support upstream (Section 4). Kotlin/JVM works on riscv64 only in the sense that it emits portable bytecode and, as of Kotlin 2.2.x, no longer crashes its own build tooling on riscv64 hosts (KT-77977).

## 3. Upstream Support Tier

No formal tier-policy document (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/`) exists in the repository. Support tiers are de facto defined by the `KonanTarget.kt` enum, which is the canonical, exhaustive list of Kotlin/Native-supported targets.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| KonanTarget enum entry (Kotlin/Native) | present (`LINUX_X64`, `MACOS_X64`) | present (`LINUX_ARM64`, `MACOS_ARM64`, `ANDROID_ARM64`) | **absent** |
| Host-arch detection (`HostManager.hostArchOrNull`) | recognized | recognized | **not recognized** (falls through to `null`) |
| Official Kotlin/Native release binary | yes (`kotlin-native-image-linux-x86_64-2.4.20.tar.gz`) | yes, macOS only (`kotlin-native-image-macos-aarch64-2.4.20.tar.gz`) | **none** |
| Upstream riscv64 CI | n/a (default target) | n/a (default target) | **none found** |
| Kotlin/JVM compiler usable | yes | yes | yes, via any working JVM (bytecode is architecture-neutral) |

Source: [`native/utils/src/org/jetbrains/kotlin/konan/target/KonanTarget.kt`](https://github.com/JetBrains/kotlin/blob/master/native/utils/src/org/jetbrains/kotlin/konan/target/KonanTarget.kt) (fetched in full; exactly 20 `object`s enumerated, none riscv64), and [`HostManager.kt`](https://github.com/JetBrains/kotlin/blob/master/native/utils/src/org/jetbrains/kotlin/konan/target/HostManager.kt).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Kotlin/Native's runtime and compiler contain hand-tuned, architecture-specific C++ code for supported targets (e.g. `PolyHash-arm.h` using ARM NEON intrinsics for string hashing, versus generic/x86 intrinsics; arch-specific CPU-type constants for stack unwinding in `SourceInfo.cpp`). No equivalent riscv64 code exists anywhere.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| KonanTarget enum entry | full | full | missing |
| Host-arch detection | full | full | missing |
| Cross-toolchain (`toolchain_builder`) | full (`x86_64-unknown-linux-gnu`) | full (`aarch64-unknown-linux-gnu`) | missing (no `riscv64-unknown-linux-gnu` directory) |
| Runtime hand-tuned code (PolyHash string-hash, symbolication) | full | full (NEON) | missing |
| `__riscv` preprocessor guards anywhere in C/C++ sources | n/a | n/a | 0 matches (`search_code "__riscv" repo:JetBrains/kotlin"`) |
| CI coverage | n/a (default) | n/a (default) | missing |
| Test coverage | positive (compiles/runs) | positive (compiles/runs) | negative only (asserts rejection) |

The only riscv64-aware code anywhere in the repository:
1. `kotlin-native/tools/minidump-analyzer/src/main/cpp/main.cc` and `build.gradle.kts` - vendored Google Breakpad crash-dump stackwalker code with pre-existing `StackFrameRISCV`/`StackFrameRISCV64` support (register-dump printing only, base integer registers, no ISA extensions). This is third-party, inherited code for a standalone crash-analysis dev tool, unrelated to the Kotlin/Native compiler backend.
2. `libraries/tools/kotlin-gradle-plugin/.../UnsupportedKotlinNativeHostTest.kt` and `.../MppUnsupportedKotlinNativeHostIT.kt` - tests that **assert riscv64 is rejected** as an unsupported Kotlin/Native host, with Native compile tasks (`compileKotlinLinuxX64`, `compileKotlinMacosArm64`, `compileKotlinMingwX64`) skipped while JVM/JS/Wasm tasks still succeed.
3. `docs/changelogs/ChangeLog-2.2.X.md` - the one-line KT-77977 changelog entry.
4. `wasm/wasm.debug.browsers/package-lock.json` - a transitive npm optional dependency (`@rollup/rollup-linux-riscv64-gnu`) pulled in by Rollup for browser-based Wasm debug tooling, unrelated to Kotlin/Native or JVM riscv64 support.
5. `kotlin-native/tools/toolchain_builder/toolchains/*/gcc-*.config` - crosstool-ng's generic, identical `CT_ALL_ARCH_CHOICES` boilerplate list (present verbatim in the x86_64, aarch64, and arm configs alike) that happens to list "RISCV" as one of crosstool-ng's theoretical architecture options. Never selected or built for any Kotlin target.

No RVV, Zba, Zbb, Zicsr, or any other RISC-V ISA-extension code exists anywhere in the repository (`vfloat32m1_t`: 0 matches; `rvv`: 3 matches, all false-positive substring hits inside unrelated hash strings).

Source: [KonanTarget.kt](https://github.com/JetBrains/kotlin/blob/master/native/utils/src/org/jetbrains/kotlin/konan/target/KonanTarget.kt), [HostManager.kt](https://github.com/JetBrains/kotlin/blob/master/native/utils/src/org/jetbrains/kotlin/konan/target/HostManager.kt), [UnsupportedKotlinNativeHostTest.kt](https://github.com/JetBrains/kotlin/blob/master/libraries/tools/kotlin-gradle-plugin/src/functionalTest/kotlin) (path per findings), [minidump-analyzer/src/main/cpp/main.cc](https://github.com/JetBrains/kotlin/blob/master/kotlin-native/tools/minidump-analyzer/src/main/cpp/main.cc).

## 5. Build System, Cross-Compilation, and Toolchain

Kotlin has no root `CMakeLists.txt`, `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, or `cmake/` directory. The only CMake file in the repository is `kotlin-native/libllvmext/CMakeLists.txt` (an LLVM extension shim), which contains no `riscv` string and no `-DUSE_*` architecture flags (`USE_ language:cmake` search returned 0 hits).

Kotlin/Native's own dependency manifests are `gradle/libs.versions.toml` and `kotlin-native/konan/konan.properties` plus `gradle.properties`. `konan.properties` enumerates every supported target explicitly (`linux_x64`, `linux_arm64`, `linux_arm32_hfp`, `macos_x64`, `macos_arm64`, `mingw_x64`, `android_*`, `ios/tvos/watchos_*`) with per-target `llvmHome`, `libffiDir`, `targetSysRoot`, and linker entries. **No `riscv64` entry exists, and no `linux_riscv64` triple is defined.** The JetBrains-hosted LLVM 21 toolchain distributions referenced in `gradle.properties` (`kotlin.native.llvm.default.*`) are published only for `linux_x64`, `macos_arm64`, `macos_x64`, `mingw_x64` hosts - no riscv64 host build exists, so Kotlin/Native's compiler cannot even be *run on* a riscv64 machine, independent of what it can compile *to*.

`kotlin-native/tools/toolchain_builder/` builds GCC-based crosstool-ng toolchains only for `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu`, and `arm-unknown-linux-gnueabihf`; no `riscv64-unknown-linux-gnu` toolchain directory exists. `kotlin-native/tools/qemu/Dockerfile` builds QEMU only as a runtime test emulator for existing supported targets (e.g. running ARM binaries on x86 CI), not to cross-compile or test a riscv64 target.

**No exact cmake/configure commands, toolchain versions, or QEMU usage for riscv64 exist**, because no such build path has ever been created. **Known build failure:** KT-77977 shows that as recently as Kotlin 2.1.20, plain JVM Gradle builds on a riscv64 host crashed outright with `TargetSupportException: Unknown hardware platform: riscv64`; fixed in 2.2.x. This confirms JVM-side build tooling was, until mid-2025, not even runnable on a riscv64 host machine, separate from the Native-target gap.

Source: [ChangeLog-2.2.X.md](https://github.com/JetBrains/kotlin/blob/master/docs/changelogs/ChangeLog-2.2.X.md), `kotlin-native/konan/konan.properties`, `gradle.properties` (repo paths per findings).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compile Kotlin to native binary (Kotlin/Native) | yes | yes (Linux + Android + macOS variants) | **no - not a defined target** |
| Run Kotlin/Native compiler as host | yes | yes (macOS only) | **no - no host toolchain** |
| Compile/run Kotlin/JVM (bytecode) | yes | yes | yes, given a working JVM; JVM tooling itself functional as of Kotlin 2.2.x (KT-77977 fix) |
| Compile Kotlin/JS, Kotlin/Wasm | yes | yes | yes (host-independent, runs on JVM tooling) |
| Official prebuilt Native binary release | yes | macOS only | **none** |

**Functional gap:** Kotlin cannot be used at all for any Kotlin/Native use case (Kotlin Multiplatform native targets, standalone native executables, iOS/embedded-style native compilation) on or for riscv64. This is a complete functional absence, not a degraded/partial capability.

**Performance gap:** Not applicable in the SIMD/vectorization sense - there is no riscv64 Kotlin/Native code path to have a performance delta from. For Kotlin/JVM workloads, performance is a function of the underlying JVM's riscv64 JIT maturity (outside Kotlin's own scope) rather than anything in the Kotlin codebase itself.

**Security hardening gaps:** Data not available: no riscv64-specific security-hardening analysis exists because there is no riscv64 Kotlin/Native code to harden.

**NaN / floating-point semantics issues:** Data not available: no riscv64-specific floating-point correctness issues were found in GitHub Issues, PRs, or commits (0 results across all query variants; see Section 11).

## 7. CI/CD Infrastructure

**No riscv64 CI exists in `JetBrains/kotlin`.** Verified two independent ways:

1. Direct file read: `.github/workflows/` contains exactly one file, `npm-publish.yaml` - triggered only by `repository_dispatch` (type `npm_publish`), runs on `ubuntu-latest` with a JetBrains x86 container image (`kotlin-build-env:v48`), and does nothing but download a prebuilt zip and run `./gradlew publishAll` to publish npm packages. No riscv/riscv64/RISCV mention anywhere in this file. `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist anywhere in the repository (`git ls-tree -r HEAD --name-only`, zero matches).
2. Adversarial re-check via GitHub code search across the entire repository (not just `.github/workflows/`): `riscv path:.github` (0 results), `rv64 path:.github` (0 results), `qemu-riscv64` (0 results), `riscv extension:yml`/`extension:yaml` (0 results).

Kotlin's real primary CI is JetBrains-internal **TeamCity**, whose pipeline configuration is not stored in the public repository (only helper scripts like `scripts/teamcity-run.sh` exist) and is therefore not inspectable.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI exists | yes (TeamCity, not inspectable) | yes (TeamCity, not inspectable) | **no** |
| RISE runners used | no | no | no |
| Test execution | yes (implied by release process) | yes (implied by release process) | n/a - no CI |

Source: `.github/workflows/npm-publish.yaml`, exhaustive code search (queries listed above).

## 8. Distribution and Release Status

**No official riscv64 binaries exist in any channel checked:**

- **GitHub Releases** ([latest: 2.4.20, 2026-09-07](https://github.com/JetBrains/kotlin/releases)): assets are `kotlin-compiler-2.4.20.zip`, `kotlin-native-image-linux-x86_64-2.4.20.tar.gz`, `kotlin-native-image-macos-aarch64-2.4.20.tar.gz`, `kotlin-native-image-windows-x86_64-2.4.20.tar.gz`, plus source archives. Zero riscv64 assets in the 3 most recent releases checked.
- **PyPI** ([`kotlin` package](https://pypi.org/pypi/kotlin/json)): only asset is `kotlin-0.0.1.tar.gz`, an unrelated, apparently abandoned placeholder package (summary "Cool Package") - not JetBrains Kotlin at all.
- **RISE wheel builder**: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/kotlin/` redirects to the same unrelated PyPI package.
- **Ubuntu 26.04 "resolute"**: `kotlin` v1.3.31+ds1-3ubuntu1 is listed as **Architecture: all** - a noarch, architecture-independent JVM-bytecode package. This installs on riscv64 by virtue of being architecture-neutral (given a JVM), **not because it is a dedicated riscv64 binary build**. It should not be characterized as riscv64 support evidence for Kotlin/Native.
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=kotlin)): no `kotlin` package listed at all.

**What a user must do to get a working binary today:** For Kotlin/JVM on riscv64: install a working riscv64 JVM/JDK (see Section 9 - OpenJDK), then use any architecture-neutral Kotlin compiler distribution (the `.zip`/jar, or a distro's arch-"all" package). For Kotlin/Native on riscv64: **there is no path** - no official binary, no distro package, no community-maintained fork known to be merged or released.

Source: [GitHub Releases](https://github.com/JetBrains/kotlin/releases), [PyPI JSON API](https://pypi.org/pypi/kotlin/json), [Ubuntu package search](https://packages.ubuntu.com/search?keywords=Kotlin&suite=resolute&searchon=names&section=all), [Arch RISC-V port search](https://archriscv.felixc.at/?q=kotlin).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| LLVM (v21, pinned via `gradle.properties`) | Kotlin/Native codegen backend | Upstream LLVM riscv64 backend is mature (in-tree since LLVM 14) with active upstream work (801 open riscv64-tagged issues in `llvm/llvm-project` per GitHub search - indicates active engagement, not abandonment) [NEEDS VERIFICATION - single-source GitHub search count]. **JetBrains does not publish a riscv64 build of its patched LLVM 21 distribution** | n/a - no riscv64 Kotlin/Native host/target exists | none published by JetBrains under `resources/llvm/` | Immediate blocker: even if upstream LLVM riscv64 is capable, JetBrains has never built or hosted an LLVM 21 riscv64 host toolchain |
| libffi | Kotlin/Native interop (cinterop, C/Obj-C bridging) | Ubuntu 24.04 ships `libffi8`/`libffi-dev` for riscv64; Debian sid/trixie build on riscv64 | not run by Kotlin (no riscv64 target) | distro packages predate upstream v3.6.0; a float-argument marshalling bug (fixed upstream in PR #972 / v3.6.0) is present in every currently-shipped Debian/Ubuntu riscv64 package | see `project-reports/libffi.md` |
| zlib | Kotlin/Native platform-library interop (`zlib.def` bindings); also used by the JVM itself | present for riscv64 in Ubuntu 24.04, Debian sid, Arch RISC-V, Alpine edge; pure C, builds cleanly | no arch-specific code (green per `project-reports/zlib.md`) | packaged for riscv64 across all checked distros | unmerged RVV-optimization PR #1099 sits unreviewed upstream |
| OpenJDK / JVM | Runtime that the Kotlin compiler, Gradle, and all Kotlin/JVM output execute on | Eclipse Temurin has JDK 21 (LTS) riscv64 binaries; Debian sid has riscv64 `openjdk-{11,17,21,25,26}-jdk`; Ubuntu 24.04 riscv64 JDKs live only in the ports archive, not main/apt-default | HotSpot C1/C2 JIT is Green (full riscv64 backend) per `project-reports/openjdk.md`; libpng Yellow (needs system libpng >=1.6.45 for RVV correctness); OpenSSL/JSSE PKCS11 Yellow (AES T-table not constant-time without Zkn/Zvkned, open issue #22166) | JDK 21 is the reliable riscv64 LTS; JDK 17/11 Temurin riscv64 binaries reportedly announced by RISE/Adoptium but not consistently published (discrepancy noted in `project-reports/openjdk.md`) | see `project-reports/openjdk.md`. Directly relevant: KT-77977 shows Kotlin's own Gradle-plugin host detection was broken on riscv64 hosts until Kotlin 2.2.x |
| WasmEdge (0.16.3) / Wasmtime (47.0.3) | Test-only Wasm engines for Kotlin/Wasm output | not verified | not verified | not verified | WasmEdge tracked at `project-reports/wasmedge.md`; Wasmtime not tracked. Test-only, lower priority |
| ASM, protobuf-java, jline | JVM bytecode manipulation, compiler-daemon serialization, REPL line editing | portable (JVM-hosted or portable C) | not architecture-gated | not architecture-gated | no dedicated tracking; not expected to block Kotlin on riscv64 |

**Deep-dive - the critical path:** Kotlin/Native's riscv64 gap is **not** primarily a dependency-readiness problem. LLVM, libffi, and zlib are all reasonably-to-fully riscv64-capable upstream or in distros already. The blocker is entirely JetBrains-side: no `linux_riscv64` `KonanTarget` has been added, and no riscv64 build of JetBrains' patched LLVM 21 toolchain has ever been published. Kotlin/JVM's dependency surface reduces essentially to "a working JVM," which per `project-reports/openjdk.md` is workable today on JDK 21 via Debian sid or Ubuntu's ports archive, with a small number of Yellow-rated runtime caveats.

Source: `gradle/libs.versions.toml`, `kotlin-native/konan/konan.properties`, `gradle.properties`, `project-reports/{libffi,openjdk,zlib,wasmedge}.md` (local repository files, dated 2026-06-17).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [KT-43854](https://youtrack.jetbrains.com/issue/KT-43854) | Kotlin/Native: Linux RISC-V targets | Open since 2020-12-09, last updated 2025-02-17 | Feature gap (blocking) | Master tracking issue; no implementation PR attached; 5+ years open |
| [KT-77977](https://youtrack.jetbrains.com/issue/KT-77977) | "Unknown hardware platform: riscv64" on JVM project build | Closed/fixed, shipped Kotlin 2.2.x (2025-06-16) | Build-tooling regression (JVM-side only) | Confirms riscv64 host detection in Kotlin's own Gradle tooling was broken as recently as mid-2025; fix does not add Native-target support |

**Correctness bugs:** None found. GitHub Issue/PR/commit search across `JetBrains/kotlin` for "riscv", "riscv64", "RISC-V", "riscv64 performance", "riscv64 bug", "riscv nan floating point" all returned 0 results. This was cross-checked as a genuine negative result, not a tool failure, by confirming the same search tool returns 87,530 characters of real matches when the repo scope is removed. **No NaN/floating-point correctness bugs, no performance issues, no open bug reports for Kotlin on RISC-V were found anywhere.**

Note: because JetBrains tracks issues in YouTrack rather than GitHub Issues, this table is necessarily incomplete for anything not surfaced via changelog references or independent web/Slack discovery; a YouTrack-native search was not performed directly (tool access limited to GitHub in this session) [NEEDS VERIFICATION].

## 12. Objections and Upstream Blockers

**Stated objections:** No explicit statement of objection (e.g. a maintainer comment declining riscv64 support) was found in any source reached. KT-43854 shows no maintainer response beyond the issue remaining open.

**Technical blockers:**
1. No `LINUX_RISCV64` `KonanTarget` defined - a prerequisite compiler-side change.
2. No riscv64 host build of JetBrains' patched LLVM 21 toolchain (Kotlin/Native's codegen dependency) is published, and no riscv64 cross-toolchain exists in `toolchain_builder/`.
3. `HostManager.hostArchOrNull()` has no riscv64 branch (falls through to `null`), a related but now partially addressed gap (KT-77977 fixed the JVM-build-crash symptom without adding riscv64 as a recognized host arch for Native purposes).

**Organizational blockers:** JetBrains/Kotlin Foundation is not a RISE member and has received no identified RISE funding, blog coverage, or working-group engagement specific to the Kotlin language/compiler (Section 2 of Section-2-equivalent RISE research). RISE's only Kotlin-adjacent funded work is unrelated: CI wheel-building for the `tree-sitter-kotlin` Python grammar-binding package in `riseproject-dev/python-wheels`, run on RISE's own `ubuntu-24.04-riscv` runners - this supports a Python tooling package, not JetBrains' Kotlin compiler/runtime.

**GitHub PR merge status (verification):** No riscv64-related PR exists to check `merged_at` status against - `search_pull_requests` for "riscv", "riscv64", "RISC-V", `"Unknown hardware platform"` all return 0 results, confirmed by repeated targeted queries ("riscv repo:JetBrains/kotlin", "riscv64 repo:JetBrains/kotlin", "RISC-V repo:JetBrains/kotlin", "riscv org:JetBrains"). No PR number exists anywhere in the sourced findings to fabricate a check against.

**Acceptance probability:** Given a 5+ year open tracking issue with zero implementation activity, no RISE engagement, no named contributor driving the work in the official repository, and a still-nascent community effort (a Slack announcement and an independent, non-merged compiler fork/white-paper referenced in web search but not found as any GitHub artifact), near-term (12-month) upstream acceptance of Kotlin/Native riscv64 support is assessed as low without dedicated external engineering investment and direct engagement with JetBrains.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, no upstream or distro-patched riscv64 release of any compiled Kotlin artifact)
- **Release provider:** none
- Kotlin is not an optimization-purpose project (general-purpose language/compiler toolchain), so the Step 2 optimization modifier does not apply and Optimization level is omitted.
- **Justification:** `JetBrains/kotlin`'s only GitHub Actions workflow, [`npm-publish.yaml`](https://github.com/JetBrains/kotlin/blob/master/.github/workflows/npm-publish.yaml), runs on x86 and contains no riscv64 job of any kind; no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists, and an exhaustive code search (`riscv path:.github`, `rv64 path:.github`, `qemu-riscv64`, `riscv extension:yml/yaml`) returned zero results. The compiled/native side of the project has no riscv64 target at all: [`KonanTarget.kt`](https://github.com/JetBrains/kotlin/blob/master/native/utils/src/org/jetbrains/kotlin/konan/target/KonanTarget.kt) enumerates exactly 20 supported targets and none is riscv64, and two tests explicitly assert riscv64 is rejected as an unsupported Kotlin/Native host. No upstream, distro, or third-party channel publishes a riscv64-specific Kotlin/Native binary ([GitHub Releases 2.4.20](https://github.com/JetBrains/kotlin/releases), PyPI, Arch RISC-V all confirmed absent); Ubuntu's `kotlin` package is architecture-independent bytecode ("Architecture: all"), not a riscv64-specific build, and does not qualify for the distribution floor upgrade to yellow since it involves no riscv64-specific compilation at all.
- **Pending work that could change the grade:** [KT-43854](https://youtrack.jetbrains.com/issue/KT-43854) remains open and is the master tracking issue - any JetBrains-side implementation landing there (adding `LINUX_RISCV64` to `KonanTarget.kt` plus a riscv64 LLVM host build) would be the qualifying event to move off orange. A community Slack announcement ("Contribution Announcement: Kotlin Native supporting RiscV") and an independent, unmerged compiler fork/white-paper (blog.hakz.app, link now dead) indicate outside interest, but neither has produced a discoverable GitHub PR in `JetBrains/kotlin` as of 2026-09-10. No RISE involvement with the Kotlin language/compiler itself was found.

## 14. Investment Analysis

RISE has not funded or performed any work directly on the Kotlin language/compiler; its only Kotlin-adjacent funded work is CI wheel-building for the unrelated `tree-sitter-kotlin` Python grammar-binding package in `riseproject-dev/python-wheels`. No work below should be considered already covered by RISE.

### 14.1 Functional Enablement

The core blocking work is entirely upstream, JetBrains-side, and compiler-team-scoped: add a `LINUX_RISCV64` `KonanTarget`, extend `HostManager` arch detection, build and host a riscv64 LLVM 21 toolchain (or riscv64 cross-toolchain support in `toolchain_builder/`), and implement/validate riscv64 codegen in Kotlin/Native's LLVM-based backend. This is a multi-quarter compiler-engineering effort comparable in scope to adding a new architecture backend to any LLVM-based toolchain, not a build-flag or packaging fix.

### 14.2 Performance Optimization

Not applicable until functional enablement exists - there is no riscv64 Kotlin/Native code path to optimize. Once a functional backend exists, standard LLVM riscv64 codegen (already mature upstream) would likely provide baseline performance without Kotlin-specific SIMD/vector work, since Kotlin/Native does not maintain its own architecture-specific SIMD kernels comparable to a numerics library.

### 14.3 CI/CD Infrastructure

Requires adding a riscv64 build-and-test job to JetBrains' internal TeamCity pipeline (not inspectable/modifiable externally) or, as an interim/external validation path, a GitHub Actions job on RISE riscv64 runners exercising Kotlin/JVM builds (already functional per KT-77977) as a regression guard, separate from any Kotlin/Native work.

### 14.4 Ecosystem Enablement

Section 10 omitted: Kotlin is a language/compiler toolchain, not a project with a dependent package ecosystem (npm/PyPI/Maven packages that themselves require riscv64-specific enablement) in the sense this section is meant to cover.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `LINUX_RISCV64` KonanTarget + HostManager arch detection | Data not available: no scoping estimate found in any source; comparable LLVM-backend-target additions are typically multi-quarter efforts [NEEDS VERIFICATION] | JetBrains (Kotlin/Native compiler team) | Critical |
| Functional | Build and publish riscv64 host LLVM 21 toolchain | Data not available: no scoping estimate found | JetBrains | Critical |
| Functional | riscv64 Kotlin/Native codegen implementation and correctness validation | Data not available: no scoping estimate found | JetBrains | Critical |
| CI/CD | Add riscv64 job to internal TeamCity pipeline (or external GH Actions guard for Kotlin/JVM) | Data not available: no scoping estimate found | JetBrains (internal), or external contributor for JVM-only guard | High |
| Distribution | Publish official riscv64 Kotlin/Native release artifacts once functional work lands | Data not available: no scoping estimate found | JetBrains | Medium (gated on Functional items) |
| Community engagement | Engage the Slack "Kotlin Native supporting RiscV" contributor group and any independent compiler-fork authors to assess upstreamable work | Data not available: no scoping estimate found | External sponsor / RISE liaison | Medium |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [KT-43854 - Kotlin/Native: Linux RISC-V targets](https://youtrack.jetbrains.com/issue/KT-43854)
- [KT-77977 - Unknown hardware platform: riscv64 on JVM project build](https://youtrack.jetbrains.com/issue/KT-77977)
- [ChangeLog-2.2.X.md (KT-77977 fix entry)](https://github.com/JetBrains/kotlin/blob/master/docs/changelogs/ChangeLog-2.2.X.md)
- [KonanTarget.kt](https://github.com/JetBrains/kotlin/blob/master/native/utils/src/org/jetbrains/kotlin/konan/target/KonanTarget.kt)
- [HostManager.kt](https://github.com/JetBrains/kotlin/blob/master/native/utils/src/org/jetbrains/kotlin/konan/target/HostManager.kt)
- [JetBrains/kotlin GitHub Actions workflow - npm-publish.yaml](https://github.com/JetBrains/kotlin/blob/master/.github/workflows/npm-publish.yaml)
- [JetBrains/kotlin releases (2.4.20 and prior)](https://github.com/JetBrains/kotlin/releases)
- [kotlin-native/tools/minidump-analyzer/src/main/cpp/main.cc](https://github.com/JetBrains/kotlin/blob/master/kotlin-native/tools/minidump-analyzer/src/main/cpp/main.cc)
- [zachbr/KT-77977 minimal repro repository](https://github.com/zachbr/KT-77977)
- [PyPI kotlin package JSON API](https://pypi.org/pypi/kotlin/json)
- [Ubuntu 26.04 "resolute" package search - Kotlin](https://packages.ubuntu.com/search?keywords=Kotlin&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search - kotlin](https://archriscv.felixc.at/?q=kotlin)
- [RISE Project members page](https://riseproject.dev/)
- [RISE python-wheels tree-sitter-kotlin package definition](https://github.com/riseproject-dev/python-wheels) (path: `docs/packages/tree-sitter-kotlin.yaml`, per findings)
- [Kotlin Foundation](https://kotlinfoundation.org/)
- [kotlinlang.org](https://kotlinlang.org/)
- [Java on RISC-V: RISE and Eclipse Adoptium Partnership (riseproject.dev blog, 2024-05-29)](https://riseproject.dev/2024/05/29/395/)
- Local repository files used for dependency cross-reference: `project-reports/{libffi,openjdk,zlib,wasmedge}.md`, `projects.yml` (dated 2026-06-17, path: `/home/user/sw-ecosystem/`)
