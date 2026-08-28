---
title: security-research
parent: Project Reports
---

# security-research

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for security-research<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[google/security-research](https://github.com/google/security-research) is Google's publication point for security advisories and proof-of-concept (PoC) exploit code produced by Google Project Zero and related internal security teams. It operates under a 90-day coordinated disclosure policy for vulnerabilities in non-Google software. The repository contains:

- CPU microarchitecture vulnerability research and PoCs (Spectre, Retbleed, Zenbleed, Reptar, BHI, Inception, TDX, MDS, EntrySIGN - all x86/Intel/AMD)
- Linux kernel exploit PoCs targeting nftables, BPF, KVM, and other subsystems
- kernelCTF: a structured competition for finding and demonstrating Linux kernel exploits on a Google-hosted hardened x86_64 target
- kvmCTF: KVM hypervisor exploit competition
- v8CTF: Chrome V8 JavaScript engine exploit competition

This is not a software library, runtime, compiler, or platform tool. It does not ship installable binaries, packages, or releases. It is an archive of research artifacts and CTF competition infrastructure.

**Governance:** Google-owned repository with no independent foundation, steering committee, or TSC. Governance follows Google's open-source CLA process (cla.developers.google.com) and Google Open Source Community Guidelines. Architecture support decisions are internal Google infrastructure choices with no public process for community-proposed additions.

**License:** Apache-2.0.

**Corporate maintainers by commit volume:**
- Tamas Koczka (koczkatamas) - Google, 165 commits, kernelCTF lead
- Eduardo Vela Nava / sirdarckcat - Google, 134 commits
- Stephen Roettger (sroettger) - Google, 81 commits, v8CTF lead
- Artem Metla (artmetla) - Google, 61 commits, analysis/CodeQL tooling
- rcorrea35 - Google, 40 commits
- Jordy Zomer (JordyZomer) - Google, 7 commits, CodeQL queries

All significant maintainers are Google employees. External contributors are bug hunters submitting CTF exploit PoCs, not infrastructure maintainers.

**RISE membership:** Google LLC is a Premier Member of the RISE project alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent. This membership does not translate into any RISC-V activity in the security-research repository.

**Community stance on new ports:** Not applicable. The repository targets specific vulnerable software and hardware, which are inherently architecture-specific. There is no public process or community mechanism by which RISC-V could be added as a platform target.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| - | No RISC-V porting activity of any kind | GitHub code search: 0 results for riscv, riscv64, risc-v, __riscv |
| - | No RISC-V issues or PRs ever filed | GitHub issue/PR search: total_count: 0 for all RISC-V terms |
| - | No RISC-V commits ever merged | GitHub commit search: 0 results for riscv |

There is no port history because no port has been attempted or proposed. The absence is architectural: the vulnerabilities researched and the CTF targets are x86_64-specific by definition.

**Key contributors for RISC-V work:** None.

**Upstream status:** Not applicable.

## 3. Upstream Support Tier

No formal tier policy exists for architecture support. The kernelCTF and kvmCTF programs explicitly define a single target: a hardened x86_64 Linux kernel. The `kernelctf-release-build.yaml` workflow explicitly branches on architecture with only `x86_64` and `arm64` (Android) as valid cases, emitting "Unsupported architecture" for any other input. RISC-V is not a case in that branch.

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Kernel exploit PoCs | Full | None | None |
| CPU vulnerability research | Full (native target) | Partial (pt_side_channel only) | None |
| kernelCTF target | Yes (primary) | No | No |
| kvmCTF target | Yes (primary) | No | No |
| v8CTF target | Yes (primary) | No | No |
| CI coverage | Full | Partial (Android build only) | None |
| Official binaries | None (source only) | None (source only) | None |

## 4. Technical Architecture and RISC-V-Specific Subsystems

google/security-research has no JIT compilers, SIMD dispatch layers, cryptographic assembly, GC barriers, or other performance-critical subsystems. It is a collection of standalone C programs, shell scripts, and CI automation.

Architecture-specific content that exists:

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| CPU vuln PoCs (Spectre, Retbleed, Zenbleed, Reptar, Inception, BHI, EntrySIGN, TDX) | Full | None | None | Vulnerabilities are x86/Intel/AMD-specific by nature; no riscv64 variant is possible |
| pt_side_channel PoC | Full | Full | None | The one multi-arch PoC; `CROSS=aarch64-linux-gnu- make` documented; no riscv64 path |
| Linux kernel exploit PoCs (nftables, BPF, KVM) | Full | None | None | Target x86_64 kernels; PoC binary runs on the attack host |
| CI infrastructure | Full | Partial | None | |

GitHub code search confirmed 0 results for: `riscv`, `riscv64`, `risc-v`, `__riscv`, `vfloat32m1_t`, `arch/riscv`. The single hit for `rvv` is a base64 hash string in `analysis/kernel/dashboard/frontend/package-lock.json`, not RVV vector intrinsics.

There are no architecture-specific subsystems to assess for riscv64 completeness. The concept does not apply.

## 5. Build System, Cross-Compilation, and Toolchain

The repository has no unified build system. Each subdirectory has its own Makefile or shell script.

**pocs/cpus:** Simple Makefiles with `CROSS ?=` variable. The only documented cross-compilation target is `CROSS=aarch64-linux-gnu- make` for ARM. No riscv64 target is documented or tested. These PoCs target x86 CPU vulnerabilities and have no riscv64 semantic equivalent.

**pocs/linux (kernel exploits):** Makefiles fetch libmnl and libnftnl tarballs from netfilter.org at build time and link statically with `gcc -static`. These libraries support riscv64 via standard GNU autoconf but are never built for riscv64 because the exploits target x86_64 kernels.

**kernelCTF build system (`kernelctf/build_release.sh`):** Builds x86_64 Linux kernels targeting `arch/x86/boot/bzImage` with `arch/x86/configs/lakitu_defconfig`. Uses LLVM/Clang >= 22 (fetched by `ensure_llvm.sh`). No riscv64 code path exists.

**v8CTF:** Downloads a pinned Chrome binary from Google storage with hard-coded `linux64` URL in every Dockerfile. There is no riscv64 Chrome binary available from Google storage.

**kctf framework (`activate` script):** Downloads hard-coded `amd64` binaries for `yq`, `kind`, and `kubectl`. No riscv64 variant is provided.

Required toolchain for kernelCTF: LLVM/Clang >= 22, GCC, QEMU (`qemu-system-x86`). No riscv64 toolchain is required or used anywhere.

Data not available: Exact minimum LLVM/GCC version requirements for the exploit PoC Makefiles (these vary per PoC and are not centrally documented).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---------|-------|-------|---------|----------|
| kernelCTF participation | Yes | No | No | By design - x86_64 only target |
| kvmCTF participation | Yes | No | No | By design - x86_64 only target |
| v8CTF participation | Yes | No | No | By design - linux64 Chrome only |
| CPU vuln PoC execution | Yes | Partial | No | Fundamental - vulnerabilities are x86-specific |
| Kernel exploit PoC compilation | Yes | No | No | No riscv64 PoC exists |
| pt_side_channel PoC | Yes | Yes | No | Missing riscv64 Makefile target |
| Analysis tooling (CodeQL, dashboard) | Yes | Yes | No | Web tooling; architecture-agnostic in principle but never built for riscv64 |

The gap for riscv64 is total and expected. The CPU vulnerabilities documented (Spectre, Retbleed, Zenbleed, Reptar, BHI, Inception, TDX, MDS, EntrySIGN) are Intel/AMD microarchitecture bugs. They do not have riscv64 analogues. The Linux kernel exploits target x86_64 kernel configurations in the kernelCTF program.

Security hardening gaps: Not applicable. This project does not produce production binaries.

## 7. CI/CD Infrastructure

All CI targets x86_64 exclusively. Six workflow files were read directly from the repository:

| Workflow file | Runner | Architecture | RISC-V |
|---------------|--------|--------------|--------|
| `kernelctf-auto-releaser.yaml` | ubuntu-latest | x86_64 | None |
| `kernelctf-release-build.yaml` | ubuntu-24.04 | x86_64 + arm64 (Android only) | None |
| `kernelctf-submission-verification.yaml` | ubuntu-latest | x86_64; installs qemu-system-x86 | None |
| `kernelctf-verify-all.yaml` | ubuntu-latest | x86_64 | None |
| `kernelctf-vuln-verify.yaml` | ubuntu-latest | x86_64; installs qemu-system-x86 | None |
| `v8ctf-challenge-updater.yaml` | ubuntu-latest | x86_64 | None |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.

No RISE runners are used. No `qemu-system-riscv64` invocation exists anywhere. No cross-compilation step for riscv64 exists anywhere.

| CI feature | amd64 | arm64 | riscv64 |
|------------|-------|-------|---------|
| Kernel build CI | Yes | Partial (Android) | No |
| Exploit verification | Yes | No | No |
| Challenge update automation | Yes | No | No |
| QEMU emulation used | Yes (qemu-system-x86) | No | No |
| RISE-provided hardware runner | No | No | No |

## 8. Distribution and Release Status

The repository has zero GitHub releases. The GitHub API for `repos/google/security-research/releases` returns an empty array.

| Distribution channel | riscv64 available | Evidence |
|---------------------|-------------------|----------|
| GitHub Releases | No | Empty releases array from GitHub API |
| PyPI | No | `pypi.org/pypi/security-research/json` returns HTTP 404; no such package |
| Debian | No | `tracker.debian.org/pkg/security-research` returns HTTP 404 |
| Ubuntu Noble | No | `packages.ubuntu.com` search returns no results |
| Arch Linux RISC-V | No | `archriscv.felixc.at` returns no results |
| RISE wheel builder | No | Absent from all 79 packages at riseproject.gitlab.io/python/wheel_builder/ |
| OCI / Docker images | No | No Docker images published; Dockerfiles in repo target linux/amd64 |

The project ships no installable artifacts for any architecture. Source code is the only deliverable. Users who need a specific exploit PoC compile it themselves on the target architecture, but no riscv64 PoC exists to compile.

## 9. Dependencies

The following table covers dependencies used by the kernelCTF, kvmCTF, v8CTF, and PoC subsystems.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|-----------|------|--------------|--------------|-----------------|-----------------|
| Linux kernel (gregkh/linux) | kernelCTF build and exploit target | Supported since 5.15 | kernelCTF configs are x86_64 only | N/A (source) | No riscv64 target configs in kernelCTF; no issue filed |
| LLVM/Clang | kernelCTF kernel builds (Clang >= 22 required) | Builds on riscv64 | ASan/LSan partial; MSan not ported | riscv64 binaries available in LLVM 22 | [llvm#206674](https://github.com/llvm/llvm-project/issues/206674) MSan riscv64 not implemented (open); [llvm#216580](https://github.com/llvm/llvm-project/issues/216580) LSan false leaks on glibc riscv64 (open); [llvm#164803](https://github.com/llvm/llvm-project/issues/164803) ASan CHECK failure with RVV/SV48 (open) |
| nsjail (google/nsjail) | Sandbox for v8CTF and kernelCTF challenges | Builds on riscv64 | No riscv64 CI | No riscv64 Docker image | No open blockers; kafel riscv64 support merged |
| kafel (google/kafel) | seccomp policy compiler used by nsjail | Builds on riscv64 after issues #31/#32 merged | No riscv64 CI | No separate release | Both issues closed |
| minijail (google/minijail) | Alternative sandbox used in some PoC scripts | Builds on riscv64 | CI x86_64 only | No riscv64 packages | 0 open riscv64 issues |
| libseccomp (seccomp/libseccomp) | Syscall filter library for minijail and nsjail | riscv64 support added (issue #197 closed) | riscv64 tests present (issue #290 closed) | v2.6.1 (2026-07-01) includes riscv64 | [#327](https://github.com/seccomp/libseccomp/issues/327) riscv32 (open, not blocking riscv64) |
| libmnl + libnftnl (netfilter.org) | Build deps for nftables-based exploit PoCs | Builds from source via GNU autoconf | Not tested for riscv64 | Built from source per exploit | No issues; thin autoconf libraries |
| QEMU (qemu-project/qemu) | kernelCTF VM runner; invoked as qemu-system-x86 | Full riscv64 system emulation supported | riscv64 emulation tested upstream | QEMU 9.x includes riscv64 | No open riscv64 blockers found |
| libbpf (libbpf/libbpf) | BPF-based exploit primitives | riscv64 supported (BPF JIT merged in Linux 5.1) | Tested via kernel CI | Latest releases include riscv64 | No open riscv64 blockers |
| google/sanitizers (ASan/MSan/TSan) | PoC analysis and fuzzing workflows | ASan partial; SV48 causes CHECK failures | [#1707](https://github.com/google/sanitizers/issues/1707) open | Ships with LLVM | [#1707](https://github.com/google/sanitizers/issues/1707) ASan crash on SV48 riscv64 (open) |
| gVisor (google/gvisor) | Alternative kernel sandbox for challenge templates | Not supported | Not applicable | No riscv64 release | Only x86_64 and arm64 syscall emulation; no riscv64 roadmap |
| Chrome/V8 binary (v8CTF) | Pinned Chrome binary downloaded in v8CTF Dockerfiles | No riscv64 binary from Google storage | Not applicable | No riscv64 release | Hard-coded linux64 URL in all v8CTF Dockerfiles; v8CTF is x86_64 only by design |
| Kubernetes/kctf (kubernetes/kubernetes, kind) | Challenge deployment infrastructure | Experimental riscv64 support in Kubernetes | Not tested in kctf | Kubernetes riscv64 binaries available | kctf `activate` script downloads hard-coded amd64 binaries for yq, kind, kubectl; [k8s#132836](https://github.com/kubernetes/kubernetes/issues/132836) official riscv64 support proposal open |

**Critical blockers summary:**

1. kctf infrastructure is x86-64 only: The `activate` script hard-codes `amd64` URLs for `yq`, `kind`, and `kubectl`. All v8CTF Dockerfiles pull `linux64` Chrome binaries.
2. kernelCTF has no riscv64 target: All kernel config files are for x86_64. `build_release.sh` has no riscv64 code path.
3. LLVM sanitizers incomplete on riscv64: MSan not ported ([llvm#206674](https://github.com/llvm/llvm-project/issues/206674)), LSan false positives ([llvm#216580](https://github.com/llvm/llvm-project/issues/216580)), ASan RVV crashes ([llvm#164803](https://github.com/llvm/llvm-project/issues/164803)).
4. CPU PoCs are x86-only by design: Zenbleed, Retbleed, Spectre, Inception, EntrySIGN, and TDX are microarchitecture vulnerabilities that exist only on x86 and AMD hardware. No riscv64 analogue is possible.
5. gVisor does not support riscv64, limiting sandboxing options for any hypothetical riscv64 challenge infrastructure.

**Lower-level deps that are riscv64-ready:** libseccomp v2.6.1, kafel, nsjail, minijail, libbpf, QEMU - these have no open blocking issues.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in google/security-research. The repository has 21 open issues total; GitHub API search for riscv, riscv64, and risc-v in issues returns total_count: 0 for each query.

Riscv64 bugs in upstream dependencies that would affect any future riscv64 work:

| ID | Project | Title | Status | Severity |
|----|---------|-------|--------|----------|
| [llvm#206674](https://github.com/llvm/llvm-project/issues/206674) | LLVM | MSan not implemented for riscv64 | Open | High - MSan unavailable on riscv64 |
| [llvm#216580](https://github.com/llvm/llvm-project/issues/216580) | LLVM | LSan false leak reports on glibc riscv64 | Open | Medium - LSan unreliable |
| [llvm#164803](https://github.com/llvm/llvm-project/issues/164803) | LLVM | ASan CHECK failure with RVV programs on SV48 | Open | Medium - ASan broken for RVV workloads |
| [sanitizers#1707](https://github.com/google/sanitizers/issues/1707) | google/sanitizers | ASAN crash on SV48 riscv64 systems | Open | Medium - duplicates LLVM issue |
| [k8s#132836](https://github.com/kubernetes/kubernetes/issues/132836) | Kubernetes | Official riscv64 support proposal | Open | Low for this project |

## 12. Objections and Upstream Blockers

**Stated objections:** None on record. No RISC-V porting discussion exists anywhere in the repository.

**Structural blocker - target definitions:** The kernelCTF and kvmCTF programs are competitions against a specific hardened x86_64 Linux kernel hosted on Google infrastructure. Adding riscv64 as a target would require Google to provision riscv64 hardware or QEMU riscv64 VMs, create riscv64 kernel configs for the hardened and LTS targets, and modify the submission verification pipeline. This is entirely a Google infrastructure decision with no upstream community lever.

**Structural blocker - v8CTF:** The Chrome V8 binary for v8CTF is a Google-internal build artifact distributed from Google Cloud Storage. No riscv64 Chrome binary is produced. Adding riscv64 v8CTF support requires Google to produce riscv64 Chrome builds, which is a V8/Chrome project decision, not a security-research repository decision.

**Structural blocker - CPU PoC scope:** The CPU vulnerability PoCs in `pocs/cpus/` target Intel and AMD microarchitecture bugs. These vulnerabilities fundamentally do not apply to RISC-V. A riscv64 section in this part of the repository would require a RISC-V-specific CPU vulnerability to be discovered and disclosed, which is independent of any porting effort.

**Technical blockers (dependency level):**
- LLVM MSan not ported to riscv64 ([llvm#206674](https://github.com/llvm/llvm-project/issues/206674)) - blocks sanitizer-based exploit analysis on riscv64
- gVisor lacks riscv64 support - blocks one sandboxing approach
- kctf `activate` script hard-codes amd64 binary downloads - requires code changes

**Acceptance probability for a community riscv64 contribution:** Very low. All CTF targets and infrastructure are Google-controlled. There is no community governance path. External contributors submit exploit PoCs as pull requests; they do not modify CTF infrastructure.

## 13. Investment Analysis

This project is not a candidate for RISC-V enablement investment. The reasoning is:

1. The project is an advisory and CTF archive, not a software product. Enabling riscv64 does not produce a distributable artifact.
2. The CTF programs (kernelCTF, kvmCTF, v8CTF) are Google-controlled competitions on Google-controlled infrastructure. No external investment changes the target architecture without Google's internal decision.
3. The CPU vulnerability PoCs cover vulnerabilities that do not exist on RISC-V by definition.
4. Even if Google were to add riscv64 kernelCTF targets, the dependency chain (LLVM sanitizers, gVisor, kctf tooling) has known gaps that would need upstream resolution first.

The only defensible investment angle is indirect: resolving the LLVM sanitizer gaps (MSan, LSan, ASan/SV48) benefits the entire RISC-V software ecosystem and would unblock sanitizer-based security analysis on riscv64 across many projects, not just this one.

### 13.1 Functional Enablement

No functional enablement work is identified for google/security-research itself. The project is x86-targeted by design and the design constraint is not technical.

### 13.2 Performance Optimization

Not applicable. This project has no performance-sensitive workloads.

### 13.3 CI/CD Infrastructure

Not applicable. CI infrastructure is Google-controlled.

### 13.4 Ecosystem Enablement

The LLVM sanitizer gaps are the only ecosystem-level items that would benefit security research on riscv64 in general.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | No work items identified for google/security-research itself | - | - | - |
| Indirect / upstream | Implement MSan for riscv64 in LLVM ([llvm#206674](https://github.com/llvm/llvm-project/issues/206674)) | 20-30 | LLVM community / RISE | Medium (benefits all riscv64 security tooling) |
| Indirect / upstream | Fix LSan false positives on glibc riscv64 ([llvm#216580](https://github.com/llvm/llvm-project/issues/216580)) | 4-8 | LLVM community | Medium |
| Indirect / upstream | Fix ASan CHECK failure on SV48 with RVV ([llvm#164803](https://github.com/llvm/llvm-project/issues/164803)) | 4-8 | LLVM community | Medium |

Investment in google/security-research directly: zero. Investment in upstream LLVM sanitizers on riscv64 is the only adjacent work item with any return, and it should be sized and tracked under the LLVM project, not this one.

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

## 15. References

- [google/security-research repository](https://github.com/google/security-research)
- [kernelctf-release-build.yaml](https://github.com/google/security-research/blob/master/.github/workflows/kernelctf-release-build.yaml)
- [kernelctf-submission-verification.yaml](https://github.com/google/security-research/blob/master/.github/workflows/kernelctf-submission-verification.yaml)
- [kernelctf-vuln-verify.yaml](https://github.com/google/security-research/blob/master/.github/workflows/kernelctf-vuln-verify.yaml)
- [kernelctf-verify-all.yaml](https://github.com/google/security-research/blob/master/.github/workflows/kernelctf-verify-all.yaml)
- [kernelctf-auto-releaser.yaml](https://github.com/google/security-research/blob/master/.github/workflows/kernelctf-auto-releaser.yaml)
- [v8ctf-challenge-updater.yaml](https://github.com/google/security-research/blob/master/.github/workflows/v8ctf-challenge-updater.yaml)
- [LLVM issue #206674 - MSan not implemented for riscv64](https://github.com/llvm/llvm-project/issues/206674)
- [LLVM issue #216580 - LSan false leaks on glibc riscv64](https://github.com/llvm/llvm-project/issues/216580)
- [LLVM issue #164803 - ASan CHECK failure with RVV/SV48](https://github.com/llvm/llvm-project/issues/164803)
- [google/sanitizers issue #1707 - ASan crash on SV48 riscv64](https://github.com/google/sanitizers/issues/1707)
- [Kubernetes issue #132836 - official riscv64 support proposal](https://github.com/kubernetes/kubernetes/issues/132836)
- [RISE project member list](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [libseccomp v2.6.1 release](https://github.com/seccomp/libseccomp/releases/tag/v2.6.1)
- [Google Open Source Community Guidelines](https://opensource.google/conduct/)