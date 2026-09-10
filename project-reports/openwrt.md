---
title: OpenWRT
parent: Project Reports
color: yellow
dependencies:
  - name: musl
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: Mbed TLS
    relation: runtime-dependency
    criticality: optional
  - name: wolfSSL
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: GMP
    relation: runtime-dependency
    criticality: optional
  - name: GNU MPFR
    relation: runtime-dependency
    criticality: optional
  - name: Nettle
    relation: runtime-dependency
    criticality: optional
  - name: libunwind
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="openwrt" %}

# OpenWRT

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenWRT<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OpenWRT is a Linux-based embedded operating system / firmware distribution for network devices (routers, access points, embedded boards), built with a Makefile plus Kconfig (menuconfig) buildroot-style system. It is not a library or runtime; it is a full firmware buildroot that compiles a kernel, toolchain, and package set per hardware target.

**Governance:** OpenWRT is not an independent legal entity. It was formerly a member project of Software in the Public Interest (SPI), a US 501(c)(3), and left SPI around September 2020 to become fiscally sponsored by the Software Freedom Conservancy (SFC). Decision-making follows rules inherited from the 2018 LEDE/OpenWrt merger ([openwrt.org/rules](https://openwrt.org/rules)): there is no privileged core-developer group; "active members" (those who voted in the last 6 months, or the last 3 voters if fewer than 3 recent votes) hold voting rights. Simple decisions require a 2/3 majority of participating active members and greater than or equal to 50% approval of all active voters; rule changes require 75%/50%. Proposals go to the public dev mailing list with a stated deadline. The codebase is GPL-2.0; wiki content is CC-BY-SA 4.0.

**Corporate sponsors:** Commercial backing is loose and community-driven, not foundation-governed. The project describes itself as "entirely created by a team of volunteers: developers and maintainers, individuals and companies." The OpenWrt One router (launched Nov 2024, approximately $89) donates $10 per sale to OpenWrt's SFC fund but is built by a commercial hardware partner, not the project itself. No MAINTAINERS/OWNERS/CODEOWNERS file exists in the repo (confirmed 404), so there is no documented mapping of maintainers to corporate affiliation. Active top contributors sampled from commit history (Hauke Mehrtens, Christian Marangi, Piotr Dymacz, Nick Hainke, Zoltan Herpai, Tianling Shen) commit from personal/independent domains, not corporate ones.

**OpenWRT is not a RISE Project member.** Checked [riseproject.dev/members](https://riseproject.dev): OpenWRT appears in neither the Premier tier (Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) nor the General tier (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE).

**Community culture on new ports:** Consistent with the "no privileged core group" governance model, new architecture/board ports are accepted through ordinary patch submission and review on the dev mailing list and GitHub, not gated by a formal tiering or sponsorship process. A single motivated contributor with hardware in hand can carry an entire architecture port for years before it is judged mature enough for mainline merge (see Section 2).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-09-06 | First RISC-V-adjacent commit `c24d02d` ("toolchain/gdb: bump to 8.2" by Koen Vandeputte) - incidental, pulled in upstream GDB's RISC-V ELF target support as a side effect, not an actual board port | Commit search result |
| 2018-12-16 (author date) | First real RISC-V target authored: `a3469a9` "sifiveu: add new target for SiFive U-based boards" by Zoltan Herpai (wigyori@uid0.hu) | Commit search result |
| 2023-05-28 (committer date) | Same sifiveu commit actually merged to master - nearly 4.5 years after authoring, indicating the port lived out-of-tree/in a personal fork for years | Commit search result |
| 2023-02-13 to 2024-11-27 | PR [#12001](https://github.com/openwrt/openwrt/pull/12001) "riscv: Add basic support for RISC-V" (saeziae) - closed unmerged; author conceded duplication with #9980 and self-closed | [PR #12001](https://github.com/openwrt/openwrt/pull/12001) |
| 2023-10-13 | Release **23.05.0** - first stable release containing the sifiveu target | openwrt.org release notes |
| 2023-08-29 to 2024-04-14 | PR [#13372](https://github.com/openwrt/openwrt/pull/13372) "jh71x0: add new target for StarFive JH7100/7110 RISC-V SoC" (wigyori) - merged | [PR #13372](https://github.com/openwrt/openwrt/pull/13372) |
| 2025-02-06 | Release **24.10.0** - first stable release containing the starfive (StarFive) target | openwrt.org release notes |
| 2025-09-26 to 2025-10-01 | Issue [#20191](https://github.com/openwrt/openwrt/issues/20191) / PR [#20193](https://github.com/openwrt/openwrt/pull/20193) - libunwind missing for riscv64/i386, fixed and merged | [Issue #20191](https://github.com/openwrt/openwrt/issues/20191), [PR #20193](https://github.com/openwrt/openwrt/pull/20193) |
| 2025-04-13 | PR [#18094](https://github.com/openwrt/openwrt/pull/18094) "include: move generic riscv64 ISA to rv64gc" merged (commit `143569c2`) | [PR #18094](https://github.com/openwrt/openwrt/pull/18094) |
| 2026-03-03 | Release **25.12.0** - current stable, includes rv64gc ISA default and libunwind fix | openwrt.org release notes |
| 2026-02-10 | PR [#21974](https://github.com/openwrt/openwrt/pull/21974) "targets: add RISCV qemu target" opened as draft, still open | [PR #21974](https://github.com/openwrt/openwrt/pull/21974) |
| 2026-05-05 to present (active 2026-09-02) | PR [#23231](https://github.com/openwrt/openwrt/pull/23231) "spacemit: add support for the RISC-V64 SpacemiT K1 SoC" - open, active review, approved by peterwillcn, no hard blockers remaining | [PR #23231](https://github.com/openwrt/openwrt/pull/23231) |

**Key contributors:** Zoltan Herpai (wigyori@uid0.hu, personal domain) authored and carried the sifiveu port and reviewed the starfive port - the research found "OpenWrt's RISC-V support has been driven by one hobbyist-style maintainer rather than a corporate/vendor engineering team." No corporate affiliation is documented for this work.

**Is it fully upstream?** Partially. Three riscv64 targets are merged into master: `sifiveu` (SiFive FU540/FU740), `starfive` (StarFive JH7100/JH7110), `d1` (Allwinner D1/T-HEAD C906). Three more are pending as open PRs: `siflower/sf21` (T-HEAD C908, PRs [#19699](https://github.com/openwrt/openwrt/pull/19699), [#21069](https://github.com/openwrt/openwrt/pull/21069), [#21070](https://github.com/openwrt/openwrt/pull/21070)), `spacemit` K1 (PR [#23231](https://github.com/openwrt/openwrt/pull/23231), active), and a QEMU riscv64 target for CI (PR [#21974](https://github.com/openwrt/openwrt/pull/21974), draft). There is no single master tracking issue for "RISC-V support" - it arrived incrementally, target by target.

## 3. Upstream Support Tier

OpenWRT has no formal PLATFORMS.md, SUPPORT.md, or tiered-support policy document in the tree or wiki (`openwrt.org/support_status` and similar pages return 404/stub content). Support status is effectively binary per the Table of Hardware (a device/target is listed as supported or it is not), not a graded tier system like Debian's architecture tiers.

Evidence gathered:
- **CI:** No dedicated riscv64 CI pipeline exists. See Section 7 for full detail.
- **Release-blocking:** riscv64 targets are not part of the mandatory/core CI matrix; the "Build all core packages" job hardcodes `{malta, x86}` only, so riscv64 cannot block a release via that path. A human must manually attach a `ci:target:sifiveu:generic`-style label to a PR to trigger a full riscv64 board build.
- **Official binaries:** [downloads.openwrt.org](https://downloads.openwrt.org/releases/25.12.5/targets/) publishes real riscv64 firmware images (`sifiveu/generic`, `siflower/sf21` at time of research - note `siflower` in master is actually `ARCH:=mipsel`, so the riscv64 SF21 variant referenced in open PRs has not yet landed) and a populated `packages/riscv64_generic/base/` compiled package repository as part of normal numbered releases.

### Comparison: amd64 vs arm64 vs riscv64

| Criterion | amd64 (x86) | arm64 | riscv64 |
|---|---|---|---|
| Number of merged targets | 1 target, multiple subtargets | Dozens of long-established vendor targets | 3 merged (sifiveu, starfive, d1), 3 pending in open PRs |
| Core-package CI matrix | Included (hardcoded) | Not confirmed in this research; not found hardcoded alongside x86/malta | Excluded (not in the hardcoded `{malta, x86}` matrix) |
| Kernel/toolchain CI | Included, dynamic | Included, dynamic | Included, dynamic, but build-only (no boot/test) |
| Official firmware images | Yes | Yes | Yes (sifiveu, siflower boards), compile-only tested |
| QEMU test tooling (`scripts/qemustart`) | Supported | Not confirmed (armsr is supported, which covers some arm) | Not supported at all - "target $o_target is not supported yet" for anything outside armsr/malta/x86 |

## 4. Technical Architecture and RISC-V-Specific Subsystems

OpenWRT's own repository is a buildroot/meta-build system, not the Linux kernel or U-Boot source tree itself - there is no `arch/riscv/` directory in `openwrt/openwrt`. RISC-V architecture code (kernel, U-Boot) lives upstream; OpenWRT carries it as out-of-tree `.patch` files under `target/linux/<target>/patches-*/` and `package/boot/<bootloader>/patches/`.

### Genuine architecture-specific patches (touch `arch/riscv/` or `drivers/perf/riscv*`)

| Path | Purpose | Status |
|---|---|---|
| `target/linux/starfive/patches-6.18/0014-riscv-Optimize-memcpy-with-aligned-version.patch` (508 lines) | Replaces `arch/riscv/lib/memcpy.S` with a 128-byte-block aligned scalar RISC-V assembly version plus a C fallback | Complete, functional |
| `.../0015-riscv-purgatory-Change-memcpy-to-the-aligned-version.patch` | Wires kexec purgatory to use the aligned memcpy | Complete |
| `.../0016-riscv-Fix-__memcpy_aligned-alias.patch` | Bugfix for a weak-alias regression that broke iperf3 | Complete |
| `.../0026`, `.../0027`, `.../0028` (generic PMU mapfile, SoC PMU identification via SBI CSRs, perf CPUID format-attr) | Adds `drivers/perf/riscv_pmu*.c` PMU/perf sysfs support | Complete |
| `target/linux/siflower/patches-6.18/013-riscv-add-Siflower-RISC-V-SoC-family-Kconfig-support.patch` | Adds `ARCH_SIFLOWER` Kconfig for T-HEAD C908 SoCs | Kconfig-only, no code |

### T-HEAD vendor-CPU support (U-Boot, `package/boot/uboot-d1/patches/`)

Adds `arch/riscv/cpu/thead/` to U-Boot: CPU skeleton, custom CSR definitions (`CSR_MXSTATUS`, `CSR_MHCR`, `CSR_MHINT`), extension-CSR initialization, and cache maintenance operations using raw-encoded T-HEAD custom instructions (e.g. `.long 0x01a0000b` for `THEAD.SYNC.I`) since the T-HEAD cache-ops extension predates standard `Zicbom`/`Zicboz` mnemonics. This is genuine, complete, functional vendor-ISA-extension assembly, but lives in the U-Boot patch series, not the Linux kernel.

### Kernel Kconfig toggles (config selection only, not OpenWRT-authored code)

Per-target `config-6.18` files select upstream kernel RISC-V extension support: Zba/Zbb enabled on all 4 targets; Zicboz enabled on all 4; RVV (`CONFIG_RISCV_ISA_V=y`) enabled only on `d1` and `sifiveu`, explicitly disabled (`# CONFIG_RISCV_ISA_V is not set`) on `starfive` and `siflower/sf21`. These flip flags in upstream kernel Kconfig - no RVV intrinsics, vector assembly, or SIMD dispatch code is contributed by OpenWRT itself anywhere in the repo.

### Confirmed absent

- No RVV/vector intrinsics anywhere in the repo (`vfloat32m1_t` search returned 0 hits).
- No genuine "rvv" string references (4 raw grep hits were all substring false positives).
- No riscv64 BPF JIT patches (BPF JIT for RISC-V lives entirely upstream in the kernel).
- No RISC-V-specific SIMD dispatch tables anywhere in the repo.
- The OpenSSL patch (`package/libs/openssl/patches/110-openwrt_targets.patch`) only registers a `linux-riscv64-openwrt` Configure target inheriting OpenSSL's existing generic 64-bit perlasm scheme - it adds no riscv assembly itself.

### Comparison: kernel crypto acceleration Kconfig options, amd64 vs arm64 vs riscv64

| Category | amd64 (in the checked list) | arm64 | riscv64 |
|---|---|---|---|
| Accelerated crypto Kconfig options available upstream | 2 | 20 (`AES_ARM64[_CE/_BS/_NEON]`, `SHA1/2/3/512_ARM64[_CE]`, `SM3/4_ARM64_CE`, `GHASH`, `POLYVAL`, `CRCT10DIF`) | 7 (`AES_RISCV64`, `CHACHA_RISCV64`, `GHASH_RISCV64`, `SHA256_RISCV64`, `SHA512_RISCV64`, `SM3_RISCV64`, `SM4_RISCV64`) |
| Enabled per merged riscv64 target | N/A | N/A | Only `sifiveu` enables `SHA256_RISCV64`/`SHA512_RISCV64`; `starfive` and `d1` enable none, falling back to generic C |

RISC-V64 kernel crypto Kconfig support is real but roughly 3x thinner than arm64's, and enablement is inconsistent even across OpenWRT's own three merged targets.

### wolfSSL (package-level, symmetric dispatch)

`package/libs/wolfssl/Makefile` has a real, non-stub arch dispatch: `aarch64 -> --enable-armasm(+crypto)`, `x86_64 -> --enable-intelasm`, `riscv64 -> --enable-riscv-asm`. This delegates to wolfSSL's own upstream RISC-V assembly (not vendored in this repo) and is properly wired parallel to the other two architectures.

## 5. Build System, Cross-Compilation, and Toolchain

OpenWRT is a Makefile + Kconfig (menuconfig) buildroot-style system. It has no top-level CMakeLists.txt, no static per-arch CMake toolchain file, and no Dockerfiles for build targets. The only `CMakeLists.txt` files in the tree belong to individual upstream package sources and are unrelated to the overall build.

**Build commands (verified real):**
```
./scripts/feeds update -a
./scripts/feeds install -a
make menuconfig      # Target System -> Allwinner D1 RISC-V SoC / SiFive U-based RISC-V boards / StarFive JH71x0 (7100/7110)
make -j$(nproc)
```

Non-interactive config seed example (D1):
```
CONFIG_TARGET_d1=y
CONFIG_TARGET_d1_generic=y
CONFIG_TARGET_d1_generic_DEVICE_<board>=y
```
then `make defconfig && make -j$(nproc) V=s`.

**riscv64 targets** (`target/linux/*/Makefile`, kernel 6.18): `d1` (Allwinner D1), `sifiveu` (SiFive U/HiFive), `starfive` (JH7100/7110) - all `ARCH:=riscv64`, single `generic` subtarget.

**CPU flags** (`include/target.mk`):
```
ifeq ($(ARCH),riscv64)
  CPU_TYPE ?= generic
  CPU_CFLAGS_generic:=-mabi=lp64d -march=rv64gc
endif
```

**Toolchain versions** (selectable in menuconfig, no riscv64-specific minimum asserted): GCC 13.4.0 / 14.4.0 (default) / 15.3.0; Binutils 2.44 / 2.45.1 / 2.46.1 (default).

**Host build-machine requirement** (general, not riscv-specific): host GCC/G++ >= 10 or Clang >= 12, GNU Make >= 4.1, Python 3.8+, case-sensitive filesystem.

**Known build failures:**
- Issue [#15942](https://github.com/openwrt/openwrt/issues/15942) - util-linux build failed on riscv64 because ncurses' `.pc` file pointed at the host toolchain path; fixed by commit `91573ac` (PR [#16018](https://github.com/openwrt/openwrt/pull/16018)).
- Issue [#20191](https://github.com/openwrt/openwrt/issues/20191) - libunwind's `DEPENDS` architecture expression in `package/libs/libunwind/Makefile` excluded riscv64 and i386 despite upstream libunwind supporting both; fixed by PR [#20193](https://github.com/openwrt/openwrt/pull/20193) (broadened `DEPENDS`, bumped to 1.8.3), validated on real StarFive VisionFive2 hardware.
- PR [#23231](https://github.com/openwrt/openwrt/pull/23231) discussion surfaced a build error `sh: line 1: dtc: command not found` on Fedora 43 (device-tree compiler not in PATH during U-Boot compilation), fixed with a PATH patch in `uboot-mk`.

**QEMU:** `scripts/qemustart` only supports targets `armsr`, `malta`, and `x86` - its `start_qemu()` case statement explicitly errors "target $o_target is not supported yet" for anything else. riscv64 (d1/sifiveu/starfive) is not wired into OpenWRT's QEMU test script at all; a draft PR ([#21974](https://github.com/openwrt/openwrt/pull/21974)) proposes adding a generic RISC-V QEMU `virt` target (OpenSBI -> U-Boot -> FIT image boot chain) specifically to enable automated testing, but it remains an unreviewed draft as of the research date.

**Docker:** None in-repo. `.github/workflows/push-containers.yml` builds prebuilt-tool containers via the external `openwrt/actions-shared-workflows` repo, triggered by `tools/**`/`toolchain/**` changes generally, not riscv64-specific.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Merged hardware targets | 1 (multi-subtarget) | Dozens | 3 merged, 3 pending |
| Native QEMU test tooling | Yes (`scripts/qemustart`) | Partial (armsr) | No |
| Core-package CI coverage | Yes | Not confirmed as included | No (explicitly excluded from hardcoded matrix) |
| Kernel crypto acceleration (accelerated Kconfig options) | 2 options found in checked list | 20 options | 7 options, and only 1 of 3 merged targets enables any of them |
| RVV ("V" extension) enabled | N/A | N/A | Enabled on d1/sifiveu only; explicitly disabled on starfive/siflower |
| Stack unwinding (libunwind) | Available | Available | Available only since PR #20193 merged 2025-10-01 (previously entirely broken) |
| OpenSSL riscv-specific speedups | Long-standing | Long-standing | None in mainline; PR [#21070](https://github.com/openwrt/openwrt/pull/21070) open since Dec 2025, unmerged 9+ months as of this report |

**Functional gaps:** No riscv64 QEMU test target shipped in OpenWRT's own tooling means a developer or CI system cannot boot-test a riscv64 image without hand-rolling `qemu-system-riscv64` invocations against the built `Image`/dtb outside any provided script. The `siflower` riscv64 variant (T-HEAD C908, SF21) referenced in three open PRs has not landed in master - the `siflower` target that exists today is `ARCH:=mipsel`, not riscv64.

**Performance gaps:** Kernel crypto acceleration (AES/ChaCha/GHASH/SM3/SM4) Kconfig options exist upstream for riscv64 but are enabled on none of OpenWRT's three merged targets - all three fall back to generic C for these operations. OpenSSL, the crypto/TLS backend for many OpenWRT services, has zero riscv references in its current Makefile; PR #21070 to enable riscv64 speed optimizations has been open and unmerged for 9+ months. musl libc's string routines (`memcpy`, etc.) are generic C on riscv64, but this is normal cross-architecture parity, not a riscv64-specific deficiency (aarch64, arm, mips, mips64, powerpc, powerpc64, sh, s390x, and or1k are all in the same generic-C category in musl upstream).

**Security hardening gaps:** No riscv64-specific security-hardening gap was identified in this research beyond the generic-crypto-fallback issue above. (Note: a broader adversarial check flagged, via the dependency deep-dive, an unresolved OpenSSL AES T-table constant-time gap on riscv64 hardware lacking Zkn/Zvkned - see Section 9.)

**NaN / floating-point semantics issues:** None found. A targeted search for "riscv floating point nan math" against openwrt/openwrt's issue tracker returned no matches related to FP/NaN correctness; the repository currently has zero open bugs and zero issues textually matching RISC-V correctness problems (confirmed via a bare `riscv` query, `total_count: 2`, both closed build-tooling issues - see Section 11).

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? Effectively no dedicated pipeline.** Verified by direct clone and grep of every workflow file in both `openwrt/openwrt` (12 files) and the delegate repo `openwrt/actions-shared-workflows` (the repo every substantive openwrt/openwrt workflow delegates to via `uses:`).

- `grep -rn riscv .` inside `openwrt/openwrt/.github` returned **zero matches**. Every substantive workflow (`kernel.yml`, `packages.yml`, `toolchain.yml`, `tools.yml`, `label-kernel.yml`, `label-target.yml`, `coverity.yml`, `build-pr-profile.yml`, `push-containers.yml`) is a thin stub whose entire job body is `uses: openwrt/actions-shared-workflows/.github/workflows/<name>.yml@main`.
- Across the entire `actions-shared-workflows` repo, the literal string "riscv" appears in exactly one file: [`multi-arch-test-build.yml`](https://github.com/openwrt/actions-shared-workflows/blob/main/.github/workflows/multi-arch-test-build.yml) (lines 42, 45). This workflow is wired only into the separate `openwrt/packages` feed repo (`on: pull_request`), confirmed by `grep -rln "multi-arch-test-build" openwrt/openwrt/.github/workflows/*.yml` returning zero matches - it is not used by `openwrt/openwrt` at all.
- In that one workflow, the riscv64 matrix entry (`{"arch": "<riscv-variant>", "target": "sifiveu-generic", "runtime_test": false}`) runs on `ubuntu-latest` (x86, QEMU-emulated cross-build), with `runtime_test: false` - meaning riscv64 packages are cross-compiled and arch-string-checked only, never booted or executed in the QEMU Docker container - while aarch64, armv7, i386, mips, and x86_64 entries all have `runtime_test: true`.
- `kernel.yml` and `toolchain.yml` in `actions-shared-workflows` do not hardcode architectures; they generate their matrix at runtime via `perl ./scripts/dump-target-info.pl targets`, which currently discovers `sifiveu/generic`, `siflower/sf21`, and `starfive/generic` because those target directories exist in-tree. These jobs run on `ubuntu-slim`/`ubuntu-latest` (x86-only, no riscv64 runner anywhere in either repo) and stop after cross-compiling a kernel/toolchain/dtb - no `qemu`, `QEMU`, or `boot` string appears anywhere in `reusable_build.yml` or `reusable_check-kernel-patches.yml`.
- The flagship "Build all core packages" CI job (`packages.yml` in `actions-shared-workflows`) has a **hardcoded, non-dynamic** matrix of `{malta/be, x86/64}` only - riscv64 is explicitly absent. Core-package CI does not touch riscv64 at all.
- A full riscv64 board/image build (`build_full`, `build_all_boards`) is reachable only via `label-target.yml` (e.g. `ci:target:sifiveu:generic`), which requires a human to manually attach that label to a PR - it is not automatic, scheduled, or triggered by push/PR by default.

**RISE runners?** None used. RISE has no OpenWRT-related project or working group: checked riseproject.dev/members (Premier and General tiers), riseproject.dev/blog (all 34 posts by title/slug), a site-restricted web search, the RISE Python wheel builder page, the full `riseproject-dev` GitHub org listing (25 repos), the `firmware-wg` README (scope: TianoCore/EDK2, U-Boot, Coreboot, TF-M, OpenSBI - no OpenWRT), and [riscv-runners.riseproject.dev](https://riscv-runners.riseproject.dev/) (lists only one runner, `ubuntu-24.04-riscv` on Scaleway hardware, no OpenWRT runner or target). Zero OpenWRT involvement found across every channel checked.

**Hardware used:** None for CI. All riscv64-adjacent CI work (build-only kernel/toolchain compilation and the QEMU-cross-compile-only feed-package matrix entry) runs on GitHub-hosted x86_64 runners. No native riscv64 hardware is used in any CI job found.

### Comparison: amd64 vs arm64 vs riscv64 CI

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core-package CI matrix | Included (hardcoded `x86/64`) | Not confirmed as included in the hardcoded matrix | Excluded |
| Kernel/toolchain CI | Included, dynamic | Included, dynamic | Included, dynamic, but compile-only, no boot test |
| Feed-package (`multi-arch-test-build.yml`) runtime_test | Not directly checked, but aarch64/armv7/i386/mips have `runtime_test: true` per research | `runtime_test: true` | `runtime_test: false` |
| Native hardware runner | No (GitHub-hosted x86) | Not confirmed | No |
| RISE runner usage | N/A | N/A | None |

**Overall verdict** (from source-level verification): "incidental, build-only, x86-runner cross-compilation of whatever riscv64 kernel/toolchain targets happen to exist in-tree, triggered only by kernel/toolchain path changes - not a dedicated riscv64 CI pipeline, and not present at all in core-package CI or in any execution/boot-test capacity."

## 8. Distribution and Release Status

**Official binaries for riscv64:** Yes, via OpenWRT's own official download server, not GitHub Releases. `https://downloads.openwrt.org/releases/25.12.5/targets/` (43 total build targets) includes:
- `targets/sifiveu/generic/` - `generic-sifive_unleashed-ext4-sdcard.img.gz` (9.3MB), `generic-sifive_unmatched-ext4-sdcard.img.gz` (9.4MB)
- `targets/siflower/sf21/` - `bananapi_bpi-rv2-nand-squashfs-sysupgrade.bin` (7.3MB) and similar
- `packages/riscv64_generic/base/` - a populated compiled `.apk` binary package repository (e.g. `agetty-2.41.5-r1.apk`, `ar-2.45.1-r1.apk`)

Board images are named by vendor/board (e.g. `sifive_unmatched`, `bananapi_bpi-rv2`), not by the literal substring "riscv64" - the riscv64 architecture designation is only explicit in the `riscv64_generic` package-repository directory name, not confirmed present as a single explicit string inside `config.buildinfo`.

**GitHub Releases:** No binary assets of any kind, for any architecture. OpenWRT's release pages show source-archive assets only and the project's own text directs users to "download firmware images directly from our download servers." This is normal project policy, not riscv64-specific.

**PyPI:** No `openwrt` package exists (`https://pypi.org/pypi/openwrt/json` -> HTTP 404). Not applicable - OpenWRT is a firmware distribution, not a Python package. Confirmed also absent from the RISE wheel-builder mirror (redirects to the same 404).

**Ubuntu 26.04 (resolute) apt archive:** No `openwrt`/`python3-openwrt`/`libopenwrt` package exists for any architecture. Not informative - OpenWRT is never distributed via apt for any architecture.

**Arch Linux RISC-V (archriscv.felixc.at):** No `openwrt` package listed. Same non-informative caveat as above.

**What a user must do to get a working binary:** Download the pre-built board-specific image (e.g. `.img.gz` or `.bin` sysupgrade file) directly from `downloads.openwrt.org/releases/<version>/targets/<target>/<subtarget>/`, matching their exact board (sifive_unleashed, sifive_unmatched, or a siflower/starfive board). No generic "riscv64" installer image exists; the user must know their specific SoC/board target. Building from source via `make menuconfig` + target selection is the alternative path (Section 5).

## 9. Dependencies

Note: the `project-graph` MCP connection failed for the entire research session (`CONNECTION_CLOSED`), so Ubuntu 26.04 riscv64 packaging status could not be queried for any dependency below; this is a tooling outage, not evidence of absence, and is marked explicitly per row.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| musl (toolchain/musl) | Default C library for all riscv64 OpenWRT targets | graph query unavailable | graph query unavailable | graph query unavailable | Root cause of a downstream OpenSSL detection bug (lacks `__NR_riscv_hwprobe`, silently disables OpenSSL's Zbb-accelerated paths - see below). No dedicated riscv64 build blocker found in OpenWRT itself. |
| glibc (toolchain/glibc) | Alternate C library option | graph query unavailable | graph query unavailable | graph query unavailable | No OpenWRT/riscv64-specific issue found. |
| OpenSSL 3.5.8 (package/libs/openssl) | Crypto/TLS backend (default for many services) | graph query unavailable | graph query unavailable | graph query unavailable | See deep-dive below. |
| mbedTLS 3.6.7 (package/libs/mbedtls) | Crypto/TLS backend (default TLS lib for uhttpd, wpad, etc.) | graph query unavailable | graph query unavailable | graph query unavailable | No riscv64-specific optimization or open bug found on `Mbed-TLS/mbedtls`; runs generic C on riscv64 with no dedicated acceleration path. |
| wolfSSL 5.9.2-stable (package/libs/wolfssl) | Crypto/TLS backend (alternate) | graph query unavailable | graph query unavailable | graph query unavailable | Actively maintained; all 9 riscv64-tagged issues found are closed, several recent (May 2026): alignment issues in RISC-V asm, extension selection accuracy, SHA3 asm debug build failure, unaligned-load faults - all resolved. No open riscv64 blockers. |
| zlib (package/libs/zlib) | Compression | graph query unavailable | graph query unavailable | graph query unavailable | No functional riscv64 gap (portable C). Performance gap only: RVV Adler32 PR #1099 open since 2025-10-28 with zero maintainer response; no Zbc CRC-32 path. |
| GMP 6.3.0 (package/libs/gmp) | Arbitrary-precision arithmetic | graph query unavailable | graph query unavailable | graph query unavailable | Canonical repo on GNU Savannah, not GitHub - no issue search performed. |
| MPFR 4.2.2 (package/libs/mpfr) | Multi-precision floating point | graph query unavailable | graph query unavailable | graph query unavailable | Canonical repo on GNU Savannah, not GitHub - no issue search performed. |
| Nettle 3.10.2 (package/libs/nettle) | Low-level crypto primitives | graph query unavailable | graph query unavailable | graph query unavailable | Canonical repo at git.lysator.liu.se - no issue search performed. |
| libunwind (package/libs/libunwind) | Stack unwinding | graph query unavailable | graph query unavailable | graph query unavailable | Direct OpenWRT-level riscv64 blocker (now fixed): issue [#20191](https://github.com/openwrt/openwrt/issues/20191), resolved by PR [#20193](https://github.com/openwrt/openwrt/pull/20193). |

### Deep-dive: OpenSSL

OpenSSL is the crypto/TLS backend for many OpenWRT services. Current master `package/libs/openssl/Makefile` has **zero riscv references**. PR [#21070](https://github.com/openwrt/openwrt/pull/21070) ("openssl: optimize speed for riscv64 by default") has been open since December 2025 and remains unmerged 9+ months later, needing 6 approvals with only 3 as of the research date. Open upstream issue **#28118** "Riscv extension detection is broken on musl" (open since 2025-07-29, no PR) documents that Zbb is misdetected, causing silent performance loss specifically on musl-based riscv64 - which is exactly OpenWRT's default libc configuration, meaning this bug very likely affects all three of OpenWRT's merged riscv64 targets when they select the OpenSSL TLS backend. An open flaky test, **#30880** (`test_lhash` occasionally failing on linux-riscv64 CI), and an unresolved security gap - AES T-table fallback is not constant-time on riscv64 hardware lacking Zkn/Zvkned extensions (PRs #31080/#31082 open) - round out OpenSSL's riscv64 posture. [NEEDS VERIFICATION: OpenSSL issue/PR numbers #28118, #30880, #31080, #31082 come from a single research pass against the upstream openssl/openssl repository and were not independently cross-checked against a second source in this session.]

### Deep-dive: musl

musl lacks `__NR_riscv_hwprobe`, which is the root cause of OpenSSL's Zbb-detection failure described above. musl's own string routines (`memcpy`, etc.) use generic C on riscv64, but this is normal cross-architecture parity - aarch64, arm, mips, mips64, powerpc, powerpc64, sh, s390x, and or1k are all in the same generic-C category upstream; only x86_64 and i386 have hand-written `memcpy.s`. This is not a riscv64-specific deficiency.

### Additional OpenWRT-level (non-dependency) riscv64 signal

Issue **#20619** "d1/generic: Debian 13 build fails, extra function parameter is missing in some calls (SWIG?)" - closed, but affected the `d1` riscv64 target directly. OpenWRT's three riscv64 targets all build against kernel 6.18 and use musl by default, so the OpenSSL/musl hwprobe detection bug (#28118) is a live concern for any of them selecting the OpenSSL TLS backend.

Note: Section 10 (Ecosystem Status) is omitted. OpenWRT's own package feed system is part of its build tooling, already covered above under Dependencies and the Build System section - it is not a large external dependent-package ecosystem (PyPI/npm/Maven/Kubernetes-operator style) that requires separate riscv64-coverage tracking.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#15942](https://github.com/openwrt/openwrt/issues/15942) | util-linux build fails on riscv64 | Closed (Jul 2024) | Build-system | Fixed by commit `91573ac` (ncurses `.pc` path fix) |
| [#20191](https://github.com/openwrt/openwrt/issues/20191) | libunwind is missing for riscv64 and i386 | Closed (Sep-Oct 2025) | Packaging | Fixed by PR #20193, validated on real StarFive VisionFive2 hardware |
| [#20619](https://github.com/openwrt/openwrt/issues/20619) | d1/generic: Debian 13 build fails, extra function parameter missing (SWIG?) | Closed | Build-system | Affects the d1 riscv64 target directly |

A bare `riscv` query against the openwrt/openwrt issue tracker, sorted by creation date, returned `total_count: 2` - exactly the two build-tooling issues above (excluding #20619, found via a separate research pass). **No open bugs, and no floating-point/NaN correctness bug, are currently tagged or textually match RISC-V** in openwrt/openwrt. Broader searches for "riscv64 performance benchmark slow" (197 total hits) and "riscv64 bug crash kernel panic" (626 total hits) returned no genuine riscv64-specific matches beyond the closed issues already listed; all other hits were false positives (unrelated ARM/MediaTek CRC32 issues, boot loops, WiFi channel-width bugs).

**Open PRs (not bugs, but active work):**

| PR | Title | State |
|---|---|---|
| [#19699](https://github.com/openwrt/openwrt/pull/19699) | siflower: riscv64: fix unaligned access for 64bit data | Open |
| [#21069](https://github.com/openwrt/openwrt/pull/21069) | siflower: sf21: add CPU_TYPE for RISC-V RVA22U64 | Open |
| [#21070](https://github.com/openwrt/openwrt/pull/21070) | openssl: optimize speed for riscv64 by default | Open, needs 6 approvals (has 3) |
| [#21974](https://github.com/openwrt/openwrt/pull/21974) | targets: add RISCV qemu target | Open, draft, no reviews yet |
| [#23231](https://github.com/openwrt/openwrt/pull/23231) | spacemit: add support for the RISC-V64 SpacemiT K1 SoC | Open, active, approved by peterwillcn, no hard blockers |

**Correctness bugs highlighted separately:** None found. Both closed issues (#15942, #20191) were build/packaging gaps, not runtime correctness bugs. No NaN or floating-point semantics issue was found for RISC-V anywhere in the tracker.

**Real-world performance data** (community sources, not official OpenWRT benchmarks - no formal benchmark suite exists in the project): an interfacinglinux.com review of Orange Pi RV2 [NEEDS VERIFICATION - page returned HTTP 403 on direct fetch, figures taken from indexed search snippet only] reported wire-speed dual-GbE routing at approximately 941 Mbps, with asymmetric bidirectional throughput (321 Mbps down / 703 Mbps up). A [forum thread](https://forum.openwrt.org/t/orange-pi-r2s-packet-steering-flow-offloading-and-gigabit-throughput-issues/244157) on Orange Pi R2S reported approximately 910 Mbps down / 450 Mbps up with software packet steering (no hardware offload) due to IRQs staying pinned to CPU0 despite packet-steering configuration, versus approximately 930/930 Mbps symmetric with hardware flow offloading enabled (though SQM cannot be used simultaneously with hardware offload on this target). A separate forum post [NEEDS VERIFICATION - single source, developer anecdote] described the SpacemiT K1 core's single-core performance as "about the same as a Raspberry Pi 3."

## 12. Objections and Upstream Blockers

**Stated objections:**
- PR [#12001](https://github.com/openwrt/openwrt/pull/12001) was closed after community members pointed out direct overlap with the concurrently-progressing sifiveu target PR (#9980); maintainer Ansuel raised a blocking concern about maintaining two kernel versions in parallel, and the author conceded and self-closed, stating: "I should open another one when another SoC is added, rebased on that new codebase, after that basic patch on build system is merged."
- In PR #23231 (SpacemiT K1), maintainer wigyori pushed back on overstating device support ("If you state...that X and Y devices are supported, that's not something that's to 'attract testers'"), requesting the supported-devices list be trimmed to only confirmed-tested boards or explicitly marked RFT (Request For Testing).
- Automated review (openwrt-ai) on the same PR flagged missing MAC-address-layout documentation and incomplete per-board hardware specs.

**Technical blockers:**
- `dtc` (device-tree compiler) not found in PATH on some build environments (Fedora 43), blocking U-Boot compilation for the SpacemiT target - fixed via a PATH patch in `uboot-mk`.
- An image-type-detection problem for sysupgrade/owut on the SpacemiT target (no runtime way to tell SD/eMMC/other image types apart) required an MBR-signature fix; a byte-order bug was found during testing and subsequently addressed.
- Real-world hardware issues reported during a two-week Orange Pi R2S test of PR #23231: PCIe trains at Gen1 instead of Gen2 (capping the 2.5G ports at approximately 2Gbps effective), non-functional LEDs on the two 1G ports, CPU frequency capped at 1.2288GHz (below rated spec), and an invalid GPT backup header after flashing (cosmetic).
- OpenWRT's own QEMU test tooling does not support riscv64 at all (Section 5), meaning no CI job can boot-test a riscv64 image without new tooling - this is the direct blocker addressed (in draft) by PR #21974.

**Organizational blockers:**
- No corporate/vendor engineering team drives OpenWRT's RISC-V work; it has been carried largely by a single hobbyist-style maintainer (Zoltan Herpai) for the sifiveu port over a multi-year timeline (authored 2018, merged 2023). This creates bus-factor risk and explains the multi-year gaps between authoring and merging seen in Section 2.
- No RISE Project involvement exists to accelerate this work (Section 7).

**Acceptance probability:** High for board-specific target PRs that are complete, tested, and have no direct duplication with in-flight work (as demonstrated by sifiveu, starfive, and the currently-approved-with-no-hard-blockers status of PR #23231). Low to moderate for infrastructure-level PRs that touch shared build-system plumbing without a clear owner or without avoiding duplication with concurrent work (as demonstrated by the self-closure of #12001). The current pending PRs (#19699, #21069, #21070, #21974, #23231) show no organized opposition; #23231 in particular is on a clear path to merge, with remaining issues being peripheral UX polish rather than fundamental objections.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- **Justification:** OpenWRT's own CI workflow files contain zero occurrences of "riscv" across all 12 files in `.github/workflows/` (verified by direct clone and grep); riscv64 compilation happens only incidentally, through dynamically-generated kernel/toolchain build matrices that cross-compile on x86 GitHub runners with no boot or test execution ever performed, while the flagship "Build all core packages" job hardcodes a `{malta, x86}`-only matrix that excludes riscv64 entirely (see [multi-arch-test-build.yml](https://github.com/openwrt/actions-shared-workflows/blob/main/.github/workflows/multi-arch-test-build.yml), where riscv64's matrix entry sets `runtime_test: false` while every other listed architecture has `runtime_test: true`). Per the CI evidence rule, build-only CI (compiles but never runs tests) caps the primary color at yellow. Upstream does publish genuine riscv64 firmware images and packages as part of its official numbered releases via [downloads.openwrt.org](https://downloads.openwrt.org/releases/25.12.5/targets/) (release_provider: upstream) - a real and creditable release channel - but this does not raise the color above yellow because green and blue both require upstream CI with actual test execution, which does not exist for riscv64.
- **Pending work that could change the grade:** PR [#21974](https://github.com/openwrt/openwrt/pull/21974) (draft QEMU riscv64 target, explicitly motivated by "doing some automated testing") is the one concrete, in-flight change that could convert riscv64 CI from build-only to test-executing if it is completed, reviewed, and wired into an actual CI job - it is currently an unreviewed draft with zero reviews. PR [#23231](https://github.com/openwrt/openwrt/pull/23231) (SpacemiT K1) is close to merge and would add a fourth riscv64 target but would not, by itself, change the CI posture. No RISE involvement exists that could accelerate either of these (Section 7).

## 14. Investment Analysis

RISE has funded zero OpenWRT-related work (Section 7) - all sizing below is therefore un-offset by existing RISE investment.

### 14.1 Functional Enablement

The three merged riscv64 targets (sifiveu, starfive, d1) are functionally complete with zero TODO/FIXME/stub markers found in their target trees. The primary functional gap is the `siflower` riscv64 (SF21, T-HEAD C908) target, which exists only as open PRs (#19699, #21069, #21070) against a `siflower` directory whose master-branch `Makefile` is still `ARCH:=mipsel` - meaning this target has not actually landed as riscv64 in the tree despite three open PRs referencing it. Landing these PRs, plus reviewing and merging the draft QEMU target (#21974) and the actively-reviewed SpacemiT K1 target (#23231), constitutes the near-term functional-enablement backlog.

### 14.2 Performance Optimization

Kernel crypto acceleration (AES/ChaCha/GHASH/SM3/SM4 riscv64 Kconfig options) is enabled on none of the three merged targets; enabling these where hardware supports the relevant extensions is low-risk, high-value work (Kconfig flag changes plus validation). OpenSSL riscv64 speed optimization (PR #21070) is open and stalled at 3 of 6 required approvals - unblocking review on this PR is a cheap way to close the crypto-performance gap for the default OpenSSL backend. The upstream OpenSSL musl-hwprobe detection bug (#28118) silently disables Zbb-accelerated crypto on OpenWRT's default libc configuration across all riscv64 targets - this is an upstream-OpenSSL fix, not an OpenWRT-specific one, but OpenWRT is a direct beneficiary and could contribute a fix or a workaround patch.

### 14.3 CI/CD Infrastructure

The single highest-leverage CI investment is completing and reviewing PR #21974 (QEMU riscv64 target) and then wiring it into an actual boot/test-executing CI job - this is the concrete path from the current build-only posture to a test-executing (blue-eligible) posture. Separately, extending the `multi-arch-test-build.yml` feed-package workflow's riscv64 matrix entry to set `runtime_test: true` (matching aarch64/armv7/i386/mips/x86_64) would close the test-execution gap in feed-package CI, though this affects `openwrt/packages` and sibling feed repos rather than `openwrt/openwrt` itself.

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale above.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Land siflower/sf21 riscv64 target (PRs #19699, #21069, #21070 merge/rebase) | 2-4 | Upstream contributor (currently unowned by any company) | High |
| Functional | Review and merge draft QEMU riscv64 target (PR #21974) | 1-2 (review-bound, not implementation-bound) | Upstream maintainers | High |
| Functional | Complete review of SpacemiT K1 target (PR #23231) - address remaining UX polish (image-type reporting, MAC-address docs) | 1-2 | dhewg (author) plus reviewer bandwidth | Medium |
| Performance | Enable riscv64 kernel crypto acceleration Kconfig options (AES/ChaCha/GHASH/SM3/SM4) on starfive and d1 targets | 1-2 | Target maintainers | Medium |
| Performance | Unblock and merge OpenSSL riscv64 speed PR (#21070) - needs 3 more approvals | 0.5 (review effort) | OpenSSL/OpenWRT maintainers | Medium |
| Performance | Fix or work around upstream OpenSSL musl-hwprobe detection bug (#28118) affecting all riscv64 targets | 1-2 | Upstream OpenSSL, or an OpenWRT-carried patch | Medium |
| CI/CD | Wire the QEMU riscv64 target (once merged) into an actual boot/test-executing CI job | 2-3 | OpenWRT CI maintainers | High |
| CI/CD | Set `runtime_test: true` for riscv64 in `multi-arch-test-build.yml` (feed-package CI) | 0.5-1 | openwrt/actions-shared-workflows maintainers | Medium |
| CI/CD | Add riscv64 to the core-package CI matrix (currently hardcoded to malta/x86 only) | 1-2 | OpenWRT CI maintainers | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [openwrt/openwrt repository](https://github.com/openwrt/openwrt)
- [OpenWRT homepage](https://openwrt.org/)
- [Issue #20191 - libunwind is missing for riscv64 and i386](https://github.com/openwrt/openwrt/issues/20191)
- [Issue #15942 - util-linux build fails on riscv64](https://github.com/openwrt/openwrt/issues/15942)
- [PR #12001 - riscv: Add basic support for RISC-V](https://github.com/openwrt/openwrt/pull/12001)
- [PR #9980 - sifiveu: add new RISC-V target](https://github.com/openwrt/openwrt/pull/9980)
- [PR #13372 - jh71x0: add new target for StarFive JH7100/7110 RISC-V SoC](https://github.com/openwrt/openwrt/pull/13372)
- [PR #17003 - config: loongarch64,riscv64: fix missing seccomp support](https://github.com/openwrt/openwrt/pull/17003)
- [PR #18094 - include: move generic riscv64 ISA to rv64gc](https://github.com/openwrt/openwrt/pull/18094)
- [PR #20193 - libunwind: enable build for riscv64 and update it to 1.8.3](https://github.com/openwrt/openwrt/pull/20193)
- [PR #19699 - siflower: riscv64: fix unaligned access for 64bit data](https://github.com/openwrt/openwrt/pull/19699)
- [PR #21069 - siflower: sf21: add CPU_TYPE for RISC-V RVA22U64](https://github.com/openwrt/openwrt/pull/21069)
- [PR #21070 - openssl: optimize speed for riscv64 by default](https://github.com/openwrt/openwrt/pull/21070)
- [PR #21974 - targets: add RISCV qemu target](https://github.com/openwrt/openwrt/pull/21974)
- [PR #23231 - spacemit: add support for the RISC-V64 SpacemiT K1 SoC](https://github.com/openwrt/openwrt/pull/23231)
- [Commit 91573ac - ncurses .pc path fix (PR #16018)](https://github.com/openwrt/openwrt/commit/91573ac145aa70a12b0984ec75507ac648569240)
- [openwrt/actions-shared-workflows multi-arch-test-build.yml](https://github.com/openwrt/actions-shared-workflows/blob/main/.github/workflows/multi-arch-test-build.yml)
- [OpenWRT rules and governance](https://openwrt.org/rules)
- [Software in the Public Interest - OpenWrt project page](https://www.spi-inc.org/projects/openwrt/)
- [RISE Project members](https://riseproject.dev)
- [RISE RISC-V Runners](https://riscv-runners.riseproject.dev/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [OpenWRT official downloads - 25.12.5 targets](https://downloads.openwrt.org/releases/25.12.5/targets/)
- [openwrt/packages issue #28040 - luajit2: RISC-v Architecture not supported](https://github.com/openwrt/packages/issues/28040)
- [OrangePi RV2 OpenWrt test report (RuyiSDK)](https://matrix.ruyisdk.org/reports/OrangePi-RV2-OpenWrt-README/)
- [OpenWrt forum - Orange Pi R2S: Packet Steering, Flow Offloading and Gigabit Throughput Issues](https://forum.openwrt.org/t/orange-pi-r2s-packet-steering-flow-offloading-and-gigabit-throughput-issues/244157)
- [OpenWrt forum - OrangePi R2S is a great new RISC-V OpenWrt device](https://forum.openwrt.org/t/orangepi-r2s-is-a-great-new-risc-v-openwrt-device/234090)
- [interfacinglinux.com - OrangePi RV2: RISC-V On A Budget](https://interfacinglinux.com/2025/05/26/orangepirv2/)
- Local research artifacts: shallow clone of `openwrt/openwrt` at `/home/user/openwrt/openwrt` (HEAD `f36067d4e9c2e2a71b466a19ce4211e4d4a39228`); shallow clone of `openwrt/actions-shared-workflows` at `/home/user/openwrt/actions-shared-workflows` (HEAD `60114df`)