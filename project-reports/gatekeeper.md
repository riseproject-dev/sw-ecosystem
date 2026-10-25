---
title: Gatekeeper
parent: Project Reports
color: yellow
dependencies:
  - name: Soong
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: BoringSSL
    relation: runtime-dependency
    criticality: critical
  - name: scrypt
    relation: runtime-dependency
    criticality: optional
  - name: Keymaster
    relation: runtime-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="gatekeeper" %}

# Gatekeeper

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-25<br/>
**Readiness:** yellow (clean-distro-build), release provider: RISE<br/>
**Scope:** RISC-V (riscv64/linux and riscv64/android) support status for Gatekeeper<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Gatekeeper is Android's password, PIN and pattern verification service. Its design runs the verification in a trusted execution environment (TEE). The pieces are:

- [system/gatekeeper](https://android.googlesource.com/platform/system/gatekeeper): the `libgatekeeper` C++ library. It holds `gatekeeper.cpp`, `gatekeeper_messages.cpp`, headers in `include/gatekeeper/`, one unit test and `Android.bp`.
  - Its header comment says it contains "just the code necessary to communicate with a GoogleGateKeeper implementation, e.g. one running in TrustZone".
  - The Gatekeeper logic is a header-only abstract class that device-specific code implements.
  - `libgatekeeper` is `cc_library_shared`, `vendor_available` and `host_supported`, and also builds on Windows. `libgatekeeper_static` only exports include directories.
  - `rules.mk` compiles the same sources for Trusty (`-std=c++11`, against `libc-trusty` and `libstdc++-trusty`).
- [hardware/interfaces/gatekeeper](https://android.googlesource.com/platform/hardware/interfaces/+/refs/heads/main/gatekeeper/): the HIDL 1.0 and AIDL HAL definitions, plus software implementations (`gatekeeper/1.0/software`, `gatekeeper/aidl/software`).
  - The AIDL software HAL builds `android.hardware.gatekeeper-service.nonsecure` and is packaged in the APEX `com.android.hardware.gatekeeper.nonsecure`.
  - Its software implementation (`SoftGateKeeper.h`) uses OpenSSL-API `SHA256`, `HMAC` and `RAND` through `libcrypto`, and `crypto_scrypt()` from `libscrypt_static`.
- Implementations: real TEE-backed Gatekeeper implementations are vendor- or Trusty-specific and are not in the repositories above. The [Android documentation](https://source.android.com/docs/security/features/authentication/gatekeeper) says any TEE OS can implement Gatekeeper if it has a persistent hardware-backed key and a secure monotonic clock that keeps running during suspend. Trusty is Google's open-source TEE OS and includes an approved implementation.

Governance:

- There is no foundation. Google runs the repo on android.googlesource.com through Gerrit review and OWNERS files.
- The code is Apache-2.0 (stated in the `gatekeeper.cpp` header). The repo root has no LICENSE, NOTICE or MAINTAINERS file.
- The `OWNERS` file lists three Google addresses: drysdale@google.com, oarbildo@google.com and swillden@google.com. The bug component is 1124862.
- The repo has 339 commits. The top committers are Andres Morales (68), Steven Moreland (28), Jae Shin (16), Matthew Maurer (15), Marco Nelissen (13) and Chih-Hung Hsieh (13). All are Google, except bots.
- HEAD is `502ab33`, dated 2025-02-27 (an OWNERS cleanup). The repo is quiet.
- Google LLC is a Premier Member of [RISE](https://riseproject.dev/members/), but the membership is company-level and nothing ties it to Gatekeeper.

Community stance on new ports: no Gatekeeper-specific policy is published. Upstream AOSP is the only place changes land. Any riscv64 effort beyond the AOSP Cuttlefish target is a vendor or downstream effort.

## 2. Port History and Upstreaming Timeline

No riscv64 port of Gatekeeper's own code exists, and none was needed. A case-insensitive search of the 339-commit history for `riscv` or `risc-v` found nothing, and `git grep -i riscv` on HEAD returns nothing. A history grep for `risc|arch|seccomp|cuttlefish` returned only two 2015 commits ("Use uint32_t instead of size_t" and "Make time acquisition impl dependent"), neither riscv-related.

| Date | Event | Source |
|---|---|---|
| 2015-02-23 | First commit of `system/gatekeeper` (Bill Yi, "Initial empty repository"). The first real code is Andres Morales's "Hardware keyguard message interface" the same day. | [system/gatekeeper](https://android.googlesource.com/platform/system/gatekeeper) |
| 2022 | An earlier `aosp_riscv64` target appears as an AOSP build change, per a search result. [NEEDS VERIFICATION] | Search result, not fetched |
| 2023-08-07 | Earliest riscv64 Cuttlefish commit found: "Use virtwifi for risc-v targets". | [device/google/cuttlefish](https://android.googlesource.com/device/google/cuttlefish) |
| 2023-09-19 | "Use Sv48 for RISC-V" (Cuttlefish). | [device/google/cuttlefish](https://android.googlesource.com/device/google/cuttlefish) |
| 2023-10 | Google announces the `aosp_cf_riscv64_phone-userdebug` lunch target. The build is described as basic and not yet optimized. | [Google Open Source Blog](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html) |
| 2024-02-12 | "Exclude widevine from RISC-V Cuttlefish images" and "Enable the JIT for riscv64". | [Widevine exclusion commit](https://android.googlesource.com/device/google/cuttlefish/+/81634ff43) |
| 2024-04-26 | Authored date of `f87300b93`, "Revert^2 'Use the in-guest secure hals by default.'" (committed 2024-05-09, Gerrit submitted 2024-05-09). | [f87300b93](https://android.googlesource.com/device/google/cuttlefish/+/f87300b935069949f06763a013243a347465170e) |
| 2024-04-26 to 2024-05-01 | Google uploads and merges "Remove ACK's support for riscv64" into `android15-6.6` and `android-mainline`. | [CNX Software](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/) |
| 2024-05-11 | `846195d82`, "Revert^3", backs out the in-guest default. Reason: "b/339926078, breaking riscv64 Cuttlefish boot". Gerrit submitted 2024-05-11. | [846195d82](https://android.googlesource.com/device/google/cuttlefish/+/846195d826ab5b9fbf98dd9b0101fa08bd0364b0) |
| 2024-05-13 | `9300136e9`, "Use in-guest keymint on platforms other than riscv64". It adds the riscv64 special case in `flags.cc`. Gerrit submitted 2024-05-14. | [9300136e9](https://android.googlesource.com/device/google/cuttlefish/+/9300136e990d249017e788e834f22be80645f0ad) |
| 2025-02-02 | "Selects default riscv64 bootloader binary" (Cuttlefish). | [device/google/cuttlefish](https://android.googlesource.com/device/google/cuttlefish) |
| 2025-02-27 | Latest `system/gatekeeper` commit (OWNERS cleanup). | [system/gatekeeper](https://android.googlesource.com/platform/system/gatekeeper) |
| 2026-10-20 | RISE announces Android 17 on RVA23 (K3 and A210 boards). The `android-17` manifest carries `system/gatekeeper` unmodified. | [RISE blog](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/), [android_manifest](https://github.com/riseproject-dev/android_manifest) |

Key contributors:

- Cody Schuffelen (Google) authored `f87300b93` and `9300136e9` and wrote the riscv64 TODO.
- Prashanth Swaminathan (Google) authored the `846195d82` revert.
- All three commits are in `device/google/cuttlefish`, which is upstream AOSP.

Upstreaming status:

- The relevant riscv64 changes are fully upstream in AOSP. There are no out-of-tree Gatekeeper riscv64 patches, because none exist.
- The RISE Android 17 tree uses upstream Gatekeeper unmodified.

First Android release with riscv64: this was not conclusively determined.

- One data point is that the `android15-release` branch of `device/google/cuttlefish` already contains the riscv64 `secure_hals` special case ([flags.cc on android15-release](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/android15-release/host/commands/assemble_cvd/flags.cc)). This says nothing about when riscv64 first appeared.
- A RISE post quotes Google's Lars Bergstrom: "Android has added support for RISC-V as a target as of Android 15" ([RISE post](https://riseproject.dev/?p=519)). This is a single source. [NEEDS VERIFICATION]
- The earlier riscv64 Cuttlefish commits date from 2023-08 and the target was announced in 2023-10, before the Android 15 release branch. The two sources are consistent with a development-branch target that predates Android 15, but no `android-platform-*` tag was tied to the first riscv64 support.

## 3. Upstream Support Tier

There is no formal tier policy for Gatekeeper. Android's riscv64 status is set at the platform level, not per component. The only named riscv64 target is the Cuttlefish virtual device `aosp_cf_riscv64_phone-userdebug`, plus slim, wear and minidroid variants.

Evidence:

- **CI:** Gatekeeper has no CI of its own. There is no `TEST_MAPPING`, `PREUPLOAD.cfg`, `.gitlab-ci`, Jenkinsfile or GitHub workflow in `system/gatekeeper`, and `hardware/interfaces/gatekeeper` has no `TEST_MAPPING` or `AndroidTest.xml`.
- **Whether Google's internal CI covers it:** whether ci.android.com builds `aosp_cf_riscv64_phone` and runs `VtsHalGatekeeperTargetTest` is not visible from public sources. Data not available: ci.android.com dashboard data for riscv64.
- **Release blocking:** none found.
- **Official binaries:** none (see Section 8).
- **Kernel:** Google removed riscv64 from the Android Common Kernel and GKI in April/May 2024. The patch text says "support for risc64 GKI kernels is discontinued". Google said Android "will continue to support RISC-V" and that it is not ready to provide a single supported image for all vendors ([CNX Software](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/)). Vendors must maintain their own kernel branch.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Gatekeeper source changes | none | none | none |
| Cuttlefish Gatekeeper default | in-guest (`guest_gatekeeper_insecure`) | in-guest (`guest_gatekeeper_insecure`) | host `secure_env` (`gatekeeper`) |
| Gatekeeper-specific CI | none found | none found | none found |
| Trusty Gatekeeper TA | Data not available | Data not available | not found |
| Accelerated scrypt | SSE | NEON | none (reference C) |
| Official ACK/GKI kernel | yes | yes | removed 2024 |

The Cuttlefish rows come from `flags.cc` at HEAD `a1162ca7a`, lines 1157-1165. The commit message for `9300136e9` says in-guest "had good results on x86_64 and arm64".

## 4. Technical Architecture and RISC-V-Specific Subsystems

Gatekeeper's own code has no architecture-specific components. The checks were:

- `git grep` over `system/gatekeeper` HEAD for `risc`, `__aarch64__`, `__x86_64__`, `intrin` and `asm` returned nothing.
- A broader search of `system/gatekeeper`, `hardware/interfaces/gatekeeper`, `external/scrypt` and `device/google/cuttlefish` for arch, SIMD and asm tokens found no `.S` files, no inline asm, no arch or SIMD `#ifdef`s and no JIT in Gatekeeper or its HALs.
- `Android.bp` has no `arch:` or `multilib:` stanza. The only `target:` block is for Windows (`ws2_32`).

| Component | amd64 | arm64 | riscv64 | Rating |
|---|---|---|---|---|
| `libgatekeeper` (`gatekeeper.cpp`, `gatekeeper_messages.cpp`) | portable C++ | portable C++ | portable C++ | scalar, nothing arch-specific to complete |
| AIDL/HIDL HAL and software implementation | portable | portable | portable | scalar |
| `external/scrypt` | `crypto_scrypt-sse.c` | `crypto_scrypt-neon.c` | `crypto_scrypt-ref.c` | scalar reference (arm/arm64 and x86/x86_64 select the SIMD files in `sources.bp`) |
| BoringSSL `libcrypto` | not audited here | not audited here | not audited here | see the [BoringSSL report](boringssl.md) |
| `libkeymaster_portable` (AIDL software HAL) | not audited | not audited | not audited | Data not available |
| Cuttlefish in-guest Gatekeeper | default | default | not default (boot regression) | missing |
| Cuttlefish host `secure_env` Gatekeeper | n/a | n/a | default | partial (workaround) |
| Trusty Gatekeeper (`rules.mk`) | Data not available | Data not available | no riscv64 Trusty target found | missing |

`external/scrypt` has no RVV, Zvk or other riscv64 variant, and no riscv string anywhere in the repo. On riscv64 the result is correct but unaccelerated scrypt. This is a performance gap, not a correctness gap, and matters mostly for the nonsecure software Gatekeeper.

Host-side Cuttlefish: `host/commands/secure_env` provides `gatekeeper_responder.cpp`, `soft_gatekeeper.h` and `tpm_gatekeeper.cpp`, which link `libgatekeeper`. Gatekeeper and KeyMint talk to `secure_env` over virtio-console channels connected to host FIFO files. I saw no riscv references there, but the last 44,774 characters of the page were not read.

## 5. Build System, Cross-Compilation, and Toolchain

No cmake, autotools, configure script, Dockerfile or QEMU build documentation exists for Gatekeeper, and the repo has no README. The only supported build is AOSP Soong with the AOSP prebuilt Clang, using a Cuttlefish riscv64 product.

Build commands (assumed; the `lunch` release/variant suffix and module paths were not verified):

```
source build/envsetup.sh
lunch aosp_cf_riscv64_phone-<release>-userdebug
m libgatekeeper gatekeeper-unit-tests android.hardware.gatekeeper-service.nonsecure
# or the whole image: m
```

`aosp_cf_riscv64_phone-trunk_staging-userdebug` is listed in `COMMON_LUNCH_CHOICES` in the Cuttlefish checkout at HEAD `a1162ca7` (2025-03-26).

Cuttlefish `vsoc_riscv64/BoardConfig.mk` sets:

- `TARGET_ARCH := riscv64`, `TARGET_CPU_VARIANT := generic`, `TARGET_CPU_ABI := riscv64`, 64-bit only.
- Host tools are cross-built by default (`HOST_CROSS_OS := linux_musl`, `HOST_CROSS_ARCH := arm64`). Setting `RISCV64_BUILD_X86_64_HOST_TOOLS` builds x86_64 host tools instead.
- `ALLOW_MISSING_DEPENDENCIES := true`, commented "Temporary hack while prebuilt modules are missing riscv64."
- `TARGET_KERNEL_USE ?= mainline`, with prebuilts from `device/google/cuttlefish_prebuilts/kernel/mainline-riscv64`.

Toolchain:

- AOSP is Clang/LLVM-only and gives no GCC minimum for Gatekeeper.
- Data not available: the pinned Clang version (set by the tree's `prebuilts/clang/host/linux-x86/clang-rXXXX`; the web search budget ran out before it was looked up).
- Both `Android.bp` files use `-Werror` (`-Wall -Werror -g -fno-sanitize-coverage=edge,indirect-calls,8bit-counters,trace-cmp` for the library). A newer Clang that adds warnings can break the build.
- Trusty uses its own `-std=c++11` toolchain.

QEMU and testing:

- Nothing Gatekeeper-specific. Testing a riscv64 build means running the Cuttlefish `aosp_cf_riscv64_phone` image with `launch_cvd`. The Cuttlefish `build/Android.bp` bundles the OpenSBI `fw_dynamic` firmware for riscv64 QEMU, for x86_64 and aarch64 hosts. The launch options were not verified.
- `gatekeeper-unit-tests` is a normal `cc_test` run on a riscv64 device or Cuttlefish instance with `adb shell`. The exact path is unverified.

Known build failures: none found for Gatekeeper on riscv64. Whether the Gatekeeper tree was built or booted in the RISE Android 17 builds was not confirmed.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `libgatekeeper` build | yes (portable) | yes (portable) | yes by construction, build not directly confirmed |
| Software HAL (`gatekeeper-service.nonsecure`) | in product config | in product config | in product config (shared `device.mk`), not confirmed built or run |
| Cuttlefish in-guest Gatekeeper default | yes | yes | no |
| Cuttlefish host `secure_env` Gatekeeper | non-default | non-default | default |
| Trusty TA | Data not available | Data not available | not found |
| Accelerated scrypt | SSE | NEON | no |
| VTS (`VtsHalGatekeeperTargetTest`) | arch-neutral | arch-neutral | arch-neutral, no visible riscv64 result |

`shared/device.mk` installs `com.android.hardware.gatekeeper.cf_remote` and `com.android.hardware.gatekeeper.nonsecure` for every Cuttlefish product with no arch condition (lines 379-383 and 430). The riscv64 phone product inherits `shared/phone/device_vendor.mk`, but the include chain to `shared/device.mk` was not traced in one of the research passes.

Functional gaps:

- Gatekeeper cannot run in the guest by default on riscv64. In-guest Gatekeeper made riscv64 Cuttlefish fail to boot (b/339926078). The root cause is not documented in any public source found.
- No riscv64 Trusty Gatekeeper TA was found, so a real TEE-backed Gatekeeper on riscv64 has no upstream path.

Performance gaps:

- Scrypt runs the portable reference C implementation. No benchmark data exists. Data not available: searches for "Gatekeeper riscv64 benchmark" and "Gatekeeper riscv performance" returned no Gatekeeper results.

Security hardening gaps:

- The Cuttlefish variants named `guest_gatekeeper_insecure` and the nonsecure software HAL are not TEE-backed. The riscv64 default uses the host `secure_env`, a host-side process, so it is a test-environment arrangement and not a hardware-backed one.
- Hardware-backed Gatekeeper requires a persistent hardware key and a secure monotonic clock from the TEE ([Android docs](https://source.android.com/docs/security/features/authentication/gatekeeper)). No riscv64 TEE integration with Gatekeeper was found. RISE has an OP-TEE RISC-V enablement effort (RP016, RP022), but its docs do not mention Gatekeeper, Android, KeyMint or Trusty ([RISE OP-TEE docs](https://riscv-optee-docs.riseproject.dev/)).

NaN and floating-point semantics: Data not available. No floating-point audit was performed; the source has no arch intrinsics and is message and handle logic.

## 7. CI/CD Infrastructure

Does riscv64 CI exist for Gatekeeper? No, based on the files read.

- `system/gatekeeper` has eight top-level entries (`include/`, `tests/`, `Android.bp`, `CleanSpec.mk`, `gatekeeper.cpp`, `gatekeeper_messages.cpp`, `OWNERS`, `rules.mk`) and no CI configuration.
- `tests/Android.bp` defines one `cc_test`, `gatekeeper-unit-tests`, with no `test_suites` entry, so no test suite picks it up from that file.
- The only test hooks elsewhere are `VtsHalGatekeeperTargetTest` (`test_suites`: `general-tests`, `vts`) and the HIDL 1.0 software test under `1.0/software/tests/`. Both are arch-neutral.
- The Cuttlefish checkout has `TEST_MAPPING` files only at `./TEST_MAPPING` and `shared/auto/TEST_MAPPING`, with no riscv entries.
- A web search for Gatekeeper riscv64 CI returned only generic riscv64 CI pages, none about Android Gatekeeper.

RISE:

- RISE runs GitHub runners with the `ubuntu-24.04-riscv` label on Scaleway EM-RV1 hardware ([announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). As of 2026-05-12, 197 repos across 87 organizations used them ([six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)). None of the projects named was Gatekeeper-related.
- The Android 17 effort (RFP RP024) phase 2 will automate builds, hardware testing and releases, starting on Alibaba A210 systems in the RISE Board Farm, with the SpacemiT K3 added later ([RISE blog](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Gatekeeper-specific CI | none | none | none |
| General AOSP build of Cuttlefish product | Data not available (internal) | Data not available (internal) | not visible publicly |
| Hardware used | n/a | n/a | planned: Alibaba A210, SpacemiT K3 (RISE Board Farm, RFP RP024 phase 2) |
| Gatekeeper VTS result visible | no | no | no |

## 8. Distribution and Release Status

Gatekeeper has no standalone riscv64 binary package or release in any channel checked. It is AOSP source built as part of the platform image.

| Channel | riscv64 available | Evidence |
|---|---|---|
| AOSP release tags | source only | Tagged per Android release, for example `android-platform-15.0.0_r21` and `android-platform-14.0.0_r32`. No tag was tied to riscv64. |
| RISE Android 17 | source manifest | [android_manifest](https://github.com/riseproject-dev/android_manifest) branch `android-17` includes `platform/system/gatekeeper` unmodified; release tag [android-17-v1.0](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0). The post calls it an open source developer release, not production-ready or certified. |
| PyPI `gatekeeper` | no | [PyPI](https://pypi.org/pypi/gatekeeper/json) lists only `gatekeeper-0.0.0.tar.gz`, an unrelated HTTP library. No wheels. |
| RISE wheel builder | no | The [simple index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/gatekeeper/) redirects to the same PyPI sdist. |
| Ubuntu 26.04 (`resolute`) riscv64 | no (substitute check) | packages.ubuntu.com returned HTTP 500. A Launchpad `getPublishedBinaries` query for `gatekeeper`, `libgatekeeper` and `python3-gatekeeper` on `resolute/riscv64` returned `total_size: 0`; the same query for `bash` returned a hit, so the query form works. |
| Arch Linux RISC-V | no | [archriscv.felixc.at](https://archriscv.felixc.at) `?q=gatekeeper` listed no package. The status and blacklist pages were not checked. |

The Ubuntu check was not run through the project graph (`mcp__project-graph__project_graph_query` was unavailable). The Launchpad query is a lower-confidence substitute. AOSP Gatekeeper is not packaged by Debian or Ubuntu.

What a user must do to get a working binary:

1. Sync an AOSP tree for riscv64, either upstream with `lunch aosp_cf_riscv64_phone-...` or the RISE `android-17` manifest for K3 or A210 hardware.
2. Build the image from source. Gatekeeper comes in via the HAL APEXes in `shared/device.mk`.
3. For Cuttlefish, run it under `launch_cvd`. Gatekeeper then runs through the host `secure_env` path.
4. For real hardware, a vendor or board kernel is required because riscv64 was removed from the ACK/GKI.

Downstream: a June 2026 personal blog ([junsun.net](https://junsun.net/wordpress/tag/riscv64/)) reports a riscv64 Cuttlefish build on a SpaceMIT K3 board, covering only the base package. It says nothing about Gatekeeper. [NEEDS VERIFICATION] A report cited via [heise](https://heise.de/-11308808) mentions an Alibaba Damo Android 16 port on XuanTie 9-series (RVA23), which is third-party and not a Google release. [NEEDS VERIFICATION]

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Soong | build-dependency, critical. Parses `Android.bp`. | Gatekeeper's `Android.bp` files have no arch-specific stanza, so they build for whatever `TARGET_ARCH` the product sets. Soong riscv64 targets exist via the Cuttlefish products. | n/a | part of AOSP | Google (AOSP) |
| LLVM | build-dependency, critical. AOSP prebuilt Clang is the only toolchain. | Clang pin not retrieved. Data not available. | n/a | part of AOSP prebuilts | Google (AOSP) |
| BoringSSL | runtime-dependency, critical. Provides `libcrypto` for the software HAL and tests. | BoringSSL has riscv64 support (single research source). [NEEDS VERIFICATION] | see [BoringSSL report](boringssl.md) | part of AOSP | Google. RISE has planned a follow-up RFP for BoringSSL. |
| scrypt | runtime-dependency, optional. `libscrypt_static` from `external/scrypt`; used by the software HAL and tests. | builds; selects portable `crypto_scrypt-ref.c` on riscv64. `sdk_version: "17"`. | no tests seen | part of AOSP | Google (AOSP) |
| Keymaster | runtime-dependency, optional. `libkeymaster_portable` used by the AIDL software HAL. | Not audited. | Not checked. | part of AOSP | Google (AOSP) |
| googletest | test-dependency, optional. Used through the `cc_test` module `gatekeeper-unit-tests`. | Soong supplies the gtest libraries for `cc_test`; the research did not inspect them directly. [NEEDS VERIFICATION] | not verified on riscv64 | part of AOSP | Google (AOSP) |
| libhardware_headers | header-only build dependency of `libgatekeeper` | header-only; the source was not inspected (the `system/libhardware/Android.bp` fetch returned 404) | n/a | part of AOSP | Google (AOSP) |
| `android.hardware.gatekeeper` AIDL (V1) | HAL interface; NDK, Java and Rust backends. Frozen at version 1, imports `keymint-V4`. | generated at build time, arch-neutral | n/a | part of AOSP | Google (AOSP) |
| `android.hardware.gatekeeper@1.0` HIDL | legacy HAL, still a gatekeeperd dependency | arch-neutral | HIDL software test under `1.0/software/tests/` | part of AOSP | Google (AOSP) |
| Cuttlefish `gatekeeper-service.remote` | Cuttlefish guest HAL. Forwards to the host through `libcuttlefish_transport`, `libcuttlefish_security` and `libtrusty`. Packaged in APEX `com.android.hardware.gatekeeper.cf_remote`. | `cuttlefish_guest_only` vendor binary, no arch conditions | not checked | part of Cuttlefish | Google (AOSP) |
| Cuttlefish `secure_env` | host-side process that answers Gatekeeper and KeyMint requests (riscv64 default) | cross-built via `HOST_CROSS_ARCH := arm64`, or x86_64 by override | not checked | part of Cuttlefish | Google (AOSP) |
| Trusty Gatekeeper TA | real TEE implementation | no riscv64 Trusty TA found | n/a | not part of riscv64 Cuttlefish | open question |
| `gatekeeperd` and framework libs (`libbinder`, `libbinder_ndk`, `libbase`, `libutils`, `liblog`, `libcutils`, `libhidlbase`, `libgsi`) | `system/core/gatekeeperd` binder service and its runtime libraries | same Soong rules, no arch conditions; core AOSP libraries built for riscv64 in Cuttlefish images | `gatekeeperd_service_fuzzer` exists; not checked on riscv64 | part of AOSP | Google (AOSP) |
| `lib_android_keymaster_keymint_utils`, `android.security.authorization-ndk` | KeyMint and keystore glue used by gatekeeperd | not inspected | not checked | part of AOSP | Google (AOSP) |
| libgflags (static) | flags for the Cuttlefish remote HAL | plain C++ | not checked | n/a | upstream gflags |

Deep dive on dependencies with SIMD or crypto:

- scrypt is the only architecture-specific dependency. It has NEON and SSE paths and a reference fallback. riscv64 uses the fallback. The tests link `libcrypto` and `libscrypt_static`.
- BoringSSL is the crypto dependency for HMAC, SHA-256 and RAND in the software HAL. It was not audited here. See the [BoringSSL report](boringssl.md).
- The legacy HIDL HAL remains a gatekeeperd dependency. The AIDL V1 HAL imports `keymint-V4`, which ties Gatekeeper to the KeyMint stack.
- The project-graph tool was not available, so the Ubuntu package mappings and graph "found/not found" status for these dependencies were not verified.

## 11. Known Bugs and Active Issues

No open riscv64 bugs or issues were found for Gatekeeper. The AOSP issue tracker (issuetracker.google.com), Gerrit and cs.android.com were not searched directly, so absence there is unconfirmed.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| b/339926078 | In-guest secure HALs break riscv64 Cuttlefish boot | Referenced in `846195d82` and `9300136e9`. Worked around by keeping riscv64 on the host `secure_env` path. | Medium (blocks in-guest Gatekeeper and KeyMint on riscv64) | Internal Google tracker, not publicly readable. Root cause not documented publicly. |
| b/332977378 | Use of in-guest secure HALs by default | Referenced in the same commits | Medium | Internal tracker, not publicly readable. |
| TODO in `flags.cc` | "schuffelen - fix behavior on riscv64" | Still present at HEAD `a1162ca7a`, lines 1157-1165 | Medium | See [flags.cc history](https://android.googlesource.com/device/google/cuttlefish/+/9300136e990d249017e788e834f22be80645f0ad) |
| aosp/3077417 | Fix named as the "immediate issue" fix in `f87300b93` | Not fetched | n/a | The riscv64 failure reappeared after this, per `846195d82`. |
| bionic tracker SL_00_001 | Missing hardware breakpoint support on riscv64, projected target API 35 | Listed in the [RISE Confluence](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8587472/SL_00_001+-+bionic) | Low for Gatekeeper | Does not mention Gatekeeper. |

Correctness bugs: none riscv64-specific. The Gatekeeper CVEs that came up are architecture-independent:

- [CVE-2022-20377](https://vulert.com/vuln-db/CVE-2022-20377): a flaw in `keymaster_ipc.cpp` that lets an attacker force a known HMAC key. Fixed in the 2022-08-05 update.
- [CVE-2019-2115](https://launchpad.net/bugs/cve/CVE-2019-2115): a double free in `GateKeeper::MintAuthToken`, affecting Android 7.1.1 to 9.

Discrepancies to note:

- The `9300136e9` commit is titled "Use in-guest keymint on platforms other than riscv64", and its fetched page did not mention Gatekeeper. The Gatekeeper link rests on the `flags.cc` code, which sets `secure_hals` to `keymint,gatekeeper,oemlock` for riscv64.
- The merge SHAs `c2de90610`, `c59de44b6` and `979a24e14` quoted in one research pass were not confirmed. Gerrit change numbers 3063526, 3083615 and 3084667 were matched by Change-Id.

## 12. Objections and Upstream Blockers

- Stated objections: none found. No upstream discussion of a Gatekeeper riscv64 port was found. The search for "Gatekeeper riscv64 maintainer governance" returned only unrelated results.
- Technical blockers:
  - The in-guest Gatekeeper and KeyMint path breaks riscv64 Cuttlefish boot (b/339926078). The root cause is not public.
  - No riscv64 Trusty Gatekeeper TA was found.
  - Google removed riscv64 from the ACK/GKI in 2024, so there is no officially supported riscv64 Android kernel. A riscv64 Gatekeeper deployment needs a vendor kernel.
- Organizational blockers:
  - Google controls the repo and the Cuttlefish launcher through Gerrit. The internal trackers are not public.
  - Real Gatekeeper implementations belong to chip and device vendors, so a RISC-V TEE would need its own implementation.
  - RISE's published follow-up RFPs (Bionic, BoringSSL, ART, V8, Chrome, multimedia libraries) do not list Gatekeeper, KeyMint or Trusty.
- Acceptance probability: not applicable for Gatekeeper's own code, since no patches are required. For a fix of the Cuttlefish riscv64 special case, acceptance is plausible because Google's own TODO asks for it, but no schedule is public.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** RISE

Justification: Gatekeeper has no CI of its own and no riscv64 code, so the upstream CI step gives orange. The distribution floor lifts it to yellow. The portable C++ [libgatekeeper](https://android.googlesource.com/platform/system/gatekeeper) has no arch conditions. The upstream Cuttlefish riscv64 products pull in the Gatekeeper HAL APEXes via [shared/device.mk](https://android.googlesource.com/device/google/cuttlefish). RISE's Android 17 manifest ([android_manifest](https://github.com/riseproject-dev/android_manifest)) carries `system/gatekeeper` unmodified. Whether this tree was built or booted was not confirmed. Cuttlefish riscv64 deliberately keeps Gatekeeper on the host `secure_env` path (`flags.cc` TODO, [commit 846195d82](https://android.googlesource.com/device/google/cuttlefish/+/846195d826ab5b9fbf98dd9b0101fa08bd0364b0), b/339926078), which is a documented workaround rather than a break. Confidence is medium-low because no riscv64 CI or test result is visible publicly.

Pending work that could change the grade:

- Cody Schuffelen's TODO in Cuttlefish `flags.cc`, "fix behavior on riscv64" (b/339926078, b/332977378), would let riscv64 run in-guest Gatekeeper and KeyMint like the other architectures.
- RISE's Android 17 effort (RFP RP024, phase 2) plans automated builds and hardware testing on the Alibaba A210 and SpacemiT K3 boards, which could add visible CI and test evidence.
- Not found anywhere: a riscv64 Trusty Gatekeeper TA, or riscv64 CI or VTS results for Gatekeeper (`VtsHalGatekeeperTargetTest`).
- The only arch-specific dependency is `external/scrypt`, which uses the portable reference C on riscv64 (a performance gap, not a correctness one).
- The first Android release with riscv64 was not determined. The earliest riscv64 Cuttlefish commit found is from 2023-08, and the riscv64 special case is on the android15-release branch. Google removed riscv64 from the ACK/GKI in 2024-04.

## 14. Investment Analysis

RISE has already funded the broad Android 17 RVA23 enablement (RFP RP024), including planned automated builds and hardware testing on A210 and K3 boards, with follow-up RFPs for Bionic, BoringSSL, ART, V8, Chrome and multimedia libraries. RISE has no Gatekeeper-specific work. Work that RP024 phase 2 covers (general image build automation and board-farm testing) is not sized below. The effort figures are the author's planning estimates, not figures from the research findings.

### 14.1 Functional Enablement

- Confirm that `system/gatekeeper`, the AIDL software HAL and `gatekeeper-unit-tests` build for `aosp_cf_riscv64_phone` and the RISE `android-17` tree, and run on K3 and A210 hardware. This is a verification task, since no source change is expected.
- Root-cause b/339926078 in the in-guest secure HAL path on riscv64 and remove the `flags.cc` special case. The bug is internal to Google, so this requires coordination with the Cuttlefish owners (Cody Schuffelen) and reproduction on a public riscv64 Cuttlefish build.
- A real TEE-backed Gatekeeper on riscv64 would need a Trusty or OP-TEE Gatekeeper TA, a persistent hardware key and a secure monotonic clock. No riscv64 Trusty target was found, so this is a large item and belongs to the TEE/KeyMint investment, not to Gatekeeper alone.

### 14.2 Performance Optimization

- Add a riscv64 scrypt implementation (RVV or Zvk-based) to `external/scrypt`, replacing the reference C. This is optional and mostly affects the nonsecure software Gatekeeper. No benchmark exists to size the gain, so measure the reference C first.

### 14.3 CI/CD Infrastructure

- Run `VtsHalGatekeeperTargetTest` and `gatekeeper-unit-tests` on riscv64 within the RISE RP024 phase 2 board-farm pipeline, and publish the results. Only the Gatekeeper test enrollment is incremental if RP024 delivers the pipeline.

### 14.4 Ecosystem Enablement

Not applicable. Gatekeeper has no dependent package ecosystem (Section 10 omitted).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify Gatekeeper build and run on RISE `android-17` tree and riscv64 Cuttlefish | 1-2 | RISE/chip vendor | High |
| Functional | Root-cause b/339926078 and remove the Cuttlefish riscv64 `secure_hals` special case | 3-6 | Google Cuttlefish owners with RISE/vendor support | Medium |
| Functional | riscv64 Trusty or OP-TEE Gatekeeper TA (TEE track) | Not sized, depends on TEE choice | Chip vendor | Low until a riscv64 TEE exists |
| Performance | RVV/Zvk `crypto_scrypt` for `external/scrypt` | 2-4 | Chip vendor | Low |
| CI/CD | Enroll Gatekeeper VTS and unit tests in the RP024 board-farm pipeline | 1-2 | RISE | Medium |

## 15. References

- [system/gatekeeper (AOSP)](https://android.googlesource.com/platform/system/gatekeeper)
- [system/gatekeeper Android.bp, main](https://android.googlesource.com/platform/system/gatekeeper/+/refs/heads/main/Android.bp)
- [system/gatekeeper tests, main](https://android.googlesource.com/platform/system/gatekeeper/+/refs/heads/main/tests/)
- [system/gatekeeper commit log, main](https://android.googlesource.com/platform/system/gatekeeper/+log/refs/heads/main)
- [hardware/interfaces gatekeeper](https://android.googlesource.com/platform/hardware/interfaces/+/refs/heads/main/gatekeeper/)
- [hardware/interfaces gatekeeper AIDL](https://android.googlesource.com/platform/hardware/interfaces/+/refs/heads/main/gatekeeper/aidl/)
- [external/scrypt (AOSP)](https://android.googlesource.com/platform/external/scrypt)
- [device/google/cuttlefish](https://android.googlesource.com/device/google/cuttlefish)
- [Cuttlefish shared/config](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/shared/config/)
- [Cuttlefish flags.cc on android15-release](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/android15-release/host/commands/assemble_cvd/flags.cc)
- [Cuttlefish commit 846195d82 (Revert^3)](https://android.googlesource.com/device/google/cuttlefish/+/846195d826ab5b9fbf98dd9b0101fa08bd0364b0)
- [Cuttlefish commit 9300136e9 (in-guest keymint other than riscv64)](https://android.googlesource.com/device/google/cuttlefish/+/9300136e990d249017e788e834f22be80645f0ad)
- [Cuttlefish commit f87300b93 (Revert^2)](https://android.googlesource.com/device/google/cuttlefish/+/f87300b935069949f06763a013243a347465170e)
- [Cuttlefish commit 81634ff43 (exclude Widevine from riscv64)](https://android.googlesource.com/device/google/cuttlefish/+/81634ff43)
- [Android Gatekeeper documentation](https://source.android.com/docs/security/features/authentication/gatekeeper)
- [Android and RISC-V: What you need to know to be ready (Google Open Source Blog)](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html)
- [CNX Software: Android no longer supports RISC-V](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/)
- [The Register: RISC-V support in Android pulled](https://www.theregister.com/2024/05/01/riscv_support_android_pulled/)
- [Hackster: Google removes RISC-V support from the Android Common Kernel](https://hackster.io/news/google-removes-risc-v-support-from-the-android-common-kernel-but-denies-abandoning-the-isa-c4ccab33a929)
- [heise report on RISC-V and Android](https://heise.de/-11308808)
- [RISE members](https://riseproject.dev/members/)
- [RISE home](https://riseproject.dev)
- [RISE blog: Android 17 Available on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE blog: Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE blog: RISE RISC-V Runners, Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE post on Rust riscv64 Tier 1 (quotes Android 15 RISC-V target)](https://riseproject.dev/?p=519)
- [RISE OP-TEE RISC-V docs](https://riscv-optee-docs.riseproject.dev/)
- [RISE Confluence: SL_00_001 bionic](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8587472/SL_00_001+-+bionic)
- [riseproject-dev/android_manifest](https://github.com/riseproject-dev/android_manifest)
- [android_manifest release android-17-v1.0](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0)
- [PyPI gatekeeper (unrelated project)](https://pypi.org/pypi/gatekeeper/json)
- [RISE wheel builder index for gatekeeper](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/gatekeeper/)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at)
- [junsun.net: riscv64 Cuttlefish on SpacemiT K3](https://junsun.net/wordpress/tag/riscv64/)
- [CVE-2022-20377](https://vulert.com/vuln-db/CVE-2022-20377)
- [CVE-2019-2115](https://launchpad.net/bugs/cve/CVE-2019-2115)
- [BoringSSL report](boringssl.md)