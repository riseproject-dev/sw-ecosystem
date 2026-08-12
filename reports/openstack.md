---
title: OpenStack
categories:
  - containers
  - iaas
---

# OpenStack

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenStack<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

OpenStack is an open-source cloud infrastructure platform providing compute (Nova), networking (Neutron), storage (Cinder/Swift), image management (Glance), identity (Keystone), and bare-metal provisioning (Ironic) services. It is the dominant open-source private cloud IaaS stack. The project is governed by the OpenInfra Foundation (OIF) under Apache 2.0 license. Development is managed through an elected Technical Committee (TC), Project Teams with elected PTLs, SIGs, and Working Groups.

Repository: [opendev.org/openstack](https://opendev.org/openstack) (1,342 repositories)<br/>
Homepage: [openstack.org](https://www.openstack.org/)<br/>
Latest release: 2026.1 Gazpacho (released 2026-04-01); maintained releases also include 2025.2 Flamingo and 2025.1 Epoxy.<br/>
Language: Python (dominant); no compiled C/C++ components in core services.<br/>

Corporate governance: Platinum OIF members include Ant Group, Cachengo, Ericsson, Huawei, OKESTRO, Rackspace, Viettel, and Wind River. Gold members include Canonical, Red Hat, and ZTE Corporation. ZTE is relevant to this report as the employer of the author of the most recent open Nova RISC-V patch.

---

## 2. Port History and Upstreaming Timeline

All five RISC-V-related patches ever submitted to OpenStack are listed below in chronological order.

| Date | Patch | Title | Status |
|---|---|---|---|
| 2022-01-13 merged | [nova-specs#824044](https://review.opendev.org/c/openstack/nova-specs/+/824044) | Blueprint spec: pick guest CPU arch based on host arch | Merged (Yoga, released 2022-03-30) |
| 2022-02-24 merged | [nova#822053](https://review.opendev.org/c/openstack/nova/+/822053) | Implements blueprint: adds RISCV64 to architecture enum, inserts TODO in driver.py | Merged (Yoga, released 2022-03-30) |
| 2023-07-20 opened | [nova#889137](https://review.opendev.org/c/openstack/nova/+/889137) | Add RISCV64 QEMU emulation support (functional implementation) | Open, stalled since 2025-02-28 |
| 2026-04-30 opened | [nova#986752](https://review.opendev.org/c/openstack/nova/+/986752) | Add compatibility for nova with RISC-V architecture (smaller attempt) | Open, Code-Review -1 |
| 2026-05-11 merged | [ironic#987460](https://review.opendev.org/c/openstack/ironic/+/987460) | Document provisioning a riscv machine | Merged (2026.2 Hibiscus, est. 2026-09-30) |

**Narrative:** The Yoga-era blueprint ([nova#822053](https://review.opendev.org/c/openstack/nova/+/822053)) introduced `RISCV64` to the architecture enum in `nova/objects/fields.py` and immediately inserted a `TODO(chateaulav)` comment in `nova/virt/libvirt/driver.py` stating: *"re-evaluate when libvirtd adds overall RISCV support as a supported architecture, as there is no cpu models associated."* This was authored by Jonathan Race of Augusta University and approved by sean mooney (Red Hat) and Balazs Gibizer (Red Hat). The blueprint established intent but deferred all functional work.

The functional follow-on patch ([nova#889137](https://review.opendev.org/c/openstack/nova/+/889137)) was opened in July 2023 by Felipe Reyes (Canonical) and later shepherded by James Page (Canonical). It went through 12 revisions over approximately 18 months. Its last activity was 2025-02-28. As of mid-2026 it has been idle for over 17 months, requires a rebase against current master, and carries a Verified -1 from Zuul CI. The primary reviewer, sean mooney, gave a Code-Review -1 on the most recent revision requiring a formal blueprint to be filed. James Page acknowledged this requirement; no blueprint has been filed since.

The most recent open patch ([nova#986752](https://review.opendev.org/c/openstack/nova/+/986752)) was submitted by chenker (ZTE, chen.ke14@zte.com.cn) in April 2026. It is a smaller, less complete attempt that also carries a Code-Review -1 from sean mooney for the same reason (no blueprint filed), plus a Zuul CI failure, and the implementation error of not adding RISCV64 to the `ALL` tuple in `nova/virt/arch.py`. There has been no new revision since May 2026.

The only successfully merged RISC-V content in 2026 is a four-line documentation patch to Ironic ([ironic#987460](https://review.opendev.org/c/openstack/ironic/+/987460)) adding `riscv64:grubriscv64.efi` to the PXE bootfile-by-arch documentation example. The Ironic reviewer (Julia Kreger) noted in her approval comment that riscv64 lacks a standardized EFI implementation. The patch author (Kaifeng Wang) replied post-merge that his team is running an Ironic bare-metal provisioning proof-of-concept on virtual machines and hopes to test on real hardware by end of 2026 [NEEDS VERIFICATION for the "by end of 2026" target date -- sourced from a post-merge Gerrit comment by the patch author, not an official roadmap].

**First committed RISC-V content:** 2022-02-24, nova#822053 (architecture enum stub only).<br/>
**Most recent upstream RISC-V activity:** 2026-05-11, ironic#987460 merged (docs only).

---

## 3. Upstream Support Tier

OpenStack publishes a Nova Feature Support Matrix at [docs.openstack.org](https://docs.openstack.org). The documented supported compute architectures for the libvirt driver are: x86 (KVM), aarch64/ARM64 (KVM), ppc64/PowerPC (KVM), and s390x/IBM Z (KVM). RISC-V is not listed.

OpenStack has no published formal policy specifically governing new CPU architecture port tiers. In practice, architecture support requires: (1) CI infrastructure (nodepool nodes) donated or funded by a supporting organization, (2) a project team or SIG willing to maintain the port, and (3) TC approval for cross-cutting changes. Existing non-x86 architectures were added through corporate-sponsored CI nodes (IBM for s390x, etc.). For riscv64 to be added, a corporate sponsor would need to donate RISC-V CI nodes to the OpenDev nodepool and champion a SIG or Working Group effort.

**Current status: unsupported.** RISC-V is not on the Feature Support Matrix. No formal commitment or stated timeline from the TC or any Project Team exists.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

OpenStack is a Python-dominant platform. Core services (Nova, Neutron, Keystone, Glance, Cinder, Swift, Ironic) contain no architecture-specific assembly, no JIT backends, no SIMD dispatch, and no `arch/riscv/` directories. The RISC-V surface area is confined to three locations.

**4.1 Nova libvirt driver -- architecture enum**

File: `nova/objects/fields.py`<br/>
`RISCV64 = arch.RISCV64` is present in the merged Yoga release, introduced by nova#822053.

File: `nova/virt/arch.py`<br/>
The `RISCV64` constant and its inclusion in the `ALL` tuple are proposed in unmerged patch [nova#889137](https://review.opendev.org/c/openstack/nova/+/889137) but are absent from current master. The adversarial verification confirmed that the `ALL` tuple on master does not contain `RISCV64`.

**4.2 Nova libvirt driver -- TODO stub**

File: `nova/virt/libvirt/driver.py`, lines 5991-5993:<br/>
```
# TODO(chateaulav): re-evaluate when libvirtd adds overall RISCV support
# as a supported architecture, as there is no cpu models associated
```
This comment is the functional state of RISC-V in Nova's libvirt driver on current master. No code path executes for riscv64 guests.

**4.3 Nova libvirt driver -- proposed QEMU emulation path (unmerged)**

Patch [nova#889137](https://review.opendev.org/c/openstack/nova/+/889137) proposes the following functional additions, none of which are in master:

- `nova/virt/arch.py`: `RISCV64 = 'riscv64'` added to the constant list and to the `ALL` tuple.
- `nova/objects/fields.py`: `RISCV64 = arch.RISCV64` added to the Architecture enum.
- `nova/virt/libvirt/utils.py`: `obj_fields.Architecture.RISCV64: "virt"` added to the machine type lookup dictionary.
- `nova/virt/libvirt/driver.py`: An `elif arch == fields.Architecture.RISCV64: cpu = None` branch added to the emulation dispatch.
- Object version bumps: `nova/objects/image_meta.py` to version 1.40, `nova/objects/hv_spec.py` to 1.3, `nova/objects/vcpu_model.py` to 1.1, each with `obj_make_compatible` guards for riscv64.
- Documentation: `doc/source/admin/hw-emulation-architecture.rst` updated to include RISCV64 as "Tested and validated as functional" with the required image properties (`hw_machine_type=virt`, `hw_video_model=virtio`, `kernel_id=$QEMU_RISCV64_UBOOT_IMAGE`).

The documentation section in the patch says "Tested and validated as functional," but the patch has never passed CI and has never merged. That claim should be treated as an assertion by the patch author, not a verified upstream fact.

**4.4 Nova libvirt driver -- missing native host support**

No patch has been submitted for native riscv64 host support (i.e., running a riscv64 Nova compute node with KVM acceleration). The TODO comment in driver.py explicitly states this is blocked on libvirt upstream adding CPU model support for RISC-V. No timeline for libvirt upstream support is available in the research findings.

**4.5 Ironic bare-metal provisioning**

File: `ironic/doc/source/install/configure-pxe.rst`<br/>
Configuration example shows `riscv64:grubriscv64.efi` as the bootfile and `riscv64:pxe_riscv64_config.template` as the PXE template. These are operator-supplied configuration values; Ironic itself contains no riscv64-specific Python code. Ironic is architecture-agnostic by design: the framework provisions whatever hardware the operator configures. The merged patch added documentation; the grub EFI binary and PXE template must be supplied by the deployer.

Julia Kreger (Ironic core reviewer) noted on merge that riscv64 lacks a standardized EFI implementation, which is a practical barrier to real-hardware deployment.

**4.6 Absent features**

Confirmed absent from OpenStack on riscv64:
- No `arch/riscv/` directory in any OpenStack repository.
- No `.S` assembly files.
- No RISCV64 constant in `nova/virt/libvirt/machine_type_utils.py` SUPPORTED_TYPE_PATTERNS.
- No RISC-V branch in `nova/virt/hardware.py`.
- No RISC-V entries in Glance image format handling.
- No riscv64-specific logic in nova/virt/libvirt/utils.py `get_default_machine_type()` on master.

---

## 5. Build System, Cross-Compilation, and Toolchain

OpenStack has no C/C++ build system. All services are pure Python. There are no cmake or autoconf build systems, no GCC or Clang minimum version requirements stated anywhere, no `-DUSE_X=OFF` flags, and no riscv64-specific Dockerfiles in any OpenStack repository.

**Container image builds (Kolla):**

[opendev.org/openstack/kolla](https://opendev.org/openstack/kolla) builds OpenStack service container images. The `kolla/common/config.py` `BASE_ARCH` list accepts only `x86_64` and `aarch64`. The `--base-arch` parameter does not accept `riscv64`. No riscv64 conditional blocks exist in the Dockerfile base template (`docker/base/Dockerfile.j2`). Kolla does not officially support riscv64 image builds.

**Multi-architecture Docker role (zuul-jobs):**

The Zuul `build-docker-image` role (`roles/build-docker-image/common.rst` in [opendev.org/zuul/zuul-jobs](https://opendev.org/zuul/zuul-jobs)) documents `linux/riscv64` as a valid value for the `arch` variable. This is a documentation listing of valid Docker buildx platform strings, not an active CI job or provisioned nodepool label. QEMU user-static binfmt emulation is used on x86_64 hosts for multi-arch builds. No OpenStack project has a Zuul job definition that passes `linux/riscv64` to this role.

**Python toolchain:** The only build requirement for OpenStack services is Python >= 3.8. Python riscv64 is available on Debian and Ubuntu (see Section 9).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

The following table compares riscv64 against x86_64 and aarch64 for Nova compute functionality.

| Feature | x86_64 | aarch64 | riscv64 |
|---|---|---|---|
| KVM hardware virtualization | Yes | Yes | No (no riscv64 KVM host support in Nova) |
| QEMU TCG software emulation of guests | Yes | Yes | No (unmerged patch #889137) |
| Guest architecture enumerated in Nova | Yes | Yes | Partial (in fields.py on master, absent from arch.py ALL tuple) |
| Machine type lookup in libvirt utils | Yes | Yes | No (unmerged) |
| CPU model selection | Yes | Yes | No (explicitly deferred in TODO comment) |
| Image metadata documentation for emulation | Yes | Yes | No (unmerged) |
| Bare-metal provisioning via Ironic | Yes | Yes | Documentation only (no EFI standard) |
| Listed in Nova Feature Support Matrix | Yes | Yes | No |
| CI coverage | Yes | Yes | No |

riscv64 has no functional Nova compute capability in current master. A deployed riscv64 Nova compute node would have no code path to spawn VMs, whether via KVM or QEMU emulation.

---

## 7. CI/CD Infrastructure

**OpenDev CI (Zuul/Nodepool):**

Zero riscv64 CI infrastructure exists in OpenDev. This was verified by direct inspection of the following files with no riscv64 content:
- `openstack/openstack-zuul-jobs/zuul.d/jobs.yaml` -- arm64 and x86 jobs only
- `openstack/openstack-zuul-jobs/zuul.d/nodesets.yaml` -- no riscv64 labels
- `openstack/kolla/zuul.d/nodesets.yaml` -- arm64 nodesets only (`centos-10-stream-arm64-8GB`, `debian-trixie-arm64-8GB`, `ubuntu-noble-arm64-8GB`, etc.)
- `opendev/system-config` -- zero riscv64 search results
- `zuul/zuul-jobs` -- one riscv64 mention in documentation only (see Section 5)

The currently active CI node types for alternate architectures are ubuntu-jammy-arm64, ubuntu-noble-arm64, debian-bookworm-arm64, debian-trixie-arm64-8GB, and centos-9-stream-arm64. No riscv64 equivalent exists.

**RISE RISC-V Runners:**

RISE launched free native riscv64 GitHub Actions runners in March 2026 (Scaleway EM-RV1 hardware, Ubuntu 24.04). As of May 2026, 13,000+ CI jobs had completed across 197 repositories from 87 organizations. OpenStack is not among the listed users and has not adopted the RISE runners.

The Scaleway EM-RV1 kernel (5.10.x vendor kernel) does not support KVM virtualization, which is directly relevant: even if OpenStack Nova adopted RISE runners for CI, it could not gate Nova's libvirt/KVM paths on that hardware.

**Zuul CI failures on open patches:**

Both open Nova patches fail Zuul CI. Patch [nova#889137](https://review.opendev.org/c/openstack/nova/+/889137) fails `nova-grenade-multinode`, `nova-lvm`, `nova-next`, and `nova-multi-cell`. Patch [nova#986752](https://review.opendev.org/c/openstack/nova/+/986752) fails `nova-multi-cell`. These failures are on existing x86_64 CI infrastructure and are not related to riscv64 test nodes -- the patches fail standard gating before any riscv64 testing would be relevant.

---

## 8. Distribution and Release Status

OpenStack is distributed as Python source packages. All core service packages (`python3-nova`, `python3-neutron`, `python3-keystone`, etc.) are marked `Architecture: all` in Debian and Ubuntu, meaning they are platform-independent and installable on any architecture for which the base Python runtime is available.

**PyPI:** All OpenStack wheels carry the `py3-none-any` platform tag. No riscv64-specific wheel exists or is needed. There are no compiled extensions in core OpenStack services.

**Debian sid:** `python-openstacksdk` version 4.10.0-2 is `Architecture: all`, built once on a single host and installable on riscv64 without a dedicated riscv64 build. Nova version 2:33.0.1-2 on Debian shows no riscv64 buildd entry; this is correct behavior for `arch: all` packages. No riscv64-native OpenStack binary exists in Debian.

**Ubuntu 24.04 noble:** 24 packages with "openstack" in the name are available. The vast majority are `Architecture: all`. The architecture-specific packages (`openstack-debian-images`, `openstack-debian-images-build-farm`, `openstack-debian-images-updater`) support only amd64, arm64, and ppc64el -- riscv64 is absent from those packages. Ubuntu 24.04 noble added riscv64 as a ports architecture; `arch: all` OpenStack packages are theoretically installable if the riscv64 Python runtime is present.

**openEuler RISC-V SIG:** The only known downstream porting effort is the openEuler RISC-V SIG's packaging of OpenStack Antelope for openEuler 24.03 LTS riscv64. GitHub issue [openeuler-riscv/oerv-team#1944](https://github.com/openeuler-riscv/oerv-team/issues/1944) (opened 2025-07-03) is a task ticket for testing OpenStack Antelope on openEuler 24.03 riscv64 with two riscv64 machines on the same LAN; no results have been posted. Issue [#1893](https://github.com/openeuler-riscv/oerv-team/issues/1893) (closed 2025-06-25) documents that `python-sphinx` (a build-time dependency) failed to build on all four architectures in the OpenStack:Antelope and OpenStack:Wallaby OBS targets; this was resolved. This represents the entire documented correctness work for OpenStack on riscv64 outside upstream.

**Arch Linux RISC-V:** No riscv64-specific patch exists in the `felixonmars/archriscv-packages` patch overlay for OpenStack. Since OpenStack packages are pure Python, no patch is expected to be required.

**RISE wheel builder:** OpenStack is not present in the RISE wheel builder index. This is expected given that OpenStack ships no C extensions.

---

## 9. Dependencies

The following table covers critical OpenStack dependencies and their riscv64 status. Status ratings use: Green (builds, tests, releases available), Yellow (builds but known issues or gaps), Red (blocking). Cross-references to existing reports in this project are noted.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Python (CPython) | Primary runtime | Green | Yellow | Green (Debian sid: python3.13; Ubuntu 24.04: python3 3.12.3) | No JIT; perf trampoline disabled; 3.15 beta stack-unwinding regressions (#150919, #151040). See `reports/python.md`. |
| OpenSSL | TLS/crypto for all HTTPS | Green | Yellow (QEMU only; SSL test hang at high parallelism: issue #22166) | Green (Debian trixie: openssl 3.5.6-1; sid: 3.6.3-1) | AES T-table not constant-time on hardware without Zkn/Zvkned (PRs #31080/#31082 open, unmerged). See `reports/openssl.md`. |
| glibc | Foundational C runtime | Green | Yellow | Green (Debian/Ubuntu/Arch ship current versions) | SIGILL in `__memset_vector` when RVV disabled via `prctl()` (BZ #32932). See `reports/glibc.md`. |
| libvirt | Nova compute driver interface | Green (Debian sid: libvirt 12.3.0-1 Installed on rv-osuosl-02) | Yellow | Green (Debian sid Installed) | KVM/hardware virtualization unavailable on most riscv64 boards; Nova libvirt driver is functional only for QEMU TCG emulation on riscv64. |
| QEMU | Software emulation backend | Green (Debian sid: qemu 1:11.0.1+ds-1 Installed) | Green | Green (Debian sid Installed) | No QEMU-level blockers; primary usable compute backend on riscv64. |
| PostgreSQL | Primary production RDBMS | Green (Debian trixie: 17.10-0+deb13u1 Installed) | Yellow (no upstream riscv64 CI; Debian buildd only) | Green (Debian trixie has riscv64; sid shows no entry -- architecture-specific exclusion, not a build failure) | No upstream riscv64 CI; sid exclusion may reflect lack of explicit arch support declaration. |
| MariaDB | Alternative RDBMS backend | Green (Debian sid: mariadb 1:11.8.8-1 Installed) | Yellow (Debian buildd only) | Green (Debian sid Installed) | Oracle MySQL has no official riscv64 packaging; riscv64 deployments require distro-built MariaDB. |
| RabbitMQ | Default message broker (oslo.messaging) | Green (arch: all; runs on any Erlang/OTP) | Yellow (QEMU-emulated Erlang) | Green (Debian sid: rabbitmq-server 4.3.2-2 arch: all) | Depends on Erlang OTP riscv64 (see below). |
| Erlang/OTP | RabbitMQ runtime | Green (Debian sid: erlang 1:29.0.2+dfsg-1 Installed on rv-manda-04) | Green | Green (Debian sid Installed) | None identified. |
| Memcached | Session/object caching (oslo.cache) | Green (Debian sid: memcached 1.6.42-1 Installed) | Green | Green (Debian sid Installed) | None identified. |
| Open vSwitch | Virtual networking for Neutron | Green (Debian sid: openvswitch 3.7.1-3 Installed on rv-osuosl-05) | Yellow (no upstream riscv64 CI) | Green (Debian sid Installed) | None identified. |
| Ceph | Object and block storage backend | Green (Debian sid: ceph 18.2.8+ds-2.1 Installed on rv-osuosl-02) | Yellow (no upstream riscv64 CI) | Green (Debian sid Installed) | Open FTBFS bug #1092838 with fmtlib 11.1 affects all architectures, not riscv64-specific. See `reports/ceph.md`. |
| SQLite | Backend for Oslo services | Green (Debian sid: sqlite3 3.53.2-1 Installed on rv-osuosl-02) | Green | Green | None identified. |
| greenlet | Low-level coroutine library (eventlet dependency) | Yellow (C extension; riscv64 not in greenlet CI matrix) | Yellow (no riscv64 CI) | Yellow (no riscv64 wheel on PyPI; distro-built only) | C extension must be compiled from source on riscv64. [NEEDS VERIFICATION: whether manylinux riscv64 wheel infrastructure added Aug 2025 has been used to publish greenlet riscv64 wheels.] |
| cryptography (PyCA) | TLS/crypto Python binding (keystoneauth1, oslo.utils) | Green (RISE runners active per RISE blog May 2026) | Green (RISE CI on native riscv64) | Yellow (not on PyPI riscv64; available via RISE wheel index at gitlab.com/api/v4/projects/56254198/packages/pypi/simple) | Depends on OpenSSL AES gap noted above. |
| lxml | XML processing (Nova API, Oslo) | Yellow (C extension; requires libxml2-dev and libxslt-dev) | Yellow (no riscv64 CI) | Yellow (no riscv64 wheel on PyPI; compile from source) | Build requires libxml2/libxslt development headers; both available in Debian. |
| libffi | ctypes backend; Python `_ctypes` module | Yellow (builds; open riscv64 issues) | Yellow (test failure: struct-by-value ABI test on riscv64, libffi#281; linkage failure open since Apr 2023) | Green (Debian ships riscv64 libffi) | [libffi#281](https://github.com/libffi/libffi/issues/281): struct ABI test failure; linkage failure open since 2023; affects Python `ctypes` on riscv64. |
| Go | Used in kolla, Prometheus exporters, adjacent services | Green (linux/riscv64 secondary port since Go 1.14) | Yellow (secondary port; build failures do not block releases) | Green (official Go releases include linux/riscv64) | No JIT for riscv64; secondary port means no release-blocking guarantee. See `reports/go.md`. |
| SQLAlchemy | ORM for all database-backed services | Green (pure Python; optional C extensions) | Yellow (no riscv64 CI) | Green (pure-Python wheel on PyPI) | Optional C extensions may lack riscv64 wheels; core pure-Python mode works. |
| eventlet | Async networking (core OpenStack concurrency model) | Green (pure Python) | Yellow (no riscv64 CI; depends on greenlet C extension) | Green (PyPI pure-Python wheel) | Python riscv64 has no JIT; greenlet C extension has wheel gap (see above). |

**Go** status report: `runtimes/go.md`<br/>
**Python** status report: `runtimes/python.md`<br/>
**OpenSSL** status report: `reports/openssl.md`<br/>
**glibc** status report: `reports/glibc.md`<br/>
**Ceph** status report: Data not available: report file `software-defined-storage/ceph.md` is listed in the project README scope but was noted as not yet written at the time of research.

---

## 10. Ecosystem Status

**RISE Project:** OpenStack is not a RISE member and is not a RISE-funded project. A complete traversal of all 27 published RISE blog posts (May 2024 through June 2026) found zero mentions of OpenStack. OpenStack is not present in the RISE wheel builder package index. RISE Premier members include Alibaba DAMO Academy, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent. RISE General members include Canonical, ZTE Corporation, SpacemiT, BOSC, and ISCAS. ZTE is a RISE General member and also the employer of the author of nova#986752, but no formal RISE project funding for OpenStack riscv64 work is documented.

**Community mailing lists:** OpenStack mailing list search (lists.openstack.org) returned zero riscv64-related threads. No public community discussion about RISC-V support was found.

**Launchpad bug tracker:** Zero results for "riscv" on both bugs.launchpad.net/nova and bugs.launchpad.net/openstack.

**Governance:** No TC resolutions, SIG charters, or governance goals referencing riscv64 were found on governance.openstack.org.

**openEuler RISC-V SIG:** The most active downstream effort. Packaging OpenStack Antelope for openEuler 24.03 LTS riscv64. Activity level is low: one open testing task with no results posted, one closed build dependency fix (python-sphinx), one closed OBS packaging task. No VM functional test results or production deployment data exist from this effort.

**Benchmark data:** None found. There are zero published benchmark results for OpenStack running on riscv64. No VM boot time measurements, API throughput figures, or comparative performance data (riscv64 vs arm64 vs x86_64) exist in any publicly accessible source as of June 2026.

---

## 11. Known Bugs and Active Issues

**Upstream OpenStack bugs against riscv64:** Zero. No bugs are filed on Launchpad, Storyboard, or GitHub for riscv64 issues in any OpenStack component.

**Open patches (not bugs):**

1. [nova#889137](https://review.opendev.org/c/openstack/nova/+/889137) -- Add RISCV64 QEMU emulation support. Open since 2023-07-20, stalled since 2025-02-28, not rebased, CI failing, no blueprint filed. 12 revisions over approximately 18 months.

2. [nova#986752](https://review.opendev.org/c/openstack/nova/+/986752) -- Add compatibility for nova with RISC-V architecture. Open since 2026-04-30, Code-Review -1 from sean mooney, CI failing, no blueprint filed, RISCV64 not added to ALL tuple in arch.py.

**Downstream (openEuler) issues:**

- [openeuler-riscv/oerv-team#1944](https://github.com/openeuler-riscv/oerv-team/issues/1944) (open, 2025-07-03): Testing OpenStack Antelope on openEuler 24.03 riscv64. No results published.
- [openeuler-riscv/oerv-team#1905](https://github.com/openeuler-riscv/oerv-team/issues/1905) (closed, 2025-07-03): Adapt openstack-kolla for Antelope branch on RISC-V OBS. Resolved.
- [openeuler-riscv/oerv-team#1893](https://github.com/openeuler-riscv/oerv-team/issues/1893) (closed, 2025-06-25): python-sphinx build failures in Antelope and Wallaby on all four architectures in OBS. Resolved.

**Dependency-level bugs with direct OpenStack impact:**

- libffi#281: struct-by-value ABI test failure on riscv64; linkage failure open since April 2023. Affects Python `ctypes`, which is used by oslo.utils and other OpenStack libraries.
- OpenSSL AES T-table constant-time gap (PRs #31080/#31082, open, unmerged): On hardware without Zkn/Zvkned extensions, AES operations in OpenSSL are not constant-time. Every OpenStack service that handles TLS is affected on current commodity riscv64 silicon.
- Python 3.15 stack-unwinding regressions (issues #150919 and #151040): If not resolved before Python 3.15.0 final, distributions shipping 3.15 on riscv64 will have broken stack introspection for OpenStack service processes.

---

## 12. Objections and Upstream Blockers

**12.1 No blueprint filed**

The Nova core reviewer (sean mooney, Red Hat) has applied Code-Review -1 to both open riscv64 patches requiring a formal blueprint to be filed and discussed at a Nova team meeting before the change can proceed. This is a standard Nova process requirement for new architecture additions. Neither the Canonical team (nova#889137) nor the ZTE contributor (nova#986752) has filed the required blueprint. Until a blueprint is filed and accepted at a Nova team meeting, no code changes for riscv64 QEMU emulation will merge.

**12.2 Libvirt upstream does not support riscv64 CPU models**

The TODO comment introduced in 2022 (nova#822053) explicitly defers native riscv64 host support until libvirt upstream adds CPU model support for RISC-V. No patch to libvirt for riscv64 CPU model support is documented in the research findings. This blocks Nova libvirt driver support for riscv64 compute hosts running guests with KVM acceleration.

**12.3 No riscv64 CI nodes in OpenDev**

OpenDev's Zuul/Nodepool infrastructure has no riscv64 node labels. Verification was performed by direct inspection of `opendev/system-config`, `openstack/openstack-zuul-jobs`, and `openstack/kolla` zuul configuration files. Any new riscv64 Nova CI jobs would require a corporate sponsor to donate riscv64 hardware or cloud capacity to OpenDev. No such commitment is documented.

**12.4 No riscv64 EFI standard for Ironic**

The Ironic reviewer (Julia Kreger) noted on the merge of ironic#987460 that riscv64 lacks a standardized EFI implementation. This is a fundamental barrier to real-hardware bare-metal provisioning via Ironic on riscv64. The patch author stated their team is doing POC work on virtual machines and hopes to test on real hardware by end of 2026, but this is unconfirmed.

**12.5 KVM hardware virtualization absent on riscv64**

The RISE riscv64 CI hardware (Scaleway EM-RV1) runs a 5.10.x vendor kernel without KVM support. Even if OpenStack Nova CI were ported to use RISE runners, the Nova libvirt/KVM compute path could not be tested on that hardware. Nova compute on riscv64 would be limited to QEMU TCG software emulation, which is unsuitable for production workloads.

**12.6 Kolla does not support riscv64**

`kolla/common/config.py` accepts only `x86_64` and `aarch64` as `BASE_ARCH` values. OpenStack container image builds for riscv64 are not supported through the official Kolla toolchain.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The minimum work to enable riscv64 QEMU emulation of VMs in Nova is contained in existing patch [nova#889137](https://review.opendev.org/c/openstack/nova/+/889137). The implementation is complete in terms of code coverage (enum, machine type, driver dispatch, object versioning, documentation, release note). The blockers are process and CI failures, not missing implementation. The required steps are:

1. File a Nova blueprint at blueprints.launchpad.net/nova and present it at a Nova team meeting.
2. Rebase nova#889137 against current master (needed; the patch is not mergeable).
3. Fix the Zuul CI failures on the patch (nova-grenade-multinode, nova-lvm, nova-next, nova-multi-cell).
4. Optionally: consolidate or supersede with nova#986752 (the ZTE patch is less complete and would need to be either abandoned or merged into the Canonical effort).

For native riscv64 host support (KVM), the work is blocked by libvirt upstream and represents a longer-horizon effort with external dependencies outside OpenStack's control.

For Ironic bare-metal, the documentation is merged. Physical hardware deployment requires a working riscv64 EFI ecosystem, which is an external dependency. A UEFI-compatible riscv64 platform with BMC and Redfish support does not exist in a standardized form as of mid-2026 per the Ironic reviewer's comment.

### 13.2 Performance Optimization

No benchmark data exists for OpenStack on riscv64. No performance optimization work is possible without first achieving functional deployability. OpenStack is Python; compute-path performance bottlenecks are primarily in the hypervisor (QEMU, libvirt, KVM) rather than in OpenStack's Python control plane. The relevant performance investments are in QEMU and libvirt, not in OpenStack itself.

The OpenSSL AES constant-time gap (PRs #31080/#31082) affects TLS-heavy OpenStack components (Keystone, Swift). This is tracked in `reports/openssl.md` and represents a security-relevant performance issue on current commodity riscv64 hardware.

### 13.3 CI/CD Infrastructure

Zero riscv64 CI capacity exists in OpenDev. To gate Nova riscv64 changes, a sponsor must donate riscv64 nodepool nodes to OpenDev. The historical precedent for other architectures (IBM donating s390x nodes) shows this is the required path. RISE RISC-V Runners (Scaleway EM-RV1, Ubuntu 24.04) are free and available, but OpenStack uses Zuul CI (not GitHub Actions), and adopting RISE runners would require integration work. Additionally, the EM-RV1 hardware cannot run KVM, limiting what Nova functionality could be gated.

### 13.4 Ecosystem Enablement

OpenStack's Python service packages are architecture-neutral and install on riscv64 without modification. The functional gap is entirely in the Nova libvirt driver and the absence of CI infrastructure. The C-extension Python dependency gap (`greenlet`, `lxml`, `libffi`) must be resolved for full deployability on riscv64.

ZTE Corporation is both a RISE General member and the employer of the author of nova#986752. Canonical (a RISE General member) has the most advanced implementation in nova#889137. Coordination between these two contributors to consolidate behind a single blueprint and patch would accelerate the path to merge.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | File Nova blueprint for riscv64 QEMU emulation and present at Nova team meeting | 1 | Any contributor with Canonical or ZTE backing | Critical |
| Functional | Rebase nova#889137 against current master | 1 | Canonical (James Page or successor) | Critical |
| Functional | Fix Zuul CI failures on nova#889137 (nova-grenade-multinode, nova-lvm, nova-next, nova-multi-cell) | 2-4 | Canonical / sponsor | Critical |
| Functional | Resolve nova#986752 (abandon or merge into nova#889137) | 1 | ZTE / Canonical coordination | High |
| Functional | File libvirt upstream issue/patch for riscv64 CPU model support (required for native host KVM) | Unknown -- external dependency | Red Hat (libvirt maintainer) or silicon vendor | High (long horizon) |
| CI/CD | Donate riscv64 nodepool nodes to OpenDev for Nova CI | Unknown -- infrastructure commitment | Silicon vendor or cloud provider | Critical (nothing else gates without this) |
| CI/CD | Add riscv64 node labels to openstack-zuul-jobs once nodepool nodes exist | 1-2 | OpenStack infra team with sponsor | High |
| CI/CD | Add riscv64 support to Kolla (BASE_ARCH list, Dockerfile conditionals) | 2-4 | Canonical or sponsor | Medium |
| Ecosystem | Fix greenlet riscv64 wheel gap (C extension; no riscv64 wheel on PyPI) | 2-3 | eventlet/greenlet maintainers or sponsor | High |
| Ecosystem | Fix lxml riscv64 wheel gap | 1-2 | lxml maintainers or sponsor | Medium |
| Ecosystem | Resolve libffi#281 (struct-by-value ABI test failure, linkage failure on riscv64) | 3-5 | libffi maintainers or sponsor | High |
| Performance Optimization | No work possible until functional deployment is achieved | N/A | N/A | Low (deferred) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [opendev.org/openstack](https://opendev.org/openstack) -- OpenStack project repository host
- [nova#822053](https://review.opendev.org/c/openstack/nova/+/822053) -- Merged Yoga patch: RISCV64 architecture enum and TODO stub (2022-02-24)
- [nova-specs#824044](https://review.opendev.org/c/openstack/nova-specs/+/824044) -- Merged Yoga spec: pick guest CPU arch based on host arch (2022-01-13)
- [nova#889137](https://review.opendev.org/c/openstack/nova/+/889137) -- Open (stalled): Add RISCV64 QEMU emulation support, Canonical (2023-07-20)
- [nova#986752](https://review.opendev.org/c/openstack/nova/+/986752) -- Open (CR -1): Add compatibility for nova with RISC-V architecture, ZTE (2026-04-30)
- [ironic#987460](https://review.opendev.org/c/openstack/ironic/+/987460) -- Merged: Document provisioning a riscv machine (2026-05-11)
- [openeuler-riscv/oerv-team#1944](https://github.com/openeuler-riscv/oerv-team/issues/1944) -- openEuler: Testing OpenStack Antelope on riscv64 (open)
- [openeuler-riscv/oerv-team#1893](https://github.com/openeuler-riscv/oerv-team/issues/1893) -- openEuler: python-sphinx build failure in Antelope/Wallaby OBS (closed)
- [riseproject.dev](https://riseproject.dev) -- RISE Project homepage
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) -- March 2026
- [RISE RISC-V Runners six-week update](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) -- May 2026
- [libffi#281](https://github.com/libffi/libffi/issues/281) -- libffi struct-by-value ABI test failure on riscv64
- `runtimes/python.md` -- Python riscv64 status (this project)
- `reports/openssl.md` -- OpenSSL riscv64 status (this project)
- `reports/glibc.md` -- glibc riscv64 status (this project)
- `runtimes/go.md` -- Go riscv64 status (this project)