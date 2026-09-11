---
title: lxd
parent: Project Reports
color: orange
dependencies:
  - name: QEMU
    relation: runtime-dependency
    criticality: critical
  - name: EDK2
    relation: runtime-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: libseccomp-golang
    relation: build-dependency
    criticality: critical
  - name: LXC
    relation: runtime-dependency
    criticality: critical
  - name: virtiofsd
    relation: runtime-dependency
    criticality: optional
  - name: Ceph
    relation: runtime-dependency
    criticality: optional
  - name: OVN
    relation: runtime-dependency
    criticality: optional
  - name: ZFS
    relation: runtime-dependency
    criticality: optional
---

# lxd

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for lxd<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="lxd" %}

## 1. Project Overview

LXD is a container and virtual-machine management daemon written in Go, wrapping liblxc for containers and QEMU for VMs. The canonical upstream repository moved from `github.com/lxc/lxd` to `github.com/canonical/lxd` after "Canonical's takeover of the LXD project"; the old `lxc/lxd` slug now redirects to and identifies a separate community fork, **Incus** (Apache-2.0, no CLA, module `github.com/lxc/incus/v7`), maintained by the original LXD developer team under the Linux Containers project. This report covers **Canonical's LXD** (`canonical/lxd`), which is what "lxd" refers to as a shipping product today.

Governance is single-vendor: there is no independent foundation or multi-vendor steering committee. CODEOWNERS is simply `* @canonical/lxd-maintainers`. Contributors must sign Canonical's CLA (CCLA) plus DCO and cryptographically sign commits. The Code of Conduct is Ubuntu's, not an independent one. License is **AGPL-3.0-only** (relicensed from Apache-2.0 when Canonical took the project under CLA). All effective maintainers (tomponline/Thomas Parrott, simondeziel, kadinsayani, markylaing, MusicDin, roosterfish, tugbataluy, nmezhenskyi, elijahgreenstein) are Canonical employees, organized by domain ownership (`.github/domain-owners.json`). Commercial monetization is via Ubuntu Pro and Managed Services.

RISE membership: Canonical Group Limited is a **General Member** of the RISE project (not Premier - Premier tier is Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent). This is Canonical's general corporate membership; no LXD-specific RISE-funded work was found (see Section 12).

Community stance on new ports: the original 2020 riscv64 addition was accepted from an external, non-Canonical contributor (Joe Holden) without apparent pushback, via the standard CCLA/DCO/review process - no dedicated governance RFC exists for new architecture ports.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-02-18 | PR [#6893](https://github.com/canonical/lxd/pull/6893) "add riscv architecture definitions" merged (container-only; riscv32/riscv64 IDs 11/12 added to `shared/osarch/architectures.go`; 128-bit RISC-V explicitly excluded for lack of kernel support). First release: `lxd-3.22`. | [PR #6893](https://github.com/canonical/lxd/pull/6893), [commit 2a8c995](https://github.com/canonical/lxd/commit/2a8c995880cdb01fd3d0f8ab1705709c6638b2b4) |
| 2020-06 | riscv64 added to LXD build tags. | [lxc-devel mailing list](https://lists.linuxcontainers.org/pipermail/lxc-devel/2020-June/022024.html) |
| 2023-09-08 | Snapcraft workaround: skip embedded doc build on riscv (QEMU not yet available on riscv64 in the snap base). | [commit 4c05db8](https://github.com/canonical/lxd/commit/4c05db8e4c858143c8414e12858d53c1666c2748) |
| 2024-01-22 | Snapcraft workaround: make `bios-256k.bin` optional at prime step for armhf/riscv. | [commit 9efbcd9](https://github.com/canonical/lxd/commit/9efbcd934f73f990c8b3b91f2ef85f747870fb56) |
| 2025-06-30 | PR [#15892](https://github.com/canonical/lxd/pull/15892) "add riscv64 QEMU definitions" opened by xypron (Heinrich Schuchardt). | [PR #15892](https://github.com/canonical/lxd/pull/15892) |
| 2025-10-16 | Tracking issue [#16750](https://github.com/canonical/lxd/issues/16750) "Make riscv64 a tier 1 architecture" filed by simondeziel (Canonical). Still open. | [Issue #16750](https://github.com/canonical/lxd/issues/16750) |
| 2025-09-26 | PR #15892 marked **draft** by maintainer tomponline, "pending roadmap scheduling" - dormant ~7 months. | [PR #15892 discussion](https://github.com/canonical/lxd/pull/15892) |
| 2026-04-22 | Juju-team engineer (taurus-forever) requests merge acceleration for RISC-V testing; reports `/dev/kvm` present but LXD still reports "KVM support is missing" [NEEDS VERIFICATION - single source, no confirmed resolution in findings]. | [PR #15892 discussion](https://github.com/canonical/lxd/pull/15892) |
| 2026-05-07/08 | PR #15892 un-drafted, reviewed (Copilot AI caught a firmware-naming bug, fixed), approved, merged. | [PR #15892](https://github.com/canonical/lxd/pull/15892) |
| 2026-05-22 to 2026-05-26 | Companion packaging PR [lxd-pkg-snap#1216](https://github.com/canonical/lxd-pkg-snap/pull/1216) "RISC-V: enable virtual machines" opened and merged - stages OpenSBI/EDK2/libatomic1, builds QEMU with `--enable-tcg`, re-enables Ceph/OVN/ZFS for riscv64 snap builds. | [PR #1216](https://github.com/canonical/lxd-pkg-snap/pull/1216) |
| 2026-05-22 to 2026-05-27 | PR [#18318](https://github.com/canonical/lxd/pull/18318) "disable ACPI for RISC-V VMs" fixes a kernel-7.0 boot failure (LP #2153582). Merged. | [PR #18318](https://github.com/canonical/lxd/pull/18318) |
| 2026-06-19/23 | Follow-up snap-build PRs enable riscv64 documentation ([#18521](https://github.com/canonical/lxd/pull/18521)) and lxd-ui ([#18497](https://github.com/canonical/lxd/pull/18497)) compilation. | [PR #18521](https://github.com/canonical/lxd/pull/18521), [PR #18497](https://github.com/canonical/lxd/pull/18497) |
| 2026-06-23 | `lxd-6.9` tagged - first release containing PR #15892 and #18318. | GitHub Releases (see Section 8) |
| 2026-07-01 | `lxd-pkg-snap` repository **archived**. Future home of riscv64 snap-packaging work not addressed in findings. [NEEDS VERIFICATION] | [lxd-pkg-snap#1216](https://github.com/canonical/lxd-pkg-snap/pull/1216) |
| 2026-07-16 | Commit [b6bd7ea](https://github.com/canonical/lxd/commit/b6bd7ea46c04c3aee7a71723c7a29f83e1a19db3) "use shared memory backend on all arches" (ported from Incus) extends virtiofs support to non-x86 arches including riscv64. | commit b6bd7ea |
| 2026-09-02 | Issue [#18972](https://github.com/canonical/lxd/issues/18972) (EDK II boot-menu delay) filed, still open, unassigned fix. | [Issue #18972](https://github.com/canonical/lxd/issues/18972) |

Key contributors: **Joe Holden** (external, 2020 original architecture-definition PR), **xypron / Heinrich Schuchardt** (primary driver of the 2025-2026 VM-enablement work: PR #15892, #18318, lxd-pkg-snap#1216, issue #18972), **tomponline / Thomas Parrott** (Canonical, LXD maintainer and gatekeeper - raised and resolved a design objection, controlled the 7-month draft/roadmap delay), **simondeziel** (Canonical, filed the #16750 tracking issue, did snap-side review and caught a core26/OpenSBI packaging risk).

Is it fully upstream? Container-level riscv64 support (2020) and the core QEMU/EDK2 VM-driver code (PR #15892, #18318) are merged into `canonical/lxd` main. Snap packaging (Ceph/OVN/ZFS/virtiofsd, TCG QEMU build) is merged into `lxd-pkg-snap` (now archived). No fork or downstream patch set is required to run current mainline LXD source on riscv64 - the riscv64 support is upstream code, not a third-party patch.

## 3. Upstream Support Tier

No formal architecture-tiering document exists (no PLATFORMS.md/SUPPORT.md). Architecture support is implicit via the CI build matrix and the snap build recipe rather than a published tier policy. Release support is time-based (LTS 5-year, feature releases until next release), not architecture-based.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (self-hosted `lxc-incus-build`) | Yes (self-hosted `lxc-incus-build`) | No |
| CI test | Yes | Yes | No |
| GitHub Releases binary | Yes | Yes | No |
| Snap Store (default `stable` channel) | Yes | Yes | No |
| Snap Store (pinned tracks: 5.21/stable, 5.0/stable, 6/edge) | Yes | Yes | Yes (confirmed live, [api.snapcraft.io](https://api.snapcraft.io/v2/snaps/info/lxd), HTTP 206) |
| Container support | Yes | Yes | Yes (since 2020) |
| VM support | Yes | Yes | Yes (since `lxd-6.9`, 2026-06-23), but Ceph/OVN/ZFS/virtiofsd/checkpoint-restore incomplete |

## 4. Technical Architecture and RISC-V-Specific Subsystems

LXD is a pure-Go orchestration daemon: it shells out to `liblxc` and QEMU for actual virtualization and has no JIT, no SIMD/vector dispatch, and no assembly of its own for any architecture, RISC-V included. A repo-wide search (`find -iname '*riscv*'`, `find -name '*.S'/'*.s'`, arch-directory search) found zero assembly files and no `arch/riscv/` directory. All riscv64-related code is architecture-*identification* and configuration wiring:

| File | Purpose | riscv64 content |
|---|---|---|
| `shared/osarch/architectures.go` | Arch-ID enum/tables | `ARCH_64BIT_RISCV_LITTLE_ENDIAN`=12, name `"riscv64"`, personality `linux64` |
| `lxd/instance/drivers/driver_qemu.go` | QEMU VM driver | riscv64 in UEFI-capable list; resolves `qemu-system-riscv64`; bus type `pcie` |
| `lxd/instance/drivers/driver_qemu_templates.go` | QEMU config generation | machine type `virt`; RAM object `riscv_virt_board.ram`; `acpi="off"` workaround (comment cites LP #2153582) |
| `lxd/instance/drivers/edk2/edk2.go` | UEFI firmware resolution | `/usr/share/qemu-efi-riscv64`, `RISCV_VIRT_CODE.fd`/`RISCV_VIRT_VARS.fd` pair; GENERIC boot only, no Secure Boot entry |
| `lxd/seccomp/seccomp.go` + `lxd/include/syscall_numbers.h` | Seccomp/audit-arch syscall tables | Dedicated `AUDIT_ARCH_RISCV64` row; hand-written `__NR_bpf`/`__NR_kcmp` numbers under `#elif defined __riscv` |
| `lxd/seccomp/sysinfo_64.go` | 64-bit sysinfo struct | riscv64 included in build tag, generic 64-bit path |

Comparison table (production wiring quality, per the adversarial code-read verification):

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture enum/naming | Full | Full | Full |
| QEMU VM driver (machine type, RAM object) | Full | Full | Full - hand-picked `riscv_virt_board.ram` matching QEMU's internal object name, plus a real upstream-bug workaround (`acpi="off"`, LP #2153582) |
| UEFI/EDK2 firmware | Full, incl. Secure Boot | Full, incl. Secure Boot | Full for GENERIC boot; **no Secure Boot** (explicit, discussed design decision during PR #15892 review - RISC-V lacks a centralized signing authority analogous to Microsoft's for x86/ARM; not a gap in LXD's implementation) |
| Seccomp/audit-arch syscall table | Full | Full | Full - dedicated numeric table, not a generic fallback |
| Container (LXC) support | Full since inception | Full since inception | Full since 2020 |
| Golden-output test coverage | Yes | Yes | Yes - `driver_qemu_config_test.go` asserts exact generated config text for riscv64 (machine type, ACPI-off, RAM-backend name), though these tests execute on amd64 CI hosts, not native riscv64 hardware |

No RISC-V ISA extensions (RVV, Zba, Zbb, Zvkned) are used or relevant anywhere in LXD's own codebase, since LXD never operates at the instruction-set level - that concern belongs entirely to its dependencies (QEMU, liblxc, dqlite; see Section 9).

## 5. Build System, Cross-Compilation, and Toolchain

**Data discrepancy flagged per verification policy:** one research pass characterizing "lxd's" build system (Makefile-based, `make deps`/`make`, Go >=1.26, `cowsql`/`raft` native deps, a `.devcontainer/Dockerfile`) in fact cloned `github.com/lxc/lxd`, which - as multiple other independent research passes confirm (README/CONTRIBUTING identify it as Incus, `go.mod` module is `github.com/lxc/incus/v7`) - is the **Incus fork, not Canonical's LXD**. That pass's specific findings (Go 1.26 requirement, `cowsql` dependency name, devcontainer contents) describe Incus and are excluded here rather than misattributed to `canonical/lxd`.

What is confirmed for `canonical/lxd` itself (from the dependency deep-dive, which explicitly read `canonical/lxd`'s `go.mod`, `Makefile`, and `snap/snapcraft.yaml`, and used dependency name `canonical/dqlite` - consistent with the real canonical/lxd, which does not use the renamed `cowsql` fork):
- LXD is a Go project using `cgo` to link against `liblxc` and `canonical/dqlite` (which itself embeds `raft` and links `libuv`, `libsqlite3`, `liblz4`).
- Native C dependencies (`liblxc`, `dqlite`, `raft`) require a C toolchain as the cgo backend; `CGO_CFLAGS`/`CGO_LDFLAGS` point at built `dqlite`/`raft` library paths.
- QEMU is a **runtime** hypervisor dependency for VM instances only, not used for cross-compilation or build-time emulation.

**Data not available:** `canonical/lxd`'s own documented minimum Go/GCC version requirements, and a verified, tested riscv64 cross-compilation recipe for `canonical/lxd` specifically. No riscv64-specific build documentation, Dockerfile, or CI cross-compile job was found for `canonical/lxd` in any research pass. (The "no documented riscv64 cross-compile path, DIY only" conclusion from the Incus-repo pass is not directly transferable, since it describes a different, forked codebase - flagged as [NEEDS VERIFICATION] for canonical/lxd specifically.)

Known build/boot failures found: kernel-7.0 ACPI incompatibility on riscv64 VMs (`sysfs: cannot create duplicate filename '/devices/pci0000:00/0000:00:01.1/resource0'`, LP #2153582), fixed by [PR #18318](https://github.com/canonical/lxd/pull/18318). Core26/Resolute packaging risk: `opensbi-riscv64-generic-fw_dynamic.bin` moves from the `qemu-system-data` package (Noble) into the separate `qemu-system-riscv`/`opensbi` package (Resolute) - flagged and resolved during [lxd-pkg-snap#1216](https://github.com/canonical/lxd-pkg-snap/pull/1216) review (QEMU only symlinks to the firmware; the `opensbi` package supplies it).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Containers (LXC) | Yes | Yes | Yes (since 2020) |
| VMs (QEMU) | Yes | Yes | Yes (since PR #15892, `lxd-6.9`) |
| UEFI Secure Boot for VMs | Yes | Yes | No - architectural, RISC-V ecosystem lacks a signing authority |
| KVM hardware acceleration | Yes | Yes | No - lxd-pkg-snap#1216 requires QEMU built `--enable-tcg` for riscv64 (software emulation only); a KVM-availability report from a Juju engineer is unresolved in the findings [NEEDS VERIFICATION] |
| Ceph storage backend | Yes | Yes | Re-enabled in riscv64 snap build via lxd-pkg-snap#1216, but tracking issue [#16750](https://github.com/canonical/lxd/issues/16750) remains open pending core24->core26 transition for full availability |
| OVN networking | Yes | Yes | Same status as Ceph |
| ZFS storage backend | Yes | Yes | Userspace tools ship (`zfsutils-linux`); re-enabled at snap-build level; **kernel module itself reported broken**: [openzfs/zfs#18989](https://github.com/openzfs/zfs/issues/18989) "ZFS 2.4.4 (and master) not working on riscv64 with Linux 7.1.10" (open) |
| virtiofsd | Yes | Yes | Missing per #16750 as filed; commit [b6bd7ea](https://github.com/canonical/lxd/commit/b6bd7ea46c04c3aee7a71723c7a29f83e1a19db3) (2026-07-16) extends shared-memory backend to non-x86 arches, status not fully confirmed resolved |
| Live migration / checkpoint-restore (CRIU) | Yes | Yes | Blocked - [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) "Support for RISC-V" open, no upstream riscv64 register-dump support merged |
| Snap default channel | Yes (`6/stable`) | Yes (`6/stable`) | No - only pinned `5.21/stable`, `5.0/stable`, `6/edge` |
| Ubuntu .deb package | N/A (snap-only distribution) | N/A | N/A - `lxd` package does not exist in the Ubuntu archive for any architecture |

**Performance gaps:** no riscv64-vs-arm64/amd64 LXD benchmark data exists anywhere - explicitly confirmed absent in LXD's own benchmark docs ([documentation.ubuntu.com](https://documentation.ubuntu.com/lxd/stable-5.0/howto/benchmark_performance/), [canonical.com](https://canonical.com/lxd/docs/latest/howto/benchmark_performance/)) and on the RISE blog. The only concrete performance figure found is a fixed, universal **5-second EDK II boot-menu delay** on every riscv64 VM boot ([issue #18972](https://github.com/canonical/lxd/issues/18972), open, fix proposed not yet merged).

**Security hardening gaps:** none identified in LXD's own seccomp/audit-arch implementation (full dedicated table, Section 4). The sole gap is the architectural absence of VM Secure Boot, which is an ecosystem-wide RISC-V limitation, not an LXD-specific shortfall.

**NaN/floating-point:** explicitly searched; no RISC-V NaN/floating-point issue exists in LXD's issue tracker.

**Correctness bug (found and fixed):** kernel-7.0 ACPI boot failure on riscv64 VMs (LP #2153582), fixed by [PR #18318](https://github.com/canonical/lxd/pull/18318), merged 2026-05-27, shipped in `lxd-6.9`.

## 7. CI/CD Infrastructure

**No riscv64 CI exists in `canonical/lxd`.** This was verified by direct clone and file read of every workflow at HEAD `70fd851064d5e6c3229ece381d7a1fcda1e9ca56`, and independently re-verified against a fuller workflow-file inventory (`codeql.yml`, `commits.yml`, `copilot-setup-steps.yml`, `domain-label.yml`, `domain-reviewers.yml`, `gpu-passthrough-tests.yml`, `security.yml`, `tests.yml`, `triage.yml`, `zizmor.yml`, plus `testflinger/` and composite actions under `.github/actions/`). `grep -rniI "riscv" .github/` returns **zero matches** in both passes. `build.yml`'s architecture matrix is `[amd64, arm64]` on self-hosted `lxc-incus-build` runners; `tests.yml`'s Go cross-compile targets (`GOARCH`) are `amd64`/`arm64` only. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists. No RISE runner references (`riseproject-dev`, RISE runner labels) appear anywhere in CI configuration.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (self-hosted `lxc-incus-build`) | Yes (self-hosted `lxc-incus-build`) | No |
| CI test | Yes | Yes | No |
| CI release-blocking | Yes (`build.yml` on push to `main`/`stable-*`) | Yes | N/A - no job exists |
| Runner type | Self-hosted native | Self-hosted native | N/A |
| RISE runner usage | No | No | No evidence found |

The formal umbrella issue title itself ("Make riscv64 a **tier 1** architecture", #16750, still open) corroborates that tier-1/CI status has not been reached.

## 8. Distribution and Release Status

- **GitHub Releases** (`canonical/lxd`, e.g. tag `lxd-6.9`): only `bin.linux.lxc.aarch64`, `bin.linux.lxc.x86_64`, `lxd-benchmark`/`lxd-convert` aarch64/x86_64 builds, plus macOS/Windows (aarch64/x86_64). **No riscv64 asset in any release.**
- **Snap Store** (Canonical's own channel): riscv64 confirmed live via a direct query to `api.snapcraft.io/v2/snaps/info/lxd` (Canonical's first-party API). Real revisions exist: `5.21/stable` rev 40590 (v5.21.7-1018661, ~40.5 MB), `5.0/stable` rev 40591 (v5.0.9-ea18dad), plus a `6/edge` build. A ranged GET on the rev-40590 download URL returned **HTTP 206**, `application/octet-stream`, non-zero bytes - a genuine, live, downloadable binary. **Critically, riscv64 has no entry under the bare `stable`/`6/stable` risk level** that `snap install lxd` resolves to by default; a user must explicitly run `snap install lxd --channel=5.21/stable` (or `5.0/stable`, or `6/edge`).
- **Ubuntu archive (.deb):** `packages.ubuntu.com/resolute/lxd` returns "No such package" - the `lxd` package does not exist in the Ubuntu archive **for any architecture**; only thin shim packages `lxd-installer` and `lxd-agent-loader` (arch "all", launcher scripts for the snap) exist. Launchpad's `ubuntu/+source/lxd` page shows the deb hasn't been uploaded since 2022 (v3.0.3), listing only `amd64 arm64 armhf i386 ppc64el s390x` - riscv64 was never a build target for the deb.
- **PyPI `lxd` package** (v0.2.16): an unrelated third-party async Python REST-API client (Alexander Vasin), pure-Python sdist only, not the Canonical LXD daemon/CLI - not applicable to this analysis.
- **Arch Linux RISC-V port:** no `lxd`/`lxc` package listed.

**What a user must do to get a working riscv64 LXD binary today:** install the snap explicitly pinning a non-default channel (`snap install lxd --channel=5.21/stable`, `5.0/stable`, or `6/edge`); VM ecosystem features (Ceph, OVN, ZFS, virtiofsd, checkpoint-restore) are incomplete or blocked by external upstream bugs even once installed (see Sections 6, 9, 11).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| QEMU | Runtime, critical | Yes - `qemu-system-misc` 1:10.2.1+ds-1ubuntu3 ships `qemu-system-riscv64` in Ubuntu resolute | No riscv64-specific CI failures found | Shipped in Ubuntu archive (landed with 25.04) | TCG-only (no KVM accel assumed); actively maintained (commit [9ded15d](https://github.com/canonical/lxd/commit/9ded15d724a06b3907ac05fecd775769dae183b9) "adapt to opensbi changes on 26.04") |
| EDK2 | Runtime, critical | Built via lxd-pkg-snap#1216 (`OvmfPkg/RiscVVirt`) | Golden-config tests pass for riscv64 firmware paths | Staged into riscv64 snap | GENERIC boot firmware only (`RISCV_VIRT_CODE.fd`/`RISCV_VIRT_VARS.fd`); no Secure Boot |
| OpenSBI | Runtime, critical | Staged via lxd-pkg-snap#1216 (commit `7354054`) | N/A | Staged into riscv64 snap | core26/Resolute packaging risk (firmware package relocation) identified and resolved during review |
| Go | Build, critical | Native riscv64 Go port assumed but not independently verified for canonical/lxd | N/A | N/A | Data not available: canonical/lxd's documented minimum Go version (only the unrelated Incus-fork research surfaced a version requirement - see Section 5 discrepancy note) |
| libseccomp-golang | Build, critical | No riscv64-specific issues found for the Go bindings | No riscv64-specific issues found | N/A (vendored Go module) | Underlying C library `libseccomp` added RISC-V support in v2.5.0 (2021), [seccomp/libseccomp#110](https://github.com/seccomp/libseccomp/issues/110) closed |
| LXC (liblxc) | Runtime, critical | Yes - `liblxc-common`/`liblxc1t64` 1:6.0.6-1 in Ubuntu resolute | No riscv64-specific CI failures found; closed [lxc/lxc#4285](https://github.com/lxc/lxc/issues/4285) added rv64gc to `lxc-create -t download` | Shipped in Ubuntu archive | None open |
| virtiofsd | Runtime, optional | Explicitly missing per #16750 as filed; partial progress via commit [b6bd7ea](https://github.com/canonical/lxd/commit/b6bd7ea46c04c3aee7a71723c7a29f83e1a19db3) | Not independently confirmed | Not confirmed fully resolved | Tracked open in #16750 |
| Ceph | Runtime, optional | Re-enabled for riscv64 snap build (lxd-pkg-snap#1216, commit `0969ef5`) | Not independently confirmed | Pending core24->core26 for full availability | Tracked open in #16750 |
| OVN | Runtime, optional | Re-enabled for riscv64 snap build (lxd-pkg-snap#1216) | Not independently confirmed | Pending core24->core26 for full availability | Tracked open in #16750 |
| ZFS | Runtime, optional | Userspace tools ship (`zfsutils-linux` 2.4.1-1ubuntu5, Ubuntu resolute); re-enabled at snap-build level | **Kernel module reported broken**: [openzfs/zfs#18989](https://github.com/openzfs/zfs/issues/18989) open | Userspace ships; functional storage driver blocked | Real functional blocker beyond packaging |

**Indirect/recursed dependencies** found via the dependency chain (dqlite, liblxc, and the snap build):

| Dependency | Role | riscv64 status |
|---|---|---|
| canonical/dqlite (+ raft) | Distributed SQLite, clustering DB | `libdqlite0` 1.18.4-1 ships in Ubuntu resolute; [canonical/dqlite#237](https://github.com/canonical/dqlite/issues/237) "dqlite-demo crashes on riscv64" closed/fixed |
| SQLite | DB engine underlying dqlite/go-sqlite3 | `libsqlite3-0` 3.46.1-9 ships riscv64; no known issues, mature portable C |
| LZ4 | Compression for dqlite raft-log | `liblz4-1` 1.10.0-8 ships riscv64; [lz4/lz4#1635](https://github.com/lz4/lz4/issues/1635) "RISC-V Architecture Optimizations" closed (portable fallback path used) |
| libuv | Async event loop for dqlite | `libuv1t64` 1.51.0-2ubuntu1 ships riscv64; no known issues |
| AppArmor (libapparmor) | MAC confinement for every container/VM | `libapparmor1` 5.0.0~beta1-0ubuntu7 ships riscv64; no known issues |
| libseccomp (C library) | Underlies libseccomp-golang and liblxc | `libseccomp2` 2.6.0-2ubuntu5 ships riscv64; RISC-V support shipped upstream v2.5.0 (2021) |
| libcap / libacl | Linux capabilities and POSIX ACLs | `libcap2` 1:2.75-10ubuntu2, `libacl1` 2.3.2-2 ship riscv64; no known issues |
| CRIU | Checkpoint/restore for live migration | Ubuntu ships a `criu` 4.2-1ubuntu2 riscv64 binary, **but upstream riscv64 CPU/register-dump support is not merged**: [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) "Support for RISC-V" open, 37 comments, community WIP - the single most concrete upstream blocker in the dependency chain |
| lxcfs | FUSE `/proc`/cgroup virtualization | `lxcfs` 6.0.5-2 ships riscv64; no known issues |

**Summary:** all pure-userspace/library dependencies are already packaged for riscv64 in Ubuntu 26.04 with no open riscv64 blockers. The two real, currently-open architectural blockers are (1) **CRIU lacks native riscv64 support upstream**, blocking LXD live migration/checkpoint-restore, and (2) **LXD's own riscv64 VM/storage story is incomplete** (#16750), compounded by ZFS's own open riscv64 kernel-module bug.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [canonical/lxd#16750](https://github.com/canonical/lxd/issues/16750) | Make riscv64 a tier 1 architecture | Open (since 2025-10-16) | High - VM/Ceph/OVN/ZFS/virtiofsd incomplete | Umbrella tracker; blocked on core24->core26 snap base transition; incrementally addressed via lxd-pkg-snap#1216 |
| [canonical/lxd#18972](https://github.com/canonical/lxd/issues/18972) | RISC-V: add `[boot-opts] menu=off` to qemu-system-riscv64 config | Open (since 2026-09-02) | Low - cosmetic, 5s boot delay per VM | No comments; assigned to xypron; fix proposed, not yet merged |
| [checkpoint-restore/criu#1702](https://github.com/checkpoint-restore/criu/issues/1702) | Support for RISC-V | Open, 37 comments | High - blocks LXD live-migration/checkpoint-restore on riscv64 | Community WIP, not yet in criu-dev; upstream dependency, outside LXD's control |
| [openzfs/zfs#18989](https://github.com/openzfs/zfs/issues/18989) | ZFS 2.4.4 (and master) not working on riscv64 with Linux 7.1.10 | Open | High - blocks ZFS storage driver on riscv64 | Kernel-module level bug, not a packaging issue |
| LP #2153582 (fixed via [PR #18318](https://github.com/canonical/lxd/pull/18318)) | Kernel-7.0 ACPI boot failure on riscv64 VMs | Fixed, merged 2026-05-27 | Was High - VM boot failure | Correctness bug, now resolved, shipped in `lxd-6.9` |

**Correctness bugs highlighted separately:** the ACPI/kernel-7.0 boot failure is the one confirmed-and-resolved correctness bug. No NaN/floating-point bug was found (explicitly searched, none exists).

## 12. Objections and Upstream Blockers

**Stated design objection (resolved):** during [PR #15892](https://github.com/canonical/lxd/pull/15892) review (2025-07-04), maintainer tomponline objected to the PR's initial inclusion of fake Secure Boot firmware entries for riscv64 (RISC-V has no centralized signing authority analogous to Microsoft's for x86/ARM), calling it "rather misleading." He proposed requiring users to set `security.secureboot=false` at profile/instance level instead. xypron agreed and removed the fake entries - resolved collaboratively, not an ongoing objection.

**Organizational/process blocker:** PR #15892 was marked draft on 2025-09-26 "pending roadmap scheduling" and sat dormant over 7 months before being un-drafted on 2026-05-07 - reflects prioritization/roadmap gating, not technical rejection. A Juju-team engineer requested acceleration on 2026-04-22, reporting a `/dev/kvm`-present-but-unrecognized issue that is not confirmed resolved in the findings [NEEDS VERIFICATION].

**Technical blockers:**
1. Snap base architecture - `core24` lacks the `qemu-system-riscv` package; full tier-1 status is blocked until the `core26` transition (`qemu-system-riscv` entered the Ubuntu archive at 25.04). Canonical is incrementally working around this rather than waiting ([lxd-pkg-snap#1216](https://github.com/canonical/lxd-pkg-snap/pull/1216)).
2. core26/Resolute OpenSBI-firmware packaging relocation - identified and resolved during #1216 review, but flagged as a forward risk for the eventual base transition.
3. CRIU upstream riscv64 gap (external, out of LXD's control) - blocks live migration.
4. OpenZFS kernel-module riscv64 bug (external) - blocks the ZFS storage driver.
5. `lxd-pkg-snap` is now archived (2026-07-01); where future riscv64 snap-packaging work lands is not addressed in the findings [NEEDS VERIFICATION].

**Acceptance probability:** high for continued incremental improvement. Every riscv64 VM-enablement change reviewed to date (#15892, #18318, lxd-pkg-snap#1216) was merged without rejection, and the one design objection raised was resolved collaboratively. No evidence of upstream resistance to riscv64 as an architecture was found. The gating factor is engineering bandwidth/roadmap prioritization and the Ubuntu core24->core26 snap-base timeline, not technical or political rejection.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** upstream (Canonical publishes a riscv64 snap itself, via a separate packaging pipeline outside its own GitHub Actions CI)
- **Justification:** No upstream riscv64 CI exists in `canonical/lxd` - confirmed by direct inspection of every `.github/workflows/*.yml` file (build/test matrices are amd64/arm64-only; zero `riscv` string matches anywhere in `.github/`), adversarially re-verified twice against the repository at HEAD `70fd851`. A real, live, downloadable riscv64 artifact is nonetheless published directly by upstream via the Snap Store ([api.snapcraft.io](https://api.snapcraft.io/v2/snaps/info/lxd), HTTP 206 confirmed) - but only on pinned LTS tracks (`5.21/stable`, `5.0/stable`) and `6/edge`, not the default `6/stable` channel, and the build recipe required riscv64-specific conditional logic (TCG-only QEMU, OpenSBI/EDK2 firmware staging, `libatomic1`) rather than a generic uniform cross-arch build - this fits the color model's "patched" distribution-floor case (-> orange), not the "unpatched, clean build" case (-> yellow). Feature parity is materially incomplete: [canonical/lxd#16750](https://github.com/canonical/lxd/issues/16750) (open) documents that VM support, Ceph, OVN, ZFS, and virtiofsd remain gapped or only newly landed pending the `core24`->`core26` snap-base transition, and [openzfs/zfs#18989](https://github.com/openzfs/zfs/issues/18989) (open) reports the ZFS kernel module itself broken on riscv64 independent of LXD's own packaging.
- **Pending work that could change the grade:** [lxd-pkg-snap#1216](https://github.com/canonical/lxd-pkg-snap/pull/1216) (merged 2026-05-26) already added Ceph/OVN/ZFS/virtiofsd to the riscv64 snap build recipe; [#16750](https://github.com/canonical/lxd/issues/16750) remains the open umbrella tracker for full tier-1 promotion once `core26` lands; commit [b6bd7ea](https://github.com/canonical/lxd/commit/b6bd7ea46c04c3aee7a71723c7a29f83e1a19db3) (2026-07-16) extended shared-memory/virtiofs support to all non-x86 arches. No native riscv64 CI job has been proposed or added as of the latest search (2026-09-11). No RISE-funded involvement specific to LXD was found - Canonical's RISE membership is general, not project-specific.

## 14. Investment Analysis

RISE has not funded or performed any LXD-specific work (Section 12); the RISE RISC-V Runners program ([announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) is a generic free-CI offering that has not yet been adopted by `canonical/lxd`'s own workflows - this represents unclaimed leverage rather than duplicated work.

### 14.1 Functional Enablement

The core Go/QEMU/EDK2 driver code is already merged and hand-tuned (Section 4) - no further functional-enablement engineering is needed there. Remaining functional work is entirely in packaging/dependency space: complete the `core24`->`core26` snap-base transition to fully unlock Ceph/OVN/ZFS/virtiofsd on the riscv64 snap ([#16750](https://github.com/canonical/lxd/issues/16750)), and land the trivial EDK2 boot-menu fix ([#18972](https://github.com/canonical/lxd/issues/18972)).

### 14.2 Performance Optimization

Not applicable. LXD has no hot-path code of its own requiring RISC-V-specific optimization (confirmed absence of JIT/SIMD/assembly, Section 4); performance is a function of QEMU/liblxc/dqlite, which are separately graded projects.

### 14.3 CI/CD Infrastructure

The single highest-leverage gap: no riscv64 CI job exists at all. Adding one closes both the "no upstream CI" primary-color gap and provides ongoing regression protection for the riscv64 QEMU driver code that currently has only cross-compiled golden-fixture tests running on amd64 hosts. The RISE RISC-V Runners program offers free native riscv64 GitHub Actions runners and could supply this without Canonical standing up dedicated hardware.

### 14.4 Ecosystem Enablement

Not applicable - LXD has no dependent package ecosystem (no PyPI/npm/Maven consumers requiring riscv64-specific builds); Section 10 is omitted per the scoping rule for system daemons/tools.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add native riscv64 job to `build.yml` and `tests.yml` (leverage RISE RISC-V Runners) | 2 | Canonical / RISE | High |
| Functional | Complete `core24`->`core26` snap base transition to unlock Ceph/OVN/ZFS/virtiofsd on riscv64 snap | 1-2 (LXD-side; bulk of work is the Ubuntu-timeline-driven `core26` availability, outside LXD's control) | Canonical | High |
| Functional | Promote riscv64 to the default snap `stable` channel once feature-complete | <1 | Canonical | Medium |
| Functional | Land EDK2 boot-menu fix (#18972) | <0.2 | Canonical | Low |
| Dependency (external) | Track/advocate for CRIU riscv64 upstream support (checkpoint-restore/criu#1702) | N/A (external upstream, monitor only) | External (CRIU project) | Medium |
| Dependency (external) | Track/advocate for OpenZFS riscv64 kernel-module fix (openzfs/zfs#18989) | N/A (external upstream, monitor only) | External (OpenZFS project) | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [canonical/lxd repository](https://github.com/canonical/lxd)
- [lxd homepage (Ubuntu)](https://ubuntu.com/lxd)
- [Issue #16750 - Make riscv64 a tier 1 architecture](https://github.com/canonical/lxd/issues/16750)
- [Issue #18972 - RISC-V: add boot-opts menu=off](https://github.com/canonical/lxd/issues/18972)
- [PR #18318 - riscv64: disable ACPI for RISC-V VMs](https://github.com/canonical/lxd/pull/18318)
- [PR #18521 - snap: build documentation on riscv64](https://github.com/canonical/lxd/pull/18521)
- [PR #18497 - Enable building lxd-ui on riscv64](https://github.com/canonical/lxd/pull/18497)
- [PR #15892 - lxd/instance: add riscv64 QEMU definitions](https://github.com/canonical/lxd/pull/15892)
- [PR #6893 - add riscv architecture definitions](https://github.com/canonical/lxd/pull/6893)
- [lxd-pkg-snap PR #1216 - RISC-V: enable virtual machines](https://github.com/canonical/lxd-pkg-snap/pull/1216)
- [commit 9ded15d - qemu: adapt to opensbi changes on 26.04](https://github.com/canonical/lxd/commit/9ded15d724a06b3907ac05fecd775769dae183b9)
- [commit b6bd7ea - use shared memory backend on all arches](https://github.com/canonical/lxd/commit/b6bd7ea46c04c3aee7a71723c7a29f83e1a19db3)
- [commit c5bc1cd - Merge RISC-V enable virtual machines](https://github.com/canonical/lxd/commit/c5bc1cddd400bfa39395ecc32d7c0faff5214c10)
- [commit 367a0a9 - riscv64: disable ACPI](https://github.com/canonical/lxd/commit/367a0a9ccf598aacd2dce80bb217152638eff43d)
- [commit 2a8c995 - Merge PR #6893](https://github.com/canonical/lxd/commit/2a8c995880cdb01fd3d0f8ab1705709c6638b2b4)
- [commit 9efbcd9 - snapcraft bios-256k.bin optional](https://github.com/canonical/lxd/commit/9efbcd934f73f990c8b3b91f2ef85f747870fb56)
- [commit 4c05db8 - skip embedded doc build on riscv](https://github.com/canonical/lxd/commit/4c05db8e4c858143c8414e12858d53c1666c2748)
- [commit c1860a7 - Merge PR #146 snapcraft doc skip](https://github.com/canonical/lxd/commit/c1860a7e12c2eb7591bd65ba41dac1dc65c3be34)
- [commit 1f2331f - rv to riscv rename fix](https://github.com/canonical/lxd/commit/1f2331f0b806a247e737426723c534a3c5bbe1fa)
- [commit 30efac7 - add riscv architecture definitions](https://github.com/canonical/lxd/commit/30efac7aa3ec0cab71d710ed01b1cc12aab316bc)
- [checkpoint-restore/criu#1702 - Support for RISC-V](https://github.com/checkpoint-restore/criu/issues/1702)
- [openzfs/zfs#18989 - ZFS not working on riscv64](https://github.com/openzfs/zfs/issues/18989)
- [lz4/lz4#1635 - RISC-V Architecture Optimizations](https://github.com/lz4/lz4/issues/1635)
- [seccomp/libseccomp#110 - RFE add RISC-V support](https://github.com/seccomp/libseccomp/issues/110)
- [canonical/dqlite#237 - dqlite-demo crashes on riscv64](https://github.com/canonical/dqlite/issues/237)
- [lxc/lxc#4285 - rv64gc download template](https://github.com/lxc/lxc/issues/4285)
- [lxc-devel mailing list - riscv64 build tags, June 2020](https://lists.linuxcontainers.org/pipermail/lxc-devel/2020-June/022024.html)
- [LXD benchmark performance docs (Ubuntu)](https://documentation.ubuntu.com/lxd/stable-5.0/howto/benchmark_performance/)
- [LXD benchmark performance docs (Canonical)](https://canonical.com/lxd/docs/latest/howto/benchmark_performance/)
- [Canonical and Ubuntu RISC-V: a 2025 retro and looking forward to 2026](https://canonical.com/blog/canonical-and-ubuntu-risc-v-a-2025-retro-and-looking-forward-to-2026)
- [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project blog](https://riseproject.dev/blog)
- [Snap Store API - lxd package info](https://api.snapcraft.io/v2/snaps/info/lxd)
- [PyPI - lxd package (unrelated third-party client)](https://pypi.org/pypi/lxd/json)
- [Ubuntu packages search - lxd, resolute](https://packages.ubuntu.com/search?keywords=lxd&suite=resolute&searchon=names&section=all)