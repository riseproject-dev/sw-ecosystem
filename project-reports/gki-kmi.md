---
title: GKI/KMI
parent: Project Reports
color: yellow
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Bazel
    relation: build-dependency
    criticality: critical
  - name: Kleaf
    relation: build-dependency
    criticality: critical
  - name: libabigail
    relation: build-dependency
    criticality: optional
  - name: STG
    relation: build-dependency
    criticality: optional
  - name: Cuttlefish
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="gki-kmi" %}

# GKI/KMI

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-25<br/>
**Readiness:** yellow (build-only-ci), release provider: none<br/>
**Scope:** RISC-V (riscv64/linux and riscv64/android) support status for GKI/KMI<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

GKI (Generic Kernel Image) is Google's single kernel binary plus loadable modules, per architecture and per LTS release. KMI (Kernel Module Interface) is the stable symbol and type interface between that binary and vendor modules. Both are produced from the Android Common Kernel (ACK) in the AOSP `kernel/common` repository. The repository is hosted on android.googlesource.com, not GitHub. See the [GKI documentation](https://source.android.com/docs/core/architecture/kernel/generic-kernel-image) and the [ACK documentation](https://source.android.com/docs/core/architecture/kernel/android-common).

Build and ABI tooling:
- Builds use Kleaf (Bazel) in `kernel/build`, driven by `repo` manifests.
- ABI monitoring uses STG (`abi.stg`), with libabigail as the legacy tool.
- GKI is required for devices that ship kernel 5.10 or later, starting with Android 12. The ACK page names no architectures.

Governance:
- GKI/KMI belongs to no foundation. Google's Android Kernel Team (kernel-team@android.com) is the maintainer. Patches go through AOSP Gerrit.
- The ACK page, the GKI page and the `kernel/common` README name no individual GKI maintainers, no tier policy and no licence. The kernel is GPLv2 as Linux.
- The `android-mainline` MAINTAINERS file has no GKI or KMI entry in the first 100k of 122k characters read. A later entry is not ruled out.
- Google LLC is a Premier Member of RISE ([RISE members](https://riseproject.dev/members/)). GKI/KMI is not a RISE project, and RISE lists no Android, GKI or KMI project.
- Named riscv maintainers for GKI: none found. The `OWNERS` file on the riscv64 branch lists a single reviewer, prashanthsw@google.com.

Community stance on new ports ([kernel/common README](https://android.googlesource.com/kernel/common/+/refs/heads/android-mainline/README.md)):
- The preference is upstream-first. Upstream Linux and stable backports are the "BEST" path.
- Out-of-tree patches are "LESS GOOD". They are unlikely to be accepted unless they fix an Android-specific bug or were coordinated with kernel-team@android.com.
- Symbol-export-only patches are discouraged.
- The README states that patches must not break `gki_defconfig` or `allmodconfig` builds for "arm, arm64, x86, x86_64". RISC-V is not in that list.
- The pages state no policy for adding a new GKI architecture.

Current riscv64 position:
- There is no riscv64 GKI on any release branch (`android15-6.6`, `android16-6.12`, `android17-6.18`, `android18-7.3`) or on `android-mainline`.
- A riscv64 GKI-like build exists only on the side branch [android-mainline-riscv64](https://android.googlesource.com/kernel/common/+/refs/heads/android-mainline-riscv64). It is Google's own downstream AOSP work, not upstream Linux, and it has no KMI enforcement.
- The branch tip is `17ac734a00ca` (2026-10-23), auto-merged from `android-mainline` at Linux v7.3.
- The upstream `arch/riscv` code that this build uses is mainline Linux riscv.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-11-21 (merged 2022-12-08) | "ANDROID: GKI: Add 64-bit RISC-V config" (Alistair Delva, Bug 260012551, [CL 2310710](https://android-review.googlesource.com/c/kernel/common/+/2310710)). Adds a "fake" GKI: the arm64 `gki_defconfig` plus riscv fragments. | [commit d0da01fd](https://android.googlesource.com/kernel/common/+/d0da01fd61ec24fae56f1fa8379425855618d7e9) |
| 2023-03-21/22 | CONFIG_SMP enabled for riscv ([CL 2498717](https://android-review.googlesource.com/c/kernel/common/+/2498717)). Cuttlefish kernel prebuilt updated to match. | [android-riscv64 #79](https://github.com/google/android-riscv64/issues/79) |
| 2023-06-23 | riscv `gki_defconfig` rebuilt as a standalone file and `gki.config` merged in (CLs 2635913, 2635912, 2635895). | [Gerrit CL 2635913](https://android-review.googlesource.com/c/kernel/common/+/2635913) |
| 2023-09 to 2023-11 | Upstream Linux features that Google engineers drove for Android land. KASLR and CFI in v6.6, shadow call stack in v6.7. `CONFIG_RELOCATABLE` landed in v6.4-rc. | [#56](https://github.com/google/android-riscv64/issues/56), [#54](https://github.com/google/android-riscv64/issues/54), [#55](https://github.com/google/android-riscv64/issues/55) |
| 2023-10-23 | `CONFIG_CFI_CLANG` enabled for riscv in the Android config (Sami Tolvanen). | [commit ec0b9c28](https://android.googlesource.com/kernel/common/+/ec0b9c28afb08aea9e7102525a45a9990279cd51) |
| 2023-10-30/31 | `CONFIG_RANDOMIZE_BASE` enabled for riscv ([CL 2812953](https://android-review.googlesource.com/c/kernel/common/+/2812953)). | [#54](https://github.com/google/android-riscv64/issues/54) |
| 2023-10-30 | Google Open Source blog on Android and RISC-V. It describes Cuttlefish `aosp_cf_riscv64_phone-userdebug` and says nothing about the GKI branch or KMI. | [Google Open Source blog](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html) |
| 2024-01-17 | `CONFIG_SHADOW_CALL_STACK` enabled for riscv ([CL 2912646](https://android-review.googlesource.com/c/kernel/common/+/2912646)). | [#55](https://github.com/google/android-riscv64/issues/55) |
| 2024-04-26 (committed 2024-04-30, merged 2024-05-01) | "ANDROID: Remove ACK's support for riscv64" (Matthias Maennich, Bug 337124279). Message: "Support for risc64 GKI kernels is discontinued." Merged on `android-mainline` ([CL 3061966](https://android-review.googlesource.com/c/kernel/common/+/3061966)) and `android15-6.6` ([CL 3061965](https://android-review.googlesource.com/c/kernel/common/+/3061965)). | [commit 9cf3c312](https://android.googlesource.com/kernel/common/+/9cf3c3120558c10b8ed7a1d735809713fc22f97b) |
| 2024-05-01 (committed 2024-05-02) | Revert of the removal (Prashanth Swaminathan, Bug 338070272, [CL 3070126](https://android-review.googlesource.com/c/kernel/common/+/3070126)), applied on `android-mainline-riscv64` only. The commit gives no rationale. Google's public line was that Android will continue to support RISC-V but is "not ready to provide a single supported image for all vendors". | [commit 40bf40a0](https://android.googlesource.com/kernel/common/+/40bf40a0d7fca59f83fdbd9d329319db3592f1b3), [CNX Software](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/) |
| 2024-05-02 | Backup OWNERS added for `android-mainline-riscv64` ([CL 3071902](https://android-review.googlesource.com/c/kernel/common/+/3071902)). | [commit 0a48cada](https://android.googlesource.com/kernel/common/+/0a48cadab08a39d018240c9ba95e9e6e650bc247) |
| 2024-08-22/26 | Bazel `kernel_riscv64` target restored after the "Unroll define_common_kernels()" refactor deleted it ([CL 3239487](https://android-review.googlesource.com/c/kernel/common/+/3239487), [CL 3240201](https://android-review.googlesource.com/c/kernel/common/+/3240201)). | [commit 788d09f0](https://android.googlesource.com/kernel/common/+/788d09f062f0aec5af3988ee1868ddd9e13e9834) |
| 2024-11-28 | Options to run the riscv GKI as a Microdroid (AVF) guest, and a protected-modules list ([CL 3344579](https://android-review.googlesource.com/c/kernel/common/+/3344579), [CL 3381733](https://android-review.googlesource.com/c/kernel/common/+/3381733)). | [commit 595e0ae4](https://android.googlesource.com/kernel/common/+/595e0ae4095faed93d6cec1afa919e2b6ab73e30) |
| 2025-08-15 | Batch of `gki_defconfig` alignment changes (CLs 3729967 to 3730130). | [Gerrit CL 3729967](https://android-review.googlesource.com/c/kernel/common/+/3729967) |
| 2026-01-03/06 | Legacy `build.config.*` made an error stub. Kleaf `gki_*_protected_module_names` targets added. Build rules aligned (CLs 3904038 to 3904044). | [commit b827280d](https://android.googlesource.com/kernel/common/+/b827280de358a067ab4e3ef4b22b42955ef243ff) |
| 2026-03-02 | Crypto library KUnit tests enabled. | [commit 3e5773dd](https://android.googlesource.com/kernel/common/+/3e5773ddf373665d10f8e2e372df20669c2c7783) |
| 2026-06-03/12 | Config aligned with the arm64/x86 virtual-device config. BBR, `crc_kunit` and more crypto KUnit tests enabled. These are the latest riscv config commits seen. | [commit 00b658c2](https://android.googlesource.com/kernel/common/+/00b658c23f3db63e6b4451c98c221298c5c735ac) |
| 2026-10-20 | RISE announces Android 17 on RVA23 (project RP024). It uses a downstream `android-mainline` kernel fork, not the GKI branch. | [RISE blog](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/) |

Key contributors (organisation as stated in the findings):
- Prashanth Swaminathan (Google): author of almost all recent riscv GKI commits and the branch owner.
- Matthias Maennich (maennich@google.com): author of the removal commit.
- Sami Tolvanen: drove KCFI, SCS and KASLR; organisation not stated in the findings.
- Alistair Delva: first riscv GKI commit; organisation not stated in the findings.
- Samuel Holland, Andre Draszik, Hong Yifan and Gurjant Kalsi also appear; organisations not stated.
- Alex Ghiti (Rivos): authored the upstream KASLR series for Linux riscv.

Commit counts differ by method:
- One tally counts about 68 "ANDROID: ... riscv/RISC-V" commits since 2022.
- A Gerrit tally counts 79 merged changes from 2022-12 to 2026-06.
- A third tally counts 36 "ANDROID: riscv: ..." commits by Prashanth Swaminathan plus 2 by Andre Draszik, within a window that started in April 2025.
- These are different selection criteria, not a conflict.

Upstream status:
- The kernel features (KASLR, CFI, SCS, `RELOCATABLE`, SMP infrastructure) are upstream Linux.
- The riscv GKI itself is not upstream and is not in any release branch. It is Google-maintained on a side branch, in practice by one engineer.
- The origin of the upstream RISC-V Linux port: Data not available. The one date offered was unverified recall and is not used.

## 3. Upstream Support Tier

No formal tier policy is published. The ACK page describes branch phases (development, stabilization, KMI-frozen). It lists ACK branches from android12-5.10 to android17-6.18, plus `android-mainline` as the primary development branch. KMI stability is promised per LTS branch. The 5.10 branches are not supported from Android 17 QPR1 on.

Evidence for riscv64:
- The riscv64 target has no `tests_zip`.
- It has no KMI or ABI baseline.
- It is outside the README's patch-must-not-break architecture list.
- It lives on a separate branch with a single listed reviewer.
- No Android release ships a supported riscv64 GKI.
- Google said it is "not ready to provide a single supported image for all vendors" ([CNX Software](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/)).

| Aspect | amd64 (x86_64) | arm64 | riscv64 |
|---|---|---|---|
| GKI target in release branches | `kernel_x86_64` | `kernel_aarch64` (plus `kernel_aarch64_16k`) | None. `kernel_riscv64` exists only on `android-mainline-riscv64`. |
| README must-not-break rule | Yes | Yes | No |
| KMI enforced (`kmi_enforced`) | Yes on release branches. `gki/x86_64/abi.stg` seen on `android17-6.18`. | Yes on release branches. `gki/aarch64/abi.stg` seen on `android16-6.12` and `android17-6.18`. | No. No `gki/riscv64/`, no symbol list, no `abi.stg`. |
| KMI on `android-mainline` | Commented out ("Not enforced in android-mainline") | Commented out | Not applicable |
| `tests_zip` distribution | Configured | Configured | Not configured. `extra_dist` is `test_mappings_zip` only. |
| `gki_defconfig` | Yes | Yes | Only on the side branch (701 lines, arm64-derived) |
| Microdroid kernel | Not stated | Enforced on `android16-6.12` and `android17-6.18` | Microdroid guest options exist (CL 3344579); no microdroid KMI |

Real-world release use (whether any shipped device uses a riscv64 GKI): Data not available. The documentation pages ([gki-versioning](https://source.android.com/docs/core/architecture/kernel/gki-versioning), GKI) do not mention riscv64.

## 4. Technical Architecture and RISC-V-Specific Subsystems

GKI has no JIT, SIMD dispatch or GC barriers of its own. The riscv-relevant components are the kernel configuration, the build rules and the Android-specific kernel features. The riscv64 branch differs from `android-mainline` by 7 files (+859/-28 lines) per one read. Nothing under `arch/` differs except the new `gki_defconfig`.

| Component | riscv64 implementation | Notes and quality |
|---|---|---|
| `arch/riscv/configs/gki_defconfig` | Exists, 701 lines | Derived from arm64. Leftovers: `CONFIG_ARCH_SUNXI=y` and the cmdline `kvm-arm.mode=protected ioremap_guard`. The only riscv-specific option found is `RISCV_EFFICIENT_UNALIGNED_ACCESS`. |
| CFI | Enabled (`CFI`, renamed from `CFI_CLANG` by CL 3904042) | Kernel CFI is upstream since v6.6. Software only. |
| Shadow call stack | Enabled | Upstream since v6.7. Software only. Requires Clang 17. |
| KASLR | Enabled | Upstream since v6.6. |
| Hardware CFI and shadow stack | Not enabled; issues #14 and #15 exist | Status not captured. |
| KVM and protected VMs | `KVM` enabled; Microdroid guest options enabled | `kvm-arm.mode=protected` is an arm64 pKVM option. Protected-VM mode is not wired up for RISC-V. |
| Android drivers (ashmem, binder, binderfs, incremental-fs, vendor hooks, SELinux) | Enabled in `gki_defconfig` | Configuration only. Driver code is shared across architectures. |
| Crypto assembly | Upstream Linux `.S` files. 68 `.S` files under `arch/riscv`, including the Zvk files in `arch/riscv/crypto/`, plus six under `lib/crypto/riscv/` and one under `lib/raid/xor/riscv/`. | No Android-specific `.S`. Crypto optimisation tracked by open issue [#53](https://github.com/google/android-riscv64/issues/53). Which extensions the kernel enables is not captured. |
| BPF JIT | Upstream `arch/riscv` | No Android change seen. |
| Rust | `gki_defconfig` has no `CONFIG_RUST` | Kleaf defines a `riscv64-linux-android` Rust toolchain, exec platform x86_64 only. |
| GKI module list | `_RISCV64_GKI_MODULES_LIST` contains only `pwrseq-core.ko`. `virtual_device_riscv64` adds `nd_virtio.ko` and `virtio_pmem.ko`. | Minimal compared with a full GKI module set. |

Per-component arch comparison: Data not available. Only riscv64 was examined for the assembly and JIT components, so no amd64 versus arm64 versus riscv64 table is given for them. The GKI-level comparison is in Section 3.

## 5. Build System, Cross-Compilation, and Toolchain

- **Build system.** GKI is built with Kleaf (Bazel) from a `repo` checkout. There is no cmake or configure step. The `kernel/manifest` branch [common-android-mainline-riscv64](https://android.googlesource.com/kernel/manifest/+/refs/heads/common-android-mainline-riscv64) pins `kernel/common` and `common-modules/virtual-device`, both on `android-mainline-riscv64`. Its last commit is 2026-05-27, by Prashanth Swaminathan.
- **Targets.** `BUILD.bazel` defines `kernel_riscv64` as a `common_kernel` with `arch = "riscv64"`, `build_gki_artifacts = True` and defconfig `arch/riscv/configs/gki_defconfig`. Goals are Image, Image.lz4, Image.gz, Image.lzma, Image.zst and modules. A virtual-device variant, `kernel_virt_riscv64`, is also referenced by `download_from_ci`. The branch also defines `all_headers_riscv64` and `gki_system_dlkm_modules_riscv64`.
- **Exact build commands.** Data not available: the exact `bazel` invocation was not captured. The research found a bazelrc config `--config=android_riscv64`. No riscv64 section exists in any build guide read. The [building-kernels page](https://source.android.com/setup/build/building-kernels) was not checked for riscv.
- **Legacy flow.** `build.config.gki.riscv64` and `build.config.riscv64` are stubs that print an error and exit 1, because the legacy build.config flow is no longer used ([commit b827280d](https://android.googlesource.com/kernel/common/+/b827280de358a067ab4e3ef4b22b42955ef243ff)).
- **Kleaf riscv64 support** (`kernel/build`, `main-kernel`, 2026-10-20):
  - `arch = "riscv64"` is accepted in `kernel_build`.
  - `riscv64` maps to SRCARCH `riscv`.
  - `gki_artifacts.bzl` accepts `riscv64`.
  - `build_utils.sh` builds the boot image from `Image`.
  - riscv64 platform and toolchain constraints exist.
  - Remaining TODOs are `TODO(b/228238975): Add tests for riscv` and a gcov/CFI note (b/264407394).
  - It is a cross-build from x86_64 only. No riscv64-host Kleaf build was found.
- **Toolchain.** Kleaf uses AOSP's prebuilt x86_64 clang. Kernel minimum LLVM for riscv is 17.0.1, and SCS needs Clang 17 ([lkml SCS series](https://lkml.rescloud.iu.edu/2309.3/04662.html)). Clang is required because CFI and SCS are Clang features. Rust minimum versions (rustc 1.85.0, bindgen 0.71.1) are met by Ubuntu 26.04 riscv64, but Rust is not enabled in `gki_defconfig`.
- **Known toolchain-sensitive failure.** [android-riscv64 #157](https://github.com/google/android-riscv64/issues/157): `common-android-mainline-riscv64` (6.12) panicked with an illegal instruction in `percpu_ref_put` on Cuttlefish. Switching clang from r536225 to r510928 avoided it. A Google collaborator said they only support AOSP main. The root cause is not established [NEEDS VERIFICATION].
- **QEMU and test targets.** `gki/download_from_ci` pulls `kernel_virt_riscv64` and `kernel_riscv64` (system_dlkm) from CI branch `aosp_kernel-common-android-mainline-riscv64` into `device/google/cuttlefish_prebuilts/kernel/mainline-riscv64`. The same script fetches `u-boot_qemu_riscv64`. Kleaf's own tests carry the riscv TODO above.
- **Cuttlefish prebuilt.** The `mainline-riscv64` prebuilt in the checked tree is a stale 6.8.0-mainline build, while `download_from_ci` can fetch a newer one. Which is current in a given Android release is unresolved. `vsoc_riscv64/BoardConfig.mk` sets `ALLOW_MISSING_DEPENDENCIES := true` with the comment "Temporary hack while prebuilt modules are missing riscv64".

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Release-branch GKI | Yes | Yes | No |
| KMI symbol lists and STG baseline | Yes | Yes | No |
| `kmi_enforced` | Yes (release branches) | Yes (release branches) | No |
| tests_zip | Yes | Yes | No |
| CFI, SCS, KASLR | Not captured | Not captured | Yes (software) |
| SMP | Not captured | Not captured | Yes (since 2023-03) |
| Protected VM (pKVM) | Not applicable | `kvm-arm.mode=protected` in defconfig | Not wired up; option is an arm64 leftover |
| Microdroid guest | Not captured | Yes | Config options enabled (2024-11) |
| Rust in `gki_defconfig` | Not captured | Not captured | No |
| Hardware breakpoints | Not captured | Not captured | Missing ([#75](https://github.com/google/android-riscv64/issues/75)) |
| Optimised crypto | Not captured | Not captured | Open ([#53](https://github.com/google/android-riscv64/issues/53)) |
| PTP module | Not captured | Not captured | Disabled for riscv (CL 3903749) |

Functional gaps:
- There is no KMI. Vendor modules built against a riscv64 kernel have no ABI guarantee.
- There is no release-branch GKI, so no riscv64 kernel can be tied to an Android release.
- Kleaf has no riscv tests.
- `ARCH_SUNXI` and `kvm-arm.mode=protected` should not be in a RISC-V defconfig.
- KASAN was "temporarily disabled" in 2023 (CL 2443660). Whether it was re-enabled was not captured.

Performance gaps: Data not available. No benchmark of GKI or the riscv64 kernel was found. Searches were not run because the search budget was exhausted. No numbers are given.

Security hardening gaps:
- Software CFI, SCS and KASLR are enabled.
- Hardware shadow stack and landing pad are tracked as separate issues (#14, #15), with status not captured.
- A protected-modules list exists (CL 3381733). The Kleaf `gki_*_protected_module_names` targets carry the comment "Not enforced in android-mainline".
- A symbol-protection header script was added and then reverted on 2026-06-03 (CL 4102015).

NaN and floating-point semantics: Data not available. This is not applicable to a kernel configuration project and was not searched.

## 7. CI/CD Infrastructure

- **In-tree CI.** None for riscv64. The only CI-like files are generic `TEST_MAPPING` files. `drivers/gpu/drm/ci/gitlab-ci.yml` is upstream DRM CI and unrelated.
- **ci.android.com.** Kleaf's `download_from_ci` references CI branch `aosp_kernel-common-android-mainline-riscv64`, so a build step is evidenced. The [ci.android.com grid](https://ci.android.com/builds/branches/aosp_kernel-common-android-mainline-riscv64/grid) renders only "Branch Grid" without JavaScript. Build and test status is unverified. "Build-only" is inferred, not observed.
- **Test configuration.** `kernel_riscv64` has `extra_dist = [":test_mappings_zip"]` and no `tests_zip`. KUnit modules are listed for riscv64 and crypto KUnit tests are enabled. No evidence of them running was found.
- **RISE runners and hardware.** No runner-based GKI or KMI build was found. The [RISE RISC-V runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) support Python wheels and PyTorch CI. RP024 Phase 2 plans CI and testing for the Android 17 BSP on the RISE Board Farm, starting with the Alibaba A210. That covers the downstream fork, not GKI.
- **lore.kernel.org.** The search did not run (403 on fetch).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ci.android.com branch evidenced | Not captured | Not captured | Yes, referenced by `download_from_ci` (status unverified) |
| tests_zip configured | Yes | Yes | No |
| ABI/KMI check | Yes (release branches) | Yes (release branches) | No |
| Hardware | Not captured | Not captured | Virtual (Cuttlefish, QEMU). Board Farm for the RISE Android 17 fork only. |

## 8. Distribution and Release Status

- GKI/KMI is a set of kernel branches and tags on android.googlesource.com, not a packaged artifact. Release tags seen: `android15-6.6-2026-04_r32`, `android16-6.12-2026-06_r36` and `-2026-09_r8`, `android17-6.18-2026-06_r68` and `-2026-09_r9`, and `android-mainline-7.3`. None is riscv64.
- There is no PyPI package: `https://pypi.org/pypi/gki/kmi/json` returned HTTP 404, and the RISE wheel builder redirected to a PyPI 404. There is no RISE wheel.
- The Ubuntu 26.04 `packages.ubuntu.com` lookup failed (HTTP 500). Package presence is not verified. A package is almost certainly absent because GKI/KMI is a policy, not a package. The queried names are not valid package names.
- The only riscv64 kernel binaries seen are Cuttlefish prebuilts under `device/google/cuttlefish_prebuilts/kernel/mainline-riscv64`, fetched from CI.
- First Android release with riscv64: Cuttlefish `aosp_cf_riscv64_{phone,slim,wear,minidroid}` and `vsoc_riscv64` are present in `device/google/cuttlefish` at `android-14.0.0_r1`, `android-15.0.0_r1` and `android-16.0.0_r1`, and absent at `android-13.0.0_r1`. Android 14 is therefore the first release carrying riscv64 products, and it is a virtual device only. The products are not in `COMMON_LUNCH_CHOICES` on `android14-release`.
- A Google quote in the [RISE RP004 post](https://riseproject.dev/2025/04/15/project-rp004-support-for-a-64-bit-risc-v-linux-port-of-rust-to-tier-1/) says "Android has added support for RISC-V as a target as of Android 15". The Cuttlefish tag check supports Android 14 for the virtual-device products. The two are not necessarily in conflict, since one concerns the target and the other the Cuttlefish product. [NEEDS VERIFICATION]
- The [google/android-riscv64](https://github.com/google/android-riscv64) README (as of 2025Q2) says Cuttlefish runs ART and boots to the home screen, and that the NDK riscv64 ABI is not finalised.
- To get a working binary, a user must run `repo sync` against the `common-android-mainline-riscv64` manifest and build `kernel_riscv64` with Kleaf. Alternatively, they fetch the Cuttlefish prebuilt. Exact steps are in Section 5, with commands not captured. For a vendor board there is no Google-supported path. RISE's Android 17 release uses its own fork (see Section 13).

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | runtime-dependency (critical). Provides `arch/riscv`. | Builds via `kernel_riscv64` (Image and modules). Upstream riscv code. | KUnit modules listed; Cuttlefish boot. CI result unverified. | No release-branch GKI; only `android-mainline-riscv64`. | Upstream Linux with Android-specific patches. No `linux-kernel.md` report in this repository yet. |
| LLVM | build-dependency (critical). Compiler and linker for CFI and SCS. | Builds. Kernel minimum is 17.0.1 for riscv. Kleaf uses AOSP's prebuilt x86_64 clang. | Not run. | Ubuntu 26.04 riscv64 has clang 21 and 22. | See [llvm report](project-reports/llvm.md). |
| Bazel | build-dependency (critical). Build driver for Kleaf. | Cross-build from x86_64 host only. | Not applicable. | Ubuntu 26.04 riscv64 has `bazel-bootstrap` 4.2.3. Unversioned `bazel` and `bazelisk` not found. Ubuntu's 4.2.3 is likely too old for Kleaf (inference) [NEEDS VERIFICATION]. | No Bazel report in this repository yet. |
| Kleaf | build-dependency (critical). `kernel/build` rules defining GKI, KMI and ABI. | Accepts `arch = "riscv64"`, has platform and toolchain constraints. No riscv64-host build. | Kleaf riscv tests are a TODO (b/228238975). | In-tree in AOSP only. | Google-maintained, in AOSP `kernel/build`. |
| libabigail | build-dependency (optional). Legacy ABI diff tool. | Ubuntu `abigail-tools` 2.9-3 found for riscv64. | Not run. | Ubuntu package available. | Unused for riscv64 because no ABI baseline exists. No report yet. |
| STG | build-dependency (optional). Current ABI tool defining `abi.stg`. | Unverified. Ships in AOSP kernel-build-tools prebuilts. | Unverified. | Not a distro package; `stg` not found in Ubuntu. | The riscv64 KMI blocker is the missing baseline, not the tool. |
| Cuttlefish | test-dependency (optional). Reference virtual device (`vsoc_riscv64`). | `vsoc_riscv64` exists since Android 14. | Boots the `mainline-riscv64` kernel; CI result unverified. | AOSP only. `cuttlefish-base` and `crosvm` not found in Ubuntu. | See [crosvm report](project-reports/crosvm.md). No Cuttlefish report yet. |
| Rust (rustc, cargo, bindgen) | Optional Rust-for-Linux. | Ubuntu 26.04 riscv64 has rustc/cargo 1.93.1 and bindgen 0.72.1. | Not run. | Ubuntu packages available. | `gki_defconfig` has no `CONFIG_RUST`. See [rust report](project-reports/rust.md). |
| pahole (dwarves), dtc | BTF generation; device tree build (Kleaf uses `rules_devicetree`). | Ubuntu pahole/dwarves 1.31-2ubuntu1 and device-tree-compiler 1.7.2-2ubuntu1 available. | Not run. | Ubuntu packages available. | No blockers. |
| Python 3, mkbootimg, avbtool | Build scripts; `boot.img` packing; image signing (Kleaf ships a test key). | Pure Python, arch-independent. Ubuntu python3 3.14.3 and mkbootimg 1:34.0.5 found. | Not run. | `avbtool` and `libavb` not found as separate Ubuntu packages. | See [python report](project-reports/python.md) and [android-verified-boot report](project-reports/android-verified-boot.md). |
| OpenSSL, elfutils, zstd, lz4 | Module signing; objtool and BTF host tools; `Image.zst` and `Image.lz4` outputs. | Ubuntu 26.04 riscv64 packages found. | Not run. | Ubuntu packages available. | See [openssl](project-reports/openssl.md), [elfutils](project-reports/elfutils.md), [zstd](project-reports/zstd.md), [lz4](project-reports/lz4.md) reports. |
| GCC, binutils, make, bison, flex, bc, cpio, kmod | Host build toolchain. | Ubuntu 26.04 riscv64 packages found. | Not run. | Ubuntu packages available. | See [gcc report](project-reports/gcc.md). |
| QEMU and U-Boot | Boot and test on virt. Kleaf CI fetches `u-boot_qemu_riscv64`. | Ubuntu `qemu-system-misc` 1:10.2.1 and `u-boot-qemu` 2025.10 available. | Not run. | Ubuntu packages available. | See [qemu](project-reports/qemu.md) and [u-boot](project-reports/u-boot.md) reports. |

The package-presence data comes from the Ubuntu 26.04 (`resolute`) riscv64 `Packages.gz` indexes. It does not come from the project-graph database, which was unavailable. A "not found" for a guessed package name does not prove no package exists.

Deep-dive (critical dependencies):
- **Linux kernel.** Upstream riscv code provides CFI (v6.6), SCS (v6.7) and KASLR (v6.6). The riscv GKI depends on mainline tracking: the side branch is an auto-merge of `android-mainline`, so it inherits mainline riscv regressions with no release-branch stabilisation.
- **LLVM.** SCS and CFI make the Clang version a functional dependency. Issue #157 shows a toolchain-version-sensitive kernel panic on Cuttlefish [NEEDS VERIFICATION, single source].
- **Kleaf and Bazel.** Kleaf is riscv64-aware but cross-build only. The Rust toolchain's exec platform is x86_64 only. A riscv64-native build host is therefore not supported.
- **Cuttlefish.** It depends on crosvm and U-Boot (`u-boot_qemu_riscv64`) for the QEMU path. The `mainline-riscv64` prebuilt kernel is the boot kernel, not a versioned GKI.

## 11. Known Bugs and Active Issues

Section 10 is omitted: GKI/KMI has no dependent package ecosystem that must be enabled on riscv64.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [android-riscv64 #157](https://github.com/google/android-riscv64/issues/157) | android15-qpr1-release run cuttlefish encounter panic issue | Closed 2025-02-24 | High (boot panic) | 6.12 `common-android-mainline-riscv64` illegal instruction in `percpu_ref_put`. Clang r510928 avoided it. Google said it supports only AOSP main. |
| [#116](https://github.com/google/android-riscv64/issues/116) | Fail to boot riscv64 cuttlefish | Closed 2024-11-12 | High | Details not captured. |
| [#118](https://github.com/google/android-riscv64/issues/118) | kernel: can't distinguish read vs write for faults? | Open (2023-11-02) | Medium | Fault read/write ambiguity. |
| [#75](https://github.com/google/android-riscv64/issues/75) | kernel: missing hardware breakpoint support | Open (2023-03-15) | Medium | Debugging gap. |
| [#53](https://github.com/google/android-riscv64/issues/53) | kernel: crypto optimization | Open (2023-02-07) | Medium | Optimised crypto for the riscv kernel. |
| [#70](https://github.com/google/android-riscv64/issues/70) | CTS test to ensure that core features are homogenous | Open | Medium | Status of the CTS test not captured. |
| [#64](https://github.com/google/android-riscv64/issues/64) | Crash with RISC-V scalable vectorization and KASAN | Closed 2024-04-05 | Medium | Tracked in llvm/llvm-project#61096. |
| [#10](https://github.com/google/android-riscv64/issues/10) | bazel: microdroid will need bazel support for riscv64 | Closed 2024-11-15 | Low | Kleaf/Bazel support. |
| [#56](https://github.com/google/android-riscv64/issues/56), [#55](https://github.com/google/android-riscv64/issues/55), [#54](https://github.com/google/android-riscv64/issues/54), [#79](https://github.com/google/android-riscv64/issues/79), #27 | Software CFI, software SCS, ASLR, SMP, unaligned access | All closed | Resolved | Enabled between 2023 and 2024. |
| #14, #15 | Hardware shadow stack and landing pad / hardware CFI | Status not captured | Not captured | Open or closed state unknown. |

Correctness and configuration defects:
- #157 is the one runtime correctness bug found.
- The `gki_defconfig` carries arm64 leftovers (`ARCH_SUNXI`, `kvm-arm.mode=protected ioremap_guard`). That is a configuration defect, and it shows the file is not tuned for RISC-V.
- `CONFIG_TLS=m` was added (CL 3474289, 2025-02-03) and reverted twice (CL 3940735, CL 3941454, both 2026-02-05). The reason is not in the findings.
- CL 2618134 (32_PCREL relocation support in modules) was reverted in 2024-01 (CL 2900780). The reason is not in the findings.

The issue tracker has 60 issues. Only the ones above were read. The tracker has no pinned roadmap issue, and no GKI/KMI-specific issue was found. The `kernel-and-virtualization-wg` tracker returned no GKI/KMI/android hits. Bug and performance searches did not run because the search budget was exhausted.

## 12. Objections and Upstream Blockers

Stated objections:
- The removal commit says "Support for risc64 GKI kernels is discontinued" ([commit 9cf3c312](https://android.googlesource.com/kernel/common/+/9cf3c3120558c10b8ed7a1d735809713fc22f97b)).
- A Google spokesperson said Google was "not ready to provide a single supported image for all vendors" ([CNX Software](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/)). Press coverage: [Android Authority](https://www.androidauthority.com/android-drop-risc-v-kernel-3438330/), [The Register](https://www.theregister.com/2024/05/01/riscv_support_android_pulled/), [Hackster.io](https://www.hackster.io/news/google-removes-risc-v-support-from-the-android-common-kernel-but-denies-abandoning-the-isa-c4ccab33a929).
- The reversal reason is not in the revert commit text.

Technical blockers:
- No KMI baseline (symbol list, `abi.stg`, `kmi_enforced`) exists for riscv64.
- The defconfig is arm64-derived, and the GKI module list is nearly empty.
- There is no `tests_zip` and no riscv Kleaf tests.
- The ISA is not fragmented in the findings, but Google's "single supported image for all vendors" objection implies that RISC-V platform variability is the concern. This inference is not documented in a primary source [NEEDS VERIFICATION].

Organisational blockers:
- Ownership is a single listed reviewer, with almost all recent commits from one author.
- There is no formal roadmap or pinned issue.
- The README requires out-of-tree patches to be coordinated with kernel-team@android.com, and no new-architecture policy is published.
- Every Gerrit CL behind the commits is Google-internal, and the `Original CL: aosp/...` numbers are not browsable.

Acceptance probability: no data exists. On this evidence, a KMI-enforced riscv64 GKI on a release branch requires a Google decision. RISE has no GKI work in progress. The assessment is that acceptance without Google sponsorship is low. This is an inference, not a measured figure.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** none

Justification: Google's own AOSP branch [android-mainline-riscv64](https://android.googlesource.com/kernel/common/+/refs/heads/android-mainline-riscv64) has a Kleaf `kernel_riscv64` target and a 701-line riscv `gki_defconfig`. Kleaf's `download_from_ci` pulls its artifacts from the ci.android.com branch `aosp_kernel-common-android-mainline-riscv64`, so a build step is evidenced. The target has no tests_zip, only generic TEST_MAPPING files, and no KMI symbol list or ABI baseline, so there is no test-passing evidence. The release GKI branches (android15-6.6, android16-6.12, android17-6.18) carry no riscv64 GKI, and no Android release ships a supported riscv64 GKI. The build-only reading is inferred, because the ci.android.com grid could not be read. Google removed riscv64 from the ACK in 2024-04 and reverted the removal on 2024-05-01.

Pending work that could change the grade:
- There is no RISE work on GKI/KMI itself.
- RISE's Android 17 on RVA23 (RP024) uses a downstream android-mainline fork (`riseproject-dev/android_kernel_common`) for the SpacemiT K3 and Alibaba A210, with Phase 2 CI and testing planned ([RISE blog](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)). Its default branch is `android-mainline-spacemit` and the other is `android-mainline-alibaba`. It tracks `android-mainline` plus board patches, not the release branches, and its `build.config.gki.riscv64` is the inherited error stub.
- Upgrading the grade needs ci.android.com build and test results for `kernel_riscv64`, riscv KMI/ABI baselines, or riscv64 on a release GKI branch.
- The ci.android.com status is unverified, and the lore.kernel.org search did not run.

## 14. Investment Analysis

RISE check before sizing:
- RP024 (Android 17 on RVA23) is the only RISE-funded item tied to Android. It covers the downstream BSP for two boards, BayLibre engineering, and Phase 2 CI/testing for that BSP. Follow-up RFPs cover Bionic, BoringSSL, ART, V8, Chrome and multimedia libraries.
- RISE has no funded GKI/KMI work. The work below is therefore not already covered, except where noted.
- Effort figures below are planning estimates, not measured. Owner assignments are proposals.

### 14.1 Functional Enablement

- **Build and boot verification.** Build `kernel_riscv64` from `android-mainline-riscv64` and boot it on Cuttlefish and on RVA23 hardware, to establish a verified baseline that does not depend on the unreadable ci.android.com grid.
- **Defconfig cleanup.** Remove the arm64 leftovers (`ARCH_SUNXI`, `kvm-arm.mode=protected ioremap_guard`). These patches must be coordinated with kernel-team@android.com per the README.
- **KMI baseline.** Create riscv64 symbol lists and an `abi.stg` baseline, and enable `kmi_enforced`. This needs a Google decision and, ideally, a release-branch home.
- **Vendor modules and hooks for our SoC.** Chip-specific work, outside the generic GKI.
- **Protected VM on RISC-V.** The riscv GKI has no pKVM equivalent. Scope is not sized here because the findings contain no data on the riscv hypervisor-protection design. See the pKVM report for that topic.

### 14.2 Performance Optimization

No benchmarks exist, so no gap can be sized. Candidate items from open issues: crypto optimisation ([#53](https://github.com/google/android-riscv64/issues/53)), hardware breakpoints ([#75](https://github.com/google/android-riscv64/issues/75)), and hardware CFI/shadow stack (#14, #15, status unknown). First step: establish a baseline benchmark set.

### 14.3 CI/CD Infrastructure

- Confirm what ci.android.com builds and tests for `aosp_kernel-common-android-mainline-riscv64`.
- Add a `tests_zip` distribution to `kernel_riscv64` and run KUnit and Cuttlefish smoke tests.
- Mirror the build on the RISE Board Farm or runners. RP024 Phase 2 covers the Android 17 BSP only, not the GKI branch.

### 14.4 Ecosystem Enablement

Not applicable. GKI/KMI has no dependent package ecosystem, and Section 10 is omitted. Related Android userspace work (Bionic, ART, BoringSSL, V8) is covered by the RISE RFPs above.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify `kernel_riscv64` build and Cuttlefish boot from `android-mainline-riscv64` | 2-3 | Chip vendor kernel team | Critical |
| Functional | Remove arm64 leftovers from the riscv `gki_defconfig` (upstream via AOSP Gerrit) | 1-2 | Chip vendor with Google review | High |
| Functional | Riscv64 KMI baseline (symbol lists, `abi.stg`, `kmi_enforced`), requires Google sponsorship | 12-20, plus Google time | Google plus chip vendor | High |
| Functional | Vendor modules and hooks for our SoC | 4-8 per SoC (estimate) | Chip vendor | Medium |
| Performance | Baseline benchmark set for the riscv64 GKI kernel | 2-3 | Chip vendor | Medium |
| Performance | Crypto optimisation and hardware breakpoints (#53, #75) | 4-6 | Chip vendor with RISE | Low |
| CI/CD | Confirm ci.android.com build/test status for `kernel_riscv64` | 1 | Chip vendor with Google | Critical |
| CI/CD | `tests_zip` plus KUnit and Cuttlefish smoke tests for `kernel_riscv64` | 4-6 | Google plus chip vendor | High |
| CI/CD | Mirror the build on RISE Board Farm or runners | 3-4 | RISE | Medium |
| Ecosystem | Not applicable | 0 | Not applicable | Not applicable |

## 15. References

- [kernel/common, branch android-mainline-riscv64](https://android.googlesource.com/kernel/common/+/refs/heads/android-mainline-riscv64)
- [kernel/common main page](https://android.googlesource.com/kernel/common)
- [kernel/common README](https://android.googlesource.com/kernel/common/+/refs/heads/android-mainline/README.md)
- [kernel/common android-mainline BUILD.bazel](https://android.googlesource.com/kernel/common/+/refs/heads/android-mainline/BUILD.bazel)
- [kernel/common android-mainline MAINTAINERS](https://android.googlesource.com/kernel/common/+/refs/heads/android-mainline/MAINTAINERS)
- [kernel/common android-mainline arch/riscv/configs](https://android.googlesource.com/kernel/common/+/refs/heads/android-mainline/arch/riscv/configs/)
- [kernel/common build.config.gki.riscv64 (6cf2e7d9)](https://android.googlesource.com/kernel/common/+/6cf2e7d96862514989335c26cea126b6e65d43e2/build.config.gki.riscv64)
- [kernel/build, branch main-kernel](https://android.googlesource.com/kernel/build/+/refs/heads/main-kernel)
- [kernel/manifest, branch common-android-mainline-riscv64](https://android.googlesource.com/kernel/manifest/+/refs/heads/common-android-mainline-riscv64)
- [Commit d0da01fd, Add 64-bit RISC-V config](https://android.googlesource.com/kernel/common/+/d0da01fd61ec24fae56f1fa8379425855618d7e9)
- [Commit ec0b9c28, Enable CONFIG_CFI_CLANG for RISC-V](https://android.googlesource.com/kernel/common/+/ec0b9c28afb08aea9e7102525a45a9990279cd51)
- [Commit 9cf3c312, Remove ACK's support for riscv64](https://android.googlesource.com/kernel/common/+/9cf3c3120558c10b8ed7a1d735809713fc22f97b)
- [Commit 40bf40a0, Revert of the removal](https://android.googlesource.com/kernel/common/+/40bf40a0d7fca59f83fdbd9d329319db3592f1b3)
- [Commit 0a48cada, backup OWNERS](https://android.googlesource.com/kernel/common/+/0a48cadab08a39d018240c9ba95e9e6e650bc247)
- [Commit 788d09f0, add back kernel_riscv64](https://android.googlesource.com/kernel/common/+/788d09f062f0aec5af3988ee1868ddd9e13e9834)
- [Commit 595e0ae4, Microdroid guest options](https://android.googlesource.com/kernel/common/+/595e0ae4095faed93d6cec1afa919e2b6ab73e30)
- [Commit b827280d, make most build configs an error](https://android.googlesource.com/kernel/common/+/b827280de358a067ab4e3ef4b22b42955ef243ff)
- [Commit 3e5773dd, crypto library KUnit tests](https://android.googlesource.com/kernel/common/+/3e5773ddf373665d10f8e2e372df20669c2c7783)
- [Commit 00b658c2, align configs for virtual device](https://android.googlesource.com/kernel/common/+/00b658c23f3db63e6b4451c98c221298c5c735ac)
- [Gerrit CL 2310710](https://android-review.googlesource.com/c/kernel/common/+/2310710), [CL 2498717](https://android-review.googlesource.com/c/kernel/common/+/2498717), [CL 2635913](https://android-review.googlesource.com/c/kernel/common/+/2635913), [CL 2812953](https://android-review.googlesource.com/c/kernel/common/+/2812953), [CL 2912646](https://android-review.googlesource.com/c/kernel/common/+/2912646), [CL 3061966](https://android-review.googlesource.com/c/kernel/common/+/3061966), [CL 3061965](https://android-review.googlesource.com/c/kernel/common/+/3061965), [CL 3070126](https://android-review.googlesource.com/c/kernel/common/+/3070126), [CL 3071902](https://android-review.googlesource.com/c/kernel/common/+/3071902), [CL 3239487](https://android-review.googlesource.com/c/kernel/common/+/3239487), [CL 3240201](https://android-review.googlesource.com/c/kernel/common/+/3240201), [CL 3344579](https://android-review.googlesource.com/c/kernel/common/+/3344579), [CL 3381733](https://android-review.googlesource.com/c/kernel/common/+/3381733), [CL 3729967](https://android-review.googlesource.com/c/kernel/common/+/3729967)
- [ci.android.com branch grid, aosp_kernel-common-android-mainline-riscv64](https://ci.android.com/builds/branches/aosp_kernel-common-android-mainline-riscv64/grid)
- [GKI documentation](https://source.android.com/docs/core/architecture/kernel/generic-kernel-image)
- [ACK documentation](https://source.android.com/docs/core/architecture/kernel/android-common)
- [GKI versioning](https://source.android.com/docs/core/architecture/kernel/gki-versioning)
- [Building kernels](https://source.android.com/setup/build/building-kernels)
- [google/android-riscv64](https://github.com/google/android-riscv64), issues [#79](https://github.com/google/android-riscv64/issues/79), [#56](https://github.com/google/android-riscv64/issues/56), [#55](https://github.com/google/android-riscv64/issues/55), [#54](https://github.com/google/android-riscv64/issues/54), [#53](https://github.com/google/android-riscv64/issues/53), [#75](https://github.com/google/android-riscv64/issues/75), [#118](https://github.com/google/android-riscv64/issues/118), [#157](https://github.com/google/android-riscv64/issues/157), [#116](https://github.com/google/android-riscv64/issues/116), [#64](https://github.com/google/android-riscv64/issues/64), [#70](https://github.com/google/android-riscv64/issues/70), [#10](https://github.com/google/android-riscv64/issues/10)
- [Google Open Source blog, Android and RISC-V (2023-10-30)](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html)
- [lkml, riscv: SCS support v4](https://lkml.rescloud.iu.edu/2309.3/04662.html)
- [Android Authority, 2024-04-29](https://www.androidauthority.com/android-drop-risc-v-kernel-3438330/)
- [The Register, 2024-05-01](https://www.theregister.com/2024/05/01/riscv_support_android_pulled/)
- [Hackster.io](https://www.hackster.io/news/google-removes-risc-v-support-from-the-android-common-kernel-but-denies-abandoning-the-isa-c4ccab33a929)
- [CNX Software, 2024-05-06](https://www.cnx-software.com/2024/05/06/android-no-longer-supports-risc-v/)
- [RISE: Android 17 available on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE RISC-V runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE members](https://riseproject.dev/members/)
- Repository reports: [llvm](project-reports/llvm.md), [rust](project-reports/rust.md), [python](project-reports/python.md), [android-verified-boot](project-reports/android-verified-boot.md), [crosvm](project-reports/crosvm.md), [openssl](project-reports/openssl.md), [elfutils](project-reports/elfutils.md), [zstd](project-reports/zstd.md), [lz4](project-reports/lz4.md), [gcc](project-reports/gcc.md), [qemu](project-reports/qemu.md), [u-boot](project-reports/u-boot.md)