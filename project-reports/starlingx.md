---
title: StarlingX
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="starlingx" %}

# StarlingX

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for StarlingX<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

StarlingX is an edge-cloud/telco infrastructure platform (OpenStack-based virtualization and container orchestration for distributed edge sites), maintained under the [OpenInfra Foundation](https://www.starlingx.io/) using the same Board + Technical Steering Committee (TSC) governance model as OpenStack. The `starlingx/config` repository specifically implements Sysinv (system inventory) and Puppet-based configuration management for the platform; it is a Debian-packaged Python/OpenStack-style service, not a compiled runtime or library.

Governance: 5-member elected TSC, staggered 6-month terms, max 2 seats per organization, simple majority for routine decisions and 2/3 supermajority for governance or sub-project structural changes. Leadership is tracked centrally in `starlingx/governance` docs rather than per-repo `MAINTAINERS`/`CODEOWNERS` files. License is Apache 2.0.

Corporate sponsors (from [starlingx.io/supporters](https://www.starlingx.io/)): Platinum tier is Ant Group, Ericsson, Huawei, and Wind River; Gold tier includes Bloomberg, Canonical, China Mobile, China Telecom, China Unicom, Cleura, Deutsche Telekom, H3C, Red Hat, and ZTE; Silver tier includes AMD, Fujitsu, OVHcloud, and roughly two dozen others. Wind River is the dominant code contributor by a wide margin: a sample of the last 200 commits to `starlingx/config` shows essentially all named-author commits from `@windriver.com` addresses, consistent with StarlingX having been spun out of Wind River Titanium Cloud.

New feature work, including architecture ports, goes through a standard TSC-reviewed spec process merged via Gerrit into `starlingx/specs`. No governance text singles out a distinct "new hardware port" policy or a tier/whitelist for architectures. The one completed non-x86 port to date, Arm64, followed this generic spec path and succeeded because a sponsor (Arm Ltd.) supplied both engineering effort and hardware (HPE ProLiant RL300 Gen11 / Ampere Altra servers) for native builds. This indicates the community is receptive to new architecture ports when a sponsor funds the work, but does not self-generate them.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-08-04 (last update) | Arm64 enablement spec "StarlingX: Enablement on Arm Platform" approved for stx-9.0, authored by Jackie Huang and Tianyu Li; Arm Ltd. donated Ampere Altra hardware for native (non-cross-compiled) builds | [docs.starlingx.io Arm enablement spec](https://docs.starlingx.io/specs/specs/stx-9.0/approved/starlingx-2010739-enablement-on-Arm-platform.html) |
| 2026-04 (approx.) | `starlingx/virt` upversions QEMU to 10.0.8 for Debian Trixie; the Debian package split now includes a `qemu-system-riscv` sub-package, meaning StarlingX's bundled QEMU can emulate RISC-V *guest* VMs. This is unrelated to porting the StarlingX host platform to riscv64 hardware. | `starlingx/virt` commit `77ab255b` (Wind River author, Caique Bohlhalter de Souza) |
| No date found | `starlingx/kernel` patch `0007-defines-Keep-only-x86-amd64-architecture.patch` explicitly deletes the `[[kernelarch]] name = 'riscv'` stanza from the kernel-wedge build-layer configuration, with the commit message: "StarlingX only targets amd64, so building libc-dev-cross packages for alpha, arc, arm, arm64, mips, powerpc, riscv, s390, sh, sparc etc. is unnecessary and wastes build time." | `starlingx/kernel` repository |

**Key contributors:** No RISC-V-specific contributors exist because no RISC-V port has been proposed or attempted. The Arm64 precedent's named authors (Jackie Huang, Tianyu Li) worked under Arm Ltd. sponsorship.

**Is it fully upstream?** There is no riscv64 port to be upstream or not. `starlingx/config` and the wider `starlingx` GitHub organization contain zero riscv64-authored code, zero tracking issues, zero pull requests, zero commits, and zero specs referencing RISC-V, confirmed by exhaustive GitHub search (`search_issues`, `search_pull_requests`, `search_commits`, `search_code`) across `starlingx/config`, `starlingx/kernel`, `starlingx/integ`, `starlingx/root`, `starlingx/tools`, and org-wide queries. The only StarlingX-authored artifact containing the string "riscv" is the kernel patch above, which actively removes riscv from build targets.

## 3. Upstream Support Tier

No formal tier policy exists differentiating architectures; all architecture support proceeds through the generic TSC spec-approval process (see Section 1). In practice, evidence-based tiers are:

| Architecture | CI builds | CI tests | Upstream release/binary | In-tree code footprint | Status |
|---|---|---|---|---|---|
| amd64 | Yes (`.zuul.yaml`, sole active build target) | Yes | Yes (Debian/ISO builds) | Sole default target across the codebase | Fully supported, exclusively |
| arm64 | No riscv-style CI job found; effort is at spec/hardware-donation stage | Not found | Not found | 0 arch-specific code hits in `starlingx/config` (`search_code: arm64 repo:starlingx/config` returned 0 results) | Approved spec (stx-9.0), not yet implemented in-tree per this search |
| riscv64 | None. No `.github/workflows` (does not exist), no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml`. `.zuul.yaml` (20,412 bytes, the actual CI system) contains zero riscv/riscv64/RISCV references, confirmed via full-repo grep at commit `fafc0e90b4fecd76592f5a94295cf63a5f77c332` | No | No releases published at all ([github.com/starlingx/config/releases](https://github.com/starlingx/config/releases) states "There aren't any releases here") | 0 authored lines anywhere in the org; one patch explicitly removes riscv build support | Not supported |

## 4. Technical Architecture and RISC-V-Specific Subsystems

`starlingx/config` is a Python/OpenStack-style Debian-packaged configuration-management service (Sysinv, Puppet manifests). It has no JIT, no SIMD kernels, no hand-written assembly, and no GC. It operates entirely above the hardware-architecture layer; the repository contains no `.S` files, no `arch/` directory, and no ISA-conditional code of any kind.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture-specific source files | 0 (none needed; pure Python/config templating) | 0 (`search_code: arm64 repo:starlingx/config` = 0 results) | 0 (`search_code: riscv64 repo:starlingx/config` = 0 results) |
| `#ifdef` / architecture guards | None found | None found | None found (`search_code: "#ifdef __riscv" repo:starlingx/config` = 0 results) |
| Hardware string literals in test fixtures | 4 hits (e.g. `"5.10.0-6-amd64"`), used only as test data, not conditional code | Not checked | Not applicable |

Because `config` carries no architecture-specific subsystem, RISC-V enablement work for StarlingX (if pursued) would concentrate in lower layers not covered by this repository, e.g. `starlingx/kernel`, `starlingx/integ` (Ceph, GRUB packaging), and ISO/installer build tooling in `starlingx/root` / `starlingx/tools` - none of which currently contain authored riscv64 code either (see Section 2).

## 5. Build System, Cross-Compilation, and Toolchain

`starlingx/config` has no `CMakeLists.txt`, no `cmake/` directory, and no `BUILDING.md` / `docs/cross-compilation.md`. It builds exclusively via Debian packaging: `debian_build_layer.cfg`, `debian_bullseye_pkg_dirs_std`, `debian_trixie_pkg_dirs_std`, and per-component `debian/*/deb_folder/control` files. The only Dockerfile in the repository (`tools/docker/images/Dockerfile`) is a trivial 4-line `FROM centos` / netcat utility image unrelated to cross-compilation.

Verified directly against a fresh clone of `starlingx/config`, `starlingx/root`, and `starlingx/tools`: no `cmake/riscv64.cmake`, no `Dockerfile.riscv64`, no toolchain/GCC/Clang version documentation for riscv64, and no `-DUSE_X=OFF`-style riscv64 build flags exist anywhere in these three repositories.

**QEMU usage:** StarlingX bundles QEMU (via `starlingx/virt`) as a runtime component for guest VM virtualization, not as a cross-build tool for the host platform itself. The Trixie-track QEMU 10.0.8 packaging split now includes a `qemu-system-riscv` sub-package, meaning StarlingX-hosted VMs could theoretically run riscv64 guest images, but this is orthogonal to running the StarlingX host stack on riscv64 hardware.

**Known build failures:** Data not available: no riscv64 build attempt (successful or failed) for `starlingx/config` itself was found in any searched source.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Boots/runs StarlingX host platform | Yes (sole target) | Not yet implemented in-tree (spec-stage) | No |
| Native package build (Debian) | Yes | Not confirmed in-tree | No package, no build |
| CI validation | Yes (Zuul) | Not found in `.zuul.yaml` | None |
| Published release artifact | Yes | Not confirmed | None (zero GitHub releases at all; no PyPI package; not in Ubuntu or Arch RISC-V) |

**Functional gaps:** riscv64 cannot run any part of StarlingX; there is no build target, no package, and no binary. This is a complete gap, not a partial one.

**Performance gaps:** Not applicable; there is no riscv64 build to benchmark. No SIMD/vectorization code exists in `config` for any architecture, so no architecture-specific performance delta would apply even if a port existed.

**Security hardening gaps:** Data not available: no riscv64-specific hardening (or lack thereof) could be assessed since no riscv64 build exists.

**NaN / floating-point semantics issues:** Data not available: `config` is a configuration-management service with no numeric/floating-point-sensitive code paths identified in this research; not applicable to this repository's function.

## 7. CI/CD Infrastructure

StarlingX uses OpenStack Zuul (`.zuul.yaml`) as its CI system, not GitHub Actions, GitLab CI, Jenkins, or Cirrus. Confirmed absent: `.github/workflows/` (no `.github` directory exists at all), `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`. The present `.zuul.yaml` (20,412 bytes) was read in full and contains zero riscv/riscv64/RISCV references. This was independently re-verified via a fresh, origin-verified clone at commit `fafc0e90b4fecd76592f5a94295cf63a5f77c332`, using a full-repository `git grep -ni "riscv"` across all tracked files (source, docs, CI config, Debian control files), which returned zero matches.

No RISE RISC-V Runners usage was found: StarlingX does not appear in the `riseproject-dev` GitHub organization's 25 repositories, the RISE blog, or the [RISE RISC-V Runners site](https://riscv-runners.riseproject.dev/).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI system | Zuul (`.zuul.yaml`) | Not found in `.zuul.yaml` | None |
| Builds | Yes | Not confirmed | No |
| Tests | Yes | Not confirmed | No |
| Hardware | Standard CI infra | Arm Ltd.-donated Ampere Altra (per spec) | None; no RISE runner usage found |

## 8. Distribution and Release Status

- **GitHub releases (`starlingx/config`):** Zero published releases of any kind. [github.com/starlingx/config/releases](https://github.com/starlingx/config/releases) states "There aren't any releases here" - so there are zero release assets, meaning no riscv64 (or any-architecture) filenames to check.
- **PyPI:** No package named `starlingx` is registered. [pypi.org/pypi/starlingx/json](https://pypi.org/pypi/starlingx/json) returns HTTP 404, confirmed via two independent fetches.
- **RISE GitLab wheel builder:** Queried at [gitlab.com/api/v4/.../packages/pypi/simple/starlingx/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/starlingx/); redirects to the same nonexistent PyPI entry (404).
- **Ubuntu packages:** Searched [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=StarlingX&suite=resolute&searchon=names&section=all) for suite `resolute` (26.04) and for `suite=all`; both return "Sorry, your search gave no results" for the name `StarlingX`, across every architecture including riscv64. StarlingX is not packaged in Ubuntu at all, on any architecture.
- **Arch Linux RISC-V port:** Checked [archriscv.felixc.at/?q=starlingx](https://archriscv.felixc.at/?q=starlingx); no listing found.
- **Fedora, Debian:** Not checked in this research pass. Data not available.

**What a user must do to get a working binary:** There is none to get. StarlingX is distributed as ISOs, container images, and OpenStack-style Debian packages built entirely for x86_64 (with an in-progress arm64 spec); no channel checked (GitHub releases, PyPI, RISE wheel builder, Ubuntu, Arch RISC-V) offers a riscv64 artifact.

## 9. Dependencies

| Dependency | Role | Dependency type | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| cryptography | TLS/crypto (OpenSSL+Rust bindings), used directly and via paramiko/oslo.* | Build, critical | Found in Ubuntu 26.04 riscv64 (`resolute`, `python3-cryptography`); builds from source. Known OOM-kill risk on memory-constrained riscv64 build hosts during `cargo rustc` | No riscv64-specific test failures found | No official riscv64 wheel on PyPI (latest 50.0.1 has zero riscv64 files among 46 wheels); StarlingX consumes it via `.deb`, not PyPI, so not blocked for Debian-based builds | [pyca/cryptography#8640](https://github.com/pyca/cryptography/issues/8640) (OOM on riscv64 build, closed stale); [pyca/cryptography#14460](https://github.com/pyca/cryptography/issues/14460) (request for linux_riscv64 PyPI wheel, closed but wheels still absent) |
| greenlet | Low-level stack-switch primitive under `eventlet`, core to sysinv/cgts-client async I/O | Build, critical | Found in Ubuntu 26.04 riscv64 (`python3-greenlet` 3.3.2-1). History of breakage: build failure in 3.0.3 (invalid register `s0` in `switch_riscv_unix.h`), full regression/segfault in 3.2.0 | [greenlet#403](https://github.com/python-greenlet/greenlet/issues/403) "on riscv64 some unit tests fail" (closed) | Now ships official riscv64 PyPI wheels (latest 3.5.5, `manylinux_2_39_riscv64`, cp310-cp315) | [greenlet#395](https://github.com/python-greenlet/greenlet/issues/395) (3.0.3 riscv64/ppc64el build failure); [greenlet#443](https://github.com/python-greenlet/greenlet/issues/443) (3.2.0 riscv64 regression, introduced by riscv32-support PR #439, fixed by revert in [PR #444](https://github.com/python-greenlet/greenlet/pull/444)). StarlingX's Trixie-track `requirements-trixie.txt` pins `greenlet>=3.5`, past the known regressions |
| lxml | XML/XSLT templating, binds libxml2/libxslt | Build, critical | Found in Ubuntu 26.04 riscv64 (`python3-lxml` 6.0.2-1build1) | No riscv64 issues found on the lxml tracker | PyPI ships riscv64 wheels broadly (manylinux + musllinux, cp39-cp315) for latest 6.1.3 | None found |
| psycopg | PostgreSQL DB driver for sysinv/controllerconfig | Runtime, critical | StarlingX actually depends on the older `psycopg2-binary`, not `psycopg` (v3); found in Ubuntu 26.04 riscv64 (`python3-psycopg2` 2.9.11-1build1) | No riscv64 issues found on the psycopg2 tracker | PyPI ships riscv64 wheels for latest psycopg2 2.9.13 | A stored `project-reports/psycopg.md` (referenced in research) covers psycopg v3, a related but separate codebase from the psycopg2-binary that StarlingX actually uses; treat as a discrepancy if that report is consulted for StarlingX |
| QEMU | Guest-VM virtualization component bundled via `starlingx/virt` | Runtime, critical | `starlingx/virt` upversioned QEMU to 10.0.8 for Debian Trixie; the Debian packaging split now includes `qemu-system-riscv`, so StarlingX's QEMU can emulate riscv64 *guest* VMs | Not evaluated for riscv64 guest workloads in this research | N/A - this concerns QEMU's own guest-architecture support, not a StarlingX host riscv64 build | Unrelated to porting the StarlingX host platform to riscv64 hardware |
| libffi | System library declared in StarlingX's `bindep.txt` | Build, critical | Data not available: no dedicated riscv64 build/test check for libffi itself was performed in this research beyond its listing in `bindep.txt` | Data not available | Data not available | Listed alongside libxml2/libxslt1/libsasl2/libldap2 in `bindep.txt`; no individual verification performed |
| libxml2 | Underlies lxml's XML parsing | Build, critical | Not separately verified; `python3-lxml`'s presence on Ubuntu 26.04 riscv64 implies its libxml2 build dependency is satisfied there, but no standalone confirmation was performed | Data not available | Data not available | Inferred via lxml, not independently checked |
| libxslt | Underlies lxml's XSLT transforms | Build, optional | Not separately verified; inferred present via lxml's Ubuntu riscv64 availability, no standalone confirmation performed | Data not available | Data not available | Inferred via lxml, not independently checked |
| OpenLDAP | LDAP/directory auth C library, underlies `python-ldap` (declared in StarlingX's `bindep.txt` as `libldap2`) | Build, optional | Not separately verified as a standalone library; `python3-ldap` (3.4.5-1ubuntu1) is present on Ubuntu 26.04 riscv64, implying its `libldap2` build dependency is satisfied there | Data not available | Data not available | StarlingX's Trixie-track `requirements-trixie.txt` drops `python-ldap` entirely, phasing this dependency out |
| Cyrus SASL | SASL auth library, underlies `python-ldap` (declared in StarlingX's `bindep.txt` as `libsasl2`) | Build, optional | Not separately verified as a standalone library; inferred present via `python3-ldap`'s Ubuntu 26.04 riscv64 availability | Data not available | Data not available | Same phase-out note as OpenLDAP applies |
| pyzmq (libzmq) [indirect] | Messaging transport, pulled in via the git-pinned `zerorpc` dependency | Indirect, runtime | Found in Ubuntu 26.04 riscv64 (`python3-zmq` 27.1.0-1build1); the underlying libzmq tracker shows no riscv64 issues | Not separately verified | PyPI wheel coverage is thin: only one riscv64 wheel (`cp312-abi3`) among 86 files for latest 27.2.0, narrower than peer packages | Watch item: narrower wheel coverage than cryptography/lxml/psycopg2 |
| pycrypto / pycryptodomex [indirect] | Legacy crypto pin in `controllerconfig` (bullseye track); Trixie track migrates to `pycryptodomex>=3.20` | Indirect, build | `pycrypto` (dlitz/pycrypto) is abandoned upstream (last release 2.6.1, ~2013), no active riscv64 support. `pycryptodomex` is found in Ubuntu 26.04 riscv64 (`python3-pycryptodome` 3.20.0+dfsg-3build1); no riscv64 issues on its tracker | Not separately verified | `pycryptodomex` has no PyPI riscv64 wheel (source build only), but the Debian/Ubuntu-built package is available on riscv64 | `pycrypto` itself is dead upstream regardless of architecture; StarlingX's migration to `pycryptodomex` is the mitigation already in progress |

**Overall dependency assessment:** No dependency in this table is currently a hard riscv64 blocker at the Ubuntu-distro packaging level for the components that were individually checked (cryptography, greenlet, lxml, psycopg2-binary, pyzmq, python-ldap, pycryptodomex) - all land in Ubuntu 26.04 (resolute) riscv64 per `packages.ubuntu.com`. The clearest historical risk is **greenlet**, which has a documented history of riscv64-specific build failures and a full regression in 3.2.0; StarlingX's own move to `greenlet>=3.5` in its Trixie track is a direct, already-applied mitigation. Secondary watch items are **cryptography**'s lack of an official PyPI riscv64 wheel (immaterial while StarlingX consumes Debian packages, but a hazard for any pip-based install path) and its documented OOM-during-build issue on constrained riscv64 CI hosts. None of this changes the overall project verdict: StarlingX itself has no riscv64 build target for these dependencies to be exercised against.

**Caveat:** the `project-graph` MCP server was unreachable for the entire research session (`CONNECTION_CLOSED`), so the SPARQL-based dependency graph queries specified in the original research task could not be run. The Ubuntu-riscv64 findings above come from direct `packages.ubuntu.com` checks as a substitute and should be re-verified against the project graph once that server is restored.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No StarlingX riscv64 issues exist | N/A | N/A | Confirmed via `search_issues`/`search_pull_requests` across `starlingx/config` and org-wide, plus the note that StarlingX's actual bug tracker is Launchpad (not indexed by GitHub search), which was not directly browsed in this research pass |
| [greenlet#395](https://github.com/python-greenlet/greenlet/issues/395) | greenlet 3.0.3 build failure on riscv64/ppc64el (invalid register `s0` in inline asm) | Closed (fixed in later release) | Dependency-level, not StarlingX-specific | Mitigated by StarlingX pinning `greenlet>=3.5` |
| [greenlet#443](https://github.com/python-greenlet/greenlet/issues/443) | greenlet 3.2.0 riscv64 regression/segfault, introduced by riscv32-support PR #439 | Closed, fixed by revert in [PR #444](https://github.com/python-greenlet/greenlet/pull/444) | Dependency-level, not StarlingX-specific | Shows riscv64 support in this dependency is fragile across releases; worth re-testing on future greenlet version bumps |
| [greenlet#403](https://github.com/python-greenlet/greenlet/issues/403) | "on riscv64 some unit tests fail" | Closed | Dependency-level, not StarlingX-specific | No detail on which tests beyond the issue title, per available research |
| [pyca/cryptography#8640](https://github.com/pyca/cryptography/issues/8640) | OOM-kill during `cargo rustc` build on memory-constrained riscv64 hosts | Closed as stale, no confirmed fix | Dependency-level, not StarlingX-specific | Relevant only to source builds; Debian/Ubuntu build cryptography successfully for riscv64 |
| [pyca/cryptography#14460](https://github.com/pyca/cryptography/issues/14460) | Request to add a `linux_riscv64` wheel to PyPI | Closed, wheel still absent | Dependency-level, not StarlingX-specific | Immaterial to StarlingX's `.deb`-based consumption |

**Correctness bugs:** None found for StarlingX itself on riscv64, because no riscv64 build of StarlingX exists to exhibit correctness bugs.

## 12. Objections and Upstream Blockers

**Stated objections:** No explicit objection to a RISC-V port was found. The one directly relevant statement is affirmative exclusion rather than objection: a StarlingX-authored kernel-build patch states, "StarlingX only targets amd64, so building libc-dev-cross packages for alpha, arc, arm, arm64, mips, powerpc, riscv, s390, sh, sparc etc. is unnecessary and wastes build time," and deletes riscv from the kernel-wedge architecture configuration. This reflects a build-efficiency decision for the amd64-only status quo, not a considered rejection of a riscv64 proposal (none has been made).

**Technical blockers:** None specific to riscv64 were identified beyond the general absence of any riscv64 build target, CI, or packaging in the project. The dependency-level risks noted in Section 9 (primarily greenlet's historical riscv64 fragility) are the only concrete technical items that would need attention if a port were undertaken.

**Organizational blockers:** No RISC-V sponsor has emerged with the Arm Ltd.-equivalent combination of engineering effort and donated hardware. The Arm64 precedent shows the TSC/spec process is receptive to new architecture proposals, but only when a sponsoring organization funds the work; no such sponsor exists for RISC-V as of this research, and RISE (the RISC-V Software Ecosystem project) has no recorded involvement with StarlingX in its blog, wheel builder, GitHub org, or runners site.

**Acceptance probability:** Given the demonstrated willingness to accept a sponsored architecture port (Arm64) via the standard spec process, and the absence of any stated objection to RISC-V specifically, a well-resourced RISC-V enablement proposal (spec + engineering + hardware, following the Arm64 template) has a reasonable path to acceptance. However, this is inference from the Arm64 precedent's process, not evidence of active interest in RISC-V; no proposal currently exists to evaluate. [NEEDS VERIFICATION: acceptance likelihood, since no RISC-V spec has actually been submitted to test community response]

## 13. Readiness Assessment

- **Color:** orange (baseline - no upstream riscv64 CI, no distribution channel of any kind)
- **Release provider:** none
- **Justification:** `starlingx/config` has no upstream riscv64 CI - its actual CI system, Zuul (`.zuul.yaml`, 20,412 bytes), contains zero riscv/riscv64/RISCV references, and there is no `.github/workflows` directory at all, confirmed via full-repository grep at a fresh, origin-verified clone (commit [`fafc0e90b4fecd76592f5a94295cf63a5f77c332`](https://github.com/starlingx/config)). No distribution floor applies because no channel checked ships a riscv64 (or any-architecture) package for StarlingX at all: [GitHub releases](https://github.com/starlingx/config/releases) show zero published releases, no PyPI package named `starlingx` exists, and [Ubuntu package search](https://packages.ubuntu.com/search?keywords=StarlingX&suite=resolute&searchon=names&section=all) returns no results for any suite or architecture. This is a definitive absence of support (not an unknown-unknown, so grey does not apply) and there is no evidence of an attempted-but-broken port (so red does not apply); it lands as orange.
- StarlingX is not an optimization-purpose project (it is a system-configuration service with no performance-differentiating algorithm), so the Step 2 optimization modifier and Optimization level header field do not apply.
- **Pending work that could change the grade:** None found. There is no open RISC-V tracking issue, PR, or spec in `starlingx/config` or the wider `starlingx` organization, and no RISE involvement (blog, wheel builder, GitHub org, runners) references StarlingX. The only precedent for how the grade could improve is the Arm64 pattern: a sponsoring organization submitting a TSC-reviewed enablement spec and donating build hardware, mirroring [the approved Arm enablement spec](https://docs.starlingx.io/specs/specs/stx-9.0/approved/starlingx-2010739-enablement-on-Arm-platform.html).

## 14. Investment Analysis

RISE has no recorded involvement with StarlingX (confirmed via its blog feed, wheel builder listing, GitHub org repository list, and runners site), so no prior work needs to be excluded from sizing below.

### 14.1 Functional Enablement

Because zero riscv64 code, CI, or packaging exists anywhere in the StarlingX organization, functional enablement would need to replicate the scope of the Arm64 effort: a TSC-reviewed spec, native or cross-build tooling for Debian package builds across the full StarlingX layer stack (`config`, `integ`, `kernel`, `root`, `tools`, and others outside this research's scope), and validation that dependencies with known riscv64 fragility (notably greenlet, per Section 9) are pinned to versions past their regressions. This is a multi-repository, cross-team effort comparable in shape to the Arm64 port, not a single-repository patch.

### 14.2 Performance Optimization

Not applicable at this stage; no functional riscv64 build exists to optimize. `starlingx/config` itself contains no SIMD/JIT/crypto hot-path code that would require architecture-specific tuning even after a port (see Section 4).

### 14.3 CI/CD Infrastructure

A riscv64 job would need to be added to `.zuul.yaml` (or StarlingX's broader Zuul-based CI, likely centralized outside `config` in a shared Zuul tenant configuration not reviewed in this research). RISE RISC-V Runners exist as free native-hardware CI infrastructure for open-source projects, per [the RISE runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), but StarlingX's Zuul-based CI (not GitHub Actions) would require either a Zuul-compatible riscv64 node pool or a migration path to use RISE's GitHub-Actions-oriented runners for a subset of jobs; this integration approach was not evaluated in this research.

### 14.4 Ecosystem Enablement

Not applicable as a separate ecosystem enablement effort beyond the dependency-level work in Section 9 (Python packages consumed by `config`); StarlingX's own dependents are internal to the StarlingX repository set, not a broad external plugin/package ecosystem (see Section 10 omission rationale).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Author and shepherd a TSC-reviewed riscv64 enablement spec through `starlingx/specs`, modeled on the Arm64 precedent | Data not available: no comparable effort-sizing data for the Arm64 spec/implementation was found in this research | Sponsoring organization (none currently identified) | Critical (blocking prerequisite for any further work) |
| Functional | Add riscv64 Debian build support across `starlingx/config`, `starlingx/integ`, `starlingx/kernel`, `starlingx/root`, `starlingx/tools` (undo the kernel patch's explicit riscv exclusion, add build-layer configs) | Data not available: not sized in this research; scope is comparable to a full architecture port | TBD | Critical |
| Functional | Verify and pin dependency versions past known riscv64 regressions (greenlet>=3.5 already applied in Trixie track; confirm cryptography, lxml, psycopg2, pyzmq, python-ldap phase-out per Section 9) | Low (mostly already mitigated) | Dependency/packaging maintainers | Medium |
| CI/CD | Add a riscv64 job to StarlingX's Zuul CI configuration, either via native/QEMU build or a RISE runner integration | Data not available: not sized in this research | TBD | High (once functional build exists) |
| Distribution | Establish a riscv64 release channel (ISO, container images, or Debian repo at `mirror.starlingx.io`) once builds pass CI | Data not available: not sized in this research | TBD | High (once functional build exists) |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [StarlingX homepage](https://www.starlingx.io/)
- [starlingx/config repository](https://github.com/starlingx/config)
- [starlingx/config releases page](https://github.com/starlingx/config/releases) ("There aren't any releases here")
- [starlingx/config commit fafc0e90b4fecd76592f5a94295cf63a5f77c332 (fresh verified clone)](https://github.com/starlingx/config)
- [StarlingX: Enablement on Arm Platform (approved spec, stx-9.0)](https://docs.starlingx.io/specs/specs/stx-9.0/approved/starlingx-2010739-enablement-on-Arm-platform.html)
- [StarlingX governance / TSC reference](https://docs.starlingx.io/governance/reference/tsc/)
- [StarlingX supporters list](https://www.starlingx.io/)
- [PyPI JSON API for package "starlingx" (404 - package does not exist)](https://pypi.org/pypi/starlingx/json)
- [RISE GitLab wheel builder simple index for "starlingx" (redirects to nonexistent PyPI entry)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/starlingx/)
- [Ubuntu package search for "StarlingX" (no results, all suites/architectures)](https://packages.ubuntu.com/search?keywords=StarlingX&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search for "starlingx" (not listed)](https://archriscv.felixc.at/?q=starlingx)
- [RISE Project blog feed](https://riseproject.dev/feed/)
- [RISE Python wheel builder (87 supported riscv64 packages, StarlingX not among them)](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners site](https://riscv-runners.riseproject.dev/)
- [RISE announcement: free native RISC-V CI runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [greenlet issue #395 (3.0.3 riscv64/ppc64el build failure)](https://github.com/python-greenlet/greenlet/issues/395)
- [greenlet issue #443 (3.2.0 riscv64 regression)](https://github.com/python-greenlet/greenlet/issues/443)
- [greenlet pull request #444 (fix via revert)](https://github.com/python-greenlet/greenlet/pull/444)
- [greenlet issue #403 (riscv64 unit test failures)](https://github.com/python-greenlet/greenlet/issues/403)
- [pyca/cryptography issue #8640 (OOM on riscv64 build)](https://github.com/pyca/cryptography/issues/8640)
- [pyca/cryptography issue #14460 (request for linux_riscv64 PyPI wheel)](https://github.com/pyca/cryptography/issues/14460)
- [Phoronix VisionFive2 RISC-V benchmarks (unrelated to StarlingX, checked and ruled out)](https://www.phoronix.com/review/visionfive2-riscv-benchmarks)
- [RiVEC RISC-V vectorized benchmark suite (unrelated to StarlingX, checked and ruled out)](https://github.com/RALC88/riscv-vectorized-benchmark-suite)
- [SDxCentral: StarlingX 9.0 release coverage (no RISC-V content)](https://www.sdxcentral.com/analysis/starlingx-90-open-source-cloud-platform-boosts-performance-for-telco-and-edge/)
- [StarlingX news and announcements category](https://www.starlingx.io/category/news-announcements/)
