---
title: Android Virtualization Framework
parent: Project Reports
color: red
dependencies:
  - name: crosvm
    relation: runtime-dependency
    criticality: critical
  - name: pKVM
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: Soong
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="android-virtualization-framework" %}

# Android Virtualization Framework

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-25<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux and riscv64/android) support status for Android Virtualization Framework<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Android Virtualization Framework (AVF) runs virtual machines on Android devices. It includes protected VMs (pVMs) isolated from the host by the hypervisor. The [official documentation](https://source.android.com/docs/core/virtualization) calls the hypervisor pKVM and says "AVF is supported only on ARM64 devices." The architecture page describes the reference implementation as "currently limited to ARM64". [Architecture page](https://source.android.com/docs/core/virtualization/architecture) wording comes from search data and was not re-fetched [NEEDS VERIFICATION].

The code lives in [platform/packages/modules/Virtualization](https://android.googlesource.com/platform/packages/modules/Virtualization) in upstream AOSP. It ships as the `com.android.virt` APEX. Components found in the tree:

- pvmfw: the protected-VM boot firmware.
- Microdroid: the minimal Android guest.
- libvmbase: a no_std Rust base for guest firmware.
- Rialto: a service-VM component built on libvmbase.
- libhypervisor_backends: hypervisor backends for KVM on aarch64 and x86_64, Gunyah and GenieZone.
- authfs and other host services.
- The Debian "Ferrochrome" terminal guest image, in `build/debian` until it was deleted.

crosvm is the VMM that `virtualizationservice` drives.

**Governance and sponsors.**
- No foundation. AVF is run by Google as an AOSP project.
- The repo has no MAINTAINERS file. A Gerrit-style `OWNERS` file names the maintainers, all at google.com. Its header reads "Welcome to Android KVM!".
- Lead owners are Jiyong Park, Will Deacon and smoreland@. pKVM and kernel owners include Keir Fraser, Quentin Perret, Fuad Tabba, Vincent Donnefort, Sebastian Ene and Mostafa Saleh.
- The code is owned by the `trendy_team_android_kvm` team [NEEDS VERIFICATION, single source].
- The full git history has 23,128 commits. About 19,938 are from google.com, 2,986 from the Gerrit service account, 126 from quicinc.com, 42 from chromium.org and 15 from android.com. Qualcomm is the only visible non-Google vendor.
- Google LLC is a RISE Premier member ([RISE members](https://riseproject.dev/members/)). That page does not list AVF or any Android work, so there is no evidence that AVF is a RISE project.

**Community stance on new ports.** No public statement found. Neither the documentation nor the repo defines architecture tiers. Contributions go through AOSP Gerrit and `OWNERS` review. The only riscv64 changes in the history are build-keeping commits by Google engineers.

## 2. Port History and Upstreaming Timeline

There is no riscv64 port of AVF. The table lists riscv64-related events around it. Dates are commit dates unless stated.

| Date | Event | Source |
|---|---|---|
| 2021-11 | `external/crosvm/` added to the AOSP RISC-V repos list. The list's last entry is 2022-12-30 and it never mentions AVF or pKVM. | [aosp-riscv status.md](https://github.com/aosp-riscv/working-group/blob/master/status.md) |
| 2023-01-31 | android-riscv64 issue #10 opened: "bazel: microdroid will need bazel support for riscv64". | [issue 10](https://github.com/google/android-riscv64/issues/10) |
| 2023-02-06 | Revert of "Update source for Rust 1.66.1" (`cd1cf0346`, Chris Wailes). The message cites "Missing riscv support". It is a toolchain revert, not AVF riscv work. | [AVF repo](https://android.googlesource.com/platform/packages/modules/Virtualization) |
| 2023-03-22 | `ca0049be4` (Colin Cross, bug 273792258): skip `microdroid_crashdump_kernel` for riscv64 so `lunch aosp_riscv64-eng && m` builds. | [commit](https://android.googlesource.com/platform/packages/modules/Virtualization/+/ca0049be4d84897b8c9956924cfae506773103eb) |
| 2023-07-10 (authored), 2023-07-19 (merged as `5886dc6db`) | `01010afb2` (Braden Kell, bug 286142463): riscv64 cfg so `st_blksize` is `int`, fixing authfs test builds. | [commit](https://android.googlesource.com/platform/packages/modules/Virtualization/+/01010afb25b1dd2c57be137ef81ac5d041b8f318) |
| 2023-08-01 | crosvm `35828a105` (Dennis Kempin): "Enable riscv64 builder in presubmit". | [crosvm commit](https://android.googlesource.com/platform/external/crosvm/+/35828a105) |
| 2023-10 | Google blog "Android and RISC-V: what you need to know". | [blog](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html) |
| 2023-11-08 | crosvm riscv64 CI disabled for unstable Debian riscv64 cross-compile containers (BUG=b:304875018). | local report `project-reports/crosvm.md` |
| 2024-04-22 | `8dda210af` (Nikita Ioffe): Microdroid kernel update for arm64 and x86_64 (android15-6.6). No riscv64 prebuilt. | AVF repo |
| 2024-04/05 | Google removes riscv64 from the Android Common Kernel and GKI. | [The Register](https://www.theregister.com/on-prem/2024/05/01/google-pulls-risc-v-support-from-generic-android-kernel/918929) [NEEDS VERIFICATION] |
| 2024-06-26 | crosvm `650b0ec732` (Devin Moore, bug 349612065): riscv64 build fix after a `RunnableLinuxVm` change. | [crosvm commit](https://android.googlesource.com/platform/external/crosvm/+/650b0ec73) |
| 2024-09-20 | `37047c3e5` adds `build/debian/image.yaml`, copied from debian-cloud-images. It lists riscv64 but nothing builds it. | AVF repo |
| 2024-11-15 | android-riscv64 issue #10 closed. Microdroid kernels are GKI kernels with features disabled, so nothing extra is needed. | [issue 10](https://github.com/google/android-riscv64/issues/10) |
| 2025-03-17 | crosvm riscv64 CI re-enabled. | local report `project-reports/crosvm.md` |
| 2025-08-11 | `1ffeb948b` (Vineeth Pillai, bug 393092130): pvmfw DT templates split into arm64 and x86_64. The earlier attempt broke targets "like riscv". | [commit](https://android.googlesource.com/platform/packages/modules/Virtualization/+/1ffeb948bd36cb4c739b14fa0eeac454d508f871) |
| 2025-11-12 | `334d83c48` (Inseob Kim): Debian build script uses GKI. `image.yaml` is absent from `android17-release`. Whether this commit deleted it is unconfirmed. [NEEDS VERIFICATION] | AVF repo |
| 2026-04-24 | `android17-release` tip `22f1c9ee9`. Its only riscv hit is the Soong comment. | AVF repo |
| 2026-10-14 / 2026-10-20 | RISE Android 17 v1.0 on RVA23 (RP024). It does not mention AVF, virtualization, pKVM, crosvm or KVM. | [RISE post](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/), [release](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0) |

**Contributors.** All are Google engineers: Colin Cross, Braden Kell, Chris Wailes, Nikita Ioffe, Vineeth Pillai, Inseob Kim, plus Dennis Kempin and Devin Moore on crosvm.

**Upstream or vendor.** Everything found is upstream AOSP. No vendor or downstream AVF-on-RISC-V effort was found. The RISE Android 17 build is a downstream effort and does not include AVF.

**First Android release with riscv64 in this module.** The sources disagree on the first Android release with riscv64:
- Branch containment shows `ca0049be4` first in android-14.0.0_r1. The commit predates the freeze, so the bring-up happened in the Android 14 development cycle. `01010afb2` first appears in the android14-qpr2-release branch (android-14.0.0_r29).
- A Google quote in the [RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/) says "Android has added support for RISC-V as a target as of Android 15". The [google/android-riscv64](https://github.com/google/android-riscv64) sample build reports `PLATFORM_VERSION=VanillaIceCream`. Neither is AVF-specific.
- The commit evidence for AVF plumbing is Android 14. Android 15 is Google's statement about riscv64 as an Android target.

**Verification.** At the `main` tip `175a51b3` (2025-03-26), `authfs/src/fusefs.rs` has no riscv match even though the history shows the `01010afb2` cfg, so the fix may have been changed or removed since. [NEEDS VERIFICATION]

## 3. Upstream Support Tier

No formal tier policy exists for AVF. The de facto policy is the documented "ARM64 only" statement, with x86_64 used for Cuttlefish development. Neither the docs nor the repo define tiers. No riscv64 binaries are released, and nothing is release-blocking for riscv64.

| Aspect | arm64 | x86_64 | riscv64 |
|---|---|---|---|
| Documented support | Yes. "AVF is supported only on ARM64 devices." | Testing only, non-protected VMs (architecture page) | None |
| Supported devices | Pixel 6, 6 Pro, 7, 7 Pro, Fold, Tablet (`docs/getting_started.md`) | `aosp_cf_x86_64_phone` Cuttlefish, which "does not support protected VMs" | None |
| Hypervisor | pKVM at EL2 | KVM (Cuttlefish) | None |
| Protected VMs | Yes | No | No |
| Microdroid kernel prebuilts | android15-6.6, android16-6.12 (incl. 16k) | android15-6.6, android16-6.12 (incl. x86_64-desktop) | None |
| pvmfw | Yes | Recent (2025), experimental [NEEDS VERIFICATION] | None |
| Repo CI | Debian guest image Kokoro jobs (`aarch64/`); internal Busytown suites | Debian guest image Kokoro jobs (`x86_64/`) | None |

**CI and release evidence.** `TEST_MAPPING` defines `avf-presubmit` and `avf-postsubmit` with no architecture qualifier. They run in Google-internal Busytown/ATP, which was not readable. No official binaries exist for any architecture outside AOSP and device images.

## 4. Technical Architecture and RISC-V-Specific Subsystems

AVF has no JIT and no SIMD code. The architecture-specific parts are the hypervisor interface, firmware, guest base library and kernels. Source scans found 8 `.S` files with no riscv variant, and no `arch/riscv*` directory.

| Component | arm64 | x86_64 | riscv64 |
|---|---|---|---|
| pKVM (protected hypervisor, EL2) | Yes | No | No equivalent found |
| libvmbase entry and exceptions (`.S`) | `entry`, `exceptions`, `exceptions_panic`, `idmap` | `entry`, `gdt`, `idmap` | Missing |
| libvmbase `arch.rs` | Yes | Yes | Ends in `compile_error!("Unsupported target_arch")` [NEEDS VERIFICATION] |
| libhypervisor_backends | `kvm_aarch64.rs`, Gunyah, GenieZone | `kvm_x86.rs` | No RISC-V KVM backend |
| Page tables | `libaarch64_paging` | x86_64 idmap | Missing |
| SMCCC/PSCI | `libsmccc`, PSCI | N/A | No SBI equivalent in tree |
| pvmfw | Yes (`src/arch/aarch64`) | Yes (`src/arch/x86_64`, 2025) | Missing |
| Microdroid kernel | Yes | Yes | No prebuilt |
| `microdroid_crashdump_kernel` | Yes | Yes | "doesn't exist for riscv64 yet" |
| `com.android.virt` APEX contents | `arch: arm64` block | `arch: x86_64` block | Empty of `crosvm`, `virtmgr`, `virtualizationservice` |
| crosvm (VMM) | Yes | Yes | `riscv64/` crate, `hypervisor/src/kvm/riscv64.rs`, seccomp policies. No protected VM. |

Notes:
- **Rust arch cfgs.** The branches disagree on counts: 60 `aarch64` and 35 `x86_64` on the android17-release scan, and 52 and 25 on the other checkout. Both have zero riscv64 arms outside the one authfs cfg. These are two scans of different branches.
- **ISA extensions.** The riscv64 code in AVF itself is only the `st_blksize` cfg. Data not available on required extensions for a port; the RISE Android 17 build targets RVA23.
- **crosvm riscv64 crate.**
  - Memory and boot: DRAM at 0x8000_0000, kernel at a 2 MiB offset, FDT creation.
  - Interrupts: AIA/IMSIC-style irqchip (no PLIC). A comment says IRQ numbers are "bogus since the events aren't actually wired up".
  - Devices: serial, PCI root and platform MMIO.
  - Gaps: `ProtectedVmUnsupported`, `PciMemNotConfigurable`, BIOS images rejected, GDB ops `unimplemented!()`, host CPU capacity queries empty.
- **pKVM.** `docs/device_assignment_pkvm.md:16` says "Architecture: arm64 only". `docs/debug/tracing.md` says "pKVM hypervisor is only supported on arm64".
- **Crypto and DICE.** BoringSSL (`libbssl_avf`) is a dependency; see Section 9. Whether `libdiced_open_dice` and `libpvmfw_avb_nostd` build for riscv64: data not available.

## 5. Build System, Cross-Compilation, and Toolchain

AVF builds only inside AOSP via Soong/Make. There is no cmake or configure flow and no `-DUSE_X=OFF` flags. The documented commands (`docs/getting_started.md`, `build/microdroid/README.md`) name no riscv64 target:

```
source build/envsetup.sh
lunch aosp_cf_x86_64_phone-trunk_staging-userdebug
m
cvd create

banchan com.android.virt aosp_arm64
UNBUNDLED_BUILD_SDKS_FROM_SOONG=true m apps_only dist
adb install out/dist/com.android.virt.apex
```

(The environment variable in the source is `UNBUNDLED_BUILD_SDKS_FROM_SOURCE=true`; use that exact name.)

- **Product inclusion.** Add `$(call inherit-product, packages/modules/Virtualization/build/apex/product_packages.mk)` to a device makefile. It sets `PRODUCT_AVF_ENABLED := true`.
- **riscv64 targets.** The `lunch aosp_riscv64-eng && m` test in commit `ca0049be4` shows a riscv64 AOSP build skips the crashdump kernel. A hypothetical `banchan com.android.virt aosp_riscv64` was not verified. The Google blog suggests Cuttlefish `aosp_cf_riscv64_phone-userdebug` as the developer setup, and it is not an AVF flow.
- **Toolchain.** No minimum versions are documented. AOSP prebuilt Clang and Rust from `prebuilts/` are used. `build/debian/Dockerfile` (Ubuntu 22.04) implies GCC 11.4 and CMake 3.22 but states no minimum. The Rust 1.66.1 update was reverted for "Missing riscv support" (`cd1cf0346`).
- **crosvm.**
  - Target is `riscv64gc-unknown-linux-gnu`. `.cargo/config.debian.toml` sets linker `riscv64-linux-gnu-gcc` and runner `qemu-riscv64-static`.
  - Unit tests run with `./tools/run_tests --platform=riscv64` under QEMU user mode.
  - The docs reference `./tools/setup-riscv64`, but that script is absent from the AOSP fork, which has only `setup-aarch64`, `setup-armhf` and `setup-mingw64`.
  - `DO_NOT_BUILD_RISCV64` excludes libvda, libva, ffmpeg, vmm_vhost, system_api and gpu_display.
  - Upstream crosvm pins Rust 1.77.2. AOSP uses its own Rust prebuilt.
- **QEMU.** AVF documents no riscv64 QEMU flow. The Debian guest build uses `qemu-user-static` and accepts only `aarch64` or `x86_64`, failing with "Invalid architecture". Cuttlefish for riscv64 needs QEMU 8.1 or newer.
- **Known build failures.** See Section 11.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | arm64 | x86_64 | riscv64 |
|---|---|---|---|
| Non-protected VMs (crosvm/KVM) | Yes | Yes | crosvm riscv64 crate exists; no AVF integration |
| Protected VMs (pVM) | Yes, pKVM | No | No |
| pvmfw | Yes | Experimental | No |
| Microdroid | Yes | Yes | No kernel, no images |
| `virtualizationservice` / `virtmgr` in APEX | Yes | Yes | Not in APEX |
| Device assignment | Yes (arm64 only) | No | No |
| Debian terminal guest (Ferrochrome) | Yes | Yes | No (`build.sh` rejects) |
| Tracing (pKVM) | Yes | No | No |

**Functional gaps.** pVMs, pvmfw, Microdroid, the VM service stack and the hypervisor cannot run on riscv64 at all.

**Performance gaps.** Data not available. No AVF benchmark exists for any architecture on riscv64, and no RISE post or release note contains AVF benchmarks. The architecture page has only qualitative remarks on MMIO cost and identity-mapped host memory.

**Security hardening gaps.**
- No isolation primitive equivalent to pKVM is documented for RISC-V.
- The RISE Android 17 v1.0 build ships SELinux permissive and no secure boot or TEE (stated as out of scope in the release notes). pVM attestation depends on those, which is an inference and not something the notes state.
- The A210 build runs U-Boot with AVB verification disabled.

**NaN and floating-point semantics.** Not applicable; no numerics in AVF-owned code.

## 7. CI/CD Infrastructure

AVF has no riscv64 CI. An independent check of the `main` tip found:
- `TEST_MAPPING` has no architecture qualifier and no riscv mention. It points to a Google-internal Busytown config (`wireless/android/busytown/ath_config/configs/prod/avf/tests.gcl`), which could not be read.
- `PREUPLOAD.cfg` has only format and lint hooks.
- No `.github` directory, Jenkinsfile, cloudbuild or luci config.
- `build/debian/kokoro/gcp_ubuntu_docker/` has only `aarch64/` and `x86_64/`.
- `build/debian/image.yaml` lists riscv64 as an arch but every release entry matches only `[amd64, arm64, ppc64el]`. It declares an entry that nothing builds.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Repo-visible CI | Debian Kokoro job | Debian Kokoro job | None |
| Internal suites (`avf-presubmit`, `avf-postsubmit`) | Not readable | Not readable | No evidence |
| Hardware | Cuttlefish | Pixel devices | None for AVF |
| RISE runners | None | None | None used for AVF |

**Related riscv64 CI (not AVF).**
- crosvm has a `linux_riscv64` LUCI builder. It was added 2023-08-01, disabled 2023-11-08 and re-enabled 2025-03-17 per the local crosvm report. Its tests run under `qemu-riscv64` user mode. I did not open `main.star`, so what the builder builds and tests is unknown.
- RISE Android 17 phase 2 plans automated build and hardware testing on the RISE Board Farm, starting with Alibaba A210, adding SpacemiT K3 later. No AVF test is described.

## 8. Distribution and Release Status

No riscv64 binary exists in any channel checked.

| Channel | Result |
|---|---|
| AOSP repo | Source only. Branches `main`, `aml_*`, tags `android-platform-*` and `android-security-*`. No release assets. |
| PyPI `android-virtualization-framework` | HTTP 404. |
| RISE wheel index | Redirects to PyPI, which returns 404. No wheel. |
| Ubuntu 26.04 (resolute) packages page | HTTP 500, inconclusive. Launchpad API found 0 matching binaries in the Ubuntu primary archive and 0 sources for the AOSP-style name. |
| Debian | No match in sources.debian.org search. |
| Arch Linux RISC-V | No AVF, microdroid or crosvm entries in the listings fetched. One listing came back empty, so this channel is weakly checked. |
| RISE Android 17 v1.0 | Binary images for SpacemiT K3 and Alibaba A210. No AVF mention. |

AVF is an AOSP module delivered as an APEX, not a standalone distro package, so no distro package is expected.

**What a user must do for a working binary.** Nothing works today. A riscv64 AOSP build produces a `com.android.virt` APEX without the VMM binaries, because the `arch:` blocks in `build/apex/Android.bp` carry them only for arm64 and x86_64 (derived from the source). A working riscv64 AVF requires the port in Section 14.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| crosvm | VMM driven by `virtualizationservice` | Yes, `riscv64` crate; cross-build in CI | `qemu-riscv64` user-mode unit tests only | No official binaries | Google; no protected VM on riscv64 |
| pKVM | Protected hypervisor for pVMs | No. arm64 only. | None | None | Google Android KVM team |
| Linux kernel | Host KVM and guest (Microdroid GKI) kernel | Mainline Linux and RISC-V KVM build on riscv64. Android GKI riscv64 removed 2024. No Microdroid riscv64 kernel. | Not assessed | Distro kernels only (Ubuntu 26.04 `linux-image-generic` 7.0.0-14.14.2) | Google ACK; RISE `android_kernel_common` fork |
| Rust | Builds every AVF component | Yes, `riscv64gc-unknown-linux-gnu` is Tier-2 (as of 2025-04-15, per RP004); local report `project-reports/rust.md` rates yellow | Per that report | Ubuntu 26.04 `rustc` and `cargo` 1.93.1ubuntu1 | RISE RP004 funds Tier-1 work |
| Soong | AOSP build system for AVF | Used for `aosp_riscv64` builds, which skip riscv64-missing deps. RISE forks it as `android_build_soong`. Other data not available. | Data not available | Part of AOSP | Google; RISE fork |
| Microdroid kernel / GKI | Guest kernel | arm64 and x86_64 prebuilts only | None | None | Google |
| pvmfw | Protected-VM firmware | arm64 (x86_64 recent). No riscv64. | arm64 only | None | Google |
| libvmbase / libhypervisor_backends | no_std guest base | arm64 and x86_64 only | arm64 only | None | Google |
| BoringSSL | Crypto in pvmfw, Microdroid, service VM | Yes; local report `project-reports/boringssl.md` rates yellow | Per that report | Ubuntu universe `android-libboringssl-dev` 14.0.0+r45-3 | RISE plans a BoringSSL RFP |
| Bionic / ART | Microdroid libc and runtime | Yes (upstream riscv64 port); `project-reports/bionic.md` orange, `project-reports/art.md` blue | QEMU only | Provisional NDK ABI | Google; RISE RFP planned |
| minijail | crosvm sandbox | Cross-compiles | No riscv64 CI | Gentoo `~riscv` only | Google |
| libfdt / dtc | Device-tree handling | Yes | Not assessed | Ubuntu main `libfdt-dev` and `device-tree-compiler` 1.7.2-2ubuntu1 | Upstream |
| libavb | Verification in `libpvmfw_avb_nostd` | Data not available | Data not available | No package found | Google; see AVB research item |
| open-dice | DICE chain | Data not available | Data not available | Data not available | Google |
| virtio-drivers | no_std virtio drivers | Not verified (page returned 404) | Not assessed | Data not available | Upstream |
| Protocol Buffers | RPC and metadata | See `project-reports/protocol-buffers.md` (orange) | Per that report | Ubuntu 3.21.12-15ubuntu1 | Upstream |
| QEMU | Emulator for riscv64 Android | `project-reports/qemu.md` (yellow) | N/A | Ubuntu 1:10.2.1+ds-1ubuntu3 (`qemu-system-misc`) | Upstream |
| OpenSBI | Firmware beneath a RISC-V hypervisor | `project-reports/opensbi.md` (orange) | N/A | Ubuntu main 1.8.1-1 | AVF does not depend on it today |
| Other Rust crates (ciborium, zerocopy, zeroize, bindgen, libc) | CBOR, parsing, key wiping, bindings | Pure Rust, packaged in Ubuntu 26.04 universe; zerocopy yellow | Not assessed | Packaged | Upstream |
| aarch64-paging, coset, buddy-system-allocator | Page tables, COSE, allocator | `aarch64-paging` is arm64-only by design; others not packaged | Data not available | Not packaged | Upstream |

**Deep dive: critical dependencies.**

- **crosvm.**
  - Upstream riscv64 support (KVM, AIA interrupt controller) exists since November 2021 per the local crosvm report. The crate is kept compiling (`650b0ec732`).
  - It cannot run protected VMs (`ProtectedVmUnsupported`), has no GDB stub, no vCPU snapshot/restore, no live migration and no Vector extension.
  - The crosvm in the AOSP March 2025 snapshot has riscv64 wiring in `Android.bp` `arch` blocks. Check newer branches before relying on it.
  - Ubuntu 26.04 has no `crosvm` package.
  - Sub-dependencies: minijail (no riscv64 CI), libcap, libseccomp and zstd (packaged in Ubuntu 26.04).
- **pKVM.**
  - Described in Arm terms (hypervisor at EL2, kernel at EL1). Docs state it is arm64 only.
  - No RISC-V pKVM equivalent was found in any source fetched. Mainline Linux has a RISC-V KVM backend, with no protected-guest variant found [NEEDS VERIFICATION, based on absence of evidence].
  - Other hypervisor backends in AVF are Gunyah and GenieZone (arm).
- **Linux kernel.**
  - Microdroid kernels are GKI kernels with more features disabled (android-riscv64 issue #10 closing comment). Google removed riscv64 from ACK/GKI in 2024, so no Google kernel line exists for a riscv64 Microdroid [NEEDS VERIFICATION, single press source].
  - RISE's `android_kernel_common` fork has `build.config.gki*` files for aarch64, riscv64 and x86_64 on `android-mainline-spacemit` and `android-mainline-alibaba` branches. Its README does not mention KVM, pKVM or KMI, and the `virt` directory was not inspected.
  - The RISE Android 17 release uses android-mainline 7.1.
- **Rust.** All AVF components are Rust or Soong-built. Rust `riscv64gc-unknown-linux-gnu` was Tier-2 as of 2025-04-15, and RP004 is a RISE RFP to reach Tier-1. The AVF-specific no_std targets (bare-metal firmware targets on riscv64) were not assessed: data not available.
- **Soong.** Beyond handling `arch { riscv64 }` blocks in `Android.bp` and the RISE fork `android_build_soong`, data not available: what the RISE fork changes was not read.

## 11. Known Bugs and Active Issues

No open riscv64 issue exists for AVF itself. The Gerrit query for riscv in the Virtualization project returned an empty page, which proves nothing. issuetracker.google.com was not reachable. A search of google/crosvm GitHub issues for riscv returned 0 results (weak evidence, since GitHub is a mirror of Google's tracker). Open Gerrit changes were not checked.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| b/273792258 | `microdroid_crashdump_kernel` has no riscv64 prebuilt | Worked around (dependency skipped); comment still in `build/microdroid/Android.bp` | Medium | Microdroid on riscv64 lacks a crash-dump kernel |
| b/286142463 | `st_blksize` type for riscv64 in authfs tests | Fixed (`01010afb2`, merged 2023-07-19) | Low | Fix not found at `main` tip `175a51b3` by one check [NEEDS VERIFICATION] |
| b/393092130 | pvmfw DT template build broke on other targets "like riscv" | Fixed (`1ffeb948b`) | Low | pvmfw only has arm64 and x86_64 DT templates |
| b/349612065 | crosvm riscv64 build break after `RunnableLinuxVm` change | Fixed (`650b0ec732`) | Low | Shows crosvm riscv64 is only kept compiling |
| b:304875018 | crosvm riscv64 CI disabled (unstable containers) | Closed (re-enabled 2025-03-17) | Medium | From local crosvm report |
| android-riscv64 #10 | bazel: microdroid will need bazel support for riscv64 | Closed 2024-11-15 | Low | Only Microdroid issue in `google/android-riscv64` |
| crosvm gap | `ProtectedVmUnsupported` on riscv64 | Open (code limitation) | Critical | Blocks pVMs in the VMM |
| crosvm gap | `PciMemNotConfigurable`, BIOS rejected, GDB unimplemented, IRQ wiring comment | Open (code limitations) | Medium | From riscv64 crate source |

Other android-riscv64 Cuttlefish issues (#85, #86, #113, #116, #131, #133, #137, #144, #146, #150, #163, PR #125) concern Cuttlefish, not AVF. Only the first 11 of 23 search results were read.

**Correctness bugs.** None found.

## 12. Objections and Upstream Blockers

**Stated objections.** None found. No public statement from AVF owners about riscv64.

**Technical blockers.**
- No RISC-V equivalent of pKVM protected VMs. This is the architectural root blocker.
- pvmfw and libvmbase need riscv64 entry code, MMU setup, exception handling and SBI in place of the AArch64 assembly, PSCI and SMCCC.
- `libhypervisor_backends` has no RISC-V KVM backend.
- No riscv64 Microdroid kernel; Google removed riscv64 from the Android Common Kernel and GKI in 2024.
- crosvm riscv64 has no protected VM support.
- The RISE Android 17 build ships no TEE and no secure boot, which pVM attestation relies on (inference).

**Organizational blockers.**
- AVF is Google-run with Google-only owners. Qualcomm is the only visible non-Google vendor in the history.
- No governance path for third-party architectures is documented.
- RISE has no involvement. No AVF, pKVM, crosvm or Microdroid mention in its blog posts or repos, though it has a "Kernel & Virtualization" working group and a `kernel-and-virtualization-wg` repo.

**Acceptance probability.** Data not available. No upstream stance was found, and no estimate is made.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none

Upstream states [AVF is supported only on ARM64 devices](https://source.android.com/docs/core/virtualization), and it depends on pKVM, which is Arm-specific. The repo has no riscv64 code: libvmbase ends in `compile_error!("Unsupported target_arch")`, pvmfw and the Microdroid kernel prebuilts exist only for arm64 and x86_64, and the riscv64 hits are only a "doesn't exist for riscv64 yet" comment and build shims such as [ca0049be4](https://android.googlesource.com/platform/packages/modules/Virtualization/+/ca0049be4d). It has no riscv64 CI and no release.

**Pending work that could change the grade.**
- No open riscv64 work for AVF itself and no RISE involvement. The Virtualization repo has no riscv64 issues or PRs on GitHub, and open Gerrit changes were not checked.
- RISE's Android 17 on RVA23 port (RP024) does not include AVF.
- crosvm, AVF's VMM, has a riscv64 arch crate and CI, but it supports non-protected VMs only.
- Google removed riscv64 from the Android Common Kernel and GKI in 2024, so there is no riscv64 kernel line for Microdroid.
- A port would need a pKVM equivalent for RISC-V plus riscv64 ports of pvmfw, vmbase and the Microdroid kernel.
- Gaps in this research: the Ubuntu 26.04 package check was inconclusive, and a git diff-content (`-G`) search for riscv commits was never completed.

## 14. Investment Analysis

**RISE check.** RISE has funded the Android 17 RVA23 port (RP024, engineering by BayLibre, boards SpacemiT K3 and Alibaba A210) and Rust Tier-1 (RP004). Planned follow-up RFPs cover Bionic, BoringSSL, ART, V8, Chrome and multimedia libraries. Nothing covers AVF, pKVM, crosvm or KVM-on-Android, so none of the work below is already funded. The Bionic, BoringSSL and ART RFPs, when issued, would cover some dependencies.

Effort figures are engineering estimates derived from the gap list in Sections 4 and 12. They are not taken from the research findings. Treat them as order-of-magnitude placeholders.

### 14.1 Functional Enablement

Two tracks, in order:

1. **Non-protected AVF on riscv64.**
   - Build `com.android.virt` for riscv64 with `crosvm`, `virtmgr` and `virtualizationservice` in the APEX.
   - Add a RISC-V KVM backend to `libhypervisor_backends`.
   - Bring up a riscv64 Microdroid kernel and images on KVM. This depends on a riscv64 GKI-like kernel, which Google dropped; RISE's `android-mainline` kernel is the nearest base.
2. **Protected VMs.**
   - Design and implement a RISC-V protected-guest isolation layer (the pKVM equivalent).
   - Add `ProtectedVmUnsupported` handling in crosvm.
   - Port vmbase (entry, MMU, exceptions, SBI) and pvmfw (DT template, DICE chain), replacing `aarch64-paging` and `libsmccc`.

Track 2 has no documented RISC-V design to build on and is research-grade work.

### 14.2 Performance Optimization

No AVF benchmark exists on any architecture for riscv64. Establish a baseline harness (VM boot time, MMIO and virtio throughput) once non-protected AVF runs. SIMD/JIT work: none in AVF-owned code.

### 14.3 CI/CD Infrastructure

Add riscv64 AVF build and VM tests to Cuttlefish `aosp_cf_riscv64_phone` or the RISE Board Farm (Alibaba A210, SpacemiT K3). RISE phase 2 of RP024 provides the base CI. Google's internal Busytown suites are not accessible, so tests must be mirrored externally.

### 14.4 Ecosystem Enablement

No dependent package ecosystem. Dependency work is limited to verifying `libavb`, `open-dice` and `virtio-drivers` on riscv64 and replacing the arm64-only `aarch64-paging` crate.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream agreement with Google Android KVM team on a riscv64 AVF scope | 4-8 | Chip company with Google | Critical |
| Functional | riscv64 `com.android.virt` APEX with crosvm, virtmgr, virtualizationservice | 6-10 | Chip company | High |
| Functional | RISC-V KVM backend in `libhypervisor_backends` | 4-8 | Chip company | High |
| Functional | riscv64 Microdroid kernel and images (non-protected) | 10-16 | Chip company / RISE | High |
| Functional | vmbase riscv64 (entry, MMU, exceptions, SBI) | 16-26 | Chip company | High |
| Functional | pvmfw riscv64 port (DT template, DICE, crypto) | 12-20 | Chip company | High |
| Functional | crosvm riscv64 protected VM support | 12-20 | Google / chip company | High |
| Functional | RISC-V pKVM equivalent (protected-guest hypervisor design and implementation) | 100+ (no design exists) | Chip company with RISE Kernel & Virtualization WG | Medium |
| Performance | Baseline benchmark harness for riscv64 vs arm64 | 4 | Chip company | Medium |
| CI/CD | riscv64 AVF build and VM tests on Board Farm / Cuttlefish | 6-10 | RISE / chip company | High |
| Ecosystem | Verify libavb, open-dice, virtio-drivers; replace `aarch64-paging` analog | 2-4 | Chip company | Medium |

## 15. References

- [AVF overview (source.android.com)](https://source.android.com/docs/core/virtualization)
- [AVF architecture (source.android.com)](https://source.android.com/docs/core/virtualization/architecture)
- [AVF repo, platform/packages/modules/Virtualization](https://android.googlesource.com/platform/packages/modules/Virtualization)
- [AVF commit ca0049be4d, Skip microdroid_crash_kernel for riscv64](https://android.googlesource.com/platform/packages/modules/Virtualization/+/ca0049be4d84897b8c9956924cfae506773103eb)
- [AVF commit 01010afb25, Fix st_blksize type for riscv64](https://android.googlesource.com/platform/packages/modules/Virtualization/+/01010afb25b1dd2c57be137ef81ac5d041b8f318)
- [AVF commit 1ffeb948bd, pvmfw platform DT separation](https://android.googlesource.com/platform/packages/modules/Virtualization/+/1ffeb948bd36cb4c739b14fa0eeac454d508f871)
- [crosvm commit 35828a105, Enable riscv64 builder in presubmit](https://android.googlesource.com/platform/external/crosvm/+/35828a105)
- [crosvm commit 650b0ec73, riscv64 build error fix](https://android.googlesource.com/platform/external/crosvm/+/650b0ec73)
- [crosvm riscv64 crate (github.com/google/crosvm)](https://github.com/google/crosvm/blob/main/riscv64/src/lib.rs)
- [Cuttlefish vsoc_riscv64 BoardConfig](https://android.googlesource.com/device/google/cuttlefish/+/fa9082ad7/vsoc_riscv64/BoardConfig.mk)
- [google/android-riscv64](https://github.com/google/android-riscv64)
- [android-riscv64 issue 10](https://github.com/google/android-riscv64/issues/10)
- [aosp-riscv working group status](https://github.com/aosp-riscv/working-group/blob/master/status.md)
- [Android and RISC-V: what you need to know (Google Open Source Blog, 2023-10)](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html)
- [The Register, Google pulls RISC-V support from generic Android kernel](https://www.theregister.com/on-prem/2024/05/01/google-pulls-risc-v-support-from-generic-android-kernel/918929)
- [RISE: Android 17 Available on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE android_manifest release android-17-v1.0](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0)
- [RISE android_manifest](https://github.com/riseproject-dev/android_manifest)
- [RISE Project RP004, Rust Tier-1](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/)
- [RISE working groups move tracking to GitHub](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [RISE members](https://riseproject.dev/members/)
- [RISE on GitHub](https://github.com/riseproject-dev)
- [BayLibre and SpacemiT, Android 16 on RISC-V](https://baylibre.com/blog/baylibre-partners-with-spacemit-to-bring-android-16-to-risc-v/)
- [PyPI lookup for android-virtualization-framework (404)](https://pypi.org/pypi/android-virtualization-framework/json)
- [Ubuntu ports riscv64 indexes](https://ports.ubuntu.com/ubuntu-ports/dists/resolute/)
- Local reports in `/home/user/sw-ecosystem/project-reports/`: `crosvm.md`, `boringssl.md`, `bionic.md`, `art.md`, `minijail.md`, `zerocopy.md`, `rust.md`, `protocol-buffers.md`, `qemu.md`, `opensbi.md`