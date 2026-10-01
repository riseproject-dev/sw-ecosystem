---
title: hwmon
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: optional
  - name: dwarves
    relation: build-dependency
    criticality: optional
  - name: dtc
    relation: build-dependency
    criticality: critical
  - name: ACPICA
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="hwmon" %}

# hwmon

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for hwmon<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

hwmon is a Linux kernel subsystem providing a standardized sysfs interface for hardware monitoring sensors: temperature, voltage, fan speed, humidity, and power. It lives at `drivers/hwmon/` in the [torvalds/linux](https://github.com/torvalds/linux) tree and is documented at the [hwmon kernel documentation](https://www.kernel.org/doc/html/latest/hwmon/) and [hwmon.wiki.kernel.org](https://hwmon.wiki.kernel.org/) (the wiki is explicitly archived and no longer updated; mirrored at archive.kernel.org).

hwmon is not a standalone release artifact, has no CMake/autoconf build system, and ships as part of every Linux kernel release. There is no separate versioning scheme, no dedicated foundation, and no formal tier or membership policy. Several premises sometimes assumed about this kind of project (a dedicated foundation, sponsor tiers, RISE membership) do not apply: hwmon is governed the same way any kernel subsystem is, via the `MAINTAINERS` file and the [linux-hwmon@vger.kernel.org](mailto:linux-hwmon@vger.kernel.org) mailing list, under the overall stewardship of the Linux kernel organization (Linux Foundation umbrella), with no separate legal entity, board, or corporate maintainer roster. Patches flow through the maintainer's staging tree (`git://git.kernel.org/pub/scm/linux/kernel/git/groeck/linux-staging.git`, branch `hwmon-next`) before merging into mainline by Linus Torvalds.

The sole subsystem maintainer, per the current `MAINTAINERS` file, is Guenter Roeck (`linux@roeck-us.net`), a Google engineer. hwmon has a single-maintainer model: no co-maintainer or corporate-affiliated maintainer slot is listed for the core tree. License is GPLv2 for kernel code (standard for `drivers/hwmon`); the archived wiki content is CC BY-NC-SA 4.0.

Community stance on new RISC-V ports is active and routine, not exceptional: new SoC hwmon drivers (StarFive, Sophgo, T-Head/ISCAS, Microchip, ESWIN) go through the same RFC -> v2/v3/.../vN -> maintainer-apply cycle used for drivers on any other architecture. There is no RISC-V-specific carve-out, barrier, or separate approval track; review cadence and standards (`checkpatch --strict`, documentation requirement, DT bindings) are identical regardless of target ISA.

hwmon is not a RISE (RISC-V Software Ecosystem) project member and has received no RISE funding, blog coverage, or organizational sponsorship. RISE membership (per [riseproject.dev/members](https://riseproject.dev/members/)) is company-based: Premier members Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General members Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE. hwmon, being a kernel subsystem rather than an organization, cannot itself be a RISE member, and no individual hwmon contribution has been identified as RISE-funded. All RISC-V hwmon driver work (StarFive `sfctemp`, Sophgo `sg2042-mcu`, T-Head/ISCAS PVT calibration, Microchip `tvs-mpfs`, ESWIN EIC7700 PVT) traces to individual vendor/company engineers submitting through the standard linux-hwmon mailing-list process, not to RISE sponsorship. No RISE blog post (27 posts reviewed, May 2024 through July 2026) mentions hwmon, and hwmon does not appear in the RISE Python wheel builder (81 packages listed, hwmon not among them, as expected since it is not a Python package). hwmon appears on the RISE "sw-ecosystem" status-report site only as a tracked readiness-assessment entry, not as a RISE-funded or member project.

## 2. Port History and Upstreaming Timeline

hwmon has no "port" in the conventional sense; the kernel framework (`drivers/hwmon/hwmon.c`) depends only on `HAS_IOMEM`, satisfied by all Linux-capable architectures including RISC-V. The meaningful history is at the per-SoC driver level.

| Date | Event | Source |
|---|---|---|
| 2023-04-19 (applied) / 2023-04-25 (Linus merge, v6.4) | `sfctemp` driver merged, covering **both** StarFive JH7100 and JH7110 in a single commit. Commit [7f2958e8](https://github.com/torvalds/linux/commit/7f2958e845d2c8bf1100dc088dbdc31af2a80fd0), authored by Emil Renner Berthing, co-developed by Samin Guo and Hal Feng (StarFive Technology). Pulled into mainline via "hwmon-for-v6.4" (commit [4173cf6](https://github.com/torvalds/linux/commit/4173cf6fb6b7d1b4569cca08af318c4561356fb5)). First shipping release: v6.4 (2023-06-25). | [commit 7f2958e8](https://github.com/torvalds/linux/commit/7f2958e845d2c8bf1100dc088dbdc31af2a80fd0), [patchwork patch 13182164](https://patchwork.kernel.org/project/linux-hwmon/patch/20230321022644.107027-3-hal.feng@starfivetech.com/) |
| 2023-07-18 / landed 2023-08-14 | riscv DT nodes for JH7100 and JH7110 temperature sensors (`65e4a0f3`, `f2b539af`), authored by Hal Feng, merged via `riscv-dt-for-v6.6` (Conor Dooley). | [commit 65e4a0f3](https://github.com/torvalds/linux/commit/65e4a0f33a5e125d90b1b69d56a9bbdd481e3fcf) |
| 2024-06-05 | riscv defconfig enables `CONFIG_SENSORS_SFCTEMP` et al. for JH7110 (`d8a7d89a`, Hal Feng). | [commit d8a7d89a](https://github.com/torvalds/linux/commit/d8a7d89abb091fe4c1744241c7a40dbad570fd9e) |
| 2024-08-27 (applied) / 2024-09-18 (Linus merge, v6.12) | `sg2042-mcu` I2C hwmon driver merged for Sophgo SG2042 (Milk-V Pioneer), commit [758b62e5](https://github.com/torvalds/linux/commit/758b62e562f2fdffd26a84dbeafbe6888a7e130c), author Inochi Amaoto, no corporate affiliation in patch headers, reviewed by Conor Dooley, tested by Chen Wang. 479 lines added across driver, dt-bindings, docs. Required 11 revision cycles (v1 to v11, July-August 2024), reflecting maintainer quality bar rather than RISC-V-specific resistance. Pulled via "hwmon-for-v6.12" (commit [c27ea95](https://github.com/torvalds/linux/commit/c27ea952c614779db84bc2326e686ba7cc1c865c)). First shipping release: v6.12 (2024-11-17). | [docs.kernel.org/hwmon/sg2042-mcu.html](https://docs.kernel.org/hwmon/sg2042-mcu.html), [LWN coverage](https://lwn.net/Articles/983823/) |
| 2025-02-05 | Post-merge fix: `MODULE_DESCRIPTION`/author tags restored on `sg2042-mcu` after a `make W=1` warning regression (Arnd Bergmann). | [commit 89cb3ca5](https://github.com/torvalds/linux/commit/89cb3ca56cb3192ebd07a2d8eb62e857a42cf83f) |
| March 2026 | T-Head TH1520 PVT calibration (`moortec,mr75203` driver), 1/100-degree-C precision DT binding plus TH1520-specific coefficients, author Icenowy Zheng (ISCAS), reviewed by Drew Fustini. dt-bindings patch accepted on linux-hwmon; DTS patch routed via linux-riscv tree ("Handled Elsewhere" in patchwork). | Local repository record (see Section 11, Issue 4) |
| Jan-Jul 2026 (v1-v9) / merged 2026-07-01 | ESWIN EIC7700 PVT sensor driver (plus DT binding), authored for the SiFive HiFive Premier P550 board (ESWIN EIC7700 SoC). Reviewers flagged a resume/trim correctness defect (hardware trim lost across suspend/resume, causing incorrect readings on wake) and, in v6, a high-priority race in `eic7700_pvt_init_iface()` and a missing `pm_runtime_disable()` in cleanup. All resolved by v9; both driver and DT binding applied by Guenter Roeck on 2026-07-01. This is new RISC-V hwmon hardware support not previously tracked. | [review thread](https://ratatoskr.run/linux-hwmon/2026/06/17192243/t), [reviewer notes](https://ratatoskr.run/sashiko-reviews/2026/06/17190195) |
| 2026-06-29 (applied, v4) / queued linux-next 2026-08-10 | Microchip PolarFire SoC `tvs-mpfs` driver (die temperature + 3 voltage rails) applied by Guenter Roeck, commit `ecc0eb5e9569` in linux-next as of 2026-08-10. Authors Lars Randers and Conor Dooley (Microchip). This resolves the three open correctness issues (signed-value clamp, interval-rounding truncation, no-disable-on-unbind) that were outstanding in v3. **Status upgraded from "Changes Requested" (v3) to merged (v4).** | [linux-next queue entry](https://ratatoskr.run/linux-riscv/2026/06/17186982/t) |

**Correction to prior tracking:** an earlier StarFive "JH7100 temperature sensor" patch series (v1-v3, Emil Renner Berthing, posted June-July 2021) is sometimes cited as merged in 2021. Verified directly against patchwork (series 521423): both patches show state `deferred` with `commit_ref: null`. This series was **never merged standalone** and stalled for roughly two years. `drivers/hwmon/sfctemp.c` has no commit history before 2023; it entered mainline only once, in April 2023, already covering both JH7100 and JH7110 (see table above). Treat any reference to a separate 2021 JH7100-only merge as incorrect.

Five RISC-V SoC hwmon drivers/configurations are now upstream and merged: `sfctemp` (StarFive JH7100/JH7110), `sg2042-mcu` (Sophgo), `mr75203` TH1520 calibration (T-Head/ISCAS), `tvs-mpfs` (Microchip PolarFire SoC, merged v4), and the ESWIN EIC7700 PVT driver. No RISC-V hwmon driver is currently blocked awaiting a maintainer decision as of this writing.

## 3. Upstream Support Tier

hwmon is architecture-agnostic at the framework level; there is no formal "RISC-V tier" policy document. New RISC-V platform drivers are accepted on identical terms to drivers for any other architecture: standard bus interfaces (I2C, SPI, MMIO/regmap), zero `checkpatch --strict` errors/warnings, `Documentation/hwmon/<driver>.rst` documentation, clean builds across config variants, and author testing before submission (`Documentation/hwmon/submitting-patches.rst` states explicitly: "We are not your test group").

Architecture-specific SoC thermal sensors with DTS-only changes, or logic duplicating the generic thermal subsystem, are routinely redirected to the riscv or thermal trees rather than accepted into hwmon directly - this happened to earlier StarFive thermal patches (January 2023, handled via the thermal/riscv tree).

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI gating a release | No (no in-tree CI for hwmon on any architecture, see Section 7) | No | No |
| Official binary artifact | Bundled in distro kernels | Bundled in distro kernels | Bundled in distro kernels (Debian sid, Ubuntu, Arch Linux RISC-V all ship riscv64 kernel builds from unmodified upstream source) |
| Formal tier policy | None | None | None |
| SoC-specific driver count | Few native (mostly PC chipset drivers) | Extensive | 5 merged drivers (`sfctemp`, `sg2042-mcu`, `mr75203`/TH1520, `tvs-mpfs`, ESWIN EIC7700 PVT) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

**Framework layer.** The hwmon core (`drivers/hwmon/hwmon.c`) uses the Linux device model, sysfs, `regmap`, and the thermal-zone integration API (`devm_thermal_of_zone_register()`); it also calls `i2c_verify_client()`/`to_i2c_client()` for I2C PEC support. No architecture-specific code exists anywhere in the hwmon framework: there are no assembly files, no SIMD dispatch paths, and no JIT backends in `drivers/hwmon/`. This was independently re-verified by direct source inspection of `drivers/hwmon/` (no `arch/riscv/hwmon` directory exists, no `.S` files, no vector/SIMD dispatch code tied to hwmon anywhere in `arch/riscv/`). A same-prefix name collision is worth flagging: `arch/riscv/kernel/sys_hwprobe.c` implements the unrelated `riscv_hwprobe(2)` CPU-feature-probing syscall and has nothing to do with the hwmon hardware-monitoring subsystem.

**RISC-V platform drivers.** All merged RISC-V hwmon drivers are portable C with no riscv64-specific code paths, using standard kernel bus abstractions, verified directly against current source:
- `sfctemp.c`: MMIO register reads plus clock/reset controllers; real, complete implementation (not a stub) with an `of_device_id` table matching both `starfive,jh7100-temp` and `starfive,jh7110-temp`; `depends on ARCH_STARFIVE || COMPILE_TEST`.
- `sg2042-mcu.c`: I2C client driver (~250 lines), real probe/hwmon_ops/debugfs implementation; `depends on I2C` and `depends on ARCH_SOPHGO || COMPILE_TEST`.
- `mr75203.c`: regmap-based PVT sensor; TH1520 calibration supplied via DT properties.
- EIC7700 PVT driver: regmap/MMIO-based, tested on the SiFive HiFive Premier P550 board.
- `tvs-mpfs.c`: MMIO regmap via `device_node_to_regmap(pdev->dev.parent->of_node)`; alarm attributes intentionally omitted due to a PolarFire SoC TVS hardware erratum that prevents clearing alarms once triggered.

Kconfig gating for all of these is by **SoC/board** (`ARCH_SOPHGO`, `ARCH_STARFIVE`), not by **CPU architecture** (`RISCV`); the presence of `|| COMPILE_TEST` on each demonstrates these drivers would compile identically on any architecture if the target SoC were not RISC-V-based hardware. In other words, "riscv64 support" for hwmon means "drivers exist for specific RISC-V SoC boards," not "a riscv64-tuned code path of a shared generic algorithm."

**On the full/partial/scalar/missing rubric.** A hand-tuned/intrinsics/scalar-fallback/missing classification, appropriate for SIMD-heavy compute libraries (crypto, codecs, math kernels), does not meaningfully apply to hwmon. There is no SIMD, no intrinsics, no per-ISA compute kernel anywhere in `drivers/hwmon/`; every driver on every architecture hwmon supports is uniformly plain, portable C. If a single label must be assigned for schema consistency: hwmon is **"scalar (C fallback)" on riscv64, identical to amd64 and arm64** - riscv64 is at parity, not behind, because there is no architecture that has anything more than scalar C here.

**No `HAS_IOPORT` on RISC-V.** 23 hwmon drivers depend on `CONFIG_HAS_IOPORT`, not provided by RISC-V platforms (no legacy ISA I/O port space). These drivers - `SENSORS_NCT6775`, `SENSORS_IT87`, `SENSORS_W83627EHF`, and 20 others - cannot be selected on riscv64. This is expected behavior, not a gap: these are exclusively x86 PC chipset monitors with no RISC-V equivalent hardware.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| hwmon core/sysfs/regmap | Scalar C | Scalar C | Scalar C (parity) |
| SIMD/vectorized sensor processing | None (not applicable to this subsystem) | None | None |
| PC chipset (ISA I/O port) drivers | Present (23 drivers) | Absent (no HAS_IOPORT) | Absent (no HAS_IOPORT) |
| SoC-integrated sensor drivers | Few native | Extensive | 5 merged drivers |

## 5. Build System, Cross-Compilation, and Toolchain

hwmon is built entirely by Kbuild/Kconfig/Makefile. There is no CMake, autoconf, `configure` script, or `-DUSE_X=OFF`-style CMake flag anywhere in the kernel tree, and **no Dockerfile exists anywhere in the kernel tree** (verified by direct inspection of the kernel root and `arch/riscv/`). The Kconfig-equivalent of a build flag is `depends on`/`select` gating (see Section 4 and the x86 `HAS_IOPORT` note).

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

**Enable/select hwmon drivers after config:**
```
scripts/config --enable CONFIG_HWMON
scripts/config --module CONFIG_SENSORS_SFCTEMP
scripts/config --module CONFIG_SENSORS_SG2042_MCU
```

**Build only the hwmon subsystem:**
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- drivers/hwmon/
```

**Minimum toolchain versions** (from `scripts/min-tool-version.sh` and `Documentation/process/changes.rst`, verified against current master):

| Tool | Minimum | Why |
|---|---|---|
| GCC | 8.1.0 | Kbuild's absolute floor; older GCC versions miss compiler builtins/attributes Kbuild relies on |
| Clang/LLVM | 17.0.1 | Floor for `LLVM=1` full-LLVM builds |
| GNU binutils | 2.30 | General Kbuild floor |
| GNU make | 4.0 | Kbuild parallel/pattern-rule features |
| Python | 3.9.x | Kconfig/kunit tooling |
| dwarves (pahole) | 1.26 | Only required if `CONFIG_DEBUG_INFO_BTF=y` |
| Bash | 4.2 | Build scripts |
| Bison / Flex | 2.0 / 2.5.35 | Kconfig parser generation |

**RISC-V-specific toolchain breakpoint** (from `arch/riscv/Kconfig`, quoted verbatim):
```
config TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI
    def_bool y
    depends on AS_IS_GNU && AS_VERSION >= 23600

config TOOLCHAIN_NEEDS_OLD_ISA_SPEC
    def_bool y
    depends on TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI
    depends on CC_IS_GCC && GCC_VERSION < 110300
```
binutils >= 2.36 switched the default ISA spec to 20191213, splitting `fence.i`/CSR instructions out of base `I` into `Zicsr`/`Zifencei`, requiring the kernel to pass those extensions explicitly. If GCC is below 11.3.0 on top of that newer assembler, Kbuild forces `-Wa,-misa-spec=2.2` as a compatibility shim (`TOOLCHAIN_NEEDS_OLD_ISA_SPEC`). Additionally, `TOOLCHAIN_HAS_ZBB`/`ZBA`/`ZBC`/`ZABHA`/`ZACAS` need linker >= 2.39, and `TOOLCHAIN_HAS_V` needs linker >= 2.38. **The practical, shim-free gate is GCC >= 11.3.0 with binutils >= 2.36** - this is less conservative than a stricter "binutils >= 2.38 / GCC >= 12.1" recommendation that has circulated; 2.36/11.3.0 is what upstream `arch/riscv/Kconfig` actually requires for the Zicsr/Zifencei split, and 2.38/12.1 should only be cited if V-extension or Zba/Zbb/Zbc support is specifically needed.

Key CFLAGS (`arch/riscv/Makefile`): `-mabi=lp64`, `-mno-save-restore`, `-mcmodel=medany`, `$(call cc-option,-mno-riscv-attribute)`, `-fno-asynchronous-unwind-tables -fno-unwind-tables`.

**QEMU.** Upstream ships no hwmon-specific QEMU setup. The generic riscv `virt` machine boots a standard defconfig kernel (`qemu-system-riscv64 -M virt ...`) but does not emulate any RISC-V hwmon sensor peripheral (StarFive `sfctemp`, Sophgo `sg2042-mcu`, T-Head `mr75203`/TH1520, Microchip `tvs-mpfs`, or ESWIN EIC7700 PVT). Testing these drivers requires physical hardware: StarFive VisionFive2 (`sfctemp`), Milk-V Pioneer (`sg2042-mcu`), Microchip PolarFire SoC Icicle Kit (`tvs-mpfs`), or SiFive HiFive Premier P550 (ESWIN EIC7700 PVT).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

hwmon drivers are hardware-specific by definition; the relevant comparison is not the (identical) framework layer but which SoC-specific drivers exist.

| Driver category | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PC chipset monitors (ISA I/O port) | Full (23 drivers) | None (no HAS_IOPORT) | None (no HAS_IOPORT) |
| SoC-integrated temperature sensors | Partial (few native) | Extensive | 5 merged drivers |
| I2C/SPI discrete sensors | Full | Full | Full |
| IPMI/ACPI platform monitors | Full | Full | Not meaningfully applicable - no ACPI hwmon bindings exist for any RISC-V platform; riscv64 is still primarily Device-Tree-based and ACPI boot support is nascent/opt-in |
| PMBus power monitors | Full | Full | Full |

**Gaps specific to RISC-V:**
1. No hwmon ACPI bindings for any RISC-V platform. Server-class RISC-V platforms targeting EBBR/ACPI boot paths would need ACPI `_HID` entries for hwmon devices. Not currently blocking because all deployed RISC-V hwmon relies on Device Tree.
2. No hwmon support identified for SiFive P550 outside the ESWIN EIC7700 PVT path, SpacemiT K1, or other emerging commercial RISC-V platforms beyond those already listed in Section 2.
3. `sensors-detect` in lm-sensors is x86-specific (ISA bus probing, SMBus on x86 chipsets); not applicable to riscv64 and not expected to be ported. The `libsensors` read path and `sensors` binary work correctly against any sysfs hwmon device regardless of architecture.
4. PolarFire SoC alarm attributes (`temp1_max`, `in[0-2]_max`) are permanently absent by design due to a TVS block hardware erratum that prevents clearing alarms once triggered (see Section 11, Issue 6).

**Performance benchmark data:** none exists. Searches of the linux-hwmon mailing list, kernel.org, GitHub, academic literature (e.g., arXiv papers on RISC-V PMU profiling and SG2042/SG2044 HPC performance), and the RISE project blog found no riscv64-vs-arm64/amd64 benchmark for hwmon specifically. hwmon is a low-frequency polling subsystem (~1 Hz default sysfs reads); no community source has published a throughput or latency comparison for it on any architecture.

## 7. CI/CD Infrastructure

**No riscv64 CI pipeline exists for hwmon, and no CI configuration of any kind exists for the Linux kernel tree.** This was independently confirmed by direct inspection in this pass, not merely inherited from prior claims:

- The `torvalds/linux` GitHub mirror root listing contains no `.github/`, no `.gitlab-ci.yml`, no `.cirrus.yml`, and no CI configuration file of any kind - only standard kernel source directories, dotfiles (`.clang-format`, `.mailmap`, etc.), and top-level build/doc files (`COPYING`, `Kbuild`, `Kconfig`, `MAINTAINERS`, `Makefile`, `README`).
- `raw.githubusercontent.com/torvalds/linux/master/.github/workflows` returns HTTP 404, confirming no GitHub Actions workflows exist for this repository.
- `groeck/linux-staging.git` (the hwmon maintainer's `hwmon-next` tree) ships no CI configuration files.
- KernelCI's own pipeline configuration (`kernelci/kernelci-pipeline` `config/pipeline.yaml`), fetched and read directly, contains neither "hwmon" nor "riscv64" anywhere in the file. A GitHub-wide code search scoped to `org:kernelci` for "hwmon riscv64" returns zero results. KernelCI does carry riscv64 kselftest and LTP rootfs targets (`trixie-kselftest`, `trixie-ltp`) and a riscv Vector/Hypervisor QEMU regression pipeline, but no hwmon-specific test target exists in any config checked.
- No hwmon-specific test suite (KUnit, kselftest, or otherwise) exists for any architecture, including x86.
- `git.kernel.org` and `lore.kernel.org` are both blocked by Anubis anti-bot challenges for automated fetches, so any mailing-list-hosted CI-discussion threads could not be independently read in this pass; this is a tooling gap, not evidence either way.

A claim referencing a `linux-riscv/linux` CI mirror running generic build/lint checks (`build-rv64-gcc-allmodconfig`, `checkpatch`, `dtb-warn-rv64`) on specific pull requests could not be independently re-verified by direct file read in this pass and should be treated as **[NEEDS VERIFICATION]** rather than confirmed; if accurate, such checks validate compilation and DT-schema correctness only, not hwmon sensor behavior on riscv64 hardware or in emulation.

Testing the five merged RISC-V hwmon drivers requires physical hardware in every case (see Section 5, QEMU); the generic riscv `virt` QEMU machine emulates none of the relevant sensor peripherals.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI (torvalds/linux) | None | None | None |
| hwmon-specific test coverage (any arch) | None | None | None |
| KernelCI generic coverage | Yes | Yes | kselftest/LTP rootfs only, no hwmon target |
| Hardware-in-the-loop sensor testing | Ad hoc, vendor-dependent | Ad hoc, vendor-dependent | None identified |

## 8. Distribution and Release Status

**Kernel releases.** hwmon ships in every mainline kernel release as part of the kernel image; there is no standalone hwmon release artifact. `sg2042-mcu` first shipped in v6.12 (2024-11-17); `sfctemp` first shipped in v6.4 (2023-06-25); TH1520 PVT calibration and the ESWIN EIC7700 PVT driver and the merged `tvs-mpfs` v4 are queued in linux-next (`tvs-mpfs` as commit `ecc0eb5e9569`, queued 2026-08-10) with their first mainline release tag not yet confirmed [NEEDS VERIFICATION: exact release tag for TH1520 PVT, ESWIN EIC7700 PVT, and tvs-mpfs].

**Linux distribution kernel packages.** No distribution ships a package literally named "hwmon" - it is built into the distribution's `linux-image` package, as modules or built-ins. Debian sid, Ubuntu, and Arch Linux RISC-V all ship official riscv64 kernel builds from unmodified upstream source, with no riscv64-specific patches required; this is the basis for the clean-distro-build floor applied in this report's readiness grade (see Section 13).

| Distribution | hwmon status | riscv64 kernel available? |
|---|---|---|
| Debian sid | Bundled in linux-image | Yes - official riscv64 port |
| Ubuntu | Bundled in linux-image | Yes - official riscv64 port |
| Arch Linux RISC-V | Bundled in linux | Yes - archriscv overlay |

**lm-sensors (userspace tooling).** Debian sid ships `lm-sensors 1:3.6.2-2+b2` as an official riscv64 binary ([packages.debian.org/sid/lm-sensors](https://packages.debian.org/sid/lm-sensors), 89.8 kB package, 358 kB installed). Arch Linux RISC-V ships `lm_sensors-1:3.6.2-1-riscv64.pkg.tar.zst` at [archriscv.felixc.at](https://archriscv.felixc.at), built 2025-05-14.

**On the unrelated PyPI package named "hwmon":** there is a separate, unrelated third-party Python project on PyPI named `hwmon` (v1.0, "a collection of Python 3 scripts... for obtaining information from Linux system sensors"). It is not the Linux kernel hwmon subsystem. It ships only a source distribution (`hwmon-1.0.tar.gz`, uploaded 2020-06-08) with no wheels of any kind for any architecture - its absence of riscv64 wheels reflects that no compiled artifact exists for this package at all, on any platform, and is not evidence about the kernel subsystem's riscv64 readiness. The RISE wheel-builder GitLab project has no custom index entry for it either (redirects to public PyPI). Separately, Ubuntu's archive (checked against the "resolute" 26.04 development suite) carries no package named `hwmon` at all, on any architecture - again referring to this unrelated project, and immaterial to the kernel subsystem. These findings are noted here only to prevent the name collision from being mistaken for a riscv64 gap in the kernel hwmon subsystem itself, which has no analogous standalone package to begin with.

## 9. Dependencies

| Name | Role | riscv64 Build Status | riscv64 Test Status | riscv64 Release Status | Blocking Issues |
|---|---|---|---|---|---|
| GCC | Build-dependency (critical) - primary compiler for Kbuild cross-compilation | Builds hwmon and the full kernel on riscv64 at GCC >= 8.1.0 (Kbuild floor); clean, shim-free riscv64 builds need GCC >= 11.3.0 paired with binutils >= 2.36 for the Zicsr/Zifencei ISA-spec split | No hwmon-specific test gaps; general riscv64 kernel builds are routine | Used by all three riscv64 distro kernel builds (Debian, Ubuntu, Arch) | None blocking; version floor is a build-time correctness detail, not a port gap |
| LLVM | Build-dependency (optional) - alternate full-LLVM toolchain (`LLVM=1`) | Builds hwmon and the kernel on riscv64 at Clang/LLVM >= 17.0.1 | No hwmon-specific test gaps | Used as an alternative to GCC; not distro-default for any of the three riscv64 distros checked | None blocking |
| GNU binutils | Build-dependency (critical) - assembler and linker | riscv64 requires >= 2.30 as Kbuild's general floor; >= 2.36 for explicit Zicsr/Zifencei; >= 2.38 for V-extension linker support; >= 2.39 for Zbb/Zba/Zbc/Zabha/Zacas | No hwmon-specific test gaps | Used by all three riscv64 distro kernel builds | None blocking; version choice determines whether `-Wa,-misa-spec=2.2` compatibility shim is required |
| GNU make | Build-dependency (critical) - Kbuild's build driver | Requires >= 4.0 for parallel/pattern-rule features used by Kbuild; architecture-independent | No hwmon-specific test gaps | Used by all three riscv64 distro kernel builds | None |
| Python | Build-dependency (optional) - Kconfig/kunit tooling | Requires >= 3.9.x; architecture-independent | No hwmon-specific test gaps | Used by all three riscv64 distro kernel builds | None |
| dwarves | Build-dependency (optional) - provides `pahole`, needed only for `CONFIG_DEBUG_INFO_BTF=y` | Requires >= 1.26; architecture-independent, no riscv64-specific gap identified | No hwmon-specific test gaps | Available via standard distro package managers | Only relevant when BTF debug info is enabled; not required for a baseline hwmon build |
| dtc | Build-dependency (critical) - Device Tree Compiler, compiles the `.dts`/`.dtsi` nodes and `dt-bindings` YAML schemas that every merged RISC-V hwmon driver (`sfctemp`, `sg2042-mcu`, TH1520 PVT, `tvs-mpfs`, ESWIN EIC7700 PVT) depends on for device enumeration | Architecture-independent host tool; all RISC-V hwmon drivers are DT-enumerated (see Section 6), making this a hard build dependency for any riscv64 kernel exercising these drivers | No hwmon-specific test gaps | Available via standard distro package managers | None blocking |
| ACPICA | Runtime-dependency (optional) - ACPI subsystem component underlying `CONFIG_ACPI`/`CONFIG_ACPI_WMI`-gated hwmon drivers | riscv64 ACPI support exists upstream in reduced-hardware-profile form (`ACPI_REDUCED_HARDWARE_ONLY`, `ACPI_GENERIC_GSI`, `ACPI_PPTT`, `ACPI_RIMT` in `arch/riscv/Kconfig`), but no hwmon driver currently uses an ACPI enumeration path on RISC-V | No hwmon-specific ACPI testing on riscv64 | Enabled in server-oriented riscv64 builds where ACPI boot is used | No hwmon ACPI bindings exist for any RISC-V platform today (see Section 6); not currently blocking because the DT path is universally used instead |
| I2C subsystem (`CONFIG_I2C`) | Indirect/recursed - bus layer required by the majority of hwmon sensor drivers (121 of ~150 chip drivers `depends on I2C`; `sg2042-mcu` specifically requires it) | Fully functional on riscv64; multiple RISC-V SoC I2C controllers upstream (SiFive, StarFive JH71x0, Canaan K210) | No riscv64-specific test gaps identified | Available in all major riscv64 distributions | None |
| REGMAP (`REGMAP_I2C`/`REGMAP_SPI`/`REGMAP_I3C`/`REGMAP_MMIO`) | Indirect/recursed - register-map abstraction selected by ~52 hwmon drivers, including `mr75203`/TH1520 and `tvs-mpfs` | Architecture-independent kernel lib code; no arch gating found in Kconfig | KUnit tests exist (`REGMAP_KUNIT`) but are not riscv64-specific | Available in all major riscv64 distributions | None |
| GPIOLIB | Indirect/recursed - GPIO framework, `depends on GPIOLIB` for 4 hwmon drivers (notably `gpio-fan`, see Section 11) | Architecture-independent kernel code | N/A in-kernel | In-kernel only | Userspace counterpart `libgpiod` is listed in this scope's project tracking but has no report of its own yet [NEEDS VERIFICATION: libgpiod riscv64 package status] |
| WATCHDOG_CORE | Indirect/recursed - watchdog framework, `select`ed by 4 hwmon drivers | Architecture-independent; riscv64 boards commonly have hardware watchdogs | Standard on riscv64 boards | In-kernel | Userspace `watchdog` package availability not separately verified |
| SPI / SPI_MASTER | Indirect/recursed - SPI bus for 8 hwmon drivers | Architecture-independent, used on riscv64 SBCs today | No known gap | In-kernel | None |
| HID / USB_HID | Indirect/recursed - HID transport for 9 hwmon driver occurrences | Generic, architecture-independent | No known riscv64 gap | In-kernel | None |
| PWM | Indirect/recursed - PWM control for 3 fan-control hwmon drivers | Generic, architecture-independent | No known gap | In-kernel | None |
| IPMI_HANDLER / IPMI_SI | Indirect/recursed - BMC/IPMI-backed sensor drivers (4 total) | Generic kernel code; no code-level architecture block | Fewer riscv64 BMC deployments today, independent of build support | In-kernel plus separate userspace `ipmitool`/OpenIPMI | Practical exposure on riscv64 is currently low because the riscv64 server/BMC ecosystem is still maturing |
| IIO | Indirect/recursed - Industrial I/O bridge, `depends on IIO` for 2 drivers | Generic, architecture-independent | No known gap | In-kernel; userspace `libiio` separate | None |
| AUXILIARY_BUS | Indirect/recursed - driver-model bus, `select`ed by 1 driver | Generic, architecture-independent | No known gap | In-kernel | None |
| CRC8 / CRC16 / BITREVERSE | Indirect/recursed - checksum/bit-manipulation lib helpers for a handful of drivers | Trivial architecture-independent lib code, always buildable | N/A | In-kernel | None |
| lm-sensors (userspace) | Indirect - primary userspace consumer, provides `libsensors` API, `sensors` CLI, `sensors-detect` script | Upstream CI for lm-sensors itself is x86_64-only (GitHub Actions `debian.yml`); the library is architecture-neutral C | No riscv64 CI in lm-sensors upstream | Debian sid `1:3.6.2-2+b2` riscv64 binary; Arch RISC-V `lm_sensors-1:3.6.2-1` | `sensors-detect` is x86-specific (ISA bus probing), not applicable to riscv64; `libsensors`/`sensors` work against any sysfs hwmon device regardless of architecture |

ACPI/ACPI_WMI as a hwmon-adjacent Kconfig symbol is a notable deep-dive case: 2 drivers depend on generic `ACPI` and 3 on `ACPI_WMI` specifically; `ACPI_WMI` is almost exclusively used on x86 laptop/firmware platforms. Since RISC-V ACPI boot support is nascent and opt-in (most riscv64 systems still boot via Device Tree), ACPI/ACPI_WMI-gated hwmon drivers have no meaningful applicability to current riscv64 hardware - a real, structural gap, independent of any tooling limitation, consistent with the ACPICA entry above.

## 11. Known Bugs and Active Issues

| ID / Title | Status | Severity | Notes |
|---|---|---|---|
| [sophgo/linux-riscv issue #104](https://github.com/sophgo/linux-riscv/issues/104) - `sg2042-mcu` linker error | **Open** (confirmed, filed 2024-02-11, vendor tree only) | Medium | In the Sophgo vendor tree (pre-mainline), `drivers/soc/sophgo/umcu/mcu.c` is compiled unconditionally (`obj-y`) but calls hwmon symbols absent when `CONFIG_HWMON=m`: `ld: mcu.o: undefined reference to 'devm_hwmon_device_register_with_info'`. Root cause: missing `select HWMON`/`depends on HWMON`. Workaround: `CONFIG_HWMON=y`. Mainline `sg2042-mcu.c` has the correct Kconfig dependency and is unaffected. |
| [RVCK-Project/rvck-olk issue #158](https://github.com/RVCK-Project/rvck-olk/issues/158) - SG2042 kernel panic | Resolved in 6.6.0-137 (commit 8c8b1152e4) | High (not a hwmon bug) | Boot-time panic in memory zone initialization on Sophgo SG2042 (4 NUMA nodes), triggered by a "mm: fix the inaccurate memory statistics issue" stable backport. Affects the same platform as `sg2042-mcu` but is unrelated to hwmon code. |
| `sg2042-mcu` v1 correctness bugs (inverted visibility/write logic, non-devm `sysfs_create_group`, wrong SoC name in `MODULE_DESCRIPTION`) | Resolved in mainline, across 11 revision cycles | Medium (pre-merge) | All fixed before merge; current mainline driver is correct. |
| TH1520 PVT coefficient precision (`moortec,mr75203` DT binding `multipleOf: 100` vs required G=42740/J=-160) | Resolved via binding fix changing `multipleOf` to 10 | Medium (pre-merge, caused DT-schema CI failures) | dt-bindings patch accepted on linux-hwmon patchwork. |
| PolarFire SoC `tvs-mpfs` v3 correctness issues: (A) signed-value clamp producing `ULONG_MAX` instead of `-EINVAL` on negative input, (B) interval-rounding truncation on write/read roundtrip, (C) sensors left enabled on probe-failure/unbind with no `devm` disable action | **Resolved - fixed in v4, applied 2026-06-29** | Medium (pre-merge) | All three issues closed in the merged v4 (commit `ecc0eb5e9569`, queued in linux-next 2026-08-10). The register-bit-31 discrepancy against Application Note AN4682 (driver uses `GENMASK(30,16)`; AN4682 states bit 31 reserved) was not independently re-verified in this pass **[NEEDS VERIFICATION]**. |
| PolarFire SoC alarm attributes absent by design | Permanent, not a bug | N/A (hardware erratum) | TVS block erratum prevents clearing alarms once triggered; patch cover letter documents this explicitly; no workaround planned. |
| ESWIN EIC7700 PVT driver resume/trim defect; v6 race in `eic7700_pvt_init_iface()`; missing `pm_runtime_disable()` | **Resolved - fixed by v9, merged 2026-07-01** | Medium/High (pre-merge) | Hardware trim configuration was lost across suspend/resume, producing incorrect sensor readings on wake, until re-applied in the resume path. |
| **CVE-2026-97582** - hwmon (`gpio-fan`) use-after-free in alarm work | Published 2026-09-25, CVSS 6.4 | **High - correctness/security, architecture-neutral, relevant to riscv64 systems using `gpio-fan`** | `fan_alarm_irq_handler()` queues `fan_data->alarm_work`, which nothing cancels; on unbind, devres frees the IRQ (only waits for the handler, not queued work) then frees the hwmon device and `fan_data`, so a pending `fan_alarm_notify()` can run on freed memory. Fix replaces `INIT_WORK()` with `devm_work_autocancel()` registered before `devm_request_irq()`. `gpio-fan` builds and runs on any riscv64 board with GPIO-driven fan control, making this a generic correctness bug applicable to RISC-V systems using that driver, though not RISC-V-specific. Fix patches: [initial](https://ratatoskr.run/stable/2026/08/17431857/t), [v3](https://ratatoskr.run/lkml/2026/09/17491161), [follow-up lock fix](https://ratatoskr.run/linux-hwmon/2026/09/17492706/t). |
| CVE-2026-31770 - hwmon (`occ`) division-by-zero | N/A to RISC-V | Out of scope | IBM POWER-specific On-Chip Controller driver (`occ_show_power_1()` divides by `update_tag` without a zero-check during early boot). Confirmed out of scope for RISC-V after checking; included only to document that it was reviewed and excluded. |
| `perf test 11` hwmon endianness failure (big-endian/s390) | Fix exports a shared header for `hwmon_pmu_event_key` bitfield union | Low, not RISC-V-relevant | riscv64 is little-endian, so this bug does not apply; noted for completeness since it surfaced in hwmon-related kernel search results. |

Nothing new found in Aug-Sep 2026 beyond a generic, architecture-neutral PMIC5000 driver RFC that was merely build-tested on riscv-randconfig by the kernel test robot (a `const`-array-in-switch-case smatch warning, not RISC-V-specific).

## 12. Objections and Upstream Blockers

No active, open blocker remains for the five merged RISC-V hwmon drivers; the PolarFire SoC `tvs-mpfs` correctness issues that were outstanding at v3 were resolved and merged at v4 (2026-06-29), closing what had been the only in-flight RISC-V hwmon blocker tracked in this report.

**Remaining structural (non-blocking-today) gap: no ACPI hwmon bindings for RISC-V server platforms.** RISC-V server platforms targeting EBBR-compliant ACPI boot paths have no ACPI `_HID` entries for hwmon devices. This is not a current blocker for any shipped RISC-V product (all deployed RISC-V hwmon uses Device Tree), but becomes relevant as RISC-V server platforms mature toward enterprise deployment patterns using ACPI boot.

**Non-issue: ISA I/O port drivers absent on riscv64.** The 23 hwmon drivers gated by `HAS_IOPORT` are x86 PC chipset monitors with no RISC-V equivalent hardware; their absence on riscv64 is correct behavior, not a gap.

**Non-issue: `sensors-detect` not applicable.** The lm-sensors `sensors-detect` script probes ISA buses and x86 SMBus controllers; it has no utility on riscv64 and no porting path. `sensors`/`libsensors` function correctly on riscv64 for sysfs-based hwmon devices.

**Organizational note.** No RISE funding or organizational involvement exists for any RISC-V hwmon work (see Section 1); all contributions trace to individual vendor engineers (Inochi Amaoto for `sg2042-mcu`; Icenowy Zheng/ISCAS for TH1520; Lars Randers and Conor Dooley/Microchip for `tvs-mpfs`; Emil Renner Berthing, Samin Guo and Hal Feng/StarFive for `sfctemp`) submitting through the standard linux-hwmon review process, with Guenter Roeck as the sole gating maintainer. Review throughput for new RISC-V drivers has run from 3 revision cycles (`tvs-mpfs`, through v4) to 11 revision cycles (`sg2042-mcu`), reflecting the maintainer's uniform code-quality bar rather than any RISC-V-specific resistance - the acceptance probability for a well-formed, DT-based, standard-bus RISC-V hwmon driver is high given this track record.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro

**Justification:** [torvalds/linux](https://github.com/torvalds/linux) ships zero in-tree CI configuration (no `.github/`, no `.gitlab-ci.yml`), and no hwmon-specific test suite exists for any architecture, so there is no upstream build/test CI to grade on - this alone would place the project at orange. However, Debian sid, Ubuntu, and Arch Linux RISC-V all ship official riscv64 kernel builds from unmodified upstream source (no riscv64-specific patches needed), which triggers the clean-distro-build floor, raising the grade from orange to yellow. See [torvalds/linux](https://github.com/torvalds/linux) (no CI config) and [Debian lm-sensors riscv64 package](https://packages.debian.org/sid/lm-sensors) (riscv64 binary available, evidencing the broader riscv64 kernel/userspace distro pipeline hwmon rides on).

**Pending work that could change the grade:** the PolarFire SoC `tvs-mpfs` driver, the one item that was still in review as of the prior assessment, was resolved and merged by v4 on 2026-06-29 and is no longer blocking. If KernelCI or the 0-day bot ever adds hwmon-targeted riscv64 test jobs, or an upstream riscv64 binary artifact for a hwmon-adjacent userspace package is published, the grade could move to blue - nothing currently in flight suggests this is imminent. No RISE involvement exists that would independently accelerate this.

## 14. Investment Analysis

Before sizing new work: RISE has not funded or touched any hwmon-related work (Section 1, Section 12), so no planned investment below is already covered by RISE activity.

### 14.1 Functional Enablement

The hwmon framework itself requires no RISC-V investment - it is fully functional on riscv64 today, and the `tvs-mpfs` driver that had been the one open gap merged in v4 (2026-06-29) without need for external (e.g., Qualcomm) involvement.

For new RISC-V SoC platforms not yet represented in hwmon (SiFive P550 variants beyond the ESWIN EIC7700 PVT path, SpacemiT K1, any ACPI-enumerated RISC-V server SoC), a driver submission requires an estimated 2-4 person-weeks per driver including review iteration cycles, based on the observed 3-cycle history for `tvs-mpfs` (v1-v4) through the 11-cycle history for `sg2042-mcu` (v1-v11).

### 14.2 Performance Optimization

No performance investment is warranted. hwmon is a low-frequency polling subsystem with no algorithmic kernels, no SIMD opportunity, and no published performance gap between riscv64 and any other architecture (Section 6). The scalar-C-everywhere architecture (Section 4) is already optimal for this access pattern on every architecture it supports, riscv64 included.

### 14.3 CI/CD Infrastructure

No riscv64 CI exists for hwmon anywhere in the ecosystem, and none exists for hwmon on any architecture (Section 7). Closing this gap, if prioritized, would require:
1. Access to RISC-V hardware with hwmon sensors (StarFive VisionFive2, Milk-V Pioneer, Microchip PolarFire SoC Icicle Kit, or a SiFive HiFive Premier P550 for the ESWIN EIC7700 PVT driver).
2. A test harness exercising sysfs sensor attributes and validating output ranges.
3. Integration with KernelCI or an equivalent hardware-in-the-loop lab.

This is an ecosystem-wide gap (no architecture has hwmon-specific CI), not a RISC-V-specific deficiency, and should be scoped and prioritized accordingly rather than treated as a RISC-V catch-up item.

### 14.4 Ecosystem Enablement

The absence of ACPI hwmon bindings for RISC-V (Section 6, Section 12) is a forward-looking item scoped to ACPI `_HID` namespace entries and ACPI driver probe paths in individual hwmon drivers, relevant only once RISC-V server platforms adopt ACPI boot at scale; it is not a framework change and not urgent today given the DT-only deployment reality.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Develop hwmon driver for SpacemiT K1 thermal sensor | 3-5 | SpacemiT (no current owner identified) | Medium |
| Functional | Develop hwmon driver(s) for additional SiFive P550-class platforms beyond the merged ESWIN EIC7700 PVT path | 3-5 | SiFive (no current owner identified) | Medium |
| Functional | ACPI hwmon bindings for RISC-V server platforms | 4-8 | No owner identified; depends on server platform availability | Low |
| CI/CD | Deploy hwmon hardware-in-the-loop test on StarFive VisionFive2 | 3-4 | Unassigned | Medium |
| CI/CD | Deploy hwmon hardware-in-the-loop test on Milk-V Pioneer (SG2042) | 3-4 | Unassigned | Medium |
| CI/CD | Deploy hwmon hardware-in-the-loop test on PolarFire SoC Icicle Kit (tvs-mpfs, now merged) | 2-3 | Unassigned | Low |
| CI/CD | Deploy hwmon hardware-in-the-loop test on SiFive HiFive Premier P550 (ESWIN EIC7700 PVT) | 2-3 | Unassigned | Low |
| Performance | No work identified | 0 | N/A | N/A |

## 15. References

- [hwmon kernel documentation](https://www.kernel.org/doc/html/latest/hwmon/)
- [hwmon.wiki.kernel.org](https://hwmon.wiki.kernel.org/) (archived)
- [torvalds/linux repository](https://github.com/torvalds/linux)
- [sg2042-mcu driver documentation](https://docs.kernel.org/hwmon/sg2042-mcu.html)
- [LWN coverage of SG2042 hwmon support](https://lwn.net/Articles/983823/)
- [commit 7f2958e8 - sfctemp driver, JH7100+JH7110](https://github.com/torvalds/linux/commit/7f2958e845d2c8bf1100dc088dbdc31af2a80fd0)
- [commit 758b62e5 - sg2042-mcu driver](https://github.com/torvalds/linux/commit/758b62e562f2fdffd26a84dbeafbe6888a7e130c)
- [commit c27ea95 - hwmon-for-v6.12 pull](https://github.com/torvalds/linux/commit/c27ea952c614779db84bc2326e686ba7cc1c865c)
- [commit 4173cf6 - hwmon-for-v6.4 pull](https://github.com/torvalds/linux/commit/4173cf6fb6b7d1b4569cca08af318c4561356fb5)
- [commit 65e4a0f3 - riscv JH7100 DT thermal node](https://github.com/torvalds/linux/commit/65e4a0f33a5e125d90b1b69d56a9bbdd481e3fcf)
- [commit d8a7d89a - riscv defconfig JH7110 enablement](https://github.com/torvalds/linux/commit/d8a7d89abb091fe4c1744241c7a40dbad570fd9e)
- [commit 89cb3ca5 - sg2042 module description fix](https://github.com/torvalds/linux/commit/89cb3ca56cb3192ebd07a2d8eb62e857a42cf83f)
- [patchwork series 521423 - JH7100 (deferred, unmerged)](https://patchwork.kernel.org/project/linux-hwmon/patch/20210726171802.1052716-3-kernel@esmil.dk/)
- [patchwork patch 13182164 - sfctemp JH71x0 v6](https://patchwork.kernel.org/project/linux-hwmon/patch/20230321022644.107027-3-hal.feng@starfivetech.com/)
- [patchwork patch 13766896 - SG2042 hwmon v11](https://patchwork.kernel.org/project/linux-hwmon/patch/IA1PR20MB49536C786048D1E676BB9C20BB822@IA1PR20MB4953.namprd20.prod.outlook.com/)
- [tvs-mpfs v4 linux-next queue entry](https://ratatoskr.run/linux-riscv/2026/06/17186982/t)
- [ESWIN EIC7700 PVT review thread](https://ratatoskr.run/linux-hwmon/2026/06/17192243/t)
- [ESWIN EIC7700 PVT reviewer notes](https://ratatoskr.run/sashiko-reviews/2026/06/17190195)
- [CVE-2026-97582 initial fix patch](https://ratatoskr.run/stable/2026/08/17431857/t)
- [CVE-2026-97582 v3 fix patch](https://ratatoskr.run/lkml/2026/09/17491161)
- [CVE-2026-97582 follow-up lock fix](https://ratatoskr.run/linux-hwmon/2026/09/17492706/t)
- [sophgo/linux-riscv issue #104 - sg2042-mcu linker error](https://github.com/sophgo/linux-riscv/issues/104)
- [RVCK-Project/rvck-olk issue #158 - SG2042 kernel panic](https://github.com/RVCK-Project/rvck-olk/issues/158)
- [perf test 11 hwmon endianness fix](https://lkml.iu.edu/hypermail/linux/kernel/2502.0/04536.html)
- [RISE project members](https://riseproject.dev/members/)
- [RISE project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE sw-ecosystem status reports](https://riseproject-dev.github.io/sw-ecosystem/)
- [Debian lm-sensors package](https://packages.debian.org/sid/lm-sensors)
- [Arch Linux RISC-V package overlay](https://archriscv.felixc.at)
- [PyPI hwmon package JSON API](https://pypi.org/pypi/hwmon/json) (unrelated third-party project, see Section 8)