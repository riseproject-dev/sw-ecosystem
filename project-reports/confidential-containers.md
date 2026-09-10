---
title: Confidential Containers
parent: Project Reports
color: orange
dependencies:
  - name: Kata Containers
    relation: runtime-dependency
    criticality: critical
  - name: ring
    relation: build-dependency
    criticality: critical
  - name: libc (Rust crate)
    relation: build-dependency
    criticality: critical
  - name: nix
    relation: build-dependency
    criticality: optional
---

# Confidential Containers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Confidential Containers<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="confidential-containers" %}

## 1. Project Overview

Confidential Containers (CoCo) is a CNCF Incubating project, hosted by the Linux Foundation, that provides a Kubernetes-native framework for running container workloads inside hardware Trusted Execution Environments (TEEs). It integrates a modified [Kata Containers](https://github.com/kata-containers/kata-containers) runtime, an attestation stack (`trustee`: kbs, attestation-service, rvps), a guest-side image/crypto stack (`guest-components`: attestation-agent, confidential-data-hub, image-rs, ocicrypt-rs), and a cloud-provider adapter (`cloud-api-adaptor`) to isolate a pod inside a TEE-backed VM. License: Apache 2.0, stated in `governance.md` and the repo's `LICENSE` file.

The `confidential-containers/confidential-containers` repository researched for this report is the project's **governance/meta repo** (README, MAINTAINERS, architecture.md, roadmap.md, ADOPTERS.md) - it contains no source code and no dependency manifest. Actual implementation lives in sibling repos under the `confidential-containers` GitHub org (operator, kata-containers fork, guest-components, trustee, cloud-api-adaptor, td-shim, enclave-cc).

**Governance:** defined in `governance.md`. Roles: Contributor (merged PR in last 12 months) -> Member (optional org membership, requires 2FA) -> Maintainer (per-repo, promoted by lazy consensus) -> Security Manager (org-wide, SC-appointed) -> Steering Committee (top governing body, consensus-driven with voting as last resort: 2/3 for procedural changes such as expansion, quorum to meet 1/2, quorum to vote 2/3).

**Corporate sponsors / Steering Committee members** (from `MAINTAINERS` and `governance.md`):

| Person | Company |
|---|---|
| Ariel Adam, Beraldo Leal | Red Hat |
| Bartlomiej Sulich, Mikko Ylinen | Intel |
| James Magowan, Nina Goradia | IBM |
| Jiang Liu, Jia Zhang | Alibaba |
| Harshitha Gowda | AMD |
| Samuel Ortiz | Rivos (a RISC-V chip design company) |
| Zvonko Kaiser, Tobin Feldman-Fitzthum | NVIDIA |
| Magnus Kulke, Dan Mihai | Microsoft |

Notably, **Rivos already holds a Steering Committee seat**, yet no RISC-V enablement work has landed in the project - see Section 12.

**Community culture on new ports:** there is no written tier-policy document (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` do not exist). Platform/architecture support is governed implicitly: a company drives the implementation of a new TEE/architecture itself (as Intel, AMD, IBM, NVIDIA, Microsoft, and Alibaba did for their respective TEE hardware) and can then seek Steering Committee expansion/representation once contributions are "significant" (2/3 SC approval required). This is an organizational, not a technical-committee, gate.

## 2. Port History and Upstreaming Timeline

There is no riscv64 port and no history to report.

| Date | Event | Source |
|---|---|---|
| - | No tracking issue, dedicated PR, or commit for a riscv64 port exists anywhere in the `confidential-containers` GitHub org (21 repos searched) | Org-wide GitHub search for `riscv`/`riscv64` across issues, PRs, commits, and code |
| 2026-07-22 | Only riscv64-adjacent code event in the org: [cloud-api-adaptor PR #3211](https://github.com/confidential-containers/cloud-api-adaptor/pull/3211) adds a unit test using `riscv64` as the literal example of an *unrecognized* architecture (falls through to `NoLaunchSecurity`, the same default as any unhandled arch) | [cloud-api-adaptor PR #3211](https://github.com/confidential-containers/cloud-api-adaptor/pull/3211) |

**Key contributors:** none. No individual or organization has driven riscv64 enablement work in this project.

**Is it fully upstream?** N/A - there is nothing to upstream. The project has zero riscv64 code, zero riscv64 CI, and zero riscv64 documentation.

## 3. Upstream Support Tier

**Formal tier policy:** none exists. No `PLATFORMS.md`/`SUPPORT.md`/`docs/platforms/` file was found in `confidential-containers/confidential-containers`. Official supported-hardware lists in `overview.md` and `architecture.md` name only: **AMD SEV-SNP, Intel SGX, Intel TDX, IBM PEF, IBM Secure Execution (SE)**. No RISC-V TEE (CoVE/AP-TEE) entry exists in any official document.

**Evidence:**
- CI: the repo's only workflow, [`.github/workflows/links.yml`](https://github.com/confidential-containers/confidential-containers/blob/main/.github/workflows/links.yml), is a markdown link-checker running `lycheeverse/lychee-action` on `ubuntu-latest` (x86_64). It does not build or test anything, has no architecture matrix, and contains zero mentions of "riscv" in any form.
- Release-blocking: not applicable - there is no riscv64 job to be release-blocking or not.
- Official binaries: GitHub releases for `confidential-containers/confidential-containers` (v0.13.0 through v0.22.0, the 10 most recent) contain **only GitHub's auto-generated `.zip`/`.tar.gz` source archives** - no compiled binaries of any architecture.

**Comparison table:**

| Architecture | CI build | CI test | Official release artifact | Supported per official docs |
|---|---|---|---|---|
| amd64 (x86_64) | Yes (implicit; SEV-SNP, SGX, TDX all x86_64) | Yes | No dedicated binary from this meta-repo (component repos ship their own) | Yes |
| arm64 | Not confirmed in this repo's CI [NEEDS VERIFICATION - only one source, this report's scope was the meta repo] | Not confirmed | Not confirmed | Not listed in `overview.md`/`architecture.md` hardware list as of research date |
| riscv64 | No | No | No | No - absent from official hardware list entirely |

## 4. Technical Architecture and RISC-V-Specific Subsystems

CoCo's TEE-facing code is architecture-dispatch logic (launch-security-type detection, attestation drivers) rather than SIMD/JIT/GC-barrier code. The relevant dispatch point is in `cloud-api-adaptor`'s libvirt cloud provider.

**`src/cloud-providers/libvirt/libvirt.go` / `libvirt_test.go`** (confirmed via GitHub code search, `text_matches`): the package declares arch constants `archX86_64` ("x86_64") and `archS390x` ("s390x"), each wired to a real TEE dispatch case (`S390PV` for s390x; SEV/TDX paths live elsewhere for x86_64). **No `archRiscv64` constant exists.** The test table uses the bare string `"riscv64"` explicitly as the example of an unhandled architecture:
```go
{name: "unknown arch returns NoLaunchSecurity", model: "riscv64", expected: NoLaunchSecurity},
```
This is the single genuine code-level RISC-V reference found anywhere in the 21-repo `confidential-containers` org, and it demonstrates absence of support, not presence.

No `arch/riscv/` directories, no RISC-V assembly, no JIT, and no riscv64 SIMD dispatch code exist anywhere in the org's confidential-computing-specific code (the TEE/attestation layer proper). This is expected: CoCo's supported TEEs (SEV-SNP, SGX, TDX, PEF, IBM SE) are all non-RISC-V hardware by definition; a RISC-V TEE integration (e.g. against the CoVE/AP-TEE spec) would require net-new architecture support, not porting existing x86/s390x code.

**Comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Launch-security dispatch (cloud-api-adaptor libvirt) | Wired (`archX86_64`) | Not confirmed in this scope [NEEDS VERIFICATION] | Missing - falls to `NoLaunchSecurity` default |
| TEE driver / attestation backend | SEV-SNP, SGX, TDX all present | Not applicable to the listed TEE set | None - no CoVE/AP-TEE integration exists |
| Guest kernel / VMM support | Via Kata Containers + QEMU/Cloud Hypervisor | Via Kata Containers | Depends entirely on Kata Containers' riscv64 enablement, which is itself incomplete (see Section 9) |

## 5. Build System, Cross-Compilation, and Toolchain

`confidential-containers/confidential-containers` is not a CMake project and has no build system of its own - it is documentation/governance only. Confirmed by direct repo inspection:
- No `CMakeLists.txt` anywhere in the repo (`find . -iname "CMakeLists.txt"` returns nothing).
- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md`.
- Org-wide GitHub code search for `filename:CMakeLists.txt riscv` across `org:confidential-containers` returned 0 results.
- The only `Dockerfile` in the repo is `demos/ssh-demo/Dockerfile`, unrelated to riscv64 or CI.
- Org-wide search for `riscv64 filename:Dockerfile` across `org:confidential-containers` returned 0 results.

The actual CoCo components are built with **Cargo** (Rust: guest-components, trustee) and **Go + Makefiles** (Kata runtime fork, cloud-api-adaptor, operator) - not CMake/Autotools. No riscv64 toolchain requirements, cross-compilation flags, or QEMU-based build documentation exist for any component researched, because riscv64 is not a documented target for any of them.

**Known build failures:** none documented for CoCo itself (there is nothing to fail to build for riscv64). A related, adjacent build failure exists one layer down in the stack: `virtiofsd` (used by Kata Containers) failed to build on RISC-V with a `"libc: unbound variable"` error, tracked and fixed in [kata-containers#10739](https://github.com/kata-containers/kata-containers/issues/10739) / [PR #10740](https://github.com/kata-containers/kata-containers/pull/10740).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Confidential VM launch (any TEE) | Yes (SEV-SNP, SGX, TDX) | Not in official hardware list [scope-limited finding] | No - no TEE integration exists |
| Attestation (trustee: kbs, AS, rvps) | Yes | Not confirmed in this scope | Not built/tested; no riscv64 CI anywhere in trustee's repo per org-wide search |
| Guest image encryption/decryption (ocicrypt-rs) | Yes | Not confirmed | Depends on Rust crate riscv64 availability (see Section 9); no CoCo-specific validation |
| Kata Containers runtime substrate | Full | Full | Partial and in progress upstream in Kata itself, unrelated to any CoCo-specific work (see Section 9 and 11) |
| Cloud-api-adaptor launch-security detection | Wired | Not confirmed | Explicitly falls to `NoLaunchSecurity` default |

**Functional gaps:** CoCo cannot run at all on riscv64 today - there is no TEE backend, no attestation path, and the cloud-api-adaptor explicitly treats riscv64 as an unrecognized architecture. This is a complete functional gap, not a partial one.

**Performance gaps:** not applicable - there is no functioning riscv64 deployment to measure production performance against. The only quantitative data for "confidential containers on RISC-V" comes from an unrelated academic prototype, NACRE (see Section 11), which is not CoCo and uses a different architecture entirely (a custom trusted agent + runc, not Kata/guest-components/trustee).

**Security hardening gaps:** the RISC-V TEE spec (CoVE/AP-TEE) is not integrated into CoCo at all, so no riscv64-specific hardening posture exists to assess.

**NaN / floating-point semantics issues:** none found relevant to CoCo. The only RISC-V-plus-NaN GitHub hit surfaced during research was an unrelated NumPy issue ([numpy#32461](https://github.com/numpy/numpy/issues/32461), a floating-point-exception test failure), explicitly ruled out as unconnected to Confidential Containers.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist?** No, confirmed by direct inspection.

`confidential-containers/confidential-containers`'s `.github/workflows/` directory contains exactly one file, `links.yml` (full content read):

```yaml
name: check links

on:
  push:
    branches:
      - main
  pull_request:
  workflow_dispatch:

jobs:
  checklinks:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      - name: Restore lychee cache
        uses: actions/cache@v3
        with:
          path: .lycheecache
          key: cache-lychee-${{ github.sha }}
          restore-keys: cache-lychee-
      - name: Check links
        uses: lycheeverse/lychee-action@v1
        with:
          args: "--cache --max-cache-age 1d ."
          fail: true
```

This job checks out the repo and runs a markdown link-checker on `ubuntu-latest` (x86_64). It does not build, does not test, and has no architecture matrix of any kind. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repo. A whole-repo case-insensitive grep for "riscv" returns zero matches in any file (workflow, doc, script, or manifest).

**RISE runners?** No reference to `riseproject-dev` or any RISE runner label exists in this repo's CI.

**Comparison table:**

| Architecture | CI exists | Purpose | Hardware |
|---|---|---|---|
| amd64 | Yes | Link-checking only (not build/test) | GitHub-hosted `ubuntu-latest` |
| arm64 | Not confirmed in this repo's CI [scope-limited: meta repo has no build/test CI of any kind for any arch] | N/A | N/A |
| riscv64 | No | N/A | N/A |

Scope caveat: this repo is the org's governance/meta repo, not a component source repo. Component repos (operator, kata-containers fork, guest-components, trustee, cloud-api-adaptor) were not independently re-audited for their own CI in this pass beyond the org-wide search reported in Sections 2 and 4, which found zero riscv64 CI jobs anywhere in the org.

## 8. Distribution and Release Status

**Official binaries for riscv64:** none, on any distribution channel checked.

| Channel | Result |
|---|---|
| PyPI (`confidential-containers`) | HTTP 404 on both `https://pypi.org/pypi/confidential-containers/json` and `https://pypi.org/simple/confidential-containers/` - package does not exist at all |
| RISE wheel builder (GitLab) | `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/confidential-containers/` redirects to the PyPI 404 above - nothing to build against |
| Ubuntu 26.04 (resolute) | `https://packages.ubuntu.com/search?keywords=Confidential%20Containers&suite=resolute` returns "Sorry, your search gave no results" - no package for **any** architecture, not just riscv64 |
| Arch Linux RISC-V (archriscv.felixc.at) | No positive evidence of a package; the query endpoint returned only generic port-info boilerplate, inconclusive but no package found |
| GitHub Releases (`confidential-containers/confidential-containers`) | Only auto-generated `.zip`/`.tar.gz` source archives across the 10 most recent releases (v0.13.0-v0.22.0) - no compiled binaries of any architecture |
| Maven, npm, OCI | Not applicable - CoCo is not distributed through these channels as a top-level artifact from this repo |

**What must a user do to get a working binary?** There is none to get. A user wanting riscv64 confidential containers today would have to: (1) build a working riscv64 Kata Containers stack from source (itself incomplete upstream, see Section 9), (2) implement a RISC-V TEE backend and attestation driver from scratch (no reference implementation exists in CoCo), and (3) wire it into cloud-api-adaptor's launch-security dispatch (currently hard-coded to treat riscv64 as unrecognized). This is greenfield engineering work, not a build/packaging gap.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| **Kata Containers** | Runtime-dependency (critical) - container-VM runtime CoCo builds on, isolates the pod in a TEE-capable VM | Partial/in-progress upstream; Dragonball VMM has no riscv64 port ([kata-containers#10226](https://github.com/kata-containers/kata-containers/issues/10226), [#11415](https://github.com/kata-containers/kata-containers/issues/11415)) | Partial - dedicated CI runner (SG2042 boards) reported idle 120+ days as of 2026-09-03, no live validation | No riscv64 asset in any recent GitHub release; no official riscv64 guest kernel/rootfs | See project-reports/kata-containers.md (color: Blue per that report); none of this work is CoCo-specific - it is plain Kata enablement with no confidentiality layer |
| **ring** (Rust crate, `briansmith/ring`) | Build-dependency (critical) - crypto backend behind guest-components' `encryption-ring`/`kata-cc-rustls-tls` feature path (image-rs default build) | Builds for `riscv64gc-unknown-linux-gnu` since a merged PR (cherry-pick of BoringSSL's riscv64 target support) | No dedicated riscv64 CI found in the repo; verified only on Alpine/musl at port time per the PR | Ships via crates.io as source, compiled per-consumer; no prebuilt binary artifact (not applicable to a source crate) | **No RISC-V assembly/SIMD exists** - the riscv64 port uses the portable/generic C fallback only, not hand-tuned RV64 crypto asm. This is a real gap relative to OpenSSL's Zvk/Zkn vector-crypto coverage if a riscv64 CoCo deployment used the `ring`/rustls feature set |
| **libc (Rust crate)** | Build-dependency (critical) - low-level OS bindings underlying Rust components (guest-components, trustee) | riscv64gc-unknown-linux-gnu is a supported target triple per the crate's own target list (surfaced incidentally in dependabot bump changelogs across `enclave-cc`, `guest-components`, `trustee`, `operator`) | Not independently verified in this research pass [NEEDS VERIFICATION] | Ships via crates.io as source | No riscv64-specific issues surfaced in this research; routine dependency, not flagged as a blocker anywhere found |
| **nix (Rust crate)** | Build-dependency (optional) - Unix syscall bindings | riscv64gc-unknown-linux-gnu listed among supported targets in changelog bumps (same dependabot evidence as libc above) | Not independently verified [NEEDS VERIFICATION] | Ships via crates.io as source | No riscv64-specific issues surfaced |
| containers/ocicrypt (Go) | Container-image encryption/decryption spec; `ocicrypt-rs` (Rust, vendored in guest-components) implements the same scheme for image-rs | Distributed as a Go module (source); riscv64 support flows from Go's native `GOARCH=riscv64`, no arch-specific code | No riscv64-specific CI found | Source-only, no dedicated riscv64 `.deb` | Zero open or closed riscv64/riscv issues found in the 4-issue repo - appears to be a non-issue rather than evidence of active validation |
| Cloud Hypervisor | Secondary VMM required for the peer-pods (`cloud-api-adaptor`) CoCo architecture | Experimental riscv64 support since ~v45.0 via GitHub release binaries (direct-kernel-boot only, needs AIA controller hardware) | Experimental only, no CI parity | Experimental GitHub release binaries only | Kata's own peer-pods riscv64 wiring ([PR #13079](https://github.com/kata-containers/kata-containers/pull/13079)) is explicitly blocked on [cloud-hypervisor#8258](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/8258) |
| QEMU | Primary hypervisor wired into Kata for riscv64 | CI-tested via `check-tcg` cross-build; Debian sid ships riscv64 packages | Partial - QEMU-emulated only, no native runner, no KVM CI job | Source-only upstream; distro packages exist | See project-reports/qemu.md (color: yellow) |
| runc, crun, containerd | Container-runtime layer CoCo's pods ultimately run through | All build/release riscv64 binaries | **None run their test suite on real riscv64 hardware in CI** - common failure mode across the whole layer | riscv64 assets shipped in releases; Ubuntu/Debian package all three | See individual project-reports (runc.md, crun.md, containerd.md - all color: yellow) |

**Recursion note:** Kata Containers, ring, and libc/nix all trace to the same underlying gap pattern - riscv64 builds exist at the crate/binary level, but no dependency in this chain has been validated end-to-end as part of a working confidential-computing deployment. The `ring` crate's lack of RISC-V crypto acceleration is the most consequential finding for any future riscv64 CoCo port that chooses the rustls/ring feature path over OpenSSL.

## 11. Known Bugs and Active Issues

No open issues exist in the `confidential-containers` org itself for riscv64 (org-wide search across issues, PRs, and commits: zero genuine hits). All tracked riscv64 work is one layer down, in Kata Containers - CoCo's runtime substrate, but this work is plain KVM/QEMU/Kata architecture enablement, not confidentiality-related:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [kata-containers#9284](https://github.com/kata-containers/kata-containers/issues/9284) | runtime: Add support for riscv64 architecture | Open | Tracking | Umbrella feature request, minimal detail, opened March 2024 |
| [kata-containers#10226](https://github.com/kata-containers/kata-containers/issues/10226) | dragonball: Introduce riscv64 architecture | Open | Blocking (VMM) | Dragonball VMM riscv64 port |
| [kata-containers#10532](https://github.com/kata-containers/kata-containers/issues/10532) | runtime-rs: Need riscv64 architecture support | Open | Blocking | |
| [kata-containers#11415](https://github.com/kata-containers/kata-containers/issues/11415) | dragonball: Bump rust-vmm crates to support RISC-V | Open | Blocking | |
| [kata-containers#10538](https://github.com/kata-containers/kata-containers/issues/10538) | VITAMIN-V: onboard RISC-V to kata containers | Open | Tracking | EU VITAMIN-V project; tested on StarFive VisionFive 2 + QEMU; VisionFive 2 lacks H-extension/KVM support, forcing emulated-only testing |
| [kata-containers#10734](https://github.com/kata-containers/kata-containers/issues/10734) | Kata-Containers on RISC-V | Open | Tracking | Status table: Runtime/Runtime-rs/Kernel/Virtiofsd done upstream; Agent/OSBuilder ongoing; Dragonball done in dev, ongoing upstream |
| [kata-containers#10524](https://github.com/kata-containers/kata-containers/issues/10524) | kata-containers: Introduce RISC-V 64-bit architecture support | Closed | - | Superseded by the split issues above |
| [kata-containers#10739](https://github.com/kata-containers/kata-containers/issues/10739) | virtiofsd cannot be built on RISC-V | Closed (fixed) | Build bug | Fixed via [PR #10740](https://github.com/kata-containers/kata-containers/pull/10740) |

**Correctness bugs:** none found for CoCo or its riscv64 relevance. No NaN/floating-point correctness bug exists for this combination; the only such hit found in research ([numpy#32461](https://github.com/numpy/numpy/issues/32461)) is unrelated to Confidential Containers and is noted only to rule it out.

**Performance data (context only, not CoCo-specific):** the academic **NACRE** prototype (arXiv:2609.03849, "Rethinking Confidential Containers through Native Architectural Support") is the only source combining "RISC-V" and "confidential containers" with numbers. It is a from-scratch research co-design (QEMU + OpenSBI + Linux + custom trusted agent + runc), not upstream CoCo:
- lmbench syscall/pipe overhead: within 3.5% of an unmodified-runc baseline across all measured metrics.
- nginx throughput: 1.9% lower than baseline (16,557 KB/s vs 16,873 KB/s).
- hackbench (2,000 workers): 1.50x-4.59x slower than baseline; one run hit a `CONTAINER_FULL` resource-exhaustion failure.
- Authors' own caveat: this is a position paper; QEMU-simulation only, FPGA evaluation explicitly stated as incomplete, no ARM64 comparison point exists in the paper.

This data characterizes a non-CoCo research prototype's feasibility, not CoCo's actual production performance on RISC-V, because no such production deployment exists.

## 12. Objections and Upstream Blockers

**Stated objections:** none found - there is no rejected proposal, no maintainer pushback recorded anywhere, because no riscv64 proposal has ever been submitted to `confidential-containers/confidential-containers` or any sibling repo.

**Technical blockers:**
1. No RISC-V TEE hardware is integrated into CoCo's supported-hardware list (SEV-SNP, SGX, TDX, PEF, IBM SE only) - the CoVE/AP-TEE RISC-V confidential-computing spec has no CoCo-side driver or attestation backend.
2. Kata Containers, the runtime substrate CoCo depends on, has its own incomplete riscv64 port (Dragonball VMM unimplemented, no official riscv64 guest kernel/rootfs, CI runner reportedly idle) - CoCo cannot be functionally ported ahead of Kata's own riscv64 completion.
3. Cloud Hypervisor (the VMM for peer-pods/cloud-api-adaptor) has only experimental riscv64 support, blocking that architecture's riscv64 wiring ([kata-containers#13079](https://github.com/kata-containers/kata-containers/pull/13079) blocked on [cloud-hypervisor#8258](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/8258)).
4. The `ring` crypto crate, used by one of CoCo's two crypto feature paths, has no RISC-V vector-crypto acceleration (generic C fallback only) - a maturity gap even once basic connectivity exists.

**Organizational blockers:** the path to a new TEE/architecture port is organizational (a company drives the implementation, then seeks Steering Committee expansion), not a technical-committee veto. **Rivos, a RISC-V chip company, already holds a Steering Committee seat**, but per exhaustive search this seat has not translated into any RISC-V enablement commits, issues, or PRs anywhere in the org. This is the single most notable organizational fact in this report: the mechanism for driving a RISC-V port exists and is already staffed at the governance level, yet is unused.

**RISE involvement:** none found. `riseproject.dev`'s member list, blog (all ~30 posts scanned), wheel builder, and the `riseproject-dev` GitHub org (25 repos) show no project, post, or repo referencing Confidential Containers. The Security Software WG's "Confidential Compute reference implementation" work targets **CoVE** (a RISC-V ISA proposal), not the CNCF Confidential Containers project - a related but distinct effort, confirmed not to overlap.

**Acceptance probability:** cannot be assessed from evidence of rejection (none exists), but the structural blockers are severe: CoCo cannot be meaningfully ported to riscv64 until Kata Containers' own riscv64 runtime is complete AND a RISC-V TEE (CoVE) attestation backend is built from scratch. This is a multi-layer, multi-year dependency chain, not a single-repo porting effort.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, no distribution floor reachable, no confirmed breakage)
- **Release provider:** none
- Not an optimization-purpose project - no Optimization level applies. CoCo's value proposition is confidential-computing orchestration/attestation, not raw performance; the project would still deliver its core value on riscv64 with generic code once a TEE backend existed, so Step 2 of the color model does not trigger.
- **Justification:** `confidential-containers/confidential-containers`'s only CI workflow is a markdown link-checker ([links.yml](https://github.com/confidential-containers/confidential-containers/blob/main/.github/workflows/links.yml)) with zero riscv references and no build/test step of any kind. Org-wide code search across all 21 `confidential-containers` repos found exactly one riscv64 string in the entire organization: a test literal in [cloud-api-adaptor's `libvirt_test.go`](https://github.com/confidential-containers/cloud-api-adaptor/pull/3211) used as the canonical example of an *unrecognized* architecture, proving absence of support rather than any port-in-progress. The project's official supported-hardware documentation (`overview.md`, `architecture.md`) lists only AMD SEV-SNP, Intel SGX, Intel TDX, IBM PEF, and IBM Secure Execution - no RISC-V TEE entry exists. Orange rather than grey applies because this is affirmative, positive evidence of the gap (an explicit unsupported-arch test case, absence from supported-hardware docs, zero riscv64 artifacts across PyPI/Ubuntu/GitHub releases), not merely an absence of data. Orange rather than red applies because there is no confirmed-broken runtime state to point to - riscv64 support simply does not exist yet, which is a distinct condition from "exists but is broken."
- **Pending work that could change the grade:** none identified. No open PR, tracking issue, or RISE-funded project targets Confidential Containers' riscv64 support specifically. The only adjacent, indirectly relevant activity is Kata Containers' own riscv64 enablement (six open tracking issues, one closed build-fix), which would need to reach functional completeness before a CoCo-specific port could even begin, and Rivos's unused Steering Committee seat, which is a latent (not active) lever.

## 14. Investment Analysis

**RISE prior-work check:** no RISE involvement was found anywhere in this project (Section 12) - none of the work below is already covered by RISE funding, RISE runners, or the RISE wheel builder. All estimates below assume a from-scratch effort.

### 14.1 Functional Enablement

Before any CoCo-specific work is possible, the underlying Kata Containers runtime must reach functional riscv64 completeness (Dragonball VMM, guest kernel, virtiofsd already fixed, runtime-rs) - this is tracked separately in the Kata Containers project report and is a prerequisite, not incremental CoCo work. On top of that, CoCo-specific work requires: (a) defining and implementing a RISC-V TEE attestation backend against the CoVE/AP-TEE spec (no existing reference implementation to port from), (b) wiring a new `archRiscv64` case into cloud-api-adaptor's launch-security dispatch, (c) validating the `guest-components`/`trustee` Rust workspace builds and functions correctly on riscv64 end-to-end (crypto feature-flag choice between OpenSSL and `ring` matters here - see 14.2), and (d) building and validating a riscv64 Cloud Hypervisor or QEMU-based guest boot path for the CoCo-hardened kernel/rootfs.

### 14.2 Performance Optimization

Not primary at this stage - functional enablement is the blocking prerequisite. Once functional, the main performance-relevant decision is the crypto backend: `ring`'s riscv64 port has no vector-crypto acceleration (generic C fallback only) versus OpenSSL's more mature Zvk/Zkn coverage (with its own unresolved AES constant-time gap on hardware lacking those extensions, per the OpenSSL project report). Choosing/hardening the OpenSSL path for a riscv64 CoCo deployment would avoid inheriting `ring`'s acceleration gap.

### 14.3 CI/CD Infrastructure

No riscv64 CI exists for CoCo itself or, per this report's org-wide search, at any point in the CoCo dependency chain's confidentiality-specific code. Standing up CI would require: a native riscv64 or QEMU-emulated runner (RISE RISC-V Runners, announced 2026-03-24 per RISE's blog, are a candidate but no evidence of their use here was found), a riscv64 CoVE-capable test target (hardware availability itself is an open question - RISC-V TEE silicon implementing CoVE is not confirmed to be broadly available), and integration with Kata's own currently-idle riscv64 CI runner (SG2042 boards, reported idle 120+ days as of 2026-09-03).

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's scoping rule; CoCo is a standalone orchestration/runtime project with no significant dependent package ecosystem (no PyPI package exists at all, confirmed by 404).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | RISC-V TEE (CoVE/AP-TEE) attestation backend design and implementation in `trustee` (kbs, attestation-service, rvps) - no existing reference to port from | 20-30 | Unassigned | Critical |
| Functional | Wire `archRiscv64` into cloud-api-adaptor's launch-security dispatch and downstream provider logic | 2-4 | Unassigned | Critical |
| Functional | Validate `guest-components` Rust workspace (image-rs, ocicrypt-rs, confidential-data-hub) builds and passes tests on riscv64 | 4-6 | Unassigned | Critical |
| Functional (prerequisite, tracked separately) | Kata Containers Dragonball VMM riscv64 port completion | Not sized here - see kata-containers.md report | Kata community / VITAMIN-V project | Critical (blocking) |
| Performance | Evaluate and, if needed, harden `ring`-vs-OpenSSL crypto path choice for riscv64 (ring lacks vector-crypto accel) | 3-5 | Unassigned | Medium |
| CI/CD | Stand up riscv64 CI for `trustee` and `guest-components` (RISE runners as candidate infrastructure) | 4-6 | Unassigned | High |
| CI/CD | Re-engage Kata's idle SG2042 riscv64 CI runner and align with any new CoCo riscv64 test matrix | 2-3 | Unassigned | High |
| Organizational | Use Rivos's existing Steering Committee seat to formally propose riscv64 as a roadmap item | 1 (advocacy, not engineering) | Rivos (already SC member) | High (low-cost, high-leverage first step) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [confidential-containers/confidential-containers repository](https://github.com/confidential-containers/confidential-containers)
- [confidentialcontainers.org overview](https://confidentialcontainers.org/)
- [confidential-containers/confidential-containers CI workflow (links.yml)](https://github.com/confidential-containers/confidential-containers/blob/main/.github/workflows/links.yml)
- [confidential-containers/confidential-containers governance.md](https://github.com/confidential-containers/confidential-containers/blob/main/governance.md)
- [confidential-containers/confidential-containers MAINTAINERS](https://github.com/confidential-containers/confidential-containers/blob/main/MAINTAINERS)
- [confidential-containers/confidential-containers releases](https://github.com/confidential-containers/confidential-containers/releases)
- [cloud-api-adaptor PR #3211 (riscv64 test literal)](https://github.com/confidential-containers/cloud-api-adaptor/pull/3211)
- [cloud-api-adaptor issue #1035 (false positive, verified clean)](https://github.com/confidential-containers/cloud-api-adaptor/issues/1035)
- [guest-components PR #290 (RFC, tangential citation only)](https://github.com/confidential-containers/guest-components/pull/290)
- [td-shim issue #532 (unrelated getrandom reference)](https://github.com/confidential-containers/td-shim/issues/532)
- [kata-containers#9284 - runtime: Add support for riscv64 architecture](https://github.com/kata-containers/kata-containers/issues/9284)
- [kata-containers#10226 - dragonball: Introduce riscv64 architecture](https://github.com/kata-containers/kata-containers/issues/10226)
- [kata-containers#10532 - runtime-rs: Need riscv64 architecture support](https://github.com/kata-containers/kata-containers/issues/10532)
- [kata-containers#11415 - dragonball: Bump rust-vmm crates to support RISC-V](https://github.com/kata-containers/kata-containers/issues/11415)
- [kata-containers#10538 - VITAMIN-V: onboard RISC-V to kata containers](https://github.com/kata-containers/kata-containers/issues/10538)
- [kata-containers#10734 - Kata-Containers on RISC-V](https://github.com/kata-containers/kata-containers/issues/10734)
- [kata-containers#10524 - kata-containers: Introduce RISC-V 64-bit architecture support (closed)](https://github.com/kata-containers/kata-containers/issues/10524)
- [kata-containers#10739 - virtiofsd cannot be built on RISC-V (closed)](https://github.com/kata-containers/kata-containers/issues/10739)
- [kata-containers PR #10740 - virtiofsd riscv64 build fix](https://github.com/kata-containers/kata-containers/pull/10740)
- [kata-containers PR #13079 - peer-pods riscv64 wiring, blocked](https://github.com/kata-containers/kata-containers/pull/13079)
- [cloud-hypervisor#8258 - riscv64 blocker issue](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/8258)
- [cloud-hypervisor#6978 - riscv64 roadmap issue](https://github.com/cloud-hypervisor/cloud-hypervisor/issues/6978)
- [runc issue #5166 - add riscv64 CI, closed unresolved](https://github.com/opencontainers/runc/issues/5166)
- [crun issue #1414 - eBPF bpf create failure on VisionFive2](https://github.com/containers/crun/issues/1414)
- [containerd PR #13124 - add riscv64 to CI matrix, stalled](https://github.com/containerd/containerd/pull/13124)
- [OpenSSL PR #31080 - AES T-table constant-time fix](https://github.com/openssl/openssl/pull/31080)
- [OpenSSL PR #31082 - related constant-time fix](https://github.com/openssl/openssl/pull/31082)
- [OpenSSL issue #28118 - musl Zbb detection broken](https://github.com/openssl/openssl/issues/28118)
- [OpenSSL issue #22166 - SSL test hangs at high parallelism](https://github.com/openssl/openssl/issues/22166)
- [zstd issue #4622 - huf_decompress 4-way loop not enabled on riscv64](https://github.com/facebook/zstd/issues/4622)
- [PyPI confidential-containers package check (404)](https://pypi.org/pypi/confidential-containers/json)
- [Ubuntu 26.04 resolute package search (no results)](https://packages.ubuntu.com/search?keywords=Confidential%20Containers&suite=resolute&searchon=names&section=all)
- [RISE wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project blog - Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project blog - Industry Cooperation Takes Center Stage at RISC-V Summit Europe 2026](https://riseproject.dev/2026/06/26/industry-cooperation-takes-center-stage-at-risc-v-summit-europe-2026/)
- [NACRE paper - Rethinking Confidential Containers through Native Architectural Support (arXiv:2609.03849)](https://arxiv.org/html/2609.03849)
- [numpy#32461 - riscv NaN/fp exception test failure (unrelated, ruled out)](https://github.com/numpy/numpy/issues/32461)