---
title: GSI/Treble/VINTF
parent: Project Reports
color: orange
dependencies:
  - name: Soong
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Bionic
    relation: runtime-dependency
    criticality: critical
  - name: ART
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: TinyXML2
    relation: runtime-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: Cuttlefish
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="gsi-treble-vintf" %}

# GSI/Treble/VINTF

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-25<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux and riscv64/android) support status for GSI/Treble/VINTF<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

GSI (Generic System Image), Project Treble and VINTF (vendor interface object) are parts of one Android architecture. They split the Android framework (system) from the vendor implementation, and they define what a device must declare so that the two can be updated independently.

- **Treble:** HAL stability through HIDL and AIDL. [Android architecture overview](https://source.android.com/docs/core/architecture)
- **VINTF:** HAL manifests, framework compatibility matrices and kernel requirements, checked by `libvintf`. [VINTF documentation](https://source.android.com/docs/core/architecture/vintf)
- **GSI:** a pure-AOSP system image that boots on any Treble-compliant device and is used for compliance testing. The official GSI page lists `gsi_arm`, `gsi_arm64`, `gsi_x86` and `gsi_x86_64`. [Generic system images](https://source.android.com/docs/core/tests/vts/gsi)

The repository assessed is [platform/system/libvintf](https://android.googlesource.com/platform/system/libvintf). It is C++ built only by Soong inside an AOSP tree. It has no CMake, configure script, Dockerfile or README. Its modules are:

- `libvintf` (a `cc_library` with `host_supported` and `recovery_available`)
- `vintf` (a `cc_binary`)
- the host tools `checkvintf`, `assemble_vintf` and `vintffm`
- static libraries `libassemblevintf`, `libvintffm` and `libkernelconfigs`

**Governance.** No foundation owns this project.

- All three components belong to AOSP and are controlled by Google. Governance is by Gerrit OWNERS files on android.googlesource.com. No foundation membership, steering committee or MAINTAINERS file was found.
- libvintf OWNERS (bug component 192869) are devinmoore, smoreland, elsk, malchev, sspatil and rseymour (Apex files only), all @google.com.
- Commit counts in a blobless clone of libvintf: Yifan Hong 2954, Treehugger Robot 257, android-build-team Robot 238, Devin Moore 231, Steven Moreland 229. The bot counts are automated commits.
- The GSI page describes a trunk-stable model. The `DESSERT-gsi` branch is not a development branch and takes only cherry-picks from `android17-release`. GSI bugs go to the public issue tracker. [Generic system images](https://source.android.com/docs/core/tests/vts/gsi)
- License: the documentation says only "Content License". AOSP code is Apache-2.0 per the `aosp_riscv64.mk` header that was read. The libvintf NOTICE contents were not retrieved. [NEEDS VERIFICATION for libvintf specifically]

**Corporate sponsors and community stance.**

- Google is a Premier member of RISE, alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive and Tenstorrent. [RISE members](https://riseproject.dev/members/) RISE membership is Google-wide. GSI, Treble and VINTF are not a separate RISE project.
- Google's October 2023 post invites community collaboration through the android-riscv64 GitHub project and the RISC-V Android SIG mailing list. It calls support "maturing" and "ready to allow experimentation and collaboration". [Android and RISC-V: What you need to know to be ready](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html)
- The stance is supportive but gated. In April/May 2024 Google removed riscv64 from the Android Common Kernel (ACK) and GKI. It said Android will continue to support RISC-V but is not ready to provide a single supported image for all vendors. [The Register](https://www.theregister.com/on-prem/2024/05/01/google-pulls-risc-v-support-from-generic-android-kernel/918929)
- Community Treble GSIs (phhusson/TrebleDroid) are unofficial and list only ARM64 and x86. [phhusson GSI list](https://github.com/phhusson/treble_experimentations/wiki/Generic-System-Image-(GSI)-list)

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-10-03 (committed 2022-10-05) | Colin Cross: "Add initial files for aosp_riscv64 target" (`dac728895d`, Bug 250918230). Adds `generic_riscv64` board, `aosp_riscv64` product and the riscv64 clang/combo makefiles. Tested with `lunch aosp_riscv64-userdebug && m ALLOW_MISSING_DEPENDENCIES=true nothing`. | [build dac728895d](https://android.googlesource.com/platform/build/+/dac728895d) |
| 2022-10-21 | `ALLOW_MISSING_DEPENDENCIES=true` set in `generic_riscv64/BoardConfig.mk` (Gerrit 2263925) | [Gerrit](https://android-review.googlesource.com/) |
| 2022-11-01 | "HACK: disable most of the build for riscv64" (`f310841384`). Comments out inherited makefiles including `gsi_release.mk` so `m droid` passes. | [build f310841384](https://android.googlesource.com/platform/build/+/f310841384%5E%21/) |
| 2022-11 | Google starts accepting RISC-V patches, including GKI patches | [Google blog](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html) |
| 2022-12-08 | Cuttlefish "Add RISC-V 64-bit support" (Gerrit 2308540) | [Gerrit](https://android-review.googlesource.com/) |
| 2023-01-19/20 | `aosp_riscv64` added to `AndroidProducts.mk` for `TARGET_BUILD_APPS` (`4dc7c85153`) | [Gerrit](https://android-review.googlesource.com/) |
| 2023-02-10/14 | Cuttlefish switches riscv64 to OpenSBI firmware because Linux crashed early under the U-Boot machine-mode setup (`03459f614`, Gerrit 2431098) | [Gerrit](https://android-review.googlesource.com/) |
| 2023-02-21 (committed 2023-03-23; Gerrit merged 2023-03-24) | "Build the whole platform for aosp_riscv64" (`c9cb74d257`). Re-enables `mainline_system.mk` and the GSI settings. | [build c9cb74d257](https://android.googlesource.com/platform/build/+/c9cb74d257) |
| 2023-03-22/24 | Cuttlefish `aosp_cf_riscv64_phone` and `aosp_cf_riscv64_wear` products added | [Gerrit](https://android-review.googlesource.com/) |
| 2023-04-18/24 | `MODULE_BUILD_FROM_SOURCE` moved out of `gsi_release.mk` into product makefiles including `aosp_riscv64` (`105610bdf0`, Bug 278607630) | [Gerrit](https://android-review.googlesource.com/) |
| 2023-06-12/30 | `module_riscv64` banchan target for APEX/mainline builds (`08c381b8b2`, Bug 271573990) | [Gerrit](https://android-review.googlesource.com/) |
| 2023-06-14/15 | `aosp_cf_riscv64_minidroid` uses the minidroid vendor manifest (`06cae6d9a`) | [Gerrit](https://android-review.googlesource.com/) |
| 2023-09-02 | Tag `android-14.0.0_r1`, the first release tag carrying `aosp_riscv64` and `generic_riscv64` | [aosp_riscv64.mk](https://android.googlesource.com/platform/build/+/refs/heads/main/target/product/aosp_riscv64.mk) |
| 2023-10-30 | Google blog post announcing RISC-V support in AOSP. Baseline: rva22 profile plus vector and vector crypto. | [Google blog](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html) |
| 2023-11-02 | Issue #117 "VTS can't work." opened | [issue 117](https://github.com/google/android-riscv64/issues/117) |
| 2024-02-12/16 | Widevine excluded from RISC-V Cuttlefish images (`81634ff43`) | [Gerrit](https://android-review.googlesource.com/) |
| 2024-04/05 | Matthias Maennich's "Remove ACK's support for riscv64" merged into `android15-6.6` and `android-mainline`. Described as removing kernel, kernel build and emulator support. | [CNX Software](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/) |
| 2024-05-13/14 | Cuttlefish `9300136e9`: in-guest KeyMint on all platforms other than riscv64 (Bugs b/339926078, b/332977378) | [cuttlefish 9300136e9](https://android.googlesource.com/device/google/cuttlefish/+/9300136e9) |
| 2024-11-12 | Issue #117 closed as not planned | [issue 117](https://github.com/google/android-riscv64/issues/117) |
| 2025-02-03 | Cuttlefish "Selects default riscv64 bootloader binary" (Gerrit 3472451), first in `android-16.0.0_r1` | [Gerrit](https://android-review.googlesource.com/) |
| 2025-03-17 | Last libvintf commit visible in the public `main` branch (`9a095008`) | [libvintf](https://android.googlesource.com/platform/system/libvintf) |
| 2025-03-26 | Last visible `platform/build` commit. "Delete arch variant makefiles" (Gerrit 3555827) first in `android-16.0.0_r3`. | [build](https://android.googlesource.com/platform/build) |
| 2025-05-30 | Tag `android-16.0.0_r1` still carries the riscv64 product and board files | [generic_riscv64](https://android.googlesource.com/platform/build/+/refs/heads/main/target/board/generic_riscv64/) |
| 2025-10-06/08 | Issue #168: Google states no prebuilt riscv64 image and no suitable hardware, and recommends QEMU | [issue 168](https://github.com/google/android-riscv64/issues/168) |
| 2026-10-20 | RISE announces "RISE Android 17 v1.0" (RP024), board-level images for SpacemiT K3 and Alibaba A210 | [RISE Android 17 post](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/) |

**First release with riscv64.** Android 14 (`android-14.0.0_r1`, 2023-09-02) is the first release carrying `aosp_riscv64` and `generic_riscv64`.

- The files are absent from `android-13.0.0_r1` (2022-07-12), `android12-release` and `android12L-release`. They are present in the Android 14, 15, 16 and 17 tags.
- Google's blog post names no Android release, so the attribution to Android 14 rests on the tag and branch inspection above.
- For Gerrit changes 2546591, 2622111, 2625730 and 2654583, Gerrit reported `android-14.0.0_r29` as the earliest tag. That tag may sit on a later release branch. It was not cross-checked.
- Sources disagree on when `module_riscv64` for mainline builds arrived: Android 15 by one source, mid-2023 by the Gerrit data. [NEEDS VERIFICATION]

**Key contributors.**

- Colin Cross authored the initial build changes. His organisation is not stated in the findings. [NEEDS VERIFICATION]
- A. Cody Schuffelen authored the Cuttlefish KeyMint change.
- enh-google and prashanthswami are the maintainers on `google/android-riscv64`.
- Lars Bergstrom and Greg Simon wrote the Google blog post.
- Ludovic Henry (Qualcomm) authored the RISE Android 17 post. BayLibre did the RP024 engineering.

**Fully upstream?** The `aosp_riscv64` product, the board and the Cuttlefish riscv64 targets are upstream AOSP. RISE's Android 17 images are downstream (see Section 13). The Gitee/GitHub `aosp-riscv` project (T-Head/XuanTie C910, `ice910dk` board) is a separate downstream effort and was not examined in depth. [aosp-riscv (gitee)](https://gitee.com/unicornx/aosp-riscv)

## 3. Upstream Support Tier

**Formal tier policy.** None was found for GSI, Treble, VINTF or AOSP architectures. The official GSI list works as a de facto tier: ARM and x86 are supported GSI targets. riscv64 is Cuttlefish/emulator-only, userdebug-oriented and experimental. GSI compliance testing uses `gsi_$arch-user` builds for devices launching with Android 11 through 15, and GSIs are mandated for ARM and x86 only. [Generic system images](https://source.android.com/docs/core/tests/vts/gsi) (second statement: one source only) [NEEDS VERIFICATION]

**Evidence.**

- `aosp_riscv64.mk` describes itself as a GSI. It is "geared toward ... the emulator" and "might not be entirely appropriate to inherit from for on-device configurations". [aosp_riscv64.mk](https://android.googlesource.com/platform/build/+/refs/heads/main/target/product/aosp_riscv64.mk)
- The README in the Google repo reports (2025Q2) that Cuttlefish boots ART to the home screen. It needs QEMU 8.1 or newer and takes about ten minutes to reach the home screen on a fast workstation. The NDK riscv64 ABI is "not yet defined" and NDK support is provisional. [google/android-riscv64](https://github.com/google/android-riscv64)
- The riscv64 pieces are not release-blocking, and no official binaries were found.

| Aspect | amd64 (x86_64) | arm64 | riscv64 |
|---|---|---|---|
| GSI on official GSI list | `gsi_x86_64` | `gsi_arm64` | None ([GSI list](https://source.android.com/docs/core/tests/vts/gsi)) |
| Android 17 GSI download page (first 100,000 of 716,272 characters read) | `aosp_x86_64` | `aosp_arm64` | Not in the portion read [NEEDS VERIFICATION] |
| `prebuilts/vndk/v34` | `x86`, `x86_64` | `arm`, `arm64` | No `riscv64` directory ([v34](https://android.googlesource.com/platform/prebuilts/vndk/v34/+/refs/heads/main)) |
| `kernel/configs` conditional fragments | `CONFIG_X86_64` | `CONFIG_ARM`, `CONFIG_ARM64` | No entries ([kernel/configs](https://android.googlesource.com/kernel/configs)) |
| In-guest KeyMint on Cuttlefish | Yes | Yes | No, excluded by `9300136e9` |
| pvmfw built with GSI | Not built (arm64 only) | Built for `%_arm64` products | Not built |
| GKI | Data not available beyond Section 4 | Data not available beyond Section 4 | Removed from ACK in 2024 (see Section 4) |
| CTS/VTS on GSI | Data not available: not searched per arch | Data not available: not searched per arch | None found |

## 4. Technical Architecture and RISC-V-Specific Subsystems

**Key finding.** Treble's HAL stability (AIDL/HIDL) and VINTF are architecture-neutral. All riscv64-specific code is in the build system, product makefiles, Cuttlefish device configuration and the kernel configuration, not in libvintf.

| Component | amd64 | arm64 | riscv64 | Quality / notes |
|---|---|---|---|---|
| libvintf `Arch` enum (`include/vintf/Arch.h`) | `ARCH_EMPTY`, `ARCH_32`, `ARCH_64`, `ARCH_32_64` | same | same (64-bit) | Describes HAL bitness, not the ISA. No riscv code needed. |
| libvintf `RuntimeInfo-target.cpp` | stores `uname().machine` as `mHardwareId` | same | same | No branch on the value. Reported only in JSON (`main.cpp`) and the string dump (`parse_string.cpp`). |
| libvintf tests | Data not available | arm64 fixtures only | none | `TEST_MAPPING` has no arch filter. |
| Compatibility matrices (levels 5-8, 202404, 202504, 202604) | no arch strings | no arch strings | no entries | Architecture-neutral. |
| `kernel/configs` conditionals | `CONFIG_X86_64` | `CONFIG_ARM`, `CONFIG_ARM64` | none | A riscv64 kernel matches only unconditional requirements. |
| Soong (`android/arch.go`) | present | present | `Riscv64 = newArch("riscv64", "lib64")`, in the Android OS arch list | Implemented. |
| Soong `riscv64_device.go` | n/a | n/a | triple `riscv64-linux-android`, `-march=rv64gcv_zba_zbb_zbs`, `-mno-implicit-float`, `-Wl,-z,max-page-size=4096`, `-Wl,-mllvm -Wl,-jump-is-expensive=false` | Vector is mandatory in the baseline. [riscv64_device.go](https://android.googlesource.com/platform/build/soong/+/refs/heads/main/cc/config/riscv64_device.go) |
| Tradefed `AbiUtils.java` | present | present | `ABI_RISCV64`, `ARCH_RISCV64`, `RISCV_ABIS`, in 64-bit ABI list | Test harness knows the ABI. |
| pvmfw / AVF | non-protected testing only | reference implementation | not built | `gsi_release.mk`: "pvmfw currently only supports AArch64" (b/376363989). [AVF architecture](https://source.android.com/docs/core/virtualization/architecture) says the reference implementation is "limited to ARM64". |
| KeyMint on Cuttlefish | in-guest | in-guest | host-side | `9300136e9`. |
| Widevine | enabled | enabled | excluded (`LOCAL_ENABLE_WIDEVINE := false`) | `81634ff43`. |
| RenderScript | n/a | n/a | disabled (`config.disable_renderscript=1`) | TODO b/206676167, "not supported on this architecture". |
| Host tools `bcc`, `ld.mc` | n/a | n/a | filtered from the host-module check | Old LLVM dependency, `core/main.mk` lines 1132-1138. |
| dexpreopt | n/a | n/a | "Disable dexpreopt for aosp_riscv64" merged twice in 2023 (Gerrit 2450642, 2448667) | Current state not verified. |

**GKI/kernel.**

- `generic_riscv64/README.txt` says the target is "also the target to build the generic kernel image (GKI)". The ACK riscv64 turndown (2024) makes that statement stale for current branches.
  - On `android-mainline`, `android16-6.12` and `android15-6.6`, `BUILD.bazel` has 0 riscv hits.
  - `android14-6.1` has 15 hits and still has `arch/riscv/configs/gki_defconfig`.
- The `kernel/common` repository also has a branch `android-mainline-riscv64` tracking upstream (v7.3 merges) with `arch/riscv/configs/gki_defconfig` (701 lines) and riscv64 GKI module lists in `BUILD.bazel`. It found no `androidNN-X.Y` riscv64 branches, so no KMI-stable riscv64 release branch. Sources disagree on whether `BUILD.bazel` carries riscv64 module lists on mainline. [NEEDS VERIFICATION]
- Cuttlefish riscv64 uses a prebuilt kernel from `device/google/cuttlefish_prebuilts/kernel/mainline-riscv64` (`TARGET_KERNEL_USE ?= mainline`), not an ACK GKI. [cuttlefish vsoc_riscv64](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/vsoc_riscv64/)

Data not available: JIT, GC barrier or SIMD implementation details for ART and Bionic on riscv64. This research covered the Treble/VINTF layer and the product build, not the runtime internals.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** Soong inside an AOSP tree. libvintf has no `arch:` blocks. Compiler flags are `-Wall -Werror -Wextra-semi -Wshadow`. Private dependencies are `libbase`, `liblog`, `libselinux`, `libtinyxml2` and `libz`.

**Toolchain.**

- `build/soong/cc/config/global.go` sets `ClangDefaultVersion = "clang-r547379"` (Clang 20). It can be overridden with `LLVM_PREBUILTS_VERSION` and `LLVM_RELEASE_VERSION`. AOSP is Clang-only and states no GCC version. [global.go](https://android.googlesource.com/platform/build/soong/+/refs/heads/main/cc/config/global.go)
- riscv64 baseline is `-march=rv64gcv_zba_zbb_zbs`.
- `-mno-implicit-float` is a workaround with the comment "remove when qemu V works" (QEMU issue 1976 on gitlab.com/qemu-project/qemu).
- The `-jump-is-expensive=false` link flag has the comment "remove when clang default changed" (google/android-riscv64 issue 124).

**Exact commands.**

GSI-style product (as used in the commit test lines; not run in this research):

```
source build/envsetup.sh
lunch aosp_riscv64-userdebug
m
```

Cuttlefish flow from the project README:

```
cd aosp
source build/envsetup.sh
lunch aosp_cf_riscv64_phone-trunk_staging-userdebug
make -j
```

Lunch prints `PLATFORM_VERSION=VanillaIceCream`, `TARGET_ARCH=riscv64`, `HOST_OS=linux` and `HOST_CROSS_OS=linux_musl`. To build only libvintf and its host tools, `m libvintf checkvintf assemble_vintf` is standard Soong usage but was not run. [NEEDS VERIFICATION]

`envsetup.sh` accepts `riscv64` as a `lunch` or `tapas` architecture and maps it to the `module_riscv64` product.

**Board and product switches.**

- `TARGET_ARCH := riscv64`, `TARGET_CPU_VARIANT := generic`, `TARGET_CPU_ABI := riscv64`, `TARGET_DYNAMIC_64_32_MEDIASERVER := true`, and it includes `BoardConfigGsiCommon.mk`. [BoardConfig](https://android.googlesource.com/platform/build/+/refs/heads/main/target/board/generic_riscv64/BoardConfig.mk)
- `ALLOW_MISSING_DEPENDENCIES := true` ("Temporary hack while prebuilt modules are missing riscv64") is in both `generic_riscv64` and Cuttlefish `vsoc_riscv64`.
- `RISCV64_BUILD_X86_64_HOST_TOOLS` in Cuttlefish `vsoc_riscv64/BoardConfig.mk`. If it is not defined, host tools cross-build with `HOST_CROSS_OS := linux_musl` and `HOST_CROSS_ARCH := arm64`.
- `MODULE_BUILD_FROM_SOURCE ?= true` for `aosp_riscv64`.
- `gsi_release.mk` targets shipping API level 34 and has no riscv64 logic apart from the pvmfw arm64 check.

**QEMU.**

- QEMU 8.1 or newer is required. The README says 9.0 has important V-extension fixes and 9.2 has good V speedups.
- Shell only: `launch_cvd -cpus=4 --memory_mb=8192 --gpu_mode=none`, then `adb shell` after about 10 seconds.
- Home screen: `launch_cvd -cpus=8 --memory_mb=8192`, then `vncviewer localhost:6444`.
- Source: [google/android-riscv64](https://github.com/google/android-riscv64).

**Known build limitations.** Missing riscv64 prebuilts (hence `ALLOW_MISSING_DEPENDENCIES`), `bcc` and `ld.mc` unbuildable, RenderScript disabled, no pvmfw, no VNDK snapshot for riscv64. There is no Dockerfile.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GSI-style product in tree | yes | yes | yes (`aosp_riscv64`) |
| Published GSI binary | yes | yes | none found |
| `gsi_<arch>` board and product | `gsi_x86_64` | `gsi_arm64` | none. `gsi_arm64` is the only `gsi_*` board directory found. |
| VNDK snapshot (v34) | yes | yes | no |
| libvintf / VINTF checks | work | work | work by construction (arch-neutral), not validated |
| Conditional kernel-config VINTF requirements | yes | yes | none |
| pvmfw / protected VMs | non-protected testing only | yes | no |
| In-guest KeyMint | yes | yes | no |
| Widevine | yes | yes | excluded |
| Real hardware for GSI | Data not available | Data not available | none from Google; issue #168 |
| CTS-on-GSI / VTS | Data not available | Data not available | not running upstream |
| NDK ABI | Data not available | Data not available | not yet defined |

**Functional gaps.** No riscv64 GSI download, no VNDK snapshot, no pvmfw, no in-guest KeyMint, no Widevine, no real-hardware vendor implementation upstream, no riscv64 GKI on current branches.

**Performance gaps.** Data not available: no benchmark or performance figures for GSI, Treble, VINTF or libvintf on riscv64 were found. Web searches for benchmarks were refused after the search budget ran out, so absence of data here is a search limitation. A RISE feed review found benchmark sections only for unrelated posts (SpeexDSP on SpacemiT K1, IREE).

**Security hardening gaps.** KeyMint runs host-side on Cuttlefish riscv64. The RISE Android 17 images have permissive SELinux, no secure boot or TEE, and A210 with U-Boot AVB verification disabled although the images keep their AVB metadata. Both are downstream.

**NaN / floating-point semantics.** Data not available. The only related finding is the QEMU V-extension workaround (`-mno-implicit-float`).

**Extension requirements.** Issue #168: Google says Android "plans to require" extensions that the BPI-F3 CPU lacks. The specific list was not captured. Issue #70 (open) proposes a CTS test that cores expose homogeneous extension sets. Issue #112 (open) proposes a Zimop CTS test.

## 7. CI/CD Infrastructure

**libvintf.** No riscv64 CI. Files read (HEAD `9a095008`, 2025-03-17):

- `TEST_MAPPING` `presubmit`: `libvintf_test`, `vintf_object_test`, `lshal_test`, `vts_halManifest_validate_test`. `hwasan-presubmit`: the first three. None is arch-specific.
- `PREUPLOAD.cfg` has only `ignore_merged_commits = true` and the `clang_format` hook.
- `test/libvintf_test.xml` is a Tradefed GTest config that pushes `libvintf_test` to `/data/local/tmp`. The read was truncated, but no ABI-specific setting was seen. [NEEDS VERIFICATION]
- The repo has no `.yml` or `.yaml` CI files, and the gitiles page links to no CI dashboard.

**platform/build.**

- `ci/dump_product_config` is the only riscv64 reference in `ci/`. `module_riscv64` is in a hard-coded `mainline_products` list and gets the `trunk_staging`, `trunk` and `mainline` release configs.
- `aosp_riscv64` is not in that list, so it falls into the `next` branch with every other non-mainline product. This is release-config enumeration, not a riscv64 test job.
- `platform/build/release` has zero riscv hits.

**ci.android.com.** The branch grid is JavaScript-rendered and could not be read. A search found no riscv64 GSI entry, and no buildbot or Jenkins configuration. Whether an `aosp_riscv64` build runs there is not confirmed. [NEEDS VERIFICATION]

**RISE.** RP024 Phase 2 will automate build, test and release of Android 17 from the manifest, testing on Alibaba A210 systems in the RISE Board Farm, with SpacemiT K3 added later. [RISE Android 17 post](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/) No RISE runner usage specific to Android or GSI was found. The post does not mention GSI, Treble, VINTF, HAL stability or CTS/VTS.

**Google plan (2023).** In issue #117 enh-google said CI would eventually include VTS, after boot checks, a CTS subset and postsubmit CTS. VTS was last in that order. [issue 117](https://github.com/google/android-riscv64/issues/117)

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| libvintf `TEST_MAPPING` | no arch filter | no arch filter | no arch filter, no riscv64 job |
| Release-config enumeration (`ci/dump_product_config`) | Data not available | Data not available | `module_riscv64` in `mainline_products`; `aosp_riscv64` in `next` |
| Published GSI build | yes | yes | none found |
| Real-hardware CI | Data not available | Data not available | RISE Board Farm Phase 2 (downstream, planned) |
| CTS/VTS results | Data not available | Data not available | none found |

## 8. Distribution and Release Status

- **Upstream:** GSI, Treble and VINTF are distributed as AOSP source and, for GSI, as prebuilt images from Google. No riscv64 GSI exists on the official list or in the Android 17 download page portion read (arm64 and x86_64 only). No riscv64 GSI is published. [Generic system images](https://source.android.com/docs/core/tests/vts/gsi)
- **Distro packages:** libvintf, `checkvintf` and `assemble_vintf` are not packaged in Ubuntu. Searches for `android`, `vintf`, `aidl` and `tinyxml` in the resolute riscv64 index found no libvintf package. Ubuntu 26.04 (resolute) has `android-libbase` 34.0.5-12, `android-liblog`, `android-libselinux` and `android-libutils` in universe. The packages.ubuntu.com search returned HTTP 500, so the riscv64 index was read directly from ports.ubuntu.com.
- **PyPI / RISE wheels:** none. `pypi.org/pypi/gsi/treble/vintf/json` returned 404. The package name is not real, since this is AOSP source.
- **Project-graph:** the tool was not available in this session, so no graph queries were run.
- **User path to a working binary:**
  1. Build `aosp_riscv64-userdebug` or `aosp_cf_riscv64_phone-trunk_staging-userdebug` from AOSP and run it on Cuttlefish with QEMU 8.1 or newer.
  2. For real hardware, use RISE's downstream `android-17-v1.0` (see Section 13). Google said (issue #168) no prebuilt image is planned.
- The public `main` branches of `platform/build` and `device/google/cuttlefish` show no commits after 2025-03-26, and libvintf none after 2025-03-17. These are March 2025 clones, so newer upstream changes may exist.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Soong | build-dependency, critical | `Riscv64` arch defined in `android/arch.go`; `riscv64_device.go` sets flags | Not verified | In AOSP tree (Android 14+) | Upstream Google. RISE forks `android_build_soong` and `android_build_blueprint` for its Android 17 images. |
| LLVM | build-dependency, critical | Clang 20 (`clang-r547379`) targets `riscv64-linux-android` with `rv64gcv_zba_zbb_zbs`. `bcc` and `ld.mc` cannot be built for riscv64 because of an old LLVM dependency. | Not verified | AOSP prebuilt toolchain | Upstream Google. |
| Bionic | runtime-dependency, critical | Built in tree for `aosp_riscv64` (full platform build since `c9cb74d257`). Internals not examined. | Not verified | In tree | RISE lists Bionic as a possible future RFP. |
| ART | runtime-dependency, critical | Boots to home screen on Cuttlefish (README, 2025Q2). dexpreopt disabled for `aosp_riscv64` in 2023 changes. | Not verified | In tree | RISE lists ART as a possible future RFP. |
| Linux kernel | runtime-dependency, critical | Cuttlefish uses prebuilt `mainline-riscv64`. ACK/GKI riscv64 removed in 2024 (see Section 4). | `kselftest` run by hand worked on a device (issue #117). Panic report with a self-built kernel (issue #157). | RISE uses `android-mainline-spacemit` and `android-mainline-alibaba` branches (downstream) | Upstream Linux riscv plus Google mainline branch. |
| TinyXML2 | runtime-dependency, critical | In tree (`external/tinyxml2`, no arch restriction) | Not verified | In tree. Ubuntu 26.04 has `libtinyxml2-11` 11.0.0 (universe). | Third-party. No report exists yet in the repository. |
| OpenSBI | runtime-dependency, optional | Cuttlefish riscv64 uses OpenSBI firmware (since 2023-02) | Not verified | RISE forks v1.8-k3 and v1.5-a210 in its manifest (downstream) | Active: RISE OpenSBI interrupt-handling work (2026-07-16 post). |
| QEMU | test-dependency, critical | n/a (host) | Needs 8.1 or newer. 9.0 has V fixes, 9.2 has V speedups. | n/a | QEMU issue 1976 (V extension) is the cause of the `-mno-implicit-float` workaround. |
| googletest | test-dependency, optional | In tree. Ubuntu `libgtest-dev` and `libgmock-dev` 1.17.0 (universe). | Not verified | In tree | Third-party. |
| Cuttlefish | test-dependency, critical | Targets `aosp_cf_riscv64_phone`, `_slim`, `_wear`, `_minidroid` | Boots to home screen (README, 2025Q2). No CTS/VTS results. | Upstream AOSP only | Google-led. Issue #168 recommends QEMU. |

Indirect dependencies from `Android.bp` (all built in-tree for riscv64 and not verified by test):

| Name | Role | Ubuntu 26.04 riscv64 |
|---|---|---|
| libbase | logging, string, file utilities | `android-libbase` 34.0.5-12 (universe) |
| liblog | Android logging | `android-liblog` (universe) |
| libselinux | SELinux queries from `VintfObject` | `libselinux1` 3.9 (main), `android-libselinux` (universe) |
| libz | compression | `zlib1g` (main) |
| libjsoncpp | JSON output in `libvintffm` and `analyze_matrix` | `libjsoncpp26` 1.9.6 (main) |
| libutils | utilities for `assemble_vintf` and `libvintffm` | `android-libutils` (universe) |
| libkver, libkernelconfigs | kernel version and config parsing | AOSP-only, `libkernelconfigs` is in libvintf |
| libaidlmetadata, libhidlmetadata | interface metadata headers | AOSP-only, header libraries |

Ubuntu "found" means present in the resolute riscv64 `Packages.xz` index, not returned by the graph tool. The Ubuntu `android-*` packages are Android 14-era, so they are not the same source as the AOSP in-tree builds.

**Depth.** libvintf has no JIT, SIMD, crypto or numerics code. The critical riscv64 content is in LLVM, Soong and QEMU: the mandatory vector baseline and the QEMU V-extension workaround. Data not available: second- and third-level dependency analysis for ART and Bionic.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [google/android-riscv64 #117](https://github.com/google/android-riscv64/issues/117) | VTS can't work. | Closed, not planned (2024-11-12) | High for CTS/VTS enablement | Google had not run VTS as of late 2023. A maintainer reproduced success locally in 2024-02 and suspected the device ran too slowly. |
| [#168](https://github.com/google/android-riscv64/issues/168) | Prebuilt android OS Image for RISCV | Closed (2025-10-06) | Informational | No prebuilt image. No suitable hardware. Use QEMU. |
| [#70](https://github.com/google/android-riscv64/issues/70) | CTS test to ensure that core features are homogenous | Open, no replies | Medium | Proposed riscv64-specific CTS test (opened 2023-03-08). |
| [#112](https://github.com/google/android-riscv64/issues/112) | Add CTS test for Zimop | Open, no replies | Low | Proposed CTS test (opened 2023-10-06). |
| [#157](https://github.com/google/android-riscv64/issues/157) | android15-qpr1-release ... panic | Closed | Medium | Cuttlefish `aosp_cf_riscv64_phone-trunk_staging-userdebug` panic report with a self-built kernel. |
| [#125](https://github.com/google/android-riscv64/pull/125) | Use qemu and virgl by default | Open PR | Low | Documentation repo. |
| b/206676167 | Remove `config.disable_renderscript=1` | Open TODO in `aosp_riscv64.mk` | Low | Feature gap. The issue tracker needs sign-in, so its state was not checked. |
| b/339926078, b/332977378 | riscv64 in-guest KeyMint | Postponed (`9300136e9`) | Medium | Host-side KeyMint used on riscv64. |
| b/376363989 | pvmfw supports only AArch64 | Open (per `gsi_release.mk` comment) | Medium | No protected VM firmware for riscv64. |
| Gerrit 2241752 | Revert of the initial aosp_riscv64 target | Open, never submitted | None | Stale. |
| Gerrit 2781391 | Add arch/riscv64/fuchsia.mk | Open | None | Not related to GSI or VINTF. |
| Gerrit 2622110, 2660516, 2667277 | module_riscv64 product; first API version 35; exclude local_riscv64 source root | Abandoned | None | |

**Correctness bugs.** None found specific to libvintf or VINTF on riscv64. The `-mno-implicit-float` flag works around a QEMU vector-extension bug (QEMU issue 1976), and the `-jump-is-expensive=false` link flag works around a Clang default (android-riscv64 issue 124). No dedicated GSI, Treble or VINTF issue, patch or mailing-list thread was found. Data not available: issues on issuetracker.google.com (sign-in required) and sig-android mailing-list threads.

## 12. Objections and Upstream Blockers

- **Stated objections (Google).**
  - GKI: Google said it is "not ready to provide a single supported image for all vendors" ([The Register](https://www.theregister.com/on-prem/2024/05/01/google-pulls-risc-v-support-from-generic-android-kernel/918929)). It said Android will continue to support RISC-V.
  - Hardware: Android plans to require extensions that current boards lack ([issue 168](https://github.com/google/android-riscv64/issues/168)).
  - Real hardware: the maintainer knows of no hardware with decent performance and functionality, and suggests QEMU.
- **Technical blockers.**
  - Missing riscv64 prebuilts (`ALLOW_MISSING_DEPENDENCIES`).
  - No VNDK snapshot for riscv64.
  - No pvmfw.
  - `bcc` and `ld.mc` unbuildable.
  - Slow emulation: about ten minutes to reach the home screen on a fast workstation.
  - VTS not demonstrated.
- **Organizational blockers.**
  - No riscv64 owner for CTS/VTS-on-GSI.
  - Open CTS proposals (#70, #112) have no replies.
  - The public tree has seen no visible riscv64 commits since 2025-03.
  - A SoC vendor must carry its own riscv64 kernel support, since there is no GKI (The Register).
  - Qualcomm's Wear OS wearables are named as the expected first form factor. [NEEDS VERIFICATION]
- **Acceptance probability.** Not quantified in the findings. Upstream accepted the product and board files and the Cuttlefish targets from 2022 to 2024. Upstream accepted no VINTF, GSI-publication or CTS/VTS work for riscv64 in the evidence reviewed.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** none
- **Justification.**
  - Upstream AOSP has an `aosp_riscv64` GSI-style lunch target (first in `android-14.0.0_r1`) and libvintf is ISA-neutral.
  - There is no upstream riscv64 CI for libvintf/VINTF: [TEST_MAPPING](https://android.googlesource.com/platform/system/libvintf) has no arch-specific jobs.
  - No riscv64 GSI is published: the [GSI list](https://source.android.com/docs/core/tests/vts/gsi) shows only arm, arm64, x86, x86_64.
  - No riscv64 VTS or CTS-on-GSI runs. `ALLOW_MISSING_DEPENDENCIES` is still set in [generic_riscv64](https://android.googlesource.com/platform/build/+/refs/heads/main/target/board/generic_riscv64/).
  - It is not red because it is untested rather than confirmed broken, and Google says Android will keep supporting RISC-V.
  - The only consumable riscv64 Android releases are RISE's board-level Android 17 images, which are downstream.
- **Downstream release detail.** "RISE Android 17 v1.0" (tag `android-17-v1.0` in `riseproject-dev/android_manifest`) is an open-source developer release, not production-ready and not certified.
  - Hardware: SpacemiT K3 Pico-ITX and Alibaba A210 EVB.
  - Lunch targets: `aosp_k3_pico_itx-trunk_staging-userdebug` and `aosp_a210_evb-trunk_staging-userdebug`. These are board products, not `aosp_riscv64`.
  - Kernel: android-mainline 7.1.
  - Known issues: permissive SELinux; secure boot and TEE out of scope; A210 U-Boot AVB verification disabled; OpenGL ES 2.0 only so no WebGL in WebView; NPUs unsupported; thermal management untested; no A210 validation report.
  - Source: [Android 17 on RVA23](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/) and the [android-17-v1.0 release](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0).
- **Pending work that could change the grade.**
  - RISE project RP024 Phase 2: continuous build and test in the RISE Board Farm. It does not address GSI, VINTF or CTS/VTS.
  - Upstream open items: google/android-riscv64 [#70](https://github.com/google/android-riscv64/issues/70) and [#112](https://github.com/google/android-riscv64/issues/112) (proposed riscv64 CTS tests, open, no replies), and [#117](https://github.com/google/android-riscv64/issues/117) (VTS on riscv64, closed as not planned).
  - The ACK/GKI riscv64 turndown (April 2024) removed riscv64 GKI support, and Cuttlefish commit `9300136e9` leaves riscv64 without in-guest KeyMint.
  - The grade would rise to yellow or blue if upstream added riscv64 build or test CI for VINTF/GSI, or if Google or RISE published a riscv64 GSI with VTS/CTS results.
  - The clones behind this research are from March 2025, so newer upstream changes may exist.

## 14. Investment Analysis

**RISE coverage check.** RISE has funded RP024: board-level Android 17 on RVA23 (K3, A210), engineered by BayLibre, with Phase 2 CI in the Board Farm planned. Possible future RISE RFPs cover Bionic, BoringSSL, ART, V8, Chrome and multimedia libraries. Do not size those, or the board BSP work. RISE material does not address GSI publication, VINTF/compatibility-matrix validation or CTS/VTS for riscv64, and I found no RISE work on those.

Person-week figures below are planning estimates made for this assessment. They are not derived from the research findings.

### 14.1 Functional Enablement

- Drop `ALLOW_MISSING_DEPENDENCIES` from `generic_riscv64` by supplying the missing riscv64 prebuilts, and validate a clean `aosp_riscv64` build.
- Add a VNDK snapshot for riscv64 (`prebuilts/vndk` has none).
- Add riscv64 conditional entries in `kernel/configs` if a riscv64 kernel contract is wanted.
- Decide on a Treble kernel story given the ACK turndown (a downstream KMI branch or the existing `android-mainline-riscv64` branch). The findings on that branch conflict (Section 4).
- Resolve KeyMint on riscv64 (b/339926078, b/332977378) and pvmfw (b/376363989).

### 14.2 Performance Optimization

Data not available: no profile or benchmark exists for GSI, Treble or VINTF on riscv64. Libvintf is not a performance-sensitive component. Performance work belongs to ART, Bionic and the media libraries, which are outside this report's scope.

### 14.3 CI/CD Infrastructure

- Add a riscv64 job to libvintf and `platform/build` CI: at minimum `lunch aosp_riscv64-userdebug && m` plus `libvintf_test` and `vintf_object_test` on a riscv64 target.
- Use the RISE Board Farm Phase 2 (A210) as the hardware leg and extend the RISE manifest CI to run `checkvintf` and `vts_halManifest_validate_test`.
- Run the CTS subset and VTS that Google's 2023 plan listed as the CI order (boot, CTS subset, postsubmit CTS, VTS).

### 14.4 Ecosystem Enablement

- Publish a riscv64 GSI (`aosp_riscv64`) with VTS/CTS results, in cooperation with Google. This is the item that would move the grade.
- Upstream the RISE platform patches (Soong and Blueprint forks, zlib, drm_hwcomposer, minigbm) as the RISE post proposes. [RISE Android 17 post](https://riseproject.dev/2026/10/20/android-17-available-on-rva23/with-rise/)
- Contribute the open CTS proposals (#70, #112).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Remove `ALLOW_MISSING_DEPENDENCIES` and fill riscv64 prebuilts | 8 to 12 | Google/AOSP with partner | High |
| Functional | VNDK snapshot for riscv64 | 4 to 8 | Google/AOSP | High |
| Functional | riscv64 kernel contract (KMI/GKI decision) | 12 to 24 | Google plus SoC vendors | Critical |
| Functional | KeyMint and pvmfw on riscv64 | 12 to 20 | Google/AOSP | Medium |
| Functional | Kernel-config conditionals for riscv64 | 2 to 4 | Google/AOSP | Low |
| CI/CD | riscv64 build and libvintf test job | 3 to 6 | Google/AOSP with RISE | Critical |
| CI/CD | `checkvintf` and HAL manifest validation in RISE Board Farm | 4 to 8 | RISE | High |
| CI/CD | CTS subset and VTS bring-up on riscv64 | 12 to 24 | Google plus RISE | High |
| Ecosystem | Publish riscv64 GSI with test results | 6 to 12 | Google/AOSP | Critical |
| Ecosystem | Upstream RISE platform patches | 8 to 16 | RISE vendors | Medium |
| Ecosystem | Contribute CTS tests #70 and #112 | 2 to 4 | Chip company | Low |

## 15. References

- [Android architecture overview](https://source.android.com/docs/core/architecture)
- [VINTF documentation](https://source.android.com/docs/core/architecture/vintf)
- [Generic system images (VTS GSI page)](https://source.android.com/docs/core/tests/vts/gsi)
- [Generic system image setup page](https://source.android.com/docs/setup/create/gsi)
- [AVF architecture](https://source.android.com/docs/core/virtualization/architecture)
- [GKI android16-6.12 release builds](https://source.android.com/docs/core/architecture/kernel/gki-android16-6_12-release-builds)
- [libvintf](https://android.googlesource.com/platform/system/libvintf)
- [libvintf main tree](https://android.googlesource.com/platform/system/libvintf/+/refs/heads/main/)
- [platform/build](https://android.googlesource.com/platform/build)
- [aosp_riscv64.mk](https://android.googlesource.com/platform/build/+/refs/heads/main/target/product/aosp_riscv64.mk)
- [AndroidProducts.mk](https://android.googlesource.com/platform/build/+/refs/heads/main/target/product/AndroidProducts.mk)
- [module_riscv64.mk](https://android.googlesource.com/platform/build/+/refs/heads/main/target/product/module_riscv64.mk)
- [gsi_release.mk](https://android.googlesource.com/platform/build/+/refs/heads/main/target/product/gsi_release.mk)
- [generic_riscv64 board](https://android.googlesource.com/platform/build/+/refs/heads/main/target/board/generic_riscv64/)
- [generic_riscv64 BoardConfig.mk](https://android.googlesource.com/platform/build/+/refs/heads/main/target/board/generic_riscv64/BoardConfig.mk)
- [generic_riscv64 README.txt](https://android.googlesource.com/platform/build/+/refs/heads/main/target/board/generic_riscv64/README.txt)
- [build commit dac728895d](https://android.googlesource.com/platform/build/+/dac728895d)
- [build commit f310841384](https://android.googlesource.com/platform/build/+/f310841384%5E%21/)
- [build commit c9cb74d257](https://android.googlesource.com/platform/build/+/c9cb74d257)
- [Soong riscv64_device.go](https://android.googlesource.com/platform/build/soong/+/refs/heads/main/cc/config/riscv64_device.go)
- [Soong global.go](https://android.googlesource.com/platform/build/soong/+/refs/heads/main/cc/config/global.go)
- [Cuttlefish main tree](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/)
- [Cuttlefish vsoc_riscv64](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/vsoc_riscv64/)
- [Cuttlefish commit 9300136e9](https://android.googlesource.com/device/google/cuttlefish/+/9300136e9)
- [kernel/configs](https://android.googlesource.com/kernel/configs)
- [hardware/interfaces compatibility matrices](https://android.googlesource.com/platform/hardware/interfaces/+/refs/heads/main/compatibility_matrices/)
- [prebuilts/vndk/v34](https://android.googlesource.com/platform/prebuilts/vndk/v34/+/refs/heads/main)
- [kernel/common](https://android.googlesource.com/kernel/common)
- [platform/build/release](https://android.googlesource.com/platform/build/release/+/refs/heads/main/)
- [AOSP Gerrit (REST API queried for change status)](https://android-review.googlesource.com/)
- [Initial aosp_riscv64 change mirror (omnirom Gerrit)](https://gerrit.omnirom.org/plugins/gitiles/android_build/+/dac728895def70a8383fbb92987d28e8f1ba4fb0%5E%21)
- [google/android-riscv64](https://github.com/google/android-riscv64)
- [Issue 117: VTS can't work](https://github.com/google/android-riscv64/issues/117)
- [Issue 168: Prebuilt android OS Image for RISCV](https://github.com/google/android-riscv64/issues/168)
- [Issue 70: CTS test to ensure that core features are homogenous](https://github.com/google/android-riscv64/issues/70)
- [Issue 112: Add CTS test for Zimop](https://github.com/google/android-riscv64/issues/112)
- [Issue 157: android15-qpr1-release panic](https://github.com/google/android-riscv64/issues/157)
- [PR 125: Use qemu and virgl by default](https://github.com/google/android-riscv64/pull/125)
- [Android and RISC-V: What you need to know to be ready](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html)
- [The Register: Google pulls RISC-V support from generic Android kernel](https://www.theregister.com/on-prem/2024/05/01/google-pulls-risc-v-support-from-generic-android-kernel/918929)
- [CNX Software: Android no longer supports RISC-V](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/)
- [Hackster: Google Removes RISC-V Support From the Android Common Kernel](https://www.hackster.io/news/google-removes-risc-v-support-from-the-android-common-kernel-but-denies-abandoning-the-isa-c4ccab33a929)
- [RISE members](https://riseproject.dev/members/)
- [RISE Android 17 Available on RVA23](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE blog feed](https://riseproject.dev/feed/)
- [riseproject-dev/android_manifest](https://github.com/riseproject-dev/android_manifest)
- [android_manifest release android-17-v1.0](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [aosp-riscv (gitee)](https://gitee.com/unicornx/aosp-riscv)
- [aosp-riscv working group](https://github.com/aosp-riscv/working-group)
- [phhusson GSI list](https://github.com/phhusson/treble_experimentations/wiki/Generic-System-Image-(GSI)-list)
- [Android GSI releases page](https://developer.android.com/topic/generic-system-image/releases)