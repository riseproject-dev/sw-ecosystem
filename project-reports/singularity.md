---
title: Singularity
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: containerd
    relation: build-dependency
    criticality: critical
  - name: libseccomp
    relation: test-dependency
    criticality: critical
  - name: kr/pty
    relation: runtime-dependency
    criticality: optional
---

# Singularity

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Singularity<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="singularity" %}

## 1. Project Overview

`apptainer/singularity` is a container runtime designed for HPC and scientific-computing workloads ("Mobility of Compute"). The repository under evaluation is an **archived snapshot**: its own README states "Singularity has been renamed to Apptainer as part of moving the project to the Linux Foundation. This repository is now for archiving the history in the release branches. The master branch is not in a consistent state. Please submit all current issues and pull requests to [apptainer/apptainer](https://github.com/apptainer/apptainer)." A `lockdown.yml` workflow auto-locks any newly opened issue and redirects reporters to `sylabs/singularity` or `apptainer/apptainer`. The last real commit on this repo is `9dceb4240c12b4cff1da94630d422a3422b39fcf` (2022-10-10), and the last tagged release is **v3.8.7**.

Development moved to two living forks after the 2021 rename:
- **Apptainer** (`apptainer/apptainer`) - governed by the Linux Foundation as "Apptainer, a Series of LF Projects, LLC" (announced 2021-11-30 per [apptainer.org community announcement](https://apptainer.org/news/community-announcement-20211130)). Governance is a Technical Steering Committee (TSC) that also serves as Committers; new Committers are added by majority TSC vote. No CLA is required - contributions use a Developer Certificate of Origin (DCO). License: BSD 3-Clause, with copyright layered across Gregory M. Kurtzer (2015-17), the Regents of UC/LBNL (DOE-funded), SingularityWare LLC, Sylabs Inc. (2018-2025), and "Contributors to the Apptainer project" under LF Projects LLC.
- **SingularityCE** (`sylabs/singularity`) - the commercial fork retaining the "Singularity" trademark, maintained by Sylabs Inc.

Current TSC/Committers for Apptainer: Anders F Bjorklund (independent), Cedric Clerget (CtrlIQ), Dave Dykstra (Fermilab/DOE), Gregory M. Kurtzer (founder; CtrlIQ/RESF), Krishna Muriki (formerly Lawrence Berkeley National Laboratory). The broader contributor base includes staff from Sylabs Inc. (largest single corporate contributor), CERN, NVIDIA, SUSE, Fermilab, Oak Ridge National Laboratory, Brookhaven National Laboratory, Lenovo, Microsoft, Intel, D.E. Shaw, GSA Capital, Rescale, UK Met Office/STFC, and several universities.

No formal platform-tier policy document exists (no explicit tier system in the technical charter or CONTRIBUTING.md); support tiers show up informally in build/packaging configuration instead. The community stance toward new architecture ports is contribution-driven and welcoming: riscv64 support in Apptainer was contributed largely by an independent community member and a Sylabs employee, reviewed and merged by a TSC member through ordinary PR review, with no corporate sponsorship or membership prerequisite observed.

**apptainer/singularity is not a RISE Project member.** RISE membership (checked at [riseproject.dev/members](https://riseproject.dev/members/)) consists of chip/silicon vendors and technology companies (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent as Premier Members; Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE as General Members) - no container-runtime or HPC-tooling project is listed, and no RISE blog post, working group, or funded RFP references Singularity or Apptainer.

## 2. Port History and Upstreaming Timeline

**No riscv64 activity exists in the frozen `apptainer/singularity` repository at all** - a full repository-wide, case-insensitive grep for "riscv" across every file (source, C code, CHANGELOG, docs, CI config, Makefile/mconfig) in a direct local clone (commit `9dceb4240`) returned **zero matches**. All riscv64 work in this project lineage happened in the successor repo, `apptainer/apptainer`, after the archival point:

| Date | Event | Source |
|---|---|---|
| 2022-03-09 | First riscv64 commit `98cba593b`, "feat: Add riscv64 support" (SIF/ELF magic recognition), by David Trudgian (Sylabs Inc.), signed off by Edita Kizinevic (CERN); merged via PR #315 on 2022-03-14; fixed [sylabs/singularity#628](https://github.com/sylabs/singularity/issues/628) | Apptainer commit history |
| 2022-09-27 | Apptainer v1.1.0 released: "Apptainer now supports the riscv64 architecture" (initial/partial) | Apptainer CHANGELOG.md |
| 2025-02-22 to 2025-02-24 | [apptainer/apptainer#2806](https://github.com/apptainer/apptainer/issues/2806) - riscv64 hardcoded missing from `ConvertArch()` allowlist, fixed via PR #2809 | GitHub issue |
| 2025-02 to 2025-03 | Anders F Bjorklund completes mconfig host/target arch detection for riscv64 across PRs #2809, #2823, #2832, #2833, #2879 | Apptainer PR history |
| 2025-03-05 | Commit `68a73f705`, "Add riscv64 support to mlocal host and target" | Apptainer commit history |
| 2025-03-18 | Apptainer v1.4.0 released: "Complete the previously partial support for the riscv64 architecture," plus `--arch`/binfmt_misc cross-arch build feature | Apptainer CHANGELOG.md |
| 2025-03-30 to 2025-03-31 | [apptainer/apptainer#2878](https://github.com/apptainer/apptainer/issues/2878) - `__riscv` macro matched riscv32 as well as riscv64 in mconfig basechecks, fixed | GitHub issue |
| 2026-05-13 to 2026-05-27 | [apptainer/apptainer#3488](https://github.com/apptainer/apptainer/issues/3488) - riscv64/Debian trixie build regression in 1.5.0 (bundled PRoot source fails `arch.h:55:10: error: "Unsupported architecture"`), fixed via PR #3518, released in 1.5.1 | GitHub issue |
| 2026-09-10 | PR #3759, "no-riscv-proot", by Dave Dykstra (TSC, Fermilab): skips building PRoot on riscv64 in RPM packaging (PRoot has no riscv support) - this merge commit is the current HEAD of Apptainer's master branch | Apptainer commit history |

**Is riscv64 fully upstream in the Apptainer lineage?** Yes, in `apptainer/apptainer` - riscv64 is wired through ELF/machine detection, seccomp architecture mapping, `setns` syscall tables, OCI/Docker architecture conversion, and debootstrap. **No, in the repository being graded** (`apptainer/singularity`) - this repository is permanently frozen pre-dating all riscv64 work and will never receive it.

## 3. Upstream Support Tier

No formal, written platform-tier policy exists for Apptainer. Support tiers are inferred from CI and packaging configuration:

| Architecture | apptainer/singularity (this repo, frozen) | apptainer/apptainer (successor, live) |
|---|---|---|
| amd64 | Full - only CI target, only release asset | Full - CI-tested, release images published |
| arm64 | Absent (no riscv64/arm64 CI matrix at all; single x86_64 target) | Full - CI-tested, release images published |
| riscv64 | **Absent entirely** - zero references anywhere in source, docs, or CI | Build-system support "complete" per CHANGELOG v1.4.0, but **no upstream-published riscv64 release image** (`release.yml` publishes `linux/amd64,linux/arm64` only) |

Evidence: `apptainer/singularity`'s only two workflow files (`.github/workflows/ci.yml`, `.github/workflows/lockdown.yml`) were read in full. Every one of `ci.yml`'s 12 jobs (`check_go_mod`, `lint_markdown`, `check_source`, `debian`, `alpine`, `oldgo`, `rpmbuild-centos7`, `rpmbuild-rocky8`, `short_unit_tests`, `integration_tests`, `e2e_tests`, `check_pkg_no_buildcfg`) runs on `runs-on: ubuntu-20.04` (a standard x86_64 GitHub-hosted runner). No QEMU, no cross-arch build matrix, no riscv64 reference of any kind exists in either file. `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist in the repository.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Singularity/Apptainer is a container runtime (Go + generic POSIX C) with **no JIT, no SIMD/numerics code, and no hand-tuned assembly for any architecture** - a full repository search for `*.s` assembly files returned zero results for amd64 and arm64 as well as riscv64. This is not an optimization-purpose project; the Step 2 optimization modifier from the color-coding model does not apply.

The relevant "architecture-specific" surface is a set of small per-arch lookup tables used for ELF recognition, syscall numbering, and seccomp filtering. In `apptainer/singularity` (the frozen repo graded here), every one of these tables **excludes riscv64 entirely** - confirmed by direct source inspection:

| File | Purpose | Archs listed | riscv64 present? |
|---|---|---|---|
| `internal/pkg/util/machine/machine.go` | ELF-magic to arch recognition | 386, amd64, arm, armbe, arm64, arm64be, s390x, ppc64, ppc64le, mips, mipsle, mips64, mips64le | No - a riscv64 binary yields `ErrUnknownArch` |
| `pkg/util/namespaces/setns_linux.go` | `setnsSysNo` syscall-number map | 386, arm64, amd64, arm, ppc, ppc64, ppc64le, s390x | No - `Enter()` returns `"unsupported platform riscv64"` |
| `internal/pkg/security/seccomp/seccomp_supported.go` | OCI-spec-arch to libseccomp-arch map | x86, x86_64, x32, arm, arm64, mips (6 variants), ppc, ppc64, ppc64le, s390, s390x | No |
| `cmd/starter/c/include/setns.h` | Hand-written C `__NR_setns` syscall table (privileged starter binary) | 14 architectures including alpha, m68k, hppa, bfin | No - despite listing far more obscure legacy architectures than riscv64, which was already stable in upstream Linux since kernel 4.15 (2018) |

This is a true absence, not an unfinished stub: no `*_riscv64.go` files, no `//go:build riscv64` constraints exist anywhere in the tree (the only architecture-gated file in the whole repo is `pkg/util/fs/lock/var_linux_32bit.go`, scoped to 386/arm/mips/mipsle).

For contrast, the same tables in the live successor `apptainer/apptainer` do include riscv64 (in `internal/pkg/util/machine/machine.go` ELF detection, `internal/pkg/runtime/engine/fakeroot/engine_linux.go` seccomp arch mapping with `specs.ArchRISCV64`, `etc/seccomp-profiles/default.json` with `SCMP_ARCH_RISCV64`, and a riscv64 `setns` syscall number of 268), plus OCI arch conversion (`internal/pkg/build/oci/oci.go`) and debootstrap arch mapping. This confirms the gap is specific to the frozen snapshot being graded, not to the Apptainer codebase as a whole.

## 5. Build System, Cross-Compilation, and Toolchain

`apptainer/singularity` uses a custom `mconfig`/`make` build system (autoconf-style shell scripts), not CMake. Build commands (identical for every architecture, since the frozen repo has no per-arch configuration):
```sh
./mconfig -v -p /usr/local --with-suid   # --with-suid optional
cd builddir
make
sudo make install
```
No riscv64-specific build path, cross-compile script, or toolchain file exists in this repository.

For context, the live successor `apptainer/apptainer` does have riscv64 build infrastructure: `mlocal/checks/basechecks.chk` autodetects riscv64 via the `__riscv_xlen 64` compiler macro, and `dist/docker/Dockerfile` + `dist/docker/buildenv.sh` support `docker buildx build --platform linux/riscv64` using Debian bookworm's `crossbuild-essential-riscv64` cross-toolchain (no QEMU used for the actual binary cross-compile; QEMU is used only for `apptainer build --arch` container-image builds via binfmt_misc, and in CI to register binfmt handlers for E2E foreign-arch execution tests). The Apptainer RPM spec (`dist/rpm/apptainer.spec.in`) explicitly disables building the bundled PRoot dependency on riscv64 (`%ifnarch ppc64le s390x riscv64`), because PRoot itself lacks riscv64 support - an external tooling gap, not an Apptainer-imposed exclusion. None of this exists in `apptainer/singularity`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 (this repo) | arm64 (this repo) | riscv64 (this repo) |
|---|---|---|---|
| CI build | Yes (only target) | No | No |
| CI test | Yes | No | No |
| ELF/container arch recognition | Yes | No | No - absent from `machine.go` |
| `setns` namespace entry | Yes | No | No - explicit `"unsupported platform"` error |
| Seccomp filtering | Yes | No | No - absent from `scmpArchMap` |
| Release binaries | Yes (v3.8.7 assets) | No | No |

Because `apptainer/singularity`'s CI and release pipeline target only x86_64, there is no functional gap analysis to perform against arm64 within this repo - neither architecture beyond amd64 is supported here. There is no NaN/floating-point semantics concern: this is a container runtime with no numerics code.

## 7. CI/CD Infrastructure

**No riscv64 CI exists in `apptainer/singularity`.** Verified by directly reading the repository's only two workflow files:
- `.github/workflows/ci.yml` (238 lines) - triggers on `pull_request` and `push` (branch `master`, tags `v*.*.*`); all 12 jobs run on `runs-on: ubuntu-20.04`; zero matches for "riscv", "qemu", "arch:", "matrix", "arm64", "aarch64", or "cross" anywhere in the file.
- `.github/workflows/lockdown.yml` (17 lines) - only auto-locks newly opened issues; no riscv content, no CI/build function.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository (confirmed by both HTTP 404 against `raw.githubusercontent.com` and a full recursive filename search of a local clone). No RISE RISC-V Runners reference exists anywhere in this repo.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | No | No |
| CI test | Yes | No | No |
| CI release-blocking | Yes | N/A | N/A |
| Hardware | GitHub-hosted x86_64 runner | N/A | N/A |
| RISE runners used | No | No | No |

## 8. Distribution and Release Status

**Upstream GitHub releases (`apptainer/singularity`):** frozen at **v3.8.7** (2022). Assets: `singularity-3.8.7.tar.gz`, `.src.rpm`, `.x86_64.rpm`, `singularity-container_3.8.7_amd64.deb`, `singularity-container-dbgsym_3.8.7_amd64.deb`, `singularity-debuginfo-3.8.7-1.x86_64.rpm`, source archives. All amd64/x86_64 only; **no riscv64 assets**.

**Upstream GitHub releases (`apptainer/apptainer`, the live successor):** latest checked release v1.5.3, assets all x86_64/amd64 (rpm/deb). The project's own `release.yml` CI publishes multi-arch container images to `ghcr.io/apptainer/apptainer` for `linux/amd64,linux/arm64` only - **riscv64 is not in the upstream-published image matrix**, even though the Dockerfile/buildenv.sh support building it manually.

**PyPI:** the `singularity` PyPI package is an unrelated tool ("command line tools for visualization and analysis of singularity containers" by Vanessa Sochat) - not this container runtime. Source-only (`.tar.gz`), no wheels, no riscv64 relevance either way.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/singularity/` redirects to PyPI - no distinct riscv64 build exists there (and is not applicable, since this project is not a Python package).

**Linux distributions:**
- **Ubuntu 26.04 "resolute":** `singularity-container` version **4.1.5+ds4-1**, built for amd64, arm64, armhf, ppc64el, **riscv64**, s390x. This is the only confirmed working riscv64 binary channel.
- **Debian (sid, via debports):** `singularity-container` 3.11.0+ds1-1+b6, riscv64 build listed "via debports" - Debian's ports infrastructure for non-primary-release architectures (porter-built, community-maintained, not an official Debian release-architecture guarantee). Package notes "also provided by: apptainer."
- **Arch Linux RISC-V port:** no "singularity" entry found at all.

**What a user must do to get a working riscv64 binary today:** install `singularity-container` from Ubuntu 26.04 (resolute) universe/ports, or Debian sid via debports. There is no upstream-published riscv64 binary from either `apptainer/singularity` or `apptainer/apptainer`; a user targeting an older/stable Debian or Ubuntu release, or wanting an upstream-guaranteed build, would need to cross-compile using Apptainer's `dist/docker/Dockerfile` (`docker buildx build --platform linux/riscv64`) or build natively from source via `mconfig`/`make` on riscv64 hardware.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Go | Build-dependency (critical) - compiler/runtime for the whole codebase; `go.mod` requires 1.16 (this frozen repo), live Apptainer requires 1.26.5 minimum | linux/riscv64 first shipped experimental in Go 1.14 (Feb 2020), GA later | Mature - golang/go currently has 546 open+closed riscv64-tagged issues, active ongoing hardening | Full official release support | Large, active |
| containerd | Build-dependency (critical) - vendored Go module dependency, bumped via Dependabot in this repo (PR #6464, #6465, both closed unmerged) | containerd's own upstream release notes describe adding riscv64/ppc64le build support | N/A to Singularity directly (Dependabot bump PRs never merged into this repo) | N/A | Active, CNCF project |
| libseccomp | Test-dependency (critical) - compile-time syscall-filter backend, cgo-linked via `-lseccomp`, checked in `project-post.chk` | Merged upstream since v2.5.0 (2020-07-20) | 5,229/5,229 tests passed on real riscv64 hardware (community report, 2020-02-24) | Shipped in every release since v2.5.0; confirmed in Ubuntu 26.04 riscv64 (resolute): `libseccomp-dev 2.6.0-2ubuntu5 [ports]` | None open; mature |
| kr/pty | Runtime-dependency (optional) - pinned Go module, bumped via Dependabot (merged PR #4141, 2019-08-07, first shipped in Singularity v3.4.0) | The `kr/pty` library's own changelog notes "Add riscv64 support" - a dependency-library-level change, not Singularity code | N/A | N/A | Small, low-activity library |

Additional dependencies surfaced during recursion: **libseccomp-golang** (Go cgo binding, pinned at v0.9.1 in `go.mod`) is a latent risk - its riscv64 arch-constant support landed in commit `e947d82` (2021-09-10) and first shipped in **v0.10.0** (2022-06-09), roughly two years after the pinned v0.9.1 (2019-05-21). Rebuilding this frozen codebase for riscv64 as-is carries risk if any code path references a riscv64 arch constant that v0.9.1 does not define (related closed upstream issues: [seccomp/libseccomp-golang#52](https://github.com/seccomp/libseccomp-golang/issues/52) "RFE: add support for RISCV64", [#76](https://github.com/seccomp/libseccomp-golang/issues/76)). **squashfs-tools** and **cryptsetup** (both external binaries invoked by Singularity, not Go dependencies) are portable C with no riscv64-specific issues found, and both are confirmed shipping for riscv64 in Ubuntu 26.04 resolute (`squashfs-tools 1:4.7.5-1 [ports]`, `cryptsetup-bin 2:2.8.4-1ubuntu4 [ports]`). **ProtonMail/go-crypto** (pure-Go OpenPGP, backs SIF image signing) is architecture-agnostic with no riscv64 issues found.

For the Apptainer successor specifically, **PRoot** (a post-fork dependency, not present in this archived Singularity tree) is a documented riscv64 gap: it is excluded from riscv64 RPM builds (`dist/rpm/apptainer.spec.in`, `%ifnarch ppc64le s390x riscv64`), and a riscv64/Debian-trixie build regression traced to PRoot's bundled `arch.h` broke Apptainer 1.5.0 ([apptainer/apptainer#3488](https://github.com/apptainer/apptainer/issues/3488), fixed in 1.5.1).

## 11. Known Bugs and Active Issues

No RISC-V issues or PRs exist in `apptainer/singularity` itself - the repository is frozen and never received riscv64 work. Issues matched by keyword search were confirmed false positives on direct inspection:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [apptainer/singularity#5525](https://github.com/apptainer/singularity/issues/5525) | Cross compilation for aarch64 | Closed | N/A | False positive - about ARM64, no RISC-V content |
| [apptainer/singularity#4050](https://github.com/apptainer/singularity/issues/4050) | Singularity broken on arm64 architecture | Closed | N/A | False positive - about ARM64, no RISC-V content |
| [apptainer/singularity#5490](https://github.com/apptainer/singularity/issues/5490) | seccomp tests fail on ARM64 | Closed | N/A | False positive - about ARM64, no RISC-V content |
| [apptainer/singularity#5945](https://github.com/apptainer/singularity/issues/5945) | singularity ARM64 build Error | Closed (wontfix) | N/A | False positive - about ARM64, no RISC-V content |
| [apptainer/singularity PR #4141](https://github.com/apptainer/singularity/pull/4141) | Bump github.com/kr/pty 1.1.3 to 1.1.8 | Merged 2019-08-07 | N/A | False positive - riscv64 mention is in the bumped library's own changelog, not Singularity code |
| [apptainer/singularity PR #6464](https://github.com/apptainer/singularity/pull/6464) | build(deps): bump containerd 1.5.8 to 1.6.7 | Closed, unmerged (superseded by Dependabot removal, commits #6474/#6480) | N/A | False positive, same as above |
| [apptainer/singularity PR #6465](https://github.com/apptainer/singularity/pull/6465) | build(deps): bump containerd 1.5.8 to 1.6.8 | Closed, unmerged | N/A | False positive, same as above |

For the live successor repository (relevant context, not part of the graded repo):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [sylabs/singularity#628](https://github.com/sylabs/singularity/issues/628) | riscv64 missing in pkg/util/machine | Closed 2022-03-09 | Correctness | ELF/magic detection gap after SIF added riscv64 support |
| [apptainer/apptainer#2806](https://github.com/apptainer/apptainer/issues/2806) | Architecture riscv64 is blocked in the architecture list | Closed 2025-02-24 | Functional blocker | `--arch riscv64` hard-rejected; fixed via allowlist update |
| [apptainer/apptainer#2878](https://github.com/apptainer/apptainer/issues/2878) | Small issue with riscv architecture detection | Closed 2025-03-31 | Correctness | `__riscv` macro wrongly matched riscv32 as well as riscv64 |
| [apptainer/apptainer#3488](https://github.com/apptainer/apptainer/issues/3488) | riscv64 Debian trixie build of 1.5.0 fails, while 1.4.5 had passed | Closed 2026-05-27 | Build regression | PRoot's bundled `arch.h` rejected riscv64; fixed via PR #3518, released in 1.5.1 |

No open RISC-V issues currently exist in either repository (a `state:open` search for "riscv" returned zero hits). No floating-point/NaN correctness bug exists for RISC-V in either repo (a targeted search returned zero hits). No quantitative riscv64 performance benchmark data for Singularity/Apptainer was found anywhere (GitHub or web search); a Sylabs blog post announcing riscv64/POWER support ([sylabs.io/2022/03/riscv-and-power](https://sylabs.io/2022/03/riscv-and-power/)) exists but its content could not be retrieved (bot-check redirect blocked both `curl` and WebFetch) [NEEDS VERIFICATION].

## 12. Objections and Upstream Blockers

No stated objection to riscv64 support exists in either repository. The pattern observed is a **welcoming, contribution-driven acceptance model**: riscv64 support in Apptainer was contributed almost entirely by an independent community member (Anders F Bjorklund) and a Sylabs employee (David Trudgian), reviewed and merged by a TSC member (Dave Dykstra) through ordinary PR review - no corporate sponsorship, RISE membership, or special approval process was required. Related non-Tier-1 architectures (ppc64le, s390x) were added the same way and are consistently grouped with riscv64 in build-exclusion logic (e.g., the PRoot exclusion), suggesting the project treats new architecture ports pragmatically: accepted once code passes CI/review, with known third-party tooling gaps documented rather than blocking.

**Organizational blocker specific to the graded repository:** `apptainer/singularity` is permanently archived and will never receive riscv64 work - its own `lockdown.yml` redirects all new issues/PRs elsewhere. This is not a technical objection to RISC-V; it is a consequence of the project's 2021 rename and governance move, which predates any riscv64 interest in the ecosystem.

**Technical blocker in the live successor:** PRoot (used for unprivileged/non-setuid `--fakeroot` builds) has no riscv64 support, so Apptainer disables building it on riscv64 RPMs (same treatment as ppc64le/s390x) - practical effect: unprivileged fakeroot builds on riscv64 may not preserve original file owners/groups in SIF images. This is an external dependency gap, not an Apptainer-imposed exclusion.

**Acceptance probability for further riscv64 work:** High, based on observed pattern - RISC-V patches to Apptainer have historically been accepted through normal review with no resistance found in any issue or PR thread.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro (Ubuntu/Debian, via Debian debports/ports infrastructure) - not upstream
- **Optimization level:** not applicable (Singularity is not an optimization-purpose project; Step 2 of the color model does not apply)

**Justification:** `apptainer/singularity` (the repository graded here) has zero riscv64 CI - confirmed by directly reading its only two workflow files, `.github/workflows/ci.yml` and `.github/workflows/lockdown.yml`, neither of which contains any riscv reference, and by a full repository-wide grep returning zero matches for "riscv" anywhere in the tree. The project's successor, `apptainer/apptainer`, has functionally complete riscv64 build-system support (CHANGELOG v1.4.0, 2025-03-18: "Complete the previously partial support for the riscv64 architecture"), but its own release pipeline (`release.yml`) publishes container images only for `linux/amd64,linux/arm64` - riscv64 is absent from the upstream-published artifact matrix. The only confirmed working riscv64 binary is Ubuntu 26.04's `singularity-container` 4.1.5+ds4-1, built via Debian's debports (ports) infrastructure - a downstream-only channel whose patch status relative to vanilla upstream source was not confirmed clean in this research, so the conservative "patched/unknown -> orange" distribution floor applies per the color model.

**Pending work that could change the grade:** Apptainer's own riscv64 support is functionally wired through ELF detection, seccomp, setns, and OCI/Docker arch conversion (see Section 2), and a Docker cross-build path for `linux/riscv64` already exists in `dist/docker/Dockerfile`. If Apptainer's `release.yml` CI matrix were extended to publish `linux/riscv64` container images and binary assets, `release_provider` for the Apptainer lineage would become `upstream` and its color would rise (though this would apply to `apptainer/apptainer`, not to the permanently frozen `apptainer/singularity` repository graded in this report, whose color cannot change). No RISE Project involvement or funding for Singularity/Apptainer was found in any channel searched (blog, member list, working groups, funded RFPs).

## 14. Investment Analysis

RISE has no prior investment, funding, or involvement in Singularity or Apptainer - confirmed by searching the RISE blog (34 posts enumerated via WordPress sitemap, none reference Singularity/Apptainer), the RISE member list, all `riseproject-dev` GitHub repositories (25+ repos, none Singularity-related), and RISE's funded RFP list (RP004 Rust, RP009 LLVM SPEC, AI/Gemini credits, none touching containers/HPC runtimes). All work items below are therefore fully unclaimed.

### 14.1 Functional Enablement

No functional work is needed for the Apptainer codebase itself - riscv64 build-system, ELF detection, seccomp, setns, and OCI arch-conversion support are already complete and merged upstream (per CHANGELOG v1.4.0 and Section 2 above). The remaining functional gap is narrow: (a) PRoot lacks riscv64 support, degrading unprivileged fakeroot builds on riscv64 - either upstreaming a PRoot riscv64 port or documenting/mitigating the ownership-preservation limitation; (b) the frozen `apptainer/singularity` repository itself cannot be functionally enabled for riscv64 under any circumstance, since it accepts no further contributions.

### 14.2 Performance Optimization

Not applicable - Singularity/Apptainer is not an optimization-purpose project (no JIT, SIMD, or numerics code for any architecture). No performance optimization work is needed or possible in the sense the color model defines.

### 14.3 CI/CD Infrastructure

The concrete opportunity is extending `apptainer/apptainer`'s `release.yml` to publish `linux/riscv64` container images alongside the existing `linux/amd64,linux/arm64` targets, using the cross-build path that already exists in `dist/docker/Dockerfile`/`buildenv.sh`. This would move `release_provider` from distro to upstream for the live project. A native riscv64 test-execution CI job (rather than build-only) would also close the remaining CI gap; RISE RISC-V Runners (confirmed to exist as a service per the RISE blog, though not used by this project) could be a candidate CI backend if RISE elected to engage with the Apptainer TSC.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per instructions, as Singularity/Apptainer is a standalone container runtime with no dependent package ecosystem (no PyPI/npm/Maven consumers depend on it as a library).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream PRoot riscv64 support (or document/mitigate fakeroot ownership-preservation gap on riscv64) | 2-4 | Apptainer TSC / PRoot upstream | Medium |
| CI/CD | Extend `apptainer/apptainer` `release.yml` to publish `linux/riscv64` container images using the existing Dockerfile cross-build path | 1-2 | Apptainer TSC | High |
| CI/CD | Add a riscv64 test-execution (not build-only) CI job to `apptainer/apptainer`, potentially using RISE RISC-V Runners | 2-3 | Apptainer TSC / RISE (if engaged) | Medium |
| Functional | N/A for `apptainer/singularity` itself - repository is permanently archived and accepts no further contributions | 0 | N/A | N/A |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [apptainer/singularity GitHub repository](https://github.com/apptainer/singularity)
- [apptainer/singularity .github/workflows/ci.yml](https://github.com/apptainer/singularity/blob/master/.github/workflows/ci.yml)
- [apptainer/singularity .github/workflows/lockdown.yml](https://github.com/apptainer/singularity/blob/master/.github/workflows/lockdown.yml)
- [apptainer/singularity releases](https://github.com/apptainer/singularity/releases)
- [apptainer/apptainer GitHub repository (live successor)](https://github.com/apptainer/apptainer)
- [apptainer/apptainer releases](https://github.com/apptainer/apptainer/releases)
- [apptainer/apptainer CHANGELOG.md](https://github.com/apptainer/apptainer/blob/main/CHANGELOG.md)
- [apptainer/apptainer #2806 - riscv64 blocked in architecture list](https://github.com/apptainer/apptainer/issues/2806)
- [apptainer/apptainer #2878 - riscv architecture detection issue](https://github.com/apptainer/apptainer/issues/2878)
- [apptainer/apptainer #3488 - riscv64 Debian trixie build regression](https://github.com/apptainer/apptainer/issues/3488)
- [apptainer/apptainer dist/docker/Dockerfile](https://github.com/apptainer/apptainer/blob/main/dist/docker/Dockerfile)
- [apptainer/apptainer dist/rpm/apptainer.spec.in](https://github.com/apptainer/apptainer/blob/main/dist/rpm/apptainer.spec.in)
- [sylabs/singularity #628 - riscv64 missing in pkg/util/machine](https://github.com/sylabs/singularity/issues/628)
- [apptainer/singularity PR #4141 - bump kr/pty](https://github.com/apptainer/singularity/pull/4141)
- [apptainer/singularity PR #6464 - bump containerd (closed, unmerged)](https://github.com/apptainer/singularity/pull/6464)
- [apptainer/singularity PR #6465 - bump containerd (closed, unmerged)](https://github.com/apptainer/singularity/pull/6465)
- [Apptainer technical charter](https://apptainer.org/technical-charter)
- [Apptainer community announcement (Linux Foundation move, 2021-11-30)](https://apptainer.org/news/community-announcement-20211130)
- [Ubuntu packages search - Singularity, resolute suite](https://packages.ubuntu.com/search?keywords=Singularity&suite=resolute&searchon=names&section=all)
- [Debian package tracker - singularity-container](https://tracker.debian.org/pkg/singularity-container)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/)
- [PyPI singularity package (unrelated tool)](https://pypi.org/pypi/singularity/json)
- [RISE wheel builder index (redirects to PyPI)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/singularity/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [seccomp/libseccomp-golang #52 - RFE add support for RISCV64](https://github.com/seccomp/libseccomp-golang/issues/52)
- [seccomp/libseccomp-golang #76 - release request](https://github.com/seccomp/libseccomp-golang/issues/76)
- [Sylabs blog - RISC-V and POWER support in SingularityCE (content blocked, title/date only)](https://sylabs.io/2022/03/riscv-and-power/)