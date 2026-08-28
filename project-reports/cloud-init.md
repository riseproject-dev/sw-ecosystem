---
title: cloud-init
parent: Project Reports
categories:
  - iaas
---

# cloud-init

**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;<br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for cloud-init<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[cloud-init](https://cloud-init.io/) ([github.com/canonical/cloud-init](https://github.com/canonical/cloud-init)) is the industry-standard tool for cross-cloud instance initialization. It handles user account creation, SSH key injection, network configuration, disk partitioning, package installation, and arbitrary script execution on first boot. It is the de-facto mechanism by which cloud providers (AWS, GCP, Azure, OpenStack, Hetzner, and others) provision Linux images at scale.

cloud-init is a pure-Python package. It ships no compiled C extensions, no native binaries, no assembly, and no architecture-specific numeric or SIMD code. The build system is Meson (minimum version 0.63.0). The installed artifacts are Python modules, shell scripts, templates, and systemd units. There is no `setup.py`, no `pyproject.toml` build backend, and no PyPI publication. Distribution is exclusively through OS package managers.

The project is maintained and controlled by [Canonical Ltd.](https://canonical.com/). All merge rights are held by Canonical employees. A Contributor License Agreement (CLA) is required for all external contributions; contact: Chad Smith (chad.smith@canonical.com). There is no independent foundation, no CNCF membership, and no published governance document.

License: GPLv3 OR Apache 2.0 (recipient's choice).

---

## 2. Port History and Upstreaming Timeline

RISC-V support in cloud-init reduces to a single code change and two bug fixes. There is no ongoing port effort.

| Date | Item | Author | Status | Description |
|------|------|--------|--------|-------------|
| 2020-11-25 | [PR #687](https://github.com/canonical/cloud-init/pull/687) | xnox (Canonical) | Merged | Added `riscv64` to `PORTS_ARCHES` in `cc_apt_configure.py`. Without this, apt on a riscv64 Ubuntu host would be directed to `archive.ubuntu.com` (which carries only amd64/i386), causing all apt operations to fail. One-line change, merged same day with no review discussion. |
| 2021-01-05 | [PR #689](https://github.com/canonical/cloud-init/pull/689) | xnox (Canonical) | Closed unmerged | Fixed a `TypeError` in `DataSourceNoCloud.py` when subiquity on riscv64 writes an intentionally-empty `meta-data` file to trigger the NoCloud datasource. The fix strategy was disputed (catching `TypeError` vs. guarding `md and iid_key in md`). Closed without merge; preferred fix noted but not confirmed implemented. [NEEDS VERIFICATION: whether the `md and iid_key in md` guard was applied in a subsequent commit] |
| 2023-07-10 | [PR #2111](https://github.com/canonical/cloud-init/pull/2111) | holmanb (Canonical) | Merged, later superseded | Fixed a race condition where TTY login became available before `cc_set_passwords` completed. Discovered by running the Ubuntu RISC-V unmatched image under `qemu-system-riscv64`. Fix: moved `Before=systemd-user-sessions.service` from `cloud-init.service` to `cloud-config.service`. Performance benchmarks (20-run hyperfine, amd64/Jammy only): mean time to first SSH was 16.103 s (main) vs. 16.166 s (patch) -- within noise. No riscv64 boot-time numbers were published. Superseded in June 2024 by [PR #5395](https://github.com/canonical/cloud-init/pull/5395), which moved `set_passwords` to the Network stage instead. |
| 2025-05-09 | [PR #6213](https://github.com/canonical/cloud-init/pull/6213) | blackboxsw (Canonical) | Merged | Updated integration test expected package versions for Ubuntu Questing. riscv64 appears incidentally in `rmadison` output in the PR description as a supported architecture for the test package. Not a riscv64-specific change. |

No additional riscv64-specific commits, issues, or PRs exist in the repository as of June 2026.

---

## 3. Upstream Support Tier

cloud-init publishes no formal architecture tier matrix. Architecture support is implicit: because the codebase is pure Python, any Linux platform with Python 3.8+ can run cloud-init without modification. There is no stated policy on new architecture ports. The practical tier system is inherited from Ubuntu's own architecture classification: architectures listed in `PORTS_ARCHES` in `cc_apt_configure.py` are treated as supported but directed to the Ubuntu ports mirror rather than the primary archive.

riscv64 has been in `PORTS_ARCHES` since November 2020 alongside `s390x`, `arm64`, `armhf`, `powerpc`, and `ppc64el`. There is no separate riscv64 tier designation in any project document.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

cloud-init has no architecture-specific subsystems in the conventional sense (no JIT compiler backends, no SIMD dispatch, no ISA extension probing). The full inventory of architecture-sensitive code paths is:

**`cloudinit/config/cc_apt_configure.py`, line 70:**

```python
PORTS_ARCHES = ["s390x", "arm64", "armhf", "powerpc", "ppc64el", "riscv64"]
```

`get_default_mirrors()` reads the host's dpkg architecture via `get_dpkg_architecture()`. If the result is in `PORTS_ARCHES`, the function returns `PORTS_MIRRORS` (pointing to `http://ports.ubuntu.com/ubuntu-ports`). If the architecture appears in neither list, the function raises `ValueError`. riscv64 is correctly handled; without PR #687 it would raise.

**`cloudinit/util.py` -- `is_x86()`:**

A helper that returns `True` for `x86_64`, `i386`, etc. riscv64 returns `False`, which is correct. No analogous `is_riscv64()` helper exists, but no current caller requires one.

**`cloudinit/dmi.py`:**

Lists `("aarch64", "amd64")` as valid DMI-capable architectures. riscv64 is absent. On riscv64 hardware, DMI data reads silently return `None`. This is a gap: cloud providers or bare-metal provisioning systems that supply identity or configuration via SMBIOS/DMI will not have that data available to cloud-init on riscv64. [NEEDS VERIFICATION: whether any production cloud-init datasource on riscv64 depends on DMI reads for instance identity]

No `.S` assembly files, no C source files, no Rust, no Go, no JIT, no SIMD, no RVV intrinsics, and no `__riscv` preprocessor macros exist anywhere in the repository. A full `find` of all `.S`, `.c`, and `.h` files returns zero results.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Meson (minimum 0.63.0).

**Standard build invocation (identical on all architectures):**

```
meson setup builddir -Dinit_system=systemd
meson install -C builddir
```

Available Meson options: `-Dinit_system`, `-Ddistro_templates`, `-Ddisable_sshd_keygen`, `-Dbash_completion`, `-Ddownstream_version`. No architecture-gating flags exist.

**Toolchain requirements:** Python 3.8+. No GCC or Clang version is specified anywhere. No QEMU requirement exists in the build system.

**Cross-compilation:** Not applicable. The project installs Python source files and data; no native compilation occurs.

**Dockerfiles:** None. No `Dockerfile`, no `Dockerfile.riscv64`, no `.ci/docker/` directory.

**QEMU in documentation:** The [cloud-init QEMU tutorial](https://cloudinit.readthedocs.io/en/latest/tutorial/qemu.html) uses `qemu-system-x86_64` with `noble-server-cloudimg-amd64.img`. It notes that non-x86 hosts should substitute the matching `qemu-system-<arch>` command and image, but provides no explicit riscv64 invocation.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because cloud-init is architecture-agnostic Python, the gap analysis collapses to: which Python-level code paths are conditioned on architecture, and are they correct for riscv64?

| Component | amd64 | arm64 | riscv64 | Gap |
|-----------|-------|-------|---------|-----|
| apt mirror selection | PRIMARY_ARCHES | PORTS_ARCHES | PORTS_ARCHES | None. All three correctly handled. |
| Boot/init config modules (grub, resizefs, growpart, mounts, disk_setup) | Full | Full | Full | None. No architecture gates; logic is filesystem-type and OS-variant based. |
| DMI/SMBIOS reads (`dmi.py`) | Full | Full | Returns None | Gap: riscv64 absent from valid DMI arch list. Silent failure; no error raised. |
| `is_x86()` helper | True | False | False | None. False is correct for riscv64. |
| Unit test coverage for apt mirror selection | Tested (`amd64`, `ppc64el`, `s390x`) | Not tested | Not tested | Gap: no test asserting `get_default_mirrors("riscv64")` returns `PORTS_MIRRORS`. |
| Integration test coverage | Full (26 CI workflows, amd64 only) | None | None | Gap: no non-x86 integration testing. |

The `dmi.py` gap is the only functional gap with potential correctness impact. All other gaps are test coverage deficiencies.

---

## 7. CI/CD Infrastructure

All 26 `.github/workflows/` files in the main branch were verified. Zero contain any reference to "riscv", "riscv64", "RISCV", or "risc-v".

**Confirmed workflow inventory:**

- Unit and lint: `10-daily-unit-lint.yml`, `22-pr-unit-python.yml`, `23-pr-unit-distro.yml` -- run on `ubuntu-latest` (amd64 GitHub-hosted) and `macos-latest`.
- Integration: `110`-`113` (LXD container), `120`-`123` (LXD VM), `130`-`133` (EC2) -- all dispatch through `100-dispatch-common.yml` on `ubuntu-latest`. Platforms tested: `lxd_container`, `lxd_vm`, `ec2`. No architecture matrix. No `arch:` parameter passed to LXD or pycloudlib EC2.
- Static analysis (TICS): `40-weekly-tics.yml` -- runs on `[self-hosted, linux, amd64, tiobe, noble]`, explicitly labelled amd64.
- Packaging, stale, linkcheck, CLA, format, shellcheck: all `ubuntu-latest`.

No `.gitlab-ci.yml`, `.cirrus.yml`, or `Jenkinsfile` is present (all 404).

No QEMU installation step, no `qemu-user-static`, and no binfmt registration appear in any workflow file.

[Issue #5342](https://github.com/canonical/cloud-init/issues/5342) (open, May 2024) contains the text "arm64 + riscv maybe?" as a wishlist item for non-x86 integration test coverage. It has zero comments, no assignee, no milestone, and no linked PRs. It is explicitly aspirational: the phrasing is a question, not a plan.

**Current CI verdict: no riscv64 CI exists. None is planned in any tracked issue with a concrete implementation path.**

---

## 8. Distribution and Release Status

cloud-init is a pure-Python package. The Debian/Ubuntu package architecture is `all` (not `riscv64`). The installed artifact is an architecture-independent `.deb`. There is no riscv64-compiled binary at any distribution point.

| Distribution | Package | riscv64 Available | Notes |
|---|---|---|---|
| Ubuntu 24.04 (noble) | [cloud-init on packages.ubuntu.com](https://packages.ubuntu.com/noble/riscv64/cloud-init) | Yes | `cloud-init_25.1.4-0ubuntu0~24.04.1_all.deb` available via `apt` on riscv64 Ubuntu hosts. Architecture field: `all`. |
| Debian (trixie/sid) | [tracker.debian.org/pkg/cloud-init](https://tracker.debian.org/pkg/cloud-init) | Yes, by virtue of `arch:all` | No per-architecture build required or tracked by Debian buildd. The buildd database shows "No entry in riscv64 database" for cloud-init, which is expected for `arch:all` packages. |
| Arch Linux RISC-V | [archriscv.felixc.at](https://archriscv.felixc.at) | Yes | cloud-init 26.1-1 present in the Arch Linux RISC-V `extra` repository. Some test dependencies (python-httpretty, python-responses, python-pytest) are noted as outdated. [NEEDS VERIFICATION: whether the outdated test deps affect runtime or only the test suite] |
| PyPI | [pypi.org](https://pypi.org) | N/A | cloud-init is not published to PyPI. HTTP 404 at `https://pypi.org/pypi/cloud-init/json`. |
| GitHub Releases | [github.com/canonical/cloud-init/releases](https://github.com/canonical/cloud-init/releases) | No riscv64-specific asset | The one binary in recent releases is `cloud-init-26.1-1.el9.noarch.rpm` (architecture-independent RPM). No riscv64 asset. |
| RISE wheel builder (GitLab project 56254198) | N/A | No | Redirects to PyPI, which 404s. cloud-init is not in the RISE wheel builder inventory. |

**Most recent release:** 26.1 (2026-02-28).

---

## 9. Dependencies

cloud-init's runtime Python dependencies (`requirements.txt`) and system-level dependencies (`packages/pkg-deps.json`, `packages/debian/control.in`) have the following riscv64 status:

| Dependency | Role | Type | riscv64 Status | Blocking Issues |
|---|---|---|---|---|
| Python 3 (CPython) | Runtime interpreter | Runtime | Builds on riscv64; no official tier assignment; JIT (PEP 744) not wired for riscv64; stack unwinding broken in 3.15 beta; unstable buildbot | No blocker for cloud-init's use case (imperative init logic; JIT and perf profiling irrelevant). See Python riscv64 status report for full detail. |
| jinja2 | Template rendering | Python pkg | Pure Python; no C extension | None |
| PyYAML | YAML parsing | Python pkg | C extension (`_yaml` via libyaml) builds on riscv64 but **no riscv64 wheel published to PyPI** (open issues [#877](https://github.com/yaml/pyyaml/issues/877), [#909](https://github.com/yaml/pyyaml/issues/909), [#924](https://github.com/yaml/pyyaml/issues/924), [#926](https://github.com/yaml/pyyaml/issues/926)). pip-based installs fall back to the slower pure-Python backend. Distro packages (Ubuntu `python3-yaml`, Fedora `python3-pyyaml`) ship the compiled extension. | Non-blocking for distro-managed installs; friction for pip/venv workflows. |
| requests | HTTP client (IMDS/metadata fetching) | Python pkg | Pure Python | None |
| oauthlib | OAuth signing (MAAS datasource) | Python pkg | Pure Python | None |
| configobj | INI-style config parsing | Python pkg | Pure Python | None |
| jsonpatch | Cloud-config merge patching | Python pkg | Pure Python | None |
| jsonschema | Cloud-config schema validation | Python pkg | Pure Python | None |
| OpenSSL (libssl/libcrypto) | TLS for HTTPS metadata fetches | C library | Full support since OpenSSL 3.0 (2022); 36 RISC-V-specific source files; dedicated CI pipeline covering 13 riscv64 configurations including RVV and Zba/Zbb/Zbc | None |
| iproute2 | Network configuration | System tool | Ships in all major Linux distributions on riscv64 | None |
| netplan.io | Network config rendering (Ubuntu/Debian) | System tool | Two closed riscv64 CI issues ([#548](https://github.com/canonical/netplan/issues/548), [#550](https://github.com/canonical/netplan/issues/550)) -- both fixed (timing/architecture-aware CI for slow architectures) | None |
| systemd | Init/service management; cloud-init integrates as systemd units | C daemon | 57 riscv64 issues total; CI riscv64 build coverage added (PR #42431 merged); ISA flags for RISC-V boot corrected (PR #42467 merged); open issue #39354 (sandboxing env fork failure, may be riscv64 kernel specific) | [Issue #39354](https://github.com/systemd/systemd/issues/39354) (open): sandboxing generator fork failure; could affect `systemd-resolved` or `systemd-networkd` on some riscv64 kernels. Not directly blocking cloud-init unit activation as of current data. |
| procps, dhcpcd/dhclient, e2fsprogs, cloud-guest-utils | Base system tools | System tools | Available for riscv64 in all major distros; no known riscv64-specific issues | None |
| meson | Build system (packaging only) | Build tool | Works on riscv64; pip install works everywhere | None |

**Risk summary for dependencies:**

1. PyYAML (medium): No riscv64 wheel on PyPI. Affects pip/venv workflows; distro-managed installs are unaffected.
2. Python 3 (low-medium): Untiered for riscv64; JIT and perf trampoline absent. Irrelevant for cloud-init's workload profile.
3. systemd (low): Issue #39354 is open but does not currently block cloud-init unit activation.
4. All other Python dependencies (no risk): pure Python, universal wheels.

---

## 10. Ecosystem Status

**RISE Project:** cloud-init is not a RISE Project focus. It is absent from all 16 funded RFP projects (RP001-RP016). It does not appear in any of the 27 RISE blog posts (May 2024 - June 2026). No RISE working group covers cloud-init. Canonical is a RISE General Member; any riscv64 cloud-init work would flow through Canonical's engineering priorities, not through RISE coordination.

**Corporate contributors for riscv64:** No corporate contributor (Microsoft, Amazon, Red Hat, or otherwise) has filed a riscv64-specific issue or PR. All riscv64-relevant changes were authored by Canonical employees (xnox, holmanb).

**Governance:** Canonical holds full control. External contributions require a CLA. Canonical accepts platform/distro patches from non-Canonical contributors (Microsoft Azure Linux, Amazon Linux, Red Hat, OpenNebula are all represented in the commit log), but no merge rights have been granted outside Canonical. A riscv64-specific contribution would be accepted if it passed code review and the contributor has signed the CLA.

---

## 11. Known Bugs and Active Issues

| Item | Status | riscv64 Impact |
|---|---|---|
| [Issue #5342](https://github.com/canonical/cloud-init/issues/5342) - integration coverage wishlist (includes "arm64 + riscv maybe?") | Open, no assignee, no milestone | No riscv64 integration CI exists. The wishlist item has made no progress since May 2024. |
| [Issue #3812](https://github.com/canonical/cloud-init/issues/3812) - ds-identify returns DS_MAYBE for OpenStack on riscv64 | Closed/expired (Jan 2021) | `ds-identify` wastes time probing OpenStack on riscv64, which is unlikely to run OpenStack. Not fixed. [NEEDS VERIFICATION: whether ds-identify behavior has changed since 2021] |
| `dmi.py` gap | No issue filed | riscv64 absent from valid DMI arch list; DMI reads return `None` silently. No issue is open tracking this. |
| PR #689 (NoCloud TypeError on empty meta-data -- riscv64 subiquity images) | Closed unmerged (Jan 2021) | The root scenario (subiquity on riscv64 writing empty meta-data) is a valid deployment pattern. Whether the preferred fix (`md and iid_key in md`) was applied in a later commit is not confirmed. |

No open correctness bugs, no open performance bugs, and no NaN/floating-point issues for riscv64 exist in the canonical/cloud-init issue tracker. A search for `riscv64 bug repo:canonical/cloud-init` returns zero results.

**Benchmark data:** None published anywhere for cloud-init on riscv64. The only quantitative cloud-init timing data involving riscv64 is from PR #2111 (2023), where the benchmarks were run on amd64, not riscv64.

---

## 12. Objections and Upstream Blockers

**There are no upstream blockers for running cloud-init on riscv64.**

The package is installable today on Ubuntu 24.04 riscv64 via `apt install cloud-init`. The one architecture-specific code path that could have caused failure (`cc_apt_configure.py`) was fixed in 2020. The `dmi.py` gap causes silent `None` returns for DMI reads; it does not prevent cloud-init from completing initialization.

The objections relevant to investment decisions are:

1. **No CI coverage.** Regressions on riscv64 will not be caught by upstream CI. A future change to `cc_apt_configure.py` could silently break the `PORTS_ARCHES` entry with no CI signal.
2. **No upstream ownership.** Canonical has not assigned any engineer to riscv64 cloud-init work. No roadmap item, no tracking issue, no milestone covers riscv64 beyond the wishlist note in #5342.
3. **PR #689 unresolved.** The NoCloud empty meta-data TypeError fix was not merged. Subiquity-based riscv64 provisioning workflows using empty meta-data files may still be affected.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

cloud-init on riscv64 is functionally complete for standard Ubuntu/Debian cloud provisioning scenarios. The `cc_apt_configure.py` fix (PR #687, 2020) covers the only required architecture-specific code path. The `dmi.py` gap requires a fix only if the target deployment uses DMI-based instance identity (relevant for bare-metal or certain hypervisor configurations).

Effort estimate for `dmi.py` fix: 1-2 person-days including test coverage. This is a straightforward addition of `riscv64` to the valid DMI arch list plus a unit test.

Effort estimate for PR #689 follow-up (NoCloud empty meta-data): 1 person-day to confirm current status and file or close the gap.

### 13.2 Performance Optimization

cloud-init is not a performance-sensitive workload. It runs once at instance first boot, executes imperative Python logic, calls system tools, and exits. There is no numerical computation, no hot loop, no JIT, and no SIMD. Boot-time benchmarks on amd64 show cloud-init contributes approximately 2.5 s to multi-user.target (from `systemd-analyze` data in PR #5395). Performance optimization investment in cloud-init is not justified on any architecture.

### 13.3 CI/CD Infrastructure

The absence of riscv64 CI is the primary long-term risk. Adding riscv64 integration test coverage requires either:

- A riscv64 LXD/KVM runner accessible to the Canonical GitHub Actions workflow (upstream contribution requiring Canonical approval and infrastructure), or
- A downstream CI fork maintaining riscv64 test runs independently.

The upstream path is complicated by Canonical's control of the CI infrastructure and the fact that issue #5342 has been open for over a year without progress. A direct contribution adding a riscv64 integration test runner would require Canonical to accept and maintain the runner infrastructure, which is not guaranteed.

Effort estimate for a minimal riscv64 unit test addition (covering `get_default_mirrors("riscv64")` and the `dmi.py` arch list): 1-2 person-days. This requires no runner infrastructure and is the most likely contribution to be accepted.

Effort estimate for full riscv64 integration test runner: 4-8 person-weeks to negotiate with Canonical, provision infrastructure, and implement. Outcome uncertain.

### 13.4 Ecosystem Enablement

cloud-init is a prerequisite for cloud infrastructure on any architecture. If the target deployment scenario is bare-metal or private cloud on riscv64 hardware, cloud-init functional correctness is required. The current state (functionally complete, untested) is adequate for production use on Ubuntu 24.04 riscv64 with the caveat that the `dmi.py` gap must be assessed for the specific deployment.

No RISE investment exists here; no other vendor is working on this. The investment required to close all identified gaps is small (approximately 3-5 person-weeks total across functional, test, and CI work).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `dmi.py` to include riscv64 in valid DMI arch list + unit test | 0.3 | Cloud infrastructure team | High (if bare-metal or DMI-dependent datasource is used; Low otherwise) |
| Functional | Confirm/fix PR #689 NoCloud empty meta-data TypeError on riscv64 subiquity images | 0.2 | Cloud infrastructure team | Medium (affects subiquity-based provisioning workflows) |
| CI/CD | Add unit tests for `get_default_mirrors("riscv64")` in `test_apt_source_v3.py` | 0.2 | Cloud infrastructure team | High (prevents silent regression in the one riscv64-specific code path) |
| CI/CD | Add riscv64 integration test runner (upstream, requires Canonical coordination) | 4-8 | Cloud infrastructure team + Canonical | Low (effort high, outcome uncertain, functional risk low given architecture-agnostic codebase) |
| Ecosystem | No action -- cloud-init 25.1.4 / 26.1 available on Ubuntu noble riscv64 and Arch RISC-V today | 0 | N/A | N/A |
| Performance | No action -- cloud-init has no performance-sensitive code paths | 0 | N/A | N/A |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [canonical/cloud-init repository](https://github.com/canonical/cloud-init)
- [PR #687 -- cc_apt_configure: add riscv64 as a ports arch](https://github.com/canonical/cloud-init/pull/687)
- [PR #689 -- NoCloud: parse empty meta-data in _quick_read_instance_id](https://github.com/canonical/cloud-init/pull/689)
- [PR #2111 -- systemd: Block login until config stage completes](https://github.com/canonical/cloud-init/pull/2111)
- [PR #5395 -- perf(set_passwords): Run module in Network stage](https://github.com/canonical/cloud-init/pull/5395)
- [PR #6213 -- test(apt): add questing version for hello pkg](https://github.com/canonical/cloud-init/pull/6213)
- [Issue #5342 -- integration coverage wishlist](https://github.com/canonical/cloud-init/issues/5342)
- [Issue #3812 -- ds-identify OpenStack is odd](https://github.com/canonical/cloud-init/issues/3812)
- [Commit 6ee0107 -- cc_apt_configure: add riscv64 as a ports arch](https://github.com/canonical/cloud-init/commit/6ee0107)
- [Ubuntu 24.04 noble riscv64 cloud-init package](https://packages.ubuntu.com/noble/riscv64/cloud-init)
- [Debian package tracker -- cloud-init](https://tracker.debian.org/pkg/cloud-init)
- [Arch Linux RISC-V package status](https://archriscv.felixc.at)
- [RISE Project RFP list](https://lf-rise.atlassian.net/wiki)
- [RISE Project blog](https://riseproject.dev/blog)
- [PyYAML riscv64 wheel issue #909](https://github.com/yaml/pyyaml/issues/909)
- [systemd riscv64 sandboxing issue #39354](https://github.com/systemd/systemd/issues/39354)
- [netplan riscv64 CI issue #548](https://github.com/canonical/netplan/issues/548)
- [netplan riscv64 CI issue #550](https://github.com/canonical/netplan/issues/550)