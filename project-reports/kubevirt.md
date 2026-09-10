---
title: KubeVirt
parent: Project Reports
color: red
---

{% include dependency-graph.html slug="dependencies" subset="kubevirt" %}

# KubeVirt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for KubeVirt<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

KubeVirt is a Kubernetes-native virtualization operator: it extends the Kubernetes API with Custom Resource Definitions (VirtualMachine, VirtualMachineInstance) and a set of controllers/daemons (`virt-controller`, `virt-handler`, `virt-launcher`, `virt-api`, `virtctl`) that create and manage traditional VMs alongside containers, using libvirt to drive QEMU/KVM as the actual hypervisor. It is written in Go and built with Bazel.

**Governance and foundation.** KubeVirt is a **CNCF (Cloud Native Computing Foundation) incubating project**, operated as "KubeVirt, a Series of LF Projects, LLC" under the Linux Foundation project framework. Governance follows the standard Kubernetes-style OWNERS/OWNERS_ALIASES model with per-SIG reviewer/approver groups (sig-buildsystem, sig-network, sig-test, sig-scale, etc.), tracked at [github.com/kubevirt/kubevirt/blob/main/OWNERS](https://github.com/kubevirt/kubevirt/blob/main/OWNERS). Detailed governance documents live in the separate `kubevirt/community` repository. License: **Apache License 2.0**.

**Corporate sponsors.** All current top-level approvers (davidvossel, vladikr, rmohr, stu-gott, fabiand, jean-edouard, mhenriks, xpivarc, iholder101) and code-reviewers (vladikr, xpivarc, jean-edouard, mhenriks, EdDev) are Red Hat employees per their GitHub profiles. KubeVirt originated at Red Hat, which remains the dominant corporate steward. kubevirt.io additionally lists end users (ARM, Bytedance, Cloudflare, NVIDIA, SK Telecom) and vendors (Red Hat, Microsoft, Oracle, SUSE) as adopters/integrators.

**RISE membership.** No evidence of RISE (RISC-V Software Ecosystem) membership or involvement was found. RISE's public members list (fetched directly) contains only hardware/silicon vendors and does not include KubeVirt, Red Hat's KubeVirt work, or any comparable virtualization software project as a member or funded RFP.

**Community culture on new ports.** The project has accepted a new architecture before: ARM64 support (PR [#3415](https://github.com/kubevirt/kubevirt/pull/3415), "Enable Kubevirt works on ARM64 platform") was opened 2020-05-14 and merged 2021-04-13 after roughly 11 months and 98 review comments, showing KubeVirt does accept new-arch ports given sustained, CI-capable contributor engagement. By contrast, every RISC-V proposal to date has died from silence: three issues were opened, none drew a single maintainer comment, and all were auto-closed by the stale-bot (`lifecycle/rotten`) rather than by a deliberate maintainer decision. The community stance is best described as not hostile but inert: the door is open in principle (per the ARM64 precedent) but no sustained contributor effort has yet appeared.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-05-14 | ARM64 support proposal PR opened (comparison baseline for how a new arch gets adopted) | [PR #3415](https://github.com/kubevirt/kubevirt/pull/3415) |
| 2021-04-13 | ARM64 support PR merged, after ~11 months and 98 comments | [PR #3415](https://github.com/kubevirt/kubevirt/pull/3415) |
| 2025-02-20 | Issue #14004 opened by @elementyang: "Compile kubevirt for RISC-V architecture," citing Kubernetes' own RISC-V port as precedent; no code, no maintainer response | [Issue #14004](https://github.com/kubevirt/kubevirt/issues/14004) |
| 2025-04-16 | PR #14501 "V1.4 riscv" opened and closed by author (bohubx9) roughly 14 minutes later; empty PR body, unrelated cherry-picked commits, blocked by missing release-note label and merge conflicts, no review | [PR #14501](https://github.com/kubevirt/kubevirt/pull/14501) |
| 2025-05-28 | Issue #14818 opened by Jincheng Ni (ISCAS, risc-verse WG): most detailed proposal, claims Bazel adapted and full cross-compilation done in an external repo, asks the community three unanswered governance questions | [Issue #14818](https://github.com/kubevirt/kubevirt/issues/14818) |
| 2025-06-27 | Issue #15024 opened by @elementyang, claiming a working openEuler-based port (cross-compile, VM boot, console/VNC) not yet upstreamed | [Issue #15024](https://github.com/kubevirt/kubevirt/issues/15024) |
| 2025-09-20 | Issue #14004 auto-closed `lifecycle/rotten`, no maintainer engagement | [Issue #14004](https://github.com/kubevirt/kubevirt/issues/14004) |
| 2025-11-12 | Issue #14818 auto-closed `lifecycle/rotten`, no maintainer engagement | [Issue #14818](https://github.com/kubevirt/kubevirt/issues/14818) |
| 2025-11-24 | Issue #15024 auto-closed `lifecycle/rotten`, no maintainer engagement | [Issue #15024](https://github.com/kubevirt/kubevirt/issues/15024) |
| 2026-06-13 | PR #18052 "hypervisor/common: stub setsched for unsupported architectures" merged (the sole merged riscv64-adjacent change) | [PR #18052](https://github.com/kubevirt/kubevirt/pull/18052) |
| 2026-07-02 | v1.9.0-rc.0 published, first release containing PR #18052 | KubeVirt releases page (via WebFetch) |

**Key contributors and organizations:**
- elementyang - independent contributor, claims a working openEuler-based fork (issues #14004, #15024), no linked repo, never upstreamed.
- Jincheng Ni (kinchengni) - Institute of Software, Chinese Academy of Sciences (ISCAS), risc-verse working group; the only proposal with a linked external repository ([code.risc-verse.isrc.ac.cn/risc-verse/wg-cloudcomputing/kubevirt-riscv](https://code.risc-verse.isrc.ac.cn/risc-verse/wg-cloudcomputing/kubevirt-riscv)) and concrete Bazel-adaptation claims.
- bohubx9 - author of the abandoned PR #14501, not a trusted/known KubeVirt contributor.
- vidit-bhat - author of the merged build-fix PR #18052, unblocking `virtctl` cross-compilation for riscv64 among other non-primary architectures.

**Is it fully upstream? No.** The only merged code touching riscv64 is a generic "unsupported architecture" stub for real-time scheduling in `pkg/hypervisor/common`, added to fix `virtctl` cross-compilation, not to add riscv64 as a supported hypervisor/runtime platform. All actual port work (ISCAS's external repo, the openEuler-based fork) remains external and non-upstream.

## 3. Upstream Support Tier

**No formal, written architecture-tier policy exists.** There is no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file in the repository. Architecture support is defined de facto by what is wired into the Bazel toolchains and `hack/common.sh`/`hack/multi-arch.sh`.

**Evidence of the tier in force:** `hack/common.sh`'s `format_archname()` function hard-errors on any architecture outside its enumerated list:
```bash
*)
    echo "ERROR: invalid Arch, ${platform}, only support x86_64, aarch64 and s390x"
    exit 1
    ;;
```
Bazel toolchain directories (`bazel/toolchain/`) exist only for `x86_64-none-linux-gnu`, `aarch64-none-linux-gnu`, and `s390x-none-linux-gnu`; `bazel/platforms/BUILD` defines `platform()` targets only for those three. The cross-compile builder image (`hack/builder/Dockerfile.cross-compile`) installs only `gcc-aarch64-linux-gnu` and `gcc-s390x-linux-gnu` cross-toolchains, no riscv64 equivalent.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Bazel toolchain directory | yes (`x86_64-none-linux-gnu`) | yes (`aarch64-none-linux-gnu`) | none |
| Cross-compile gcc/sysroot in builder image | native | yes (`gcc-aarch64-linux-gnu`) | none |
| `hack/common.sh` arch validation | accepted | accepted | rejected (hard error) |
| Upstream CI | yes | yes | none |
| Guest architecture support (runtime) | yes | yes | explicitly rejected ("unsupported guest architecture") |
| Official container images | yes | yes | none |
| Release-blocking status | yes | yes | N/A - no riscv64 target exists |

There is no riscv64 tier: the architecture is neither an accepted "community-maintained" tier (per issue #14818's unanswered question) nor a documented unsupported-but-tolerated tier; it is simply absent from the toolchain and hard-rejected by the build scripts and runtime code.

## 4. Technical Architecture and RISC-V-Specific Subsystems

KubeVirt itself is a Go/Kubernetes controller with no JIT, SIMD, or hand-written assembly of its own; VM execution (the layer where ISA-specific code would matter) is delegated to QEMU and libvirt as external dependencies (see Section 9). What KubeVirt does implement per-architecture is a set of Go modules that describe, validate, and configure the guest domain differently depending on target architecture. A repository-wide code search found these dedicated per-architecture files for arm64/s390x with no riscv64 equivalent anywhere:

| Component | Purpose | amd64 | arm64 | s390x | riscv64 |
|---|---|---|---|---|---|
| `pkg/defaults/arm64.go` | Disk bus defaults | inline default | dedicated file | separate | missing, no file, no case |
| `pkg/virt-api/webhooks/arm64.go` | VMI admission validation | default | dedicated file | separate function | missing |
| `pkg/virt-handler/node-labeller/arm64.go` + `kvm-caps-info-plugin_arm64.go` | Node capability labelling | `archLabellerAMD64` | `archLabellerARM64` | `archLabellerS390X` | missing, falls to `defaultArchLabeller` |
| `pkg/virt-launcher/virtwrap/converter/arch/arm64.go` | Domain XML converter | `converterAMD64` | `converterARM64` | `converterS390X` | missing, unknown arch silently falls back to `converterAMD64` per `converter_test.go` |
| `pkg/virt-launcher/virtwrap/api/arch-defaulter/arm64.go` | Domain arch defaulting | `defaulterAMD64` | `defaulterARM64` | `defaulterS390X` | missing, falls back to `defaulterAMD64` |
| Video/watchdog/input/EFI/machine-type switches (`graphics.go`, `watchdog.go`, `input_device.go`, `launch_security.go`, `efi.go`, `configuration.go`, `virt-config.go`) | Per-arch device/config decisions | case `"amd64"` | case `"arm64"` | case `"s390x"` | no case, hits default/error branch |
| `pkg/hypervisor/common` RT scheduling (`setsched.go` vs `setsched_unsupported.go`) | Real-time scheduler pinning | real syscall | real syscall | real syscall | stub only, returns `ErrUnsupportedRTScheduling` (from [PR #18052](https://github.com/kubevirt/kubevirt/pull/18052)) |
| `pkg/virt-launcher/virtwrap/converter/kvm/configurator.go` `emulatorPath()` | Cross-arch QEMU emulator selection | `/usr/bin/qemu-system-x86_64` | `/usr/bin/qemu-system-aarch64` | `/usr/bin/qemu-system-s390x` | no case, falls to `default: return ""`, triggers `"unsupported guest architecture"` error |

The only two hits for "riscv64" in the non-vendor Go source tree, confirmed by code search, are: (1) the generic `setsched_unsupported.go` catch-all stub shared by every unsupported GOARCH (riscv64, ppc64le, armv7, loong64, 386), and (2) `configurator_test.go`, a unit test that sets `vmi.Spec.Architecture = "riscv64"` specifically to assert `Configure()` returns an error containing `"unsupported guest architecture"`. No file named `*riscv64*` exists anywhere under `pkg/`.

**Conclusion:** riscv64 has zero architecture-specific implementation surface in KubeVirt. This is categorically different from arm64/s390x, which each have roughly 15+ dedicated, hand-written architecture files implementing real per-arch behavior across node-labelling, webhook validation, domain conversion, and defaulting layers.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel (`.bazelversion`, `WORKSPACE`, `MODULE.bazel`, `BAZEL_VERSION=7.5.0` per `hack/builder/Dockerfile`), driving Go builds (`GIMME_GO_VERSION=1.26.6`), wrapped by `hack/build-go.sh`, `hack/bazel-build.sh`, and `Makefile`, executed inside a containerized "builder" image (`hack/builder/Dockerfile`, `Dockerfile.cs10`, base `quay.io/centos/centos:stream9`/`stream10`).

**Exact rejection mechanism:** `hack/common.sh`'s `format_archname()` only recognizes `x86_64|amd64`, `crossbuild-aarch64|aarch64|arm64`, and `crossbuild-s390x|s390x`; any other value (including `riscv64`) hits the `*)` default case and exits with `"ERROR: invalid Arch, ${platform}, only support x86_64, aarch64 and s390x"`.

**Cross-compile toolchain container** (`hack/builder/Dockerfile.cross-compile`) installs only `gcc-aarch64-linux-gnu` and `gcc-s390x-linux-gnu`, with matching sysroots (`glibc-devel glibc-static` via `dnf --installroot ... --forcearch aarch64/s390x`). There is no `gcc-riscv64-linux-gnu` package and no riscv64 sysroot anywhere in the image build. Note: Go itself has supported `GOOS=linux GOARCH=riscv64` as a cross-compile target since Go 1.14, which is why the pure-Go `virtctl`/`usbredir` client tooling has working Bazel `select()` branches for riscv64 (`pkg/virtctl/usbredir/BUILD.bazel`, `tests/virtctl/BUILD.bazel`) - but any cgo-linked component (the actual hypervisor path) requires the missing riscv64 gcc/glibc cross-sysroot, which does not exist in the official builder image.

**QEMU usage in the build** is unrelated to cross-compilation for riscv64: `qemu-img` is installed for disk-image tooling, and `docs/software-emulation.md` documents an optional `useEmulation: true` CR setting letting `virt-launcher` fall back to QEMU software (TCG) emulation of the guest VM when `/dev/kvm` is unavailable - a runtime VM feature, not a build mechanism.

**RPM packaging pipeline:** `rpm/BUILD.bazel`, which pins the CentOS-Stream RPMs baked into the `virt-launcher` container image (`libvirt-libs`, `libvirt-devel`, etc.), has per-arch variants only for `x86_64`, `aarch64`, `s390x`. No `riscv64` entries exist. Even if every C dependency were riscv64-clean, KubeVirt's own container build pipeline has no riscv64 QEMU/libvirt RPM source wired in.

**Known build failures:** none documented for riscv64 specifically, because no riscv64 build path exists to fail; the failure mode is the upfront hard error in `hack/common.sh` rather than a downstream compile error.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build via official toolchain | yes | yes | no, hard-rejected by `hack/common.sh` |
| `virtctl` (Go CLI) cross-compile | yes | yes | yes, since [PR #18052](https://github.com/kubevirt/kubevirt/pull/18052) (v1.9.0-rc.0) |
| VM guest execution (virt-launcher/libvirt/QEMU path) | yes | yes | no, explicit `"unsupported guest architecture"` error |
| Node capability labelling | yes | yes | no, falls to generic default labeller |
| Domain XML conversion (correct per-arch config) | yes | yes | no, silently falls back to amd64-shaped conversion in test harness (would misconfigure a real guest) |
| Real-time scheduler pinning | yes (syscall) | yes (syscall) | no, stub returns `ErrUnsupportedRTScheduling` |
| Official container images | yes | yes | no |
| CI test coverage | yes (Prow) | yes (Prow) | none |

**Functional gap:** riscv64 cannot run a guest VM under KubeVirt at all today; the only functioning piece is cross-compilation of the client-side `virtctl` binary.

**Performance gap:** not applicable in the traditional SIMD/vectorization sense - KubeVirt has no compute hot path of its own. Performance-relevant behavior (guest CPU emulation speed, KVM acceleration) is entirely a function of the QEMU/libvirt dependencies (Section 9), which are not currently wired into KubeVirt's own riscv64 build path regardless of their own upstream riscv64 maturity.

**Security hardening gap:** Data not available: no riscv64-specific security-hardening (seccomp profile completeness, SELinux policy behavior) comparison was found in the research findings, since the guest-architecture path is rejected before such configuration would apply.

**NaN / floating-point semantics issues:** Data not available: a targeted search ("riscv nan floating") against kubevirt/kubevirt issues returned zero results. No floating-point or NaN-related riscv64 bug exists in the tracker.

## 7. CI/CD Infrastructure

**No riscv64 CI exists in any form.** Verified via two independent passes:

- The repository's only GitHub Actions workflow is `.github/workflows/label_approved_veps.yaml`, which labels VEP (enhancement proposal) PRs against a GitHub Project board. Its full trigger block:
```yaml
on:
  pull_request_target:
    types: [opened, edited, reopened, synchronize]
  workflow_dispatch:
```
It runs on `ubuntu-latest`, has no build/test matrix, and contains zero occurrences of "riscv." This is the entirety of KubeVirt's GitHub Actions surface - confirmed by an independent `path:.github/workflows extension:yaml repo:kubevirt/kubevirt` code search returning only this one file.
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `azure-pipelines.yml`, or `.travis.yml` exists anywhere in the repository.
- KubeVirt's real CI system is Prow, hosted in the separate `kubevirt/project-infra` repository. A code search of that repository for "riscv" returned **zero results** - no presubmit, periodic, or postsubmit Prow job references riscv or riscv64 anywhere.
- The only riscv64-adjacent code anywhere in `kubevirt/kubevirt` is Bazel build-graph plumbing (`select()` conditionals in two `BUILD.bazel` files, compile-time dependency wiring, not a CI job) and a unit test asserting riscv64 is rejected.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI system | Prow (`kubevirt/project-infra`) | Prow | none |
| Build job | yes | yes | no |
| Test execution | yes | yes | no |
| RISE runner usage | N/A | N/A | none found |
| Hardware | Prow-managed | Prow-managed | N/A |

No RISE RISC-V Runner involvement was found for KubeVirt; RISE's runner repositories (`riscv-runner`, `riscv-runner-device-plugin`, `riscv-runner-images`) run bare-metal RISC-V CI (Scaleway EM-RV1 servers) via Kubernetes pod scheduling with no virtualization layer and no KubeVirt reference anywhere in their stack.

## 8. Distribution and Release Status

**No riscv64 binaries or packages exist for KubeVirt through any channel checked:**

- **PyPI:** `https://pypi.org/pypi/kubevirt/json` returns HTTP 404 - no PyPI package named `kubevirt` exists upstream at all (expected, since KubeVirt is a Go/Kubernetes operator, not a Python package). Confirmed via [pypi.org/simple/kubevirt/](https://pypi.org/simple/kubevirt/), also 404.
- **RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/kubevirt/` 302-redirects to the (404) upstream PyPI page - nothing to mirror.
- **Ubuntu 26.04 (resolute):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=kubevirt&suite=resolute&searchon=names&section=all) returns exactly one match, `fence-agents-kubevirt` (a Pacemaker fencing plugin that talks *to* KubeVirt, arch `all`) - no package named `kubevirt`, `libkubevirt`, or `python3-kubevirt` exists.
- **Arch Linux RISC-V:** [archriscv.felixc.at/?q=kubevirt](https://archriscv.felixc.at/?q=kubevirt) returns no matching rows.
- **GitHub Releases:** the [kubevirt/kubevirt releases page](https://github.com/kubevirt/kubevirt/releases) (v1.10.0-alpha.0, v1.9.0, v1.9.0-rc.x, and earlier tags) ships only YAML manifests (`kubevirt-operator.yaml`, `kubevirt-cr.yaml`, `feature-gates.json`, `conformance.yaml`) and source tarballs - zero compiled binaries of *any* architecture, so there is no per-arch binary channel to check for riscv64 in the first place. The only riscv64 text found in any release note is the v1.9.0-rc.1 entry describing PR #18052's build-tooling fix for downstream packagers.
- **Container images:** KubeVirt's primary distribution channel is multi-arch OCI container images (e.g. `quay.io/kubevirt`). Registry platform-tag verification for riscv64 was out of scope for the research performed; given no riscv64 RPM sources are wired into `rpm/BUILD.bazel` (Section 5) and the guest-architecture path explicitly rejects riscv64, a riscv64 container image, even if technically buildable for the client tooling, would not provide functional VM support. [NEEDS VERIFICATION: registry platform tags not directly queried.]

**What a user must do today to get a working riscv64 KubeVirt:** there is no path. The only working artifact is a cross-compiled `virtctl` client binary (which cannot orchestrate riscv64 guest VMs, since the guest-execution path itself is rejected). Functional riscv64 VM support would require building from one of the external, non-upstream forks referenced in issues #14818/#15024 (ISCAS Gitea repo, openEuler-based fork), neither of which is publicly verifiable as complete or maintained from the evidence gathered.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| QEMU (runtime-dependency, critical) | Guest CPU emulation/virtualization; TCG JIT + KVM backend invoked by virt-launcher via libvirt | Yes, cross-compile only; native CI runner absent | Partial, `check-tcg` runs in one cross job only | Source-only upstream; Debian sid packaged; Arch RISC-V lags one major version | `--disable-tcg` FTBFS open (gitlab#3483), 23 open IOMMU conformance bugs, no RVV in TCG codegen/pixman |
| libvirt (runtime-dependency, critical) | Management daemon consumed via `libvirt.org/go/libvirt`, the primary cgo dependency in KubeVirt's hypervisor path | Yes; Debian trixie/sid cross-build CI job exists but is `JOB_OPTIONAL: 1` (manual, non-gating) | No, cross-built riscv64 binaries never executed in libvirt's own CI | Debian trixie 11.3.0-3; Ubuntu noble 10.0.0-2ubuntu8 (ports) | CPU driver is stub-only for riscv64 (gitlab#391, open since 2022): no CPU model enumeration, host-passthrough only |
| Kubernetes (runtime-dependency, critical) | Host orchestration platform KubeVirt extends via CRDs/controllers | Data not available in this research pass: Kubernetes' own riscv64 CI/release status was not re-verified here; issue #14004 cites "Kubernetes' own RISC-V adaptation" as precedent [NEEDS VERIFICATION] | Data not available | Data not available | Referenced only as precedent in issue #14004, not independently researched this cycle |
| Go (build-dependency, critical) | Primary implementation language and toolchain (`GIMME_GO_VERSION=1.26.6`) | Yes, `GOOS=linux GOARCH=riscv64` supported as a cross-compile target since Go 1.14 | Yes, upstream Go has riscv64 in its own test matrix (general knowledge from the toolchain itself, not separately re-verified here) [NEEDS VERIFICATION] | Yes, upstream Go ships riscv64 toolchain releases | Not a KubeVirt-specific blocker; the blocker is the missing riscv64 gcc/glibc cross-sysroot for cgo-linked components, not the Go toolchain itself |
| Bazel (build-dependency, critical) | Build system orchestrating the Go build and C toolchains | Bazel itself runs on riscv64 hosts per general availability, but KubeVirt's own Bazel toolchain directories (`bazel/toolchain/`) and platform definitions (`bazel/platforms/BUILD`) only define x86_64/aarch64/s390x targets | No riscv64 Bazel target defined in this repo to test | N/A, no riscv64 target defined | KubeVirt-side gap is configuration, not Bazel upstream itself |
| golang.org/x/sys (build-dependency, optional) | Low-level OS syscall bindings, vendored | Yes, vendored `unix/*_riscv64.go` and `cpu/cpu_riscv64.go` files exist and compile | Not independently tested in this context | Consumed as a Go module | None open |
| prometheus/procfs (build-dependency, optional) | procfs parsing, vendored | Yes, vendored `cpuinfo_riscvx.go` exists | Not independently tested | Consumed as a Go module | None open |
| opencontainers/selinux (build-dependency, optional) | SELinux policy handling | Yes; matched in dependency-bump PRs (#16173 etc.) only because an upstream changelog entry mentions "Extend build-cross target with riscv64 arch" - not KubeVirt-specific work | Not verified | Consumed as a Go module | None open specific to KubeVirt's use |
| seccomp/libseccomp-golang (indirect, via `containers/common`) | cgo bindings to libseccomp | Yes, riscv64 added via upstream issues #52/#76 (2020-2021, both closed) | Not independently CI-tested upstream; functions correctly against riscv64-capable libseccomp | Consumed as a Go module | None open |
| libseccomp (indirect, C library underlying libseccomp-golang, used by QEMU sandboxing) | Syscall sandboxing | Yes, complete since v2.5.0 (2020) | Yes, 5,229/5,229 tests passed on real riscv64 hardware (2020); no upstream CI (amd64-only) | Debian trixie 2.6.0-2; Ubuntu noble 2.5.5-1ubuntu3; Arch RISC-V 2.6.0-1 | None open |
| cilium/ebpf (indirect, via `pkg/opencontainers/cgroups`, reachable from `cmd/virt-chroot`) | Loads/attaches eBPF cgroup-device-filter programs | Yes, explicit riscv64 branches in `internal/endian_le.go` and `internal/linux/platform.go` | No riscv64-specific CI found (only amd64/arm64 covered) | Consumed as a Go module | None found |
| klauspost/compress (indirect, via `klauspost/pgzip`) | Compression for backups/exports, container-disk handling | Yes, pure-Go generic fallback (`*_generic.go`) compiles on riscv64; amd64/arm64 get hand-written SIMD `.s` files, riscv64 does not | No riscv64-specific test/CI found | Consumed as a Go module | None open, functional but no RVV acceleration (performance-only gap) |
| pierrec/lz4 (indirect) | LZ4 compression | Yes, pure Go, no arch-specific code | None riscv64-specific found | Consumed as a Go module | None found |
| libguestfs.org/libnbd (indirect, used by `virtctl guestfs` and disk/hotplug paths) | cgo bindings to libnbd (NBD protocol) | Likely yes (pure C, no SIMD/JIT/crypto) but not independently confirmed; Debian/Ubuntu riscv64 packaging status not verified this cycle | Not verified | Not verified | Zero riscv64 issues found on `libguestfs/libnbd`, no known blockers, but unconfirmed |

**Deep-dive: QEMU and libvirt are the load-bearing dependencies.** Both are consumed via cgo bindings rather than as top-level go.mod SIMD/crypto packages, but they are the actual VM-execution layer. Even where these two projects individually have partial riscv64 build/CI maturity (see `project-reports/qemu.md` and `project-reports/libvirt.md`), KubeVirt's own container build pipeline (`rpm/BUILD.bazel`, Section 5) has zero riscv64 RPM entries wiring them in, so the dependency chain is blocked at KubeVirt's own build configuration regardless of upstream QEMU/libvirt progress.

Note on the project-graph SPARQL verification path (used to independently confirm distro package presence for these dependencies): the `project-graph` MCP server returned `CONNECTION_CLOSED` throughout this research and could not be queried. This is a tooling gap, not a negative result; distro-availability facts above for QEMU/libvirt/libseccomp were carried over from existing `project-reports/*.md` reports rather than freshly queried, and are flagged where the source itself marks them [NEEDS VERIFICATION].

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#15024](https://github.com/kubevirt/kubevirt/issues/15024) | Support for RISC-V Architecture in KubeVirt | Closed, `lifecycle/rotten` | Feature request | Claims working openEuler-based cross-compile/boot/console/VNC, no follow-up, no PR, no benchmark data |
| [#14818](https://github.com/kubevirt/kubevirt/issues/14818) | [Proposal] Add RISC-V Architecture Support to KubeVirt | Closed, `lifecycle/rotten` | Feature request / design proposal | Most detailed proposal, external ISCAS repo linked, three governance questions asked, never answered |
| [#14004](https://github.com/kubevirt/kubevirt/issues/14004) | Compile kubevirt for RISC-V architecture. | Closed, `lifecycle/rotten` | Feature request | Earliest, simplest ask, labels `kind/enhancement`/`sig/compute`, no engagement |
| [#17855](https://github.com/kubevirt/kubevirt/issues/17855) | virtctl: some tests transitively depend on pkg/hypervisor, failing to build on non-amd64/arm64/s390x | Closed (fixed) | Build bug | Fixed by [PR #18052](https://github.com/kubevirt/kubevirt/pull/18052), merged into v1.9.0; the only riscv64 item with a real resolution |
| [PR #14501](https://github.com/kubevirt/kubevirt/pull/14501) | V1.4 riscv | Closed, unmerged | N/A | Empty/template PR body, unrelated cherry-picks, blocked by bot process gates, abandoned by author within ~14 minutes |

**Correctness bugs:** none found. No open riscv64 correctness or NaN/floating-point bug exists in the tracker - a targeted "riscv nan floating" search returned zero results. This reflects the absence of any functioning riscv64 code path to have bugs in, not a clean bill of health.

## 12. Objections and Upstream Blockers

**Stated objections:** none on record. No maintainer has ever substantively responded to any of the three riscv64 proposal issues (#14004, #14818, #15024); all three died identically (zero comments, auto-closed stale). There is no documented technical or policy objection to riscv64 support - the silence is procedural (stale-bot closure), not a reasoned rejection.

**Technical blockers:**
1. `hack/common.sh` hard-rejects any architecture outside x86_64/aarch64/s390x at the build-script level.
2. No riscv64 gcc/glibc cross-sysroot exists in the official builder image.
3. No riscv64 Bazel toolchain/platform definitions exist.
4. `rpm/BUILD.bazel` has no riscv64 RPM source entries for the libvirt/QEMU-carrying `virt-launcher` container image.
5. The KVM domain configurator explicitly rejects riscv64 as a guest architecture at runtime.
6. None of the per-architecture Go subsystems (node-labeller, webhook validator, domain converter, arch-defaulter) have a riscv64 implementation; an unknown/unimplemented architecture silently falls back to amd64-shaped behavior in some paths, which would misconfigure a real guest rather than simply refusing to run.

**Organizational blockers:**
1. Issue #14818 explicitly asked whether KubeVirt would accept RISC-V as a "community-maintained" architecture (the same governance question ARM64 had to resolve before its 11-month merge process) - the question remains unanswered.
2. The genuine engineering work (ISCAS's Bazel adaptation, cross-compilation of core components) exists only in an external, non-upstream Gitea instance ([code.risc-verse.isrc.ac.cn](https://code.risc-verse.isrc.ac.cn/risc-verse/wg-cloudcomputing/kubevirt-riscv)), never submitted as incremental upstream PRs despite the author's stated intent to do so.
3. No RISE Project funding or working-group engagement exists for KubeVirt.

**Acceptance probability:** Given the ARM64 precedent (a real port did get merged, after ~11 months of sustained engagement), the technical path is not blocked by maintainer hostility - it is blocked by the absence of a sustained, CI-capable upstream contributor. If ISCAS or another actor reopened #14818 with concrete incremental PRs (starting with the Bazel toolchain and `hack/common.sh` arch enumeration, then the cgo cross-sysroot, then the per-arch Go subsystems), acceptance appears plausible but is [NEEDS VERIFICATION] absent any actual maintainer statement to that effect.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none
- **Justification:** riscv64 support is confirmed non-functional, not merely untested. `hack/common.sh`'s `format_archname()` hard-errors on any architecture outside x86_64/aarch64/s390x ("ERROR: invalid Arch, ${platform}, only support x86_64, aarch64 and s390x"), and the KVM domain configurator's own test suite explicitly asserts that `Configure()` returns `"unsupported guest architecture"` when `vmi.Spec.Architecture = "riscv64"` ([configurator_test.go](https://github.com/kubevirt/kubevirt/blob/main/pkg/virt-launcher/virtwrap/converter/kvm/configurator_test.go)). This is combined with zero upstream riscv64 CI anywhere (confirmed by reading the repo's single GitHub Actions workflow and a zero-result search of the Prow-based `kubevirt/project-infra` CI repository) and zero distribution channels of any kind (no PyPI package, no Ubuntu 26.04 package, no Arch Linux RISC-V package, no architecture-specific GitHub release binaries). Per the color model, red is reserved for confirmed-broken/non-functional states rather than simply absent CI, and both the build-time hard error and the runtime rejection test meet that bar.
- **Pending work that could change the grade:** issue [#14818](https://github.com/kubevirt/kubevirt/issues/14818) remains the de facto prerequisite issue for any future effort - it is the only proposal with a concrete external repo and specific claims (Bazel adapted, core components cross-compiled). If a contributor (ISCAS or otherwise) reopens it with incremental upstream PRs following the ARM64 precedent (PR #3415, 11 months, 98 comments to merge), and a maintainer engages, the grade could move toward orange (build-only, no runtime support) or yellow (build-only CI) well before reaching blue or green. No RISE involvement currently exists to accelerate this. The merged build-tooling fix ([PR #18052](https://github.com/kubevirt/kubevirt/pull/18052)) does not itself change the grade, since it only unblocks client-tooling cross-compilation, not the rejected guest-execution path.

## 14. Investment Analysis

**Prior RISE work check:** no RISE-funded or RISE-adjacent work exists for KubeVirt (Section 1, confirmed against the full RISE blog history through 2026-08-24, RISE working-group repos, and RISE members list). No sizing below is offset against existing RISE coverage.

### 14.1 Functional Enablement
Work required to make riscv64 a functioning guest architecture, following the ARM64 precedent's shape:
1. Remove the `hack/common.sh` hard rejection and add riscv64 to `format_archname()`.
2. Add a riscv64 Bazel toolchain (`bazel/toolchain/riscv64-none-linux-gnu/`) and platform definition (`bazel/platforms/BUILD`).
3. Add `gcc-riscv64-linux-gnu` and a riscv64 sysroot to `hack/builder/Dockerfile.cross-compile`.
4. Implement the missing per-architecture Go subsystems: node-labeller (`arch_labeller`), webhook validator, domain converter, arch-defaulter, and the `emulatorPath()` case for `qemu-system-riscv64` in the KVM configurator - each modeled on the existing arm64 implementations.
5. Add riscv64 RPM sources to `rpm/BUILD.bazel` so the `virt-launcher` container image can carry a riscv64 libvirt/QEMU stack, contingent on those dependencies' own riscv64 readiness (Section 9).
6. Remove/replace the `configurator_test.go` negative test with positive coverage once (4) lands.

### 14.2 Performance Optimization
Not applicable in the traditional sense - KubeVirt has no SIMD/JIT hot path of its own. Any performance work belongs to the QEMU and libvirt dependency chain (Section 9), which is out of scope for KubeVirt's own investment sizing but is a hard prerequisite dependency.

### 14.3 CI/CD Infrastructure
Building riscv64 CI requires adding a Prow job in the separate `kubevirt/project-infra` repository (native or QEMU-emulated riscv64 runner), plus a corresponding Bazel-testable target once 14.1 items land. RISE's bare-metal RISC-V Runners (Scaleway EM-RV1, Section 7) are a plausible hosting option given they already run Kubernetes-pod-scheduled CI, though no KubeVirt-specific engagement with that infrastructure exists today and would need to be initiated separately.

### 14.4 Ecosystem Enablement
Not applicable - KubeVirt has no dependent package ecosystem of its own that separately requires riscv64 enablement (Section 10 omitted per scope rules); it is consumed as a Kubernetes operator via container image, not as a library with downstream package dependents.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Remove `hack/common.sh` riscv64 rejection; add Bazel toolchain/platform definitions and cross-sysroot | 2-4 | Build/tooling engineer | Critical |
| Functional | Implement per-arch Go subsystems (node-labeller, webhook validator, domain converter, arch-defaulter, `emulatorPath` case) | 6-10 | KubeVirt platform engineer, modeled on ARM64 precedent (PR #3415) | Critical |
| Functional | Wire riscv64 libvirt/QEMU RPM sources into `rpm/BUILD.bazel` for the `virt-launcher` image | 3-6 | Build/packaging engineer, contingent on QEMU/libvirt riscv64 dependency maturity | Critical |
| Functional | Upstream engagement: reopen/resubmit #14818 as incremental PRs, negotiate community-maintained-arch acceptance | 2-4 (elapsed, likely longer in calendar time given the ARM64 precedent's ~11-month timeline) | Upstream liaison | High |
| CI/CD | Add a Prow riscv64 job in `kubevirt/project-infra`, evaluate RISE RISC-V Runners as host | 3-5 | CI/infrastructure engineer | High |
| Functional | Integrate/upstream existing ISCAS external-repo work as a starting point rather than a from-scratch port | 1-2 (evaluation), then folded into the items above | Upstream liaison, engineering | High |

**Total estimated critical-path functional effort: roughly 11-20 person-weeks**, before accounting for elapsed calendar time consumed by upstream review cycles (the ARM64 precedent took ~11 months from PR open to merge), and excluding any work needed in the QEMU/libvirt dependency chain itself, which is sized separately in their own reports.

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [KubeVirt repository](https://github.com/kubevirt/kubevirt)
- [Issue #15024 - Support for RISC-V Architecture in KubeVirt](https://github.com/kubevirt/kubevirt/issues/15024)
- [Issue #14818 - [Proposal] Add RISC-V Architecture Support to KubeVirt](https://github.com/kubevirt/kubevirt/issues/14818)
- [Issue #14004 - Compile kubevirt for RISC-V architecture.](https://github.com/kubevirt/kubevirt/issues/14004)
- [Issue #17855 - virtctl build failure on non-amd64/arm64/s390x](https://github.com/kubevirt/kubevirt/issues/17855)
- [PR #14501 - V1.4 riscv (closed, unmerged)](https://github.com/kubevirt/kubevirt/pull/14501)
- [PR #18052 - hypervisor/common: stub setsched for unsupported architectures (merged)](https://github.com/kubevirt/kubevirt/pull/18052)
- [PR #3415 - Enable Kubevirt works on ARM64 platform (merged, comparison baseline)](https://github.com/kubevirt/kubevirt/pull/3415)
- [KubeVirt OWNERS file](https://github.com/kubevirt/kubevirt/blob/main/OWNERS)
- [KubeVirt user guide - operations on ARM64](https://kubevirt.io/user-guide/cluster_admin/operations_on_Arm64/)
- [KubeVirt v1.9.0 changelog](https://kubevirt.io/2026/changelog-v1.9.0.html)
- [KubeVirt GitHub releases](https://github.com/kubevirt/kubevirt/releases)
- [KubeVirt hack/common.sh (format_archname arch rejection)](https://github.com/kubevirt/kubevirt/blob/main/hack/common.sh)
- [KubeVirt rpm/BUILD.bazel](https://github.com/kubevirt/kubevirt/blob/main/rpm/BUILD.bazel)
- [KubeVirt pkg/virt-launcher/virtwrap/converter/kvm/configurator_test.go](https://github.com/kubevirt/kubevirt/blob/main/pkg/virt-launcher/virtwrap/converter/kvm/configurator_test.go)
- [KubeVirt hack/builder/Dockerfile.cross-compile](https://github.com/kubevirt/kubevirt/blob/main/hack/builder/Dockerfile.cross-compile)
- [KubeVirt .github/workflows/label_approved_veps.yaml](https://github.com/kubevirt/kubevirt/blob/main/.github/workflows/label_approved_veps.yaml)
- [kubevirt/project-infra (Prow CI configuration repository)](https://github.com/kubevirt/project-infra)
- [ISCAS risc-verse external KubeVirt-riscv fork](https://code.risc-verse.isrc.ac.cn/risc-verse/wg-cloudcomputing/kubevirt-riscv)
- [PyPI kubevirt package lookup (404, package does not exist)](https://pypi.org/pypi/kubevirt/json)
- [Ubuntu 26.04 (resolute) package search for kubevirt](https://packages.ubuntu.com/search?keywords=kubevirt&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search for kubevirt](https://archriscv.felixc.at/?q=kubevirt)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [CNCF blog - Benchmarking KubeVirt Performance with virtbench (no RISC-V content)](https://www.cncf.io/blog/2026/06/08/benchmarking-kubevirt-performance-with-virtbench/)
- [kubevirt/test-benchmarks repository](https://github.com/kubevirt/test-benchmarks)
- [KubeVirt perf-scale-benchmarks documentation](https://github.com/kubevirt/kubevirt/blob/main/docs/perf-scale-benchmarks.md)
