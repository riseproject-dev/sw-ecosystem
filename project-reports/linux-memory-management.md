---
title: Linux memory management
parent: Project Reports
color: yellow
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: dtc
    relation: build-dependency
    criticality: critical
  - name: ACPICA
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-memory-management" %}

# Linux memory management

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux memory management<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

Scope: RISC-V memory management in mainline Linux (`arch/riscv/mm`, the RISC-V Kconfig selects, and the generic `mm/` hooks they use). Boot-time early page tables are covered by "Linux boot and MMU". KASAN and KFENCE are covered by "Linux hardening". Evidence comes from the kernel clone at v7.4-rc1-132-g05441d697f7f (HEAD committed 2026-11-03). lore.kernel.org, patchwork.kernel.org and git.kernel.org were not accessible, so mailing-list state is unverified throughout.

## 1. Project Overview

**Technical description.** Linux memory management (MM) is the kernel subsystem for page allocation, virtual memory, page tables, huge pages, reclaim and swap, NUMA, memory hotplug, CMA, userfaultfd and related features. The RISC-V part lives in `arch/riscv/mm/`:

| File | Function |
|---|---|
| `init.c` | memblock and zone setup, satp mode selection (Sv39/Sv48/Sv57 with fallback), swapper page tables, `vmemmap_populate` with huge pages, `arch_numa_init`, crashkernel CMA reservation |
| `fault.c`, `extable.c` | Fault handling and exception tables |
| `pageattr.c` | `set_memory_*` and `set_direct_map` |
| `pgtable.c` | THP/PMD helpers |
| `tlbflush.c` | Svinval via `has_svinval()`, SBI remote sfence, NAPOT-stride flushing |
| `context.c` | ASID allocator sized from the hardware ASID bits, disabled when ASIDs are scarce |
| `hugetlbpage.c` | Svnapot contiguous huge pages (64KB up to NAPOT_ORDER_MAX), `arch_hugetlb_cma_order` |
| `cacheflush.c`, `cache-ops.c`, `dma-noncoherent.c`, `pmem.c` | Cache maintenance, Zicbom non-coherent DMA, `ALT_CMO_OP` |
| `ptdump.c`, `physaddr.c` | Kernel page-table dumper, `DEBUG_VIRTUAL` |

The only MM-specific assembly is `arch/riscv/lib/clear_page.S`. The relevant headers are under `arch/riscv/include/asm/` (`pgtable.h`, `pgtable-64.h`, `pgtable-bits.h`, `hugetlb.h`, `tlbflush.h`, `sparsemem.h`, `numa.h` and others). Layout is documented in `Documentation/arch/riscv/vm-layout.rst`, which still has a "TODO" for Sv32.

**Governance.** MM is not a separate legal entity or foundation project. It is governed through the kernel maintainer-tree hierarchy ending at Linus Torvalds. MAINTAINERS "MEMORY MANAGEMENT" lists Andrew Morton as sole `M:` (list linux-mm@kvack.org, status Maintained, `F: mm/` and `tools/mm/`). Patches are carried in the akpm/mm tree. "MEMORY MANAGEMENT - CORE" adds David Hildenbrand as maintainer, with reviewers Lorenzo Stoakes, Liam R. Howlett, Vlastimil Babka, Mike Rapoport, Suren Baghdasaryan (Google) and Michal Hocko (SUSE). Sub-entries: GUP (reviewers Jason Gunthorpe and John Hubbard of NVIDIA, Peter Xu of Red Hat), EXECMEM (Mike Rapoport) and ALLOC TAG (Suren Baghdasaryan). Company affiliations are derived from email domains only. kernel.org, linux.dev and infradead.org addresses do not state an employer [NEEDS VERIFICATION].

**Licence.** GPL-2.0, per the SPDX header on `Documentation/arch/riscv/patch-acceptance.rst` and the kernel as a whole. A per-directory licence check for `mm/` was not done [NEEDS VERIFICATION]. The [kernel MM documentation index](https://docs.kernel.org/mm/index.html) states no licence other than "The kernel development community".

**RISC-V maintainership.** MAINTAINERS "RISC-V ARCHITECTURE" (`F: arch/riscv/`, status Supported) lists Paul Walmsley, Palmer Dabbelt and Albert Ou as maintainers, and Alexandre Ghiti as reviewer. Tree: `git://git.kernel.org/pub/scm/linux/kernel/git/riscv/linux.git`. List: linux-riscv@lists.infradead.org. Patchwork: `patchwork.kernel.org/project/linux-riscv`. There is no separate MAINTAINERS entry for `arch/riscv/mm`; a grep for `riscv/mm` returned nothing. Generic MM patches go through Andrew Morton's tree.

**Corporate involvement.** The last 150 commits touching `arch/riscv/mm` were tallied by author or committer email domain. The count covers commit records, so one patch can appear under both author and committer.

| Domain | Commits |
|---|---|
| linux-foundation.org (Torvalds, mostly merges) | 28 |
| rivosinc.com | 27 |
| kernel.org | 22 |
| gmail.com | 12 |
| linutronix.de | 9 |
| bytedance.com | 8 |
| arm.com | 8 |
| iscas.ac.cn | 7 |
| sifive.com | 3 |
| linux.dev | 3 |
| huawei.com | 2 |

By person: Torvalds 28, Mike Rapoport 12, Alexandre Ghiti (Rivos) 9, Nam Cao (Linutronix) 8, Palmer Dabbelt (Rivos) 7, Bjorn Topel (Rivos) 7, Vivian Wang (ISCAS) 5, Jisheng Zhang 4, Xu Lu (ByteDance) 3, Samuel Holland (SiFive) 3. Rivos is the largest corporate contributor in this sample. A one-year `git shortlog` timed out, so the 150-commit sample is the only breakdown.

**Community stance on new ports and extensions.** `Documentation/arch/riscv/patch-acceptance.rst` is the only policy found:
- Extensions are accepted only when their specification is Frozen or Ratified.
- Vendor custom extensions are accepted only if ratified or implemented in widely available hardware.
- Patches are run through CI against the RISC-V `for-next` and `fixes` branches.
- The document says it is "disapproving of churn" and prefers well-reviewed, tested code.

No explicit statement from MM maintainers about new ports was found; the stance above is read from the RISC-V document [NEEDS VERIFICATION].

## 2. Port History and Upstreaming Timeline

The RISC-V port has been in mainline since Linux 4.15. The first RISC-V MM commit is [07037db5d479](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=07037db5d479) "RISC-V: Paging and MMU" (Palmer Dabbelt, 2017-07-10), which added `arch/riscv/mm/init.c` and `pgtable.h`. It first appears in v4.15-rc1. The v4.15 release date was not stated in the clone output [NEEDS VERIFICATION].

All commits below are merged in mainline. "Date" is the author date unless stated. First tags come from `git describe --contains` in the clone.

| Date | Event | First tag | Source |
|---|---|---|---|
| 2017-07-10 | Paging and MMU, initial RISC-V port (Palmer Dabbelt) | v4.15-rc1 | [07037db5d479](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=07037db5d479) |
| 2019-08-28 | SPARSEMEM (Logan Gunthorpe), base for hotplug and vmemmap | v5.4-rc1 | [d95f1a542c3d](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d95f1a542c3d) |
| 2020-10-31 | CMA enabled (Kefeng Wang, Huawei) | v5.11-rc1 | [da815582cf45](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=da815582cf45) |
| 2020-11-18 | NUMA for riscv64 via generic arch-NUMA (Atish Patra, WDC, with Greentime Hu, SiFive) | v5.12-rc1 | [4f0e8eef772e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4f0e8eef772e) |
| 2020-11-18 | pte_protnone/pmd_protnone for NUMA balancing (Greentime Hu) | v5.12-rc1 | [3e5b0bdb2a4d](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=3e5b0bdb2a4d) |
| 2021-04-30 | THP on 64-bit (Nanyong Sun, Huawei) | v5.14-rc1 | [e88b333142e4](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e88b333142e4) |
| 2021-07-30 | Gigantic hugepages from CMA (Kefeng Wang) | v5.15-rc1 | [8ba1a8b77ba1](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8ba1a8b77ba1) |
| 2021-12-06 | Sv48 (Alexandre Ghiti, then Canonical) | v5.17-rc1 | [e8a62cc26ddf](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=e8a62cc26ddf) |
| 2022-01-27 | Sv57 with runtime fallback (Qinglin Pan, ISCAS) | v5.18-rc1 | [011f09d12052](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=011f09d12052) |
| 2022-05-11 | Svpbmt, plus T-Head memory-type errata (Heiko Stuebner) | v5.19-rc1 | [ff689fd21cb1](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=ff689fd21cb1), [a35707c3d850](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a35707c3d850) |
| 2022-05-12 | page-table-check support (Tong Tiangen, Huawei) | v5.19-rc1 | [3fee229a8eb9](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=3fee229a8eb9) |
| 2022-07-07 | Non-coherent DMA via Zicbom (Heiko Stuebner) | v6.0-rc1 | [1631ba1259d6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=1631ba1259d6) |
| 2022-08-29 | THP_SWAP for RV64 (Jisheng Zhang) | v6.1-rc1 | [87f81e66e2e8](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=87f81e66e2e8) |
| 2022-10-02 | Svinval probing (Mayuresh Chitale, Ventana) | v6.1-rc1 | [122979aa26cd](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=122979aa26cd) |
| 2022-10-12 | HUGE_VMAP and HUGE_VMALLOC for 64BIT (Liu Shixin, Huawei) | v6.2-rc1 | [310f541a027b](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=310f541a027b), [be79afc740b5](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=be79afc740b5) |
| 2023-01-31 | HugeTLB vmemmap optimisation, HVO (Guo Ren) | v6.3-rc1 | [a3c7d6b642e4](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a3c7d6b642e4) |
| 2023-02-09 | Svnapot PTE format and hugetlb (Qinglin Pan) | v6.4-rc1 | [23ad288aaf15](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=23ad288aaf15), [82a1a1f3bfb6](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=82a1a1f3bfb6) |
| 2023-04-24 | `no5lvl`/`no4lvl` paging-mode downgrade (Alexandre Ghiti) | v6.4-rc1 | [26e7aacb83df](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=26e7aacb83df) |
| 2023-05-24 | VMA-lock page faults (Jisheng Zhang) | v6.5-rc1 | [648321fa0d97](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=648321fa0d97) |
| 2023-06-23 | userfaultfd minor faults (Samuel Holland) | v6.5-rc1 | [a2492ca86c98](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a2492ca86c98) |
| 2023-08-09 | mmap address-space policy for Sv39/48/57 (Charlie Jenkins, Rivos) | v6.6-rc1 | [add2cc6b6515](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=add2cc6b6515) |
| 2024-01-08 | Batched unmap TLB flush (Alexandre Ghiti) | v6.8-rc1 | [54d7431af73e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=54d7431af73e) |
| 2024-06-05 | Memory hotplug, pre-allocated PGDs, Kconfig enable (Bjorn Topel, Rivos) | v6.11-rc1 | [c75a74f4ba19](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c75a74f4ba19), [66673099f734](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=66673099f734), [f8c2a240556e](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=f8c2a240556e) |
| 2024-06-05 | ZONE_DEVICE support (Bjorn Topel) | v6.11-rc1 | [216e04bf1e4d](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=216e04bf1e4d) |
| 2024-06-13 | ACPI NUMA from SRAT/SLIT (Haibo Xu, Intel) | v6.11-rc1 | [eabd9db64ea8](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=eabd9db64ea8) |
| 2024-07-17 | Removal of preventive `sfence.vma` for new vmalloc mappings (Alexandre Ghiti) | v6.12-rc1 | [503638e0babf](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=503638e0babf) |
| 2024-07-26 | Svade/Svadu probing (Yong-Xuan Wang, SiFive) | v6.13-rc1 | [94a7734d0967](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=94a7734d0967) |
| 2025-01-08 | Huge pfnmap (Andrew Bresticker, Rivos) | v6.15-rc1 | [03dc00a2b678](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=03dc00a2b678) |
| 2025-03-21 | PUD THP (Alexandre Ghiti) | v6.16-rc1 | [c3cc2a4a3a23](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c3cc2a4a3a23) |
| 2024-07-02 (committed 2025-06-05) | Svinval used in TLB flush (Mayuresh Chitale) | v6.16-rc1 | [a56972698810](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a56972698810) |
| 2025-11-13 (committed 2025-11-24) | Svrsw60t59b, soft-dirty and uffd-wp (Chunyan Zhang, ISCAS) | v6.19-rc1 | [59f6acb4be02](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=59f6acb4be02), [2a3ebad4db63](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=2a3ebad4db63), [c64da3950cf4](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c64da3950cf4) |
| 2026-01-25 | Shadow-stack (Zicfiss) page-table support (Deepak Gupta, Rivos) | v7.0-rc1 | [c68c2ef9d641](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=c68c2ef9d641), [540de7ade1e1](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=540de7ade1e1) |
| 2026-02-27 | vmemmap aligned to maximal folio size (Kiryl Shutsemau, Meta) | v7.1-rc1 | [476849b0fba4](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=476849b0fba4) |
| 2026-04-03 | XIP kernel support removed (Nam Cao, Linutronix) | v7.1-rc1 | [9b3a2be84803](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=9b3a2be84803) |
| 2026-08-07 | Svinval in `update_mmu_cache()` (Xu Lu, ByteDance); CMA after NUMA init (Eder Zulian, Red Hat) | v7.3-rc1 | [905be00304bd](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=905be00304bd), [627c32d41810](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=627c32d41810) |
| 2026-10-08 | `RISCV_ISA_SV48`/`RISCV_ISA_SV57` Kconfig options and inline `pgtable_l4/l5_enabled` (Jisheng Zhang) | v7.4-rc1 | [36de74049ec8](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=36de74049ec8), [79113093e9dc](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=79113093e9dc) |

**Tags.** Phoronix reported Sv48 in 5.17, and the clone confirms it: e8a62cc26ddf is first in v5.17-rc1 (the Sv57 prep commit 2efad17e5794 is dated 2021-12-06). The Svinval TLB-flush use is v6.16-rc1 via a56972698810, while the `update_mmu_cache()` use is v7.3-rc1.

**ZONE_DEVICE.** The current `arch/riscv/Kconfig` has no `ZONE_DEVICE`, `DEVMAP` or `MEMORY_FAILURE` select (checked at HEAD). The commit history shows ZONE_DEVICE support (216e04bf1e4d, 2024-06-05, v6.11-rc1) was later affected by Alistair Popple's `d438d2734170` (2025-06-19) "mm: remove devmap related functions and page table bits", which removed the `ARCH_HAS_PTE_DEVMAP` machinery treewide. The absence of an arch-specific select is therefore consistent with that removal. Whether ZONE_DEVICE is currently selectable on riscv64 through generic Kconfig dependencies was not checked [NEEDS VERIFICATION]. Commit f3336b48cf9d (v7.2-rc1) states that an unmappable region from `get_free_mem_region()` "breaks ZONE_DEVICE", which indicates ZONE_DEVICE is in use on riscv64.

**Fully upstream?** The implemented features above are all mainline. Out-of-tree or list-only items that could be identified:
- Bytedance RFC v2 (December 2024) for a 64K base page using Svnapot. It was unmerged, with no performance numbers, as far as search summaries showed. [NEEDS VERIFICATION: the Phoronix article and lore were not accessible.]
- No other unmerged series could be enumerated, because lore and patchwork were blocked.

## 3. Upstream Support Tier

**Formal tier policy.** There is no tier system. The only policy is `Documentation/arch/riscv/patch-acceptance.rst` (referenced by a `P:` line in MAINTAINERS), summarised in Section 1. RISC-V is listed as "Supported" in MAINTAINERS. Kernel releases are not gated on architecture-specific MM test results.

**Evidence.**
- CI: no CI configuration files exist in the kernel tree (no `.gitlab-ci.yml`, `.github/`, Jenkins, buildbot, Travis, Cirrus, KernelCI or tuxsuite files in HEAD).
- Pre-merge CI: the external RISE/linux-riscv Patchwork CI builds series on riscv64 runners (Section 7).
- Binaries: upstream publishes source only. Consumable riscv64 kernels come from distros.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| MAINTAINERS status for arch | Data not available: x86 entry not searched | Data not available: arm64 entry not searched | Supported (RISC-V ARCHITECTURE, `arch/riscv/`) |
| Dedicated MM sub-entry | Data not available | Data not available | None; `arch/riscv/mm` falls under the general RISC-V entry |
| In-tree MM selftests accept arch | Data not available | Data not available | `selftests/mm/Makefile` lists `riscv` and `riscv64` in its 64-bit filters; `run_vmtests.sh` lists `riscv64` in `ARCH64STR` |
| Arch-specific MM selftests | Data not available | Data not available | `selftests/riscv/mm` (mmap address-space policy) |
| KUnit under QEMU | Data not available | Data not available | `tools/testing/kunit/qemu_configs/riscv.py` and `riscv32.py` exist |
| Official binaries | Data not available | Data not available | None upstream; distro kernels only |

## 4. Technical Architecture and RISC-V-Specific Subsystems

MM has no JIT, no SIMD dispatch and no crypto. The only MM-specific assembly is `arch/riscv/lib/clear_page.S`. Other `.S` files under `arch/riscv/lib` (string routines, `uaccess.S`, `uaccess_vector.S`) are arch library code rather than MM. The BPF JIT is a different subsystem.

| Component | riscv64 implementation | ISA extensions | Quality / notes |
|---|---|---|---|
| Paging modes | Sv39, Sv48, Sv57, runtime detection by SATP write and fallback | Sv39/48/57 | Mature. `no5lvl`/`no4lvl` cmdline downgrade (v6.4); `RISCV_ISA_SV48`/`SV57` Kconfig added in v7.4-rc1; `pgtable_l4/l5_enabled` became inline functions with early ISA alternatives (lmbench `lat_syscall write` about 2.38% faster on TH1520, per commit text) |
| Memory types | PTE bits [62:61] MT field, patched at runtime via alternatives | Svpbmt; T-Head vendor memory-type errata | Mature; T-Head cores use PTE bits "way different than described in the svpbmt spec" |
| NAPOT huge pages | Hugetlb with 64KB contiguous PTEs, static key enabled from `riscv,isa` | Svnapot | Mature; five fixes by Alexandre Ghiti in 2023-2025 (swap entries, migration, `pte_leaf_size`, non-present size) |
| THP and PUD THP | PMD THP (v5.14), PUD THP (v6.16), THP_SWAP, huge pfnmap | None | PUD THP had an atomicity bug fixed in `668208b161a0` |
| HugeTLB vmemmap (HVO) | `ARCH_WANT_OPTIMIZE_HUGETLB_VMEMMAP` | None | Off by default in Kconfig |
| Huge vmap/vmalloc | `HAVE_ARCH_HUGE_VMAP`, `HAVE_ARCH_HUGE_VMALLOC`; boot options `nohugeiomap`, `nohugevmalloc` | None | Mature |
| TLB flush | SBI remote sfence or IPIs; batched unmap flush; ASID allocator; Svinval path | Svinval | At most 64 consecutive `svinval.vma` per batch (same approach as arm64, per commit text) |
| Hardware A/D bits | `arch_has_hw_pte_young()` enables MGLRU and `__wp_page_copy_user()` optimisations; firmware or SBI FWFT must enable Svadu | Svade, Svadu | Probing mainline; real hardware use depends on firmware |
| Soft-dirty, uffd-wp | PTE bits 59 and 60 | Svrsw60t59b | Both Kconfig options require `RISCV_ISA_SVRSW60T59B` |
| Shadow stack | `pte_mkwrite()` yields shadow-stack PTEs for `VM_SHADOW_STACK` VMAs | Zicfiss | Merged v7.0-rc1 |
| NUMA | `GENERIC_ARCH_NUMA`, `OF_NUMA`, ACPI SRAT/SLIT in `acpi_numa.c`, per-NUMA CMA | None | Off by default (`CONFIG_NUMA` default off) |
| Memory hotplug | `arch_add_memory`, `arch_remove_memory`, `vmemmap_free`, `arch_get_mappable_range`; teardown code "heavily based on code from the x86 tree" | None | Needs `SPARSEMEM_VMEMMAP`; PGD pre-allocation costs about 128 4K pages (plus 32 with KASAN) |
| CMA | `dma_contiguous_reserve()`, `hugetlb_cma=`, crashkernel CMA | None | Mature |
| Cache maintenance | Zicbom non-coherent DMA, `ALT_CMO_OP` for pmem | Zicbom | Platforms assumed coherent unless firmware says otherwise |
| Kernel page-table dumper | `ptdump.c`, shows PBMT, NAPOT, RSW fields | None | `ARCH_HAS_PTDUMP if MMU`; `CHECK_WX` |

Comparison table per component. Cells for arm64 and amd64 are filled only where the riscv commit messages stated a comparison; the arm64/x86 trees were not searched.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| 5-level paging with `no5lvl` | `no5lvl` option name was copied from x86 (per commit text) | Data not available | Present (Sv57) |
| Contiguous-PTE huge pages | Data not available | contpte exists; riscv NAPOT fixes mirrored arm64 fixes (Ryan Roberts's fix cited) | Svnapot hugetlb |
| HVO | Data not available | Enabled; riscv enablement mirrored it | Enabled (off by default) |
| Memory hot-remove | Teardown code is the source riscv borrowed from | Data not available | Present |
| Svinval-style batching | n/a | At most 64 consecutive ops (same approach cited) | 64 `svinval.vma` max |
| pcpu first chunk | Data not available | Page allocator fallback (same as riscv) | Page allocator fallback; Sv39 vmalloc is only 64GB, so sparse NUMA layouts can fail the embedding allocator |
| MM-specific assembly, JIT, SIMD, crypto | Data not available | Data not available | Only `clear_page.S` |

## 5. Build System, Cross-Compilation, and Toolchain

Memory management has no separate build system; it is built by the normal RISC-V Kbuild/Kconfig kernel build. No cmake, autoconf or Dockerfile exists in the tree. The `-DUSE_X=OFF` convention does not apply; MM options are Kconfig symbols, changed with `scripts/config --disable <SYM>` followed by `make ARCH=riscv olddefconfig`.

**GCC, native on riscv64:**
```
make ARCH=riscv defconfig
make ARCH=riscv -j$(nproc) Image modules
```

**GCC, cross-compile** (the `riscv64-linux-gnu-` prefix is the usual Debian/Ubuntu one and is not stated in the tree):
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules
```

**Clang/LLVM** (`Documentation/kbuild/llvm.rst` lists riscv as Supported):
```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image modules
```
`CROSS_COMPILE` is needed with LLVM only when `LLVM_IAS=0`.

Config files in `arch/riscv/configs/` are `defconfig`, `64-bit.config`, `32-bit.config`, `hardening.config` and the nommu configs. A fragment is merged with `make ARCH=riscv defconfig 64-bit.config`. The kernel image is `arch/riscv/boot/Image`.

**Selftests:**
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -C tools/testing/selftests TARGETS=riscv
```
`tools/testing/selftests/riscv/Makefile` sets `RISCV_SUBTARGETS ?= abi hwprobe mm sigreturn vector cfi` and builds them only when `ARCH` is riscv. The `mm` sub-target builds `mmap_default` and `mmap_bottomup` and runs them through `run_mmap.sh`. To run only some: `RISCV_SUBTARGETS="mm vector"`.

**Toolchain minimums** (generic Kbuild minimums, not RISC-V-specific; from `scripts/min-tool-version.sh` and `changes.rst`):

| Tool | Minimum | Why |
|---|---|---|
| GCC | 8.1.0 | Commits a3e8fe814ad1 and 118c40b7b503 (2025-03-28, Arnd Bergmann) raised the generic minimum to gcc-8 and binutils-2.30 |
| binutils | 2.30 | Same |
| Clang/LLVM | 17.0.1 | Commit ce3267a39a92 (2026-05-17, Nathan Chancellor); reason not read |
| GNU make | 4.0 | `changes.rst` |
| bash | 4.2 | `changes.rst` |
| Python | 3.9.x | `changes.rst` |
| pahole (BTF) | 1.26 in the table; the prose in the same file says 1.22 | The file is inconsistent |
| Rust (optional), bindgen (optional) | 1.85.0, 0.71.1 | Rust target `riscv64imac-unknown-none-elf`; `RUSTC_SUPPORTS_RISCV` requires 64BIT |

RISC-V toolchain gates in `arch/riscv/Kconfig` disable a feature rather than break the build. None of them is an MM feature:
- `RISCV_ISA_V` needs a compiler accepting `-march=rv64imv` and ld >= 2.38 or LLD.
- `RISCV_ISA_ZBB`/`ZBA`/`ZBC`/`ZBKB` need ld >= 2.39 or LLD.
- `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` applies with GNU as >= 2.36.
- `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` applies for GCC below 11.3 (`-Wa,-misa-spec=2.2`).
- `ARCH_HAS_BROKEN_DWARF5` applies for LLVM as and LLD below version 18.

Default flags from `arch/riscv/Makefile`: `-mabi=lp64`, `-march=rv64ima[fd][c][v]`, `-mno-save-restore`, `-mcmodel=medany` or `medlow`, `-mstrict-align` when `HAVE_EFFICIENT_UNALIGNED_ACCESS` is not set, `-mno-riscv-attribute`, `-melf64lriscv`.

**MM-relevant Kconfig defaults.**
- `RISCV_ISA_SV48`, `RISCV_ISA_SV57`, `RISCV_ISA_SVNAPOT` and `RISCV_ISA_SVPBMT` are `default y` and depend on 64BIT (the last two also on MMU). Disabling SV48/SV57 gives a smaller kernel and slightly better performance if 39 or 48 bits suffice.
- `CONFIG_NUMA` is default off and depends on SMP and MMU. `ARCH_FLATMEM_ENABLE` is `!NUMA`.
- `ARCH_SPARSEMEM_ENABLE` is `def_bool y` with MMU, selecting `SPARSEMEM_VMEMMAP_ENABLE` on 64-bit.
- `ARCH_ENABLE_MEMORY_HOTPLUG` is selected `if SPARSEMEM_VMEMMAP`. `ARCH_ENABLE_MEMORY_HOTREMOVE` no longer exists; commit 078f80f909ba (David Hildenbrand, 2026-03-19) removed it treewide.
- `ARCH_WANT_GENERAL_HUGETLB` is selected only when NAPOT is off.
- `ARCH_MMAP_RND_BITS_MIN` is 18 and `MAX` is 24 for 64-bit.
- `defconfig` includes `CGROUP_HUGETLB` and `HUGETLBFS`. A grep did not match NUMA, memory hotplug, ZSWAP, CMA, KSM, USERFAULTFD or PTDUMP in `defconfig`, so these must be enabled explicitly or come from Kconfig defaults [NEEDS VERIFICATION: the defaults were not read].

**QEMU usage.** The only in-tree RISC-V QEMU configuration is `tools/testing/kunit/qemu_configs/riscv.py`:
- It requires `/usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin` and exits with an error if the file is missing.
- It adds `ARCH_VIRT`, `SERIAL_8250`, `SERIAL_8250_CONSOLE`, `SERIAL_OF_PLATFORM`, `RISCV_SBI_V01` and `SERIAL_EARLYCON_RISCV_SBI`.
- It runs QEMU arch `riscv64` with `-machine virt -cpu rv64 -bios <opensbi>`, kernel `arch/riscv/boot/Image` and `console=ttyS0`.

KUnit run: `./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu-` [NEEDS VERIFICATION: spelling of the `--cross_compile` flag; `--arch` is documented in `run_wrapper.rst`].

A manual boot command assembled from the KUnit parameters plus standard QEMU options [NEEDS VERIFICATION]:
```
qemu-system-riscv64 -machine virt -cpu rv64 -smp 4 -m 4G -nographic \
  -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin \
  -kernel arch/riscv/boot/Image -append "console=ttyS0 root=/dev/vda rw" \
  -drive file=rootfs.img,format=raw,if=virtio
```
For NUMA and hotplug testing, add `-numa node,...`, `-object memory-backend-ram` and `-m <size>,slots=N,maxmem=<size>` [NEEDS VERIFICATION for riscv]. The hot-add/remove HMM bug in `test_hmm.ko` was found by running `tools/testing/selftests/mm/test_hmm.sh smoke` on QEMU (commit 21f1b85c8912).

**Known build failures (fixed).**
- 2c8a81dc0cc5 (2022-05-17): rv32 build error on `pud_leaf` from the page-table-check enable, reported by the kernel test robot.
- fc325b1a915f (2024-02-11): build fix when `ARCH_ENABLE_HUGEPAGE_MIGRATION` is off.
- XIP kernel: 7bed51617401 fixed an XIP boot failure caused by `ff172d4818ad` (huge-page vmemmap mappings). XIP was broken three times (18 months in 2023, 4 months in 2024, about 10 months after `a44fb5722199`) before 9b3a2be84803 removed it.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

No systematic arm64/amd64 Kconfig comparison was made. The matrix therefore records riscv64 state from the clone and marks other columns as not searched.

| Feature | riscv64 | amd64 | arm64 |
|---|---|---|---|
| SPARSEMEM / vmemmap | Yes (v5.4) | Data not available | Data not available |
| Memory hotplug | Yes (v6.11) | Data not available | Data not available |
| ZONE_DEVICE | Added v6.11; current Kconfig availability [NEEDS VERIFICATION] (Section 2) | Data not available | Data not available |
| DAX vmemmap optimisation | `ARCH_WANT_OPTIMIZE_DAX_VMEMMAP` selected | Data not available | Data not available |
| THP / PUD THP / THP_SWAP | Yes / Yes / Yes | Data not available | Data not available |
| HugeTLB, gigantic pages, CMA gigantic | Yes | Data not available | Data not available |
| HVO | Yes (off by default) | Data not available | Yes (riscv mirrored) |
| Contiguous-PTE huge pages | Svnapot (64KB only) | n/a | contpte |
| NUMA, NUMA balancing | Yes (off by default) | Data not available | Data not available |
| NUMA emulation | Not found | Data not available | Data not available |
| KSM | Generic; no arch hook; no RISC-V commit | Data not available | Data not available |
| Swap / zswap | Arch hooks only (THP_SWAP, swp-exclusive bit); no zswap-specific work | Data not available | Data not available |
| userfaultfd minor | Yes | Data not available | Data not available |
| userfaultfd-wp, soft-dirty | Only with Svrsw60t59b hardware | Data not available | Data not available |
| Huge vmap / vmalloc | Yes | Data not available | Data not available |
| Page-table check | Yes | Yes (riscv mirrored x86 commit d283d422c6c4) | Data not available |
| Shadow stack PTEs | Yes (v7.0) | Data not available | Data not available |
| VMA lock page faults | Yes (v6.5) | Data not available | Data not available |
| mmap policy for 48/57-bit | Default 48-bit, hint opts in to 57 | Data not available | Data not available |
| Kernel page-table dumper | Yes | Data not available | Data not available |
| XIP kernel | Removed (v7.1) | n/a | n/a |
| 64K base page | Not merged (Bytedance RFC) [NEEDS VERIFICATION] | n/a | Data not available |
| Svukte | No commit found (zero hits) | n/a | n/a |

**Functional gaps (cannot do X at all).**
- Soft-dirty tracking and uffd write-protect require Svrsw60t59b hardware. That affects CRIU-style checkpointing and the live-migration use of uffd-wp.
- No NUMA emulation was found in the clone. Not confirmed against the mailing list.
- No Svukte support: a commit-message search returned zero hits.
- No CXL-specific RISC-V commit was found. Data not available: CXL searched only through commit-message and Kconfig scans.
- XIP kernels are no longer supported (removed in v7.1); the commit says a revert is possible if someone complains.
- The `ARCH_WANT_GENERAL_HUGETLB` selection is exclusive with Svnapot (selected only when NAPOT is off).

**Constraints rather than gaps.**
- Hardware A/D updates are usable only when firmware or SBI FWFT enables Svadu. By default M-mode firmware enables Svadu in `menvcfg` when only Svadu is present in DT. A scan found Svadu referenced only in a comment in `pgtable.c`, but `94a7734d0967` adds `arch_has_hw_pte_young()`; the two scans differ and the latter is the commit-level evidence. Real hardware coverage is unverified [NEEDS VERIFICATION].
- Memory hotplug requires `SPARSEMEM_VMEMMAP`, and pre-allocating PGD entries costs about 128 4K pages.
- Sv39's 64GB vmalloc area can defeat the pcpu embedding first-chunk allocator on sparse NUMA layouts (the page allocator is the fallback).

**Performance gaps.** No kernel-level MM benchmarks on riscv64 were found for THP, hugetlb/NAPOT, Svpbmt, TLB behaviour, page-fault latency, reclaim, swap or zswap. Numbers that exist are from commit messages:

| Change | Result | Platform | Source |
|---|---|---|---|
| VMA-lock page faults | `ebizzy` about +32.68% | Lichee Pi 4A, 4 cores | commit 648321fa0d97 |
| Batched unmap TLB flush | Multithreaded microbenchmark about +34% (Unmatched), +78% (TH1520), +81% (QEMU) | as listed | commit 54d7431af73e |
| THP_SWAP | Swap-out 66908 to 322638 bytes/ms (about +382%) | Lichee RV Dock, 512MB, zram swap | commit 87f81e66e2e8 |
| Inline `pgtable_l4/l5_enabled` | lmbench `lat_syscall write` about +2.38% | TH1520 | commit 267bb2b528b5 |

Userspace bandwidth numbers from Phoronix Test Suite runs measure DRAM and hardware, not MM code, and all use kernels 5.10-5.15: VisionFive V2 (5.15) RAMspeed integer add about 3600 MB/s and MBW copy about 956 MB/s; Lichee Pi 4A (5.10.113) CacheBench about 5427 MB/s; Fedora riscv64 (5.15.10) RAMspeed copy about 462.62 MB/s. They come from search-result summaries only [NEEDS VERIFICATION]. There is no SIMD-based performance gap in MM, since MM has no SIMD code.

**Security hardening.** Present: `ARCH_SUPPORTS_PAGE_TABLE_CHECK`, `ARCH_HAS_STRICT_KERNEL_RWX`, `ARCH_HAS_STRICT_MODULE_RWX`, `CHECK_WX` (promoted from `DEBUG_WX` in 2e83e2ce34ff), `ARCH_MMAP_RND_BITS`, shadow-stack PTE support, `hardening.config`. KASAN and KFENCE belong to "Linux hardening".

**NaN / floating-point semantics.** Not applicable to MM.

## 7. CI/CD Infrastructure

**In-tree CI.** None. HEAD has no `.gitlab-ci.yml`, `.github/`, Jenkins, buildbot, Travis, Cirrus, KernelCI or tuxsuite files.

**In-tree test content that can run on riscv64.**
- `tools/testing/selftests/riscv/mm/` (`mmap_default.c`, `mmap_bottomup.c`, `run_mmap.sh`) tests the 48/57-bit mmap address-space policy, with `mmap_bottomup` run under `ulimit -s unlimited`.
- `tools/testing/selftests/mm/Makefile` includes `riscv` and `riscv64` in its 64-bit filters (lines 74 and 142). `run_vmtests.sh` lists `riscv64` in `ARCH64STR`, so the `VADDR64` tests run. `va_high_addr_switch.{c,sh}` is included. The `config` fragment enables THP, userfaultfd, GUP_TEST, TEST_VMALLOC and TEST_HMM.
- KUnit under QEMU RISC-V: `mm/damon/tests/.kunitconfig` and `mm/tests/lazy_mmu_mode_kunit.c` exist, but no RISC-V-specific MM KUnit config was found.
- Evidence that tests catch bugs: `test_hmm.sh smoke` on QEMU found the vmemmap PMD destructor bug (21f1b85c8912), and `map_hugetlb` is the documented Svnapot test recipe.

**External riscv64 CI.** The only riscv64-specific infrastructure found is the RISE/linux-riscv Patchwork pre-merge CI:
- Announced by Bjorn Topel (Jan 2025) in the [Linux RISC-V Patchwork CI announcement](https://lkml.iu.edu/hypermail/linux/kernel/2501.3/04965.html).
- It is a Python framework run through `pw_ci.py` and `config.json`. It applies each new series to the fixes, for-next and master branches, then opens a PR in the `linux-riscv` GitHub org to run the tests.
- Results are emailed, commented on the PR, and linked as a Gist from Patchwork.
- Self-hosted runners are RISE-sponsored and were growing from 4 to 8.
- The [RISE Linux Kernel Pre-Commit CI page](https://github.com/riseproject-dev/developer-infrastructure-wg/blob/main/docs/build-farm/linux-kernel-ci.md) describes Patchwork scraping the list, a daemon syncing to GitHub, and builds and tests on "RISE Build Farm dedicated runners" hosted on Hetzner, with Bjorn Topel (Rivos) as sponsor. It does not list configs, selftests or QEMU use.
- The [linux-riscv/github-ci patchwork workflow](https://github.com/linux-riscv/github-ci/blob/main/.github/workflows/patchwork.yml) only runs `pw_ci.py`. Whether it runs `selftests/mm` or `selftests/riscv/mm` is [NEEDS VERIFICATION]. The announcement does not say what is built or tested.

KernelCI, LKFT, 0-day and syzbot riscv64 MM coverage could not be checked (all fetches were blocked) [NEEDS VERIFICATION]. A 2024 patchset adding a top-level `ci/` GitLab YAML directory for the kernel tree was found, but it is not riscv-specific.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | None (tree-wide) | None (tree-wide) | None |
| Pre-merge CI | Data not available | Data not available | RISE/linux-riscv Patchwork CI (build confirmed; test content unconfirmed) |
| KernelCI / LKFT / syzbot | Data not available | Data not available | Data not available (unreachable) |
| Runners | Data not available | Data not available | RISE self-hosted runners, Hetzner-hosted build farm [NEEDS VERIFICATION for hardware type] |
| `selftests/mm` run in CI | Data not available | Data not available | Not confirmed |

## 8. Distribution and Release Status

**Release artifacts.** Memory management reaches users only as part of mainline and stable kernel releases and distro kernel packages. The clone shows v7.3 as the latest final release and v7.4 in development (HEAD is v7.4-rc1-132-g05441d697f7f, dated 2026-11-03). Upstream ships source only.

**Package-registry checks.**
- PyPI `linux-memory-management`: HTTP 404.
- RISE wheel builder index (GitLab package index): 302 to PyPI, then HTTP 404. No riscv64 wheels exist.
- Ubuntu 26.04 (resolute) package search: not possible [NEEDS VERIFICATION]. A binary package of this name is implausible; the relevant package is the kernel image.
- No package-graph Ubuntu 26.04 riscv64 check was run [NEEDS VERIFICATION].

Distro kernel configs (Debian, Ubuntu, Fedora, openSUSE, Arch) were not checked. Data not available: which distro kernels enable `NUMA`, memory hotplug, `ZSWAP`, `KSM`, HVO, `RISCV_ISA_SVNAPOT`, `RISCV_ISA_SV57` or `USERFAULTFD` on riscv64.

**What a user must do to get a working binary.**
1. Install the distro's riscv64 kernel package, or build mainline/stable from source as in Section 5.
2. For features that are off by default (NUMA, HVO), use a distro config that enables them or set them explicitly and rebuild.
3. Expect that soft-dirty and uffd-wp need Svrsw60t59b hardware, and hardware A/D updates need Svadu enabled by firmware.

Ubuntu 26.04 package names to query once available: `libnuma1`, `libnuma-dev`, `numactl`, `opensbi`, `gcc-riscv64-linux-gnu`, `binutils`, `clang`, `lld`, `libcap-dev`, `liburing-dev`, `qemu-system-misc`, `device-tree-compiler`, `dwarves`.

## 9. Dependencies

The MM subsystem depends on other kernel subsystems, firmware, toolchain and the test environment. Sibling subsystem reports (Linux boot and MMU, Linux hardening, Linux ISA discovery, Linux SoC support) are not listed as dependencies. Package-graph status was not queried, so every row's graph status is "not verified".

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel | runtime-dependency, critical. Hosts `mm/` and `arch/riscv/mm`; RISC-V in mainline since 4.15 | Native; Kconfig selects the MM features listed in Section 4 | `selftests/riscv/mm`, `selftests/mm` (riscv64 accepted); KernelCI/LKFT/syzbot unchecked [NEEDS VERIFICATION] | Mainline and stable kernels; distro configs unchecked [NEEDS VERIFICATION] | linux-riscv and linux-mm lists; maintainers in Section 1 |
| OpenSBI | runtime-dependency, critical. Firmware providing SBI services (remote sfence, FWFT for Svadu) and enabling Svadu in `menvcfg` | Builds with GNU and Clang toolchains | No CI runs the SBIUnit tests; build/boot testing is on contributor machines (per `project-reports/opensbi.md`) | v1.9 is the latest release; Debian ships `opensbi`, Ubuntu likely the same but unverified | Report color orange; open validation issues #426 and #415, not read. See `project-reports/opensbi.md` |
| GCC | build-dependency, critical. Primary kernel compiler, minimum 8.1 | Formally tertiary riscv64 target with no release-blocking criteria (per `project-reports/gcc.md`) | DejaGNU suite passes on sourceware riscv64 buildbots (per that report) | Release status in `project-reports/gcc.md` | Report color blue; RVV intrinsic miscompilation bugs are open (not MM-related). See `project-reports/gcc.md` |
| GNU binutils | build-dependency, critical. Assembler and linker, minimum 2.30 | Fully supported | Testsuite exists (`binutils/testsuite/binutils-all/riscv`) | Packaged by distros | Report color blue; ISA-extension gates need ld 2.38-2.39 for vector/Zb* (not MM). See `project-reports/gnu-binutils.md` |
| GNU make | build-dependency, critical. Kbuild driver, minimum 4.0 | Host tool | Data not available: no dependency report | Data not available | Data not available |
| LLVM | build-dependency, optional. Clang and lld alternative toolchain, minimum 17.0.1, `LLVM=1` | riscv64 is a built-by-default LLVM target | Not a required pre-merge CI gate (per `project-reports/llvm.md`) | Release status in that report | Report color yellow; `ARCH_HAS_BROKEN_DWARF5` for LLVM as/LLD below 18. See `project-reports/llvm.md` |
| dtc | build-dependency, critical. Device-tree compiler for memory and NUMA nodes (`OF_NUMA`) | No report | No report | No report | Listed in projects.yml without a report [NEEDS VERIFICATION] |
| ACPICA | runtime-dependency, optional. ACPI tables (SRAT RINTC affinity, SLIT) for NUMA via `acpi_numa.c` | Data not available | Data not available | Data not available | Data not available: no dependency report was available |
| QEMU | test-dependency, optional. Main riscv64 test platform (system emulation, KVM, NUMA topology emulation) | Upstream CI builds riscv64 system, user and KVM-only cross jobs | CI test step is a no-op for system and user jobs (`MAKE_CHECK_ARGS` unset) | Release status in `project-reports/qemu.md` | Report color yellow; real hardware needed for Svpbmt, Svnapot, hardware A/D. See `project-reports/qemu.md` |

**Additional dependencies from research.**

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| libnuma (numactl) | Userspace NUMA API (mbind, set_mempolicy, move_pages); `ksm_tests`, `migration`, `rmap` selftests link `-lnuma` | Builds with GCC and LLVM since v2.0.17; v2.0.19 current; riscv `set_mempolicy_home_node` syscall number merged 2026-09-23 (PR #260) | Upstream CI is x86_64 only | Debian sid and Ubuntu 22.04/24.04/26.04 per the libnuma report, not confirmed against the graph | Report color orange. See `project-reports/libnuma.md` |
| libcap | Needed to build `mlock-random-test` and `memfd_secret` selftests | Not reported on | Not reported on | Not reported on | See `project-reports/libcap.md` |
| liburing (optional) | `selftests/mm` `cow` and `gup_longterm` | Not reported on | Not reported on | Not reported on | See `project-reports/liburing.md` |
| dwarves (pahole 1.26) | BTF generation | No report | No report | No report | [NEEDS VERIFICATION] |
| Rust (1.85.0) and bindgen (0.71.1), optional | Optional kernel Rust code | Not assessed | Not assessed | Not assessed | None identified for MM. See `project-reports/rust.md` |

**Deep-dive on SIMD, JIT, crypto, numerics dependencies.** None of the MM dependencies is a JIT or numerics library. Toolchain feature gates for vector and bit-manipulation extensions (`TOOLCHAIN_HAS_V`, Zba/Zbb) do not affect MM. The relevant dependency chain is: MM needs SBI remote-fence calls and FWFT from OpenSBI, memory and NUMA description from device tree (dtc) or ACPI (ACPICA), and ISA-extension discovery covered by "Linux ISA discovery".

## 11. Known Bugs and Active Issues

The kernel has no GitHub issue numbers, so CVE IDs and commit hashes serve as identifiers. All five CVEs below are fixed upstream. The data comes from CVE aggregators, with one source per row; fix dates and stable versions are from CVE records, not the clone. Introducing commits were checked in the clone, except where noted. No open issue-tracker entries for RISC-V MM were found. Syzbot was not checked.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [CVE-2026-64592](https://app.opencve.io/cve/CVE-2026-64592) | Spurious-fault path in `entry.S` returns without guaranteed TLB flush (Svvptc) | Fixed in 6.12.96, 6.18.39, 7.1.4; 7.2 unaffected. Fix commits c4df24702bfc, 4d730cab96e6, ede985ff4b56, 1b2c6b56a9fa | No CVSS (published 2026-08-06) | Introduced by 503638e0babf (v6.12-rc1). Fault can recur and crash the kernel. Fix is an unconditional `sfence.vma` [NEEDS VERIFICATION: single source] |
| [CVE-2026-74524](https://fieldguide.lutrasecurity.com/CVE-2026-74524/) | `remove_pud_mapping()`/`remove_p4d_mapping()` walk out of bounds on hot-remove with folded levels | Fixed in 6.12.103, 6.18.44, 7.1.8; mainline a0188cc13369 (v7.2-rc6); other fix commits 1da6d832eda0, 54e07a158f7a, 1bb0ef8069ef | Not rated (published 2026-08-15) | Introduced by c75a74f4ba19 (v6.11-rc1). Sv48 folds P4D, Sv39 folds P4D and PUD. Triggers `VM_BUG_ON_PAGE` in `__free_pages` [NEEDS VERIFICATION: single CVE source; mainline fix verified in clone] |
| [CVE-2026-80682](https://app.opencve.io/cve/CVE-2026-80682) | `MAX_FOLIO_VMEMMAP_ALIGN` (bytes of `struct page` storage) used as a physical-address alignment | Fixed in 7.1.8; mainline 45ebe4540817 (v7.2-rc6); also 11ad86830a78 | Not rated (published 2026-08-28) | Boot warning in `sparse_init()` on QEMU virt and other machines whose DRAM base is not aligned. Introduced by 476849b0fba4 (v7.1-rc1). The fix commit text carries an AI-assistance tag |
| [CVE-2024-56673](https://cveawg.mitre.org/api/cve/CVE-2024-56673) | vmemmap teardown called the PMD destructor though vmemmap PMDs never ran the constructor | Fixed in 6.12.6, 6.13; 21f1b85c8912 (v6.13-rc3), 344945806f2f | Not rated (published 2024-12-27) | Introduced by c75a74f4ba19. Found by `test_hmm.sh smoke` on QEMU |
| [CVE-2024-57945](https://cve.circl.lu/cve/CVE-2024-57945) | vmemmap base computed from `phys_ram_base`; `struct page` mapped below `VMEMMAP_START` overlapped the PCI I/O region | Fixed in 6.12.10, 6.6.72, 6.1.140, 5.10.258; fix commits 043503044280, 92f08673d3f1, a4a7ac3d2660, d2bd51954ac8, f754f27e98f8 | CVSS 3.1: 7.8 (CNA), 7.1 (NVD) | Introducing commit not checked. Fix adds `vmemmap_start_pfn` aligned to the section size. Published 2025-01-21 |

**Correctness bugs fixed in mainline without a CVE found:**

| ID | Title | Fix | Notes |
|---|---|---|---|
| db909bd7986c | `no5lvl` boot failure when vaddr is invalid | v7.1-rc4 | Introduced by 26e7aacb83df; at PA 0x800000000000 the VA=PA mapping is illegal in Sv48 |
| 668208b161a0 | Non-atomic `pudp_huge_get_and_clear()` | v6.18-rc1 | Fixes c3cc2a4a3a23, Cc stable; follow-ups 546e42c8c6d9, 1e6084d5c433, e0e51a0de02c |
| 83d78ac677b9 | Wrong PTE count for a non-present hugetlb NAPOT PTE | v6.15-rc1 | Fixes 82a1a1f3bfb6 |
| 117b1bb0cbc7, 1de195dd0e05 | `VM_FAULT_HWPOISON*` panic; `set_huge_pte_at()` with swap entry on NAPOT | v6.6 | Found because arm64 contpte had the same issue |
| bdda2887cbf3 | False positive in page_table_check on invalid THP PMDs | v7.4-rc1 | ByteDance |
| cfca5a48b03f | SWIOTLB init with DRAM above 4GB | Merged 2026-07-27 | Release tag not looked up |
| 627c32d41810 | CMA reserved before NUMA init, giving a single 16 MiB pool | v7.3-rc1 | After the fix, three pools totalling 48 MiB on QEMU with 2 nodes and `CMA_SIZE_PERNUMA` |

**Version-data caveat.** OpenCVE's version data for CVE-2026-64592 and CVE-2026-80682 is internally inconsistent (for example, it lists 6.12 as affected and marks 6.12.96 and later as unaffected). Treat exact version boundaries as approximate until checked against the stable trees [NEEDS VERIFICATION].

**Unverified items.**
- CVE-2024-26795 appeared in a search as a vmemmap base-address CVE (2024) and was not opened [NEEDS VERIFICATION].
- A boot panic on non-contiguous memory banks (wrong linear-mapping check) was seen in a search result and not opened [NEEDS VERIFICATION].
- A userspace issue, [rustix issue 400](https://github.com/bytecodealliance/rustix/issues/400) "mmap_anonymous will exhaust memory on riscv64gc-unknown-linux-gnu when memory size is big", is tangential; its status was not checked.
- Ubuntu bug [2024935](https://bugs.launchpad.net/bugs/2024935) reports CPU speed 2.7x slower on a MangoPi MQ-Pro (23.04 vs 22.10). It is a CPU speed report with no demonstrated link to MM.

**Fixed-bug theme.** The bugs concentrate on the linear map, vmemmap, hot-remove and TLB flush handling. The hot-remove and vmemmap bugs date from the 2024 hotplug series, and the most recent fixes landed in July 2026 (v7.2-rc6), so these paths are still being hardened. No open performance issue with an issue or report number was found.

## 12. Objections and Upstream Blockers

**Stated objections.** No explicit objection to RISC-V MM support from MM or RISC-V maintainers was found in the evidence gathered. Mailing-list threads could not be read (lore was not accessible), so objections to unmerged series are unknown [NEEDS VERIFICATION].

**Technical blockers and constraints.**
- Soft-dirty and uffd-wp are gated on Svrsw60t59b hardware (Kconfig dependency), which limits checkpoint/restore and live-migration use on silicon without it.
- Svadu is opt-in via firmware or SBI FWFT; the mm code relies on `arch_has_hw_pte_young()` only where enabled.
- Svnapot defines only 64KB; the generic hugetlb path (`ARCH_WANT_GENERAL_HUGETLB`) is mutually exclusive with it.
- The 64K base-page RFC (Bytedance, December 2024) is unmerged with no published performance numbers [NEEDS VERIFICATION].
- ZONE_DEVICE/DAX/CXL readiness is unresolved (Section 2).

**Organizational blockers.**
- The `patch-acceptance.rst` rules require Frozen or Ratified specifications, or widely available hardware for vendor extensions; draft-extension code may be kept out of tree.
- XIP support was dropped because of lack of users and repeated breakage.
- No MM-specific funding by RISE (Section 14).

**Acceptance probability.** Data not available: no unmerged MM series could be enumerated, so no estimate can be sourced. Landing pace for ratified-extension MM features is evidenced by the timeline in Section 2.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

**Justification.** RISC-V MM support is mainline (arch/riscv/mm plus Kconfig selects for SPARSEMEM, hotplug, THP, hugetlb/Svnapot, NUMA, CMA, Sv48/Sv57 and userfaultfd; checked in the kernel clone at v7.4-rc1-132). The only riscv64 CI evidenced is the external [RISE/linux-riscv Patchwork CI](https://lkml.iu.edu/hypermail/linux/kernel/2501.3/04965.html), which applies and builds series on riscv64 runners but whose MM test content (`selftests/mm`, `selftests/riscv/mm`) could not be confirmed. The kernel tree has no riscv64 CI config of its own, and KernelCI/LKFT/syzbot coverage and distro kernel configs were unreachable. The grade is therefore build-only (yellow), and consumable riscv64 kernels come from distros, not upstream binaries.

**Pending work that could change the grade.**
- The grade would move to blue if the linux-riscv Patchwork CI (`pw_ci.py`, [linux-riscv/github-ci](https://github.com/linux-riscv/github-ci/blob/main/.github/workflows/patchwork.yml)) or KernelCI/LKFT is shown to run `selftests/mm` and `selftests/riscv/mm` on riscv64. The release provider would stay distro-supplied.
- RISE funds no MM-specific work. Its [Kernel and Virtualization WG tracker](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues) has only MM-adjacent closed items (memory hotplug #8, ACPI NUMA #29, Svnapot KVM/QEMU, Svvptc, Svadu) plus open Xen shared-memory #137.
- Unmerged item to watch: Bytedance 64K base-page RFC using Svnapot (status unverified).
- The ZONE_DEVICE state needs reconciling (a Kconfig scan found no ZONE_DEVICE/DEVMAP select, while commit 216e04bf1e4d added ZONE_DEVICE and `d438d2734170` later removed the devmap bits).
- Recent fixed bugs (CVE-2026-74524 hot-remove, CVE-2026-80682 and CVE-2024-57945 vmemmap, CVE-2026-64592 Svvptc spurious fault) show active hardening.

## 14. Investment Analysis

**Check of existing RISE work (do not size what is covered).** There is no RISE blog post, repo or funded project on MM. The RISE feed posts read (8 newest, Jul to Oct 2026) do not mention THP, hugetlb, NUMA, hotplug, Svpbmt, Svnapot, Sv57, page tables, KSM, userfaultfd, swap or CMA. Only the first 100,000 of 186,772 feed characters were read [NEEDS VERIFICATION]. The Kernel and Virtualization WG tracker (62 issues) has these MM-adjacent items closed on 2026-07-17 or later: #8 Memory Hot(Un)plug, #29 ACPI NUMA support, #32 QEMU-KVM Svnapot, #42 KVM Svnapot, #62 KVMTOOL Svnapot, #88 Svvptc memory-fence optimisation, #107 RustVMM vm-memory, #129 Smnpm/Ssnpm, #131 QEMU-KVM Svvptc and #134 QEMU-KVM Svadu (the last three closed 2026-09-03). Open: #137 Xen shared memory and event channel. Assignees, funding and linked series were not read. Svnapot, Svvptc and Svadu items are mostly KVM/QEMU enablement, not core MM. The effort figures below are the author's estimates, not sourced from the research.

### 14.1 Functional Enablement
- Resolve and document ZONE_DEVICE/DAX/CXL status on riscv64 after the devmap removal, including a boot test with a memory-backed device. Estimate 3 person-weeks.
- Track and review the 64K base-page series and any Svukte or NUMA-emulation work if upstream demand appears. Estimate 4 person-weeks of review and testing, contingent on the series' status.
- Validate Svrsw60t59b dependent features (soft-dirty, uffd-wp) on silicon, since they are gated on that extension.

### 14.2 Performance Optimization
- Build a repeatable riscv64 MM benchmark set (THP, NAPOT hugetlb, page-fault latency, reclaim/swap/zswap, TLB flush with Svinval), because none exists. Estimate 6 person-weeks.
- Measure Svadu and Svinval effect on real hardware, where only commit-message numbers exist. Estimate 3 person-weeks plus hardware access.

### 14.3 CI/CD Infrastructure
- First confirm what the Patchwork CI actually runs (read `pw_ci.py` and `config.json`). Estimate 1 person-week.
- Add `selftests/mm` and `selftests/riscv/mm` runs, and `test_hmm.sh`, to a riscv64 pipeline, whether in the Patchwork CI, KernelCI or LKFT. Estimate 4 person-weeks. This is the item that moves the grade from yellow to blue.
- Add NUMA and memory-hotplug QEMU configurations. Estimate 2 person-weeks.

### 14.4 Ecosystem Enablement
- Audit distro riscv64 kernel configs (Debian, Ubuntu, Fedora, openSUSE, Arch) for NUMA, hotplug, HVO, Svnapot, Sv57, KSM, zswap and userfaultfd. Estimate 2 person-weeks.
- Confirm libnuma, libcap and liburing riscv64 builds in distros (libnuma report is orange).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add `selftests/mm`, `selftests/riscv/mm` and `test_hmm.sh` to a riscv64 CI | 4 | Chip company kernel team with RISE Kernel and Virtualization WG | Critical |
| CI/CD | Inspect Patchwork CI test content | 1 | Chip company kernel team | High |
| CI/CD | NUMA and hotplug QEMU CI configs | 2 | Chip company kernel team | Medium |
| Functional | ZONE_DEVICE/DAX/CXL status and test | 3 | Chip company kernel team | High |
| Functional | Silicon validation of Svadu, Svinval, Svrsw60t59b, Svnapot | 4 | Silicon vendor and kernel team | High |
| Performance | riscv64 MM benchmark suite | 6 | Chip company kernel team | Medium |
| Functional | Review 64K base-page and other unmerged series | 4 | Chip company kernel team | Medium |
| Ecosystem | Distro kernel config audit | 2 | Chip company distro liaison | Medium |

## 15. References

- [Linux kernel MM documentation](https://docs.kernel.org/mm/index.html)
- [Linux kernel repository (git.kernel.org)](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git) (commit pattern: `https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=<SHA>`; commit data was read from the local clone)
- [Linux RISC-V Patchwork CI announcement (Bjorn Topel, Jan 2025)](https://lkml.iu.edu/hypermail/linux/kernel/2501.3/04965.html)
- [linux-riscv/github-ci patchwork workflow](https://github.com/linux-riscv/github-ci/blob/main/.github/workflows/patchwork.yml)
- [RISE Linux Kernel Pre-Commit CI documentation](https://github.com/riseproject-dev/developer-infrastructure-wg/blob/main/docs/build-farm/linux-kernel-ci.md)
- [RISE Kernel and Virtualization WG tracker](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE: working groups move project tracking to GitHub](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [linux-riscv mailing list: 6.2 merge-window pull](https://lists.infradead.org/pipermail/linux-riscv/2022-December/023884.html)
- [linux-riscv mailing list: memory_limit fix (Alexandre Ghiti)](https://lists.infradead.org/pipermail/linux-riscv/2021-July/007410.html)
- [Phoronix: Linux 5.17 RISC-V Sv48](https://mail.phoronix.com/news/Linux-5.17-RISC-V-sv48)
- [Phoronix: Linux RFC v2 64K RISC-V page size](https://www.phoronix.com/news/Linux-RFC-v2-64K-RISC-V-PS) (search summary only; fetch not accessible)
- [LWN article 890098](https://lwn.net/Articles/890098/) (returned by search, not read)
- [CVE-2026-64592 (OpenCVE)](https://app.opencve.io/cve/CVE-2026-64592)
- [CVE-2026-74524 (Lutra Security)](https://fieldguide.lutrasecurity.com/CVE-2026-74524/)
- [CVE-2026-80682 (OpenCVE)](https://app.opencve.io/cve/CVE-2026-80682)
- [CVE-2024-56673 (MITRE)](https://cveawg.mitre.org/api/cve/CVE-2024-56673)
- [CVE-2024-57945 (CIRCL)](https://cve.circl.lu/cve/CVE-2024-57945)
- [OpenBenchmarking: VisionFive V2 result](https://mail.openbenchmarking.org/result/2310122-NE-MEMORYVF215&grr&export=html)
- [OpenBenchmarking: Lichee Pi 4A result](https://openbenchmarking.org/result/2410303-NE-20241029238)
- [OpenBenchmarking: Fedora riscv64 result](https://openbenchmarking.org/result/2211102-BE-KAM37279086&grt&sro&export=html)
- [Ubuntu bug 2024935](https://bugs.launchpad.net/bugs/2024935)
- [rustix issue 400](https://github.com/bytecodealliance/rustix/issues/400)
- [2006 LKML thread on an MM maintainer](https://lkml.iu.edu/hypermail/linux/kernel/0607.3/0080.html)
- [Charlie Jenkins mmap hint series, mirror commit eeb7a8933e71](https://lab.nexedi.cn/kirr/linux/-/commit/eeb7a8933e71f98354536c3d849a26978539b09f) (mainline SHA not confirmed) [NEEDS VERIFICATION]
- Kernel clone files read: `MAINTAINERS`, `arch/riscv/Kconfig`, `arch/riscv/Makefile`, `arch/riscv/mm/*`, `Documentation/arch/riscv/patch-acceptance.rst`, `Documentation/arch/riscv/vm-layout.rst`, `Documentation/kbuild/llvm.rst`, `Documentation/process/changes.rst`, `tools/testing/selftests/riscv/{Makefile,README,mm/*}`, `tools/testing/selftests/mm/{Makefile,run_vmtests.sh,config}`, `tools/testing/kunit/qemu_configs/riscv.py`
- Sibling reports referenced: `project-reports/opensbi.md`, `gcc.md`, `gnu-binutils.md`, `llvm.md`, `libnuma.md`, `libcap.md`, `liburing.md`, `qemu.md`, `rust.md`