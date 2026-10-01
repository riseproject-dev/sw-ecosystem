---
title: OpenStack
parent: Project Reports
color: green
dependencies:
  - name: Python
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: libvirt
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: runtime-dependency
    criticality: critical
  - name: PostgreSQL
    relation: runtime-dependency
    criticality: critical
  - name: MariaDB
    relation: runtime-dependency
    criticality: optional
  - name: RabbitMQ
    relation: runtime-dependency
    criticality: critical
  - name: Memcached
    relation: runtime-dependency
    criticality: optional
  - name: Open vSwitch
    relation: runtime-dependency
    criticality: optional
  - name: Ceph
    relation: runtime-dependency
    criticality: optional
  - name: SQLite
    relation: runtime-dependency
    criticality: optional
  - name: greenlet
    relation: runtime-dependency
    criticality: optional
  - name: cryptography
    relation: runtime-dependency
    criticality: optional
  - name: lxml
    relation: runtime-dependency
    criticality: optional
  - name: libffi
    relation: runtime-dependency
    criticality: optional
  - name: SQLAlchemy
    relation: runtime-dependency
    criticality: optional
  - name: eventlet
    relation: runtime-dependency
    criticality: optional
  - name: etcd
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="openstack" %}

# OpenStack

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenStack<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OpenStack is an open-source cloud infrastructure platform providing compute (Nova), networking (Neutron), storage (Cinder/Swift), image management (Glance), identity (Keystone), and bare-metal provisioning (Ironic) services. It is governed by the OpenInfra Foundation (openinfra.org) under the Apache License 2.0. Technical direction runs through an elected OpenStack Technical Committee (TC), with per-project PTLs (Project Team Leads) and per-repository core-reviewer teams (for example "nova-core"), documented at [governance.openstack.org](https://governance.openstack.org) rather than via a flat MAINTAINERS file. The `openstack/nova` repository itself contains no MAINTAINERS file; Nova is organized into topical sub-teams and cross-cutting "czars" tracked on the OpenStack wiki.

Corporate sponsorship runs through OpenInfra Foundation membership tiers:
- **Platinum** (top tier, board seats): Ant Group, Ericsson, Huawei, Microsoft, Okestro, Wind River.
- **Gold:** 99Cloud, Bloomberg, Canonical, China Mobile, China Telecom, China Unicom, Cleura, Deutsche Telekom, H3C, Mirantis, Red Hat, ZTE.
- **Silver:** a broader list with lower-commitment benefits.

Nova core review has historically been dominated by Red Hat and Canonical engineers, with contributions from Huawei, IBM, Mirantis, and others. ZTE is relevant here as the employer of the author of the newest open riscv64 patch, nova#986752.

**Community stance on new architecture ports:** there is no dedicated RISC-V SIG, TC resolution, or formal policy statement on new architecture ports for OpenStack. Support for non-x86 architectures has historically been demand-driven and downstream-led (MIPSEL, S390X, PPC64LE arrived through the same pattern: a user-filed bug followed by incremental patches), not a coordinated porting initiative. riscv64 work follows the identical pattern: it originates from a 2023 Launchpad bug filed by a Canonical engineer needing riscv64 build infrastructure, not from a TC-driven program.

**Governance caveat relevant to this report's scope:** OpenStack's core services ship no compiled, architecture-specific code. `python3-openstackclient` and `python3-openstacksdk` are `Architecture: all` packages in Ubuntu, and `openstacksdk`/`python-openstackclient` ship only `py3-none-any` wheels on PyPI. This means "does OpenStack run on riscv64" is trivially true at the control-plane level by inheritance from the Python runtime. The substantive open question, addressed throughout this report, is a narrower and still-unresolved one: can a riscv64 virtual machine be launched *as a guest* by Nova.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-01-13 | nova-specs#824044 merged: spec "Pick guest CPU architecture based on host arch in libvirt driver." Generic multi-architecture framework, not riscv64-specific. | [review.opendev.org/c/openstack/nova-specs/+/824044](https://review.opendev.org/c/openstack/nova-specs/+/824044) |
| 2022-02-24 | nova#822053 and nova#828369 merged (Yoga release, 2022-03-30): implement the above spec, giving Nova's libvirt driver the ability to pick a QEMU binary/machine type for a guest architecture that differs from the host (`hw_architecture` image property). This enabling framework is what riscv64 emulation support is later built on top of; it does **not** add riscv64 itself. | [review.opendev.org/c/openstack/nova/+/822053](https://review.opendev.org/c/openstack/nova/+/822053), [+/828369](https://review.opendev.org/c/openstack/nova/+/828369) |
| 2023-06-07 | Launchpad bug #2023211 filed by Colin Watson (Canonical): `openstack server create` with `architecture=riscv64` fails with `Architecture name 'riscv64' is not valid (HTTP 400)`. Root cause: `nova.objects.fields.Architecture` has no RISCV64 entry even though `os-traits` defines one. | [bugs.launchpad.net/nova/+bug/2023211](https://bugs.launchpad.net/nova/+bug/2023211) |
| 2023-07-20 | nova#889137 opened by Felipe Reyes (Canonical): "Add RISCV64 QEMU emulation support," the primary functional implementation patch. Same day, Reyes demonstrates a riscv64 guest booting with cloud-init networking after disabling the generated `<cpu>` XML node (mirroring Nova's existing MIPSEL handling) and supplying a u-boot-qemu kernel image. | [review.opendev.org/c/openstack/nova/+/889137](https://review.opendev.org/c/openstack/nova/+/889137) |
| 2024-12-11 | Sean Mooney (Nova core, Red Hat) reclassifies the work from a bug to a feature on both the Launchpad bug and nova#889137, requiring a formal blueprint before merge. James Page (Canonical) files blueprint `riscv64-emulation-support` the same day. | [blueprints.launchpad.net/nova/+spec/riscv64-emulation-support](https://blueprints.launchpad.net/nova/+spec/riscv64-emulation-support) |
| 2025-01-20 to 2025-02-28 | James Page rebases nova#889137 (patch sets 14-15), flags an unresolved versioned-objects upgrade-test failure he cannot diagnose. Sean Mooney requests a clean run of the experimental "emulation" CI job confirming riscv64 QEMU packages/traits are present. Last recorded Zuul check-pipeline run (2025-02-28) still fails (grenade/tempest). | [review.opendev.org/c/openstack/nova/+/889137](https://review.opendev.org/c/openstack/nova/+/889137) |
| 2026-04-30 | nova#986752 opened by Chen Ke (chenker, ZTE): a smaller, independent riscv64-compatibility patch (+4/-1). Sean Mooney gives Code-Review -1, pointing the author at the more complete nova#889137 and asking for a release note, specless blueprint, and a testing plan. Chenker agrees a blueprint is needed. | [review.opendev.org/c/openstack/nova/+/986752](https://review.opendev.org/c/openstack/nova/+/986752) |
| 2026-05-11 | ironic#987460 merged: documents riscv64 PXE bootfile/template configuration (`grubriscv64.efi`, `pxe_riscv64_config.template`). The only riscv64-specific patch that has actually merged anywhere in OpenStack. Ironic PTL Julia Kreger notes riscv64 lacks a standardized UEFI implementation; author Kaifeng Wang confirms this is validated only on VMs, not physical hardware. | [review.opendev.org/c/openstack/ironic/+/987460](https://review.opendev.org/c/openstack/ironic/+/987460) |

**Is riscv64 support upstream today? No, with one narrow exception.** A direct fetch of `nova/objects/fields.py` on current master confirms the `Architecture` enum (ALPHA through XTENSAEB) has **no `RISCV64` entry**. A direct fetch of `nova/virt/libvirt/driver.py` on current master confirms it has **zero occurrences of the string "riscv"** in its code paths; the sole riscv-related content anywhere in that file is a TODO comment (see Section 4.2) acknowledging the gap. The 2022 Yoga-era patches (nova#822053/828369) laid generic multi-architecture scaffolding but did not add riscv64 itself; this corrects an earlier characterization that riscv64 was registered in Nova's Architecture enum as of Yoga. The **only riscv64-specific code merged anywhere in OpenStack as of 2026-10-01 is the four-line Ironic documentation patch (#987460)**. Everything that touches Nova's actual guest-emulation code path for riscv64 remains open and unmerged (nova#889137, nova#986752).

**[NEEDS VERIFICATION / discrepancy]** Independent checks of nova#889137's patch-set count against the Gerrit REST API returned two different numbers in this research cycle: one pass reported 15 patch sets, a later adversarial re-check reported 11. Both agree on the diff size (+81/-13) and the last-updated timestamp (2025-02-28), so the discrepancy is confined to the patch-set count; it does not change the substantive finding that the patch is open, stalled, and failing CI.

---

## 3. Upstream Support Tier

Nova's Feature Support Matrix at [docs.openstack.org](https://docs.openstack.org) documents natively supported compute architectures for the libvirt driver as x86 (KVM), aarch64/ARM64 (KVM), ppc64/PowerPC (KVM), and s390x/IBM Z (KVM). RISC-V/riscv64 is absent from this matrix. OpenStack has no formal, published policy tiering new CPU-architecture ports; in practice, architecture support has required (1) CI infrastructure donated by a sponsoring organization, (2) a project team or SIG willing to maintain the port, and (3) normal Gerrit review (TC approval is not a gate for this class of change). Within Nova's own documentation, architectures outside x86_64/AArch64 -- S390X, PPC64LE, MIPSEL, and the still-unmerged riscv64 -- sit in a lesser "emulated architecture" bucket (QEMU TCG software emulation), rather than being first-class, hardware-accelerated targets.

| | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Listed in Nova Feature Support Matrix | Yes | Yes | No |
| Native KVM-accelerated guest support | Yes | Yes | No |
| QEMU TCG emulated-guest support (merged code) | Yes (baseline) | Yes | No (nova#889137 unmerged) |
| Registered in `nova.objects.fields.Architecture` | Yes | Yes | No (confirmed absent on current master) |
| Dedicated Zuul CI job/nodeset | Yes | Yes (`nova-emulation` job tests emulated aarch64 guests) | No |
| Release-blocking status | Yes | Yes | Not applicable, no code merged |

**Current status: unsupported.** There is no formal commitment or published timeline from the TC or the Nova project team for riscv64.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

OpenStack core services (Nova, Neutron, Keystone, Glance, Cinder, Swift, Ironic) are Python-dominant and contain no architecture-specific assembly, JIT backends, SIMD dispatch, or `arch/riscv/` directories. The riscv64 surface area is confined to four locations, three of which are unmerged proposals rather than shipped code.

**4.1 `nova.objects.fields.Architecture` enum**

File: `nova/objects/fields.py`. Direct inspection of current master confirms there is **no `RISCV64` entry** in the `Architecture` enum (it lists ALPHA through XTENSAEB with no riscv64 member). The enum gap is exactly what causes the `Architecture name 'riscv64' is not valid (HTTP 400)` failure quoted in bug #2023211. Adding `RISCV64 = arch.RISCV64` here is one of the changes proposed, but not merged, in nova#889137.

**4.2 `nova/virt/libvirt/driver.py` TODO stub**

The only riscv-related content in the libvirt driver on current master is a TODO comment (located around line 6124 per the most recent direct fetch) stating the architecture will be re-evaluated "when libvirtd adds overall RISCV support as a supported architecture, as there is no cpu models associated." No code path executes for riscv64 today. [NEEDS VERIFICATION: exact line number and attributed author of this comment -- cited elsewhere as lines 5991-5993 by a single prior pass; the line number should be treated as approximate.]

**4.3 Proposed QEMU emulation path (nova#889137, unmerged)**

The patch proposes, but has not merged:
- `nova/virt/arch.py`: add `RISCV64 = 'riscv64'` to the constant list and the `ALL` tuple (confirmed absent from `ALL` on current master).
- `nova/objects/fields.py`: add `RISCV64 = arch.RISCV64` to the Architecture enum.
- `nova/virt/libvirt/utils.py`: add `obj_fields.Architecture.RISCV64: "virt"` to the machine-type lookup dictionary.
- `nova/virt/libvirt/driver.py`: add a branch that omits the `<cpu>` XML node for riscv64 guests (mirroring existing MIPSEL handling), since libvirt rejects a `<cpu>` node with `'riscv64' architecture is not supported by CPU driver`.
- Object version bumps in `image_meta.py` (to 1.40), `hv_spec.py` (to 1.3), and `vcpu_model.py` (to 1.1), with `obj_make_compatible` guards. James Page flagged that one associated upgrade test still fails and he could not diagnose the versioned-objects interaction as of the last revision (2025-01-20).
- Documentation (`doc/source/admin/hw-emulation-architecture.rst`) describing riscv64 as "Tested and validated as functional" -- an assertion by the patch author inside an unmerged, CI-failing patch, not a verified upstream fact.

**4.4 Native riscv64 host support (KVM)**

No patch exists for running a Nova compute node natively on riscv64 hardware with KVM acceleration. This is distinct from the guest-emulation work above and is explicitly deferred by the TODO comment in 4.2, pending libvirt upstream adding riscv64 CPU model support. No timeline for that upstream libvirt work was found.

**4.5 Ironic bare-metal PXE configuration (merged)**

`ironic/doc/source/install/configure-pxe.rst` documents `riscv64:grubriscv64.efi` as the PXE bootfile and `riscv64:pxe_riscv64_config.template` as the config template (ironic#987460, merged 2026-05-11). Ironic contains no riscv64-specific Python code; it is architecture-agnostic by design, and these are operator-supplied configuration values. Julia Kreger (Ironic core) noted on merge that riscv64 lacks a standardized UEFI implementation, and author Kaifeng Wang confirmed this is validated only on virtual machines, with real-hardware testing hoped for later in 2026.

**4.6 Confirmed absent**

- No `arch/riscv/` directory in any checked OpenStack repository.
- No `.S` assembly files.
- No RISCV64 entry in `nova/virt/libvirt/driver.py`'s code paths.
- No RISC-V branch in `nova/virt/hardware.py` or Glance image-format handling (not found in research).

---

## 5. Build System, Cross-Compilation, and Toolchain

OpenStack has no C/C++ build system. All services install via `pip`/`tox` against `setup.py`/`setup.cfg`/`pyproject.toml`/`requirements.txt`, with no cmake, no autoconf, no stated GCC/Clang minimum version, and no `-DUSE_X=OFF`-style flags. Direct inspection of `opendev.org/openstack/nova` confirms no Dockerfile exists in the repository; QEMU appears only as a runtime hypervisor backend invoked through the libvirt driver (`nova/virt/libvirt/driver.py`), never as part of a build toolchain. `bindep.txt` lists `gcc`/`build-essential` as a generic system dependency for compiling C-extension Python wheels at pip-install time (for example `libvirt-python`, `psycopg2`), with no version floor and no riscv64-specific note.

**Container image builds (Kolla):** [NEEDS VERIFICATION, single source] `kolla/common/config.py`'s `BASE_ARCH` list reportedly accepts only `x86_64` and `aarch64`, and the Dockerfile base template has no riscv64 conditional blocks; this was not re-checked live this cycle.

**Multi-architecture Docker role (zuul-jobs):** the Zuul `build-docker-image` role in `opendev.org/zuul/zuul-jobs` documents `linux/riscv64` as a valid Docker buildx platform string. This is a documentation listing of valid values, not an active CI job or a provisioned nodepool label; no OpenStack project repository was found passing `linux/riscv64` to this role.

**Python toolchain:** the only hard requirement is Python >= 3.8. Python is available on riscv64 via Debian and Ubuntu (see Section 9).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | x86_64 | aarch64 | riscv64 |
|---|---|---|---|
| KVM hardware virtualization for Nova compute host | Yes | Yes | No |
| QEMU TCG software-emulated guest architecture (merged) | Yes (baseline) | Yes | No (nova#889137 unmerged) |
| Guest architecture enumerated in Nova (`fields.py`) | Yes | Yes | No (confirmed absent from current master) |
| Machine-type lookup in libvirt utils | Yes | Yes | No |
| CPU model selection | Yes | Yes | No (explicitly deferred, 4.2) |
| Bare-metal provisioning via Ironic | Yes | Yes | Documentation merged; no UEFI standard, VM-only validated so far |
| Listed in Nova Feature Support Matrix | Yes | Yes | No |
| Zuul CI coverage | Yes | Yes | No riscv64 job, nodeset, or label found in `openstack/nova/.zuul.yaml` or `openstack-zuul-jobs` |

A deployed riscv64 Nova compute node today has **no code path to spawn VMs**, neither via KVM nor via QEMU TCG emulation, because the Architecture enum rejects the string "riscv64" outright.

**Performance data (adjacent, not control-plane-specific):** Call, Nou and Senabre, "Open Challenges for a Production-ready Cloud Environment on top of RISC-V hardware" ([arXiv:2505.02650](https://arxiv.org/abs/2505.02650), May 2025), benchmarked a LicheePi 4A RISC-V board against an 8-node Intel Xeon Silver 4114 cluster. Native hardware comparison: Coremark ~2.7-3x slower on RISC-V, sequential disk write ~7x slower, random disk write ~45x slower, network throughput ~10x slower; one reported figure (memory latency, RISC-V reportedly *faster*) is flagged by the paper's own narrative as an apparent measurement anomaly. A custom virtualization-overhead benchmark found OpenStack VM and raw QEMU emulation running roughly 70-100x slower than native execution on that hardware (e.g., a "primes calculation" task: 4.576s native vs 95.533s under OpenStack vs 90.576s under raw QEMU). The paper's own conclusion is that production-ready OpenStack-on-RISC-V is currently "unfeasible." These figures carry significant caveats worth weighing: the native-hardware comparison pits a roughly $100 development board against an enterprise 8-node cluster (a hardware-class mismatch, not purely an ISA comparison); the ~100x virtualization figure reflects QEMU TCG software emulation with no hardware hypervisor extension available on that board (KVM-accelerated riscv64 clouds would not see this overhead); and the custom benchmark's code is not published, so it is not independently reproducible. This data was produced by the EU Horizon "Vitamin-V" project, which also published the earlier prototype description ([arXiv:2407.12008](https://arxiv.org/abs/2407.12008)) that this benchmark paper builds on.

No vendor or community benchmark comparing riscv64 to arm64 specifically for OpenStack control-plane or API throughput was found.

---

## 7. CI/CD Infrastructure

**No riscv64 CI exists for OpenStack**, confirmed by direct inspection of the actual Zuul job-definition file rather than search summaries: a raw fetch of `https://opendev.org/openstack/nova/raw/branch/master/.zuul.yaml` contains **zero occurrences of the string "riscv"**. The only architecture references present are `x86_64` (the `nova-next` job's `x86_64=q35` machine-type spec), `aarch64` (the `nova-emulation` job, which tests *emulated* aarch64 guests using a `cirros-0.5.3-aarch64-disk.img`), and `arm64` (the `openstack-python3-jobs-arm64` project template). This was corroborated by inspecting `openstack/openstack-zuul-jobs/zuul.d/jobs.yaml` and `nodesets.yaml`, and `openstack/kolla/zuul.d/nodesets.yaml`, none of which define a riscv64 label, job, or nodeset. Current CI nodesets for non-x86 architectures (all arm64) include `ubuntu-jammy-arm64`, `ubuntu-noble-arm64`, `debian-bookworm-arm64`, `debian-trixie-arm64-8GB`, and `centos-9-stream-arm64`.

Neither open riscv64 patch currently passes CI: nova#889137's last recorded Zuul check-pipeline run (2025-02-28) failed on `nova-grenade-multinode`, `nova-lvm`, `nova-next`, and `nova-multi-cell`; nova#986752 fails `nova-multi-cell`. Both failures are on standard x86_64 gating infrastructure and are unrelated to riscv64 hardware -- the patches fail ordinary gating before any riscv64-specific testing would even be relevant.

**RISE RISC-V Runners:** RISE launched free native riscv64 GitHub Actions runners in March 2026 on Scaleway EM-RV1 hardware (Ubuntu 24.04); by May 2026, 13,000+ jobs had run across 197 repositories and 87 organizations, with a 99.78% completion rate. OpenStack is not among the listed adopters and has not integrated with these runners. This matters practically: the Scaleway EM-RV1 vendor kernel (5.10.x) does not support KVM, so even if Nova CI adopted RISE runners it could not gate Nova's KVM-dependent compute paths on that hardware -- only QEMU TCG emulation paths would be testable. Separately, OpenStack's canonical CI system is Zuul, not GitHub Actions, so adopting RISE runners would require dedicated integration work rather than a drop-in substitution.

| | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Zuul job/nodeset in `openstack/nova/.zuul.yaml` | Yes | Yes (`nova-emulation`) | No |
| Nodepool label | Yes | Yes | No |
| Free native CI hardware available anywhere (RISE) | n/a | n/a | Yes, but unused by OpenStack and KVM-incapable |

---

## 8. Distribution and Release Status

OpenStack is distributed as many separate Python source packages, not a single installable artifact; there is no package literally named `openstack` on PyPI (confirmed: `pypi.org/pypi/openstack/json` returns 404) or in Ubuntu/Debian.

**PyPI:** the real, relevant packages are pure Python with no compiled extensions.
- `openstacksdk`: latest 4.20.0, ships only `openstacksdk-4.20.0-py3-none-any.whl` and a sdist.
- `python-openstackclient`: latest 10.3.0, same pattern -- `py3-none-any.whl` + sdist.
No riscv64-specific wheel exists for either because none is required; both install on any architecture with a compatible Python/pip, riscv64 included.

**Ubuntu 26.04 "resolute":** an architecture-filtered package search (`arch=riscv64`) returns the full set of real OpenStack component packages found in the unfiltered search, including `python3-openstackclient`, `python3-openstacksdk`, and `openstack-dashboard`. The `python3-openstackclient` package detail page lists only architecture **"all"** (a 459.4 kB package), i.e. it is a noarch Debian/Ubuntu package that installs on every architecture resolute supports, riscv64 included (resolute's official architecture list is i386, amd64, arm64, armhf, ppc64el, riscv64, s390x). A direct Launchpad `getPublishedBinaries` API query for the `nova-compute` and `neutron-common` binary packages in resolute confirms them as **currently published for riscv64** (`nova-compute` version `3:33.0.0-0ubuntu3.1`, published 2026-06-17; `neutron-common` version `2:28.0.2-0ubuntu1`, published 2026-09-27), among 8 published architectures (amd64, amd64v3, arm64, armhf, i386, ppc64el, riscv64, s390x). This was cross-checked against a negative control (a nonexistent `sparc64` architecture path returning a genuine 404), confirming the tool is reporting real publication records rather than fabricating pages.

**Debian sid/trixie:** `python-openstacksdk` is `Architecture: all`; no riscv64-specific build entry exists because none is needed for a noarch package.

**openEuler RISC-V SIG:** the only known downstream porting/testing effort. GitHub issue [openeuler-riscv/oerv-team#1944](https://github.com/openeuler-riscv/oerv-team/issues/1944) (opened 2025-07-03) tracks testing OpenStack Antelope on openEuler 24.03 LTS riscv64 with two riscv64 machines on the same LAN; no results have been posted. Issue [#1893](https://github.com/openeuler-riscv/oerv-team/issues/1893) (closed 2025-06-25) documents a `python-sphinx` (build-time dependency) failure across four architectures in the Antelope and Wallaby OBS build targets, since resolved. This is the entirety of documented correctness work for OpenStack on riscv64 outside upstream.

**Arch Linux RISC-V (archriscv.felixc.at):** no OpenStack package found in a direct search. Since OpenStack packages are pure Python, none is expected to be required.

**What a user must do to get a working control plane on riscv64:** install Python >=3.8 and `pip install openstacksdk python-openstackclient` (or the equivalent `apt install python3-openstackclient` on Ubuntu 26.04/riscv64), both of which work today with no special steps, because these packages carry no compiled, architecture-specific code. What a user **cannot** do is launch a riscv64 guest VM through Nova -- that functionality does not exist in any merged release.

---

## 9. Dependencies

Criticality and names below match the project's tracked dependency list exactly. Status ratings: Green (builds, tests, and is released for riscv64 without known blockers), Yellow (works but has known gaps or unverified CI), Red (blocked by an explicit maintainer statement or unresolved correctness bug).

| Dependency | Role | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Notes / Blocking Issues |
|---|---|---|---|---|---|---|
| Python | Primary runtime for all OpenStack services | Critical | Green | Yellow | Green (Debian sid ships python3.13; Ubuntu ships python3) | No JIT; perf trampoline disabled on riscv64; some 3.15 beta stack-unwinding regressions tracked upstream. See `runtimes/python.md`. |
| OpenSSL | TLS/crypto underlying the `cryptography` package used throughout Nova/Keystone auth | Critical | Green | Yellow | Green (Debian trixie/sid ship current versions) | Mature riscv64 port: RV64I ASM AES, Zbb/Zbc-accelerated GCM, ChaCha20, hwprobe capability detection. AES T-table is not constant-time on hardware lacking Zkn/Zvkned extensions; fix PRs #31080/#31082 open, unmerged. See `project-reports/openssl.md`. |
| glibc | Foundational C runtime under Python and all compiled extensions | Critical | Green | Yellow | Green | SIGILL reported in `__memset_vector` when RVV is disabled via `prctl()` (glibc BZ #32932). See `project-reports/glibc.md`. |
| libvirt | Nova's primary hypervisor-abstraction backend | Critical | Green (packaged by Debian/Gentoo/Arch without patches; libvirt >=9.1.0-rc1 required for the riscv64 CPU-driver fix path referenced in bug #2023211) | Yellow (not centrally CI'd upstream; relies on distro build farms) | Green (packaged by major distros) | No riscv64 CPU-model support registered in libvirt's CPU driver -- this is the explicit, upstream-external blocker cited by Nova's own TODO comment (Section 4.2). |
| QEMU | The hypervisor Nova drives through libvirt | Critical | Green (has a full `target/riscv/`, `tcg/riscv64/` JIT backend, `hw/riscv/` boards) | Green (upstream CI coverage exists) | Green | Mature, actively developed riscv64 target; second-tier maturity relative to amd64/arm64 but not a blocker for OpenStack's purposes. See `project-reports/qemu.md`. |
| PostgreSQL | Primary production RDBMS for `oslo.db` | Critical | Green (riscv64 explicitly listed as supported in PG18 docs) | Yellow (build-farm coverage, passes regression tests; no dedicated upstream riscv64 CI) | Green (Debian trixie ships riscv64 builds) | No hand-tuned assembly; informal "second tier" support only. See `project-reports/postgresql.md`. |
| MariaDB | Alternative RDBMS backend | Optional | Green (Debian sid ships riscv64 builds) | Yellow (distro buildd coverage only) | Green | Oracle MySQL has no official riscv64 packaging; riscv64 deployments depend on distro-built MariaDB. See `project-reports/mariadb.md`. |
| RabbitMQ | Default AMQP transport for `oslo.messaging` inter-service RPC | Critical | Green (Debian sid ships `rabbitmq-server` as `Architecture: all`) | Yellow (no tracked upstream riscv64 CI; zero riscv64-related issues/PRs/commits found on the RabbitMQ project itself) | Yellow (no explicit upstream riscv64 release-tier statement; Broadcom/Tanzu governance has no stated obligation to respond on architecture requests) | Functionally available via Debian packaging, but with zero direct upstream engagement; release-tier status is unclear. Transitively gated by Erlang/OTP's riscv64 maturity (below). See `project-reports/rabbitmq.md`. |
| Memcached | Cache backend for `oslo.cache` / Keystone token caching | Optional | Green (maintainer-confirmed "builds and runs just fine" on riscv64, July 2025, tested on a HiFive Unmatched) | Yellow (a community riscv64 CI request sat unmerged for over 18 months) | Green (Debian sid ships riscv64 builds) | Reactive-but-positive upstream maintainer stance; no proactive CI investment. See `project-reports/memcached.md`. |
| Open vSwitch | Virtual networking backend for Neutron's `os-vif` | Optional | Green (Debian sid ships riscv64 builds) | Yellow (no upstream riscv64 CI or issue/PR/mailing-list engagement found; the only riscv64 activity is at the Debian packaging layer) | Green | No formal architecture-tier policy upstream. See `project-reports/open-vswitch.md`. |
| Ceph | Object/block storage backend | Optional | Green (Debian sid ships riscv64 builds) | Yellow (no upstream riscv64 CI) | Green | An open FTBFS bug with fmtlib 11.1 affects all architectures, not riscv64-specific. See `project-reports/ceph.md` (report file listed in project scope but not yet written: Data not available). |
| SQLite | Used in Nova unit/functional tests and lightweight deployments | Optional | Green | Green (a riscv32-specific `__uint128_t` guard bug fixed April 2026 did not affect riscv64) | Green | No open blocker. See `project-reports/sqlite.md`. |
| greenlet | C-extension coroutine/stack-switching library underneath `eventlet` | Optional | [NEEDS VERIFICATION] stack switching is implemented via per-architecture assembly (`switch_*.h`); riscv64 implementation status was not confirmed by any source this cycle | Unconfirmed | Yellow (no riscv64 wheel found on PyPI; distro-built only) | Highest-uncertainty item in this table alongside `cryptography` -- both involve hand-written, per-architecture low-level code, exactly where riscv64 gaps are most likely. |
| cryptography (PyCA) | TLS/crypto bindings for `keystoneauth1`, `keystonemiddleware`, `paramiko` | Optional | [NEEDS VERIFICATION, single source] one prior pass asserted active riscv64 support via RISE CI; a later pass could not confirm this and flagged Rust-toolchain riscv64 target maturity (required by `cryptography-rust`) as the open question | Unconfirmed | Yellow (not found on PyPI as a riscv64 wheel; a RISE-hosted wheel index was referenced by one source but not independently reconfirmed) | Discrepancy between sources on riscv64 maturity -- treat as unresolved pending a direct check of Rust's riscv64 target tier and the actual wheel index contents. |
| lxml | XML/XSLT bindings used in Nova's domain-XML handling and Oslo | Optional | Yellow (C extension; requires `libxml2`-dev and `libxslt`-dev, both of which build on riscv64 without patches) | Yellow (no riscv64 CI found) | Yellow (no riscv64 wheel confirmed on PyPI; must build from source) | Binary-wheel availability on PyPI, not the underlying C libraries, is the practical risk. |
| libffi | `ctypes` backend used by Python's `_ctypes` module across Oslo libraries | Optional | Yellow (builds, but open riscv64 issues exist) | Yellow ([libffi#281](https://github.com/libffi/libffi/issues/281): struct-by-value ABI test failure on riscv64, open since April 2023) | Green (Debian ships riscv64 builds) | Known correctness gap affecting `ctypes`-dependent code paths. |
| SQLAlchemy | ORM underneath `oslo.db` for all Nova DB models | Optional | Green (pure Python; optional C extensions) | Yellow (no riscv64 CI found) | Green (pure-Python wheel on PyPI) | Core pure-Python mode is unaffected by architecture. |
| eventlet | Nova's core concurrency model (green threads for API/RPC services) | Optional | Green (mostly pure Python) | Yellow (no riscv64 CI; depends on `greenlet`) | Green (PyPI pure-Python wheel) | Risk is inherited entirely from `greenlet`. |
| etcd | Optional distributed-lock-manager backend for Oslo/Tooz coordination | Optional | Yellow (an early riscv64 porting PR, #13504, stalled and was closed) | Red (no Prow CI on dedicated riscv64 hardware, which etcd's own tier policy requires) | Red (not released as a supported tier for riscv64) | Explicit blocker: maintainer @serathius stated "No plans" for riscv64 (March 2026). |

**Additional indirect/recursed dependencies found via research (not in the direct-dependency list, but surfaced while tracing the above):**

| Dependency | Relation | riscv64 status |
|---|---|---|
| Erlang/OTP | Runtime underneath RabbitMQ | Green per prior packaging data (Debian sid ships riscv64 builds); not independently reconfirmed this cycle. RabbitMQ's own riscv64 release-tier status is gated by this dependency's maturity. |
| libxml2 / libxslt | C libraries wrapped by `lxml` | Green -- build without upstream patches on Debian/Gentoo/Arch; Alpine shipped a riscv64 `libxml2` package as early as 2023. No port was necessary for `libxslt`. |
| Rust toolchain | Build dependency of modern `cryptography` (via `cryptography-rust`) | [NEEDS VERIFICATION] riscv64 target-tier maturity in the Rust toolchain was not confirmed this cycle; flagged as the key open question for `cryptography`'s riscv64 wheel availability. |

**Outstanding verification gap:** the project-graph MCP server failed to connect (`CONNECTION_CLOSED`) across every attempt this cycle, so the SPARQL cross-check against the Ubuntu 26.04 riscv64 binary index specified in this project's standard methodology could not be run. This is a tool/infrastructure failure, not a confirmed absence of data. Live, direct checks against PyPI, Launchpad, and Ubuntu package pages (Section 8) substantially cover the same ground and should be treated as the authoritative data for this report; the graph cross-check should still be re-run when the server is available to close the gap formally.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Launchpad #2023211](https://bugs.launchpad.net/nova/+bug/2023211) | Run emulated riscv64 VMs on amd64 | In Progress (Nova); Invalid (nova-compute charm); Confirmed (nova, Ubuntu) | Feature gap, release-blocking for the capability | Master tracking issue, opened 2023-06-07 by Colin Watson. 24 comments documenting the full root-cause-to-prototype arc; reclassified from bug to feature by Sean Mooney in Dec 2024. |
| [Blueprint riscv64-emulation-support](https://blueprints.launchpad.net/nova/+spec/riscv64-emulation-support) | RISCV64 QEMU Emulation support | Not started; Direction: Needs approval | Process blocker | Filed 2024-12-11 by James Page. Sean Mooney's whiteboard comment is supportive in principle but requests testing via the `nova-emulation` CI job before approval. |
| [nova#889137](https://review.opendev.org/c/openstack/nova/+/889137) | Add RISCV64 QEMU emulation support | Open, Verified -1, stalled since 2025-02-28 | Correctness/functional -- the primary implementation | Not rebased against current master; an upgrade-test failure related to versioned-objects compatibility is unresolved and the author could not diagnose it. |
| [nova#986752](https://review.opendev.org/c/openstack/nova/+/986752) | Add compatibility for nova with RISC-V architecture | Open, Code-Review -1 (Sean Mooney) | Functional, minor | Opened 2026-04-30 by ZTE; +4/-1 diff; reviewer redirected the author to the more complete nova#889137. |
| [ironic#987460](https://review.opendev.org/c/openstack/ironic/+/987460) | Document provisioning a riscv machine | Merged 2026-05-11 | Documentation | Only merged riscv64-specific artifact in OpenStack. UEFI-incomplete per Ironic PTL comment; validated on VMs only. |
| [libffi#281](https://github.com/libffi/libffi/issues/281) | struct-by-value ABI test failure on riscv64 | Open since April 2023 | Dependency-level correctness bug | Affects `ctypes`, used by Oslo libraries throughout OpenStack. |
| OpenSSL PRs #31080/#31082 | AES T-table not constant-time without Zkn/Zvkned | Open, unmerged | Dependency-level security-relevant bug | Affects every OpenStack service handling TLS on current commodity riscv64 silicon lacking crypto extensions. |
| etcd PR #13504 | Early riscv64 port attempt | Closed/stalled; maintainer stated "No plans" (March 2026) | Dependency-level blocker (optional dependency) | Affects only deployments using etcd as the Tooz/DLM coordination backend. |

No bugs specific to riscv64 were found on bugs.launchpad.net against any OpenStack component other than #2023211. No OpenStack-canonical GitHub issues/PRs exist for riscv64, since OpenStack's workflow is Gerrit and Launchpad rather than GitHub.

---

## 12. Objections and Upstream Blockers

**12.1 Blueprint filed but not yet approved.** A formal blueprint (`riscv64-emulation-support`) exists and is linked to bug #2023211, filed by James Page in December 2024 in direct response to Sean Mooney's requirement. Its Direction remains "Needs approval," and Sean Mooney's own whiteboard comment conditions approval on a clean run of the `nova-emulation` CI job confirming riscv64 QEMU packages and resource-provider traits are correctly reported. Separately, the newer and smaller nova#986752 patch was told by the same reviewer that it needs its own release note and testing-plan discussion before proceeding, since it is an independent implementation rather than a continuation of the blueprinted #889137 effort.

**12.2 Libvirt upstream has no riscv64 CPU model support.** The TODO comment in `nova/virt/libvirt/driver.py` explicitly defers native riscv64 host support until libvirt adds CPU model support for the architecture. No libvirt patch for this was found in the research findings. This blocks any future path to KVM-accelerated riscv64 compute hosts, independent of the guest-emulation work.

**12.3 No riscv64 CI nodes in OpenDev.** Confirmed by direct inspection of `openstack/nova/.zuul.yaml`, `openstack/openstack-zuul-jobs`, and `openstack/kolla` Zuul configuration files -- zero riscv64 labels, nodesets, or jobs exist. Adding Nova riscv64 CI would require a corporate sponsor donating riscv64 nodepool capacity to OpenDev, following the same path IBM took for s390x historically.

**12.4 No riscv64 EFI standard for Ironic bare-metal.** Julia Kreger (Ironic PTL) flagged on merge of ironic#987460 that riscv64 lacks a standardized UEFI implementation. The patch author's team is running a provisioning proof-of-concept on virtual machines only, with real-hardware testing hoped for later in 2026 but unconfirmed [NEEDS VERIFICATION].

**12.5 KVM hardware virtualization is generally unavailable on current riscv64 silicon used for CI.** [NEEDS VERIFICATION, single source from a prior research pass, not reconfirmed this cycle] the RISE RISC-V Runners' Scaleway EM-RV1 hardware runs a 5.10.x vendor kernel without KVM support, which would limit what Nova compute functionality could ever be gated on that specific free CI hardware even if adopted.

**12.6 Kolla's officially supported architecture list reportedly excludes riscv64.** [NEEDS VERIFICATION, single source, not reconfirmed this cycle] `kolla/common/config.py`'s `BASE_ARCH` list is reported to accept only `x86_64` and `aarch64`.

**12.7 etcd, an optional coordination backend, has an explicit "no plans" from its maintainer** for riscv64 (March 2026), closing off one potential Tooz/DLM backend option for riscv64 OpenStack deployments, though this does not block the control plane generally since etcd is optional.

**Acceptance probability for the core guest-emulation feature:** moderate to good on a multi-quarter horizon. The relevant Nova core reviewer has stated in-principle support twice (on the blueprint whiteboard and in code review), and a working implementation has existed and demonstrably booted a riscv64 guest since 2023. The blockers remaining are procedural (blueprint approval, a clean CI run on the experimental emulation job) and maintenance (a stale patch needing rebase and an unresolved upgrade-compatibility bug), not a maintainer objection to the feature itself.

---

## 13. Readiness Assessment

- **Color:** green (architecture-independent, Step 0 shortcut)
- **Release provider:** upstream

OpenStack's core services (Nova, Neutron, Keystone, Glance, Cinder, Ironic, openstacksdk, python-openstackclient, and the rest of the control plane) ship no compiled, architecture-specific code -- they are pure-Python, distributed as `py3-none-any` wheels on PyPI and `Architecture: all` packages in Debian/Ubuntu (confirmed: `python3-openstackclient` and `python3-openstacksdk` ship "all"-arch in Ubuntu resolute, including under the riscv64 architecture filter, [packages.ubuntu.com/resolute/python3-openstackclient](https://packages.ubuntu.com/resolute/python3-openstackclient)). Per the Step 0 architecture-independence shortcut of the color model, the control plane runs on riscv64 by construction, inheriting support from the Python runtime rather than needing any dedicated riscv64 CI or port -- hence green, with the CI-tier steps not applicable. OpenStack is not an optimization-purpose project (it is an orchestration/control-plane platform, not a library whose value proposition is architecture-specific speed), so no optimization-level modifier applies.

**This green grade covers only one question: does the OpenStack control plane run on riscv64 hosts (yes, trivially, as pure Python).** It explicitly does **not** cover a separate, unresolved feature gap: Nova's ability to launch riscv64 as a *guest* VM architecture is unmerged and stalled. Launchpad bug [#2023211](https://bugs.launchpad.net/nova/+bug/2023211) (opened 2023-06-07) and blueprint [riscv64-emulation-support](https://blueprints.launchpad.net/nova/+spec/riscv64-emulation-support) (Not started) track this. The main implementation, [nova#889137](https://review.opendev.org/c/openstack/nova/+/889137), has been open since 2023-07-20, last updated 2025-02-28, and is Verified -1/stalled pending blueprint approval and a clean CI run. A newer, smaller follow-on, [nova#986752](https://review.opendev.org/c/openstack/nova/+/986752) (opened 2026-04-30), carries a Code-Review -1 from core reviewer Sean Mooney for the same procedural reason. RISC-V is absent from Nova's published Feature Support Matrix and from OpenDev's Zuul/Nodepool CI (no riscv64 job, nodeset, or label found in Nova's `.zuul.yaml` or `openstack-zuul-jobs`). One related patch has merged: [ironic#987460](https://review.opendev.org/c/openstack/ironic/+/987460) (merged 2026-05-11) documents riscv64 bare-metal PXE provisioning, though the Ironic reviewer noted riscv64 still lacks a standardized UEFI implementation, and the author confirmed this is validated only on VMs so far, not real hardware.

None of this changes the green "runs on riscv64" grade for the OpenStack software itself, but it is a distinct, still-open "riscv64 as a supported guest/target architecture" gap that should be surfaced separately to any audience evaluating OpenStack's ability to *manage* riscv64 compute resources, rather than merely to *run* its own control plane on a riscv64 host.

---

## 14. Investment Analysis

Before sizing new work: RISE has not funded or engaged with OpenStack. A full traversal of RISE's blog archive (2024-05 through 2026-09) found zero mentions of OpenStack. The only RISE-adjacent trace is a Phase 2 (not-yet-implemented) roadmap item in the `riseproject-dev/board-farm` repository to eventually use "OpenStack Ironic, Redfish APIs, and OpenBMC controllers" for production multi-tenant bare-metal cloud management of RISE's own board farm -- a future consumer of OpenStack, not a contributor to its riscv64 support. No RISE-funded project, grant, or CI-runner usage targeting OpenStack exists. All investment below would need to be sourced independently.

### 14.1 Functional Enablement

The code for riscv64 QEMU guest emulation already exists in nova#889137 and is largely complete (enum, machine type, driver dispatch, object versioning, documentation, release note). The blockers are procedural and maintenance, not missing implementation:

1. Get the `riscv64-emulation-support` blueprint approved at a Nova team meeting (it is filed but unapproved).
2. Rebase nova#889137 against current master.
3. Diagnose and fix the unresolved versioned-objects upgrade-test failure James Page flagged but could not resolve.
4. Run the `nova-emulation` experimental CI job and confirm it passes with riscv64 QEMU packages and resource-provider traits correctly reported, per Sean Mooney's explicit request.
5. Fix the remaining Zuul check-pipeline failures (`nova-grenade-multinode`, `nova-lvm`, `nova-next`, `nova-multi-cell`).
6. Reconcile or formally supersede nova#986752 with nova#889137 -- coordination between Canonical (the more complete effort) and ZTE (the newer, smaller one) would avoid duplicated review cycles.

Native riscv64 host support (KVM) is a longer-horizon item blocked entirely outside OpenStack's control, on libvirt upstream adding riscv64 CPU model support.

For Ironic bare-metal, documentation is merged; physical-hardware deployment is blocked on an external dependency -- a standardized riscv64 UEFI/BMC/Redfish ecosystem that does not yet exist in mature form.

### 14.2 Performance Optimization

No performance-optimization work is actionable until functional deployability is achieved -- there is currently no code path to run a riscv64 guest at all. Once the guest-emulation patch merges, the Vitamin-V benchmark data (Section 6) suggests the near-term performance story will be dominated by QEMU TCG software-emulation overhead (observed ~70-100x slower than native in one small-board study), which is a QEMU/hypervisor-level concern, not something addressable in OpenStack's Python control plane. The OpenSSL AES constant-time gap (PRs #31080/#31082) is the one performance-adjacent, security-relevant item that sits in OpenStack's dependency chain directly (affecting TLS-heavy services like Keystone and Swift).

### 14.3 CI/CD Infrastructure

Zero riscv64 CI capacity exists in OpenDev. A sponsor would need to donate riscv64 nodepool nodes, following the historical precedent of IBM donating s390x capacity. RISE's free riscv64 CI runners exist but (a) run on GitHub Actions, requiring integration work since OpenStack uses Zuul, and (b) run on KVM-incapable hardware (Scaleway EM-RV1, 5.10.x vendor kernel), limiting what could be gated even after integration.

### 14.4 Ecosystem Enablement

OpenStack's Python packages are architecture-neutral and install on riscv64 without modification today. The functional gap is entirely in Nova's libvirt driver and in CI infrastructure, not in packaging. The highest-uncertainty dependency items are `greenlet` and `cryptography` (via its Rust toolchain requirement) -- both involve hand-written, per-architecture low-level code, and neither's riscv64 maturity was confirmed with a primary source this cycle. `libffi`'s open struct-by-value ABI bug (#281) is a known, unresolved correctness gap affecting `ctypes`-dependent Oslo code paths.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Secure blueprint approval for `riscv64-emulation-support` at a Nova team meeting | 1 | Canonical (James Page or successor) with ZTE coordination | Critical |
| Functional | Rebase nova#889137 against current master and fix the versioned-objects upgrade-test failure | 2-3 | Canonical | Critical |
| Functional | Run and pass the `nova-emulation` CI job as requested by Sean Mooney, confirming riscv64 QEMU packages/traits | 1-2 | Canonical / sponsor | Critical |
| Functional | Fix remaining Zuul check-pipeline failures on nova#889137 | 2-4 | Canonical / sponsor | Critical |
| Functional | Reconcile nova#986752 with nova#889137 (abandon or merge) | 1 | ZTE / Canonical coordination | High |
| Functional | Engage libvirt upstream on riscv64 CPU model support (required for native KVM host support) | Unknown -- external dependency | Red Hat (libvirt maintainer) or silicon vendor | High, long horizon |
| CI/CD | Donate riscv64 nodepool nodes to OpenDev for Nova CI | Unknown -- infrastructure commitment | Silicon vendor or cloud provider | Critical, nothing else gates without this |
| CI/CD | Add riscv64 node labels to `openstack-zuul-jobs` once nodepool nodes exist | 1-2 | OpenStack infra team with sponsor | High |
| Ecosystem | Confirm/close the greenlet riscv64 wheel and support-status gap | 1 (investigation) + 2-3 (fix if needed) | eventlet/greenlet maintainers or sponsor | High |
| Ecosystem | Confirm Rust riscv64 target maturity and `cryptography` riscv64 wheel availability | 1 (investigation) | sponsor | High |
| Ecosystem | Resolve libffi#281 (struct-by-value ABI test failure on riscv64) | 3-5 | libffi maintainers or sponsor | High |
| Infrastructure | Re-run project-graph SPARQL cross-check against Ubuntu 26.04 riscv64 package index once the MCP connection is restored | 1 | Internal research | Medium, closes a verification gap, not a code blocker |
| Performance | No optimization work actionable until functional deployment exists | N/A | N/A | Low, deferred |

---

## 15. References

- [opendev.org/openstack/nova](https://opendev.org/openstack/nova) -- primary repository
- [bugs.launchpad.net/nova/+bug/2023211](https://bugs.launchpad.net/nova/+bug/2023211) -- master tracking bug, "Run emulated riscv64 VMs on amd64"
- [blueprints.launchpad.net/nova/+spec/riscv64-emulation-support](https://blueprints.launchpad.net/nova/+spec/riscv64-emulation-support) -- blueprint, Not started / Needs approval
- [review.opendev.org/c/openstack/nova/+/889137](https://review.opendev.org/c/openstack/nova/+/889137) -- primary unmerged implementation patch
- [review.opendev.org/c/openstack/nova/+/986752](https://review.opendev.org/c/openstack/nova/+/986752) -- newer, smaller unmerged patch, Code-Review -1
- [review.opendev.org/c/openstack/ironic/+/987460](https://review.opendev.org/c/openstack/ironic/+/987460) -- merged Ironic PXE documentation patch
- [review.opendev.org/c/openstack/nova/+/822053](https://review.opendev.org/c/openstack/nova/+/822053) and [+/828369](https://review.opendev.org/c/openstack/nova/+/828369) -- merged Yoga enabling framework (not riscv64-specific)
- [review.opendev.org/c/openstack/nova-specs/+/824044](https://review.opendev.org/c/openstack/nova-specs/+/824044) -- merged Yoga spec for the above framework
- [review.opendev.org/c/openstack/nova/+/926521](https://review.opendev.org/c/openstack/nova/+/926521) -- merged libvirt resource-provider trait list update, borderline riscv64 relevance
- [docs.openstack.org/nova/latest/admin/hw-emulation-architecture.html](https://docs.openstack.org/nova/latest/admin/hw-emulation-architecture.html) -- Nova hardware-emulation architecture admin guide
- [arxiv.org/abs/2505.02650](https://arxiv.org/abs/2505.02650) -- "Open Challenges for a Production-ready Cloud Environment on top of RISC-V hardware," Vitamin-V project benchmark data
- [arxiv.org/abs/2407.12008](https://arxiv.org/abs/2407.12008) -- "Enabling an OpenStack-based cloud on top of RISC-V hardware," Vitamin-V prototype
- [www.vitamin-v.eu/about](https://www.vitamin-v.eu/about) -- Vitamin-V EU Horizon project
- [github.com/riseproject-dev/board-farm](https://github.com/riseproject-dev/board-farm) -- sole RISE/OpenStack connection, a planned Phase 2 Ironic-based board-farm cloud
- [riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) -- RISE RISC-V Runners launch
- [riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) -- RISE runner adoption metrics
- [github.com/openeuler-riscv/oerv-team/issues/1944](https://github.com/openeuler-riscv/oerv-team/issues/1944) -- openEuler Antelope riscv64 testing task, open
- [github.com/openeuler-riscv/oerv-team/issues/1893](https://github.com/openeuler-riscv/oerv-team/issues/1893) -- openEuler python-sphinx build failure, closed
- [github.com/libffi/libffi/issues/281](https://github.com/libffi/libffi/issues/281) -- libffi struct-by-value ABI test failure on riscv64
- [packages.ubuntu.com/resolute/python3-openstackclient](https://packages.ubuntu.com/resolute/python3-openstackclient) -- Ubuntu 26.04 architecture-independent package confirmation
- `project-reports/libvirt.md`, `project-reports/qemu.md`, `project-reports/mariadb.md`, `project-reports/postgresql.md`, `project-reports/rabbitmq.md`, `project-reports/memcached.md`, `project-reports/open-vswitch.md`, `project-reports/ceph.md` (not yet written), `project-reports/sqlite.md`, `project-reports/openssl.md`, `project-reports/glibc.md` -- internal per-dependency reports
- `runtimes/python.md` -- internal Python riscv64 status report