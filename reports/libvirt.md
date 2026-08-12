---
title: libvirt
categories:
  - iaas
---

# libvirt
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libvirt<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libvirt is a C library and daemon providing a unified API for managing virtualization technologies: QEMU/KVM, LXC, Xen, and others. It is the backend for virt-manager, oVirt, OpenStack Nova, and most Linux-based cloud orchestration stacks. All hypervisor interaction -- VM lifecycle, virtual device configuration, network/storage management -- is mediated through libvirt's XML-driven domain model.

**License:** GNU General Public License v2 or later. No CLA required. Contributions require a Developer Certificate of Origin (Signed-off-by line). Primary review channel is the libvir-list mailing list; GitLab MRs are accepted but historically uncommon.

**Governance:** Meritocratic, consensus-based. Four roles: Users, Contributors, Committers (repository write access, granted after approximately 2-3 months of sustained quality patches), and Security Team (committers plus vendor security representatives). No single committer controls the project. Conflict-of-interest policy requires committers to prioritize community over employer interests or to recuse.

**Corporate maintainers for RISC-V work (from commit history):**
- Andrea Bolognani, Red Hat -- dominant RISC-V contributor: QEMU capabilities data (QEMU 4.0 through 9.1), firmware descriptors, KVM enablement for RHEL, headless-mmio tests, serial console, panic test coverage.
- Daniel Henrique Barboza, Ventana Micro (later IBM/Red Hat) -- CPU driver authorship (2023), AIA feature implementation (2024).
- Peter Krempa, Red Hat -- ongoing maintenance, capabilities cleanup, test infrastructure.
- Michal Privoznik, Red Hat -- CI maintainer; added Debian 13 riscv64 CI (2026-06-02).
- Jim Fehlig, SUSE -- changed default machine type to `virt` for RISC-V (2023).
- Christian Ehrhardt, Canonical -- AppArmor allow rules for riscv64 loader paths (2022).
- Heinrich Schuchardt, Canonical/Debian -- EDK II AppArmor paths (2024), RISC-V compiler detection fix (2025).

The project is overwhelmingly Red Hat-staffed for RISC-V work, with secondary contributions from Ventana Micro, SUSE, and Canonical.

**Community stance on new ports:** Open and incremental. RISC-V support was built over six years via standard patch review -- no formal port acceptance process. libvirt does not tier architectures explicitly; RISC-V is treated as a peer alongside aarch64, loongarch64, s390x, and ppc64.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the master branch of [gitlab.com/libvirt/libvirt](https://gitlab.com/libvirt/libvirt). libvirt uses email-based patch review; zero GitLab MRs exist for RISC-V because all code lands via mailing-list review as direct commits. Four separate GitLab MR API searches ("riscv64", "riscv", "RISC-V", "aia") returned empty arrays.

| Date | Event | Source |
|------|-------|--------|
| 2018-08-24 | First RISC-V commit: `qemuDomainIsRISCVVirt()` and `qemuDomainMachineIsRISCVVirt()` machine-type detection functions added by Lubomir Rintel (Red Hat) | [gitlab.com/libvirt/libvirt](https://gitlab.com/libvirt/libvirt) commit history |
| 2018-08 | 16550A serial console configured for RISC-V virt guests (Bolognani) | commit history |
| 2018-10 | RPM spec: disabled unavailable features (numctl, numad, zfs-fuse) on riscv64 (Berrange) | commit history |
| 2019-04 | AppArmor riscv32/riscv64 profiles added (intrigeri, Debian/Tails); QEMU 4.0 PCIe Root Port capabilities for riscv64 (Bolognani) | commit history |
| 2020-2021 | Capabilities data updates for QEMU 5.0, 5.2 | commit history |
| 2022-06-18 | TPM device fix for non-x86 including riscv: `tpm-tis` changed to `tpm-tis-device` (Cole Robinson) | commit `b233bf89` |
| 2022-09-27 | AppArmor: allow common riscv64 loader paths (u-boot, opensbi) -- Christian Ehrhardt, Canonical | commit `31ea9433` |
| 2023-01-06 | Dedicated riscv64 CPU driver added: `src/cpu/cpu_riscv64.c` with compare and validateFeatures stubs -- Daniel Henrique Barboza, Ventana Micro | commit `fd703358` |
| 2023-04-14 | Default machine type changed from `spike_v1.10` to `virt` for RISC-V -- Jim Fehlig, SUSE | commit `b9236758` |
| 2023-04-28 | CPU driver: `update()` callback added, enabling `<cpu mode='custom'>` for riscv64 -- Barboza | commit `d4c39bad` |
| 2023-05-02 | v9.3.0 released: default machine type change ships | [libvirt NEWS](https://libvirt.org/news.html) |
| 2024-01-16 | Removed memballoon default on RISC-V; improved `qemuDomainSupportsPCI()` for RISC-V edge cases -- Bolognani | commits `fcfd6f12`, `11a861e9` |
| 2024-01-24 | Default SCSI controller changed from lsilogic to virtio-scsi for RISC-V -- Bolognani | commit `3c8e60b9` |
| 2024-01-24 | USB controller selection fixed for RISC-V (qemu-xhci with no fallback) -- Bolognani | commit `d9add4c3` |
| 2024-07-05 | UEFI/EDK2 firmware descriptor for riscv64 (Fedora edk2-riscv64) and UEFI autoselection test -- Bolognani | commits `a4fbb7bc`, `65b54e79` |
| 2024-09-04 | QEMU 9.1.0 riscv64 capabilities data captured (`caps_9.1.0_riscv64.xml/replies`) -- Krempa | commit `a35a355b` |
| 2024-09-17 | riscv64 added to `arches_qemu_kvm` in RPM spec (KVM package enabled for riscv64 Fedora/RHEL) -- Bolognani | commit `50404ad3` |
| 2024-10-23 | AIA (Advanced Interrupt Architecture) feature implemented: XML `<feature>` element with `none`/`aplic`/`aplic-imsic` values; QEMU capability gating; command-line emission -- Barboza | commits `34d7f53d`, `817eabd0`, `56244892` |
| 2025-01-22 | RISC-V compiler detection fix: correct define is `__riscv`, not previous incorrect define -- Heinrich Schuchardt | commit `3e9440db` |
| 2025-03-14 | KVM enabled for riscv64 on RHEL 10+ -- Bolognani | commit `2dd0ad6d` |
| 2025-08-01 | v11.6.0 released: virtio-scsi default for RISC-V ships | [libvirt NEWS](https://libvirt.org/news.html) |
| 2026-02 | UEFI vars device (`uefi-vars-sysbus`) support for riscv64/aarch64/loongarch64 | commit `12cdd613` area |
| 2026-06-02 | Debian 13 riscv64 cross-build CI added by Michal Privoznik | commit `4984c5bd` |
| 2026-06-01 | v12.4.0 released (latest as of report date) | [GitLab tags](https://gitlab.com/libvirt/libvirt/-/tags) |

---

## 3. Upstream Support Tier

libvirt has no formal tier policy for architectures. RISC-V is treated implicitly as a tier-2 architecture: included in capabilities data updates, packaging, and device-default improvements, but not gating release builds or receiving native CI runners.

Evidence for current tier classification:

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI: automatic on push | Yes | Yes | No (manual-only, JOB_OPTIONAL=1) |
| CI: native runner | Yes | Yes | No (cross-compile only) |
| CI: required to pass | Yes | Yes | No (optional jobs) |
| QEMU capabilities data | QEMU 9.2+, 10.x | Multiple versions | Frozen at QEMU 9.1.0 (2024-09-04) |
| Default machine type configured | Yes | Yes | Yes (virt, since v9.3.0) |
| KVM enabled in RPM spec | Yes | Yes | Yes (since 2024-09-17) |
| UEFI firmware descriptor | Yes | Yes | Yes (since 2024-07-05) |
| CPU driver: feature negotiation | Full | Full | Stub (compare always IDENTICAL) |
| CPU driver: decode/encode/baseline | Yes | Yes | NULL (unimplemented) |
| Official upstream binary | None (source only) | None (source only) | None (source only) |

The riscv64 tier gaps are: no automatic CI gate, QEMU capabilities data not updated past 9.1.0, and a stub-only CPU driver. All other QEMU-level integration (machine type, devices, AIA, UEFI, KVM package) is at parity with arm64.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libvirt is a virtualization management API. It contains no JIT compiler, no SIMD dispatch, no cryptography implementations, no GC, and no assembly. Performance-sensitive code paths do not exist at the libvirt layer; they are in the hypervisor (QEMU) or the kernel (KVM). The architecture-specific code in libvirt covers: CPU feature negotiation logic, machine-type detection, device-default selection, and AppArmor policy generation.

**Architecture-specific components and riscv64 status:**

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Architecture registration (virarch.c) | Full | Full | Full | `VIR_ARCH_RISCV32`, `VIR_ARCH_RISCV64`, `ARCH_IS_RISCV()` macro |
| CPU driver: compare | Full | Full | Stub | `virCPURiscv64Compare()` always returns `VIR_CPU_COMPARE_IDENTICAL` |
| CPU driver: validateFeatures | Full | Full | Stub | Always returns 0 with no validation |
| CPU driver: update (host-model) | Full | Full | Functional | Copies host model into guest definition |
| CPU driver: decode | Full | Full | NULL | Not implemented |
| CPU driver: encode | Full | Full | NULL | Not implemented |
| CPU driver: baseline | Full | Full | NULL | Not implemented |
| CPU model database (cpu_map/) | Full (x86 XML) | Full (arm XML) | Missing | No riscv64 CPU XML files exist |
| Machine-type detection | Full | Full | Full | `qemuDomainIsRISCVVirt()` |
| AIA interrupt architecture | N/A | N/A | Full | Unique to riscv64: `aplic`/`aplic-imsic` XML feature |
| Default machine type | N/A | virt | virt | Since v9.3.0 (2023) |
| Default SCSI controller | lsilogic (legacy x86) | virtio-scsi | virtio-scsi | Since v11.6.0 (2025) |
| Default net model | e1000/rtl8139 | virtio | virtio | `qemuDomainIsRISCVVirt()` gated |
| Default video device | vga | virtio | virtio | `qemuDomainIsRISCVVirt()` gated |
| UEFI firmware descriptor | Yes | Yes | Yes | edk2-riscv64 (Fedora), `/usr/share/qemu-efi-riscv64/` (Debian) |
| AppArmor loader paths | Full | Full | Full | u-boot, opensbi, EDK2 paths whitelisted |
| RISC-V compiler detection | N/A | N/A | Corrected 2025-01-22 | Was using wrong define; fixed in commit `3e9440db` |

The absence of decode/encode/baseline in the CPU driver means: users cannot list available RISC-V CPU models via `virsh domcapabilities`, cannot request a specific CPU model in the domain XML, and cannot use `virsh cpu-baseline` across guests. Host-passthrough mode (`<cpu mode='host-passthrough'>`) is the only functional option.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Meson. Minimum version: `>= 0.57.0`. libvirt does not use CMake or autotools.

**Standard build commands for riscv64 cross-compilation:**

```
meson setup build --error -Dsystem=true --cross-file=riscv64-linux-gnu
meson compile -C build
meson test -C build --no-suite syntax-check --print-errorlogs
```

**Cross-file location:** `/usr/local/share/meson/cross/riscv64-linux-gnu`, written by the CI Dockerfile:

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

**Toolchain:** GCC (`gcc-riscv64-linux-gnu`, Debian-packaged). No minimum GCC version is specified in `meson.build`. The CI uses whatever GCC is current in Debian 13 or Debian sid at build time. Clang is not used for riscv64 cross-builds; it is used only in the Ubuntu 26.04 ASAN/UBSAN job (amd64 only).

**Known `meson.build` toolchain workarounds (architecture-independent):**
- `-Wlogical-op` regression workaround for GCC 6.0+ (bug #69602)
- `array_bounds=2` downgraded to `1` under sanitizers due to GCC 11.1.1 false positives

No riscv64-specific build flags, `-D` option exclusions, or known build failures are documented in the research findings.

**QEMU usage in CI:** `qemu-utils` (host-side disk image tools) is installed in the cross-build container but is x86-side only. There is no `qemu-user-static` in the riscv64 containers; cross-compiled riscv64 binaries are not executed in CI. Test suite execution for riscv64 does not occur.

**Meson `-D` flags for riscv64:** No riscv64-specific flags identified. Standard flags used in CI: `-Dsystem=true`. Optional: `-Ddriver_qemu=enabled` (explicit QEMU driver requirement), `-Dwerror=false` (disable `-Werror`).

**Container generation:** Dockerfiles are auto-generated by `lcitool manifest ci/manifest.yml` from [gitlab.com/libvirt/libvirt-ci](https://gitlab.com/libvirt/libvirt-ci). Do not edit manually.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

libvirt's feature surface for riscv64 is nearly complete at the QEMU guest management layer. The primary structural gap is the CPU driver.

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap description |
|---------|-------|-------|---------|-----------------|
| Define and start QEMU VMs | Yes | Yes | Yes | No issues |
| CPU mode: host-passthrough | Yes | Yes | Yes | |
| CPU mode: host-model | Yes | Yes | Yes | `update()` callback implemented |
| CPU mode: custom (specific model) | Yes | Yes | Partial | `update()` works but no model enumeration; `<model>rv64</model>` works per issue #391 resolution |
| CPU feature negotiation | Full | Full | None | No decode/encode/baseline; QEMU handles at runtime |
| `virsh domcapabilities` CPU models | Full | Full | None | NULL decode; no CPU model XML database |
| `virsh cpu-baseline` across guests | Yes | Yes | No | NULL baseline callback |
| AIA interrupt architecture | N/A | N/A | Full | riscv64-unique feature |
| UEFI boot | Yes | Yes | Yes | edk2-riscv64 descriptor present |
| ACPI | Yes | Yes | Yes | `riscv64-virt-acpi` test fixture confirmed |
| KVM acceleration (host = riscv64) | Yes | Yes | Yes (RPM only) | Added to `arches_qemu_kvm` in 2024; Debian packaging not confirmed |
| VirtualBox driver | Yes (amd64) | Yes (arm64) | No | Architecture exclusion; upstream limitation |
| Xen driver | Yes (amd64) | Yes (arm64) | No | Architecture exclusion; Xen lacks riscv64 support |
| AppArmor confinement | Yes | Yes | Yes | u-boot, opensbi, edk2 paths whitelisted |
| SELinux confinement | Yes | Yes | Yes | libselinux available for riscv64 |
| Ceph/RBD storage | Yes | Yes | Yes | Debian trixie: `librbd-dev:riscv64` in cross Dockerfile |
| LXC driver | Yes | Yes | Yes | libvirt-daemon-driver-lxc ships for riscv64 on Ubuntu 24.04 |

**Security hardening gaps:** Data not available: no riscv64-specific security hardening analysis of libvirt was found in any source searched.

**Floating-point / numeric semantics:** Not applicable. libvirt processes XML configuration; no floating-point operations in hot paths.

**Functional gap summary:** The only functional gap that affects users today is the absence of CPU model enumeration and feature negotiation. Users must run guests in host-passthrough or accept that `<cpu>` blocks with specific models are accepted without feature validation. This is documented in [Issue #391](https://gitlab.com/libvirt/libvirt/-/work_items/391) (open since 2022-10-11).

---

## 7. CI/CD Infrastructure

**Cross-compilation CI jobs (GitLab CI, confirmed from `ci/gitlab/builds.yml` and `ci/gitlab/containers.yml`):**

| Job name | Base image | CROSS | JOB_OPTIONAL | allow_failure | Type |
|----------|-----------|-------|--------------|---------------|------|
| riscv64-debian-13 | debian:13-slim | riscv64 | 1 | false | Cross-compile |
| riscv64-debian-sid | debian:sid-slim | riscv64 | 1 | true | Cross-compile |
| riscv64-debian-13-container | builds debian-13-cross-riscv64 image | -- | 1 | false | Container build |
| riscv64-debian-sid-container | builds debian-sid-cross-riscv64 image | -- | 1 | true | Container build |

**Critical detail:** All four riscv64 jobs set `JOB_OPTIONAL: 1`. Per the `.cross_build_job` template rules in `ci/gitlab/build-templates.yml`, `JOB_OPTIONAL: 1` forces the job to `when: manual` with `allow_failure: true` in normal pipeline runs. These jobs do NOT run automatically on push or merge request. They must be manually triggered by a developer in the GitLab UI. The `allow_failure: false` on the debian-13 job definition is overridden by the template-level `when: manual` behavior.

**No native riscv64 CI runners.** All riscv64 jobs use x86 runners with `gcc-riscv64-linux-gnu` cross-compiler.

**No riscv64 test execution.** Cross-compiled binaries cannot run on x86 runners without QEMU user-mode emulation. No `qemu-user-static` is installed in the riscv64 containers. Meson test invocation is present in the CI template but will be a no-op or skipped for cross targets.

**RISE CI runners:** libvirt does not use RISE RISC-V Runners. No RISE involvement was found in any source searched (confirmed by full scan of RISE blog, RISE wheel builder, and four separate web searches).

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | Yes | Yes | Yes (cross only) |
| Runs automatically on push | Yes | Yes | No (manual trigger) |
| Native runner | Yes | Yes | No |
| Tests executed | Yes | Yes | No |
| Release blocking | Yes | Yes | No |
| RISE runners | N/A | N/A | No |

---

## 8. Distribution and Release Status

**Upstream releases:** Source tarballs only. Latest: v12.4.0 (2026-06-01). No pre-built riscv64 binaries are distributed upstream.

**Debian trixie (stable, Debian 13):** Full riscv64 support. Version 11.3.0-3+deb13u2. Packages confirmed: libvirt-daemon, libvirt-clients, libvirt-daemon-system, libvirt-daemon-driver-qemu, libvirt-daemon-driver-lxc, libvirt-dev, all major packages. Architecture-specific exclusions: libvirt-daemon-driver-vbox (amd64 only), libvirt-daemon-driver-xen (amd64/arm64 only).

**Debian sid (unstable):** libvirt 12.4.0-1 shows "Needs-Build" for riscv64 on [buildd.debian.org](https://buildd.debian.org/status/package.php?p=libvirt&suite=sid) -- no build log, no assigned builder. Prior version 12.3.0-1 was successfully built (confirmed via packages.debian.org). The "Needs-Build" state represents a build-queue backlog, not a known code failure. All other architectures (amd64, arm64, armhf, s390x, ppc64el) show "Installed".

**Ubuntu 24.04 (noble):** libvirt 10.0.0-2ubuntu8 for riscv64 via the ports archive. Full suite: libvirt0, libvirt-clients, libvirt-daemon, libvirt-daemon-system, libvirt-daemon-driver-qemu, libvirt-daemon-driver-lxc, libvirt-dev, libvirt-dbus, libvirt-glib, libvirt-sanlock, libvirt-wireshark. Security-updated version on amd64 is 10.0.0-2ubuntu8.11; riscv64 is at the base 10.0.0-2ubuntu8 with no confirmed security backports [NEEDS VERIFICATION].

**Ubuntu 26.04 (resolute):** libvirt 12.0.0 for riscv64 in the main archive (including HWE variants). [NEEDS VERIFICATION -- sourced from one search result, not directly fetched]

**ArchPOWER (Arch Linux RISC-V):** libvirt 11.1.0 confirmed via Repology, lagging behind ppc64/ppc64le at 12.0.0. The archriscv.felixc.at status page returned 404 during research; version data sourced from Repology only [NEEDS VERIFICATION].

**PyPI (libvirt-python):** No binary wheels exist for any architecture. Every release (1.2.0 through 12.4.0) is a source distribution (`.tar.gz`, sdist only). Users must compile `libvirt-python` from source against local libvirt headers. Confirmed by live fetch of [pypi.org/simple/libvirt-python/](https://pypi.org/simple/libvirt-python/).

**What a user must do to get a working riscv64 libvirt binary:** Install from Debian trixie (11.3.0) or Ubuntu noble ports (10.0.0), or build from source against riscv64-targeted Debian/Ubuntu dependencies. No pre-built package at the current upstream version (12.4.0) is available for riscv64 in any major distribution as of the report date.

---

## 9. Dependencies

All required and most optional build dependencies of libvirt are available for riscv64 on Debian sid. No dependency is a code-level blocker. The following table is derived from the `ci/containers/debian-13-cross-riscv64.Dockerfile` (auto-generated by lcitool) and Debian buildd data.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| glib-2.0 / gobject / gio (>= 2.68) | Core event loop, object system, I/O | Installed (Debian sid 2.88.1-2) | Unknown | Debian sid, Ubuntu 24.04 | None known |
| gnutls (>= 3.6.0) | TLS transport for all remote connections | Installed (Debian sid 3.8.13-1) | Unknown | Debian sid, Ubuntu 24.04 | None known |
| libxml-2.0 (>= 2.9.1) | Parses all domain/network/pool XML | Installed (Debian sid 2.15.3+dfsg-1) | Unknown | Debian sid | None known. See `reports/libxml2.md` |
| QEMU (runtime, not build dep) | Primary hypervisor backend | Installed (Debian sid 1:11.0.1+ds-1) | Unknown (riscv64 host) | Debian sid | None for host-side libvirt use. See `reports/qemu.md` |
| libcurl (>= 7.19.1, optional) | Storage driver remote access, migration URLs | Installed (Debian sid 8.21.0~rc3-1) | Unknown | Debian sid | None known. See `reports/libcurl.md` |
| glibc (implicit) | Standard C library | Available (Debian sid riscv64 port) | Tested as part of Debian riscv64 port | Debian ports | None known. See `reportsaries/glibc.md` |
| readline (optional) | virsh interactive line editing | Installed (Debian sid 8.3-4) | Unknown | Debian sid | None. See `reports/readline.md` |
| libcap-ng (optional) | Capability management for daemon privilege drop | Installed (Debian sid 0.9.3-1) | Unknown | Debian sid | None. See `reports/libcap.md` |
| libselinux (optional) | SELinux MAC policy for VM resources | Installed (Debian sid 3.10-1) | Unknown | Debian sid | None |
| libnl-3.0 / libnl-route-3.0 (optional) | Netlink-based virtual network configuration | Installed (Debian sid 3.12.0-2+b1) | Unknown | Debian sid | None |
| Python 3 (build tool) | Code generation scripts | Available (Debian sid) | N/A | Available | None. See `reports/python.md` |

No dependency has JIT, SIMD, or cryptography paths that would require RISC-V-specific work to enable libvirt itself. The GnuTLS dependency has its own ISA-specific crypto (AES, SHA); those paths are covered in glibc/GnuTLS status reports, not in libvirt.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | riscv64 Impact | Notes |
|----|-------|--------|----------|----------------|-------|
| [#391](https://gitlab.com/libvirt/libvirt/-/work_items/391) | Implement CPU driver for 'riscv64' architecture | OPEN (since 2022-10-11) | Enhancement | High (no CPU feature negotiation, no model enumeration) | Root cause partially addressed by commits `fd703358` (2023-01-06) and `d4c39bad` (2023-04-28); driver exists but compare/validateFeatures are stubs, decode/encode/baseline are NULL. Issue never formally closed despite code landing. |
| [#387](https://gitlab.com/libvirt/libvirt/-/work_items/387) | virsh capabilities does not list QEMU emulators | CLOSED (2025-06-06) | Bug | None | macOS/cross-prefix path discovery bug; riscv64 tangentially mentioned only. Closed as unconfirmed/stale. |
| [#665](https://gitlab.com/libvirt/libvirt/-/work_items/665) | Enable UEFI RISC-V ACPI support via libvirt | CLOSED (2024-09-04, 2 days open) | Enhancement | None (resolved) | ACPI support for riscv64 already present; `riscv64-virt-acpi` test fixture confirmed in codebase. Closed by Peter Krempa. |
| [Debian #1127125](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1127125) | libvirt FTBFS during forky support period | OPEN (reported 2026-02-06) | Important | None directly | `nsstest` failure unrelated to any ISA; RISC-V caps file processes without error in the test suite. |

**QEMU capabilities data gap (not a filed bug):** The only riscv64 QEMU capabilities snapshot in `tests/qemucapabilitiesdata/` is `caps_9.1.0_riscv64.xml` (captured 2024-09-04). No snapshots exist for QEMU 9.2+, 10.x, or 11.x. All entries in the capabilities file are TCG-only (no KVM entries), meaning no KVM-accelerated riscv64 guest scenario is covered by the test suite.

---

## 12. Objections and Upstream Blockers

**Stated technical blockers:**

1. CPU driver incompleteness (Issue #391, open 4 years): The `cpu_riscv64.c` stub has compare returning IDENTICAL unconditionally and decode/encode/baseline as NULL. There is no stated organizational objection to completing this; it is an engineering backlog item. No upstream committer has blocked or opposed completing it.

2. QEMU capabilities data frozen at 9.1.0: No maintainer has captured `caps_10.x_riscv64.xml` or `caps_11.x_riscv64.xml`. This is a gap, not a stated objection. It means riscv64 test coverage does not exercise QEMU 10/11 feature bits.

3. CI is manually triggered, not automatic: `JOB_OPTIONAL: 1` was set when riscv64 cross-compile jobs were added. No documented decision to change this to automatic was found. This means riscv64 cross-compilation regressions are not caught automatically.

**Organizational blockers:** None. The project has no stated policy against RISC-V. Red Hat (dominant maintainer) is a RISE Premier Member and actively enables RISC-V across its product portfolio.

**Acceptance probability for new RISC-V contributions:** High. The contribution model is patch-based with straightforward review. The precedent of Ventana Micro contributing the CPU driver in 2023 establishes that external organizations can land significant RISC-V work.

---

## 13. Investment Analysis

RISE has no funded or published work on libvirt. All existing RISC-V support was contributed by Red Hat, Ventana Micro, SUSE, and Canonical without RISE involvement.

### 13.1 Functional Enablement

The primary functional gap is the CPU driver (Issue #391). Completing it requires: (1) implementing RISC-V ISA extension enumeration via QEMU's `-cpu list` output or the QEMU machine protocol, (2) implementing decode/encode to convert between QEMU extension strings and the libvirt domain XML representation, and (3) implementing baseline to compute the intersection of CPU features across a set of host systems. The ARM CPU driver (`src/cpu/cpu_arm.c`) is the structural template.

Updating the QEMU capabilities data for current QEMU releases (10.x, 11.x) requires access to a riscv64 host or a riscv64 QEMU TCG environment and a one-time `virsh capabilities` dump on each QEMU version.

### 13.2 Performance Optimization

Not applicable. libvirt is a management daemon; it is not in any performance-sensitive path for workloads.

### 13.3 CI/CD Infrastructure

The two gaps are: (1) making riscv64 cross-compile jobs run automatically rather than manually (removing or conditionally setting `JOB_OPTIONAL: 1`), and (2) adding native riscv64 CI runners for test execution. The former is a one-line CI manifest change. The latter requires hardware or RISE runner allocation.

### 13.4 Ecosystem Enablement

Not applicable. libvirt has no dependent package ecosystem in the sense of the prompt (no plugin/extension registry, no language package index with wheel-like artifacts). The `libvirt-python` binding is source-only (no wheels) but does not block riscv64 use -- users compile from source against system libvirt.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Complete CPU driver: implement decode/encode/baseline/validateFeatures for riscv64 (ISA extension enumeration, domain caps listing, cpu-baseline support) | 4-6 | Upstream contributor (Ventana Micro, Red Hat, or external) | High |
| Functional | Update QEMU capabilities data for QEMU 9.2, 10.x, 11.x on riscv64 (requires riscv64 host access) | 1 | Upstream contributor with riscv64 hardware | Medium |
| CI/CD | Change riscv64 cross-compile jobs from JOB_OPTIONAL=1 (manual) to automatic in CI manifest | 0.5 | libvirt CI maintainer (Privoznik/Bolognani) | Medium |
| CI/CD | Add native riscv64 CI runners for test execution (requires RISE runner allocation or hardware sponsorship) | 2 (integration) + ongoing infrastructure | RISE / Red Hat | Medium |
| Functional | Close Issue #391: formal closure after verifying CPU driver completeness on a riscv64 KVM host | 0.5 | Upstream committer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libvirt project homepage](https://libvirt.org/)
- [libvirt GitLab repository](https://gitlab.com/libvirt/libvirt)
- [libvirt NEWS / changelog](https://libvirt.org/news.html)
- [GitLab tags (release list)](https://gitlab.com/libvirt/libvirt/-/tags)
- [Issue #391: Implement CPU driver for riscv64](https://gitlab.com/libvirt/libvirt/-/work_items/391)
- [Issue #387: virsh capabilities does not list QEMU emulators](https://gitlab.com/libvirt/libvirt/-/work_items/387)
- [Issue #665: Request for enabling UEFI RISC-V ACPI support](https://gitlab.com/libvirt/libvirt/-/work_items/665)
- [ci/gitlab/builds.yml (riscv64 cross-build jobs)](https://gitlab.com/libvirt/libvirt/-/raw/master/ci/gitlab/builds.yml)
- [ci/gitlab/containers.yml (riscv64 container jobs)](https://gitlab.com/libvirt/libvirt/-/raw/master/ci/gitlab/containers.yml)
- [src/cpu/cpu_riscv64.c (CPU driver)](https://gitlab.com/libvirt/libvirt/-/raw/master/src/cpu/cpu_riscv64.c)
- [src/util/virarch.c (architecture registration)](https://gitlab.com/libvirt/libvirt/-/raw/master/src/util/virarch.c)
- [src/qemu/qemu_validate.c (AIA feature validation)](https://gitlab.com/libvirt/libvirt/-/raw/master/src/qemu/qemu_validate.c)
- [Debian buildd status for libvirt (sid)](https://buildd.debian.org/status/package.php?p=libvirt&suite=sid)
- [Ubuntu noble libvirt0 package (riscv64)](https://packages.ubuntu.com/noble/libvirt0)
- [PyPI libvirt-python (sdist only)](https://pypi.org/project/libvirt-python/)
- [Debian Bug #1127125: libvirt FTBFS during forky support period](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1127125)
- [RISE Project homepage](https://riseproject.dev/)
- [libvirt-ci (lcitool, CI manifest source)](https://gitlab.com/libvirt/libvirt-ci)