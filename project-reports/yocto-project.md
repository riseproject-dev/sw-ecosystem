---
title: Yocto Project
parent: Project Reports
color: blue
dependencies:
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="yocto-project" %}

# Yocto Project

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Yocto Project<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

The Yocto Project is not a single piece of software but a build framework: **BitBake** (the task executor/metadata interpreter) plus **openembedded-core** (the base metadata/recipe layer, "meta"), packaged together as the reference distribution **Poky**. Its output is not a binary the project ships, but tooling that lets a user build a custom embedded Linux image for a target architecture from source. RISC-V support therefore means "can BitBake/openembedded-core build and boot a riscv64 target," not "does the Yocto Project publish a riscv64 binary."

**Governance.** The Yocto Project is a Linux Foundation collaborative project, launched March 2011 with 22 founding organizations including OpenEmbedded. Governance is meritocratic, similar to the Linux kernel: subsystem, layer, and BSP maintainers earn authority through contribution. A Technical Steering Committee (TSC) holds technical authority over repositories, mailing lists, QA infrastructure, and releases; Richard Purdie has historically acted as Linux Foundation Fellow and maintainer of last resort. Per the live leadership page, the current TSC includes Joshua Watt, Paul Barker, Ross Burton (Arm), Mark Hatle (OE Elected), and Denys Dmytriyenko (Konsulko Group, previously Texas Instruments, OE Elected); an older cached TSC snapshot lists Richard Purdie (Linux Foundation, Chair) and Khem Raj (affiliation recorded as Comcast in that snapshot, though his LinkedIn currently shows Qualcomm) [NEEDS VERIFICATION on exact current TSC roster, since the two sources disagree on cycle/membership].

**License.** Poky/openembedded-core/BitBake tooling is MIT-licensed; images built with Yocto aggregate whatever licenses the included upstream recipes carry, tracked via per-build license manifests.

**Corporate sponsors (membership tiers).** Platinum (15): AMD, Amazon Web Services, Arm, Assa Abloy Group, BMW, Cisco Systems, Comcast Cable Communications, Exein, Garmin International, Hitachi, Intel, LG Electronics, Qualcomm Technologies, **RISC-V International**, Wind River Systems. Gold (9): Boeing, Ericsson Software Technology, Linaro, Microsoft, Renesas Electronics, Schneider Electric, Siemens EDA, Texas Instruments, Trimble. Silver (20+) includes BayLibre and Bootlin. RISC-V International joined as a **Platinum member in June 2025**, which is separate from RISE (RISC-V Software Ecosystem) membership: the Yocto Project is not itself a RISE member, but RISE funds engineering resources (via BayLibre) into Yocto's RISC-V support.

**Community stance on new ports.** The project explicitly frames itself as open to new-architecture contributions "whether from newcomers or industry experts," and treats early upstream testing/bug discovery on a new architecture as a benefit to the whole ecosystem. This is consistent with its meritocratic model, where sustained contribution rather than a formal request process earns maintainer status and first-class (tested-in-matrix) support.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| October 2017 | `meta-riscv` layer created (out of tree), `qemuriscv64` BSP added | [RISE: Improving RISC-V Support in the Yocto Project](https://riseproject.dev/2026/06/05/improving-risc-v-support-in-the-yocto-project/) |
| January 2019 | Initial OpenSBI recipe added | [RISE: Improving RISC-V Support in the Yocto Project](https://riseproject.dev/2026/06/05/improving-risc-v-support-in-the-yocto-project/) |
| June 18, 2019 | `qemuriscv64` machine config (`arch-riscv.inc`, `qemuriscv.inc`, `tune-riscv.inc`, `qemuriscv64.conf`) formally upstreamed into openembedded-core proper by Alistair Francis (then Western Digital, previously Xilinx), designed to allow a later riscv32 addition once glibc supported it | Governance research (patch series attribution) [NEEDS VERIFICATION - exact commit not independently re-fetched] |
| March 2022 | `linux-yocto/5.15: riscv64: drop MAXPHYSMEM_128GB` merged, commit `da19366b44af8521b0f311581793fc89d554cd40`, shipped in Kirkstone (4.0 LTS) | [Patchwork](https://patchwork.yoctoproject.org/project/oe-core/patch/4a4203b2fa0c711eedbd2d5a96e3679f1563dfca.1646443420.git.bruce.ashfield@gmail.com/) |
| April 2021 (RISE blog) / March 2021 (governance research) | BeagleV BSP added to `meta-riscv` | Discrepancy: [RISE blog](https://riseproject.dev/2026/06/05/improving-risc-v-support-in-the-yocto-project/) says April 2021; governance-research pass says March 2021. Both agree on the event, not the exact month. |
| November 2023 | Khem Raj's 6-patch "Add riscv64 build host support" series posted; 5 of 6 patches merged 2023-11-05 (commits confirmed), landed in Scarthgap (5.0); patch 1/6 ("do not inherit uninative on ppc64le and riscv64 hosts") remains unmerged (Patchwork state "New") as of this research | [Patchwork cover letter](https://patchwork.yoctoproject.org/project/oe-core/cover/cover.1698951553.git.raj.khem@gmail.com/) |
| Yocto 4.3 | RISC-V support enabled in LLVM 17 | Findings (release notes) |
| 2021-2025 | Hardware BSPs added to `meta-riscv`: StarFive VisionFive series, Milk-V Duo, OrangePi RV2/R2S | RISE research pass |
| June 2025 | RISC-V International joins Yocto Project as Platinum member | [RISC-V International / RISE joint announcement](https://riscv.org/blog/risc-v-international-and-the-rise-project-join-forces-for-yocto-project-support/) |
| July 2, 2025 | `[v3,5/6] linux-yocto/6.12: riscv: Enable TUNE_FEATURES based KERNEL_FEATURES`, commit `45a1b5aa6abc9007d0d87efc2d740b5564a209dd`, accepted | [Patchwork](https://patchwork.yoctoproject.org/project/oe-core/patch/1751492664-12569-6-git-send-email-mark.hatle@kernel.crashing.org/) |
| September 2025 | RVA23S64 becomes the default `qemuriscv64` CPU profile | [RISE blog](https://riseproject.dev/2026/06/05/improving-risc-v-support-in-the-yocto-project/); confirmed in fetched `qemuriscv.inc` (`QB_CPU:riscv64 ?= "-cpu rva23s64,pmp=true"`) |
| Yocto 5.2 "walnascar" | JIT disabled on riscv64; QEMU speed/timing changes to reduce autobuilder intermittent failures | Findings (release notes) [NEEDS VERIFICATION - which component's JIT is not specified in the source material] |
| September 2026 | `meta-riscv` PR #676 accelerates deprecation of 4 stale vendor-fork BSPs (ae350-ax45mp, milkv-megrez, nezha-allwinner-d1, star64) to Yocto 6.1 | [GitHub PR #676](https://github.com/riscv/meta-riscv/pull/676) |

**Key contributors and organizations:** Alistair Francis (upstreamed `qemuriscv64` into oe-core proper); Khem Raj (current `meta-riscv` maintainer, affiliation recorded variously as Qualcomm/Comcast across sources [NEEDS VERIFICATION]); Trevor Gamblin (BayLibre, RISE-funded, current de facto driver of CI reliability and BSP maintenance); Mark Hatle (AMD / kernel.crashing.org, `KERNEL_FEATURES_RISCV` work); Bruce Ashfield (kernel recipe maintenance).

**Is it fully upstream?** Yes for the core `qemuriscv64`/`qemuriscv32` QEMU targets: they live directly in `openembedded-core`, not in a third-party layer, so no extra layer is required to build for QEMU RISC-V. Real-hardware board support (SiFive HiFive Unleashed/Unmatched, BeagleV, VisionFive, Milk-V, MangoPi, etc.) lives in the separate community layer `meta-riscv` (`github.com/riscv/meta-riscv`), which is not part of core Yocto releases.

## 3. Upstream Support Tier

Per `docs.yoctoproject.org`'s Yocto Project Supported Architectures and Features table:

- **RISC-V (64-bit): tier Primary**, maintained by "Collective effort," CI builders `qemuriscv64`, `qemuriscv64-ptest`, `qemuriscv64-tc`. Primary tier means dedicated daily Autobuilder builds, and incoming `openembedded-core` patches are tested against it before merge (regressions block merges).
- **RISC-V (32-bit): tier Secondary**, maintainer "TBD," CI builders `qemuriscv32`, `qemuriscv32-tc`. Secondary tier is maintainer-run testing only and does not gate merges.

This was independently verified by directly fetching `https://git.yoctoproject.org/yocto-autobuilder-helper/plain/config.json` (raw file, not search snippet): confirmed, line-referenced entries for `qemuriscv32`, `qemuriscv64`, `qemuriscv32-tc`, `qemuriscv64-tc`, `qemuriscv64-ptest` as real Autobuilder targets, plus a `yocto-check-layer` invocation whose `--machines` list includes `qemuriscv32 qemuriscv64` alongside `qemuarm qemuarm64 qemuarmv5 qemuloongarch64 qemumips qemumips64 qemuppc qemuppc64 qemux86-64 qemux86`.

No official riscv64 binary/image artifact is published by upstream for general download. This is consistent with Yocto's nature as a source-based build framework rather than a binary-distributing project (there is no equivalent of "download a riscv64 wheel"), so it is not treated here as a defect, but it does mean the "upstream publishes riscv64 artifact" criterion in the readiness model is not met.

**Comparison table:**

| Architecture | CI tier (per supported-features page) | Build+test in Autobuilder config.json | Gates oe-core merges |
|---|---|---|---|
| amd64 (`qemux86-64`) | Data not available: tier label for amd64 was not quoted in the fetched excerpt of the supported-features table | Yes - present in `yocto-check-layer` machine list | Data not available |
| arm64 (`qemuarm64`) | Data not available: tier label for arm64 was not quoted in the fetched excerpt | Yes - present in `yocto-check-layer` machine list | Data not available |
| riscv64 (`qemuriscv64`) | **Primary** | Yes - `qemuriscv64`, `qemuriscv64-ptest`, `qemuriscv64-tc` all defined | Yes (per Primary-tier definition) |
| riscv32 (`qemuriscv32`) | **Secondary** | Yes - `qemuriscv32`, `qemuriscv32-tc` defined | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Yocto/BitBake itself is a build orchestrator, not a runtime, so it has no JIT or SIMD dispatch engine of its own. RISC-V-specific code exists at three layers it controls:

**openembedded-core (`meta/conf/machine/include/riscv/`):**
- `README` - documents `TUNE_RISCV_MARCH`/`TUNE_RISCV_ABI` and the ISA-extension model.
- `arch-riscv.inc` - defines `TUNE_FEATURES` for every RISC-V ISA extension (base `rv32`/`rv64`, `m`, `a`, `f`, `d`, `c`, `v`, and Z-extensions `zicbom`, `zicsr`, `zifencei`, `zba`/`zbb`/`zbc`/`zbs`), builds `TUNE_CCARGS` (e.g. `-march=rv64gc -mabi=lp64d`).
- `tune-riscv.inc`, `qemuriscv.inc` - tuning parameters and QEMU emulation settings.
- `meta/recipes-devtools/gcc/gcc-runtime.inc` - disables `RUNTIMELIBITM` (transactional memory) for riscv32/riscv64; special-cased header relocation logic.
- `meta/recipes-kernel/linux/linux-yocto.inc` (and, after the 2026 relocation patch, `linux-yocto-features.inc`) - conditionally includes kernel config fragments based on detected `TUNE_FEATURES` (e.g. `zicbom`), per the `KERNEL_FEATURES_RISCV` mechanism ([Patchwork](https://patchwork.yoctoproject.org/project/oe-core/patch/1751492664-12569-6-git-send-email-mark.hatle@kernel.crashing.org/)).

**linux-yocto (Yocto's maintained kernel fork):**
- Full `arch/riscv/` tree inherited from upstream Linux's RISC-V port.
- `arch/riscv/crypto/aes-riscv64-zvkned-zvkb.S` - hand-written vector-crypto assembly implementing AES using the Zvkned/Zvkb vector-crypto extensions.
- `arch/riscv/configs/defconfig`.

**meta-riscv (community BSP layer, `github.com/riscv/meta-riscv`):** board support for `qemuriscv64`/`qemuriscv32`, SiFive HiFive Unleashed (`freedom-u540`), BeagleV (`beaglev-starlight-jh7100`), MangoPi MQ Pro, etc.

**Known gaps in this code:**
- OpenSBI's Makefile compiler-support probe for `_zicsr`/`_zifencei` uses an over-broad `grep` over the full compiler error output, including file paths - if the build path itself contains the substring "zicsr" or "zifencei," detection misfires ([Bug 15897](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15897)). `zicsr`/`zifencei` are deliberately excluded from `PACKAGE_EXTRA_ARCHS` in `arch-riscv.inc` (though kept in `-march=`) to work around this.
- AddressSanitizer on riscv64 only supports the Sv39 virtual-addressing scheme; the custom allocator used by ASan is incompatible with Sv48/Sv57 ([Bug 15691](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15691), fixed by defaulting qemuriscv to the RVA22S64/Sv39 profile). The broader self-test to validate ASan on riscv64 as a compatible sanitizer host remains open since January 2024 ([Bug 15338](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15338)).

**Comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel vector-crypto assembly | Data not available: no amd64-specific assembly path was surfaced in this research | Data not available: no arm64-specific assembly path was surfaced in this research | `arch/riscv/crypto/aes-riscv64-zvkned-zvkb.S` (Zvkned/Zvkb AES) - present |
| Sanitizer (ASan) VA scheme support | Data not available | Data not available | Sv39 only; Sv48/Sv57 unsupported ([Bug 15338](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15338)) |
| Multilib support | Data not available (not flagged as an issue) | Data not available (not flagged as an issue) | Disabled for riscv targets ([Bug 15826](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15826)) |

## 5. Build System, Cross-Compilation, and Toolchain

Yocto/OpenEmbedded does not use `cmake`/`./configure` at the top level. The build is driven by BitBake against metadata (`.bb`/`.conf`/`.inc`), and `cmake -D...` flags only appear inside individual recipes that build CMake-based upstream software.

**Building `qemuriscv64`** (a first-class MACHINE in `openembedded-core`, no extra layer required):

```
git clone git://git.yoctoproject.org/poky
cd poky
git checkout scarthgap
source oe-init-build-env build-riscv64
echo 'MACHINE = "qemuriscv64"' >> conf/local.conf
bitbake core-image-minimal
```

For real hardware, add the `meta-riscv` layer:

```
git clone https://github.com/riscv/meta-riscv.git -b master
bitbake-layers add-layer ../meta-riscv
MACHINE=beaglev-starlight-jh7100 bitbake core-image-full-cmdline
```

**Host build-machine minimums** (`docs.yoctoproject.org/ref-manual/system-requirements.html`, dev/6.0 branch): Git 1.8.3.1+, tar 1.28+, Python 3.9.0+, GNU make 4.0+ ("broken make 4.2.1 without patches" called out), gcc 10.1+. No technical rationale for these specific numbers is documented upstream. Required Ubuntu/Debian packages: `build-essential chrpath cpio debianutils diffstat file gawk gcc git iputils-ping libacl1 libcrypt-dev locales python3 python3-git python3-jinja2 python3-pexpect python3-pip python3-subunit socat texinfo unzip wget xz-utils zstd`, plus `python3-websockets` on all supported distros except Debian 11/Ubuntu 22.04. **Ubuntu 26.04 (resolute)** is confirmed in the current docs as a supported/tested Yocto build host, though that listing is for x86_64 Autobuilder workers, not a riscv64-specific claim.

**Target riscv64 cross-compiler** is built by Yocto itself from source and pinned per release branch via `GCCVERSION` in `meta/conf/distro/include/tcmode-default.inc`:

| Yocto release | GCC for riscv64 target | GDB |
|---|---|---|
| Kirkstone (4.0 LTS) | 11.x | 11.x |
| Scarthgap (5.0 LTS) | 13.x | 14.x |
| Styhead (5.1) | 14.x | 15.x |
| master (dev/6.0) | 16.x | - |

**ISA/ABI tuning** (`meta/conf/machine/include/riscv/tune-riscv.inc`, verbatim): `DEFAULTTUNE ?= "riscv64"`, `AVAILTUNES += "riscv64 riscv32 riscv64nc riscv64nf riscv32nf"`, `TUNE_FEATURES:tune-riscv64 := rv64gc` (default IMAFDC), with `riscv64nf` ("no float") and `riscv64nc` ("no compressed") variants. This is set via `DEFAULTTUNE` in `local.conf`.

**QEMU usage.** `runqemu qemuriscv64 nographic` (or after a build, `runqemu core-image-minimal nographic`). Verified `qemuriscv64.conf`/`qemuriscv.inc` content: `UBOOT_MACHINE = "qemu-riscv64_smode_defconfig"`, `RISCV_SBI_PLAT ?= "generic"`, `QB_CPU:riscv64 ?= "-cpu rva23s64,pmp=true"`, `QB_DEFAULT_BIOS = "fw_jump.elf"`. Boot chain is U-Boot -> OpenSBI (`fw_jump.elf`) -> kernel `Image`. The official `dev-manual/qemu.html` narrative page lists `qemuarm`/`qemuarm64`/`qemumips(64)`/`qemuppc`/`qemux86(-64)` but has not been updated to mention riscv64, even though the machine-config metadata fully supports it.

**Dockerfile.** No official Dockerfile exists in Yocto's own repos (`yocto-docs`, `poky`, `meta-riscv`). The closest public example is the community `Praqma/yocto-build-container`, pinned to Ubuntu 18.04 and a 2.6.1-era package list that does not satisfy the current gcc 10.1+/Python 3.9.0+ minimums and would need updating before use with Scarthgap/Styhead/master.

**Known build failures:** OpenSBI recipe breaks when `zicsr`/`zifencei` substrings appear in the build path ([Bug 15897](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15897)); `linux-yocto` does not build for `qemuriscv32` ([Bug 15878](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15878)).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Autobuilder CI tier | Data not available (not quoted in this research) | Data not available (not quoted in this research) | Primary (build+test, merge-gating) |
| riscv32 equivalent tier | N/A | N/A | Secondary (non-gating) |
| Multilib | Data not available | Data not available | Disabled ([Bug 15826](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15826)) |
| ASan self-test coverage | Data not available | Data not available | Open since Jan 2024, Sv39-only limitation ([Bug 15338](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15338)) |
| `testimage` on 32-bit variant | N/A | Data not available | `qemuriscv32` incompatible with testimage ([Bug 15433](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15433)) |
| sstate native reuse test coverage | Data not available | Data not available | Not tested against other targets ([Bug 16133](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16133)) |

**Functional gaps:** `linux-yocto` fails to build for `qemuriscv32` entirely ([Bug 15878](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15878)); `qemuriscv32` is incompatible with `testimage` ([Bug 15433](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15433)); multilib is disabled for riscv targets ([Bug 15826](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15826)).

**Security hardening gaps:** ASan support is limited to the Sv39 virtual-memory scheme; Sv48/Sv57 are unsupported because ASan's custom allocator is incompatible with those layouts. A proposed workaround (disabling SV48/SV57 support in QEMU's `target/riscv/csr.c`) was rejected by Richard Purdie and Randy MacLeod as a non-upstream, architecturally-questionable hack ([discussion](https://patchwork.yoctoproject.org/comment/17337/)).

**Performance gaps:** No Yocto-specific numeric benchmark data exists. The RISE blog post on Yocto states only qualitatively that "test failures seen in the Autobuilder are disproportionately high on `qemuriscv64` (compared with other architectures), and manifest mainly when the host systems are under heavy load," with attempted mitigations (disabling TCG plugins, adjusting QEMU CPU profile) showing "no meaningful effect or actually increased runtime" ([source](https://riseproject.dev/2026/06/05/improving-risc-v-support-in-the-yocto-project/)). The only concrete build-speed numbers available industry-wide are non-Yocto: Fedora's `binutils` build comparison shows riscv64 (StarFive VisionFive 2) taking 143 minutes vs 29 minutes on x86_64 (~4-5x slower) ([Marcin Juszkiewicz](https://marcin.juszkiewicz.com.pl/2026/03/10/risc-v-is-sloooow/); [Phoronix](https://www.phoronix.com/news/RISC-V-Slow-Fedora-Packages)) - flagged explicitly as general RISC-V hardware data, not a Yocto/OpenEmbedded-run measurement.

**NaN/floating-point semantics:** Data not available: no source in this research addressed RISC-V floating-point/NaN-boxing semantics issues specific to Yocto.

## 7. CI/CD Infrastructure

**Refuted claim:** `git.yoctoproject.org/yocto-docs` was directly fetched and confirmed to contain zero CI configuration of any kind (it is a documentation repository - manuals, release notes; `grep -i riscv` on the fetched content returns zero matches).

**meta-riscv's GitHub Actions CI does not build or boot riscv64.** Both workflow files were read verbatim from a local clone: `.github/workflows/check-layer.yml` runs `yocto-check-layer-wrapper` on `ubuntu-latest` inside a `debian:12` container - a static layer-compliance/lint check that never invokes QEMU or sets `MACHINE=qemuriscv64`. `.github/workflows/validate-bsp-coverage.yml` runs `tools/validate-bsp-coverage.py`, a lint over BSP config files. Neither compiles or runs riscv64 code.

**The real riscv64 build+boot+ptest CI is Yocto's own Buildbot-based Autobuilder**, configured via `yocto-autobuilder-helper/config.json` at `git.yoctoproject.org` (not GitHub Actions). This was verified by direct raw fetch of the 2120-line file, with confirmed entries:
```
"qemuriscv32" : { "MACHINE": "qemuriscv32", "TEMPLATE": "arch-qemu" }
"qemuriscv64" : { "MACHINE": "qemuriscv64", "TEMPLATE": "arch-qemu" }
"qemuriscv32-tc" : { "MACHINE": "qemuriscv32", "TEMPLATE": "toolchain-qemu" }
"qemuriscv64-tc" : { "MACHINE": "qemuriscv64", "TEMPLATE": "toolchain-qemu" }
"qemuriscv64-ptest" : { "MACHINE": "qemuriscv64", "TEMPLATE": "ptest-qemu" }
```
plus a `yocto-check-layer` invocation listing `qemuriscv32 qemuriscv64` among its `--machines`, and a "Test meta-riscv YP Compatibility" job pulling from `github.com/riscv/meta-riscv`. This file defines target configuration, not a browsable pass/fail dashboard; actual run results surface as Bugzilla "AB-INT" (autobuilder-intermittent) bugs, e.g. [#16409](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16409) and [#15961](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15961).

**RISE runners are not used for Yocto.** The RISE RISC-V Runners fleet (Scaleway EM-RV1 bare-metal, `ubuntu-24.04-riscv` GitHub Actions label, announced March 2026) serves llama.cpp, PyTorch, k0s, Kairos, NumPy, and other projects per its "six weeks in" usage report (May 2026) - Yocto does not appear in that list. The hardware-in-the-loop nightly boot testing mentioned in the RISE Yocto blog post is described as newly-developed, separate infrastructure, not the shared RISE Runners fleet.

**Comparison table:**

| Architecture | Present in Autobuilder `config.json` | Present in `yocto-check-layer` machine list | GitHub Actions build/boot | RISE runner usage |
|---|---|---|---|---|
| amd64 (`qemux86-64`) | Yes | Yes | N/A (no GitHub-hosted core CI) | Not applicable to Yocto |
| arm64 (`qemuarm64`) | Yes | Yes | N/A | Not applicable to Yocto |
| riscv64 (`qemuriscv64`) | Yes (`qemuriscv64`, `-tc`, `-ptest`) | Yes | No (meta-riscv Actions are lint-only) | None recorded |

## 8. Distribution and Release Status

No riscv64 binary/package availability for "Yocto Project" was found through any channel checked: no PyPI package named `yocto-project` exists (404 on `pypi.org/pypi/yocto-project/json` and on the RISE GitLab wheel-builder redirect target); no Ubuntu 26.04 (resolute) package named "Yocto Project" exists in any architecture (zero search results); `yoctoproject.org/downloads/` returned 404. This is consistent with, and expected from, Yocto's nature as a source-based embedded-Linux build framework rather than a distributed binary package - it is not evidence of a functional gap, but it does mean there is no "upstream riscv64 artifact" a chip company could simply download.

**What a user must do to get a working riscv64 target:** clone `poky`, check out a release branch, source `oe-init-build-env`, set `MACHINE = "qemuriscv64"` in `local.conf` (built into `openembedded-core`, no extra layer needed for the QEMU reference target), then `bitbake core-image-minimal`. For real hardware, add the `meta-riscv` layer via `bitbake-layers add-layer` and set `MACHINE` to the specific board (e.g. `beaglev-starlight-jh7100`, `freedom-u540`, `mangopi-mq-pro`).

`meta-riscv` itself is distributed via GitHub (`github.com/riscv/meta-riscv`) and also ships `kas` declarative-CI configs (e.g. `kas/base-riscv.yml`) for reproducible builds.

## 9. Dependencies

The `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) during this research, so structured graph-based verdicts on transitive riscv64 dependency status could not be obtained. The table below reflects what was independently confirmed instead.

| Dependency (role in Yocto) | riscv64 build | riscv64 test | riscv64 release | Notes | Report |
|---|---|---|---|---|---|
| GCC (host build compiler, and Yocto builds its own `gcc-cross-riscv64`) | Unverified via graph; riscv64 backend is upstream/mainline, versions pinned per release (11.x-16.x, see Section 5) | Unverified | Unverified | Core Ubuntu package; no riscv64-specific issue found independent of Yocto's own bugs | not in projects.yml |
| GNU Binutils | Unverified via graph | Unverified | Unverified | None known | not in projects.yml |
| GNU Make (4.0+ required) | Unverified via graph | Unverified | Unverified | None known | not in projects.yml |
| Python 3 (3.9.0+, BitBake's implementation language) | Unverified via graph; CPython riscv64 support has been stable for several releases | Unverified | Unverified | None known | project-reports/python.md |
| python3-jinja2, python3-pexpect, python3-subunit, python3-git | Unverified via graph; pure-Python, architecture-independent | Unverified | Unverified | None known | not in projects.yml |
| python3-websockets (sstate-mirror CDN fetch) | Unverified via graph | Unverified | Unverified | Doc flags this package's minimum version as historically unmet on Debian 11/Ubuntu 22.04 - not confirmed riscv64-specific, but flagged as worth re-checking | not in projects.yml |
| zstd, xz-utils (artifact compression) | Unverified via graph | Unverified | Unverified | None known | project-reports/zstd.md, project-reports/xz.md |
| QEMU (`qemu-system-riscv64`, the reference test target) | Confirmed functional as CI target per `config.json` (Section 7) | Yes - `qemuriscv64-ptest` runs package tests under QEMU | N/A (test tool, not distributed by Yocto) | Boot hangs and Sv39-only ASan limitation are QEMU/kernel interaction issues, not build failures (see Sections 4, 11) | not in projects.yml |
| OpenSBI (RISC-V firmware, `EXTRA_IMAGEDEPENDS`) | Fails to build when `zicsr`/`zifencei` appear in the build path | N/A | N/A | [Bug 15897](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15897) | not in projects.yml |
| Rust (rust-cross-canadian, riscv64 target) | Builds | Fails - kernel segfault in self-test under QEMU riscv64 emulation | N/A | [Bug 15961](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15961), unresolved, reproduced across multiple kernel versions and host OSes | not in projects.yml |

**Deep-dive: QEMU.** `qemu-system-riscv64` is the load-bearing dependency for essentially all riscv64 CI (`qemuriscv64`, `qemuriscv64-ptest`, `qemuriscv64-tc` all run under it). The verified `qemuriscv.inc` config sets `QB_CPU:riscv64 ?= "-cpu rva23s64,pmp=true"` - i.e. QEMU emulates an RVA23-profile CPU by default while runtime packages build for the more conservative `riscv64gc` baseline, a mismatch the RISE blog post identifies as a factor in CI flakiness. QEMU boot itself has an open, unresolved firmware-interaction bug: boots hang at a 1500s timeout with the `fw_jump.elf` BIOS combined with `KERNEL_DEBUG=True`, but succeed with `fw_dynamic.elf` ([Bug 16409](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16409)).

**Deep-dive: Rust.** `rust-cross-canadian` riscv64 support was added in the November 2023 Khem Raj patch series (merged, shipped in Scarthgap). Despite building, the Rust self-test suite triggers a kernel segfault specifically under riscv64 QEMU emulation ([Bug 15961](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15961)) - confirmed to persist across kernel versions 6.12.42 through 6.18.19 and across host OSes (Ubuntu 22.04, Debian 13), and confirmed absent on the equivalent arm64 test path under identical conditions, pointing to a RISC-V-specific emulation or codegen issue rather than a generic flake.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [16409](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16409) | AB-INT: QEMU failed to start (riscv) | ACCEPTED | High (blocks affected CI runs) | Boot hangs with `fw_jump.elf` + `KERNEL_DEBUG=True`; works with `fw_dynamic.elf`. Assigned Trevor Gamblin. |
| [15961](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15961) | AB-INT: qemuriscv64-tc rust self-test kernel segfault | NEW | High - correctness | Reproduced across multiple kernel versions and host OSes; unresolved since Sept 2025. Assigned Harish Sadineni. |
| [15897](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15897) | OpenSBI recipe fails if zicsr/zifencei in build path | ACCEPTED | Medium - build fragility | Overly broad grep in OpenSBI's compiler-support probe; assigned Trevor Gamblin. |
| [15338](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15338) | ASan self-test / riscv64 host support | IN PROGRESS | Medium - security tooling gap | Open since Jan 2024; blocked in part by Sv39-only ASan allocator support. |
| [16133](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16133) | Native sstate reuse not tested between riscv and other targets | NEW | Medium - test coverage gap | Follow-up to resolved Bug 16132; unassigned. |
| [15878](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15878) | linux-yocto does not build for qemuriscv32 | NEW | High for riscv32 | riscv32 is Secondary tier, non-gating. |
| [15826](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15826) | Disabling multilib for riscv targets | NEW | Medium | |
| [15433](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15433) | qemuriscv32 incompatible with testimage | NEW | Medium for riscv32 | |
| [16270](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16270), [16215](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16215), [16162](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16162), [16146](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16146) | AB-INT ptest failures: gstreamer, libpng, gnutls, gstreamer aggregator timeout | NEW | Low-Medium - flaky package tests | Consistent with QEMU-under-load flakiness rather than deterministic defects. |
| [15886](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15886) | QEMU riscv: fix skipped ptest test-nested-aio-poll | NEW | Low | |
| [666](https://github.com/riscv/meta-riscv/issues/666) | meta-riscv: turning on DCO requirement | Open | Policy, not technical | Org-wide DCO bot activation, Aug 2026. |
| [465](https://github.com/riscv/meta-riscv/issues/465) | mesa-pvr on VisionFive2 missing Vulkan extensions | Open | Medium (graphics-stack gap) | |
| [245](https://github.com/riscv/meta-riscv/issues/245) | `poweroff` returns OpenSBI dump, shell hangs on qemuriscv64/32 | Open | Low-Medium | |
| [112](https://github.com/riscv/meta-riscv/issues/112) | `bitbake -c testimage` fails for qemuriscv64 | Open | Medium | |

**Correctness bugs highlighted separately:** Bug 15961 (Rust kernel segfault, confirmed RISC-V-specific by absence on arm64) and Bug 16409 (QEMU boot hang under specific firmware/debug combination) are the two live, unresolved correctness/reliability issues with the most direct impact on whether a riscv64 CI run can be trusted; both remain open as of the most recent update in this research (July-August 2026).

## 12. Objections and Upstream Blockers

**Technical blocker - ASan/Sv48/Sv57:** The most substantive unresolved technical disagreement found in this research. Deepthi Hemraj's patch adding riscv64 as a compatible ASan host relied on disabling SV48/SV57 virtual-address-scheme support in QEMU's `target/riscv/csr.c`, since ASan support only exists for SV39. Richard Purdie and Randy MacLeod rejected this as a temporary workaround rather than a real fix, and questioned modifying QEMU's VA ranges without the change being genuinely upstreamed to QEMU itself ([discussion](https://patchwork.yoctoproject.org/comment/17337/)). Bug 15338 has remained open since January 2024 as a result.

**Technical blocker - toolchain fragility around composable ISA strings:** Bug 15897 (OpenSBI's `zicsr`/`zifencei` grep misdetection) and the `KERNEL_FEATURES_RISCV` patch both stem from RISC-V's expanding, composable ISA-extension naming straining build tooling originally written for simpler, fixed architecture strings.

**Acknowledged coverage gap, not disputed:** core maintainer Alexander Kanavin flagged (Bug 16133) that no test validates native sstate reuse between RISC-V and other target architectures, directly after a real bug (16132, resolved) was found in that exact area; Richard Purdie affirmed the invariant the missing test would enforce ("natives should never change hashes regardless of target machine") but no one has yet written the test.

**Organizational stance:** No objections to RISC-V as an architecture were found; the opposite signal dominates - RISC-V International's Platinum membership (June 2025) and RISE's funded engineering work (BayLibre/Trevor Gamblin) indicate active institutional investment. The project's own framing explicitly welcomes new-architecture contribution. Acceptance probability for further riscv64 improvements is high: riscv64 is already Primary tier and merge-gating; remaining friction is about CI reliability and coverage depth, not about whether the architecture belongs in the project.

## 13. Readiness Assessment

- **Color:** blue (no color_case subtype - blue is not further subdivided in the model)
- **Release provider:** none - no upstream riscv64 binary/image artifact is published for general download; this is a structural property of Yocto being a source-based build framework rather than a gap, but it is why the project does not qualify for green.
- **Optimization gap:** N/A - Yocto Project (BitBake/openembedded-core) is a build framework, not an optimization-purpose project; the Step 2 modifier does not apply.
- **Justification:** riscv64 is documented as a Primary-tier architecture in Yocto's supported-features table, meaning the Autobuilder runs dedicated daily builds and gates `openembedded-core` merges on riscv64 regressions. This was independently confirmed by directly fetching `yocto-autobuilder-helper/config.json`, which defines real build, toolchain, and ptest targets (`qemuriscv64`, `qemuriscv64-tc`, `qemuriscv64-ptest`) - i.e. CI builds AND runs the test suite, not build-only. Because upstream does not publish a consumable riscv64 binary artifact (no images, no packages - by design, since Yocto is a build framework), the release criterion for green is not met, capping the color at blue. See [supported-features documentation](https://docs.yoctoproject.org/dev/ref-manual/yocto-project-supported-features.html) and the [verified config.json fetch](https://git.yoctoproject.org/yocto-autobuilder-helper/plain/config.json) cited in Section 7.
- **Pending work that could change the grade:** none of the currently open work items would raise this above blue, since the ceiling is set by the absence of an upstream binary artifact rather than by CI quality. Two threads are worth tracking for stability within blue: (1) RISE/BayLibre's ongoing triage of AB-INT flakiness (Bugs 16409, 15961, and the ptest failures in Section 11), which if left unresolved risks the Autobuilder treating riscv64 as unreliable enough to reconsider its merge-gating status; (2) `meta-riscv` PR #676 (BSP deprecation/consolidation) and the org-wide DCO policy (#666), which are maintenance-health signals for the community layer rather than core-tier changes.

## 14. Investment Analysis

RISE (via BayLibre, primarily Trevor Gamblin) is already funding: triage of intermittent `qemuriscv64` Autobuilder failures, `meta-riscv` layer maintenance (new BSPs, deprecating stale vendor kernel forks), and development of new hardware-in-the-loop nightly boot-test infrastructure ([RISE blog](https://riseproject.dev/2026/06/05/improving-risc-v-support-in-the-yocto-project/)). The items below are scoped to avoid duplicating that funded work.

### 14.1 Functional Enablement
- Fix the QEMU boot hang under `fw_jump.elf` + `KERNEL_DEBUG=True` ([Bug 16409](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16409)) - already assigned to Trevor Gamblin (RISE-funded); a chip company could contribute reproduction hardware/traces rather than duplicate engineering.
- Root-cause and fix the Rust self-test kernel segfault under riscv64 QEMU emulation ([Bug 15961](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15961)) - unresolved for a year, assigned but no confirmed fix; this is a correctness issue, not merely flakiness, and is not confirmed as RISE-funded work.
- Fix `linux-yocto` build failure for `qemuriscv32` ([Bug 15878](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15878)) and `qemuriscv32`/`testimage` incompatibility ([Bug 15433](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15433)) - relevant only if 32-bit RISC-V matters to the evaluating company; riscv32 is Secondary tier and non-gating today.

### 14.2 Performance Optimization
- Resolve the ASan Sv48/Sv57 limitation with a real upstream QEMU fix rather than the rejected VA-range workaround ([Bug 15338](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15338)) - stalled since January 2024, no current owner driving it to completion.
- Add sstate native-reuse test coverage between riscv64 and other targets ([Bug 16133](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16133)) - small, well-scoped test-infrastructure gap explicitly acknowledged by a core maintainer.
- Quantify actual Yocto-on-riscv64 build times: no project-specific benchmark data exists today; only generic RISC-V hardware data (Fedora binutils ~4-5x slower than x86_64) is available. Producing real Yocto Autobuilder timing data (build and boot) would materially improve the CI-timeout-tuning work RISE is already doing.

### 14.3 CI/CD Infrastructure
- RISE is already building hardware-in-the-loop nightly boot-test infrastructure; a chip company's marginal contribution here would be RVA23-compliant hardware capacity for the shared Autobuilder workers, which the RISE post identifies as the actual bottleneck (QEMU emulation mismatch between the RVA23S64 CPU profile and riscv64gc-built packages).
- No RISE Runners fleet capacity is currently allocated to Yocto; if faster/more numerous native riscv64 CI hosts would help, this is a gap RISE has not yet filled for this specific project.

### 14.4 Ecosystem Enablement
Not applicable in the PyPI/npm/Maven sense (Section 10 omitted - see below). The closest analog, `meta-riscv` BSP coverage, is already under active RISE-funded maintenance (new RVA23 BSPs, deprecation of stale vendor forks per PR #676).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Root-cause and fix Rust self-test kernel segfault on qemuriscv64 (Bug 15961) | 3-6 | Unassigned beyond current triage owner | High |
| Functional | Resolve QEMU boot hang with fw_jump.elf + KERNEL_DEBUG (Bug 16409) | 1-3 | Trevor Gamblin / RISE (already assigned) | Medium |
| Performance | Real (non-workaround) fix for ASan Sv48/Sv57 support (Bug 15338) | 4-8 | Unassigned, stalled since Jan 2024 | Medium |
| CI/CD | sstate native-reuse test coverage for riscv-vs-other targets (Bug 16133) | 1-2 | Unassigned | Low-Medium |
| CI/CD | Quantify Yocto-specific riscv64 build/boot timing data to inform timeout tuning | 1-2 | Not currently funded | Medium |
| Functional (riscv32, optional) | Fix linux-yocto build failure and testimage incompatibility for qemuriscv32 | 2-4 | Unassigned, Secondary tier | Low (only if riscv32 matters to the company) |

## 15. Updates

No updates yet - initial report dated 2026-09-08.

## 16. References

- [Yocto Project Supported Architectures and Features](https://docs.yoctoproject.org/dev/ref-manual/yocto-project-supported-features.html)
- [Yocto Project system requirements (ref-manual)](https://docs.yoctoproject.org/ref-manual/system-requirements.html)
- [Yocto Project QEMU dev-manual page](https://docs.yoctoproject.org/dev-manual/qemu.html)
- [Yocto Autobuilder Helper config.json (git.yoctoproject.org, raw)](https://git.yoctoproject.org/yocto-autobuilder-helper/plain/config.json)
- [Bugzilla 16409 - AB-INT: QEMU failed to start (riscv)](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16409)
- [Bugzilla 15961 - AB-INT: qemuriscv64-tc rust self-test kernel segfault](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15961)
- [Bugzilla 15897 - OpenSBI zicsr/zifencei build failure](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15897)
- [Bugzilla 15338 - Address Sanitizer Self Test (riscv64 host support)](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15338)
- [Bugzilla 16133 - native sstate reuse not tested between risc-v and other targets](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16133)
- [Bugzilla 15878 - linux-yocto does not build for qemuriscv32](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15878)
- [Bugzilla 15826 - Disabling multilib for riscv targets](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15826)
- [Bugzilla 15433 - qemuriscv32 incompatible with testimage](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15433)
- [Bugzilla 15691 - GCC ASan Sv39 default profile fix](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15691)
- [Bugzilla 16270 - gstreamer ptest failure](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16270)
- [Bugzilla 16215 - libpng ptest failure](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16215)
- [Bugzilla 16162 - gnutls ptest failure](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16162)
- [Bugzilla 16146 - gstreamer aggregator ptest timeout](https://bugzilla.yoctoproject.org/show_bug.cgi?id=16146)
- [Bugzilla 15886 - QEMU riscv skipped ptest test-nested-aio-poll](https://bugzilla.yoctoproject.org/show_bug.cgi?id=15886)
- [Bugzilla search: riscv](https://bugzilla.yoctoproject.org/buglist.cgi?quicksearch=riscv)
- [Patchwork: Add riscv64 build host support (cover letter)](https://patchwork.yoctoproject.org/project/oe-core/cover/cover.1698951553.git.raj.khem@gmail.com/)
- [Patchwork: linux-yocto/5.15 riscv64 drop MAXPHYSMEM_128GB](https://patchwork.yoctoproject.org/project/oe-core/patch/4a4203b2fa0c711eedbd2d5a96e3679f1563dfca.1646443420.git.bruce.ashfield@gmail.com/)
- [Patchwork: linux-yocto/6.12 riscv TUNE_FEATURES based KERNEL_FEATURES](https://patchwork.yoctoproject.org/project/oe-core/patch/1751492664-12569-6-git-send-email-mark.hatle@kernel.crashing.org/)
- [Patchwork: gcc-sanitizers riscv64 host discussion](https://patchwork.yoctoproject.org/comment/17337/)
- [Patchwork: relocate KERNEL_FEATURES_RISCV](https://patchwork.yoctoproject.org/comment/35230/)
- [meta-riscv PR #676 - DEPRECATED.md BSP consolidation](https://github.com/riscv/meta-riscv/pull/676)
- [meta-riscv PR #679](https://github.com/riscv/meta-riscv/pull/679)
- [meta-riscv PR #678 - u-boot-k3 openssl 4.x fix](https://github.com/riscv/meta-riscv/pull/678)
- [meta-riscv PR #675 - star64 kas filename fix](https://github.com/riscv/meta-riscv/pull/675)
- [meta-riscv Issue #666 - DCO requirement](https://github.com/riscv/meta-riscv/issues/666)
- [meta-riscv Issue #465 - mesa-pvr VisionFive2](https://github.com/riscv/meta-riscv/issues/465)
- [meta-riscv Issue #245 - poweroff hang](https://github.com/riscv/meta-riscv/issues/245)
- [meta-riscv Issue #112 - testimage fails for qemuriscv64](https://github.com/riscv/meta-riscv/issues/112)
- [meta-riscv Issue #69 - experimental libstdc++ for baremetal riscv64](https://github.com/riscv/meta-riscv/issues/69)
- [meta-riscv issue tracker](https://github.com/riscv/meta-riscv/issues)
- [meta-riscv check-layer.yml workflow](https://github.com/riscv/meta-riscv/blob/master/.github/workflows/check-layer.yml)
- [meta-riscv validate-bsp-coverage.yml workflow](https://github.com/riscv/meta-riscv/blob/master/.github/workflows/validate-bsp-coverage.yml)
- [RISE: Improving RISC-V Support in the Yocto Project](https://riseproject.dev/2026/06/05/improving-risc-v-support-in-the-yocto-project/)
- [RISC-V International and RISE Project join forces for Yocto Project support](https://riscv.org/blog/risc-v-international-and-the-rise-project-join-forces-for-yocto-project-support/)
- [RISE members page](https://riseproject.dev/members/)
- [RISE Software Optimization Guide (GitLab)](https://gitlab.com/riseproject/riscv-optimization-guide)
- [openembedded-core qemuriscv64.conf](https://github.com/openembedded/openembedded-core/blob/master/meta/conf/machine/qemuriscv64.conf)
- [openembedded-core arch-riscv.inc](https://github.com/openembedded/openembedded-core/blob/master/meta/conf/machine/include/riscv/arch-riscv.inc)
- [openembedded-core tune-riscv.inc](https://github.com/openembedded/openembedded-core/blob/master/meta/conf/machine/include/riscv/tune-riscv.inc)
- [openembedded-core qemuriscv.inc](https://github.com/openembedded/openembedded-core/blob/master/meta/conf/machine/include/riscv/qemuriscv.inc)
- [openembedded-core cmake.bbclass](https://github.com/openembedded/openembedded-core/blob/master/meta/classes-recipe/cmake.bbclass)
- [Praqma/yocto-build-container Dockerfile (community, not official)](https://github.com/Praqma/yocto-build-container/blob/master/Dockerfile)
- [Marcin Juszkiewicz - RISC-V is sloooow](https://marcin.juszkiewicz.com.pl/2026/03/10/risc-v-is-sloooow/)
- [Phoronix - Current RISC-V CPUs Too Slow for Fedora](https://www.phoronix.com/news/RISC-V-Slow-Fedora-Packages)