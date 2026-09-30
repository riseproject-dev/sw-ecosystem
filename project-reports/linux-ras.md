---
title: Linux RAS
parent: Project Reports
color: orange
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: optional
  - name: bindgen
    relation: build-dependency
    criticality: optional
  - name: dwarves
    relation: build-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: ACPICA
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: EDK2
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-ras" %}

# Linux RAS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux RAS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux RAS (Reliability, Availability, Serviceability) is not an independent, foundation-governed project. It is a kernel subsystem built into mainline Linux, covering:

- The `drivers/ras/` top-level subsystem toggle and trace-event infrastructure
- The EDAC (Error Detection and Correction) framework (`drivers/edac/`)
- ACPI APEI (Advanced Platform Error Interface) and GHES (Generic Hardware Error Source) (`drivers/acpi/apei/`)
- Architecture-specific glue connecting hardware error signals to the above frameworks

Homepage: [https://www.kernel.org/doc/html/latest/admin-guide/ras.html](https://www.kernel.org/doc/html/latest/admin-guide/ras.html)

Repository: [https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)

**Governance:** Standard Linux kernel maintainer-tree model. Patches flow through `linux-edac@vger.kernel.org` (RAS/EDAC) and `linux-acpi@vger.kernel.org` (APEI/GHES), are reviewed by subsystem maintainers, and are pulled by Linus Torvalds each merge window. There is no dedicated RAS foundation, corporate steering body, or formal community-membership tiering. ACPI APEI maintainers/reviewers: Rafael J. Wysocki, Tony Luck (Intel), Borislav Petkov (AMD/kernel.org), Hanjun Guo (Huawei), Mauro Carvalho Chehab (kernel.org), Shuai Xue (Alibaba). RISC-V ACPI is maintained by Sunil V L (Ventana Micro Systems). `arch/riscv` itself, which any RAS glue must pass through, is maintained by Paul Walmsley, Palmer Dabbelt, and Albert Ou, with Alexandre Ghiti as reviewer; the documented acceptance policy (`Documentation/arch/riscv/patch-acceptance.rst`) favors ratified/frozen ISA extensions and well-tested code over experimental churn - a generally welcoming but methodical, conservative stance toward new architecture-enablement work.

**License:** GPL-2.0-only (SPDX), standard kernel-wide licensing.

**First RAS commit:** 2014-06-11, SHA `76ac8275f296b49c58f684825543bf4eb85d43d0`, by Chen Gong (Intel), creating the unified RAS trace-event stub. [NEEDS VERIFICATION - single-source, not independently re-confirmed in this pass]

**Corporate involvement in the RISC-V port:** Lead submitter is Qualcomm (Himanshu Chauhan, formerly at Ventana Micro Systems). Co-developing/reviewing organizations: SiFive (Paul Walmsley, Clement Leger) and Ventana Micro Systems (Sunil V L - QEMU/EDK2 enablement). Alibaba (Ruidong Tian) submits the complementary Hardware Error Exception (HEE) track. General RAS-subsystem maintainers additionally work for AMD, Intel, Huawei.

**RISE project relevance:** RISE (riseproject.dev, an LF Europe-hosted, RISC-V International-affiliated industry consortium) has no tracked involvement with Linux RAS. Exhaustive checks found no RISE blog post (all posts through 2026-09-28 reviewed), no riseproject-dev GitHub repo (all 52 repos checked), no RISE wiki/Confluence page, and no RISE Python wheel-builder entry referencing "Linux RAS" or RAS. The only RAS-adjacent RISE artifact is a single line in the RISE Confluence wiki's EDK2 QEMU Server Reference Platform spec listing the reference board's RAS level as "UNSPECIFIED" for v1 - not a funded workstream. Qualcomm and SiFive, the two organizations driving the upstream RAS patch series, are both RISE Premier Members (alongside Alibaba Damo, Google, MediaTek, NVIDIA, Red Hat, Tenstorrent), so the work aligns loosely with RISE's broader kernel-ecosystem goals without being a tracked RISE deliverable.

## 2. Port History and Upstreaming Timeline

| Date | Event | Author / Org | Status | Source |
|---|---|---|---|---|
| 2014-06-11 | First generic RAS trace-event commit | Chen Gong, Intel | Merged (not RISC-V) | [NEEDS VERIFICATION] |
| 2025-02-06/07 | RFC 0/5 "initial support for GHES" | Rui Qi, ByteDance | Closed/superseded - folded into Chauhan's more comprehensive RERI/RAS design after Chauhan replied citing his own in-progress work | [list.infradead.org](http://lists.infradead.org/pipermail/linux-riscv/2025-February/065900.html) |
| 2025-02-27 | "Add RAS support for RISC-V architecture" RFC v1 (10 patches) | Himanshu Chauhan, Ventana Micro | Superseded | [lkml.iu.edu](https://lkml.iu.edu/2502.3/08133.html), [patchew.org](https://patchew.org/linux/20250227123628.2931490-1-hchauhan@ventanamicro.com/) |
| 2025-09-10 | "Handle synchronous hardware error exception" RFC 0/5 (HEE track) | Ruidong Tian, Alibaba | Superseded | [lkml.org](https://lkml.org/lkml/2025/9/10/599) |
| 2025-10-29 | RAS support RFC v2 (10 patches, aligned to SBI SSE v7) | Himanshu Chauhan, Ventana Micro | Superseded | [lkml.iu.edu](https://lkml.iu.edu/2510.3/12913.html) |
| 2026-01-09 | RAS support v3 (RFC tag dropped, aligned to SSE v8) | Himanshu Chauhan, Qualcomm | Superseded - Changes Requested (Paul Walmsley) | [ratatoskr.run](https://ratatoskr.run/lkml/2026/01/3360004/t) |
| 2026-02-02 | "riscv: add hardware error trap handler support" v1 (standalone trap-handler stub) | Rui Qi | **Merged** - queued for v7.1 by Paul Walmsley on 2026-02-12 | [lkml.iu.edu](https://lkml.iu.edu/hypermail/linux/kernel/2602.0/00841.html) |
| 2026-05-08 | "riscv: log Hardware Error Exception via APEI" PATCH 0/3 (HEE + APEI firmware-first) | Ruidong Tian, Alibaba | **Open**, not yet merged | [ratatoskr.run](https://ratatoskr.run/linux-acpi/2026/05/8036628/t) |
| 2026-05-13 | RAS support v4 (10 patches, rebased to v7.1-rc3) | Himanshu Chauhan, Qualcomm | Superseded by v5 | [ratatoskr.run](https://ratatoskr.run/linux-riscv/2026/05/9002795/t), [LWN](https://lwn.net/Articles/1072622/), [Phoronix](https://www.phoronix.com/news/RISC-V-RAS-RERI-Linux-Patches) |
| 2026-06-14 | Linux v7.1 released, includes Rui Qi's hardware-error trap handler | - | Shipped | Kernel release schedule |
| 2026-09-11 | SBI SSE kernel patches v10 refinement posted (generic notification substrate) | Clement Leger, Rivos | Under review | (per corroborated tree state, `arch/riscv/include/asm/sbi.h`) |
| 2026-09-24 | RAS support v5 (9 patches, rebased to v7.3-rc3, based on SSE v10) | Himanshu Chauhan, Qualcomm | **Open** - current, most recent, no replies yet as of 2026-09-30 | msg-id `20260924073714.1650588-1-himanshu.chauhan@oss.qualcomm.com` |

**Is it fully upstream? No.** The only RISC-V RAS-relevant code that has actually landed in `torvalds/linux.git` is: the minimal hardware-error trap handler (mcause 19 -> `SIGBUS`/`BUS_MCEERR_AR`, shipped v7.1), the SiFive L2/L3 EDAC driver, SiFive/T-Head/Andes errata workarounds, kdump support, and (as generic infrastructure, not RAS-specific) the SBI SSE notification layer. The subsystem's flagship value proposition - ACPI APEI/GHES firmware-first error reporting via RERI (Qualcomm) or via HEE (Alibaba) - remains unmerged as two parallel, competing proposals.

## 3. Upstream Support Tier

No formal upstream support tier exists for RISC-V RAS. The kernel `MAINTAINERS` file has no `RISCV RAS` or `EDAC RISCV` entry; the only RISC-V-adjacent EDAC entry is `EDAC_SIFIVE`, scoped to one SoC family. The patchwork delegate for the series, Paul Walmsley (pjw), returned "Changes Requested" on v3 (2026-01-09); no Acked-by has been issued for v4 or v5.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `HAVE_ACPI_APEI` selected | Yes | Yes | No |
| `ACPI_APEI_GHES` buildable | Yes | Yes | No |
| CI exercising RAS functionality | Partial (x86 MCE paths) | Partial | None (no KernelCI, no rasdaemon-ci coverage) |
| Official release including RAS support | Every distro kernel | Every distro kernel | None - feature absent from mainline |

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Notification mechanisms

RISC-V has no NMI. Two competing notification mechanisms are proposed:

- **SSE (Supervisor Software Events)** - used by the Qualcomm/Chauhan RERI series. Defined in RISC-V SBI v3.0 chapter 19. Each GHES entry registers with the SSE layer at lo/hi priority, both delegating to `__ghes_sse_callback(fixmap_idx)`. Already merged in OpenSBI. The SBI SSE kernel-side notification layer itself (Clement Leger, Rivos) is corroborated as present in `arch/riscv/include/asm/sbi.h` in the current tree, with a v10 refinement posted 2026-09-11 - i.e., the generic notification substrate the RAS series depends on is largely in place; what remains unmerged is the RAS-specific consumer (RERI decode plus GHES/SSE wiring).
- **HEE (Hardware Error Exception)** - used by the Alibaba/Tian series. A synchronous exception at mcause=19, analogous to arm64's SEA (Synchronous External Abort). The minimal trap-handler stub (raise `SIGBUS`/`BUS_MCEERR_AR` on HEE, no firmware-first reporting) is merged (Linux v7.1). The follow-on that wires HEE into APEI/GHES for firmware-first CPER reporting (`CONFIG_ACPI_APEI_HEE`, new HEST notification type 13) is still open (PATCH 0/3, 2026-05-08).

These paths are designed to coexist (SSE covers asynchronous/firmware-first events, HEE covers synchronous CPU traps) but have not been submitted as a single coordinated series; see Bug 3 in Section 11 for the resulting HEST-notify-value conflict.

### 4.2 Specification basis

- RISC-V RERI (RAS Error-record Register Interface) v1.0
- ACPI ECR for HEST changes: [Mantis #2522](https://mantis.uefi.org/mantis/view.php?id=2522)
- RISC-V CPER Table ECR: [Mantis #2551](https://mantis.uefi.org/mantis/view.php?id=2551)
- SBI SSE kernel patches (Clement Leger, Rivos), v8 -> v10 (posted 2026-09-11)

### 4.3 Files touched by the Qualcomm v4/v5 series (diffstat confirmed for v4; v5 reduced the patch count from 10 to 9, exact per-file diffstat for v5 not independently captured - data not available beyond the cover-letter summary)

- `arch/riscv/Kconfig` (+1: `select HAVE_ACPI_APEI if ACPI`)
- `arch/riscv/configs/defconfig` (+3: `CONFIG_ACPI_APEI=y`, `CONFIG_ACPI_APEI_GHES=y`, `CONFIG_ACPI_APEI_ERST_DEBUG=y`)
- `arch/riscv/include/asm/acpi.h`, `fixmap.h`, `io.h`
- `arch/riscv/kernel/acpi.c`
- `drivers/acpi/apei/Kconfig`, `ghes.c`
- `drivers/firmware/efi/cper.c` (adds "RISC-V" processor-type string, "RV32/RV32E"/"RV64" ISA strings)
- `drivers/firmware/riscv/riscv_sbi_sse.c`, `include/linux/riscv_sbi_sse.h` (new files)
- `include/acpi/actbl1.h` (inserts `ACPI_HEST_NOTIFY_SSE = 12`)

Sample injected-TLB-error output from the v4/v5 QEMU+OpenSBI+EDK2 test rig:

```
{1}[Hardware Error]: Hardware error from APEI Generic Hardware Error Source: 1
{1}[Hardware Error]: event severity: recoverable
{1}[Hardware Error]:   processor_type: 3, RISCV
{1}[Hardware Error]:   processor_isa: 6, RISCV64
{1}[Hardware Error]:   error_type: 0x02
{1}[Hardware Error]:   TLB error
```

This is functional validation on an emulated RERI device, not a performance benchmark, and has never run against real silicon.

### 4.4 Relevance of the JIT/SIMD/crypto rubric

This is an error-reporting plumbing feature wired to firmware (SBI/ACPI), not a computational kernel. There is no assembly-level RAS code (`.S` files), no JIT backend, and no SIMD dispatch relevant to RAS. The "hand-tuned / intrinsics / scalar fallback / missing" optimization taxonomy used for compute kernels does not map onto this subsystem; RISC-V RAS is binary: the ACPI APEI/GHES capability is either present or absent, and today it is absent.

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses Kbuild (GNU Make + Kconfig), not CMake and not autoconf. There is no Dockerfile or containerized build image anywhere in `torvalds/linux.git`.

```bash
# GCC toolchain
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image

# Clang/LLVM toolchain
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image
```

Output: `arch/riscv/boot/Image`.

**Toolchain minimums** (`Documentation/process/changes.rst`, general kernel-wide floor):

| Tool | Minimum | riscv64-specific constraint |
|---|---|---|
| GCC | 8.1.0 | `GCC_VERSION < 110300` triggers `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` (`-Wa,-misa-spec=2.2` workaround for zicsr/zifencei handling); GCC 12+ recommended |
| Clang/LLVM | 17.0.1 | LLVM < 18.0.0 breaks DWARF5 debug info when using the integrated assembler/LLD (`ARCH_HAS_BROKEN_DWARF5`); LLVM 18+ recommended |
| Binutils | 2.30.0 | `AS_VERSION >= 23600` (2.36+) needed for explicit zicsr/zifencei; `LD_VERSION >= 23800` (2.38+) for Vector extension linking; `LD_VERSION >= 23900` (2.39+) for Zba/Zbc/Zbkb; 2.39+ recommended |
| Rust (optional) | 1.85.0 | riscv64-only; requires `RUSTC_SUPPORTS_RISCV && CC_IS_CLANG && 64BIT` - Rust-for-Linux on RISC-V needs Clang, not GCC |
| bindgen (optional) | 0.71.1 | Rust FFI binding generator, needed only if Rust-for-Linux is enabled |

**QEMU usage** is driven by KUnit's own harness, not a standalone documented QEMU guide (checked `Documentation/arch/riscv/boot.rst` and `boot-image-header.rst`: neither contains build/QEMU examples). The actual config lives in `tools/testing/kunit/qemu_configs/riscv.py`:

```
qemu-system-riscv64 -machine virt -cpu rv64 \
  -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin \
  -kernel arch/riscv/boot/Image \
  -append "console=ttyS0" -nographic
```

Testing of the RAS/RERI series specifically uses QEMU (RERI emulation), OpenSBI (RAS agent / CPER records), EDK2 (HEST/GHES ACPI table generation), and `devmem` for error injection; none of this is in mainline QEMU's default RERI support, which is confirmed absent (see Section 7).

**Known build-affecting facts:** `arch/riscv/Kconfig` today does not select `HAVE_ACPI_APEI`, so `CONFIG_ACPI_APEI`/`CONFIG_ACPI_APEI_GHES` cannot be enabled on riscv64 at all until patch 09/10 (or its v5 equivalent) merges.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `EDAC` framework | Yes | Yes | Yes (framework only) |
| Vendor EDAC drivers | Extensive | Extensive | SiFive only |
| `ACPI_APEI` / `GHES` | Yes | Yes | No - `HAVE_ACPI_APEI` not selected |
| `ARCH_SUPPORTS_MEMORY_FAILURE` | Yes | Yes | No |
| `RAS_CEC` | Yes | No | No (depends on `X86_MCE`) |
| `MEMORY_FAILURE` | Yes | Yes | No |
| MCE/MCA framework | Yes (x86) | No | No |
| CPER processor type/ISA strings | Yes | Yes | No (pending) |
| Synchronous hardware-error trap -> SIGBUS | Yes (#MC) | Yes (SEA) | Yes - merged v7.1 (bare trap only, no firmware-first CPER decode yet) |
| Firmware-first error notification | APEI/GHES | SDEI/SEA | Pending (SSE and HEE tracks, both unmerged for the APEI-integration piece) |
| Crash dump (kdump) | Yes | Yes | Yes |
| CPU vulnerability sysfs | Yes | Yes | Yes (GhostWrite mitigation) |
| Vendor errata runtime patching | Yes | Yes | Yes (SiFive CIP-453/CIP-1200, T-Head GhostWrite/CMO, Andes AX45MP) |
| PCIe AER | Yes | Yes | Yes (architecture-agnostic) |

AMD-specific components (`AMD_ATL`, `RAS_FMPM`, `EDAC_DECODE_MCE`) are `depends on X86_64`/`X86_MCE` and categorically not applicable to riscv64; no action item follows from their absence.

**Functional gap:** riscv64 cannot report firmware-detected hardware errors (memory, cache, interconnect) through the standard ACPI APEI/GHES path at all today - the only path available is the bare synchronous trap added in v7.1, which delivers a signal but no structured CPER error record.

**Performance gap:** Data not available - no benchmark exists comparing GHES/EDAC error-handling latency or SSE notification round-trip time between riscv64 and arm64/amd64, because the feature is not yet merged on riscv64.

## 7. CI/CD Infrastructure

**In the kernel git tree itself, there is no CI configuration for any architecture.** A direct fetch of `git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/` (HTTP 200, actual content, not a bot-block page) shows the complete top-level listing contains no `.github/`, no `.gitlab-ci.yml`, no `.cirrus.yml`, and no other CI config file; the GitHub read-only mirror also returns HTTP 404 for `.github/workflows/ci.yml`. This is true of mainline Linux generally, not specific to RAS or riscv64.

Separately, the kernel.org **patchwork** system runs an external bot ("bjorn") against every submission to the linux-riscv project, reporting checks including `bjorn/build-rv64-gcc-allmodconfig`, `bjorn/build-rv64-clang-allmodconfig`, `bjorn/pre-ci_am` (apply check), `bjorn/checkpatch`, and others. [NEEDS VERIFICATION - this detail is carried from prior research and was not independently re-fetched in the most recent verification pass; the underlying bjorn CI infrastructure itself was not publicly inspectable.] Per the available evidence, every revision of the Qualcomm RAS series (RFC v1 through v4, and reportedly v5) has failed `bjorn/pre-ci_am` ("Failed to apply series"), which blocks the downstream riscv64 build jobs from running at all.

**KernelCI** runs 15 riscv64 jobs (`kbuild-gcc-14-riscv`, `kbuild-clang-21-riscv`, plus LAVA boot tests on StarFive VisionFive 2/v1, Allwinner D1 Nezha, SpacemiT K1 Banana Pi F3, and Eswin HiFive Premier P550) but none are RAS-specific; `drivers/ras/Kconfig` has zero riscv64 references and `tools/testing/selftests/riscv/` has no RAS/EDAC/GHES/APEI tests.

**rasdaemon-ci** (`mchehab/rasdaemon-ci`), the dedicated CI for the userspace RAS daemon, was directly checked across all its workflow files (`linux-kernel.yml`, `pipeline.yml`, `publish-results.yml`, `qemu-fuzz.yml`, `qemu-image.yml`, `qemu-tests.yml`, `qemu.yml`, `rasdaemon.yml`): the architecture matrix contains only `x86_64` and `aarch64`, no `riscv64` entry anywhere. Its own documentation explicitly lists RERI (RISC-V Error Report Interface) testing as "not implemented" because QEMU has no RERI event producer or injection mechanism, flagged as a "planned RISC-V test" pending QEMU support.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree kernel CI config | None (none for any arch) | None | None |
| Patchwork bot build checks | Yes | Yes | Yes (build only; RAS series specifically fails apply) |
| KernelCI RAS-specific tests | No | No | No |
| rasdaemon-ci arch coverage | Yes | Yes | No - explicitly absent, "not implemented" |

No RISE-provided runner involvement with RAS CI was found in any source.

## 8. Distribution and Release Status

"Linux RAS" is not distributed as a standalone package under that name on any channel: PyPI (`linux-ras`) returns HTTP 404 on both the JSON and simple index; the GitLab RISE wheel builder redirects to the same 404; Ubuntu 26.04 "resolute" package search returns no `linux-ras`/`python3-linux-ras`/`liblinux-ras` match (the only substring hits are unrelated arm64-only `linux-raspi*` Raspberry Pi kernel packages); Arch Linux RISC-V (archriscv.felixc.at) has no matching package. This is expected: RAS is compiled into the kernel image itself, not shipped as a separate artifact.

The relevant userspace consumer is `rasdaemon`, which reads kernel RAS/EDAC/MCE trace events. It **is** packaged for riscv64 in Ubuntu 26.04 "resolute" (v0.8.4-1), with its full dependency chain (`libc6`, `libsqlite3-0`, `sqlite3`, `libtraceevent1`, `libpci3`, `perl`, `libdbd-sqlite3-perl`, `init-system-helpers`) resolving cleanly on riscv64. `mcelog`, listed in the kernel's own minimal-requirements doc, is absent from the archive entirely - a global, project-wide deprecation in favor of rasdaemon, not a riscv64-specific gap.

**What a user must do to get working RAS on riscv64 today:** nothing produces a working result, because the firmware-first APEI/GHES capability that `rasdaemon` is meant to consume does not exist in mainline riscv64 kernels. A user gets only the bare `SIGBUS`/`BUS_MCEERR_AR` signal from the v7.1 trap handler on a genuine hardware error, with no structured error record, no EDAC reporting beyond SiFive L2/L3, and no `rasdaemon` functional validation possible end-to-end.

## 9. Dependencies

| Dependency | Role | riscv64 Build Status | riscv64 Test Status | riscv64 Release Status | Notes |
|---|---|---|---|---|---|
| GCC | Build-dependency, critical | Builds on riscv64; `gcc-14` v14.3.0 packaged in Ubuntu 26.04 resolute | First-class riscv64 porter architecture | Released | GCC < 11.3 triggers a zicsr/zifencei ISA-spec workaround (`TOOLCHAIN_NEEDS_OLD_ISA_SPEC`); GCC 12+ recommended |
| GNU binutils | Build-dependency, critical | Builds; v2.46 packaged in Ubuntu 26.04 resolute | First-class riscv64 porter architecture | Released | AS >= 2.36 required for explicit zicsr/zifencei; LD >= 2.38 for Vector extension; LD >= 2.39 for Zba/Zbc/Zbkb |
| LLVM | Build-dependency, critical | Builds via `make LLVM=1` | Supported alt-toolchain path | Released (distro-packaged clang/lld) | LLVM < 18.0.0 breaks DWARF5 debug info on riscv64 (`ARCH_HAS_BROKEN_DWARF5`); minimum 17.0.1, 18+ recommended |
| Rust | Build-dependency, optional | Builds; `rustc` v1.93.1 packaged in Ubuntu 26.04 resolute | Requires Clang, not GCC, on riscv64 (`CC_IS_CLANG` gate); combination not independently verified here | Released | Needed only if Rust-for-Linux is enabled alongside RAS code; `RUSTC_SUPPORTS_RISCV` additionally requires `64BIT` |
| bindgen | Build-dependency, optional | Builds; v0.72.1 packaged in Ubuntu 26.04 resolute | Not RAS-specific tested | Released | Rust FFI binding generator for Rust-for-Linux |
| dwarves | Build-dependency, critical | Builds; v1.31 packaged in Ubuntu 26.04 resolute. Binary `dwarves` package itself ships only for amd64/arm64, but `pahole` - the tool actually used by kernel CI - is the riscv64-built binary | Works as part of standard kernel BTF-generation CI (`CONFIG_DEBUG_INFO_BTF`) | Released | Used by CI builds of the RAS/EDAC patch series for BTF debug info |
| OpenSBI | Runtime-dependency, critical | SSE (Supervisor Software Events), the notification mechanism the Qualcomm RAS series depends on, is already merged in OpenSBI | Used in all QEMU+OpenSBI+EDK2 functional tests of the RAS series | Released (upstream) | Provides the RAS agent / CPER record generation in the v4/v5 test rig |
| ACPICA | Runtime-dependency, critical | Out-of-tree as far as the kernel's copy of `include/acpi/actbl1.h` is concerned | Not tested | Not released for this feature | **Primary merge blocker**: Rafael Wysocki flagged that the new `ACPI_HEST_NOTIFY_SSE`/HEE notification-type constants must land in upstream ACPICA first; author confirmed [ACPICA PR #1170](https://github.com/acpica/acpica/pull/1170) is open and unmerged as of 2026-09-30 |
| QEMU | Test-dependency, critical | Mainline QEMU has no RERI event producer or injection mechanism; RERI testing is used only via a Ventana Micro fork | rasdaemon-ci explicitly lists RERI as "not implemented," a "planned RISC-V test" pending QEMU support | Not released for RERI | Confirmed absent from both rasdaemon-ci's test matrix and mainline QEMU |
| EDK2 | Test-dependency, optional | Used out-of-tree (Ventana Micro fork) to generate HEST/GHES ACPI tables for the QEMU test rig | Functional in the v4/v5 cover-letter demo only | Not released upstream for this purpose | [NEEDS VERIFICATION] |
| rasdaemon | Userspace consumer of kernel RAS/EDAC/MCE trace events | Builds on riscv64 (Ubuntu 26.04 resolute, v0.8.4-1), full dep chain resolves | Not end-to-end validated - blocked on upstream GHES/APEI, not on rasdaemon itself | Released (universe) | The direct userspace target of this whole subsystem |
| mcelog | Legacy x86 MCE decoder, listed in kernel's minimal-requirements doc | Absent from Ubuntu archive entirely | N/A | Not released, any arch | Global upstream deprecation in favor of rasdaemon, not riscv64-specific |
| edac-utils | Legacy EDAC userspace reporting tool | Builds on riscv64 (v0.18+git16-g8fdc1d4-3) | Not systematically tested | Released (universe) | Largely superseded by rasdaemon/sysfs |
| acpica-tools (iasl) | ACPI AML compiler/disassembler for authoring/validating DSDT/SSDT/HEST tables | Builds on riscv64 (v20251212-1) | Not RAS-specific tested | Released (universe) | Used to build the HEST tables the RAS series depends on |
| kexec-tools | Userspace side of kdump | Builds on riscv64 (v1:2.0.32-3ubuntu1) | Not RAS-specific tested | Released (main) | Consumes already-mainlined `crash_dump.c`/`vmcore_info.c` |
| makedumpfile | Post-mortem vmcore analysis | Builds on riscv64 (v1:1.7.7-1) | Not RAS-specific tested | Released (main/universe) | RAS-triggered crash/kdump analysis |
| crash | Interactive vmcore/live-kernel debugger | Builds on riscv64 (v9.0.1+~16.3-1ubuntu1) | Not RAS-specific tested | Released (universe) | Post-mortem RAS/EDAC state inspection |
| ipmitool | BMC out-of-band hardware error/health reporting | Builds on riscv64 (v1.8.19-10ubuntu1) | Not RAS-specific tested | Released (main) | Server-platform RAS-adjacent tooling |

Of the full candidate toolchain/userspace list checked against Ubuntu 26.04 "resolute," only `mcelog` is absent, and that is a global archive removal, not a riscv64-specific gap. The build/test/toolchain chain needed to compile and package RAS-adjacent code is not the blocker for this project; the blocker is entirely upstream kernel-side (`arch/riscv/Kconfig` not selecting `HAVE_ACPI_APEI`, plus the unmerged ACPICA PR #1170 dependency).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| Bug 1 | `memcpy_mc` symbol not exported, blocks modular NVDIMM | Under review (patch: "riscv: add copy_mc_to_{kernel,user} support"; Ruidong Tian, Alibaba, 2026-05-08) | High - correctness/link failure | `modpost` fails with `ERROR: "memcpy_mc" [drivers/nvdimm/libnvdimm.ko] undefined!` reproduced on `linus/master`, v6.16-rc1, and `next-20260508`. Without native `copy_mc_*` hooks, an access to poisoned memory takes the kernel down instead of recovering. Additional CI failures on `rv64-clang-allmodconfig`, `rv64-gcc-allmodconfig`, both `nommu-k210` configs |
| Bug 2 | HWPOISON faults signal wrong code (`BUS_ADRERR` instead of `BUS_MCEERR_AR`) | Under review (patch: "riscv: mm: Add proper handling for HWPOISON faults", RESEND; Ruidong Tian, Alibaba, originally 2025-09-30, resent 2026-05-08) | High - correctness, affects all existing RAS tooling on RISC-V | Before: `signal 7 code 2 addr 0x7fff95bdc400`. After: `signal 7 code 4 addr 0x7fff95bdc400`. `si_addr_lsb` was also unpopulated. Userspace RAS managers (rasdaemon, mcelog) that branch on `BUS_MCEERR_AR` vs `BUS_ADRERR` currently get incorrect recovery signals on RISC-V. Build checks passed; checkpatch (style) flagged |
| Bug 3 | HEST notify-value conflict between the Qualcomm and Alibaba series | Unresolved, no coordinated patch posted | Medium - integration risk if merged out of order | Qualcomm assigns `ACPI_HEST_NOTIFY_SSE = 12`; Alibaba assigns `ACPI_HEST_NOTIFY_HEE = 13`. If the Alibaba series applies without Qualcomm's, `HEE` would collide with the current `RESERVED = 12`. The two series must be merged in a coordinated order or reconciled into one |
| Bug 4 | Two SiFive EDAC drivers (DDR controller, Bus Error Unit) stalled since 2020 | Unmerged, appears stalled | Low | [NEEDS VERIFICATION - single patchwork search result, not independently re-confirmed] |

No kernel.org Bugzilla entries exist for this work; it is tracked purely via LKML/lore mailing-list threads, consistent with general kernel practice.

## 12. Objections and Upstream Blockers

**Blocker 1 - CI pre-apply failure.** Every revision of the Qualcomm series through v4 (and reportedly v5) has failed the patchwork `bjorn/pre-ci_am` apply check, which blocks the riscv64 build jobs from running at all. [NEEDS VERIFICATION for v5 specifically - not independently re-confirmed this pass]

**Blocker 2 - ACPICA upstream dependency (primary/active blocker).** `include/acpi/actbl1.h` is ACPICA-owned; Rafael Wysocki required that the new SSE (and now HEE) HEST notification-type constants go through upstream ACPICA first. [ACPICA PR #1170](https://github.com/acpica/acpica/pull/1170) is open and unmerged as of 2026-09-30. Neither the Qualcomm patch 3/10 (SSE) nor Alibaba's HEE constant can be finalized in the kernel tree until this lands.

**Blocker 3 - SSE kernel patches (largely resolved).** The Qualcomm series depends on the SBI SSE notification layer (Clement Leger, Rivos), which the current tree confirms is present in `arch/riscv/include/asm/sbi.h`, with a v10 refinement posted 2026-09-11. This dependency is no longer a hard blocker for the RAS series in the way it was previously; remaining coordination is a version-alignment matter rather than a missing-prerequisite one.

**Blocker 4 - No maintainer Acked-by.** Paul Walmsley returned "Changes Requested" on v3; no Acked-by exists for v4 or v5.

**Blocker 5 - No `ARCH_SUPPORTS_MEMORY_FAILURE`.** No patch series addresses this for riscv64. Without it, `MEMORY_FAILURE`, `RAS_CEC`, and `ACPI_APEI_MEMORY_FAILURE` remain unavailable, limiting even a fully-merged GHES stack to detection/logging without kernel-level memory-error recovery.

**Blocker 6 - Competing approaches, partially reconciled.** SSE (Qualcomm) and HEE (Alibaba) serve different error categories and are meant to coexist; the HEE trap-handler stub did merge independently (v7.1), showing the two tracks can progress separately at the margins. But the fuller APEI-integration pieces of both (Qualcomm's GHES/SSE wiring, Alibaba's HEE-via-APEI) remain unmerged and uncoordinated, with the HEST-notify-value conflict (Bug 3) unresolved.

**Acceptance probability:** Moderate-to-good once the ACPICA PR lands - reviewers (Wysocki, Sunil V L, Anup Patel) are engaged and constructive rather than rejecting the design; v4 already carries one internal Reviewed-by. The gating item is external (ACPICA), not a design objection.

## 13. Readiness Assessment

- **Color:** orange (downstream-only - approximate; no upstream CI or test coverage for the core riscv64 RAS/GHES/APEI functionality, and no distro can supply it since it is absent from mainline)
- **Release provider:** none

**Justification:** Mainline riscv64 has only a minimal RAS surface merged (bare hardware-error trap -> `SIGBUS`/`BUS_MCEERR_AR`, shipped in Linux v7.1; the SiFive L2/L3 EDAC driver; vendor errata workarounds; kdump support), but the subsystem's core value proposition - ACPI APEI/GHES firmware-first error reporting - cannot even be built on riscv64 today, since `arch/riscv/Kconfig` does not select `HAVE_ACPI_APEI` (see [arch/riscv/Kconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/arch/riscv/Kconfig)), and no CI anywhere (KernelCI, rasdaemon-ci) exercises RAS-specific functionality on riscv64 (see [kernel RAS admin guide](https://www.kernel.org/doc/html/latest/admin-guide/ras.html)). This matches the orange criterion of "no upstream CI / no test / no release of the feature" rather than red, since nothing merged is confirmed broken - the flagship GHES/APEI capability is simply absent/unimplemented for this architecture, still blocked in patch review.

**Pending work that could change the grade:** The Qualcomm/Ventana "Add RAS support for RISC-V architecture" series remains open and unmerged through five revisions (RFC v1, 2025-02; RFC v2, 2025-10; v3, 2026-01; v4, 2026-05; v5, 2026-09-24, 9 patches, rebased to v7.3-rc3, based on SSE v10, no replies yet as of this writing), blocked primarily on the external ACPICA PR #1170 for the new SSE HEST notification type, and reportedly failing CI pre-apply on prior revisions. Alibaba's complementary "log HEE via APEI" 3-patch follow-on (Ruidong Tian, 2026-05-08) is also open and unmerged. Either series landing - and in particular the ACPICA PR merging - would materially improve the riscv64 RAS CI/build/release picture and should be the trigger for re-grading.

## 14. Investment Analysis

RISE has no tracked funded work on Linux RAS (see Section 1); no sizing below duplicates RISE-funded effort.

### 14.1 Functional Enablement

The primary gap is the absent APEI/GHES capability. The Qualcomm v5 series (currently 9 patches) is the most mature candidate and carries at least one internal Reviewed-by, but is blocked on the external ACPICA PR #1170 and has a history of CI pre-apply failures. The Alibaba HEE-via-APEI series (3 patches) is complementary and covers the synchronous-exception path with firmware-first reporting; its merge is independent of but should be coordinated with Qualcomm's (Bug 3).

### 14.2 Performance Optimization

Not applicable in the conventional sense - this is error-reporting plumbing, not a compute kernel. Data not available: no benchmark for GHES error-handling latency, EDAC interrupt overhead, or SSE notification round-trip time on any RISC-V platform exists in any accessible source, because the feature has not merged.

### 14.3 CI/CD Infrastructure

No RAS-specific functional CI exists for riscv64 in KernelCI, in the patchwork bjorn bot, or in rasdaemon-ci (which explicitly marks RERI testing "not implemented" pending a QEMU RERI event producer). Establishing it requires, in order: (a) landing GHES/APEI support in mainline, (b) an EINJ-equivalent or RERI error-injection mechanism for RISC-V in QEMU or on real hardware, and (c) a test job added to KernelCI or an equivalent CI system.

### 14.4 Ecosystem Enablement

The two Alibaba correctness patches (memcpy_mc export, HWPOISON signal-code fix; Section 11 Bugs 1-2) are prerequisites for any correct RAS behavior at the kernel-userspace boundary on riscv64 - `BUS_MCEERR_AR` signaling is required for rasdaemon and mcelog-class tools to function correctly, and the missing `EXPORT_SYMBOL_GPL` for `memcpy_mc` must be fixed before any persistent-memory workload on RISC-V is safe from silent kernel crashes on poisoned-memory access.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Land ACPICA PR #1170 and synchronize kernel patch 03/10 (or v5 equivalent) | 1-2 (coordination) | Qualcomm + ACPICA maintainers | Critical |
| Functional | Resolve CI pre-apply failure and get v5 through `bjorn/pre-ci_am` and riscv64 build jobs | 1-2 | Qualcomm (Himanshu Chauhan) | Critical |
| Functional | Add `EXPORT_SYMBOL_GPL` for `memcpy_mc` (Bug 1) | < 1 | Alibaba (Ruidong Tian) | High |
| Functional | Fix HWPOISON `BUS_MCEERR_AR` signal code (Bug 2) | < 1 | Alibaba (Ruidong Tian) | High |
| Functional | Reconcile HEST notify-value conflict (Bug 3) between Qualcomm and Alibaba series into a coordinated merge order | 1-2 | Qualcomm + Alibaba | High |
| Functional | Add `ARCH_SUPPORTS_MEMORY_FAILURE` for RISC-V and a memory-error recovery path | 4-8 | Unassigned | High |
| Functional | Upstream a mainline QEMU RERI event producer/injection mechanism (currently only in a Ventana Micro fork) | 4-8 | Qualcomm / community | Medium |
| Functional | Write and upstream an EDAC driver for Qualcomm RISC-V SoCs (none exists today) | 8-16 | Qualcomm | Medium |
| CI/CD | Add RAS kselftest cases for riscv64 (HWPOISON signal validation, EINJ-equivalent) | 4-8 | Unassigned | Medium |
| CI/CD | Add a GHES functional test job to KernelCI once QEMU RERI support lands | 4-8 | Unassigned | Medium |
| CI/CD | Add riscv64 to rasdaemon-ci's test matrix once RERI/GHES is mainline-usable | 2-4 | Unassigned | Low |
| Ecosystem | Validate rasdaemon functionality end-to-end on riscv64 once APEI/GHES merges | 1-2 | Unassigned | Low |
| Performance | Establish baseline GHES error-handling latency / SSE round-trip measurements on riscv64 | 2-4 | Unassigned | Low |

## 15. References

- [Linux kernel RAS documentation](https://www.kernel.org/doc/html/latest/admin-guide/ras.html)
- [git.kernel.org - torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [arch/riscv/Kconfig (mainline)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/arch/riscv/Kconfig)
- [RAS support for RISC-V, v4 cover letter (ratatoskr.run mirror)](https://ratatoskr.run/linux-riscv/2026/05/9002795/t)
- [RAS support for RISC-V, v3 (ratatoskr.run mirror)](https://ratatoskr.run/lkml/2026/01/3360004/t)
- [RAS support for RISC-V, RFC v2 (lkml.iu.edu mirror)](https://lkml.iu.edu/2510.3/12913.html)
- [RAS support for RISC-V, RFC v1 (lkml.iu.edu mirror)](https://lkml.iu.edu/2502.3/08133.html)
- [RAS support for RISC-V, RFC v1 (patchew.org mirror)](https://patchew.org/linux/20250227123628.2931490-1-hchauhan@ventanamicro.com/)
- [Precursor GHES RFC discussion (lists.infradead.org)](http://lists.infradead.org/pipermail/linux-riscv/2025-February/065900.html)
- [HEE synchronous hardware error exception RFC (lkml.org)](https://lkml.org/lkml/2025/9/10/599)
- [HEE trap handler support v1 (lkml.iu.edu mirror)](https://lkml.iu.edu/hypermail/linux/kernel/2602.0/00841.html)
- [HEE: log Hardware Error Exception via APEI, PATCH 0/3 (ratatoskr.run mirror)](https://ratatoskr.run/linux-acpi/2026/05/8036628/t)
- [LWN: Add RAS support for RISC-V architecture](https://lwn.net/Articles/1072622/)
- [LWN: related coverage](https://lwn.net/Articles/1053519/)
- [Phoronix: Qualcomm Sends Out Linux Patches For RAS Support On RISC-V](https://www.phoronix.com/news/RISC-V-RAS-RERI-Linux-Patches)
- [copy_mc_to_{kernel,user} support patch (Bug 1)](https://patchwork.kernel.org/project/linux-riscv/patch/20260508062439.3000014-1-tianruidong@linux.alibaba.com/)
- [HWPOISON signal fix, RESEND (Bug 2)](https://patchwork.kernel.org/project/linux-riscv/patch/20260508062215.2997173-1-tianruidong@linux.alibaba.com/)
- [ACPICA PR #1170](https://github.com/acpica/acpica/pull/1170)
- [SBI SSE kernel patches, Clement Leger (Rivos)](https://lore.kernel.org/all/20251105082639.342973-1-cleger@rivosinc.com/)
- [ACPI ECR for HEST changes (UEFI Mantis 2522)](https://mantis.uefi.org/mantis/view.php?id=2522)
- [RISC-V CPER Table ECR (UEFI Mantis 2551)](https://mantis.uefi.org/mantis/view.php?id=2551)
- [Patchwork linux-riscv APEI filter](https://patchwork.kernel.org/project/linux-riscv/list/?q=APEI&state=*&archive=both)
- [Patchwork linux-edac riscv filter](https://patchwork.kernel.org/project/linux-edac/list/?q=riscv&state=*&archive=both)
- [rasdaemon-ci workflows (mchehab/rasdaemon-ci)](https://github.com/mchehab/rasdaemon-ci)
- [PyPI linux-ras (404, confirmed absent)](https://pypi.org/pypi/linux-ras/json)
- [RISE project blog](https://riseproject.dev/blog/)
- [Documentation/process/changes.rst toolchain minimums, Documentation/kbuild/kbuild.rst, tools/testing/kunit/qemu_configs/riscv.py - read directly from git.kernel.org plain views](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/)