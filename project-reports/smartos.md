---
title: SmartOS
parent: Project Reports
color: orange
dependencies:
  - name: illumos-joyent
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: illumos-kvm
    relation: runtime-dependency
    criticality: critical
  - name: bhyve
    relation: runtime-dependency
    criticality: critical
---

# SmartOS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for SmartOS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="smartos" %}

## 1. Project Overview

SmartOS is an illumos-derived operating system distribution maintained by TritonDataCenter (formerly "joyent") at [github.com/TritonDataCenter/smartos-live](https://github.com/TritonDataCenter/smartos-live). It combines an illumos kernel gate (`illumos-joyent`) with a userland built from `illumos-extra` and packaged as a bootable platform image; it is the OS layer underneath Joyent's/Triton's virtualization stack, providing zone-based (container) virtualization plus KVM/bhyve hardware virtualization.

**Governance.** SmartOS has no formal foundation (no Linux Foundation, Apache, or SPI-style entity). It is governed informally through the Triton Engineering Guidelines and an RFD (Request for Discussion) process at `TritonDataCenter/rfd`. There is no MAINTAINERS/OWNERS/CODEOWNERS file and no published architecture-support tier policy document (no `PLATFORMS.md` or `SUPPORT.md` exist in the repository).

**Stewardship history.** Created by Joyent (commercialized from illumos/OpenSolaris). Joyent was acquired by Samsung in 2016. Per the project's own site, in 2022 the project moved to "independent stewardship." Copyright headers in the live repository (`Copyright 2019 Joyent, Inc.` / `Copyright 2025 MNX Cloud, Inc.`) and the dominant `@mnx.io` contributor domain confirm the current corporate steward is **MNX Cloud, Inc.**

**License.** No single top-level LICENSE file; illumos-derived kernel/userland code is traditionally CDDL, while newer ancillary files (e.g. `CONTRIBUTING.md`) are explicitly MPL-2.0 - a per-file dual-licensing pattern inherited from illumos.

**Community culture.** Community channels are informal: the *smartos-discuss* mailing list (topicbox) and `#smartos` on Libera Chat IRC, rather than a foundation with elected boards or membership tiers. Contributors are required to follow the illumos Code of Conduct. Commit-history analysis (~500 most recent commits) shows a small, steward-driven contributor base: MNX Cloud (Dan McDonald, Brian Bennett, Nahum Shalman), legacy Joyent engineers (Jerry Jelinek, Mike Gerdts, Tim Foster, John Levon, Robert Mustacchi, Cody Peter Mello), an independent contributor (Dave Eddy), and Edgecast as a secondary sponsor. No RISE-member silicon or cloud vendor (Google, NVIDIA, Qualcomm, Red Hat, Canonical, SiFive, etc.) appears in the contributor list.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64 port has ever been proposed, started, or discussed for SmartOS | Zero matches across GitHub issue, PR, and commit search for "riscv"/"riscv64" in `repo:TritonDataCenter/smartos-live` and `repo:TritonDataCenter/illumos-joyent`; zero matches in a full repository-wide grep of the cloned source tree |

**Key contributors and organizations:** see Section 1 (commit-history table). None of these contributors' activity touches riscv64 or any non-x86 architecture.

**Is it fully upstream?** Not applicable - there is no port to be upstream or out-of-tree. A separate, unrelated illumos-discuss mailing-list thread describes an abandoned RISC-V porting attempt for illumos generally (reportedly initiated by a SiFive-affiliated contributor), with no activity reported in over a year and no associated code in any TritonDataCenter repository [NEEDS VERIFICATION - single source, a mailing-list reference found via web search, not independently cross-checked against the list archive itself].

## 3. Upstream Support Tier

No formal tier policy exists (no `PLATFORMS.md`, `SUPPORT.md`, or equivalent document in the repository). Architecture support is evidenced only by build-system and CI configuration, which is uniformly x86-only.

| Axis | amd64/x86_64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel port (illumos-joyent) | Native, sole supported target | None | None |
| CI (Jenkinsfile) | Every stage pins `pkgsrc_arch:x86_64` | No stage, no runner, no token | No stage, no runner, no token |
| GitHub releases | Zero releases published for any architecture ([releases page](https://github.com/TritonDataCenter/smartos-live/releases): "There aren't any releases here") | Zero | Zero |
| Official binaries/packages | None found via researched channels | None found | None found (PyPI 404, Ubuntu 26.04 "no results", RISE wheel-builder proxy 404) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

SmartOS is an OS distribution, not a JIT/SIMD library, so most of the standard per-component categories (JIT compiler, vectorized math kernels) do not apply at this layer. The architecture-relevant subsystems identified in research are:

| Component | Role | riscv64 status | Quality/notes |
|---|---|---|---|
| illumos kernel (arch tree) | Core OS, only targets `uts/intel/...` driver/arch paths per README | Missing - no `arch/riscv` or equivalent tree exists | Build tooling (`configure`, `default.configure-build`) is hard-coded to `i386`/`amd64` binaries (e.g. `on-closed-bin.i386.tar.bz2`, `root_i386-nd`); no architecture abstraction for a second ISA |
| illumos-kvm | Runtime dependency; kernel module wrapping Intel VT-x/AMD-V ioctls for hardware-virtualized VMs | Architecturally exclusive to x86 - no RISC-V hypervisor-extension (H-extension) equivalent implemented | Not a "missing port," but an x86-specific design (grey/arch-exclusive by nature) |
| bhyve | Runtime dependency, vendored under `src/bhyve`; same VT-x/AMD-V hardware-virtualization coupling as illumos-kvm | Same as above - arch-exclusive | Same as above |
| illumos-kvm-cmd (QEMU fork) | Device emulation for illumos-kvm-backed VMs; a legacy Joyent fork of an old QEMU tree, not current upstream QEMU | Coupled to illumos-kvm/x86 KVM ioctls; distinct from upstream QEMU's own (partial) riscv64 TCG backend | Upstream QEMU has separate, more mature riscv64 support, but SmartOS's actual dependency is this x86-coupled fork |
| Crypto/TLS (OpenSSL, bundled via illumos-extra) | TLS for the platform | See dependency deep-dive, Section 9 | Rated green/blue independently in `project-reports/openssl.md`; irrelevant while the kernel itself has no port |

No `arch/riscv/` directory, no riscv `.S` assembly files, and no RVV/Zba/Zbb intrinsics exist anywhere in `smartos-live` (repo-wide case-insensitive grep for `riscv`, `RISCV`, `RISC-V`, `zba`, `zbb`: zero matches at commit `148c3689faede56d529a44469fdb989d24b29aa1`). An identical grep for `aarch64`/`arm64` also returned zero matches, confirming arm64 is equally absent - riscv64 is not singled out for exclusion, the whole codebase is x86-only.

## 5. Build System, Cross-Compilation, and Toolchain

SmartOS is not CMake-based. No `CMakeLists.txt` exists anywhere in the tree. The real build system is an illumos `nightly(1ONBLD)`-driven `gmake`/`dmake` pipeline, and per `README.md`, SmartOS must be built **on SmartOS itself**, inside a `joyent`-branded non-global zone - not via Docker, and not via QEMU cross-compilation:

```
git clone https://github.com/TritonDataCenter/smartos-live
cd smartos-live
./configure
gmake world   # build components
gmake live    # assemble platform image
```

No `BUILDING.md`, `docs/building.md`, or `docs/cross-compilation.md` exists (the `docs/` directory contains only `dev-upgrade.md`). No `Dockerfile` for any architecture was found in the repository (the only Docker-adjacent code is `src/dockerinit`, a SmartOS Docker-*support* component, not a build Dockerfile).

Data not available: no riscv64 toolchain/GCC/Clang minimum-version requirement is documented anywhere in the repository, because no riscv64 build path exists to document one for. No QEMU cross-build usage for building SmartOS itself was found (QEMU appears only as `illumos-kvm-cmd`, an in-guest device-emulation dependency, not a cross-compilation tool).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Boots at all | Yes | No | No |
| Zones (container virtualization) | Yes | No | No |
| KVM guests (illumos-kvm) | Yes | No | No (also architecturally inapplicable - VT-x/AMD-V coupled) |
| bhyve guests | Yes | No | No (also architecturally inapplicable) |
| Platform image release | N/A - zero GitHub releases exist for any architecture | N/A | N/A |

**Functional gap:** total - there is no bootable riscv64 SmartOS image, so no functionality is available on riscv64 at any level.

**Performance gap:** not assessable; no port exists to benchmark. No SmartOS-specific riscv64-vs-arm64/amd64 benchmark data was found via GitHub issue search, `riseproject.dev` blog scan (34 posts checked), or general web search.

**Security hardening gap:** Data not available - no riscv64 build exists against which to assess hardening (ASLR, stack protection, etc.).

**NaN/floating-point semantics:** Data not available: no floating-point or NaN-semantics issues were identified in research (GitHub issue search for "riscv nan floating" returned zero results), and this class of defect is not applicable at the OS-distribution level absent an actual port to test against.

## 7. CI/CD Infrastructure

`TritonDataCenter/smartos-live` has no `.github/workflows` directory (confirmed both via GitHub API - blocked by session scope - and directly on the local clone: `ls .github/workflows` -> "No such file or directory"; the `.github` directory itself does not exist). No `.gitlab-ci.yml` or `.cirrus.yml` exists either.

The only CI configuration in the repository is a [Jenkinsfile](https://github.com/TritonDataCenter/smartos-live/blob/master/Jenkinsfile) (16,600 bytes, read in full). It defines stages `check`, `default`, `debug`, `gcc14`, and `strap-cache`. Every stage's agent `label` pins `pkgsrc_arch:x86_64` explicitly, e.g.:

```
label 'platform:true && image_ver:24.4.1 && ' +
'pkgsrc_arch:x86_64 && (dram:16gb || dram:32gb ) && ' + ...
```

This exact pattern repeats identically across all five stages. No stage's label selector contains `riscv`, `riscv64`, or any non-x86_64 `pkgsrc_arch` value. There is no QEMU step, no cross-arch emulation, and no separate riscv64 trigger. Triggers are `branch 'master'` or manual (`triggeredBy cause: 'UserIdCause'`).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (`pkgsrc_arch:x86_64` runner, all 5 stages) | No | No |
| CI test | Yes (within the pinned x86_64 stages) | No | No |
| RISE runners used | No | No | No |
| Hardware | Jenkins agent, `pkgsrc_arch:x86_64`, `dram:16gb`/`32gb` | N/A | N/A |

## 8. Distribution and Release Status

- **GitHub releases:** `TritonDataCenter/smartos-live` has zero published releases of any kind, for any architecture (confirmed via the [releases page](https://github.com/TritonDataCenter/smartos-live/releases): "There aren't any releases here"). There are therefore no release assets to check for a `riscv64` filename.
- **PyPI:** No `smartos` package exists ([pypi.org/pypi/smartos/json](https://pypi.org/pypi/smartos/json) returns HTTP 404).
- **RISE Python wheel builder:** The [RISE GitLab wheel-builder proxy](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/smartos/) redirects to `pypi.org/simple/smartos/`, which also returns HTTP 404.
- **Ubuntu 26.04 (resolute):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=SmartOS&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - no SmartOS package exists in Ubuntu for any architecture, so riscv64-specific availability is moot.
- **Arch Linux RISC-V (archriscv):** No `smartos` package listed [NEEDS VERIFICATION - the archriscv site's search mechanism could not be positively confirmed to function via WebFetch, so this is a weak negative, not a hard 404].

Data not available: SmartOS's own primary distribution channel (its own [smartos.org](https://smartos.org/) download/update mechanism, distinct from GitHub releases) was not directly checked in this research pass. Given zero GitHub releases exist and no PyPI/distro packages exist, this is unlikely to change the conclusion, but it was not independently verified and should be treated as an open item.

**What would a user need to do to get a working riscv64 binary today?** Nothing is available through any channel checked. A working riscv64 SmartOS image does not exist; obtaining one would first require a from-scratch riscv64 port of the illumos-joyent kernel and the entire x86-hardcoded build system (Section 5), which has not been started.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| illumos-joyent | Build-dependency, critical - the kernel gate SmartOS builds on | Red - no riscv64 port exists | Red | Red | No active riscv64 port effort found; only a stalled, code-less illumos-discuss mailing-list thread [NEEDS VERIFICATION] |
| GCC | Build-dependency, critical - compiler toolchain (illumos-extra vendors GCC 14.2.0-il-1, GCC 10, GCC 7 for bootstrap/host-tool builds) | Green upstream (riscv64 is a GCC tier-1/primary target) | Green upstream | Green upstream | Vendored illumos-specific patch sets are unrelated to riscv64; SmartOS's own build system does not invoke GCC in a riscv64-targeted configuration regardless of upstream GCC's own riscv64 maturity |
| illumos-kvm | Runtime-dependency, critical - hardware-virtualization kernel module | Grey (architecture-exclusive) - wraps Intel VT-x/AMD-V ioctls; no RISC-V H-extension equivalent implemented | N/A | N/A | Out of scope for a riscv64 port regardless of kernel status; this is a by-design x86 coupling, not a missing port |
| bhyve | Runtime-dependency, critical - hypervisor, vendored under `src/bhyve` | Grey (architecture-exclusive) - same VT-x/AMD-V coupling | N/A | N/A | Same as illumos-kvm |
| OpenSSL 3.5.8 (`openssl3`, illumos-extra; also OpenSSL 1.0.2u as `openssl1x`) | TLS/crypto for the platform | Green | Green (minor gaps noted) | Green | See `project-reports/openssl.md`: ~63/65 OpenSSL-family Ubuntu 24.04 packages support riscv64; core `openssl` package supports riscv64 |
| zlib 1.3.1 (`libz`, illumos-extra) | Compression, used by OpenSSL/TLS and elsewhere | Green | Green | Green | See `project-reports/zlib.md` |
| GNU Binutils 2.34 (illumos-extra) | Assembler/linker for the whole build | Green (mainline riscv64 support is mature) | Green | Green | Vendored version predates Zvk vector-crypto-extension support (needs >=2.38 per `project-reports/openssl.md`); not itself a blocker |
| QEMU / illumos-kvm-cmd | Device emulation for illumos-kvm-backed VMs (Joyent-forked legacy QEMU tree) | Yellow for upstream QEMU generally (TCG riscv64 backend has partial feature coverage vs x86_64/aarch64); not applicable to SmartOS's actual x86-coupled fork | Yellow upstream / N/A for the fork | Yellow upstream / N/A for the fork | See `project-reports/qemu.md`; SmartOS's actual dependency is distinct from and narrower than mainline upstream QEMU |
| Node.js v0.10.26 (bundled, `node.js` in illumos-extra) | Build-time JS interpreter used by the smartos-live/illumos-extra build tooling (not current Node.js) | Red for this vendored version - its bundled V8 (~3.x era) predates riscv64 support in V8 entirely (V8's riscv64 backend landed circa 2021+) | Red | Red | SmartOS-specific finding: even after a hypothetical illumos riscv64 port, this ancient bundled build-time interpreter would independently need replacing |
| bzip2 (illumos-extra) | Compression utility/lib shipped in the platform image | Green | Yellow (no upstream riscv64 CI; Debian buildd is the only automated validation) | Green (Debian riscv64 builds pass) | See `project-reports/bzip2.md` |
| xz / liblzma (illumos-extra) | Compression utility/lib shipped in the platform image | See `project-reports/xz.md` | - | - | - |
| libxml2 2.13.8 (illumos-extra) | XML parsing for platform tooling | See `project-reports/libxml2.md` | - | - | - |
| libidn/libidn2, libexpat, ncurses, uuid, dialog, gnupg, screen, socat, rsync, perl, curl, bash, coreutils, vim, less, wget, ntp, openssh, openldap, uefi-edk2, etc. (illumos-extra manifest) | Platform userland utilities | Not individually researched in this pass | - | - | Screened out as non-critical (no JIT/SIMD/crypto/numerics characteristics) per research scope |

**Dominant blocker (applies above every row):** illumos-joyent - the kernel SmartOS is built on - has no riscv64 port at all, and no `illumos`/`illumos-gate` project report exists to corroborate against. Every other dependency is secondary: none of them unblock SmartOS on riscv64 while the kernel itself has zero port, and two (illumos-kvm, bhyve) are independently architecture-coupled regardless of any future kernel port.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | - | - | - | No open or closed issues, PRs, or commits referencing "riscv" or "riscv64" exist in `TritonDataCenter/smartos-live` or `TritonDataCenter/illumos-joyent`. Confirmed via `mcp__github__search_issues`, `search_pull_requests`, and `search_code` (`{"total_count":0}` for all three), plus a repo-wide grep returning zero matches. |

No correctness bugs specific to riscv64 exist because no riscv64 code path exists to contain one.

## 12. Objections and Upstream Blockers

**Technical blockers:**
- illumos-joyent (the kernel) has no riscv64 port; this is the foundational blocker that makes every downstream question moot.
- The build system is hard-coded to x86 (`i386`/`amd64` binary tarballs referenced directly in `configure`/`default.configure-build`), with no architecture abstraction layer for a second ISA.
- illumos-kvm and bhyve, both critical runtime dependencies, are architecturally coupled to Intel VT-x/AMD-V and have no RISC-V hypervisor-extension equivalent implemented anywhere - these would need new implementations, not ports, even after a kernel port existed.
- The build-time-only bundled Node.js v0.10.26 (with a pre-riscv64 V8) would independently need replacing.

**Organizational blockers:**
- No formal architecture-support tier policy exists, so there is no documented process by which a new port would even be evaluated or accepted.
- SmartOS/TritonDataCenter/MNX Cloud does not appear in RISE Project's Premier or General member list ([riseproject.dev/members/](https://riseproject.dev/members/)), and no RISE blog post ([riseproject.dev/blog](https://riseproject.dev/blog)) mentions SmartOS - there is no RISE funding, tooling, or CI-runner engagement with this project.
- Governance is informal and steward-driven (MNX Cloud, Inc., plus a handful of ex-Joyent engineers and Edgecast); no evidence of engagement with any RISC-V ecosystem body.
- The one adjacent porting effort found - an illumos-wide (not SmartOS-specific) RISC-V initiative reportedly started by a SiFive-affiliated engineer on the illumos-discuss mailing list - has been stalled for over a year with no associated code [NEEDS VERIFICATION - single mailing-list-adjacent source].

**Acceptance probability:** Effectively zero in the near term. No riscv64 work exists at the SmartOS layer, and the far larger prerequisite - a functional illumos-joyent riscv64 kernel port - has not been started by anyone with public visibility. Any SmartOS-level investment is premature until that kernel-level blocker is resolved.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI; no distribution or third-party release channel exists to apply a distribution floor)
- **Release provider:** none - zero GitHub releases exist for any architecture, no PyPI package, no distro package, no RISE-hosted artifact.
- Not an optimization-purpose project (SmartOS is a full OS distribution, not a library or runtime whose value proposition is algorithmic speed); the optimization-level modifier does not apply and is omitted from the header per the color-coding skill's rules.
- **Justification:** SmartOS's only CI system (a [Jenkinsfile](https://github.com/TritonDataCenter/smartos-live/blob/master/Jenkinsfile)) pins every pipeline stage to `pkgsrc_arch:x86_64` with no riscv64 runner, trigger, or QEMU step, and the project has zero published GitHub releases for any architecture at all ([releases page](https://github.com/TritonDataCenter/smartos-live/releases)). No Linux distribution ships a `SmartOS` package to apply a distribution floor (Ubuntu 26.04 search returns no results), so the color stays at the base "no upstream riscv64 CI" orange rather than being upgraded by a distro build or downgraded to red (no confirmed breakage exists because no port has ever been attempted) or reduced to grey (this is not an unknown-unknown; extensive positive evidence - zero issues/PRs/commits, x86-only CI, x86-only build tooling, zero releases - confirms the absent state rather than leaving it undetermined).
- **Pending work that could change the grade:** None identified. No open PRs, draft branches, or tracking issues for a riscv64 port exist in `TritonDataCenter/smartos-live` or `TritonDataCenter/illumos-joyent`, and RISE has no recorded involvement with SmartOS. The single mailing-list-adjacent illumos-wide RISC-V porting mention is stalled and carries no public code [NEEDS VERIFICATION].

## 14. Investment Analysis

Before sizing work: RISE has funded no work touching SmartOS (Section 12) - there is nothing already covered to net out of the estimates below. All figures are order-of-magnitude engineering-judgment estimates for scoping purposes, not benchmarked data; no comparable illumos-port effort's actual timeline was found in research to calibrate against, so treat these as directional only.

### 14.1 Functional Enablement

The critical-path prerequisite is a riscv64 port of the illumos-joyent kernel gate itself - out of scope of the `smartos-live` repository proper, but the blocking dependency for everything SmartOS-level. This includes a new MMU/trap/interrupt layer, a port of the boot loader chain, driver-framework adaptation, and validation that zones (the primary virtualization mechanism) function correctly. Only after that would SmartOS-level build-system work (removing the x86-only hardcoding in `configure`/`default.configure-build`) become meaningful. illumos-kvm and bhyve would separately require new RISC-V hypervisor-extension-based implementations, not ports, since no equivalent code path exists to adapt.

### 14.2 Performance Optimization

Not applicable until functional enablement exists. No riscv64 boot capability means no performance baseline to optimize against.

### 14.3 CI/CD Infrastructure

Once a functional port exists, riscv64 stages would need to be added to the Jenkinsfile (or a modern CI system, since none of the requested `.github/workflows`/`.gitlab-ci.yml`/`.cirrus.yml` exist today), mirroring the existing x86_64 `check`/`default`/`debug`/`gcc14`/`strap-cache` stages, including sourcing riscv64 build hardware or RISE-provided runners (SmartOS currently has no relationship with RISE's runner infrastructure).

### 14.4 Ecosystem Enablement

Not applicable - SmartOS is an OS distribution, not a package-ecosystem host in the sense this report category addresses (no dependent Python/npm/Maven/Kubernetes-operator ecosystem was identified that requires separate riscv64 enablement).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Port illumos-joyent kernel to riscv64 (MMU/trap/boot/driver framework) | 100+ (multi-year, multi-engineer effort; order-of-magnitude estimate, not sourced from any project data) | illumos/TritonDataCenter kernel engineering | Critical (blocks everything) |
| Functional | Remove x86-only hardcoding from smartos-live build system (`configure`, `default.configure-build`) once kernel port exists | 8-12 | Triton build engineering | Critical (dependent on kernel port) |
| Functional | New RISC-V hypervisor-extension-based implementation for illumos-kvm | 20-30 | Kernel/virtualization engineering | High (dependent on kernel port) |
| Functional | New RISC-V hypervisor-extension-based implementation for bhyve | 20-30 | Kernel/virtualization engineering | High (dependent on kernel port) |
| Functional | Replace vendored Node.js v0.10.26 build-time interpreter (pre-riscv64 V8) | 1-2 | Build tooling | Medium (independent, small effort) |
| CI/CD | Add riscv64 Jenkins stage(s) mirroring existing x86_64 stages; source riscv64 build hardware or RISE runners | 2-4 | Triton build/release engineering | Medium (dependent on kernel port) |
| Release | Establish a riscv64 release channel (none exists for any architecture today) | 2-3 | Triton release engineering | Low (dependent on all of the above) |

## 15. Updates

No updates yet - initial report dated 2026-09-11.

## 16. References

- [TritonDataCenter/smartos-live repository](https://github.com/TritonDataCenter/smartos-live)
- [SmartOS homepage](https://smartos.org/)
- [smartos-live Jenkinsfile](https://github.com/TritonDataCenter/smartos-live/blob/master/Jenkinsfile)
- [smartos-live GitHub releases page](https://github.com/TritonDataCenter/smartos-live/releases) - "There aren't any releases here"
- [PyPI JSON API for "smartos"](https://pypi.org/pypi/smartos/json) - HTTP 404
- [RISE GitLab PyPI wheel-builder proxy for "smartos"](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/smartos/) - redirects to PyPI, also 404
- [Ubuntu 26.04 (resolute) package search for "SmartOS"](https://packages.ubuntu.com/search?keywords=SmartOS&suite=resolute&searchon=names&section=all) - no results
- [Arch Linux RISC-V package tracker](https://archriscv.felixc.at/) - no `smartos` package found [NEEDS VERIFICATION]
- [RISE Project members](https://riseproject.dev/members/) - SmartOS/TritonDataCenter/MNX Cloud not listed
- [RISE Project blog](https://riseproject.dev/blog) - all 34 posts scanned via sitemap, none reference SmartOS
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) - SmartOS not mentioned
- `project-reports/openssl.md` - OpenSSL riscv64 status (dependency deep-dive)
- `project-reports/zlib.md` - zlib riscv64 status (dependency deep-dive)
- `project-reports/qemu.md` - QEMU riscv64 status (dependency deep-dive)
- `project-reports/bzip2.md` - bzip2 riscv64 status (dependency deep-dive)
- `project-reports/xz.md` - xz/liblzma riscv64 status (dependency deep-dive)
- `project-reports/libxml2.md` - libxml2 riscv64 status (dependency deep-dive)
- GitHub code/issue/PR/commit search (`mcp__github__search_issues`, `search_pull_requests`, `search_code`, `search_commits`) for `riscv`/`riscv64` scoped to `TritonDataCenter/smartos-live` and `TritonDataCenter/illumos-joyent` - all zero results
- Repository-wide grep for `riscv`/`RISCV`/`RISC-V`/`zba`/`zbb` across cloned `smartos-live` at commit `148c3689faede56d529a44469fdb989d24b29aa1` - zero matches