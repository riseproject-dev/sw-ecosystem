---
title: FD.io
parent: Project Reports
color: orange
dependencies:
  - name: DPDK
    relation: build-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: rdma-core
    relation: build-dependency
    criticality: optional
---

# FD.io

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for FD.io<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="fd-io" %}

## 1. Project Overview

FD.io's flagship project is **VPP** (Vector Packet Processing), a userspace, DPDK-based software dataplane / packet-processing engine used to build high-performance routers, switches, and network functions. FD.io operates as "a series of LF Projects, LLC" under **Linux Foundation Networking (LFN)**, and is one of LFN's six founding projects (alongside OpenDaylight, ONAP, OPNFV, PDNA, and SNAS). The code is licensed under the **Apache License 2.0**.

Governance runs through a **Technical Steering Committee (TSC)** that meets weekly (Thursdays, 30 minutes) and holds "all technical oversight of the FD.io open source project," per [fd.io's TSC page](https://fd.io/community/tsc/). Current TSC members include Dave Wallace (Chair), Ed Warnicke (Cisco), Joel Halpern (HPE), Maciek Konstantynowicz (Cisco), Matthew Smith (Netgate), Jeff Shaw (Intel), and Dhruv Tripathi (Arm). No published, formal TSC procedure for evaluating or accepting new CPU architectures was found; architecture support is handled through normal Gerrit patch review rather than a documented policy.

**Corporate sponsorship is Cisco-dominated.** Reading `MAINTAINERS` (58 entries) and the top individual contributors by commit volume over the last 500 commits: Florin Coras (Cisco, 117), Matus Fabian (Cisco, 85), Dave Wallace (35), Samuel Benko (Cisco, 29), Damjan Marion (Cisco, 27, chief VPP architect), Jerome Tollet (Cisco, 24), Klement Sekera (Netgate, 23), Aritra Basu (Cisco, 18). Other active organizations in governance/maintenance are Netgate, Intel, Marvell, Arm, and HPE. FD.io itself has no distinct membership tiers; it inherits LF Networking's Platinum/Gold/Silver structure.

**Community culture toward new ports is pragmatic and welcoming but resource-constrained, not gatekept.** Damjan Marion (chief architect) described the original blocker to RISC-V enablement as hardware availability, not policy resistance: "I was not able to find any suitable dev board" ([vpp-dev "About Risc-V Porting" thread](https://lists.fd.io/g/vpp-dev/topic/about_risc_v_porting/86312689), corroborated at [mail-archive.com](https://www.mail-archive.com/vpp-dev@lists.fd.io/msg17020.html)). Once patches materialize they are merged via normal Gerrit review with no evidence of TSC-level architecture-approval gating.

**Important process note affecting this whole report:** FD.io/VPP's real code review happens on **Gerrit** (gerrit.fd.io), not GitHub. GitHub (`github.com/FDio/vpp`) is a read-only mirror of merged commits only, so GitHub Issues/PR searches structurally return zero or noisy results for this project regardless of actual activity level.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021 (unspecified, "a year ago" per 2021 post) | Damjan Marion first investigates RISC-V but cannot find a suitable dev board | [vpp-dev "About Risc-V Porting"](https://lists.fd.io/g/vpp-dev/topic/about_risc_v_porting/86312689) |
| 2021-10-31 | Gerrit 34298, "vppinfra: initial RISC-V support," posted by Damjan Marion (Cisco) | [gerrit.fd.io/r/c/vpp/+/34298](https://gerrit.fd.io/r/c/vpp/+/34298) |
| 2021-11-02 | Gerrit 34298 and Gerrit 34314 ("interface: avoid dependency on crc32 for eth handoff," Florin Coras, Cisco) both submitted/merged | [gerrit.fd.io/r/c/vpp/+/34298](https://gerrit.fd.io/r/c/vpp/+/34298), [gerrit.fd.io/r/c/vpp/+/34314](https://gerrit.fd.io/r/c/vpp/+/34314) |
| 2022-01-19 to 2022-01-24 | Gerrit 34972, "vppinfra: fix compilation on riscv" (Damjan Marion), created/submitted; missed v22.02 by 5 days (RC1 branch cut 2022-01-19) | [gerrit.fd.io/r/c/vpp/+/34972](https://gerrit.fd.io/r/c/vpp/+/34972) |
| 2022-02-23 | v22.02 released, first release carrying Gerrit 34298/34314 ("Initial RISC-V support" noted in [v22.02 release notes](https://github.com/FDio/vpp/blob/master/docs/aboutvpp/releasenotes/v22.02.rst)) | `docs/aboutvpp/releasenotes/v22.02.rst` |
| 2022-06-29 | v22.06 released, first release carrying Gerrit 34972 | Verified via commit-to-tag mapping in mirrored GitHub history |
| ~June 2022 | vpp-dev thread "VPP RISC-V - DPDK 21.11 LTS Support" discusses DPDK's own RISC-V patchset as a prerequisite for VPP's DPDK plugin on RISC-V | [vpp-dev topic](https://lists.fd.io/g/vpp-dev/topic/vpp_risc_v_dpdk_21_11_lts/89496496) |
| ~July 2024 | vpp-dev thread "riscv vpp" (a later status inquiry); full content not retrievable (bot-verification gate) | [vpp-dev topic](https://lists.fd.io/g/vpp-dev/topic/riscv_vpp/103930691) |
| 2025-07-01 to 2025-08-06 | Gerrit 43377, "vppinfra: fix cpu time on riscv" (Shubing Guo, ZTE), created/submitted; fixes RDCYCLE-to-RDTIME regression from Linux 6.6 privileging RDCYCLE; missed v25.06 (released 2025-06-11) | [gerrit.fd.io/r/c/vpp/+/43377](https://gerrit.fd.io/r/c/vpp/+/43377) |
| 2025-10-27 | v25.10 released, first release carrying Gerrit 43377 | Verified via commit-to-tag mapping |

**Key contributors and orgs:** Damjan Marion (Cisco, chief VPP architect) and Florin Coras (Cisco) authored the foundational 2021-2022 enablement; Shubing Guo (ZTE) contributed the sole independent, non-Cisco fix in 2025. This is a two-organization, four-change history spanning nearly four years.

**Is it fully upstream?** Yes, in the narrow sense that all 4 changes are merged to master with no open or abandoned RISC-V changes pending in Gerrit. It is **not** a complete port: RISC-V is not listed among VPP's officially supported architectures ([25.06 supported-platforms doc](https://s3-docs.fd.io/vpp/25.06/aboutvpp/supported.html) lists only x86-64 and AArch64), there is no dedicated `riscv.cmake` platform file (unlike Arm/Intel variants such as `neoverse-n1/n2/v2.cmake`, `octeon9/10.cmake`, `icelake-server.cmake`), and support is confined to the low-level `vppinfra` portability layer.

## 3. Upstream Support Tier

No formal, published FD.io/VPP policy defines architecture support tiers (no `PLATFORMS.md` or `SUPPORT.md` exists in the repository). In practice, architecture support is evidenced by: (1) presence/absence of a CMake multiarch platform file, (2) presence/absence of a dedicated CI verify workflow, and (3) mention in the official supported-platforms doc.

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in official supported-platforms doc ([25.06](https://s3-docs.fd.io/vpp/25.06/aboutvpp/supported.html)) | Yes | Yes | No |
| Dedicated CMake CPU-tuning branch (`src/cmake/cpu.cmake`) | Yes, 3 tuned multiarch variants (x86_64_v3, x86_64_v4, scalar) | Yes, 7 tuned multiarch variants (qdf24xx, octeontx2, thunderx2t99, cortexa72, neoversen1/n2/v2) | None, no branch exists in the if/elseif chain |
| Dedicated GitHub Actions verify workflow | Covered by default matrices in nearly all 19 workflows | `vpp-verify-arm-drivers.yml` | None |
| Release-blocking CI gate | Yes (Gerrit + GitHub Actions relay) | Yes (aarch64 included in `vpp-merge-maketest.yml`/`vpp-verify-maketest.yml`) | No, zero references in any of the 19 workflow files |
| Official upstream binary/release artifact | Distributed via FD.io's own `packages.fd.io`/packagecloud APT repo (not directly checked in this research) | Same channel | None found in any channel checked (GitHub Releases: zero for the whole repo; PyPI, Ubuntu 26.04, Arch RISC-V: none) |

RISC-V has no formal tier; it is best described as "compiles via a manual cross-compile flag, unverified by any automation."

## 4. Technical Architecture and RISC-V-Specific Subsystems

Full-repository search (`grep -rl` for `__riscv`, plus GitHub code search for `riscv`, `rvv`, `vfloat32m1_t`, `riscv64`) confirms exactly 5 files touch RISC-V in the entire codebase: `src/vppinfra/types.h`, `src/vppinfra/time.h`, `src/vppinfra/longjmp.h`, `src/vppinfra/longjmp.S`, and the top-level `configure` script.

| Component | riscv64 implementation exists? | ISA extensions used | Quality |
|---|---|---|---|
| `clib_setjmp`/`clib_longjmp`/`clib_calljmp` (cooperative stack switching, `longjmp.S`) | Yes, ~33 lines, lines 819-851 | Base RV64 integer (`sd`, `ld`, `andi`, `addi`, `jalr`) plus RVF/RVD for `fs0-fs11` double-precision saves | Hand-tuned assembly, complete, register count (26: ra, sp, s0-s11, fs0-fs11) verified consistent with header. No stub markers. |
| Base word/int types (`types.h`) | Yes | `__riscv_xlen == 64` scalar branch | Complete, trivial, same tier as x86_64/aarch64 |
| `clib_cpu_time_now()` (`time.h`) | Yes | `RDTIME` pseudo-instruction (Zicntr-class) | Complete, ~9 lines; Gerrit 43377 (2025) fixed a real regression when `RDCYCLE` became privileged in Linux 6.6, evidence the path is genuinely exercised |
| CPU-tuned multiarch dispatch (`src/cmake/cpu.cmake`) | **No** | N/A | Missing entirely; default riscv64 configure does not resolve `VPP_DEFAULT_MARCH_FLAGS` without a manual `--native-only` override |
| SIMD/vector dataplane paths (`src/vppinfra/vector.h`, checksums, buffer ops, hashing) | **No** | None (no RVV) | No `vector_riscv.h` exists; falls back to generic scalar C |
| memcpy fast path (`memcpy_x86_64.h` equivalent) | **No** | None | Scalar C fallback, no `memcpy_riscv64.h` |
| Native crypto engine acceleration (`src/crypto_engines/native/CMakeLists.txt`) | **No** | None | aarch64-specific branch exists in this file; nothing for riscv64 |
| perfmon plugin (PMU counters, `src/plugins/perfmon/CMakeLists.txt`) | **No** | None | aarch64-specific branch exists; nothing for riscv64 |
| NIC/poll-mode drivers | **No** | N/A | No riscv64-specific driver directory or code found anywhere in `src/` |

**Comparison by architecture-macro file count:** `__x86_64__` appears in 32 files; `__aarch64__` in 22 files; `__riscv` in 3 files plus 1 assembly file and 1 configure-script mention.

**Bottom line:** The riscv64 "port" covers only the bare minimum needed to get `vppinfra` (VPP's low-level C runtime library) to compile and run non-vectorized on riscv64: word types, setjmp/longjmp, and a cycle counter. Everything above that layer, the CPU-tuned multiarch build system, all SIMD/vector fast paths, memcpy optimization, native crypto acceleration, PMU-based perfmon, and NIC drivers, has zero riscv64-specific code.

## 5. Build System, Cross-Compilation, and Toolchain

**Build entry point:** the repo-root `configure` script (bash). There is no `BUILDING.md`, `INSTALL`, or `docs/cross-compilation.md` in the repository.

```bash
./configure --arch riscv64
ninja -C build-root
```

Minimal build variant:
```bash
./configure --arch riscv64 --build-dir build-root/riscv64 --minimal
ninja -C build-root/riscv64
```

Because `arch != host_arch`, `configure` unconditionally hardcodes **Clang** (not GCC) for the cross-compile path:

```
-DCMAKE_SYSTEM_NAME=Linux
-DCMAKE_SYSTEM_PROCESSOR=riscv64
-DCMAKE_C_COMPILER=clang
-DCMAKE_C_COMPILER_TARGET=riscv64-linux-gnu
-DCMAKE_ASM_COMPILER_TARGET=riscv64-linux-gnu
-DCMAKE_FIND_ROOT_PATH=/usr/riscv64-linux-gnu
-DCMAKE_PREFIX_PATH=/opt/vpp/external/riscv64
```

Nothing in the repository provisions the riscv64 sysroot (`/usr/riscv64-linux-gnu`) or the external-dependency prefix (`/opt/vpp/external/riscv64`) automatically; a developer must build these manually.

**Toolchain version requirements (project-wide, not riscv-specific):**
```
MIN_SUPPORTED_CLANG_C_COMPILER_VERSION = 9.0.0
MIN_SUPPORTED_GNU_C_COMPILER_VERSION = 9.0.0
```
Falling below these emits a CMake `WARNING` (not `FATAL_ERROR`): "C compiler version is too old and it's usage may result in sub-optimal binaries or lack of support for specific CPU types." No riscv64-specific compiler-version rationale exists in the codebase. Because `configure` hardcodes Clang for any non-native `--arch`, a riscv64 cross-build via this script in practice requires **Clang >= 9.0.0** targeting `riscv64-linux-gnu`; GCC >= 9.0.0 is only the general native-build minimum and is not exercised for riscv64 cross-compilation by this script.

**QEMU usage:** the only QEMU-driving script in the repo, `test/scripts/run_vpp_in_vm.sh`, is hardcoded to x86_64/KVM (`qemu-system-x86_64`, `-machine pc,accel=kvm`, `-cpu host`) and downloads the host's own kernel via `apt-get download linux-image-$(uname -r)`. It is not parameterized for `qemu-system-riscv64 -machine virt`; adapting it would require a rewrite. No working riscv64 QEMU test harness exists in the repo.

**Dockerfiles:** none reference riscv64 (checked all Dockerfiles under `extras/docker/`, `extras/rpm/`, `extras/libmemif/`, `extras/strongswan/`, `extras/kube-test/`, `test/hs-test/docker/`, `src/plugins/srv6-mobile/extra/`, `docs/usecases/vpp_testbench/`). Existing Dockerfiles are named for Ubuntu/CentOS releases (`Dockerfile.xenial`, `.bionic`, `.centos7`), all native x86_64.

**Known build failures reported on the mailing list (unverified beyond the single thread, [NEEDS VERIFICATION]):** Damjan Marion, compiling on a SiFive HiFive Unmatched board (Freedom U740 SoC, quad-core RV64GC), reported: no RISC-V Vector Extension available on that hardware at the time (vector code paths stubbed out); no ASAN shared libraries for RISC-V with Clang, requiring `test_pnat`, `test_vat`, `test_vat2` build targets to be commented out; and, under QEMU emulation, errors including `numa[0] falling back to non-hugepage backed buffer pool`, `failed to set mempolicy for numa node 1: Function not implemented`, and `svm_queue_init:57: mutex_init: No such file or directory` ([vpp-dev "About Risc-V Porting"](https://lists.fd.io/g/vpp-dev/topic/about_risc_v_porting/86312689), archived at [mail-archive.com](https://www.mail-archive.com/vpp-dev@lists.fd.io/msg17020.html)). A separate thread, "Risc-V Compilation Error" ([lists.fd.io](https://lists.fd.io/g/vpp-dev/topic/risc_v_compilation_error/88531162)), reports further compilation errors on the same board building master, but full content was not retrievable.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Base compile/run (`vppinfra`) | Full | Full | Full (scalar only) |
| CPU-tuned multiarch build variants | 3 variants | 7 variants | None |
| SIMD-accelerated checksums/memcpy/hashing | AVX2/AVX512 | NEON | None (scalar C fallback) |
| Native crypto engine acceleration | Yes | Yes (aarch64 CMake branch) | No |
| PMU-based perfmon plugin | Yes | Yes (aarch64 CMake branch) | No |
| NIC poll-mode drivers | Full DPDK PMD set | Arm-specific driver support (`vpp-verify-arm-drivers.yml`) | None found in VPP itself; upstream DPDK has riscv64 support (see Section 9) but no VPP-side driver integration evidence found |
| Hardware crypto offload (intel-ipsec-mb) | Yes (x86 AVX2/AVX512/SSE via NASM/YASM) | N/A | No, x86-only library, zero riscv64 work upstream |
| IPsec crypto (fallback via openssl/native engines) | Yes | Yes | Available in principle (OpenSSL riscv64 support is green per `project-reports/openssl.md`), but not verified end-to-end for VPP's `tlsopenssl`/crypto-engine integration on riscv64 |
| Officially listed supported architecture | Yes | Yes | No ([25.06 doc](https://s3-docs.fd.io/vpp/25.06/aboutvpp/supported.html)) |

**Functional gaps:** no riscv64 NIC/poll-mode driver integration evidence, no hardware-accelerated IPsec crypto path (intel-ipsec-mb is x86-only), no native crypto or PMU perfmon plugin support.

**Performance gaps:** all packet-processing hot paths (checksums, memcpy, buffer/hashing operations) that are hand-vectorized with AVX2/AVX512 on amd64 and NEON on arm64 fall through to generic scalar C on riscv64. Given VPP's dataplane throughput is fundamentally dependent on these vectorized fast paths, this represents the single largest performance gap.

**Security hardening gaps:** per the single-source mailing-list report cited in Section 5 [NEEDS VERIFICATION], no ASAN-instrumented shared libraries were available for RISC-V/Clang at the time of Damjan Marion's port attempt, forcing certain test targets (`test_pnat`, `test_vat`, `test_vat2`) to be disabled for that build. No corroborating second source was found; this may be stale (2021-era) information.

**NaN / floating-point semantics issues:** none found. GitHub issue search `riscv nan floating repo:FDio/vpp` returned 0 results, and no floating-point correctness bug affecting riscv64 appears in any Gerrit change, mailing-list thread, or source comment reviewed.

## 7. CI/CD Infrastructure

**riscv64 CI does not exist.** Confirmed by direct inspection of all 19 files in `.github/workflows/` (`gerrit-comment-handler.yml`, `gerrit-merge.yml`, `gerrit-verify.yml`, `github2gerrit.yaml`, `periodic-vpp-coverity.yml`, `periodic-vpp-verify-asan-hst.yml`, `periodic-vpp-verify-asan-maketest.yml`, `periodic-vpp-verify-cov.yml`, `periodic-vpp-verify-dpdk-rdma-ver.yml`, `periodic-vpp-verify-hst.yml`, `vpp-csit-verify-api.yml`, `vpp-merge-docs.yml`, `vpp-merge-maketest.yml`, `vpp-verify-arm-drivers.yml`, `vpp-verify-checkstyle.yml`, `vpp-verify-docs.yml`, `vpp-verify-gcc.yml`, `vpp-verify-hst-u2204.yml`, `vpp-verify-hst.yml`, `vpp-verify-maketest.yml`) at `HEAD 724a5af922f86bf0754b786389bff7fa5c0f60bb`. Case-insensitive grep for `riscv|risc-v|risc_v` returns zero matches in every file. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists at the repository root.

These 19 GitHub Actions workflows are themselves mostly Gerrit-integration shims: FD.io VPP's real gating happens on Gerrit (gerrit.fd.io) triggering Jenkins Job Builder jobs, with GitHub Actions relaying Gerrit events. Gerrit's own CI configuration was not accessible through the tools used in this research (would require gerrit.fd.io's own Jenkins/REST API, outside the GitHub MCP toolset), so it is possible (though no evidence was found) that Gerrit-side Jenkins carries a riscv64 job not mirrored into the GitHub Actions files. This is flagged as a research gap, not a confirmed capability.

No reference to RISE RISC-V runners (`riseproject-dev` or similar runner labels) appears anywhere in the 19 workflow files.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated CI workflow | Covered by default matrix in nearly all 19 workflows | `vpp-verify-arm-drivers.yml` | None |
| Runs test suite | Yes | Yes (`periodic-vpp-verify-hst.yml`, `vpp-merge-maketest.yml`, `vpp-verify-maketest.yml` include aarch64) | No |
| Release-blocking gate | Yes | Yes | No |
| RISE runner usage | N/A | N/A | None found |

## 8. Distribution and Release Status

**GitHub Releases:** FDio/vpp has **zero releases of any kind for any architecture**. The public releases page states "There aren't any releases here." There are no riscv64 (or any-architecture) release assets to check.

**PyPI:** not applicable. VPP is a C/DPDK codebase built via Gerrit/autotools/CMake, never distributed as a Python package. (A literal search for a `fd-io` PyPI package returned HTTP 404, confirming no such package exists, but this is a category mismatch, not evidence about VPP itself.)

**Ubuntu 26.04 (resolute):** no `fd.io` or `vpp` package found in the official archive at all, for any architecture. A search for `vpp` returned only one unrelated hit (`golang-github-anacrolix-envpprof-dev`, a Go package matching only by substring). This indicates VPP is not distributed through Ubuntu's official archive; its real distribution channel is FD.io's own `packages.fd.io` / packagecloud.io APT repository, which was **not checked** in this research (recommended next step).

**Arch Linux RISC-V port** (`archriscv.felixc.at`): no `fd.io` or `vpp` package entry found.

**Debian:** not checked in this research (recommended next step, given `packages.fd.io` is VPP's real channel and Debian's `vpp` source package may build independently).

**What a user must do to get a working riscv64 binary today:** build from source via `./configure --arch riscv64` (see Section 5), providing their own riscv64 sysroot and prebuilt external dependencies at `/opt/vpp/external/riscv64`, since no upstream-published binary exists in any channel checked (GitHub Releases, PyPI, Ubuntu 26.04, Arch RISC-V). No CI validates that this build succeeds or that the result passes tests.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| DPDK | Core dataplane I/O engine, poll-mode drivers, SIMD-vectorized packet processing (build-dependency, critical) | Green, native `config/riscv/meson.build` target, `riscv64_linux_gcc`, plus an RVV-enabled cross-file `riscv64_rv64gcv_linux_gcc` and `riscv64_sifive_u740_linux_gcc`; built in CI (`.ci/linux-build.sh`, `devtools/test-meson-builds.sh`) | Not independently confirmed (DPDK's tracker is Bugzilla/patchwork, not GitHub Issues; `search_issues` against DPDK/dpdk returned 0 for "riscv"/"riscv64", consistent with issues living off-GitHub) | Not verified via project-graph (unavailable this session); no report found in `projects.yml` | Strongest riscv64 story of any dependency here; despite this, does not offset VPP's own lack of riscv64 CI/release |
| Linux kernel | Runtime dependency, critical | Green | Green | Green | `RDCYCLE` became privileged as of Linux 6.6, requiring VPP's `clib_cpu_time_now()` to switch to `RDTIME` (fixed by Gerrit 43377). In-kernel BPF JIT (`arch/riscv/net/bpf_jit_comp64.c`, relevant to VPP's `af_xdp`/`linux-cp` plugins) is "mature" (2,159 lines) but has 2 test categories on `DENYLIST.riscv64`: sub-word (1/2-byte) atomics unimplemented and BPF exceptions unsupported (patch pending, not merged as of research date) |
| GCC | Build-dependency, critical | Portable; general project-wide minimum `MIN_SUPPORTED_GNU_C_COMPILER_VERSION = 9.0.0` applies, but **VPP's own `configure` script hardcodes Clang, not GCC, for any riscv64 cross-compile** (see Section 5) | N/A (compiler, not tested itself) | N/A | GCC is listed as a build dependency, but is not actually exercised by VPP's documented riscv64 cross-compile path; a native (non-cross) riscv64 build would use GCC per the general 9.0.0 minimum, untested by any VPP CI |
| rdma-core | `rdma` plugin, kernel-bypass NIC I/O, memory registration (build-dependency, optional) | Portable C, architecture-agnostic; `riscv64` appears only once in the repo (a `debian/changelog` mention) | No riscv-specific issues found | Not verified | Real-world gap is RDMA-capable NIC hardware on riscv64, not the library itself; this only affects the optional `rdma` plugin |
| OpenSSL | Primary crypto engine (`tlsopenssl` plugin) | Green | Mostly green | Green | Per existing `project-reports/openssl.md`: one open correctness issue (Zbb detection broken on musl, #28118) and one CI reliability issue at high parallelism (#22166), neither blocking for VPP since VPP runs on glibc |
| Mbed TLS | Alternate TLS engine (`tlsmbedtls` plugin) | Portable C, no riscv-specific code found (`search_code repo:Mbed-TLS/mbedtls __riscv` returned 0 matches); should build generically but has no RISC-V crypto-extension acceleration | No riscv-specific issues found | Not verified | Under-researched; no existing `project-reports/*.md` |
| intel-ipsec-mb | Hardware-accelerated IPsec crypto (`src/crypto_engines/ipsecmb`) | Red, x86-only, built via NASM/YASM assembly targeting AVX2/AVX512/SSE; zero riscv work upstream | N/A | N/A | Only disables the `ipsecmb` plugin on riscv64; VPP's `openssl` and `native` crypto engines remain as fallback, so this is a feature/performance gap, not a VPP-blocking one |
| libnuma (numactl) | NUMA-aware memory allocation | Green | Mostly green (no upstream riscv64 CI; single-node NUMA in practice, so tests are effectively skipped) | Green (Debian sid/trixie, Ubuntu 24.04) | Per existing `project-reports/libnuma.md`: missing `clearcache` and `set_mempolicy_home_node` ifdefs on riscv64 (compile warnings only, not build failures) |
| libbpf | eBPF loading for `af_xdp`/`linux-cp` plugins | Green (library) | Green library-side | Green (Debian sid, Ubuntu 24.04: `libbpf1`, `libbpf-dev`; `libbpf-tools` reported absent on riscv64, unverified) | Per existing `project-reports/libbpf.md`; kernel-side JIT gaps noted above under Linux kernel |
| quicly / picotls | `quic_quicly`/`tlspicotls` plugins (QUIC transport + TLS) | No riscv-specific code or issues found in `h2o/picotls`; portable C, x86 AES-NI "fusion" backend is optional | None found | Not verified; no existing report | Under-researched; no confirmed problems but no positive confirmation either |

**Tooling caveat applying to every row above:** the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) for this research session, so no dependency in this table has a confirmed Ubuntu 26.04 (resolute) project-graph lookup. This should be retried once the server is reachable.

## 11. Known Bugs and Active Issues

**No open GitHub Issues exist for RISC-V/riscv64 in FDio/vpp.** Direct lexical query `riscv repo:FDio/vpp` on `search_pull_requests` returns `{"total_count":0}`. Semantic `search_issues` for "riscv64"/"risc-v" returns only false-positive ARM64 issues (`#2599`/`#2499`, `#2600`/`#2500`, `#2660`/`#2560`, legacy JIRA-mirror issues from 2017-2018 about ARM ISB/YIELD, ARM64 REV, and `CLIB_HAVE_VEC128` for aarch64), none of which mention RISC-V anywhere in body or comments.

The actual record of RISC-V-related problems lives in the mailing list, not a tracked issue system:

| ID/thread | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A (mailing list) | ASAN shared libraries unavailable for RISC-V/Clang | Reported, workaround applied (targets disabled), not tracked as an issue | Medium (testing gap) | [NEEDS VERIFICATION], single source: [vpp-dev thread](https://lists.fd.io/g/vpp-dev/topic/about_risc_v_porting/86312689) |
| N/A (mailing list) | NUMA/mempolicy warnings and `mutex_init` failure under QEMU emulation | Reported | Low/Medium (emulation-environment artifact, not confirmed on real hardware) | [NEEDS VERIFICATION], same thread |
| N/A (mailing list) | "Risc-V Compilation Error" thread, compilation errors building master on HiFive Unmatched | Reported | Unknown severity, full content not retrievable | [lists.fd.io](https://lists.fd.io/g/vpp-dev/topic/risc_v_compilation_error/88531162) |
| Gerrit 43377 | `RDCYCLE` became privileged in Linux 6.6, breaking `clib_cpu_time_now()` on riscv64 | Fixed (merged 2025-08-06, released in v25.10) | Correctness bug, confirmed and resolved | [gerrit.fd.io/r/c/vpp/+/43377](https://gerrit.fd.io/r/c/vpp/+/43377) |

**Correctness bugs:** Gerrit 43377 is the one confirmed, resolved correctness bug (a kernel-ABI-driven regression, not a VPP design flaw). No open or unresolved correctness bugs specific to riscv64 were found in any source checked.

## 12. Objections and Upstream Blockers

**No stated technical or organizational objection to riscv64 support was found anywhere in the research** (Gerrit reviews, mailing list, TSC documentation). The original blocker, per Damjan Marion, was **hardware availability**, not policy: "I was not able to find any suitable dev board" ([vpp-dev thread](https://lists.fd.io/g/vpp-dev/topic/about_risc_v_porting/86312689)). A community member separately noted that SiFive HiFive boards available at the time lacked Vector Extension support, constraining what could even be tested.

**No formal TSC architecture-approval gate exists.** Patches merge via ordinary Gerrit code review; none of the 4 riscv64-related Gerrit changes show evidence of elevated scrutiny or rejection.

**Organizational blockers:** RISC-V work has been low-frequency and under-resourced, two contributions (Cisco 2021-2022, ZTE 2025) roughly 3.5 years apart, from only two organizations, with no dedicated `riscv.cmake` platform file, no CI, and no RISE involvement (see Section 13). This reflects an absence of sustained investment rather than active resistance.

**Acceptance probability for further RISC-V work:** high. Given the pattern of merged, uncontested Gerrit changes and an architect who has publicly framed the gap as a resourcing/hardware issue rather than a design objection, additional riscv64 patches (CI workflow, CMake platform file, SIMD backend) would likely be accepted through normal review with no anticipated organizational blocker.

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci) - no upstream riscv64 CI of any kind (build, test, or release-blocking) exists in any of the 19 GitHub Actions workflow files or elsewhere in the repository, and no Linux distribution, third party, or RISE channel ships a riscv64 (or any-architecture) VPP package to apply the distribution floor.
- **Release provider:** none. No upstream release exists for VPP in any architecture (GitHub Releases is empty for the whole repository); no distro, RISE, or third party was found shipping a riscv64 build.
- **Optimization-purpose classification:** VPP is a borderline case. Its name ("Vector Packet Processing") and its value proposition versus kernel-based forwarding rest heavily on vectorized, hand-tuned hot paths, arguably qualifying it for the Step 2 optimization-purpose modifier. However, VPP also delivers a very broad, non-speed-dependent feature set (routing, NAT, ACLs, tunneling, a full control-plane API) that would remain functional, if slower, on scalar C alone, more akin to a general-purpose networking runtime than a narrow SIMD/codec library. Because the primary CI-based grade is already orange (the floor for a "no upstream CI" project, next above red), and an "absent" optimization gap would only cap at orange as well, this classification choice does not change the assigned color. Optimization level is therefore omitted from the header per the project-color-coding skill's guidance that it applies only to clearly optimization-purpose projects.
- **Justification:** Confirmed by direct inspection of all 19 `.github/workflows/*.yml` files at `HEAD 724a5af9`: zero riscv/riscv64 references in any job, matrix entry, runner label, or trigger ([workflow list](https://github.com/FDio/vpp/tree/master/.github/workflows)). Source-level riscv64 enablement is real and merged (4 Gerrit changes, most recently [43377](https://gerrit.fd.io/r/c/vpp/+/43377) in 2025), confirming the code compiles and is exercised by at least one downstream user, but RISC-V is explicitly excluded from VPP's own list of supported architectures ([25.06 supported-platforms doc](https://s3-docs.fd.io/vpp/25.06/aboutvpp/supported.html)), and no upstream, distro, or third-party channel publishes a riscv64 release artifact.
- **Pending work that could change the grade:** none identified. No open Gerrit changes, no open GitHub PRs (0/0 via lexical search), and no RISE involvement (no blog post among 34 checked, no funded RFP among RP001-RP016, no dedicated GitHub repository under `riseproject-dev`) were found. The only unactioned lead is `riseproject-dev/sw-ecosystem`'s own internal `project-reports/.queue.yml`, which lists FD.io as a queued (not yet started) candidate for future RISE attention, not evidence of any active RISE work.

## 14. Investment Analysis

RISE has not funded, blogged about, or otherwise engaged with FD.io/VPP (Section 13), so no prior RISE work needs to be excluded from sizing below; all items are genuinely unstarted.

### 14.1 Functional Enablement

The foundational `vppinfra` enablement (types, setjmp/longjmp, cycle counter) is already merged and does not need to be redone. Remaining functional gaps: a dedicated `riscv64.cmake` CMake platform file (to make `cpu.cmake` resolve `VPP_DEFAULT_MARCH_FLAGS` without a manual `--native-only` override), a riscv64 build/toolchain path that does not hardcode Clang for cross-compile parity with the native-GCC path, and validation of the DPDK plugin, RDMA plugin, and crypto-engine fallback (openssl/native) end-to-end on riscv64 hardware, none of which has been attempted per the mailing-list evidence found.

### 14.2 Performance Optimization

No RVV or riscv64-tuned code exists anywhere in VPP's packet-processing hot paths (checksums, memcpy, hashing, buffer management). Closing this gap would require a `vector_rvv.h` backend analogous to `vector_neon.h`/`vector_avx2.h`, gated behind `__riscv_vector` detection, plus CPU-tuned multiarch variants in `cpu.cmake` comparable to the 3 existing x86_64 variants or 7 aarch64 variants. This is a substantial, greenfield effort with no existing upstream starting point.

### 14.3 CI/CD Infrastructure

No riscv64 CI exists at all (Section 7). Standing this up requires: a riscv64 build job (minimally, cross-compile via the existing `configure --arch riscv64` path) analogous to `vpp-verify-arm-drivers.yml`, and, ideally, a riscv64 test-execution job comparable to the aarch64-inclusive `vpp-merge-maketest.yml`/`vpp-verify-maketest.yml`, requiring either native riscv64 runners (RISE runners are a candidate, though RISE has no current FD.io engagement) or a working QEMU riscv64 harness (the existing `run_vpp_in_vm.sh` is x86_64/KVM-only and would need to be rewritten for `qemu-system-riscv64 -machine virt`).

### 14.4 Ecosystem Enablement

Not applicable in the package-ecosystem sense (Section 10 is omitted; VPP has no dependent npm/PyPI/Maven/Kubernetes-operator package ecosystem). The relevant "ecosystem" work is instead upstream dependency parity: intel-ipsec-mb is confirmed x86-only with no riscv64 path (Section 9), so any hardware-accelerated IPsec plugin work is blocked at the dependency level, not at VPP's own code, until or unless intel-ipsec-mb (or a substitute crypto-acceleration library) adds riscv64 support.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `src/cmake/platform/riscv64.cmake` and a `cpu.cmake` riscv64 branch so default builds resolve without `--native-only` | 1-2 | FD.io / build-system maintainer | High |
| Functional | Align riscv64 cross-compile toolchain path (currently Clang-only via `configure`) with GCC, or document/justify the Clang requirement | 1 | FD.io / build-system maintainer | Medium |
| Functional | Validate DPDK plugin, RDMA plugin, and crypto-engine fallback (openssl/native) end-to-end on real riscv64 hardware | 2-4 | FD.io contributor with riscv64 hardware access | High |
| Performance | Implement `vector_rvv.h` SIMD backend for checksums/memcpy/hashing hot paths, gated on `__riscv_vector` | 6-10 | FD.io / experienced VPP internals contributor | Medium |
| Performance | Add riscv64-tuned multiarch variants to `cpu.cmake` (analogous to existing x86_64/aarch64 variants) | 2-3 | FD.io / build-system maintainer | Low (depends on above) |
| CI/CD | Add a riscv64 build-only verify workflow (cross-compile via `configure --arch riscv64`) analogous to `vpp-verify-arm-drivers.yml` | 1-2 | FD.io CI maintainer | High |
| CI/CD | Stand up riscv64 test execution (native runner or QEMU-`virt` harness; rewrite `run_vpp_in_vm.sh`) | 3-5 | FD.io CI maintainer, possibly with RISE runner support | Medium |
| Dependency | Engage intel-ipsec-mb (or an alternative) for riscv64 crypto acceleration, or formally document the openssl/native fallback as the supported riscv64 crypto path | 1 (documentation) to open-ended (upstream dependency work) | FD.io / crypto-engine maintainer | Low |

## 15. Updates

(No updates yet, initial report dated 2026-06-17.)

## 16. References

- [FD.io homepage](https://fd.io/)
- [FD.io Technical Steering Committee](https://fd.io/community/tsc/)
- [FDio/vpp GitHub repository](https://github.com/FDio/vpp)
- [FDio/vpp MAINTAINERS](https://github.com/FDio/vpp/blob/master/MAINTAINERS)
- [FDio/vpp GitHub Releases (empty)](https://github.com/FDio/vpp/releases)
- [FDio/vpp GitHub Actions workflows](https://github.com/FDio/vpp/tree/master/.github/workflows)
- [VPP 25.06 supported platforms documentation](https://s3-docs.fd.io/vpp/25.06/aboutvpp/supported.html)
- [VPP v22.02 release notes](https://github.com/FDio/vpp/blob/master/docs/aboutvpp/releasenotes/v22.02.rst)
- [Gerrit 34298, "vppinfra: initial RISC-V support"](https://gerrit.fd.io/r/c/vpp/+/34298)
- [Gerrit 34314, "interface: avoid dependency on crc32 for eth handoff"](https://gerrit.fd.io/r/c/vpp/+/34314)
- [Gerrit 34972, "vppinfra: fix compilation on riscv"](https://gerrit.fd.io/r/c/vpp/+/34972)
- [Gerrit 43377, "vppinfra: fix cpu time on riscv"](https://gerrit.fd.io/r/c/vpp/+/43377)
- [vpp-dev mailing list: "About Risc-V Porting"](https://lists.fd.io/g/vpp-dev/topic/about_risc_v_porting/86312689)
- [vpp-dev mailing list archive (mail-archive.com), msg17020](https://www.mail-archive.com/vpp-dev@lists.fd.io/msg17020.html)
- [vpp-dev mailing list: "VPP RISC-V - DPDK 21.11 LTS Support"](https://lists.fd.io/g/vpp-dev/topic/vpp_risc_v_dpdk_21_11_lts/89496496)
- [vpp-dev mailing list: "riscv vpp"](https://lists.fd.io/g/vpp-dev/topic/riscv_vpp/103930691)
- [vpp-dev mailing list: "Risc-V Compilation Error"](https://lists.fd.io/g/vpp-dev/topic/risc_v_compilation_error/88531162)
- [DPDK cross-build for RISC-V documentation](https://doc.dpdk.org) (referenced via `doc/guides/linux_gsg/cross_build_dpdk_for_riscv.rst` in the DPDK source tree)
- [Google Cloud, "Forwarding over 100 Mpps with FD.io VPP" (x86 baseline, cited for context only)](https://medium.com/google-cloud/forwarding-over-100-mpps-with-fd-io-vpp-on-x86-62b9447da554)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)
- [PyPI JSON API check for "fd-io" (404, not applicable to VPP)](https://pypi.org/pypi/fd-io/json)
- [Ubuntu packages search, suite=resolute (26.04)](https://packages.ubuntu.com/search?keywords=FD.io&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=fd.io)
- `project-reports/openssl.md` (internal report, referenced for OpenSSL dependency detail)
- `project-reports/libnuma.md` (internal report, referenced for libnuma dependency detail)
- `project-reports/libbpf.md` (internal report, referenced for libbpf dependency detail)