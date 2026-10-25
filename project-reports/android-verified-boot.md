---
title: Android Verified Boot
parent: Project Reports
color: yellow
dependencies:
  - name: BoringSSL
    relation: runtime-dependency
    criticality: critical
  - name: Soong
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: zerocopy
    relation: runtime-dependency
    criticality: optional
  - name: Rust
    relation: build-dependency
    criticality: optional
  - name: bindgen
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="android-verified-boot" %}

# Android Verified Boot

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-25<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux and riscv64/android) support status for Android Verified Boot<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Android Verified Boot 2.0 (AVB) is the verified-boot implementation in AOSP, hosted at [platform/external/avb](https://android.googlesource.com/platform/external/avb). The repository holds these components:

- `libavb`, a C library that verifies vbmeta structures, chain partitions and rollback indexes.
- `libavb_ab`, `libavb_cert` and `libavb_user`.
- `boot_control`.
- `avbtool.py`, a host-side Python tool that creates and signs vbmeta images.
- Rust bindings in `rust/`.
- Tests in `test/`.

The platform-specific part is `avb_sysdeps.h`, with a POSIX implementation in `avb_sysdeps_posix.c`. The bootloader supplies the `avb_ops` hooks (partition read/write, rollback indexes, lock state). The README states that libavb needs a C99 compiler, works on little- and big-endian and on 32- and 64-bit targets, and does not need a standard C library. ([AVB docs](https://source.android.com/docs/security/features/verifiedboot/avb))

Recent history includes ML-DSA-65 signing support. The latest commit seen on `main-kernel` (2026-08-19) is "Make ML-DSA-65 signing deterministic to prevent OTA issues".

Governance:

- **Foundation:** None. AVB is a Google-run AOSP project with no foundation, steering committee or published governance document.
- **Maintainers:** All are Google. The `OWNERS` file lists aluykx@google.com, billylau@google.com and samitolvanen@google.com as owners. The last-resort owners are tweek@google.com and zeuthen@google.com. David Zeuthen is the original author with 418 commits.
- **Recent contributors:** Andrea Orru (28 commits), Duy Truong, David Lin, Pierre-Clement Tosi, Andrew Scull, Spandan Das and Atul Luykx. The maintainers' employer was not confirmed beyond the @google.com addresses.
- **License:** Permissive. `MODULE_LICENSE_APACHE2`, `MODULE_LICENSE_BSD` and `MODULE_LICENSE_MIT` are present, `METADATA` says `license_type: NOTICE`, and `LICENSE` opens with MIT-style text.
- **Contribution path:** AOSP Gerrit. There is no `MAINTAINERS` file.
- **Sponsor:** Google. Google is a RISE Premier member ([RISE members](https://riseproject.dev/members/)), but no RISE work item or RFP targets AVB directly.
- **Stance on new ports:** No AVB-specific stance, mailing list or issue activity on RISC-V was found. Google's public position is that it supports RISC-V in principle but is "not ready to provide a single supported image for all vendors" ([Android Authority](https://www.androidauthority.com/android-drop-risc-v-kernel-3438330/)).

The relevant bootloader integration for RISC-V is U-Boot, which vendors libavb under `lib/libavb/` with glue in `common/avb_verify.c`. Its options are `CONFIG_LIBAVB`, `CONFIG_AVB_VERIFY` and `CONFIG_CMD_AVB` ([U-Boot AVB 2.0 docs](https://docs.u-boot.org/en/latest/android/avb2.html)). The code is upstream AOSP. No vendor or downstream RISC-V AVB fork was found.

## 2. Port History and Upstreaming Timeline

AVB has no riscv64 port because it needs none. A case-insensitive grep for `riscv`, `risc-v` and `rv64` over file contents returned zero matches on `main`, `master`, `main-kernel`, `main-kernel-2026`, `android16-release` and `android17-release`. The same grep over all remote branches, including `android10` to `android17`, also returned nothing. The commit-message search returned nothing on any branch. Gerrit queries for `riscv`, `risc-v` and `rv64` on `platform/external/avb` returned empty, including status-filtered queries for merged and abandoned changes.

| Date | Event | Source |
|---|---|---|
| 2016-07-27 | First commit, "Add common verified boot tools and library" by David Zeuthen | [AVB repo](https://android.googlesource.com/platform/external/avb) |
| 2018-04 | U-Boot patch series integrating libavb (U-Boot has carried a vendored copy since 2018) | [U-Boot patch](https://lists.denx.de/pipermail/u-boot/2018-April/326565.html) |
| 2022-11 (approx.) | Google begins accepting RISC-V patches for Android | [Google Open Source Blog](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html) |
| 2022 | Soong gains "barebones riscv64-linux-android support" (OmniROM mirror of the commit) [NEEDS VERIFICATION] | [OmniROM mirror](https://gerrit.omnirom.org/plugins/gitiles/android_build_soong/+/f05b0d35d2fbe51be9961ce8ce8031f840295c68%5E%21) |
| 2023-10-30 | Google announces AOSP riscv64 support. Baseline is RVA22 plus vector and vector crypto. The post names no Android release and does not mention kernel, bootloader or verified boot. | [Google Open Source Blog](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html) |
| 2024-04-29 | Google patches remove riscv64 from the Android Common Kernel/GKI, kernel build and emulator. Google states "Android will continue to support RISC-V". No confirmed reversal found. | [Android Authority](https://www.androidauthority.com/android-drop-risc-v-kernel-3438330/), [OSnews](https://www.osnews.com/story/139504/risc-v-support-in-android-just-got-a-big-setback/) |
| 2025-01-08 | U-Boot "bootstd: android: Allow booting with AVB failures when unlocked", tested on TI AM62Px (Arm), not RISC-V. Merge not confirmed. | [U-Boot list](https://lists.denx.de/pipermail/u-boot/2025-January/576848.html) |
| 2025-10-13 | Gerrit 3789473 "libavb: Enable hardware acceleration for SHA256" last updated, still open, x86/ARM only | Gerrit (see Section 11) |
| 2026-07-27 | U-Boot "libavb: update to AOSP 1.3.0" series v2 | [ratatoskr mirror](https://ratatoskr.run/u-boot/2026/07/17367485/t) |
| 2026-08-19 | Latest commit on `main-kernel` | [AVB repo](https://android.googlesource.com/platform/external/avb) |
| 2026-10-20 | RISE announces Android 17 on RVA23 (SpacemiT K3, Alibaba A210) | [RISE blog](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/) |

Key facts on first release and upstreaming:

- **First Android release with riscv64:** Not confirmed. The Google blog names none. Android 14 is an unverified inference. The [google/android-riscv64](https://github.com/google/android-riscv64) README (2025 Q2 state) shows `aosp_cf_riscv64_phone-trunk_staging-userdebug` with sample lunch output showing VanillaIceCream. Data not available: no source states which release first carried riscv64.
- **Key contributors:** There are no RISC-V contributors to AVB. The RISE Android 17 BSP was engineered by BayLibre, funded through RISE, with SpacemiT and Alibaba DAMO supplying hardware and platform expertise.
- **Fully upstream?** Nothing needs upstreaming into AVB. The Android 17 RVA23 BSP is a RISE developer release and is not upstream AOSP.

Discrepancy on repository state: one source reports the `main` and `master` tips dated 2025-03-13, while others report HEAD `c5066a9` dated 2026-08-19. The 2026-08-19 date is the tip of `main-kernel`, the clone's default HEAD. Statements about "main" in different research passes may therefore refer to different branches.

## 3. Upstream Support Tier

No formal tier policy is published for AVB. Architecture support is whatever AOSP and GKI support. The AVB documentation says nothing about architectures ([source.android.com](https://source.android.com/docs/security/features/verifiedboot)).

Evidence:

- **CI:** None in the repo, for any architecture (see Section 7).
- **Release-blocking:** Data not available. No release-blocking designation was found.
- **Official binaries:** None. AVB is source in AOSP and is not distributed as a binary release.
- **Android build:** Cuttlefish `aosp_cf_riscv64_phone-userdebug` exists. `Android.bp` has no per-architecture blocks and the module is `host_supported`, `ramdisk_available`, `vendor_ramdisk_available` and `recovery_available`, and is part of `com.android.virt`. It therefore builds for any Android target.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| libavb arch-specific code | None | None | None |
| `Android.bp` arch blocks | None | None | None |
| AVB repo CI | None | None | None |
| Cuttlefish U-Boot Bazel targets | `crosvm_x86_64_dist` | `crosvm_aarch64_dist` | Not in Bazel targets. Prebuilt QEMU bootloaders list "riscv" ([Cuttlefish bootloader doc](https://source.android.com/docs/devices/cuttlefish/bootloader-dev)). |
| Mainline U-Boot defconfig enabling AVB | Data not available | Yes: am57xx, am62x, khadas-vim3 and total_compute configs | None found |
| Android Common Kernel/GKI | Not part of the April 2024 removal | Not part of the April 2024 removal | Removed April 2024, no confirmed reversal |

The U-Boot defconfig finding comes from GitHub code search of `CONFIG_AVB_VERIFY path:configs`, which returned six configs, none RISC-V. A second search for `CONFIG_BOOTMETH_ANDROID` alongside "riscv" returned zero results. GitHub code search is imperfect, so this is "none found", not "none exist". [NEEDS VERIFICATION]

## 4. Technical Architecture and RISC-V-Specific Subsystems

AVB has no architecture-specific subsystems. Checks run across the tree:

- No `.S`, `.s` or `.asm` files and no `arch*` directories.
- No `asm`, `__asm__`, intrinsics, NEON/AVX/SSE or `__riscv` in `libavb/`. The only builtins are two `__builtin_trap()` calls in `avb_cmdline.c`.
- Endianness is handled by byte-wise shifts in C (`avb_be64toh` in `libavb/avb_util.c`).
- No use of `__int128`.
- The only architecture-specific code in the repo is `examples/uefi/`, an x86_64-only UEFI example with an `#ifdef __x86_64__` block containing `asm volatile("cli")`. It is example code and is not invoked by the Android build.

| Component | amd64 | arm64 | riscv64 | Quality |
|---|---|---|---|---|
| libavb core (vbmeta parsing, verify, chain partitions, rollback) | C | C | C | Scalar, portable |
| SHA-256/SHA-512 (`libavb/crypto/sha256_impl.c`, `sha512_impl.c`; older snapshots show `libavb/sha/`) | Scalar C. Open Gerrit change 3789473 would add hardware acceleration. | Scalar C. Same open change. | Scalar C. No Zknh/Zvknha/RVV path. | Scalar |
| SHA backend via BoringSSL (`libavb/boringssl/sha.c`) | BoringSSL | BoringSSL | BoringSSL. riscv64 acceleration depends on BoringSSL, not verified here. | Delegated |
| RSA (`avb_rsa.c`), CRC32 | C | C | C | Scalar |
| ML-DSA (`libavb/crypto/mldsa_impl.c`, `libavb/boringssl/mldsa.c`) | C | C | C | Scalar |
| OS glue (`avb_sysdeps_posix.c`) | POSIX | POSIX | POSIX. Bare-metal bootloaders supply their own. | Portable |
| `avb_ops` platform hooks | Bootloader-provided | Bootloader-provided | Bootloader-provided. No RISC-V board in mainline U-Boot found enabling it. | Integrator work |
| `avbtool.py`, Rust bindings, Soong build | Portable | Portable | Portable | Host-side |

Two crypto backends exist: the BoringSSL backend (`avb_crypto_ops_impl_boringssl`) and the standalone C backend (`avb_crypto_ops_impl_sha`). Neither is RISC-V tuned. RISC-V SHA acceleration would have to come from BoringSSL (a RISE planned RFP area) or, for dm-verity, from the kernel. A Nov 2023 [linux-riscv patch thread](https://lists.infradead.org/pipermail/linux-riscv/2023-November/044468.html) adds an accelerated SHA-224/256 implementation using Zvknha/Zvknhb. The excerpts seen contain no dm-verity throughput numbers. Data not available: no measurement of this fast path.

A note on the crypto paths: some research passes show `libavb/sha/` and others `libavb/crypto/`. These likely reflect different branch snapshots.

## 5. Build System, Cross-Compilation, and Toolchain

Upstream documents no riscv64 build, no CMake or configure flow, no Dockerfile and no QEMU usage. The only build files are `Android.bp`, `test/Android.bp`, `tools/Android.bp`, `rust/Android.bp` and `examples/uefi/Makefile`.

- **AOSP build:** Soong, with the AOSP prebuilt Clang. The riscv64 lunch targets are not in this repo. Cuttlefish is `aosp_cf_riscv64_phone-userdebug`. Data not available: exact lunch invocation was not verified in this research.
- **Configuration macros:** `AVB_COMPILATION` (set when compiling libavb itself), `AVB_ENABLE_DEBUG` (on in Soong defaults, off in `libavb_baremetal` targets via `-UAVB_ENABLE_DEBUG`, and should be off in production) and `AVB_AB_I_UNDERSTAND_LIBAVB_AB_IS_DEPRECATED` (needed to build deprecated `libavb_ab`).
- **Soong cflags:** `-Werror -Wall -Wextra -Wformat=2 -Wmissing-prototypes -Wno-psabi -Wno-unused-parameter -Wno-format -ffunction-sections -fstack-protector-strong -D_POSIX_C_SOURCE=199309L -D_FILE_OFFSET_BITS=64`. Warnings are fatal, so a newer compiler can break the build.
- **Toolchain minimums:** Upstream states no GCC or Clang minimum. It requires a C99 compiler (GCC or Clang, because of `__attribute__` use in `avb_sysdeps.h`), Python 3.5 or newer for `avbtool`, and OpenSSL 3.2.0 or newer if system `openssl` is used, for ML-DSA. A code comment says OpenSSL 3.5+ lists the algorithms, so the stated minimum and the comment differ.
- **Known build failures on riscv64:** None found.

Verified in this research (single pass, [NEEDS VERIFICATION]): Clang 18.1.3 on an x86 host, with `--target=riscv64-unknown-elf -march=rv64gc -mabi=lp64d -std=c99 -Wall -Wextra -Wformat=2 -Wmissing-prototypes` in freestanding mode, compiled 19 objects with no errors or warnings, built from `libavb/crypto/*` sources. The output was an ELF 64-bit RISC-V relocatable. `avb_sysdeps_posix.c` and `boringssl/mldsa.c` were skipped because they need a libc and BoringSSL headers. Nothing was linked or run, because the sandbox had no riscv64 GCC and no `qemu-riscv64`.

Derived commands (not upstream; a riscv64 libc sysroot is required for the POSIX sysdeps):

```
CC=riscv64-linux-gnu-gcc   # or: clang --target=riscv64-linux-gnu --sysroot=<riscv64 sysroot>
SRCS="$(ls libavb/avb_*.c | grep -v sysdeps_posix) libavb/avb_sysdeps_posix.c libavb/crypto/*.c"
$CC -std=c99 -Wall -Wextra -Wformat=2 -Wmissing-prototypes -Wno-unused-parameter \
    -D_POSIX_C_SOURCE=199309L -DAVB_COMPILATION -Ilibavb -Ilibavb/crypto \
    -ffunction-sections -c $SRCS
ar rcs libavb.a *.o
```

Drop `-DAVB_ENABLE_DEBUG` for production. Use `libavb/boringssl/*` instead of `libavb/crypto/*` only with BoringSSL headers. QEMU user-mode (`qemu-riscv64 -L <sysroot>`) for unit tests is a suggestion and is not documented upstream.

`avbtool.py` imports only the Python standard library and shells out to the `openssl` binary (or a hermetic `avb_openssl` next to the script), so it runs on any riscv64 host with Python and OpenSSL. The optional `tools/at_auth_unlock.py` imports `Crypto`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| libavb verification (portable C) | Yes | Yes | Yes by construction. Compiles with Clang 18 (object files only). Not exercised at runtime in this research. |
| `avbtool.py` | Yes | Yes | Yes (pure Python plus `openssl`) |
| Rust bindings (`libavb_rs`) | Data not available | Data not available | Data not available |
| U-Boot AVB (`CONFIG_LIBAVB`) in mainline defconfigs | Data not available | Yes (am57xx, am62x, khadas-vim3, total_compute) | None found |
| Rollback index in RPMB via OP-TEE | Data not available | Supported (relies on ARM TrustZone) | Not applicable as documented. Without OP-TEE, lock state and rollback protection do not work and verification is advisory. |
| Cuttlefish target | Yes | Yes | `aosp_cf_riscv64_phone-userdebug` |
| GKI kernel | Supported | Supported | Removed April 2024 |

- **Functional gaps:** None in AVB code. The gaps are in the surrounding platform: no riscv64 GKI, no mainline U-Boot RISC-V defconfig enabling AVB or `bootmeth_android`, and an untested AVB enforcement path on riscv64 hardware. In RISE's A210 build, U-Boot AVB verification is disabled ([android_manifest](https://github.com/riseproject-dev/android_manifest/tree/android-17), README).
- **Performance gaps:** No measurement of AVB, libavb, avbtool, vbmeta verification or dm-verity on riscv64 was found, so no delta can be stated. The scalar SHA path is the same on all architectures at present. Whether any of that would matter on RVA23 hardware is untested.
- **Security hardening gaps:** Data not available. No riscv64-specific hardening findings were reported. The AVB CVEs found (Section 11) are not architecture-specific.
- **NaN / floating-point semantics:** Data not available. No floating-point findings were reported for libavb.

## 7. CI/CD Infrastructure

No riscv64 CI exists for AVB, and none exists for any other architecture. Files read:

- `PREUPLOAD.cfg` holds repo-hook lint checks only (bpfmt, clang_format, pylint).
- `rust/TEST_MAPPING` lists presubmit tests `libavb_bindgen_test`, `libavb_rs_test`, `libavb_rs_unittest`, `libavb_rs_uuid_test` and `libavb_rs_uuid_unittest`. It has no architecture selector.
- `test/libavb_host_unittest.xml` is a Tradefed `HostGTest` config with `null-device=true` and a 7m timeout, so it is host-only. `test/at_auth_unlock_unittest.xml` is also a Tradefed config.
- There is no `.github`, `.gitlab-ci.yml`, `.travis.yml`, Jenkinsfile, buildbot or cloudbuild config, and no `.bazelrc` or root `TEST_MAPPING`.

Google's internal Android CI (including Cuttlefish presubmit) is not visible in this repo. Nothing read shows it builds `external/avb` for riscv64, and no ci.android.com pipeline for riscv64 was found. Any riscv64 coverage would come implicitly from AOSP-wide Cuttlefish builds.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-repo CI | None | None | None |
| Lint hooks | Yes (arch-independent) | Yes | Yes |
| Host gtest (Tradefed) | Yes, host only | Host only | Not applicable, host only |
| Hardware CI | Data not available | Data not available | None for AVB. RISE RP024 phase 2 plans automated build and hardware tests on Alibaba A210, then SpacemiT K3, in the [RISE Board Farm](https://github.com/riseproject-dev/board-farm). |
| RISE runners | Not used | Not used | No AVB-specific runner use found. The generic riscv-runner infrastructure exists. |

U-Boot's own CI exercises its vendored libavb. Whether that CI covers riscv64 was not verified.

## 8. Distribution and Release Status

AVB is distributed as AOSP source, with tags up to `android-security-17.0.0_r2` and `android-platform-15.0.0_r21` seen on the repo, and is not distributed as a standalone binary.

| Channel | Result |
|---|---|
| PyPI `android-verified-boot` | HTTP 404, no project |
| PyPI `avbtool` | HTTP 404, no project |
| RISE GitLab PyPI index | Redirects to PyPI, which returns 404, so no RISE wheel |
| RISE wheel builder list | AVB, libavb and "android" not listed |
| Ubuntu 26.04 (resolute) packages.ubuntu.com | Inconclusive (HTTP 500 on searches) |
| Ubuntu archive (Launchpad) | No `avbtool` source package. No published binaries named `avbtool`, `libavb` or `python3-avbtool`. Not filtered by suite. |
| Debian sources | No `avbtool`, no `android-platform-external-avb`. Debian lists boringssl, doclava, jsilver, libselinux and libunwind under `android-platform-external-*`. |
| Arch Linux RISC-V | Inconclusive. Only the first 100,000 of 377,721 characters of the status page were read, and no `avb`, `avbtool`, `android-tools` or `libavb` appeared. |
| Alpine | riscv64 `u-boot` and `u-boot-tools` are published. No AVB-specific package found. |

RISE publishes the [Android 17 v1.0 release](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0): binary images, pinned manifests, checksums, flashing tools and rebuild instructions for the SpacemiT K3 Pico-ITX and Alibaba A210 EVB. It is a developer release, "not a production-ready or certified Android build". The images carry "AVB metadata", and the A210 flash helper writes "vbmeta chains" (README).

To get a working AVB on riscv64, a user must either:

- build AOSP for a riscv64 target, which compiles `external/avb` from source, or use the RISE manifest; or
- build a bootloader (U-Boot) with `CONFIG_LIBAVB` and supply `avb_ops` for the board.

On a riscv64 host, `avbtool.py` runs as-is with Python and OpenSSL. Even if a distro package existed, it would be an architecture-independent package or a plain rebuild.

## 9. Dependencies

Project-graph query could not be run (tool unavailable), so Ubuntu 26.04 riscv64 availability is unverified for every row. Status below comes from source reading and web research.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| BoringSSL | Crypto backend (`libcrypto`, `libcrypto_baremetal`) for libavb, `avb_user`, `bootctrl`. Critical. See project-reports/boringssl.md. | One report states riscv64 support exists, but it was not verified here. | Not verified | Not verified | Google. RISE lists BoringSSL as a planned RFP area. |
| Soong | AOSP build system. Critical. | Soong gained "barebones riscv64-linux-android support" in 2022 [NEEDS VERIFICATION]. AVB's `Android.bp` has no arch blocks. | Not verified | Part of AOSP | Google. RISE carries forks [android_build_soong](https://github.com/riseproject-dev/android_build_soong) and [android_build_blueprint](https://github.com/riseproject-dev/android_build_blueprint). |
| LLVM | Compiler (AOSP prebuilt Clang). Critical. | Clang 18.1.3 (x86 host, distro, not AOSP prebuilt) compiled 19 libavb objects for riscv64. AOSP prebuilt Clang riscv64 details: data not available. | Not applicable | AOSP prebuilt | Data not available |
| Python | Runs `avbtool.py` (stdlib only, 3.5+). Critical. See project-reports/python.md. | Not verified here | Not verified | RISE post "Python Now Officially Supports RISC-V" (2026-08-24) [NEEDS VERIFICATION, title only] | RISE |
| OpenSSL | `avbtool.py` shells out to the `openssl` binary for key handling. Critical. 3.2.0+ for ML-DSA. See project-reports/openssl.md. | Not verified | Not verified | Not verified | Data not available |
| googletest | Host unit tests (`libgtest_host`, `libgmock_host`, plus `libchrome`). Optional. See project-reports/googletest.md. | Not verified. Tests are host-only. | Not applicable | Not verified | Google |
| zerocopy | Struct parsing in `libavb_rs` and `libavb_rs_nostd`. Optional. See project-reports/zerocopy.md. | Pure Rust, so expected to build. Not verified. | Not verified | Not verified | Data not available |
| Rust | Toolchain for `libavb_rs` bindings. Optional. | Data not available | Data not available | Data not available | Data not available |
| bindgen | Generates libavb bindings (`libavb_bindgen_test`). Optional. | Data not available | Test in `rust/TEST_MAPPING` with no arch selector. riscv64 result: data not available. | Data not available | Data not available |

Indirect and adjacent dependencies:

| Name | Role | riscv64 status |
|---|---|---|
| libbase, libcutils, libfs_mgr, libchrome | Android platform libraries for `libavb_user`, `avbctl`, tests | Built in-tree for AOSP targets. Not individually assessed. |
| uuid (Rust crate) | Optional `libavb_rs_uuid` feature | Pure Rust, expected fine. Not verified. |
| U-Boot (vendored libavb) | Bootloader integration. See project-reports/u-boot.md. | `LIBAVB` depends on `ANDROID_BOOT_IMAGE`, not on an architecture. No in-tree riscv board enables it. RISE carries U-Boot branches v2026.07-k3 and v2024.10-a210 ([u-boot](https://github.com/riseproject-dev/u-boot)). Whether v2026.07-k3 enables AVB is unconfirmed. |
| OpenSBI | RISC-V firmware under U-Boot in the RISE boot chain | RISE carries branches v1.8-k3 and v1.5-a210 ([opensbi](https://github.com/riseproject-dev/opensbi)). |
| Linux kernel (dm-verity, fs-verity) | Runtime enforcement of verified partitions | Mainline Linux supports riscv64. GKI riscv64 removed in 2024. RISE uses [android_kernel_common](https://github.com/riseproject-dev/android_kernel_common) branches android-mainline-spacemit and android-mainline-alibaba. |

Crypto detail: AVB's own hashing is scalar C or BoringSSL, so RISC-V crypto extensions (Zknh, Zvknha/b) are used only if BoringSSL or the kernel (for dm-verity) provides them. The RISE QEMU work on vector (V) and vector crypto (Zvk) is relevant to emulation speed only. The RISE summit slide claims "2x faster memory operations and halved AOSP boot time" with no methodology ([RVI Summit EU 2026 slides](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf)). It does not measure AVB.

## 11. Known Bugs and Active Issues

No open riscv64-specific AVB bugs were found. The AOSP issue tracker (issuetracker.google.com) was not checked directly. This means "none found", not "none exist".

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| Gerrit 3789473 | libavb: Enable hardware acceleration for SHA256 | Open (NEW), last updated 2025-10-13 | Not applicable (feature) | Not a RISC-V change. Commit message and file list cover x86 and ARM only. A review comment by Elliott Hughes (Google) says to reuse BoringSSL's SHA256: "that also means riscv64 isn't your problem." |
| U-Boot "libavb: update to AOSP 1.3.0" (v1, v2 2026-07-27) | U-Boot's libavb copy frozen at a roughly 2019 snapshot (AVB 1.1.0 per the series) | In review as of 2026-07-27 | Not applicable | No RISC-V mention. Discrepancy: the [U-Boot AVB docs](https://docs.u-boot.org/en/latest/android/avb2.html) say the vendored copy is AOSP 1.3.0. |
| CVE-2020-0151 | Out-of-bounds read in `avb_vbmeta_image_verify` | Fixed upstream (status not verified here) | Not applicable | Not riscv64-specific [NEEDS VERIFICATION] |
| CVE-2020-0369 | libavb integer overflow leading to out-of-bounds write | Not verified | Not applicable | Not riscv64-specific [NEEDS VERIFICATION] |
| CVE-2018-9567 | Pixel-specific certificate fingerprint issue | Not verified | Not applicable | Not riscv64-specific [NEEDS VERIFICATION] |

Correctness bugs on riscv64: none found. The Gerrit riscv queries returned no changes, yet change 3789473 contains "riscv64" in a review comment. This is consistent, because the queries searched messages and not review comments, but it shows the queries do not cover all text. Gerrit access through WebFetch may also be incomplete. Of the first 50 open changes, none concerns RISC-V.

## 12. Objections and Upstream Blockers

- **Stated objections to AVB RISC-V work:** None. No RISC-V patch has been proposed, because none is required.
- **Technical blockers (outside AVB):**
  - Google removed riscv64 from the Android Common Kernel/GKI on 2024-04-29. A certified Android device needs a GKI kernel from an ACK branch, so riscv64 vendors must maintain their own kernel forks. No reversal found.
  - Mainline U-Boot has no RISC-V defconfig enabling AVB or `bootmeth_android` (none found).
  - AVB enforcement on riscv64 is untested. The A210 build disables U-Boot AVB verification.
  - Cuttlefish Bazel bootloader targets cover x86_64 and aarch64 only.
- **Organizational blockers:** Google's public position is support in principle, but "not ready to provide a single supported image for all vendors". Whether Android 16 restored an official riscv64 kernel could not be confirmed. A June 2026 community report of Cuttlefish riscv64 booting on a SpacemiT K3 is a single source [NEEDS VERIFICATION]. A May 2026 vendor claim that T-Head Xuantie RVA23 parts were adapted to Android 16 is unverified and has no AVB detail [NEEDS VERIFICATION].
- **Acceptance probability:** Data not available for AVB-specific RISC-V patches, since none exist. Any needed change would go through AOSP Gerrit under Google ownership. U-Boot RISC-V enablement is a U-Boot upstream matter.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** RISE

Justification: AVB ([external/avb](https://android.googlesource.com/platform/external/avb)) has no CI of its own (only lint hooks and host-only Tradefed/gtest configs, no riscv64 job), so it cannot be blue or green. It is arch-neutral C with no riscv code, and RISE's Android 17 RVA23 BSP ([android_manifest](https://github.com/riseproject-dev/android_manifest/tree/android-17)) builds and ships images with AVB metadata and vbmeta chains without listing external/avb as forked or patched, which gives the clean-build floor. The release is a RISE developer release, not upstream, and no distro package exists.

Pending work that could change the grade:

- No riscv64 changes are pending in Gerrit for platform/external/avb (queries for riscv, risc-v and rv64 returned nothing).
- RISE RP024 phase 2 plans automated build and hardware tests on Alibaba A210 and SpacemiT K3 in the RISE Board Farm, which could add riscv64 coverage that covers AVB indirectly.
- Upstream blockers sit outside AVB. Google removed riscv64 from the Android Common Kernel/GKI in April 2024 (no confirmed reversal), and no in-tree mainline U-Boot RISC-V defconfig enables AVB or bootmeta_android.
- The "unpatched" status of external/avb in the RISE BSP is inferred from its README. The A210 build also has U-Boot AVB verification disabled, so AVB enforcement on riscv64 is untested. Verify with the RISE manifest and the riscv64 Cuttlefish target if more certainty is needed.

## 14. Investment Analysis

What RISE has already done or funded: RP024 (Android 17 on RVA23) delivered the BSP, boot chain (U-Boot and OpenSBI) and release images, and its phase 2 covers CI on the Board Farm. Planned follow-up RFPs cover Bionic, BoringSSL, ART, V8, Chrome and multimedia libraries. No RISE-funded item targets AVB or libavb directly ([RISE Android 17 post](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)). BoringSSL acceleration and RP024 CI are therefore not sized below. The effort figures below are engineering estimates, not sourced data.

### 14.1 Functional Enablement

AVB itself needs no functional port. The work is integration and verification:

- Enable AVB verification in the RISE U-Boot builds (the A210 build currently disables it) and verify a locked boot with a real vbmeta chain on A210 and K3.
- Add a mainline-quality U-Boot RISC-V defconfig enabling `CONFIG_LIBAVB`, `CONFIG_AVB_VERIFY`, `CONFIG_CMD_AVB` and `bootmeth_android`.
- Define a board-specific `avb_read_root_key_digest()` and rollback-index storage story. The OP-TEE RPMB path depends on ARM TrustZone, so RISC-V needs a different store.

### 14.2 Performance Optimization

No measurement exists, so there is nothing to size yet. First produce data: run `tcrypt` SHA-256 and `veritysetup` benchmarks on A210 or K3. dm-verity SHA-256 acceleration with Zvknha/b exists as a kernel patch thread (Nov 2023). Scalar libavb SHA is only worth optimizing if boot-time profiling shows it matters. Hardware acceleration for libavb SHA256 (Gerrit 3789473) is x86/ARM only. Ensuring a RISC-V path is available, either by routing through BoringSSL or adding Zknh, is a follow-on item that depends on the BoringSSL RFP.

### 14.3 CI/CD Infrastructure

- Add a riscv64 job that builds `external/avb` and runs `libavb_host_unittest` on riscv64 (Cuttlefish or Board Farm). This piggybacks on RP024 phase 2 rather than creating new infrastructure.
- Add an end-to-end locked-boot test with a signed vbmeta on A210.

### 14.4 Ecosystem Enablement

No dependent package ecosystem. The only packaging gap is that no distro ships `avbtool` or libavb for riscv64. Distros do not package AVB for any architecture, so no work is proposed.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Enable and validate U-Boot AVB verification (locked boot, vbmeta chains) on A210 and K3 | 4-6 | RISE BSP / BayLibre | High |
| Functional | Mainline U-Boot RISC-V defconfig with LIBAVB and bootmeth_android | 3-4 | RISE firmware WG | Medium |
| Functional | Rollback-index and root-key storage design for RISC-V without OP-TEE RPMB | 3-5 | RISE security-software WG | Medium |
| Performance | Baseline `tcrypt` SHA-256 and `veritysetup` benchmarks on A210/K3 | 1-2 | RISE | Medium |
| Performance | RISC-V SHA path for libavb if profiling justifies it (after the BoringSSL RFP) | 2-4 | RISE / Google | Low |
| CI/CD | riscv64 build and `libavb_host_unittest` job via RP024 phase 2 Board Farm | 2-3 | RISE | High |
| CI/CD | Track the riscv64 GKI/ACK status and re-evaluate the grade if restored | 0.5 per quarter | RISE kernel WG | Medium |
| Ecosystem | None (no dependent package ecosystem) | 0 | Not applicable | Low |

## 15. References

- [Android Verified Boot source repository (android.googlesource.com)](https://android.googlesource.com/platform/external/avb)
- [AVB refs listing](https://android.googlesource.com/platform/external/avb/+refs)
- [external/avb Android.bp (main)](https://android.googlesource.com/platform/external/avb/+/main/Android.bp)
- [Android Verified Boot overview (source.android.com)](https://source.android.com/docs/security/features/verifiedboot)
- [AVB documentation (source.android.com)](https://source.android.com/docs/security/features/verifiedboot/avb)
- [Use Verified Boot (source.android.com)](https://source.android.com/docs/security/verifiedboot/verified-boot)
- [Cuttlefish bootloader development](https://source.android.com/docs/devices/cuttlefish/bootloader-dev)
- [Google Open Source Blog, Android and RISC-V: What you need to know](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html)
- [Android Authority, Android drop RISC-V kernel](https://www.androidauthority.com/android-drop-risc-v-kernel-3438330/)
- [OSnews, RISC-V support in Android just got a big setback](https://www.osnews.com/story/139504/risc-v-support-in-android-just-got-a-big-setback/)
- [The Register, RISC-V support in Android pulled](https://www.theregister.com/2024/05/01/riscv_support_android_pulled/)
- [CNX Software, Android no longer supports RISC-V](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/)
- [Hackster, Google removes RISC-V support from the Android common kernel](https://hackster.io/news/google-removes-risc-v-support-from-the-android-common-kernel-but-denies-abandoning-the-isa-c4ccab33a929)
- [U-Boot Android Verified Boot 2.0 documentation](https://docs.u-boot.org/en/latest/android/avb2.html)
- [U-Boot patch: bootstd android AVB failures when unlocked (2025-01)](https://lists.denx.de/pipermail/u-boot/2025-January/576848.html)
- [U-Boot avb2.0 build integration patch (2018-04)](https://lists.denx.de/pipermail/u-boot/2018-April/326565.html)
- [U-Boot libavb update to AOSP 1.3.0, v2](https://ratatoskr.run/u-boot/2026/07/17367485/t)
- [U-Boot libavb update to AOSP 1.3.0, v1](https://ratatoskr.run/u-boot/2026/07/17248061/t)
- [RISE blog, Android 17 Available on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE members](https://riseproject.dev/members/)
- [RVI Summit EU 2026, The RISE Project: Advancing RISC-V Software](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf)
- [riseproject-dev/android_manifest, android-17 branch](https://github.com/riseproject-dev/android_manifest/tree/android-17)
- [riseproject-dev/android_manifest, android-17-v1.0 release](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0)
- [riseproject-dev/android_bootloader_build](https://github.com/riseproject-dev/android_bootloader_build)
- [riseproject-dev/android_build_soong](https://github.com/riseproject-dev/android_build_soong)
- [riseproject-dev/android_build_blueprint](https://github.com/riseproject-dev/android_build_blueprint)
- [riseproject-dev/android_kernel_common](https://github.com/riseproject-dev/android_kernel_common)
- [riseproject-dev/u-boot](https://github.com/riseproject-dev/u-boot)
- [riseproject-dev/opensbi](https://github.com/riseproject-dev/opensbi)
- [riseproject-dev/board-farm](https://github.com/riseproject-dev/board-farm)
- [google/android-riscv64](https://github.com/google/android-riscv64)
- [Soong riscv64-linux-android commit (OmniROM mirror)](https://gerrit.omnirom.org/plugins/gitiles/android_build_soong/+/f05b0d35d2fbe51be9961ce8ce8031f840295c68%5E%21)
- [linux-riscv: Zvknha/b SHA-256 kernel patch (2023-11)](https://lists.infradead.org/pipermail/linux-riscv/2023-November/044468.html)