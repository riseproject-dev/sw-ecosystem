---
title: cloud-init
parent: Project Reports
color: green
dependencies:
  - name: Python
    relation: runtime-dependency
    criticality: critical
  - name: PyYAML
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: systemd
    relation: runtime-dependency
    criticality: optional
  - name: Meson
    relation: build-dependency
    criticality: critical
  - name: pytest
    relation: test-dependency
    criticality: critical
  - name: HTTPretty
    relation: test-dependency
    criticality: optional
  - name: responses
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="cloud-init" %}

# cloud-init

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for cloud-init<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[cloud-init](https://cloud-init.io/) ([github.com/canonical/cloud-init](https://github.com/canonical/cloud-init)) is the industry-standard tool for cross-cloud instance initialization. It handles user account creation, SSH key injection, network configuration, disk partitioning, package installation, and arbitrary script execution on first boot. It is the de-facto mechanism by which cloud providers (AWS, GCP, Azure, OpenStack, Hetzner, and others) provision Linux images at scale.

cloud-init is a pure-Python package. It ships no compiled C extensions, no native binaries, no assembly, and no architecture-specific numeric or SIMD code. A repository-wide search for `__riscv`, `vfloat32m1_t`, `rvv`, and `.S`/`.c`/`.h` files returns zero hits, confirming there is no compiled or vectorized code of any kind for any architecture. The build system is Meson (minimum version 0.63.0). Installed artifacts are Python modules, shell scripts, templates, and systemd units. There is no PyPI publication (`https://pypi.org/pypi/cloud-init/json` returns a genuine HTTP 404, independently confirmed twice in this pass); distribution is exclusively through OS package managers (Debian/Ubuntu, Fedora/RHEL via `brpm`, Arch Linux, and others).

The project is wholly owned and controlled by [Canonical Ltd.](https://canonical.com/). There is no independent foundation, no CNCF or Linux Foundation membership, and no `MAINTAINERS`/`OWNERS`/`CODEOWNERS` file or governance/steering-committee document anywhere in the repository. `CONTRIBUTING.md` covers process only: sign Canonical's CLA at ubuntu.com/legal/contributors, follow the Ubuntu Code of Conduct, use GitHub and the Matrix `#cloud-init` channel. License: GPLv3 OR Apache License 2.0 (recipient's choice), confirmed in both the repository `LICENSE` file and the cloud-init.io homepage footer ("(c) 2026 Canonical Ltd.").

**Corporate contributors (all-time commit history, `git shortlog -sne`):** overwhelmingly Canonical staff (Scott Moser, Chad Smith - current lead, Brett Holman, James Falcon, Alberto Contreras, Daniel Watkins, Ryan Harper, Christian Ehrhardt, Joshua Powers, Ben Howard). Non-Canonical contributors with sustained commit history: Microsoft (Chris Patterson, 116 commits all-time, still active, Azure datasource work), Red Hat (Ani Sinha, 18 commits in the last 24 months), SUSE (Robert Schweikert, 53 commits all-time), and historically Yahoo (Joshua Harlow, 702 commits, no longer active). No corporate contributor other than Canonical has touched riscv64-specific code; every riscv64-touching PR to date was authored by Canonical employees.

**Community stance on new ports:** passive, not hostile. The project accepts riscv64 patches that clear normal code review and CLA requirements but does not resource or campaign for port work itself. There is no dedicated riscv64 owner, no CI, and no roadmap item beyond an unactioned wishlist comment (see Section 7).

**RISE membership:** [Canonical Group Limited is a General Member](https://riseproject.dev/members/) (not Premier) of the RISE project. cloud-init itself is not a RISE-funded RFP project and has no dedicated RISE working group.

## 2. Port History and Upstreaming Timeline

RISC-V support in cloud-init reduces to one enablement commit and two bug fixes discovered via riscv64 testing. There is no ongoing port effort and no master tracking issue exists in the repository (confirmed by exhaustive issue-tracker search: queries for "riscv", "riscv64", and "RISC-V port tracking" scoped to `owner:canonical repo:cloud-init` return zero genuine hits).

| Date | Item | Author (org) | Status | First release | Description |
|------|------|---------------|--------|----------------|-------------|
| 2020-11-25 | [PR #687](https://github.com/canonical/cloud-init/pull/687) | xnox / Dimitri John Ledkov (Canonical) | Merged, squash commit `6ee01078`, confirmed ancestor of `main` | 21.1 | Added `riscv64` to `PORTS_ARCHES` in `cc_apt_configure.py` so riscv64 hosts resolve apt mirrors via `ports.ubuntu.com` instead of the primary archive (which carries only amd64/i386). One-line diff, reviewed and merged same day with no design objections. |
| 2020-11-24 to 2021-01-05 | [PR #689](https://github.com/canonical/cloud-init/pull/689) | xnox (Canonical) | Closed, not merged. Independently confirmed via `git merge-base --is-ancestor`: the PR head commit `e1b2b0e2` exists only on `refs/pull/689/head` and is not present on any branch | N/A | Fixes a `TypeError` in the NoCloud datasource's `_quick_read_instance_id` when `meta-data` is empty, a pattern used on subiquity and riscv64 images to force NoCloud datasource detection. Stalled on unresolved reviewer disagreement: smoser objected on design grounds ("BOGUS content in NoCloud datasource, go away. instance id is required"), preferring a hard failure over silently tolerating empty metadata; xnox argued the fallback default instance-id makes the check unnecessary; OddBloke proposed a middle path (explicit `md is not None` check rather than broad exception handling) that was never implemented. The PR went stale with no consensus and was auto-closed. This is the one place where riscv64-relevant work was genuinely blocked, not merely neglected. |
| 2023-04-03 to 2023-07-10 | [PR #2111](https://github.com/canonical/cloud-init/pull/2111) | holmanb (Canonical) | Merged, squash commit `b3c9b6a7`, confirmed ancestor of `main` | 23.3 | Fixed a login-race/authentication gap (LP: #2013403) where TTY login became available before `cc_set_passwords` completed, discovered by running the Ubuntu "unmatched" riscv64 image under QEMU. Fix: gated `systemd-user-sessions.service` on `cloud-config.service` completion. The only review gate was a performance-regression check requested by TheRealFalcon; paride's benchmarks (amd64/Jammy, 20-run hyperfine) showed no regression (time to first SSH: 16.103s +/- 1.119s on main vs 16.166s +/- 1.037s patched; time to `cloud-init status --wait`: 21.193s +/- 0.827s vs 21.186s +/- 0.864s), after which blackboxsw approved and merged same day. No riscv64-specific boot-time numbers were published. Later superseded functionally by [PR #5395](https://github.com/canonical/cloud-init/pull/5395) (June 2024), which moved `set_passwords` to the Network stage instead. |
| 2025-05-09 | [PR #6213](https://github.com/canonical/cloud-init/pull/6213) | blackboxsw (Canonical) | Merged, squash commit `951f397a`, confirmed ancestor of `main` | 25.2 | Updates an integration test's expected `hello` package version for Ubuntu Questing. riscv64 appears only incidentally, pasted inside `rmadison hello` output listing "source, amd64, arm64, armhf, ppc64el, riscv64, s390x" as available architectures. Not a riscv64-targeted change. |

No additional riscv64-specific commits, issues, or PRs exist as of 2026-09-30 (confirmed via `git log --grep=riscv -i --all` and a `-S"riscv"` pickaxe search over the full unshallowed history, plus GitHub code search). The first commit to touch riscv64 anywhere in the repository's history is `6ee01078` (PR #687, 2020-11-25).

## 3. Upstream Support Tier

cloud-init publishes no formal architecture-tier matrix, no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` directory. `doc/rtd/reference/availability.rst` lists supported distributions, not CPU architectures, and does not mention riscv64. Architecture support is implicit: because the codebase is pure Python, any Linux platform with a supported Python 3 interpreter can run cloud-init without code changes. The only de-facto tiering mechanism is the `PORTS_ARCHES` list in `cc_apt_configure.py`, which mirrors Debian/Ubuntu's own ports-vs-primary-archive split rather than a cloud-init-authored policy.

| Architecture | apt mirror class | CI coverage | Official distro binary | Tier designation |
|---|---|---|---|---|
| amd64 | PRIMARY_ARCHES | Full (all ~30 workflows run on `ubuntu-latest`, amd64) | Yes | Implicit primary |
| arm64 | PORTS_ARCHES | None | Yes (arch:all) | Implicit ports |
| riscv64 | PORTS_ARCHES (since PR #687, 2020-11-25) | None | Yes (arch:all) | Implicit ports |

riscv64 has been in `PORTS_ARCHES` since November 2020 alongside `s390x`, `arm64`, `armhf`, `powerpc`, and `ppc64el`. There is no separate riscv64 tier designation anywhere in the project.

## 4. Technical Architecture and RISC-V-Specific Subsystems

cloud-init has no architecture-specific subsystems in the SIMD/JIT/ISA-dispatch sense. This rubric does not fit the project: there is no compiled or native code anywhere in the tree for any architecture, so there is no "hand-tuned vs. stub" comparison to make. The full inventory of architecture-sensitive code is two lines, both in one file:

```python
# cloudinit/config/cc_apt_configure.py
PRIMARY_ARCHES = ["amd64", "i386"]
PORTS_ARCHES = ["s390x", "arm64", "armhf", "powerpc", "ppc64el", "riscv64"]
```

`get_default_mirrors()` reads the host's dpkg architecture via `get_dpkg_architecture()`. If the result is in `PORTS_ARCHES`, it returns `PORTS_MIRRORS` (pointing to `http://ports.ubuntu.com/ubuntu-ports`); if the architecture is in neither list, it raises `ValueError`. riscv64 is handled correctly; without PR #687 it would raise on a riscv64 host.

`cloudinit/util.py`'s `is_x86()` returns `False` for riscv64, which is correct; no `is_riscv64()` helper exists, but no current caller requires one.

`cloudinit/dmi.py` lists only `("aarch64", "amd64")` as valid DMI-capable architectures. riscv64 is absent, confirmed unchanged in the current tree. On riscv64 hardware, DMI/SMBIOS data reads silently return `None` rather than raising, which is a correctness gap for any datasource or provisioning system that depends on DMI-sourced instance identity. [NEEDS VERIFICATION: whether any production riscv64 cloud-init datasource currently depends on DMI reads]

cloud-init organizes code by distro (`cloudinit/distros/alpine.py`, `debian.py`, `rhel.py`, etc.), not by CPU architecture, so there is no per-architecture source-file structure to compare (0 dedicated architecture-specific files for amd64, arm64, and riscv64 alike). Framed honestly rather than through an intrinsics-style rubric: riscv64's one-line `PORTS_ARCHES` entry is, if anything, more explicit architecture-awareness than amd64 or arm64 get anywhere else in the codebase, since those are handled only implicitly (amd64 via `PRIMARY_ARCHES`, arm64 via the same `PORTS_ARCHES` list riscv64 shares).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| apt mirror selection | `PRIMARY_ARCHES` | `PORTS_ARCHES` | `PORTS_ARCHES` |
| DMI/SMBIOS reads | Supported | Supported | Returns `None` (gap) |
| `is_x86()` | `True` | `False` | `False` (correct) |
| SIMD/vectorized code | None | None | None |

## 5. Build System, Cross-Compilation, and Toolchain

Build system: Meson (minimum 0.63.0). Build dependencies: `python3`, `meson >= 0.63.0`, `pkgconf`, `bash-completion`, and (systemd environments only) `systemd-devel`, `udev` - all architecture-agnostic, with no compiler version pinned anywhere.

Standard build (identical on every architecture, including riscv64; Meson here drives install-layout and packaging only, not C/C++ compilation):

```
meson setup builddir -Dinit_system=systemd -Ddownstream_version=X.Y.Z
meson test -C builddir -v
meson install -C builddir
```

Distro package builds: `./packages/brpm --distro=redhat` (or `--distro=suse`), `./packages/bddeb -d` (Debian/Ubuntu), or in a container: `./tools/run-container ubuntu-daily:plucky --package --keep`.

`meson_options.txt` exposes only `init_system`, `distro_templates`, `disable_sshd_keygen`, `bash_completion`, and `downstream_version` - none architecture-related; there are no riscv-specific `-D` toggles.

No GCC or Clang minimum version exists, because there is no compiled-language toolchain requirement at all. No riscv64 cross-compilation toolchain file exists (not applicable to Python). No `Dockerfile` of any kind exists anywhere in the repository (`find . -iname "*dockerfile*"` returns nothing), and no workflow file contains a QEMU or binfmt step. The [cloud-init QEMU tutorial](https://cloudinit.readthedocs.io/en/latest/tutorial/qemu.html) demonstrates `qemu-system-x86_64` with a `noble-server-cloudimg-amd64.img`; it notes that non-x86 hosts should substitute the matching `qemu-system-<arch>` command and image but gives no explicit riscv64 invocation.

**Bottom line:** riscv64 support in cloud-init concerns a running instance correctly configuring apt sources at runtime, not a compiled or cross-compiled component. There is no riscv64-specific build tooling, toolchain, Dockerfile, or QEMU usage to evaluate; the project should be treated as build-agnostic with respect to architecture.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because cloud-init is architecture-agnostic Python, the gap analysis reduces to which code paths are conditioned on architecture and whether they are correct for riscv64.

| Component | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| apt mirror selection | `PRIMARY_ARCHES` | `PORTS_ARCHES` | `PORTS_ARCHES` | None, all three correctly handled |
| Boot/init config modules (grub, resizefs, growpart, mounts, disk_setup) | Full | Full | Full | None, no architecture gates; logic is filesystem-type/OS-variant based |
| DMI/SMBIOS reads (`dmi.py`) | Full | Full | Returns `None` | Gap, riscv64 absent from valid DMI arch list; silent failure, no error raised |
| `is_x86()` helper | `True` | `False` | `False` | None, correct |
| Unit test coverage for apt mirror selection | Tested (`amd64`, `ppc64el`, `s390x`) | Not tested | Not tested | Gap, no test asserts `get_default_mirrors("riscv64")` returns `PORTS_MIRRORS` |
| Integration test coverage | Full (~30 CI workflows, amd64 only) | None | None | Gap, no non-x86 integration testing of any kind |

No SIMD- or NaN/floating-point-related gaps exist because the project contains no numeric or floating-point-sensitive code. The `dmi.py` omission is the only functional gap with potential correctness impact; every other item is a test-coverage deficiency rather than a runtime defect.

## 7. CI/CD Infrastructure

All 30 files in `.github/workflows/` were read directly from a local clone (HEAD `fc5d7cfe`) and cross-checked independently via GitHub code search scoped to `path:.github/workflows`. Neither method found any reference to "riscv", "riscv64", "RISCV", or "risc-v" (zero matches, `total_count: 0` on the code-search cross-check).

**Confirmed workflow inventory:** unit/lint (`10-daily-unit-lint.yml`, `22-pr-unit-python.yml`, `23-pr-unit-distro.yml`) on `ubuntu-latest` and `macos-latest`; integration suites `110`-`114` (LXD container), `120`-`124` (LXD VM), `130`-`134` (EC2), `140`-`144` (Azure), dispatched through `100-dispatch-common.yml`, all on `ubuntu-latest` with no architecture matrix; static analysis (`40-weekly-tics.yml`) on `[self-hosted, linux, amd64, tiobe, noble]`, explicitly labelled amd64; plus PR gating (`20-pr-gh-cla.yml`, `21-pr-check-format.yml`, `24-pr-integration.yml`), packaging (`30-pr-packaging-patches-upstream.yml`, `31-pr-packaging-shellcheck.yml`, `44-packaging-downstream.yml`), and maintenance workflows (`41-daily-gh-stale.yml`, `43-daily-linkcheck.yml`, `45-ci-label.yml`). No `.gitlab-ci.yml`, `.cirrus.yml`, or `Jenkinsfile` exists anywhere in the repository. No QEMU installation step, no `qemu-user-static`, and no binfmt registration appear in any workflow.

The only two repository-wide occurrences of "riscv"/"riscv64" (confirmed by both a full-repo grep and an independent GitHub code-search index check, both returning exactly the same 2 hits) are the `ChangeLog` entry for PR #687 and the `PORTS_ARCHES` list itself - neither is CI configuration.

[Issue #5342](https://github.com/canonical/cloud-init/issues/5342) (open since May 2024) contains the text "arm64 + riscv maybe?" as a wishlist item for non-x86 integration test coverage. It has zero comments, no assignee, no milestone, and no linked PRs; it is explicitly aspirational phrasing, not a plan, and has made no progress in over two years.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Unit/lint CI | Yes | No | No |
| Integration CI (LXD/EC2/Azure) | Yes | No | No |
| Self-hosted static-analysis runner | Yes (amd64-labelled) | No | No |
| RISE runner usage | N/A | N/A | None in-repo (RISE uses cloud-init operationally to provision its own CI VMs, see Section 10 note below; this is not cloud-init CI) |

**Current CI verdict: no riscv64 CI exists. None is planned with a concrete implementation path.**

## 8. Distribution and Release Status

cloud-init is a pure-Python package distributed as an architecture-independent (`Architecture: all`) `.deb`/`.rpm`. There is no riscv64-compiled binary at any distribution point, and none is needed.

| Distribution | Package | riscv64 available | Notes |
|---|---|---|---|
| Ubuntu 26.04 (resolute) | [cloud-init on packages.ubuntu.com](https://packages.ubuntu.com/resolute/cloud-init) | Yes | Version 26.1-0ubuntu2, Architecture = `all` (2.1 kB / 15.0 kB installed). `cloud-init-base` (573.3 kB / 3,011.0 kB) is likewise `all`; its file list confirms pure-Python content (`/usr/lib/python3/dist-packages/cloudinit/*.py`), no `.so` binaries. Arch-filtered search (`suite=resolute&arch=riscv64`) returns `cloud-init`, `cloud-init-azure`, `cloud-init-base`, `cloud-init-cloud-sigma`, `cloud-init-smart-os`, and the `cloud-initramfs-*` family. |
| Ubuntu 24.04 (noble) | [cloud-init on packages.ubuntu.com](https://packages.ubuntu.com/noble/riscv64/cloud-init) | Yes | `cloud-init_25.1.4-0ubuntu0~24.04.1_all.deb`, Architecture = `all`. |
| Debian (trixie/sid) | [tracker.debian.org/pkg/cloud-init](https://tracker.debian.org/pkg/cloud-init) | Yes, by virtue of `arch:all` | No per-architecture build required or tracked by Debian buildd; "no entry in riscv64 database" is expected for an `arch:all` package. |
| PyPI | [pypi.org/pypi/cloud-init/json](https://pypi.org/pypi/cloud-init/json) | Not applicable | cloud-init is not published to PyPI at all, for any architecture. Confirmed with a genuine HTTP 404 (verified twice, with header variation to rule out a bot-challenge false negative) and a failed `pip download cloud-init --no-deps` ("Could not find a version that satisfies the requirement"). |
| RISE wheel builder (GitLab project 56254198) | N/A | No | The PyPI-proxy endpoint `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/cloud-init/` 302-redirects to the real PyPI simple index, which also 404s. Not applicable since cloud-init has no compiled extensions and no PyPI presence to mirror. |
| Arch Linux RISC-V | [archriscv.felixc.at](https://archriscv.felixc.at/?q=cloud-init) | **Contradictory evidence.** The existing project record stated cloud-init 26.1-1 was present in the Arch Linux RISC-V `extra` repository, with some test dependencies (python-httpretty, python-responses, python-pytest) noted as outdated. A direct re-query of `archriscv.felixc.at/?q=cloud-init` in this pass found cloud-init **not listed on the page at all**. These two claims directly conflict and neither has been re-confirmed against the other; treat Arch Linux RISC-V availability as [NEEDS VERIFICATION] pending a fresh manual check of the archriscv package list. |
| GitHub Releases | [github.com/canonical/cloud-init/releases](https://github.com/canonical/cloud-init/releases) | Not independently re-verified this pass | This session's GitHub API access is scoped to `riseproject-dev/sw-ecosystem` only; `canonical/cloud-init` release-asset enumeration (`list_releases`) was refused, and a direct fetch of the releases page rendered only the JS app shell without asset filenames. A prior pass recorded a single architecture-independent asset, `cloud-init-26.1-1.el9.noarch.rpm`, and no riscv64-specific asset; this has not been independently re-confirmed this session and is [NEEDS VERIFICATION]. No riscv64-build tooling was found anywhere in the source tree that could produce an architecture-specific asset, which is consistent with (but does not prove) the absence of one. |

**Most recent release:** 26.1 (Ubuntu resolute ships 26.1-0ubuntu2).

**What a user must do to get a working binary on riscv64:** nothing beyond a standard `apt install cloud-init` on Ubuntu 24.04/26.04 riscv64 or the Debian equivalent; the package installs identically to every other architecture because it is `Architecture: all`.

## 9. Dependencies

| Dependency | Role | Type | Criticality | riscv64 status | Notes |
|---|---|---|---|---|---|
| Python | Runtime interpreter | Runtime-dependency | Critical | Builds on riscv64; no official architecture tier assignment upstream; imperative init logic used by cloud-init does not depend on JIT (PEP 744) or perf-profiling paths | See the project's Python riscv64 status report for interpreter-level detail |
| PyYAML | YAML parsing (cloud-config) | Runtime-dependency | Critical | C extension (`_yaml`/libyaml) builds on riscv64, but no riscv64 wheel is published to PyPI ([yaml/pyyaml#877](https://github.com/yaml/pyyaml/issues/877), [#909](https://github.com/yaml/pyyaml/issues/909), [#924](https://github.com/yaml/pyyaml/issues/924), [#926](https://github.com/yaml/pyyaml/issues/926)). Distro packages (Ubuntu `python3-yaml`, Fedora `python3-pyyaml`) ship the compiled extension | Non-blocking for distro-managed installs; adds friction for pip/venv workflows on riscv64 |
| OpenSSL | TLS for HTTPS metadata/IMDS fetches | Runtime-dependency | Optional | Full support since OpenSSL 3.0 (2022); riscv64-specific source files and a dedicated CI pipeline covering multiple riscv64 configurations including RVV and Zba/Zbb/Zbc | None |
| systemd | Init/unit management; cloud-init integrates as systemd units | Runtime-dependency | Optional | riscv64 CI build coverage reported as added upstream (PR #42431); open issue #39354 (sandboxing generator fork failure) may be kernel-version specific on some riscv64 hosts | Not independently re-verified this pass; carried from the existing record |
| Meson | Build system | Build-dependency | Critical | Pure-Python build tool; works identically on riscv64 (`pip install meson` or distro package) | None |
| pytest | Unit/integration test runner | Test-dependency | Critical | Pure Python; runs on riscv64 wherever Python runs | On Arch Linux RISC-V, `python-pytest` was previously noted as an outdated package version (see Section 8 caveat on contradictory Arch evidence) |
| HTTPretty | HTTP mocking in unit tests | Test-dependency | Optional | Pure Python | Same Arch outdated-version caveat as above |
| responses | HTTP mocking in unit tests (`requests` library) | Test-dependency | Optional | Pure Python | Same Arch outdated-version caveat as above |
| jinja2 | Template rendering (cloud-config templates) | Runtime-dependency (indirect) | Low | Pure Python, no C extension | None |
| requests | HTTP client (IMDS/metadata fetching) | Runtime-dependency (indirect) | Low | Pure Python | None |
| oauthlib | OAuth signing (MAAS datasource) | Runtime-dependency (indirect) | Low | Pure Python | None |
| configobj | INI-style config parsing | Runtime-dependency (indirect) | Low | Pure Python | None |
| jsonpatch | Cloud-config merge patching | Runtime-dependency (indirect) | Low | Pure Python | None |
| jsonschema | Cloud-config schema validation | Runtime-dependency (indirect) | Low | Pure Python | None |
| iproute2 | Network configuration (system tool invoked at runtime) | Runtime-dependency (indirect) | Medium | Ships in all major Linux distributions on riscv64 | None |
| netplan.io | Network config rendering (Ubuntu/Debian) | Runtime-dependency (indirect) | Medium | Two closed riscv64 CI issues ([#548](https://github.com/canonical/netplan/issues/548), [#550](https://github.com/canonical/netplan/issues/550)), both fixed | None |
| procps, dhcpcd/dhclient, e2fsprogs, cloud-guest-utils | Base system tools invoked at runtime | Runtime-dependency (indirect) | Low | Available for riscv64 in all major distros; no known riscv64-specific issues | None |

**Risk summary:**

1. PyYAML (medium): no riscv64 wheel on PyPI; affects pip/venv workflows, not distro-managed installs.
2. Python interpreter (low-medium): no official riscv64 tier; irrelevant to cloud-init's imperative workload profile.
3. systemd (low): issue #39354 open but not confirmed to block cloud-init unit activation; not independently re-verified this pass.
4. pytest, HTTPretty, responses (low, contingent): flagged as outdated on Arch Linux RISC-V in a prior record that this pass could not confirm (Arch listing itself is now contradicted, see Section 8); treat as [NEEDS VERIFICATION].
5. All other indirect Python dependencies: no risk, pure Python with universal wheels.

## 11. Known Bugs and Active Issues

| Item | Status | riscv64 impact |
|---|---|---|
| [Issue #5342](https://github.com/canonical/cloud-init/issues/5342) - integration coverage wishlist ("arm64 + riscv maybe?") | Open, no assignee, no milestone, zero comments since filed May 2024 | No riscv64 integration CI exists; the wishlist item has made no progress in over two years |
| [PR #689](https://github.com/canonical/cloud-init/pull/689) - NoCloud `TypeError` on empty `meta-data` (subiquity/riscv64 image pattern) | Closed, not merged (confirmed via independent commit-ancestry check) | Root scenario (subiquity/riscv64 writing empty `meta-data` to force NoCloud detection) remains a live deployment pattern; the fix stalled on unresolved reviewer disagreement (smoser vs xnox) and was never revisited. Whether an equivalent fix landed via a different later commit is [NEEDS VERIFICATION] |
| `dmi.py` riscv64 gap | No issue filed | riscv64 absent from valid DMI arch list; DMI reads return `None` silently, with no tracking issue open |
| [Issue #3812](https://github.com/canonical/cloud-init/issues/3812) - ds-identify returns DS_MAYBE for OpenStack on riscv64 | Closed/expired (Jan 2021) | `ds-identify` wastes time probing OpenStack on riscv64, which is unlikely to run OpenStack; not fixed. [NEEDS VERIFICATION: whether ds-identify behavior has changed since 2021] |

No open correctness bugs, no open performance bugs, and no NaN/floating-point issues for riscv64 exist in the canonical/cloud-init issue tracker; exhaustive search (`riscv64 bug`, `riscv64 performance`, bare `riscv`/`riscv64` scoped to the repo) returns zero genuine matches.

**Benchmark data:** none published anywhere for cloud-init specifically on riscv64. The only quantitative cloud-init timing data involving riscv64 origin is from PR #2111 (2023), and those benchmarks were run on amd64, not riscv64. One search result, a PR on an unrelated personal repository (`xaviercallens/rust-linux-mini-kernel`) claiming an oddly precise "RISC-V boot telemetry" statistic, was identified as having the profile of fabricated or planted data; it is not about cloud-init and was excluded as a source.

## 12. Objections and Upstream Blockers

**There are no upstream blockers preventing cloud-init from running on riscv64 today.** The package installs on Ubuntu 24.04/26.04 riscv64 via `apt install cloud-init` exactly as it does on every other architecture, because it ships `Architecture: all`. The one code path that could have caused an outright failure (`cc_apt_configure.py`'s architecture-mirror lookup) was fixed in 2020 (PR #687). The `dmi.py` gap causes a silent `None` return, not an initialization failure.

The objections relevant to an investment decision are:

1. **No CI coverage.** Zero of the ~30 GitHub Actions workflows reference riscv64. A future regression to `cc_apt_configure.py`'s `PORTS_ARCHES` handling would not be caught by upstream CI.
2. **No upstream ownership.** Canonical has assigned no engineer to riscv64 cloud-init work. No roadmap item, milestone, or tracking issue covers riscv64 beyond the unactioned wishlist note in #5342.
3. **PR #689 unresolved, with genuine reviewer disagreement.** The NoCloud empty-metadata `TypeError` fix was never merged after smoser and xnox disagreed on the correct design; subiquity/riscv64 provisioning workflows using empty `meta-data` files may still be exposed to this.
4. **No RISE funding or coverage.** cloud-init is absent from RISE's funded RFP projects and from every RISE blog post checked (36 posts spanning May 2024-September 2026, including the most cloud/datacenter-relevant one, "[Industry Cooperation Takes Center Stage at RISC-V Summit Europe 2026](https://riseproject.dev/2026/06/26/industry-cooperation-takes-center-stage-at-risc-v-summit-europe-2026/)", where a Canonical speaker discussed enterprise OS/container/virtualization blocks without mentioning cloud-init). RISE's own CI infrastructure (`riseproject-dev/riscv-runner`) uses cloud-init operationally to bootstrap its Scaleway RISC-V CI runners, but this is RISE consuming cloud-init as an off-the-shelf tool, not funding or contributing to the project.

## 13. Readiness Assessment

- **Color:** green (architecture-independent)
- **Release provider:** distro

cloud-init is a pure-Python package (Meson build, no C/C++/Rust/Go, no SIMD/assembly anywhere in the tree), so it takes the architecture-independent shortcut: it ships as an `Architecture: all` `.deb` and runs on riscv64 by construction. This is confirmed live on [Ubuntu 26.04 "resolute"](https://packages.ubuntu.com/resolute/cloud-init) (cloud-init 26.1-0ubuntu2, arch=all) and [Ubuntu 24.04 noble riscv64](https://packages.ubuntu.com/noble/riscv64/cloud-init). The one riscv64-specific code touch, [PR #687](https://github.com/canonical/cloud-init/pull/687) (2020, merged), added `riscv64` to the apt `PORTS_ARCHES` mirror list so riscv64 hosts resolve packages via `ports.ubuntu.com` - a complete, working fix, not a stub. cloud-init is not published on PyPI at all (any architecture), so the consumable riscv64 artifact reaches users via the Ubuntu/Debian distro archive rather than an upstream GitHub/PyPI release, hence `release_provider: distro` even though Canonical (upstream) also controls that archive.

**Pending work that could change the grade:** `dmi.py` lacks riscv64 in its valid-DMI-arch list (silent `None` return, roughly 1-2 person-days to fix); PR #689 (NoCloud empty meta-data `TypeError`, relevant to riscv64/subiquity images) was closed unmerged after unresolved reviewer disagreement; open wishlist issue #5342 ("arm64 + riscv maybe?") for integration test coverage has no assignee or progress since May 2024. No riscv64 CI exists (0/30 workflows reference riscv) and no master tracking issue exists, but neither affects the green grade since the architecture-independent shortcut applies regardless of CI posture. cloud-init is not a RISE-funded project and has no RISE blog or working-group coverage. Additionally, this pass surfaced a direct contradiction on Arch Linux RISC-V package availability (Section 8) that should be resolved before the next report refresh, and GitHub Releases asset enumeration for `canonical/cloud-init` remains unverified due to this session's scoped API access.

## 14. Investment Analysis

RISE has not funded, contributed to, or tracked any cloud-init work; Canonical is a RISE General Member but cloud-init has no dedicated RFP or working group. No sizing below overlaps with existing RISE-funded work because none exists for this project.

### 14.1 Functional Enablement

cloud-init on riscv64 is functionally complete for standard Ubuntu/Debian cloud provisioning scenarios; the `cc_apt_configure.py` fix (PR #687) covers the only required architecture-specific code path. The `dmi.py` gap needs fixing only if the target deployment uses DMI-based instance identity (relevant to bare-metal or certain hypervisor configurations). Effort: 1-2 person-days including test coverage, a straightforward addition of `riscv64` to the valid DMI arch list plus a unit test. Confirming or resolving PR #689 (NoCloud empty meta-data) requires roughly 1 person-day to determine current status and either land a fix or formally close the gap with a documented rationale.

### 14.2 Performance Optimization

cloud-init is not a performance-sensitive workload. It runs once at instance first boot, executes imperative Python logic, calls system tools, and exits; there is no numerical computation, hot loop, JIT, or SIMD anywhere in the codebase. On amd64, cloud-init contributes approximately 2.5s to `multi-user.target` per prior `systemd-analyze` data (PR #5395 discussion). No riscv64 boot-time benchmark exists anywhere (Section 11). Performance optimization investment in cloud-init itself is not justified on any architecture.

### 14.3 CI/CD Infrastructure

The absence of riscv64 CI is the primary long-term risk: a regression to the sole riscv64 code path (`PORTS_ARCHES`) would go uncaught. A minimal riscv64 unit test addition (covering `get_default_mirrors("riscv64")` and the `dmi.py` arch list) requires no runner infrastructure and is the most likely contribution to be accepted; effort: 1-2 person-days. A full riscv64 integration test runner requires negotiating with Canonical to provision and accept ongoing infrastructure; issue #5342 has sat unactioned for over two years, so acceptance is uncertain. Effort: 4-8 person-weeks, outcome uncertain.

### 14.4 Ecosystem Enablement

cloud-init is a prerequisite for cloud infrastructure on any architecture, including bare-metal or private-cloud riscv64 deployments. The current state (functionally complete via distro packaging, untested by CI) is adequate for production use on Ubuntu 24.04/26.04 riscv64, with the caveat that the `dmi.py` gap should be assessed against the specific datasource in use. No RISE investment exists here and no other vendor is actively working on riscv64 support; total investment to close all identified gaps is small.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `dmi.py` to include riscv64 in valid DMI arch list, plus unit test | 0.3 | Cloud infrastructure team | High if bare-metal or DMI-dependent datasource is used, Low otherwise |
| Functional | Confirm/resolve PR #689 (NoCloud empty meta-data `TypeError` on riscv64 subiquity images) | 0.2 | Cloud infrastructure team | Medium, affects subiquity-based provisioning workflows |
| CI/CD | Add unit tests for `get_default_mirrors("riscv64")` | 0.2 | Cloud infrastructure team | High, prevents silent regression in the one riscv64-specific code path |
| CI/CD | Add riscv64 integration test runner (upstream, requires Canonical coordination) | 4-8 | Cloud infrastructure team + Canonical | Low, effort high and outcome uncertain given the low functional risk of an architecture-agnostic codebase |
| Verification | Resolve the Arch Linux RISC-V package-availability contradiction (Section 8) and independently re-verify GitHub Releases asset composition | 0.1 | Reporting team | Low, documentation accuracy only, no functional impact |
| Ecosystem | No action, cloud-init 25.1.4/26.1 already available on Ubuntu noble/resolute riscv64 today | 0 | N/A | N/A |
| Performance | No action, cloud-init has no performance-sensitive code paths | 0 | N/A | N/A |

## 15. References

- [canonical/cloud-init repository](https://github.com/canonical/cloud-init)
- [cloud-init.io homepage](https://cloud-init.io/)
- [cloud-init 26.2 documentation](https://cloudinit.readthedocs.io/)
- [cloud-init QEMU tutorial](https://cloudinit.readthedocs.io/en/latest/tutorial/qemu.html)
- [PR #687 - cc_apt_configure: add riscv64 as a ports arch](https://github.com/canonical/cloud-init/pull/687)
- [PR #689 - NoCloud: parse empty meta-data in _quick_read_instance_id](https://github.com/canonical/cloud-init/pull/689)
- [PR #2111 - systemd: Block login until config stage completes](https://github.com/canonical/cloud-init/pull/2111)
- [PR #5395 - perf(set_passwords): Run module in Network stage](https://github.com/canonical/cloud-init/pull/5395)
- [PR #6213 - test(apt): add questing version for hello pkg](https://github.com/canonical/cloud-init/pull/6213)
- [Issue #5342 - integration coverage wishlist](https://github.com/canonical/cloud-init/issues/5342)
- [Issue #3812 - ds-identify OpenStack is odd](https://github.com/canonical/cloud-init/issues/3812)
- [Commit 6ee0107 - cc_apt_configure: add riscv64 as a ports arch](https://github.com/canonical/cloud-init/commit/6ee0107)
- [Ubuntu 26.04 resolute cloud-init package](https://packages.ubuntu.com/resolute/cloud-init)
- [Ubuntu 24.04 noble riscv64 cloud-init package](https://packages.ubuntu.com/noble/riscv64/cloud-init)
- [Debian package tracker - cloud-init](https://tracker.debian.org/pkg/cloud-init)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=cloud-init)
- [PyPI JSON API for cloud-init (404)](https://pypi.org/pypi/cloud-init/json)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Summit Europe 2026 blog post](https://riseproject.dev/2026/06/26/industry-cooperation-takes-center-stage-at-risc-v-summit-europe-2026/)
- [PyYAML riscv64 wheel issue #909](https://github.com/yaml/pyyaml/issues/909)
- [PyYAML riscv64 wheel issue #877](https://github.com/yaml/pyyaml/issues/877)
- [PyYAML riscv64 wheel issue #924](https://github.com/yaml/pyyaml/issues/924)
- [PyYAML riscv64 wheel issue #926](https://github.com/yaml/pyyaml/issues/926)
- [systemd riscv64 sandboxing issue #39354](https://github.com/systemd/systemd/issues/39354)
- [netplan riscv64 CI issue #548](https://github.com/canonical/netplan/issues/548)
- [netplan riscv64 CI issue #550](https://github.com/canonical/netplan/issues/550)