---
title: KeyMint
parent: Project Reports
color: orange
dependencies:
  - name: BoringSSL
    relation: runtime-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: Soong
    relation: build-dependency
    criticality: critical
  - name: OP-TEE
    relation: runtime-dependency
    criticality: optional
  - name: Trusty
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="keymint" %}

# KeyMint

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-25<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux and riscv64/android) support status for KeyMint<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

KeyMint is Android's hardware-backed keystore HAL. Its parts are:

- **AIDL interface.** `IKeyMintDevice` lives in [hardware/interfaces security/keymint](https://android.googlesource.com/platform/hardware/interfaces/+/refs/heads/main/security/keymint/). `IRemotelyProvisionedComponent` moved to `../rkp` as of Android U.
- **Rust reference implementation.** It lives in [platform/system/keymint](https://android.googlesource.com/platform/system/keymint) and also covers `IRemotelyProvisionedComponent`, `ISharedSecret` and `ISecureClock`. Its crates are:
  - `kmr-derive`, `kmr-wire`, `kmr-common` and `kmr-ta` (`no_std` plus `alloc`).
  - `kmr-hal` (`std`, needs Binder).
  - `kmr-crypto-boring` (`std`, wraps BoringSSL through the `openssl` crate).
  - `kmr-tests`.
- **Build system.** Soong `Android.bp` is the official build. The `Cargo.toml` files state that Cargo is not an officially supported build tool. `hal/` has no `Cargo.toml` because it needs Binder.
- **Production TA hosting.** The Android documentation says the KeyMint TA runs "most often in TrustZone on an ARM SoC" ([Android Keystore docs](https://source.android.com/docs/security/features/keystore)). Trusty and OP-TEE are the TEE hosts relevant here. Google's Rust KeyMint TA for OP-TEE is at [tee/optee/ta/keymint](https://android.googlesource.com/tee/optee/ta/keymint), built on the Apache Teaclave TrustZone SDK.
- **Cuttlefish.** The reference/test implementation is in `device/google/cuttlefish`. It has a host-side `secure_env` path and an in-guest path.

Version history per the Android docs: Keymaster 1.0 arrived in Android 6, KeyMint replaced Keymaster in Android 12, and KeyMint v2 (Curve25519) arrived in Android 13.

**Governance.** KeyMint has no foundation, TSC or published governance model. It sits under AOSP, which Google runs.

- **License.** Apache-2.0, with "Copyright The Android Open Source Project" headers.
- **Maintainers.** There is no MAINTAINERS file. The `OWNERS` file lists four Google engineers: cvlasov, drysdale, hasinitg and kwadhera. The repository has 954 commits, 578 of them by David Drysdale and 52 by Hasini Gunasinghe. Other frequent contributors are Orlando Arbildo (48), Tri Vo (37), Chris Wailes (32), Xin Li (24) and Ivan Lozano (19), also Google AOSP staff. No downstream-vendor commits appeared.
- **Contribution path.** Contributions go through AOSP Gerrit review. The project is Gerrit-only, so there are no GitHub issues or PRs.
- **Google and RISE.** Google LLC is a RISE Premier member ([RISE members](https://riseproject.dev/members/)). That is a company membership. KeyMint is not a RISE project, and neither Android nor KeyMint is mentioned on riseproject.dev.

**Community stance on new ports.** There is no stated stance and no tier policy for architectures. AOSP gates targets by whether a `lunch` target exists and whether Google's build and CI cover it. Google's public RISC-V position is in its [October 2023 blog post](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html). It calls riscv64 support "building and running a basic AOSP experience" and directs collaboration to the `google/android-riscv64` repo.

## 2. Port History and Upstreaming Timeline

KeyMint itself has no RISC-V port history. A full clone of `system/keymint` (954 commits, all branches including `android17-release`) returned zero commits for `git log -i --grep='riscv|risc-v|rv64'`, and `git grep riscv` finds nothing in the tree. The history starts with "Initial empty repository" (Inna Palant, 2022-03-22). The RISC-V history is therefore Cuttlefish and platform history.

| Date | Event | Source |
|---|---|---|
| 2022-03-22 | `system/keymint` initial commit | [system/keymint](https://android.googlesource.com/platform/system/keymint) |
| 2022-11-18 | Cuttlefish riscv64 added in `bb6c689cf` "Add RISC-V 64-bit support" (Alistair Delva); later reverted | Findings, `git log` of `device/google/cuttlefish` |
| 2022-12-12 | Re-landed in `704698e9f` | Same |
| 2023-03-22 | `aosp_cf_riscv64_phone` added in `0c3ea1df4` (Colin Cross) | Same |
| 2023-10-30 | Google blog announces Cuttlefish riscv64 as experimental | [Google Open Source blog](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html) |
| 2024-02-12 | `81634ff43` excludes Widevine from riscv64 Cuttlefish (b/321153191); sibling security HAL, not KeyMint | [81634ff43](https://android.googlesource.com/device/google/cuttlefish/+/81634ff43eeec5d4c99cd046d2870020dd9c1e07) |
| 2024-04-17 | `4f541655c` makes in-guest secure HALs the default for all architectures, including riscv64 (b/332977378) | [4f541655c](https://android.googlesource.com/device/google/cuttlefish/+/4f541655c986b89b23ab8671e5fbb1d9c6c2e8f0) |
| 2024-04-22 | `e9feea943` first revert (Dan Shi, b/336038577; the reason does not mention riscv64) | [e9feea943](https://android.googlesource.com/device/google/cuttlefish/+/e9feea943b6eefb3e7c8fad3c33818753fb0cc31) |
| 2024-05-09 | `f87300b93` "Revert^2" re-lands the in-guest default (authored 2024-04-26, committed 2024-05-09) | [f87300b93](https://android.googlesource.com/device/google/cuttlefish/+/f87300b935069949f06763a013243a347465170e) |
| 2024-05-11 | `846195d82` "Revert^3": "b/339926078, breaking riscv64 Cuttlefish boot" (Prashanth Swaminathan) | [846195d82](https://android.googlesource.com/device/google/cuttlefish/+/846195d826ab5b9fbf98dd9b0101fa08bd0364b0) |
| 2024-05-13 | `9300136e9` "Use in-guest keymint on platforms other than riscv64" (Cody Schuffelen); riscv64 stays host-side | [9300136e9](https://android.googlesource.com/device/google/cuttlefish/+/9300136e990d249017e788e834f22be80645f0ad) |
| 2024-04 to 2024-05 | Google removes riscv64 from the Android Common Kernel/GKI; says Android continues to support RISC-V | [CNX Software](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/), [The Register](https://www.theregister.com/2024/05/01/riscv_support_android_pulled/) |
| 2025-02-21 | Last commit on the `system/keymint` `main` mirror (`fda4e68`); newer work appears only on release branches | Findings |
| 2026-03-10 | `android17-release` branch of `system/keymint` still has no riscv string | Findings |
| 2026-04-16 | `android17-release` Cuttlefish `flags.cc` still has the riscv64 carve-out | Findings |
| 2026-10-20 | RISE Android 17 v1.0 on RVA23 boards; TEE and secure boot declared out of scope | [RISE post](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/), [release notes](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0) |

**Carve-out dates.** Gerrit change 3084667 (commit `9300136e9`) was created 2024-05-13 and submitted 2024-05-14. The commit itself shows author time 2024-05-13 16:08 and committer time 16:23 (-0700), so the one-day offset is a timezone difference.

**First Android release carrying riscv64: sources disagree.**

- `git tag --contains` on the Cuttlefish riscv64 commits shows `android-14.0.0_r1`. The findings describe this as an inference from commit dates.
- The existing `project-reports/bionic.md` also says Android 14 (API 34), and itself flags the attribution as unverified.
- The [google/android-riscv64](https://github.com/google/android-riscv64) page shows a `VanillaIceCream` (Android 15) build example and does not call riscv64 official. One research thread read this as pointing to Android 15.
- `source.android.com/docs/setup/reference/riscv-support` returned 404.
- No source states the first release outright. Assessment: android-14.0.0_r1 is the best-supported date for the Cuttlefish target [NEEDS VERIFICATION].

**Upstream or downstream.** The Cuttlefish riscv64 target is upstream AOSP (Google, with Qualcomm and others contributing), not a vendor fork. The Rust KeyMint reference code is upstream AOSP. The RISE Android 17 tree (2026) is a downstream, board-specific effort and contains no KeyMint work. BayLibre with SpacemiT (K1, Banana Pi F3) booted Android 16 on RISC-V and Alibaba DAMO ran Android 16 on XuanTie RVA23 cores ([BayLibre](https://baylibre.com/blog/baylibre-partners-with-spacemit-to-bring-android-16-to-risc-v/), [heise](https://heise.de/-11308808)). Neither source mentions KeyMint.

## 3. Upstream Support Tier

**Formal tier policy:** none. Data not available: no tier policy was found in the `system/keymint` README, the [Android Keystore docs](https://source.android.com/docs/security/features/keystore), or the Cuttlefish tree.

**Evidence of de facto status**

- **Release-blocking.** Not applicable. AOSP CI is internal, and the public repository contains only a `TEST_MAPPING` file naming two VTS presubmits (`VtsAidlKeyMintTargetTest`, `VtsHalRemotelyProvisionedComponentTargetTest`) with no architecture.
- **Official binaries.** None on any channel (see Section 8).
- **Cuttlefish.** riscv64 is the only Cuttlefish architecture that does not use in-guest KeyMint and Gatekeeper, as of `android17-release` ([flags.cc carve-out](https://android.googlesource.com/device/google/cuttlefish/+/9300136e990d249017e788e834f22be80645f0ad)).
- **Kernel.** Google removed riscv64 from the Android Common Kernel/GKI in 2024. Cuttlefish riscv64 uses a mainline kernel prebuilt (`TARGET_KERNEL_USE ?= mainline`).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Cuttlefish product exists | Yes | Yes | Yes (`aosp_cf_riscv64_phone`, `_slim`, `_wear`, `_minidroid`) |
| Cuttlefish default `secure_hals` | `oemlock,guest_keymint_insecure,guest_gatekeeper_insecure` | Same | `keymint,gatekeeper,oemlock` (host-side `secure_env`) |
| In-guest KeyMint | Yes, "good results" per commit message | Yes, same | No; broke boot (b/339926078), carved out |
| Trusty TEE target | Yes (x86 via virtualization) | Yes (TrustZone, `generic-arm64`) | None found (`lk/common/arch` has only `arm`, `arm64`, `x86`) |
| OP-TEE port | Not covered in findings | Yes (TrustZone) | `core/arch/riscv` exists, but no KeyMint TA port found |
| Public CI visibility | Internal | Internal | Internal; nothing verifiable |
| Distro/release package | None | None | None |

## 4. Technical Architecture and RISC-V-Specific Subsystems

KeyMint's own code contains no architecture-specific components. Grep over the tree for `riscv|risc-v|rv64|target_arch|aarch64|x86_64|asm!|neon|intrinsic` returned no matches. There are no `.S` or `.s` files, no `arch/` directory, no `asm!`/`global_asm!`, no JIT backends and no SIMD dispatch. The only `cfg(target...)` use is `target_endian` in `wire/src/legacy.rs` (lines 740 to 811), which is architecture-neutral. The only other `cfg` is `cfg(soong)`, which separates Soong from Cargo builds.

| Component | amd64 | arm64 | riscv64 | Quality / notes |
|---|---|---|---|---|
| KeyMint Rust TA/common/wire/HAL crates | Portable Rust | Portable Rust | Portable Rust | Architecture-neutral. No riscv64-specific code exists or is needed. |
| Crypto backend (BoringSSL via `kmr_crypto_boring`) | x86/x86_64 asm | ARM/AArch64 asm | Scalar C fallback | AOSP `external/boringssl/sources.bp` asm lists cover only 32-bit ARM, AArch64, x86, x86_64. No Zbb, Zkn or Zvkn acceleration. Separate project; see [BoringSSL report](boringssl.md) (a registry cross-reference in the research findings). |
| Rust HAL APEX `com.android.hardware.keymint.rust_nonsecure` | Builds | Builds | `Android.bp` has no arch config; riscv64 variant not confirmed | Cuttlefish `shared/device.mk` installs the Rust KeyMint APEXes for riscv64 products (`rust_cf_remote`, `rust_nonsecure`, `rust_cf_guest_trusty_nonsecure`) per one finding. Whether they are built and run on riscv64 is not confirmed. |
| Cuttlefish `secure_env` KeyMint TA (host-side) | Host x86_64/arm64 | Same | Used by riscv64 guests | Built as host-only modules (`rust_library_host`, `rust_binary_host`, `cuttlefish_buildhost_only` defaults). It runs on the launch host, not in the riscv64 guest. `libkmr_cf_ffi` is `compile_multilib: "64"`. |
| In-guest KeyMint (Rust reference, "insecure") | Yes | Yes | Missing | Broke riscv64 boot; root cause not public. |
| Trusty TEE hosting | Yes | Yes | Missing | No riscv64 target in `trusty/lk/common/arch`. [NEEDS VERIFICATION]: Trusty repos are Gerrit-only and one grep of `system/core/trusty/keymint` did not finish. |
| OP-TEE KeyMint TA | n/a | Google Rust TA exists | No port found | OP-TEE core has riscv64 support, but no RISC-V port of the KeyMint TA was found by RISE or anyone else. |
| Keystone and other RISC-V TEEs | n/a | n/a | Academic only | Only [arXiv 2211.10299](https://arxiv.org/abs/2211.10299), a Keystone-based proposal on a HiFive Unleashed, not a KeyMint port. |
| Hardware key storage on a RISC-V SoC | Vendor | Vendor | Missing | No public implementation found. |
| Floating point / NaN semantics | n/a | n/a | n/a | KeyMint has no floating-point-sensitive code in the findings. |

## 5. Build System, Cross-Compilation, and Toolchain

**Official build.** Soong, via `Android.bp` in each of `boringssl`, `common`, `derive`, `hal`, `ta`, `tests` and `wire`. None has `arch:` or `target:` blocks. The Android build uses the AOSP prebuilt Rust toolchain in `platform/prebuilts/rust`. The prebuilt Rust version and its riscv64 target could not be confirmed from the repo page. There are no pinned GCC or Clang minimums, and the crates are Rust edition 2021 with no `rust-version`.

**Android riscv64 target.**

- The Google blog gives `aosp_cf_riscv64_phone-userdebug`.
- The [android-riscv64](https://github.com/google/android-riscv64) page shows `aosp_cf_riscv64_phone-trunk_staging-userdebug`, with riscv64 and CPU variant `generic`. As of 2025Q2 ART boots to the homescreen.
- QEMU 8.1 or newer is required (9.0 fixes the V extension, 9.2 speeds it up and is recommended).
- The NDK riscv64 ABI is not finalized, and boot takes several minutes.
- The `vsoc_riscv64/BoardConfig.mk` sets `TARGET_ARCH := riscv64`, `TARGET_CPU_VARIANT := generic`, `ALLOW_MISSING_DEPENDENCIES := true` ("Temporary hack while prebuilt modules are missing riscv64") and a mainline kernel prebuilt. Host tools are cross-built for `linux_musl` on arm64 unless `RISCV64_BUILD_X86_64_HOST_TOOLS` is set ([BoardConfig.mk](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/vsoc_riscv64/BoardConfig.mk)).

**Feature flags**

- `kmr-wire` has `default = ["hal_v2","hal_v3","hal_v4"]`.
- `kmr-ta` has a `downgrade` feature, off by default and not for production.
- The Soong libraries `libkmr_hal_v1`, `libkmr_hal_v2` and `libkmr_hal_v3` emulate older HAL versions.

**No cmake, configure, Makefile, Dockerfile or shell build script exists in `system/keymint`.** No riscv64 build documentation exists.

**Cargo cross-build executed during research.** One research thread ran this on a development machine [NEEDS VERIFICATION: single source]:

```
rustup target add riscv64gc-unknown-linux-gnu
export CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER=riscv64-linux-gnu-gcc
export CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_RUNNER="qemu-riscv64 -L /usr/riscv64-linux-gnu"
cargo check --target riscv64gc-unknown-linux-gnu -p kmr-wire -p kmr-common -p kmr-ta
cargo test  --target riscv64gc-unknown-linux-gnu -p kmr-wire -p kmr-common -p kmr-ta
```

- The tool versions were rustc 1.97.0 stable and a qemu-user environment.
- `cargo check` succeeded for `kmr-wire`, `kmr-common` and `kmr-ta`.
- `cargo test` under `qemu-riscv64` passed 25 tests in `kmr-common`, 16 in `kmr-ta` and 7 in `kmr-wire`.
- `kmr-crypto-boring` failed `cargo check` for riscv64 because the `openssl-sys` build script cannot find a riscv64 OpenSSL. No vendored build or riscv64 sysroot was tried. `kmr-tests` depends on `kmr-crypto-boring` and was not run, so full TA tests were not exercised on riscv64.

**Known build failures.** The `openssl-sys` failure above is a development-environment issue with a non-Android Cargo build. On Android, `kmr-crypto-boring` uses `libbssl_sys` and `libopenssl` from AOSP. A Cuttlefish riscv64 build cannot be shown to be free of KeyMint failures from public sources.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| KeyMint Rust TA/HAL source portable | Yes | Yes | Yes (check/test pass for 3 crates in a qemu-user cross-build [NEEDS VERIFICATION]) |
| Software KeyMint in Cuttlefish guest | Yes | Yes | No (reverted, carved out) |
| Host-side `secure_env` KeyMint/Gatekeeper | Not default | Not default | Default and only exercised path |
| Production TEE-hosted KeyMint (Trusty) | Yes | Yes | None |
| Production TEE-hosted KeyMint (OP-TEE) | n/a | Google Rust TA exists | No port found |
| RISC-V TEE (Keystone etc.) KeyMint | n/a | n/a | None; academic proposal only |
| Hardware-backed key storage | Vendor | Vendor | None public |
| Crypto acceleration (BoringSSL) | asm | asm | Scalar only |
| Public riscv64 KeyMint CI/tests | Internal | Internal | None verifiable |
| RISE Android 17 build | n/a | n/a | "Secure boot and a TEE are out of scope" |

**Functional gaps (cannot do X at all)**

- No secure-world KeyMint on riscv64: no Trusty target and no RISC-V OP-TEE or Keystone TA port.
- No in-guest KeyMint on riscv64 Cuttlefish.
- No hardware-backed key storage on a RISC-V SoC found in public sources.
- On the RISE Android 17 developer release, a TEE is explicitly out of scope, so there is no hardware-backed KeyMint TA. The release notes do not mention KeyMint, Keystore or Gatekeeper, so what KeyMint implementation (if any) runs there is not established. The realistic route is a software-only KeyMint, such as the reference TA in a non-secure context, but that was not verified for RISE.

**Performance gaps.** Data not available: no KeyMint benchmark on riscv64 or any architecture was found. Searches covered the AOSP KeyMint page, source.android.com Keystore docs, the RISE feed (11 posts) and the RISE sitemap (37 posts). The only performance statement is qualitative: the Cuttlefish commit says in-guest KeyMint "performed well" on x86_64 and arm64, with no numbers and nothing for riscv64. BoringSSL riscv64 runs on the scalar C fallback, so any crypto-bound KeyMint operation (RSA, EC, AES, SHA) lacks vector-crypto acceleration. The size of the gap is not measured.

**Security hardening gaps.** The RISE Android 17 build runs SELinux in permissive mode, has AVB verification disabled in the A210 U-Boot, and has no secure boot or TEE ([release notes](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0), [android_manifest README](https://github.com/riseproject-dev/android_manifest)). Within the Cuttlefish carve-out, the host-side path is a software fallback, not a hardware root of trust.

**NaN / floating-point semantics.** Not applicable. No such issues were found for KeyMint.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? Not verifiably.** Files read on `system/keymint` `main` (HEAD `fda4e68`, 2025-02-21):

- **Root listing.** The directories are `boringssl/ common/ derive/ hal/ scripts/ ta/ tests/ wire/`. The root files are `.gitignore`, `Android.bp`, `Cargo.toml`, `CHANGELOG.md`, `NOTICE`, `OWNERS`, `PREUPLOAD.cfg`, `README.md`, `rustfmt.toml` and `TEST_MAPPING`. The `android17-release` root listing is identical.
- **External CI.** There is no `.github/`, `.gitlab-ci.yml`, `.travis.yml`, `Jenkinsfile` or cloudbuild file.
- **`TEST_MAPPING`.** Presubmit lists `VtsAidlKeyMintTargetTest` and `VtsHalRemotelyProvisionedComponentTargetTest`. These are VTS HAL tests for the AIDL interface in `hardware/interfaces`. No architecture or device is named, and Google's internal infrastructure decides where they run.
- **`PREUPLOAD.cfg`.** Only `clang_format`, `rustfmt` and the `aosp_sha.sh` hook. There is no build or test step.
- **`Android.bp`.** Test modules are `libkmr_keyblob_test` (`rust_test_host`, `general-tests`), `libkmr_hal_test` and `libkmr_ta_test` (`rust_test`, `general-tests`), plus `host_supported: true` on `libkmr_ta` and a fuzzer. There are no arch, target or riscv lines. The Rust tests are host tests, so they would run on the host test machine (normally x86_64 or arm64), not on riscv64.

AOSP CI (Android Build / Gerrit presubmit) is internal. Whether Google's internal CI runs VTS KeyMint on `aosp_cf_riscv64_phone` cannot be confirmed or refuted from public sources. A Cuttlefish commit ("Exclude widevine from RISC-V Cuttlefish images") shows riscv64 Cuttlefish images are built and launched upstream, but that is not KeyMint test evidence.

**RISE.** No RISE runner usage or funded work covers KeyMint. RISE's Android 17 hardware testing is planned on the RISE Board Farm (starting with Alibaba A210 systems, K3 "in the coming weeks"). Phase 2 of RP024 will automate build, hardware testing and release from the manifest repo. RISE documents RISC-V OP-TEE work at [riscv-optee-docs](https://riscv-optee-docs.riseproject.dev/) (RP016, RP022), which does not mention KeyMint.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Public CI config in `system/keymint` | None | None | None |
| `TEST_MAPPING` presubmit (VTS KeyMint) | Arch not named | Arch not named | Arch not named |
| Internal AOSP CI | Not visible | Not visible | Not visible |
| Host unit tests (`general-tests`) | Run on the host | Run on the host | Not a riscv64 host |
| RISE runners / board farm | None | None | None for KeyMint |
| Hardware used | n/a | n/a | n/a for KeyMint |

## 8. Distribution and Release Status

**Official riscv64 binaries: none.** KeyMint is distributed as AOSP source built into platform images, not as a standalone package.

- **PyPI.** The only `keymint` is v2.5.0, an unrelated license-key library ([PyPI JSON](https://pypi.org/pypi/keymint/json)). It ships `py3-none-any` wheels and an sdist, with no riscv64-specific files. The RISE wheel builder index redirected to [PyPI simple](https://pypi.org/simple/keymint/), so no separate RISE builds could be confirmed. The wheel builder lists 74 Python packages and not KeyMint.
- **Ubuntu 26.04 (resolute).** Unverified: the packages.ubuntu.com search returned HTTP 500 for both the search URL and the direct URL. The project-graph query tool was also unavailable. Android KeyMint is AOSP-only and very unlikely to be packaged by Debian or Ubuntu, but that is an inference.
- **Arch Linux RISC-V.** A search at [archriscv.felixc.at](https://archriscv.felixc.at/?q=keymint) returned no results for "keymint".
- **Debian/Fedora, npm, Maven, OCI.** Data not available: not searched in the findings.
- **AOSP tags.** The `system/keymint` repo has branches and tags such as `android-platform-15.0.0_r21`, but no binary releases.
- **RISE.** The [RISE Android 17 v1.0](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0) release ships binary images, pinned manifests and flashing tools for the SpacemiT K3 and Alibaba A210. It is a developer release, not production-ready or certified, and does not mention KeyMint.

**To get a working KeyMint on riscv64 today.** Build AOSP `aosp_cf_riscv64_phone-userdebug` and launch it under Cuttlefish with QEMU 8.1 or newer. KeyMint and Gatekeeper then run host-side through `secure_env`. On real hardware, no verified path exists beyond the RISE developer build, where the KeyMint configuration was not established.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| BoringSSL | Crypto backend for `kmr-crypto-boring` (AES, RSA, EC, HMAC, SHA, RNG); runtime-dependency, critical | Compiles; `OPENSSL_RISCV64` macro; scalar C only, no riscv64 asm | Upstream CI is compile-only on Android riscv64 builders; QEMU tests behind a default-off flag | Ships in AOSP `main`; no standalone release | Google. A RISE RFP for BoringSSL is named as a possible future item. See [BoringSSL report](boringssl.md). |
| Rust | Compiler and sysroot, including `libcore`/`liballoc` for `_nostd` variants; build-dependency, critical | Android Rust prebuilt builds for riscv64 | Not verified | Prebuilt toolchain in AOSP | Google, upstream Rust. Related gap: link-flag parity (android-riscv64#166, closed 2025-08-26) and Gerrit change 2320311 (disable a Rust dependency for riscv64 APEX) unresolved since 2022, both noted in `bionic.md`. See [Rust report](rust.md). |
| Soong | Android build system for all `Android.bp` files; build-dependency, critical | AOSP-native; supports `TARGET_ARCH := riscv64` for Cuttlefish | Not verified | AOSP-only | Google. RISE maintains forks `android_build_soong` and `android_build_blueprint` on its android-17 branch [NEEDS VERIFICATION: single source]. Data not available: no riscv64-specific Soong issue list was reviewed. |
| OP-TEE | Alternative secure OS for vendor KeyMint TAs; runtime-dependency, optional | Has riscv64 port (`core/arch/riscv`), maintained | Compile-only CI, no run-time CI job | Upstream releases include riscv | OP-TEE community, RISE RP016/RP022. No KeyMint-on-RISC-V integration found. See [OP-TEE report](op-tee.md). |
| Trusty | Secure OS for the production KeyMint TA; runtime-dependency, optional | No riscv64 port (`lk/common/arch`: `arm`, `arm64`, `x86`) | None | None | Google. Blocks a Trusty-hosted KeyMint TA on riscv64. |
| libbinder_rs plus AIDL Rust bindings | Binder IPC for `kmr-hal` | Platform component, built for riscv64 in AOSP | Not verified | AOSP only | Google. `bionic.md` notes a Binder-adjacent riscv64 gap in `system/core`. |
| ciborium, ciborium-io 0.2.x | CBOR serialisation (`kmr-wire`) | Pure Rust | Not verified | AOSP vendored; Ubuntu universe | Community. None identified. |
| coset 0.3.x | COSE structures for attestation/RKP | Pure Rust | Not verified | AOSP vendored 0.3.8 only; no Debian/Ubuntu package | Affects only non-AOSP Cargo builds. |
| RustCrypto (der, spki, pkcs1, pkcs8, sec1, x509-cert) | ASN.1/X.509 for keyblobs and attestation | Pure Rust | Not verified | AOSP vendored; Ubuntu universe | Community. None identified. |
| zeroize, flagset, enumn, log, libc, hex, foreign-types 0.3 | Utility crates | Builds (`libc` has riscv64 definitions) | Not verified | AOSP vendored; Ubuntu universe | The unversioned `librust-foreign-types-dev` is 0.5, so the versioned 0.3 package matches. |
| proc-macro2, quote, syn 2.x | Host-side proc macros (`kmr-derive`) | Host-only | Not verified | Ubuntu universe | None identified. |
| openssl 0.10.x, openssl-sys 0.9.x | Rust wrapper used by `kmr-crypto-boring` | AOSP builds it against BoringSSL (`external/rust/crates/openssl`) | Not verified | AOSP flavour only | Ubuntu packages bind OpenSSL, so they only approximate the Android configuration. The Cargo cross-build failure came from this layer. See [OpenSSL report](openssl.md). |
| cddl-cat (optional) | CDDL schema tests | Not needed for HAL/TA | Test-only | n/a | None. |
| QEMU | Cuttlefish backend for riscv64 guests | Host tool | Needs 8.1+ (9.0 fixes V extension, 9.2 speeds it up) | n/a | Open Cuttlefish crash on GCP Debian 11 (android-riscv64#163). See [QEMU report](qemu.md). |
| Bionic | Android libc | Official riscv64 | Per `bionic.md` | AOSP | See [Bionic report](bionic.md). RISE names Bionic as a future RFP. |

**Deep dive.**

- **Crypto.** The only crypto in this stack is BoringSSL, and it runs in portable C on riscv64. KeyMint has no SIMD, assembly or JIT of its own, so all crypto-throughput work belongs to BoringSSL. RISE's Android 17 post lists BoringSSL as a possible future RFP.
- **Cargo-built path.** On a plain Linux host, the riscv64 `kmr-crypto-boring` build needs a riscv64 OpenSSL or BoringSSL sysroot. The only attempt failed there. The `openssl` crate in Cargo resolves to OpenSSL, not BoringSSL, so this is not the Android configuration.
- **TEE hosts.** Trusty has no riscv64 port. OP-TEE has a riscv64 core port and RISE-funded work in RP016 and RP022 (RPMI SYSIRQ delivery, ASLR and stack-canary validation, RISC-V hardware crypto acceleration, landing pads in OP-TEE core and TAs). None of it targets KeyMint. Google's Rust KeyMint TA for OP-TEE has no riscv port found.
- **Indirect recursion.** The `ciborium`, RustCrypto and `coset` crates are pure Rust and carry no architecture-specific code per the findings. No test results on riscv64 were obtained for them.

## 11. Known Bugs and Active Issues

Section 10 is omitted: KeyMint has no dependent package ecosystem that must be enabled on riscv64.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| b/339926078 | In-guest KeyMint/Gatekeeper breaks riscv64 Cuttlefish boot | Internal; carve-out in place on `android17-release` | High for in-guest use | Cited in [846195d82](https://android.googlesource.com/device/google/cuttlefish/+/846195d826ab5b9fbf98dd9b0101fa08bd0364b0) and [9300136e9](https://android.googlesource.com/device/google/cuttlefish/+/9300136e990d249017e788e834f22be80645f0ad). Not publicly viewable; root cause unknown. |
| b/332977378 | Use in-guest secure HALs by default (snapshots) | Internal | n/a | Motivation was device snapshots. riscv64 excluded. |
| b/336038577 | Reason for first revert (2024-04-22) | Internal | n/a | Not stated to be riscv64-related. |
| TODO in `flags.cc` | `// TODO: schuffelen - fix behavior on riscv64` | Unresolved; present at `android17-release` (lines ~1364-1374) | Medium | riscv64 still defaults to `keymint,gatekeeper,oemlock`. |
| aosp/3077417 | Fix cited for the immediate issue behind the first revert | Merged per the commit message; not fetched | n/a | Not independently read. |
| b/321153191 | Widevine excluded from riscv64 Cuttlefish | Merged workaround (2024-02-12) | Low (sibling HAL) | Precedent for DRM/TEE gaps, not KeyMint. |
| android-riscv64#163 | Cuttlefish crash on GCP Debian 11 | Open | Medium | Affects the host environment used to run riscv64 KeyMint paths. See [android-riscv64](https://github.com/google/android-riscv64). |
| android-riscv64#166 | Rust link-flag parity | Closed 2025-08-26 | n/a | From `bionic.md`. |
| Gerrit 2320311 | Disable a Rust dependency for riscv64 APEX | Unresolved since 2022 | Unknown | From `bionic.md` [NEEDS VERIFICATION]. |
| Cargo `kmr-crypto-boring` riscv64 build | `openssl-sys` cannot find a riscv64 OpenSSL | Not filed | Low (dev-only path) | Single research run [NEEDS VERIFICATION]. |

**Correctness bugs.** No KeyMint correctness bug specific to riscv64 was found. The only riscv64-triggered failure is the boot break above, which has no public root cause. No KeyMint-specific issues or PRs exist on any tracker: the project is Gerrit-only and the referenced bugs are in Google's internal Buganizer. Not checked: VTS KeyMint failures on riscv64 and the Google Issue Tracker entries.

## 12. Objections and Upstream Blockers

**Stated objections.** None for KeyMint. The searches `KeyMint riscv64 patch`, `KeyMint riscv64 support`, `site:github.com KeyMint riscv64` and the lore.kernel.org / aosp-riscv queries found no objections or discussions.

**Technical blockers**

- No riscv64 Trusty port. The production TEE path for KeyMint on Android has no riscv64 target.
- Boot breakage in the in-guest path (b/339926078), root cause hidden in an internal tracker.
- No RISC-V TEE port of the KeyMint TA (OP-TEE, Keystone), and no integration in AOSP.
- BoringSSL has no riscv64 assembly or vector-crypto path (performance, not function).
- Google removed riscv64 from the Android Common Kernel/GKI in 2024, and stated it was not ready to provide a single supported image for all vendors ([The Register](https://www.theregister.com/2024/05/01/riscv_support_android_pulled/), [CNX Software](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/)). Cuttlefish riscv64 still uses a mainline kernel prebuilt.

**Organizational blockers**

- AOSP CI is internal, so a third party cannot demonstrate or verify KeyMint riscv64 test results publicly.
- The `system/keymint` `main` mirror is frozen at 2025-02-21, so newer work is visible only on release branches.
- All maintainers are Google employees and contributions go through Gerrit.
- RISE has no KeyMint work. RISE's Android 17 release declares secure boot and a TEE out of scope. RP024 future RFPs name Bionic, BoringSSL, ART, V8, Chrome and multimedia libraries, not KeyMint.

**Acceptance probability.** Data not available: no patch has been proposed, so there is no upstream response to measure. The code is architecture-neutral and Google engineers already handle riscv64 in Cuttlefish, which suggests acceptance of narrow fixes would not depend on KeyMint code changes. This is an assessment, not an observed fact.

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci: no verifiable riscv64 CI or tests; no distro or release channel)
- **Release provider:** none
- **Justification.**
  - The AOSP [system/keymint](https://android.googlesource.com/platform/system/keymint) Rust code is architecture-neutral. It has no riscv/rv64 string anywhere and no per-arch `Android.bp` blocks, but its `TEST_MAPPING` and `PREUPLOAD` files show no riscv64 build or test configuration.
  - No distro or other channel ships a riscv64 KeyMint, and the production TEE path (Trusty) has no riscv64 port.
  - In Cuttlefish, in-guest KeyMint/Gatekeeper broke riscv64 boot (b/339926078, [Revert^3](https://android.googlesource.com/device/google/cuttlefish/+/846195d826ab5b9fbf98dd9b0101fa08bd0364b0)). riscv64 is carved out to the older host-side `secure_env` path, still present on `android17-release` ([9300136e9](https://android.googlesource.com/device/google/cuttlefish/+/9300136e990d249017e788e834f22be80645f0ad)).
  - It is not red because the host-side path works and riscv64 is not declared unsupported. It is not yellow because no riscv64 build job for KeyMint is publicly verifiable (AOSP CI is internal).
  - The riscv64 Cuttlefish product probably builds the Rust KeyMint APEXes, but this was not confirmed.
  - The riscv64 Cuttlefish target is upstream AOSP, first in `android-14.0.0_r1`, which is an inference from commit dates.
  - Evidence is from 2026-10 research. The `system/keymint` `main` mirror is frozen at 2025-02-21, and there is no `project-reports` entry for KeyMint.
- **Pending work that could change the grade**
  - No open KeyMint riscv64 patches were found.
  - The Cuttlefish riscv64 TODO (schuffelen, "fix behavior on riscv64"; bugs b/339926078 and b/332977378, both internal) is unresolved.
  - RISE has no KeyMint work. Adjacent RISE efforts that could host it later are RP024 (Android 17 on RVA23) and RP016/RP022 (OP-TEE on RISC-V, with Google's Rust KeyMint TA for OP-TEE at `tee/optee/ta/keymint` but no riscv port found).
  - Trusty has no riscv64 target.
  - Upgrade to yellow if a riscv64 KeyMint build is confirmed in AOSP CI. Upgrade to blue if VTS KeyMint tests are shown passing on `aosp_cf_riscv64_phone`.

## 14. Investment Analysis

**Already done or funded by RISE:** nothing for KeyMint. RISE funded RP024 (Android 17 on RVA23, delivered 2026-10-20 without a TEE or KeyMint scope), RP016/RP022 (OP-TEE on RISC-V, OpenSBI, no KeyMint) and the Python wheel builder. Phase 2 of RP024 covers CI automation for the RISE Android build and does not name KeyMint. No work in this section duplicates funded RISE work.

**Sizing basis.** The effort figures below are planning estimates by the author, not measurements. No benchmark or historic effort data exists for KeyMint on riscv64.

### 14.1 Functional Enablement

- **Root-cause the riscv64 in-guest boot break (b/339926078).** Reproduce on `aosp_cf_riscv64_phone` with `secure_hals=oemlock,guest_keymint_insecure,guest_gatekeeper_insecure`, fix it, and remove the `flags.cc` carve-out. The cause is not public, so this includes access to the internal bug or independent reproduction. The work is likely in Cuttlefish and platform code, not in `system/keymint`.
- **Confirm the riscv64 KeyMint build.** Establish which Rust KeyMint APEXes the riscv64 product builds and runs.
- **TEE decision.** The two realistic options are an OP-TEE-based path (riscv64 core port exists, Google's Rust KeyMint TA exists for ARM) or a Trusty riscv64 port (Google-owned, no target today). A Keystone port is an academic route only. A KeyMint TA on OP-TEE for riscv64 needs porting `tee/optee/ta/keymint` and its Teaclave SDK dependency to riscv64. That feasibility is not assessed in the findings.
- **RISE Android 17 integration.** Enable a software KeyMint/Gatekeeper path on the RISE trees, since a TEE is out of scope there.

### 14.2 Performance Optimization

KeyMint has no architecture-specific code, so performance work is in BoringSSL (riscv64 asm and vector-crypto paths, Zbb/Zkn/Zvkn) and is tracked in the BoringSSL report, not here. No KeyMint-specific measurement exists. First step: benchmark KeyMint operations (key generation, sign, attest) on riscv64 versus arm64 once a riscv64 path runs in-guest.

### 14.3 CI/CD Infrastructure

- AOSP CI is internal, so third parties cannot add jobs. The achievable item is a public Cuttlefish riscv64 job (build plus VTS KeyMint) on RISE board farm or emulated infrastructure. This ties into RP024 phase 2.
- A qemu-user cargo job for `kmr-wire`, `kmr-common` and `kmr-ta` is cheap, since those crates built and passed 48 tests in the research run [NEEDS VERIFICATION].

### 14.4 Ecosystem Enablement

Not applicable: KeyMint has no dependent package ecosystem. Dependency enablement (BoringSSL, Rust, Bionic, OP-TEE) is covered by their own reports.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Confirm which Rust KeyMint APEXes the riscv64 Cuttlefish product builds and runs | 1 to 2 | Platform engineer | High |
| Functional | Reproduce and root-cause b/339926078 in-guest boot break; remove the `flags.cc` carve-out | 4 to 8 | Android/Cuttlefish engineer with Google coordination | High |
| Functional | Software KeyMint/Gatekeeper path on the RISE Android 17 trees | 3 to 6 | RISE Android team (RP024 follow-on) | Medium |
| Functional | Feasibility study: RISC-V TEE host for the KeyMint TA (OP-TEE vs Trusty) | 3 to 4 | Security engineer | Medium |
| Functional | Port `tee/optee/ta/keymint` to riscv64 OP-TEE | 8 to 16 | Security engineer, RISE security working group | Low until the study concludes |
| Performance | Benchmark KeyMint operations on riscv64 vs arm64 | 2 to 3 | Performance engineer | Low |
| CI/CD | Public riscv64 Cuttlefish build plus VTS KeyMint job (on RISE board farm) | 4 to 6 | RISE infra | Medium |
| CI/CD | qemu-user cargo job for `kmr-wire`, `kmr-common`, `kmr-ta` | 1 | Platform engineer | Low |

## 15. References

- [AOSP platform/system/keymint](https://android.googlesource.com/platform/system/keymint)
- [system/keymint README](https://android.googlesource.com/platform/system/keymint/+/refs/heads/main/README.md)
- [AOSP hardware/interfaces security/keymint](https://android.googlesource.com/platform/hardware/interfaces/+/refs/heads/main/security/keymint/)
- [AOSP hardware/interfaces security/keymint aidl/default Android.bp](https://android.googlesource.com/platform/hardware/interfaces/+/refs/heads/main/security/keymint/aidl/default/Android.bp)
- [Android Keystore and KeyMint documentation](https://source.android.com/docs/security/features/keystore)
- [Trusty download and build](https://source.android.com/docs/security/features/trusty/download-and-build)
- [Trusty AOSP vendor repository](https://android.googlesource.com/trusty/vendor/google/aosp/+/refs/heads/main/)
- [Google KeyMint TA for OP-TEE (tee/optee/ta/keymint)](https://android.googlesource.com/tee/optee/ta/keymint)
- [Cuttlefish 4f541655c: Use the in-guest secure hals by default](https://android.googlesource.com/device/google/cuttlefish/+/4f541655c986b89b23ab8671e5fbb1d9c6c2e8f0)
- [Cuttlefish e9feea943: first revert](https://android.googlesource.com/device/google/cuttlefish/+/e9feea943b6eefb3e7c8fad3c33818753fb0cc31)
- [Cuttlefish f87300b93: Revert^2](https://android.googlesource.com/device/google/cuttlefish/+/f87300b935069949f06763a013243a347465170e)
- [Cuttlefish 846195d82: Revert^3](https://android.googlesource.com/device/google/cuttlefish/+/846195d826ab5b9fbf98dd9b0101fa08bd0364b0)
- [Cuttlefish 9300136e9: in-guest KeyMint except riscv64](https://android.googlesource.com/device/google/cuttlefish/+/9300136e990d249017e788e834f22be80645f0ad)
- [Cuttlefish 81634ff43: exclude Widevine from RISC-V images](https://android.googlesource.com/device/google/cuttlefish/+/81634ff43eeec5d4c99cd046d2870020dd9c1e07)
- [Gerrit change 3084667](https://android-review.googlesource.com/c/3084667)
- [Cuttlefish vsoc_riscv64 BoardConfig.mk](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/vsoc_riscv64/BoardConfig.mk)
- [Cuttlefish vsoc_riscv64 phone aosp_cf.mk](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/vsoc_riscv64/phone/aosp_cf.mk)
- [Cuttlefish AndroidProducts.mk](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/AndroidProducts.mk)
- [Cuttlefish secure_env Android.bp](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/host/commands/secure_env/rust/Android.bp)
- [Cuttlefish guest KeyMint Android.bp](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/guest/hals/keymint/rust/Android.bp)
- [Cuttlefish shared config](https://android.googlesource.com/device/google/cuttlefish/+/refs/heads/main/shared/config/)
- [Google android-riscv64](https://github.com/google/android-riscv64)
- [Android and RISC-V: What you need to know (Google Open Source blog)](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html)
- [CNX Software: Android no longer supports RISC-V](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/)
- [The Register: RISC-V support pulled from Android](https://www.theregister.com/2024/05/01/riscv_support_android_pulled/)
- [Hackster: Google removes RISC-V support from the Android Common Kernel](https://hackster.io/news/google-removes-risc-v-support-from-the-android-common-kernel-but-denies-abandoning-the-isa-c4ccab33a929) (cited from search snippets only)
- [Trusted Hart for Mobile RISC-V Security (arXiv 2211.10299)](https://arxiv.org/abs/2211.10299)
- [Trusted RV (FOSDEM 2021)](https://fosdem.org/2021/schedule/event/tee_trusted_rv)
- [android-mainline-riscv64 kernel branch](https://android.googlesource.com/kernel/common.git/+/refs/heads/android-mainline-riscv64/include/)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [Android 17 Available on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [Advancing OpenSBI Interrupt Handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE android_manifest](https://github.com/riseproject-dev/android_manifest)
- [RISE Android 17 v1.0 release](https://github.com/riseproject-dev/android_manifest/releases/tag/android-17-v1.0)
- [RISE RISC-V OP-TEE documentation](https://riscv-optee-docs.riseproject.dev/)
- [RISE work groups](https://wiki.riseproject.dev/display/HOME/RISE+Work+Groups)
- [RISE wiki: SL_00_001 bionic](https://wiki.riseproject.dev/display/HOME/SL_00_001+-+bionic)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [BayLibre and SpacemiT: Android 16 on RISC-V](https://baylibre.com/blog/baylibre-partners-with-spacemit-to-bring-android-16-to-risc-v/)
- [heise: Android on RISC-V](https://heise.de/-11308808)
- [PyPI keymint JSON](https://pypi.org/pypi/keymint/json)
- [PyPI keymint simple index](https://pypi.org/simple/keymint/)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=keymint)
- [Linaro mirror: system/nvram riscv64 seccomp policy](https://android-review.linaro.org/plugins/gitiles/platform/system/nvram/+/f9b5669b50be9b1d495dfa2eafdab3342dbe917a)