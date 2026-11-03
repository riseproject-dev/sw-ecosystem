---
title: Linux filesystems
parent: Project Reports
color: yellow
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: LTP
    relation: test-dependency
    criticality: optional
  - name: xfstests
    relation: test-dependency
    criticality: optional
  - name: e2fsprogs
    relation: test-dependency
    criticality: optional
  - name: xfsprogs
    relation: test-dependency
    criticality: optional
  - name: btrfs-progs
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-filesystems" %}

# Linux filesystems

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux filesystems<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux filesystems are a subsystem of the mainline Linux kernel, not a standalone package. The kernel is licensed GPL-2.0. The subsystem covers the VFS layer and the individual filesystems: ext4, XFS, Btrfs, F2FS, EROFS, SquashFS, OverlayFS, FUSE, tmpfs, NFS, plus fscrypt, fsverity, iomap and netfs. Documentation is at [kernel filesystems documentation](https://docs.kernel.org/filesystems/index.html). The repository is [torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git). There is no master RISC-V tracking issue for filesystems. Kernel work happens on mailing lists and in git.kernel.org trees, not on GitHub.

Filesystem code is architecture independent. A search of `fs/` commit messages for "riscv" returned 68 commits, and the ones read were merges or treewide changes, not RISC-V-specific filesystem code. There are no `.S` files and no arch directories under `fs/`. The RISC-V-specific code that filesystems depend on lives in generic library directories:

- `lib/crc/riscv/` (Zbc carry-less multiply CRC)
- `lib/crypto/riscv/` (vector crypto used by fscrypt and fsverity)
- `lib/raid/` (RVV RAID6 syndrome and XOR code used by Btrfs RAID56 and md)

**Governance.** There is no foundation. The Linux Foundation hosts kernel.org infrastructure, and Linus Torvalds' tree is the integration point. Governance is hierarchical maintainer trees under the kernel process, with no per-filesystem governance body. Affiliations below are inferred from address domains and should be verified.

- VFS: Alexander Viro and Christian Brauner maintain it, with Jan Kara as reviewer. Per `Documentation/filesystems/adding-new-filesystems.rst`, every merged filesystem becomes the collective responsibility of the VFS maintainers and the wider filesystem community.
- ext4: Theodore Ts'o. Reviewers include Andreas Dilger, Baokun Li (Alibaba), Jan Kara (SUSE), Ojaswin Mujoo and Ritesh Harjani (IBM), and Zhang Yi (Huawei).
- XFS: Carlos Maiolino. His employer is [NEEDS VERIFICATION].
- Btrfs: David Sterba (SUSE), with Chris Mason as reviewer.
- F2FS: Jaegeuk Kim and Chao Yu. Employers are [NEEDS VERIFICATION].
- EROFS: Gao Xiang (Alibaba address on commits) and Chao Yu. Reviewers include Tencent, Google and vivo staff.
- OverlayFS and FUSE: Miklos Szeredi and Amir Goldstein. Bernd Schubert and Joanne Koong cover FUSE io-uring.
- SquashFS: Phillip Lougher.
- tmpfs: Hugh Dickins (Google).
- NFS client: Trond Myklebust and Anna Schumaker.
- fscrypt and fsverity: Eric Biggers and Theodore Ts'o. Jaegeuk Kim also covers fscrypt.
- CRC library: Eric Biggers (M) and Ard Biesheuvel (R). This is the only filesystem-adjacent component with RISC-V-specific code.

**Community stance on new ports.** New filesystems face a high bar. `adding-new-filesystems.rst` prefers improving an existing in-kernel filesystem, suggests FUSE for niche filesystems, and requires modern interfaces (folios, iomap, not buffer heads). Only the first 60 lines of that document were read. RISC-V arch enablement is welcomed but gated by `Documentation/arch/riscv/patch-acceptance.rst`. No RISC-V-specific objection or special treatment for filesystems was found.

**RISE involvement.** None found for filesystems. See Section 14 for the sources checked.

## 2. Port History and Upstreaming Timeline

The RISC-V architecture port is fully upstream. There is no out-of-tree filesystem code for RISC-V. Dates below are authored dates with committer/merge dates where the findings distinguish them.

| Date | Event | Source |
|---|---|---|
| 2017-07-10 | RISC-V arch port: commit 76d2a0493a17 "RISC-V: Init and Halt Code" (Palmer Dabbelt). First release v4.15, released 2018-01-28. | Kernel clone (`git log`, `git tag --contains`) |
| 2019-11-22 | `Documentation/arch/riscv/patch-acceptance.rst` added, commit 0e194d9da198 (Paul Walmsley, SiFive). | Kernel clone |
| 2022-02-04 authored, merged 2022-02-22 | d56201d9440d: hugetlbfs enabled in RISC-V defconfig. v5.18. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d56201d9440d) |
| 2022-10 | RISC-V v6.1 merge window pull request: CD-ROM filesystems enabled in defconfig. | [LKML pull request](https://lkml.iu.edu/hypermail/linux/kernel/2210.0/06057.html) |
| 2023-08-11 | 4b05b993900d "riscv: uaccess: Return the number of bytes effectively not copied" (Alexandre Ghiti, Rivos). Fixes an ext4 buffered-write hang. v6.5. | Kernel clone; [linux-riscv post](https://lists.infradead.org/pipermail/linux-riscv/2023-March/028489.html) |
| 2024-01-15 | c5674d00cacd: RVV XOR block code (Greentime Hu, SiFive), used by Btrfs RAID5 and md. v6.8. Moved to `lib/raid/` on 2026-03-27 (5265d55b2146, Christoph Hellwig). | Kernel clone |
| 2024-01-21 | Jerry Shih (SiFive) added vector-crypto AES, ChaCha20 and SHA-256 glue (eb24af5d7a05, bb54668837a0, 8c8e40470ffe). Tags not checked. [NEEDS VERIFICATION] | Kernel clone |
| 2024-04-12 | LKFT-found riscv32 ext4 oops reported on linux-riscv. No confirmed fix. | [linux-riscv thread](https://lists.infradead.org/pipermail/linux-riscv/2024-April/052310.html) |
| 2024-06-21 authored, 2024-07-10 committed | a43fe27d6503 "riscv: Optimize crc32 with Zbc extension" (Xiao Wang, Intel). v6.11. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a43fe27d6503) |
| 2025-02-16 authored, 2025-03-10 committed | bbe2610bc5ad (Zbc template), 72acff5f8185 (CRC32 on template), 8bf3e17898eb (CRC-T10DIF), 511484fa881e (CRC64), all by Eric Biggers. v6.15. | [8bf3e17898eb](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8bf3e17898eb) |
| 2025-03-05 | 6093faaf9593: RVV RAID6 syndrome and recovery (Chunyan Zhang, ISCAS). v6.16. | Kernel clone |
| 2025-06-07 authored, 2025-06-30 committed | b5943815e63b: CRC code moved to `lib/crc/riscv/`. v6.17. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b5943815e63b) |
| 2025-07-09 authored, 2025-07-10 committed | 27917e8194f9 "erofs: address D-cache aliasing" (Gao Xiang). States arm64 and RISC-V are unaffected. v6.16. | [commit](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=27917e8194f9) |
| 2026-01-12 / 2026-03-18 | Eric Biggers moved AES (a4e573db06a4) and GHASH (af413d71f09d) into the crypto library. Tags not checked. [NEEDS VERIFICATION] | Kernel clone |
| 2026-06-01 | kernelci-core PR 3105 merged: adds riscv64 to the LTP rootfs build. | [PR 3105](https://github.com/kernelci/kernelci-core/pull/3105) |
| 2026-10-11 | Phoronix reports an auto-vectorized RISC-V kernel build talk (Andy Chiu, LPC 2026). | [Phoronix](https://phoronix.com/news/Auto-Vectorize-RISC-V-Kernel) |

**Key contributors.** Xiao Wang (Intel, CRC32 Zbc), Eric Biggers (Google, later kernel.org address; CRC template, T10DIF, CRC64, crypto library), Zhihang Shao (ISCAS, original CRC-T10DIF series), Chunyan Zhang (ISCAS, RAID6 RVV), Greentime Hu and Jerry Shih (SiFive, XOR and vector crypto), Charlie Jenkins (Rivos, IP checksum, added 2024-01-08), Alexandre Ghiti and Bjorn Topel (Rivos, uaccess fix and LKFT report).

**Is it fully upstream?** Yes for everything found. No Zvbc CRC series exists in mainline. The superseded [CRC-T10DIF v4 patch](https://lkml.iu.edu/hypermail/linux/kernel/2502.1/06797.html) by Zhihang Shao was replaced by Eric Biggers' template-based commits.

**Zbc CRC release.** The first Zbc CRC32 landed in v6.11 (a43fe27d6503). The CLMUL template rework, CRC-T10DIF and CRC64 landed in v6.15. The Linux crypto report's "since v6.15" refers to the full CLMUL template set.

## 3. Upstream Support Tier

**Formal tier policy.** None exists for filesystems on RISC-V. All filesystems are generic code, and no RISC-V filesystem tier exists. The only RISC-V-specific policy is `Documentation/arch/riscv/patch-acceptance.rst`: new extensions are accepted only if the specification is Frozen or Ratified, or if a custom extension is in widely available hardware. RISC-V patches are tracked on patchwork.kernel.org (linux-riscv project), with automated build and test runs against the riscv for-next and fixes branches.

**Evidence:**
- The kernel tree has no CI configuration (no `.gitlab-ci.yml`, `.github`, `Jenkinsfile`, `.cirrus`, `.drone` entries at HEAD 05441d697f7f). `MAINTAINERS` has no KernelCI, LKFT or xfstests entry for filesystems on riscv64.
- KernelCI builds and boots riscv64 kernels: `kbuild-gcc-14-riscv-mainline` (min_version 4.15), `kbuild-gcc-14-riscv-nommu_k210_defconfig` (min_version 5.10), and baseline boot jobs. See [kernelci-pipeline config](https://github.com/kernelci/kernelci-pipeline/tree/main/config).
- No filesystem test (kselftest-filesystems, LTP filesystems/fsx, xfstests) runs on any riscv64 platform in KernelCI.
- Release-blocking status: not applicable. There is no upstream riscv64 release artifact, and the consumable binaries come from distro kernels.
- Whether LKFT, syzbot and 0-day cover filesystems on riscv64 was not checked. [NEEDS VERIFICATION]

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Arch-specific filesystem code | None in `fs/` | None in `fs/` | None in `fs/` |
| Arch-specific CRC acceleration | PCLMULQDQ/VPCLMULQDQ and CRC32 instruction | PMULL | Scalar Zbc `clmul` only, runtime-detected, generic fallback |
| KernelCI LTP filesystem jobs (`ltp-filesystems`, `ltp-fsx`) | Data not available: amd64 scheduler entries were not examined | Yes, on imx6q-sabrelite, bcm2837-rpi-3-b-plus, bcm2711-rpi-4-b | No |
| KernelCI kselftest-filesystems | Data not available: no such job exists in the pipeline config | Not present | Not present |
| KernelCI kernel build and boot | Data not available: not examined | Data not available: not examined | Yes (kbuild plus baseline on 5 boards) |
| xfstests in CI | No active job (commented-out FIXME block) | No active job | No active job |
| Release provider | Distro | Distro | Distro |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Ratings: "full" means hand-written asm or ISA-extension code, "scalar" means the generic C fallback, "missing" means no implementation. The kernel uses inline asm and `.S` files, not C intrinsics.

| Component | riscv64 status | ISA extensions | Quality | Evidence |
|---|---|---|---|---|
| CRC32 LE/BE, CRC32C (ext4 metadata_csum, jbd2, Btrfs, F2FS, XFS) | Exists | Zbc | Full on Zbc hardware, scalar otherwise | `lib/crc/riscv/crc32.h`, dispatch via `riscv_has_extension_likely(RISCV_ISA_EXT_ZBC)`. Kconfig `CRC32_ARCH` defaults y if `RISCV && RISCV_ISA_ZBC`. |
| CRC-T10DIF (block integrity) | Exists | Zbc | Full on Zbc, scalar otherwise | `crc-t10dif.h`, v6.15 |
| CRC64 BE and NVMe | Exists | Zbc, 64-bit only | Full on Zbc, scalar otherwise | `crc64.h`, `CRC64_ARCH` also needs `64BIT`, v6.15 |
| Zvbc (vector carry-less multiply) CRC | Missing | Zvbc | Missing | No Zvbc code in `lib/crc/riscv` or `arch/riscv/lib`. Zvbc appears only in hwprobe docs, a Kconfig toolchain comment and SpacemiT K3 device tree strings. |
| RAID6 syndrome and recovery (Btrfs RAID56, md) | Exists | RVV | Full, registered only when `has_vector()` | `lib/raid/raid6/riscv/rvv.c` (36 `asm volatile` blocks) and `recov_rvv.c`, v6.16 |
| XOR block (Btrfs RAID5, md) | Exists | RVV | Full, hand-written vector asm | `lib/raid/xor/riscv/xor.S`, v6.8 |
| fscrypt/fsverity crypto (AES, SHA-256/512, GHASH, ChaCha, Poly1305) | Exists | Zvkned, Zvknha/Zvknhb, Zvkg, Zvkb, Zvbb; Poly1305 for all RISCV | Full, hand-written asm | `lib/crypto/riscv/`. Vector entries default y if `RISCV && 64BIT && TOOLCHAIN_HAS_VECTOR_CRYPTO && RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS`. SM4 remains in `arch/riscv/crypto`. |
| Kernel-side compression (lz4, lzo, zstd, deflate) for EROFS, SquashFS, Btrfs, F2FS | Generic C only | None | Scalar | `lib/lz4`, `lib/lzo`, `lib/zstd` have no arch subdirectories |
| xz decompression | Exists | None | BCJ filter for RISC-V instructions (`XZ_DEC_RISCV`, default y) | `lib/xz` |
| Copy to/from user | Exists | RVV (`RISCV_ISA_V`) | Full | `uaccess.S`, `uaccess_vector.S` |
| Zero page | Exists | Zicboz | Full | `clear_page.S` |
| IP checksum (`do_csum`, NFS/net) | Exists | Scalar | Full | `arch/riscv/lib/csum.c` (2024-01-08, Charlie Jenkins). Not filesystem-specific. |
| D-cache aliasing | No work needed | n/a | n/a | 27917e8194f9 states RISC-V is unaffected because PG_dcache_clean is clear for new page-cache folios |
| 32-bit (riscv32) | Partial | n/a | CRC template handles 32-bit; CRC64 Zbc excluded; riscv32 ext4 oops has no confirmed fix | See Section 11 |

**Notes.**
- Zbc is runtime-detected, so kernels run on hardware without Zbc and use the scalar fallback. `RISCV_ISA_ZBC` depends on `TOOLCHAIN_HAS_ZBC` and `MMU`, and defaults y.
- The first Zbc commit reports instruction counts per 8-byte stride (gcc 12.2.0, -O2): rv64 `crc32_le` 54 to 13, `crc32_be` 54 to 31, `__crc32c_le` 54 to 13. On SpacemiT K1 (has Zbc) the kernel CRC32 selftest improved 65% (`crc32_test`) and 125% (`crc32c_test`). These figures come from the commit message of a43fe27d6503 and are from a single source. [NEEDS VERIFICATION]
- The dates of the individual vector-crypto landings were not checked. [NEEDS VERIFICATION]

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CRC32/CRC32C acceleration | PCLMULQDQ/VPCLMULQDQ and CRC32 instruction (per research, not itself verified in this pass) [NEEDS VERIFICATION] | PMULL (same caveat) [NEEDS VERIFICATION] | Zbc scalar carry-less multiply (verified) |
| Vector-width CRC | Yes (VPCLMULQDQ) [NEEDS VERIFICATION] | PMULL on vector registers [NEEDS VERIFICATION] | Missing (no Zvbc) |
| RAID6/XOR vector code | Data not available: not searched | Data not available: not searched | RVV |
| Filesystem crypto | Data not available: not searched | Data not available: not searched | Zvk* asm |
| Compression acceleration (lz4, zstd) in kernel | Little or none per research | Little or none per research | None |

## 5. Build System, Cross-Compilation, and Toolchain

The kernel uses Kbuild (`make`). There is no cmake or autoconf. The tree has no Dockerfile or containerfile. Filesystem code builds with the same toolchain as the rest of the kernel, and no filesystem-specific toolchain requirements were found.

**GNU cross toolchain:**
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules dtbs
```

**Clang/LLVM** (`Documentation/kbuild/llvm.rst` lists riscv as Supported):
```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image modules dtbs
```
`LLVM=-18` selects versioned tools, `LLVM=/path/to/llvm/` selects out-of-PATH tools, and `LLVM_IAS=0` uses the GNU assembler (which requires `CROSS_COMPILE`).

**Config targets:** `defconfig`, `rv32_defconfig`, `rv32_nommu_virt_defconfig`, `rv32_randconfig`, `rv64_randconfig`, `nommu_k210_defconfig`, `nommu_k210_sdcard_defconfig`, `nommu_virt_defconfig`. Fragments: `32-bit.config`, `64-bit.config`, `hardening.config`. Boot images: `Image`, `Image.gz` and other compressed forms, `loader`, `vmlinuz.efi` (default with `CONFIG_EFI_ZBOOT=y`).

**Filesystem entries in `arch/riscv/configs/defconfig`** (keyword grep capped at 30 lines, not exhaustive):
- Built in: EXT4_FS, TMPFS, NFS_FS (v4, v4.1, v4.2), ROOT_NFS, 9P_FS, NET_9P_VIRTIO, DEVTMPFS and DEVTMPFS_MOUNT. AUTOFS, ISO9660 and VFAT are also enabled.
- Modules: BTRFS_FS, OVERLAY_FS.
- XFS, F2FS, FUSE, SQUASHFS, EROFS, FS_ENCRYPTION and FS_VERITY did not appear in the grep. They were not confirmed absent by reading the whole file. Enable with `scripts/config -e XFS_FS -e F2FS_FS -e FUSE_FS -e SQUASHFS -e EROFS_FS` or `menuconfig`.

**Toolchain minimums** (`Documentation/process/changes.rst`, `scripts/min-tool-version.sh`):

| Tool | Minimum |
|---|---|
| GCC | 8.1.0 (riscv does not raise it) |
| binutils | 2.30 |
| Clang/LLVM | 17.0.1 |
| GNU make | 4.0 |
| Python | 3.9.x |
| pahole | 1.26 |
| Rust (optional) | 1.85.0, riscv64 and LLVM/Clang only |

**Why the RISC-V feature gates exist** (`arch/riscv/Kconfig` comments):
- Zicsr/Zifencei must be named explicitly with GNU `as` 2.36 or newer, because binutils 2.38 and GCC 12.1.0 moved to the 20191213 ISA spec that splits them out of I.
- GCC older than 11.3.0 does not accept `zicsr`/`zifencei` in `-march`, so the kernel passes an older ISA spec to GAS.
- Vector needs `LD_IS_LLD` or binutils 2.38 or newer. Zbb and Zba need binutils 2.39 or newer.
- Vector crypto (`TOOLCHAIN_HAS_VECTOR_CRYPTO`) is probed with `.option arch, +v, +zvkb`, because binutils added Zvkb after the other Zvk extensions.
- `ARCH_HAS_BROKEN_DWARF5` is set for LLVM `as` or `lld` older than version 18.
- Dynamic ftrace needs GNU `as`, or LLVM `as` with a sufficient linker.

**QEMU.** The tree has no riscv64 QEMU run documentation. The primary-source configs are KUnit's: `tools/testing/kunit/qemu_configs/riscv.py` uses `-machine virt -cpu rv64 -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin` with `console=ttyS0`, and it needs `qemu-system-riscv` installed. `riscv32.py` uses `-machine virt` with `CONFIG_NONPORTABLE=y` and `CONFIG_ARCH_RV32I=y`. The KUnit invocation `./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu-` is plausible but unverified. [NEEDS VERIFICATION] A manual boot command built from the KUnit flags (`qemu-system-riscv64 -machine virt -cpu rv64 -smp 4 -m 2G -nographic -bios <opensbi> -kernel arch/riscv/boot/Image -append "root=/dev/vda rw console=ttyS0" -drive ... -device virtio-blk-device`) is also unverified against a primary source. [NEEDS VERIFICATION]

**Known build failures.** None specific to filesystems were found. The Launchpad packaging bug for zfs-linux on Ubuntu Focal riscv64 is covered in Section 11.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 | Notes |
|---|---|---|
| ext4, Btrfs, XFS, F2FS, overlayfs, FUSE, NFS, tmpfs, EROFS, SquashFS | Present (architecture independent) | No riscv64-specific issue or PR found for any of them |
| fscrypt/fsverity | Present, with Zvk*-accelerated crypto | Needs vector-crypto toolchain and `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS` for the accelerated paths |
| CRC acceleration | Scalar Zbc only | No vector CRC |
| Btrfs RAID56 / md RAID6 acceleration | RVV | Requires vector hardware |
| Kernel-side compression acceleration | None | arm64 and x86 also have little of this |
| Compat 32-bit user mode (`COMPAT`) | Option exists (`depends on 64BIT && MMU`) | Compat ioctl and syscall paths were not checked |
| Filesystem test coverage in CI | None on riscv64 | See Section 7 |

**Functional gaps.** None found where a filesystem cannot run on riscv64. The riscv32 ext4 splat is an open question for riscv32 only.

**Performance gaps.**
- No filesystem benchmark exists on riscv64 in the sources reached: no ext4, XFS, Btrfs or F2FS throughput or latency numbers.
- Missing Zvbc CRC means checksum-heavy workloads on RISC-V use a 64-bit scalar `clmul` per instruction, while x86 and arm64 use wide-vector paths. The size of this delta was not measured. Data not available: no riscv64 CRC throughput comparison was found.
- Phoronix reported Andy Chiu's LPC 2026 talk on auto-vectorizing the RISC-V kernel build: LZ4 up to 15%, Btrfs up to 8.4%, XFS up to 5%, Nginx up to 2% ([Phoronix](https://phoronix.com/news/Auto-Vectorize-RISC-V-Kernel)). A slide summary at [Neoteo](https://www.neoteo.com/en/risc-v-kernel-vectorization-results-vary-by-workload) says these are best-case: the 15% LZ4 gain was on the ASC-X board, LZ4 compression on the K3 board fell 7.5%, the 8.4% Btrfs gain was for unlink on ASC-X, and the XFS result on K3 was not statistically significant. The Phoronix page was not accessible, so these facts come from search snippets and a secondary summary. The slides and patches were not found. [NEEDS VERIFICATION]
- The Phoronix article says the best results need per-CPU compiler tuning, and the kernel then depends on the Vector unit and is less portable.
- Other benchmark hits (OpenBenchmarking runs on Scaleway and Milk-V Megrez) are general CPU runs, not filesystem benchmarks.

**Security hardening gaps.** `hardening.config` exists as a RISC-V config fragment. Data not available: no filesystem-specific hardening comparison across architectures was searched.

**NaN / floating-point semantics.** Not applicable to filesystems.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist?** Build and boot CI exists. Filesystem test CI does not.

Facts from KernelCI [pipeline config](https://github.com/kernelci/kernelci-pipeline/tree/main/config) (`pipeline.yaml`, `jobs.yaml`, `scheduler.yaml`, main branch):
- `pipeline.yaml` defines only runtimes (docker, k8s, LAVA labs, shell), with no riscv or filesystem entries.
- `jobs.yaml` has riscv `kbuild-*` jobs and baseline jobs `baseline-riscv-broonie`, `baseline-riscv-clabbe`, `baseline-riscv-collabora`.
- `scheduler.yaml` runs riscv baseline boots on:
  - Broonie lab: `jh7110-starfive-visionfive-2-v1-3b`
  - Clabbe lab: `sun20i-d1-nezha`, `jh7100-starfive-visionfive-v1`
  - Collabora lab: `spacemit-k1-bananapi-f3`, `eic7700-hifive-premier-p550`
- `ltp-filesystems` and `ltp-fsx` run only on arm/arm64 boards.
- There is no `kselftest-filesystems` job and no active xfstests job.
- No riscv platform runs any kselftest or LTP job.
- [kernelci-core PR 3105](https://github.com/kernelci/kernelci-core/pull/3105) (opened 2026-05-23 by Ben Copeland, merged 2026-06-01) added riscv64 to the LTP rootfs build. No scheduler entry uses it for riscv yet.

**In-tree test infrastructure** that can run on riscv64 if invoked:
- kselftest: `tools/testing/selftests/filesystems/` has 34 Makefile and `config` files. A grep of Makefiles, `config` and `.sh` files for riscv returned zero hits. The `.c` sources were not read.
- KUnit: `qemu_configs/riscv.py` and `riscv32.py` exist. `.kunitconfig` files for `fs/ext4`, `fs/fat` and `fs/tests` contain no architecture reference. Filesystem KUnit sources exist for btrfs, ext4, fat, hfs, hfsplus, smb, unicode, xfs (`xfs_dahash_test.c`) and `fs/tests`.

**Test signal found.** LKFT caught the riscv32 ext4 splat on QEMU in 2024-04. That is the only filesystem-related riscv test signal found.

**RISE runners and hardware.** `riseproject-dev/riscv-runner` and `board-farm` repos exist. No filesystem testing (such as xfstests) on them was found. The page listing riseproject-dev repos was only partly read (30 of 70), so this is not an exhaustive negative.

**Not checked.** LKFT, syzbot (riscv64 targets) and 0-day coverage. git.kernel.org and lore.kernel.org were not accessible. [NEEDS VERIFICATION]

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| KernelCI build | Data not available: not examined | Data not available: not examined | Yes (`kbuild-gcc-14-riscv-mainline`, nommu k210) |
| KernelCI boot | Data not available: not examined | Data not available: not examined | Yes, 5 boards |
| KernelCI LTP filesystems / fsx | Data not available: not examined | Yes (3 boards) | No |
| KernelCI kselftest-filesystems | Not present | Not present | Not present |
| xfstests | No active job | No active job | No active job |
| LKFT / syzbot / 0-day | Data not available: not checked | Data not available: not checked | Data not available: not checked |

## 8. Distribution and Release Status

**Upstream binaries.** None. There is no PyPI, RISE wheel builder or other package named `linux-filesystems`. The PyPI JSON endpoint and simple index return HTTP 404, and the RISE wheel builder index redirects to PyPI. A Ubuntu 26.04 (resolute) package search for `linux-filesystems` found no package. Arch Linux RISC-V searched for `linux filesystems` found no such package, and its page mentioned only the main `linux` package.

**How filesystem support ships.** Inside the kernel: mainline and stable releases, plus distro kernel packages such as Ubuntu `linux-image-*` for riscv64. The latest release at the clone is v7.3 (tag date 2026-10-18). v7.4-rc1 is tagged (2026-11-01), and the clone HEAD is 05441d697f7f (2026-11-03).

**What a user must do to get a working binary.** Install a distro riscv64 kernel, or build from source (Section 5). Distro kernel configs for ext4, XFS, Btrfs, F2FS, overlayfs, FUSE, erofs, squashfs and NFS were not confirmed. The Ubuntu `linux-image-*` config could not be checked. A Debian kernel-team merge request, [riscv64 config update for linux 6.19](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821), exists but its contents were not inspected. [NEEDS VERIFICATION]

Users who want XFS, F2FS, FUSE, SquashFS, EROFS, fscrypt or fsverity on a kernel built from the RISC-V `defconfig` must enable them, since they were not found in `defconfig`.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Linux kernel (runtime-dependency, critical) | Hosts the filesystem code, `lib/crc` Zbc, `lib/crypto`, `lib/raid` RISC-V code | Yes, mainline since v4.15 | KernelCI build and boot only; no filesystem tests | Distro kernels only | Kernel maintainers, RISC-V arch tree |
| GCC (build-dependency, critical) | Kernel compiler; minimum 8.1.0 for riscv | Yes, cross toolchain `riscv64-linux-gnu-` | KernelCI uses `kbuild-gcc-14-riscv-*` | Distro cross toolchains. Data not available: per-distro packaging not checked. | GNU |
| LLVM (build-dependency, optional) | Alternative kernel compiler with `LLVM=1`; minimum Clang 17.0.1; riscv listed as Supported in `llvm.rst` | Yes | Data not available: no LLVM-built riscv KernelCI job was examined | Data not available | LLVM project |
| LTP (test-dependency, optional) | Runs `ltp-filesystems` and `ltp-fsx` in KernelCI | Rootfs build for riscv64 added by kernelci-core PR 3105 (merged 2026-06-01). Whether LTP itself builds on riscv64 is not verified. [NEEDS VERIFICATION] | No scheduler entry runs LTP on riscv | Data not available | linux-test-project |
| xfstests (test-dependency, optional) | Filesystem regression suite | [NEEDS VERIFICATION] | No active KernelCI job (commented-out FIXME) | Data not available | Kernel filesystem developers; Ts'o's kvm-xfstests now supports LTP per the 2024 thread [NEEDS VERIFICATION] |
| e2fsprogs (test-dependency, optional) | mkfs/fsck for ext4; minimum 1.41.4 | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | Not in `projects.yml`; not researched |
| xfsprogs (test-dependency, optional) | mkfs/repair for XFS; minimum 2.6.0 | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | Not in `projects.yml`; not researched |
| btrfs-progs (test-dependency, optional) | Btrfs tools; minimum 0.18 | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | Not in `projects.yml`; not researched |

**Indirect and recursed dependencies** (most have status reports in `project-reports/`, which were summarized, not re-read):

| Name | Role | riscv64 status |
|---|---|---|
| Linux crypto (kernel) | Backs fscrypt and fsverity | Builds and is mainline. The existing report puts vector crypto glue at v6.9 and notes a boot-time `chacha_zvkb` crash without misaligned vector support reported 2025-11-30. [NEEDS VERIFICATION] |
| xz (liblzma) | xz-compressed images | Builds. RISC-V BCJ filter first shipped in v5.5.1alpha (2024-01-26); v5.8.3 is current stable. No upstream riscv64 CI runner; CRC32 falls back to the generic C table. |
| zstd | Compression in Btrfs, SquashFS, EROFS tools | Builds; releases exist. Upstream CI runs QEMU RVV tests on PRs to `dev`/`release`. Optimization PRs #4557 and #4622 have had no maintainer response. |
| LZ4 | Compression for EROFS, SquashFS, F2FS | v1.10.0 is the first release with riscv64 code. QEMU riscv64 CI added by PR #1299. RVV PRs #1738, #1739, #1778 are open and unreviewed. |
| LZO2 | SquashFS tools | Data not available: no report; not researched. |
| fscrypt (userspace tool) | ext4/F2FS encryption policy management | Pure Go plus a small PAM shim. The existing report says Ubuntu has packaged it for riscv64 since jammy [unverified]. |
| libfuse | Userspace side of FUSE | [NEEDS VERIFICATION]; listed in `projects.yml` but unresearched. |
| squashfs-tools, f2fs-tools, erofs-utils, nfs-utils, quota-tools | Userspace tools for those filesystems | [NEEDS VERIFICATION] for all; none in `projects.yml` (only `erofs/go-erofs` is). |
| OpenSBI | Firmware dependency of the kernel | Targets RISC-V itself; no filesystem-specific issues. |

**Deep dive on SIMD/crypto dependencies.** The accelerated paths gate on specific toolchain and hardware features:
- CRC acceleration needs a toolchain with Zbc (`TOOLCHAIN_HAS_ZBC`) and hardware Zbc at runtime.
- Vector crypto needs `TOOLCHAIN_HAS_VECTOR_CRYPTO`, 64-bit, and `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS`.
- RAID6 and XOR RVV code needs vector hardware at runtime.

Package-graph data was not queried, so no graph data points were collected for any row. This is a tooling gap, not an empty result.

## 11. Known Bugs and Active Issues

(Section 10 is omitted. Filesystems have no dependent package ecosystem that must be separately enabled on riscv64.)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| strace issue #242 / commit 4b05b993900d | ext4 buffered-write hang on riscv64 (strace 6.2 `read-write` test stuck in `generic_perform_write`) | Fixed in v6.5 | Correctness (hang) | Affected 5.18 and later; 5.17 fine. Bisected to 631f871f0717 (Nov 2021, iomap prefaulting). Real fault was riscv `raw_copy_from_user()` returning the full size after a fixed-up fault, so the generic write loop retried forever. Fix by Alexandre Ghiti, 2023-08-11. Issue closed 2023-08-22. See [strace issue](https://github.com/strace/strace/issues/242) and [linux-riscv post](https://lists.infradead.org/pipermail/linux-riscv/2023-March/028489.html). |
| linux-riscv thread, 2024-04-12 | riscv32 ext4 oops in `ext4_search_dir()` at root mount (6.8 regression?) | Final resolution not established | Correctness (riscv32 only) | NULL dereference with `search_buf` at 0xfffff000, so `search_buf + buf_size` wraps to 0. Bisect pointed at the vfs-6.8 merge, but the bisect was inconsistent (Conor Dooley's pointed at merge 8c9440fea774). Nam Cao proposed an offset-based rewrite in `fs/ext4/namei.c`; Andreas Dilger supported it; Ts'o doubted overflow was the cause. At clone HEAD the `dlimit = search_buf + buf_size` code is unchanged, and no ext4 commit in 2024-04-13 to 2024-07-31 touched it. A fix elsewhere (memblock, highmem) is unverified. See [root message](https://lists.infradead.org/pipermail/linux-riscv/2024-April/052310.html). The lore link was not read. [NEEDS VERIFICATION] |
| Launchpad 2016881 | zfs-linux fails to build for riscv64 on Ubuntu Focal | Fix in progress per bug | Low (packaging) | Missing enablement patch already in Jammy and later. Not a kernel bug. See [Launchpad](https://launchpad.net/bugs/2016881). |
| Launchpad 2024935 | CPU about 2.7x slower on Ubuntu 23.04 than 22.10 on MangoPi MQ-Pro | Data not available: status not recorded | Not filesystem-specific | `mitigations=off` did not change it. See [Launchpad](https://bugs.launchpad.net/bugs/2024935). |
| openSUSE bug 1196357 | Slow reads of larger files on Unmatched with three micro SD cards | Data not available: status not recorded | Not filesystem-specific | Copying the initrd to NVMe and tmpfs still took about 1 minute, which points at the SD card and boot path. See [openSUSE thread](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/IP3PN7CNOOJNESBUWSQNIEAMAAMNFAY6). |
| (no ID) | `chacha_zvkb` boot-time crash without misaligned vector support, reported 2025-11-30 | Data not available | Correctness (crypto) | From the existing Linux crypto report only. Not filesystem-specific. [NEEDS VERIFICATION] |

**Correctness bugs.** The ext4 hang above (fixed) and the riscv32 ext4 oops (unresolved). No open riscv64-specific filesystem correctness bug was found. syzbot, the KernelCI dashboard and bugzilla.kernel.org were not checked, and lore was not accessible, so there is no data on unmerged series. [NEEDS VERIFICATION]

**Notes on tags and diagnoses.**
- The binfmt_flat commit 3eb3cd5992f7 (an incidental hit, not a filesystem item) first appears in v6.11-rc4 (`git describe --contains`).
- The statement that riscv32 can hand out a page whose virtual address wraps is the hypothesis of Nam Cao and Andreas Dilger. Ts'o questioned it, so it is not a confirmed diagnosis.

## 12. Objections and Upstream Blockers

**Stated objections.** None found. No RISC-V-specific objection to filesystem work was found. lore.kernel.org was not accessible, so mailing-list coverage is incomplete. [NEEDS VERIFICATION]

**Technical blockers.**
- Zvbc CRC is absent from mainline. Any such patch falls under `patch-acceptance.rst`. Data not available: the ratification status of Zvbc was not in the findings.
- The riscv32 ext4 oops has no confirmed fix.
- Accelerated vector crypto is gated on `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS`. This limits which hardware uses the accelerated paths.

**Organizational blockers.**
- No filesystem test runs on riscv64 in KernelCI, and no RISE-funded work covers it.
- Kernel-side bar for new filesystems is high but not RISC-V-specific.
- A 2025 proposal to drop Albert Ou from the RISC-V ARCHITECTURE MAINTAINERS entry was found in a web search. Whether it was merged was not checked. [NEEDS VERIFICATION]

**Acceptance probability.** Data not available: no pending RISC-V filesystem series was found, so there is nothing to assess. Past RISC-V CRC and RAID work was accepted without recorded objection in the sources read.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

**Justification.** Upstream CI builds and boots riscv64 kernels (KernelCI `kbuild-gcc-14-riscv-mainline` plus baseline boots on several boards), but no filesystem test (kselftest-filesystems, LTP filesystems/fsx, xfstests) runs on any riscv64 platform. LTP filesystem jobs run only on arm/arm64 ([kernelci-pipeline config](https://github.com/kernelci/kernelci-pipeline/tree/main/config)). Filesystem code is architecture independent except the Zbc CRC library in `lib/crc/riscv`, mainline since [v6.11/v6.15](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a43fe27d6503). The consumable riscv64 binaries come from distro kernels, not from upstream.

**Pending work that could change the grade.**
- [kernelci-core PR 3105](https://github.com/kernelci/kernelci-core/pull/3105) (merged 2026-06-01) added riscv64 to the LTP rootfs build, but no scheduler entry uses it for riscv yet. Wiring that up and adding a kselftest-filesystems or xfstests job on riscv would move the grade to blue.
- No RISE-funded filesystem work found.
- No Zvbc CRC path in mainline.
- The riscv32 ext4 splat (Apr 2024) has no confirmed fix.
- Unverified: lore, LKFT, syzbot, and distro kernel configs (Ubuntu and Debian riscv64 kernel config for ext4, XFS and others).

## 14. Investment Analysis

**What RISE has already done or funded.** Nothing found for filesystems.
- The [RISE blog feed](https://riseproject.dev/feed/) (11 posts, 2026-07-07 to 2026-10-30) mentions no filesystem, ext4, XFS, Btrfs, F2FS, erofs, fscrypt, CRC32 or xfstests. Posts before July 2026 were not covered.
- RISE's stated kernel scope is "Kernel & Virtualization (Linux, Android)", and its [December 2024 webinar](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf) lists a "Linux Kernel" CI project. Neither mentions filesystems.
- `riseproject-dev/linux` exists but its contents were not inspected. [NEEDS VERIFICATION]
- The RISE site says working groups consolidate into five groups effective June 25, 2026, and where kernel work sits afterward is unverified.
- The RISE feed was not readable in every check, so RISE blog coverage is [NEEDS VERIFICATION] for pre-July 2026 posts.

All effort figures below are analyst estimates for sizing, not taken from the research. They carry no source.

### 14.1 Functional Enablement

- No functional gap blocks filesystems on riscv64. Remaining items are verification tasks:
  - Audit Ubuntu, Debian and other distro riscv64 kernel configs for filesystem coverage (XFS, F2FS, FUSE, SquashFS, EROFS, fscrypt, fsverity).
  - Verify that e2fsprogs, xfsprogs, btrfs-progs, libfuse, squashfs-tools, f2fs-tools, erofs-utils, nfs-utils and LZO2 build and pass their tests on riscv64.
- riscv32 ext4 oops: root-cause with a reproducer (tuxrun on QEMU riscv32). This is only worth doing if riscv32 matters to the business.

### 14.2 Performance Optimization

- Zvbc vector CRC path for `lib/crc/riscv`, as a counterpart to arm64 PMULL and x86 PCLMUL paths. Gains are unmeasured. First benchmark the existing Zbc path on target silicon, since no riscv64 CRC throughput data exists.
- Filesystem benchmark baseline on riscv64 (ext4, XFS, Btrfs, F2FS), since none exists. This is needed before any sizing of further optimization.
- Evaluate the auto-vectorization results from the LPC 2026 talk once slides or patches are published. Reported gains vary by board and one result was negative (LZ4 on K3, down 7.5%).

### 14.3 CI/CD Infrastructure

- Schedule `ltp-filesystems` and `ltp-fsx` on existing riscv64 KernelCI boards, building on PR 3105.
- Add a `kselftest-filesystems` job for riscv.
- Add an xfstests job. KernelCI has only a commented-out FIXME for it, so this is new work and needs a rootfs with e2fsprogs, xfsprogs and btrfs-progs for riscv64.
- Cover boards with Zbc (SpacemiT K1 is one reported Zbc board) and with vector crypto so accelerated paths are exercised. Zbc status of the other scheduled boards was not checked.
- Check LKFT, syzbot and 0-day coverage before building new infrastructure.

### 14.4 Ecosystem Enablement

Not applicable beyond the userspace tool verification in 14.1. Filesystems have no package ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Wire riscv into KernelCI scheduler for `ltp-filesystems` and `ltp-fsx` | 2-3 | KernelCI / RISC-V platform team | High |
| CI/CD | Add `kselftest-filesystems` job on riscv | 2 | KernelCI / RISC-V platform team | High |
| CI/CD | Add xfstests job with riscv64 rootfs and tools | 6-8 | KernelCI / filesystem developers | Medium |
| Functional | Audit distro riscv64 kernel configs for filesystem coverage | 1-2 | Distro liaison | Medium |
| Functional | Verify userspace tools (e2fsprogs, xfsprogs, btrfs-progs and others) on riscv64 | 2-3 | Distro liaison | Medium |
| Functional | Root-cause riscv32 ext4 oops | 2-3 | Kernel team | Low |
| Performance | Baseline filesystem benchmarks on riscv64 silicon | 2-3 | Performance team | Medium |
| Performance | Zvbc CRC path in `lib/crc/riscv` (including benchmarking) | 4-6 | Kernel team | Low |

## 15. References

- [Kernel filesystems documentation index](https://docs.kernel.org/filesystems/index.html)
- [torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [a43fe27d6503: riscv: Optimize crc32 with Zbc extension](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=a43fe27d6503)
- [bbe2610bc5ad: riscv/crc: add template for Zbc optimized CRC functions](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=bbe2610bc5ad)
- [72acff5f8185: riscv/crc32: reimplement using new template](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=72acff5f8185)
- [8bf3e17898eb: riscv/crc-t10dif: add Zbc optimized CRC-T10DIF function](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=8bf3e17898eb)
- [511484fa881e: riscv/crc64: add Zbc optimized CRC64 functions](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=511484fa881e)
- [b5943815e63b: lib/crc: riscv: Migrate optimized CRC code into lib/crc/](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=b5943815e63b)
- [27917e8194f9: erofs: address D-cache aliasing](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=27917e8194f9)
- [d56201d9440d: riscv: defconfig: enable hugetlbfs option](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=d56201d9440d)
- [linux-riscv: riscv32 EXT4 splat, 6.8 regression?](https://lists.infradead.org/pipermail/linux-riscv/2024-April/052310.html)
- [lore link for the riscv32 ext4 thread (not accessible, not read)](https://lore.kernel.org/all/20240417200617.2f54bc7b@namcao/T/)
- [PATCH v4 riscv/crc-t10dif: Optimize crct10dif with zbc extension](https://lkml.iu.edu/hypermail/linux/kernel/2502.1/06797.html)
- [GIT PULL RISC-V Patches for the 6.1 Merge Window, Part 1](https://lkml.iu.edu/hypermail/linux/kernel/2210.0/06057.html)
- [linux-riscv post, March 2023 (ext4 write hang)](https://lists.infradead.org/pipermail/linux-riscv/2023-March/028489.html)
- [strace issue 242](https://github.com/strace/strace/issues/242)
- [Debian kernel-team MR 1821: riscv64 config update for linux 6.19](https://salsa.debian.org/kernel-team/linux/-/merge_requests/1821)
- [kernelci-pipeline config](https://github.com/kernelci/kernelci-pipeline/tree/main/config)
- [kernelci-core PR 3105](https://github.com/kernelci/kernelci-core/pull/3105)
- [RISC-V patch acceptance guidelines](https://code.amethyst.name/public-mirrors/linux/src/branch/master/Documentation/arch/riscv/patch-acceptance.rst)
- [Phoronix: Auto-Vectorize RISC-V Kernel](https://phoronix.com/news/Auto-Vectorize-RISC-V-Kernel)
- [Neoteo: RISC-V kernel vectorization results vary by workload](https://www.neoteo.com/en/risc-v-kernel-vectorization-results-vary-by-workload)
- [Launchpad 2016881: zfs-linux riscv64 build failure](https://launchpad.net/bugs/2016881)
- [Launchpad 2024935: CPU slower on Ubuntu 23.04](https://bugs.launchpad.net/bugs/2024935)
- [openSUSE bug 1196357 thread](https://lists.opensuse.org/archives/list/bugs@lists.opensuse.org/thread/IP3PN7CNOOJNESBUWSQNIEAMAAMNFAY6)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE Webinar December 2024 (PDF)](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [RISE Introduction (PDF)](https://riseproject.dev/wp-content/uploads/sites/25/2026/01/RISE-Introduction.pdf)