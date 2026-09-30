---
title: libvirt
parent: Project Reports
color: yellow
dependencies:
  - name: GLib
    relation: runtime-dependency
    criticality: critical
  - name: GnuTLS
    relation: runtime-dependency
    criticality: critical
  - name: libxml2
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: runtime-dependency
    criticality: critical
  - name: Meson
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: optional
  - name: libcurl
    relation: runtime-dependency
    criticality: optional
  - name: readline
    relation: runtime-dependency
    criticality: optional
  - name: libnl
    relation: runtime-dependency
    criticality: optional
  - name: Cyrus SASL
    relation: runtime-dependency
    criticality: optional
  - name: libselinux
    relation: runtime-dependency
    criticality: optional
  - name: AppArmor
    relation: runtime-dependency
    criticality: optional
  - name: libacl
    relation: runtime-dependency
    criticality: optional
  - name: libaudit
    relation: runtime-dependency
    criticality: optional
  - name: libcap-ng
    relation: runtime-dependency
    criticality: optional
  - name: libpcap
    relation: runtime-dependency
    criticality: optional
  - name: libnuma
    relation: runtime-dependency
    criticality: optional
  - name: systemd
    relation: runtime-dependency
    criticality: optional
  - name: json-c
    relation: runtime-dependency
    criticality: optional
  - name: FUSE
    relation: runtime-dependency
    criticality: optional
  - name: device-mapper
    relation: runtime-dependency
    criticality: optional
  - name: Ceph
    relation: runtime-dependency
    criticality: optional
  - name: libssh
    relation: runtime-dependency
    criticality: optional
  - name: libssh2
    relation: runtime-dependency
    criticality: optional
  - name: libtirpc
    relation: runtime-dependency
    criticality: optional
  - name: libiscsi
    relation: runtime-dependency
    criticality: optional
  - name: GlusterFS
    relation: runtime-dependency
    criticality: optional
  - name: libparted
    relation: runtime-dependency
    criticality: optional
  - name: Xen
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libvirt" %}

# libvirt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libvirt<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libvirt is a C library and daemon providing a unified API for managing virtualization technologies, principally QEMU/KVM, plus LXC and (on non-riscv64 hosts) Xen. It is the backend for virt-manager, oVirt, OpenStack Nova, and most Linux-based cloud orchestration stacks. All hypervisor interaction, VM lifecycle, virtual device configuration, and network/storage management is mediated through libvirt's XML-driven domain model. libvirt itself executes no guest instructions; that work is delegated to QEMU/KVM.

**License:** GNU Lesser General Public License v2.1 or later (LGPLv2.1+). One live GitLab metadata fetch reported "GNU General Public License v2.0 or later," which conflicts with the LGPLv2.1+ license libvirt has documented for years; this should be verified directly against the repository's COPYING/COPYING.LESSER files before being treated as a license change [NEEDS VERIFICATION]. No CLA is required; contributions require a Developer Certificate of Origin (Signed-off-by line). The primary review channel is the devel@lists.libvirt.org mailing list; GitLab merge requests are technically accepted but a direct GitLab API search (`search=riscv`/`riscv64`, scope=all, state=all) returned zero merge requests for the project, confirming that in practice essentially all code, RISC-V included, lands as mailing-list-reviewed direct commits.

**Governance:** Meritocratic, consensus-based, per libvirt.org/governance.html. Four roles: Users, Contributors, Committers (repository write access, granted after roughly 2-3 months of sustained quality patches via rough consensus among existing committers), and a Security Team (a subset of committers plus vendor security representatives). Decisions default to consensus; formal votes occur only when committers disagree. libvirt is not affiliated with the Linux Foundation, CNCF, or any similar umbrella foundation; it is an independent, vendor-consortium-style project rooted at Red Hat.

**Corporate maintainers:** Red Hat is the dominant employer of libvirt committers and of RISC-V work specifically: Daniel Veillard (project founder), Andrea Bolognani, Daniel P. Berrange, Eric Blake, Erik Skultety, Fabiano Fidencio, Jan Tomko, Jiri Denemark (release manager since v6.6), Laine Stump, Martin Kletzander, Cole Robinson, and Christophe Fergeau. SUSE contributes via Cedric Bosdonnat and Jim Fehlig. Daniel Henrique Barboza authored the riscv64 CPU driver and the AIA interrupt-architecture feature while at Ventana Micro (a RISC-V vendor), later moving to IBM/Red Hat; he is now the elected RISE Simulator/Emulator Working Group lead. Canonical (Christian Ehrhardt, Heinrich Schuchardt) and Debian contributors have supplied riscv64 AppArmor and compiler-detection fixes. No RISC-V-vendor-affiliated maintainer besides Barboza was found with a standing libvirt committer role.

**Community stance on new ports:** Open and incremental, handled through the same rough-consensus patch-review process as any other change. No formal tier-policy document for architecture support exists on libvirt.org or in the governance page; riscv64, loongarch64, s390x, and ppc64 are all treated as peers to aarch64 in code review, receiving the same `JOB_OPTIONAL: 1` CI treatment (see Section 7). Only x86_64 and aarch64 have CI that runs automatically and gates merges.

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the master branch of [gitlab.com/libvirt/libvirt](https://gitlab.com/libvirt/libvirt). Zero GitLab merge requests exist for riscv64; all riscv64 changes landed as direct, mailing-list-reviewed commits.

| Date | Event | Source |
|------|-------|--------|
| 2018-06-14 | "[PATCH v2 00/11] RISC-V Guest Support" posted by Lubomir Rintel (Red Hat): riscv32/riscv64 machine naming, arch definitions, USB-disabled-by-default, virtio device addressing, test data (~29,900 insertions across 20 files) | [devel mailing list](https://lists.libvirt.org/archives/list/devel@lists.libvirt.org/message/AYD4OLDUYH35Q76MFF5ZJ65RJ3XW5FZF/) |
| 2018-08-24 | `qemuDomainIsRISCVVirt()` / `qemuDomainMachineIsRISCVVirt()` machine-type detection and 16550A serial console added | GitLab commit history |
| 2018-09-03 | v4.7.0 released; foundational riscv32/riscv64 guest support ships | [libvirt NEWS](https://libvirt.org/news.html) |
| 2018-10 | RPM spec: unavailable features (numactl, numad, zfs-fuse) disabled on riscv64 (Berrange) | GitLab commit history |
| 2019-04 | AppArmor riscv32/riscv64 profiles added (intrigeri, Debian/Tails); QEMU 4.0 PCIe Root Port capabilities for riscv64 (Bolognani) | GitLab commit history |
| 2022-06-18 | TPM device fix for non-x86 arches including riscv: `tpm-tis` changed to `tpm-tis-device` (Cole Robinson) | commit `b233bf89` |
| 2022-09-27 | AppArmor: common riscv64 loader paths (u-boot, opensbi) whitelisted, Christian Ehrhardt (Canonical) | commit `31ea9433` |
| 2022-10-11 | GitLab Issue #391 filed ("Implement CPU driver for 'riscv64' architecture"); reproduced on macOS/libvirt 8.7/QEMU 7.1.0 and Debian 11/libvirt 7.0/QEMU 5.2.0 | [Issue #391](https://gitlab.com/libvirt/libvirt/-/work_items/391) |
| 2023-01-06 (authored) / 2023-01-24 (committed) | `src/cpu/cpu_riscv64.c` added: dedicated riscv64 CPU driver, `compare()`/`validateFeatures()` as stubs (Daniel Henrique Barboza, Ventana Micro) | commit `fd703358`, shipped v9.1.0 (released 2023-03-01) |
| 2023-04-14 | Default machine type changed from `spike_v1.10` to `virt` for RISC-V (Jim Fehlig, SUSE) | commit `b9236758` |
| 2023-04-28 (authored) / 2023-05-04 (committed) | `virCPURiscv64Update()` added, enabling `<cpu mode='host-model'>` for riscv64, reviewed by Andrea Bolognani (git-verified; ported from the ARM driver) | commit `d4c39bad`, shipped v9.4.0 (released 2023-06-01) |
| 2024-01-16 | Memballoon default removed; `qemuDomainSupportsPCI()` edge cases fixed for RISC-V (Bolognani) | commits `fcfd6f12`, `11a861e9` |
| 2024-01-24 | Default SCSI controller changed lsilogic to virtio-scsi; USB controller fixed to qemu-xhci with no fallback (Bolognani) | commits `3c8e60b9`, `d9add4c3` |
| 2024-07-05 (authored) / 2024-07-19 (committed) | UEFI/EDK2 firmware descriptor for riscv64 (Fedora edk2-riscv64) and UEFI-autoselection test added (Bolognani) | commits `a4fbb7bc`, `65b54e79`, shipped v10.6.0 (released 2024-08-05) |
| 2024-09-02 to 2024-09-04 | GitLab Issue #665 (UEFI RISC-V ACPI support request) filed and closed within 2 days by maintainer Peter Krempa; no linked commit/MR | [Issue #665](https://gitlab.com/libvirt/libvirt/-/work_items/665) |
| 2024-09-04 | QEMU 9.1.0 riscv64 capabilities data captured (`caps_9.1.0_riscv64.xml/.replies`), TCG-only | commit `a35a355b` |
| 2024-09-17 | riscv64 added to `arches_qemu_kvm` in RPM spec (Bolognani) | commit `50404ad3` |
| 2024-10-23 | AIA (Advanced Interrupt Architecture) feature implemented: `<feature>` XML with `none`/`aplic`/`aplic-imsic`, QEMU capability gating, command-line emission (Barboza) | commits `34d7f53d`, `817eabd0`, `56244892` |
| 2025-03-14 | KVM enabled for riscv64 on RHEL 10+ (Bolognani) | commit `2dd0ad6d` |
| 2025-08-01 | v11.6.0 released; virtio-scsi default for RISC-V ships | [libvirt NEWS](https://libvirt.org/news.html) |
| 2026-02-20 (downstream) | AlmaLinux RPM spec: "Enable KVM for riscv64" in `arches_qemu_kvm` | [AlmaLinux commit `6a01102dd5`](https://git.almalinux.org/rpms/libvirt/commit/6a01102dd563b6b19f9d0b24570457df8c1c0c3d) |

A compiler-detection fix (correct `__riscv` preprocessor guard for SMBIOS/sysinfo reads, previously the wrong macro was used) shipped downstream in libvirt 10.10.0-4ubuntu2 and was backported across Noble/Oracular/Plucky (tracked as Ubuntu Launchpad #2095488, Fix Released); see Section 11.

## 3. Upstream Support Tier

libvirt has no formal, written tier policy for architectures. riscv64 is treated as a de facto tier-2 architecture: included in device-default improvements, packaging, and (partially) capabilities data, but excluded from automatic CI gating, native test execution, and official binary releases.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI runs automatically on push/MR | Yes | Yes | No (`JOB_OPTIONAL: 1` forces `when: manual`) |
| CI uses a native runner | Yes | Yes | No (x86 runner, cross-compiler only) |
| CI required to pass (blocks merge) | Yes | Yes | No (`allow_failure` effectively true via template rules) |
| CI executes the test suite | Yes | Yes | No (cross-compile-only, no `qemu-user-static`) |
| QEMU capabilities data currency | QEMU 9.2+, 10.x | Multiple recent versions | Frozen at QEMU 9.1.0 (2024-09-04), TCG-only |
| Default machine type configured | N/A (i440fx/q35) | virt | virt (since v9.3.0/v9.4.0 era) |
| KVM enabled in RPM spec | Yes | Yes | Yes (since 2024-09-17) |
| CPU driver: feature negotiation | Full | Full | Stub (`compare()` always `IDENTICAL`; `validateFeatures()` always returns 0) |
| CPU model database (`src/cpu_map/`) | 178 XML files | 17 XML files | 0 files - none exist |
| Official upstream binary release | None (source only) | None (source only) | None (source only) |
| Distro binary release | Yes (primary archive) | Yes (primary archive) | Yes, via distro ports/secondary archives (Debian, Ubuntu, Arch RISC-V) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

libvirt is a virtualization-management daemon/library. It has no JIT compiler, no SIMD dispatch, no cryptography implementations, no garbage collector, and no assembly of any kind, for any architecture. There are no hot-path/performance-sensitive code paths at the libvirt layer; those live in QEMU (guest execution) or the Linux kernel (KVM). This is confirmed by a direct search for `extension:S riscv` and for any `arch/riscv/`, `.S`, JIT, or SIMD-dispatch code in the repository: none exists. The architecture-specific code that does exist is CPU-model/feature description, machine-type detection, device-default selection logic, and AppArmor policy paths, verified by direct inspection of the source tree.

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Architecture registration (`virarch.c`/`.h`) | Full | Full | Full | `VIR_ARCH_RISCV32`, `VIR_ARCH_RISCV64`, `ARCH_IS_RISCV()` macro, same treatment as every other arch |
| CPU driver: `compare()` | Full | Full | Stub | `virCPURiscv64Compare()` unconditionally `return VIR_CPU_COMPARE_IDENTICAL`; comment: "For now QEMU will perform all runtime checks" |
| CPU driver: `validateFeatures()` | Full | Full | Stub | One-line `return 0`, no validation performed |
| CPU driver: `update()` (host-model) | Full | Full | Functional | Real logic: converts `HOST_MODEL` to `CUSTOM` mode, copies host CPU info into the guest definition; same shape as the arm/loongarch/s390 implementations |
| CPU driver: `decode`/`encode`/`baseline`/`dataCopyNew`/`dataFree`/`getHost`/`updateLive`/`checkFeature`/`getModels`/`translate`/`expandFeatures`/`copyMigratable`/`dataIsIdentical` | Full | Full | Missing (NULL) | 19 of 25 `cpuArchDriver` struct fields are unset for riscv64; only `name`, `arch`, `narch`, `compare`, `update`, `validateFeatures` (6/25) are populated |
| CPU model database (`src/cpu_map/`) | Full (178 x86 XML files) | Full (17 arm XML files) | Missing | 0 riscv64 CPU model XML files exist anywhere in the tree (confirmed via GitLab repo-tree API on all 209 files in `cpu_map/`) |
| Machine-type detection | Full | Full | Full | `qemuDomainIsRISCVVirt()`/`qemuDomainMachineIsRISCVVirt()`, called from 7+ call sites gating PCI, defaults, and disk bus |
| AIA interrupt controller (Advanced Interrupt Architecture) | N/A | N/A | Full | riscv64-exclusive feature: XML enum (`aplic`/`aplic-imsic`), QEMU-capability-gated validation, `-M virt,aia=...` command-line emission - genuinely hand-built for this architecture, not boilerplate |
| Device defaults (net/video/SCSI/USB model selection) | Full (legacy defaults: e1000/rtl8139, vga, lsilogic) | Full (virtio) | Full (virtio) | Default net/video virtio, SCSI virtio-scsi since v11.6.0, USB qemu-xhci with no fallback |
| Driver registration/reachability | Full | Full | Full | `cpu.c` registers `&cpuDriverRiscv64` in the live dispatch table; the stub driver is reachable at runtime, not dead code |

**Bottom line:** riscv64 is functionally complete for domain definition, boot, machine-type/device defaults, and its own exclusive AIA interrupt feature. The single real, structural gap is CPU-model enumeration and negotiation: no `virsh domcapabilities` CPU-model listing, no `virsh cpu-baseline`, and no per-model feature validation. This is the same "tier-2" pattern libvirt applies to loongarch64 and s390 as well, not a riscv64 outlier; only x86 and, to a lesser extent, ppc64, have a fully fleshed-out CPU feature driver, reflecting where CPU-model migration compatibility has historically mattered most (x86 data-center fleets).

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Meson, minimum version `>= 0.57.0` (declared in top-level `meson.build`). C standard `c_std=gnu99`. No CMake, no autotools.

**Generic build commands** (`docs/compiling.rst`):
```
meson setup build -Dsystem=true
ninja -C build
ninja -C build test
```

**Exact riscv64 cross-build commands**, as actually run by CI (`ci/jobs.sh` `run_meson_setup()` plus the container's `MESON_OPTS`):
```
meson setup build --error -Dsystem=true --cross-file=riscv64-linux-gnu
meson compile -C build
```

**Cross file**, generated by the CI Dockerfile at `/usr/local/share/meson/cross/riscv64-linux-gnu`:
```
[binaries]
c = '/usr/bin/riscv64-linux-gnu-gcc'
ar = '/usr/bin/riscv64-linux-gnu-gcc-ar'
strip = '/usr/bin/riscv64-linux-gnu-strip'
pkgconfig = '/usr/bin/riscv64-linux-gnu-pkg-config'

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'
```

**Toolchain:** `meson.build` enforces no minimum GCC or Clang version (no `cc.version().version_compare()` gate for the compiler; the only `version_compare` uses are for Meson itself and for `libxl >= 4.13.0`). The only hard compiler requirement is GNU99 C support. In practice, CI uses whatever GCC ships in the target Debian release: Debian 13 "trixie" (`riscv64-debian-13`, the required/blocking job) installs `gcc-riscv64-linux-gnu` resolving to **GCC 14.2.0**; Debian sid (`riscv64-debian-sid`, allow-to-fail) resolves to **GCC 16.1.0**. No Clang cross-compiler is installed or tested for riscv64 in either container; Clang is used only in the native (amd64) ASAN/UBSAN job. A GCC version of 10 or later should minimally support gnu99/riscv64gc; GCC 14+ is what upstream CI actually exercises.

**Feature auto-disabling on riscv64:** libvirt uses Meson `feature: auto` (pkg-config autodetection) for nearly every optional driver; a feature silently drops if its `-dev` package is absent from the cross sysroot. Diffing the riscv64 cross Dockerfile against the native Debian 13 image shows `libxen-dev` (Xen/libxenlight driver) and `wireshark-dev` (Wireshark dissector) are absent for riscv64, so `driver_libxl` and `wireshark_dissector` auto-disable; this is architectural (Xen has no riscv64 port), not a libvirt gap. One driver is explicitly CPU-family-gated in `meson.build` itself (~line 1602): the Cloud-Hypervisor driver (`driver_ch`) hard-errors if forced `enabled` on any host other than x86_64/aarch64 Linux - on riscv64 it must be left at its default `auto` or explicitly `disabled`.

**QEMU usage in CI:** only `qemu-utils` (host-side `qemu-img` tooling, x86-side) is installed in the riscv64 cross containers - not a full `qemu-system-riscv64`. No `qemu-user-static` is present, so cross-compiled riscv64 binaries are never executed in CI; the riscv64 jobs validate compilation only.

**Container generation:** Dockerfiles are auto-generated by `lcitool manifest ci/manifest.yml` from the separate [libvirt-ci](https://gitlab.com/libvirt/libvirt-ci) project and must not be hand-edited. Recent `libvirt-ci` patches on the devel list ("forbid RISC-V cross compile on Debian < 13," "remove obsolete RISC-V ports setup for Debian 13+") show active, ongoing maintenance of the riscv64 cross-toolchain generator, moving riscv64 from unofficial Debian-ports/sid onto officially-supported Debian 13.

No riscv64-specific build failures are documented in any source searched.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap description |
|---------|-------|-------|---------|-----------------|
| Define and start QEMU VMs | Yes | Yes | Yes | No issues |
| CPU mode: host-passthrough | Yes | Yes | Yes | |
| CPU mode: host-model | Yes | Yes | Yes | `update()` implemented since v9.4.0 |
| CPU mode: custom (named model) | Yes | Yes | Partial | Accepted but unvalidated; QEMU performs the real check at runtime |
| CPU feature negotiation | Full | Full | None | No decode/encode/baseline; see Section 4 |
| `virsh domcapabilities` CPU models | Full | Full | None | NULL `decode`; no CPU model XML database |
| `virsh cpu-baseline` across guests | Yes | Yes | No | NULL `baseline` callback |
| AIA interrupt architecture | N/A | N/A | Full | riscv64-exclusive feature |
| UEFI boot | Yes | Yes | Yes | edk2-riscv64 descriptor present since 2024-07; autoselection-by-default tested |
| ACPI | Yes | Yes | Yes | Issue #665 (ACPI feature request) closed as already-handled/out-of-scope within 2 days |
| KVM acceleration (riscv64 host) | Yes | Yes | Yes (RPM spec only) | Added to `arches_qemu_kvm` 2024-09-17 (upstream RPM) and 2026-02-20 (AlmaLinux downstream); Debian packaging currency not independently confirmed [NEEDS VERIFICATION] |
| VirtualBox driver | Yes (amd64 only) | No | No | Architecture exclusion; not riscv64-specific |
| Xen driver | Yes | Yes | No | Xen upstream itself has no riscv64 port; `libvirt-daemon-driver-xen` is consequently unavailable for riscv64 in Ubuntu packaging - an upstream Xen limitation, not a libvirt gap |
| AppArmor confinement | Yes | Yes | Yes | u-boot, opensbi, EDK2 paths whitelisted; device-tree read access fixed (Launchpad #2127111) |
| SELinux confinement | Yes | Yes | Yes | `libselinux-dev:riscv64` available and built |
| Ceph/RBD storage driver | Yes | Yes | Yes | `librbd-dev:riscv64`/`librados-dev` present in CI and Ubuntu archive |
| GlusterFS storage driver | Yes | Yes | Yes | `libvirt-daemon-driver-storage-gluster` confirmed shipping for riscv64 in Ubuntu |
| iSCSI storage driver | Yes | Yes | Yes | `libiscsi-dev:riscv64` present |
| LXC driver | Yes | Yes | Yes | Architecture-agnostic, `feature: auto` |

**Security hardening gaps:** Data not available: no riscv64-specific security-hardening analysis of libvirt (e.g., stack-protector, CFI, ASLR interactions) was found in any source searched.

**Floating-point / numeric semantics:** Not applicable. libvirt processes XML configuration and issues management-plane calls; it performs no floating-point computation in any code path relevant to RISC-V.

**Functional gap summary:** The only user-visible functional gap is CPU-model enumeration/negotiation (Section 4). Users on riscv64 must rely on host-passthrough, or accept that `<cpu>` blocks naming specific models are passed through without libvirt-side validation (QEMU performs the actual check at guest launch). This is tracked, still open, at [Issue #391](https://gitlab.com/libvirt/libvirt/-/work_items/391).

## 7. CI/CD Infrastructure

riscv64 CI jobs are live and defined in the currently-included GitLab CI YAML chain (`.gitlab-ci.yml` -> `ci/gitlab.yml` -> `ci/gitlab/containers.yml` + `ci/gitlab/builds.yml`), verified by direct raw-file fetch with line numbers, not by search summary:

| Job name | File:lines | Base image | CROSS | JOB_OPTIONAL | Job-level allow_failure | Type |
|----------|-----------|-----------|-------|---------------|--------------------------|------|
| `riscv64-debian-13-container` | `ci/gitlab/containers.yml:157-162` | Debian 13 | - | 1 | false | Container build |
| `riscv64-debian-sid-container` | `ci/gitlab/containers.yml:213-218` | Debian sid | - | 1 | true | Container build |
| `riscv64-debian-13` | `ci/gitlab/builds.yml:329-338` | Debian 13 | riscv64 | 1 | false | Cross-compile build |
| `riscv64-debian-sid` | `ci/gitlab/builds.yml:420-429` | Debian sid | riscv64 | 1 | true | Cross-compile build |

**Critical detail, independently verified against `ci/gitlab/build-templates.yml` lines 39-149:** every rule branch checks `$JOB_OPTIONAL` first; when set (as it is, `1`, on all four riscv64 jobs), the matching rule is always `when: manual` plus `allow_failure: true`, across every push/MR/scheduled-pipeline path and both upstream and fork namespaces. This template-level rule overrides the job-level `allow_failure: false` declared on `riscv64-debian-13`/`riscv64-debian-13-container`. In practice these jobs never run in a normal pipeline unless a developer manually triggers them in the GitLab UI, and when triggered, failure is always tolerated - they cannot block a merge. `riscv64-debian-13-container`/`riscv64-debian-sid-container` extend `.container_job` (`ci/gitlab/container-templates.yml:16-43`), whose rules are stricter still: `on_success` fires only on an upstream push to the default branch touching the relevant Dockerfile or template, or on an upstream scheduled pipeline with `RUN_CONTAINER_BUILDS == "1"`, with `when: never` as the catch-all.

No native riscv64 CI runner exists; all four jobs run on x86 runners using the `gcc-riscv64-linux-gnu` cross-compiler. No riscv64 test execution occurs: there is no `qemu-user-static` in the riscv64 containers, and `ci/integration.yml`/`ci/integration-template.yml` (functional/integration tests) carry no riscv64 entry. The coverage is strictly "does it cross-compile."

s390x and ppc64le receive the identical `JOB_OPTIONAL: 1` treatment - riscv64 is not singled out; this is libvirt's standard CI posture for every non-tier-1 (non-x86_64/aarch64) architecture.

**RISE CI runners:** libvirt does not use RISE RISC-V Runners. Confirmed by a full scan of the RISE blog (35 posts, 2024-05 through 2026-09), the RISE wheel builder's 80-package list, the `riseproject-dev` GitHub org's 30 repos (including the Kernel & Virtualization Working Group), and multiple web searches - no RISE infrastructure, funding, or runner allocation ties to libvirt were found anywhere.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI job definitions exist | Yes | Yes | Yes (cross-compile only) |
| Runs automatically on push/MR | Yes | Yes | No (manual trigger only) |
| Native runner | Yes | Yes | No |
| Tests executed | Yes | Yes | No |
| Release-blocking | Yes | Yes | No |
| RISE runners used | N/A | N/A | No |

## 8. Distribution and Release Status

**Upstream releases:** Source tarballs only, via [gitlab.com/libvirt/libvirt tags](https://gitlab.com/libvirt/libvirt/-/tags). No pre-built riscv64 (or any-architecture) binary is distributed by the upstream project itself.

**PyPI (`libvirt-python`):** The package name literally "`libvirt`" does not exist on PyPI (`https://pypi.org/pypi/libvirt/json` returns HTTP 404). The real package, `libvirt-python`, currently at version 12.7.0 (released 2026-09-01), ships as a source distribution (`.tar.gz`) only for every release from 1.2.0 through 12.7.0 - zero wheel files exist for any architecture, riscv64 included. `pip install libvirt-python` on riscv64 compiles from source against local libvirt headers; this is true for every architecture, not a riscv64-specific gap. Confirmed by direct fetch of `pypi.org/simple/libvirt-python/` (zero `riscv64` occurrences, consistent with zero wheels of any kind).

**Debian:** Debian trixie (stable, Debian 13) ships full riscv64 support for the core package family (`libvirt-daemon`, `libvirt-clients`, `libvirt-daemon-system`, `libvirt-daemon-driver-qemu`, `libvirt-daemon-driver-lxc`, `libvirt-dev`, etc.), architecture-excluding only `libvirt-daemon-driver-vbox` (amd64 only) and `libvirt-daemon-driver-xen` (amd64/arm64 only, per the Section 6 Xen gap). Debian is also libvirt's CI cross-compile target (13 required, sid best-effort), and `libvirt-ci` patches show active work moving riscv64 off unofficial Debian-ports/sid onto officially-supported Debian 13.

**Ubuntu:** Ubuntu 26.04 "resolute" (26.04 LTS) ships riscv64 builds for the large majority of libvirt binary packages via the ports pocket/archive, confirmed by a direct fetch of `packages.ubuntu.com` (not the primary archive): `libvirt-clients`, `libvirt-daemon`, `libvirt-daemon-system`, `libvirt-common`, `libvirt0`, `libvirt-dev`, `libvirt-daemon-driver-qemu`, `libvirt-glib-1.0-0`, `python3-libvirt`, and others all list riscv64 at version **12.0.0-1ubuntu5**. A material caveat: amd64/arm64 have already received a security point release to **12.0.0-1ubuntu5.5**, while riscv64 (along with armhf, ppc64el, s390x) remains pinned at the pre-security-update **12.0.0-1ubuntu5**, i.e. riscv64 binaries exist but currently lag the security patch level shipped to tier-1 architectures. Only Xen- and VirtualBox-specific driver subpackages are absent for riscv64, matching the architectural gap noted above. Ubuntu 24.04 "noble" ships an equivalent full package set at 10.0.0-2ubuntu8.

**Arch Linux RISC-V port (archriscv.felixc.at):** Confirmed directly from the repository directory index (not the site's search box, which returns false negatives due to client-side JS requirements) and independently cross-verified against a second mirror (`mirror.iscas.ac.cn/archriscv`): `libvirt-1:12.7.0-1-riscv64.pkg.tar.zst` (built 2026-09-01, signed), plus `libvirt-python`, `libvirt-dbus`, `libvirt-glib`, `libvirt-storage-gluster`, and `libvirt-storage-iscsi-direct` riscv64 packages, all dated and signed identically on both mirrors. This version (12.7.0, built 2026-09-01) matches the current `libvirt-python` PyPI release date exactly, a strong signal this is live, current data.

**What a user must do to get a working riscv64 libvirt binary today:** install from Debian trixie, Ubuntu noble/resolute ports, or Arch Linux RISC-V (all of which carry current or near-current versions); or build from source against riscv64-targeted distro dependencies. No official upstream-built binary exists for riscv64 (or any architecture) at any libvirt version.

## 9. Dependencies

Source for the dependency list: `meson.build` at gitlab.com/libvirt/libvirt (master) and `ci/containers/debian-13-cross-riscv64.Dockerfile` (the authoritative, lcitool-generated riscv64 cross-build package manifest). riscv64 availability cross-checked against the Debian 13/sid cross-build container's installed `:riscv64` packages and against Ubuntu 26.04 "resolute" package listings (`packages.ubuntu.com`), since the `project-graph` SPARQL query tool was unreachable this session (`CONNECTION_CLOSED`).

| Dependency | Role | Criticality | riscv64 status |
|---|---|---|---|
| GLib | runtime-dependency (event loop, GObject type system) | critical | `libglib2.0-dev:riscv64` installed in CI container; builds and ships in Debian sid/Ubuntu resolute |
| GnuTLS | runtime-dependency (TLS for remote RPC) | critical | `libgnutls28-dev:riscv64` installed in CI container; builds and ships |
| libxml2 | runtime-dependency (domain/network/storage XML parsing) | critical | `libxml2-dev:riscv64` installed in CI container; builds and ships. See `project-reports/libxml2.md` for upstream CI detail |
| QEMU | runtime-dependency (primary hypervisor backend) | critical | Not a build dependency; only `qemu-utils` (x86-side disk-image tooling) is present in the riscv64 cross container, not `qemu-system-riscv64`. QEMU's own riscv64 host/guest support is out of scope of this report; see `project-reports/qemu.md` |
| Meson | build-dependency (build system) | critical | Architecture-independent (Python-based); no riscv64-specific issue found |
| GCC | build-dependency (cross-compiler) | critical | `gcc-riscv64-linux-gnu` resolves to GCC 14.2.0 (Debian 13) / GCC 16.1.0 (Debian sid); no Clang cross-compiler tested for riscv64 |
| Python | build-dependency (codegen scripts) | optional | `python3` installed, architecture-independent |
| libcurl | runtime-dependency (storage/network driver HTTP(S) transport) | optional | `libcurl4-gnutls-dev:riscv64` in the CI Dockerfile (Ubuntu ships `libcurl4-openssl-dev` for the same role); builds and ships. See `project-reports/libcurl.md` |
| readline | runtime-dependency (`virsh` interactive shell editing) | optional | `libreadline-dev:riscv64` installed; builds and ships. See `project-reports/readline.md` |
| libnl | runtime-dependency (netlink, network driver) | optional | `libnl-3-dev:riscv64`, `libnl-route-3-dev:riscv64` installed; builds and ships |
| Cyrus SASL | runtime-dependency (SASL auth for libvirtd RPC) | optional | `libsasl2-dev:riscv64` installed; builds and ships |
| libselinux | runtime-dependency (SELinux security driver) | optional | `libselinux-dev:riscv64` installed; builds and ships |
| AppArmor | runtime-dependency (AppArmor security driver) | optional | `libapparmor-dev:riscv64` installed; builds and ships. See `project-reports/apparmor.md` |
| libacl | runtime-dependency (POSIX ACL support) | optional | `libacl1-dev:riscv64` installed; builds and ships |
| libaudit | runtime-dependency (audit-subsystem logging) | optional | `libaudit-dev:riscv64` installed; builds and ships |
| libcap-ng | runtime-dependency (privilege dropping for libvirtd/helpers) | optional | `libcap-ng-dev:riscv64` installed; builds and ships |
| libpcap | runtime-dependency (nwfilter packet capture) | optional | `libpcap0.8-dev:riscv64` installed; builds and ships |
| libnuma | runtime-dependency (NUMA topology/pinning) | optional | `libnuma-dev:riscv64` installed; builds and ships. See `project-reports/libnuma.md` |
| systemd | runtime-dependency (udev device enumeration/hotplug) | optional | `libudev-dev:riscv64` installed; builds and ships |
| json-c | runtime-dependency (QEMU QMP monitor JSON parsing) | optional | `libjson-c-dev:riscv64` installed; builds and ships |
| FUSE | runtime-dependency (libvirt-lxc/guest-agent filesystem) | optional | `libfuse3-dev:riscv64` installed; builds and ships |
| device-mapper | runtime-dependency (LVM2 storage pools) | optional | `libdevmapper-dev:riscv64` installed; builds and ships |
| Ceph | runtime-dependency (RBD storage pools) | optional | `librbd-dev:riscv64` installed in CI; `librbd-dev`/`librados-dev` also confirmed in Ubuntu 26.04. See `project-reports/ceph.md` |
| libssh | runtime-dependency (SSH transport, remote driver) | optional | `libssh-dev:riscv64` installed; builds and ships |
| libssh2 | runtime-dependency (SSH transport, storage driver) | optional | `libssh2-1-dev:riscv64` installed; builds and ships |
| libtirpc | runtime-dependency (ONC-RPC/XDR support) | optional | `libtirpc-dev:riscv64` installed; builds and ships |
| libiscsi | runtime-dependency (iSCSI storage pools) | optional | `libiscsi-dev:riscv64` installed; builds and ships |
| GlusterFS | runtime-dependency (GlusterFS storage pools) | optional | `libglusterfs-dev:riscv64` installed; `libvirt-daemon-driver-storage-gluster` itself confirmed shipping for riscv64 in Ubuntu |
| libparted | runtime-dependency (disk partitioning, storage driver) | optional | `libparted-dev:riscv64` installed; builds and ships |
| Xen | runtime-dependency (Xen hypervisor driver) | optional | **Unavailable on riscv64.** `libxen-dev`/`libxl` is not packaged for riscv64 in any distro checked (found only on amd64/arm64) because the Xen hypervisor itself has no riscv64 port. `driver_libxl` auto-disables and `libvirt-daemon-driver-xen` is consequently not built for riscv64 - an upstream Xen limitation, not a libvirt-side gap |

**Additional indirect dependencies** identified in the riscv64 cross-build container manifest but not in libvirt's direct dependency list above: `glibc`/`libc6-dev:riscv64` (standard C library, implicit), `libattr1-dev:riscv64` (underlies libacl), `libblkid-dev:riscv64`, `libpciaccess-dev:riscv64`, `libsanlock-dev:riscv64` (lock-manager plugin), and `systemtap-sdt-dev:riscv64` (SDT/dtrace probes, present for riscv64 unlike the Wireshark dissector). All six are installed successfully in the riscv64 cross container; no blocking issues were found for any of them.

No dependency in this list has JIT, SIMD, or hand-tuned cryptography code that would itself require RISC-V-specific engineering to enable libvirt's use of it - GnuTLS's own ISA-specific crypto paths (AES, SHA) are the closest exception, but that is GnuTLS's own riscv64 status, tracked separately and out of scope for libvirt's own port work.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | riscv64 Impact | Notes |
|----|-------|--------|----------|----------------|-------|
| [GitLab #391](https://gitlab.com/libvirt/libvirt/-/work_items/391) | Implement CPU driver for 'riscv64' architecture | **Open** (since 2022-10-11) | Enhancement | High - no CPU feature negotiation, no model enumeration | The reported symptom (cannot declare a `<cpu>` block) was functionally fixed by commits `fd703358` (2023-01) and `d4c39bad` (2023-05, `update()`), but decode/encode/baseline remain unimplemented and the issue itself was never formally closed - a triage gap, not ongoing unaddressed breakage |
| [GitLab #665](https://gitlab.com/libvirt/libvirt/-/work_items/665) | Request for enabling UEFI RISC-V ACPI support for QEMU using libvirt | Closed (2024-09-04, 2 days after filing) | Enhancement | None (resolved) | Closed by maintainer Peter Krempa with no linked commit/MR; short turnaround suggests already-handled/out-of-scope (ACPI is QEMU machine-type default behavior) rather than a code fix |
| [Ubuntu Launchpad #2095488](https://bugs.launchpad.net/ubuntu/+source/libvirt) | [SRU] RISC-V: Host sysinfo extraction not supported on this platform | Fix Released | Bug | Was High - `libvirtd` failed to start on riscv64 (`Function not implemented`) | Root cause: `src/util/virsysinfo.c` used the wrong compiler macro for RISC-V detection, breaking SMBIOS reads. Fixed in libvirt 10.10.0-4ubuntu2 (Plucky), backported to Noble (10.0.0-2ubuntu8.7) and Oracular (10.6.0-1ubuntu3.3), and Debian 12.7.0-1 |
| [Ubuntu Launchpad #1990499](https://bugs.launchpad.net/ubuntu/+source/libvirt/+bug/1990499) | Cannot use /usr/lib/u-boot/qemu-riscv64_smode/... | Fix Released | Bug | Was High - AppArmor (`virt-aa-helper`) blocked RISC-V boot firmware paths | Fixed in libvirt 8.0.0-1ubuntu7.3 (Jammy) / 8.6.0-0ubuntu3 (Kinetic) |
| [Ubuntu Launchpad #1996285](https://bugs.launchpad.net/ubuntu/+source/libvirt/+bug/1996285) | [SRU] riscv64 images fail to boot with libvirt | Marked Invalid for libvirt | Bug | None (misattributed) | Root cause traced to a u-boot 2022.07 regression in virtio PCI BAR enumeration, fixed in u-boot packaging, not libvirt |
| Ubuntu Launchpad #2127111 | systemd-detect-virt returns "Permission denied" on RISC-V guests | Fix Released | Bug | Low - virt-detection only | AppArmor profile lacked read access to `/sys/firmware/devicetree/base`; fixed in apparmor 5.0.0~alpha1-0ubuntu8.3 |
| vagrant-libvirt [Issue #1538](https://github.com/vagrant-libvirt/vagrant-libvirt/issues/1538) / [PR #1633](https://github.com/vagrant-libvirt/vagrant-libvirt/pull/1633) | Impossible to start RISC-V machine | Closed (downstream fix, merged 2022-10-30) | Bug | Downstream only | Same root cause as GitLab #391, fixed in vagrant-libvirt (made CPU-element generation conditional) years before libvirt's own `update()` patch landed - the "omit `<cpu>`" workaround was known ecosystem-wide well before upstream addressed it |

**QEMU capabilities data gap (not a filed bug):** the only riscv64 QEMU capabilities snapshot in `tests/qemucapabilitiesdata/` is `caps_9.1.0_riscv64.xml` (captured 2024-09-04). No snapshot exists for QEMU 9.2+, 10.x, or 11.x, and the existing snapshot is TCG-only - no KVM-accelerated riscv64 scenario is covered by the test suite.

## 12. Objections and Upstream Blockers

**Stated technical blockers:**

1. CPU driver incompleteness (Issue #391, open since 2022, ~4 years): `compare()` unconditionally returns `IDENTICAL`, `validateFeatures()` is a no-op, and decode/encode/baseline are NULL. This is an engineering backlog item; no committer has objected to or blocked completing it.
2. QEMU capabilities data frozen at 9.1.0 (captured 2024-09-04): no maintainer has since captured a `caps_10.x_riscv64.xml` or `caps_11.x_riscv64.xml`. This is a gap, not a stated objection, and it means riscv64 test coverage does not exercise any QEMU 10/11 feature bits.
3. CI is manual-trigger-only (`JOB_OPTIONAL: 1`) on all four riscv64 jobs: no documented decision to change this to automatic was found, so riscv64 cross-compile regressions are not caught automatically on every push/MR.

**Organizational blockers:** None found. The project has no stated policy against RISC-V. Red Hat, libvirt's dominant maintainer organization, is a RISE Premier Member and actively enables RISC-V across its own product portfolio, though this has not translated into RISE-funded or RISE-run libvirt-specific work (see Section 14).

**Acceptance probability for new RISC-V contributions:** High. The contribution model is straightforward mailing-list patch review. The precedent of Ventana Micro (Daniel Henrique Barboza) landing the CPU driver and the AIA feature in 2023-2024 establishes that external organizations, including RISC-V silicon vendors, can and do land significant riscv64 work through the normal process.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

libvirt's upstream GitLab CI defines dedicated riscv64 jobs (`riscv64-debian-13`, `riscv64-debian-sid` in [ci/gitlab/builds.yml](https://gitlab.com/libvirt/libvirt/-/raw/master/ci/gitlab/builds.yml), and their container jobs in `ci/gitlab/containers.yml`), but these are cross-compile-only (`meson setup --cross-file=riscv64-linux-gnu`) with no riscv64 test-suite execution (no `qemu-user-static`, no `ci/integration.yml` coverage for riscv64) and no upstream riscv64 binary release (PyPI's `libvirt-python` is sdist-only for every version). Per the color model's CI-evidence rule, build-only CI (build yes, test no) caps the primary grade at yellow regardless of the distro-provided packages (Debian trixie/sid, Ubuntu noble/resolute all ship riscv64 libvirt builds) that do deliver a usable riscv64 package to end users. libvirt is a virtualization-management daemon/library with no JIT, SIMD, or hot-path code, so it is not an optimization-purpose project and no optimization-level modifier applies.

**Pending work that could change the grade:** GitLab Issue #391 (open since 2022-10-11, [work item #391](https://gitlab.com/libvirt/libvirt/-/work_items/391)) tracks the still-incomplete riscv64 CPU driver - decode/encode/baseline remain unimplemented even though `compare()`/`update()` were added in 2023 and 2025 (note: git-commit-verified, the `update()` patch actually landed 2023-04-28/2023-05-04, shipping in v9.4.0; a mail-archive.com re-crawl artifact misdated it as 2025-01-22, but the underlying commit `d4c39bad` is from 2023). The two riscv64 CI jobs are marked `JOB_OPTIONAL: 1`, meaning they run on manual trigger rather than automatically on every push/MR, so riscv64 cross-compile regressions are not caught automatically. No GitLab merge requests exist for riscv64 work (all changes land as mailing-list-reviewed direct commits), and no RISE project involvement (funding, runners, or wheel builds) was found for libvirt in any source searched.

## 14. Investment Analysis

RISE has no funded or published work on libvirt: confirmed by a full scan of the RISE blog (35 posts), the RISE wheel builder's package list (libvirt absent from all 80 entries), the `riseproject-dev` GitHub org's 30 repos including the Kernel & Virtualization Working Group (whose one closed issue referencing libvirt, #50, is a generic "extend QEMU-KVM to use libvirt" tracking item with no attached benchmark data or further activity), and the RISE member list (Red Hat is a Premier Member, but that does not extend to project-level RISE involvement in libvirt). All existing riscv64 support was contributed by Red Hat, Ventana Micro, SUSE, and Canonical without RISE funding, runners, or infrastructure.

### 14.1 Functional Enablement

The primary gap is the CPU driver (Issue #391). Closing it requires: (1) implementing RISC-V ISA-extension enumeration, most plausibly via QEMU's `-cpu list`/QMP `query-cpu-model-expansion`, (2) implementing `decode`/`encode` to convert between QEMU's RISC-V extension-string representation and libvirt's domain-XML CPU model representation, and (3) implementing `baseline` to compute the feature intersection across a set of hosts. The ARM CPU driver (`src/cpu/cpu_arm.c`) is the closest structural template, as it was for the existing `update()` implementation. A secondary, smaller gap is refreshing the QEMU capabilities test data past 9.1.0 (2024-09-04), which requires a riscv64 host or riscv64 QEMU-TCG environment and a one-time `virsh capabilities` dump per QEMU release.

### 14.2 Performance Optimization

Not applicable. libvirt has no JIT, SIMD, or other performance-sensitive code path; it is a management daemon, not a workload execution engine. No benchmark data for libvirt on riscv64 (boot time, virtualization overhead, throughput vs. bare metal or vs. arm64/amd64) was found in any source searched, including a full scan of the RISE blog, Phoronix, and general web search - this data appears not to exist publicly as of this report's date.

### 14.3 CI/CD Infrastructure

Two concrete gaps: (1) removing or conditioning `JOB_OPTIONAL: 1` so the existing riscv64 cross-compile jobs run automatically on every push/MR rather than requiring manual trigger - a small CI-manifest change; and (2) adding native riscv64 test execution (either a riscv64 hardware runner or `qemu-user-static`-based emulation inside the existing cross-build jobs) so the test suite, not just compilation, is validated. The former is low-effort; the latter requires hardware or RISE runner allocation, neither of which currently exists for libvirt.

### 14.4 Ecosystem Enablement

Not applicable in the dependent-package-ecosystem sense (no plugin/extension registry, no language package index of dependent packages to track). The one loosely related item, `libvirt-python`'s PyPI sdist-only distribution, is not riscv64-specific (it ships no wheels for any architecture) and does not block riscv64 use, since users compile it from source against the system libvirt headers regardless of architecture.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Complete CPU driver: implement `decode`/`encode`/`baseline` for riscv64 (ISA-extension enumeration, domain-capabilities listing, `cpu-baseline` support) | 4-6 | Upstream contributor (Ventana Micro, Red Hat, or other RISC-V vendor) | High |
| CI/CD | Remove/condition `JOB_OPTIONAL: 1` so riscv64 cross-compile jobs run automatically on push/MR | 0.5 | libvirt CI maintainer | Medium |
| Functional | Refresh QEMU capabilities data for riscv64 on QEMU 9.2+/10.x/11.x (requires riscv64 host or TCG access) | 1 | Upstream contributor with riscv64 hardware | Medium |
| CI/CD | Add native riscv64 CI test execution (hardware runner or `qemu-user-static`-based) | 2 (integration) + ongoing infra | RISE / Red Hat | Medium |
| Functional | Formally close Issue #391 once CPU-driver completeness is verified on a riscv64 KVM host | 0.5 | Upstream committer | Low |
| Distribution | Track/verify Ubuntu riscv64 security-patch-level parity (currently lagging amd64/arm64 by one point release) | 0.5 (tracking only, distro-owned fix) | Ubuntu/Canonical | Low |

## 15. References

- [libvirt project homepage](https://libvirt.org/)
- [libvirt GitLab repository](https://gitlab.com/libvirt/libvirt)
- [libvirt NEWS / changelog](https://libvirt.org/news.html)
- [GitLab tags (release list)](https://gitlab.com/libvirt/libvirt/-/tags)
- [GitLab Issue #391: Implement CPU driver for riscv64](https://gitlab.com/libvirt/libvirt/-/work_items/391)
- [GitLab Issue #665: Request for enabling UEFI RISC-V ACPI support](https://gitlab.com/libvirt/libvirt/-/work_items/665)
- [ci/gitlab/builds.yml (riscv64 cross-build jobs)](https://gitlab.com/libvirt/libvirt/-/raw/master/ci/gitlab/builds.yml)
- [ci/gitlab/containers.yml (riscv64 container jobs)](https://gitlab.com/libvirt/libvirt/-/raw/master/ci/gitlab/containers.yml)
- [src/cpu/cpu_riscv64.c (CPU driver)](https://gitlab.com/libvirt/libvirt/-/raw/master/src/cpu/cpu_riscv64.c)
- [src/util/virarch.c (architecture registration)](https://gitlab.com/libvirt/libvirt/-/raw/master/src/util/virarch.c)
- [src/qemu/qemu_validate.c (AIA feature validation)](https://gitlab.com/libvirt/libvirt/-/raw/master/src/qemu/qemu_validate.c)
- [devel mailing list: PATCH v2 00/11 RISC-V Guest Support (Lubomir Rintel, 2018)](https://lists.libvirt.org/archives/list/devel@lists.libvirt.org/message/AYD4OLDUYH35Q76MFF5ZJ65RJ3XW5FZF/)
- [devel mailing list: cpu_riscv64.c add update() implementation (Daniel Henrique Barboza)](https://www.mail-archive.com/devel@lists.libvirt.org/msg07959.html)
- [devel mailing list: tests: Add test for UEFI autoselection on riscv64 (Andrea Bolognani)](https://www.mail-archive.com/devel@lists.libvirt.org/msg04744.html)
- [vagrant-libvirt Issue #1538](https://github.com/vagrant-libvirt/vagrant-libvirt/issues/1538)
- [vagrant-libvirt PR #1633](https://github.com/vagrant-libvirt/vagrant-libvirt/pull/1633)
- [AlmaLinux libvirt.spec commit: Enable KVM for riscv64](https://git.almalinux.org/rpms/libvirt/commit/6a01102dd563b6b19f9d0b24570457df8c1c0c3d)
- [Ubuntu Launchpad #1996285: riscv64 images fail to boot with libvirt](https://bugs.launchpad.net/ubuntu/+source/libvirt/+bug/1996285)
- [Ubuntu Launchpad #1990499: Cannot use /usr/lib/u-boot/qemu-riscv64_smode](https://bugs.launchpad.net/ubuntu/+source/libvirt/+bug/1990499)
- [Debian buildd status for libvirt (sid)](https://buildd.debian.org/status/package.php?p=libvirt&suite=sid)
- [Ubuntu packages search: libvirt on resolute](https://packages.ubuntu.com/search?keywords=libvirt&suite=resolute&searchon=names&section=all)
- [PyPI libvirt-python (sdist only)](https://pypi.org/project/libvirt-python/)
- [Arch Linux RISC-V port repository](https://archriscv.felixc.at/repo/extra/)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project members](https://riseproject.dev/members/)
- [libvirt-ci (lcitool, CI manifest source)](https://gitlab.com/libvirt/libvirt-ci)