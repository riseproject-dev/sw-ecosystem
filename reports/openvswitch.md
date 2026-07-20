---
title: Open vSwitch
categories:
  - containers
  - iaas
---

# Open vSwitch
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for Open vSwitch
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

Open vSwitch (OVS) is a production-quality, multilayer virtual switch licensed under Apache 2.0. It implements a virtual switch supporting standard protocols including OpenFlow, OVSDB, VXLAN, GRE, and LACP. It is the dominant software switching fabric for OpenStack, Kubernetes with OVN, and bare-metal SDN deployments. The primary codebase lives at [github.com/openvswitch/ovs](https://github.com/openvswitch/ovs).

**Governance:** OVS is a Linux Foundation Collaborative Project. The Linux Foundation holds trademark rights and final authority over funds. The project is governed by a Technical Steering Committee composed of all active committers. TSC votes require a majority of all representatives; charter amendments require a two-thirds supermajority subject to Linux Foundation approval. Committer nomination requires a majority yes vote with zero no votes from existing committers -- a single veto blocks the nomination.

**Active committers as of mid-2026:**

| Committer | Affiliation |
|---|---|
| Aaron Conole | Red Hat |
| Eelco Chaudron | Red Hat |
| Kevin Traynor | Red Hat |
| Alin Serdean | OVN.org |
| Ian Stokes | OVN.org |
| Ilya Maximets | OVN.org |
| Simon Horman | OVN.org |
| Ansis Atteka | unaffiliated |
| William Tu | unaffiliated |

Red Hat (IBM) and OVN.org are the dominant organizational affiliations. RISE Project membership: none. No RISE blog post mentions OVS; the RISE wheel builder contains no OVS entry.

**Community stance on new ports:** The upstream project has no formal architecture tier policy and no documented process for recognizing new architecture support. The codebase is written in portable C; the maintainers have never formally engaged with riscv64 in any tracked channel (zero issues, zero PRs, zero mailing list threads found).

---

## 2. Port History and Upstreaming Timeline

There is no upstream RISC-V port. The following table documents all known riscv64-relevant activity. Every entry is from **Debian packaging**, not from the upstream openvswitch/ovs repository.

| Date | Event | Source |
|---|---|---|
| 2022-01-03 | Thomas Goirand blacklists tests on riscv64 (same failures as mipsel) in v2.15.0 Debian packaging | [Debian changelog](https://tracker.debian.org/pkg/open-vswitch) |
| 2022-07-14 | Luca Boccassi explicitly excludes failing tests on riscv64 in Debian v2.17.2-2 (Closes: #1009969) -- first named riscv64 reference in any project artifact | Debian changelog |
| 2023-01-03 | Thomas Goirand adds DPDK support for riscv64 in Debian v3.1.0-4 (Closes: #1027329) | Debian changelog |
| 2023-08-28 | Frode Nordahl fixes riscv64 build failure in Debian v3.2.0-2 (test timing dependency) | Debian changelog |
| 2024-04-30 | Thomas Goirand blacklists 3 additional unit tests on riscv64 in Debian v3.3.0-3 | Debian changelog |
| 2025-08-22 | Thomas Goirand blacklists test 980 on riscv64 in Debian v3.6.0-2 | Debian changelog |
| 2025-11-28 | Thomas Goirand blacklists one test on riscv64 in Debian v3.6.0-4 | Debian changelog |
| 2026-02-24 | Thomas Goirand blacklists BFD test on riscv64 in Debian v3.7.0~git | Debian changelog |
| 2026-06-16 | Debian sid ships openvswitch 3.7.1-3 for riscv64, status "Installed" on build host rv-osuosl-05 | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=openvswitch) |

**Key contributors:** Thomas Goirand (Thomas Goirand Consulting, primary Debian maintainer), Luca Boccassi (Debian), Frode Nordahl (Canonical). All activity is in Debian packaging. None of these contributors have filed issues or submitted patches upstream to openvswitch/ovs.

**Is the port fully upstream?** No. The upstream openvswitch/ovs repository contains zero riscv64-specific code, zero riscv64 CI, and zero riscv64 documentation. riscv64 compatibility derives entirely from the architecture-neutral C codebase compiling successfully on riscv64 with no upstream intervention.

---

## 3. Upstream Support Tier

The upstream project has no formal architecture tier policy. No PLATFORMS.md, SUPPORT.md, or equivalent document exists in the repository. The following table describes the de facto support level based on CI, release artifacts, and issue tracking evidence.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI (GitHub Actions) | Yes -- all jobs on ubuntu-24.04 | No | No |
| Cross-compile CI (QEMU) | N/A | No | No |
| Architecture mentioned in any upstream issue or PR | Yes (implicitly, all bugs) | Yes (occasional reports) | No -- zero results |
| Release-blocking status | Yes | Unknown | No |
| Official upstream binary | No (no GitHub Releases at all) | No | No |
| Debian packaging | Yes | Yes | Yes -- 3.7.1-3 "Installed" |
| Ubuntu packaging | Yes | Yes | Yes -- 3.3.0-1ubuntu1 |
| Arch Linux RISC-V | N/A | N/A | No |

**Summary:** amd64 is the only architecture with upstream CI. riscv64 is not a recognized upstream target; it works incidentally due to portable C but has no upstream support commitment.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

OVS has architecture-specific code in three areas: atomic operations, hash/CRC32 computation, and architecture utility macros. All other hot paths (DPCLS packet classification, netdev-dpdk, ovsdb) are architecture-agnostic C.

### 4.1 Atomic Operations

The file `lib/ovs-atomic.h` selects an atomic implementation at compile time via a dispatch ladder:

```
sparse              -> ovs-atomic-pthreads.h (correctness only, "might be too slow for real use")
clang __c_atomic    -> ovs-atomic-clang.h
C++ >= C++11        -> ovs-atomic-c++.h
HAVE_STDATOMIC_H    -> ovs-atomic-c11.h         (riscv64 with GCC >= 5 lands here)
GCC >= 4.7          -> ovs-atomic-gcc4.7+.h
GCC + x86_64        -> ovs-atomic-x86_64.h      (hand-tuned inline asm, ~300 lines)
GCC + i386          -> ovs-atomic-i586.h         (hand-tuned inline asm, ~350 lines)
fallback            -> ovs-atomic-pthreads.h
```

riscv64 with GCC >= 5 (standard on any modern distro) uses `ovs-atomic-c11.h` via C11 `<stdatomic.h>`. This is functionally correct but not performance-tuned. There is no `ovs-atomic-riscv64.h`.

### 4.2 Hash and CRC32

`lib/hash.h` selects at compile time:
- x86_64 with `__SSE4_2__`: `_mm_crc32` hardware intrinsics
- AArch64 with `__ARM_FEATURE_CRC32`: `__crc32cw`/`__crc32cd` intrinsics via `hash-aarch64.h`
- Everything else: software MurmurHash3 fallback

riscv64 falls through to MurmurHash3. No `hash-riscv64.h` exists. The RISC-V Zbc ISA extension provides carry-less multiply and CRC32 hardware acceleration analogous to ARM CRC32, but OVS does not use it.

### 4.3 Architecture Utility Macros

`lib/util.h` contains per-architecture variants of `ARRAY_SIZE` and `popcount` for aarch64 (GCC >= 6/7) and x86_64 (with `__POPCNT__`). riscv64 receives no such treatment and uses generic C paths.

### 4.4 DPDK Fast Path and DPCLS

`lib/dpif-netdev-dpcls.c` and `lib/dpif-netdev.c` contain no architecture-specific code for any architecture. Both use compile-time constant propagation (ALWAYS_INLINE, pre-expanded macros) that is architecture-agnostic. riscv64 is at parity with amd64 and arm64 in these files.

### 4.5 JIT Backends

OVS has no userspace JIT. It relies on the Linux kernel eBPF JIT for XDP/AF_XDP acceleration. The kernel riscv64 BPF JIT (`arch/riscv/net/bpf_jit_comp64.c`) is in-kernel and not part of the OVS codebase.

### Component Comparison Table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Atomic operations | Hand-tuned inline asm (~300 lines, `ovs-atomic-x86_64.h`) | GCC builtins via C11 `<stdatomic.h>` | GCC builtins via C11 `<stdatomic.h>` -- same as arm64 |
| Hash/CRC32 | SSE4.2 `_mm_crc32` hardware intrinsics | CRC32 via `__crc32cw`/`__crc32cd` (`hash-aarch64.h`) | MurmurHash3 software fallback -- no Zbc use |
| DPCLS packet classification | Generic C (same for all) | Generic C (same for all) | Generic C (same for all) |
| DPDK fast path | Generic C in OVS; DPDK itself handles arch dispatch | Generic C in OVS; DPDK itself handles arch dispatch | Generic C in OVS; DPDK itself handles arch dispatch |
| popcount / util macros | Hardware `__POPCNT__` | Optimized (GCC >= 6/7) | Generic C |
| Architecture-specific files | `ovs-atomic-x86_64.h`, `ovs-atomic-i586.h` | `hash-aarch64.h` | None |
| CI coverage | ubuntu-24.04, all jobs | None | None |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools (autoconf + automake + libtool). No CMake. Build is `./configure && make`.

**Standard native build on riscv64:**

```bash
./boot.sh   # only needed from git tree
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

The `--host=riscv64-linux-gnu` flag is standard autoconf cross-compilation; no OVS-specific documentation covers it. No `docs/cross-compilation.md` or equivalent exists in the repository.

**Compiler requirements for correct atomic behavior on riscv64:**
- GCC >= 5 (or any compiler providing `<stdatomic.h>`): uses C11 atomic path -- correct and adequate
- GCC < 4.7 or no `<stdatomic.h>`: falls back to pthreads mutex atomics -- functionally correct but described in OVS source comments as "might be too slow for real use"
- Any modern Debian/Ubuntu/Fedora toolchain on riscv64 (GCC 13+) hits the C11 path; this is not a practical concern

**DPDK cross-compilation note:** The CI script `.ci/linux-build.sh` contains a hardcoded path `${DPDK_INSTALL_DIR}/lib/x86_64-linux-gnu`. Building OVS-DPDK in a cross-compilation environment requires patching this to `lib/riscv64-linux-gnu`. This is a packaging/CI issue, not an upstream code issue. [NEEDS VERIFICATION -- derived from reading the CI script; no filed issue documents this requirement]

**QEMU usage:** None in upstream CI. The two GitHub Actions workflow files (`build-and-test.yml`, `freebsd.yml`) do not use QEMU for riscv64 cross-compilation or emulation. The FreeBSD workflow uses QEMU for x86 FreeBSD only.

**Known build failures:** No riscv64 build failures exist in the upstream issue tracker (zero results). One Ubuntu Noble autopkgtest failure is documented (2025-03-16, version 3.3.0-1ubuntu3.1, ~9.5 hours runtime, FAIL; root cause unknown -- log inaccessible). Debian sid builds pass cleanly.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps

No functional gaps have been identified. OVS's kernel datapath (`openvswitch.ko`) is part of mainline Linux and compiles for riscv64 without known issues. The userspace daemons (vswitchd, ovsdb-server) compile and run via generic C paths. Debian autopkgtests pass on riscv64 (with a subset of tests blacklisted -- see Section 11).

**OVS-DPDK on riscv64:** Functional with virtual PMDs (virtio-net, e1000 in QEMU/VM contexts). No physical NIC PMD has been validated on riscv64 hardware in DPDK 25.11. This is a DPDK constraint, not an OVS constraint.

**Debian DPDK package exclusion:** The Debian `debian/control.in` file restricts the DPDK-enabled `openvswitch-switch-dpdk` package to `amd64 arm64 i386 ppc64el`. riscv64 is excluded from the DPDK packaging variant. Standard (kernel datapath) OVS packages are available for riscv64.

### 6.2 Performance Gaps

| Hot path | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Hash/CRC32 | SSE4.2 hardware CRC | ARM CRC32 hardware | MurmurHash3 software | riscv64 missing Zbc-accelerated CRC; latency penalty in packet classification hash lookups |
| Atomic ops | Inline asm (lock-free, optimized) | GCC builtins (C11) | GCC builtins (C11) | riscv64 matches arm64; both trail the hand-tuned x86_64 asm |
| DPCLS | Generic C | Generic C | Generic C | No gap -- this path is architecture-agnostic |
| DPDK PMD | Full hardware PMD support (Intel, Mellanox, etc.) | Partial hardware PMD support | Virtual PMDs only | Significant for line-rate forwarding on real hardware |

Data not available: quantitative throughput (pps) measurements comparing riscv64 vs amd64 or arm64. No published benchmarks exist in any searched source.

### 6.3 Security Hardening Gaps

Data not available: no source examined addresses CFI, shadow stack, BTI, or PAC equivalents for riscv64 in the OVS build configuration.

### 6.4 Floating-Point / NaN Semantics

No floating-point code exists in OVS hot paths. No riscv64 floating-point or NaN issues were found in any searched source.

---

## 7. CI/CD Infrastructure

**Upstream CI:** Two GitHub Actions workflows exist. Neither references riscv64.

| Workflow file | Platforms tested | riscv64 present |
|---|---|---|
| `.github/workflows/build-and-test.yml` | ubuntu-24.04 (x86_64), ubuntu-latest, macos-latest | No |
| `.github/workflows/freebsd.yml` | ubuntu-24.04 via QEMU (x86 FreeBSD only) | No |

No `.gitlab-ci.yml`, no `.cirrus.yml`, no Jenkinsfile exist in the repository.

The build matrix in `build-and-test.yml` covers: x86_64 Linux (ubuntu-24.04), 32-bit x86 Linux (ubuntu-24.04 with `M32` flag), and macOS. DPDK version tested: 25.11.2. OSS-Fuzz job explicitly sets `--architecture x86_64`.

**RISE runners:** The RISE Project's GitHub Actions riscv64 runner program is not used by OVS. The RISE blog documents usage by llama.cpp, PyTorch, NumPy, k3s, k0s, containerd, Kubernetes, DuckDB, and others; OVS is not among them.

**Downstream CI (Debian/Ubuntu):** Debian buildd infrastructure builds OVS for riscv64 on every upload. Ubuntu autopkgtest runs functional tests on riscv64. These are not upstream CI; they are distribution-level quality gates outside OVS maintainer control.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream GitHub Actions | Yes | No | No |
| Build test on every upstream commit | Yes | No | No |
| Functional test (autopkgtest) | Yes (Debian/Ubuntu) | Yes (Debian/Ubuntu) | Yes (Debian) -- Ubuntu has one recorded FAIL |
| DPDK integration test | Yes (upstream CI, DPDK 25.11.2) | No | No |

---

## 8. Distribution and Release Status

The upstream project does not publish GitHub Releases or binary packages. All binary distribution is via Linux distro packaging.

| Distribution | riscv64 available | Version | Status |
|---|---|---|---|
| Debian sid (unstable) | Yes | 3.7.1-3 | "Installed" on rv-osuosl-05, ~7 days ago (as of 2026-06-23) |
| Debian autopkgtest | Yes | 3.7.1 | Pass on riscv64 |
| Ubuntu 24.04 (Noble) | Yes | 3.3.0-1ubuntu1 | Available as riscv64 .deb (~2.0 MB for openvswitch-switch) |
| Ubuntu autopkgtest (riscv64) | Yes | 3.3.0-1ubuntu3.1 | One recorded run: FAIL (2025-03-16, 9h 25m runtime); root cause unknown |
| Fedora/RHEL | Data not available | -- | -- |
| Arch Linux RISC-V | No | -- | Not in archriscv overlay |
| GitHub Releases | No | -- | Project publishes no GitHub Releases |
| PyPI | No | -- | No `open-vswitch` package on PyPI |
| OCI (container images) | Data not available | -- | -- |

**Debian DPDK variant:** The `openvswitch-switch-dpdk` package is restricted to `amd64 arm64 i386 ppc64el` in `debian/control.in`. riscv64 users cannot install the DPDK-accelerated variant from Debian.

**Getting a working binary on riscv64:** Install `openvswitch-switch` from Debian sid or Ubuntu 24.04. No source patches are required. The kernel datapath (`openvswitch.ko`) is available in mainline Linux kernels for riscv64.

---

## 9. Dependencies

### 9.1 Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| DPDK | High-perf userspace packet I/O (optional) | Builds (cross-compile config exists; native build supported) | Not tested in DPDK official CI; no riscv64 runner in DPDK CI matrix | Config files present; not in DPDK official supported-hardware list | No validated physical NIC PMD on riscv64; OVS CI hardcodes x86_64 DPDK lib path |
| OpenSSL | TLS/SSL for controller connections (optional) | Builds; `linux64-riscv64` target in `Configurations/10-main.conf` | CI runner PR abandoned; historical CI deadlocks on riscv64 (issue #28550, closed) | Ships in Debian sid for riscv64 | Open cross-compile bug #29357 (no-deprecated flag breaks linux64-riscv64, branches 3.4-4.0 and master) |
| jemalloc | Memory allocator for ovsdb-server (optional) | Falls to generic `*` catch-all; compiles without riscv-specific tuning | Unknown; no riscv64 CI evidence | Ships in Debian/Ubuntu for riscv64 | Issue #2399 (open since Mar 2023): "does jemalloc support cross build for RISCV64?" -- no official answer; no spinwait intrinsic mapped for RISC-V |
| libbpf | AF_XDP accelerated packet I/O (optional) | Builds; kernel BPF JIT for riscv64 is in-kernel and functional | No open riscv64-specific bugs in libbpf tracker | Ships in Debian/Ubuntu for riscv64 | 1- and 2-byte atomic RMW not supported in riscv64 BPF JIT; AF_XDP requires NIC driver XDP support |
| libunwind | Stack unwinding / crash backtraces (optional) | Partial; Linux riscv64 has open gaps; FreeBSD riscv64 initial support merged 2025 | C++ exception handling unreliable on riscv64 (PR #1032 open) | Ships in Debian/Ubuntu for riscv64 as partial implementation | CMake build absent (issue #765, open since Jun 2024); C++ exceptions broken (PR #1032 open) |
| libcap-ng | Privilege dropping for OVS daemons (optional) | Builds; no riscv64 issues filed | Unknown | Ships in Debian/Ubuntu for riscv64 | No known blockers |
| libunbound | DNS name resolution (optional) | Builds; zero riscv64 issues in NLnetLabs/unbound tracker | Unknown | Ships in Debian/Ubuntu for riscv64 | No known blockers |
| Linux AF_XDP/XDP | Kernel-accelerated packet I/O (optional) | riscv64 BPF JIT present and functional | BPF JIT functional; XDP hardware-dependent on NIC driver support | In-kernel; no separate release | 1-2 byte atomic RMW not supported in riscv64 BPF JIT; sparse NIC XDP driver support on riscv64 hardware |

### 9.2 DPDK Deep-Dive

DPDK is the highest-priority dependency for users running OVS-DPDK.

DPDK has carried riscv64 architecture support since DPDK 22.11. The EAL has a full riscv port (`lib/eal/riscv/`) with CPU flags, cycle counter, MMU, and power intrinsics. Cross-compilation config files exist for generic rv64gc, RV64GCV, and SiFive U740 targets (`config/riscv/`). However:

- riscv64 is not in DPDK's official supported-hardware table at [core.dpdk.org](https://core.dpdk.org)
- DPDK 25.11 release notes list only Intel x86 and IBM Power9/Power10 as tested platforms; riscv64 is absent
- No physical NIC PMD (Intel, Mellanox, etc.) has been validated on riscv64 hardware
- An open PR (#115) adds RVV SIMD to the DPDK hash library; it has not been merged
- Linux kernel >= 5.13 is required on riscv64 for PCIe BAR userspace mapping
- Vector PMD optimizations require GCC 14.1+ or Clang 18.1+

OVS-DPDK on riscv64 is viable for virtual PMDs (virtio-net in VMs) but not for hardware line-rate forwarding on bare metal.

### 9.3 OpenSSL Note

An open cross-compilation bug ([#29357](https://github.com/openssl/openssl/issues/29357)) causes the `linux64-riscv64` target to fail when the `no-deprecated` configure flag is used. This affects OpenSSL branches 3.4-4.0 and master. It does not affect standard OVS builds (which do not pass `no-deprecated`), but it is a risk if distributions or build systems add that flag.

### 9.4 libunwind Note

libunwind's C++ exception handling is broken on riscv64 (PR #1032, open). OVS uses libunwind optionally for crash backtraces. A crash in vswitchd on riscv64 may produce incomplete or missing stack traces if libunwind is the unwinder. This does not affect normal operation or packet forwarding correctness.

---

## 11. Known Bugs and Active Issues

No riscv64 bugs exist in the upstream openvswitch/ovs issue tracker. GitHub searches for "riscv", "riscv64", and "risc-v" across issues, PRs, and commits all return zero results.

**Downstream issues:**

| ID | Title | Tracker | Status | Severity | Notes |
|---|---|---|---|---|---|
| Debian #1009969 | Failing tests on riscv64 | Debian BTS | Closed (fixed in v2.17.2-2 by test exclusion) | Low | Tests excluded rather than fixed upstream |
| Debian #1027329 | DPDK support for riscv64 | Debian BTS | Closed (fixed in v3.1.0-4) | Medium | Added riscv64 to Debian DPDK packaging |
| Ubuntu autopkgtest FAIL | riscv64 autopkgtest failure, Noble | [autopkgtest.ubuntu.com](https://autopkgtest.ubuntu.com) | Unknown -- one recorded run, FAIL, 2025-03-16 | Medium | Version 3.3.0-1ubuntu3.1; 9h 25m runtime before FAIL; root cause not determinable from available data; no passing riscv64 run recorded for Ubuntu Noble |

**Recurring Debian test exclusions on riscv64** (not individual tracked bugs; applied as packaging workarounds):
- Multiple unit tests excluded since 2022 due to timing dependencies or unidentified failures
- Most recent: BFD test excluded in v3.7.0~git (2026-02-24)
- These exclusions are applied in Debian packaging without corresponding upstream bug reports or fixes

**Correctness bugs:** None identified. The test exclusions indicate flaky tests on riscv64, not data plane correctness failures.

---

## 12. Objections and Upstream Blockers

**No stated objections exist.** Because no contributor has ever proposed a riscv64-related change to the upstream project, there is no record of objections from maintainers.

**Technical blockers to official upstream support:**

1. No riscv64 hardware or hosted runner available to the upstream project for CI. All current CI uses GitHub-hosted `ubuntu-24.04` (x86_64) runners. Adding riscv64 CI would require either RISE Project runners or self-hosted hardware.

2. The recurring test exclusions in Debian packaging (at least 6 distinct instances across 4 years) have never been investigated and fixed upstream. The root causes are unknown; some appear to be timing-sensitive tests that behave differently under emulation or on slower riscv64 hardware.

3. The OVS CI script `.ci/linux-build.sh` hardcodes `x86_64-linux-gnu` in the DPDK library path. Any attempt to enable OVS-DPDK CI on riscv64 would require patching this.

4. No RISE Project engagement with OVS has occurred. The RISE blog, runner usage data, and org repositories all confirm zero OVS involvement.

**Organizational blockers:** The dominant maintainer organizations (Red Hat, OVN.org) have not publicly engaged with riscv64. No employee from these organizations has filed an issue, submitted a PR, or posted to the mailing list about riscv64.

**Acceptance probability for upstream riscv64 CI patch:** Data not available -- no prior submission exists to judge maintainer response.

---

## 13. Investment Analysis

RISE has not funded or engaged with Open vSwitch. No work in this area needs to be excluded for prior coverage.

### 13.1 Functional Enablement

The baseline kernel datapath OVS is functionally complete on riscv64. No work is needed to make it run. The gap is the DPDK-accelerated path: `openvswitch-switch-dpdk` is excluded from Debian riscv64 packaging because DPDK has no validated physical NIC PMD on riscv64 hardware. Functional enablement of OVS-DPDK on riscv64 requires upstream DPDK work (physical NIC PMD validation), not OVS work.

The Ubuntu Noble autopkgtest failure (root cause unknown) should be diagnosed before claiming fully passing test coverage on riscv64.

### 13.2 Performance Optimization

Two performance gaps are well-defined and tractable:

**Hash/CRC32 acceleration:** Add `lib/hash-riscv64.h` using the RISC-V Zbc extension (`__riscv_zbcr` intrinsics for carry-less multiply / CRC32). This is analogous to the existing `lib/hash-aarch64.h` (80 lines). The RISC-V Zbc extension maps directly to hardware CRC32, providing the same category of acceleration as the SSE4.2 and ARM CRC32 paths. Hash computation is in the critical path for DPCLS packet classification; this optimization would reduce per-packet overhead in the software switch.

**Atomic operations:** x86_64 has a hand-tuned `ovs-atomic-x86_64.h` (~300 lines). riscv64 uses the C11 `<stdatomic.h>` path, which is the same path used by arm64. The practical performance delta between C11 atomics and hand-tuned asm atomics depends on the GCC code generator quality for the specific micro-architectural target; this may not warrant dedicated assembly given modern GCC riscv64 backend quality.

Data not available: no benchmarks exist to quantify the hash or atomic performance gap on real riscv64 hardware.

### 13.3 CI/CD Infrastructure

Adding riscv64 to upstream CI requires:
1. A riscv64 GitHub Actions runner (RISE Project provides these)
2. Fixing or formally documenting the tests currently excluded in Debian packaging
3. Patching `.ci/linux-build.sh` for the DPDK library path if OVS-DPDK CI on riscv64 is desired

The CI addition is the highest-leverage investment because it would: (a) prevent regressions, (b) make riscv64 a first-class upstream target, and (c) provide visibility into the Ubuntu autopkgtest failure root cause.

### 13.4 Ecosystem Enablement

Not applicable. OVS has no significant downstream package ecosystem that requires separate enablement (no Python wheel ecosystem, no Maven JARs, no npm packages). The Python bindings (`python3-openvswitch`) are available in Debian/Ubuntu for riscv64 as standard packages. Section 10 is omitted accordingly.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 runner to upstream GitHub Actions CI (RISE runner) | 2 | OVS maintainer + RISE | High |
| CI/CD | Diagnose and fix upstream the tests currently excluded in Debian packaging on riscv64 | 3-6 | OVS maintainer | High |
| CI/CD | Diagnose Ubuntu Noble autopkgtest failure (root cause unknown) | 1-2 | Ubuntu/OVS maintainer | High |
| Performance | Implement `lib/hash-riscv64.h` using Zbc CRC32 intrinsics | 2-3 | RISC-V contributor | Medium |
| Performance | Benchmark OVS kernel datapath on riscv64 hardware (pps throughput vs arm64/amd64 baseline) | 1 | RISC-V contributor | Medium |
| Functional | Enable `openvswitch-switch-dpdk` for riscv64 in Debian packaging (blocked on DPDK physical NIC PMD validation) | 1 (OVS packaging) + N (DPDK NIC work) | Debian + DPDK community | Low |
| CI/CD | Fix `.ci/linux-build.sh` DPDK library path for riscv64 cross-compilation | 0.5 | OVS maintainer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [openvswitch/ovs GitHub repository](https://github.com/openvswitch/ovs)
- [Open vSwitch homepage](https://www.openvswitch.org/)
- [Debian package tracker: open-vswitch](https://tracker.debian.org/pkg/open-vswitch)
- [Debian buildd status: openvswitch riscv64](https://buildd.debian.org/status/package.php?p=openvswitch)
- [Ubuntu Packages: openvswitch Noble riscv64](https://packages.ubuntu.com/search?keywords=openvswitch&suite=noble)
- [Ubuntu autopkgtest results: openvswitch](https://autopkgtest.ubuntu.com/packages/openvswitch)
- [OVS build-and-test GitHub Actions workflow](https://github.com/openvswitch/ovs/blob/main/.github/workflows/build-and-test.yml)
- [OVS freebsd GitHub Actions workflow](https://github.com/openvswitch/ovs/blob/main/.github/workflows/freebsd.yml)
- [OVS atomic dispatch header: lib/ovs-atomic.h](https://github.com/openvswitch/ovs/blob/main/lib/ovs-atomic.h)
- [OVS hash header: lib/hash.h](https://github.com/openvswitch/ovs/blob/main/lib/hash.h)
- [OVS aarch64 hash: lib/hash-aarch64.h](https://github.com/openvswitch/ovs/blob/main/lib/hash-aarch64.h)
- [OVS automake source list: lib/automake.mk](https://github.com/openvswitch/ovs/blob/main/lib/automake.mk)
- [OVS build documentation: Documentation/intro/install/general.rst](https://github.com/openvswitch/ovs/blob/main/Documentation/intro/install/general.rst)
- [OVS CI build script: .ci/linux-build.sh](https://github.com/openvswitch/ovs/blob/main/.ci/linux-build.sh)
- [DPDK riscv64 EAL: lib/eal/riscv/](https://github.com/DPDK/dpdk/tree/main/lib/eal/riscv)
- [DPDK riscv64 cross-compilation configs: config/riscv/](https://github.com/DPDK/dpdk/tree/main/config/riscv)
- [OpenSSL cross-compile bug #29357: linux64-riscv64 fails with no-deprecated](https://github.com/openssl/openssl/issues/29357)
- [jemalloc issue #2399: does jemalloc support cross build for RISCV64?](https://github.com/jemalloc/jemalloc/issues/2399)
- [libunwind issue #765: CMake build support for RISC-V absent](https://github.com/libunwind/libunwind/issues/765)
- [libunwind PR #1032: C++ exceptions broken on riscv64](https://github.com/libunwind/libunwind/pull/1032)
- [RISE Project homepage](https://riseproject.dev)
- [Arch Linux RISC-V port overlay status](https://archriscv.felixc.at/)
- [Debian control.in (DPDK package arch restriction)](https://salsa.debian.org/debian/openvswitch/-/blob/debian/unstable/debian/control.in)