---
title: Firecracker
parent: Project Reports
color: orange
dependencies:
  - name: kvm-ioctls
    relation: build-dependency
    criticality: critical
  - name: linux-loader
    relation: build-dependency
    criticality: critical
  - name: vm-fdt
    relation: build-dependency
    criticality: critical
  - name: vm-memory
    relation: build-dependency
    criticality: critical
  - name: vm-allocator
    relation: build-dependency
    criticality: critical
  - name: vm-superio
    relation: build-dependency
    criticality: critical
  - name: vmm-sys-util
    relation: build-dependency
    criticality: critical
  - name: vhost
    relation: build-dependency
    criticality: critical
  - name: aws-lc-rs
    relation: build-dependency
    criticality: critical
  - name: gdbstub
    relation: build-dependency
    criticality: optional
  - name: userfaultfd
    relation: runtime-dependency
    criticality: optional
  - name: micro-http
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="firecracker" %}

# Firecracker

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Firecracker<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Firecracker is a Rust-based Virtual Machine Monitor (VMM) built on Linux KVM, purpose-built by AWS for running lightweight "microVMs" for multi-tenant, serverless workloads (originally created for AWS Lambda and Fargate). It exposes a minimal device model (VirtIO block/net, a serial console) and emphasizes fast boot ("<=125 ms" from API call to guest init per its own specification) and a small memory footprint (<5 MiB overhead per microVM).

**Governance and corporate sponsors.** Firecracker is a single-vendor, AWS-controlled open source project, not hosted by a foundation (no CNCF/Linux Foundation affiliation). `MAINTAINERS.md` lists 10 maintainers, 100% with `@amazon.com`/`@amazon.co.uk` addresses - there are no non-Amazon maintainers with merge rights. Governance is described in [`CHARTER.md`](https://github.com/firecracker-microvm/firecracker/blob/main/CHARTER.md), whose "Minimalist in Features" tenet ("if it's not clearly required for our mission, we won't build it") functions as an implicit high bar against unsolicited new-architecture ports. License is Apache-2.0, with BSD-3-Clause portions inherited from Google's crosvm, from which Firecracker was originally forked.

Non-maintainer corporate contributors credited in `CREDITS.md` include SUSE, Intel, Arm, Red Hat, Alibaba, Cloudflare, Baidu, Zoho, Linode, and Continental, but none hold merge/maintainer rights.

**Community culture on new ports.** The project's history on RISC-V (detailed in Section 2) shows a consistent pattern: unsolicited architecture-port contributions are acknowledged respectfully but declined on the same three grounds every time, across seven years (2018-2025) - no validated production/business use case, no RISC-V test hardware in Amazon's own CI infra, and inability to meet Firecracker's security/testing bar without physical hardware. A related but distinct objection (maintainer roypat, PR [#4319](https://github.com/firecracker-microvm/firecracker/pull/4319)) rejected even a minimal, low-risk change (a snapshot magic-ID constant) specifically because merging it "might send a wrong message about which platforms Firecracker supports" - independent of the hardware/use-case arguments. This indicates the project actively resists any signal of RISC-V support, however partial, unless clearly gated off `main`.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-12-08 | Issue [#752](https://github.com/firecracker-microvm/firecracker/issues/752) opened by JadedBlueEyes requesting RISC-V support, citing RISC-V's growth and SiFive custom silicon | [Issue #752](https://github.com/firecracker-microvm/firecracker/issues/752) |
| 2019-07-15 | Issue #752 closed by maintainer raduweiss: "we've looked at this again as part of our 2020 Roadmap exercise, and in the end we thought this is best done in rust-vmm, not Firecracker" | [Issue #752](https://github.com/firecracker-microvm/firecracker/issues/752) |
| 2023-12-13 | PR [#4319](https://github.com/firecracker-microvm/firecracker/pull/4319) ("chore: support ppc64le and riscv64", author Desiki-high) opened and closed same day; maintainer roypat rejected it as sending "a wrong message about which platforms Firecracker supports" | [PR #4319](https://github.com/firecracker-microvm/firecracker/pull/4319) |
| 2024-08-29 | PR [#4754](https://github.com/firecracker-microvm/firecracker/pull/4754) ("vmm: Introduce riscv64 architecture", author TimePrinciple) opened - first substantive riscv64 implementation attempt | [PR #4754](https://github.com/firecracker-microvm/firecracker/pull/4754) |
| 2024-09-02 | Maintainer zulinx86: "we are not planning to support this feature into Firecracker at least in the near future, because we don't have RISC-V hardware in our testing infra... and we have not received much valid business use cases" | [PR #4754](https://github.com/firecracker-microvm/firecracker/pull/4754) |
| 2024-09-25 | PR #4754 closed; work migrated to a new PR targeting a dedicated `feature/risc-v` branch (not `main`) | [PR #4754](https://github.com/firecracker-microvm/firecracker/pull/4754) |
| 2024-09-25 | PR [#4819](https://github.com/firecracker-microvm/firecracker/pull/4819) ("vmm: arch: Introduce RISC-V regs") opened as draft against `feature/risc-v`; still open, 0 comments, labeled "Status: Parked" | [PR #4819](https://github.com/firecracker-microvm/firecracker/pull/4819) |
| 2025-05-28 | PR [#5227](https://github.com/firecracker-microvm/firecracker/pull/5227) ("Support RISC-V architecture", author DimitrisCharisis) opened against `main` - most substantial effort, 20 commits, 1,656 lines across 12 riscv64 files, boots on QEMU+AIA emulation | [PR #5227](https://github.com/firecracker-microvm/firecracker/pull/5227) |
| 2025-05-28 | Maintainer xmarcalx: "we are not interested in supporting RISC-V architecture as there is not actual business/production usecase... it is difficult to get extensive testing or security coverage as we do not have access to real HW platforms" | [PR #5227](https://github.com/firecracker-microvm/firecracker/pull/5227) |
| 2025-10-22 (approx.) | PR #5227 labeled "Status: Parked" | [PR #5227](https://github.com/firecracker-microvm/firecracker/pull/5227) |
| 2025-12-10 (approx.) | PR #4819 labeled "Status: Parked" | [PR #4819](https://github.com/firecracker-microvm/firecracker/pull/4819) |

**Key contributors:** TimePrinciple (independent, PRs #4754/#4819, with a commit co-authored by Ruoqing He, `heruoqing@iscas.ac.cn` - Institute of Software, Chinese Academy of Sciences); DimitrisCharisis (independent, PR #5227); Desiki-high (independent, PR #4319, working on a downstream fork that depends on Firecracker's snapshot crate).

**Is it fully upstream? No.** Zero riscv64 code exists on the `main` branch. All riscv64 work lives in unmerged, closed, or parked PRs targeting either a non-default `feature/risc-v` branch or `main` itself, none of which have been merged. Verified via `merged_at: null` on all four PRs (#4754, #4819, #4319, #5227) and by direct repository grep (`git grep -il riscv` on `main` returns only false-positive substring matches, no genuine riscv64 code).

## 3. Upstream Support Tier

Firecracker has no formal, written "supported platform tiers" policy document (no `PLATFORMS.md`/`SUPPORT.md`). In practice, x86_64 and aarch64 are the only supported targets, hardcoded into the codebase, build tooling, and CI rather than described by an explicit tiering policy:

- `tools/devtool`: `SUPPORTED_ARCHS=(x86_64 aarch64)`; `cmd_checkbuild` rejects any other value with `die "Unknown architecture..."`.
- `rust-toolchain.toml`: `targets = ["x86_64-unknown-linux-musl", "aarch64-unknown-linux-musl"]`.
- `tools/gh_release.py`: the script that assembles GitHub Release tarball assets iterates `for arch in ["x86_64", "aarch64"]:` - hardcoded, no riscv64 branch.
- [`docs/getting-started.md`](https://github.com/firecracker-microvm/firecracker/blob/main/docs/getting-started.md): "Firecracker supports x86_64 and aarch64 Linux."

**Evidence:** no riscv64 CI (Section 7), no riscv64 official binaries (Section 8), riscv64 is not release-blocking because it is not part of the build/test matrix at all.

**amd64 vs arm64 vs riscv64 comparison:**

| Dimension | x86_64 (amd64) | aarch64 (arm64) | riscv64 |
|---|---|---|---|
| CI build | Yes (Buildkite, multiple Intel/AMD bare-metal instance types) | Yes (Buildkite, Graviton2-5 bare-metal instance types) | No |
| CI test execution | Yes | Yes | No (no CI at all) |
| Official release binaries | Yes (`firecracker-v*-x86_64.tgz`) | Yes (`firecracker-v*-aarch64.tgz`) | No |
| Rust toolchain target | `x86_64-unknown-linux-musl` | `aarch64-unknown-linux-musl` | Not defined |
| Devtool supported arch | Yes | Yes | No (`die "Unknown architecture"`) |
| Documented support | Yes | Yes | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Firecracker's architecture-specific code lives under `src/vmm/src/arch/<arch>/` on `main` for x86_64 and aarch64 only; there is no `arch/riscv64/` directory on `main`. The only riscv64 architecture code that exists anywhere is in the unmerged PR [#5227](https://github.com/firecracker-microvm/firecracker/pull/5227), inspected directly by fetching its PR ref.

**Code volume comparison (shipped `main` vs. unmerged PR #5227):**

| Architecture | Files | Lines | Status |
|---|---|---|---|
| x86_64 | 19 | 5,953 | Shipped on `main`, 55 `#[test]` unit tests |
| aarch64 | 20 | 5,855 (includes a `gic/` subsystem alone at 2,007 lines across 8 files for GICv2+GICv3) | Shipped on `main`, 52 `#[test]` unit tests |
| riscv64 | 12 | 1,656 | Unmerged, parked PR #5227 only, 0 `#[test]` unit tests |

**Per-component status (PR #5227 only - none of this is on `main`):**

| Component | riscv64 status | Detail |
|---|---|---|
| Boot / device tree (`fdt.rs`, `mod.rs`, `layout.rs`) | Partial | Largest file (553 lines), generates CPU/memory/AIA/VirtIO/serial FDT nodes; boots a kernel per the author, but `initrd_load_addr()` is `unimplemented!()` and IRQ source counts are hardcoded (author's own TODO: "num-sources should be equal to the IRQ allocated lines, and not randomly hardcoded") |
| Interrupt controller (AIA) | Minimal | `aia/mod.rs` + `aia/regs.rs` = 224 lines total, about 11% the size of aarch64's dual-generation GIC implementation. Abandons the IRQFD mechanism used by x86_64/aarch64 in favor of raw `KVM_IRQ_LINE` ioctls because "IRQFD didn't work reliably on riscv64," similar to how kvmtool handles RISC-V interrupts |
| vCPU registers (`regs.rs`, `kvm.rs`) | Stub | Basic get/set plumbing exists, but `Riscv64RegisterVec::serialize()`/`deserialize()` are both `unimplemented!()` |
| CPU configuration / templates | Stub / placeholder | Code's own doc comment: "CPU configuration for riscv64. Just a placeholder." / "Not actually implemented yet." `register_ids()` and custom/static template application both `unimplemented!()` |
| Snapshot / restore (VM + vCPU state) | Missing | `VM::save_state()`, `VM::restore_state()`, `KvmVcpu::save_state()`, `KvmVcpu::restore_state()`, `KvmVcpu::dump_cpu_config()` are all `unimplemented!()` - calling them panics the process |
| VirtIO block/net, serial console | Implemented | Functional per the PR author, boots on QEMU with AIA emulation |
| Test coverage | Missing | 0 unit tests added |

This is not an optimization-purpose project (no SIMD/JIT/crypto-acceleration value proposition central to its purpose) - Section 4 here documents functional architecture support (does it run at all), which is what determines the color grade for a VMM/hypervisor application.

## 5. Build System, Cross-Compilation, and Toolchain

Firecracker is a Rust/Cargo workspace, not a CMake/C project. No `CMakeLists.txt`, `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, or `Dockerfile.riscv64` exists anywhere in the repository (verified by direct repository search).

- **Toolchain:** `rust-toolchain.toml` pins `channel = "1.97.0"`, `targets = ["x86_64-unknown-linux-musl", "aarch64-unknown-linux-musl"]` only. There is no `riscv64gc-unknown-linux-*` target declared.
- **Dev-container** (`tools/devctr/Dockerfile`): cross toolchains are installed only for the x86_64<->aarch64 pair:
  ```
  RUN case "${ARCH}" in \
      "aarch64") apt-get update && apt install -y gcc-x86-64-linux-gnu libc6-dev-amd64-cross linux-libc-dev-amd64-cross ;; \
      "x86_64")  apt-get update && apt install -y gcc-aarch64-linux-gnu libc6-dev-arm64-cross linux-libc-dev-arm64-cross ;; \
      *) echo "Unsupported arch ${ARCH}" && exit 1 ;; \
      esac
  ```
- **QEMU usage:** the only QEMU reference in the repository is a `qemu-builder` Docker stage that compiles upstream QEMU 8.1.1 from source solely to produce the `vhost-user-blk` helper binary used in integration tests - unrelated to riscv64 emulation or a riscv64 build/test backend.
- **Known build failures:** N/A - there is no riscv64 build path to fail; the build tooling explicitly rejects any architecture other than x86_64/aarch64 (`tools/devtool: die "Unknown architecture: $TARGET_ARCH. Supported architectures: ${SUPPORTED_ARCHS[*]}"`).
- **PR #5227's build path:** the PR adds `#[cfg(target_arch = "riscv64")]` guards and a new module tree, but since it is unmerged, none of this is reachable from a `main`-branch build today.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | x86_64 | aarch64 | riscv64 (PR #5227, unmerged) |
|---|---|---|---|
| Boot to guest kernel entry | Yes | Yes | Yes (QEMU+AIA only, no physical H-extension hardware tested) |
| VirtIO block device | Yes | Yes | Yes |
| VirtIO net device | Yes | Yes | Yes |
| Serial console | Yes | Yes | Yes |
| Interrupt delivery | IRQFD | IRQFD | `KVM_IRQ_LINE` ioctl (IRQFD did not work reliably on riscv64 per author) |
| Snapshot / restore | Yes | Yes | No - `unimplemented!()`, causes a panic if invoked |
| CPU templates (static/custom) | Yes | Yes | No - explicitly a "placeholder," `unimplemented!()` |
| Boot timer | Yes | Yes | No - unimplemented |
| `vmgenid` device | Yes | Yes | No - unimplemented |
| Initrd-based boot | Yes | Yes | No - `initrd_load_addr()` is `unimplemented!()` |
| Unit test coverage | 55 tests | 52 tests | 0 tests |

**Functional gaps:** snapshot/restore (a headline Firecracker feature for fast-resume/live-migration use cases), CPU template application, boot timer, `vmgenid`, and initrd boot are all entirely absent on riscv64 even in the most advanced unmerged branch - not degraded, but hard panics via `unimplemented!()`.

**Performance gaps:** Data not available - no riscv64 build exists on `main` to benchmark, and PR #5227's author explicitly states they could not test on physical RISC-V hardware (no board with the required H-extension was available), so even the unmerged branch has no performance data, only functional QEMU-emulation boot confirmation.

**Security hardening gaps:** Maintainer xmarcalx (PR #5227) states directly that the team "can not provide the guarantees and level of quality which we usually aim to with a Firecracker release" for riscv64, citing lack of access to real hardware for testing/security coverage. No seccomp filter, jailer, or other Firecracker security-boundary component has been evaluated for riscv64 in any source reviewed.

**NaN / floating-point semantics issues:** Data not available: searched GitHub issues for "riscv nan floating point" (0 results) and found no discussion of RISC-V floating-point semantics anywhere in the repository or PRs reviewed.

## 7. CI/CD Infrastructure

**No riscv64 CI exists**, confirmed by directly reading every CI-defining file in the repository (not summaries or search results).

**GitHub Actions** (`.github/workflows/`, all 7 files: `dco_merge_group.yml`, `deny_dirty_cargo_locks.yml`, `dependency_modification_check.yml`, `monitor_libseccomp_releases.yml`, `send_pr_notification.yml`, `send_release_notification.yml`, `trigger_ab_tests.yml`): zero riscv references. All jobs run on `ubuntu-latest` and perform only meta-CI tasks (DCO check, Cargo.lock dirtiness, dependency-file gating, an upstream libseccomp-release watcher bot, Slack-style notifiers, and an A/B-perf-test trigger). None build or test Firecracker itself.

**Buildkite** (`.buildkite/*.py` - the actual build+test CI): `grep -i riscv .buildkite/*` returns zero matches.
- `common.py` `DEFAULT_INSTANCES` lists only real AWS bare-metal instance types: x86_64 (m5n.metal, m6i.metal, m7i.metal-24xl, m7i.metal-48xl, m8i.metal-48xl, m8i.metal-96xl, m6a.metal, m7a.metal-48xl) and aarch64 (m6g.metal, m7g.metal, m8g.metal-24xl, m8g.metal-48xl, m9g.metal-48xl).
- `get_arch_for_instance()` derives only `"x86_64"` or `"aarch64"` from instance-name suffixes - hardcoded, no riscv64 branch.
- `pipeline_cross.py` (cross-kernel-version snapshot/restore matrix) enumerates only `instances_x86_64` and `instances_aarch64`.

**No RISE runner usage:** confirmed - no reference to `riseproject-dev` or RISE runner labels anywhere in CI configuration, consistent with RISE having no involvement with this project (Section 12).

**amd64 vs arm64 vs riscv64:**

| Dimension | x86_64 | aarch64 | riscv64 |
|---|---|---|---|
| CI build | Yes (Buildkite bare-metal) | Yes (Buildkite bare-metal) | No |
| CI test execution | Yes | Yes | No |
| Release-blocking | Yes (part of default instance matrix) | Yes (part of default instance matrix) | No (not in matrix at all) |
| Hardware | Native bare-metal EC2 | Native bare-metal EC2 (Graviton) | N/A |
| RISE runners used | No | No | No |

## 8. Distribution and Release Status

**Official binaries for riscv64: none.** Checked the 3 most recent GitHub releases (v1.16.1 published 2024-07-02, v1.16.0, v1.15.1): all ship only `firecracker-v*-aarch64.tgz` and `firecracker-v*-x86_64.tgz` (plus `.sha256` and `test_results.tar.gz`). No riscv64 asset in any of the three. This is structurally guaranteed, not incidental: `tools/gh_release.py:48` - the script that assembles release tarballs - iterates `for arch in ["x86_64", "aarch64"]:`, hardcoded.

**PyPI:** No package named `firecracker` exists at all. Confirmed via direct `curl` against both `https://pypi.org/pypi/firecracker/json` (HTTP 404) and `https://pypi.org/simple/firecracker/` (HTTP 404). Firecracker is a Rust/C project distributed as prebuilt tarballs, not a Python package.

**npm / Maven / OCI:** Not applicable - Firecracker does not publish to these channels; it is a standalone Rust binary distributed via GitHub Releases.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/firecracker/` returns an HTTP 302 redirect to `https://pypi.org/simple/firecracker/`, which is itself 404. No RISE-built artifact exists.

**Ubuntu 26.04 ("resolute"):** No `firecracker` package exists for any architecture. `packages.ubuntu.com` search returns "Sorry, your search gave no results." A project-graph query for `pkgName` containing "firecracker" (any of `firecracker`, `python3-firecracker`, `libfirecracker`, any suite/arch) returned zero rows.

**Debian:** No package (`tracker.debian.org/pkg/firecracker` and `qa.debian.org/madison.php?package=firecracker` both empty/404), confirming Debian - Ubuntu's upstream - also has no `firecracker` package on any architecture.

**Arch Linux RISC-V (archriscv, unofficial port):** No PKGBUILD exists (`raw.githubusercontent.com/felixonmars/archriscv-packages/master/firecracker/PKGBUILD` returns HTTP 404).

**Repology aggregation:** [repology.org/api/v1/project/firecracker](https://repology.org/api/v1/project/firecracker) shows 60 entries across 33 distro repos (Alpine, ALT, Arch mainline x86_64, AUR, Fedora, Gentoo, LiGurOS, Manjaro, Nix, openSUSE, Parabola, ROSA, T2, Wikidata) - zero of these are RISC-V-specific repos.

**What must a user do to get a working binary today?** There is no path to a working riscv64 Firecracker binary from any official or community channel. The only way to obtain riscv64 Firecracker code at all is to manually check out the unmerged PR [#5227](https://github.com/firecracker-microvm/firecracker/pull/5227) branch (`feature-riscv`), build it from source with a self-supplied riscv64 Rust target, and accept that snapshot/restore, CPU templates, boot timer, `vmgenid`, and initrd boot will all panic if invoked, with no vendor support and no test coverage.

## 9. Dependencies

Firecracker's Rust workspace dependencies were read directly from a fresh shallow clone (`Cargo.toml` + all `src/*/Cargo.toml`). None matched an existing entry in this project's report scope by exact name; the closest adjacent report is `project-reports/boringssl.md`, which covers a distinct codebase (BoringSSL, not AWS-LC).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| kvm-ioctls / kvm-bindings (now `rust-vmm/kvm`) | KVM ioctl wrapper + arch-specific KVM UAPI bindings | Yes, covers x86_64/aarch64/riscv64 | Yes, rust-vmm-ci runs riscv64 in a QEMU dev-container (`rust-vmm-container`, tag `latest-riscv`) | Released (post-merge into `rust-vmm/kvm`) | Relies on Linux KVM RISC-V (H-extension) support, upstream since kernel 5.16 |
| linux-loader | Loads guest kernel image + boot params/DTB | Yes - loads PE kernel format + riscv64 DTB | Part of rust-vmm-ci riscv64 pipeline | Released | No open riscv64-blocking issues found |
| vm-fdt | Flattened Device Tree builder | Arch-neutral, pure Rust | Covered by rust-vmm-ci | Released | None found |
| vm-memory, vm-allocator, vm-superio, vmm-sys-util | Guest memory, address allocator, virtio-console emulation, syscall helpers | Pure/arch-neutral; `vmm-sys-util` explicitly lists riscv64 support | Covered by rust-vmm-ci | Released | None found |
| vhost | vhost/vhost-user protocol | Pure Rust, arch-neutral | rust-vmm-ci riscv64 tier | Released | None found |
| aws-lc-rs (-> aws-lc-sys -> AWS-LC C core) | Cryptographic backend (TLS/hashing/HMAC/randomness) | Builds for `riscv64gc-unknown-linux-gnu`; pregenerated FFI bindings shipped | In aws-lc-rs's `cross.yml` cross-compile CI matrix | Released, but musl target (`riscv64gc-unknown-linux-musl`) bindings lagged glibc | No riscv64 vector-crypto (Zvkned/Zvbb/Zvkg) assembly yet - unlike hand-tuned x86_64/aarch64 AES-NI/NEON paths, riscv64 crypto runs unaccelerated |
| gdbstub / gdbstub_arch (optional, `gdb` feature) | GDB remote-serial stub | `gdbstub_arch` ships a `riscv` module | Not part of core VMM path | Released | No specific open riscv64 issues found |
| userfaultfd | Linux UFFD syscall bindings | Generic Linux syscall, arch-agnostic | N/A | Released | None found |
| micro_http (git dep) | Firecracker's minimal HTTP API server | Pure Rust, no arch-specific code | N/A | Tracks Firecracker's own git ref | None found |

**Deep-dive: aws-lc-rs.** This is the only dependency with a meaningful RISC-V performance gap. AWS-LC's core builds and functions correctly on riscv64gc-linux-gnu via a portable C fallback, but has no RISC-V vector-crypto assembly (Zvkned for AES, Zvbb for bit-manipulation-accelerated crypto, Zvkg for GHASH) analogous to its hand-tuned x86_64 AES-NI or aarch64 NEON/crypto-extension paths. Cryptographic operations (TLS handshake, hashing) inside Firecracker's API server therefore run unaccelerated on riscv64, if the port were ever completed.

**Toolchain (build-time, not a Cargo dependency) - Ubuntu 26.04 "resolute" riscv64 graph check:**

| Package | Ubuntu 26.04 riscv64 (resolute) |
|---|---|
| rustc | Found |
| cargo | Found |
| clang | Found |
| libclang-dev | Found |
| cmake | Found |
| libc6-dev | Found |
| linux-libc-dev | Found |
| qemu-system-misc | Found |
| gdb / gdb-multiarch | Found |
| firecracker | Not found - not packaged in Ubuntu for any architecture/suite |

**Bottom line on dependencies:** the underlying rust-vmm ecosystem (kvm-ioctls/kvm-bindings, linux-loader, vm-fdt, vm-memory, vm-allocator, vhost, vmm-sys-util) and the Linux kernel's KVM RISC-V support are riscv64-capable today, and the riscv64 build toolchain is fully available in Ubuntu 26.04. The dependency chain is not the blocker - the gap is entirely Firecracker's own unmerged port.

Section 10 (Ecosystem Status) is omitted: Firecracker is a standalone hypervisor binary with no dependent package ecosystem (no PyPI/npm/Maven package, no plugin/extension ecosystem requiring separate riscv64 enablement).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#752](https://github.com/firecracker-microvm/firecracker/issues/752) | RISC-V support | Closed (2019-07-15) | Feature request | Closed with the explicit architectural decision that RISC-V support belongs in shared `rust-vmm` crates, not Firecracker itself; never formally reversed |
| [#4754](https://github.com/firecracker-microvm/firecracker/pull/4754) | vmm: Introduce riscv64 architecture | Closed, unmerged | Implementation PR | Superseded by #4819 |
| [#4819](https://github.com/firecracker-microvm/firecracker/pull/4819) | vmm: arch: Introduce RISC-V regs | Open, draft, "Status: Parked" | Implementation PR | 0 comments, stalled since 2024-09-25 |
| [#4319](https://github.com/firecracker-microvm/firecracker/pull/4319) | chore: support ppc64le and riscv64 | Closed, unmerged | Rejected | Rejected on signaling grounds, not technical grounds |
| [#5227](https://github.com/firecracker-microvm/firecracker/pull/5227) | Support RISC-V architecture | Open, "Status: Parked" | Most substantial implementation PR | 1,656 lines, 20 commits, 0 unit tests, snapshot/restore and CPU templates unimplemented |

**Correctness bugs:** none applicable - there is no riscv64 code on `main` to exhibit correctness bugs. Within the unmerged PR #5227, the `unimplemented!()` panics in `VM::save_state/restore_state`, `KvmVcpu::save_state/restore_state/dump_cpu_config`, and register `serialize/deserialize` are not bugs in a shipped feature but explicit, intentional stubs marking unfinished work - calling them is a guaranteed crash, not a latent defect. Searched specifically for a "riscv nan floating point" issue: 0 results, no such issue exists.

## 12. Objections and Upstream Blockers

**Stated objections** (verbatim from maintainers, chronologically):
- raduweiss, 2019-07-15 (#752, closing): "we thought this is best done in rust-vmm, not Firecracker (and Firecracker can then consume it from there in the future)."
- zulinx86, 2024-09-02 (#4754): "we are not planning to support this feature into Firecracker at least in the near future, because we don't have RISC-V hardware in our testing infra to test the functionality continuously and we have not received much valid business use cases for it."
- roypat, 2023-12-13 (#4319): "Firecracker does not support ppc64le and riscv64, so I don't think having these two constants here is a very good idea, as it might send a wrong message about which platforms Firecracker supports."
- xmarcalx, 2025-05-28 (#5227): "at the moment of writing, we are not interested in supporting RISC-V architecture as there is not actual business/production usecase, it is a technology at early stage, and... it is difficult to get extensive testing or security coverage as we do not have access to real HW platforms. For this reason we can not provide the guarantees and level of quality which we usually aim to with a Firecracker release."

**Technical blockers:** no RISC-V CI/test hardware in Amazon's own infrastructure; even the most advanced community PR (#5227) could not be tested on physical H-extension hardware and relies solely on QEMU+AIA emulation; core lifecycle features (snapshot/restore, CPU templates) remain unimplemented in that PR.

**Organizational blockers:** 100%-Amazon maintainer roster with sole merge authority; no external pressure mechanism (no foundation governance, no RISE membership) to force reconsideration; Firecracker's charter explicitly discourages adding capabilities without a clear internal (AWS product) requirement.

**Acceptance probability:** Low in the near term. The precondition chain stated by maintainers themselves - concrete production/business use case, CI access to real RISC-V hardware with H-extension, maintainer-grade test coverage - has not been met as of the most recent activity (PR #5227, parked around 2025-10-22), and none of the four RISC-V PRs since 2023 has been merged despite genuine, sustained external contributor effort (TimePrinciple, DimitrisCharisis). The consistent seven-year pattern of "welcomed but declined absent a business driver" suggests this project will not add riscv64 support unless AWS's own product roadmap (EC2/Lambda/Fargate) requires it.

## 13. Readiness Assessment

- **Color:** orange (no upstream CI - no riscv64 build or test job exists in either `.github/workflows/` or `.buildkite/*.py`, confirmed by direct file inspection)
- **Release provider:** none (no upstream GitHub Release, no PyPI package, no RISE wheel, no distro package of any kind - Ubuntu, Debian, and the unofficial archriscv RISC-V Arch port all show zero `firecracker` package for any architecture)
- **Distribution floor:** does not apply upward. The distribution floor would upgrade an orange to yellow only if a distro shipped an unpatched riscv64 build; here, no distro packages Firecracker at all (for any architecture, let alone riscv64), so there is nothing to apply the floor to. The color remains orange on the strength of "no upstream CI" alone.
- **Not an optimization-purpose project:** Firecracker's value proposition (fast boot, low memory overhead, secure multi-tenant isolation) is delivered through its VMM design, not through architecture-specific SIMD/JIT/crypto acceleration in the sense the optimization modifier targets. This is a pure functional-enablement question - does it run on riscv64 at all - not a coverage-of-hot-paths question. Optimization level is therefore omitted from the header per instructions for non-optimization-purpose projects.
- **Justification:** No riscv64 code exists on Firecracker's default branch; no upstream CI builds or tests riscv64 (confirmed by reading all 7 `.github/workflows/*.yml` files and all `.buildkite/*.py` pipeline files directly); no official binary, PyPI, or distro package exists for riscv64, or for any architecture in the case of Debian/Ubuntu/archriscv. See [`.buildkite/common.py`](https://github.com/firecracker-microvm/firecracker/blob/main/.buildkite/common.py) (`DEFAULT_INSTANCES`, `get_arch_for_instance()`) and [PR #5227](https://github.com/firecracker-microvm/firecracker/pull/5227) (maintainer xmarcalx's 2025-05-28 comment stating no plans to support RISC-V).
- **Pending work that could change the grade:** PR [#5227](https://github.com/firecracker-microvm/firecracker/pull/5227) is open (not closed) and labeled "Status: Parked" rather than rejected outright - maintainers have stated they will reconsider "if that position changes" given a concrete business/production use case and access to physical H-extension hardware. No RISE involvement exists today (Section 12 of the underlying research; RISE is not a Firecracker member, has published no blog content about it, and RISE's own CI infrastructure runs a kernel too old to support virtualization at all, per RISE's own "RISE RISC-V Runners: Six Weeks In" post). A change in AWS's own product roadmap (e.g., an EC2/Lambda RISC-V instance offering) is the most plausible single event that would unblock this, per the maintainers' own stated criteria.

## 14. Investment Analysis

**What RISE has already done or funded here:** nothing. Checked riseproject.dev/members/ (Firecracker/firecracker-microvm is not a Premier or General member), the full RISE blog index (no post mentions Firecracker or microVMs), and the RISE GitHub org (`riseproject-dev`, 25 public repos, none Firecracker-related). RISE's own CI runners use Kubernetes pod isolation on bare-metal RISC-V (Scaleway EM-RV1), not Firecracker microVMs, and per RISE's own blog, their CI hardware "runs an older vendor kernel (5.10.x) and does not support virtualization" at all - meaning RISE's infrastructure could not currently even host a riscv64 Firecracker if one existed. All investment sizing below is therefore full-scope; no RISE-funded work needs to be excluded.

### 14.1 Functional Enablement

The starting point is PR #5227 (1,656 lines, boots on QEMU+AIA), which needs to be brought to a mergeable state:
- Complete snapshot/restore (`VM::save_state/restore_state`, `KvmVcpu::save_state/restore_state`, register serialize/deserialize) - Firecracker's headline feature, currently `unimplemented!()`.
- Complete CPU template support (currently an explicit placeholder).
- Implement boot timer, `vmgenid`, and initrd boot support (currently unimplemented).
- Add unit test coverage comparable to x86_64 (55 tests) and aarch64 (52 tests); currently 0.
- Validate on physical H-extension hardware - the original author explicitly could not do this; a board with H-extension support is a prerequisite the maintainers themselves cite as blocking.
- Address the interrupt-delivery divergence (`KVM_IRQ_LINE` vs IRQFD) for correctness and performance parity review.

### 14.2 Performance Optimization

Not assessable until functional enablement lands - no riscv64 build exists to benchmark. Once functional, the aws-lc-rs cryptographic backend's lack of RISC-V vector-crypto (Zvkned/Zvbb/Zvkg) assembly would be the first-order optimization gap for the API server's TLS/hashing paths (Section 9).

### 14.3 CI/CD Infrastructure

- Add a riscv64 lane to `.buildkite/common.py`'s `DEFAULT_INSTANCES` and `get_arch_for_instance()`, and to `pipeline_cross.py`'s instance enumeration.
- Because Amazon's own bare-metal instance fleet does not include riscv64 (unlike Graviton for aarch64), this requires either a RISC-V-capable EC2 instance type becoming available, or maintainers accepting a non-AWS-hosted CI runner (e.g., RISE runners) - which itself currently lacks virtualization-capable kernels (Section 12).
- Extend `tools/devctr/Dockerfile` cross-toolchain installation and `rust-toolchain.toml` targets to include `riscv64gc-unknown-linux-musl`.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 was omitted; Firecracker has no dependent package ecosystem requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Complete snapshot/restore (VM + vCPU state, register serialize/deserialize) in PR #5227 | 4-6 | Upstream contributor + Firecracker maintainer review | Critical |
| Functional | Complete CPU template support (currently a placeholder) | 2-3 | Upstream contributor | Critical |
| Functional | Implement boot timer, vmgenid, initrd boot | 2-3 | Upstream contributor | High |
| Functional | Add unit test suite (target parity with 52-55 tests on aarch64/x86_64) | 3-4 | Upstream contributor | Critical |
| Functional | Validate on physical RISC-V H-extension hardware | 2-4 (dependent on hardware access) | Hardware partner + upstream contributor | Critical (explicitly maintainer-blocking) |
| CI/CD | Add riscv64 lane to Buildkite pipelines (`common.py`, `pipeline_cross.py`) | 2-3 | Infra engineer with Firecracker CI familiarity | High |
| CI/CD | Extend dev-container and Rust toolchain for riscv64 cross-compilation | 1-2 | Infra engineer | High |
| Performance | Evaluate/close aws-lc-rs riscv64 vector-crypto gap (Zvkned/Zvbb/Zvkg) once functional port lands | 3-5 | Crypto/perf engineer (largely an aws-lc-rs upstream effort, not Firecracker-specific) | Medium |
| Organizational | Secure a validated business/production use case and present to Firecracker maintainers per their stated precondition | N/A (business development, not engineering) | Product/business stakeholder | Critical (gates all upstream merge acceptance regardless of code quality) |

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [Issue #752 - RISC-V support](https://github.com/firecracker-microvm/firecracker/issues/752)
- [PR #4754 - vmm: Introduce riscv64 architecture](https://github.com/firecracker-microvm/firecracker/pull/4754)
- [PR #4819 - vmm: arch: Introduce RISC-V regs](https://github.com/firecracker-microvm/firecracker/pull/4819)
- [PR #4319 - chore: support ppc64le and riscv64](https://github.com/firecracker-microvm/firecracker/pull/4319)
- [PR #5227 - Support RISC-V architecture](https://github.com/firecracker-microvm/firecracker/pull/5227)
- [PR #5215 - PCI host bridge support](https://github.com/firecracker-microvm/firecracker/pull/5215) (not RISC-V, included for completeness)
- [firecracker/docs/getting-started.md](https://github.com/firecracker-microvm/firecracker/blob/main/docs/getting-started.md)
- [firecracker/FAQ.md](https://github.com/firecracker-microvm/firecracker/blob/main/FAQ.md)
- [firecracker/CHARTER.md](https://github.com/firecracker-microvm/firecracker/blob/main/CHARTER.md)
- [firecracker/MAINTAINERS.md](https://github.com/firecracker-microvm/firecracker/blob/main/MAINTAINERS.md)
- [firecracker/CREDITS.md](https://github.com/firecracker-microvm/firecracker/blob/main/CREDITS.md)
- [firecracker-microvm.github.io](https://firecracker-microvm.github.io/)
- [firecracker/SPECIFICATION.md](https://github.com/firecracker-microvm/firecracker/blob/main/SPECIFICATION.md)
- [.buildkite/common.py](https://github.com/firecracker-microvm/firecracker/blob/main/.buildkite/common.py)
- [.buildkite/pipeline_cross.py](https://github.com/firecracker-microvm/firecracker/blob/main/.buildkite/pipeline_cross.py)
- [PyPI JSON API for "firecracker"](https://pypi.org/pypi/firecracker/json) (404, package does not exist)
- [RISE wheel builder PyPI proxy for "firecracker"](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/firecracker/) (redirects to PyPI 404)
- [Ubuntu packages.ubuntu.com search for "Firecracker" on resolute](https://packages.ubuntu.com/search?keywords=Firecracker&suite=resolute&searchon=names&section=all) (no results)
- [Repology aggregation for "firecracker"](https://repology.org/api/v1/project/firecracker)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project blog index](https://riseproject.dev/blog/)
- ["Announcing the RISE RISC-V Runners: free, native RISC-V CI on GitHub"](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- ["RISE RISC-V Runners: Six Weeks In"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [Wikipedia: Firecracker (software)](https://en.wikipedia.org/wiki/Firecracker_(software))
