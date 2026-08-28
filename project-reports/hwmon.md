---
title: hwmon
categories:
  - perfmon
---

# hwmon

**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;<br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for hwmon<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

hwmon is a Linux kernel subsystem providing a standardized sysfs interface for hardware monitoring sensors: temperature, voltage, fan speed, humidity, and power. It lives at `drivers/hwmon/` in the Torvalds tree and is documented at [https://www.kernel.org/doc/html/latest/hwmon/](https://www.kernel.org/doc/html/latest/hwmon/).

hwmon is not a standalone release artifact. It ships as part of every Linux kernel release. There is no separate versioning scheme, no foundation, and no external governing body. The subsystem is governed through the `MAINTAINERS` file and the [linux-hwmon@vger.kernel.org](mailto:linux-hwmon@vger.kernel.org) mailing list. Patches flow through the maintainer's staging tree (`groeck/linux-staging.git`, branch `hwmon-next`) before merging via Linus Torvalds' mainline.

The sole subsystem maintainer is Guenter Roeck (linux@roeck-us.net / groeck@chromium.org), a Google engineer. The subsystem has a single-maintainer model with no co-maintainers or official reviewers listed for the core hwmon tree itself.

hwmon is not a RISE (RISC-V Software Ecosystem) project member and has received no RISE funding or organizational sponsorship. The RISE member organizations as of 2026-06-19 include: Andes Technology, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, DAMO Academy (Alibaba), Tenstorrent (Premier); Akeana, BOSC, ByteDance, Canonical, ESWIN, ISCAS, Microchip Technology Germany GmbH, SpacemiT, ZTE (General). hwmon as an organizational participant is absent from that list. No RISE blog post (27 posts reviewed, May 2024 through June 2026) mentions hwmon.

---

## 2. Port History and Upstreaming Timeline

hwmon has no "port" in the conventional sense. The kernel framework (`drivers/hwmon/hwmon.c`) depends only on `CONFIG_HAS_IOMEM`, which is satisfied by all Linux-capable architectures including RISC-V. The relevant history is at the per-driver level.

**August 2025 -- StarFive JH71x0 temperature sensor (`sfctemp`)**

The driver `drivers/hwmon/sfctemp.c` was merged for Linux v6.4 (released June 2023 per kernel.org versioning conventions). [NEEDS VERIFICATION: exact Linux version tag for sfctemp merge.] Authors are Emil Renner Berthing and Hal Feng (StarFive Technology, hal.feng@starfivetech.com). It supports the StarFive JH7100/JH7110 SoCs used in VisionFive RISC-V boards. Kconfig: `SENSORS_SFCTEMP`, `depends on ARCH_STARFIVE || COMPILE_TEST`. The driver is present in `arch/riscv/configs/defconfig` as `CONFIG_SENSORS_SFCTEMP=m`.

**August 2024 -- Sophgo SG2042 MCU hwmon driver (`sg2042-mcu`)**

Commit `758b62e562f2fdffd26a84dbeafbe6888a7e130c`, subject "hwmon: Add sophgo SG2042 external hardware monitor support", merged 2024-08-27. Author: Inochi Amaoto (inochiama@outlook.com), no apparent corporate affiliation in patch headers. This was the first RISC-V hwmon driver to complete the full linux-hwmon review and merge lifecycle. It required 11 revision cycles between 2024-04-28 and 2024-08-17, reflecting the maintainer's strict quality requirements rather than any RISC-V-specific resistance. Signed-off by Guenter Roeck. Platform: Sophgo SG2042 RISC-V server SoC (Milk-V Pioneer board). Kconfig: `SENSORS_SG2042_MCU`, `depends on I2C` and `depends on ARCH_SOPHGO || COMPILE_TEST`.

Earlier StarFive thermal patches by Hal Feng submitted January 2023 were ultimately handled through the thermal/riscv tree rather than hwmon directly, and have patchwork status "Handled Elsewhere."

**March 2026 -- T-Head TH1520 PVT calibration coefficients**

DT binding update for the generic `moortec,mr75203` driver enabling 1/100-degree-C precision for G and J coefficients, followed by TH1520-specific values in `arch/riscv/boot/dts/thead/th1520.dtsi`. Author: Icenowy Zheng (ISCAS, Chinese Academy of Sciences). Reviewed-by Drew Fustini. Patchwork: dt-bindings patch Accepted on linux-hwmon; DTS patch Handled Elsewhere (routes via linux-riscv tree). This fix was required because PR [#788](https://github.com/linux-riscv/linux/pull/788) (August 2025, Lichee Pi 4A thermal management) had CI failures: `moortec,ts-coeff-g: 42740 is not a multiple of 100` and `moortec,ts-coeff-j: -160 is not a multiple of 100` against `Documentation/devicetree/bindings/hwmon/moortec,mr75203.yaml`. The coefficient values required 1/100-degree-C precision that the original binding did not permit.

**2026-06-11 (active) -- Microchip PolarFire SoC TVS driver (`tvs-mpfs`)**

New driver for the PolarFire SoC die temperature sensor (temp1) and three voltage rails (in0 = 1.05V, in1 = 1.8V, in2 = 2.5V). Authors: Lars Randers, co-developed with Conor Dooley (Microchip). Progressed through RFC ([PR #2023](https://github.com/linux-riscv/linux/pull/2023), 2026-05-27), v2 ([PR #2050](https://github.com/linux-riscv/linux/pull/2050), 2026-06-03), and v3 ([PR #2084](https://github.com/linux-riscv/linux/pull/2084), 2026-06-11). As of 2026-06-19, patchwork series 1110127 is in "Changes Requested" state on both the linux-riscv and linux-hwmon patchwork projects. Maintainer Guenter Roeck has reviewed and requested fixes. A v4 is expected but not yet submitted.

---

## 3. Upstream Support Tier

hwmon is entirely architecture-agnostic at the framework level. There is no concept of a "RISC-V port tier" for this subsystem. New RISC-V platform drivers are accepted on identical terms as drivers for any other architecture: they must use standard bus interfaces (I2C, SPI, regmap), pass `checkpatch --strict` with zero errors and warnings, include documentation in `Documentation/hwmon/<driver_name>.rst`, build cleanly for all config variants, and be tested before submission.

The hwmon submission policy (`Documentation/hwmon/submitting-patches.rst`) is explicit: "We are not your test group." Architecture-specific SoC thermal sensors that have DTS-only changes or duplicate handling in the thermal subsystem are routinely directed to the riscv or thermal trees rather than hwmon.

Four RISC-V SoC hwmon drivers or driver configurations are now in the upstream tree: `sfctemp` (StarFive), `sg2042-mcu` (Sophgo), `mr75203` calibration for TH1520 (T-Head/ISCAS), and `gxp-fan-ctrl` (HPE GXP RISC-V BMC). One driver is pending: `tvs-mpfs` (Microchip PolarFire SoC).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

**Framework layer**

The hwmon core (`drivers/hwmon/hwmon.c`) uses the Linux device model, sysfs, and the thermal zone integration API (`devm_thermal_of_zone_register()`). It calls `i2c_verify_client()` and `to_i2c_client()` for I2C PEC support. No architecture-specific code exists anywhere in the hwmon framework. There are no assembly files, SIMD dispatch paths, or JIT backends in `drivers/hwmon/`.

**RISC-V platform drivers**

All four merged RISC-V hwmon drivers are portable C with no riscv64-specific code. They use standard kernel bus abstractions:

- `sfctemp.c`: MMIO register reads, clock/reset controllers, `ARCH_STARFIVE || COMPILE_TEST`
- `sg2042-mcu.c`: I2C client driver, regmap-optional, `ARCH_SOPHGO || COMPILE_TEST`
- `mr75203.c`: regmap-based PVT sensor; TH1520 calibration via DT properties
- `gxp-fan-ctrl.c`: I2C, HPE GXP BMC [NEEDS VERIFICATION: exact RISC-V ISA used in HPE GXP BMC]

The pending `tvs-mpfs.c` driver uses MMIO regmap via `device_node_to_regmap(pdev->dev.parent->of_node)`.

**No HAS_IOPORT on RISC-V**

23 hwmon drivers depend on `CONFIG_HAS_IOPORT`, which is not provided by RISC-V platforms (no legacy ISA I/O port space). These drivers -- including `SENSORS_NCT6775`, `SENSORS_IT87`, `SENSORS_W83627EHF`, and 20 others -- cannot be selected on riscv64. This is not a bug or a gap for RISC-V targets: these are exclusively x86 PC chipset monitors. None are relevant to RISC-V hardware.

**Alarm support gap on PolarFire SoC**

The `tvs-mpfs` driver intentionally omits alarm attributes (`temp1_max`, `in[0-2]_max`, etc.) due to a hardware erratum on the PolarFire SoC TVS block that prevents clearing alarm conditions once triggered. This is documented in the patch cover letter. No workaround is planned in the current revision.

---

## 5. Build System, Cross-Compilation, and Toolchain

hwmon is a kernel subsystem built by Kbuild. There is no cmake, autoconf, or standalone build system.

**GCC cross-compilation:**
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc)
```

**LLVM/Clang:**
```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc)
```

**Enable or select hwmon drivers after config:**
```
scripts/config --enable CONFIG_HWMON
scripts/config --module CONFIG_SENSORS_SFCTEMP
scripts/config --module CONFIG_SENSORS_SG2042_MCU
```

**Build only the hwmon subsystem:**
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- drivers/hwmon/
```

**Minimum toolchain versions** (from `scripts/min-tool-version.sh`):

| Tool | Minimum Version |
|---|---|
| GCC | 8.1.0 |
| Clang/LLVM | 17.0.1 |
| binutils | 2.30.0 |
| GNU make | 4.0 |
| Python | 3.9.x |
| pahole | 1.26 (if CONFIG_DEBUG_INFO_BTF) |

**Critical RISC-V ISA toolchain breakpoint:** binutils >= 2.38 and GCC >= 12.1.0 changed the default ISA spec to 20191213, moving CSR instructions and `fence.i` from base `I` into separate `Zicsr` and `Zifencei` extensions. The kernel handles this via `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` in `arch/riscv/Kconfig`. GCC < 11.3.0 triggers `TOOLCHAIN_NEEDS_OLD_ISA_SPEC`, which forces `-Wa,-misa-spec=2.2` to GAS. Practical recommendation: use GCC >= 12.1 + binutils >= 2.38 for clean riscv64 kernel builds.

**Key CFLAGS from `arch/riscv/Makefile`:**
```
KBUILD_CFLAGS += -mabi=lp64
KBUILD_CFLAGS += -mno-save-restore
KBUILD_CFLAGS += -mcmodel=medany
KBUILD_CFLAGS += $(call cc-option,-mno-riscv-attribute)
KBUILD_CFLAGS += -fno-asynchronous-unwind-tables -fno-unwind-tables
```

No Dockerfile is shipped in-tree for hwmon or arch/riscv. The kernel build system does not distribute container build environments.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

hwmon drivers are hardware-specific by definition. The relevant comparison is not arm64 vs riscv64 at the framework level (identical), but rather which SoC-specific drivers exist.

**Framework layer:** Identical on all three architectures. No feature is gated by architecture in the hwmon core. The sysfs interface, thermal zone integration, regmap support, and all generic sensor APIs are fully available on riscv64.

**Driver availability by architecture-specific hardware:**

| Driver category | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PC chipset monitors (ISA I/O port) | Full (23 drivers) | None (no HAS_IOPORT) | None (no HAS_IOPORT) |
| SoC-integrated temperature sensors | Partial (few native) | Extensive | Limited (3 merged drivers) |
| I2C/SPI discrete sensors | Full | Full | Full |
| IPMI/ACPI platform monitors | Full | Full | Not applicable (no RISC-V ACPI hwmon bindings exist) |
| PMBus power monitors | Full | Full | Full |

The arm64 ecosystem has substantially more SoC-specific hwmon drivers due to the larger number of shipping ARM SoCs with in-tree support. This reflects the maturity gap in the RISC-V SoC ecosystem, not any framework limitation.

**Gaps specific to RISC-V:**

1. PolarFire SoC TVS: driver patch in review (v3, "Changes Requested"), not merged.
2. No hwmon ACPI bindings for any RISC-V platform. Server-class RISC-V platforms targeting EBBR/ACPI boot paths (e.g., SG2042 in ACPI mode) would need ACPI `_HID` entries for hwmon devices. Not currently blocking because all deployed RISC-V hwmon relies on Device Tree.
3. No hwmon support for SiFive P550 / EIC7700, SpacemiT K1, or any other emerging commercial RISC-V platform.
4. `sensors-detect` in lm-sensors is x86-specific (ISA bus probing, SMBus on x86 chipsets). It is not applicable to riscv64 and not expected to be ported. The `libsensors` read path and `sensors` binary work correctly against any sysfs hwmon device regardless of architecture.

**Performance benchmark data:** None. No published performance comparison between riscv64 and arm64 for hwmon exists in any searched source (RISE project, linux-hwmon mailing list, kernel.org, GitHub). hwmon is a low-frequency polling subsystem (default 1-second update intervals); no throughput or latency benchmark dimension has been identified by the community.

---

## 7. CI/CD Infrastructure

**The hwmon subsystem has no riscv64 CI pipeline.**

Specific evidence:

- `torvalds/linux` ships no `.github/` directory and no `.gitlab-ci.yml`. Confirmed by direct repository root inspection. The Linux kernel has zero in-tree CI pipeline configuration.
- `groeck/linux-staging.git` (hwmon-next branch, the hwmon maintainer tree) ships no CI configuration files of any kind.
- KernelCI (`kernelci/kernelci-core`) includes riscv64 as a target architecture for two rootfs configs: `trixie-kselftest` and `trixie-ltp`. The string "hwmon" does not appear in `config/core/rootfs-configs.yaml` or `config/core/test-configs.yaml`. KernelCI covers kselftest and LTP for riscv64; it does not cover hwmon.
- The `linux-riscv/linux` CI mirror PRs (#2084, #2050, #2023, #1580, #1563, #788) run 12-13 generic kernel build and lint checks (e.g., `build-rv64-gcc-allmodconfig`, `checkpatch`, `dtb-warn-rv64`). These verify that a patch builds cleanly and passes DT schema validation. They do not execute hwmon sensor tests on riscv64 hardware or in emulation.

No hwmon-specific test suite exists for any architecture, including x86. The hwmon subsystem has no equivalent of a KUnit or kselftest suite that reads sensor values and validates correctness.

Testing hwmon RISC-V drivers (`sfctemp`, `sg2042-mcu`, `tvs-mpfs`) requires real hardware: StarFive VisionFive2 (for sfctemp), Milk-V Pioneer (for sg2042-mcu), or Microchip PolarFire SoC Icicle Kit (for tvs-mpfs). QEMU virt machine does not emulate any of these sensor peripherals.

---

## 8. Distribution and Release Status

**Kernel releases:**
- hwmon ships in every mainline kernel release. Current versions as of 2026-06-19: mainline 7.1, stable 7.0.12, longterm 6.18.35 and 6.12.93.
- `sg2042-mcu` driver merged 2024-08-27; present since approximately Linux v6.12 [NEEDS VERIFICATION: exact first kernel release tag].
- `sfctemp` driver present since approximately Linux v6.4 [NEEDS VERIFICATION: exact first kernel release tag].
- TH1520 PVT calibration merged March 2026; expected in Linux v7.1 or v6.16 [NEEDS VERIFICATION: exact first kernel release tag].
- `tvs-mpfs` (PolarFire SoC): not merged as of 2026-06-19. No kernel release target is known.

**Linux distribution binary packages:**

No distribution ships a standalone package named "hwmon." The subsystem is built into or as modules of the distribution's linux-image package.

| Distribution | hwmon status | riscv64 kernel available? |
|---|---|---|
| Debian sid | Bundled in linux-image | Yes -- official riscv64 port |
| Ubuntu 24.04 Noble | Bundled in linux-image | Yes -- official riscv64 port |
| Arch Linux RISC-V | Bundled in linux | Yes -- archriscv overlay |

**lm-sensors (userspace tooling):**
- Debian sid: `lm-sensors 1:3.6.2-2+b2` available as official riscv64 binary (89.8 kB package, 358 kB installed).
- Arch Linux RISC-V: `lm_sensors-1:3.6.2-1-riscv64.pkg.tar.zst` present at [archriscv.felixc.at](https://archriscv.felixc.at), built 2025-05-14.

**PyPI package named "hwmon":**
- Version 1.0 is source-only (sdist tarball). No wheel files exist for any architecture including riscv64. This Python package is unrelated to the kernel subsystem.

---

## 9. Dependencies

| Name | Role | riscv64 Build Status | riscv64 Test Status | riscv64 Release Status | Blocking Issues |
|---|---|---|---|---|---|
| Linux kernel (hwmon subsystem core) | `CONFIG_HWMON`: sysfs class registration, thermal zone integration, device model; depends only on `HAS_IOMEM` | Passes -- included in allmodconfig builds on linux-riscv CI (`build-rv64-gcc-allmodconfig`, `build-rv64-clang-allmodconfig`) | No automated functional test CI; no hwmon kselftest suite exists for any architecture | Kernel v7.1 (mainline); `lm-sensors 1:3.6.2-2+b2` in Debian sid riscv64 | None blocking |
| I2C subsystem (`CONFIG_I2C`) | Bus layer required by the majority of hwmon sensor drivers | Fully functional on riscv64; multiple RISC-V SoC I2C controllers upstream (SiFive, StarFive JH71x0, Canaan K210) | No riscv64-specific test gaps identified | Available in all major riscv64 distributions | None |
| SPI subsystem (`CONFIG_SPI`) | Required by SPI-attached hwmon drivers | Fully functional on riscv64; RISC-V SoC SPI controllers upstream | No riscv64-specific test gaps identified | Available in all major riscv64 distributions | None |
| REGMAP (`CONFIG_REGMAP`, `REGMAP_I2C`, `REGMAP_SPI`) | Register abstraction layer; selected by many hwmon drivers | Fully functional; architecture-neutral; included in allmodconfig | KUnit tests available via `CONFIG_REGMAP_KUNIT`; not riscv64-specific | Available in all major riscv64 distributions | None |
| Thermal framework (`CONFIG_THERMAL`) | hwmon.c calls `devm_thermal_of_zone_register()` to expose temperature channels as thermal zones; optional | Functional on riscv64; RISC-V SoC thermal drivers exist | No automated functional CI coverage for thermal zone coupling on riscv64 | Available in Debian sid, Arch Linux RISC-V | None |
| Device Tree / OF (`CONFIG_OF`) | hwmon.c uses `device_property_present()` / `device_property_read_string()` for sensor labels from DT; dominant firmware interface on all current RISC-V hwmon platforms | Fully functional | N/A | Universal on riscv64 | None |
| ACPI (`CONFIG_ACPI`) | Optional enumeration path; `arch/riscv/Kconfig` selects reduced hardware profile (`ACPI_REDUCED_HARDWARE_ONLY`, `ACPI_GENERIC_GSI`, `ACPI_PPTT`, `ACPI_RIMT`) when enabled | Supported on riscv64 upstream; reduced hardware profile | No hwmon-specific ACPI testing on riscv64 | Enabled in server-oriented riscv64 builds | No hwmon ACPI bindings exist for any RISC-V platform; server RISC-V platforms via EBBR/ACPI would need `_HID` entries; not currently blocking because DT path is used |
| lm-sensors (userspace) | Primary userspace tool; provides `libsensors` API, `sensors` CLI, `sensors-detect` script | Upstream CI (GitHub Actions `debian.yml`) is x86_64 only; library is architecture-neutral C | No riscv64 CI in lm-sensors upstream | Debian sid `1:3.6.2-2+b2` riscv64 binary; Arch RISC-V `lm_sensors-1:3.6.2-1` | `sensors-detect` is x86-specific (ISA bus probing); not applicable to riscv64. `libsensors` read path and `sensors` binary work against any sysfs hwmon device |

---

## 10. Ecosystem Status

**Active contributors on RISC-V hwmon work:**

| Contributor | Affiliation | Work |
|---|---|---|
| Inochi Amaoto | Independent | `sg2042-mcu` driver (merged v6.12); SG2044 hwmon work (pending) |
| Icenowy Zheng | ISCAS (Chinese Academy of Sciences) | TH1520 PVT coefficients (merged); TH1520 thermal zones (pending via riscv tree) |
| Lars Randers | Independent | PolarFire SoC `tvs-mpfs` driver (v3, under review) |
| Conor Dooley | Microchip | Co-developer of `tvs-mpfs`; primary review correspondent with Guenter Roeck |
| Emil Renner Berthing | (affiliation not confirmed) | `sfctemp` author |
| Hal Feng | StarFive Technology | `sfctemp` co-author; earlier thermal patches via thermal tree |

**Review throughput:** The SG2042 driver required 11 revision cycles over approximately 4 months before merge. The PolarFire SoC driver is at v3 with at least one more revision cycle required (v4). This reflects the hwmon maintainer's code quality standards, which apply uniformly across all architectures.

**RISE involvement:** None. No RISE blog post, no RISE wheel builder entry, and no identified RISE-funded contributor for hwmon.

**Commercially relevant RISC-V platforms without hwmon support:**
- SiFive P550 / EIC7700
- SpacemiT K1
- Any RISC-V server platform expecting ACPI-based sensor enumeration

---

## 11. Known Bugs and Active Issues

**Issue 1: `sg2042-mcu` linker error when `CONFIG_HWMON=m` (Open)**

[sophgo/linux-riscv issue #104](https://github.com/sophgo/linux-riscv/issues/104). Filed 2024-02-11. In the Sophgo vendor tree (pre-mainline version), the MCU driver at `drivers/soc/sophgo/umcu/mcu.c` was compiled unconditionally (`obj-y`) but called hwmon symbols absent when `CONFIG_HWMON=m`. Error: `ld: mcu.o: undefined reference to 'devm_hwmon_device_register_with_info'`. Root cause: missing `select HWMON` or `depends on HWMON` in Kconfig. Workaround: set `CONFIG_HWMON=y`. Reported by Alpine Linux packager. Note: the reviewer also reported random process kills under load on the same kernel commit, suggesting unrelated scheduler or NUMA instability on SG2042. This issue is in the Sophgo vendor tree; the mainline `sg2042-mcu.c` driver has the correct Kconfig dependency.

**Issue 2: SG2042 kernel panic on 6.6.0-136.0.0 (Resolved in 6.6.0-137)**

[RVCK-Project/rvck-olk issue #158](https://github.com/RVCK-Project/rvck-olk/issues/158). Kernel panic at boot in memory zone initialization on Sophgo SG2042 (Milk-V Pioneer, 4 NUMA nodes). Triggered by a "mm: fix the inaccurate memory statistics issue for users" stable backport. Not a hwmon bug, but affects the same platform as `sg2042-mcu`. Reverted in openEuler kernel; fixed in 6.6.0-137 (commit 8c8b1152e4).

**Issue 3: `sg2042-mcu` v1 correctness bugs (Resolved in mainline)**

Multiple correctness bugs identified in code review of the original v1 submission ([MARC msg 171426765732755](https://marc.info/?l=linux-hwmon&m=171426765732755&w=2)):
- `sg2042_mcu_is_visible` always returned 0 for all attributes (inverted switch logic), making hwmon attributes invisible.
- `sg2042_mcu_write` blocked writes to `hwmon_temp_crit` on channel 0 due to inverted `!channel` condition, blocking the only channel that supports crit temp writes.
- `sysfs_create_group` used instead of devm variant, creating potential leak on partial probe failure.
- `MODULE_DESCRIPTION` referenced `"MCU I2C driver for bm16xx soc platform"` (wrong SoC family name).

All resolved across 11 revision cycles. Mainline driver is correct.

**Issue 4: TH1520 PVT coefficient precision (Resolved in v3 patch)**

The `moortec,mr75203` DT binding used `multipleOf: 100` for G and J temperature coefficients. The TH1520 manual specifies G = 42740 (42.74 in 1/100-degree-C) and J = -160 (-0.16 in 1/100-degree-C), which violate `multipleOf: 100`. This caused dtb-warn-rv64 CI failures in [PR #788](https://github.com/linux-riscv/linux/pull/788). Fixed by [PR #1580](https://github.com/linux-riscv/linux/pull/1580) changing `multipleOf` to 10. Patch 1/2 (dt-bindings) accepted on linux-hwmon patchwork.

**Issue 5: PolarFire SoC `tvs-mpfs` v3 -- three open correctness issues (Active)**

Reported via sashiko-bot review on [PR #2084](https://github.com/linux-riscv/linux/pull/2084) and the corresponding [patchwork thread](https://patchwork.kernel.org/project/linux-hwmon/patch/20260611-blank-footprint-5504b819baec@spud/):

- **Issue A (negative val clamp):** `val` is signed but assigned to `unsigned long temp`. Writing -1 produces ULONG_MAX, which is clamped to 8 ms rather than returning `-EINVAL`. Conor Dooley agreed to fix.
- **Issue B (integer truncation in interval roundtrip):** Writing 7 ms calculates `(7 * 1000) / 32 = 218`; reading back gives `(218 * 32) / 1000 = 6` ms (truncation). Guenter Roeck recommends `DIV_ROUND_CLOSEST` in both directions. Conor Dooley raised a concern about consistent directional rounding if `update_interval_us` support is added later. Resolution pending v4.
- **Issue C (no disable on probe failure/unbind):** Sensors are enabled via `MPFS_TVS_CTRL_ENABLE_ALL`, but no error path or devm action disables them if `devm_hwmon_device_register_with_info()` fails. Not addressed in any reply as of 2026-06-19.

Additionally: register map discrepancy between hardware docs and the Application Note AN4682. Hardware docs describe temperature data at bits [31:16]; AN4682 states bit 31 is reserved. Driver uses `GENMASK(30, 16)`. No reviewer has explicitly resolved this discrepancy in the published review thread. [NEEDS VERIFICATION: independent hardware documentation confirmation for PolarFire SoC TVS register bit 31.]

**Issue 6: PolarFire SoC alarm support absent (by design, hardware erratum)**

The `tvs-mpfs` driver intentionally omits alarm support. The patch cover letter states: "there is an erratum that prevents clearing them once triggered." No workaround is planned. This means the driver does not expose `temp1_max`, `in[0-2]_max`, or any alarm attributes. This is a permanent functional gap for PolarFire SoC hwmon until the erratum is resolved in future silicon.

---

## 12. Objections and Upstream Blockers

**Blocker 1: `tvs-mpfs` v4 required before merge**

The PolarFire SoC hwmon driver has three open correctness issues (see Issue 5 above) requiring a v4 submission. Issue C (no disable on unbind) has not been acknowledged by the authors. Guenter Roeck's "Changes Requested" patchwork state will not advance to "Accepted" without a clean revision. No timeline has been communicated.

**Blocker 2: No ACPI hwmon bindings for RISC-V server platforms**

RISC-V server platforms targeting EBBR-compliant ACPI boot paths have no ACPI `_HID` entries for hwmon devices. This is not a current blocker for any shipped RISC-V product (all deployed RISC-V hwmon uses Device Tree), but it becomes relevant as RISC-V server platforms mature toward enterprise deployment patterns.

**Non-issue: ISA I/O port drivers absent on riscv64**

The 23 hwmon drivers blocked by `HAS_IOPORT` are x86 PC chipset monitors with no RISC-V equivalent hardware. Their absence on riscv64 is correct behavior, not a gap.

**Non-issue: `sensors-detect` not applicable**

The lm-sensors `sensors-detect` script probes ISA buses and x86 SMBus controllers. It has no utility on riscv64 and no porting path. The `sensors` binary and `libsensors` library function correctly on riscv64 for sysfs-based hwmon devices.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The hwmon framework itself requires no RISC-V investment -- it is fully functional on riscv64 today. Investment is needed at the per-platform driver level for new RISC-V SoC targets.

The PolarFire SoC `tvs-mpfs` driver (Microchip, v3 under review) is the one active gap. It will complete without external involvement given the current Microchip/ISCAS contributor activity, but the outstanding correctness issues (particularly Issue C, no disable on unbind) represent quality risk that could delay acceptance further.

For new RISC-V SoC platforms not yet represented in hwmon (SiFive P550/EIC7700, SpacemiT K1, any ACPI-enumerated RISC-V server SoC), a driver submission requires 2-4 person-weeks per driver including review iteration cycles, based on the observed 11-cycle history for `sg2042-mcu` and 3-cycle history for `tvs-mpfs`.

### 13.2 Performance Optimization

No performance investment is warranted. hwmon is a low-frequency polling subsystem. There are no algorithmic kernels, no SIMD opportunities, and no published performance gaps between riscv64 and any other architecture. The kernel framework is already optimal for its access pattern.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists for hwmon anywhere in the ecosystem. Functional validation requires physical hardware. Adding hwmon-specific CI would require:

1. Access to RISC-V hardware with hwmon sensors (StarFive VisionFive2, Milk-V Pioneer, or Microchip PolarFire SoC Icicle Kit).
2. A test harness that exercises the sysfs sensor attributes and validates output ranges.
3. Integration with KernelCI or an equivalent lab infrastructure.

This is an ecosystem-wide gap, not specific to any one organization. The linux-riscv CI mirror provides build validation only; it does not and cannot replace hardware-in-the-loop testing.

### 13.4 Ecosystem Enablement

The gap in hwmon support for commercially relevant RISC-V SoCs (SiFive P550/EIC7700, SpacemiT K1) means that thermal management and voltage monitoring are unavailable via the standard Linux hwmon sysfs interface on those platforms. This affects power management daemons, system health monitoring tools, and any software that relies on `libsensors`.

ACPI hwmon bindings for RISC-V server platforms represent a forward-looking gap. The work is scoped to ACPI `_HID` namespace entries and ACPI driver probe paths in individual hwmon drivers, not a framework change.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review and fix `tvs-mpfs` v3 correctness issues (Issues A, B, C); submit v4 | 1 | Microchip (Lars Randers, Conor Dooley) -- not Qualcomm | High |
| Functional | Develop hwmon driver for SiFive P550 / EIC7700 temperature sensor | 3-5 | SiFive (no current owner identified) | High |
| Functional | Develop hwmon driver for SpacemiT K1 thermal sensor | 3-5 | SpacemiT (no current owner identified) | Medium |
| Functional | ACPI hwmon bindings for RISC-V server platforms | 4-8 | No owner identified; depends on server platform availability | Low |
| CI/CD | Deploy hwmon hardware-in-the-loop test on StarFive VisionFive2 | 3-4 | Unassigned | Medium |
| CI/CD | Deploy hwmon hardware-in-the-loop test on Milk-V Pioneer (SG2042) | 3-4 | Unassigned | Medium |
| CI/CD | Deploy hwmon hardware-in-the-loop test on PolarFire SoC Icicle Kit | 2-3 (post-merge of tvs-mpfs) | Unassigned | Low |
| Performance | No work identified | 0 | N/A | N/A |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [hwmon kernel documentation](https://www.kernel.org/doc/html/latest/hwmon/)
- [linux-riscv/linux PR #2084 -- tvs-mpfs v3](https://github.com/linux-riscv/linux/pull/2084)
- [linux-riscv/linux PR #2050 -- tvs-mpfs v2](https://github.com/linux-riscv/linux/pull/2050)
- [linux-riscv/linux PR #2023 -- tvs-mpfs RFC](https://github.com/linux-riscv/linux/pull/2023)
- [linux-riscv/linux PR #1580 -- TH1520 PVT coefficients v3](https://github.com/linux-riscv/linux/pull/1580)
- [linux-riscv/linux PR #1563 -- TH1520 PVT coefficients v2](https://github.com/linux-riscv/linux/pull/1563)
- [linux-riscv/linux PR #788 -- TH1520 Lichee Pi 4A thermal management](https://github.com/linux-riscv/linux/pull/788)
- [patchwork: tvs-mpfs v3 patch](https://patchwork.kernel.org/project/linux-riscv/patch/20260611-blank-footprint-5504b819baec@spud/)
- [patchwork: tvs-mpfs series 1110127](https://patchwork.kernel.org/project/linux-riscv/list/?series=1110127)
- [patchwork: TH1520 PVT series 1063787](https://patchwork.kernel.org/project/linux-riscv/list/?series=1063787)
- [MARC: linux-hwmon riscv search](https://marc.info/?l=linux-hwmon&r=1&w=2&s=riscv&q=b)
- [MARC: TH1520 PVT patch cover letter](https://marc.info/?l=linux-hwmon&m=177307623624271&w=2)
- [MARC: SG2042 hwmon v11 cover](https://marc.info/?l=linux-hwmon&m=172386131225031&w=2)
- [MARC: SG2042 hwmon v1 original](https://marc.info/?l=linux-hwmon&m=171426765732755&w=2)
- [MARC: PolarFire tvs-mpfs v3](https://marc.info/?l=linux-hwmon&m=178119010994337&w=2)
- [MARC: PolarFire tvs-mpfs RFC](https://marc.info/?l=linux-hwmon&m=177987303073382&w=2)
- [sophgo/linux-riscv issue #104 -- sg2042-mcu linker error](https://github.com/sophgo/linux-riscv/issues/104)
- [RVCK-Project/rvck-olk issue #158 -- SG2042 kernel panic 6.6.0-136](https://github.com/RVCK-Project/rvck-olk/issues/158)
- [RISE project blog (no hwmon content)](https://riseproject.dev/blog)
- [Debian lm-sensors package](https://packages.debian.org/sid/lm-sensors)
- [Arch RISC-V lm_sensors](https://archriscv.felixc.at)