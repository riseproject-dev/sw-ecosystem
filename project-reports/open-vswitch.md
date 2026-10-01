---
title: Open vSwitch
parent: Project Reports
color: orange
dependencies:
  - name: DPDK
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: libbpf
    relation: runtime-dependency
    criticality: optional
  - name: libxdp
    relation: runtime-dependency
    criticality: optional
  - name: libnuma
    relation: runtime-dependency
    criticality: optional
  - name: libunbound
    relation: runtime-dependency
    criticality: optional
  - name: libpcap
    relation: runtime-dependency
    criticality: optional
  - name: libunwind
    relation: runtime-dependency
    criticality: optional
  - name: libcap-ng
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="open-vswitch" %}

# Open vSwitch

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Open vSwitch<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Open vSwitch (OVS) is a production-quality, multilayer virtual switch licensed under Apache License 2.0 (all inbound and outbound contributions require DCO sign-off). It implements OpenFlow, OVSDB, VXLAN, GRE, and LACP, and is the dominant software switching fabric for OpenStack, Kubernetes with OVN, and bare-metal SDN deployments. The primary codebase lives at [github.com/openvswitch/ovs](https://github.com/openvswitch/ovs); the project homepage is [openvswitch.org](https://www.openvswitch.org/).

**Governance:** OVS is formally "The Linux Foundation Open vSwitch Project," chartered effective August 9, 2016 (`Documentation/internals/charter.rst`). It is governed by a Technical Steering Committee (TSC) composed of all active committers, one vote per committer, quorum of two-thirds, decisions by majority with electronic votes resolved within 3 business days; ties can be referred to the Linux Foundation. Committer nomination requires majority approval with no veto from existing committers. Budget, trademarks, and antitrust compliance route through the Linux Foundation (9% G&A fee on the first $1M raised, 6% above that). No formal platform/support-tier document exists in the repository (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/`).

**Active committers (MAINTAINERS.rst):**

| Committer | Affiliation |
|---|---|
| Aaron Conole | Red Hat |
| Eelco Chaudron | Red Hat |
| Kevin Traynor | Red Hat |
| Alin Serdean | ovn.org (historically Red Hat-affiliated per public record) |
| Ian Stokes | ovn.org (historically Red Hat-affiliated per public record) |
| Ilya Maximets | ovn.org (historically Red Hat-affiliated per public record) |
| Simon Horman | ovn.org (historically Red Hat-affiliated per public record) |
| Ansis Atteka | unaffiliated (personal gmail address) |
| William Tu | unaffiliated (personal gmail address) |

Commit-volume analysis of the last 300 commits on `main`, by contributor email domain: redhat.com 157, ovn.org 92, nvidia.com 24, gmail.com 8, canonical.com 8, ubuntu.com 2, and single-digit contributions each from sfcompute.com, nutanix.com, easystack.cn, chinatelecom.cn, jaguarmicro.com and others. Red Hat is the overwhelmingly dominant corporate sponsor of active development (roughly 50-80% of recent commit volume once ovn.org is attributed to the same team), followed distantly by NVIDIA and Canonical.

**Community stance on new ports:** `Documentation/topics/porting.rst` states OVS "is intended to be easily ported to new software and hardware platforms," describes the core as "platform-independent C" (`README.rst`), documents the netdev-provider/ofproto-provider/dpif-provider layering, and invites porters to email `dev@openvswitch.org`. There is no architecture allow-list in `configure.ac`; the build is generic and not gated to specific CPU architectures. In practice, however, no contributor has ever proposed a riscv64-specific change upstream: zero riscv/riscv64-tagged issues, pull requests, or commits exist in `openvswitch/ovs` or the separate `openvswitch/ovs-issues` tracker (confirmed by repeated, independently re-run `search_issues`, `search_pull_requests`, `search_commits`, and `search_code` queries, and by a full-history `git log --all -S` pickaxe search across all 20,930 commits for "riscv", "risc-v", "RISC-V", "__riscv", "rv64", "rv32"). RISE Project membership: none. OVS is not listed as a RISE Premier or General member, no RISE blog post mentions OVS, and the RISE wheel builder has no OVS entry (moot in any case since OVS has no PyPI package).

---

## 2. Port History and Upstreaming Timeline

There is no upstream RISC-V port. Every entry below originates from Debian/Ubuntu packaging, not from the upstream `openvswitch/ovs` repository.

| Date | Event | Source |
|---|---|---|
| 2022-01-03 | Thomas Goirand blacklists tests on riscv64 (same failures as mipsel) in v2.15.0 Debian packaging | [Debian package tracker](https://tracker.debian.org/pkg/open-vswitch) |
| 2022-07-14 | Luca Boccassi excludes failing tests on riscv64 in Debian v2.17.2-2 (Closes: #1009969) | Debian changelog |
| 2023-01-03 | Thomas Goirand adds DPDK support for riscv64 in Debian v3.1.0-4 (Closes: #1027329) | Debian changelog |
| 2023-08-28 | Frode Nordahl fixes a riscv64 build failure (test timing dependency) in Debian v3.2.0-2 | [Debian changelog v3.5.0-1](https://tracker.debian.org/media/packages/o/openvswitch/changelog-3.5.0-1) |
| 2024-04-30 | Thomas Goirand blacklists 3 additional unit tests on riscv64 in Debian v3.3.0-3 | Debian changelog |
| 2025-08-22 | Thomas Goirand blacklists test 980 on riscv64 in Debian v3.6.0-2 | Debian changelog |
| 2025-11-28 | Thomas Goirand blacklists one test on riscv64 in Debian v3.6.0-4 | Debian changelog |
| ~2025-12 | Debian bug #1121905 filed: frequent FTBFS on riscv64 against openvswitch 3.6.0-5, failing test `bfd.at` ("bfd decay," timing-sensitive, also occasionally fails on s390x under parallel test load); fixed/closed in 3.6.0-6 | [Debian BTS #1121905](https://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg2072209.html) |
| 2026-06-16 | Debian sid ships openvswitch 3.7.1-3 for riscv64, status "Installed" on build host rv-osuosl-05 | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=openvswitch) |
| 2026 (resolute cycle) | Ubuntu 26.04 "resolute" ships openvswitch-common/-switch/-switch-dpdk/-ipsec/-testcontroller/-vtep/python3-openvswitch at 3.7.1-2 for riscv64 | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=openvswitch&suite=resolute) |

Note: the existing project history recorded the BFD-test exclusion as landing in Debian v3.7.0~git on 2026-02-24; live research located the same class of fix tracked as Debian bug #1121905 against 3.6.0-5, closed in 3.6.0-6. Both citations describe the same recurring riscv64 `bfd.at` timing flake; the precise version string differs between the two sources and is noted here as a discrepancy rather than resolved, since neither source was re-fetched against the other in this pass.

**Key contributors:** Thomas Goirand (Debian), Luca Boccassi (Debian), Frode Nordahl (Canonical, Ubuntu). All riscv64 activity is confined to Debian/Ubuntu packaging; none of these contributors have filed issues or submitted patches upstream to `openvswitch/ovs`.

**Is the port fully upstream?** No. The upstream repository contains zero riscv64-specific code, zero riscv64 CI, and zero riscv64 documentation. riscv64 compatibility derives entirely from the architecture-neutral C codebase compiling successfully with no upstream intervention.

---

## 3. Upstream Support Tier

No formal architecture-tier policy exists. The table below is the de facto support level based on CI, release artifacts, and issue-tracking evidence, independently re-verified this cycle via direct clone and workflow-file inspection.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI (GitHub Actions) | Yes, all jobs on ubuntu-24.04/ubuntu-latest | No | No |
| Cross-compile or QEMU-emulated CI | N/A | No | No |
| Architecture mentioned in any upstream issue, PR, or commit | Yes (implicit, all bugs) | Occasional | No, zero results across issues/PRs/commits/code search |
| Official upstream binary (GitHub Releases) | No (project ships source tarballs only) | No | No |
| Debian packaging | Yes | Yes | Yes, 3.7.1-3 (sid) |
| Ubuntu packaging | Yes | Yes | Yes, 3.7.1-2 (26.04 "resolute") |
| Arch Linux RISC-V | N/A | N/A | No |

**Summary:** amd64 is the only architecture with upstream CI or any upstream-tracked artifact. riscv64 is not a recognized upstream target; availability is entirely a downstream distro-packaging outcome, which is the basis for the orange/downstream-only readiness grade (Section 13).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

OVS has architecture-specific code in exactly two small, optional hot-path micro-optimizations: hash/CRC32 computation and cycle-counter reads. Everything else, including the DPCLS packet-classification fast path, netdev-dpdk glue, OVSDB, and OpenFlow processing, is architecture-agnostic C with no per-architecture branches.

### 4.1 Hash and CRC32 (`lib/hash.h`, 535 lines)

```c
#if (defined(__ARM_FEATURE_CRC32) && defined(__aarch64__))
#include "hash-aarch64.h"          /* ARM CRC32 hardware instruction */
#elif !(defined(__SSE4_2__) && defined(__x86_64__))
/* Mhash-based implementation. */   /* riscv64 lands here */
#else
#include <smmintrin.h>              /* x86_64 SSE4.2 CRC32 intrinsic */
#endif
```

riscv64 compiles the generic Mhash (MurmurHash3-derived) software fallback, identical to every other non-x86_64/non-aarch64 target (ppc64le, s390x, mips, and so on). `lib/automake.mk` lists exactly one architecture-specific source file, `lib/hash-aarch64.h`; there is no `lib/hash-x86_64.h` (x86_64's path is header-inline via `<smmintrin.h>`) and no `lib/hash-riscv64.h`. The RISC-V Zbc extension provides carry-less multiply/CRC32 acceleration analogous to ARM's CRC32 instruction, but OVS does not use it.

### 4.2 Cycle Counter (`lib/dpif-netdev-perf.h`, 428 lines)

```c
#ifdef DPDK_NETDEV
    return s->last_tsc = rte_get_tsc_cycles();
#elif defined(__x86_64__)
    asm volatile("rdtsc" ...);               /* x86_64 inline asm */
#elif defined(__aarch64__)
    asm volatile("mrs %0, cntvct_el0" ...);  /* aarch64 inline asm */
#elif defined(__linux__)
    return rdtsc_syscall(s);                  /* riscv64-on-Linux lands here */
#else
    return s->last_tsc = 0;                   /* only non-Linux, non-x86_64/aarch64 */
#endif
```

riscv64 Linux hits the `__linux__` branch, a functional syscall-based clock read, not the dead `return 0` stub. There is no `TODO`/`FIXME`/"not implemented" marker anywhere in either file.

### 4.3 Atomic Operations (`lib/ovs-atomic.h`)

Dispatch ladder: sparse (pthreads fallback) -> clang `__c_atomic` -> C++11 -> `HAVE_STDATOMIC_H` (C11 `<stdatomic.h>`, riscv64 with GCC >= 5 lands here) -> GCC >= 4.7 generic -> GCC+x86_64 hand-tuned inline asm (~300 lines, `ovs-atomic-x86_64.h`) -> GCC+i386 hand-tuned inline asm -> pthreads fallback. riscv64 uses the same C11 `<stdatomic.h>` path as arm64. There is no `ovs-atomic-riscv64.h`.

### 4.4 Utility Macros, DPCLS, DPDK Fast Path, JIT

`lib/util.h` has GCC-version-gated `popcount`/`ARRAY_SIZE` variants for aarch64 and x86_64; riscv64 uses generic C. `lib/dpif-netdev-dpcls.c` and `lib/dpif-netdev.c` contain no architecture-specific code for any architecture (compile-time constant propagation only, architecture-agnostic). OVS has no userspace JIT; it relies on the in-kernel Linux eBPF JIT (`arch/riscv/net/bpf_jit_comp64.c`) for XDP/AF_XDP acceleration, which is outside the OVS codebase.

### Component Comparison Table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hash/CRC32 | Hand-tuned SSE4.2 intrinsic | Hand-tuned ARMv8 CRC32 intrinsic (`hash-aarch64.h`) | Scalar Mhash/MurmurHash3 fallback, complete and correct, not partial, no Zbc use |
| Cycle counter | Inline `rdtsc` asm | Inline `mrs cntvct_el0` asm | Functional Linux syscall fallback (`rdtsc_syscall`) |
| Atomic operations | Hand-tuned inline asm (~300 lines) | GCC builtins via C11 `<stdatomic.h>` | GCC builtins via C11 `<stdatomic.h>`, same as arm64 |
| popcount/util macros | Hardware `__POPCNT__` | Optimized (GCC >= 6/7) | Generic C |
| DPCLS / core forwarding path | Generic C | Generic C | Generic C, parity with amd64 and arm64 |
| Architecture-specific files | `ovs-atomic-x86_64.h`, `ovs-atomic-i586.h` | `hash-aarch64.h` | None |
| Upstream CI coverage | ubuntu-24.04, all jobs | None | None |

The riscv64 scalar fallback is fully functional and is exactly how OVS has always handled "other" architectures (ppc64le, s390x, mips). The two optimized paths (CRC32, cycle counter) are incidental hot-path tuning rather than a stub or an abandoned port.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools (autoconf + automake + libtool). No CMake, no `CMakeLists.txt`, no `cmake/` directory anywhere in the tree. Build is `./boot.sh && ./configure && make`.

**Native build on riscv64:**

```bash
./boot.sh   # only needed from a git tree
./configure CFLAGS="-g -O2"
make -j$(nproc)
make install
```

**Cross-compilation from x86_64:**

```bash
./boot.sh
./configure --host=riscv64-linux-gnu \
            CC=riscv64-linux-gnu-gcc \
            CFLAGS="-g -O2" \
            --disable-ssl
make -j$(nproc)
```

`--host=riscv64-linux-gnu` is standard autoconf cross-compilation; OVS provides no architecture-specific documentation for it. No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists anywhere in the repository (confirmed by direct file-tree inspection of a fresh clone); general build instructions live only as generic Linux/autotools `.rst` files under `Documentation/intro/install/`. `configure.ac`'s only architecture-aware variable is `AC_ARG_VAR(KARCH, [Kernel Architecture String])`, used to match the target Linux kernel's module ABI when cross-building the kernel datapath module; there is no per-ISA feature gating and no architecture-tied minimum-GCC/Clang assertion.

**Toolchain requirements for correct atomic behavior on riscv64:** GCC >= 5 (or any compiler providing `<stdatomic.h>`) selects the C11 atomic path, which is correct and adequate. GCC < 4.7 or no `<stdatomic.h>` falls back to a pthreads-mutex-based atomics implementation, described in OVS source comments as "might be too slow for real use." Any current Debian/Ubuntu/Fedora riscv64 toolchain (GCC 13+) hits the C11 path; this is not a practical concern.

**Dockerfiles:** the only Dockerfile in the repository is `utilities/docker/debian/Dockerfile` (Ubuntu 16.04 base, builds kernel modules; generic x86, no architecture arguments). No riscv64 Dockerfile exists, and GitHub-wide code search for `riscv64 repo:openvswitch/ovs filename:Dockerfile` returns zero results.

**DPDK cross-compilation note:** the CI script `.ci/linux-build.sh` hardcodes `${DPDK_INSTALL_DIR}/lib/x86_64-linux-gnu`. Building OVS-DPDK in a riscv64 cross-compilation environment requires patching this path to `lib/riscv64-linux-gnu`. This is a packaging/CI issue, not a correctness issue in OVS's own code. [NEEDS VERIFICATION, derived from reading the script; no filed issue documents this as a required fix]

**QEMU usage:** none for riscv64 anywhere in upstream CI. `freebsd.yml`'s single job boots a FreeBSD VM via `qemu-system-x86` on an `ubuntu-24.04` host, i.e. QEMU emulates an x86 FreeBSD guest on x86 hardware, unrelated to RISC-V.

**Known build failures:** zero riscv64 build failures exist in the upstream issue tracker. One Ubuntu Noble autopkgtest run is recorded as a failure (2025-03-16, version 3.3.0-1ubuntu3.1, ~9h25m runtime, root cause undetermined from available logs). Debian sid builds pass cleanly at 3.7.1-3.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps

No functional gaps are known in the kernel datapath or core userspace daemons. `openvswitch.ko` is part of mainline Linux and compiles for riscv64 without known issues; `vswitchd`/`ovsdb-server` compile and run via generic C paths; Debian autopkgtests pass on riscv64 with a subset of tests excluded (Section 11).

**OVS-DPDK on riscv64 ("switch-dpdk" packaging):** the two primary distros disagree. The existing Debian `debian/control.in` restricts the DPDK-enabled `openvswitch-switch-dpdk` package to `amd64 arm64 i386 ppc64el` (excluding riscv64), per [salsa.debian.org](https://salsa.debian.org/debian/openvswitch/-/blob/debian/unstable/debian/control.in). Live verification of Ubuntu 26.04 "resolute," by contrast, shows `openvswitch-switch-dpdk` built for `amd64 arm64 ppc64el riscv64` (no s390x) at version 3.7.1-2, confirmed directly via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=openvswitch&suite=resolute). This is a genuine discrepancy between Debian and Ubuntu packaging policy as of this research and is reported as such rather than resolved; Debian's control.in was not re-fetched in this pass to confirm it still excludes riscv64 as of 2026-10.

**Virtual vs physical NIC PMDs:** regardless of packaging, DPDK on riscv64 is functional only with virtual PMDs (virtio-net, e1000 in VM/QEMU contexts); no physical NIC PMD (Intel, Mellanox, etc.) has been validated on riscv64 hardware in DPDK 25.11. This is a DPDK-level constraint, not an OVS-level one (Section 9.2).

### 6.2 Performance Gaps

| Hot path | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Hash/CRC32 | SSE4.2 hardware CRC | ARM CRC32 hardware | MurmurHash3/Mhash software | riscv64 lacks Zbc-accelerated CRC; latency penalty in DPCLS hash lookups |
| Atomic ops | Hand-tuned inline asm | C11 GCC builtins | C11 GCC builtins | riscv64 matches arm64; both trail hand-tuned x86_64 asm |
| DPCLS | Generic C | Generic C | Generic C | No gap, this path is architecture-agnostic |
| DPDK PMD | Full hardware PMD support | Partial hardware PMD support | Virtual PMDs only | Significant for line-rate forwarding on real hardware |

Data not available: no quantitative throughput (packets per second) or latency measurements comparing OVS on riscv64 vs amd64 or arm64 were found in any searched source (GitHub, WebSearch, RISE blog, OVS performance literature from TUM, ipspace.net, Intel ONP reports). This is a genuine gap: OVS on riscv64 has reached basic build/packaging parity but no public performance characterization.

### 6.3 Security Hardening Gaps

Data not available: no source examined addresses CFI, shadow stack, BTI, or RISC-V PAC-equivalent hardening in the OVS build configuration for any architecture.

### 6.4 Floating-Point / NaN Semantics

No floating-point code exists in OVS hot paths. No riscv64 floating-point or NaN-related issue was found for OVS in any searched source (searches surfaced NaN-payload-propagation issues for other projects, e.g. LibreOffice, but none for OVS).

---

## 7. CI/CD Infrastructure

Two GitHub Actions workflow files exist and were read directly from a clone (HEAD `8b049f1ff6454cbb6c5c7b575d878965023031e8`, Oct 2026); neither references riscv64, and no other CI system (`.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`) exists anywhere in the tree.

| Workflow file | Jobs / runners | riscv64 present |
|---|---|---|
| [`build-and-test.yml`](https://github.com/openvswitch/ovs/blob/main/.github/workflows/build-and-test.yml) (706 lines) | `build-dpdk`, `build-libreswan`, `build-linux`, `build-clang-analyze-cache`, `build-clang-analyze`, `build-oss-fuzz`, `build-linux-deb` on `ubuntu-24.04`/`ubuntu-latest`; `build-osx` on `macos-latest`; `build-old-linux-distribution` on `ubuntu-24.04` with `container: ubuntu:14.04`; `build-linux-rpm` on `ubuntu-latest` with `container: fedora:43`; `build-oss-fuzz` explicitly sets `--architecture x86_64` | No |
| [`freebsd.yml`](https://github.com/openvswitch/ovs/blob/main/.github/workflows/freebsd.yml) (81 lines) | Single job `build-freebsd` on `ubuntu-24.04`, boots a FreeBSD VM via `qemu-system-x86` (x86 FreeBSD guest, not riscv64 emulation) | No |

Both workflows trigger only on `push`/`pull_request`; neither defines `workflow_dispatch` or `schedule`. A repository-wide case-insensitive `riscv` grep across all `.yml`/`.yaml` files and the full tree returns zero matches. A fresh GitHub-wide code search for `riscv repo:openvswitch/ovs` independently returns `total_count: 0`.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream GitHub Actions | Yes | No | No |
| Build test on every upstream commit | Yes | No | No |
| Functional test (autopkgtest, downstream) | Yes (Debian/Ubuntu) | Yes (Debian/Ubuntu) | Yes (Debian); one recorded Ubuntu Noble FAIL |
| DPDK integration test | Yes (upstream CI, DPDK 25.11.2) | No | No |

**RISE runners:** not used by OVS. The RISE RISC-V Runners service ([riscv-runners.riseproject.dev](https://riscv-runners.riseproject.dev/)) documents usage by llama.cpp, PyTorch, NumPy, k3s, k0s, containerd, Kubernetes, and DuckDB, among others; OVS is not among them, and no riseproject-dev GitHub repository (26 checked) is OVS-related.

**Downstream CI:** Debian buildd infrastructure builds OVS for riscv64 on every upload, and Ubuntu autopkgtest runs functional tests on riscv64. These are distribution-level quality gates outside OVS maintainer control, not upstream CI.

---

## 8. Distribution and Release Status

The upstream project publishes no GitHub Releases and no binary packages; all distribution is via Linux distro packaging.

| Channel | riscv64 available | Version | Status |
|---|---|---|---|
| Debian sid (unstable) | Yes | 3.7.1-3 | "Installed" on rv-osuosl-05 (as of 2026-06-16) |
| Debian autopkgtest | Yes | 3.7.1 | Pass on riscv64 (with excluded tests, Section 11) |
| Ubuntu 26.04 "resolute" | Yes | 3.7.1-2 | `openvswitch-common`, `-switch`, `-switch-dpdk`, `-ipsec`, `-testcontroller`, `-vtep`, `python3-openvswitch` all confirmed live for riscv64 via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=openvswitch&suite=resolute) |
| Ubuntu 24.04 "Noble" | Yes | 3.3.0-1ubuntu1 | Available as riscv64 .deb |
| Ubuntu autopkgtest (riscv64, Noble) | Yes | 3.3.0-1ubuntu3.1 | One recorded run: FAIL (2025-03-16, 9h25m runtime), root cause undetermined |
| Fedora/RHEL | Data not available | - | - |
| Arch Linux RISC-V | No | - | Not present in the archriscv overlay ([archriscv.felixc.at](https://archriscv.felixc.at/)) |
| GitHub Releases | No | - | Project publishes no GitHub Releases, source tarballs only |
| PyPI | No | - | No `open-vswitch` package exists; `https://pypi.org/pypi/open-vswitch/json` and the simple index both return HTTP 404 |
| RISE wheel builder | N/A | - | Redirects to the (non-existent) PyPI project; moot since OVS is not a Python package |
| OCI (container images) | Data not available | - | - |

**Getting a working binary on riscv64:** install `openvswitch-switch` from Debian sid or Ubuntu 26.04/24.04. No source patches are required for the base package; the kernel datapath (`openvswitch.ko`) is available in mainline Linux for riscv64. Users needing the DPDK-accelerated variant should verify current per-distro packaging, since Debian and Ubuntu diverge on riscv64 inclusion for `openvswitch-switch-dpdk` (Section 6.1).

---

## 9. Dependencies

### 9.1 Summary Table

| Dependency | Role | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|---|
| DPDK | Userspace/kernel-bypass datapath, vectorized packet I/O, poll-mode drivers, hugepage mempool allocator | Critical | Upstream-supported target since the 3.1.0/22.11 era (`lib/eal/riscv/`, `config/riscv/` cross-compile configs for rv64gc, RV64GCV, SiFive U740); minority/community-maintained vs x86/ARM, many vector PMDs and NIC drivers are x86/ARM-SIMD-specific with no riscv64 equivalent | Not tracked via GitHub Issues (DPDK triages on Bugzilla/Patchwork/mailing list, outside this sweep's scope); no riscv64 runner in DPDK's own CI matrix | Source tarballs only; distro-packaged (`dpdk-dev`/`libdpdk-dev` 25.11-2 for Ubuntu resolute riscv64, web-sourced, not graph-confirmed) | No validated physical NIC PMD on riscv64 hardware; OVS's own `.ci/linux-build.sh` hardcodes the x86_64 DPDK library path; riscv64 absent from DPDK's official supported-hardware table at [core.dpdk.org](https://core.dpdk.org) and from the 25.11 release-notes tested-platform list |
| OpenSSL | TLS for OVSDB remote connections, IPsec tunnel config | Optional | `linux64-riscv64` Configurations target exists; native vector-crypto asm (Zvkned/Zkne AES, Zvknha/Zvknhb SHA-2, Zvkb acceleration) merged since 2022 and actively developed | No native riscv64 GitHub Actions runners; CI runs on `ubuntu-latest` x86_64 with QEMU user-mode emulation | Distro-packaged (`libssl3t64` confirmed present for Ubuntu resolute riscv64) | 6 open riscv64 issues including musl ISA-extension detection broken ([#28118](https://github.com/openssl/openssl/issues/28118)), AES-192 Zvkned key-schedule falling back to software, FIPS build untested on riscv64; open cross-compile bug [#29357](https://github.com/openssl/openssl/issues/29357) (`no-deprecated` flag breaks `linux64-riscv64` on branches 3.4-4.0 and master; does not affect default OVS builds) [NEEDS VERIFICATION, not independently re-checked this cycle] |
| jemalloc | Memory allocator for `ovsdb-server` | Optional | Falls to the generic catch-all target, compiles without riscv-specific tuning | Unknown; no riscv64 CI evidence found | Ships in Debian/Ubuntu for riscv64 | Issue [#2399](https://github.com/jemalloc/jemalloc/issues/2399) (open since March 2023), "does jemalloc support cross build for RISCV64," no official maintainer answer; no spinwait intrinsic mapped for RISC-V [NEEDS VERIFICATION, single-source, not independently re-checked this cycle] |
| libbpf | Loader for the AF_XDP/eBPF-accelerated datapath | Optional | Source-level riscv64 support (register/syscall/USDT handling) is complete, no gaps found | Zero upstream CI on riscv64 at all, cross-build matrix covers only aarch64/ppc64le/s390x/amd64; functional CI is x86_64-only | No upstream riscv64 release binaries (source tarballs only); ships via Debian sid / Ubuntu 26.04 (`libbpf1`/`libbpf-dev` 1:1.6.3-1ubuntu1, ports pocket) built from unmodified source | 0 open riscv64 issues in `libbpf/libbpf`; the kernel-side BPF JIT (`arch/riscv/net/bpf_jit_comp64.c`) has its own known gaps (1- and 2-byte RMW atomics, BPF exceptions), out of libbpf's own scope but relevant to the AF_XDP path |
| libxdp | AF_XDP socket setup for the XDP-accelerated OVS datapath | Optional | Not independently re-researched this cycle; shares libbpf's eBPF/XDP lineage, likely a similar profile [NEEDS VERIFICATION] | 0 riscv64 issues found via issue search on `xdp-project/xdp-tools` | Not independently verified this cycle | No dedicated status report exists; flagged as a research gap for future coverage |
| libnuma | NUMA-aware memory allocation for PMD/DPDK thread placement | Optional | No upstream riscv64 CI at all (zero riscv64 matches across all 4 CI workflow files) | No upstream test coverage on riscv64 | Release tarballs source-only; distro-packaged (`libnuma1` 2.0.19-1build1, Ubuntu resolute riscv64, ports archive tier; Debian sid main pool) | 0 open riscv64 issues found; whether Debian/Ubuntu packages carry riscv64-specific patches vs vanilla upstream is unconfirmed [NEEDS VERIFICATION] |
| libunbound | DNS/DNSSEC resolution for DNS-based ACL/conjunctive-match features | Optional | Not independently re-researched this cycle [NEEDS VERIFICATION] | 2 historical `NLnetLabs/unbound` issues matched a riscv64 search, both about arm, not riscv64 (effectively 0 riscv64-specific issues) | `unbound`/`python3-unbound` confirmed present through Ubuntu questing (25.10); resolute (26.04) not directly confirmed [NEEDS VERIFICATION] | None identified |
| libpcap | Packet capture for mirroring/tooling paths | Optional | Mature, architecture-generic C, no riscv64-specific blockers found | 3 `the-tcpdump-group/libpcap` issues matched a riscv64 search, all closed and about mips/sparc, not riscv64 (0 riscv64-specific issues) | `libpcap-dev`/`libpcap0.8-dev` confirmed present through jammy/noble/plucky/questing/resolute riscv64 (web-sourced, not graph-confirmed) | None identified |
| libunwind | Stack unwinding/crash backtraces for `vswitchd` | Optional | Partial; Linux riscv64 has open gaps; FreeBSD riscv64 initial support merged 2025 | C++ exception handling unreliable on riscv64, PR [#1032](https://github.com/libunwind/libunwind/pull/1032) open [NEEDS VERIFICATION, single-source] | Ships Debian/Ubuntu riscv64 as a partial implementation | CMake build support absent, issue [#765](https://github.com/libunwind/libunwind/issues/765) open since June 2024; C++ exceptions broken, PR #1032 open [NEEDS VERIFICATION, single-source] |
| libcap-ng | Privilege dropping for OVS daemons | Optional | Builds, no riscv64 issues filed | Unknown | Ships Debian/Ubuntu riscv64 | None identified |

### 9.2 DPDK Deep-Dive

DPDK is the highest-priority dependency for OVS-DPDK users and the single highest-impact dependency in the SIMD/memory-allocator category (hugepage mempools, vectorized PMDs). DPDK has carried riscv64 EAL support since roughly the 22.11/OVS-3.1.0 integration timeframe, with CPU-flag, cycle-counter, MMU, and power-management intrinsics implemented, plus cross-compilation configs for generic rv64gc, RV64GCV, and SiFive U740 targets. However: riscv64 is absent from DPDK's official supported-hardware table and from the 25.11 release-notes tested-platform list (only Intel x86 and IBM Power9/Power10 are listed as tested); no physical NIC PMD has been validated on riscv64 hardware; an open PR adding RVV SIMD to the DPDK hash library has not merged; Linux kernel >= 5.13 is required on riscv64 for PCIe BAR userspace mapping; and vector PMD optimizations require GCC 14.1+ or Clang 18.1+. OVS-DPDK on riscv64 is therefore viable for virtual PMDs (virtio-net in VMs) but not for hardware line-rate forwarding on bare metal. DPDK itself is not enumerable for riscv64-specific blocking issues via GitHub search (it does not track issues there); a genuine assessment would require a Bugzilla/Patchwork sweep, which is outside this report's scope.

### 9.3 OpenSSL Note

Of the dependencies researched, OpenSSL has by far the most active riscv64 engineering (dedicated vector-crypto instruction work plus multiple open issues tracking real gaps), the opposite profile from libbpf/libnuma/libpcap, which have essentially zero riscv64-specific issue traffic because they are architecture-generic and "just work" once the kernel/toolchain support riscv64. The open cross-compilation bug #29357 affects the `linux64-riscv64` target only when the `no-deprecated` configure flag is used; it does not affect standard OVS builds, which do not pass that flag.

### 9.4 libunwind Note

libunwind's C++ exception handling is reported broken on riscv64 (PR #1032, open). OVS uses libunwind optionally for crash backtraces; a `vswitchd` crash on riscv64 may produce incomplete or missing stack traces if libunwind is the active unwinder. This does not affect normal operation or packet-forwarding correctness.

---

## 11. Known Bugs and Active Issues

No riscv64 bugs exist in the upstream `openvswitch/ovs` issue tracker. GitHub searches for "riscv," "riscv64," and "risc-v" across issues, pull requests, commits, and code search all return zero results; this was independently re-run and reconfirmed multiple times this cycle.

**Downstream issues:**

| ID | Title | Tracker | Status | Severity | Notes |
|---|---|---|---|---|---|
| Debian #1009969 | Failing tests on riscv64 | Debian BTS | Closed (fixed in v2.17.2-2 by test exclusion) | Low | Tests excluded rather than fixed upstream |
| Debian #1027329 | DPDK support for riscv64 | Debian BTS | Closed (fixed in v3.1.0-4) | Medium | Added riscv64 to Debian DPDK packaging |
| Debian #1121905 | Frequent FTBFS on riscv64 (`bfd.at` "bfd decay" subtest, timing-sensitive, also intermittent on s390x) | Debian BTS | Closed/fixed in openvswitch 3.6.0-6 | Medium | Reported by Aurelien Jarno; same test class was already disabled upstream on arm64 for the same reason |
| Ubuntu autopkgtest FAIL | riscv64 autopkgtest failure, Noble | [autopkgtest.ubuntu.com](https://autopkgtest.ubuntu.com/packages/openvswitch) | Unknown, one recorded run, FAIL | Medium | Version 3.3.0-1ubuntu3.1; 9h25m runtime before FAIL; root cause not determinable from available data; no passing riscv64 run recorded for this Ubuntu Noble build |

**Recurring Debian test exclusions on riscv64** (packaging workarounds, not individually tracked bugs in most cases): at least 6 distinct instances across 2022-2026, most recently the bfd.at/#1121905 fix above. These exclusions are applied in Debian packaging without corresponding upstream bug reports or fixes.

**Correctness bugs:** none identified. The exclusions above indicate flaky, timing-sensitive tests on riscv64, not data-plane correctness failures. No riscv64 floating-point/NaN correctness bug exists for OVS in any searched source.

---

## 12. Objections and Upstream Blockers

**No stated objections exist.** Because no contributor has ever proposed a riscv64-related change to the upstream project, there is no record of maintainer objections.

**Technical blockers to official upstream support:**

1. No riscv64 hardware or hosted runner is available to the upstream project for CI. All current CI uses GitHub-hosted `ubuntu-24.04`/`ubuntu-latest` (x86_64) runners. Adding riscv64 CI would require either RISE Project runners or self-hosted hardware.
2. The recurring test exclusions applied in Debian packaging (at least 6 distinct instances across 4 years) have never been investigated and fixed upstream; root causes for most are undocumented, and some appear to be timing-sensitive tests that behave differently under emulation or on slower riscv64 hardware.
3. `.ci/linux-build.sh` hardcodes `x86_64-linux-gnu` in the DPDK library path; enabling OVS-DPDK CI on riscv64 would require patching this.
4. No RISE Project engagement with OVS has occurred. The RISE blog, runner-usage documentation, and riseproject-dev GitHub organization (26 repositories checked) all confirm zero OVS involvement.

**Organizational blockers:** the dominant maintainer organizations (Red Hat, ovn.org) have not publicly engaged with riscv64. No employee from these organizations has filed an issue, submitted a PR, or posted to the mailing list about riscv64.

**Acceptance probability for an upstream riscv64 CI patch:** Data not available, no prior submission exists to judge maintainer response.

---

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- **Justification:** Open vSwitch has zero upstream riscv64 CI. Both GitHub Actions workflows, [build-and-test.yml](https://github.com/openvswitch/ovs/blob/main/.github/workflows/build-and-test.yml) and [freebsd.yml](https://github.com/openvswitch/ovs/blob/main/.github/workflows/freebsd.yml), run exclusively on `ubuntu-24.04`/`ubuntu-latest` (x86_64) or `macos-latest`, with no riscv64 job, runner, or QEMU emulation, and GitHub-wide code/issue/PR/commit search for "riscv" against `openvswitch/ovs` returns zero hits. riscv64 availability exists only downstream: Debian ships openvswitch 3.7.1-3 for riscv64 and Ubuntu 26.04 "resolute" ships `openvswitch-common`/`-switch`/`-switch-dpdk`/etc. at 3.7.1-2 (per [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=openvswitch&suite=resolute)), but this requires riscv64-specific packaging patches, a documented build-failure fix in Debian v3.2.0-2 ("Fix riscv64 build failure") and recurring riscv64-only test-exclusion patches across at least 6 releases (2022-2026, most recently the bfd.at test disabled per [Debian bug #1121905](https://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg2072209.html)), so this is not a clean, unpatched build, which caps the distribution floor at orange rather than yellow. OVS is not an optimization-purpose project (its value is SDN/switching functionality, not architecture-tuned throughput), so the optimization-level modifier does not apply; its two minor hot-path optimizations (CRC32 hashing, cycle counters) fall back to generic scalar C on riscv64 just as they do on every non-x86/non-arm64 architecture, which is incidental rather than grade-determining here.
- **Pending work that could change the grade:** no open upstream riscv64 issues or PRs exist in `openvswitch/ovs`. No RISE Project engagement or funding for OVS was found (not a RISE member, no RISE blog mention, not in the RISE wheel builder, RISE runners not used). The one tracked riscv64 defect, Debian #1121905 (frequent FTBFS on riscv64 for the `bfd.at` test), is already fixed and closed. Candidate future work that is not currently in progress: adding riscv64 to upstream CI via a RISE runner, implementing a Zbc-accelerated `lib/hash-riscv64.h`, resolving the Debian-vs-Ubuntu divergence on `openvswitch-switch-dpdk` riscv64 packaging, and fixing the hardcoded x86_64 DPDK path in `.ci/linux-build.sh`.

---

## 14. Investment Analysis

RISE has not funded or engaged with Open vSwitch; no prior coverage exists to exclude from the sizing below.

### 14.1 Functional Enablement

The baseline kernel-datapath OVS is functionally complete on riscv64; no work is needed to make it run. The remaining functional gap is the DPDK-accelerated path: Debian's `control.in` excludes `openvswitch-switch-dpdk` from riscv64 while Ubuntu 26.04 ships it, an unresolved packaging-policy divergence that should be reconciled. Enabling OVS-DPDK with real hardware acceleration on riscv64 further requires upstream DPDK physical-NIC-PMD validation, which is DPDK work, not OVS work. The Ubuntu Noble autopkgtest failure (root cause unknown) should be diagnosed before claiming fully passing riscv64 test coverage.

### 14.2 Performance Optimization

Two performance gaps are well-defined and tractable. **Hash/CRC32 acceleration:** add `lib/hash-riscv64.h` using the RISC-V Zbc extension (`__riscv_zbcr` intrinsics for carry-less multiply/CRC32), analogous to the existing 80-line `lib/hash-aarch64.h`; this sits in the DPCLS packet-classification critical path. **Atomic operations:** riscv64 currently uses the same C11 `<stdatomic.h>` path as arm64, versus x86_64's hand-tuned ~300-line asm; whether dedicated riscv64 asm is warranted depends on GCC riscv64 backend code-generation quality, which has not been benchmarked. Data not available: no benchmarks exist to quantify either gap on real riscv64 hardware.

### 14.3 CI/CD Infrastructure

Adding riscv64 to upstream CI requires: a riscv64 GitHub Actions runner (the RISE Project provides these); fixing or formally documenting the tests currently excluded in Debian packaging; and patching `.ci/linux-build.sh` for the DPDK library path if OVS-DPDK CI on riscv64 is desired. This is the highest-leverage investment, since it would prevent regressions, make riscv64 a first-class upstream target, and provide visibility into the open Ubuntu autopkgtest failure.

### 14.4 Ecosystem Enablement

Not applicable. OVS has no significant downstream package ecosystem requiring separate riscv64 enablement, no Python-wheel ecosystem of its own, no Maven JARs, no npm packages. `python3-openvswitch` bindings are available in Debian/Ubuntu for riscv64 as standard packages alongside the main switch packages.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a riscv64 runner to upstream GitHub Actions CI (RISE runner) | 2 | OVS maintainer + RISE | High |
| CI/CD | Diagnose and fix upstream the tests currently excluded in Debian packaging on riscv64 | 3-6 | OVS maintainer | High |
| CI/CD | Diagnose the Ubuntu Noble autopkgtest failure (root cause unknown) | 1-2 | Ubuntu/OVS maintainer | High |
| Functional | Reconcile Debian-vs-Ubuntu divergence on `openvswitch-switch-dpdk` riscv64 inclusion | 0.5-1 | Debian + Ubuntu packaging | Medium |
| Performance | Implement `lib/hash-riscv64.h` using Zbc CRC32 intrinsics | 2-3 | RISC-V contributor | Medium |
| Performance | Benchmark OVS kernel datapath on riscv64 hardware (pps throughput vs arm64/amd64 baseline) | 1 | RISC-V contributor | Medium |
| Functional | Validate a physical NIC PMD for DPDK on riscv64 hardware (blocked on DPDK community work) | 1 (OVS-side) + N (DPDK NIC work) | Debian/Ubuntu + DPDK community | Low |
| CI/CD | Fix `.ci/linux-build.sh` DPDK library path for riscv64 cross-compilation | 0.5 | OVS maintainer | Low |

---

## 15. References

- [openvswitch/ovs GitHub repository](https://github.com/openvswitch/ovs)
- [Open vSwitch homepage](https://www.openvswitch.org/)
- [OVS build-and-test GitHub Actions workflow](https://github.com/openvswitch/ovs/blob/main/.github/workflows/build-and-test.yml)
- [OVS freebsd GitHub Actions workflow](https://github.com/openvswitch/ovs/blob/main/.github/workflows/freebsd.yml)
- [OVS atomic dispatch header: lib/ovs-atomic.h](https://github.com/openvswitch/ovs/blob/main/lib/ovs-atomic.h)
- [OVS hash header: lib/hash.h](https://github.com/openvswitch/ovs/blob/main/lib/hash.h)
- [OVS aarch64 hash: lib/hash-aarch64.h](https://github.com/openvswitch/ovs/blob/main/lib/hash-aarch64.h)
- [OVS automake source list: lib/automake.mk](https://github.com/openvswitch/ovs/blob/main/lib/automake.mk)
- [OVS porting documentation: Documentation/topics/porting.rst](https://github.com/openvswitch/ovs/blob/main/Documentation/topics/porting.rst)
- [OVS CI build script: .ci/linux-build.sh](https://github.com/openvswitch/ovs/blob/main/.ci/linux-build.sh)
- [Debian package tracker: open-vswitch](https://tracker.debian.org/pkg/open-vswitch)
- [Debian changelog v3.5.0-1](https://tracker.debian.org/media/packages/o/openvswitch/changelog-3.5.0-1)
- [Debian bug #1121905: frequent FTBFS on riscv64](https://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg2072209.html)
- [Debian buildd status: openvswitch](https://buildd.debian.org/status/package.php?p=openvswitch)
- [Ubuntu Packages: openvswitch, suite resolute](https://packages.ubuntu.com/search?keywords=openvswitch&suite=resolute)
- [Ubuntu autopkgtest results: openvswitch](https://autopkgtest.ubuntu.com/packages/openvswitch)
- [Debian control.in (DPDK package architecture restriction)](https://salsa.debian.org/debian/openvswitch/-/blob/debian/unstable/debian/control.in)
- [DPDK riscv64 EAL: lib/eal/riscv/](https://github.com/DPDK/dpdk/tree/main/lib/eal/riscv)
- [DPDK riscv64 cross-compilation configs: config/riscv/](https://github.com/DPDK/dpdk/tree/main/config/riscv)
- [DPDK supported hardware](https://core.dpdk.org)
- [OpenSSL issue #28118: musl ISA-extension detection broken](https://github.com/openssl/openssl/issues/28118)
- [OpenSSL cross-compile bug #29357: linux64-riscv64 fails with no-deprecated](https://github.com/openssl/openssl/issues/29357)
- [jemalloc issue #2399: does jemalloc support cross build for RISCV64?](https://github.com/jemalloc/jemalloc/issues/2399)
- [libunwind issue #765: CMake build support for RISC-V absent](https://github.com/libunwind/libunwind/issues/765)
- [libunwind PR #1032: C++ exceptions broken on riscv64](https://github.com/libunwind/libunwind/pull/1032)
- [RISE Project homepage](https://riseproject.dev)
- [RISE RISC-V Runners](https://riscv-runners.riseproject.dev/)
- [RISE sw-ecosystem tracker report: Open vSwitch](https://riseproject-dev.github.io/sw-ecosystem/project-reports/open-vswitch.html)
- [Arch Linux RISC-V port overlay status](https://archriscv.felixc.at/)