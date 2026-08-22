---
title: gvisor
---

# gvisor

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for gvisor<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

gVisor is a user-space container sandbox that implements a Linux-compatible kernel in Go (the "sentry"), intercepting system calls from containerized workloads via either a KVM hypervisor backend or a ptrace/signal-based backend ("systrap"). It prevents container escapes by never exposing the host kernel directly to untrusted workloads. The primary artifact is `runsc`, an OCI-compatible container runtime that integrates with containerd and Kubernetes.

**License:** Apache 2.0. **Copyright:** The gVisor Authors.

**Governance:** Defined in [`/GOVERNANCE.md`](https://github.com/google/gvisor/blob/master/GOVERNANCE.md). Three tiers: Contributors (CLA required), Maintainers (write and approval access), and Special Interest Groups. Maintainers are elevated by lazy consensus of existing maintainers. A structural constraint applies: for this Google-originated repository, the final merge step must be performed by a Google employee via the internal Copybara sync pipeline. Non-Google contributors may hold approval authority but cannot self-merge.

**Maintainers:** All 17 active maintainers listed in [`/MAINTAINERS.md`](https://github.com/google/gvisor/blob/master/MAINTAINERS.md) are Google employees (Fabricio Voznika, Jamie Liu, Zach Koopmans, Nayana Bidari, Etienne Perot, Lucas Manning, Jing Chen, Konstantin Bogomolov, Jimmy Tran, Anil Altinay, Shailend Chand, Parth Sarthi, Ryan El Kochta, Rex Ren, Xin Zhong, Caroline Zhu, Alexander Cueva). Notable emeritus maintainers include Andrei Vagin (emeritus 2026-02-12), Tamir Duberstein (now at OpenAI), and Ayush Ranjan (now at Modal Labs).

**Foundation membership:** None. gVisor is not a CNCF or Linux Foundation project. It is Google-controlled infrastructure with an open-source mirror.

**Culture on new architecture ports:** The ARM64 port sets the precedent. ARM64 tracking issues were filed in 2019 and the port is still not complete as of 2026 (open gaps include systrap patching). New architecture ports require sustained internal Google engineering investment to land in the merge pipeline. Community-initiated ports face a structural barrier: the CLA requirement is enforced by a bot, and maintainers do not review PRs from contributors who have not signed the CLA. The RISE Project has no engagement with gVisor (confirmed by full scan of [riseproject.dev](https://riseproject.dev/feed/) as of August 2026; zero blog posts, working groups, or funded projects mention gVisor).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019 | ARM64 port tracking issues filed; port begins | ARM64 precedent in maintainer history |
| 2023-06-14 | PR [#9101](https://github.com/google/gvisor/pull/9101) "Set kOLargeFile for RISC-V architecture" - closed without merge (Copybara bot, Fuchsia+RISC-V target, `O_LARGEFILE` constant from riscv-musl) | GitHub PR |
| 2024-02-20 | PR [#10025](https://github.com/google/gvisor/pull/10025) "Define SYS_getdents64 for RISC-V" - closed same day, 0-byte diff, no review | GitHub PR |
| 2024-02-21 | PR [#10032](https://github.com/google/gvisor/pull/10032) "Define SYS_statx for RISC-V" - **merged** via Copybara (PiperOrigin-RevId: 609083269); adds `#define SYS_statx 291` in `test/syscalls/linux/stat.cc` for Fuchsia+RISC-V test compilation | GitHub PR, merge commit `6adfd7ba3a` |
| 2026-04-10 | PR [#13030](https://github.com/google/gvisor/pull/13030) "Teddy bulk" - opened by external contributor Michael Estner; adds 95+ riscv64 source files ported from an internal "Teddy branch" experiment, achieving a cross-compiling `bazel build --platforms=linux_riscv64 //runsc:runsc`; closed 2026-04-28 without any maintainer review due to missing CLA | GitHub PR |

**Summary of the port status:** There is no official RISC-V port. The three Copybara-exported PRs (#9101, #10025, #10032) are narrow test-compilation fixes targeting a Fuchsia+RISC-V internal build, not a Linux runtime port. PR #13030 is the only substantive community effort; it was closed without review due to a CLA failure and carries an explicit code comment in `bluepill_riscv64.go`: "KVM on riscv64 is not yet functional." No public tracking issue for a RISC-V port exists. The `runsc/cmd/install_test.go` file contains a test case that explicitly asserts `releaseTarballURL("release-20260706.0", "riscv64")` returns an error - encoding the absence of riscv64 releases into the test suite.

**Key contributors:**
- Copybara bot / Google internal (PRs #9101, #10025, #10032) - Fuchsia team motivation, not a Linux port effort
- Michael Estner (external, PR #13030) - independent contributor, no stated affiliation, CLA not signed [NEEDS VERIFICATION of employer]

---

## 3. Upstream Support Tier

gVisor has no formal written tier policy for architectures. The de facto tier is inferred from CI coverage, release binaries, and README statements.

**README statement** ([source](https://github.com/google/gvisor/blob/master/README.md)): "gVisor builds on x86_64 and ARM64. Other architectures may become available in the future."

**Official install documentation** ([gvisor.dev/docs/user_guide/install/](https://gvisor.dev/docs/user_guide/install/)): "gVisor supports x86_64 and ARM64, and requires Linux 5.6+." Binaries distributed via Google Cloud Storage at `https://storage.googleapis.com/gvisor/releases/release/latest/${ARCH}`. The APT repository is configured `arch=amd64,arm64`. No riscv64 path exists.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Officially supported | Yes | Yes | No |
| CI (build) | Yes | Yes | No |
| CI (functional tests) | Yes | Partial | No |
| Release binaries (GCS) | Yes | Yes | No |
| APT package | Yes | Yes | No |
| README acknowledgment | Primary | Secondary | Not mentioned |
| pkg/sentry/arch implementation | Full | Full | Missing |
| pkg/ring0 implementation | Full | Full | Missing |
| pkg/sentry/platform/kvm | Full | Full | Missing |
| pkg/sentry/platform/systrap | Full | Full | Missing |

ARM64 is a secondary tier: it builds and releases but has open functional gaps (systrap patching, KVM cpuid differences) dating to 2019. riscv64 is not a tier at all - it has zero runtime implementation files.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

gVisor's architecture-specific work is concentrated in five subsystems. All five are missing for riscv64.

**4.1 Sentry architecture layer (`pkg/sentry/arch/`)**

Implements the CPU context abstraction: register layout, system call convention, signal frame format, FPU state save/restore, address space limits.

- amd64: `arch_amd64.go`, `arch_x86.go`, `syscalls_amd64.go`, `signal_amd64.go`, `fpu/fpu_amd64.go`, `fpu/fpu_amd64.s` - full implementation
- arm64: `arch_arm64.go`, `arch_aarch64.go`, `syscalls_arm64.go`, `signal_arm64.go`, `fpu/fpu_arm64.go` - full implementation
- riscv64: zero files

PR #13030 (closed) contributed `arch_riscv64.go` (527 lines), `syscalls_riscv64.go` (64 lines - reads syscall number from register a7/Regs[17], args from Regs[10..15]), `signal_riscv64.go` (165 lines), and `fpu/fpu_riscv64.go` (61 lines - D extension, 32x64-bit FP regs + fcsr). This work exists only in the closed PR branch, not in the main tree.

**4.2 ring0 kernel entry (`pkg/ring0/`)**

Implements the supervisor-mode trap entry and exit used by the KVM platform: register save/restore, page table switching (SATP for RISC-V), SFENCE.VMA.

- amd64: 9 files including assembly
- arm64: 13 files including assembly
- riscv64: zero files

PR #13030 contributed `entry_riscv64.s` (479 lines): full save/restore of all 32 GPRs, sret-based user/kernel transition, SATP switching, SFENCE.VMA. Also `defs_riscv64.go` (141 lines) and `pagetables/pagetables_riscv64.go` (272 lines) implementing Sv48 4-level page tables. None of this is in the main tree.

ISA extensions used in PR #13030: standard RV64GC (no RVV, no Zba/Zbb/Zbc/Zbs crypto extensions referenced anywhere in the codebase or the closed PR).

**4.3 CPU capability detection (`pkg/cpuid/`)**

Reads hardware feature bits to gate runtime paths.

- amd64: `cpuid_amd64.go`, `features_amd64.go` and 6 others
- arm64: `cpuid_arm64.go`, `features_arm64.go` and 3 others
- riscv64: zero files

PR #13030 contributed `native_riscv64.go` (150 lines) reading `/proc/cpuinfo` for hart ISA strings (e.g., "rv64imafdcsu") and parsing ISA extension letters. Not in main tree.

**4.4 Platform backends (`pkg/sentry/platform/`)**

Two backends exist: KVM (high-performance, Type-2 hypervisor using Linux KVM ioctls) and systrap (ptrace + signal-based, portable fallback).

- amd64: 46+ files across kvm/ and systrap/
- arm64: 32+ files across kvm/ and systrap/
- riscv64: zero files in main tree

PR #13030 contributed:
- `kvm/machine_riscv64.go` (218 lines), `kvm/machine_riscv64_unsafe.go` (310 lines - uses KVM_RISCV64_REGS_* constants, sets ISA to `_RISCV64_ISA_GC`, configures SATP, sets `tp`/`sscratch`/`sp`/`pc`/`sie`)
- `kvm/bluepill_riscv64.go` (99 lines) with explicit comment: "TODO(riscv64): sstatus CSR manipulation needs a separate field since PtraceRegs.Regs only has 32 entries. KVM on riscv64 is not yet functional."
- `kvm/bluepill_riscv64_unsafe.go` (148 lines), `kvm/kvm_riscv64.go` (64 lines), `kvm/kvm_const_riscv64.go` (74 lines)
- `ptrace/ptrace_riscv64.go` (63 lines); systrap `_PTRACE_SYSEMU` constant added since `unix.PTRACE_SYSEMU` is unavailable for riscv64 in `golang.org/x/sys`
- None of this is in the main tree.

**4.5 Low-level memory primitives (`pkg/safecopy/`, `pkg/hostsyscall/`, `pkg/atomicbitops/`)**

Architecture-specific assembly for memory copy, memory clear, atomic operations, and raw syscall invocation.

- amd64 and arm64: full assembly implementations
- riscv64: zero files in main tree

PR #13030 contributed `safecopy/memcpy_riscv64.s`, `safecopy/memclr_riscv64.s`, `safecopy/atomic_riscv64.s`, `safecopy/sighandler_riscv64.s` (139 lines), `hostsyscall/hostsyscall_riscv64.s` (97 lines, ecall instruction), `atomicbitops/atomicbitops_riscv64.s` (83 lines, LR.D/SC.D). None in main tree.

**4.6 Inline machine code (test only, in main tree)**

`test/syscalls/linux/mmap.cc` embeds RISC-V machine code bytes for a minimal `ret 42` test trampoline: `0x13, 0x05, 0xa0, 0x02` (li a0,42) and `0x82, 0x80` (ret, RVC compressed two-byte form). This uses RV64I + C extension. This is in the main tree but is a test helper, not runtime code.

**Component summary:**

| Component | amd64 | arm64 | riscv64 (main tree) | riscv64 (PR #13030, closed) |
|---|---|---|---|---|
| Sentry arch context | Full | Full | Missing | Draft (527 lines) |
| ring0 entry/exit assembly | Full | Full | Missing | Draft (479 lines + page tables) |
| cpuid / hwcap | Full | Full | Missing | Draft (150 lines, /proc/cpuinfo) |
| safecopy assembly | Full | Full | Missing | Draft (4 files) |
| KVM platform | Full | Full | Missing | Draft, explicitly non-functional |
| Systrap platform | Full | Full | Missing | Partial stub |
| ABI definitions | Full | Full | Missing | Not included in PR |
| RVV / SIMD | N/A | N/A | Missing | Not included |
| Crypto extensions (Zk*) | N/A | N/A | Missing | Not included |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel exclusively. No CMake. Bazel version pinned to **8.3.1** (from `.bazelversion`). Standard build command:

```sh
bazel build //runsc
```

or via the Makefile wrapper:

```sh
make release-tarball DESTINATION=bin/
```

**Build Dockerfile** (`images/default/Dockerfile`): based on Ubuntu 22.04. Cross-compilation packages installed: `crossbuild-essential-arm64`, `crossbuild-essential-amd64`, `qemu-user-static`. **`crossbuild-essential-riscv64` is not installed.** No riscv64 QEMU user-mode image is configured.

**Bazel riscv64 scaffolding (stub only):**

- `tools/bazeldefs/BUILD`: defines `config_setting(name = "riscv64", constraint_values = ["@platforms//cpu:riscv64"])`
- `tools/bazeldefs/defs.bzl`: `select_arch()` helper accepts `riscv64=` parameter; no build rule in the repository passes a non-None value for it - the parameter is dead code
- `tools/bazeldefs/tags.bzl`: lists `"_riscv64"` in the architecture tag enumeration
- `tools/remove_windows_deps.patch`: references `cc-compiler-riscv64` and `riscv64-config` as part of the upstream Bazel C++ toolchain suite - the toolchain entry exists in the cross-compile toolchain, but gVisor never invokes it

**PR #13030 build result:** The final commit on that branch (2026-04-28) describes fixing cross-compilation errors so that `bazel build --platforms=@io_bazel_rules_go//go/toolchain:linux_riscv64 //runsc:runsc` produces "a statically-linked ELF 64-bit RISC-V executable." This is a cross-compilation to a non-functional binary - the KVM and systrap backends lack complete implementations.

**Known build gaps for riscv64 (from PR #13030 commit message):**
- Missing build tag on KVM platform file
- Missing `extendedAddressSpaceAllowed` constant
- Missing `archSpecialRegions`/`archSpecialRegion` stubs
- `unix.PTRACE_SYSEMU` unavailable for riscv64 in `golang.org/x/sys` - workaround: define `_PTRACE_SYSEMU` constant directly
- `runtime.vdsoClockgettimeSym` reference unresolvable - workaround: replace VDSO-based `clock_gettime` with direct syscall in `sentry/time`

**Toolchain requirements:** No official documentation for riscv64. The build image uses Ubuntu 22.04 system Clang (version not pinned in the Dockerfile). Go version requirement for `linux/riscv64`: Go 1.14 minimum (when the secondary port was added); current codebase requires a higher Go version for other reasons. `GORISCV64` env var controls RVA profile (default `rva20u64`).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Container sandbox (KVM backend) | Yes | Yes | No - no KVM implementation |
| Container sandbox (systrap/ptrace backend) | Yes | Yes | No - no systrap implementation |
| Signal delivery | Yes | Yes | No - no signal frame layout |
| FPU state save/restore | Yes | Yes | No - no FPU context |
| `/proc/cpuinfo` emulation | Yes | Yes | No - no cpuid layer |
| Seccomp BPF filter compilation | Yes | Yes | No - no `pkg/seccomp` riscv64 |
| ABI compatibility (epoll, mmap, ptrace layouts) | Yes | Yes | No - no riscv64 ABI definitions |
| Release binary | Yes | Yes | No |
| CI-tested | Yes | Partial | No |
| Sv48 page table support | N/A | N/A | Draft in PR #13030 (not merged) |
| sigreturn syscall test | Yes | Yes | Intentionally skipped (BUILD: `riscv64 = []`) |

**Functional gap:** gVisor cannot run any container workload on riscv64. This is not a performance regression from missing SIMD; it is a complete absence of the execution engine.

**Performance gap from missing SIMD:** Not quantifiable because the execution engine does not exist. gVisor's performance-critical paths (system call interception, memory management) are Go code with architecture-specific assembly for memory operations. The assembly is missing for riscv64 (no RVV, no scalar fallback - the entire package is absent). No benchmark data exists for any riscv64 configuration.

**Floating-point semantics:** gVisor's sentry emulates the host FPU by saving and restoring state. The D-extension (64-bit FP) save/restore was sketched in PR #13030 but is not in the main tree and has not been tested. No NaN or rounding-mode compatibility data exists.

---

## 7. CI/CD Infrastructure

All GitHub Actions workflow files were read directly. Findings:

- `.github/workflows/build.yml`: trigger is `on: push` to any branch; runner is `runs-on: ubuntu-latest` (x86_64 only); builds `runsc` via `make copy TARGETS=runsc DESTINATION=bin/` for the host architecture only; no build matrix, no QEMU step, no `--platforms=riscv64` flag. The string "riscv" does not appear anywhere in the file.
- `.github/workflows/auto_assign.yml`, `close_banned_prs.yml`, `codeql.yml`, `go.yml`, `issue_reviver.yml`, `labeler.yml`, `stale.yml`: zero riscv references in any of these files.
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `kokoro/`, or `cloudbuild.yaml` found.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (ubuntu-latest) | Data not available: arm64 CI runner not confirmed in workflow files | No |
| Functional test CI | Yes | Data not available | No |
| QEMU emulation CI | No | No (qemu-system-aarch64 used only for a smoke test image) | No |
| RISE CI runners | No | No | No |
| Hardware runners | No evidence | No evidence | No |

The Bazel riscv64 `config_setting` exists but is never referenced by any CI job. Any regression in riscv64 build compatibility would go undetected.

---

## 8. Distribution and Release Status

**Official channels:**
- Google Cloud Storage: `https://storage.googleapis.com/gvisor/releases/release/latest/${ARCH}` - amd64 and arm64 only; riscv64 path does not exist
- APT repository: configured `arch=amd64,arm64`; no riscv64 entry
- GitHub Releases: empty (`gh api "repos/google/gvisor/releases?per_page=3"` returns `[]`); gVisor does not use GitHub Release assets
- `runsc/cmd/install_test.go`: test case `{"release-20260706.0", "riscv64", ""}` asserts that `releaseTarballURL` returns an error for riscv64, encoding the absence into the test suite

**Distribution packages:**
- PyPI ([gvisor 0.0.3](https://pypi.org/pypi/gvisor/json)): two files - `gvisor-0.0.3-py3-none-any.whl` and `gvisor-0.0.3.tar.gz`, both architecture-neutral. This is a small Python wrapper, not the runtime binary. No riscv64 wheel.
- Ubuntu 24.04 (noble): `golang-github-containers-gvisor-tap-vsocks-dev` (v0.7.2+ds1-1) and `golang-gvisor-gvisor-dev` (v0.0~20230807.0-4ubuntu0.24.04.3) are present in universe. Neither is the `runsc` runtime binary. Architecture data not returned by the package search. No riscv64 `runsc` binary package in Ubuntu.
- Debian: [tracker.debian.org/pkg/gvisor](https://tracker.debian.org/pkg/gvisor) returns HTTP 404. gVisor is not an official Debian package.
- Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/?q=gvisor)): gVisor is absent from the package index. Not ported.

**To get a working binary for riscv64:** There is no path to a working binary. The runtime does not exist. A developer could cross-compile `runsc` for riscv64 using the approach from PR #13030, producing a statically-linked ELF that will crash immediately because neither the KVM nor systrap backend is functional.

---

## 9. Dependencies

| Dependency | Role in gVisor | riscv64 Build | riscv64 Test | riscv64 Release | Status / Notes |
|---|---|---|---|---|---|
| Go toolchain (linux/riscv64) | Entire codebase; `GOARCH=riscv64` required | Supported since Go 1.14 (secondary port) | Not in first-class CI matrix | Cross-compile produces binary | Not a blocker by itself. `GORISCV64` env var controls RVA profile. |
| golang.org/x/sys | Linux syscall wrappers used throughout | Fixed (historical epoll padding, endian tag PRs) | No dedicated riscv64 CI | Not separately released | `unix.PTRACE_SYSEMU` is missing for riscv64 in x/sys; PR #13030 worked around this by defining the constant directly. No open riscv64 issues. |
| [cilium/ebpf](https://github.com/cilium/ebpf) | eBPF program loading for network filtering | Supported - riscv64 added as little-endian target (PR #148, 2020); string support (PR #1110, 2023) | No known CI gap | Included in releases | Linux kernel has riscv64 eBPF JIT (`arch/riscv/net/bpf_jit_comp64.c`). No open riscv64 issues. |
| [containerd](https://github.com/containerd/containerd) | Container runtime shim; gVisor integrates as a containerd runtime via runsc | Builds on riscv64 | Open issue [#13020](https://github.com/containerd/containerd/issues/13020) ("Add linux/riscv64 to CI test matrix", opened Mar 2026) and open PR [#13124](https://github.com/containerd/containerd/pull/13124) | Not in release matrix | See `reports/containerd.md`. Untested integration path. |
| [runc](https://github.com/opencontainers/runc) | OCI runtime; co-exists with gVisor in the same stack | Supported | riscv64 added to CI matrix - issue #5166 closed March 2026 | riscv64 release artifacts added | No open riscv64 blockers. See `reports/runc.md`. |
| [libseccomp](https://github.com/seccomp/libseccomp) | Seccomp filter library for syscall filtering | riscv64 64-bit support in v2.5.0+ | Partial (some test issues were abandoned, #290) | v2.5.0+ includes riscv64 | 32-bit RISC-V issue #327 open targeting v2.7.0 - not relevant to riscv64. See `reports/libseccomp.md`. |
| [google.golang.org/grpc](https://github.com/grpc/grpc-go) | gRPC transport for sandbox coordination | Pure Go; any Go-supported arch | No riscv64-specific issues | Included wherever Go supports it | No architecture-specific code paths. See `reports/grpc.md`. |
| google.golang.org/protobuf | Protocol Buffers Go runtime for IPC | Pure Go | No riscv64 issues | Standard Go ecosystem | Pure Go runtime. Protobuf C++ issue #12266 (riscv64 support) was closed 2024 but gVisor uses the Go library only. |
| vishvananda/netlink | Linux netlink for network namespace management | Pure Go, OS-level (not arch-level) file splits | No riscv64 issues | N/A | Architecture-neutral. |
| google/btree | In-memory B-tree for sentry memory management | Pure Go; archived Oct 2025 | N/A | N/A | Pure data structure. No riscv64 concerns. |

**Primary blockers internal to gVisor (not dependency issues):**

1. No `pkg/sentry/arch/arch_riscv64.go` - the ABI boundary between the sandboxed application and the sentry does not exist
2. No `pkg/ring0` riscv64 port - the supervisor-mode trap entry/exit assembly and page table management are missing
3. No `pkg/sentry/platform/kvm/` riscv64 implementation - the KVM hypervisor backend does not exist; PR #13030 explicitly marks its KVM sketch as non-functional
4. No `pkg/sentry/platform/systrap/` riscv64 implementation - the ptrace/signal fallback backend does not exist

The dependency ecosystem (libseccomp, cilium/ebpf, runc) is not blocking. The containerd riscv64 CI gap (issue #13020) is a secondary concern because runc already landed riscv64 support.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none) | No public riscv64 tracking issue | - | - | Zero dedicated riscv64 issues exist in the public tracker. The architecture is out of scope. |
| [PR #13030](https://github.com/google/gvisor/pull/13030) | Teddy bulk (community riscv64 port attempt) | Closed without review | Critical | 95+ files from internal "Teddy branch"; KVM explicitly non-functional; closed due to missing CLA; no maintainer engagement |
| [PR #10032](https://github.com/google/gvisor/pull/10032) | Define SYS_statx for RISC-V | Merged 2024-02-21 | Informational | Test-only constant; Fuchsia target motivation |
| (internal) | `unix.PTRACE_SYSEMU` missing for riscv64 in golang.org/x/sys | Open (workaround in PR #13030) | High (blocks systrap on riscv64) | PR #13030 workaround: define constant directly. Not fixed upstream in x/sys. [NEEDS VERIFICATION on current x/sys state] |
| No sigreturn test | `test/syscalls/linux/BUILD`: `sigreturn riscv64 = []` | Open (intentional gap) | Medium | No sigreturn test exists for riscv64; behavior unverified |

The public issue tracker has labels `arch: arm` and `arch: x86_64` but no `arch: riscv64` label. No correctness bugs for riscv64 exist because the architecture is simply not attempted.

---

## 12. Objections and Upstream Blockers

**Structural blocker (CLA + merge rights):** The Google Contributor License Agreement is enforced by an automated bot. PR #13030, the only substantial community riscv64 effort, was closed without any maintainer review solely due to a missing CLA. Even if the CLA is signed, the merge pipeline requires a Google employee to execute the final Copybara sync. Community contributors cannot self-merge, and Google maintainers have not indicated any appetite for a riscv64 port.

**Organizational blocker (no internal motivation):** All three previously merged or closed riscv64 changes (#9101, #10025, #10032) were motivated by a Fuchsia+RISC-V internal target, not a Linux container runtime port. The Fuchsia team needed the test suite to compile on riscv64; that goal is now satisfied. No Google team has stated interest in a full Linux riscv64 port. No tracking issue exists.

**ARM64 precedent:** The ARM64 port was first tracked in 2019. As of 2026, it has open gaps in systrap patching and KVM cpuid handling. A RISC-V port would be a comparable or larger engineering effort and would require the same sustained internal attention that ARM64 required over multiple years.

**Technical depth of the work:** A minimal functional port requires: `pkg/sentry/arch` (ABI boundary), `pkg/ring0` (supervisor entry/exit assembly), one platform backend (systrap is lower effort than KVM), `pkg/cpuid`, `pkg/safecopy` assembly, `pkg/hostsyscall` assembly, `pkg/atomicbitops` assembly, ABI definitions in `pkg/abi/linux/`. The KVM backend additionally requires a complete RISC-V Type-2 hypervisor using KVM_GET/SET_ONE_REG ioctls, RISC-V CSR trap semantics, and SATP page table switching. PR #13030 provides a draft starting point that achieves cross-compilation but is explicitly marked non-functional at the KVM level.

**Acceptance probability:** Low in the near term. Google has not signaled interest in a RISC-V Linux container sandbox. The closest analog (Fuchsia RISC-V) is a test-compilation concern only. A community contributor could re-submit PR #13030 with a signed CLA, but without a Google internal champion to drive the Copybara sync, the PR would likely stall in review indefinitely. The ARM64 precedent suggests Google acts on architecture ports only when there is a concrete Google product need.

---

## 13. Investment Analysis

RISE has no engagement with gVisor. No prior investment to account for.

### 13.1 Functional Enablement

The work to achieve a functional (not production-quality) gVisor on riscv64 is substantial. PR #13030 provides a starting point but is explicitly non-functional at the KVM level and has not been reviewed. The systrap (ptrace-based) backend is a more tractable starting point than KVM.

Minimum path to a running container on riscv64 via systrap:
1. Port `pkg/sentry/arch/` (arch context, syscall convention, signal delivery, FPU) - PR #13030 provides a draft
2. Port `pkg/safecopy/`, `pkg/hostsyscall/`, `pkg/atomicbitops/` assembly - PR #13030 provides drafts
3. Port `pkg/cpuid/` for `/proc/cpuinfo` parsing - PR #13030 provides a draft
4. Port `pkg/sentry/platform/systrap/` for the ptrace platform - PR #13030 provides a partial stub; `unix.PTRACE_SYSEMU` gap in x/sys must be resolved
5. Add riscv64 ABI definitions in `pkg/abi/linux/` for any missing structs
6. Resolve the CLA and get Google maintainer engagement

KVM backend would require additional work; the TODO comment in PR #13030 explicitly states "KVM on riscv64 is not yet functional" due to `sstatus` CSR manipulation limitations.

### 13.2 Performance Optimization

Data not available: no baseline riscv64 performance measurements exist because the runtime does not function. Performance optimization is premature until functional enablement is complete.

RVV (RISC-V Vector) and cryptographic extensions (Zk*) are not used anywhere in gVisor. The architecture-specific assembly in gVisor is for memory copy/clear and atomic operations, not compute-intensive workloads. Performance optimization of these primitives (using Zbb for bit manipulation, RVV for memcpy) would be a secondary effort.

### 13.3 CI/CD Infrastructure

To prevent regressions after a port, riscv64 CI is required. The existing CI runs only on `ubuntu-latest` (x86_64). Options:
- QEMU user-mode emulation for compile and basic syscall test coverage (low cost, slow, no KVM)
- Native riscv64 hardware runner for full functional test coverage (higher cost, required for KVM validation)

The containerd riscv64 CI gap (issue #13020, PR #13124) is a prerequisite for testing the full container runtime integration path.

### 13.4 Ecosystem Enablement

Not applicable. gVisor is a system-level runtime with no dependent package ecosystem that must be separately enabled on riscv64. The project does not have a PyPI, npm, Maven, or OCI extension ecosystem. Section 10 is omitted accordingly.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Port pkg/sentry/arch (arch context, syscall ABI, signal, FPU) - draft available in PR #13030 | 4 | gVisor contributor | Critical |
| Functional | Port pkg/safecopy, pkg/hostsyscall, pkg/atomicbitops assembly | 2 | gVisor contributor | Critical |
| Functional | Port pkg/cpuid for riscv64 hwcap detection | 1 | gVisor contributor | Critical |
| Functional | Port systrap platform (ptrace backend) - partial draft in PR #13030; fix unix.PTRACE_SYSEMU gap in x/sys | 6 | gVisor contributor + x/sys upstream | Critical |
| Functional | Port pkg/abi/linux riscv64 ABI definitions | 2 | gVisor contributor | Critical |
| Functional | CLA sign-off and Google maintainer engagement for upstream merge | 0 (external effort) | Google maintainer | Critical |
| Functional | Port KVM platform (ring0, machine, bluepill, SATP, CSR) - PR #13030 explicitly marks as non-functional | 12 | gVisor contributor + Google KVM expert | High |
| CI/CD | Add riscv64 build CI via QEMU cross-compile | 1 | RISE or gVisor infra | High |
| CI/CD | Add riscv64 functional test CI on native hardware or QEMU user-mode | 3 | RISE or gVisor infra | High |
| CI/CD | Upstream containerd riscv64 CI (issue #13020, PR #13124) | Already in progress (see reports/containerd.md) | containerd community | Medium |
| Performance | Scalar fallback audit (no RVV, no Zbb optimizations needed initially) | 1 | gVisor contributor | Low |

**Total functional enablement (systrap path):** approximately 15 person-weeks to get containers running on riscv64 via systrap, assuming the PR #13030 draft is used as a base and a Google maintainer can be engaged. KVM adds approximately 12 additional person-weeks. The organizational blocker (Google CLA and merge pipeline) is not sized in person-weeks but is the highest-risk item.

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [google/gvisor GitHub repository](https://github.com/google/gvisor)
- [gVisor official documentation - install](https://gvisor.dev/docs/user_guide/install/)
- [gVisor GOVERNANCE.md](https://github.com/google/gvisor/blob/master/GOVERNANCE.md)
- [gVisor MAINTAINERS.md](https://github.com/google/gvisor/blob/master/MAINTAINERS.md)
- [PR #13030 - Teddy bulk (community riscv64 port attempt)](https://github.com/google/gvisor/pull/13030)
- [PR #10032 - Define SYS_statx for RISC-V (merged)](https://github.com/google/gvisor/pull/10032)
- [PR #10025 - Define SYS_getdents64 for RISC-V (closed)](https://github.com/google/gvisor/pull/10025)
- [PR #9101 - Set kOLargeFile for RISC-V architecture (closed)](https://github.com/google/gvisor/pull/9101)
- [containerd issue #13020 - Add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [containerd PR #13124 - riscv64 CI](https://github.com/containerd/containerd/pull/13124)
- [cilium/ebpf PR #148 - riscv64 little-endian target](https://github.com/cilium/ebpf/pull/148)
- [cilium/ebpf PR #1110 - riscv64 string support](https://github.com/cilium/ebpf/pull/1110)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog feed](https://riseproject.dev/feed/)
- [riscv-musl fcntl.h - source of kOLargeFile constant](https://github.com/riscvarchive/riscv-musl/blob/3fe7e2c75df78eef42dcdc352a55757729f451e2/arch/riscv64/bits/fcntl.h#L16)
- [PyPI gvisor package](https://pypi.org/project/gvisor/)
- [Arch Linux RISC-V package index](https://archriscv.felixc.at/)
- [Ubuntu packages - gvisor search](https://packages.ubuntu.com/search?keywords=gvisor&suite=noble&searchon=names&section=all)