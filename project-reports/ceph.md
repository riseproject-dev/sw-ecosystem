---
title: Ceph
parent: Project Reports
categories:
  - software-defined-storage
---

# Ceph

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Ceph<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[Ceph](https://ceph.io/) is a distributed storage system providing object, block, and file storage from a single unified cluster. The upstream source repository is [ceph/ceph](https://github.com/ceph/ceph) on GitHub. Ceph is organized as a directed fund under the Linux Foundation. The license is LGPL-2.1.

Governance is a three-tier model. The Ceph Executive Council (3 seats, 2-year terms, multi-employer requirement) currently holds: Dan van der Ster (Clyso), Neha Ojha (Red Hat), Patrick Donnelly (IBM). Below that sits the Ceph Steering Committee (34 members), which elects the executive council and amends governance by two-thirds supermajority. Component Team Leads are appointed by the executive council on team recommendation.

Major employer representation on the steering committee: Red Hat (16 members), IBM (5), Clyso (3), Intel (1), Bloomberg (1), ZTE (1), Xsky (1), croit (1), UI.com (1), and independents (4). By commit volume, the dominant maintainers are Kefu Chai / tchaikov (Proxmox, 12,141 commits), Casey Bodley (Red Hat, 4,684), Patrick Donnelly (IBM, 4,282), Gregory Farnum (Red Hat, 3,511), Josh Durgin (Red Hat, 2,637).

Decision-making is consensus-driven by those who participate. The governance model explicitly favors meritocratic contribution and creates no stated barrier to architecture patches, provided they add value without burdening existing CI infrastructure.

---

## 2. Port History and Upstreaming Timeline

There is no dedicated master tracking issue for a riscv64 port on GitHub or [tracker.ceph.com](https://tracker.ceph.com). Work is organic and distributed across individual feature PRs. The contributors driving RISC-V work are Sun Yuechi / sunyuechi (ISCAS, iscas.ac.cn), WenLei / leiwen2025 (ZTE, lei.wen2@zte.com.cn), lvshuo2016 (Sanechips / ZTE affiliate, sanechips.com.cn), and laokz (ISCAS). The primary reviewer and merger is Kefu Chai / tchaikov (Proxmox).

The chronological sequence of merged contributions:

| Date | PR | Author | Description |
|---|---|---|---|
| 2023-12-15 | [#51732](https://github.com/ceph/ceph/pull/51732) | andreas-schwab (SUSE) | Enable riscv64 in openSUSE RPM spec (ExclusiveArch) |
| 2025-09-04 | [#65120](https://github.com/ceph/ceph/pull/65120) | leiwen2025 (ZTE) | Add `rdtime` cycle counter for riscv64 (RDCYCLE privileged since Linux 6.6) |
| 2025-09-25 | [#65354](https://github.com/ceph/ceph/pull/65354) | sunyuechi (ISCAS) | Optimize `mem_is_zero` with RVV intrinsics; 3.5x speedup on BPI-F3 |
| 2026-03-18 | [#66026](https://github.com/ceph/ceph/pull/66026) | leiwen2025 (ZTE) | Add hardware-accelerated CRC32C for riscv64 (Zvbc + Zbc paths) |
| 2026-03-29 | [#68047](https://github.com/ceph/ceph/pull/68047) | leiwen2025 (ZTE) | Fix hwprobe include path and wrong ZBC/ZVBC bit offsets |
| 2026-04-16 | [#68154](https://github.com/ceph/ceph/pull/68154) | leiwen2025 (ZTE) | Optimize CRC32C via Zbc extension; tested on SG2044 |
| 2026-06-02 | [#68098](https://github.com/ceph/ceph/pull/68098) | sunyuechi (ISCAS) | Enable ISA-L erasure coding plugin and zlib on RISC-V |
| 2026-06-08 | [#69315](https://github.com/ceph/ceph/pull/69315) | zmc | Bump sccache; add riscv64 support to build container download script |
| 2026-06-22 | [#69611](https://github.com/ceph/ceph/pull/69611) | sunyuechi (ISCAS) | Fix Boost.Context CMake Jamfile ordering under ASan on riscv64 |

The first meaningful architecture-level contribution was PR #65120 (September 2025). The critical correctness fix (PR #68047, wrong ZBC/ZVBC bit offsets) was merged March 2026, meaning hardware CRC32C acceleration was silently disabled on all hardware for the six months between #66026 and #68047. The ISA-L erasure coding enablement (June 2026) is the most significant recent milestone: it closes the primary performance gap for production workloads.

---

## 3. Upstream Support Tier

Ceph does not publish a formal tier policy for CPU architectures. The project's OS support tiers (defined in `doc/start/os-recommendations.rst`) apply to Linux distributions, not processor architectures. The documentation states "Ceph is sometimes ported to non-Linux systems but these are not supported by the core Ceph effort," framing non-Linux ports as best-effort while leaving Linux architectures implicitly covered.

In practice, riscv64 functions as an unofficial community-supported tier: patches are merged by core maintainers when they are correct and non-disruptive, but no automated CI runs on riscv64, and the architecture is absent from the official OS platform support table. The SUSE openSUSE OBS service does build riscv64 packages (ExclusiveArch in `ceph.spec.in`), which is the only formal distribution declaration. Debian sid includes riscv64 as an unofficial ports architecture.

There is no evidence that any chipmaker or cloud provider has committed to funding or maintaining riscv64 as a first-class supported tier.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Architecture Feature Probing

Ceph implements runtime CPU feature detection per architecture. For riscv64, this is `src/arch/riscv.c` and `src/arch/riscv.h`. Three runtime flags are exposed: `ceph_arch_riscv_rvv` (RVV vector), `ceph_arch_riscv_zbc` (Zbc scalar carry-less multiply), `ceph_arch_riscv_zvbc` (Zvbc vector carry-less multiply).

Detection uses the Linux `riscv_hwprobe` syscall (`syscall(__NR_riscv_hwprobe)`) querying `RISCV_HWPROBE_KEY_IMA_EXT_0`. Fallback macro definitions guard against older kernel headers. The include path is `<asm/hwprobe.h>` (fixed from `<sys/hwprobe.h>` in PR #68047; the sys/ path requires glibc >= 2.40, which is absent on Ubuntu 22.04 / glibc 2.35 and Debian 12 / glibc 2.36). The `riscv_hwprobe` syscall was introduced in Linux 6.4; on older kernels all flags remain 0.

The bit offsets for ZBC and ZVBC were wrong in the initial submission: ZBC was coded as `1ULL<<15` (correct: `1<<7`) and ZVBC as `1ULL<<20` (correct: `1<<18`). This bug (fixed in PR #68047) silently disabled all hardware CRC32C acceleration from March to March 2026.

RISC-V is wired into `src/arch/probe.cc` under `#elif defined(__riscv)` as a peer to ARM, Intel, PPC, and s390x. `src/arch/CMakeLists.txt` includes `riscv.c` in the same `elseif` chain as `arm.c`, `intel.c`, `ppc.c`, and `s390x.c`.

### 4.2 CRC32C

Two distinct hardware-accelerated paths:

**Zvbc path** (`src/common/crc32c_riscv.c`, gated on `HAVE_RISCV_ZVBC`): hand-written inline assembly using `vclmul.vv`, `vclmulh.vv`, `vredxor.vs`, plus scalar `clmul`/`clmulh`. Implements a folding loop over 64-byte chunks with Barrett reduction (polynomial `0x105ec76f1`, mu `0x4869ec38dea713f1`). Falls back to `ceph_crc32c_sctp` for inputs under 64 bytes. This is the same algorithmic approach as x86 (PCLMUL) and AArch64 (PMULL).

**Zbc path** (`src/common/crc32c_riscv_zbc_asm.S`, gated on `HAVE_RISCV_ZBC`): dedicated GNU assembly file (copyright ZTE Corporation, 2026) using `.option arch, +zbc`. Implements align, fold-by-4 loop, fold-by-1 loop, Barrett reduction, and excess byte handling via macros defined in `src/common/crc32c_riscv_zbc_asm.h`. Instructions: `clmul`, `clmulh`, `clmulr` plus base RV64I. Falls back to `ceph_crc32c_sctp` for inputs under 16 bytes.

Dispatch in `ceph_choose_crc32()` (`src/common/crc32c.cc`) checks `ceph_arch_riscv_zvbc` first, then `ceph_arch_riscv_zbc`. No benchmark numbers were published in either PR.

**Comparison to AArch64:** AArch64 uses `__crc32cd` intrinsics plus inline-asm PMULL with a 1024-byte pipelined three-way loop and explicit prefetch. The riscv64 implementation has no explicit prefetch and no multi-way loop -- it is slightly less optimized per cycle, but not qualitatively different in approach.

### 4.3 mem_is_zero

`src/include/inline_memory.h` contains an RVV C intrinsic path gated on `#elif defined(__riscv_v_intrinsic)`. Uses `__riscv_vsetvl_e8m8(len)`, `__riscv_vle8_v_u8m8`, `__riscv_vmsne_vx_u8m8_b1`. Variable-length vector loop with early exit. Only activates when compiled with `-march=rv..v`.

Benchmark data from PR #65354 (BPI-F3 / SpacemiT K1, `ctest -V -R unittest_memory`):

| Buffer size | Baseline (ms) | RVV (ms) | Speedup |
|---|---|---|---|
| 1024 B | 332 | 92 | 3.6x |
| 2048 B | 657 | 186 | 3.5x |
| 4096 B | 1290 | 366 | 3.5x |
| 8192 B | 2572 | 733 | 3.5x |
| 65536 B | 24836 | 10004 | 2.5x |

This is the only published quantitative benchmark for Ceph on RISC-V hardware.

**Comparison to other arches:** x86-64 uses 128-bit `uint128_t` (GCC TI-mode, no SIMD intrinsics). AArch64 uses NEON `vld1q_u64_x2`. The riscv64 RVV intrinsic path is at the same tier as AArch64.

### 4.4 Cycle Counter

`src/common/Cycles.h` uses `asm volatile ("rdtime %0" : "=r" (tsc))` for riscv64. The `RDCYCLE` CSR became privileged (unavailable to userspace) starting with Linux 6.6. `rdtime` reads the system timer and is always accessible to userspace. PR #65120 (merged 2025-09-04). This is equivalent to x86 `rdtsc`, AArch64 `cntvct_el0`, and PowerPC `mftbu/mftb`.

### 4.5 ISA-L Erasure Coding and Compression

PR #68098 (merged 2026-06-02) enables the ISA-L erasure coding plugin and zlib compressor on RISC-V, motivated by ISA-L v2.32.0 adding riscv64 support. RVV is detected at runtime via `ceph_arch_riscv_rvv` (set by the `riscv_hwprobe` path). Falls back to scalar C when RVV is absent. Requires Linux 6.5+ for the hardware acceleration path; the `riscv_hwprobe` syscall was introduced in Linux 6.5 (used for RVV detection), with older kernels using software fallback only.

ISA-L's erasure coding plugin (`ec_isa`) is the primary Reed-Solomon data protection path in Ceph. Enabling it on riscv64 closes the most significant production-performance gap compared to x86 and aarch64.

The `WITH_EC_ISA_PLUGIN` CMake option is now set `TRUE` automatically when `HAVE_RISCV_RVV` is detected (same condition as x86 AVX2, AArch64 SIMD, and PowerPC AltiVec).

### 4.6 File Count Comparison: Arch-Specific Source Files

| Architecture | Files |
|---|---|
| x86/amd64 | 9 (includes multiple NASM .asm files for AVX512) |
| AArch64/ARM | 4 |
| RISC-V | 5 (`riscv.c`, `riscv.h`, `crc32c_riscv.c`, `crc32c_riscv.h`, `crc32c_riscv_zbc_asm.S`) |
| PowerPC | 5 |
| s390x | 4 |

RISC-V matches or exceeds all architectures except x86.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Compiler Minimums

Enforced by `src/CMakeLists.txt`:
- GCC (standard build): minimum 11 (C++23 standard enforced; error message cites C++20 but standard is set to 23)
- GCC (with `-DWITH_CRIMSON=ON`): minimum 13 (Crimson / Seastar require C++20 coroutines)
- Clang: minimum 16

CMake minimum: 3.22.1 (from `cmake_minimum_required` in `CMakeLists.txt`). Note: the RPM spec `ceph.spec.in` lists `cmake > 3.5` as a BuildRequires, which is stale and inconsistent.

### 5.2 RISC-V Architecture Detection in CMake

`cmake/modules/SIMDExt.cmake` matches `riscv64|RISCV64` in `CMAKE_SYSTEM_PROCESSOR` and sets:

- `HAVE_RISCV=1` (unconditional)
- `HAVE_RISCV_ZBC` -- if compiler accepts `-march=rv64gc_zbc`
- `HAVE_RISCV_RVV` + `HAVE_RISCV_ZVBC` -- if compiler accepts `-march=rv64gcv_zbc_zvbc`
- `HAVE_RISCV_RVV` alone -- if compiler accepts `-march=rv64gcv` (fallback if Zvbc unsupported)

`SIMD_COMPILE_FLAGS` is set to the highest supported `-march` value. These flags drive `WITH_EC_ISA_PLUGIN` (erasure coding acceleration enabled when `HAVE_RISCV_RVV` is set).

### 5.3 Cross-Compilation

No riscv64 CMake toolchain file exists in the repository (`cmake/riscv64.cmake` and `cmake/toolchain-riscv64.cmake` both return HTTP 404 from the main branch). No riscv64-specific `Dockerfile` exists in `.ci/docker/` or the repo root.

Cross-compilation requires a user-supplied CMake toolchain file specifying `CMAKE_SYSTEM_PROCESSOR=riscv64`, `CMAKE_C_COMPILER`, `CMAKE_CXX_COMPILER`, and `CMAKE_SYSROOT`. QEMU user-mode (`qemu-riscv64-static`) can be used for native-style builds inside a riscv64 rootfs; no documentation or tooling for this is shipped in-tree.

### 5.4 Recommended Flags for riscv64 Builds

The following flags should be explicitly disabled on riscv64 (some are auto-disabled by CMake arch guards, some require explicit `-DFOO=OFF`):

| Flag | Status on riscv64 | Notes |
|---|---|---|
| `WITH_QATLIB` | Auto-OFF | x86-only arch guard |
| `WITH_QATZIP` | Auto-OFF | x86-only arch guard |
| `WITH_UADK` | Auto-OFF | aarch64-only arch guard |
| `WITH_RBD_RWL` | Auto-OFF (Debian rules) | Persistent write-back cache using pmem; pmem not available on riscv64 |
| `WITH_RDMA` | Explicit `-DWITH_RDMA=OFF` | Defaults ON; requires `librdmacm`/`libibverbs`, absent in most riscv64 environments |
| `WITH_BLUESTORE_PMEM` | Explicit `-DWITH_BLUESTORE_PMEM=OFF` | PMDK (libpmem) does not support riscv64 |
| `WITH_SYSTEM_PMDK` | Explicit `-DWITH_SYSTEM_PMDK=OFF` | Same reason |
| `WITH_LTTNG` | Explicit `-DWITH_LTTNG=OFF` | SUSE spec enables only for x86_64/aarch64/ppc64le |
| `WITH_CRIMSON` | Optional; requires GCC 13+ | Use only if toolchain is confirmed GCC 13+ |

### 5.5 RPM Packaging

`ceph.spec.in` includes `riscv64` in the SUSE-conditional `ExclusiveArch` line:

```
ExclusiveArch: x86_64 aarch64 ppc64le s390x riscv64
```

This was merged in PR #51732 (December 2023), enabling openSUSE Build Service to produce riscv64 packages. No equivalent Fedora/RHEL ExclusiveArch addition was found.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | x86-64 | AArch64 | RISC-V (riscv64) | Gap |
|---|---|---|---|---|
| Arch feature probing | CPUID | `getauxval(AT_HWCAP)` | `riscv_hwprobe` syscall | None -- equivalent mechanism |
| CRC32C acceleration | PCLMUL + SSE4.2 (NASM .asm) | PMULL + `__crc32cd` intrinsics | Zvbc inline asm + Zbc .S file | Minor -- riscv64 lacks multi-way pipeline loop and prefetch |
| `mem_is_zero` | `uint128_t` (no SIMD) | NEON C intrinsics | RVV C intrinsics | None at intrinsic level; scalar x86 is weaker |
| Cycle counter | `rdtsc` | `cntvct_el0` | `rdtime` | None |
| ISA-L erasure coding | AVX2/AVX512 | NEON (AArch64) | RVV (Linux 6.5+ required) | None for ISA-L; SPDK path blocked (see below) |
| ISA-L zlib/gzip | AVX-512 | NEON | RVV | None |
| Compressor (QAT) | Intel QAT | Not available | Not available | Not applicable to non-x86 |
| Compressor (UADK) | Not available | AArch64 UADK | Not available | riscv64 has no equivalent hardware compression accelerator |
| SPDK NVMe-oF | Supported | Supported | Blocked (DPDK) | DPDK bundled by SPDK does not support riscv64; `WITH_SYSTEM_SPDK` is the workaround |
| PMEM / persistent write-back | Supported | Supported | Not supported | PMDK does not support riscv64 |
| Arrow Flight (RadosGW) | Supported | Supported | Submodule stale | PR #65976 auto-closed without merge; Arrow C++ builds but Python wheels absent |
| BLAKE3 | Upstream RVV backend absent | Upstream RVV backend absent | Upstream RVV backend absent | No riscv64 BLAKE3 assembly in the bundled BLAKE3 submodule; affects any cryptographic path using BLAKE3 [NEEDS VERIFICATION -- no direct search of BLAKE3 submodule was confirmed in findings] |
| LZ4 compression | Vectorized | Vectorized | Scalar only | RVV LZ4 patch not merged upstream (PR [#1738](https://github.com/lz4/lz4/issues/1738)); 4.7-4.8x claimed speedup pending |
| zstd compression | Huffman fast loop enabled | Enabled | Disabled | Huffman 4-way fast loop explicitly disabled for riscv64 ([zstd #4622](https://github.com/facebook/zstd/issues/4622)); RVV matching path not implemented |
| Python dashboard wheels | Full | Full | Partial | Some pip dependencies lack riscv64 wheels; PR #65142 (PyPI upgrade) closed stale |

The core storage path (RADOS, RBD, CephFS) has no blocking gaps. All gaps identified above are in optional or peripheral subsystems (SPDK, PMEM, Python tooling, auxiliary compression).

---

## 7. CI/CD Infrastructure

**No automated riscv64 CI exists in the ceph/ceph repository.**

All 12 GitHub Actions workflow files in `.github/workflows/` were audited:

- `check-license.yml`, `create-backport-trackers.yml`, `diff-ceph-config.yml`, `needs-rebase.yml`, `pr-check-deps.yml`, `pr-checklist.yml`, `pr-triage.yml`, `qa-symlink.yml`, `redmine-upkeep.yml`, `releng-audit.yaml`, `retrigger-rtd.yml`, `stale.yml`

All 12 are administrative or triage workflows (license checks, backport tracking, PR labeling, stale issue management). Every job uses `runs-on: ubuntu-latest` (x86-64). Zero files contain the string "riscv". No QEMU emulation step for riscv64 exists anywhere. No GitHub-hosted or self-hosted riscv64 runner is configured.

Ceph's actual build and integration testing runs through Teuthology, an external test framework operating the Sepia test lab. The `ceph-build` Jenkins repository contains arm64 (`ceph-pull-requests-arm64`) and ppc64 (`ceph-make-check-periodic-ppc64`) periodic CI jobs. No equivalent riscv64 job exists.

The `qa/archs/` directory contains `aarch64.yaml`, `armv7.yaml`, `i686.yaml`, and `x86_64.yaml`. There is no `riscv64.yaml`.

The `Dockerfile.build` does contain riscv64 logic (sccache arch remapping added in PR #69315). This enables the build container to be used on a riscv64 host, but it is not wired to any CI trigger. It is developer convenience, not automated gating.

PR #68098 (ISA-L enablement) was merged with the explicit acknowledgment from tchaikov: "since RISC-V is not exercised by our test bed, we can skip the integration test." This confirms the maintainer team is aware of the CI gap and is proceeding on manual hardware testing from contributors.

The consequence: every riscv64 bug introduced by a non-riscv64 patch will not be caught until a contributor manually tests on riscv64 hardware. The corrected ZBC/ZVBC bit offset bug (PR #68047) went six months between initial submission (PR #66026, March 2026) and fix -- consistent with the absence of automated regression detection.

---

## 8. Distribution and Release Status

| Channel | riscv64 Present | Version | Notes |
|---|---|---|---|
| GitHub Releases (ceph/ceph) | No | -- | Source-tag releases only; zero binary assets for any architecture |
| PyPI | No | -- | `ceph` package name returns HTTP 404 on PyPI; no files exist |
| RISE Python wheel builder | No | -- | Ceph is not among the ~80 packages built by the RISE wheel_builder project |
| Ubuntu 24.04 Noble | Yes | 19.2.0~git20240301...-0ubuntu6 | In ubuntu-ports (unofficial), not the main archive; lags behind amd64/arm64 main archive version (19.2.3) |
| Debian sid | Yes | 18.2.8+ds-2.1 | Built on buildd host `rv-osuosl-02`, completed 2026-06-10 [NEEDS VERIFICATION -- build log status was "Maybe-Successful" before promotion to "Installed"]; Debian riscv64 is a ports (unofficial) architecture |
| openSUSE Factory (OBS) | Expected yes | -- | ExclusiveArch in `ceph.spec.in` enables OBS builds; direct OBS verification not performed in research |
| Arch Linux RISC-V | Unverified | -- | Page uses dynamic rendering; ceph is AUR-only in Arch and AUR packages are not ported to Arch RISC-V binary repos |

Ceph does not publish official binary release artifacts directly. Distributions are the intended delivery mechanism. The riscv64 availability is currently limited to ports/unofficial channels (ubuntu-ports, Debian ports, openSUSE OBS). No stable distribution (Ubuntu LTS main, Debian stable, RHEL/CentOS Stream) carries riscv64 Ceph packages.

---

## 9. Dependencies

### 9.1 Blocking Dependencies (for default build)

None. All optional components with riscv64 gaps are disabled by default.

### 9.2 Dependency Status Table

| Dependency | Role | riscv64 Build | riscv64 Test | Blocking Issues |
|---|---|---|---|---|
| OpenSSL | TLS, AES, SHA, CRC | Builds; `linux64-riscv64` target added 2022 | CI in OS Zoo; intermittent `test_lhash` failures on riscv64 ([#30880](https://github.com/openssl/openssl/issues/30880)) | AES without Zkn ISA extension is non-constant-time ([#20980](https://github.com/openssl/openssl/issues/20980)); not a build blocker |
| Boost 1.87 | Boost.Asio, Boost.Context, containers | Builds; Boost.Context riscv64 asm issues fixed (boostorg/context [#306](https://github.com/boostorg/context/issues/306) closed Jul 2025); Ceph CMake Jamfile ordering fixed (PR #69611) | No dedicated riscv64 CI lane visible | None blocking |
| RocksDB | BlueStore KV engine | Builds; linux-riscv64 support merged ([#12139](https://github.com/facebook/rocksdb/issues/12139)) December 2023 | Build tested under QEMU (slow, ~5h at -j6) | None; musl/Alpine riscv64 excluded (no OpenJDK musl/riscv64) |
| jemalloc | Memory allocator (optional, preferred) | Builds; riscv64gc support merged ([#2323](https://github.com/jemalloc/jemalloc/issues/2323)); atomics crash ([#1401](https://github.com/jemalloc/jemalloc/issues/1401)) closed | No visible riscv64 CI | Cross-build issue ([#2399](https://github.com/jemalloc/jemalloc/issues/2399)) open; native builds unaffected |
| gperftools / tcmalloc | Memory allocator (default if found) | Builds; riscv64 port merged December 2020 ([#1222](https://github.com/gperftools/gperftools/issues/1222)); atomics crash ([#1359](https://github.com/gperftools/gperftools/issues/1359)) closed | No visible riscv64 CI | Note: Ceph ASan builds require tcmalloc/jemalloc to be disabled (PR #69621 open) |
| ISA-L | Erasure coding, zlib | Builds on riscv64 since ISA-L v2.32.0; Ceph enablement merged June 2026 (PR #68098) | No dedicated riscv64 CI | Requires Linux 6.5+ for hardware acceleration; older kernels use software fallback |
| LZ4 | Compression (BlueStore, OSD) | Builds; basic riscv64 support merged October 2023 ([#1298](https://github.com/lz4/lz4/pull/1298)); aligned access fix via Zicclsm merged ([#1648](https://github.com/lz4/lz4/pull/1648)) | No dedicated riscv64 CI | RVV optimization path (claimed 4.7-4.8x speedup) not yet merged; scalar performance is suboptimal |
| zstd | Compression (general) | Builds; 64-bit arch detection merged ([#4525](https://github.com/facebook/zstd/pull/4525)); Zicclsm unaligned access issue open ([#4584](https://github.com/facebook/zstd/issues/4584)) | CI with GCC for riscv64 ([#4502](https://github.com/facebook/zstd/pull/4502)) | Huffman 4-way fast loop disabled for riscv64 ([#4622](https://github.com/facebook/zstd/issues/4622)); decompression slower than optimal |
| snappy | Compression (RGW, general) | Builds; benchmark submodule RISC-V update merged ([#208](https://github.com/google/snappy/pull/208)) | No visible riscv64 CI | None known |
| liburing | BlueStore/Crimson async I/O | Builds; nolibc support added August 2023 ([#930](https://github.com/axboe/liburing/pull/930)); GitHub CI riscv64 build added ([#928](https://github.com/axboe/liburing/pull/928)) | CI riscv64 build active | None |
| SPDK | BlueStore NVMe backend (WITH_SPDK=OFF default) | Partially builds; riscv64 in CMake allowed-processor list; bundled DPDK blocks | No riscv64 CI | **BLOCKING for SPDK path:** DPDK bundled by SPDK has no riscv64 support; NVMe controller init fails on riscv64 hardware ([spdk #3475](https://github.com/spdk/spdk/issues/3475) open); `WITH_SYSTEM_SPDK` is the workaround; reef backport PR #69376 unreviewed |
| DPDK | Network acceleration (WITH_DPDK=OFF default) | Cross-compile guide exists; limited hardware testing | No riscv64 CI | No official riscv64 release; not a blocker (disabled by default) |
| Apache Arrow | RadosGW Arrow Flight (WITH_RADOSGW_ARROW_FLIGHT=OFF default) | C++ builds functional; Ceph submodule update PR #65976 auto-closed stale | No riscv64 CI | Python manylinux riscv64 wheels not released; Arrow Flight disabled by default -- not blocking |
| Jerasure / GF-Complete | Erasure coding (bundled fallback) | Builds; pure C with lookup tables, no SIMD paths | No CI | No blocking issues; ISA-L plugin now preferred on riscv64 |
| Python 3 | Dashboard, management, build scripts | Builds; riscv64 support well-established | Standard Python CI | Some dashboard pip dependencies lack riscv64 wheels; workaround is `--system-site-packages` |

---

## 10. Ecosystem Status

### 10.1 Contributor Organizations

Active riscv64 contributors to ceph/ceph:

| Organization | Contributor | Role |
|---|---|---|
| ISCAS (Institute of Software, Chinese Academy of Sciences) | sunyuechi | RVV optimizations, ISA-L enablement, build fixes |
| ZTE Corporation | leiwen2025 | CRC32C hardware acceleration, hwprobe fixes, cycle counter |
| ZTE / Sanechips affiliate | lvshuo2016 | SPDK riscv64 backport, Arrow submodule |
| ISCAS | laokz | Early cycle counter attempt (PR #57756, superseded) |
| SUSE | andreas-schwab | RPM spec riscv64 enablement |

Proxmox (tchaikov / Kefu Chai) functions as the primary merger and reviewer for riscv64 patches.

### 10.2 RISE Project Relationship

RISE Project General Members include ISCAS (sunyuechi's organization) and ZTE (leiwen2025's organization). However, no RISE funding for Ceph work was found. The 27 RISE blog posts (May 2024 through June 2026) contain zero mentions of Ceph. Ceph is not listed among the ~80 packages built by the RISE Python wheel_builder project. No RISE RFP (publicly documented RP004, RP009, RP012, and others covering compilers, kernel CI, Java, Go, V8, Python, Yocto) covers Ceph. The RISE project is not a member of the Ceph Foundation.

The riscv64 work in Ceph is being driven by ISCAS and ZTE contributors under their own organizational mandates, not through a publicly documented RISE funded project.

### 10.3 Hardware Tested by Contributors

- BPI-F3 (SpacemiT K1 SoC) -- used for PR #65354 (mem_is_zero RVV benchmark)
- SG2044 (Sophon SG2044, running Linux 6.12.47) -- used for PR #68047 (hwprobe fix) and PR #68154 (CRC32C Zbc optimization)

No server-grade RISC-V hardware was cited in any PR.

---

## 11. Known Bugs and Active Issues

### 11.1 Open Tracker Issue

**[tracker.ceph.com #57350](https://tracker.ceph.com/issues/57350)** -- "failed to build on riscv64"
- Status: Open (New), Priority: Normal, filed against Ceph 16.2.10
- Root cause: missing `-latomic` linkage on riscv64; sub-word atomic operations require a runtime call into `libatomic` on riscv64. Affected archives: `libos.a`, `libblk.a`, `librocksdb.a`. Exact linker errors: `undefined reference to __atomic_fetch_add_2`, `__atomic_fetch_sub_2`, `__atomic_compare_exchange_1`.
- Linked PR #47883 (proposed fix, auto-closed 2023-06-26 after 90 days with zero maintainer review).
- Backport scope was debated; Ilya Dryomov and Konstantin Shalygin removed backport targets. No assignee.
- The Debian sid build of 18.2.8 explicitly passes `-latomic` in its linker invocations (observed in build log), confirming the issue was worked around in Debian packaging if not resolved upstream.

### 11.2 Open Pull Requests

**[PR #69376](https://github.com/ceph/ceph/pull/69376)** -- "reef: [backport] Add riscv64 support to WITH_SPDK"
- Status: Open as of June 10, 2026. Author: lvshuo2016 (Sanechips). CI not triggered (author is not a Ceph GitHub org member).
- Partial backport of upstream commit `6af1a85` to the stable `reef` branch.
- Core concern raised by sunyuechi: SPDK bundles DPDK internally, and DPDK does not support riscv64. This was precisely the reason `WITH_SYSTEM_SPDK` was added upstream. A backport without `WITH_SYSTEM_SPDK` is likely to fail to build on riscv64.
- This PR is blocked, unreviewed, and probably incorrect in its current form.

**[PR #69621](https://github.com/ceph/ceph/pull/69621)** -- "build,test: fix issues surfaced by tests after enabling ASan"
- Status: Open, June 22, 2026. Author: sunyuechi. Approved by tchaikov; awaiting RBD maintainer review (via extracted PR #69623).
- Six fixes: forces libc allocator under `WITH_ASAN` (tcmalloc/jemalloc export `operator new/delete` causing SIGSEGV when sanitizer-allocated memory is freed through tcmalloc); fixes Seastar allocator init race in Crimson; fixes `setarch $(uname -m) -R` failure on riscv64 (bare `setarch -R` is the fix); adds LSan suppressions in vstart.sh; adds third-party leak suppressions.
- riscv64-specific note from PR author: without ASan the slowest test takes 2000s; with ASan it times out at 6000s and causes OOM on available riscv64 hardware.

**[PR #69622](https://github.com/ceph/ceph/pull/69622)** -- "cmake: define BOOST_USE_UCONTEXT tree-wide under ASan"
- Status: Open, June 22, 2026. Author: sunyuechi. Approved by tchaikov; awaiting cbodley review.
- Exact link error being fixed: `mold: error: undefined symbol: boost::context::detail::make_fcontext`
- riscv64 is explicitly excluded from the BOOST_USE_UCONTEXT path with the stated reason: "riscv64's ASan runtime mis-handles makecontext/swapcontext, so the ucontext fiber backend reports false-positive heap-buffer-overflows on fiber switch that can't be suppressed."
- This is a test-infrastructure issue, not a production correctness issue.

### 11.3 Auto-Closed PRs Without Resolution

**[PR #65976](https://github.com/ceph/ceph/pull/65976)** -- "Update arrow submodule to support riscv detect"
- Closed April 3, 2026 by inactivity bot after 90 days with zero code review. No champion.

**[PR #65142](https://github.com/ceph/ceph/pull/65142)** -- "Upgrade PyPI dependencies to enable installation on riscv64"
- Closed April 25, 2026 by inactivity bot. Documented that `golang-github-prometheus`, `libpmem-devel`, and `libpmemobj-devel` are missing for riscv64; workaround is `--system-site-packages`.

---

## 12. Objections and Upstream Blockers

**Objection 1: "The bit offset bug (PR #68047) was in mainline for six months without detection."**
Accurate. The hwprobe bit offsets were wrong from PR #66026 (March 2026) until PR #68047 (March 2026) -- the two PRs were merged eleven days apart, but the bug was present in the initial submission. The absence of CI means no automated test would catch a regression where ZBC/ZVBC acceleration was silently disabled. This will recur: any future patch touching the hwprobe path has no automated regression guard.

**Objection 2: "SPDK NVMe-oF on riscv64 is blocked with no clear resolution timeline."**
Accurate. The bundled DPDK inside SPDK does not support riscv64. The upstream Ceph workaround is `WITH_SYSTEM_SPDK`, but this requires the operator to supply a separately-built SPDK without bundled DPDK. The reef backport PR #69376 appears to be technically incorrect (it does not include `WITH_SYSTEM_SPDK`) and has no reviewer. This is not a blocker for standard Ceph deployments (SPDK is `OFF` by default), but it is a blocker for deployments requiring NVMe-oF with SPDK.

**Objection 3: "LZ4 and zstd performance is suboptimal on riscv64."**
Accurate. LZ4 RVV optimization patches are not merged upstream (claimed 4.7-4.8x speedup still pending in [lz4 #1738](https://github.com/lz4/lz4/issues/1738)). zstd's Huffman 4-way fast loop is explicitly disabled for riscv64 ([zstd #4622](https://github.com/facebook/zstd/issues/4622)). For workloads that are compression-bound, riscv64 will underperform x86 and aarch64.

**Objection 4: "No stable distribution ships riscv64 Ceph packages."**
Accurate. Ubuntu 24.04 LTS carries riscv64 Ceph only in ubuntu-ports (unofficial) at a version behind the main archive. Debian riscv64 is a ports architecture (unofficial). No RHEL/CentOS Stream, no Ubuntu LTS main archive, no Debian stable riscv64 Ceph package exists.

**Objection 5: "The only published benchmark is a micro-benchmark on an embedded SBC."**
Accurate. The only quantitative data is the `mem_is_zero` RVV speedup from PR #65354, run on a BPI-F3 (SpacemiT K1). No IOPS, throughput, or latency benchmarks comparing riscv64 Ceph to x86 or aarch64 Ceph on any hardware have been published. CRC32C, ISA-L, and Zbc optimization PRs were all merged without published numbers.

**Objection 6: "Ceph ASan testing on riscv64 is fundamentally broken."**
Partially accurate. Two open PRs (#69621, #69622) document multiple ASan-related crashes specific to riscv64, including allocator conflicts and an explicit `BOOST_USE_UCONTEXT` exclusion due to ASan false-positives on ucontext fiber switch that "can't be suppressed." These are test-infrastructure issues; production binaries run without ASan. However, ASan coverage is a standard quality gate for new code, and its absence on riscv64 means new contributions targeting riscv64 cannot be validated through the same tooling used on other architectures.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The core storage path (RADOS, RBD, CephFS) is functionally complete on riscv64 as of June 2026. The critical milestones have been reached: arch probe infrastructure, CRC32C hardware acceleration (both Zvbc and Zbc paths), ISA-L erasure coding, and cycle counter. No blocking gaps exist for deploying a standard Ceph cluster on riscv64.

Remaining functional gaps are peripheral: SPDK NVMe-oF (DPDK blocker, no timeline), Arrow Flight for RadosGW (submodule stale, no champion), PMEM persistent write-back cache (PMDK does not support riscv64, no upstream commitment). For customers who require SPDK NVMe-oF, this is a hard blocker requiring either a system SPDK solution or upstream DPDK riscv64 enablement.

### 13.2 Performance Optimization

The only published quantitative data is a 3.5x speedup for `mem_is_zero` on 1-8KB buffers using RVV intrinsics on a SpacemiT K1. No end-to-end storage performance numbers (IOPS, throughput, latency) exist for riscv64 Ceph. The following optimizations are merged but unbenchmarked: CRC32C (Zvbc and Zbc), ISA-L erasure coding with RVV. The following are not merged: LZ4 RVV (4.7-4.8x claimed), zstd Huffman fast loop. OpenSSL AES without Zkn is non-constant-time.

Investment in benchmarking on server-grade riscv64 hardware would establish the performance baseline needed to make a data-driven deployment decision.

### 13.3 CI/CD Infrastructure

Zero automated riscv64 CI exists. This is the highest-leverage investment: without CI, every regression is silent until a contributor manually tests on hardware. The ZBC/ZVBC bit offset bug (six months of broken hardware acceleration, no automated detection) illustrates the risk concretely.

Minimum CI investment: a self-hosted riscv64 runner (physical or QEMU) executing `make check` per PR against riscv64 target. This would provide regression gating without full Teuthology integration. Adding `riscv64.yaml` to `qa/archs/` would signal official tier intent to the community.

### 13.4 Ecosystem Enablement

The two auto-closed PRs (#65976 Arrow submodule, #65142 PyPI wheels) indicate contributor work that failed to reach merge due to maintainer attention, not technical unsolvability. Adopting or championing these PRs would unblock Arrow Flight for RISC-V RadosGW deployments and eliminate the Python dashboard wheel workaround.

The SPDK/DPDK gap requires either: (a) contributing riscv64 support to DPDK upstream and propagating it through the SPDK bundled version, or (b) ensuring `WITH_SYSTEM_SPDK` is the documented path for riscv64 and that reef backport PR #69376 is corrected. Option (b) is lower effort.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add self-hosted riscv64 runner to Ceph CI (physical or QEMU); add `riscv64.yaml` to `qa/archs/`; wire to PR gate | 4-6 | Infrastructure + Ceph community | Critical |
| Functional | Fix and merge SPDK riscv64 path via `WITH_SYSTEM_SPDK` (correct PR #69376) | 2-3 | Ceph storage/bluestore team | High (if SPDK NVMe-oF required) |
| Functional | Merge PR #69621 (ASan allocator/Seastar fixes) and PR #69622 (Boost ucontext under ASan, with riscv64 exclusion) | 1 (reviewer time) | RBD maintainer + cbodley | High (unblocks test coverage) |
| Functional | Fix tracker #57350 (-latomic linkage for older Ceph versions); new PR to replace stale #47883 | 1 | Ceph build team | Medium |
| Functional | Revive and merge PR #65976 (Arrow submodule riscv detect) | 1-2 | Arrow + Ceph RadosGW team | Medium |
| Functional | Revive and merge PR #65142 (PyPI wheel upgrades for riscv64) | 1 | Ceph dashboard team | Medium |
| Performance | Publish end-to-end storage benchmarks (IOPS/throughput/latency) on server-grade riscv64 hardware | 3-4 | Performance team with hardware access | High |
| Performance | Upstream and merge LZ4 RVV optimization ([lz4 #1738](https://github.com/lz4/lz4/issues/1738)) | 3-4 | LZ4 upstream + Ceph | Medium |
| Performance | Enable zstd Huffman fast loop for riscv64 ([zstd #4622](https://github.com/facebook/zstd/issues/4622)) | 2-3 | zstd upstream | Medium |
| Ecosystem | Formal Ceph Foundation membership discussion to signal investment | 0 (executive) | Business development | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [ceph/ceph GitHub repository](https://github.com/ceph/ceph)
- [Ceph homepage](https://ceph.io/)
- [tracker.ceph.com #57350 -- failed to build on riscv64](https://tracker.ceph.com/issues/57350)
- [PR #47883 -- cmake: fix CheckCxxAtomic.cmake (closed unmerged)](https://github.com/ceph/ceph/pull/47883)
- [PR #51732 -- ceph.spec.in: enable build on riscv64 for openSUSE Factory](https://github.com/ceph/ceph/pull/51732)
- [PR #57756 -- common/Cycles.h: add rdtsc riscv64 implementation (superseded)](https://github.com/ceph/ceph/pull/57756)
- [PR #65120 -- common/Cycles: Add high-precision counter support for riscv64](https://github.com/ceph/ceph/pull/65120)
- [PR #65142 -- Upgrade PyPI dependencies to enable installation on riscv64 (closed stale)](https://github.com/ceph/ceph/pull/65142)
- [PR #65354 -- inline_memory: optimize mem_is_zero for riscv using RVV intrinsics](https://github.com/ceph/ceph/pull/65354)
- [PR #65976 -- Update arrow submodule to support riscv detect (closed stale)](https://github.com/ceph/ceph/pull/65976)
- [PR #66026 -- src/common: add crc32c support for riscv64](https://github.com/ceph/ceph/pull/66026)
- [PR #68047 -- src/arch: fix hwprobe include path and ZBC/ZVBC offsets for riscv64](https://github.com/ceph/ceph/pull/68047)
- [PR #68098 -- isa-l: enable on RISC-V](https://github.com/ceph/ceph/pull/68098)
- [PR #68154 -- src/common: optimize crc32c using zbc extension for riscv64](https://github.com/ceph/ceph/pull/68154)
- [PR #69315 -- Dockerfile.build: bump sccache and fetch it on riscv64](https://github.com/ceph/ceph/pull/69315)
- [PR #69376 -- reef: [backport] Add riscv64 support to WITH_SPDK](https://github.com/ceph/ceph/pull/69376)
- [PR #69611 -- cmake/boost: load context Jamfile before passing context-impl to b2](https://github.com/ceph/ceph/pull/69611)
- [PR #69621 -- build,test: fix issues surfaced by tests after enabling ASan](https://github.com/ceph/ceph/pull/69621)
- [PR #69622 -- cmake: define BOOST_USE_UCONTEXT tree-wide under ASan](https://github.com/ceph/ceph/pull/69622)
- [Debian buildd riscv64 Ceph status](https://buildd.debian.org/status/package.php?p=ceph&suite=sid)
- [RISE Project](https://riseproject.dev/)
- [boostorg/context issue #306 -- Boost context support for riscv64](https://github.com/boostorg/context/issues/306)
- [SPDK issue #3475 -- NVMe controller init timeout on riscv64](https://github.com/spdk/spdk/issues/3475)
- [lz4 RVV optimization issue #1738](https://github.com/lz4/lz4/issues/1738)
- [zstd Huffman fast loop disabled for riscv64 -- issue #4622](https://github.com/facebook/zstd/issues/4622)
- [OpenSSL AES non-constant-time without Zkn -- issue #20980](https://github.com/openssl/openssl/issues/20980)