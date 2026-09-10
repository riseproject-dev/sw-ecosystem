---
title: Kata Containers
parent: Project Reports
color: blue
dependencies:
  - name: QEMU
    relation: runtime-dependency
    criticality: critical
  - name: Cloud Hypervisor
    relation: runtime-dependency
    criticality: optional
  - name: containerd
    relation: build-dependency
    criticality: optional
  - name: runc
    relation: build-dependency
    criticality: optional
  - name: CRI-O
    relation: build-dependency
    criticality: optional
  - name: libseccomp
    relation: runtime-dependency
    criticality: optional
  - name: virtiofsd
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" focus="kata-containers" %}

# Kata Containers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Kata Containers<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Kata Containers is an OCI-compatible container runtime that isolates each container (or pod) inside a lightweight virtual machine instead of relying on kernel namespaces/cgroups alone, using a Go control-plane runtime and a Rust in-guest agent, coordinated with a choice of external hypervisors (QEMU, Cloud Hypervisor, Firecracker) or an in-tree Rust VMM (Dragonball). It originated from the 2018 merger of Intel Clear Containers and Hyper runV, launched under the OpenStack Foundation, and is now governed by the Open Infrastructure (OpenInfra) Foundation under Apache 2.0, following OpenInfra's "four opens" model.

**Governance.** The de facto technical steering body is the 7-seat Architecture Committee, elected by Contributors in split Spring/Autumn cycles (4/3 seats), meeting weekly (Thursdays 1300 UTC), with a diversity rule capping any single company at 2 of the 7 seats. Current members: Aurelien Bombo (Microsoft), Fabiano Fidencio (NVIDIA), Fupan Li (Ant Group), Greg Kurz (Red Hat), Markus Rudy (Edgeless Systems), Ruoqing He (ISCAS - Institute of Software, Chinese Academy of Sciences), Steve Horsman (IBM).

**Corporate sponsors** (katacontainers.io/supporters): Platinum - Ant Group, Ericsson, Huawei, Wind River; Gold - Bloomberg, Canonical, China Mobile, China Unicom, Cleura, Deutsche Telekom, H3C, Red Hat, ZTE; Silver - AMD, Fujitsu, Hitachi Vantara, OVHcloud, Societe Generale, and roughly 20 others; Infrastructure Donors - Google Cloud, Microsoft, AWS, Alibaba Cloud, VEXXHOST, Packet, Package Cloud. Baidu is called out separately as a notable production user.

**Community culture on new ports.** No formal, written "architecture tier" acceptance policy exists in the `community` repository's governance docs. The project states a general design goal - "Kata Containers is designed to be architecture agnostic" - and in practice new ports proceed through normal Committer/PR review with incremental, self-staged CI rollout (build-check a few components first, expand gradually). The community's stance toward the RISC-V port in particular has been notably supportive: the port's principal author, Ruoqing He (ISCAS), was subsequently elected onto the Architecture Committee.

**RISE relationship.** Kata Containers itself is not a RISE member project and has zero footprint in RISE's published material (33 blog posts on riseproject.dev checked via sitemap, zero matches for "kata"; WordPress on-site search for "kata" returns no results). However, ISCAS - the institution behind the RISC-V port and an Architecture Committee seat holder - is a RISE General Member, an indirect but concrete link.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-03-15 | Issue #9284 opened: "runtime: Add support for riscv64 architecture" | [issue #9284](https://github.com/kata-containers/kata-containers/issues/9284) |
| 2024-08-29 | Issue #10226 opened: "dragonball: Introduce riscv64 architecture" (still open) | [issue #10226](https://github.com/kata-containers/kata-containers/issues/10226) |
| 2024-11-08 | PR #10512 opened: "agent: Support RISC-V 64-bit architecture" (ncppd, VITAMIN-V) | [PR #10512](https://github.com/kata-containers/kata-containers/pull/10512) |
| 2024-11-12 | Issue #10524 opened (ISRC-CAS): offers riscv64 CI hardware, documents 40+ merged rust-vmm PRs establishing riscv64 as a rust-vmm target; closed 2025-01-14 in favor of #10734 | [issue #10524](https://github.com/kata-containers/kata-containers/issues/10524) |
| 2024-11-13 | Issue #10538 opened (VITAMIN-V EU project): progress log on StarFive VisionFive 2 bring-up | [issue #10538](https://github.com/kata-containers/kata-containers/issues/10538) |
| 2024-11-13 | Issue #10532 opened: "runtime-rs: Need riscv64 architecture support" (still open) | [issue #10532](https://github.com/kata-containers/kata-containers/issues/10532) |
| 2025-01-14 | Issue #10734 opened (RuoqingHe, ISCAS): master tracking issue with component roadmap table | [issue #10734](https://github.com/kata-containers/kata-containers/issues/10734) |
| 2025-01-15 to 2025-01-24 | Issue #10739 ("virtiofsd cannot be built on RISC-V", unbound-variable bug) filed and fixed via PR #10740; merged 2025-01-24 (git-verified) | [issue #10739](https://github.com/kata-containers/kata-containers/issues/10739), [PR #10740](https://github.com/kata-containers/kata-containers/pull/10740) |
| 2025-02-13 | PR #10832 merged: yq upgraded to v4.44.5 for riscv64 CI tooling (git-verified merge date) | [PR #10832](https://github.com/kata-containers/kata-containers/pull/10832) |
| 2025-02-26 | PR #10831 merged: CI build-check enabled on riscv64 (git-verified merge date; note the original search summary reported 2025-02-04, which the git-based cross-check found to be incorrect) | [PR #10831](https://github.com/kata-containers/kata-containers/pull/10831) |
| 2025-03-11 | PR #10948 merged: build-checks matrix refactor (git-verified) | [PR #10948](https://github.com/kata-containers/kata-containers/pull/10948) |
| 2025-03-13 | PR #11001 merged: guest kernel build enabled for riscv64 (git-verified) | [PR #11001](https://github.com/kata-containers/kata-containers/pull/11001) |
| 2025-03-17 (per search data, not independently git-verified) | PR #11042: "runtime-rs: Support and enable build on riscv64" merged | [PR #11042](https://github.com/kata-containers/kata-containers/pull/11042) |
| 2025-03-19 (per search data, not independently git-verified) | PR #11056: "runtime: Support and enable build on riscv64" merged | [PR #11056](https://github.com/kata-containers/kata-containers/pull/11056) |
| 2025-03-28 (per search data, not independently git-verified) | PR #11094: static tarball build workflow enabled for riscv64 | [PR #11094](https://github.com/kata-containers/kata-containers/pull/11094) |
| 2025-05-07 | PR #10512 (agent) merged - **git-verified**, contradicting the original search summary's claimed 2024-11-08 date (that is the PR-open date, not the merge date); first shipped in release 3.17.0 | [PR #10512](https://github.com/kata-containers/kata-containers/pull/10512) |
| 2025-06-12 | Issue #11415 opened: "dragonball: Bump rust-vmm crates to support RISC-V" (Summer of Code item, still open, no visible comments/body) | [issue #11415](https://github.com/kata-containers/kata-containers/issues/11415) |
| 2025-11-10 (per search data) | PR #12057: riscv given its own nightly CI pipeline, separated from main CI noise | [PR #12057](https://github.com/kata-containers/kata-containers/pull/12057) |
| 2026-04-02 (per search data) | PR #12769: "runtime-rs: Allow installation on RISC-V platforms" merged | [PR #12769](https://github.com/kata-containers/kata-containers/pull/12769) |
| 2026-05-20 | PR #13079 opened (draft, still open): "runtime, agent: enable Cloud Hypervisor on RISC-V"; explicitly blocked on upstream [cloud-hypervisor/cloud-hypervisor#8258](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/8258) | [PR #13079](https://github.com/kata-containers/kata-containers/pull/13079) |
| 2026-09-03 | Commit 5d98359 ("gha: Give every job a timeout-minutes") documents that riscv64 CI jobs have not executed once in 120 days - queued for the full 24-hour limit and cancelled, no `riscv-builder` runner available | [commit 5d98359](https://github.com/kata-containers/kata-containers/commit/5d983590e98f67ad5ad5410a4368c4dcedbeee4b) |

**Key contributors and organizations.** Ruoqing He (ISCAS/openEuler) is the principal driver: author of the master tracking issue #10734, presenter at FOSDEM 2025, and now an elected Architecture Committee member. ncppd (VITAMIN-V, EU Horizon project) authored the agent port (#10512) and the parallel tracking issue #10538, documenting the StarFive VisionFive 2 bring-up. TimePrinciple contributed the initial (unmerged) dragonball attempt (#10227) and its rust-vmm crate work. wangyf0611 authored the current-frontier Cloud Hypervisor PR #13079, with AI-assisted commits (disclosed via `Assisted-By: OpenAI-Codex:GPT-5` trailers).

**Is it fully upstream?** No. Runtime (Go), runtime-rs, guest kernel build, and virtiofsd are merged into `main` and reachable from the current HEAD (git-verified for the subset checked). The agent is merged but the master tracking issue itself still labels it "ongoing." Dragonball (the in-tree Rust VMM used by the runtime-rs stack) has no riscv64 implementation - tracked by still-open issues #10226 and #11415 - and OSBuilder (rootfs builder) is "ongoing," not fully landed. Cloud Hypervisor support for riscv64 is an open draft PR (#13079) explicitly gated on an unmerged upstream cloud-hypervisor issue.

## 3. Upstream Support Tier

No formal tier policy or new-architecture acceptance gate exists in the project's governance documents (checked `community` repo README - no explicit criteria found).

**CI evidence.** riscv64 CI is entirely isolated from the main pull_request/push pipeline: `.github/workflows/ci.yaml` and `.github/workflows/release.yaml` build/test/release only amd64, arm64, ppc64le, and s390x - zero riscv references. riscv64 support lives in three separate workflow files (`ci-nightly-riscv.yaml`, `build-checks-preview-riscv64.yaml`, `build-kata-static-tarball-riscv64.yaml`) that fire only on a daily cron (`0 5 * * *`) or manual `workflow_dispatch`, running on a dedicated self-hosted `riscv-builder` runner. **riscv64 is therefore not release-blocking and not part of standard PR gating.**

**Official binaries.** No GitHub release (v4.1.0, v4.0.0, v3.32.0, v3.31.0, v3.30.0 checked) contains a riscv64 asset; supported architectures across all recent releases are amd64, arm64, ppc64le, and s390x (Go-static tarball only) only.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Part of main `ci.yaml`/`release.yaml` gating | Yes | Yes | No |
| CI runs test suite | Yes | Yes | Yes, by design (`make check`/`make test`), but virtualization-dependent subset skipped, and the runner has been non-operational for 120+ days as of 2026-09-03 |
| Upstream release artifact | Yes | Yes | No |
| Listed in `README.md` "Platform support" table | Yes | Yes | No |
| Status per `docs/design/virtualization.md` | Stable | Stable | "experimental" |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Kata Containers is an infrastructure/orchestration project (container-VM runtime), not a numerics or codegen library: it has no JIT compiler, no SIMD/vectorized hot paths, and no hand-written assembly anywhere in the repository for any architecture (confirmed by exhaustive `find . -name "*.S"` returning empty, and by code searches for `vfloat32m1_t`/`rvv` returning zero results). The riscv64-specific code that exists is enablement/dispatch code, not optimization code:

| Component | riscv64 status |
|---|---|
| Hypervisor backend (`src/runtime/virtcontainers/qemu_riscv64.go`, 65 lines) | QEMU only. Sets default path `/usr/bin/qemu-system-riscv64`, machine type `virt`, `accel=kvm,usb=off`. `appendIOMMU()` explicitly returns an error - vIOMMU is unsupported on riscv64. |
| CPU/KVM capability probe (`kata-check_riscv64.go`, 141 lines) | Parses `/proc/cpuinfo` (`mvenderid`/`marchid`/`processor`), requires `kvm`/`vhost`/`vhost_net` kernel modules. `archRequiredCPUFlags` is an empty map - no ISA-extension gating is enforced at runtime. |
| Guest protection / confidential computing (`hypervisor_linux_riscv64.go`, Go; `src/libs/kata-sys-util/src/protection.rs`, Rust) | Both stub `availableGuestProtection()` to return `NoProtection` on riscv64 - confidential-computing support is not implemented for this architecture. Data not available: which specific technologies (e.g. SEV, TDX) amd64/arm64 implement was not directly researched in these findings; only the riscv64 stub was confirmed. |
| VM factory templating (`template_riscv64.go`) | Sets `templateDeviceStateSize = 8`. |
| VMM sizing (`vmm_riscv64.go`) | `MaxVCPUs()` returns 512. |
| Dragonball / runtime-rs VMM path | No riscv64 implementation. `VmmState` enum in `src/runtime-rs/crates/hypervisor/src/lib.rs` is gated to `x86_64`/`aarch64` only, with a comment explicitly calling out riscv64gc as excluded (avoiding a clippy "unused enum" failure, not an intentional feature gap closure). |
| Guest kernel config fragments (`configs/fragments/riscv/{base,mmu,pci}.conf`) | `CONFIG_RISCV=y`, `CONFIG_64BIT=y`, `CONFIG_VIRTUALIZATION=y`, `CONFIG_KVM=y`, NUMA/SPARSEMEM/hotplug options, PCI host generic/common options. |

| Comparison | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hypervisors wired into Kata | QEMU, Cloud Hypervisor, Firecracker, Dragonball (per `versions.yaml`/Cargo.toml gating; not independently re-verified in this pass) | Data not available: not directly researched in these findings | QEMU only; Cloud Hypervisor pending open draft PR #13079; Firecracker and Dragonball unsupported |
| Confidential computing | Data not available | Data not available | Explicit `NoProtection` stub |
| vIOMMU | Data not available | Data not available | Explicitly unsupported (hard error in code) |
| Firmware boot path | OVMF/edk2 present in `versions.yaml` | OVMF/edk2 present in `versions.yaml` | Direct kernel boot only; no firmware path in `qemu_riscv64.go`; riscv ACPI kernel fragment explicitly skipped because "RISC-V ACPI not yet ratified" |

## 5. Build System, Cross-Compilation, and Toolchain

Kata uses GNU Make (Go runtime, kernel, static tarballs) and Cargo (Rust agent/runtime-rs) - there is no CMake anywhere in the repository. riscv64 is built **natively** on the self-hosted `riscv-builder` runner (real hardware); there is no QEMU-user-mode/binfmt cross-compilation setup and no `riscv64-linux-gnu-gcc`/`CROSS_COMPILE` toolchain file in the repo.

**Toolchain versions** (`versions.yaml`, project-wide minimums, no riscv64-specific override): Go 1.26.7, Rust 1.96, golangci-lint 2.9.0. No GCC/Clang version is pinned specifically for riscv64; Dockerfiles install `build-essential` from whatever Ubuntu 22.04/24.04 ships.

**Build commands** (run natively, arch auto-detected via `uname -m`):
```
make kernel-tarball
make virtiofsd-tarball
cd src/runtime && make check && make test
cd src/agent && make check
cd src/runtime-rs && make check
```

**Arch-dispatch config:** `src/runtime/arch/riscv64-options.mk` sets `MACHINETYPE := virt`, `QEMUCMD := qemu-system-riscv64`, empty `CPUFEATURES`/`KERNELPARAMS`. `src/runtime-rs/arch/riscv64gc-options.mk` adds `KERNELPARAMS := cgroup_no_v1=all systemd.unified_cgroup_hierarchy=1`. riscv64 links against **glibc**, not musl - `ci/install_libseccomp.sh` and `tools/packaging/static-build/virtiofsd/gnu/Dockerfile` both note no musl Rust target exists for riscv64 (`rust_arch=riscv64gc`, `libc=gnu`, `arch_libc=riscv64-linux-gnu`), unlike x86_64/aarch64 which default to musl static linking.

**Known build failures:**
- `virtiofsd` static build aborted with `unbound variable` on the `libc` shell variable in `scripts/lib.sh` line 212 - filed as [issue #10739](https://github.com/kata-containers/kata-containers/issues/10739), fixed by [PR #10740](https://github.com/kata-containers/kata-containers/pull/10740).
- Rust 1.79 build failure: `field supports_seccomp is never read` lint error under `--deny warnings` in `src/config.rs:120:9`, tracked as [issue #10067](https://github.com/kata-containers/kata-containers/issues/10067) and worked around by removing `--deny warnings` (documented in [issue #10538](https://github.com/kata-containers/kata-containers/issues/10538)).
- `yq` had no riscv64 binaries available and required native compilation until [PR #10832](https://github.com/kata-containers/kata-containers/pull/10832) upgraded to v4.44.5, which shipped riscv64 binaries.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64/arm64 | riscv64 |
|---|---|---|
| QEMU hypervisor | Supported | Supported |
| Cloud Hypervisor | Supported | Not wired in; open draft PR #13079 blocked on upstream cloud-hypervisor#8258 |
| Firecracker | Supported | Not supported upstream in cloud-hypervisor's peer project Firecracker at all ([firecracker issue #752](https://github.com/firecracker-microvm/firecracker/issues/752), opened 2018, unresolved) |
| Dragonball (in-tree VMM) | Supported | Not implemented; open issues [#10226](https://github.com/kata-containers/kata-containers/issues/10226), [#11415](https://github.com/kata-containers/kata-containers/issues/11415) |
| Confidential computing (guest protection) | Data not available (not directly researched) | Explicit `NoProtection` stub in both Go and Rust runtimes |
| vIOMMU | Data not available | Explicitly unsupported, hard error in code |
| Firmware/UEFI boot | OVMF path present | Direct kernel boot only; no firmware path |
| Node virtualization-capability detection (Helm chart NFD affinity) | x86_64 checks for VMX/SVM | Not implemented - TODO comment in `_helpers.tpl`; riscv64 nodes are always scheduled regardless of actual virtualization capability |

**Performance gaps.** No published benchmark data (latency, throughput, startup time, or any other metric) for Kata Containers on RISC-V exists in any public source reached during this research - checked GitHub, general web search, RISE blog, FOSDEM 2025 talk materials, the RISC-V Summit Europe 2025 poster (fetched but not machine-extractable), and the VITAMIN-V arXiv papers (2305.10982, 2407.00052v1), which describe planned benchmark methodology (FunctionBench, TPC-DS/Spark, CoreMark-normalized comparisons) but present it in future tense with no results. A Springer chapter that may contain such data ("Vitamin-V: Serverless Cloud Computing Porting on RISC-V," 10.1007/978-3-031-78380-7_10) was paywalled and could not be read. **Any specific benchmark figure for Kata on RISC-V should be treated as unverified.**

**NaN / floating-point semantics issue.** Explicitly searched for; no such bug exists in kata-containers/kata-containers. This appears to be a non-issue and should not be cited.

**Security hardening gaps.** No confidential-computing support on riscv64 (stub), no vIOMMU (no device-passthrough isolation boundary via IOMMU), no node-level virtualization-capability verification in the Helm chart's scheduling affinity rules, and the CI runner itself lacks KVM/nested-virt so the `make test` pass on riscv64 does not exercise the actual KVM-backed sandbox path - only non-virtualization-dependent code paths are validated in CI (`GITHUB_RUNNER_CI_NON_VIRT=true`).

## 7. CI/CD Infrastructure

Confirmed by reading the workflow files directly (no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist - GitHub Actions is the only CI system):

- **`.github/workflows/ci-nightly-riscv.yaml`** - orchestrator, trigger `schedule` only (`cron: '0 5 * * *'`), dispatches to the two reusable workflows below. No push/PR/dispatch trigger on this file itself.
- **`.github/workflows/build-kata-static-tarball-riscv64.yaml`** - `workflow_call` only, `runs-on: riscv-builder` (dedicated self-hosted riscv64 hardware, listed in `.github/actionlint.yaml`'s self-hosted labels), builds kernel and virtiofsd static tarballs, timeout 120 minutes.
- **`.github/workflows/build-checks-preview-riscv64.yaml`** - `workflow_dispatch` and `workflow_call`, `runs-on: riscv-builder`. Comment at the top of the file: "This yaml is designed to be used until all components listed in `build-checks.yaml` are supported" - i.e., explicitly a temporary/reduced-scope check. Runs `make check`/`make test` (including a root-privileged `make test`) across agent, agent-ctl, trace-forwarder, genpolicy, runtime, runtime-rs. Sets `GITHUB_RUNNER_CI_NON_VIRT=true` when `instance == 'riscv-builder'`, skipping virtualization-dependent tests because the runner lacks nested-virt/KVM capability.
- **`.github/actionlint.yaml`** - lists `riscv-builder` among self-hosted runner labels (not CI logic itself, just lint config).

Physical hardware: three SG2042 boards labeled `riscv-builder`, per commit [e0fb8f0](https://github.com/kata-containers/kata-containers/commit/e0fb8f08d822decd25f64cfbb32e99381bb8d908) ("ci: Add riscv-builder to actionlint.yaml"). No evidence of RISE runner usage anywhere in Kata's CI configuration or in RISE's own published material for this project.

**Critical operational finding.** Per commit [5d98359](https://github.com/kata-containers/kata-containers/commit/5d983590e98f67ad5ad5410a4368c4dcedbeee4b) ("gha: Give every job a timeout-minutes"), current as of 2026-09-03: "The riscv64 jobs have not executed once in 120 days, sitting queued for the full 24 hour limit and then being cancelled because no riscv-builder runner is available." The dedicated riscv64 CI runners are effectively offline, meaning the merged riscv64 code has had no live CI validation for roughly four months at the time of writing.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Part of main `ci.yaml`/`release.yaml` | Yes | Yes | No |
| Trigger | push/PR (release-blocking) | push/PR (release-blocking) | Nightly cron + manual dispatch only |
| Runner | GitHub-hosted | GitHub-hosted (assumed; not directly re-verified here) | Self-hosted, real riscv64 hardware (SG2042 boards) |
| Currently operational | Yes | Yes | No - queued/cancelled for 120+ days as of 2026-09-03 |

## 8. Distribution and Release Status

No upstream riscv64 release artifact exists in any channel checked:
- **GitHub releases** - v4.1.0 (2026-08-21), v4.0.0, v3.32.0, v3.31.0, v3.30.0 all checked; assets are `kata-static-<ver>-{amd64,arm64,ppc64le}.tar.zst` and `kata-go-static-<ver>-{amd64,arm64,ppc64le,s390x}.tar.zst` plus `kata-deploy` tarballs. No filename contains "riscv" in any of these releases.
- **PyPI** - not applicable; Kata is a Go/Rust project, no PyPI package exists (`https://pypi.org/pypi/kata-containers/json` returns 404).
- **RISE wheel builder** - not applicable for the same reason; redirect to PyPI also returns 404.
- **Ubuntu 26.04 (resolute)** - only match is `golang-github-kata-containers-govmm-dev` (an unrelated Go-library dependency, `Architecture: all`), not the actual Kata runtime/CLI. No dedicated Kata Containers binary package exists in resolute on any architecture.
- **`versions.yaml`'s image/initrd/kernel architecture matrix** omits riscv64 entirely - there is no officially built riscv64 guest rootfs, initrd, or kernel in the release pipeline, even though the kernel and virtiofsd static-build scripts are already riscv64-aware.

**What a user must do today to get a working riscv64 build.** Build from source natively on riscv64 hardware (or under QEMU emulation on an x86 host, as the VITAMIN-V team does since their StarFive VisionFive 2 board lacks the H-extension/KVM): install Rust >=1.79 (per the workarounds documented, though `versions.yaml` now pins 1.96), Go >=1.22.5 (per `versions.yaml`, 1.26.7), a natively-compiled `yq` (or use v4.44.5+ which now ships riscv64 binaries), then run the agent/runtime/kernel/virtiofsd build steps by hand following the VITAMIN-V build log ([issue #10538](https://github.com/kata-containers/kata-containers/issues/10538)) or the demo setup documented in [issue #10734](https://github.com/kata-containers/kata-containers/issues/10734) (Go runtime v3.2.0, kata-agent v3.12.0, qemu-system-riscv64 v8.2.0/v9.2.0, kernel v6.12.8 from an ISCAS mirror, tested on openEuler RISC-V 24.03 LTS SP1). No official guest rootfs/kernel image is published, so the user must also build or source one via `osbuilder` themselves.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| QEMU (v11.0.1 pinned per one research pass; note a separate pass cites Cloud Hypervisor v45.0/v51.1 pins from different points in time - treat exact pinned versions as [NEEDS VERIFICATION] against the current `versions.yaml`) | Only production hypervisor wired into Kata for riscv64 | Yes, cross-compiled; Ubuntu/Debian/Arch riscv64 packages exist | Partial (`check-tcg` only, no native KVM CI job) | Debian/Arch packages; no official upstream binaries for any arch | See `project-reports/qemu.md`: `--disable-tcg` FTBFS, 23 open IOMMU conformance bugs, KVM hw-breakpoint stubs return `-EINVAL`, no RVV SIMD in TCG/pixman |
| Cloud Hypervisor | Secondary hypervisor, not yet wired into Kata's riscv64 build (`riscv64-options.mk` has no `CLHCMD`) | Experimental riscv64 support since ~v45.0 (direct-kernel-boot only, requires AIA interrupt controller hardware) | Experimental | GitHub release binaries, riscv64 asset present since v45.0 | Open roadmap issue [cloud-hypervisor#6978](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/6978); blocking issue for Kata's PR #13079 is [cloud-hypervisor#8258](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/8258); no dedicated project report exists yet in this repository - recommended addition |
| Firecracker | Tertiary hypervisor; no riscv64 support upstream | No | No | No | [firecracker#752](https://github.com/firecracker-microvm/firecracker/issues/752), opened 2018, unresolved, no maintainer engagement since. Kata's Go runtime correctly does not enable `FCCMD` for riscv64 |
| Dragonball (in-tree Rust VMM) | Kata's built-in lightweight VMM for the runtime-rs stack | No | No | No | [#10226](https://github.com/kata-containers/kata-containers/issues/10226), [#11415](https://github.com/kata-containers/kata-containers/issues/11415), both open |
| rust-vmm crates (`kvm-bindings`, `kvm-ioctls`, `vm-memory`, `linux-loader`, `seccompiler`, etc.) | KVM/VMM plumbing consumed by Dragonball | Upstream riscv64 support already exists at Kata's pinned crate versions | Not exercised (Dragonball doesn't build for riscv64) | N/A (library crates) | The real blocker is Dragonball's own `target_arch` gating, not crate availability |
| containerd | CRI runtime invoking Kata; also a direct Go dependency | Yes, release binaries since v1.6.8; Ubuntu 26.04 riscv64 package found | No - not in official CI integration matrix, per a pending PR blocked on RISE GitHub App install | Yes, riscv64 asset in every release since 2022 | See `project-reports/containerd.md` |
| runc | OCI runtime primitives reused by Kata (direct go.mod dependency) | Yes; Ubuntu 26.04 riscv64 package found | No CI test coverage | Yes, `runc.riscv64` since v1.2.0 (2022) | See `project-reports/runc.md` |
| CRI-O | Kata imports CRI-O's Go packages as a library dependency | Kata's own riscv64 CI transitively exercises `go build`/`go vet` of this import and has been green when it runs | CRI-O's own upstream CI has zero riscv64 coverage | No CRI-O release includes riscv64 assets | See `project-reports/cri-o.md` (orange grade). [NEEDS VERIFICATION] whether this ever becomes a real build risk for Kata since it is consumed as a library, not compiled standalone |
| libseccomp (C library, consumed via the `libseccomp` Rust crate in `src/agent/rustjail`) | In-guest syscall filtering | Ubuntu 26.04 riscv64 package found | Full - 5,229/5,229 tests passed on real riscv64 hardware (2020) | Debian/Ubuntu/Arch riscv64 packages since v2.5.0 | See `project-reports/libseccomp.md` - fully complete, no open blockers |
| libseccomp-golang | Go bindings used by the CRI-O/runc dependency chain, not directly by Kata's own code | Ubuntu 26.04 riscv64 dev package absent | N/A | Packaging gap only | See `project-reports/cri-o.md` Section 9 |
| virtiofsd | vhost-user virtio-fs backend for QEMU-based sandboxes | Ubuntu 26.04 riscv64 package found; Kata's own static-build script has an explicit riscv64/glibc case | Not verified in Kata's own riscv64 CI (no dedicated virtiofsd test job seen in the three riscv64 workflow files) | Ubuntu ships a riscv64 binary; Kata's static-build path is riscv64-aware | None found |
| Linux guest kernel | Guest VM kernel | Fully upstream riscv64 support; Kata's `build-kernel.sh -a riscv64` is already riscv64-aware | Fully upstream | No official Kata-built riscv64 kernel binary shipped (absent from `versions.yaml`'s image/kernel arch matrix) | Kernel riscv64 support itself is mature; the gap is Kata's release pipeline, not the kernel |
| Go / Rust toolchains | Build toolchains | Full native riscv64 target support in both | Full | N/A | Mature riscv64 compilation targets |

CRIU/checkpoint-restore and OVMF/edk2 firmware were checked and confirmed **not** applicable to Kata's current riscv64 design (no CRIU reference anywhere in `go.mod`/`Cargo.toml`/source; riscv64 boots via direct kernel boot only, no firmware path).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#10734](https://github.com/kata-containers/kata-containers/issues/10734) | Kata-Containers on RISC-V (master tracking) | Open | Tracking | Roadmap: agent/dragonball/osbuilder marked "ongoing," runtime/runtime-rs/kernel/virtiofsd "completed" |
| [#10538](https://github.com/kata-containers/kata-containers/issues/10538) | VITAMIN-V: onboard RISC-V to kata containers | Open | Tracking | Parallel EU-project tracking issue; open TODO to test with KVM once H-extension hardware is available |
| [#9284](https://github.com/kata-containers/kata-containers/issues/9284) | runtime: Add support for riscv64 architecture | Open | Feature gap | Base request; implemented via merged #11056 but issue itself remains open |
| [#10226](https://github.com/kata-containers/kata-containers/issues/10226) | dragonball: Introduce riscv64 architecture | Open | Feature gap | No implementation exists |
| [#10532](https://github.com/kata-containers/kata-containers/issues/10532) | runtime-rs: Need riscv64 architecture support | Open | Feature gap | - |
| [#11415](https://github.com/kata-containers/kata-containers/issues/11415) | dragonball: Bump rust-vmm crates to support RISC-V | Open | Blocker for Dragonball | SoC-tagged item; no visible comments/body despite one search index reporting "3 comments" |
| [#10739](https://github.com/kata-containers/kata-containers/issues/10739) | virtiofsd cannot be built on RISC-V | Closed | Build failure | Root cause: unbound shell variable `libc` in `scripts/lib.sh`; fixed by PR #10740 |
| [#10524](https://github.com/kata-containers/kata-containers/issues/10524) | kata-containers: Introduce RISC-V 64-bit architecture support | Closed (superseded) | Epic | Folded into #10734 once CI/roadmap tracking consolidated |
| (commit 5d98359) | riscv64 CI runners idle 120 days, no runner available | Not a filed issue, documented in commit message | Operational | Current, as of 2026-09-03 |

**Correctness bugs.** None identified for riscv64. The "NaN/floating-point" bug referenced in some external framing does not exist in this repository - explicitly searched for and confirmed absent.

## 12. Objections and Upstream Blockers

**Stated objections.** None found opposing the port in principle. Discussion on PR #10512 (zvonkok, sprt, Apokleos, Nov 2024) raised process questions - "Is the plan to roll out riscv support for all other components? What is the plan here with riscv?" and concern about testing/maintenance given the lack of riscv64 CI hardware at the time - not objections to merging the work itself.

**Technical blockers.**
- Dragonball riscv64 support (#11415) is stalled with no visible activity despite being open since 2025-06-12.
- Cloud Hypervisor support for riscv64 (PR #13079) is explicitly gated on an unmerged upstream cloud-hypervisor issue ([#8258](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/8258)), per RuoqingHe's comment marking the PR as draft.
- Lack of real riscv64 silicon with the H-extension, AIA, and IOMMU: the VITAMIN-V team explicitly states all testing has been done via QEMU on an x86 host (i9-14900K), not on real hardware with hardware virtualization, because their StarFive VisionFive 2 board lacks the H-extension.
- CI infrastructure is currently non-operational (120+ days with no executed job as of 2026-09-03), meaning the merged riscv64 code paths are not presently being continuously validated.

**Organizational blockers.** None found. The project's stated design goal is architecture-agnosticism, and the community elected the RISC-V port's principal author onto the Architecture Committee - the opposite of an organizational barrier.

**Acceptance probability.** High for continued incremental progress toward eventual full parity, given the multi-year, actively-developed trajectory (agent, kernel, runtime, runtime-rs, virtiofsd all merged; an active PR pipeline running through mid-2026 with #13079). No committed timeline exists in the findings for closing the remaining gaps (Dragonball, official release artifacts, confidential computing, vIOMMU), and the current CI outage is a near-term risk to maintaining even the existing merged support without regression.

## 13. Readiness Assessment

- **Color:** Blue
- **Release provider:** none
- **Optimization gap:** N/A (Kata Containers is a container-VM runtime/orchestrator, not an optimization-purpose project - no JIT, SIMD, or numerics hot paths whose value proposition depends on architecture-specific tuning)

**Justification.** Kata's riscv64 CI (`.github/workflows/build-checks-preview-riscv64.yaml`, `ci-nightly-riscv.yaml`) is designed to build and execute `make check`/`make test` (excluding the virtualization-dependent subset) on a dedicated self-hosted riscv64 runner, and the core enablement PRs - agent ([#10512](https://github.com/kata-containers/kata-containers/pull/10512)), kernel ([#11001](https://github.com/kata-containers/kata-containers/pull/11001)), Go runtime ([#11056](https://github.com/kata-containers/kata-containers/pull/11056)), runtime-rs ([#11042](https://github.com/kata-containers/kata-containers/pull/11042)), virtiofsd ([#10740](https://github.com/kata-containers/kata-containers/pull/10740)) - are all merged and reachable from `main`, satisfying "CI builds + tests" per the color model's Step 1. No riscv64 asset appears in any recent upstream GitHub release (v4.1.0, v4.0.0, v3.32.0 checked), so `release_provider` is `none`, which caps the grade at blue rather than green.

A material caveat that keeps confidence at medium rather than high: per commit [5d98359](https://github.com/kata-containers/kata-containers/commit/5d983590e98f67ad5ad5410a4368c4dcedbeee4b) (2026-09-03), the riscv64 CI runner has not executed a single job in 120 days - queued for the full 24-hour limit and cancelled each time, because no `riscv-builder` runner is available. This is an infrastructure/operational gap, not a confirmed code regression (so it does not warrant red), but it means the "tests pass" claim underlying the blue grade reflects historical, not currently live, validation.

**Pending work that could change the grade.** Restoring `riscv-builder` runner availability would re-establish a live CI signal (the single biggest near-term risk to the current blue grade). Merging Dragonball riscv64 support (#10226, #11415) and Cloud Hypervisor support (#13079, pending upstream [cloud-hypervisor#8258](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/8258)) would deepen functional parity but would not by itself change the color absent a published upstream riscv64 release artifact. Publishing an official riscv64 release asset (currently absent from `versions.yaml`'s image/kernel arch matrix and from every checked GitHub release) is the specific, singular change that would move this project from blue to green.

## 14. Investment Analysis

RISE has no recorded involvement with Kata Containers as a funded project, dedicated repository, or blog topic (confirmed by checking all 33-34 RISE blog posts via sitemap, the RISE wheel-builder page, and the `riseproject-dev` GitHub org's repos and org-wide code search). All work identified to date is attributable to ISCAS (Ruoqing He) and the EU-funded VITAMIN-V project, with no RISE runner or RISE-funded contribution found. Nothing below double-counts RISE-funded work.

### 14.1 Functional Enablement
- Restore/replace the `riscv-builder` CI runner infrastructure so the existing nightly and build-check workflows actually execute (currently idle 120+ days) - this is prerequisite to trusting any of the already-merged riscv64 code.
- Complete Dragonball riscv64 integration (#10226, #11415) - rust-vmm crates Kata already pins are riscv64-capable; the gap is Dragonball's own `target_arch` gating and integration work.
- Land Cloud Hypervisor riscv64 support (#13079), contingent on upstream cloud-hypervisor#8258 merging first.
- Complete OSBuilder rootfs riscv64 support (still "ongoing" per #10734) and publish an official riscv64 guest kernel/initrd/rootfs image, closing the `versions.yaml` arch-matrix gap.
- Publish riscv64 assets in the official GitHub release pipeline (`kata-static-<ver>-riscv64.tar.zst` equivalent).

### 14.2 Performance Optimization
Not applicable in the traditional sense - Kata has no SIMD/JIT/numerics hot paths to optimize for RISC-V. The only "performance" work is validating and characterizing overhead of the QEMU-riscv64 hypervisor path itself, for which no benchmark data currently exists anywhere in the public record (confirmed by extensive search). Producing a first riscv64 vs arm64/amd64 startup-time and I/O-throughput baseline would be new, not incremental, work.

### 14.3 CI/CD Infrastructure
- Provision reliable, available riscv64 CI hardware (replace or supplement the currently-idle SG2042 `riscv-builder` boards).
- Add virtualization-capable riscv64 CI hardware so the currently-skipped KVM/nested-virt test subset can run - today's CI validates only non-virt code paths.
- Consider moving riscv64 CI into the main `ci.yaml`/`release.yaml` gating pipeline once reliability is established, to make riscv64 release-blocking like arm64.

### 14.4 Ecosystem Enablement
Section 10 omitted per instructions: Kata Containers is a standalone container runtime with no significant dependent package ecosystem (no npm/PyPI/Maven consumer packages requiring separate riscv64 enablement) identified in the research findings.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Restore/harden riscv-builder CI runner availability | 2-4 | Infra/DevOps | Critical |
| Functional | Complete Dragonball riscv64 integration (#10226/#11415) | 4-8 | Runtime-rs/Dragonball team | High |
| Functional | Land Cloud Hypervisor riscv64 support (#13079), pending upstream cloud-hypervisor#8258 | 2-4 (Kata side only; blocked on external dependency) | Cloud Hypervisor integration owner | Medium (blocked) |
| Functional | Complete OSBuilder riscv64 rootfs support and publish official riscv64 guest kernel/initrd | 3-6 | OSBuilder team | High |
| Functional | Publish riscv64 release artifacts in the standard GitHub release pipeline | 1-2 | Release engineering | High |
| CI/CD | Add virtualization-capable riscv64 CI hardware to test the KVM-backed sandbox path | 2-4 | Infra/DevOps | Medium |
| CI/CD | Promote riscv64 CI into the main gating `ci.yaml`/`release.yaml` once stable | 1-2 | CI maintainers | Medium |
| Performance | Publish first riscv64 startup-time/throughput baseline (no data exists today) | 2-3 | Performance/QA | Low |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [Issue #10734 - Kata-Containers on RISC-V (master tracking issue)](https://github.com/kata-containers/kata-containers/issues/10734)
- [Issue #10538 - VITAMIN-V: onboard RISC-V to kata containers](https://github.com/kata-containers/kata-containers/issues/10538)
- [Issue #10524 - kata-containers: Introduce RISC-V 64-bit architecture support](https://github.com/kata-containers/kata-containers/issues/10524)
- [Issue #9284 - runtime: Add support for riscv64 architecture](https://github.com/kata-containers/kata-containers/issues/9284)
- [Issue #10226 - dragonball: Introduce riscv64 architecture](https://github.com/kata-containers/kata-containers/issues/10226)
- [Issue #10532 - runtime-rs: Need riscv64 architecture support](https://github.com/kata-containers/kata-containers/issues/10532)
- [Issue #11415 - dragonball: Bump rust-vmm crates to support RISC-V](https://github.com/kata-containers/kata-containers/issues/11415)
- [Issue #10739 - virtiofsd cannot be built on RISC-V](https://github.com/kata-containers/kata-containers/issues/10739)
- [PR #10512 - agent: Support RISC-V 64-bit architecture](https://github.com/kata-containers/kata-containers/pull/10512)
- [PR #10740 - virtiofsd: Enable build for RISC-V](https://github.com/kata-containers/kata-containers/pull/10740)
- [PR #10831 - ci: Enable partial components build-check on riscv](https://github.com/kata-containers/kata-containers/pull/10831)
- [PR #10832 - ci: Update yq to v4.44.5 to support riscv64](https://github.com/kata-containers/kata-containers/pull/10832)
- [PR #10948 - ci: Refactor matrix for build-checks](https://github.com/kata-containers/kata-containers/pull/10948)
- [PR #11001 - kernel: Support and enable riscv kernel build](https://github.com/kata-containers/kata-containers/pull/11001)
- [PR #11042 - runtime-rs: Support and enable build on riscv64](https://github.com/kata-containers/kata-containers/pull/11042)
- [PR #11056 - runtime: Support and enable build on riscv64](https://github.com/kata-containers/kata-containers/pull/11056)
- [PR #11094 - ci: Enable build-kata-static-tarball-riscv64.yaml](https://github.com/kata-containers/kata-containers/pull/11094)
- [PR #12057 - riscv: Introduce its own nightly tests](https://github.com/kata-containers/kata-containers/pull/12057)
- [PR #12769 - runtime-rs: Allow installation on RISC-V platforms](https://github.com/kata-containers/kata-containers/pull/12769)
- [PR #13079 - runtime, agent: enable Cloud Hypervisor on RISC-V (open, draft)](https://github.com/kata-containers/kata-containers/pull/13079)
- [Commit 5d98359 - gha: Give every job a timeout-minutes (riscv64 CI idle 120 days)](https://github.com/kata-containers/kata-containers/commit/5d983590e98f67ad5ad5410a4368c4dcedbeee4b)
- [Commit e0fb8f0 - ci: Add riscv-builder to actionlint.yaml](https://github.com/kata-containers/kata-containers/commit/e0fb8f08d822decd25f64cfbb32e99381bb8d908)
- [cloud-hypervisor issue #8258 (blocking Kata PR #13079)](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/8258)
- [cloud-hypervisor issue #6978 - RISC-V Stage 2 RoadMap](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/6978)
- [firecracker issue #752 - RISC-V support](https://github.com/firecracker-microvm/firecracker/issues/752)
- [VITAMIN-V: Expanding Open-Source RISC-V Cloud Environments (arXiv 2407.00052v1)](https://arxiv.org/html/2407.00052v1)
- [VITAMIN-V: Virtual Environment and Tool-boxing (arXiv 2305.10982)](https://arxiv.org/html/2305.10982)
- [Vitamin-V: Serverless Cloud Computing Porting on RISC-V (Springer, paywalled)](https://link.springer.com/chapter/10.1007/978-3-031-78380-7_10)
- [RISC-V Summit Europe 2025 poster PDF - From RustVMM to Kata-Containers](https://riscv-europe.org/summit/2025/media/proceedings/2025-05-14-RISC-V-Summit-Europe-P2.1.04-HE-poster.pdf)
- [Vitamin-V: Results and Lessons Learnt - RISC-V Summit Europe 2026](https://cfp.riscv-europe.org/eu-summit-2026/talk/VVJ8FY/)
- [FOSDEM 2025 talk - From Rust-VMM to KataContainers](https://fosdem.org/2025/schedule/event/fosdem-2025-4156-from-rust-vmm-to-katacontainers-the-development-of-h-ext-based-software-ecosystem/)
- [riseproject.dev blog (checked, no Kata-related posts found)](https://riseproject.dev/blog)
- [Kata Containers homepage / supporters](https://katacontainers.io/)
- [Kata Containers GitHub repository](https://github.com/kata-containers/kata-containers)
- `project-reports/reports/qemu.md`, `project-reports/reports/containerd.md`, `project-reports/reports/runc.md`, `project-reports/reports/libseccomp.md`, `project-reports/reports/cri-o.md` (internal repository reports referenced for dependency deep-dives)
