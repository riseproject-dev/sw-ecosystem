---
title: Ceph
parent: Project Reports
color: orange
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: Boost
    relation: runtime-dependency
    criticality: critical
  - name: RocksDB
    relation: runtime-dependency
    criticality: critical
  - name: liburing
    relation: runtime-dependency
    criticality: optional
  - name: LZ4
    relation: runtime-dependency
    criticality: optional
  - name: snappy
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: ISA-L
    relation: runtime-dependency
    criticality: optional
  - name: SPDK
    relation: runtime-dependency
    criticality: optional
  - name: DPDK
    relation: runtime-dependency
    criticality: optional
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: gperftools
    relation: runtime-dependency
    criticality: optional
  - name: Apache Arrow
    relation: runtime-dependency
    criticality: optional
  - name: Python
    relation: runtime-dependency
    criticality: optional
  - name: Seastar
    relation: runtime-dependency
    criticality: optional
  - name: LanceDB
    relation: runtime-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: GNU make
    relation: build-dependency
    criticality: optional
  - name: sccache
    relation: build-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="ceph" %}

# Ceph

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Ceph<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[Ceph](https://ceph.io/) is a distributed storage system providing object, block, and file storage from a single unified cluster. The upstream source repository is [ceph/ceph](https://github.com/ceph/ceph) on GitHub. Ceph is organized as a directed fund under the Linux Foundation, governed by the Ceph Foundation ([ceph.io/en/foundation](https://ceph.io/en/foundation/)). The Foundation publishes five membership tiers (Diamond, Platinum, Gold, Silver, Associate), but its member directory renders company logos rather than a text roster, so a named member list by tier could not be extracted [NEEDS VERIFICATION].

Governance is documented in prose (`doc/governance.rst`), not via a `MAINTAINERS`/`OWNERS`/`CODEOWNERS` file, and is a three-tier model. The Executive Council (3 seats, annual ranked-choice election by the Steering Committee, with a rule requiring more than one represented employer) currently holds: Dan van der Ster (Clyso), Neha Ojha (Red Hat), Patrick Donnelly (IBM). The Steering Committee (34 members) elects the Council and amends governance by two-thirds supermajority; it is open to non-voting public attendance. Component Team Leads are appointed by the Council on team recommendation.

Steering Committee employer representation: Red Hat (16 members), IBM (5), Clyso (3), Intel (1), Bloomberg (1), ZTE (1), Xsky (1), croit (1), UI.com (1), independents (4). This is employer representation on the Steering Committee, not confirmed to be identical to the Foundation's own Diamond/Platinum/Gold/Silver/Associate roster; the two lists should not be conflated. By commit volume, the dominant maintainers are Kefu Chai / tchaikov (Proxmox, 12,141 commits), Casey Bodley (Red Hat, 4,684), Patrick Donnelly (IBM, 4,282), Gregory Farnum (Red Hat, 3,511), Josh Durgin (Red Hat, 2,637).

License: primarily LGPL-2.1/LGPL-3 for the core project, with BSD-3-Clause (CMake modules, Intel code, ZFS plugin), CC-BY-SA-3.0 (docs), GPLv3 (git archive script), Boost-1.0, Apache-2.0 (s390x code, cpp-btree), MIT (JSON Spirit, jQuery), and AGPLv3 (backport scripts) covering specific vendored subtrees, per `COPYING`.

Community stance on new architecture ports is consensus-driven and meritocratic, with no stated architectural gatekeeping: patches are merged by core maintainers (chiefly tchaikov) when correct and non-disruptive to CI. Maintainer tchaikov explicitly waived integration testing for the riscv64 ISA-L enablement PR ("since RISC-V is not exercised by our test bed, we can skip the integration test"), confirming a permissive but CI-gap-aware posture toward new-port contributions.

## 2. Port History and Upstreaming Timeline

No dedicated master tracking issue for a riscv64 port exists on GitHub or [tracker.ceph.com](https://tracker.ceph.com) - confirmed by a zero-result GitHub Issues search for "riscv"/"riscv64" against ceph/ceph and by no umbrella riscv64 epic on the tracker. Work is organized as individual feature PRs plus one long-standing build bug ([#57350](https://tracker.ceph.com/issues/57350)).

The primary contributors are Sun Yuechi / sunyuechi (ISCAS, iscas.ac.cn), WenLei / leiwen2025 (ZTE), lvshuo2016 (Sanechips/ZTE affiliate), and laokz (ISCAS); the primary merging maintainer is Kefu Chai / tchaikov (Proxmox), and batrick closes non-viable backports.

| Date | PR/commit | Author | Description |
|---|---|---|---|
| 2023-12-15 | [#51732](https://github.com/ceph/ceph/pull/51732) | andreas-schwab (SUSE) | Enable riscv64 in openSUSE RPM spec (`ExclusiveArch`) - first riscv64-related change of any kind (packaging, not code) |
| 2025-09-03/04 | [#65120](https://github.com/ceph/ceph/pull/65120) | leiwen2025 (ZTE) | Add `rdtime` cycle counter for riscv64. Note: a literal commit-token search (`riscv repo:ceph/ceph`, author-date ascending) instead surfaces commit `60e95dba` (Sun Yuechi, 2025-09-03, merged as #65354) as the earliest hit, because GitHub's tokenizer does not substring-match `riscv64` under a `riscv` query. Both PRs land in the same week and community; the "first" answer depends on search method |
| 2025-09-25 | [#65354](https://github.com/ceph/ceph/pull/65354) | sunyuechi (ISCAS) | Optimize `mem_is_zero` with RVV intrinsics; 3.5x speedup on BPI-F3 |
| 2026-03-18 | [#66026](https://github.com/ceph/ceph/pull/66026) | leiwen2025 (ZTE) | Add hardware-accelerated CRC32C for riscv64 (Zvbc + Zbc paths) |
| 2026-03-29 | [#68047](https://github.com/ceph/ceph/pull/68047) | leiwen2025 (ZTE) | Fix hwprobe include path and wrong ZBC/ZVBC bit offsets (hardware CRC32C acceleration had been silently disabled since #66026) |
| 2026-04-16 | [#68154](https://github.com/ceph/ceph/pull/68154) | leiwen2025 (ZTE) | Optimize CRC32C via Zbc extension; tested on SG2044 |
| 2026-05-31 | [#69185](https://github.com/ceph/ceph/pull/69185) | sunyuechi (ISCAS) | Adds opt-in `WITH_SYSTEM_SPDK` and `Findspdk.cmake`, the durable fix for the SPDK/riscv64 build gap (bundled DPDK has no riscv64 support); tested on openRuyi riscv64 with system SPDK 25.09/DPDK 25.07. First shipped in v21.0.1 |
| 2026-06-02 | [#68098](https://github.com/ceph/ceph/pull/68098) | sunyuechi (ISCAS) | Enable ISA-L erasure coding plugin and zlib compressor on RISC-V |
| 2026-06-09 | [#69367](https://github.com/ceph/ceph/pull/69367) | lvshuo2016 | reef backport of riscv64/WITH_SPDK support - closed same day, unmerged |
| 2026-06-10/07-15 | [#69376](https://github.com/ceph/ceph/pull/69376) | lvshuo2016 | Near-duplicate reef backport attempt - closed by batrick 2026-07-15; a partial backport that omitted the `WITH_SYSTEM_SPDK` infrastructure from #69185 could not build on riscv64 |
| 2026-06-22 | [#69611](https://github.com/ceph/ceph/pull/69611) | sunyuechi (ISCAS) | Fix Boost.Context CMake Jamfile ordering under ASan on riscv64 |
| 2026-07-03 | [#69908](https://github.com/ceph/ceph/pull/69908) | sunyuechi (ISCAS) | Fix Zbc CRC32C assembly clobbering ABI-reserved `gp`/`tp` registers, fixing SIGSEGV crashes in `unittest-transaction-manager`/`unittest-omap-manager`. Merged by tchaikov; fixes [tracker #77904](https://tracker.ceph.com/issues/77904) |
| 2026-07-08 | [#69783](https://github.com/ceph/ceph/pull/69783) | - | Add `%{?openruyi}` RPM-spec conditionals to `ceph.spec.in` |
| 2026-07-15 | [#70211](https://github.com/ceph/ceph/pull/70211) | leiwen2025 (ZTE) | Zvbc CRC32C throughput optimization (~33% claimed gain) - open, blocked on review (reuses `gp`/`tp`, the same bug class just fixed in #69908) |
| 2026-07-28 | [#68209](https://github.com/ceph/ceph/pull/68209) | - | Adds a riscv64 CRC32C performance benchmark to `unittest_crc32c` - merged, not yet in a tagged release |
| 2026-07-28 | [#69726](https://github.com/ceph/ceph/pull/69726) | - | Drops the BlueStore PMEM (PMDK) backend entirely, retiring the riscv64 PMDK gap for BlueStore |
| 2026-08-12 | [#69448](https://github.com/ceph/ceph/pull/69448) | sunyuechi (ISCAS) | Attempted fix switching PMDK from archived ceph/pmdk 1.10 to daos-stack/pmdk 2.1.3 for riscv64 - closed unmerged, superseded by #69726 |
| 2026-09-09 | [#70141](https://github.com/ceph/ceph/pull/70141) | - | Add openRuyi as a selectable distro in the local `build-with-container.py` dev-build script |
| open, updated 2026-09-18 | [#68184](https://github.com/ceph/ceph/pull/68184) | sunyuechi (ISCAS) | Add RISC-V ZBC/ZVBC architecture probe unit tests - open, awaiting approval |
| open, updated 2026-09-28 | [#71935](https://github.com/ceph/ceph/pull/71935) | sunyuechi (ISCAS) | Default `WITH_RADOSGW_LANCEDB` off on riscv64/ppc64le/s390x (lance-linalg SIMD unimplemented) - open, lgtm from tchaikov, not yet merged; live build blocker until it lands |
| open | [#70618](https://github.com/ceph/ceph/pull/70618) | - | Drop the PMEM backend of RBD's persistent write-log cache; once merged, fully retires the riscv64 PMDK gap project-wide |

Additionally, a dedicated but non-upstream riscv64 CI now exists at [openRuyi-Project/ceph-ci](https://github.com/openRuyi-Project/ceph-ci), maintained by ISCAS, which clones Ceph, applies riscv64/openRuyi patches, and runs `make check` on real riscv64 hardware. It closes part of the CI gap in practice but is single-vendor and not wired into ceph/ceph's own GitHub Actions or Jenkins/Sepia infrastructure.

The core storage path (RADOS, RBD, CephFS) is functionally usable on riscv64 as of mid-2026, but the port is not fully upstream in the CI sense: no upstream automated riscv64 CI exists (Section 7), and two build-affecting PRs (#70211, #71935) remain open as of 2026-09-30.

## 3. Upstream Support Tier

Ceph does not publish a formal tier policy for CPU architectures. `doc/start/os-recommendations.rst` covers Linux-distribution tiers only; the closest comparable precedent language covers other non-default platforms - ARM ("limited set of daemons... check availability before you plan an ARM deployment") and the Windows client ("best effort, with no full-time maintainer"). No riscv64-specific sentence exists in this file.

In practice, riscv64 functions as an unofficial, community-supported tier by the same de facto posture as ARM/Windows, not by written policy: patches are merged by core maintainers when correct and non-disruptive, but no automated CI runs on riscv64 (Section 7), and the architecture is absent from the official OS/platform support table. The formal declaration that does exist is packaging-level: `ceph.spec.in`'s `ExclusiveArch: x86_64 aarch64 ppc64le s390x riscv64` line (merged via PR #51732, December 2023), which enables OBS/openSUSE and (per PR #69783/#70141) openRuyi RPM builds. Separately, and materially, Ubuntu's own archive (not Ceph's release process) now builds and ships riscv64 Ceph packages in its 26.04 main archive (Section 8) - this is distribution-driven, not an upstream Ceph commitment.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream GitHub Actions CI | Yes (all 12 workflow jobs) | No (workflows are governance/bot only, not build/test, on any arch) | No |
| Jenkins/Sepia periodic build/test | Yes | Yes (`ceph-pull-requests-arm64`) | No |
| `qa/archs/` config | `x86_64.yaml` | `aarch64.yaml`, `armv7.yaml` | None |
| Official release-blocking status | Yes | No (best-effort) | No |
| Distro main-archive binary | Yes | Yes | Yes, as of Ubuntu 26.04 (Section 8) |

No evidence that any chipmaker or cloud provider has committed to funding riscv64 as a first-class supported tier; the RISE Project (Section 12/13) has no documented Ceph relationship.

## 4. Technical Architecture and RISC-V-Specific Subsystems

A direct audit of ceph/ceph HEAD plus its `src/isa-l` submodule (ceph/isa-l fork) found riscv64-specific code split across both repositories: roughly 1,100-1,200 lines in ceph/ceph proper and roughly 390 lines in the isa-l submodule, about 1,500 lines total (excluding build/test/packaging glue). Coverage spans base RV64I/RV64GC, RVV ("V"), Zbc (scalar carry-less multiply), and Zvbc (vector carry-less multiply). No Zba/Zbb/Zbs bit-manipulation intrinsics and no floating-point RVV usage were found anywhere in the tree. There is no `arch/riscv/` subdirectory (RISC-V follows the same flat-file convention, e.g. `src/arch/riscv.c`/`.h`, as every other architecture) and no JIT backend of any kind for riscv64.

### 4.1 Architecture Feature Probing

`src/arch/riscv.c`/`.h` implement runtime CPU-feature detection via the Linux `riscv_hwprobe` syscall, querying `RISCV_HWPROBE_KEY_IMA_EXT_0` and exposing three flags: `ceph_arch_riscv_rvv`, `ceph_arch_riscv_zbc`, `ceph_arch_riscv_zvbc`. The include path was fixed from `<sys/hwprobe.h>` (requires glibc >= 2.40, absent on Ubuntu 22.04/Debian 12) to `<asm/hwprobe.h>` in PR #68047, which also fixed the ZBC/ZVBC bit offsets (originally `1ULL<<15` and `1ULL<<20`; correct values `1<<7` and `1<<18`). This bug silently disabled all hardware CRC32C acceleration on riscv64 for roughly six months between #66026 (March 2026) and #68047 (March 2026, eleven days apart). RISC-V is wired into `src/arch/probe.cc` under `#elif defined(__riscv)` and `src/arch/CMakeLists.txt`'s `elseif(HAVE_RISCV)`, as a peer to ARM, Intel, PPC, and s390x.

### 4.2 CRC32C

Two independent hardware-accelerated paths exist in `src/common/crc32c_riscv.c`/`.h` and `src/common/crc32c_riscv_zbc_asm.S`/`.h`:

- **Zvbc path**: hand-written inline assembly using `vclmul.vv`, `vclmulh.vv`, `vredxor.vs`. Folding loop over 64-byte chunks with Barrett reduction; falls back to scalar table lookup (`ceph_crc32c_sctp`) under 64 bytes.
- **Zbc path**: a dedicated GNU assembly file (`.option arch, +zbc`) implementing align, fold-by-4, fold-by-1, and Barrett reduction via macros in `crc32c_riscv_zbc_asm.h`. Instructions: `clmul`, `clmulh`, `clmulr` plus base RV64I. Falls back to `ceph_crc32c_sctp` under 16 bytes.

Dispatch in `ceph_choose_crc32()` (`src/common/crc32c.cc`) checks `ceph_arch_riscv_zvbc` first, then `ceph_arch_riscv_zbc`.

This assembly has had two correctness bugs. The first (ZBC/ZVBC bit-offset, above) was undetected for six months. The second, fixed by [PR #69908](https://github.com/ceph/ceph/pull/69908) (merged 2026-07-03), was the Zbc fold-by-4 loop using ABI-reserved `gp` (global pointer) and `tp` (thread pointer) as scratch registers; if a signal (e.g. Seastar's stall-detector timer in Crimson) landed mid-loop, the handler saw a corrupted `tp` and crashed resolving TLS, reliably taking down `unittest-transaction-manager`/`unittest-omap-manager`. The current tree, confirmed by direct grep, no longer references `gp`/`tp` in this file. The fix leaves a 16-byte unused stack hole, accepted by tchaikov as immaterial ("we have enough space on stack"). This class of bug is now an established review red flag: the currently open [PR #70211](https://github.com/ceph/ceph/pull/70211) (Zvbc CRC32C throughput optimization, ~33% gain claimed - 2384 to 3177 MB/s on SpacemiT K3, per the PR body) is blocked specifically because it reuses `gp`/`tp` again, per reviewer sunyuechi's explicit citation of #69908. A related upstream issue, [intel/isa-l#428](https://github.com/intel/isa-l/issues/428) ("Using gp and tp in riscv64 may cause problems," open since 2026-07-02), shows the same defect class independently affects the upstream ISA-L library's own riscv64 CRC path, unresolved as of this writing.

### 4.3 mem_is_zero

`src/include/inline_memory.h` contains an RVV C-intrinsic path (`#elif defined(__riscv_v_intrinsic)`) using `__riscv_vsetvl_e8m8`, `__riscv_vle8_v_u8m8`, `__riscv_vmsne_vx_u8m8_b1`, `__riscv_vfirst_m_b1` - a variable-length vector loop with early exit. This is the only quantitatively benchmarked riscv64 code path in Ceph, from PR #65354 (`ctest -V -R unittest_memory` on a BPI-F3/SpacemiT K1):

| Buffer size | Baseline (ms) | RVV (ms) | Speedup |
|---|---|---|---|
| 1024 B | 332 | 92 | 3.6x |
| 2048 B | 657 | 186 | 3.5x |
| 4096 B | 1290 | 366 | 3.5x |
| 8192 B | 2572 | 733 | 3.5x |
| 65536 B | 24836 | 10004 | 2.5x |

No end-to-end storage benchmarks (IOPS/throughput/latency) exist for riscv64 Ceph on any hardware; extensive GitHub code/repo search and WebSearch (where the session's budget allowed) found no such data anywhere.

### 4.4 Cycle Counter

`src/common/Cycles.h` uses `asm volatile ("rdtime %0" : "=r" (tsc))` on riscv64. `RDCYCLE` became privileged (unavailable to userspace) starting with Linux 6.6; `rdtime` reads the system timer and remains userspace-accessible. Equivalent to x86 `rdtsc`, AArch64 `cntvct_el0`, PowerPC `mftbu/mftb`.

### 4.5 ISA-L Erasure Coding and Compression

PR #68098 (merged 2026-06-02) enables the ISA-L erasure coding plugin and zlib compressor on RISC-V, gated on `ceph_arch_riscv_rvv`; falls back to scalar C when RVV is absent. However, a deeper audit of the `src/isa-l` submodule (`ceph/isa-l`, a fork of `intel/isa-l`) found the RVV vectorization is narrower than the "ISA-L enabled for riscv64" framing implies:

- `igzip/riscv64/igzip_multibinary_riscv64_dispatcher.c` and `igzip_multibinary_riscv64.S` implement a runtime dispatcher (`getauxval(AT_HWCAP)` + `HWCAP_RV('V')`, further branching on vector register length via `csrr vlenb`), but **only `isal_adler32` gets a real RVV interface** (`igzip_isal_adler32_rvv.S`, general-vlen; `igzip_isal_adler32_rvv128.S`, fixed 128-bit VLEN). Every other ISA-L kernel (deflate hash/icf/huffman/histogram, roughly 16 functions) is wired via `mbin_interface_base` straight to its scalar `_base` implementation.
- Net effect: ISA-L is buildable and correct on riscv64, and its erasure-coding path (Reed-Solomon, the primary production data-protection workload) is enabled, but ISA-L's actual DEFLATE/Huffman compression hot path receives essentially no RVV acceleration on riscv64 - only the Adler-32 checksum is vectorized. All three isa-l `.S` files carry a "Copyright (c) 2025 Institute of Software Chinese Academy of Sciences (ISCAS)" notice.

`WITH_EC_ISA_PLUGIN` is auto-enabled when `HAVE_RISCV_RVV` is set, the same gating condition as x86 AVX2, AArch64 SIMD, and PowerPC AltiVec.

### 4.6 File Count Comparison

| Architecture | Files (ceph/ceph, probe+crc32c core) | Notes |
|---|---|---|
| x86/amd64 | 9 | Includes multiple NASM `.asm` files for AVX512 |
| AArch64/ARM | 4 | |
| RISC-V (ceph/ceph) | 6 | `riscv.c`, `riscv.h`, `crc32c_riscv.c`, `crc32c_riscv.h`, `crc32c_riscv_zbc_asm.S`, `crc32c_riscv_zbc_asm.h` |
| RISC-V (isa-l submodule, additional) | 5 | Dispatcher `.c`, multibinary `.S`, two adler32 `.S` variants, `Makefile.am` |
| PowerPC | 5 | |
| s390x | 4 | |

RISC-V matches or exceeds every architecture except x86 once the isa-l submodule files are counted.

## 5. Build System, Cross-Compilation, and Toolchain

Standard build (from `README.md`/`doc/install/build-ceph.rst`):

```
git clone https://github.com/ceph/ceph.git
cd ceph && git submodule update --init --recursive --progress
./install-deps.sh
./do_cmake.sh
cd build
ninja -j3
ninja install
```

No riscv64-specific configure invocation, `--host` cross flag, or riscv64 CMake preset exists anywhere in the tree. No `BUILDING.md`, `docs/cross-compilation.md`, or any cross-compilation guide exists (`find . -iname "*cross*compil*"` returns nothing).

**Compiler minimums** (enforced in `src/CMakeLists.txt`, none architecture-conditional - the same floors apply identically on riscv64):
- GCC >= 11 (standard build - C++20 support required for the enforced check; the project compiles as C++23 in practice)
- GCC >= 13 (with `-DWITH_CRIMSON=ON` - Seastar coroutines need C++20 coroutine support, [tracker #64375](https://tracker.ceph.com/issues/64375))
- GCC >= 10 (Win32/MinGW target only, not riscv64-relevant)
- Clang >= 16 (C++20 support)
- CMake >= 3.22.1 (`cmake_minimum_required`, root `CMakeLists.txt`). Note: `ceph.spec.in` still lists `cmake > 3.5` as a BuildRequires - stale and inconsistent with the enforced floor.

**RISC-V detection** (`cmake/modules/SIMDExt.cmake`): matches `riscv64|RISCV64` in `CMAKE_SYSTEM_PROCESSOR`, sets `HAVE_RISCV=1` unconditionally, then compiler-flag-probes in priority order: `-march=rv64gcv_zbc_zvbc` (sets `HAVE_RISCV_RVV` + `HAVE_RISCV_ZVBC`) > `-march=rv64gc_zbc` (`HAVE_RISCV_ZBC`) > `-march=rv64gcv` (`HAVE_RISCV_RVV` only, fallback). This is a `CHECK_C_COMPILER_FLAG` capability probe, not a pinned toolchain-version requirement; any GCC/Clang accepting these `-march` strings works.

**Cross-compilation**: no toolchain file exists in the repository (`cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake` - neither exists). No in-tree QEMU cross-build tooling or documentation (`grep -rli qemu` across docs/scripts/Dockerfiles returns only RBD-QEMU storage-integration docs, unrelated to cross-building Ceph itself). A user must supply their own `CMAKE_SYSTEM_PROCESSOR=riscv64`/compiler/`CMAKE_SYSROOT` toolchain file and, if not building natively, their own `qemu-riscv64-static` setup.

**Dockerfiles**: no dedicated `Dockerfile.riscv64` and no `.ci/docker/` directory exist. The generic `Dockerfile.build` (repo root) contains one riscv64-specific stanza: it remaps `uname -m` output `riscv64` to `riscv64gc` when constructing the sccache release-asset download URL. The `$DISTRO` base image for a riscv64 build is supplied by `src/script/build-with-container.py`, which as of PR #70141 (merged 2026-09-09) has an `OPENRUYI` distro option mapped to `community-ci.openruyi.cn/openruyi-oci:riscv64`, selectable via `-d openruyi`/`-d openruyi-creek`. This is local developer tooling ("test changes before submitting to a real CI job," per the script's own docstring), not wired into any CI trigger.

**Flags recommended off for riscv64 builds:**

| Flag | Status | Reason |
|---|---|---|
| `WITH_QATLIB`, `WITH_QATZIP` | Auto-OFF | x86-only arch guard |
| `WITH_UADK` | Auto-OFF | aarch64-only arch guard |
| `WITH_RADOSGW_LANCEDB` | Defaults OFF on riscv64 once [PR #71935](https://github.com/ceph/ceph/pull/71935) merges (open, approved, not yet merged as of 2026-09-30) | `lance-linalg`'s SIMD kernels target only x86_64/aarch64/loongarch64; enabling this by default (the current behavior on `main` since commit `047c9e29a9b`) breaks the riscv64 build |
| `WITH_RDMA` | Explicit `-DWITH_RDMA=OFF` | Defaults ON; requires `libibverbs`/`librdmacm`, typically absent on riscv64 |
| `WITH_BLUESTORE_PMEM` | Removed entirely (PR #69726, merged 2026-07-28) | PMDK has no riscv64 support; feature retired project-wide (Intel Optane DC discontinued 2022), not riscv64-specific |
| `WITH_SYSTEM_PMDK` / `WITH_RBD_RWL` | Auto-OFF by default; `WITH_RBD_RWL`'s PMEM backend removal is proposed in open [PR #70618](https://github.com/ceph/ceph/pull/70618) | Same PMDK gap, remaining only in RBD's persistent write-log cache until #70618 merges |
| `WITH_LTTNG` | Explicit `-DWITH_LTTNG=OFF` | SUSE spec restricts to x86_64/aarch64/ppc64le |
| `WITH_SPDK` | CMake guard permits riscv64, but requires `-DWITH_SYSTEM_SPDK=ON` (added by PR #69185) plus a separately built system SPDK | Bundled DPDK inside SPDK has no riscv64 support |
| `WITH_CRIMSON` | Optional; bumps GCC floor to 13 | Use only with a confirmed GCC 13+ toolchain |

`ceph.spec.in` carries `ExclusiveArch: x86_64 aarch64 ppc64le s390x riscv64` (merged PR #51732) and 39 `%{?openruyi}` conditionals (PR #69783) enabling OBS/openSUSE and openRuyi RPM packaging.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | x86-64 | AArch64 | RISC-V (riscv64) | Gap |
|---|---|---|---|---|
| Arch feature probing | CPUID | `getauxval(AT_HWCAP)` | `riscv_hwprobe` syscall | None, equivalent mechanism |
| CRC32C acceleration | PCLMUL + SSE4.2 | PMULL + `__crc32cd` intrinsics | Zvbc inline asm + Zbc `.S` file | Minor - no multi-way pipeline/prefetch; further Zvbc optimization (#70211, ~33% claimed) blocked in review |
| `mem_is_zero` | `uint128_t` (no SIMD) | NEON C intrinsics | RVV C intrinsics | None at intrinsic level |
| Cycle counter | `rdtsc` | `cntvct_el0` | `rdtime` | None |
| ISA-L erasure coding | AVX2/AVX512 | NEON | RVV (runtime-detected) | None functionally; requires Linux 6.5+ for hwprobe-gated acceleration |
| ISA-L DEFLATE/Huffman compression | AVX-512 vectorized | NEON vectorized | Scalar only (`mbin_interface_base`) | Real gap - only Adler-32 checksum is RVV-vectorized in the submodule (Section 4.5) |
| SPDK NVMe-oF | Supported | Supported | Buildable via `WITH_SYSTEM_SPDK` (PR #69185) with a separately built system SPDK | Bundled DPDK has no riscv64 support; naive backport (#69367/#69376) rejected |
| BlueStore/RBD PMEM write-back cache | Supported | Supported | Removed project-wide (PR #69726 merged; #70618 open for the RBD side) | Feature retirement, not a riscv64-specific gap |
| RGW LanceDB vector search (`WITH_RADOSGW_LANCEDB`) | Supported | Supported | Build-breaking on `main` until PR #71935 merges | `lance-linalg` SIMD kernels only target x86_64/aarch64/loongarch64 |
| Compressor hardware offload (QAT/UADK) | Intel QAT | AArch64 UADK | None available | No equivalent hardware compression accelerator path |
| LZ4 compression | Vectorized | Vectorized | Scalar only | RVV optimization proposed upstream ([lz4 #1635](https://github.com/lz4/lz4/issues/1635)), not merged |
| zstd compression | Huffman fast loop enabled | Enabled | Disabled | Huffman 4-way fast loop disabled for riscv64 ([zstd #4622](https://github.com/facebook/zstd/issues/4622)/[#4546](https://github.com/facebook/zstd/issues/4546)); RVV XXH3 path proposed but unmerged ([#4471](https://github.com/facebook/zstd/issues/4471)) |
| Python dashboard wheels | Full | Full | Partial | Some pip dependencies lack riscv64 wheels |

The core storage path (RADOS, RBD, CephFS) has no functional blocking gaps. Remaining gaps are in optional/peripheral subsystems: RGW LanceDB (currently blocking the default build pending #71935), SPDK NVMe-oF (workable but requires system SPDK), and compression/erasure-coding hot-path performance versus x86/aarch64. No architecture-specific NaN/floating-point semantics issue was found; no RVV floating-point code exists in the tree at all (Section 4).

## 7. CI/CD Infrastructure

**No automated riscv64 CI exists in ceph/ceph's own GitHub Actions.** This was confirmed independently three separate times in this research pass: by direct reading of all 12 `.github/workflows/*.yml`/`.yaml` files, by `grep -n "runs-on:"` across every file, by `grep -ril riscv .github/`, and by GitHub's own code-search index (`riscv repo:ceph/ceph path:.github/workflows` -> 0 hits; `riscv64` same path -> 0 hits).

| File | Purpose | Runner | riscv present? |
|---|---|---|---|
| `author-ci-perms.yml` | PR-author CI-permission gating | ubuntu-latest | No |
| `check-license.yml` | Greps PR diff for GPL license text | ubuntu-latest | No |
| `diff-ceph-config.yml` | Diffs config option files, posts PR comment | ubuntu-latest | No |
| `needs-rebase.yml` | Flags merge conflicts | ubuntu-latest | No |
| `pr-check-deps.yml` | Runs dependencies-action bot | ubuntu-latest | No |
| `pr-checklist.yml` | Runs PR checklist action | ubuntu-latest | No |
| `pr-triage.yml` | File-based labeling, project/milestone assignment | ubuntu-latest | No |
| `qa-symlink.yml` | Verifies `.qa` symlinks | ubuntu-latest | No |
| `redmine-upkeep.yml` | Syncs Redmine tracker issues | ubuntu-latest | No |
| `releng-audit.yaml` | Backport/PTL audit bot | ubuntu-latest | No |
| `retrigger-rtd.yml` | Triggers Read the Docs rebuild | ubuntu-latest | No |
| `stale.yml` | Closes stale issues/PRs | ubuntu-latest | No |

**None of these 12 workflows compile, build, or test Ceph code, on any architecture** - they are exclusively PR-governance/bot automation. `create-backport-trackers.yml` was removed and `author-ci-perms.yml` added between audits; the total count (12) is unchanged. There is also no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.cirrus.star` anywhere in the repository tree (checked at root and recursively), and `qa/archs/` contains `aarch64.yaml`, `armv7.yaml`, `i686.yaml`, `x86_64.yaml` but no `riscv64.yaml`.

Ceph's actual build/integration testing runs on Jenkins in the Sepia lab via Teuthology, triggered by PR comments (visible indirectly via `retrigger-rtd.yml`'s comment-trigger pattern for docs) - this repository's GitHub Actions give no visibility into that system, so this audit can refute GitHub-Actions-based riscv64 CI specifically but cannot independently confirm or deny riscv64 legs in Jenkins/Sepia. The `ceph-build` Jenkins repository is known to contain arm64 (`ceph-pull-requests-arm64`) and ppc64 (`ceph-make-check-periodic-ppc64`) periodic jobs; no equivalent riscv64 job was found.

A dedicated riscv64 CI does exist, but outside upstream: [openRuyi-Project/ceph-ci](https://github.com/openRuyi-Project/ceph-ci), an ISCAS-maintained pipeline that clones Ceph, applies riscv64/openRuyi patches ("1xxx" upstream-destined, "2xxx" downstream-only), builds, and runs `make check`/ctest on real riscv64 hardware inside an openRuyi container - single-node scope, mirroring the scope of upstream's own containerized PR job. This closes part of the CI gap in practice as of September 2026 but is single-vendor and not wired into ceph/ceph's own infrastructure.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions build/test | None (governance only, all archs) | None | None |
| Jenkins/Sepia periodic job | Yes | Yes | None found |
| Dedicated third-party CI | n/a | n/a | Yes (openRuyi-Project/ceph-ci, non-upstream) |
| `qa/archs/*.yaml` | `x86_64.yaml` | `aarch64.yaml`, `armv7.yaml` | None |

The consequence: riscv64-only code changes have no automated regression guard before merge. This has manifested twice in the same file (`crc32c_riscv_zbc_asm.S`): the ZBC/ZVBC bit-offset bug (six months undetected, PR #66026 to #68047) and the `gp`/`tp` ABI-register clobbering bug (PR #69908). PR #68098 (ISA-L enablement) was merged with tchaikov's explicit acknowledgment that riscv64 is "not exercised by our test bed."

## 8. Distribution and Release Status

| Channel | riscv64 present | Version | Notes |
|---|---|---|---|
| GitHub Releases (ceph/ceph) | N/A | - | Upstream publishes no GitHub Releases at all, for any architecture ("There aren't any releases here."); source tags plus download.ceph.com tarballs and distro packages are the actual delivery mechanism |
| PyPI | N/A | - | No PyPI project literally named `ceph` exists (`pypi.org/pypi/ceph/json` returns HTTP 404, confirmed a second way via `pypi.org/simple/ceph/`) |
| RISE Python wheel builder | No | - | GitLab's PyPI proxy for the RISE wheel builder redirects to upstream PyPI for this name and 404s identically; Ceph is not among the 86 packages the RISE wheel_builder project builds |
| **Ubuntu 26.04 (Resolute), main archive** | **Yes** | **20.2.0-0ubuntu2** | Verified via Launchpad (three independent, mutually consistent pages): `ceph_20.2.0-0ubuntu2` built for riscv64 on builder `bos03-riscv64-032`, build `+build/32377273`, `[FULLYBUILT] Successfully built`, producing 60 binary packages plus debug symbols, published in the `main` component (not ports/unofficial). Also riscv64-enabled at the same version: `ceph-base`, `ceph-common`, `ceph-mon`, `ceph-osd`, `ceph-mds`, `ceph-mgr`, `ceph-immutable-object-cache`, `cephfs-mirror`, `libcephfs-dev`, `libcephfs-jni`, `libcephfs2`, `libsqlite3-mod-ceph`, `libsqlite3-mod-ceph-dev`, `python3-ceph-argparse`, `python3-cephfs`. `python3-ceph` and `libceph` are not distinct binary package names in this archive; whether Ubuntu's packaging carries riscv64-specific patches beyond building unmodified upstream source was not verified |
| Debian sid | Yes | 18.2.8+ds-2.1 | Built on buildd host `rv-osuosl-02` [NEEDS VERIFICATION - build-log status was "Maybe-Successful" before promotion to "Installed"]; Debian riscv64 is a ports (unofficial) architecture |
| openSUSE Factory (OBS) | Expected yes | - | `ExclusiveArch` in `ceph.spec.in` enables OBS builds; direct OBS build-log verification not performed |
| Arch Linux RISC-V | No | - | Neither the archriscv homepage nor its detailed status table (`archriscv.felixc.at/.status/status.htm`) lists a `ceph` row |

Ceph does not publish official binary release artifacts itself; distribution packaging is the intended delivery mechanism, and Ubuntu's 26.04 main-archive build is now the strongest available signal of riscv64 binary availability - a material change from ports-only/unofficial status. No stable RHEL/CentOS Stream riscv64 Ceph package was found. A user who needs a working riscv64 Ceph binary today should use Ubuntu 26.04 (Resolute) main-archive packages, or build from source using the openRuyi container target (PR #70141) or a manual toolchain (Section 5).

## 9. Dependencies

### 9.1 Blocking Dependencies for the Default Build

None currently that halt a build outright on riscv64: all optional components with unresolved riscv64 gaps are disabled by default. The one live exception is transitional - `WITH_RADOSGW_LANCEDB` defaults ON on `main` since commit `047c9e29a9b` and breaks the riscv64 build until PR #71935 merges (open, approved as of 2026-09-28).

### 9.2 Dependency Status Table

| Dependency | Role | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|---|
| OpenSSL | TLS, AES/SHA/CRC crypto | Critical (runtime) | Builds; `linux64-riscv64` target since 2022 | CI in "OS Zoo"; intermittent `test_lhash` failures ([#30880](https://github.com/openssl/openssl/issues/30880), open) | Ships in Debian/Ubuntu riscv64 | AES without Zkn is non-constant-time ([#20980](https://github.com/openssl/openssl/issues/20980)); musl `RISCV_HAS_ZBB()` mis-detection ([#28118](https://github.com/openssl/openssl/issues/28118), open); SHA256 asm optimization proposal open ([#28664](https://github.com/openssl/openssl/issues/28664)) |
| Boost | Fiber context switching (Context), async I/O (Asio) | Critical (runtime) | Builds; asm issues fixed ([boostorg/context#306](https://github.com/boostorg/context/issues/306), closed 2025-07-10); Ceph Jamfile-ordering fix (PR #69611) | No dedicated riscv64 CI lane found | Ships in distro riscv64 ports | None currently open specific to riscv64 in boostorg/context |
| RocksDB | BlueStore KV engine | Critical (runtime) | Builds; riscv64 `-march` fixes merged and closed ([#11994](https://github.com/facebook/rocksdb/issues/11994), [#7051](https://github.com/facebook/rocksdb/issues/7051)) | QEMU-based build tests only, slow | Ships in Debian/Ubuntu riscv64 | No open riscv64 issues found |
| liburing | BlueStore/Crimson async I/O | Optional (runtime) | Builds; nolibc support added ([axboe/liburing#930](https://github.com/axboe/liburing/pull/930)) | CI riscv64 build active ([#928](https://github.com/axboe/liburing/pull/928)) | Ships in Debian/Ubuntu riscv64 | None open |
| LZ4 | Compression (BlueStore/OSD) | Optional (runtime) | Builds; basic support merged Oct 2023; Zicclsm alignment fix merged | No dedicated riscv64 CI | Ships in Debian/Ubuntu riscv64 | RVV optimization proposal open/unmerged ([#1635](https://github.com/lz4/lz4/issues/1635)); scalar performance remains suboptimal (Section 6) |
| snappy | Compression (RGW/general) | Optional (runtime) | Builds | No dedicated riscv64 CI | Ships in Debian/Ubuntu riscv64 | 1 open performance issue, not correctness ([#209](https://github.com/google/snappy/issues/209), "FindMatchLength on RISC-V") |
| zstd | General compression | Optional (runtime) | Builds; 64-bit arch detection merged; CI with GCC for riscv64 added ([#4502](https://github.com/facebook/zstd/pull/4502)) | Some CI coverage exists | Ships in Debian/Ubuntu riscv64 | 2 open: RVV support for XXH3 ([#4471](https://github.com/facebook/zstd/issues/4471)); unaligned access / disabled Huffman fast loop ([#4546](https://github.com/facebook/zstd/issues/4546)) |
| ISA-L | Erasure coding, zlib codec | Optional (runtime) | Builds on riscv64 since v2.32.0; Ceph enablement merged (PR #68098) | No dedicated riscv64 CI | Not independently verified as packaged for riscv64 in Ubuntu 26.04 | Only Adler-32 is RVV-vectorized in the isa-l submodule (Section 4.5); upstream `intel/isa-l` shares the `gp`/`tp` scratch-register defect class ([intel/isa-l#428](https://github.com/intel/isa-l/issues/428), open), independent of Ceph's own local fix; general support tracking issue also open ([#239](https://github.com/intel/isa-l/issues/239)) |
| SPDK | BlueStore NVMe backend | Optional (runtime, default OFF) | Buildable via `WITH_SYSTEM_SPDK` (PR #69185, merged); bundled DPDK blocks the default `WITH_SPDK` path | No riscv64 CI | Not packaged for riscv64 | NVMe controller init timeout on riscv64 hardware ([spdk#3475](https://github.com/spdk/spdk/issues/3475), open); naive backport of the fix to the `reef` stable branch was rejected (PR #69367/#69376) |
| DPDK | Network acceleration; also vendored inside SPDK | Optional (runtime, default OFF) | Cross-compile possible; no official riscv64 release; the copy bundled by SPDK specifically lacks riscv64 support, which is the direct cause of the SPDK blocker above | No riscv64 CI | Not packaged for riscv64 | Not independently re-searched against dpdk.org this pass |
| jemalloc | Memory allocator (optional/preferred) | Optional (runtime) | Builds; riscv64gc support merged ([#2323](https://github.com/jemalloc/jemalloc/issues/2323), closed) | No dedicated riscv64 CI | Ships in Debian/Ubuntu riscv64 | Cross-build (not native) gap open ([#2399](https://github.com/jemalloc/jemalloc/issues/2399)) |
| gperftools | Memory allocator (tcmalloc, default if found) | Optional (runtime) | Builds; riscv64 port merged December 2020 | No dedicated riscv64 CI | Not independently re-searched this pass | Ceph-side: ASan builds require tcmalloc/jemalloc disabled (PR #69621, open) |
| Apache Arrow | RadosGW Arrow Flight | Optional (runtime, default OFF) | C++ builds functional | No riscv64 CI | Python manylinux riscv64 wheels not released | Ceph's own Arrow submodule riscv-detect update (PR #65976) auto-closed stale with no champion |
| Python | Dashboard, management, build scripts | Optional (runtime) | Builds; riscv64 support well-established | Standard Python CI | Ships in distro riscv64 (`python3-cephfs` etc. confirmed in Ubuntu 26.04, Section 8) | Some dashboard pip dependencies lack riscv64 wheels (PR #65142 attempted a fix, auto-closed stale); workaround is `--system-site-packages` |
| Seastar | Crimson OSD async/coroutine reactor framework | Optional (runtime, Crimson only) | Data not available: no riscv64-specific Seastar build/CI status was found in this research pass beyond the general `WITH_CRIMSON` GCC 13 floor (Section 5) that applies identically on riscv64 | Data not available: no dedicated riscv64 Seastar CI found | Data not available | [NEEDS VERIFICATION] - not independently searched against seastar's own GitHub repo this pass |
| LanceDB | RGW vector-search/Lance integration (`WITH_RADOSGW_LANCEDB`) | Optional (runtime) | Fails to build on riscv64 (and ppc64le/s390x): its `lance-linalg` SIMD kernels (f32x8/16, f64x4/8, i32x8) only target x86_64/aarch64/loongarch64; fix is open PR #71935 (defaults the feature off on unsupported arches) | No riscv64 CI | Not packaged for riscv64 | Live build blocker on `main` until #71935 merges ([tracker #80688](https://tracker.ceph.com/issues/80688), "Fix Under Review," nominally scoped to ppc64le by its reporter but the linked PR names riscv64 as failing too); upstream `lance-format/lance` has since merged SIMD support per PR #71935's own discussion, but the author argues it is still slow enough to keep disabled by default |
| CMake | Build system generator | Critical (build) | No riscv64-specific issues found; `cmake_minimum_required(VERSION 3.22.1)` applies identically on riscv64 | n/a | Ships in Debian/Ubuntu riscv64 | None found |
| GCC | Primary compiler | Critical (build) | Builds; version floor (11, or 13 under `WITH_CRIMSON`) is not architecture-conditional | n/a | Ships in Debian/Ubuntu riscv64 | None found specific to Ceph's use |
| LLVM | Alternate compiler (Clang) | Optional (build) | Builds; version floor 16, not architecture-conditional | n/a | Ships in Debian/Ubuntu riscv64 | None found |
| GNU make | Build tooling (alongside/instead of ninja) | Optional (build) | No riscv64-specific issues found | n/a | Ships universally | None found |
| sccache | Build cache, used in containerized dev builds | Optional (build) | `Dockerfile.build` explicitly remaps `riscv64` to `riscv64gc` to fetch the correct sccache release asset (Section 5) | n/a | Distributed as prebuilt Rust binaries; riscv64gc target published by the sccache project | None found; this remap is the only riscv64-specific logic in `Dockerfile.build` |
| googletest | Unit test framework (`unittest_crc32c`, `unittest_memory`, etc.) | Critical (test) | Data not available: no riscv64-specific googletest build/CI issue was found in this research pass; all riscv64 unit tests referenced in this report (e.g. `unittest_crc32c`, `test_arch.cc`) run against it without a documented framework-level riscv64 gap | n/a | Ships in Debian/Ubuntu riscv64 | [NEEDS VERIFICATION] - not independently searched against googletest's own repo this pass |

Indirect/recursed dependencies surfaced during this research:

| Dependency | Role | riscv64 status |
|---|---|---|
| PMDK / libpmem (via `WITH_SYSTEM_PMDK`/`WITH_BLUESTORE_PMEM`/`WITH_RBD_RWL`) | BlueStore and RBD PMEM-backed caches | No riscv64 support in the archived `ceph/pmdk` 1.10 fork ("unsupported architecture: riscv64"); a fix attempt switching to the maintained `daos-stack/pmdk` 2.1.3 (PR #69448) was superseded when the BlueStore PMEM backend was removed outright (PR #69726, merged); the RBD write-log cache's PMEM backend removal (PR #70618) is open and would retire this dependency from Ceph entirely once merged |
| Jerasure / GF-Complete | Erasure coding, bundled fallback when ISA-L is unavailable | Builds; pure C with lookup tables, no SIMD paths, no CI; no blocking issues, and ISA-L is now the preferred riscv64 erasure-coding path (Section 4.5) |
| lance-linalg (upstream of LanceDB) | SIMD kernel layer underlying LanceDB's vector search | Root cause of the riscv64 LanceDB build failure (Section 9.2, LanceDB row); its SIMD types target only x86_64/aarch64/loongarch64 |

## 10. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [tracker #57350](https://tracker.ceph.com/issues/57350) | "failed to build on riscv64" (missing `-latomic`) | Open (New), unassigned since 2022 | Build blocker (older Ceph versions) | Sub-word atomics on riscv64 require explicit `libatomic` linkage; affects `libos.a`, `libblk.a`, `librocksdb.a`. Linked fix PR #47883 was auto-closed unreviewed. Debian sid's 18.2.8 build works around this by passing `-latomic` explicitly in packaging |
| [tracker #77904](https://tracker.ceph.com/issues/77904) | RISC-V Zbc CRC32C clobbers `gp`/`tp`, crashing Crimson unittests with SIGSEGV in TLS | **Resolved** | Major (correctness) | Fixed by PR #69908, merge commit `9cb50428b303efea4b166781ec39169a648236fe`, first in `v21.3.0-684-g9cb50428b3`; filed 2026-07-02, resolved 2026-07-03 (within 24 hours) |
| PR #70211 review thread | Zvbc CRC32C optimization reuses `gp`/`tp` as scratch (same class as #77904) | Open, unresolved as of 2026-09-15 | Correctness (would-be regression) | Blocks merge of the ~33%-throughput-gain PR; also flagged for indentation/style and dead register assignments |
| [tracker #80688](https://tracker.ceph.com/issues/80688) | Lance SIMD build failure (nominally scoped to ppc64le) | Fix Under Review (open) | Build blocker | Linked PR #71935 explicitly treats riscv64 as one of three affected architectures, though the tracker ticket text itself only names ppc64le |
| [tracker #77501](https://tracker.ceph.com/issues/77501) | Use-after-free race in `librbd/cache/pwl` timer shutdown, discovered on riscv64 (sg2044) | Resolved | Major, non-arch-specific race | Riscv64 hardware timing surfaced a general race condition more reliably than other architectures - relevant to future riscv64 test-flakiness triage |
| [intel/isa-l#428](https://github.com/intel/isa-l/issues/428) | Using `gp`/`tp` in riscv64 CRC path "may cause problems" | Open, filed 2026-07-02 | Correctness (upstream) | Same bug class as #77904, unresolved in upstream ISA-L (as distinct from Ceph's own bundled fix); relevant to whoever owns the ISA-L relationship |
| [intel/isa-l#239](https://github.com/intel/isa-l/issues/239) | "RISCV CPU supported?" (general tracking) | Open since 2023 | Informational | Long-running support tracking issue |
| PR #69621 | ASan allocator/Seastar init-race fixes; `setarch -R` fix for riscv64 | Open | Test-infrastructure | Without ASan the slowest test takes ~2000s on riscv64 hardware; with ASan it times out at 6000s and OOMs |
| PR #69622 | `BOOST_USE_UCONTEXT` tree-wide under ASan, riscv64 explicitly excluded | Open | Test-infrastructure | riscv64's ASan runtime mis-handles `makecontext`/`swapcontext`, producing unsuppressable false-positive heap-buffer-overflow reports on fiber switch |
| PR #65976 | Update Arrow submodule for riscv detect | Closed (auto-closed, stale) | Ecosystem | 90 days with zero code review; no champion |
| PR #65142 | Upgrade PyPI dependencies to enable riscv64 dashboard install | Closed (auto-closed, stale) | Ecosystem | Documents missing riscv64 packages for `golang-github-prometheus`, `libpmem-devel`, `libpmemobj-devel` |
| PR #69367 / #69376 | reef backport of `WITH_SYSTEM_SPDK` (two near-duplicate attempts) | Closed, rejected | Build (stable branch) | Both omitted the surrounding CMake infrastructure from PR #69185, so neither could build on riscv64; batrick closed #69376 on sunyuechi's technical objection |
| PR #69448 | Switch PMDK to daos-stack fork for riscv64 | Closed, unmerged | Build | Superseded by outright removal of the BlueStore PMEM backend (PR #69726) |

No "nan"/floating-point-specific RISC-V issue exists in ceph/ceph: both issue and PR searches scoped to `owner:ceph repo:ceph` for "riscv nan floating" returned zero results.

## 11. Objections and Upstream Blockers

**Objection 1: "riscv64-only code has no CI safety net, and this has bitten Ceph twice in the same file."**
Confirmed. The ZBC/ZVBC bit-offset bug was live for roughly six months (PR #66026 to #68047), and the `gp`/`tp` register-clobbering bug (PR #69908, fixed within 24 hours of being reported but only after landing on `main`) recurred in the same assembly file. The currently open PR #70211 hits the identical `gp`/`tp` mistake a third time, still under review as of 2026-09-15. Section 7 confirms zero upstream GitHub Actions or Jenkins/Sepia riscv64 coverage exists to catch this class of regression pre-merge.

**Objection 2: "SPDK NVMe-oF on riscv64 required real infrastructure work, and a shortcut was rejected."**
Confirmed, but resolved at the infrastructure level. PR #69185 (merged) is the durable fix (`WITH_SYSTEM_SPDK` plus `Findspdk.cmake`), tested on openRuyi riscv64. Naive stable-branch backports that tried to skip this plumbing (#69367, #69376) were both closed as non-viable. SPDK remains off by default and is not a blocker for standard deployments.

**Objection 3: "A brand-new RGW feature broke the default riscv64 build without anyone intending to."**
Confirmed and live as of 2026-09-30. `WITH_RADOSGW_LANCEDB` defaults ON on `main` and fails to compile on riscv64 because `lance-linalg`'s SIMD kernels don't target it. The fix (PR #71935) is approved (tchaikov lgtm) but not yet merged; this is the most build-critical open item in the port.

**Objection 4: "LZ4/zstd compression performance is suboptimal on riscv64."**
Confirmed. Neither library's RVV/vectorized fast paths are merged upstream for riscv64 (Section 6, Section 9). This does not block deployment but affects compression-bound workload performance.

**Objection 5: "No stable distribution shipped riscv64 Ceph packages."**
No longer accurate as a blanket statement. Ubuntu 26.04 (Resolute) now builds and publishes `ceph` and most subpackages for riscv64 in its main archive at 20.2.0-0ubuntu2 (Section 8), a materially stronger signal than the previously ports-only/unofficial status on Ubuntu 24.04 and Debian sid. Whether Ubuntu's packaging carries riscv64-specific patches versus building unmodified upstream source was not verified, which is why this does not by itself move the readiness color (Section 12).

**Objection 6: "The only published benchmark is a microbenchmark on an embedded SBC."**
Largely still accurate. The `mem_is_zero` RVV speedup from PR #65354 (BPI-F3/SpacemiT K1) remains the only published quantitative Ceph riscv64 data with actual numbers; the CRC32C Zvbc figures in PR #70211 (SpacemiT K3, ~33% gain) exist but come from an unmerged, still-blocked PR. No IOPS/throughput/latency benchmark comparing riscv64 to x86/aarch64 Ceph deployments has been published by any method searched (GitHub code/repo search, WebSearch where budget allowed, RISE blog).

**Objection 7: "Ceph's ASan test tooling is broken on riscv64."**
Partially accurate. PRs #69621/#69622 document allocator conflicts and an unsuppressable Boost.Context/ASan false-positive specific to riscv64's ucontext fiber-switch handling. Production (non-ASan) binaries are unaffected, but new riscv64-targeting contributions cannot currently be validated with the same sanitizer tooling used on other architectures.

**Organizational blocker: no RISE Project involvement.** Multiple independent checks (RISE blog, 35 posts through 2026-09-28; RISE Python wheel_builder, 86 packages; RISE member roster; GitHub search of `riseproject-dev`) found zero Ceph-specific funded work, RFP, or runner usage. The port is driven entirely by ISCAS and ZTE under their own mandates, which are independently RISE General Members but do not tie that membership to documented Ceph funding.

## 12. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- Ceph is a distributed storage system, not an optimization-purpose project - its core value (object/block/file storage) does not depend on RISC-V-specific SIMD/CRC acceleration, so no optimization-level rating applies.

**Justification:** No upstream riscv64 CI exists: all 12 GitHub Actions workflows in ceph/ceph run only on `ubuntu-latest` with zero riscv references, and no `.gitlab-ci.yml`/`Jenkinsfile`/`.cirrus` config or `qa/archs/riscv64.yaml` exists, confirmed by direct audit of the repository tree ([ceph/ceph/.github/workflows](https://github.com/ceph/ceph/tree/main/.github/workflows)). Applying the distribution floor: Ubuntu 26.04 (Resolute) main archive now builds `ceph` and its subpackages for riscv64 at 20.2.0-0ubuntu2 ([packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Ceph&suite=resolute&searchon=names&section=all)), but whether Ubuntu's packaging carries riscv64-specific patches versus building unmodified upstream source was not verified in this research pass. Per the grading rule that an unknown patch status upgrades the color to orange, this lands at orange/downstream-only rather than yellow.

**Pending work that could change the grade:**
- Open PR [ceph/ceph#70211](https://github.com/ceph/ceph/pull/70211) (Zvbc CRC32C optimization, ~33% claimed throughput gain), blocked on ABI review feedback for reusing `gp`/`tp` scratch registers.
- Open, approved PR [#71935](https://github.com/ceph/ceph/pull/71935) (defaults `WITH_RADOSGW_LANCEDB` off on riscv64/ppc64le/s390x), lgtm from tchaikov as of 2026-09-28, not yet merged - this is a live build blocker until merged.
- Open PR [#70618](https://github.com/ceph/ceph/pull/70618) (drop the PMEM backend from RBD's write-log cache) would fully retire the riscv64 PMDK gap once merged.
- A dedicated but non-upstream riscv64 CI now exists at [openRuyi-Project/ceph-ci](https://github.com/openRuyi-Project/ceph-ci) (ISCAS-driven, single-vendor, not wired into ceph/ceph's own GitHub Actions/Jenkins/Sepia infrastructure) - closes part of the CI gap in practice but does not change the upstream-CI-based color.
- No RISE Project funding or involvement with Ceph was found (RISE blog, wheel_builder, and RISE membership roster all checked); ISCAS and ZTE are independently RISE General Members but drive Ceph riscv64 work under their own mandates, not a documented RISE RFP.
- [Tracker #57350](https://tracker.ceph.com/issues/57350) (missing `-latomic` on riscv64) remains open/unassigned since 2022.

## 13. Investment Analysis

Before sizing new work: RISE has not funded or otherwise engaged with Ceph (Section 11), so none of the items below are already covered by RISE-funded effort. The SPDK infrastructure fix (`WITH_SYSTEM_SPDK`, PR #69185) and the PMEM/PMDK retirement (PR #69726, in progress via #70618) are already merged or in flight through ISCAS/ZTE community effort and should not be re-sized.

### 13.1 Functional Enablement

The core storage path (RADOS, RBD, CephFS) is functionally usable on riscv64. The single live functional blocker is PR #71935 (LanceDB default-off fix), approved but unmerged - getting it merged is near-zero-cost review time, not new engineering. Remaining functional gaps are peripheral: SPDK NVMe-oF (workable via system SPDK, no default support), Arrow Flight for RadosGW (stale submodule PR, no champion), and the PMDK/PMEM write-log cache (retirement in progress).

### 13.2 Performance Optimization

The only published end-to-end quantitative data remains the `mem_is_zero` RVV microbenchmark (3.5x on a SpacemiT K1, Section 4.3). The CRC32C Zvbc optimization (~33% claimed gain, PR #70211) is unmerged and unbenchmarked outside the PR author's own numbers. No IOPS/throughput/latency benchmark exists for riscv64 Ceph on any hardware. LZ4 and zstd remain unoptimized for RVV upstream. Investment in benchmarking on server-grade riscv64 hardware would establish the performance baseline needed for a data-driven deployment decision, and would materially strengthen (or weaken) the case for further CRC32C/erasure-coding optimization investment.

### 13.3 CI/CD Infrastructure

This is the highest-leverage investment. Zero upstream riscv64 CI means every riscv64-only regression is silent until manually caught on hardware - already demonstrated twice in the same assembly file. The openRuyi-Project/ceph-ci pipeline is a usable template but is not upstream; the highest-value action is getting an equivalent job wired into ceph/ceph's own Jenkins/Sepia infrastructure (GitHub Actions is not the right integration point, since none of Ceph's 12 workflows do builds on any architecture) and adding `qa/archs/riscv64.yaml`.

### 13.4 Ecosystem Enablement

Not scored as a standalone investment area: Ceph does not have a significant dependent package ecosystem in the sense of npm/PyPI/Kubernetes-operator-style downstream packages that separately require riscv64 enablement (Section 9's client bindings, e.g. `python3-cephfs`, ride along with the main Ceph build and already build for riscv64 in Ubuntu 26.04). The two relevant stalled contributor efforts are the Arrow submodule update (PR #65976) and PyPI dependency upgrades for the dashboard (PR #65142), both auto-closed for lack of maintainer attention rather than technical unsolvability.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Wire a riscv64 build/test job into Ceph's own Jenkins/Sepia infrastructure (physical or QEMU runner), informed by the existing openRuyi-Project/ceph-ci pipeline; add `riscv64.yaml` to `qa/archs/` | 4-6 | Infrastructure + Ceph community | Critical |
| Functional | Review and merge open PR #71935 (LanceDB default-off) | <1 (reviewer/CI time) | Ceph RGW team | Critical (live build blocker) |
| Functional | Review and merge open PR #70211 (Zvbc CRC32C) after fixing the `gp`/`tp` ABI violation | 1-2 | sunyuechi/leiwen2025 + reviewer | High |
| Functional | Merge open PR #70618 (drop RBD write-log PMEM backend), retiring the PMDK gap entirely | <1 (reviewer time) | RBD maintainer | Medium |
| Functional | Merge open PRs #69621/#69622 (ASan allocator/Seastar and Boost ucontext fixes) | 1 (reviewer time) | RBD maintainer + cbodley | High (unblocks sanitizer test coverage) |
| Functional | Fix tracker #57350 (`-latomic` linkage); replace stale, auto-closed PR #47883 | 1 | Ceph build team | Medium |
| Functional | Revive PR #65976 (Arrow submodule riscv detect) and PR #65142 (PyPI wheel upgrades) | 2-3 | Arrow + Ceph dashboard team | Medium |
| Performance | Publish end-to-end storage benchmarks (IOPS/throughput/latency) on server-grade riscv64 hardware | 3-4 | Performance team with hardware access | High |
| Performance | Complete RVV vectorization of ISA-L's DEFLATE/Huffman path (currently Adler-32 only) | 3-5 | ISCAS/upstream ISA-L | Medium |
| Performance | Upstream LZ4 RVV optimization ([lz4#1635](https://github.com/lz4/lz4/issues/1635)) and zstd Huffman fast-loop enablement ([zstd#4622](https://github.com/facebook/zstd/issues/4622)) | 4-6 combined | LZ4/zstd upstream + Ceph | Medium |
| Organizational | Fix the shared `gp`/`tp` ABI-register defect once at the review-guidance level (document it, add a lint/CI check) rather than relying on manual reviewer memory across recurring PRs | 1 | sunyuechi + Ceph build team | Medium |
| Organizational | Formal Ceph Foundation / RISE engagement to signal investment and potentially fund the CI item above | 0 (executive) | Business development | Low |

## 14. References

- [ceph/ceph GitHub repository](https://github.com/ceph/ceph)
- [ceph/ceph GitHub Actions workflows](https://github.com/ceph/ceph/tree/main/.github/workflows)
- [Ceph homepage](https://ceph.io/)
- [Ceph Foundation](https://ceph.io/en/foundation/)
- [tracker.ceph.com #57350 - failed to build on riscv64](https://tracker.ceph.com/issues/57350)
- [tracker.ceph.com #77904 - RISC-V Zbc CRC32C clobbers gp/tp](https://tracker.ceph.com/issues/77904)
- [tracker.ceph.com #77501 - librbd pwl use-after-free, discovered on riscv64](https://tracker.ceph.com/issues/77501)
- [tracker.ceph.com #80688 - disable LanceDB builds for unsupported architectures](https://tracker.ceph.com/issues/80688)
- [tracker.ceph.com #64375 - GCC 13 floor for Crimson coroutines](https://tracker.ceph.com/issues/64375)
- [PR #47883 - cmake: fix CheckCxxAtomic.cmake (closed unmerged)](https://github.com/ceph/ceph/pull/47883)
- [PR #51732 - ceph.spec.in: enable build on riscv64 for openSUSE Factory](https://github.com/ceph/ceph/pull/51732)
- [PR #65120 - common/Cycles: add rdtime for riscv64](https://github.com/ceph/ceph/pull/65120)
- [PR #65142 - Upgrade PyPI dependencies to enable installation on riscv64 (closed stale)](https://github.com/ceph/ceph/pull/65142)
- [PR #65354 - inline_memory: optimize mem_is_zero for riscv using RVV intrinsics](https://github.com/ceph/ceph/pull/65354)
- [PR #65976 - Update arrow submodule to support riscv detect (closed stale)](https://github.com/ceph/ceph/pull/65976)
- [PR #66026 - src/common: add crc32c support for riscv64](https://github.com/ceph/ceph/pull/66026)
- [PR #68047 - src/arch: fix hwprobe include path and ZBC/ZVBC offsets for riscv64](https://github.com/ceph/ceph/pull/68047)
- [PR #68098 - isa-l: enable on RISC-V](https://github.com/ceph/ceph/pull/68098)
- [PR #68154 - src/common: optimize crc32c using zbc extension for riscv64](https://github.com/ceph/ceph/pull/68154)
- [PR #68184 - test: add RISC-V architecture probe tests (open)](https://github.com/ceph/ceph/pull/68184)
- [PR #68209 - test/common: add RISC-V CRC32C performance benchmark](https://github.com/ceph/ceph/pull/68209)
- [PR #69185 - cmake,blk/spdk: support WITH_SYSTEM_SPDK](https://github.com/ceph/ceph/pull/69185)
- [PR #69367 - reef backport: add riscv64 support to WITH_SPDK (closed unmerged)](https://github.com/ceph/ceph/pull/69367)
- [PR #69376 - reef backport: add riscv64 support to WITH_SPDK (closed, rejected)](https://github.com/ceph/ceph/pull/69376)
- [PR #69448 - cmake: build pmdk from the maintained daos-stack fork (closed unmerged)](https://github.com/ceph/ceph/pull/69448)
- [PR #69611 - cmake/boost: fix context Jamfile ordering](https://github.com/ceph/ceph/pull/69611)
- [PR #69621 - build,test: fix issues surfaced by tests after enabling ASan](https://github.com/ceph/ceph/pull/69621)
- [PR #69622 - cmake: define BOOST_USE_UCONTEXT tree-wide under ASan](https://github.com/ceph/ceph/pull/69622)
- [PR #69726 - blk,build: drop BlueStore PMEM support](https://github.com/ceph/ceph/pull/69726)
- [PR #69783 - ceph.spec.in: add support for openRuyi](https://github.com/ceph/ceph/pull/69783)
- [PR #69843 - Add Debian support for containers](https://github.com/ceph/ceph/pull/69843)
- [PR #69908 - common/crc32c: stop using gp/tp as scratch in RISC-V Zbc CRC32C](https://github.com/ceph/ceph/pull/69908)
- [PR #70141 - build: add openRuyi as a containerized build target](https://github.com/ceph/ceph/pull/70141)
- [PR #70211 - src/common: optimize Zvbc CRC32C for riscv64 (open)](https://github.com/ceph/ceph/pull/70211)
- [PR #70618 - librbd,build: drop the PMEM backend of the write log cache (open)](https://github.com/ceph/ceph/pull/70618)
- [PR #71935 - build: default WITH_RADOSGW_LANCEDB off where lance cannot build (open)](https://github.com/ceph/ceph/pull/71935)
- [openRuyi-Project/ceph-ci](https://github.com/openRuyi-Project/ceph-ci)
- [intel/isa-l #428 - gp/tp scratch-register bug in riscv64 CRC path](https://github.com/intel/isa-l/issues/428)
- [intel/isa-l #239 - RISCV CPU supported?](https://github.com/intel/isa-l/issues/239)
- [Debian buildd riscv64 Ceph status](https://buildd.debian.org/status/package.php?p=ceph&suite=sid)
- [Ubuntu packages search, Ceph, Resolute suite](https://packages.ubuntu.com/search?keywords=Ceph&suite=resolute&searchon=names&section=all)
- [RISE Project](https://riseproject.dev/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [boostorg/context issue #306 - Boost context support for riscv64](https://github.com/boostorg/context/issues/306)
- [SPDK issue #3475 - NVMe controller init timeout on riscv64](https://github.com/spdk/spdk/issues/3475)
- [lz4 RVV optimization issue #1635](https://github.com/lz4/lz4/issues/1635)
- [zstd Huffman fast loop disabled for riscv64 - issue #4622](https://github.com/facebook/zstd/issues/4622)
- [zstd unaligned access issue #4546](https://github.com/facebook/zstd/issues/4546)
- [zstd RVV XXH3 support issue #4471](https://github.com/facebook/zstd/issues/4471)
- [OpenSSL AES non-constant-time without Zkn - issue #20980](https://github.com/openssl/openssl/issues/20980)
- [snappy performance issue on RISC-V - issue #209](https://github.com/google/snappy/issues/209)