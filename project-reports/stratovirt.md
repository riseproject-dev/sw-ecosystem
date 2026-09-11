---
title: StratoVirt
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="stratovirt" %}

# StratoVirt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for StratoVirt<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

StratoVirt is a Rust-based lightweight hypervisor (VMM) developed as a sub-project of openEuler, positioned as a QEMU alternative for cloud/container-native and microVM use cases (sub-50ms boot claim, per project docs). It is licensed under Mulan PSL v2, with copyright held by Huawei Technologies Co., Ltd.

**Governance:** StratoVirt is incubated under openEuler, which is itself incubated by the OpenAtom Foundation (not the Linux Foundation or CNCF). openEuler governance runs Advisory Committee -> openEuler Committee (chaired by a Huawei representative) -> Technical Committee -> subject-matter SIGs. StratoVirt is governed by the **Virt SIG** alongside QEMU, libvirt, Rust_Shyper, Skylark, Capsule, and cloud-hypervisor.

**Corporate sponsorship:** Per the Virt SIG's `sig-info.yaml`, every StratoVirt maintainer/committer (limingwang, sujerry, Li Huachao, zyimin, plus the primary-maintainer team) is a Huawei employee. `Cargo.toml` lists `authors = ["Huawei StratoVirt Team"]`. Other companies (SmartX, SUSE, UnionTech, KylinSoft, Institute of Software CAS, Beihang University) appear elsewhere in the broader Virt SIG but not as StratoVirt committers. StratoVirt is effectively single-vendor (Huawei) governed inside a nominally multi-vendor SIG.

**Hosting:** Canonical development has moved off Gitee to AtomGit (`atomgit.com/openeuler/stratovirt`), mirrored to GitCode (`gitcode.com/openeuler/stratovirt`) and to the GitHub mirror used as the primary source for this report (`github.com/openeuler-mirror/stratovirt`). The GitHub mirror is near-dormant: it has 0 issues total and 1 pull request total in its entire recorded history (an unrelated seccomp fix, PR #1, closed unmerged).

**Community culture on new ports:** No formal architecture-tiering or acceptance policy document exists for StratoVirt specifically. In practice, RISC-V enablement is being pursued proactively by a small external team (see Section 2) rather than through a broad governance process, consistent with openEuler's distro-wide policy of RISC-V as a Tier-1 architecture since 23.09/24.03 LTS - but that distro-wide classification is not a StratoVirt-specific support commitment.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-12-01 to 2026-03-02 | GitHub mirror tags: v2.2.0-rc6, v2.2.0, v2.3.0, v2.4.0, v2.5.0. None contain riscv64 code or artifacts | [Release/tag pages, openeuler-mirror/stratovirt](https://github.com/openeuler-mirror/stratovirt) |
| 2023-02-28 | A branch literally named `riscv` was last touched on the GitHub mirror. Diff vs master: 609 files, ~55k/~154k lines. Contains no riscv-specific code; name appears unrelated to the actual architecture effort | Direct clone inspection, `openeuler-mirror/stratovirt` branch `riscv` |
| 2024-06-27/28 | OERV-VIRT working group (lead: He Ruoqing, Institute of Software Chinese Academy of Sciences (ISCAS); with Wang Jingwei), in collaboration with China Academy of Telecommunication Technology, announces a RISC-V MicroVM for StratoVirt with kernel-mode AIA (Advanced Interrupt Architecture) interrupt controller, virtio-blk, and serial devices under KVM acceleration - billed as "the first Rust Hypervisor for RISC-V using KVM acceleration." Announcement coincides with v2.4.0 | [modb.pro repost of openEuler community announcement](https://www.modb.pro/db/1806542181615357952) [NEEDS VERIFICATION - single secondary source, no primary openEuler/AtomGit post reachable] |
| 2024-03, 2024-06, 2025-06, 2025-12 | openeuler-riscv/oerv-team intern reports document incremental riscv64 porting work (memory model, CPU model, KVM model, bootloader/device-tree, PLIC/serial), tracked in a 6-part blog series "Stratovirt de RISC-V xunihua zhichi" on tinylab.org (PLCT Lab/ISCAS-sponsored) | [tinylab.org part 1](https://tinylab.org/stratovirt-riscv-part1/) through part 6 |
| ongoing | A separate but related ISCAS team (He Ruoqing, Sheng Qu, Yanjun Wu) drives RISC-V support into rust-vmm, Cloud-Hypervisor, and Kata Containers under an "upstream first" methodology, validated via QEMU emulation ahead of RVA23-compliant hardware. StratoVirt is referenced there as one of several rust-vmm-adjacent hypervisors, not the primary subject | Research findings, ecosystem context |

**Is it fully upstream?** No. As of the latest synced GitHub mirror state (`master`/`dev`, HEAD `93b957808a16ee68534e91b9635aa4c069efdfc6`, dated through 2026-09-01), a full-repo grep for "riscv" returns zero matches, and a GitHub code-search for `riscv`/`riscv64` scoped to the repo returns zero hits. The announced RISC-V MicroVM/AIA work has not been confirmed merged into the mirrored `master` or `dev` branches. It reportedly lives on AtomGit/Gitee branches that were unreachable from available tooling this session (AtomGit API/web returned HTTP 418; Gitee returned 405/blocked WebFetch) [NEEDS VERIFICATION - merge status on AtomGit/Gitee could not be directly confirmed].

**Key contributors:** He Ruoqing and Wang Jingwei (ISCAS/OERV-VIRT), with foundational user-space PLIC work attributed to China Academy of Telecommunication Technology. All are external to StratoVirt's Huawei-only core maintainer roster (Section 1).

## 3. Upstream Support Tier

No StratoVirt-specific `PLATFORMS.md`, `SUPPORT.md`, or tier document exists in the repository; architecture support must be inferred from `#[cfg(target_arch = ...)]` gates in source.

| Signal | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI builds | Yes (`build-stratovirt-x86_64` job) | Yes (`build-stratovirt-aarch64` job, cross-compiled) | No job exists |
| CI runs tests | No (build-only for all architectures) | No (build-only for all architectures) | N/A - no job |
| Release-blocking | N/A (workflow triggers only on release publish, not PR) | N/A (same) | N/A |
| Official release binaries | Yes, every tag through v2.3.0 (`stratovirt-static-<ver>-x86_64.tar.gz`); v2.4.0/v2.5.0 ship source only | Yes, same pattern (`stratovirt-static-<ver>-aarch64.tar.gz`) through v2.3.0 | Never shipped at any tag (v2.2.0-rc6 through v2.5.0) |
| target_arch cfg gates in source | 52 hits across ~25 files | 51 hits across ~25 files | 0 hits |

Note: even amd64 and aarch64 CI is build-only, no tests are executed for any architecture in the single workflow (`.github/workflows/release.yaml`), and it fires only on GitHub release publication, not on push/PR. This is a general CI-maturity caveat, not riscv64-specific.

## 4. Technical Architecture and RISC-V-Specific Subsystems

GitHub code-search confirms both x86_64 and aarch64 are genuine, hand-tuned dual ports with real behavioral divergence, not token stubs:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CPU/vCPU model (`cpu/src/{aarch64,x86_64}`) | Full (`ArchCPU`, `CPUBootConfig`, PMU_INTR) | Full | Missing - no module exists |
| Interrupt controller (`devices/src/interrupt_controller`) | IOAPIC/PIC (`hypervisor/src/kvm/interrupt.rs`) | GICv2/GICv3/ITS | Missing (external OERV-VIRT work adds kernel-mode AIA, unmerged here) |
| Boot loader (`boot_loader/src/{aarch64,x86_64}`) | Full (bzImage, RSDP, SMBIOS entry points) | Full (arch-specific ACPI/boot entry) | Missing - no module exists |
| ACPI tables (`acpi/src/acpi_table.rs`) | IOAPIC-based MADT sub-tables | GIC-ITS-based MADT sub-tables | Missing |
| Seccomp/syscall filter (`machine/src/*/syscall.rs`, `util/src/seccomp.rs`, `ozonec/src/linux/seccomp.rs`) | Full arch-specific allowlist/AUDIT_ARCH | Full arch-specific allowlist | Missing |
| Migration/snapshot (`migration/src/{manager,snapshot,protocol}.rs`) | Full (arch-specific state layout, PIT device state) | Full (GIC device state) | Missing |
| PCI host bridge (`devices/src/pci/{host,bus,root_port,msix}.rs`) | Full | Full (GPEX) | Missing |
| userfaultfd (`address_space/src/uffd.rs`) | Arch-specific syscall numbers | Arch-specific syscall numbers | Missing |
| VFIO (`vfio/src/vfio_pci.rs`) | Full | Full | Missing |

**Verdict:** riscv64 is not a partial or stub implementation - it is completely absent from the mirrored repository. Zero lines, zero files, zero cfg-gates across `cpu/`, `boot_loader/`, `machine/`, `devices/`, `hypervisor/`, `migration/`, `acpi/`, `util/`, `vfio/`, and `ozonec/`, confirmed independently by both full-repository grep and GitHub's code-search API. This project has no JIT, no GC, and no SIMD/crypto subsystem of its own beyond what its dependencies provide (see Section 9); the architecture-specific surface is entirely the device/CPU/interrupt/boot model listed above.

The externally-reported OERV-VIRT RISC-V MicroVM (kernel-mode AIA, virtio-blk, serial, under KVM acceleration, announced June 2024) is the only evidence of riscv64-specific architecture work for StratoVirt, and it is not present in this repository [NEEDS VERIFICATION - could not confirm merge status on AtomGit/Gitee].

## 5. Build System, Cross-Compilation, and Toolchain

StratoVirt is a Rust/Cargo workspace (`Cargo.toml`, `Cargo.lock`, `build.rs`) - **not a CMake project**; no `CMakeLists.txt`, `cmake/` directory, or toolchain `.cmake` files exist anywhere in the repository.

**Documented build commands** (from `docs/build_guide.md`):
- Toolchain requirement: Rust/rustc 1.64.0 or later (Cargo included). No documented GCC/Clang minimum; GCC (`musl-gcc`) is pulled in only transitively as the linker for musl targets.
- glibc build: `rustup target add ${arch}-unknown-linux-gnu` then `cargo build --workspace --bins --release --target ${arch}-unknown-linux-gnu`
- musl static build: `rustup target add ${arch}-unknown-linux-musl` then `cargo build --workspace --bins --release --target ${arch}-unknown-linux-musl`
- Feature flags use Cargo's `--features "..."` mechanism (e.g. `scream_alsa`, `usb_host`, `gtk`, `vnc`, `virtio_gpu`, `pvpanic`) - no `-DUSE_X=OFF`-style CMake flags exist in this codebase.
- OHOS (OpenHarmony) cross-compile is documented via `RUSTFLAGS` + a dedicated linker/clang path; no analogous riscv64 section exists.
- No QEMU usage is documented in StratoVirt's own build/test process (StratoVirt is itself a QEMU-alternative hypervisor).

**CI build reality** (`.github/workflows/release.yaml`, only workflow file present, no `.gitlab-ci.yml`/`Jenkinsfile`/`.cirrus.yml`): triggers only on `release: types: [published]`. Three jobs, all on `ubuntu-latest` (x86 GitHub-hosted runners, no riscv64 runner, no QEMU/binfmt emulation): `build-stratovirt-x86_64` (native `cargo build`, `x86_64-unknown-linux-musl`), `build-stratovirt-aarch64` (`use-cross: true` cross-compile, `aarch64-unknown-linux-musl`), `release-stratovirt` (uploads both as GitHub release assets). Neither job runs the test suite.

**The only Dockerfile in the repo** (`tools/build_stratovirt_static/Dockerfile`) branches only on `aarch64` vs. everything else (for `dtc-devel`), based on `openeuler/openeuler:22.03-lts-sp2`:
```
from openeuler/openeuler:22.03-lts-sp2
ARG ARCH
RUN yum update -y && yum upgrade -y && \
    yum install -y cargo musl-gcc cyrus-sasl-devel && \
    yum install -y libcap-devel libcap-ng-devel libseccomp-devel && \
    if [ "${ARCH}" == aarch64 ]; then yum install -y dtc-devel; fi && \
    yum clean all
```

**Known build failures for riscv64:** the `ring` crate (0.16.20, pulled in transitively via `rustls` for the optional `vnc_auth`/VNC-over-TLS feature) has no riscv64 target support and is documented to fail (`briansmith/ring#1612`, open, unanswered). This affects only the optional VNC-TLS feature, not the default build. See Section 9 for the full dependency analysis.

**What a user must do today to get a riscv64 binary:** there is no documented or tested path. No riscv64 target string, toolchain file, or Dockerfile variant exists in the repository. Building would require, at minimum: adding riscv64 `#[cfg(target_arch = "riscv64")]` modules for every component in Section 4 (none of which exist upstream), resolving the `ring`/`rustls` build gap for the VNC-TLS feature (or building without it), and validating against the still-experimental riscv64 support in rust-vmm's `kvm-ioctls`/`kvm-bindings`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Boots a guest VM under KVM | Yes | Yes | No (no boot loader, no CPU model, no interrupt controller in this repo) |
| microVM mode | Yes | Yes | No (externally-reported OERV-VIRT MicroVM work is unmerged here) |
| Standard VM mode with ACPI | Yes | Yes | No |
| Migration/snapshot | Yes | Yes | No |
| PCI/PCIe device passthrough (VFIO) | Yes | Yes | No |
| Seccomp sandboxing | Yes (arch-specific allowlist) | Yes (arch-specific allowlist) | No |
| Static musl release binary | Yes (through v2.3.0; source-only from v2.4.0) | Yes (through v2.3.0; source-only from v2.4.0) | Never shipped at any version |
| VNC-over-TLS (`vnc_auth` feature) | Yes | Yes | Would fail to build (ring 0.16.20 has no riscv64 support) |

**Functional gap:** total. StratoVirt cannot run a guest VM on riscv64 today using the GitHub-mirrored/upstream-synced source - there is no CPU model, no interrupt controller, no boot loader, and no device model for the architecture at all (Section 4).

**Performance gap:** not applicable in the conventional SIMD-fallback sense - there is no functional baseline to measure a delta from. No quantitative riscv64 benchmark data (boot time, IOPS, latency, throughput) was found in any source searched (GitHub, RISE blog, tinylab.org series, web search). The only quantified StratoVirt performance claim found (sub-50ms microVM boot) is architecture-generic and not tied to any RISC-V test run.

**Security hardening gaps:** seccomp sandboxing (`util/src/seccomp.rs`, `ozonec/src/linux/seccomp.rs`) is entirely arch-gated for x86_64/aarch64; no riscv64 syscall allowlist exists, so a hypothetical riscv64 build would either lack seccomp confinement entirely or require net-new allowlist work.

**NaN/floating-point semantics:** no StratoVirt-specific floating-point or NaN issue was found. A superficially related lead (Gitee issue `aosp-riscv/working-group#I5CKA4`, a NaN sign-bit bug in `fneg.s`->`fcvt.d.s`) was directly verified to be a 2022 QEMU 6.2/7.0 libc/snprintf conformance bug reported by the AOSP-RISC-V working group - unrelated to StratoVirt.

## 7. CI/CD Infrastructure

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (native) | Yes (cross-compiled via `cross`) | No |
| CI runs tests | No (build-only for all architectures) | No (build-only for all architectures) | N/A |
| Runner type | `ubuntu-latest` (GitHub-hosted x86) | `ubuntu-latest` (GitHub-hosted x86, cross-compile) | N/A - no job, no runner |
| RISE RISC-V runners used | No | No | No - StratoVirt is not referenced anywhere in the RISE `riseproject-dev` GitHub org (repo search, code search, issue search all return 0 results), the RISE blog, or `riscv-runners.riseproject.dev` (which explicitly runs bare-metal, no-VMM workloads) |
| Trigger | `release: types: [published]` only | Same | N/A |

Full source: [`.github/workflows/release.yaml`](https://github.com/openeuler-mirror/stratovirt/blob/master/.github/workflows/release.yaml), the only CI configuration file present anywhere in the repository (verified: no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml`). A full-repository, whole-tree `grep -ril "riscv"` (not scoped to CI configs) independently confirms zero riscv references anywhere, including CI.

## 8. Distribution and Release Status

| Channel | riscv64 available? | Evidence |
|---|---|---|
| GitHub releases (openeuler-mirror/stratovirt) | No | Every tagged release enumerated (v2.2.0-rc6 through v2.5.0): only `stratovirt-static-<ver>-{x86_64,aarch64}.tar.gz` plus source archives; v2.4.0/v2.5.0 ship source archives only, no binaries of any architecture |
| PyPI | Not applicable - package does not exist | [`pypi.org/pypi/stratovirt/json`](https://pypi.org/pypi/stratovirt/json) returns HTTP 404 (StratoVirt is a Rust/C VMM, not a Python package) |
| RISE PyPI wheel mirror | Not applicable | Redirects to the same 404 PyPI endpoint |
| Ubuntu 26.04 (resolute), any architecture | No | [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=StratoVirt&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - the project is not packaged for Ubuntu at all, for any architecture |
| Arch Linux RISC-V (unofficial, archriscv.felixc.at) | No | Not listed on [archriscv.felixc.at](https://archriscv.felixc.at/?q=stratovirt) |
| npm / Maven / OCI | Not applicable | StratoVirt has no packages in these ecosystems; it is a standalone native binary/VMM |

**What a user must do to get a working binary today:** there is none available for riscv64 through any channel checked. A user would need to build from source, and per Section 5, the upstream source itself contains no riscv64 architecture code to build - so even a source build is not currently possible against the mirrored/synced repository. The only path forward is the unmerged, externally-reported OERV-VIRT work (Section 2), which was not independently locatable or buildable from this session's tooling.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Rust | Build-dependency, critical - the language/toolchain (rustc 1.64.0+, Cargo) StratoVirt is written in | Yes - riscv64gc-unknown-linux-gnu is a Tier-2 Rust target | N/A (toolchain, not a StratoVirt-tested target here) | Published (rustup) | No issues found; Rust's own riscv64 Tier-2 target is mature |
| kvm-bindings | Build-dependency, critical - rust-vmm crate providing raw KVM ioctl struct bindings | Experimental per upstream rust-vmm docs; StratoVirt's own stale (2023) `riscv` branch consumed `kvm-bindings 0.6.0` from crates.io successfully, implying riscv64 KVM_GET/SET_ONE_REG, KVM_INTERRUPT, MP_STATE support was upstreamed by then. A third-party analysis (`TimePrinciple/blog-content:blogs/stratovirt_Analysis.md`) separately flags `kvm_bindings` as historically supporting only x86_64/arm64/arm - a discrepancy to note | Covered by rust-vmm's container-based CI per its docs, but arch is labeled experimental | Published on crates.io, riscv64 listed as a supported target | Tracked in `projects.yml`; no dedicated report yet. Discrepancy: current 0.7.0 (pinned by StratoVirt) vs. the 0.6.0 used successfully on the 2023 riscv branch suggests riscv64 support may have been present since at least 0.6.0, but the "x86_64/arm64/arm only" claim from the third-party blog contradicts this - both cited, unresolved |
| musl | Build-dependency, critical - static-linking libc target for `*-unknown-linux-musl` release builds | Not independently verified for riscv64gc-unknown-linux-musl in this research pass | Not verified | musl itself is architecture-portable upstream; no StratoVirt-specific riscv64 musl build evidence found | [NEEDS VERIFICATION] - no direct check of musl's riscv64 target performed |
| Linux kernel | Runtime-dependency, critical - KVM host kernel StratoVirt runs under | riscv64 KVM (KVM/RISC-V) exists upstream in Linux, but no StratoVirt-specific kernel version/config requirement for riscv64 was found or documented | N/A | N/A | Not tracked as a StratoVirt-specific blocker in the research; general riscv64 KVM host support is a Linux kernel matter outside this report's scope |
| libseccomp | Build-dependency, optional - backs StratoVirt's seccomp sandboxing (`util/src/seccomp.rs`) | Not independently verified for riscv64 in this pass; the Dockerfile installs `libseccomp-devel` unconditionally (not arch-gated) | Not verified | libseccomp has general riscv64 support in most distros, but not confirmed here | [NEEDS VERIFICATION] - and moot regardless, since StratoVirt's own seccomp allowlist code (`arch_syscall_whitelist`) has no riscv64 arm to invoke it against (Section 4, Section 6) |
| ring (0.16.20, transitive via rustls) | Crypto - TLS crypto backend for the optional `vnc_auth` (VNC-over-TLS) feature only | **FAIL** - ring 0.16.20 has no riscv64 assembly/target support; confirmed build failures reported. riscv64 support only exists from ~ring 0.17.8+ | N/A (does not build) | N/A | Open, unanswered: [briansmith/ring#1612](https://github.com/briansmith/ring/issues/1612); also #1182 (feature request), #2022 (closed, reporter confirms 0.17.8 works) |
| rustls (0.21.5, `ui` crate, `vnc_auth` feature) | Crypto/TLS wrapper around ring | Fails, inherited from ring above; 0.21.x in this configuration defaults to the ring backend, no aws-lc-rs fallback configured | N/A | N/A | Fix path: upgrade to rustls >=0.22 with a riscv64-capable crypto provider |
| cpufeatures (0.3.0, transitive via chacha20) | SIMD/CPU-feature-detection helper | Crate hard-fails via `compile_error!` outside aarch64/loongarch64/x86/x86_64, but chacha20's own manifest gates it behind `cfg(any(target_arch="x86_64", target_arch="x86"))`, so it is never pulled into a riscv64 build despite appearing in `Cargo.lock` | N/A (not built on riscv64) | N/A | Not a real blocker despite appearing alarming in isolation |
| chacha20 (0.10.0, `devices` crate) | Crypto (ChaCha stream cipher, backs `rand_chacha`) | OK - portable/generic fallback implementation used when the SIMD path is gated out (see cpufeatures above) | Not separately checked; RustCrypto crates carry generic constant-time fallback paths | Published, no arch restriction | No issues found |
| ppv-lite86 (0.2.17, via rand_chacha) | SIMD (portable-vector library) | Likely OK - cross-platform with portable fallback; corroborated by Debian/Ubuntu `librust-ppv-lite86-dev` existing across release architectures | Not directly verified | Present in Debian archive | No issues found |
| getrandom (0.2.10) | Crypto-adjacent RNG syscall wrapper | OK - wraps the arch-generic Linux `getrandom()` syscall via libc; riscv64 explicitly listed as supported | Not separately verified | Published | [rust-random/getrandom#494](https://github.com/rust-random/getrandom/issues/494) (informational only) |
| kvm-ioctls (0.16.0) | rust-vmm KVM ioctl backend, alongside kvm-bindings the core hypervisor dependency | Marked experimental for riscv64 upstream; same 2023-branch corroboration as kvm-bindings above | Covered by rust-vmm CI, arch labeled experimental | Published, riscv64 listed as supported target | No blocking issue found beyond the general "experimental" caveat |
| vm-memory (0.15.0, rust-vmm) | Guest memory management | Explicitly documented as supporting x86_64, ARM64, and RISCV64 | Not separately verified | Published, riscv64 listed | No issues found |
| vhost (0.12.1, rust-vmm) | vhost-user device backends | Not independently confirmed; protocol is largely arch-generic (eventfd/unix sockets), no arch-specific code identified, but not directly verified against this exact version | Not verified | Not verified | Lower confidence than vm-memory/kvm-* above |
| libc (Rust crate, 0.2.183) | Foundational libc/syscall bindings | OK - riscv64gc-unknown-linux-gnu is a Tier-2 Rust target with mature libc bindings | Well established | Published | No issues found |
| nix (0.24.3) | POSIX/Linux syscall wrappers (util, seccomp, aio) | Expected OK - riscv64 Linux support has existed in `nix` for several years | Not separately verified | Published | No issues found |

**Deep-dive: the critical-path chain.** The genuine, tool-confirmed riscv64 build blocker in the dependency tree is **ring 0.16.20** (via rustls 0.21.5), and it is scoped to the optional `vnc_auth` feature only - not StratoVirt's default build. The core VM/hypervisor dependency chain that StratoVirt is actually built on - **kvm-ioctls, kvm-bindings, vm-memory** - already has riscv64 support upstream in rust-vmm, independently corroborated by StratoVirt's own stale 2023 `riscv` branch having consumed those same crates from crates.io without local patches. This means the dependency layer is not the primary blocker to a riscv64 port; the missing StratoVirt-side architecture code (Section 4) is.

No compression dependency (zlib/flate2/lz4/zstd) exists anywhere in StratoVirt's 217-crate lockfile. No custom memory allocator dependency exists; `bumpalo` present in the lockfile is a host-side, build-time arena allocator pulled in transitively by wasm-tooling crates, not compiled for the riscv64 target.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [briansmith/ring#1612](https://github.com/briansmith/ring/issues/1612) | ring has no riscv64 target support | Open, unanswered | Medium (scoped to optional VNC-TLS feature only) | Blocks StratoVirt's `vnc_auth` feature on riscv64 via the rustls/ring chain; does not block the default build |
| [briansmith/ring#1182](https://github.com/briansmith/ring/issues/1182) | riscv64 support feature request | Open | Low | Related to #1612 |
| [briansmith/ring#2022](https://github.com/briansmith/ring/issues/2022) | riscv64 support (duplicate) | Closed | N/A | Reporter confirms ring 0.17.8+ works; fix path for StratoVirt is upgrading rustls to a version pulling a newer ring or an alternative crypto provider |

**No StratoVirt-specific correctness bugs were found.** GitHub search for riscv64 issues/PRs/commits against `openeuler-mirror/stratovirt` returned zero results across every query attempted (`riscv`, `riscv64`, `riscv64 performance`, `riscv64 bug`, `riscv nan floating`); the GitHub mirror has zero issues of any kind in its history. The only candidate correctness lead investigated - a Gitee NaN sign-bit issue (`aosp-riscv/working-group#I5CKA4`) - was confirmed unrelated (a 2022 QEMU libc/snprintf conformance bug, not StratoVirt).

**Access limitation:** StratoVirt's actual issue trackers (Gitee `gitee.com/openeuler/stratovirt/issues`, AtomGit `atomgit.com/openeuler/stratovirt/issues`) were unreachable from this session's tooling (Gitee returned HTTP 405, AtomGit returned HTTP 418 to automated fetches). Any riscv64-specific bug reports that exist would most likely be filed there, not on the GitHub mirror. This is a research-access gap, not a confirmed absence of bugs on those platforms.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No StratoVirt maintainer statement rejecting or deprioritizing riscv64 was located anywhere in the research.

**Technical blockers:**
1. Complete absence of riscv64 architecture code in the mirrored/synced repository (CPU model, interrupt controller, boot loader, ACPI, seccomp allowlist, migration, PCI host bridge, VFIO - Section 4). This is the primary blocker; a functioning riscv64 port requires implementing all of it, or successfully merging the externally-reported OERV-VIRT work.
2. `ring` 0.16.20's lack of riscv64 support blocks the optional `vnc_auth` feature specifically (Section 9); the fix path (upgrade rustls to a version with a riscv64-capable crypto provider) is known and scoped.
3. Uncertain riscv64 maturity in `kvm-bindings`/`kvm-ioctls` (labeled "experimental" upstream), though not confirmed to have blocked StratoVirt's own 2023 riscv-branch build.

**Organizational blockers:** StratoVirt's core maintainer team is entirely Huawei employees (Section 1) focused on x86_64/aarch64; the RISC-V work is being driven externally by ISCAS/OERV-VIRT and China Academy of Telecommunication Technology, not the core team. This means riscv64 enablement depends on a small, external contributor group successfully getting patches merged into a single-vendor-governed project - a real but not insurmountable organizational hurdle, since openEuler's distro-wide stance toward RISC-V is stated as encouraging (Tier-1 architecture status).

**Acceptance probability:** given openEuler's explicit distro-wide RISC-V Tier-1 commitment and an active, named external team already producing a working (if unmerged) RISC-V MicroVM with KVM acceleration, the technical and organizational path to eventual upstream acceptance appears plausible. However, as of this report, none of that work has landed in the branches synced to the GitHub mirror, and no merge timeline or tracking issue was found on any reachable channel.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, no riscv64 code, no distro package of any kind)
- **Release provider:** none - no channel (upstream GitHub releases, PyPI, RISE, Ubuntu, Arch RISC-V) publishes a riscv64 artifact for StratoVirt
- **Optimization gap:** N/A - StratoVirt is a hypervisor/VMM (a functional platform port), not an optimization-purpose project under the color model's Step 2 test. Running it on RISC-V with only generic code would still deliver its core value proposition (running VMs); the gap here is functional (no riscv64 support exists at all), not a missing SIMD/optimization layer on top of a working base.
- **Justification:** The only CI workflow (`.github/workflows/release.yaml`) builds exclusively x86_64 and aarch64 static musl binaries, triggered only on GitHub release publication, with zero riscv64 target/toolchain/runner anywhere in the file; a whole-repo grep for "riscv" returns zero matches, and GitHub code-search independently confirms zero `target_arch = "riscv64"` gates against 51-52 hits each for aarch64/x86_64. No release at any tag (v2.2.0-rc6 through v2.5.0) has ever shipped a riscv64 asset, and no Linux distribution (Ubuntu 26.04, Arch RISC-V) packages StratoVirt for any architecture, so the distribution floor does not apply - there is nothing to float to. This is orange under Step 1 ("no upstream CI"), not red, because there is no positive evidence of a confirmed-broken riscv64 build (no crash report, no explicit "unsupported" statement against a real attempt) - the honest state is "does not exist yet," not "known to be broken." See [release.yaml](https://github.com/openeuler-mirror/stratovirt/blob/master/.github/workflows/release.yaml) and the enumerated [release/tag pages](https://github.com/openeuler-mirror/stratovirt/releases).
- **Pending work that could change the grade:** the OERV-VIRT/ISCAS RISC-V MicroVM work (kernel-mode AIA interrupt controller, virtio-blk, serial, KVM acceleration), announced June 2024 alongside v2.4.0, is the only concrete pending effort found. If and when it merges into the branches synced to the GitHub mirror and gains riscv64 CI, the grade could move to yellow (build-only CI) or higher. This session could not confirm its current merge/branch status on AtomGit or Gitee due to tooling access limits (HTTP 418/405 responses) - that verification is the single highest-value next step for re-grading this project. StratoVirt has no RISE involvement of any kind (Section 1), so no RISE-funded work is available to offset investment estimates in Section 14.

## 14. Investment Analysis

**RISE involvement check:** confirmed zero. StratoVirt does not appear in the RISE blog, the RISE `riseproject-dev` GitHub org (repo/code/issue search all 0 results), the RISE Python wheel builder, or the RISE RISC-V bare-metal runner infrastructure. No RISE-funded work exists to net out of the estimates below.

### 14.1 Functional Enablement

The largest work item. Requires implementing, for riscv64, every component enumerated as "missing" in Section 4: CPU/vCPU model, interrupt controller (or integrating the externally-reported AIA work), boot loader, ACPI tables (or a riscv64-appropriate device-tree equivalent, given the aarch64 path already uses device tree per Section 5's Dockerfile), seccomp allowlist, migration/snapshot state layout, PCI host bridge, and VFIO support. The lowest-risk path is investigating and upstreaming the existing but unmerged OERV-VIRT/ISCAS MicroVM work (AIA + virtio-blk + serial under KVM) rather than starting from zero, since it is reported to already function.

### 14.2 Performance Optimization

Not assessable until functional enablement exists. No quantitative riscv64 benchmark baseline exists to optimize against (Section 6), and StratoVirt is not an optimization-purpose project under this report's color model (Section 13) - its value proposition is functional VM hosting, not an algorithmic speedup.

### 14.3 CI/CD Infrastructure

Requires adding a riscv64 job to `.github/workflows/release.yaml` (or a new workflow) analogous to the existing `build-stratovirt-aarch64` cross-compile job, plus - unlike the current build-only jobs for x86_64/aarch64 - ideally introducing actual test execution, which does not exist for any architecture today. A riscv64 QEMU-based test runner (or RISE bare-metal RISC-V hardware, once StratoVirt were to engage RISE) would be needed since KVM-based tests require riscv64 KVM host hardware/emulation.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per this report's scope rules. StratoVirt is a standalone native VMM binary with no dependent package ecosystem (no PyPI/npm/Maven consumers); its own dependency tree is covered in Section 9.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Confirm merge/branch status of OERV-VIRT AIA MicroVM work on AtomGit/Gitee; assess upstreamability | 1-2 (investigation only) | TBD | Critical |
| Functional | Implement or upstream riscv64 CPU/vCPU model, boot loader, interrupt controller | 8-16 (if starting from OERV-VIRT work) / 16-30 (from scratch) | TBD | Critical |
| Functional | Implement riscv64 seccomp allowlist, migration state layout, PCI host bridge, VFIO | 6-12 | TBD | High |
| Dependencies | Upgrade rustls/ring chain for riscv64-capable `vnc_auth` support | 0.5-1 | TBD | Low (optional feature only) |
| Dependencies | Verify musl and libseccomp riscv64 target maturity (currently [NEEDS VERIFICATION]) | 0.5 | TBD | Medium |
| CI/CD | Add riscv64 build job to release.yaml; investigate riscv64 KVM test environment (QEMU or RISE hardware) | 2-4 | TBD | High |
| Governance | Engage StratoVirt/openEuler Virt SIG and OERV-VIRT/ISCAS team to align on upstreaming path | 1-2 (coordination) | TBD | Critical |

Effort figures are order-of-magnitude estimates based on the scope of missing components identified in Section 4 and are not derived from any StratoVirt-specific estimation source; they should be validated against the actual OERV-VIRT patch set once its merge status is confirmed.

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [openeuler-mirror/stratovirt (GitHub mirror)](https://github.com/openeuler-mirror/stratovirt)
- [StratoVirt homepage (Gitee)](https://gitee.com/openeuler/stratovirt)
- [StratoVirt distro packaging (src-openeuler, Gitee)](https://gitee.com/src-openeuler/stratovirt)
- [StratoVirt on AtomGit](https://atomgit.com/openeuler/stratovirt)
- [StratoVirt on GitCode](https://gitcode.com/openeuler/stratovirt)
- [.github/workflows/release.yaml, the only CI workflow file](https://github.com/openeuler-mirror/stratovirt/blob/master/.github/workflows/release.yaml)
- [GitHub releases/tags page, openeuler-mirror/stratovirt](https://github.com/openeuler-mirror/stratovirt/releases)
- [PR #1 - allow SYS_clock_gettime (only PR ever opened on the mirror, unrelated to RISC-V)](https://github.com/openeuler-mirror/stratovirt/pull/1)
- [tools/build_stratovirt_static/Dockerfile](https://github.com/openeuler-mirror/stratovirt/blob/master/tools/build_stratovirt_static/Dockerfile)
- [PyPI JSON API for "stratovirt" (404 - package does not exist)](https://pypi.org/pypi/stratovirt/json)
- [Ubuntu 26.04 (resolute) package search for "StratoVirt" (no results)](https://packages.ubuntu.com/search?keywords=StratoVirt&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V unofficial port search (not listed)](https://archriscv.felixc.at/?q=stratovirt)
- [briansmith/ring#1612 - riscv64 support (open, unanswered)](https://github.com/briansmith/ring/issues/1612)
- [briansmith/ring#1182 - riscv64 feature request](https://github.com/briansmith/ring/issues/1182)
- [briansmith/ring#2022 - riscv64 support (closed, duplicate; confirms 0.17.8 works)](https://github.com/briansmith/ring/issues/2022)
- [rust-random/getrandom#494 (informational)](https://github.com/rust-random/getrandom/issues/494)
- [modb.pro repost of openEuler community announcement on RISC-V MicroVM/AIA support](https://www.modb.pro/db/1806542181615357952)
- [tinylab.org - "Stratovirt de RISC-V xunihua zhichi" part 1](https://tinylab.org/stratovirt-riscv-part1/)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python Wheel Builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V bare-metal runners](https://riscv-runners.riseproject.dev/)
- [gitee.com/openeuler/stratovirt/issues (unreachable from this session's tooling, HTTP 405)](https://gitee.com/openeuler/stratovirt/issues)
- [atomgit.com/openeuler/stratovirt/issues (unreachable from this session's tooling, HTTP 418)](https://atomgit.com/openeuler/stratovirt/issues)
- [aosp-riscv/working-group#I5CKA4 (Gitee - unrelated QEMU NaN bug, ruled out as a StratoVirt issue)](https://gitee.com/aosp-riscv/working-group/issues/I5CKA4)
