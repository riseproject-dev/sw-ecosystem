---
title: angle
parent: Project Reports
---

# angle

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for angle<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

ANGLE (Almost Native Graphics Layer Engine) is Google's OpenGL ES / EGL / WebGL translation layer, converting these APIs to native backends (Vulkan, Direct3D, Metal, desktop GL). It is not governed by an independent foundation; it is a Google-hosted sub-project of Chromium, canonically developed at [chromium.googlesource.com/angle/angle](https://chromium.googlesource.com/angle/angle) and mirrored read-only to [github.com/google/angle](https://github.com/google/angle) (GitHub Issues are disabled repo-wide, `has_issues: false`).

License is a custom 3-clause BSD-style license (copyright holders include TransGaming Inc., Google Inc., 3DLabs Inc. Ltd.); GitHub classifies it as `NOASSERTION`/"Other" since it is not a standard SPDX license string.

Governance is Gerrit-based code review modeled directly on Chromium/V8's OWNERS system (`doc/BecomingCommitter.md` cites v8.dev's committer doc as its explicit inspiration). At least one OWNER of the most specific affected directory must approve; non-trivial changes need two committers; only committers can submit via Commit-Queue. Committer promotion requires 20 non-trivial patches, 3 distinct reviewers, a nomination email to a top-level OWNER, OWNERS consensus (~5 business days), and 2FA/security-key enrollment.

Top-level `OWNERS` is 100% Google-controlled -- every entry is a `@google.com`/`@chromium.org` address (Geoff Lang, Ken Russell, Shahbaz Youssefi, Yuly Novikov, Amirali Abdolrashidi, Charlie Lao, Chris Forbes, Cody Northrop, Yuxin Hu, "solti"). Top committers by volume: Jamie Madill (4,083 commits), Shahbaz Youssefi (2,428), Geoff Lang (2,040), Charlie Lao (821), Yuly Novikov (773), Cody Northrop (746) -- all Google/Chromium staff. The historical `AUTHORS` file lists ~35 contributing organizations over the project's life (TransGaming, 3DLabs, Adobe, Intel, NVIDIA, Microsoft, Mozilla, Igalia, Collabora, Institute of Software Chinese Academy of Sciences (ISCAS), Qualcomm Innovation Center, and others), but none hold OWNERS/review authority -- Google retains sole Commit-Queue gatekeeping.

ANGLE is confirmed **not** a RISE Project member (not listed on riseproject.dev or its members page). Google LLC itself is a RISE Premier Member as a company (alongside Alibaba, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent), but that membership does not extend to the ANGLE sub-project. ARM is notably absent from RISE membership entirely.

Community stance on new ports: standard Chromium-style contribution bar (CLA required, changes tracked against a bug number, OWNERS retain final merge authority). All RISC-V patches submitted to date were small, mechanical CLs accepted through the normal single/two-reviewer process with no visible pushback or controversy. There is no evidence of a Google-initiated RISC-V roadmap or internal advocacy -- the port exists because external contributors (Alibaba, ISCAS) submitted well-scoped patches that cleared the standard review bar.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-12-14 | CL 4104471 "[PATCH] Add riscv64 support" merged same day submitted. Adds riscv `mv %0, tp` TLS-pointer inline asm to `src/libGLESv2/global_state.h`. Author of record Elliott Hughes (Google); `Signed-off-by` credits actual authors Zhang Ye and Mao Han (Alibaba). Reviewed/landed by Charlie Lao (Google). Bug: `b/262585507` (Google-internal, not publicly viewable). | [CL 4104471](https://chromium-review.googlesource.com/c/angle/angle/+/4104471) / [commit 0f3aaeb](https://github.com/google/angle/commit/0f3aaebf742f0ac16360a1191d75f99843d1b255) |
| 2022-12-15 | Companion AOSP cherry-pick merged within one day (`android-review.git.corp.google.com/c/platform/external/angle/+/2356962`), per Charlie Lao's comment "Just merged to aosp." | Gerrit CL 4104471 review thread |
| 2023-04-05 | SwiftShader dependency roll (`2cb264b`) transitively lands 4 riscv64-specific SwiftShader commits by Rebecca Chang (StarFive, a RISC-V SoC vendor): Subzero-exclusion note, LLVM-10 riscv64 configs, marl riscv64 source file. First evidence of a RISC-V silicon vendor touching the ANGLE dependency chain. | [commit 2cb264b](https://github.com/google/angle/commit/2cb264b5adfc7188b51cddfe39dad7bd1593b635) |
| 2023-05-13/17 | CL 4530628 "[riscv64][android] support 64-bit builds on riscv64" merged. Fixes a reproducible `gn gen` assertion failure ("Unknown current CPU: riscv64") tracked as Google Issue Tracker bug 40096892 (`angleproject:8165`). Author Tao Wang (McKnight22) with co-author Wang Chen (ISCAS). Reviewed/CQ'd by Cody Northrop (Google). | [CL 4530628](https://chromium-review.googlesource.com/c/angle/angle/+/4530628) / [commit 9de2cfb](https://github.com/google/angle/commit/9de2cfb06593d3ddf7ceb4cd125ff2b23b347db3) / [Issue 40096892](https://issues.angleproject.org/issues/40096892) |
| 2023-05-21/26 | CL 4563354 follow-up, skips secondary-ABI build logic for pure-64-bit riscv64 Android targets. Same authors and bug (`angleproject:8165`). Northrop's only review comment: "LGTM - thank you!" | [CL 4563354](https://chromium-review.googlesource.com/c/angle/angle/+/4563354) / [commit 713c80c](https://github.com/google/angle/commit/713c80c15f46efc224587dad08917ccbb5dc8b2f) |
| 2023-03-24 | SwiftShader roll (`87632d6`) lands "Add riscv to the list of configs generated on android" for LLVM16 Android.bp support. | [commit 87632d6](https://github.com/google/angle/commit/87632d6457b7b7aea552c9c9456fb6367e307bd0) |
| 2023-11-23/24 | CL 5057086 "[riscv] Add riscv support" merged. Extends the `stddef.h` include guard in `src/common/platform.h` to cover `__riscv`. Author Yahan Lu (ISCAS). Reviewed/CQ'd by Yuly Novikov (Google). During review, Novikov asked "Are more riscv changes expected? Would be better to open a bug at anglebug.com if so" -- Lu replied "There no more riscv changes. I open a bug for riscv support," producing tracking bug 42266847 (`angleproject:8423`), which has remained an empty placeholder (title only, zero comments) since creation. | [CL 5057086](https://chromium-review.googlesource.com/c/angle/angle/+/5057086) / [commit 1bdb403](https://github.com/google/angle/commit/1bdb403899f2040a7b816b3261f13a48914d439c) / [Issue 42266847](https://issues.angleproject.org/issues/42266847) |
| 2025-12-08/09 | SwiftShader roll (`6ac068c`, CL 7240928) lands a fix from `rsworktech@outlook.com` for "riscv64 build problem with LLVM 16" -- the most recent riscv-touching activity found, confirming maintenance is still active. Reviewed/landed by Yuly Novikov. A related roll CL 7241433 was abandoned as a duplicate. | [CL 7240928](https://chromium-review.googlesource.com/c/angle/angle/+/7240928) / [commit 6ac068c](https://github.com/google/angle/commit/6ac068c12fa5a3163993ecefebecd462efca50cf) |

**Key contributors and orgs:** Alibaba (Zhang Ye, Mao Han -- earliest patch), ISCAS/Institute of Software Chinese Academy of Sciences (Wang Chen, Yahan Lu, and Tao Wang who used a personal gmail.com address but co-authored with ISCAS), StarFive (Rebecca Chang, via the SwiftShader dependency, not ANGLE directly). All four ANGLE-native CLs were reviewed and landed by Google staff (Charlie Lao, Cody Northrop, Yuly Novikov) acting purely as gatekeepers, not originators -- no Google-initiated riscv64 commit was found in ANGLE's own repo.

**Is it fully upstream?** Yes, for the narrow scope submitted: all 4 Gerrit CLs are confirmed `MERGED` via the Gerrit REST API and are ancestors of `main` (verified via `gh api repos/google/angle/compare/<sha>...main` returning `"status": "behind"`). None are open/pending. However, the scope itself is narrow (TLS-slot handling, a `stddef.h` guard, and Android build-config 64-bit-only handling) -- there is no riscv64 CI, no dedicated GPU backend work, and the transitively-depended SwiftShader software renderer has ongoing, unresolved riscv64 issues (Section 9).

## 3. Upstream Support Tier

ANGLE has **no formal platform-tier system**. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exist in the repo (all return 404). Platform support is de facto driven by Chromium/Android product needs across backend APIs (Vulkan, Direct3D, Metal, desktop GL, GLES) on Windows, macOS, Linux, iOS, Android, and ChromeOS. RISC-V support is CPU-host-only -- i.e., compiling/running ANGLE's existing Vulkan/GL backends on a riscv64 Android device -- not a distinct GPU/rendering backend, and there is no dedicated riscv64 CI bot on any waterfall.

Evidence against release-blocking or CI-gated status: zero riscv64 builders exist in either the `ci` or `try` LUCI bucket (Section 7); zero riscv64 GitHub Releases or tags exist for the project at all (`gh api repos/google/angle/releases`/`/tags` both empty, aside from two unrelated 2020 Android APK test releases predating the riscv64 patches by 2.5 years).

| Aspect | amd64 (x64) | arm64 | riscv64 |
|---|---|---|---|
| CI builders (LUCI) | Present (linux-x64, mac-x64, win-x64) | Present (android-arm64, mac-arm64, win-arm64) | **None -- 0 of 116 builders** |
| Official binaries/releases | N/A (no standalone release channel for any arch; consumed via Chromium/Android builds) | N/A (same) | N/A (same) -- and no riscv64-specific artifact exists even within that model |
| Backend support | Vulkan, D3D9/11, GL, Metal(no), null | Vulkan, GL (Android) | Vulkan, GL (Android) -- same backends, unverified by CI |
| Toolchain baseline | Debian Bullseye sysroot, GCC 10 | Debian Bullseye sysroot, GCC 10 | Debian **Trixie** sysroot, GCC **12** (glibc >= 2.40 required for `riscv_hwprobe`) |
| Tier classification | De facto Tier 1 (primary CI/release target) | De facto Tier 1 (primary CI/release target) | **Unclassified / best-effort** -- source compiles, no verification gate |

## 4. Technical Architecture and RISC-V-Specific Subsystems

ANGLE's own riscv64 footprint is minimal: exactly 3 source files contain any `__riscv`/`riscv64` reference, none involving RVV, Zba/Zbb/Zbs, or any bitmanip/vector extension.

| Component | Location | riscv64 exists? | ISA extensions used | Quality |
|---|---|---|---|---|
| Android GL TLS-pointer accessor | `src/common/tls.h` (`ANGLE_ANDROID_GET_GL_TLS`) | Yes | Base ISA only (`mv` instruction) | **Hand-tuned, at parity with other arches.** Single-instruction inline asm `__asm__("mv %0, tp" : "=r"(__val))` reads the thread-pointer register directly, mirroring aarch64's `mrs %0, tpidr_el0`, arm's `mrc p15,...`, and x86/x86_64's `movl %%gs:0`/`mov %%fs:0`. Also defines `kAndroidOpenGLTlsSlot = -5` (vs. `3` for other arches) for the correct bionic TLS slot index. |
| `stddef.h` portability guard | `src/common/platform.h` | Yes | None (preprocessor only) | **Scalar/boilerplate.** `__riscv` added to a list of non-x86 arches (`__mips__`, `__arm__`, `__aarch64__`) needing an explicit `size_t` include. No compute logic. |
| Build-arg 64-bit CPU classification | `gni/angle.gni` | Yes | None (build config) | Config-only. `current_cpu == "riscv64"` added to the 64-bit bucketing list alongside arm64/x64/mips64el/s390x/ppc64/loong64/arm64e. Sets a single boolean flag; no riscv-specific build flags, toolchain, or compile options beyond this. |
| SIMD image-format conversion | `src/image_util/loadimage.cpp` | **No** | N/A | **Missing on riscv64, but not riscv-specific** -- ARM/NEON is equally absent. Only x86 has a `__cpuid`-gated SSE2 path (`ANGLE_LOADIMAGE_USE_SSE`). |
| CPU-dispatch fast-path math | `src/common/mathutil.h` (`roundToNearest`) | **No** | N/A | aarch64-specific fast path exists; no riscv64 branch. |
| RVV/vector intrinsics anywhere in tree | -- | **No** | N/A | Zero hits for `vfloat32m1_t`, `vsetvl`, `vle32`, `riscv_vector`, or any RVV token across the entire repository. |
| Bitmanip/scalar-crypto extensions (Zba/Zbb/Zbs) | -- | **No** | N/A | Zero hits anywhere in the repository. |
| `arch/riscv/` directory or `.S` assembly files | -- | **No** | N/A | No such directory or file exists anywhere in the tree (`src/`, `src/common/`, `src/third_party/`). |
| riscv64 JIT/rendering backend | -- | **No** | N/A | ANGLE itself has no JIT. Its CPU software-rendering fallback (SwiftShader, a separate dependency) does have a JIT with riscv64-specific handling -- see Section 9. |

Comparison table -- amd64 vs arm64 vs riscv64, ANGLE's own code:

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TLS-pointer accessor | Hand-written asm (`%fs:0`) | Hand-written asm (`mrs`) | Hand-written asm (`mv`), at parity |
| Image-load SIMD | SSE2 path present | Absent (same gap as riscv64) | Absent |
| Math fast-path | Generic | aarch64-specific `roundToNearest` | Generic (no riscv64 fast path) |
| Build-arg classification | Present | Present | Present, added 2023 |

## 5. Build System, Cross-Compilation, and Toolchain

ANGLE does not use CMake. Its build system is GN + Ninja via `depot_tools`, inherited from Chromium; there is no `CMakeLists.txt`, `cmake/` directory, `BUILDING.md`, `docs/building.md`, `docs/cross-compilation.md`, or Dockerfile anywhere in the repository (all confirmed absent via full recursive tree scan, 4782 entries, and individual 404 checks). All riscv64 toolchain/sysroot logic lives in Chromium's shared `//build` directory, fetched as a DEPS dependency, not in the ANGLE repo itself.

**Constructed GN command** (not literally documented anywhere in-repo, assembled from `build/toolchain/linux/BUILD.gn` and `build/config/compiler_cpu_abi.gn`):
```bash
fetch angle && cd angle
gn gen out/riscv64 --args='target_cpu="riscv64" target_os="linux" is_clang=true is_debug=false'
autoninja -C out/riscv64
```
For a GCC cross-build: `is_clang=false` plus a `riscv64-linux-gnu-gcc`/`g++` toolchain on `$PATH`, GCC >= 12 recommended.

**Toolchain definitions** (`build/toolchain/linux/BUILD.gn`, shared with Chromium): both a `clang_toolchain("clang_riscv64")` and a `gcc_toolchain("riscv64")` (toolprefix `riscv64-linux-gnu`) are defined.

**Compiler flags** (`build/config/compiler_cpu_abi.gn`): for Clang non-Android builds, `--target=riscv64-linux-gnu` is added to both cflags and ldflags; `-mabi=lp64d` is always added.

**RISC-V extension GN args** (`build/config/riscv.gni`) -- all default to baseline/off:
```
riscv_use_rvv = false
riscv_rvv_vlen = 128
riscv_profile = "rv64gc"
riscv_use_zba = false
riscv_use_zbb = false
riscv_use_zbs = false
riscv_use_zicfiss = false
riscv_use_zicond = false
riscv_use_sv39 = false
```
No RVV or bitmanip extension is enabled by default; ANGLE's own code does not consume these flags for anything riscv-specific.

**Why riscv64 needs a newer sysroot baseline than every other Linux arch:** `build/config/sysroot.gni` pins riscv64 to Debian **Trixie** (`debian_trixie_riscv64-sysroot`) while every other arch uses **Bullseye**. `build/linux/sysroot_scripts/sysroot_creator.py` explains why: `GCC_VERSIONS = {"bullseye": 10, "trixie": 12}` -- riscv64's `riscv_hwprobe` syscall wrapper in glibc requires glibc >= 2.40, which Bullseye's glibc ~2.31 does not provide. The sysroot creator script explicitly strips the `hwprobe.h` header from older-baseline assumptions on riscv64. Pinned package versions in `build/linux/sysroot_scripts/generated_package_lists/trixie.riscv64` include `gcc-12-base_12.4.0-4`, `libc6_2.40-6`, `binutils_2.43.90.20250127-1`, all riscv64.

**Clang version** (same pin for every target, no riscv64-specific override): `CLANG_REVISION = 'llvmorg-23-init-19482-g53d18800'`, auto-downloaded via DEPS.

**Known build failure (fixed):** Google Issue Tracker bug 40096892 documents an exact reproducible failure prior to CL 4530628 -- running `gn gen out/riscv64 --args='target_os="android" target_cpu="riscv64"'` on commit `560ba1c63a` produced:
```
ERROR at //gni/angle.gni:117:5: Assertion failed.
    assert(false, "Unknown current CPU: $current_cpu")
Unknown current CPU: riscv64
```
This was fixed by CL 4530628 adding riscv64 to the recognized-CPU list.

**QEMU usage:** none found anywhere for riscv64 testing of ANGLE itself (zero hits searching `qemu-riscv64`/`qemu riscv` across google/angle, the chromium/chromium mirror, and v8/v8). QEMU is used for riscv64 in the adjacent `android-riscv64`/Cuttlefish emulator project (Section 11), not for ANGLE's own build/test.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles via GN/Ninja | Yes | Yes | Yes (source-level, unverified by CI) |
| Vulkan backend | Yes | Yes (Android) | Yes, unverified -- same source path, no CI gate confirms it builds/runs correctly |
| Desktop GL backend | Yes | N/A (Android uses GLES) | N/A (Android riscv64 uses GLES like arm64) |
| SIMD-accelerated image load (`loadimage.cpp`) | Yes (SSE2) | No | No (same gap as arm64 -- not a riscv64-specific deficiency) |
| Android 32-bit secondary ABI | N/A | Supported (arm has 32-bit legacy) | Explicitly skipped (CL 4563354) -- riscv64 Android is pure 64-bit by design, not a functional gap |
| Automated pixel-correctness testing (Skia Gold) | Yes | Yes | Unclear -- CL 5057086 triggered a "new digest" flag on Skia Gold during CQ dry-run for a new arch combination, manually triaged, but no continuous riscv64 pixel-test lane exists post-merge |
| CI-verified build | Yes | Yes | **No -- zero riscv64 CI builders exist (Section 7)** |

**Functional gaps:** No riscv64 GPU/rendering backend distinct from existing Vulkan/GLES paths exists (none is needed or expected -- ANGLE's role is a translation layer, not a GPU driver). The main functional gap is the complete absence of CI verification: all 4 merged riscv64 CLs were validated only by manual/cross-compile review, not automated build or test.

**Performance gaps:** No riscv64-specific SIMD dispatch exists in ANGLE's own image-conversion code, but this gap is shared with arm64 (not a riscv64 penalty specifically). The one documented, architecturally relevant performance gap is one level down the dependency chain: SwiftShader's Subzero fast-JIT backend explicitly excludes riscv64 (`supports_subzero = current_cpu != "riscv64"` in `src/Reactor/reactor.gni`), forcing riscv64 onto the heavier full-LLVM JIT path for software rendering. No one has published numbers quantifying this gap -- Data not available: quantitative riscv64-vs-arm64 or riscv64-vs-x86 performance benchmarks for ANGLE, searched across GitHub (issues/PRs/code/commits in google/angle, google/swiftshader, google/android-riscv64, google/gfxstream, google/cuttlefish), general web search, RISE blog, and Phoronix (403 Forbidden on direct fetch).

**Security hardening gaps:** PartitionAlloc (Chromium's secure allocator) has a dedicated riscv64 stack-scan assembly implementation (`push_registers_asm.cc`) following the RISC-V calling convention, rated Green -- but PartitionAlloc is opt-in and off by default in ANGLE (`checkout_angle_partition_alloc: False`), so this hardening is not active in default ANGLE builds regardless of architecture. No riscv64-specific security regression or gap versus arm64/amd64 was found in ANGLE's own code.

**NaN/floating-point semantics:** No NaN- or floating-point-semantics-specific RISC-V bugs were found for ANGLE in any search (GitHub issues/PRs/commits for "riscv nan" returned zero results).

## 7. CI/CD Infrastructure

**No riscv64 CI exists, confirmed via exhaustive verification, not partial check.** ANGLE has no `.github` directory at all (`gh api repos/google/angle/contents/.github` returns 404), no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines.yml`. Its actual CI is Chromium's LUCI/Buildbucket system, configured via Starlark in `infra/config/`.

An adversarial-verification pass fetched and grepped all 225 files under `infra/config` by content SHA (13 top-level Starlark files -- `angle_ci.star`, `angle_try.star`, `angle_shared.star`, `binaries.star`, `bundles.star`, `compile_targets.star`, `constants.star`, `gn_args.star`, `main.star`, `mixins.star`, `recipes.star`, `representative_traces.star`, `tests.star` -- plus every generated builder manifest under `generated/builders/ci/` [62 builders] and `generated/builders/try/` [54 builders], plus `generated/luci/cr-buildbucket.cfg` [20,901 lines], `commit-queue.cfg`, `luci-scheduler.cfg`, `luci-milo.cfg`, `luci-logdog.cfg`, `project.cfg`, `realms.cfg`) for "riscv" case-insensitively. **Result: 0 matches in 0 of 225 files.** All 116 real builder names (62 CI + 54 try) target only `android-arm`/`arm64`, `linux-x64`, `mac-x64`/`arm64`, `win-x64`/`x86`/`arm64`.

The only 3 "riscv" hits repo-wide are the source-level lines already covered in Section 4 (`tls.h`, `platform.h`, `gni/angle.gni`) -- none define or trigger a CI job.

No RISE runner usage was found for ANGLE. RISE's `riscv-runner*` repos (generic GitHub Actions RISC-V CI runner infrastructure) exist under the `riseproject-dev` GitHub org but none reference ANGLE or GPU/graphics workloads.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| LUCI CI builders | Present (linux-x64, mac-x64, win-x64, plus try) | Present (android-arm64, mac-arm64, win-arm64, plus try) | **0 of 116 builders** |
| RISE runner usage | N/A | N/A | None found |
| QEMU-based testing | No (native runners) | No (native runners) | No (none found anywhere for ANGLE) |
| Hardware used | Native x64 machines | Native/emulated arm64 | **None -- no infrastructure exists** |

## 8. Distribution and Release Status

ANGLE has no standalone binary release channel for any architecture -- it ships continuously into Chromium/Android via DEPS auto-rolls and in-tree builds, not as a versioned package. This makes riscv64 distribution "not applicable" rather than merely "absent" on most channels: there is no upstream binary artifact of any architecture to check riscv64 against.

| Channel | Result | Evidence |
|---|---|---|
| GitHub Releases | No riscv64 (no releases at all, effectively) | Only 2 releases ever, both 2020-06-17 (`v0.1-test`, `v0.1-test0`), each a single Android APK test asset (`AngleLibraries_6_16_330pm_prerotate.apk`), architecture-generic, predating the riscv64 patches by 2.5 years. `gh api repos/google/angle/releases`/`/tags` otherwise empty. |
| PyPI | Wrong package -- not applicable | `pypi.org/pypi/angle/json` is an unrelated project ("Angle," a speakable programming language by author Pannous, pure-Python `none-any` wheel). Not Google's ANGLE. |
| RISE GitLab wheel builder | Not applicable | `gitlab.com/api/v4/projects/56254198/packages/pypi/simple/angle/` 302-redirects to upstream PyPI, i.e., no such package exists there either. |
| Ubuntu 24.04 (noble) | Package does not exist | Direct lookup returns "No such package." 21 substring matches on unrelated names (`entangle`, `libtriangle-*`, etc.), none is ANGLE. |
| Debian | Package does not exist | `tracker.debian.org/pkg/angle` returns HTTP 404; `sources.debian.org/src/angle/` also 404s. 31 substring matches, none is ANGLE. |
| Arch Linux RISC-V (archriscv) | Package does not exist | Full listing of `core/`, `extra/`, `unsupported/`, `multilib/` repos plus the FTBFS status tracker shows only `angle-grinder` (unrelated log-analysis CLI tool) as a substring match. |
| conda-forge | Feedstock does not exist | `github.com/conda-forge/angle-feedstock` returns 404. |
| vcpkg | Source recipe only, not a verified/prebuilt riscv64 binary | The `angle` port's manifest has no explicit platform exclusion for riscv64, and vcpkg's `triplets/community/` includes `riscv64-linux.cmake`, but this is not evidence of a CI-tested build or a downloadable binary cache entry for riscv64 -- absence of exclusion is not confirmation of success. |

**What a user must do to get a working riscv64 ANGLE:** build from source as part of an Android or Chromium build targeting riscv64, using the GN command in Section 5. There is no path to a standalone prebuilt riscv64 ANGLE binary/package on any channel checked.

## 9. Dependencies

| Name | Role in ANGLE | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| **SwiftShader** ([google/swiftshader](https://github.com/google/swiftshader)) | JIT-compiled software GL/Vulkan rasterizer -- ANGLE's CPU fallback renderer (LLVM Reactor backend) | Partial/broken by default -- needs LLVM 16 for JITLink's riscv64 `InProcessMemoryManager`; the LLVM10->16 default switch (commit `bea72fea`) was reverted 2026-06-08 (commit `5b0479bd`) for unrelated Windows ARM64 reasons, regressing riscv64 back to the broken LLVM10 path | No riscv64 CI at all -- `infra/config/main.star` defines only x64/x86 SwANGLE builders | No official riscv64 binaries | Google-hosted; ongoing external riscv64 patch stream via Alibaba/StarFive/independent contributors. See dedicated report at `project-reports/swiftshader.md` if present in this corpus. |
| **VulkanMemoryAllocator** (GPUOpen-LibrariesAndSDKs) | GPU memory allocator, actively linked into ANGLE's Vulkan backend | Green -- header-only, portable C++, no architecture-specific code found | No dedicated riscv64 CI in the library itself | Header-only; consumed as source | None found (zero riscv64 issues/PRs). Not in `project-reports/scope.yml`. |
| **SPIRV-Tools** (KhronosGroup) | SPIR-V optimizer/validator, statically linked into ANGLE's Vulkan backend | Green -- pure portable C++, no x86 intrinsics | No riscv64-specific CI found; zero riscv64 issues/PRs ever filed | Available -- Debian sid/riscv64 package built and "Installed" (v2026.3~rc1-1) | None found. Not in `project-reports/scope.yml`. |
| **glslang** (KhronosGroup) | GLSL/HLSL -> SPIR-V compiler front-end for the Vulkan backend | Green -- portable C++, no x86 intrinsics | No dedicated riscv64 CI found | Available -- Debian sid/riscv64 "Installed" (v16.4.0-1) | None found. Not in `project-reports/scope.yml`. |
| **SPIRV-Cross** (KhronosGroup) | SPIR-V cross-compiler referenced in Vulkan backend build files | Green (portable C++, no arch-specific code found) | No riscv64 CI found | Not independently verified | None found. Not in `project-reports/scope.yml`. |
| **astc-encoder** (ARM-software) | ASTC texture (de)compression, SIMD-dispatched | Green -- dedicated RVV VLEN=256 backend merged 2026-04-30 (PR #594 by camel-cdr), ~2x speedup over scalar autovec on SpacemiT X60 | Green -- dedicated "Build and test RISC-V" GH Actions workflow (QEMU + Clang-20, RVV256), last 5 runs all passed | Source-only; no dedicated riscv64 binary releases | Clean, recently merged, actively CI'd. Not in `project-reports/scope.yml`. |
| **cpu_features** (google/cpu_features) | Runtime CPU/ISA feature detection, checked out only for Android builds | Green -- dedicated riscv32/riscv64 CMake CI ("RISCV Linux CMake" workflow), last 5 runs on `main` succeeded | Green -- same workflow runs riscv64 tests via QEMU/cross-toolchain, passing | Source/header library, no binary channel | Feature-completeness gaps open: bitmanip/half-precision extension detection (PR #369, #447) unmerged; tracking issue #247 never formally closed. Not the same project as `cpuinfo` (pytorch/cpuinfo) already in `project-reports/scope.yml` -- do not conflate. |
| **Dawn** (google/dawn) | WebGPU implementation backing ANGLE's WGPU renderer | Unclear/partial signal only -- `Platform.h` defines `DAWN_PLATFORM_IS_RISCV64`/`RISCV32` macros wired into 64-bit-detection logic, but no confirmed riscv64 CI | Data not available -- GitHub Issues disabled on google/dawn (`has_issues: false`); Chromium's internal bug tracker not queried | Not verified | [NEEDS VERIFICATION] -- issue tracker inaccessible via GitHub. Not in `project-reports/scope.yml`. |
| **PartitionAlloc** (chromium/src) | Secure/perf memory allocator, opt-in and off by default in ANGLE | Green when enabled -- dedicated riscv64 asm stack-scan implementation (`push_registers_asm.cc`) per RISC-V calling-convention spec | Inherits Chromium's CI; not verified specifically for ANGLE's disabled integration | N/A -- not compiled into default ANGLE builds | None found; low risk given disabled-by-default status. Not in `project-reports/scope.yml`. |
| **zlib** (madler/zlib, via Chromium mirror) | General compression; no direct source-level usage found in ANGLE itself | Green (portable C) | Weak -- only merged CI signal is an OpenBSD/riscv64 target (PR #1139); no Linux riscv64 matrix entry | No riscv64-specific optimization merged | RVV Adler32 PR #1099 stalled since 2025-10 (maintainer unresponsive); duplicate #1267 self-closed in 9 seconds (2026-06). Likely present only for DEPS-file consistency. |
| **libjpeg-turbo** | JPEG codec, DEPS comment states "used by glmark2" (a bundled benchmark tool, not core ANGLE) | Green | Green -- RVV SIMD merged to dev 2026-02-03 (commit `9817c40`), shipped in 3.1.90/3.2 beta | Partial -- source in beta release; maintainer declined riscv64 official release binaries (Issue #885, closed "won't implement") | No riscv64 prebuilt binaries; further DCT/IDCT work (Issue #895) pending for 3.2.1. Tooling dependency, not core render path. |
| **libpng** | Image codec used by ANGLE's test utilities for test-image I/O | Not independently re-verified in this research pass | Not independently re-verified | Not independently re-verified | Test-tooling dependency only. |
| **Abseil-cpp** | C++ foundation library, single confirmed usage site (`src/common/hash_containers.h`) | Not independently re-verified in this research pass | Not independently re-verified | Not independently re-verified | Minimal direct footprint in ANGLE itself. |
| **expat** | XML parser, single usage site, test-only (`DrawBaseVertexVariantsTest.cpp`) | Not independently re-verified in this research pass | Not independently re-verified | Not independently re-verified | Test-only dependency. |
| **Protocol Buffers** | Checked out via DEPS; 0 direct source-usage hits found beyond DEPS/OWNERS/scripts | Not independently re-verified in this research pass | Not independently re-verified | Not independently re-verified | Usage in ANGLE proper unconfirmed -- likely present only for DEPS-file/gclient consistency. |
| **FlatBuffers** | Checked out only for Android builds; 0 direct source-usage hits beyond DEPS/OWNERS/scripts | Not independently re-verified in this research pass | Not independently re-verified | Not independently re-verified | Usage in ANGLE proper unconfirmed. |

**Deep-dive: SwiftShader** (the dependency with the most consequential riscv64 gaps):
- **Subzero JIT exclusion:** `src/Reactor/reactor.gni` explicitly states *"Subzero doesn't support ARM64, LOONGARCH64, MIPS64, PPC64, and RISCV64 (only x86 and ARMv7a)"* (`supports_subzero = current_cpu != "arm64" && ... && current_cpu != "riscv64"`). riscv64 is forced onto the heavier full-LLVM JIT backend, a known but unquantified performance trade-off.
- **LLVMJIT.cpp riscv-specific tuning:** forces `ObjectLinkingLayer` (not legacy RTDyld) on riscv/loongarch; manually adds CPU features (`+m,+a,+f,+d,+c`) since LLVM's `getFeatures()` does not auto-detect them on RISC-V; must use `CodeModel::Medium` since the default `Small` causes an "Unsupported riscv relocation" error.
- **LLVM version regression:** the LLVM10->16 default switch needed for JITLink's riscv64 `InProcessMemoryManager` was reverted 2026-06-08 for unrelated Windows ARM64 reasons, regressing riscv64 back onto the broken LLVM10 path -- an active, unresolved cross-architecture conflict as of this report.
- **StarFive contribution:** Rebecca Chang (`rebecca.chang@starfivetech.com`) landed 4 riscv64-specific SwiftShader commits in 2022-2023 (Subzero exclusion note, LLVM-10 riscv64 configs, marl riscv64 source file) -- the only identified RISC-V silicon vendor contribution anywhere in the ANGLE dependency chain.
- **Ongoing maintenance:** a build-breakage fix ("Fix riscv64 build problem with LLVM 16," `rsworktech@outlook.com`, 2025-12-08) rolled into ANGLE via CL 7240928, confirming riscv64 SwiftShader/LLVM16 builds broke and needed a fix as recently as two months before this report's research cutoff.

**Caveats:**
1. `project-reports/scope.yml`'s "cpuinfo" entry points to `pytorch/cpuinfo`, a completely different codebase from ANGLE's actual dependency `google/cpu_features`. Do not conflate the two.
2. ANGLE vendors `third_party/llvm/src` (gated by `checkout_angle_cl_deps`, for the OpenCL/clspv path), and SwiftShader bundles its own separate LLVM copy for JIT codegen. `project-reports/scope.yml`'s "LLDB" entry covers only the LLVM Project's debugger, not general RISC-V backend/codegen quality that SwiftShader's JIT depends on.
3. Dawn's GitHub issue tracker is disabled, so riscv64 blocking-issue data for Dawn is incomplete via GitHub alone.
4. zlib, protobuf, and flatbuffers show no confirmed source-level usage inside `google/angle` itself -- most plausibly present only to keep the standalone DEPS file consistent with Chromium's, not because ANGLE's build compiles against them directly. Treat their dependency status with more caution than VulkanMemoryAllocator, SPIRV-Tools, glslang, and SwiftShader, which have confirmed, load-bearing source-level integration.

## 11. Known Bugs and Active Issues

ANGLE's own GitHub mirror has zero riscv-related issues or PRs (Issues disabled repo-wide; the 7 open items on the mirror are all pull-request-adjacent artifacts, none RISC-V related). All riscv-touching work in ANGLE's own history is merged and closed as fixes, not open bugs. The relevant open/closed items live either in ANGLE's Google Issue Tracker (Buganizer) entries or in the adjacent `google/android-riscv64` emulator-tracker repo, which exercises ANGLE via Cuttlefish/gfxstream.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Buganizer 42050595](https://issues.angleproject.org/issues/42050595) | RISC-V toolchain support (Chromium-wide umbrella, not ANGLE-specific) | Open (status code 2, "Assigned"), priority 1, severity 4 | High (umbrella) | Parent of ANGLE's own bug 40096892; tracks dozens of Gerrit CLs across `chromium/src` and `depot_tools`. Confirms ANGLE's riscv64 support rides on top of Chromium's broader toolchain effort, not an ANGLE-driven initiative. |
| [Buganizer 40096892](https://issues.angleproject.org/issues/40096892) (`angleproject:8165`) | gn gen fails for riscv64 android build on Ubuntu 18.04.6 | Fixed (via CL 4530628/4563354) | Priority 3, severity 8 in raw payload | Concrete, reproducible blocker, now resolved. Full repro steps and exact assertion-failure text captured in Section 5. |
| [Buganizer 42266847](https://issues.angleproject.org/issues/42266847) (`angleproject:8423`) | Add riscv support (tracking bug opened by Yahan Lu after CL 5057086) | Open, but dormant | Low priority/severity (status 1/3/5) | Title-only, no description body, zero comments, zero activity since 2023-11-23 creation. Closest thing to a "master riscv tracking bug" for ANGLE, but effectively unused. |
| [android-riscv64 PR #125](https://github.com/google/android-riscv64/pull/125) | Use qemu and virgl by default | Open (filed 2023-11-30) | Medium (usability/default config) | Proposes documenting/defaulting to `--gpu_mode=gfxstream_guest_angle_host_swiftshader` as the software-rendering fallback for riscv64 guests. Still unmerged. |
| [android-riscv64 Issue #85](https://github.com/google/android-riscv64/issues/85) | Cuttlefish riscv64 boot fails with `--gpu_mode=drm_virgl` | Closed (2023-04-19) | High (boot failure) | "Failed to initialize display... prerequisites for accelerated rendering were not detected." |
| [android-riscv64 Issue #96](https://github.com/google/android-riscv64/issues/96) | Video playback color corruption on riscv64 under `drm_virgl` + VNC | Closed (2023-06-20, resolved 2023-08-24) | Medium (correctness, visual) | Google engineer confirmed "it does not appear to be riscv specific (affects both arm64 and riscv64)" -- a Cuttlefish/VirglRenderer interaction issue, not an ANGLE or riscv64-specific bug. Redirected to internal tracker `issuetracker.google.com/issues/297192837`. |
| [android-riscv64 Issue #123](https://github.com/google/android-riscv64/issues/123) | Cuttlefish riscv64 launch failures | Closed (2023-11-22, resolved 2023-11-27) | High (launch failure) | Traced to buggy QEMU versions interacting with `drm_virgl`; fixed by building QEMU from ToT plus a Bionic fix disabling vectorized string/memory routines under QEMU. |

**Correctness bugs highlighted separately:** Issue #96 (video color corruption) is the only correctness-category bug found, and it was explicitly determined to be non-riscv-specific (also affects arm64) -- it is a Cuttlefish/VirglRenderer bug, not an ANGLE or RISC-V-architecture correctness issue. No NaN/floating-point correctness bugs specific to RISC-V were found for ANGLE.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. Review threads for all 4 CLs show no rejected changes, no controversy, and no extended debate. The only friction was administrative: Elliott Hughes's CL 4104471 required a follow-up discussion about generating the corresponding `Android.bp` file (auto-generated via `scripts/roll_aosp.sh`, not present in the Chromium tree) and Cody Northrop asking about `AUTHORS`/`CONTRIBUTORS` file conventions for CL 4530628 ("Change LGTM, but over to Geoff as I'm not sure how AUTHOR vs CONTRIBUTOR works") -- notably, the second reviewer ("Geoff") was never actually looped in before Northrop unilaterally approved and merged, but this reflects process informality, not an objection.

**Technical blockers:**
- No riscv64 CI exists to catch regressions -- all future riscv64-touching changes (including transitive SwiftShader rolls) merge without architecture-specific validation.
- SwiftShader's Subzero JIT exclusion and the LLVM10/16 version conflict (Section 9) are unresolved technical blockers to a fully-optimized software-rendering fallback on riscv64.
- Dawn's WebGPU riscv64 status is [NEEDS VERIFICATION] -- issue tracker inaccessible.

**Organizational blockers:**
- Coordination happens in the login-gated Chromium/ANGLE issue tracker (Buganizer), not in a public, easily-discoverable venue -- the nominal "master tracking bug" (42266847) is dormant and was explicitly declared complete by its own filer ("There no more riscv changes") one day after creation.
- No Google-initiated RISC-V roadmap or internal advocacy was found -- all riscv64 work originated externally (Alibaba, ISCAS), with Google acting only as reviewer/gatekeeper. This means further riscv64 investment in ANGLE has no internal champion inside Google to coordinate with; a new contributor would need to build institutional relationships from scratch, as the ISCAS/Alibaba contributors did.

**Acceptance probability:** High for well-scoped, mechanical patches (100% of submitted riscv64 CLs to date were merged, most within 1-3 days). The demonstrated pattern (small, single-purpose CLs, tracked against a bug number, cleanly reviewed) suggests low organizational resistance to further contributions of similar scope (e.g., a riscv64 CI builder, a Dawn riscv64 fix, or a SwiftShader Subzero/LLVM-version fix). No evidence suggests larger structural changes (e.g., a dedicated RISC-V GPU backend, which is not applicable here since ANGLE is a translation layer) would face different treatment, but none has been attempted to calibrate against.

## 13. Investment Analysis

**Work already done/funded:** RISE Project has **no involvement with ANGLE** -- confirmed by checking all 32 RISE blog posts (2024-05 through 2026-07, full sitemap enumeration), WebSearch queries, the RISE GitLab wheel builder (74 packages, no "angle"), and all 50 repos in the `riseproject-dev` GitHub org (0 repository-search hits, 9 code-search hits that are all false positives from this same report repository's own pre-existing third-party reports mentioning ANGLE as a dependency, not RISE-authored ANGLE work). All riscv64 enablement to date (4 merged CLs, Dec 2022-Nov 2023) was funded/performed by Alibaba and ISCAS engineers, with ongoing low-level SwiftShader maintenance from independent contributors (StarFive, `rsworktech@outlook.com`) through Dec 2025. No RISE funding or engineering time has been spent on ANGLE. This means the sizing below is genuinely uncovered work, not duplicative of RISE efforts.

### 13.1 Functional Enablement

Core functional enablement (compiling ANGLE for riscv64 Android) is complete and merged. Remaining functional gaps:
- Verify/fix Dawn (WebGPU backend) riscv64 status -- currently [NEEDS VERIFICATION], issue tracker inaccessible via GitHub.
- Resolve the SwiftShader LLVM10/16 default-version conflict so riscv64 gets the JITLink-compatible LLVM16 path without breaking Windows ARM64 (currently regressed as of 2026-06-08).
- Land a Subzero JIT backend for riscv64 in SwiftShader, or explicitly document/accept the full-LLVM-JIT performance trade-off.

### 13.2 Performance Optimization

No quantitative riscv64 performance data exists for ANGLE anywhere (Section 6). Before any optimization investment, baseline benchmarking is needed:
- Establish FPS/frame-time benchmarks for ANGLE-mediated Vulkan/GLES workloads on riscv64 hardware (e.g., via Cuttlefish or real SBCs), comparing SwiftShader-software-rendered vs. hardware-GPU-passthrough paths.
- Quantify the Subzero-exclusion performance gap (full-LLVM JIT vs. Subzero) on riscv64 to determine if a Subzero backend port is worth the investment.
- No riscv64 SIMD image-load path exists (`loadimage.cpp`), but this is also missing on arm64, so it is a general (not riscv64-specific) gap; low priority unless arm64 gets one first.

### 13.3 CI/CD Infrastructure

Zero riscv64 CI exists in ANGLE's LUCI system (116 builders, 0 riscv64). This is the single highest-leverage gap: every future riscv64 change (in ANGLE or its dependencies) merges unverified.
- Add a riscv64 compile-only LUCI builder (GN + Ninja, Clang, Debian Trixie sysroot) to the `try` bucket at minimum, mirroring the existing linux-x64 builder configuration.
- Add QEMU-based riscv64 test execution once compile-only CI is stable (no existing precedent found for ANGLE; would be new infrastructure).
- This requires Google-side LUCI/Buildbucket configuration access -- an external contributor cannot add production CI builders unilaterally; requires coordination with Google OWNERS (Cody Northrop, Yuly Novikov have been the reviewers of record for riscv64 changes to date).

### 13.4 Ecosystem Enablement

Not applicable as a distinct workstream -- ANGLE has no standalone package ecosystem (Section 10 omitted; see below). The relevant ecosystem-adjacent work is ensuring SwiftShader, Dawn, and the Vulkan/SPIR-V toolchain dependencies (SPIRV-Tools, glslang, SPIRV-Cross -- already Green on riscv64 per Section 9) remain riscv64-clean as ANGLE rolls new versions of each.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify and, if needed, fix Dawn (WebGPU) riscv64 build/test status | 1-2 | External contributor + Google Dawn OWNERS | Medium |
| Functional | Resolve SwiftShader LLVM10/16 default-version conflict for riscv64 JITLink support without regressing Windows ARM64 | 2-4 | External contributor + Google SwiftShader OWNERS | High |
| Functional | Port/implement a SwiftShader Subzero JIT backend for riscv64 (or formally document the full-LLVM-JIT trade-off) | 4-8 | External contributor with LLVM/JIT expertise | Medium |
| Performance | Establish riscv64 baseline benchmarks (FPS/frame-time) for ANGLE-mediated workloads, software- and hardware-rendered | 2-3 | External contributor with riscv64 hardware access | High (prerequisite for all further perf work) |
| Performance | Quantify and, if justified, close the Subzero-exclusion performance gap on riscv64 | 2-4 (after baseline) | External contributor | Medium |
| CI/CD | Add a riscv64 compile-only LUCI `try` builder for ANGLE | 2-3 (incl. coordination overhead with Google OWNERS) | External contributor + Google Northrop/Novikov | Critical |
| CI/CD | Add riscv64 QEMU-based test execution to LUCI once compile CI is stable | 3-5 | External contributor + Google OWNERS | High |
| CI/CD | Add riscv64 to SwiftShader's own `infra/config/main.star` SwANGLE builder set | 2-3 | External contributor + Google SwiftShader OWNERS | High |

## 14. Updates

(No updates yet -- initial report dated 2026-06-17.)

## 15. References

- [google/angle GitHub mirror](https://github.com/google/angle)
- [chromium.googlesource.com/angle/angle (canonical repo)](https://chromium.googlesource.com/angle/angle)
- [CL 4104471 - Add riscv64 support](https://chromium-review.googlesource.com/c/angle/angle/+/4104471)
- [Commit 0f3aaeb](https://github.com/google/angle/commit/0f3aaebf742f0ac16360a1191d75f99843d1b255)
- [CL 4530628 - support 64-bit builds on riscv64](https://chromium-review.googlesource.com/c/angle/angle/+/4530628)
- [Commit 9de2cfb](https://github.com/google/angle/commit/9de2cfb06593d3ddf7ceb4cd125ff2b23b347db3)
- [CL 4563354 - skip 2nd abi support](https://chromium-review.googlesource.com/c/angle/angle/+/4563354)
- [Commit 713c80c](https://github.com/google/angle/commit/713c80c15f46efc224587dad08917ccbb5dc8b2f)
- [CL 5057086 - Add riscv support](https://chromium-review.googlesource.com/c/angle/angle/+/5057086)
- [Commit 1bdb403](https://github.com/google/angle/commit/1bdb403899f2040a7b816b3261f13a48914d439c)
- [CL 7240928 - SwiftShader roll with riscv64 LLVM16 fix](https://chromium-review.googlesource.com/c/angle/angle/+/7240928)
- [Commit 6ac068c](https://github.com/google/angle/commit/6ac068c12fa5a3163993ecefebecd462efca50cf)
- [Commit 87632d6 - SwiftShader roll, riscv android configs](https://github.com/google/angle/commit/87632d6457b7b7aea552c9c9456fb6367e307bd0)
- [Commit 2cb264b - SwiftShader roll, StarFive riscv64 commits](https://github.com/google/angle/commit/2cb264b5adfc7188b51cddfe39dad7bd1593b635)
- [Google Issue Tracker 42050595 - RISC-V toolchain support (umbrella)](https://issues.angleproject.org/issues/42050595)
- [Google Issue Tracker 40096892 - gn gen fails for riscv64 android build](https://issues.angleproject.org/issues/40096892)
- [Google Issue Tracker 42266847 - Add riscv support (tracking bug)](https://issues.angleproject.org/issues/42266847)
- [android-riscv64 PR #125](https://github.com/google/android-riscv64/pull/125)
- [android-riscv64 Issue #85](https://github.com/google/android-riscv64/issues/85)
- [android-riscv64 Issue #96](https://github.com/google/android-riscv64/issues/96)
- [android-riscv64 Issue #123](https://github.com/google/android-riscv64/issues/123)
- [SwiftShader reactor.gni - Subzero riscv64 exclusion](https://github.com/google/swiftshader/blob/6b8d31709ad185dbd64e80865e830a9dbe8e7559/src/Reactor/reactor.gni)
- [SwiftShader LLVMJIT.cpp - riscv JIT handling](https://github.com/google/swiftshader/blob/6b8d31709ad185dbd64e80865e830a9dbe8e7559/src/Reactor/LLVMJIT.cpp)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE working groups migration to GitHub (2026-07-30)](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [PyPI angle package (unrelated project)](https://pypi.org/pypi/angle/json)
- [Debian tracker - angle (404, package does not exist)](https://tracker.debian.org/pkg/angle)
- [Ubuntu packages - angle (does not exist)](https://packages.ubuntu.com/noble/angle)
- [Arch Linux RISC-V port (archriscv)](https://archriscv.felixc.at/)
- [conda-forge angle-feedstock (404, does not exist)](https://github.com/conda-forge/angle-feedstock)