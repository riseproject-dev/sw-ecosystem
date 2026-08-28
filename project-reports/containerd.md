---
title: containerd
parent: Project Reports
categories:
  - containers
---

# containerd
**Author:** Ludovic HENRY \<ludovic.henry@qti.qualcomm.com\>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for containerd
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is sourced from the research findings above. Items confirmed by only one source are marked [NEEDS VERIFICATION]. Items that could not be confirmed at all are marked as "Data not available."

---

## 1. Project Overview

containerd is an industry-standard container runtime that manages the complete container lifecycle: image pull/push, snapshotting, container execution, and CRI (Container Runtime Interface) integration with Kubernetes. It sits between higher-level orchestrators (Kubernetes, Docker) and lower-level OCI runtimes (runc, crun).

**Governance:** containerd is a CNCF graduated project. It was accepted at the incubating level on 2019-03-29 and graduated on 2019-02-28. The CNCF itself operates under The Linux Foundation. License: Apache 2.0. containerd is NOT a RISE Project member.

**Corporate maintainers and their affiliations (from the research):**

| Maintainer | GitHub handle | Employer |
|---|---|---|
| Phil Estes | @estesp | AWS (Amazon Web Services) |
| Akihiro Suda | @AkihiroSuda | NTT |
| Fu Wei | @fuweid | Microsoft |
| Brian Goff | @cpuguy83 | Microsoft |
| Derek McGowan | @dmcgowan | Docker |
| Kazuyoshi Kato | @kzys | Baseten (formerly Amazon) |

Additional active contributors come from Google (GKE), IBM, and other CNCF member firms. The org has 56 public members. CNCF LFX Insights tracks 1,648 contributing organizations.

**Community stance on new ports:** The project accepts new architecture ports when the upstream toolchain (Go runtime, runc) supports them. RISC-V was accepted once Go 1.16 added native riscv64 support and runc provided compatible CGO-free operation. There is no formal tier policy or gating procedure documented in the repository.

---

## 2. Port History and Upstreaming Timeline

All milestones are fully upstream in the [containerd/containerd](https://github.com/containerd/containerd) repository.

| Date | Event | PR / Commit | Author | Org |
|---|---|---|---|---|
| 2019-06-10 | First riscv64-related merge: bumped golang.org/x/sys, golang.org/x/net, go.etcd.io/bbolt to versions with riscv64 support | [PR #3328](https://github.com/containerd/containerd/pull/3328) | carlosedp | Community |
| 2019-08-12 | Bumped golang.org/x/sys to fix epoll_event struct padding on riscv64 (root cause of 100% CPU bug) | [PR #3526](https://github.com/containerd/containerd/pull/3526) | carlosedp | Community |
| 2020-05-20 | Excluded riscv64 from -buildmode=pie (Go did not support PIE for riscv64 at the time) | [PR #4277](https://github.com/containerd/containerd/pull/4277) | lucaskanashiro | Community |
| 2021-09-03 | Re-enabled -buildmode=pie for riscv64 after Go 1.16 added support | [PR #5937](https://github.com/containerd/containerd/pull/5937) | kolyshkin | Community |
| 2022-05-02 | Primary riscv64 enablement: seccomp support, Ubuntu 22.04 Dockerfile update, CI riscv64 build job; tested on real SiFive hardware | [PR #6882](https://github.com/containerd/containerd/pull/6882) | AkihiroSuda | NTT |
| 2022-05-03 | First release binary with riscv64: v1.6.8 (cherry-picked from PR #6882 via PR #7170 to release/1.6 branch) | v1.6.8 release | AkihiroSuda | NTT |
| 2025-05-23 | Added riscv_hwprobe syscall to seccomp allowlist (Linux kernel v6.12, libseccomp v2.6.0) | [PR #11839](https://github.com/containerd/containerd/pull/11839) | vvoland | Docker |
| 2026-03-12 | Tracking issue opened for riscv64 CI coverage | [Issue #13020](https://github.com/containerd/containerd/issues/13020) | gounthar | Community |
| 2026-03-25 | PR opened to add riscv64 to integration CI test matrix via RISE runners; fork CI shows 1752 pass / 0 fail | [PR #13124](https://github.com/containerd/containerd/pull/13124) | gounthar | Community |
| 2026-05-10 | Runner image issues (missing lsmod, OOM score, EROFS module) fixed upstream on RISE runner infrastructure | riscv-runner-images issues #22, #23, #26, #27 | luhenry | Qualcomm/RISE |

The port is fully upstream with no out-of-tree patches required. The remaining open work (PR #13124) is CI coverage, not functional enablement.

---

## 3. Upstream Support Tier

containerd has no formally documented platform support tier policy. There is no PLATFORMS.md or equivalent in the repository.

**Evidence-based tier assessment for riscv64:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Release binaries | Yes | Yes | Yes -- since v1.6.8 (2022) |
| Nightly cross-compile CI | Yes | Yes | Yes (x86_64 host, crossbuild-essential-riscv64) |
| Integration tests in ci.yml | Yes (ubuntu-22.04, ubuntu-24.04) | Yes (ubuntu-24.04-arm) | No -- PR #13124 pending |
| Seccomp profile support | Yes | Yes | Yes -- including riscv-specific syscalls |
| Static binary available | Yes | Yes | Yes |

**Assessment:** riscv64 is a release-class architecture (binaries ship on every tagged release) but is not a CI-tested architecture. It sits between a "Tier 2" and "Tier 1" position: release artifact production is automated and parity with amd64/arm64 is maintained, but the integration test suite does not run on riscv64 hardware. Regressions could ship undetected.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

containerd is written in Go with minimal C code (CGO is required for the main daemon for btrfs and seccomp). There is no JIT, no GC barrier assembly, and no SIMD in containerd core.

**containerd core (github.com/containerd/containerd):**

No dedicated riscv64 source files exist in the main tree. There are no `*_riscv64.go` files, no `arch/riscv/` directories, no assembly files, no `//go:build riscv64` build-tag files, and no ISA extension dispatch code. riscv64 support flows entirely through Go's `GOARCH=riscv64` mechanism.

**Architecture-specific work lives in vendored dependencies:**

| Component | File | riscv64 Status | Notes |
|---|---|---|---|
| Syscall assembly | `vendor/golang.org/x/sys/unix/asm_linux_riscv64.s` | Full -- hand-written | 6 ECALL stubs (Syscall, Syscall6, SyscallNoError, RawSyscall, RawSyscall6, RawSyscallNoError) using RISC-V register conventions (A0-A2, A7, ECALL) |
| Syscall Go bindings | `vendor/golang.org/x/sys/unix/syscall_linux_riscv64.go` | Full | Complete Linux syscall set; `RISCVHWProbe` wrapper; Ustat returns ENOSYS (correct for riscv64) |
| Generated types | `vendor/golang.org/x/sys/unix/ztypes_linux_riscv64.go` | Full -- auto-generated | PtraceRegs with full RISC-V register file (Ra, Gp, Tp, etc.); RISCVHWProbePairs; RISCV_HWPROBE_* constants |
| Syscall numbers | `vendor/golang.org/x/sys/unix/zsysnum_linux_riscv64.go` | Full -- auto-generated | SYS_RISCV_HWPROBE = 258, SYS_RISCV_FLUSH_ICACHE = 259; complete through syscall 471 |
| Seccomp default profile | `contrib/seccomp/seccomp_default.go` | Full | arches() returns ArchRISCV64; adds riscv_flush_icache and riscv_hwprobe syscalls; note: ArchRISCV32 does not exist |
| OCI runtime-spec seccomp constant | `vendor/.../specs-go/config.go` | Full | ArchRISCV64 = "SCMP_ARCH_RISCV64" defined |
| Platform database | `vendor/.../platforms/database.go` | Full | riscv64 recognized in isKnownArch(); no alias normalization required |

**ISA extensions:** No RVV (RISC-V Vector), Zba, Zbb, or any other RISC-V ISA extension references exist anywhere in the repository. containerd has no SIMD-accelerated code paths of its own.

**Comparison table per component:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Assembly syscall stubs | Yes (hand-tuned) | Yes (hand-tuned) | Yes (hand-tuned ECALL) |
| Platform database recognition | Yes (aliases: x86_64, x86-64) | Yes (alias: aarch64) | Yes (no aliases needed) |
| Seccomp arch constant | Yes | Yes | Yes |
| Arch-specific syscalls in seccomp | Yes (arch_prctl, modify_ldt) | Yes (ARM cache/TLS syscalls) | Yes (riscv_flush_icache, riscv_hwprobe) |
| SIMD in compression (via klauspost/compress) | Yes (amd64 assembly) | Yes (arm64 assembly) | No -- generic Go path only |
| Race detector support | Yes | No | No |

No TODOs, FIXMEs, stubs, or "not implemented" markers exist in any riscv64-specific code path.

---

## 5. Build System, Cross-Compilation, and Toolchain

containerd uses GNU Make. There is no CMake. Cross-compilation is done via two paths.

**Path A -- native make (used in nightly CI):**

Required packages:
```
apt-get install -y crossbuild-essential-riscv64
```
This installs `riscv64-linux-gnu-gcc` and the sysroot.

Build command:
```
GOARCH=riscv64 CGO_ENABLED=1 CC=riscv64-linux-gnu-gcc make binaries
```

If btrfs headers are absent from the cross-sysroot:
```
GOARCH=riscv64 CGO_ENABLED=1 CC=riscv64-linux-gnu-gcc BUILDTAGS=no_btrfs make binaries
```

**Path B -- Docker Buildx (used for release binaries):**

```
docker buildx build \
  --platform linux/riscv64 \
  -f .github/workflows/release/Dockerfile \
  --build-arg GO_VERSION=1.26.4 \
  --build-arg RELEASE_VER=v2.x.x \
  -o type=local,dest=./releases \
  .
```

The release Dockerfile uses [tonistiigi/xx:1.6.1](https://github.com/tonistiigi/xx) (pinned by digest) for transparent cross-compilation. The `xx-info` helper resolves TARGETPLATFORM to `riscv64-linux-gnu`, so `CC=$(xx-info)-gcc` becomes `riscv64-linux-gnu-gcc` automatically.

**Toolchain versions:**
- Go: 1.26.4 (pinned in CI); minimum Go 1.25 per project policy (go.mod declares `go 1.26.3`)
- GCC cross-compiler: `riscv64-linux-gnu-gcc` from `crossbuild-essential-riscv64` on Ubuntu 22.04
- tonistiigi/xx: 1.6.1 (pinned by SHA256 digest in release Dockerfile)

**QEMU:** No explicit QEMU configuration exists in the containerd repository. The Docker Buildx path relies on QEMU via binfmt implicitly provided by the GitHub Actions runner environment. The build itself (compilation) runs natively on the x86_64 host using the cross-compiler; QEMU is not required for compilation.

**Shim CGO:** `containerd-shim-runc-v2` is built with `SHIM_CGO_ENABLED ?= 0` by default. Cross-compiling the shim does not require a riscv64 C compiler.

**Known build failures:** None. The nightly CI produces successful riscv64 artifacts without failures as of 2026-06.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Container start/stop/exec | Yes | Yes | Yes | Core runtime works; 1752 passing integration tests in fork CI |
| Kubernetes CRI integration | Yes | Yes | Yes | Pure Go; no arch-specific code |
| OCI image pull/push | Yes | Yes | Yes | |
| Snapshotting (overlayfs) | Yes | Yes | Yes | |
| Snapshotting (btrfs) | Yes | Yes | Yes (requires no_btrfs workaround if headers absent) | |
| Seccomp filtering | Yes | Yes | Yes -- including riscv_flush_icache and riscv_hwprobe | |
| Checkpoint/Restore (CRIU) | Yes | Yes | No -- CRIU riscv64 port is feature-incomplete | CRIU [issue #1702](https://github.com/checkpoint-restore/criu/issues/1702) open; explicitly skipped in PR #13124 |
| EROFS filesystem mount | Yes | Yes | Partial -- kernel module missing on RISE CI runners | Module gap on test hardware; correctness unknown |
| Static binary | Yes | Yes | Yes | `containerd-static-*-linux-riscv64.tar.gz` ships in every release |
| Race detector | Yes | No | No | Go race detector does not support riscv64 |
| Image layer compression (zstd) | Yes -- SIMD-accelerated | Yes -- SIMD-accelerated | Yes -- generic Go path only | Performance gap; no correctness issue |

**Functional gaps:**

1. Checkpoint/Restore is not available on riscv64. The CRIU port merged in October 2024 ([CRIU PR #2234](https://github.com/checkpoint-restore/criu/pull/2234)) but remains feature-incomplete as of 2026-06. Live migration and container checkpointing are non-functional on riscv64. This is a CRIU gap, not a containerd gap, but it limits the feature set for riscv64 deployments.

2. EROFS userspace build and kernel module loading are skipped in the riscv64 CI PR. Whether EROFS mounts work correctly on riscv64 in production environments is unknown.

**Performance gaps:**

klauspost/compress (used for OCI layer zstd/S2/gzip operations) has no riscv64 assembly. amd64 and arm64 receive SIMD acceleration; riscv64 uses generic Go paths. This creates a throughput gap for image pull and push operations, specifically for layer decompression/compression. The magnitude of this gap is not quantified in any available source (Data not available: no riscv64 vs. amd64/arm64 compression benchmark for containerd or klauspost/compress).

**Security hardening gaps:** None identified in the available research. Seccomp, namespaces, and cgroups all function correctly on riscv64.

---

## 7. CI/CD Infrastructure

**Current state (as of 2026-06-17):**

| Workflow file | Trigger | riscv64 coverage | Runner | Nature |
|---|---|---|---|---|
| `.github/workflows/ci.yml` | PR, merge queue | None | -- | Integration tests run on ubuntu-22.04, ubuntu-24.04, ubuntu-24.04-arm only |
| `.github/workflows/nightly.yml` | Daily at 00:00 UTC | Cross-compile + artifact upload | ubuntu-latest (x86_64) | `GOARCH=riscv64 CGO_ENABLED=1 CC=riscv64-linux-gnu-gcc make binaries`; no test execution |
| `.github/workflows/release.yml` | Push/tag to main or release/** | Release binary build | ubuntu-latest (x86_64) via Docker Buildx | `docker buildx build --platform linux/riscv64`; no test execution |

**Critical finding:** There are zero riscv64 integration tests in the upstream containerd CI. The nightly and release workflows confirm the binary compiles but do not execute the test suite on riscv64 hardware or under QEMU. Any riscv64 regression can merge silently.

**PR #13124 -- proposed CI addition:**

[PR #13124](https://github.com/containerd/containerd/pull/13124) (opened 2026-03-25 by gounthar) proposes adding `ubuntu-24.04-riscv` to the `integration-linux` OS matrix in `ci.yml`. Runners are provided free by the [RISE Project](https://riseproject.dev) on Scaleway EM-RV1 bare-metal RISC-V nodes. The PR runs on every PR and push, same trigger as the existing amd64 and arm64 integration jobs.

Fork CI results: 1752 tests pass, 62 skipped, 0 failures on both cgroupfs and systemd cgroup drivers (run: [gounthar/containerd actions run #23548524366](https://github.com/gounthar/containerd/actions/runs/23548524366)).

Architecture-specific skips in PR #13124:
- CRIU and checkpoint/restore (CRIU not available for riscv64 per [criu issue #1702](https://github.com/checkpoint-restore/criu/issues/1702))
- EROFS userspace build and kernel module loading (kernel module absent on RISE runners)
- dm_verity check patched to use `/proc/modules` instead of `lsmod` (lsmod was absent from early runner images; fixed in riscv-runner-images #27)

Runner image issues that were previously blocking:
- `TestSetPositiveOomScoreAdjustment` failure: fixed in riscv-runner-images #26 (pod now runs --privileged)
- `lsmod` missing: fixed in riscv-runner-images #27
- OOM score reset: fixed (PR commits 8027dff and 9bf4caf iterate on this)

All runner image fixes were applied by luhenry (Qualcomm/RISE) on 2026-05-10.

**Current blocker for PR #13124:** A containerd org admin must install the [RISE GitHub App](https://github.com/apps/rise-risc-v-runners) on the `containerd/containerd` repository to enable `ubuntu-24.04-riscv` runner routing. The PR has received zero human maintainer reviews and requires two approvals. No maintainer has commented on the PR.

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Integration tests in ci.yml | Yes (ubuntu-22.04, ubuntu-24.04) | Yes (ubuntu-24.04-arm) | No (PR #13124 pending) |
| Nightly cross-compile build | Yes | Yes | Yes |
| Release binary CI | Yes | Yes | Yes |
| Native runner available | Yes | Yes | Yes (RISE, not yet activated) |
| Race detector tests | Yes | No | No |

---

## 8. Distribution and Release Status

**Official GitHub release binaries:**

riscv64 binaries are included in every release from v1.6.8 onward. Confirmed present in all 5 most recent releases via GitHub Releases API:

| Release | riscv64 assets |
|---|---|
| v2.3.2 (latest) | `containerd-2.3.2-linux-riscv64.tar.gz`, `containerd-static-2.3.2-linux-riscv64.tar.gz` |
| v2.2.5 | `containerd-2.2.5-linux-riscv64.tar.gz`, `containerd-static-2.2.5-linux-riscv64.tar.gz` |
| v2.1.9 | `containerd-2.1.9-linux-riscv64.tar.gz`, `containerd-static-2.1.9-linux-riscv64.tar.gz` |
| v2.0.10 | `containerd-2.0.10-linux-riscv64.tar.gz`, `containerd-static-2.0.10-linux-riscv64.tar.gz` |
| v1.7.33 | `containerd-1.7.33-linux-riscv64.tar.gz`, `containerd-static-1.7.33-linux-riscv64.tar.gz`, `cri-containerd-1.7.33-linux-riscv64.tar.gz`, `cri-containerd-cni-1.7.33-linux-riscv64.tar.gz` |

Build provenance attestation is generated for all release artifacts including riscv64.

**Linux distribution packages:**

| Distribution | riscv64 available | Version | Source |
|---|---|---|---|
| Ubuntu 24.04 Noble | Yes -- ports channel | 2.1.9+ds1-1 [NEEDS VERIFICATION -- version inferred from Debian tracker] | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=containerd&suite=noble&searchon=names&section=all) |
| Debian (current) | Yes -- INSTALLED | 2.1.9+ds1-1, built on rv-manda-01 | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=containerd) |
| Arch Linux RISC-V | Unverified | -- | Status page returned 404; alternate URL ECONNREFUSED; no open blockers in archriscv-packages tracker |

**To get a working riscv64 binary:** Download `containerd-2.3.2-linux-riscv64.tar.gz` from the [GitHub Releases page](https://github.com/containerd/containerd/releases/tag/v2.3.2). No patches or custom builds are required. Static binary available as `containerd-static-2.3.2-linux-riscv64.tar.gz` for environments where libc linking is problematic.

**Binary size reference [NEEDS VERIFICATION -- sourced from gounthar/docker-for-riscv64, not the upstream release]:** containerd riscv64 binary approximately 37 MB; containerd-shim-runc-v2 approximately 13 MB.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| opencontainers/runc | OCI container runtime (exec, namespaces, cgroups) | Yes | Unknown -- no official CI confirmed | Yes -- `runc.riscv64` in v1.5.0 | runc issue #5166 (Add linux/riscv64 to CI) closed; post-closure CI status ambiguous |
| checkpoint-restore/criu (via go-criu) | Checkpoint/Restore in Userspace | Partial | Partial -- coredump support added March 2026 | Unknown | [criu issue #1702](https://github.com/checkpoint-restore/criu/issues/1702) still open; explicitly skipped in containerd riscv64 CI |
| klauspost/compress | zstd, S2, gzip, snappy (OCI layer compression) | Yes -- pure-Go fallback | Yes -- Go tests run on any arch | N/A (library) | No riscv64 assembly; amd64 and arm64 get SIMD; riscv64 uses generic Go -- throughput gap for image operations |
| containerd/cgroups | cgroups v1/v2 management | Yes | Unknown | N/A (library) | Pure Go + x/sys syscalls; no riscv64 issues filed |
| containernetworking/plugins | CNI network plugins | Yes -- PR #739 merged May 2022 | Unknown | Unknown | No open riscv64 issues |
| google.golang.org/grpc | gRPC transport for CRI, NRI, ttrpc | Yes -- pure Go | Yes | N/A (library) | No arch-specific code |
| go.etcd.io/bbolt | Embedded key-value store (containerd metadata) | Yes -- since May 2019 | Yes | N/A (library) | Long-standing support; no open issues |
| go.opentelemetry.io/otel | Distributed tracing | Yes -- pure Go | Yes | N/A (library) | No riscv64-specific issues |
| golang.org/x/sys | Linux syscall bindings | Yes -- full riscv64 syscall tables | Yes | N/A (library) | Actively maintained; includes riscv64 assembly stubs and RISCVHWProbe |
| erofs/go-erofs | EROFS read-only filesystem | Unknown | Blocked -- EROFS kernel module absent on RISE test hardware | N/A (library) | Skipped in PR #13124 CI |
| k8s.io/cri-api, cri-client | Kubernetes CRI interface | Yes -- pure Go protobuf | Yes | N/A (library) | No riscv64-specific issues |
| google.golang.org/protobuf | Protocol Buffers | Yes -- pure Go | Yes | N/A (library) | No riscv64 issues |
| Microsoft/hcsshim | Windows Host Compute Service shim | N/A -- Windows only | N/A | N/A | Not compiled on Linux/riscv64 |

**Deep-dive on critical gaps:**

**CRIU:** Basic riscv64 port merged October 2024 ([CRIU PR #2234](https://github.com/checkpoint-restore/criu/pull/2234)). Coredump support added March 2026 ([CRIU PR #2969](https://github.com/checkpoint-restore/criu/pull/2969)). The [tracking issue #1702](https://github.com/checkpoint-restore/criu/issues/1702) remains open. containerd's integration tests explicitly skip CRIU on riscv64 in PR #13124. Live migration and container checkpointing are unavailable on riscv64 deployments.

**klauspost/compress:** This library provides zstd and S2 compression used for OCI image layer operations. It has hand-written assembly for amd64 (AVX2/SSE4) and arm64 (NEON). riscv64 falls through to the pure Go implementation. No riscv64 SIMD path exists and no open issue requests one. The performance delta is unquantified in available sources.

---

## 11. Known Bugs and Active Issues

**Correctness bugs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #3389](https://github.com/containerd/containerd/issues/3389) | CPU at 100% on container deletion with crun+Docker (riscv64) | Closed / resolved | Critical (was) | Root cause: incorrect EpollEvent struct padding in golang.org/x/sys for riscv64 (golang/sys PR #40, CL 189877). Fixed 2019-08-12 via containerd [PR #3526](https://github.com/containerd/containerd/pull/3526). No longer present in any supported release. |
| [Issue #8184](https://github.com/containerd/containerd/issues/8184) | containerd-shim error when running in riscv64 | Closed as "not planned" | Low | Legacy v1 shim (io.containerd.runtime.v1.linux) segfaults on riscv64. Closed wontfix -- v1 shim is deprecated; users must use v2 runtime. Not a regression in supported configurations. |

**Infrastructure / CI gaps:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #13020](https://github.com/containerd/containerd/issues/13020) | Add linux/riscv64 to CI test matrix | Open | Medium | Tracking issue; seeded PR #13124. No maintainer responses in the issue thread. |
| [PR #13124](https://github.com/containerd/containerd/pull/13124) | ci: add riscv64 to Linux integration test matrix | Open, 0/2 approvals | Medium | Fork CI: 1752 pass, 62 skipped, 0 fail. Blocked on RISE GitHub App install by containerd org admin + 2 human approvals. |

**No open correctness bugs exist for riscv64 as of 2026-06-17.** The 100% CPU bug from 2019 was the only confirmed correctness defect and it has been resolved in all supported releases.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. **CRIU on riscv64 is feature-incomplete.** Checkpoint/restore, live migration, and snapshot features remain unavailable. This is a CRIU upstream gap, not a containerd gap. The work is active (two PRs merged since October 2024) but not complete. Estimated completion date: Data not available.

2. **EROFS kernel module absent on RISE CI hardware (Scaleway EM-RV1).** This skips a subset of storage tests. Whether EROFS mounts work on production riscv64 hardware with a kernel that includes the module is unknown.

3. **No SIMD for compression in klauspost/compress on riscv64.** This is a library gap, not a containerd gap. Throughput for image pull/push will be lower than amd64 or arm64 until RVV assembly paths are written.

**Organizational blockers:**

1. **PR #13124 requires a containerd org admin to install the RISE GitHub App.** This is a one-time administrative action at [https://github.com/apps/rise-risc-v-runners](https://github.com/apps/rise-risc-v-runners). No maintainer has responded to this request despite the PR being open since March 2026. The PR has 0 of 2 required human approvals. This is the single blocker between the current state and riscv64 having full CI coverage.

2. **No maintainer engagement on riscv64 issues.** [Issue #13020](https://github.com/containerd/containerd/issues/13020) has 6 comments, all from the reporter and one community member. No core maintainer (estesp, AkihiroSuda, fuweid, cpuguy83, dmcgowan, kzys) has commented on either the issue or PR #13124.

**Acceptance probability:** High. The technical work is complete. The only barrier is a maintainer approving and merging a 6-commit CI YAML change backed by 1752 passing tests. The original riscv64 enablement PR (#6882) was merged with maintainer support (AkihiroSuda, NTT). The lack of engagement on PR #13124 appears to be a bandwidth issue, not technical opposition.

---

## 13. Investment Analysis

RISE Project involvement with containerd is limited to infrastructure: the RISE riscv64 GitHub Actions runners (Scaleway EM-RV1 nodes) are the proposed CI backend for PR #13124. RISE has not funded any containerd code changes. Runner image fixes (missing lsmod, OOM score, EROFS module) were made by luhenry (Qualcomm/RISE) on 2026-05-10 to the runner infrastructure, not to containerd itself. The [RISE blog post from May 12, 2026](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) mentions containerd as a cloud-native CI target alongside k3s and Kubernetes but describes no funded RFP or dedicated engineering allocation for containerd.

### 13.1 Functional Enablement

No functional enablement work is needed for containerd core. The runtime compiles, runs, and passes 1752 integration tests on riscv64 without modification.

CRIU checkpoint/restore requires upstream CRIU work (not a containerd task). If live migration is a product requirement, track [criu issue #1702](https://github.com/checkpoint-restore/criu/issues/1702).

### 13.2 Performance Optimization

The compression throughput gap (klauspost/compress has no riscv64 SIMD) affects image pull/push latency. Adding RVV (RISC-V Vector) assembly to klauspost/compress would close this gap. This is upstream library work in a separate repository. Effort estimate: Data not available (depends on RVV ISA proficiency and benchmark validation; the amd64 and arm64 paths are each 2,000-5,000 lines of assembly).

### 13.3 CI/CD Infrastructure

The highest-leverage action is unblocking PR #13124. This requires:
1. Contact a containerd org admin (estesp/AWS, AkihiroSuda/NTT, fuweid/Microsoft, cpuguy83/Microsoft, dmcgowan/Docker, kzys/Baseten) and request installation of the RISE GitHub App at [https://github.com/apps/rise-risc-v-runners](https://github.com/apps/rise-risc-v-runners).
2. Solicit two maintainer approvals for PR #13124.

This is a coordination task, not a development task. Once unblocked, every PR to containerd/containerd will run 1752 integration tests on native RISC-V hardware at no cost (RISE runners are free for open source).

### 13.4 Ecosystem Enablement

containerd is a container runtime -- it has no dependent package ecosystem requiring separate riscv64 enablement (no Python wheels, no npm packages, no Maven JARs). The downstream ecosystem concern is runc (OCI runtime) and the full Kubernetes/Docker stack. Those are tracked in separate reports.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Contact containerd org admin to install RISE GitHub App; solicit 2 PR approvals for PR #13124 | 0.2 (coordination only) | Qualcomm/RISE liaison | Critical |
| CI/CD | Review and approve PR #13124 (technical review of 6 CI YAML commits) | 0.5 | containerd maintainer | Critical |
| Functional | CRIU riscv64 feature completion (live migration, full checkpoint) | Unknown -- upstream CRIU work | CRIU community | High (if live migration is a product requirement) |
| Functional | EROFS kernel module availability on riscv64 test hardware | 0.5 (kernel config / runner image) | RISE runner infrastructure team | Medium |
| Performance | RVV assembly for klauspost/compress (zstd, S2, gzip) | 4-12 (estimate only; no benchmark data to confirm ROI) | Community/RISE | Low until quantified |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [containerd/containerd repository](https://github.com/containerd/containerd)
- [containerd.io homepage](https://containerd.io)
- [PR #3328 -- Update x/sys, x/net and bbolt modules for riscv64](https://github.com/containerd/containerd/pull/3328)
- [PR #3526 -- bump x/sys to fix riscv64 epoll](https://github.com/containerd/containerd/pull/3526)
- [PR #4277 -- riscv64 arch does not support -buildmode=pie](https://github.com/containerd/containerd/pull/4277)
- [PR #5937 -- Makefile.linux: build on RISC-V with PIE](https://github.com/containerd/containerd/pull/5937)
- [PR #6882 -- Support RISC-V 64](https://github.com/containerd/containerd/pull/6882)
- [PR #11839 -- seccomp: kernel v6.13 (libseccomp v2.6.0)](https://github.com/containerd/containerd/pull/11839)
- [PR #13124 -- ci: add riscv64 to Linux integration test matrix](https://github.com/containerd/containerd/pull/13124)
- [Issue #3389 -- CPU at 100% on container deletion with crun+Docker (riscv64)](https://github.com/containerd/containerd/issues/3389)
- [Issue #8184 -- containerd-shim error when running in riscv64](https://github.com/containerd/containerd/issues/8184)
- [Issue #13020 -- Add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [CRIU riscv64 tracking issue #1702](https://github.com/checkpoint-restore/criu/issues/1702)
- [CRIU riscv64 basic port PR #2234](https://github.com/checkpoint-restore/criu/pull/2234)
- [CRIU riscv64 coredump support PR #2969](https://github.com/checkpoint-restore/criu/pull/2969)
- [RISE GitHub App (riscv-runner-app)](https://github.com/apps/rise-risc-v-runners)
- [RISE Project -- Announcing the RISE RISC-V Runners (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners/)
- [RISE Project -- RISE RISC-V Runners: Six Weeks In (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [containerd v2.3.2 GitHub Release (latest)](https://github.com/containerd/containerd/releases/tag/v2.3.2)
- [Debian buildd status for containerd](https://buildd.debian.org/status/package.php?p=containerd)
- [Ubuntu 24.04 Noble packages -- containerd](https://packages.ubuntu.com/search?keywords=containerd&suite=noble&searchon=names&section=all)
- [Fork CI run for PR #13124 -- 1752 pass / 0 fail](https://github.com/gounthar/containerd/actions/runs/23548524366)
- [tonistiigi/xx cross-compilation helper](https://github.com/tonistiigi/xx)