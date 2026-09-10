---
title: Trusted Firmware-A (TF-A)
parent: Project Reports
color: grey
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: Mbed TLS
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: dtc
    relation: build-dependency
    criticality: optional
  - name: Poetry
    relation: build-dependency
    criticality: optional
  - name: QCBOR
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="trusted-firmware-a-(tf-a)" %}

# Trusted Firmware-A (TF-A)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** grey<br/>
**Scope:** RISC-V (riscv64/linux) support status for Trusted Firmware-A (TF-A)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Trusted Firmware-A (TF-A) is the reference implementation of secure-world boot and runtime firmware for Arm A-Profile processors (Armv7-A, Armv8-A, Armv9-A), implementing the BL1/BL2/BL31/BL32 boot stages, the EL3 Secure Monitor, PSCI (Power State Coordination Interface), SMCCC (SMC Calling Convention) dispatch, and the S-EL2 Secure Partition Manager. It is hosted at [git.trustedfirmware.org](https://git.trustedfirmware.org/TF-A/trusted-firmware-a.git) under the Trusted Firmware organization, with copyright held by Linaro Limited, which provides governance, hosting, and administrative services. TF-A is licensed under BSD-3-Clause (`docs/license.rst`).

Governance is an open community model: contributions are reviewed and merged by listed maintainers and code owners against the project's Code Review Guidelines, via Gerrit (review.trustedfirmware.org), with technical direction discussed on a bi-weekly Technical Forum call. A Governing Board of member organizations (levels include Platinum/Diamond, which carry board voting rights) oversees the project per a Project Charter. Reported Governing Board members include Arm, Linaro (Platinum), Google, STMicroelectronics, Renesas, NXP, Futurewei, ProvenRun, Nordic Semiconductor, Texas Instruments, and Qualcomm (joined as Platinum, reported March 2026) [NEEDS VERIFICATION - membership roster sourced from press reporting, not a live Governing Board page].

Corporate maintainers identified in the `MAINTAINERS` file, by affiliation:
- **Arm** (large majority): Dan Handley, Soby Mathew, Sandrine Bailleux, Alexei Fedorov, Manish Pandey, Mark Dykes, Olivier Deprez, Bipin Ravi, Joanna Farley, Andre Przywara, Lauren Wehrmeister, Madhukar Pappireddy, Manish Badarkhe, Govindraj Raja, Chris Kay, Boyan Karatotev, Harrison Mutai
- **Google/Chromium**: Julius Werner (project maintainer), Jamie Fox (LTS maintainer)
- **NVIDIA**: Varun Wadekar (project + LTS maintainer)
- **STMicroelectronics**: Yann Gautier (project + LTS maintainer)
- **Linaro**: Etienne Carriere (Armv7-A architecture code owner)
- **Independent/unaffiliated**: Raghu Krishnamurthy

**Community culture on new architecture ports:** No public tier policy, RFC process, or maintainer statement addressing acceptance of a non-Arm architecture port was found anywhere in the `MAINTAINERS` file or project docs. This absence is not evidence of openness or hostility; it reflects that no non-Arm port has ever been proposed. TF-A's own project page and `readme.rst` scope the project explicitly to "Arm A-Profile architectures (Armv8-A and Armv7-A)."

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64 port has ever been proposed, started, or merged | Full source tree, Gerrit, mailing-list, and GitHub-mirror search (see Sections 7, 11, 12) |

No milestone table can be populated because there is no port history. There is no first riscv64 commit, no riscv64 contributor, and no riscv64 code in any branch, tag, or release of TF-A. The closest artifacts found in exhaustive search of Gerrit (review.trustedfirmware.org), the `tf-a@` and `tsc@` mailing lists, and the GitHub read-only mirror are three incidental, non-code mentions of the string "RISC-V", detailed in Section 12.

**Is it fully upstream? Not applicable** - there is nothing upstream to be "fully" or "partially" merged, because no riscv64 work exists at any stage.

## 3. Upstream Support Tier

No formal tier policy for architecture support exists in TF-A's documentation. The de facto tier structure is implicit in the build system: `make_helpers/defaults.mk` defines `ARCH` as a closed, two-value enum:

```
# The Target build architecture. Supported values are: aarch64, aarch32.
ARCH := aarch64
```

Every downstream conditional in the Makefile tree branches only on `aarch64` or `aarch32`. There is no third value, no extension point, and no documented mechanism to add one.

| Architecture | CI builds | CI tests | Upstream releases official binaries |
|---|---|---|---|
| aarch64 (arm64) | Yes | Yes (Jenkins/OpenCI, `tf-a-ci-scripts` qemu-\*/qemu_sbsa-\* jobs) | No prebuilt binaries published for any architecture - TF-A is source-only, build-it-yourself firmware [source: git.trustedfirmware.org tree inspection] |
| aarch32 (32-bit Arm) | Yes | Yes (same CI infrastructure, aarch32-specific jobs) | Same as above |
| riscv64 | Does not exist as a build target | N/A | N/A |
| amd64/x86 | Not applicable - TF-A does not target x86 at all | N/A | N/A |

Note: TF-A does not publish binary releases for **any** architecture, including its supported ones - it is a source-distributed firmware project that platform integrators build themselves per target board/SoC. This makes the "official binaries" column moot for amd64/arm64 comparison purposes; the meaningful comparison is CI build+test coverage, where riscv64 has zero.

## 4. Technical Architecture and RISC-V-Specific Subsystems

TF-A is boot/secure-world firmware, not a JIT, runtime, or SIMD-oriented library. Its architecture-specific subsystems are fundamentally tied to the Arm exception-level model (EL3/S-EL2) and TrustZone, which has no RISC-V structural equivalent. RISC-V's conceptually analogous privilege-level firmware role (M-mode runtime services) is implemented by an entirely separate, unrelated project: OpenSBI.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture headers (`include/arch/`) | N/A (not a TF-A target) | `include/arch/aarch64` | Missing - no `include/arch/riscv64` directory exists |
| Exception/boot vector table & entry assembly | N/A | Present (`bl1`/`bl31` AArch64 assembly) | Missing - `git grep -i riscv` across the full tracked tree returns exactly one incidental hit, an unrelated `__riscv` preprocessor guard in an imported LLVM compiler-rt file (`lib/compiler-rt/builtins/ctzdi2.c`), not TF-A code |
| BL1/BL2/BL31/BL32 boot stage code | N/A | Present, Armv7-A/Armv8-A only | Missing entirely |
| PSCI / SMCCC implementation | N/A | Present (Arm-specific SMC calling convention) | Missing - PSCI/SMCCC is an Arm-specific mechanism; RISC-V's equivalent (SBI) is implemented by OpenSBI, a different project |
| Platform port (`plat/`) | N/A | Many vendor platforms (arm, qemu, nvidia, nxp, amd, mediatek, allwinner, rockchip, xilinx, etc.) | Missing - zero riscv platform directories in `plat/` |
| Build system architecture selection | N/A | `ARCH=aarch64` | Missing - `ARCH` is a closed enum of `aarch64`/`aarch32` only; no riscv64 value exists anywhere in `make_helpers/*.mk` |

**Conclusion:** this is not a partial, scalar-fallback, or stub implementation - it is a complete absence of riscv64 code at every layer, consistent with TF-A's explicit design scope.

## 5. Build System, Cross-Compilation, and Toolchain

TF-A is built entirely with **GNU Make** (`make PLAT=<platform> ...`); there is no CMake build for TF-A itself (`CMakeLists.txt` at the repo root returns "Object is not found" via Gitiles - it does not exist). CMake (>=3.22) is only a prerequisite for supporting host tools, not the firmware build itself.

Toolchain prerequisites, per `docs/getting_started/prerequisites.rst`:

| Toolchain | Minimum version | Target |
|---|---|---|
| Arm Compiler | 6.23 | `arm-none-eabi` / `aarch64-none-elf` |
| Arm GNU Compiler | 15.2 | `arm-none-eabi` / `aarch64-none-elf` |
| Clang/LLVM | 18.1.8 | Same Arm targets |

No riscv64 toolchain (e.g., `riscv64-unknown-elf-gcc`) is mentioned anywhere in the prerequisites document or build system, because there is no riscv64 build target to compile for.

QEMU usage (`docs/plat/qemu.rst`) is entirely `qemu-system-aarch64` - every documented build/run invocation uses `CROSS_COMPILE=aarch64-linux-gnu-` or `aarch64-none-elf-` and `PLAT=qemu`. No `qemu-system-riscv64` invocation exists anywhere in the docs tree.

No Dockerfile exists in the repository root, and no `.ci/` directory exists. `.github/` contains only `SECURITY.md`, `dependabot.yml`, and `CODEOWNERS` - no GitHub Actions workflows of any kind.

**Known build failures for riscv64:** none can be reported because there is no riscv64 build attempt possible - `ARCH=riscv64` is not a recognized value and would fail immediately with an unrecognized-architecture error from the Makefile's own validation logic (inferred from the closed-enum structure; exact error text not captured in research).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | arm64 | amd64 | riscv64 |
|---|---|---|---|
| Boots as secure-world firmware | Yes | N/A (not a TF-A target) | No - no build target exists |
| PSCI power management | Yes | N/A | No |
| SMCCC dispatch | Yes | N/A | No |
| Trusted Board Boot (image authentication via Mbed TLS/OpenSSL) | Yes | N/A | No |
| Measured Boot | Yes | N/A | No |
| S-EL2 Secure Partition Manager | Yes | N/A | No |

**Functional gaps:** total - riscv64 cannot perform any TF-A function because no riscv64 build exists.

**Performance gaps:** not applicable - there is no riscv64 implementation to measure a performance delta against.

**Security hardening gaps:** not applicable for the same reason. No riscv64 mitigation code (e.g., Spectre/Meltdown workarounds analogous to TF-A's Arm-specific `SMCCC_ARCH_WORKAROUND_1/2` handling) exists or has been designed for RISC-V within TF-A.

**NaN/floating-point semantics issues:** not applicable - TF-A is boot firmware with no floating-point-sensitive numerics relevant to this comparison.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** This was confirmed by directly reading file content from two live clones:

1. `trusted-firmware-a` (HEAD `38269bb73d34b4a31100adf208a27e4c28e7d611`, cloned from [git.trustedfirmware.org/TF-A/trusted-firmware-a.git](https://git.trustedfirmware.org/TF-A/trusted-firmware-a.git)): `.github/` contains exactly `SECURITY.md`, `dependabot.yml`, `CODEOWNERS` - no `.github/workflows/`, no GitHub Actions at all. No `.gitlab-ci.yml`, `Jenkinsfile`, `.travis.yml`, `.circleci/`, or `azure-pipelines.yml` at the repo root. `git grep -il "riscv64\|risc-v" -- '*.yml' '*.yaml'` across the entire repo returns zero matches.

2. `tf-a-ci-scripts` (HEAD `96c6dafec8855b13cbff0434e5427dbb5103c89e`, cloned from [git.trustedfirmware.org/ci/tf-a-ci-scripts.git](https://git.trustedfirmware.org/ci/tf-a-ci-scripts.git)), the actual Jenkins/OpenCI job-config repository: `tf_config/`, `run_config/`, and `group/` directories contain only `qemu-*`/`qemu_sbsa-*` Arm targets (aarch32, aarch64, RME, SPM, TBB, etc.). `find . -iname "*riscv*" -o -iname "*rv64*"` across the entire tree returns zero files. The only `riscv` string hit anywhere in this repo is `tf-a-toolbox/uv.lock`, a Python dependency lockfile listing `manylinux_riscv64` PyPI wheel tags for an unrelated package (`charset_normalizer`) - not a CI job.

The [TrustedFirmware OpenCI User Guide](https://tf-ci-users-guide.readthedocs.io/) and [ci.trustedfirmware.org](https://ci.trustedfirmware.org/) describe this same Jenkins/OpenCI pipeline, confirming it targets only the Arm QEMU/hardware jobs found above.

No RISE runners are referenced anywhere in the CI-scripts repository.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | N/A | Yes | No |
| CI test | N/A | Yes | No |
| CI release-blocking | N/A | Yes (qemu-\*/qemu_sbsa-\* jobs) | N/A - no job exists |
| Hardware/QEMU | N/A | QEMU (`qemu-system-aarch64`) and hardware platforms | N/A |

## 8. Distribution and Release Status

TF-A publishes no prebuilt binaries for any architecture through any channel - it is a source-only, build-it-yourself firmware project. Specific checks performed:

- **PyPI**: `https://pypi.org/pypi/trusted-firmware-a-(tf-a)/json` and plain-name variants (`trusted-firmware-a`, `tf-a`) all return HTTP 404 ([PyPI JSON API](https://pypi.org/pypi/trusted-firmware-a/json)). No PyPI package exists under any tested name.
- **RISE riscv64 wheel builder** ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)): not applicable - the redirect chain terminates in the same 404, and TF-A does not appear among the 84 packages listed there.
- **Ubuntu 26.04 (resolute)**: [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=trusted-firmware-a&suite=resolute&searchon=names&section=all) returns zero matching packages for any architecture, not merely riscv64. The string "riscv64" appears on the results page only as a static architecture-filter link in Ubuntu's search-page boilerplate, not attached to any package hit.
- **Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=trusted%20firmware-a%20(tf-a))): no matching package.

**What a user must do to get a working binary:** clone the source, select an Arm platform via `PLAT=`, and cross-compile with `make` using an Arm-targeting toolchain (`arm-none-eabi-*` or `aarch64-none-elf-*`). There is no equivalent path for riscv64 because no riscv64 platform or architecture target exists to select.

## 9. Dependencies

| Dependency | Role in TF-A | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| OpenSSL (>=3.0) | Host-side `cert_create`/`encrypt_fw` tooling for X.509 cert generation and firmware authenticated encryption | Data not available: `project-graph` MCP server unreachable (CONNECTION_CLOSED) this session; SPARQL query not executed | Unknown | Unknown | Tracked separately in `project-reports/openssl.md` per `projects.yml` |
| Mbed TLS (git submodule, `Mbed-TLS/mbedtls`) | Vendored crypto backend compiled into BL1/BL2 for Trusted Board Boot verification and Measured Boot hashing | Data not available: same tooling outage | Unknown | Unknown | Listed in `projects.yml` scope; no dedicated status report exists |
| CMake (>=3.22) | Build-support tooling (not the firmware build itself, which uses Make) | Data not available: same tooling outage | Unknown | Unknown | Listed in `projects.yml`; no dedicated report yet |
| GNU Make (>=4.3) | Primary build orchestration | Data not available: same tooling outage | Unknown | Unknown | Listed in `projects.yml`; no dedicated report yet |
| GCC/Arm GNU Toolchain or Clang/LLVM (>=18.1.8) | Compiler toolchain, Arm-targeting only | Not directly relevant to riscv64 - these are cross-toolchains that target `aarch64-none-elf`/`arm-none-eabi`, not a riscv64 host or target concern | N/A | N/A | Listed in `projects.yml` as "LLVM"; no dedicated report yet |
| Device Tree Compiler (dtc, >=1.6.1) | Rebuilds FDT/DTB sources for some platform ports | Data not available: same tooling outage | Unknown | Unknown | Not in `projects.yml` |
| Poetry (>=1.3.2) | Python dependency management for build/CI tooling | Data not available: same tooling outage | Unknown | Unknown | Not in `projects.yml` |
| QCBOR (>=1.2, optional) | Only required for DICE Protection Environment (DPE) support | Data not available: same tooling outage | Unknown | Unknown | Not in `projects.yml` |
| libtl / libeventlog / libtpm (git submodules) | TF-A-project-maintained transfer-list, event-log, TPM support libraries | Not applicable - these are TF-A-org-hosted submodules, not general-purpose distro packages | N/A | N/A | Not in `projects.yml` |
| mv-ddr (git submodule, Marvell) | DDR PHY training code for specific Marvell platforms | Not applicable - vendor-specific platform code | N/A | N/A | Not in `projects.yml` |

**Caveat:** the `project-graph` MCP server failed to connect (CONNECTION_CLOSED) throughout this research session. This is a tooling outage, not evidence of absence - the planned Ubuntu 26.04/riscv64 SPARQL cross-checks for each dependency package (`libssl-dev`, `libmbedtls-dev`, `cmake`, `make`, `device-tree-compiler`, `python3-poetry`, `python3-sphinx`, `nodejs`, `clang`, `gcc-aarch64-none-elf`, `gcc-arm-none-eabi`) could not be executed and should be re-run once the server reconnects. Given the primary blocker (no riscv64 architecture target exists in TF-A itself), dependency-level riscv64 availability is moot for enabling TF-A specifically, but relevant for the host tooling used to build it (which already runs on riscv64 hosts independent of TF-A's own architecture support, per general ecosystem knowledge outside the scope of verified findings here).

**Deep-dive on JIT/SIMD/crypto/numerics dependencies:** Mbed TLS is the most architecturally relevant dependency (it is compiled directly into BL1/BL2 for boot-time cryptographic verification, unlike OpenSSL which is only used by host-side signing tools). No riscv64-specific assessment of Mbed TLS's crypto backend could be completed in this session due to the tooling outage; this is flagged as a follow-up item rather than reported as either confirmed-working or confirmed-broken.

Section 10 (Ecosystem Status) is omitted. TF-A is standalone boot firmware with no dependent package ecosystem (no Python/npm/Maven/Kubernetes-operator consumers depend on it as a library).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64 issues exist | N/A | N/A | No riscv64 code path exists in any TF-A issue tracker (Gerrit review.trustedfirmware.org, GitHub mirror `TrustedFirmware-A/trusted-firmware-a` issues, `ARM-software/tf-issues`) against which a bug could be filed |

No correctness or performance bugs specific to riscv64 exist, because no riscv64 implementation exists to contain bugs.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer, Governing Board member, or Technical Steering Committee statement was found opposing a hypothetical RISC-V port. The absence of a port reflects absence of any proposal, not a rejected one.

**Technical blockers:** TF-A's core value proposition - Arm EL3 Secure Monitor, PSCI, SMCCC, and TrustZone S-EL2 Secure Partition Management - is defined entirely in terms of Arm-specific privilege-level and exception-model concepts that have no structural equivalent in RISC-V's M-mode/S-mode privilege architecture. A riscv64 "port" of TF-A would not be a straightforward architecture retarget (as arm64-to-riscv64 ports of, e.g., a language runtime or compression library typically are); it would require redesigning the firmware's core abstractions around RISC-V's SBI (Supervisor Binary Interface) model, which is precisely the role that OpenSBI already fills as a separate, mature project.

**Organizational blockers:** RISE (RISC-V Software Ecosystem)'s Firmware Working Group has an explicit, documented project scope: TianoCore UEFI (EDK2), U-Boot, Coreboot, TF-M (Trusted Firmware-**M**, a distinct project for Armv8-M microcontroller-class secure processing that RISE has ported to RISC-V - see the wiki page ["TFM_00_01 - Secure Bootloader"](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8588656/TFM_00_01+-+Secure+Bootloader)), and OpenSBI. TF-A is not listed as in-scope in the `firmware-wg` repository README. No RISE-funded project (checked RP-numbered blog posts, e.g. [RP016 "Advancing OpenSBI Interrupt Handling"](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)) targets TF-A; the RP016 author's personal bio mentions past TF-A contribution experience, but the funded deliverable itself is OpenSBI-only.

**The only three RISC-V mentions found in TF-A's entire project history**, none of which constitute a blocker discussion or proposal:

1. Mailing list, April 12, 2021, François Ozog (Linaro) - ["Re: [TF-A] Proposal: TF-A to adopt hand-off blocks (HOBs)..."](https://lists.trustedfirmware.org/archives/list/tf-a@lists.trustedfirmware.org/message/R3NECOXDIBKEL4GIPOF6KMNYI6XNKYO3/): names "RiscV" once as a generic non-Arm example within scope of a cross-firmware (U-Boot/TF-A/CoreBoot) metadata-passing proposal. No RISC-V design or code discussed.
2. Mailing list, April 16, 2021, François Ozog - ["Re: [TF-A] [OCP-OSF] Firmware: Sustainability vs planned obsolescence"](https://lists.trustedfirmware.org/archives/list/tf-a@lists.trustedfirmware.org/message/HMIOBSHDFEL75CDYNSVJNQZGVOWI2CBG/): companion message repeating the same generic "RiscV" scope mention.
3. Gerrit change [11862](https://review.trustedfirmware.org/c/TF-A/trusted-firmware-a/+/11862), "feat(psci/from_bl32) Optionally allow PSCI SMCs from BL32," Florian Lugou (ProvenRun), created 2021-10-12, **ABANDONED** 2021-11-15 after maintainer Olivier Deprez (Arm) argued PSCI calls from secure world contradict the PSCI spec. In the review thread, Lugou remarks in passing that ProvenCore (a third-party trusted OS, not TF-A) "has been ported on other architectures, such as RISC-V where some of the TF-A functionalities are implemented by the M-mode software (OpenSBI for instance)" - describing a different OS using OpenSBI instead of TF-A, not a TF-A RISC-V port. The change was abandoned for reasons entirely unrelated to RISC-V (the team settled on static TOS configuration rather than dynamic PSCI-based capability discovery).

**Acceptance probability:** cannot be assessed because no proposal has ever been made to accept or reject. Given the architectural mismatch and the existence of OpenSBI as the functionally equivalent, already-mature RISC-V project, a from-scratch RISC-V port of TF-A specifically (rather than continued investment in OpenSBI) appears to have no stated rationale in any source reviewed.

## 13. Readiness Assessment

- **Color:** grey (arch-exclusive)
- **Release provider:** none
- Not an optimization-purpose project - Section 2 of the color model (RISC-V-specific code coverage) does not apply. TF-A's value proposition is Arm-specific secure-world firmware behavior (PSCI, SMCCC, TrustZone), not algorithmic performance that could be delivered via generic C plus optional architecture-specific speedups.
- **Justification:** TF-A's architecture is exclusive to Arm A-Profile by design, not merely untested on RISC-V. The build system's `ARCH` variable is a closed enum of `aarch64`/`aarch32` only ([`make_helpers/defaults.mk`](https://git.trustedfirmware.org/TF-A/trusted-firmware-a.git)), `include/arch/` contains only `aarch32` and `aarch64`, and the project's core function - Arm EL3 Secure Monitor, PSCI, SMCCC, TrustZone S-EL2 SPM - implements Arm-specific privilege-level concepts with no RISC-V structural equivalent. RISC-V's functionally analogous secure/M-mode firmware role is served entirely by a separate, unrelated project (OpenSBI), not by any TF-A code path. This matches the grey/arch-exclusive case in the color model (architecture concept not applicable by design, comparable to Arm-exclusive libraries like ARM Compute Library), rather than orange (which implies an as-yet-untested but plausible target).
- **Pending work that could change the grade:** none identified. No open Gerrit change, GitHub issue, mailing-list RFC, or RISE-funded project (RP-numbered) proposes a riscv64 port of TF-A as of 2026-09-08. RISE's Firmware Working Group scope explicitly covers TF-M, U-Boot, Coreboot, EDK2, and OpenSBI - not TF-A - so no near-term RISE involvement is expected to shift this classification. The grade would change only if a maintainer or Governing Board member initiated a formal RISC-V-firmware-model redesign proposal, which has not happened.

## 14. Investment Analysis

RISE has made zero investment in TF-A specifically (confirmed in Section 12) - its RISC-V firmware effort is directed entirely at OpenSBI, TF-M, U-Boot, Coreboot, and EDK2. No work item below is already covered by RISE or any other party.

### 14.1 Functional Enablement

A functional riscv64 "port" is not a conventional architecture retarget. It would require: (1) designing a RISC-V-native equivalent of TF-A's EL3 Secure Monitor concept mapped onto RISC-V M-mode/S-mode privilege transitions, (2) either reimplementing PSCI/SMCCC semantics on top of RISC-V's SBI, or defining a new RISC-V-native power-management/secure-monitor ABI within TF-A, and (3) a full new `plat/` platform port (e.g., QEMU RISC-V virt) plus Trusted Board Boot verification logic. Given that OpenSBI already delivers the M-mode runtime-services role RISC-V platforms use today, this work would substantially duplicate existing, mature functionality rather than close a gap. Data not available for a person-week estimate: no design proposal, RFC, or prototype exists anywhere in the searched sources to anchor a scope estimate.

### 14.2 Performance Optimization

Not applicable - TF-A is not an optimization-purpose project, and no riscv64 implementation exists to optimize.

### 14.3 CI/CD Infrastructure

Would require: standing up a new `tf_config`/`run_config`/`group` job class in `tf-a-ci-scripts` targeting `qemu-system-riscv64`, contingent entirely on a functional port existing first (Section 14.1). No effort estimate is offered independent of that prerequisite, since CI cannot test code that does not exist.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 was omitted because TF-A has no dependent package ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Architectural redesign: RISC-V-native secure-monitor/privilege-transition model to replace Arm EL3/PSCI/SMCCC concepts | Data not available - no prior design work exists to scope from | Unassigned | Low - functional need already served by OpenSBI |
| Functional | New `plat/` platform port (e.g., QEMU RISC-V virt) contingent on above | Data not available | Unassigned | Low |
| CI/CD | New riscv64 job class in `tf-a-ci-scripts` | Data not available - blocked on functional port existing | Unassigned | Low |
| Ecosystem | N/A | N/A | N/A | N/A |

**Recommendation:** given (1) the architectural mismatch between TF-A's Arm-specific abstractions and RISC-V's privilege model, (2) the existence of a mature, RISE-supported functional equivalent (OpenSBI) already serving RISC-V's secure/M-mode firmware needs, and (3) zero community, maintainer, or RISE interest expressed anywhere in TF-A's history, this is assessed as **low priority for direct investment**. Continued investment in OpenSBI (and, for the microcontroller-class secure-boot use case, TF-M, which RISE is already porting) is the more direct path to equivalent value than building a new TF-A riscv64 port from scratch.

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [Trusted Firmware-A source repository](https://git.trustedfirmware.org/TF-A/trusted-firmware-a.git)
- [TF-A project homepage](https://www.trustedfirmware.org/projects/tf-a/)
- [TF-A CI job-config repository (tf-a-ci-scripts)](https://git.trustedfirmware.org/ci/tf-a-ci-scripts.git)
- [TrustedFirmware OpenCI User Guide](https://tf-ci-users-guide.readthedocs.io/)
- [TrustedFirmware CI dashboard](https://ci.trustedfirmware.org/)
- [Gerrit code review: change 11862, "feat(psci/from_bl32) Optionally allow PSCI SMCs from BL32" (ABANDONED)](https://review.trustedfirmware.org/c/TF-A/trusted-firmware-a/+/11862)
- [Mailing list: "Re: [TF-A] Proposal: TF-A to adopt hand-off blocks (HOBs)..."](https://lists.trustedfirmware.org/archives/list/tf-a@lists.trustedfirmware.org/message/R3NECOXDIBKEL4GIPOF6KMNYI6XNKYO3/)
- [Mailing list: "Re: [TF-A] [OCP-OSF] Firmware: Sustainability vs planned obsolescence"](https://lists.trustedfirmware.org/archives/list/tf-a@lists.trustedfirmware.org/message/HMIOBSHDFEL75CDYNSVJNQZGVOWI2CBG/)
- [PyPI JSON API - trusted-firmware-a (404, no package exists)](https://pypi.org/pypi/trusted-firmware-a/json)
- [RISE Project Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu package search - trusted-firmware-a (resolute/26.04, zero results)](https://packages.ubuntu.com/search?keywords=trusted-firmware-a&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=trusted%20firmware-a%20(tf-a))
- [RISE Firmware Working Group repository](https://github.com/riseproject-dev/firmware-wg)
- [RISE blog: "Advancing OpenSBI Interrupt Handling" (RP016)](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE Confluence wiki: "TFM_00_01 - Secure Bootloader"](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8588656/TFM_00_01+-+Secure+Bootloader)
- [RISE Project blog](https://riseproject.dev/blog)
- [GitHub read-only mirror: TrustedFirmware-A/trusted-firmware-a](https://github.com/TrustedFirmware-A/trusted-firmware-a)
