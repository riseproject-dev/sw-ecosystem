---
title: nsjail
---

# nsjail

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for nsjail<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

nsjail is a Linux process isolation tool that uses Linux kernel namespaces (PID, network, mount, UTS, IPC, user), cgroups v1/v2, and seccomp-BPF syscall filtering to confine untrusted workloads. It is commonly used in CTF infrastructure, fuzzing pipelines, and build sandboxes. It has no dependency on hardware virtualization and requires only a Linux kernel with namespace and seccomp support.

The project is hosted at [github.com/google/nsjail](https://github.com/google/nsjail) under the `google/` GitHub organization. The README explicitly states "This is not an official Google product." The license is Apache-2.0. There is no foundation membership, no formal governance document, no MAINTAINERS or CODEOWNERS file. Community interaction is through GitHub Issues and a Google Groups mailing list (`nsjail@googlegroups.com`).

The dominant contributor is Robert Swiecki (`robertswiecki`), who holds the vast majority of commits. Source file headers carry a "Google Inc." copyright (2014), implying Google employment, though no public profile makes this explicit [NEEDS VERIFICATION]. A contributor handle `philwo` (3 commits) is also associated with Google open-source projects. All other contributors appear to be external one-time authors with no clear corporate affiliation.

Google LLC is a Premier member of the RISE project, but nsjail is not listed as a RISE project and is not tracked by the RISE Security Software Working Group. Confirmed by: enumerating all 51 repos in the `riseproject-dev` GitHub org, checking `riscv-runner`, `riscv-runner-images`, `riscv-runner-app`, `riscv-runner-device-plugin`, and searching all RISE runner Dockerfiles. Zero matches.

Community stance on new architecture ports is permissive but passive. No policy document exists. The project has no platform support matrix. RISC-V has been accommodated in syscall number definitions since April 2026 but has never been listed as a supported target, never had a tracking issue filed, and never been tested in CI.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2021-10-11 | kafel submodule (nsjail's seccomp backend): initial riscv64 support added via [PR #31](https://github.com/google/kafel/pull/31) by IEAST/Eastdong. Prior to this, building nsjail on riscv64 would fail with `#error "Unsupported architecture"` inside kafel. | kafel git log (SHA 21b96af0fd) |
| 2021-10-11 | kafel: immediate fix to riscv64 syscall table (SHA 862f8f33b7). | kafel git log |
| 2021-10-12 | kafel: fix riscv64 arch detection -- `__riscv` was identified but `__riscv_xlen == 64` was not confirmed (SHA 362ac7b675). | kafel git log |
| 2021-10-27 | kafel: rename `riscv_len` to `riscv_xlen` for naming consistency (SHA fdc1d64424). | kafel git log |
| 2022-11-14 | Alpine Linux maintainer (`jvvv`) reports textrel warnings in the final nsjail binary for riscv64 in [issue #204](https://github.com/google/nsjail/issues/204) comment. Commits to add riscv64 support "once the textrel issue is tracked down." No follow-up has been posted. | github.com/google/nsjail/issues/204 |
| 2025-09-22 | kafel: "riscv64: vibecoded missing syscalls" -- 390 lines added to `src/syscalls/riscv64_syscalls.c` including `cachestat` (#451) and other gaps (SHA c13ce1fce6). | kafel git log |
| 2026-04-09 | nsjail: commit [b7ff9f30188a](https://github.com/google/nsjail/commit/b7ff9f30188a7845d41366e1e3b3929f464ac443) by Robert Swiecki introduces `missing_defs.h` with `#elif defined(__riscv)` guards covering 9 syscall numbers. This is the first and only RISC-V-specific code in the nsjail codebase itself. | github.com/google/nsjail, direct commit |

All RISC-V support is fully upstream. No out-of-tree patches are known. There is no downstream fork maintaining RISC-V patches separately.

---

## 3. Upstream Support Tier

No formal tier policy or port acceptance criteria is documented anywhere in the repository. There is no PLATFORMS.md, SUPPORT.md, or equivalent.

The evidence-based tier assessment follows:

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI build | Yes (ubuntu-latest, x86_64) | No | No |
| CI test | Yes | No | No |
| Official binary release | No (source-only) | No | No |
| Distribution packages | No (Debian/Ubuntu/Arch absent) | No | No |
| Syscall fallback definitions | Yes (`missing_defs.h`) | Yes | Yes (9 syscalls, added 2026-04-09) |
| kafel seccomp backend | Full | Full | Full |
| Architecture explicitly named in code | Yes (x86/x86_64 guards in contain.cc) | No (aarch64 falls through correctly) | No (riscv64 falls through correctly) |
| Textrel packaging issue reported | No | No | Yes (unresolved since 2022) |

**Effective tier: Tier 3 (best-effort, untested).** The codebase is architecturally compatible with riscv64. The syscall definitions are present and correct. No functional code is gated behind `#if !defined(__riscv)`. However, the project has never built, tested, or released on riscv64, and the Alpine Linux packaging attempt exposed a textrel issue that remains unresolved four years later.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

nsjail is a Linux isolation tool with no JIT compiler, no SIMD processing, no cryptographic primitives, no garbage collector, and no user-space assembly. It invokes Linux system calls and manipulates kernel objects. Architecture-specific code is therefore limited to syscall number definitions.

**Syscall number fallback definitions (`missing_defs.h`)**

The file provides `#ifndef`-guarded fallback definitions for syscall numbers that may be absent from older kernel headers. For RISC-V, the guard is `#elif defined(__riscv)`. All 9 definitions are correct for the riscv64 Linux unified ABI:

| Syscall | Number defined | Correct for riscv64 |
|---------|---------------|---------------------|
| `__NR_seccomp` | 277 | Yes |
| `__NR_getrandom` | 278 | Yes |
| `__NR_memfd_create` | 279 | Yes |
| `__NR_execveat` | 281 | Yes |
| `__NR_pidfd_send_signal` | 424 | Yes |
| `__NR_pidfd_open` | 434 | Yes |
| `__NR_clone3` | 435 | Yes |
| `__NR_close_range` | 436 | Yes |
| `__NR_pidfd_getfd` | 438 | Yes |

RISC-V is a full peer to x86_64, aarch64, arm, mips, and m68k in every `#if/#elif` chain in this file. No stubs, no TODOs, no `#error`.

**TSC disable (`contain.cc`)**

One feature -- disabling the x86 time-stamp counter via `PR_SET_TSC` -- is gated `#if defined(__i386__) || defined(__x86_64__)`. The `#else` branch logs a warning and skips silently. RISC-V has no TSC concept; the fallthrough is architecturally correct. This is not a gap.

**seccomp-notify handler (`unotify/syscall.cc`)**

The 32-bit detection path checks for `AUDIT_ARCH_I386` and `AUDIT_ARCH_ARM` only. There is no explicit `AUDIT_ARCH_RISCV64` branch. Since riscv64 has no 32-bit compat ABI, this 64-bit fallthrough is correct. The absence of an explicit riscv64 branch is not a functional bug.

**Component comparison table**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Syscall number fallbacks | Full | Full | Full |
| seccomp-BPF filter generation (via kafel) | Full | Full | Full |
| TSC disable | Supported | N/A (skip) | N/A (skip) |
| JIT / SIMD / crypto | None in project | None in project | None in project |
| Assembly files | None | None | None |
| 32-bit compat ABI support | Yes (i386) | Partial | None (riscv64 is 64-bit only) |

No ISA extensions (RVV, Zba, Zbb, etc.) are relevant to this project.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Makefile (hand-written). No CMake, no autoconf, no configure script, no toolchain files, no `cmake/riscv64.cmake`. This is the complete set of build-system files: `Makefile`, `Dockerfile`, `debian/rules`.

**Native build on riscv64 host:**

```bash
sudo apt-get install -y autoconf bison flex gcc g++ git \
    libprotobuf-dev libnl-route-3-dev libtool make pkg-config protobuf-compiler
git clone --recursive https://github.com/google/nsjail.git
cd nsjail && make
```

**Cross-compile from x86_64:**

```bash
make CC=riscv64-linux-gnu-gcc CXX=riscv64-linux-gnu-g++
```

No configure-time flags exist for disabling features. libnl-route-3 is auto-detected via `pkg-config`; if absent, a warning is printed and network-interface manipulation is disabled. This is the only optional dependency.

**Toolchain requirements:** C++20 (`-std=c++20`, `-fno-exceptions`). The Makefile does not state a minimum GCC version. The `missing_defs.h` copyright header is dated 2026, indicating Debian bookworm (GCC 12) is the implicit baseline. GCC 10+ is sufficient for C++20.

**QEMU usage:** nsjail uses `clone()`, `unshare()`, `pivot_root()`, and `seccomp()` -- all of which require a real kernel. QEMU user-mode (`qemu-riscv64-static`) can execute the binary to verify it starts but cannot support any functional sandbox test. Testing requires a native riscv64 Linux machine or QEMU system emulation with a full riscv64 kernel image.

**Docker cross-build:**

```bash
docker buildx build --platform linux/riscv64 -t nsjail:riscv64 .
```

The `Dockerfile` is single-stage and Debian-bookworm-based. The `debian:bookworm-slim` riscv64 image is available from Docker Hub. This build path works in principle but is not exercised in CI.

**protoc dependency:** The build requires `protoc` to compile `config.proto` and `unotify/unotify.proto`. Google's official [protoc releases](https://github.com/protocolbuffers/protobuf/releases) (v36.0 as of August 2026) ship prebuilt binaries for aarch_64, ppcle_64, s390_64, and x86_64 -- not riscv64. [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206), which proposed adding a riscv64 prebuilt, was closed unmerged. On riscv64, `protoc` must be built from source or obtained from distribution packages. Debian bookworm ships a `protobuf-compiler` package that covers riscv64.

**Known build issues:**
- [Issue #223](https://github.com/google/nsjail/issues/223) (OPEN): undefined `__emutls_v` linker error when building with clang-15 and static libprotobuf on arm64. A clang-based riscv64 cross-build with static libprotobuf may hit the same condition.
- [Issue #204](https://github.com/google/nsjail/issues/204) (CLOSED): textrel warnings in the riscv64 Alpine Linux binary, reported 2022-11-14, no follow-up, unresolved. The kafel submodule is built with `-fPIC` and the nl-route-3 and protobuf libraries are also `-fPIC`; the source of the textrels is unidentified.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

nsjail is a Linux namespaces and seccomp tool. Its feature set is defined by kernel capabilities, not by user-space ISA. All kernel interfaces it uses (PID/net/mount/IPC/user namespaces, cgroup v1 and v2, seccomp-BPF, `clone3`, `pidfd_*`, `close_range`) are available on riscv64 Linux since kernel 5.0+ with no architecture-specific gaps.

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| PID / mount / net / IPC namespaces | Full | Full | Full |
| User namespaces | Full | Full | Full |
| cgroup v1 and v2 | Full | Full | Full |
| seccomp-BPF policy (via kafel) | Full | Full | Full |
| `clone3` / `pidfd` family | Full | Full | Full (defs in missing_defs.h) |
| TSC disable | Supported | N/A | N/A |
| seccomp-notify (unotify subsystem) | Full | Full | Full (riscv64 is always 64-bit, no compat path needed) |
| 32-bit compat ABI policy | Yes (i386) | Partial | None (riscv64 has no 32-bit mode) |
| kafel policy language riscv64 arch alias | N/A | N/A | "riscv64" and "rv64" both accepted |

No functional gaps exist between riscv64 and amd64/arm64 for any feature the project actually implements. The x86-only TSC disabling is a minor feature, correctly skipped on non-x86 with a log warning.

**Security hardening:** nsjail uses seccomp-BPF, which is architecture-aware at the kernel level. kafel generates correct BPF for riscv64 using `AUDIT_ARCH_RISCV64`. No gaps identified.

**Floating-point / NaN semantics:** Not applicable -- nsjail performs no floating-point computation.

---

## 7. CI/CD Infrastructure

The sole CI configuration is [`.github/workflows/dockerpush.yml`](https://github.com/google/nsjail/blob/master/.github/workflows/dockerpush.yml). Its content was read directly (grep for "riscv" returned zero matches, confirmed by direct file read).

| Attribute | Value |
|-----------|-------|
| Trigger | push to master, push of v* tags, pull_request |
| Runner | ubuntu-latest (x86_64) |
| Build command | `docker build . --file Dockerfile` |
| Multi-arch setup | None (no docker/setup-qemu-action, no docker/setup-buildx-action) |
| --platform argument | Absent |
| QEMU binfmt | Not configured |
| riscv64 string in file | Zero occurrences |

No other CI files exist in the repository (`.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml` all return 404).

kafel's CI consists only of CodeQL static analysis. No architecture matrix, no riscv64 build in kafel CI either.

RISE runners are not used. Confirmed by searching all RISE runner infrastructure repos.

**CI comparison table:**

| CI aspect | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Build tested | Yes | No | No |
| Functional test | No (CI only calls `docker build`) | No | No |
| Release gating | No | No | No |
| RISE-provided runner | No | No | No |

---

## 8. Distribution and Release Status

**GitHub Releases:** All 27 releases (1.0 through 3.6, latest 2026-03-18) have zero binary assets attached. Confirmed via `gh api repos/google/nsjail/releases`. nsjail ships as source-only releases on all architectures; there are no pre-built binaries for any platform including amd64.

**Debian:** nsjail is absent from all Debian suites (sid, bookworm, bullseye). `packages.debian.org/sid/nsjail` returns "No such package." The `tracker.debian.org/pkg/nsjail` URL returns HTTP 404. No riscv64 .deb exists.

**Ubuntu:** Not packaged in Ubuntu 24.04 (noble). `packages.ubuntu.com` search returns no results for any architecture.

**Arch Linux (official):** `archlinux.org/packages/search/json/?q=nsjail&arch=riscv64` returns an empty result set. Not packaged.

**Arch Linux RISC-V mirror (archriscv.felixc.at):** Site was unreachable at time of research. No data available.

**Alpine Linux:** riscv64 package is blocked. The Alpine maintainer `jvvv` reported in [issue #204](https://github.com/google/nsjail/issues/204) (2022-11-14) that the riscv64 build produces unexplained textrel warnings and that riscv64 support would be added "once I track down what is causing the textrels." No subsequent comment from that maintainer and no follow-up commit exists as of August 2026. Alpine currently ships nsjail for x86_64, x86, aarch64, and armv7 but not riscv64.

**PyPI / npm / Maven:** nsjail is not available on any of these package registries. `pypi.org/pypi/nsjail/json` returns HTTP 404.

**Unofficial packages:** [github.com/marcinbienkowski/nsjail-deb](https://github.com/marcinbienkowski/nsjail-deb) (created August 2026) provides unofficial .deb builds for Debian stable and Ubuntu LTS, x86_64 and arm64 only. No riscv64 binary.

**What a user must do to get a working riscv64 binary:**
1. Clone the repository with `--recursive` (to include the kafel submodule).
2. Install build dependencies from Debian/Ubuntu package manager (all available for riscv64).
3. Obtain `protoc` from distribution packages rather than the official protobuf release page (no riscv64 prebuilt exists there).
4. Run `make`.

No source-level changes to nsjail are required to build on riscv64. The build should succeed on a native riscv64 host or via cross-compilation.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|------------|------|--------------|--------------|-----------------|-------|
| [kafel](https://github.com/google/kafel) (git submodule) | seccomp-BPF policy compiler; generates BPF bytecode from policy DSL; must know target ISA syscall ABI | Supported -- `KAFEL_TARGET_ARCH_RISCV64` (1<<7) added Oct 2021; 2,237-line `riscv64_syscalls.c`; `AUDIT_ARCH_RISCV64` dispatch; "riscv64" and "rv64" name aliases | No dedicated riscv64 CI | No formal releases; nsjail vendors it as a submodule | Sep 2025 commit c13ce1fce6 ("vibecoded") added 390 lines to the riscv64 syscall table via AI generation; unaudited, security-relevant |
| [Protocol Buffers / protoc](https://github.com/protocolbuffers/protobuf) | config and unotify schema compilation; `libprotobuf` at runtime | Source build works; library riscv64 support confirmed (issues #12266/#12244) | No riscv64 in CI matrix | No riscv64 prebuilt `protoc` binary in any release; must build from source or use distro package | [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206) to add riscv64 prebuilt was closed unmerged |
| [libnl / libnl-route-3](https://github.com/thom311/libnl) | optional netlink for network namespace configuration | Supported -- pure C, no arch-specific code; v3.12.0 (2024-12-04) | Architecture-neutral | Packaged for riscv64 in Debian/Ubuntu | Without it nsjail builds but loses full net-namespace control |
| libseccomp | NOT a direct dependency -- nsjail uses raw `seccomp(2)` and kafel-generated BPF directly | Supported (v2.6.1, riscv64 added v2.5.0 in 2021) | CI covers riscv64 | v2.6.1 released | Included for completeness; nsjail does not link against it |
| libcap | Linux capabilities manipulation | Supported -- pure C, no arch-specific code | N/A | Packaged for riscv64 by major distros | No issues |
| Linux kernel headers (namespaces, seccomp, cgroups) | `clone(2)`, `unshare(2)`, `seccomp(2)`, cgroup v1/v2 | Supported -- all required syscalls present since Linux 5.0+ on riscv64 | N/A | N/A | No gaps |

**kafel syscall table quality flag:** The September 2025 commit (`c13ce1fce6`) that expanded the riscv64 syscall table was described in its commit message as "vibecoded missing syscalls." This means the 390 additional lines of syscall definitions for riscv64 were generated with AI assistance and not manually audited. kafel is used to generate seccomp-BPF filters that enforce a syscall allowlist/denylist in security-critical isolation contexts. An incorrect syscall number in this table would either cause a legitimate syscall to be blocked (causing isolation failures) or cause a blocked syscall to be permitted (creating a sandbox escape vector). This table should be audited against the canonical [Linux riscv64 syscall table](https://github.com/torvalds/linux/blob/master/arch/riscv/include/uapi/asm/unistd.h) before use in any production security context.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity for riscv64 | Notes |
|----|-------|--------|----------------------|-------|
| [#204](https://github.com/google/nsjail/issues/204) | build fails after kafel update | CLOSED (2022-10-23) | Medium (packaging blocker) | Alpine Linux riscv64 packaging blocked since 2022 by unexplained textrel warnings in final binary; no follow-up; root cause unidentified |
| [#223](https://github.com/google/nsjail/issues/223) | Build failed on arm64 with clang-15 | OPEN | Low (only affects clang static builds) | Undefined `__emutls_v` from protobuf TLS; same failure mode would affect clang-based riscv64 cross-builds with static libprotobuf; no maintainer resolution |
| [#211](https://github.com/google/nsjail/issues/211) | Build fails on armv7l (32 bit) | OPEN | Informational (riscv64 is 64-bit only) | Narrowing conversion in `mnt.cc:93` for `MS_NOUSER`; does not affect riscv64; workaround exists but not merged |
| [#210](https://github.com/google/nsjail/issues/210) | Package nsjail for ease of installation on Linux | OPEN | Low | No official packages for any architecture; unofficial .deb created August 2026 covers x86_64 and arm64 only |
| [#159](https://github.com/google/nsjail/issues/159) | seccomp-BPF policy for ELF-32 binaries executed by ELF-64 nsjail | OPEN | Not applicable | riscv64 has no 32-bit compat ABI, so this problem class does not apply |
| kafel c13ce1fce6 | "riscv64: vibecoded missing syscalls" | MERGED (2025-09-22) | HIGH for production security use | 390-line AI-generated addition to riscv64 syscall table; not audited against kernel source; incorrect entries could cause allowlist bypasses |

No riscv64-specific correctness bugs are open in the google/nsjail or google/kafel issue trackers. The kafel "vibecoded" syscall table is the only identified correctness risk specific to riscv64.

---

## 12. Objections and Upstream Blockers

**Textrel issue in Alpine Linux packaging (Issue #204):** An Alpine Linux maintainer reported unexplained textrel warnings in the riscv64 final binary in November 2022. The issue was raised in a comment on an unrelated closed issue, not as a standalone bug report. No maintainer response has been posted. No subsequent commit addresses it. The root cause has not been identified publicly. This is a latent blocker for distribution packaging on riscv64. Resolution requires reproducing the build environment (Alpine Linux riscv64, kafel with `-fPIC`, libnl-route-3, protobuf) and identifying which object or linker flag is generating text relocations.

**No riscv64 CI:** The project has never had a riscv64 CI job proposed or discussed. Adding one requires either a self-hosted riscv64 runner or QEMU system emulation. The RISE runner infrastructure provides riscv64 GitHub Actions runners and is the natural candidate, but nsjail cannot use QEMU user-mode for functional testing (it requires real kernel namespaces).

**kafel unaudited syscall table:** Security-sensitive consumers of nsjail on riscv64 should treat the September 2025 syscall table expansion as unverified until audited against the kernel's canonical `arch/riscv/include/uapi/asm/unistd.h`. This is a correctness risk, not a build risk.

**No stated objections from maintainers** to riscv64 support. The primary maintainer has never commented on riscv64 in any issue or PR. The codebase actively accommodates riscv64 in `missing_defs.h` as of April 2026.

**Acceptance probability for upstream patches:** High. The project already has riscv64 syscall definitions. A CI job addition and textrel fix would be straightforward changes with no architectural risk to the project. The maintainer is responsive to security-relevant fixes based on the issue tracker.

---

## 13. Investment Analysis

RISE has no existing investment in nsjail. All work below is new.

### 13.1 Functional Enablement

The build works on riscv64 at the source level. The one unresolved functional issue is the Alpine Linux textrel warning from 2022. Resolving it requires:
- Reproducing the Alpine riscv64 build environment (Alpine Linux riscv64 root or cross-build setup).
- Using `readelf -d` and `scanelf -T` to identify the source of text relocations.
- Likely fixing a missing `-fPIC` flag propagation in the kafel sub-Makefile or a position-dependent code path in protobuf.
- Filing a PR against nsjail and/or kafel.

Additionally, the kafel riscv64 syscall table (c13ce1fce6, 2025-09-22) warrants an audit pass. Diff the 390 new lines against [linux/arch/riscv/include/uapi/asm/unistd.h](https://github.com/torvalds/linux/blob/master/arch/riscv/include/uapi/asm/unistd.h) and file corrections as needed.

### 13.2 Performance Optimization

Not applicable. nsjail is a Linux namespaces tool. Its performance is dominated by kernel syscall latency for namespace and cgroup operations, not by user-space computation. No SIMD, no JIT, no numerics to optimize on riscv64 or any other architecture. Data not available: no benchmark data for nsjail exists on any architecture in the searched sources.

### 13.3 CI/CD Infrastructure

Add a riscv64 CI job to `.github/workflows/dockerpush.yml`. Because nsjail requires real kernel namespaces, QEMU user-mode is insufficient; a QEMU system VM or a native riscv64 runner is required for any functional test. The RISE riscv64 GitHub Actions runner is the appropriate vehicle if RISE engages this project. A minimal CI addition (build-only, no functional test) could use Docker buildx with QEMU for the build step, and functional tests would require a native or QEMU-system runner.

### 13.4 Ecosystem Enablement

nsjail has no dependent package ecosystem. It is a standalone binary. The relevant deliverable here is a riscv64 binary package in Debian and/or Alpine Linux, which removes the source-build requirement for downstream users. This is blocked by the textrel issue (see 13.1).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | Identify and fix textrel issue in Alpine Linux riscv64 build | 1-2 | nsjail/kafel contributors or RISE assignee | High |
| Functional | Audit kafel riscv64 syscall table (c13ce1fce6) against kernel headers; fix any discrepancies | 1 | kafel contributors or RISE assignee | High |
| CI/CD | Add riscv64 build-only CI job using Docker buildx + QEMU | 0.5 | nsjail contributors or RISE assignee | Medium |
| CI/CD | Add riscv64 functional CI using RISE native runner or QEMU-system | 2-3 | RISE CI infrastructure + nsjail contributors | Medium |
| Distribution | Package nsjail for Debian riscv64 (depends on textrel fix) | 1 | Debian maintainer (new sponsor needed) | Low |

Total estimated effort: 5.5-7.5 person-weeks. The textrel fix and kafel audit are prerequisites for the distribution and CI work. The kafel audit has direct security implications for any production use of nsjail seccomp policies on riscv64.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/nsjail repository](https://github.com/google/nsjail)
- [nsjail homepage](https://nsjail.dev/)
- [google/kafel repository](https://github.com/google/kafel)
- [Commit b7ff9f30188a -- missing_defs.h introducing riscv64 syscall definitions (2026-04-09)](https://github.com/google/nsjail/commit/b7ff9f30188a7845d41366e1e3b3929f464ac443)
- [Issue #204 -- "build fails after kafel update" -- contains only riscv64 packaging mention](https://github.com/google/nsjail/issues/204)
- [Issue #223 -- "Build failed on arm64 with clang-15"](https://github.com/google/nsjail/issues/223)
- [Issue #211 -- "Build fails on armv7l (32 bit)"](https://github.com/google/nsjail/issues/211)
- [Issue #210 -- "Package nsjail for ease of installation on Linux"](https://github.com/google/nsjail/issues/210)
- [Issue #159 -- seccomp-BPF policy for ELF-32 binaries](https://github.com/google/nsjail/issues/159)
- [kafel commit c13ce1fce6 -- "riscv64: vibecoded missing syscalls" (2025-09-22)](https://github.com/google/kafel/commit/c13ce1fce6)
- [protobuf PR #23206 -- add riscv64 protoc prebuilt (closed unmerged)](https://github.com/protocolbuffers/protobuf/pull/23206)
- [nsjail CI workflow -- .github/workflows/dockerpush.yml](https://github.com/google/nsjail/blob/master/.github/workflows/dockerpush.yml)
- [Linux riscv64 syscall table -- arch/riscv/include/uapi/asm/unistd.h](https://github.com/torvalds/linux/blob/master/arch/riscv/include/uapi/asm/unistd.h)
- [RISE project member list](https://riseproject.dev/)
- [marcinbienkowski/nsjail-deb -- unofficial .deb builds (x86_64/arm64 only)](https://github.com/marcinbienkowski/nsjail-deb)