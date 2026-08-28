---
title: Linux RAS
categories:
  - perfmon
  - debug
---

# Linux RAS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux RAS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Linux RAS (Reliability, Availability, Serviceability) is a kernel subsystem, not a standalone project. Its scope covers:

- The `drivers/ras/` top-level subsystem toggle and trace event infrastructure
- The EDAC (Error Detection and Correction) framework (`drivers/edac/`)
- ACPI APEI (Advanced Platform Error Interface) and GHES (Generic Hardware Error Source) (`drivers/acpi/apei/`)
- Architecture-specific glue connecting hardware error signals to the above frameworks

Homepage: [https://www.kernel.org/doc/html/latest/admin-guide/ras.html](https://www.kernel.org/doc/html/latest/admin-guide/ras.html)

Repository: [https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)

**Governance:** Linux kernel standard model. No separate foundation. Decisions made by subsystem maintainers on the linux-edac mailing list (linux-edac@vger.kernel.org). Primary maintainers: Tony Luck (Intel) and Borislav Petkov (AMD). ACPI APEI reviewer list includes Rafael J. Wysocki, Tony Luck, Borislav Petkov, Hanjun Guo (Huawei), Mauro Carvalho Chehab (Huawei), and Shuai Xue (Alibaba). The RISC-V RAS patch series is delegated to Paul Walmsley on the linux-riscv patchwork project.

**License:** GPL-2.0 (SPDX identifier, added 2017-11-02).

**First RAS commit:** 2014-06-11, SHA `76ac8275f296b49c58f684825543bf4eb85d43d0`, by Chen Gong (Intel), creating the unified RAS trace event stub.

**RISE membership:** Linux RAS is not a RISE member. RISE membership is organization-based. RISE Premier Members include Andes Technology, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, DAMO Academy (Alibaba), and Tenstorrent. General Members include Canonical, ByteDance, ISCAS, Microchip Technology Germany, SpacemiT, ZTE, and others. No RISE blog post or public workstream references Linux RAS by name. No RISE Python wheel builder entry for any RAS tooling exists.

---

## 2. Port History and Upstreaming Timeline

### 2.1 What is in mainline today

The following RISC-V RAS-adjacent components are merged into mainline Linux:

| File | Type | RAS Relevance |
|---|---|---|
| `arch/riscv/kernel/traps.c` | C | Hardware error trap mapped to `SIGBUS`/`BUS_MCEERR_AR` via `DO_ERROR_INFO` macro for exception cause code 19 |
| `arch/riscv/kernel/entry.S` | Assembly | Exception vector table entry: `RISCV_PTR do_trap_hardware_error` at cause 19 |
| `arch/riscv/kernel/crash_save_regs.S` | Assembly | Saves 31 GPRs plus `CSR_STATUS`, `CSR_TVAL`, `CSR_CAUSE`, and PC into `pt_regs` for kdump |
| `arch/riscv/kernel/crash_dump.c` | C | `copy_oldmem_page()` for reading memory from a crashed kernel during kdump recovery |
| `arch/riscv/kernel/vmcore_info.c` | C | `arch_crash_save_vmcoreinfo()` recording phys_ram_base, PAGE_OFFSET, VMALLOC_END, VA_BITS, VMEMMAP, MODULES_VADDR, KASLR offset, satp register value |
| `arch/riscv/kernel/bugs.c` | C | GhostWrite vulnerability mitigation for T-Head XTheadVector CPUs; exposes `cpu_show_ghostwrite()` sysfs reporting "Not affected" / "Mitigation: xtheadvector disabled" / "Vulnerable" |
| `arch/riscv/errata/sifive/errata_cip_453.S` | Assembly | Workaround for SiFive CIP-453 (bad address sign-extension in fault handlers) |
| `arch/riscv/errata/sifive/errata.c` | C | CIP-453 (marchid `0x8000000000000007`, mimpid `0x20181004`-`0x20191105`) and CIP-1200 TLB coherency bug (sets `tlb_flush_all_threshold = 0`); applied via `patch_text_nosync` |
| `arch/riscv/errata/thead/errata.c` | C | GhostWrite (all T-Head C9xx cores with xtheadvector), CMO non-coherent DMA workaround, MAE, PMU errata |
| `arch/riscv/errata/andes/errata.c` | C | AX45MP non-coherent I/O (absent hardware coherency port); detected via SBI extension `0x0900031E`; sets `riscv_cbom_block_size = 1` |
| `drivers/edac/sifive_edac.c` | C | SiFive Composable Cache L2/L3 ECC; handles `SIFIVE_CCACHE_ERR_TYPE_UE` (uncorrectable) and `SIFIVE_CCACHE_ERR_TYPE_CE` (correctable); depends on `EDAC=y && SIFIVE_CCACHE` |

`arch/riscv/Kconfig` unconditionally selects `EDAC_SUPPORT` and `GENERIC_CPU_VULNERABILITIES`. It does **not** select `HAVE_ACPI_APEI` or `ARCH_SUPPORTS_MEMORY_FAILURE`.

### 2.2 What is NOT in mainline

The following components are entirely absent from mainline:

- `HAVE_ACPI_APEI` Kconfig select in `arch/riscv/Kconfig` -- patch 09/10 of v4 adds `select HAVE_ACPI_APEI if ACPI`; confirmed absent from current tree (zero `APEI` hits in mainline riscv Kconfig)
- `ioremap_cache` macro in `arch/riscv/include/asm/io.h`
- `arch_apei_get_mem_attribute` in `arch/riscv/include/asm/acpi.h`
- Fixmap indices for GHES (`FIX_APEI_GHES_IRQ`, `FIX_APEI_GHES_SSE_LOW_PRIORITY`, `FIX_APEI_GHES_SSE_HIGH_PRIORITY`) in `arch/riscv/include/asm/fixmap.h`
- `ACPI_HEST_NOTIFY_SSE = 12` in `include/acpi/actbl1.h`; mainline still has `ACPI_HEST_NOTIFY_RESERVED = 12`
- SSE GHES registration code (`riscv_sbi_sse.c`, ~162 lines, new file)
- CPER processor type strings for RISC-V in `drivers/firmware/efi/cper.c`
- HEST SSE notification handlers (`ghes_sse_lo_callback`, `ghes_sse_hi_callback`) in `drivers/acpi/apei/ghes.c`
- `CONFIG_ACPI_APEI`, `CONFIG_ACPI_APEI_GHES`, `CONFIG_ACPI_APEI_ERST_DEBUG` in `arch/riscv/configs/defconfig`
- Any GHES/HEE synchronous exception path (Alibaba series)
- `ARCH_SUPPORTS_MEMORY_FAILURE` (blocks `RAS_CEC`, `ACPI_APEI_MEMORY_FAILURE`, and kernel memory error recovery)
- Any RISC-V-specific EDAC driver beyond SiFive (no Qualcomm, Alibaba T-Head, StarFive, or generic driver)

### 2.3 Active patch series timeline

| Series | Author | Org | Date | State | Patches |
|---|---|---|---|---|---|
| "Add RAS support" RFC v1 | Himanshu Chauhan | Ventana Micro | 2025-02-27 | New/Stale | 10 |
| "initial GHES support" | Rui Qi | ByteDance | 2025-02-06 | **Rejected** | 5 |
| "Handle HEE" RFC | Ruidong Tian | Alibaba | 2025-09-10 | RFC | 5 |
| "Add RAS support" RFC v2 | Himanshu Chauhan | Ventana Micro | 2025-10-29 | RFC/Archived | 10 |
| "Add RAS support" v3 | Himanshu Chauhan | Qualcomm | 2026-01-09 | Changes Requested | 10 |
| "log HEE via APEI" | Ruidong Tian | Alibaba | 2026-05-08 | New | 3 |
| "Add RAS support" v4 | Himanshu Chauhan | Qualcomm | 2026-05-13 | New (one Reviewed-by) | 10 |

---

## 3. Upstream Support Tier

Linux RAS for RISC-V has no assigned upstream support tier. The subsystem MAINTAINERS file has no `RISCV RAS` or `EDAC RISCV` entry. The only RISC-V-adjacent EDAC entry is `EDAC_SIFIVE`, which covers one specific SoC family.

The patch series delegate on patchwork is Paul Walmsley (pjw). His review action on v3 was "Changes Requested" (2026-01-09). No Acked-by has been issued for any revision. The series has four revisions spanning 16 months with no merge.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Notification mechanism

RISC-V has no NMI. The Qualcomm series uses **Supervisor Software Events (SSE)** from RISC-V SBI v3.0 (chapter 19) as the hardware error notification vector. Each GHES entry is registered with the SSE layer; SSE events serve as notification vectors. Two priority levels are defined: lo and hi, each with a `DEFINE_RAW_SPINLOCK`, both delegating to a shared `__ghes_sse_callback(fixmap_idx)`.

The Alibaba series adds a parallel path using the **Hardware Error Exception (HEE)**, which is a synchronous exception at mcause=19. The HEE path calls `ghes_notify_hee()`, runs `irq_work_run()` if IRQs were enabled, and falls through to `die()` if no fixup is possible.

These two approaches cover different hardware error categories:
- SSE: asynchronous, firmware-first, analogous to ARM64 SDEI
- HEE: synchronous, CPU trap at mcause=19, analogous to ARM64 SEA (Synchronous External Abort)

The two series are designed to be stacked (Alibaba takes HEST notify value 13 after Qualcomm takes 12) but neither formally declares the other as a prerequisite, and there is no coordinated review thread merging them.

### 4.2 Specification basis

The series is based on:
- RISC-V RERI (RAS Error-record Register Interface) v1.0, ratified 2024-05-24
- ACPI ECR for HEST changes: [https://mantis.uefi.org/mantis/view.php?id=2522](https://mantis.uefi.org/mantis/view.php?id=2522)
- RISC-V CPER Table ECR: [https://mantis.uefi.org/mantis/view.php?id=2551](https://mantis.uefi.org/mantis/view.php?id=2551)
- SSE kernel patches v8 by Clement Leger (Rivos Inc.): [https://lore.kernel.org/all/20251105082639.342973-1-cleger@rivosinc.com/](https://lore.kernel.org/all/20251105082639.342973-1-cleger@rivosinc.com/)

SSE is already merged in OpenSBI. The SSE kernel patches are a prerequisite for the Qualcomm RAS series and must be merged first.

### 4.3 Files modified in v4 (305 lines added, 12 lines removed across 11 files)

- `arch/riscv/Kconfig` (+1 line: `select HAVE_ACPI_APEI if ACPI`)
- `arch/riscv/configs/defconfig` (+3 lines: `CONFIG_ACPI_APEI=y`, `CONFIG_ACPI_APEI_GHES=y`, `CONFIG_ACPI_APEI_ERST_DEBUG=y`)
- `arch/riscv/include/asm/acpi.h` (+16)
- `arch/riscv/include/asm/fixmap.h` (+8)
- `arch/riscv/include/asm/io.h` (+3)
- `arch/riscv/kernel/acpi.c` (+12)
- `drivers/acpi/apei/Kconfig` (+5: new `CONFIG_ACPI_APEI_SSE` depending on `RISCV && RISCV_SBI_SSE && ACPI_APEI_GHES`)
- `drivers/acpi/apei/ghes.c` (+101, -12)
- `drivers/firmware/efi/cper.c` (+3: adds `"RISC-V"` to `proc_type_strs[]` and `"RV32/RV32E"` + `"RV64"` to `proc_isa_strs[]`)
- `drivers/firmware/riscv/riscv_sbi_sse.c` (+146, new file)
- `include/linux/riscv_sbi_sse.h` (+16, new file)
- `include/acpi/actbl1.h` (+3, -1: inserts `ACPI_HEST_NOTIFY_SSE = 12`)

### 4.4 Testing infrastructure (out-of-tree)

- QEMU with RERI emulation: [https://github.com/ventanamicro/qemu.git](https://github.com/ventanamicro/qemu.git) (branch: dev-upstream) [NEEDS VERIFICATION]
- EDK2 HEST table generation: [https://github.com/ventanamicro/edk2.git](https://github.com/ventanamicro/edk2.git) (branch: dev-upstream) [NEEDS VERIFICATION]
- OpenSBI with RAS agent and CPER records

Sample kernel output from error injection via devmem (from v4 cover letter):

```
[   34.370282] {1}[Hardware Error]: Hardware error from APEI Generic Hardware Error Source: 1
[   34.371375] {1}[Hardware Error]: event severity: recoverable
[   34.373357] {1}[Hardware Error]:   processor_type: 3, RISCV
[   34.373806] {1}[Hardware Error]:   processor_isa: 6, RISCV64
[   34.374294] {1}[Hardware Error]:   error_type: 0x02
[   34.374845] {1}[Hardware Error]:   TLB error
```

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build system

The Linux kernel uses Kbuild (GNU Make), not CMake. All feature control is via `CONFIG_` symbols set through `make menuconfig`, `make defconfig`, or a `.config` file.

### 5.2 Cross-compilation commands

With GCC:
```bash
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc)
```

With Clang/LLVM:
```bash
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc)
```

`LLVM=1` sets `CC=clang LD=ld.lld AR=llvm-ar NM=llvm-nm OBJCOPY=llvm-objcopy OBJDUMP=llvm-objdump READELF=llvm-readelf STRIP=llvm-strip`.

### 5.3 Toolchain version requirements

Global minimums from `scripts/min-tool-version.sh` (kernel 7.1.0):

| Tool | Minimum | Notes |
|---|---|---|
| GCC | 8.1.0 | No riscv-specific override |
| Clang/LLVM | 17.0.1 | See RISC-V-specific constraints below |
| Binutils | 2.30.0 | See RISC-V-specific constraints below |
| Rust (optional) | 1.85.0 | riscv64 only (no 32-bit Rust support) |
| bindgen (Rust) | 0.71.1 | |

RISC-V-specific toolchain constraints from `arch/riscv/Kconfig` and `arch/riscv/Makefile`:

- **GCC < 11.3.0:** Does not support `zicsr` and `zifencei` extensions via `-march=`. The kernel detects `GCC_VERSION < 110300` and passes `-Wa,-misa-spec=2.2` as a workaround (`TOOLCHAIN_NEEDS_OLD_ISA_SPEC`). GCC 11.3+ is required to avoid this path.
- **Binutils >= 2.38:** Removed Zicsr/Zifencei from base `I` extension. When `AS_VERSION >= 23600`, the kernel automatically appends `_zicsr_zifencei` to the `-march=` string.
- **Binutils >= 2.39:** Required for `TOOLCHAIN_HAS_ZBB`, `ZBA`, `ZBC`, `ZBKB` B/K extensions (`LD_VERSION >= 23900`).
- **Binutils >= 2.38:** Required for Vector extension (`TOOLCHAIN_HAS_V`, `LD_VERSION >= 23800`).
- **LLVM < 18.0.0:** DWARF5 debug info is broken when using LLVM integrated assembler and LLD both below 18.0.0 (`ARCH_HAS_BROKEN_DWARF5`). LLVM 18.0.0 fixes this.
- **Rust on RISC-V:** Requires Clang (not GCC). `select HAVE_RUST if RUSTC_SUPPORTS_RISCV && CC_IS_CLANG`. `RUSTC_SUPPORTS_RISCV` additionally `depends on 64BIT`.

Practical recommendation: GCC 12+ / Binutils 2.39+ / LLVM 18+.

### 5.4 Key CONFIG symbols for RAS/EDAC on riscv64

```
CONFIG_EDAC=y
CONFIG_EDAC_SUPPORT=y           # auto-selected by arch/riscv/Kconfig
CONFIG_EDAC_SIFIVE=y            # SiFive SoC only; depends on EDAC=y && SIFIVE_CCACHE
CONFIG_ACPI=y
CONFIG_ACPI_APEI=y              # requires patch 09/10 to be merged first
CONFIG_ACPI_APEI_GHES=y
CONFIG_ACPI_APEI_EINJ=y         # error injection (debug; needs DEBUG_FS)
CONFIG_ACPI_APEI_PCIEAER=y
```

`CONFIG_ACPI_APEI` and `CONFIG_ACPI_APEI_GHES` are not in `arch/riscv/configs/defconfig` today; they are added by patch 10/10 of v4.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Mainline feature matrix

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `EDAC` framework | Yes | Yes | Yes (framework only) |
| Vendor EDAC drivers | Extensive | Extensive (a72, thunderx, xgene, etc.) | SiFive only |
| `ACPI_APEI` / `GHES` | Yes | Yes | No (patch pending) |
| `HAVE_ACPI_APEI` Kconfig select | Yes | Yes | No (pending v4 patch 09/10) |
| `ARCH_SUPPORTS_MEMORY_FAILURE` | Yes | Yes | No |
| `RAS_CEC` (Correctable Errors Collector) | Yes | No | No (depends on `X86_MCE`) |
| `MEMORY_FAILURE` | Yes | Yes | No |
| MCE/MCA framework | Yes (x86) | No | No |
| CPER processor type/ISA strings | Yes | Yes | No (pending v4 patch 07/10) |
| Firmware-first error notification | APEI/GHES | SDEI/SEA | SSE/HEE (pending) |
| Crash dump (kdump) | Yes | Yes | Yes |
| CPU vulnerability sysfs | Yes | Yes | Yes (GhostWrite) |
| Vendor errata runtime patching | Yes | Yes | Yes (SiFive, T-Head, Andes) |
| PCIe AER | Yes | Yes | Yes (architecture-agnostic) |

### 6.2 AMD/x86-specific components: not applicable to riscv64

- `AMD_ATL` (Address Translation Library): explicitly `depends on X86_64`
- `RAS_FMPM` (FRU Memory Poison Manager): depends on `AMD_ATL && ACPI_APEI`
- `EDAC_DECODE_MCE`: depends on `X86_MCE`

No action required for these components.

### 6.3 Components blocked by missing `HAVE_ACPI_APEI`

All of the following are unavailable on riscv64 until `select HAVE_ACPI_APEI if ACPI` is added to `arch/riscv/Kconfig`:

- `ACPI_APEI`, `ACPI_APEI_GHES`, `ACPI_APEI_EINJ`, `ACPI_APEI_ERST`
- `EDAC_GHES` (depends on `ACPI_APEI_GHES`)
- `ACPI_APEI_MEMORY_FAILURE`

This single Kconfig line is patch 09/10 of the Qualcomm v4 series.

### 6.4 Components blocked by missing `ARCH_SUPPORTS_MEMORY_FAILURE`

- `MEMORY_FAILURE` (kernel memory error recovery, soft-offline)
- `RAS_CEC` (per-page correctable error cache; also blocked by `X86_MCE`)
- `ACPI_APEI_MEMORY_FAILURE`

No RISC-V patch series addressing `ARCH_SUPPORTS_MEMORY_FAILURE` was found in the research data.

---

## 7. CI/CD Infrastructure

### 7.1 linux-riscv patchwork CI

All patches submitted to the linux-riscv patchwork project are automatically checked by a bot named "bjorn" (bjorn@kernel.org). Confirmed check names from verbatim patchwork page reads:

- `bjorn/build-rv32-defconfig`
- `bjorn/build-rv64-clang-allmodconfig`
- `bjorn/build-rv64-gcc-allmodconfig`
- `bjorn/build-rv64-nommu-k210-defconfig`
- `bjorn/build-rv64-nommu-k210-virt`
- `bjorn/checkpatch`
- `bjorn/dtb-warn-rv64`
- `bjorn/header-inline`
- `bjorn/kdoc`
- `bjorn/module-param`
- `bjorn/pre-ci_am` (series apply check; blocks all downstream CI when it fails)
- `bjorn/verify-fixes`
- `bjorn/verify-signedoff`

All four revisions of the Qualcomm series (RFC v1, RFC v2, v3, v4) have failed `bjorn/pre-ci_am` ("Failed to apply series"). This check runs before the build jobs; when it fails, the riscv64 build jobs do not run.

The underlying CI infrastructure (GitHub Actions, GitLab CI, custom scripts, runner configuration) was not publicly accessible for verification.

### 7.2 KernelCI riscv64 coverage

KernelCI (`kernelci-pipeline`) includes 15 riscv64 jobs: `kbuild-gcc-14-riscv` and `kbuild-clang-21-riscv` variants, plus baseline boot tests via LAVA labs on five real hardware platforms:

| Platform | Board |
|---|---|
| jh7110-starfive-visionfive-2-v1-3b | StarFive VisionFive 2 |
| jh7100-starfive-visionfive-v1 | StarFive VisionFive v1 |
| sun20i-d1-nezha | Allwinner D1 Nezha |
| spacemit-k1-bananapi-f3 | SpacemiT K1 Banana Pi F3 |
| eic7700-hifive-premier-p550 | Eswin HiFive Premier P550 |

No RAS-specific CI jobs (kselftest, EINJ injection, GHES validation, EDAC functional tests) exist for riscv64 in any tracked KernelCI configuration. The `drivers/ras/Kconfig` in mainline has zero riscv64 references. The `tools/testing/selftests/riscv/` directory contains abi, cfi, hwprobe, mm, sigreturn, and vector tests but no RAS, EDAC, GHES, or APEI tests.

The riscv tree (`git.kernel.org/pub/scm/linux/kernel/git/riscv/linux.git`) is tracked by KernelCI with `riscv_fixes` and `riscv_for-next` build targets. No dedicated RAS maintainer tree (Tony Luck, Borislav Petkov, James Morse) is tracked by KernelCI for riscv64.

---

## 8. Distribution and Release Status

"Linux RAS" does not exist as a standalone userspace package under that name. The associated userspace daemon is `rasdaemon`.

| Distribution | Package | riscv64 Available | Version |
|---|---|---|---|
| Debian sid/testing | rasdaemon | Yes (status: Installed, built on rv-manda-03) | 0.8.4-1 |
| Ubuntu 24.04 Noble | rasdaemon | Yes (binary in universe) | 0.8.0-2 |
| Arch Linux RISC-V | rasdaemon | Not found | -- |
| PyPI | linux-ras | No (HTTP 404) | -- |
| RISE wheel builder | linux-ras | No (redirect to 404) | -- |

`rasdaemon` is a userspace daemon that reads kernel RAS error traces via the tracing subsystem. Its availability on Debian/Ubuntu riscv64 reflects that the package builds cleanly; it does not imply the underlying kernel APEI/GHES infrastructure is functional on riscv64 hardware, because that infrastructure is not yet merged.

No mainline kernel release includes riscv64 APEI/GHES support. All RAS patch series targeting riscv64 are unmerged as of 2026-06-17.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build Status | riscv64 Test Status | Blocking Issues |
|---|---|---|---|---|
| `RAS` (core) | Top-level subsystem toggle; architecture-agnostic bool | Builds | Not systematically tested | None |
| `EDAC` (framework) | Error Detection and Correction framework; depends on `EDAC_SUPPORT` (auto-selected for riscv) | Builds | Limited (SiFive hardware only) | No generic riscv64 EDAC driver |
| `EDAC_SIFIVE` | SiFive L2 cache ECC via EDAC | Builds (requires `SIFIVE_CCACHE`) | Tested on SiFive hardware | Vendor-specific only |
| `ACPI_APEI` / `ACPI_APEI_GHES` | ACPI APEI / GHES firmware-first error reporting | Does not build | Not tested | `HAVE_ACPI_APEI` not defined in riscv arch (pending v4 patch 09/10) |
| `MEMORY_FAILURE` | Kernel memory error recovery (soft-offline) | Does not build | Not tested | `ARCH_SUPPORTS_MEMORY_FAILURE` not selected by riscv |
| `RAS_CEC` | Per-page correctable error cache | Does not build | Not tested | Depends on `X86_MCE` and `MEMORY_FAILURE`; both blocked |
| `EDAC_GHES` | EDAC driver consuming GHES error records | Does not build | Not tested | Blocked by `ACPI_APEI_GHES` which requires `HAVE_ACPI_APEI` |
| `AMD_ATL`, `RAS_FMPM` | AMD address translation, poison manager | Does not build | Not applicable | Explicitly `depends on X86_64`; categorically not applicable |
| `PCIEAER` | PCIe Advanced Error Reporting | Builds | Limited | Architecture-agnostic; functional where PCIe hardware exists |
| SSE kernel patches (Clement Leger, Rivos Inc.) | SBI SSE notification layer; prerequisite for Qualcomm RAS series | Out-of-tree | Not tested | Must merge before Qualcomm RAS v4 can be considered for merge |
| ACPICA PR [#1170](https://github.com/acpica/acpica/pull/1170) | Upstream ACPICA modification to add `ACPI_HEST_NOTIFY_SSE = 12` | Out-of-tree | Not tested | Rafael Wysocki flagged that `include/acpi/actbl1.h` is ACPICA-owned; kernel patch 03/10 cannot merge until ACPICA accepts the change |

---

## 10. Ecosystem Status

### 10.1 Corporate contributors

Three organizations have submitted RISC-V RAS patches:

- **Qualcomm (via Himanshu Chauhan, formerly Ventana Micro):** Primary and most active contributor. Four revisions of a 10-patch series. Author moved from Ventana Micro to Qualcomm between RFC v2 and v3. Qualcomm is a RISE Premier Member. The v4 series received an internal Qualcomm Reviewed-by (Sunil V L) on 2026-06-09.
- **Alibaba (Ruidong Tian):** Two separate submissions targeting the synchronous HEE path. RFC in 2025-09, narrowed to 3-patch series in 2026-05. Also contributing related patches: `copy_mc_to_{kernel,user}` support and HWPOISON signal fix. Alibaba (DAMO Academy) is a RISE Premier Member.
- **ByteDance (Rui Qi):** One rejected 5-patch RFC (2025-02-06). Rejected due to CI build failures. ByteDance is a RISE General Member.

No ARM, SiFive, Red Hat, Canonical, or other RISE member has contributed to the RAS RISC-V series based on the available research data.

### 10.2 Coordination status

The Qualcomm series and Alibaba series are designed to be stacked but operate as independent submissions. Anup Patel reviewed the Alibaba RFC v1 (2025-09-10) and pointed to the Qualcomm series as the baseline. The Alibaba May 2026 series cites Qualcomm v3 in its cover letter. However, the two series have not been submitted as a combined or coordinated single series, and neither has an explicit `Depends-on:` tag for the other.

### 10.3 Performance benchmarks

None exist. No published benchmarks compare RISC-V vs. arm64 for Linux RAS/GHES/EDAC error-handling latency or throughput. No RISE blog post addresses this. No patch submission includes latency figures or error-injection benchmark results. This is expected given the feature is not yet merged, but it means there is no data to inform performance optimization targets.

---

## 11. Known Bugs and Active Issues

### Bug 1: `memcpy_mc` symbol not exported (blocks modular NVDIMM)

- **Patch:** "riscv: add copy_mc_to_{kernel,user} support to enable MC fault tolerance"
- **Author:** Ruidong Tian (Alibaba), 2026-05-08
- **Message-ID:** `20260508062439.3000014-1-tianruidong@linux.alibaba.com`
- **State:** Under Review
- **Error from kernel test robot:**
  ```
  ERROR: modpost: "memcpy_mc" [drivers/nvdimm/libnvdimm.ko] undefined!
  ERROR: modpost: "memcpy_mc" [drivers/nvdimm/nd_pmem.ko] undefined!
  ```
  Reproduced on `linus/master`, `v6.16-rc1`, and `next-20260508`.
- **Impact:** All modular NVDIMM/pmem drivers (persistent memory, DAX/CXL paths) will fail to link on RISC-V. The fix is adding `EXPORT_SYMBOL_GPL`. Without native `copy_mc_*` hooks, RISC-V falls back to the generic implementation which has no exception-table entry on the load side; an access to poisoned memory takes the kernel down.
- **Additional CI failures on this patch:** `rv64-clang-allmodconfig`, `rv64-gcc-allmodconfig`, both `nommu-k210` configs, checkpatch warnings.

### Bug 2: HWPOISON signals wrong code (BUS_ADRERR instead of BUS_MCEERR_AR)

- **Patch:** "riscv: mm: Add proper handling for HWPOISON faults" (RESEND)
- **Author:** Ruidong Tian (Alibaba); originally 2025-09-30, resent 2026-05-08
- **Message-ID (resend):** `20260508062215.2997173-1-tianruidong@linux.alibaba.com`
- **State:** Under Review; delegate pjw
- **Bug:** `VM_FAULT_HWPOISON` and `VM_FAULT_HWPOISON_LARGE` were previously dispatched as `VM_FAULT_SIGBUS`, sending signal 7 with code 2 (`BUS_ADRERR`). The correct code is 4 (`BUS_MCEERR_AR`). `si_addr_lsb` (log2 of corrupted page size) was not populated.
- **Evidence from ras-tools testing:**
  - Before patch: `signal 7 code 2 addr 0x7fff95bdc400`
  - After patch: `signal 7 code 4 addr 0x7fff95bdc400`
- **Impact:** Userspace RAS managers (mcelog, rasdaemon) that distinguish `BUS_MCEERR_AR` from `BUS_ADRERR` to decide recovery action receive incorrect signal information on RISC-V. This is a correctness bug affecting all existing RAS tooling on RISC-V. Build checks (rv32/rv64 gcc/clang, nommu) passed; checkpatch failure (style) flagged by CI.

### Bug 3: HEST notify value conflict between Qualcomm and Alibaba series

The two active 2026 series both modify `include/acpi/actbl1.h`:
- Qualcomm v4: assigns `ACPI_HEST_NOTIFY_SSE = 12`, sets `RESERVED = 13`
- Alibaba May 2026: assigns `ACPI_HEST_NOTIFY_HEE = 13`, sets `RESERVED = 14`

If the Alibaba series is applied without the Qualcomm series, `ACPI_HEST_NOTIFY_HEE` would conflict with the existing `RESERVED = 12` value. The two series must be merged in order, or reconciled into a single series with both values assigned together. No coordinated resolution has been posted to the mailing list based on available research.

### Bug 4: Two SiFive EDAC drivers (DDR controller, Bus Error Unit) stalled since 2020

Two SiFive-specific EDAC drivers submitted by Yash Shah in 2020 remain in unmerged state on patchwork (linux-edac). [NEEDS VERIFICATION -- source is a single patchwork search result with no additional confirmation]

---

## 12. Objections and Upstream Blockers

### Blocker 1: CI pre-apply failure on all four revisions

Every revision of the Qualcomm series (RFC v1 through v4) has failed `bjorn/pre-ci_am` ("Failed to apply series"). This is the immediate hard block on merge. The riscv64 build jobs (`bjorn/build-rv64-clang-allmodconfig`, `bjorn/build-rv64-gcc-allmodconfig`) do not run when pre-apply fails. The root cause of the apply failure is not documented in the available research data (the lore mbox content was not accessible due to bot protection on kernel.org pages).

### Blocker 2: ACPICA upstream dependency

Rafael Wysocki flagged (2026-05-13) that `include/acpi/actbl1.h` is ACPICA-owned and that modifications must go through upstream ACPICA per `Documentation/driver-api/acpi/linuxized-acpica.rst`. Himanshu Chauhan confirmed (2026-05-18) that ACPICA PR [#1170](https://github.com/acpica/acpica/pull/1170) was raised. Status of that PR as of the research cutoff: open, under review. Patch 03/10 cannot be accepted into mainline until ACPICA merges the change and the kernel is synchronized.

### Blocker 3: SSE kernel patches must merge first

The Qualcomm RAS series depends on SSE kernel patches v8 by Clement Leger (Rivos Inc.): [https://lore.kernel.org/all/20251105082639.342973-1-cleger@rivosinc.com/](https://lore.kernel.org/all/20251105082639.342973-1-cleger@rivosinc.com/). The SSE patches provide the SBI SSE notification layer that the RAS series registers with. Their merge status is not documented in the available research data.

### Blocker 4: No maintainer Acked-by

Paul Walmsley (pjw), the linux-riscv maintainer delegated on this series, returned "Changes Requested" on v3 (2026-01-09). No Acked-by has been issued for v4. The actual comment text from Walmsley on v3 was not accessible (lore mbox behind bot protection).

### Blocker 5: No `ARCH_SUPPORTS_MEMORY_FAILURE`

No patch series in the research data addresses `ARCH_SUPPORTS_MEMORY_FAILURE` for RISC-V. Without this, `MEMORY_FAILURE`, `RAS_CEC`, and `ACPI_APEI_MEMORY_FAILURE` remain unavailable, limiting the RAS stack to error detection and logging without kernel-level memory error recovery.

### Blocker 6: Competing approaches without reconciliation

The SSE (Qualcomm) and HEE (Alibaba) approaches serve different error categories and are meant to coexist. However, they have not been submitted as a joint series and have no formal dependency tracking. A maintainer reviewing both must either accept them independently with coordinated ordering or require a joint series. No evidence of coordination beyond Alibaba citing Qualcomm v3 in a cover letter was found.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The primary gap is the absence of APEI/GHES support. The Qualcomm v4 series (10 patches, 305 lines net) addresses this and is the most mature work available. The series has a Reviewed-by from Sunil V L (2026-06-09) but is blocked on CI apply failures and two external dependencies (ACPICA upstream, SSE kernel patches). The Alibaba HEE series (3 patches, 178 lines net) covers synchronous exceptions and is complementary.

### 13.2 Performance Optimization

No baseline performance data exists for RISC-V RAS paths. Data not available: no benchmark for GHES error handling latency, EDAC interrupt overhead, or SSE notification round-trip time on any RISC-V platform has been published in any accessible source.

### 13.3 CI/CD Infrastructure

The bjorn CI system runs riscv64 build jobs on every patch but runs no RAS-specific functional tests. There are no kselftest RAS tests for RISC-V. There is no EINJ-based error injection test in the riscv64 test suite. KernelCI boots riscv64 on five real hardware platforms but has no RAS test cases. Adding RAS functional CI would require: (a) GHES/APEI merged into mainline, (b) EINJ or equivalent error injection mechanism for RISC-V hardware or QEMU, and (c) test job configuration in KernelCI or the bjorn CI system.

### 13.4 Ecosystem Enablement

The two HWPOISON/copy_mc patches from Alibaba (see Bugs 1 and 2 above) are prerequisite for correct RAS behavior at the kernel-userspace boundary. `BUS_MCEERR_AR` signaling is required for rasdaemon and mcelog to function correctly. The missing `EXPORT_SYMBOL_GPL` for `memcpy_mc` must be fixed before any persistent memory workload on RISC-V is safe.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve v4 CI pre-apply failure and rebase to current mainline | 1-2 | Qualcomm (Himanshu Chauhan) | Critical |
| Functional | Land ACPICA PR [#1170](https://github.com/acpica/acpica/pull/1170) and synchronize kernel patch 03/10 | 1-2 (coordination) | Qualcomm + ACPICA maintainers | Critical |
| Functional | Confirm SSE kernel patches (Clement Leger) merge status and resolve dependency | 1 (tracking) | Rivos / Qualcomm | Critical |
| Functional | Add `EXPORT_SYMBOL_GPL` for `memcpy_mc` (Bug 1) | < 1 | Alibaba (Ruidong Tian) | High |
| Functional | Fix HWPOISON `BUS_MCEERR_AR` signal code (Bug 2) | < 1 | Alibaba (Ruidong Tian) | High |
| Functional | Add `ARCH_SUPPORTS_MEMORY_FAILURE` for RISC-V and implement memory error recovery path | 4-8 | Unassigned | High |
| Functional | Coordinate Qualcomm (SSE) and Alibaba (HEE) series into unified submission or agreed ordering | 2-4 | Qualcomm + Alibaba | High |
| Functional | Write and upstream EDAC driver for Qualcomm RISC-V SoC (no upstream driver exists for Qualcomm riscv64 platforms) | 8-16 | Qualcomm | Medium |
| CI/CD | Add RAS kselftest cases for riscv64 (HWPOISON signal validation, EINJ basic) | 4-8 | Unassigned | Medium |
| CI/CD | Add GHES functional test job to KernelCI or bjorn CI for riscv64 (requires QEMU RERI emulation or hardware with error injection) | 4-8 | Unassigned | Medium |
| Ecosystem | Upstream QEMU RERI emulation patches (currently in Ventana Micro fork) | 4-8 | Qualcomm / community | Medium |
| Ecosystem | Validate rasdaemon functionality end-to-end on riscv64 once APEI/GHES merged | 1-2 | Unassigned | Low |
| Performance | Establish baseline measurements for GHES error handling latency and SSE notification round-trip on riscv64 | 2-4 | Unassigned | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Patchwork linux-riscv APEI filter](https://patchwork.kernel.org/project/linux-riscv/list/?q=APEI&state=*&archive=both)
- [v4 cover letter (Himanshu Chauhan, 2026-05-13)](https://patchwork.kernel.org/project/linux-riscv/cover/20260513084325.2176952-1-himanshu.chauhan@oss.qualcomm.com/)
- [v4 patch 03/10 - Introduce SSE in HEST notification types](https://patchwork.kernel.org/project/linux-riscv/patch/20260513084325.2176952-4-himanshu.chauhan@oss.qualcomm.com/)
- [v4 patch 08/10 - HEST SSE notification handlers](https://patchwork.kernel.org/project/linux-riscv/patch/20260513084325.2176952-9-himanshu.chauhan@oss.qualcomm.com/)
- [v4 patch 09/10 - Select HAVE_ACPI_APEI](https://patchwork.kernel.org/project/linux-riscv/patch/20260513084325.2176952-10-himanshu.chauhan@oss.qualcomm.com/)
- [v4 patch 10/10 - Enable APEI GHES in defconfig](https://patchwork.kernel.org/project/linux-riscv/patch/20260513084325.2176952-11-himanshu.chauhan@oss.qualcomm.com/)
- [v3 cover letter (2026-01-09, Changes Requested)](https://patchwork.kernel.org/project/linux-riscv/cover/20260109090224.3105465-1-himanshu.chauhan@oss.qualcomm.com/)
- [Alibaba HEE series cover (2026-05-08)](https://patchwork.kernel.org/project/linux-riscv/cover/20260508082020.3368109-1-tianruidong@linux.alibaba.com/)
- [Alibaba HEE patch 1/3 - Introduce HEE in HEST](https://patchwork.kernel.org/project/linux-riscv/patch/20260508082020.3368109-2-tianruidong@linux.alibaba.com/)
- [Alibaba HEE patch 2/3 - HEST HEE handlers](https://patchwork.kernel.org/project/linux-riscv/patch/20260508082020.3368109-3-tianruidong@linux.alibaba.com/)
- [Alibaba HEE patch 3/3 - collect hardware error on HEE](https://patchwork.kernel.org/project/linux-riscv/patch/20260508082020.3368109-4-tianruidong@linux.alibaba.com/)
- [ByteDance rejected GHES RFC patch 1/5](https://patchwork.kernel.org/project/linux-riscv/patch/20250206131926.91289-2-qirui.001@bytedance.com/)
- [Alibaba RFC "Handle synchronous HEE" cover (2025-09-10)](https://patchwork.kernel.org/project/linux-riscv/cover/20250910093347.75822-1-tianruidong@linux.alibaba.com/)
- [copy_mc patch (Ruidong Tian, Bug 1)](https://patchwork.kernel.org/project/linux-riscv/patch/20260508062439.3000014-1-tianruidong@linux.alibaba.com/)
- [HWPOISON signal fix (Ruidong Tian, Bug 2)](https://patchwork.kernel.org/project/linux-riscv/patch/20260508062215.2997173-1-tianruidong@linux.alibaba.com/)
- [ACPICA PR #1170](https://github.com/acpica/acpica/pull/1170)
- [SSE kernel patches v8, Clement Leger (Rivos)](https://lore.kernel.org/all/20251105082639.342973-1-cleger@rivosinc.com/)
- [ACPI ECR for HEST changes (UEFI Mantis 2522)](https://mantis.uefi.org/mantis/view.php?id=2522)
- [RISC-V CPER Table ECR (UEFI Mantis 2551)](https://mantis.uefi.org/mantis/view.php?id=2551)
- [Patchwork linux-edac riscv filter](https://patchwork.kernel.org/project/linux-edac/list/?q=riscv&state=*&archive=both)
- [Linux kernel RAS documentation](https://www.kernel.org/doc/html/latest/admin-guide/ras.html)