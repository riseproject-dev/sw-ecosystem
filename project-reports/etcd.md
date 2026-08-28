---
title: etcd
parent: Project Reports
categories:
  - containers
---

# etcd
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for etcd<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

etcd is a distributed, strongly-consistent key-value store used as the backing store for Kubernetes cluster state. It implements the Raft consensus algorithm and exposes a gRPC API (v3) with a watch facility for change notification. It is written entirely in Go with no C or assembly code.

**Governance.** etcd is a [CNCF Graduated project](https://www.cncf.io/projects/etcd/) (graduated November 24, 2020; incubated December 2018). It is governed under [SIG-etcd](https://github.com/kubernetes/community/blob/master/sig-etcd/README.md) within the Kubernetes community, using maintainer lazy-consensus with a supermajority fallback after a three-business-week period. Roles are defined in `OWNERS` and `OWNERS_ALIASES` files in the repository.

**Corporate sponsors.** Current active maintainers, from `OWNERS_ALIASES` and the SIG-etcd README:

| Role | Name | GitHub handle | Company |
|---|---|---|---|
| Chair | Siyuan Zhang | @siyuanfoundation | Google |
| Chair | Ivan Valdes | @ivanvc | Inmar Intelligence |
| Tech Lead | Benjamin Wang | @ahrtr | Broadcom (formerly VMware) |
| Tech Lead | Marek Siarkowicz | @serathius | Google |
| Tech Lead | Wei Fu | @fuweid | unknown |

Historical contributors came from Amazon, IBM, Alibaba, and Red Hat. The active maintainership is dominated by Google and Broadcom.

**Culture on new ports.** Cautious to negative. [CONTRIBUTING.md](https://github.com/etcd-io/etcd/blob/main/CONTRIBUTING.md) states that "the only supported architecture is linux-amd64" and "bug reports for other environments will generally be ignored." Adding an architecture requires dedicated nodes in the Kubernetes Prow testing infrastructure. When asked about riscv64 plans in May 2026, maintainer @serathius responded: "No plans." The project does not rely on GitHub Actions; all CI runs on Prow, which the etcd project does not control.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| August 29, 2019 | [PR #10834](https://github.com/etcd-io/etcd/pull/10834) merged: vendor update of `golang.org/x/sys` and `golang.org/x/net` to include riscv64 support. Only RISC-V related commit ever merged. Author: @carlosedp (Carlos Eduardo), part of a broad RISC-V Go ecosystem bringup effort. Merged by @gyuho. | GitHub API (merge_commit_sha: 876df8d), verified |
| March 2022 | Issue #13504 and issue #14522 requesting riscv64 CI extension. Both closed stale. | GitHub search |
| April 21, 2023 | [PR #15490](https://github.com/etcd-io/etcd/pull/15490) "feat: add riscv64 support" (draft) closed without merging. Author: @ernado (Aleksandr Razumov). Blocker: `gcr.io/distroless/static-debian11` had no riscv64 variant. Maintainer @ahrtr: distroless is required due to CVE exposure; maintainer @serathius: opposed to a separate base image for riscv64. Author closed the PR and created the [go-riscv/etcd](https://github.com/go-riscv/etcd) community fork. | GitHub PR #15490 comments, verified |
| March 20, 2026 | [Issue #21509](https://github.com/etcd-io/etcd/issues/21509) opened by @gounthar requesting formal riscv64 support, with build evidence from native hardware (BananaPi F3 / SpacemiT K1) and an offer of free RISE riscv64 CI runners. | GitHub issue #21509, verified |
| March 29, 2026 | [PR #21510](https://github.com/etcd-io/etcd/pull/21510) "server: add riscv64 to supported architectures" closed without merging. A one-line change to `checkSupportArch()`. Maintainer @ivanvc: etcd CI runs on Prow; adding an architecture requires physical riscv64 Prow nodes, which do not exist. Author closed voluntarily. Maintainer @serathius, when asked about future plans in May 2026: "No plans." | GitHub PR #21510 comments, verified |
| June 4, 2026 | [Issue #21509](https://github.com/etcd-io/etcd/issues/21509) closed by maintainer @jberkus after confirming with k8s-infra: "We do not currently have RISCV machines in the Prow testing pool." The path identified: RISE Project provides Scaleway EM-RV1 machines to SIG-k8s-infra, which integrates them into Prow, which then unblocks etcd. That conversation was beginning on #sig-k8s-infra Slack as of June 5, 2026. | GitHub issue #21509 comment thread, verified |

**Note on contradictory finding.** The build system research section contains a table entry claiming "PR #21509 Merged Jun 4, 2026." This is incorrect. #21509 is an issue, not a PR; it was closed (not merged) by @jberkus with the /close command on June 4, 2026 because the Prow infrastructure blocker was confirmed. All other sources are consistent: no riscv64 support was merged as of the report date. The erroneous entry is discarded.

**Is work fully upstream?** No. The sole merged upstream contribution is the 2019 vendor dependency bump (PR #10834). All substantive riscv64 enablement attempts have been rejected. riscv64 is not an officially supported platform in etcd as of June 2026.

**RISE Project involvement.** None. A search of all 27 RISE Project blog posts (May 2024 through June 2026) returns zero mentions of etcd. The RISE Project wheel builder does not list etcd. RISE was cited by contributor @gounthar as a source of free riscv64 CI runners, and RISE TSC Co-Chair @luhenry offered Scaleway EM-RV1 machines to SIG-k8s-infra in the issue #21509 thread (June 5, 2026), but no funded or structured RISE work exists for etcd itself.

---

## 3. Upstream Support Tier

etcd defines three support tiers, documented at [etcd.io/docs/v3.6/op-guide/supported-platform/](https://etcd.io/docs/v3.6/op-guide/supported-platform/):

- **Tier 1** (all tests must pass, release-blocking): linux/amd64, linux/arm64
- **Tier 3** (best-effort, not release-blocking): darwin/amd64, darwin/arm64, windows/amd64, linux/ppc64le, linux/s390x
- **Unsupported** (requires `ETCD_UNSUPPORTED_ARCH` env var at runtime to bypass the startup exit): everything else

riscv64 is not listed in any tier. It is in the unsupported category enforced at runtime by `checkSupportArch()` in `server/etcdmain/etcd.go`.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official support tier | Tier 1 | Tier 1 | Unsupported |
| Release binary published | Yes | Yes | No |
| CI coverage | Full (Prow) | Full (Prow) | None |
| Runtime startup gate | Passes | Passes | Blocked; requires `ETCD_UNSUPPORTED_ARCH=riscv64` |
| Makefile PLATFORMS target | Yes | Yes | No |
| Docker multi-arch image | Yes | Yes | No |
| Distroless base image available | Yes | Yes | Yes (blocker from 2023 is now resolved) |

The distroless blocker that caused PR #15490 to fail in 2023 has been resolved: `gcr.io/distroless/static-debian11` now supports riscv64. The current blocker is entirely the Prow CI infrastructure constraint.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

etcd is a pure Go application. It has no C source files, no assembly files, no JIT compiler, no SIMD dispatch, and no architecture-gated build tags within the repository itself.

A full source scan of the etcd-io/etcd repository confirms:
- Zero files matching `*.s`, `*.S`, or `*.asm`
- Zero occurrences of "riscv" in any Go, Makefile, shell, or YAML source file
- Zero occurrences of SIMD intrinsic keywords (`avx`, `neon`, `sse`, `rvv`, `vfloat32m1_t`)
- Zero architecture-specific files with `_amd64.go`, `_arm64.go`, or `_riscv64.go` suffixes
- Zero JIT compilation files

Endianness detection in `pkg/cpuutil/endian.go` delegates to `golang.org/x/sys/cpu`, which actively supports riscv64.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Core key-value logic (bbolt) | Pure Go | Pure Go | Pure Go | No arch-specific code in etcd itself; see bbolt in Section 9 |
| Raft consensus | Pure Go | Pure Go | Pure Go | go.etcd.io/raft/v3, no arch code |
| gRPC transport | Pure Go | Pure Go | Pure Go | google.golang.org/grpc, no arch code |
| Crypto (TLS, AES-GCM) | Assembly in x/crypto | Assembly in x/crypto | Pure Go fallback | Performance penalty in x/crypto on riscv64 |
| Hashing (xxhash) | Assembly (xxhash/v2) | Assembly (xxhash/v2) | Pure Go fallback | Performance penalty on hash-intensive paths |
| Startup architecture gate | Allowed | Allowed | Blocked | One-line fix needed in checkSupportArch() |

Because etcd has no architecture-specific code, riscv64 correctness is entirely a function of the Go toolchain's riscv64 support and the correctness of the pure-Go fallback paths in its dependencies. No riscv64-specific implementation work is required within etcd itself.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Language and build system.** Pure Go with Make. No CMake, no C toolchain, no Autotools.

**Go version requirement.** `go.mod` specifies `go 1.26` with `toolchain go1.26.4`. Go has treated `linux/riscv64` as a first-class compilation target since Go 1.14. No minimum Go version specific to riscv64 exists. The `CGO_ENABLED=0` flag is set by default in `scripts/build_lib.sh`, producing a fully static binary.

**Cross-compilation for riscv64 (not in official Makefile targets).**

```
GOOS=linux GOARCH=riscv64 ./scripts/build.sh
```

No additional flags are required. `scripts/build_lib.sh` sets `-trimpath -installsuffix=cgo` and injects the git SHA via ldflags. For cross-compiled binaries, the version check falls back to `go tool nm` since the binary cannot be executed on the build host.

**Official release platform list (`scripts/build-binary.sh`).**

Linux release targets: `amd64`, `arm64`, `ppc64le`, `s390x`. `riscv64` is absent.

**Makefile PLATFORMS variable.**

```
PLATFORMS=linux-amd64 linux-386 linux-arm linux-arm64 linux-ppc64le linux-s390x darwin-amd64 darwin-arm64 windows-amd64 windows-arm64
```

`linux-riscv64` is absent.

**Docker multi-arch (`scripts/build-docker.sh`).**

Default `PLATFORMS`: `linux/amd64,linux/arm64,linux/ppc64le,linux/s390x`. Uses `docker buildx` with `tonistiigi/binfmt --install all` for QEMU emulation on non-native targets. `linux/riscv64` is absent. The Docker build downloads pre-built binary tarballs per architecture; since no riscv64 tarball is published, no riscv64 container image is produced.

**Known build failures.** None documented. etcd builds successfully on riscv64 with `GOOS=linux GOARCH=riscv64 ./scripts/build.sh`. Build times on native hardware (BananaPi F3 / SpacemiT K1, rv64gc ISA): server binary approximately 2 minutes 20 seconds, etcdctl approximately 34 seconds. These figures are from issue #21509 (gounthar, March 2026) and are build-time metrics on a low-power embedded board, not a server-class RISC-V system. [NEEDS VERIFICATION]

**QEMU usage.** Not used for building binaries. QEMU appears only in the Docker multi-arch image assembly pipeline.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because etcd has no arch-specific code, the feature matrix is binary: either the Go toolchain can target riscv64 (it can), or it cannot. All etcd functionality is available on riscv64 once the startup gate is bypassed or removed.

**Functional gaps.**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| etcd server starts | Yes | Yes | Requires `ETCD_UNSUPPORTED_ARCH=riscv64` |
| All v3 API operations | Yes | Yes | Yes (when started) |
| Watch, lease, auth, maintenance | Yes | Yes | Yes (when started) |
| Official release binary | Yes | Yes | No |
| Docker container image | Yes | Yes | No (community fork only) |

**Performance gaps.**

No runtime benchmarks comparing riscv64 to amd64 or arm64 exist in any public source. The following qualitative gaps are derived from known dependency behavior:

- `golang.org/x/crypto`: AES-GCM and ChaCha20-Poly1305 have assembly-optimized paths for amd64 and arm64. riscv64 takes the pure-Go path. Magnitude of penalty: not quantified for etcd workloads.
- `github.com/cespare/xxhash/v2`: Assembly for amd64 and arm64; pure-Go fallback for riscv64 (`xxhash_other.go`, build tag `!amd64 && !arm64`). Impact on etcd is low because xxhash is used by the Prometheus client, not in the critical Raft or storage path.
- `go.etcd.io/bbolt`: Pure Go, no assembly. No performance penalty relative to other platforms.

The Go runtime itself (Go 1.26) has open optimization work for riscv64 (stackcheck overhead [golang/go#64074], crc32 assembly [golang/go#78918], jump table optimization [golang/go#78515]), but none of these directly block etcd correctness.

**Security hardening gaps.** Data not available: no analysis of PIE/stack-canary/CFI status on riscv64 builds vs amd64 was found in the research.

**NaN / floating-point semantics.** Not applicable. etcd does not perform floating-point computation.

---

## 7. CI/CD Infrastructure

etcd CI runs on Kubernetes Prow infrastructure. All workflow files in `.github/workflows/` (12 files confirmed) use `ubuntu-latest` runners (x86_64). There is no QEMU emulation step, no riscv64 runner, and no cross-arch workflow for riscv64 anywhere in the repository.

A search across all 12 workflow files, the Makefile, and `scripts/build.sh` for the string "riscv" returns zero matches.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI platform | Prow/ubuntu-latest | Prow/ubuntu-latest | None |
| Unit tests | Yes | Yes | No |
| Integration tests | Yes | Yes | No |
| E2E tests | Yes | Yes | No |
| Release gating | Yes | Yes | No |
| RISE runners used | No | No | Not applicable (Prow, not GitHub Actions) |

**Why RISE runners do not help directly.** RISE provides native riscv64 runners via the GitHub Actions `ubuntu-24.04-riscv` label, available free to open source projects. etcd's CI is Prow-based and does not use GitHub Actions for testing. Integrating RISE machines into Prow requires a SIG-k8s-infra decision and provisioning effort. Maintainer @ivanvc confirmed this is the hard constraint (March 2026). @luhenry (RISE TSC Co-Chair) offered Scaleway EM-RV1 machines to SIG-k8s-infra (June 5, 2026 in issue #21509), but no agreement had been reached as of the report date.

---

## 8. Distribution and Release Status

**Official upstream releases.** Checked: v3.7.0-rc.0, v3.6.12, v3.5.31, v3.4.45, v3.7.0-beta.0. Linux binary tarballs exist for `linux-amd64`, `linux-arm64`, `linux-ppc64le`, `linux-s390x`. No release asset contains "riscv64" in any release. riscv64 is absent from all upstream official binaries.

**OCI container images.** The official etcd container image (`gcr.io/etcd-development/etcd`, `registry.k8s.io/etcd`) is published for `linux/amd64`, `linux/arm64`, `linux/ppc64le`, `linux/s390x`. No riscv64 manifest exists in official images.

**Community fork.** [go-riscv/etcd](https://github.com/go-riscv/etcd) maintained by @ernado. Container image `ghcr.io/go-riscv/etcd:v3.6.0-riscv64.0-riscv64` is available. The fork was last updated January 2024. [NEEDS VERIFICATION for current maintenance status.]

**Debian.** etcd version 3.5.30-2 in Debian sid: riscv64 status is **Installed**, successfully built on buildd `rv-osuosl-03`. All mainstream architectures including riscv64 are fully built and installed. Source: [buildd.debian.org](https://buildd.debian.org/status/package.php?p=etcd&suite=sid), confirmed.

**Ubuntu 24.04 Noble.** `etcd-client` and `etcd-server` are available in the Ubuntu ports archive for riscv64. `etcd-discovery` is absent for riscv64. `golang-etcd-server-dev` is architecture-independent. These are distro-built packages, not upstream release binaries. Source: [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=etcd&suite=noble&searchon=names&section=all), confirmed.

**Arch Linux RISC-V.** The Arch Linux RISC-V port status tracker (archriscv.felixc.at) was unreachable during research (ECONNREFUSED). The official Arch Linux package database lists etcd 3.6.12-1 for x86_64 only. riscv64 status for Arch: cannot verify.

**PyPI `etcd` package.** Version 2.0.8 is a pure-Python client library (`none-any` wheel). Architecture is not relevant; the wheel runs on all platforms including riscv64. This is not the etcd server binary.

**What a user must do to run etcd on riscv64 today (June 2026).**

1. Build from source: `GOOS=linux GOARCH=riscv64 ./scripts/build.sh` (requires Go 1.26).
2. Start the binary with: `ETCD_UNSUPPORTED_ARCH=riscv64 ./etcd`.
3. Or: use the community container image `ghcr.io/go-riscv/etcd:v3.6.0-riscv64.0-riscv64`.
4. Or: install the Debian package (`etcd-server` in Debian sid, riscv64 built and installed).

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Go runtime (go 1.26) | Language runtime, GC, scheduler | Supported (first-class since Go 1.14; GORISCV64 profiles rva20u64/rva22u64/rva23u64 in 1.26) | CI builder `linux-riscv64-rva22u64` exists in Go project | go1.26.4 released | Open perf issues: stackcheck (#64074), crc32 asm (#78918), jump tables (#78515). No hard blocker. |
| go.etcd.io/bbolt (v1.5.0-rc.0) | Embedded key-value storage (memory-mapped files, 8-byte atomics) | Builds; cross-arch-test.yaml includes linux riscv64 | Cross-compile only in CI; no QEMU execution | No riscv64-specific release binary | [PR #159](https://github.com/etcd-io/bbolt/pull/159) "Add support for riscv64" merged 2019-05-27. No open riscv64 issues. |
| go.etcd.io/raft/v3 (v3.7.0-rc.1) | Raft consensus | Builds (pure Go) | Runs on whatever Go CI covers | No standalone binary | Pure Go; not a blocker. |
| google.golang.org/grpc (v1.81.1) | RPC transport | Builds (pure Go; no GOARCH assembly) | CI matrix covers amd64 and arm64 only; riscv64 not in matrix | Module-only | No riscv64 issues found. Not a blocker. |
| google.golang.org/protobuf (v1.36.11) | Wire serialization | Pure Go; builds on riscv64 | No riscv64-specific issues | Module-only | No blocking issues. |
| golang.org/x/crypto (v0.52.0) | TLS, AES-GCM, ChaCha20-Poly1305 | Builds; assembly for amd64/arm64 only; riscv64 takes pure-Go path | No riscv64-specific issues | Module-only | Performance penalty vs amd64/arm64; correctness is fine. |
| github.com/cespare/xxhash/v2 (v2.3.0) | Fast 64-bit hashing (Prometheus client) | Assembly for amd64+arm64 only; riscv64 takes `xxhash_other.go` pure-Go path (build tag `!amd64 && !arm64`) | Pure-Go fallback works | Module-only | Low impact; not in Raft or storage hot path. |
| github.com/prometheus/client_golang (v1.23.2) | etcd metrics exposure | Builds; historical issue #833 (procfs riscv64 fix) resolved | riscv64 binaries exist in Prometheus releases | Prometheus v3.12.0 ships `prometheus-3.12.0.linux-riscv64.tar.gz` | No open blockers. |
| github.com/prometheus/procfs (v0.16.1) | /proc parsing for metrics | [PR #325](https://github.com/prometheus/procfs/pull/325) fixed riscv64, merged 2021; v0.16.1 is well past that fix | No current issues | Module-only | No blocker. Historical fix is long-merged. |
| go.opentelemetry.io/otel (v1.44.0) | Distributed tracing / OTLP export | Builds; issue #8126 "add cross-build workflow" is open (targets riscv64 and others) | No riscv64-specific test failures; #8126 is a CI gap, not a build failure | Module-only | Minor gap: riscv64 not in otel-go cross-build CI yet. Not a functional blocker. |
| go.uber.org/zap (v1.27.1) | Structured logging | Pure Go | No riscv64 issues | Module-only | No blocker. |
| golang.org/x/sys (v0.45.0) | Syscall wrappers; used by bbolt, procfs, zap, grpc | Active riscv64 maintenance | Frequent dependency bumps for riscv64 fixes visible across etcd dep tree | Module-only | riscv64 syscall coverage actively maintained; no open blockers. |

**Summary.** The only hard blocker is within etcd itself: the `checkSupportArch()` gate and the absence of riscv64 in the release pipeline. All direct library dependencies build cleanly on riscv64 or have a pure-Go fallback. No dependency has an open riscv64 build failure or correctness bug.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#21509](https://github.com/etcd-io/etcd/issues/21509) | Add riscv64 to supported architectures | Closed (June 4, 2026), unresolved | High | Closed because Prow has no riscv64 nodes. Root blocker is SIG-k8s-infra. RISE offered hardware June 5, 2026. |
| [#21510](https://github.com/etcd-io/etcd/pull/21510) | server: add riscv64 to supported architectures | Closed (March 29, 2026), not merged | High | One-line fix to `checkSupportArch()`. Rejected due to CI infrastructure constraint. Maintainer: "No plans." |
| [#15490](https://github.com/etcd-io/etcd/pull/15490) | feat: add riscv64 support | Closed (April 21, 2023), not merged | Medium | Distroless base image blocker (now resolved in distroless). Superseded by #21510 which hit the Prow blocker. |

**Correctness bugs.** None. No riscv64-specific correctness bugs are documented in etcd-io/etcd. etcd reportedly runs correctly on riscv64 hardware when `ETCD_UNSUPPORTED_ARCH=riscv64` is set, based on testing reported by @gounthar in issue #21509 (BananaPi F3 / SpacemiT K1, etcd 3.7.0-alpha.0, Go 1.26.1). [NEEDS VERIFICATION: independent reproduction on server-class riscv64 hardware.]

---

## 12. Objections and Upstream Blockers

**Stated objections and blockers, in priority order.**

1. **Prow CI has no riscv64 nodes (hard, external blocker).** etcd CI is Kubernetes Prow-based. Prow requires dedicated physical machines, not cloud-hosted runners. RISE runners use GitHub Actions, which is incompatible with Prow. Adding riscv64 requires SIG-k8s-infra to provision and integrate riscv64 nodes, assign personnel for test failure triage, and maintain the runner. Maintainer @ivanvc confirmed this is the gate (March 2026). @jberkus confirmed with k8s-infra and stated this is the blocker (June 2026).

2. **Maintainer stance: "No plans" (soft, organizational blocker).** @serathius responded with "No plans" when asked about riscv64 in May 2026. This reflects that the etcd maintainer team is not willing to drive the Prow provisioning work themselves. It does not mean the codebase is hostile to riscv64; it means the maintainers will not initiate the work.

3. **Personnel requirement for Prow integration.** SIG-k8s-infra requires (1) a party to provision and maintain the riscv64 Prow nodes, and (2) a party to triage test failures on the riscv64 runner. These can be different groups. RISE can potentially provide the hardware (Scaleway EM-RV1 machines were offered by @luhenry in issue #21509 on June 5, 2026). A separate team would need to take on the failure triage role.

**Path to resolution.** The required sequence is:
- RISE provides Scaleway EM-RV1 machines to SIG-k8s-infra with the agreed interface (SSH access with public keys, Ubuntu 24.04).
- SIG-k8s-infra integrates the machines into the Prow test pool.
- A party commits to riscv64 test failure triage for the etcd CI job.
- PR #21510 (the one-line `checkSupportArch()` change) is re-opened and merged.
- `linux/riscv64` is added to the release binary build list and Docker multi-arch platforms.

The etcd code change is trivial (one line). The infrastructure negotiation is the entire project.

**Acceptance probability.** Moderate if the Prow provisioning is handled externally. The maintainers have no objection to the code itself; they objected to being responsible for CI infrastructure they cannot resource. If RISE and SIG-k8s-infra resolve the Prow provisioning, the PR is straightforward to approve.

---

## 13. Investment Analysis

RISE has not funded or structured any work on etcd riscv64 support. The community fork at [go-riscv/etcd](https://github.com/go-riscv/etcd) is independent volunteer work, not RISE-sponsored.

### 13.1 Functional Enablement

The codebase requires one line of change: adding `"riscv64"` to the `checkSupportArch()` allow-list in `server/etcdmain/etcd.go`. No etcd logic needs to be written or modified for riscv64 functionality. This is gated on CI infrastructure.

### 13.2 Performance Optimization

No etcd-specific assembly or SIMD optimization exists for any platform. There is no riscv64 performance optimization work to do within etcd itself. Performance gaps exist in upstream dependencies (`golang.org/x/crypto`, `xxhash/v2`), but these are owned by those projects and affect all Go consumers, not etcd specifically.

Data not available: no runtime benchmarks (latency, throughput, ops/sec) comparing riscv64 to amd64 or arm64 exist in any public source. Any performance claim for etcd on riscv64 would require original benchmarking.

### 13.3 CI/CD Infrastructure

This is the dominant work item. The required steps:

- Provision Scaleway EM-RV1 (or equivalent server-class riscv64) machines for Prow integration.
- Coordinate with SIG-k8s-infra on Prow node registration, authentication, and job routing.
- Assign an engineer for riscv64 test failure triage on the etcd CI job.
- Add riscv64 to the GitHub Actions release workflow (`verify-released-assets.yaml`) once Prow tests pass.

The RISE offer to provide machines was accepted in principle by @jberkus (he pointed gounthar to #sig-k8s-infra). The SIG-k8s-infra integration work was not yet underway as of June 2026.

### 13.4 Ecosystem Enablement

etcd has no plugin or extension ecosystem requiring separate riscv64 enablement. Client libraries are pure-Go or pure-Python and are architecture-agnostic. The only downstream ecosystem concern is Kubernetes itself (k3s/k8s), which has its own riscv64 effort ([riseproject-dev/kubernetes-riscv](https://github.com/riseproject-dev/kubernetes-riscv), v1.36.0-riscv64 released April 2026).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `"riscv64"` to `checkSupportArch()` in etcd (PR #21510 re-open) | 0.1 | Any contributor | Critical |
| CI/CD | Coordinate RISE hardware provisioning with SIG-k8s-infra for Prow riscv64 nodes | 2-4 | RISE Project + SIG-k8s-infra | Critical |
| CI/CD | Assign riscv64 test failure triage engineer for etcd CI | ongoing | Qualcomm/RISE contributor | Critical |
| CI/CD | Add `linux/riscv64` to release binary build targets (build-binary.sh, build-docker.sh) | 0.5 | Any contributor | High |
| Validation | Run etcd benchmarks (ops/sec, latency) on server-class riscv64 hardware vs amd64 and arm64 baseline | 2-3 | Qualcomm infra team | High |
| Validation | Confirm correctness under the full E2E test suite on riscv64 hardware | 1-2 | Any contributor with Prow access | High |
| Performance | Profile crypto-heavy etcd paths (TLS, mutual-auth) to quantify x/crypto pure-Go penalty | 1-2 | Qualcomm/RISE contributor | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [etcd-io/etcd repository](https://github.com/etcd-io/etcd)
- [etcd homepage](https://etcd.io/)
- [etcd Supported Platforms (v3.6)](https://etcd.io/docs/v3.6/op-guide/supported-platform/)
- [etcd CNCF project page](https://www.cncf.io/projects/etcd/)
- [SIG-etcd README](https://github.com/kubernetes/community/blob/master/sig-etcd/README.md)
- [PR #10834 -- vendor: update x/sys and x/net modules to support Risc-V (merged 2019-08-29)](https://github.com/etcd-io/etcd/pull/10834)
- [PR #15490 -- feat: add riscv64 support (closed 2023-04-21)](https://github.com/etcd-io/etcd/pull/15490)
- [PR #21510 -- server: add riscv64 to supported architectures (closed 2026-03-29)](https://github.com/etcd-io/etcd/pull/21510)
- [Issue #21509 -- Add riscv64 to supported architectures (closed 2026-06-04)](https://github.com/etcd-io/etcd/issues/21509)
- [go-riscv/etcd community fork](https://github.com/go-riscv/etcd)
- [etcd 3.5.30-2 Debian buildd riscv64 status](https://buildd.debian.org/status/package.php?p=etcd&suite=sid)
- [etcd Ubuntu 24.04 Noble package search](https://packages.ubuntu.com/search?keywords=etcd&suite=noble&searchon=names&section=all)
- [riseproject-dev/kubernetes-riscv -- Kubernetes RISC-V fork](https://github.com/riseproject-dev/kubernetes-riscv)
- [RISE Project blog](https://riseproject.dev/blog/)
- [bbolt PR #159 -- Add support for riscv64 (merged 2019-05-27)](https://github.com/etcd-io/bbolt/pull/159)
- [prometheus/procfs PR #325 -- riscv64 fix (merged 2021)](https://github.com/prometheus/procfs/pull/325)
- [go.opentelemetry.io/otel issue #8126 -- add cross-build workflow](https://github.com/open-telemetry/opentelemetry-go/issues/8126)
- [golang/go #64074 -- riscv64 stackcheck overhead](https://github.com/golang/go/issues/64074)
- [golang/go #78918 -- riscv64 crc32 assembly](https://github.com/golang/go/issues/78918)
- [golang/go #78515 -- riscv64 jump table optimization](https://github.com/golang/go/issues/78515)