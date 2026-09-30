---
title: etcd
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: bbolt
    relation: runtime-dependency
    criticality: critical
  - name: etcd-io/raft
    relation: runtime-dependency
    criticality: critical
  - name: gRPC-Go
    relation: runtime-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/crypto
    relation: runtime-dependency
    criticality: optional
  - name: prometheus/client_golang
    relation: runtime-dependency
    criticality: optional
  - name: OpenTelemetry
    relation: runtime-dependency
    criticality: optional
  - name: zap
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="etcd" %}

# etcd

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for etcd<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

etcd is a distributed, strongly-consistent key-value store used as the backing store for Kubernetes cluster state. It implements the Raft consensus algorithm and exposes a gRPC API (v3) with a watch facility for change notification. It is written entirely in Go with no C or assembly code of its own.

**Governance.** etcd is a [CNCF Graduated project](https://www.cncf.io/projects/etcd/) (graduated November 24, 2020; incubated December 2018), governed under [SIG-etcd](https://github.com/kubernetes/community/blob/master/sig-etcd/README.md) within the Kubernetes community. Decisions use maintainer lazy-consensus with a supermajority fallback after a three-business-week inactive voting period (minimum two maintainers). Roles are defined in `OWNERS` and `OWNERS_ALIASES` in the repository.

**Corporate sponsors,** from `OWNERS_ALIASES`:

| Role | Name | GitHub handle | Company |
|---|---|---|---|
| Chair | Ivan Valdes | @ivanvc | Inmar Intelligence |
| Chair | James Blair | @jmhbnz | Not publicly listed |
| Chair | Siyuan Zhang | @siyuanfoundation | Google |
| Tech Lead | Benjamin Wang | @ahrtr | Broadcom (formerly VMware) |
| Tech Lead | Wei Fu | @fuweid | Microsoft |
| Tech Lead | Marek Siarkowicz | @serathius | Google |
| Approver | Sahdev Zala | @spzala | IBM |

Emeritus maintainers include hexfusion (Red Hat) and several ex-CoreOS founders (philips, xiang90, heyitsanthony) plus ex-Google maintainers (jingyih, jpbetz, wenjiaswe). Active leadership spans Google, Broadcom/VMware, Microsoft, IBM and Inmar Intelligence, with no single-vendor control.

**Culture on new ports.** Cautious, and on riscv64 specifically the maintainer response has been negative. etcd's [supported-platform tier documentation](https://etcd.io/docs/v3.6/op-guide/supported-platform/) requires a contributor to commit to long-term maintenance and to stand up CI meeting the target tier's bar before a new architecture is added. Because etcd's CI runs on Kubernetes Prow rather than GitHub Actions, that CI requirement means dedicated physical riscv64 hardware wired into the Prow pool, not merely a green run on a third-party GitHub Actions runner. When asked directly about riscv64 plans during the March 2026 pull request discussion, maintainer @serathius stated **"No plans."** [NEEDS VERIFICATION: a prior version of this assessment dated that quote to May 2026; the primary source, the PR #21510 discussion thread itself, places it within the thread's active window of March 20-29, 2026, and that dating is used here.]

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| August 29, 2019 | [PR #10834](https://github.com/etcd-io/etcd/pull/10834), "vendor: update x/sys and x/net modules to support Risc-V," merged. Vendor bump of `golang.org/x/sys` and `golang.org/x/net` to versions carrying upstream RISC-V support (tracked against golang/go#27532). Author: @carlosedp (Carlos de Paula). Merged by @gyuho. Merge commit `876df8d123978b4b762275f75dbc47c227c105de`. This is the only riscv-related change ever merged into etcd. First release containing it: **v3.4.1** (2019-09-17); v3.4.0 (2019-08-30) predates it. | GitHub PR and commit pages, verified directly; CHANGELOG-3.4.md cross-check |
| November 25, 2021 - April 18, 2022 | [PR #13504](https://github.com/etcd-io/etcd/pull/13504), "Is it necessary to avoid setting ETCD_UNSUPPORTED_ARCH=riscv64," by @jiangxiaobin96. Earliest riscv64 attempt found. Maintainer @ptabor required a doc update plus an actual CI build test to justify even Tier-3 status; the PR went stale and closed without the requested work being added. | GitHub PR #13504, verified |
| September 25, 2022 - March 18, 2023 | [PR #14517](https://github.com/etcd-io/etcd/pull/14517), "Adding support for RISC-V," by @advancedwebdeveloper, with a working Docker build/run demo on `linux/riscv64`. @ahrtr questioned production readiness (Go riscv64 support still "experimental" as of Go 1.14); @serathius set a two-phase bar (CI first, "officially supported" label only after); @ptabor recommended fail-by-default for Tier-3 architectures. The CI half of the plan was spun off as issue #14522. Went stale with no further action. | GitHub PR #14517, verified |
| September 26, 2022 - April 2, 2023 | [Issue #14522](https://github.com/etcd-io/etcd/issues/14522), "Extending CI pipeline, on behalf of 64bit RISC-V environment," filed on behalf of PR #14517 to scope QEMU emulation, a dedicated riscv64 board for a GitHub Actions runner, and cross-compilation. Closed stale, unimplemented. | GitHub issue #14522, verified |
| March 16 - April 21, 2023 | [PR #15490](https://github.com/etcd-io/etcd/pull/15490), "feat: add riscv64 support" (draft), by @ernado, proposing riscv64 be marked Tier-3 per the supported-platform doc. Never taken out of draft and never merged. [NEEDS VERIFICATION: a prior assessment attributed the closure specifically to `gcr.io/distroless/static-debian11` lacking a riscv64 variant at the time, and stated the author subsequently created the [go-riscv/etcd](https://github.com/go-riscv/etcd) fork; this detail appears in only one of the two sources reviewed here and could not be independently corroborated in the current research pass.] | GitHub PR #15490, verified as closed/unmerged |
| March 20, 2026 | [Issue #21509](https://github.com/etcd-io/etcd/issues/21509), "Add riscv64 to supported architectures," opened by @gounthar, requesting riscv64 be promoted to officially supported, citing successful native builds on BananaPi F3 / SpacemiT K1 hardware and free RISE Project CI runners. Functioned as the tracking issue for the companion PR #21510. | GitHub issue #21509, verified |
| March 20-29, 2026 | [PR #21510](https://github.com/etcd-io/etcd/pull/21510), "server: add riscv64 to supported architectures." One-line change to `checkSupportArch()`, backed by a green build on RISE riscv64 runners. @serathius pointed out riscv64 was absent from the supported-platform doc; @ivanvc explained the real blocker is that etcd's CI runs on Prow (not GitHub Actions), requiring dedicated riscv64 Prow hardware nodes; @serathius stated **"No plans"** when asked about future intent; @upodroid (Kubernetes-side) noted parallel Kubernetes riscv64 work is waiting on the same hardware gap. The author closed the PR, stating that standing up Prow infrastructure was beyond what they could contribute. **Closed, not merged.** | GitHub PR #21510, verified |
| June 4, 2026 | Issue #21509 closed. [NEEDS VERIFICATION: attributed by a prior assessment to maintainer @jberkus, quoting confirmation with SIG-k8s-infra that "We do not currently have RISCV machines in the Prow testing pool"; this specific attribution and quote were not independently re-confirmed in the current research pass, though the substance, that the issue closed on this date without the feature landing because of the Prow hardware gap, is corroborated.] Around this time, RISE TSC offered Scaleway EM-RV1 riscv64 machines to SIG-k8s-infra in the #21509 thread to integrate into etcd's Prow CI pool (see Section 12). | GitHub issue #21509; corroborated by live research (~June 2026 RISE offer) |

**Is work fully upstream?** No. The only merged upstream contribution is the 2019 vendor dependency bump (PR #10834). Direct source confirmation at HEAD (commit `7583cc6`, `server/etcdmain/etcd.go` lines ~232-240) shows the `checkSupportArch()` switch statement still lists only `"amd64", "arm64", "ppc64le", "s390x"`; riscv64 remains absent. Every substantive riscv64 enablement attempt (PR #13504, #14517, #15490, #21510) has been closed without merging.

**RISE Project involvement.** No RISE blog post substantively covers etcd; a site search returns only two incidental biographical mentions (in working-group-lead election result posts) of a maintainer's past CoreOS work on etcd, rkt, and Kubernetes, with no technical or RISC-V content. The RISE Python wheel builder does not list an "etcd" package. No GitHub repository named `etcd` or `kubernetes-riscv` exists under the `riseproject-dev` GitHub organization; a widely-circulated claim of a `riseproject-dev/kubernetes-riscv` issue #2 proposing joint Kubernetes/etcd Tier-2 collaboration was checked directly against the GitHub org listing and repository search and found to be **fabricated by a search-summarization step** - no such repository exists. RISE's only concrete, corroborated involvement is the ~June 2026 offer (by a RISE TSC representative, in the #21509 thread) of Scaleway EM-RV1 riscv64 machines to SIG-k8s-infra, intended to unblock Prow integration; no confirmation that this hardware has actually been integrated into Prow was found.

---

## 3. Upstream Support Tier

etcd's [supported-platform documentation](https://etcd.io/docs/v3.6/op-guide/supported-platform/) defines:

- **Tier 1** (full support, robustness-tested, release-blocking): `linux/amd64`, `linux/arm64`
- **Tier 3** (build-only, unstable, not release-blocking): `darwin/amd64`, `darwin/arm64`, `windows/amd64`, `linux/ppc64le`, `linux/s390x`
- No Tier 2 platforms are currently listed. (The ARM64 Tier-2-to-Tier-1 promotion via PR #12928 is cited in the doc as precedent for how a new architecture can advance.)
- Everything else, including riscv64, is **unsupported**, enforced at runtime by `checkSupportArch()` in `server/etcdmain/etcd.go`, which exits unless the operator sets `ETCD_UNSUPPORTED_ARCH=riscv64`.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official support tier | Tier 1 | Tier 1 | Unsupported |
| Release binary published upstream | Yes | Yes | No |
| CI coverage (Prow) | Full | Full | None |
| Runtime startup gate | Passes | Passes | Blocked; requires `ETCD_UNSUPPORTED_ARCH=riscv64` |
| Makefile `PLATFORMS` target | Yes | Yes | No |
| Docker multi-arch image | Yes | Yes | No (official); community fork only |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

etcd itself is a pure Go application. A full-repository grep for "riscv" at HEAD (commit `7583cc6`) returns **zero matches** outside of coincidental base64 substrings inside TLS certificate/key test fixtures (not source code). Confirmed absent: any `arch/riscv/` directory, `.s`/`.S`/`.asm` assembly files, JIT backend, riscv64 SIMD dispatch, and any `_amd64.go`/`_arm64.go`/`_riscv64.go` per-architecture build-tag files (searches for these suffix patterns across the repo each returned zero results, for every architecture, not just riscv64). This is expected: etcd has no architecture-specific code paths of its own for any platform, supported or not; its "architecture support" is entirely the one-line `checkSupportArch()` allow-list check.

Because etcd carries no arch-specific code, riscv64 correctness and performance are entirely inherited from the Go toolchain and from etcd's dependencies:

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Core storage engine (bbolt) | Pure Go | Pure Go | Pure Go | No cgo, no assembly in bbolt itself |
| Raft consensus (etcd-io/raft) | Pure Go | Pure Go | Pure Go | No architecture-gated code |
| gRPC transport (grpc-go) | Pure Go | Pure Go | Pure Go | No cgo, no assembly |
| TLS/crypto (golang.org/x/crypto, stdlib crypto/*) | Assembly-optimized | Assembly-optimized | Pure-Go fallback | [NEEDS VERIFICATION: magnitude of the resulting performance delta for etcd-specific TLS/mTLS workloads has not been measured] |
| Hashing (cespare/xxhash/v2, used by the Prometheus client) | Assembly-optimized | Assembly-optimized | Pure-Go fallback (`xxhash_other.go`, build tag `!amd64 && !arm64`) | [NEEDS VERIFICATION: single-sourced claim; low expected impact since xxhash is used for metrics, not the Raft/storage hot path] |
| Startup architecture gate | Allowed | Allowed | Blocked | One-line fix (`checkSupportArch()`) is all that is needed in etcd's own source |

No JIT compiler, GC-barrier assembly, or floating-point-sensitive numerics exist in etcd. NaN/floating-point semantics are not applicable; etcd performs no floating-point computation in its core logic.

---

## 5. Build System, Cross-Compilation, and Toolchain

etcd is pure Go with a Makefile driving `scripts/build.sh` / `scripts/build_lib.sh`. There is no CMake, no Autotools, and no C/C++ toolchain requirement for a normal build: `CGO_ENABLED=0` is set by default in `scripts/build_lib.sh`, producing a fully static binary.

**Go version requirement.** Direct inspection of the repository at HEAD shows `.go-version` = `1.27.1` and `go.mod` specifying `go 1.27`. [NEEDS VERIFICATION: an earlier assessment of this project recorded `go 1.26` / `toolchain go1.26.4`; the direct repository read performed in the current research pass, dated to today, is treated as authoritative, and the version discrepancy is most plausibly explained by a toolchain bump between assessments rather than a factual error.] Go has treated `linux/riscv64` as a first-class compilation target since Go 1.14; no riscv64-specific minimum Go version applies beyond etcd's general requirement.

**Build command:**
```
make build
# internally: GO_BUILD_FLAGS="-v -mod=readonly" ./scripts/build.sh
# per binary (etcd, etcdutl, etcdctl):
CGO_ENABLED=0 GOOS=<os> GOARCH=<arch> go build -trimpath -installsuffix=cgo -ldflags=... -o=bin/<name> .
```

**Cross-compilation for riscv64 (not an official Makefile target, but functional):**
```
GOOS=linux GOARCH=riscv64 ./scripts/build.sh
```
No additional flags are required.

**Official release platform list** (`scripts/build-binary.sh`, Linux targets): `amd64`, `arm64`, `ppc64le`, `s390x`. riscv64 is absent.

**Makefile `PLATFORMS` variable:** `linux-amd64 linux-386 linux-arm linux-arm64 linux-ppc64le linux-s390x darwin-amd64 darwin-arm64 windows-amd64 windows-arm64`. `linux-riscv64` is absent.

**Docker multi-arch** (`scripts/build-docker.sh`), default `PLATFORMS`: `linux/amd64,linux/arm64,linux/ppc64le,linux/s390x`. Uses `docker buildx` with `tonistiigi/binfmt --install all` for QEMU-based emulation of non-native targets during multi-arch image assembly (not for building the Go binaries themselves, which are cross-compiled natively). `linux/riscv64` is absent from this list; since the Docker build copies pre-built binary tarballs per architecture and no riscv64 tarball is published, no riscv64 container image is produced by the official pipeline.

**Known build failures.** None documented. etcd builds successfully on riscv64 via `GOOS=linux GOARCH=riscv64 ./scripts/build.sh`. Reported native build times on BananaPi F3 / SpacemiT K1 (rv64gc): server binary approximately 2 minutes 20 seconds, etcdctl approximately 34 seconds, per issue #21509 (self-reported by contributor @gounthar). [NEEDS VERIFICATION: independent reproduction on server-class riscv64 hardware; this figure comes from a single self-reported source, not an independently reproduced benchmark.]

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because etcd has no arch-specific code, functional coverage is effectively binary: the Go toolchain can target riscv64, so all etcd functionality is available once the startup gate is bypassed.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| etcd server starts | Yes | Yes | Requires `ETCD_UNSUPPORTED_ARCH=riscv64` |
| All v3 API operations (watch, lease, auth, maintenance) | Yes | Yes | Yes, once started |
| Official upstream release binary | Yes | Yes | No |
| Official Docker multi-arch image | Yes | Yes | No (community fork only, see Section 8) |

**Performance gaps.** No etcd-specific riscv64-vs-amd64/arm64 runtime benchmark (throughput, latency, ops/sec) exists in any source reviewed, including an exhaustive check of all RISE Project blog posts (37 posts, 2024-2026) and general web search; RISE's blog output covers Go, Python, PyTorch, LLVM, OpenJDK, V8, and OpenSBI on RISC-V, but not etcd or any distributed key-value store. The only qualitative gaps identifiable are inherited from dependencies taking pure-Go fallback paths instead of assembly (TLS/crypto, xxhash; see Section 4), not quantified for etcd workloads specifically.

**Security hardening gaps.** Data not available: no analysis of PIE/stack-canary/CFI status for riscv64 builds versus amd64/arm64 was found in any source.

**NaN / floating-point semantics.** Not applicable; etcd performs no floating-point computation.

---

## 7. CI/CD Infrastructure

etcd's CI-of-record runs on Kubernetes Prow, which lives outside the `etcd-io/etcd` repository (in `kubernetes/test-infra`) and was not directly inspectable in this research. Within `etcd-io/etcd` itself, a direct read of all workflow files at HEAD (commit `7583cc6`) confirms **11 files** in `.github/workflows/` (plus an `OWNERS` file): `antithesis-test.yml`, `antithesis-verify.yml`, `antithesis.debugger.yml`, `bump-devcontainer-version.yml`, `cherrypick-bot-ok-to-test.yaml`, `codeql-analysis.yml`, `gh-workflow-approve.yaml`, `measure-testgrid-flakiness.yaml`, `scorecards.yml`, `stale.yaml`, `verify-released-assets.yaml`. [Correction: an earlier assessment of this project cited 12 workflow files; a direct, repeated read of the directory in the current research pass, including an `ls` listing cross-checked independently against a second clone, confirms 11.] Every one of these files runs exclusively on `runs-on: ubuntu-latest` (GitHub-hosted x86_64). None reference riscv64, arm64, QEMU cross-arch emulation, or any self-hosted riscv64 runner. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists at the repository root. A case-insensitive grep for "riscv" across the entire workflow directory and the entire repository tree returns zero matches.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI platform | Prow / `ubuntu-latest` | Prow / `ubuntu-latest` | None |
| Unit / integration / E2E tests | Yes | Yes | No |
| Release gating | Yes | Yes | No |
| RISE runners in use | No | No | Not currently (Prow-incompatible; see below) |

**Why RISE runners do not directly help.** RISE provides native riscv64 runners via a GitHub Actions `ubuntu-24.04-riscv` label, free to open-source projects, and this is what powered the green CI run behind PR #21510. But etcd's official CI is Prow-based and does not consume GitHub Actions runners for release-gating tests. Maintainer @ivanvc confirmed in the PR #21510 discussion that bridging this gap requires dedicated riscv64 hardware integrated into the Prow pool, not a GitHub Actions credential. RISE TSC's ~June 2026 offer of Scaleway EM-RV1 machines to SIG-k8s-infra is aimed precisely at this integration, but no confirmation that the machines have actually been wired into Prow was found in this research.

---

## 8. Distribution and Release Status

**Official upstream GitHub releases.** The most recent tags visible on the releases page are v3.7.2, v3.6.15, v3.5.34 (published 2026-09-22), v3.7.1, and v3.6.14. [NEEDS VERIFICATION: full release-asset filenames could not be enumerated in this research pass, GitHub API access to `etcd-io/etcd` was blocked in the research session and the Releases page's asset list is client-side JS-rendered. The visible page text references only `linux-amd64`/`darwin-amd64` install examples and contains no riscv64 string, and this is consistent with, but does not independently prove, the absence of a riscv64 upstream release asset. The stronger and directly demonstrated fact is that `checkSupportArch()` at HEAD still excludes riscv64, which would in any case cause an unmodified upstream riscv64 binary to refuse to start without the `ETCD_UNSUPPORTED_ARCH` override even if one were published.]

**Official OCI container images.** `gcr.io/etcd-development/etcd` / `registry.k8s.io/etcd` publish for `linux/amd64`, `linux/arm64`, `linux/ppc64le`, `linux/s390x`. [NEEDS VERIFICATION: absence of a riscv64 manifest was not independently re-confirmed in the current research pass; it is consistent with the confirmed absence of riscv64 from `scripts/build-docker.sh`'s platform list.]

**Community fork.** [go-riscv/etcd](https://github.com/go-riscv/etcd), maintained independently of etcd-io, produces riscv64 build artifacts and a container image. [NEEDS VERIFICATION: current maintenance status and last-update date could not be confirmed in this research pass.]

**Downstream Linux distributions - this is the load-bearing evidence for this project's grade.**

- **Ubuntu 26.04 "resolute"**, confirmed live via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=etcd&suite=resolute&searchon=names&section=all) (both an all-architecture search and an architecture-filtered `arch=riscv64` search): `etcd-client` and `etcd-server`, version **3.5.16-10**, are built and published for riscv64 in the `universe`/`[ports]` component. `golang-etcd-server-dev` (source package, arch "all") and `python3-etcd` (arch "all") are also present. This is a genuine, currently-shipping riscv64 binary package for both the etcd server and client.
- **Debian sid**, corroborating: buildd shows etcd **3.5.30-2** with riscv64 status **"Installed"** on builder `rv-osuosl-03`, per [buildd.debian.org](https://buildd.debian.org/status/package.php?p=etcd&suite=sid).
- **Arch Linux RISC-V** (archriscv.felixc.at): the port-tracker's per-package lookup could not be queried (client-side only, and the underlying `felixonmars/archriscv-packages` GitHub repository was inaccessible in this research session); status is **inconclusive**, not confirmed either way.
- **PyPI `etcd` package** (version 2.0.8): this is the unrelated `python-etcd` client library, a pure-Python wheel/sdist with no architecture-specific build; it is not a distribution channel for the etcd server binary and is not evidence about etcd-io/etcd's riscv64 status one way or the other.

**What is unconfirmed about the downstream packages.** Neither Ubuntu's nor Debian's build pipeline was inspected for whether `checkSupportArch()` or the `ETCD_UNSUPPORTED_ARCH` runtime gate has been patched out for the riscv64 build. If unpatched, the distro-built riscv64 binary would still refuse to start on unmodified upstream code without `ETCD_UNSUPPORTED_ARCH=riscv64` set at runtime. This patch-status question is unresolved and is the specific reason the project's readiness grade is capped at orange rather than elevated further (see Section 13).

**What a user must do to run etcd on riscv64 today:**
1. Install the distro package (Ubuntu 26.04 `etcd-server`/`etcd-client` 3.5.16-10, or Debian sid's 3.5.30-2), noting the patch-status caveat above; or
2. Build from source: `GOOS=linux GOARCH=riscv64 ./scripts/build.sh` (Go 1.27.1 toolchain) and start with `ETCD_UNSUPPORTED_ARCH=riscv64 ./etcd`; or
3. Use the community fork [go-riscv/etcd](https://github.com/go-riscv/etcd)'s container image [NEEDS VERIFICATION: current status].

---

## 9. Dependencies

| Dependency | Role | Relation | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|---|
| Go | Go toolchain/compiler/runtime; determines etcd's actual arch-specific code paths (GC, scheduler, assembly), since etcd itself has none | Build-dependency | Critical | riscv64 supported since Go 1.14 (first-class target); `.go-version` at etcd HEAD is 1.27.1 | Race-detector support for riscv64 landed via [golang/go#64345](https://github.com/golang/go/issues/64345) (closed), material because etcd's CI uses `-race` extensively | Ships in Ubuntu 26.04 riscv64 (`golang-go` package confirmed present) | Open, non-blocking items: [golang/go#50615](https://github.com/golang/go/issues/50615), open, bytes/strings tests run roughly 100x slower on riscv64 (a CI-runtime/performance concern, not a correctness blocker); [NEEDS VERIFICATION: a prior assessment separately cited golang/go#64074 (stackcheck overhead), #78918 (crc32 assembly), and #78515 (jump-table optimization) as open riscv64 optimization items, and the current pass instead surfaced #76179/#76180 (open, Zawrs/Zihintntl ISA-extension assembly support); both sets describe ordinary upstream Go riscv64 optimization backlog rather than a blocker, but neither set was cross-confirmed against the other in this pass] |
| bbolt (go.etcd.io/bbolt) | Embedded mmap-based B+tree storage engine, etcd's persistence layer | Runtime-dependency | Critical | Pure Go, no cgo; builds on riscv64 | No dedicated riscv64 CI found in this research pass; not separately released from etcd | Rides on etcd's own release/distro packaging, not separately published for riscv64 | [NEEDS VERIFICATION: a prior assessment cited [bbolt PR #159](https://github.com/etcd-io/bbolt/pull/159), "Add support for riscv64," merged 2019-05-27, as the point bbolt gained riscv64 build coverage; not independently re-confirmed here.] bbolt has a documented history of per-architecture atomic-alignment bugs on other platforms (e.g. etcd-io/bbolt#577, "panic: 64bit unaligned in arm32," closed 2023; #848, ARM64 robustness CI restoration, closed 2025), making riscv64 (a newer 64-bit target) a plausible but unconfirmed risk area. No dedicated `project-reports` entry exists for bbolt in this project set. |
| etcd-io/raft (go.etcd.io/raft) | Core Raft consensus algorithm implementation | Runtime-dependency | Critical | Pure Go, no cgo/assembly; builds on riscv64 | No riscv64-specific issues found | Vendored with etcd; no separate release | Architecture risk assessed as low given no native code. No dedicated `project-reports` entry exists for etcd-io/raft in this project set. |
| gRPC-Go (google.golang.org/grpc) | RPC/transport layer; carries gzip compression and TLS for client/server traffic | Runtime-dependency | Critical | Pure Go, no cgo; builds on riscv64 | No riscv64-specific issues found; CI matrix for grpc-go was not confirmed to include riscv64 | Vendored; no separate release | Note: a "Protocol Buffers" project report exists elsewhere in this project set but documents the C++ gRPC/protoc core, not the pure-Go `grpc-go` module etcd actually imports; that report is only partially applicable here. |
| Protocol Buffers (protoc / C++ core, used at etcd's build time for code generation) | Wire-format code generation | Runtime-dependency | Critical | Covered by this project set's separate `protocol-buffers.md` report | See that report | See that report | Distinct from `google.golang.org/protobuf`, the pure-Go runtime etcd links at runtime, which is an indirect dependency (below). |
| golang.org/x/sys | Low-level syscall wrappers, consumed by bbolt, gRPC, zap, prometheus/procfs, and others across etcd's dependency tree | Runtime-dependency | Critical | Actively maintained riscv64 syscall coverage; part of the same module family bumped in PR #10834 for RISC-V support in 2019 | Frequent riscv64-relevant dependency bumps visible across etcd's dependency tree | Vendored | No open riscv64 blockers identified. |
| golang.org/x/crypto | Auxiliary TLS/crypto primitives supplementing Go stdlib `crypto/*` | Runtime-dependency | Optional | Pure Go; riscv64 takes the pure-Go fallback path where amd64/arm64 assembly does not exist | Not directly tested in this research; inherits Go toolchain's riscv64 crypto-path maturity | Vendored | Performance delta versus amd64/arm64 not quantified for etcd workloads. |
| prometheus/client_golang | Metrics exposure for etcd | Runtime-dependency | Optional | Builds on riscv64 | [NEEDS VERIFICATION: single-sourced claim that a historical procfs riscv64 issue, #833, was resolved] | Prometheus itself ships `prometheus-*.linux-riscv64.tar.gz` release binaries | No open blockers identified. |
| OpenTelemetry (go.opentelemetry.io/otel) | Distributed tracing / OTLP export | Runtime-dependency | Optional | Builds on riscv64 | No riscv64-specific test failures found; [NEEDS VERIFICATION: single-sourced claim of open otel-go issue #8126, "add cross-build workflow," targeting riscv64 among other architectures] | Module-only | Minor CI-coverage gap in the upstream otel-go project, not a functional blocker for etcd. |
| zap (go.uber.org/zap) | Structured logging | Runtime-dependency | Optional | Pure Go; builds on riscv64 | No riscv64 issues found | Module-only | No blockers identified. |
| golang.org/x/net (indirect, via PR #10834) | Networking primitives | Runtime-dependency (indirect) | [NEEDS VERIFICATION: criticality not separately assessed] | Vendor-bumped for RISC-V support alongside x/sys in 2019 (PR #10834) | Not separately tested | Vendored | The other half of the only riscv-related change ever merged into etcd. |
| google.golang.org/protobuf (indirect) | Pure-Go protobuf runtime, distinct from the C++ `Protocol Buffers`/protoc project listed above | Runtime-dependency (indirect) | [NEEDS VERIFICATION: criticality not separately assessed] | Pure Go; builds on riscv64 | No riscv64-specific issues found | Module-only | Do not conflate with the `protoc` build-time dependency. |
| github.com/cespare/xxhash/v2 (indirect, via prometheus/client_golang) | Fast 64-bit hashing used by the Prometheus client path | Runtime-dependency (indirect) | [NEEDS VERIFICATION: criticality not separately assessed] | Assembly for amd64/arm64 only; riscv64 takes the pure-Go `xxhash_other.go` fallback (build tag `!amd64 && !arm64`) | [NEEDS VERIFICATION: single-sourced] | Module-only | Low expected impact; not in the Raft or storage hot path. |
| github.com/prometheus/procfs (indirect, via prometheus/client_golang) | `/proc` parsing for metrics | Runtime-dependency (indirect) | [NEEDS VERIFICATION: criticality not separately assessed] | Builds on riscv64 | [NEEDS VERIFICATION: single-sourced claim that prometheus/procfs PR #325, a riscv64 fix merged in 2021, is long superseded by the version etcd currently pulls] | Module-only | No current blocker identified. |

**Summary.** The only hard riscv64 blocker in etcd's entire dependency graph is within etcd itself: the `checkSupportArch()` allow-list and the corresponding absence of riscv64 from the release and Docker build pipelines. Every direct and indirect library dependency reviewed either builds cleanly on riscv64 as pure Go, or has a documented pure-Go fallback path with no known correctness defect, only an unquantified performance delta on crypto- and hash-heavy code. No dependency has an open riscv64 build failure or correctness bug on record. Two tracked dependencies in this project set, bbolt and etcd-io/raft, currently have no dedicated `project-reports` entry of their own; given bbolt's history of per-architecture atomic-alignment bugs on other 64-bit targets, a dedicated riscv64 check for bbolt is a reasonable follow-up.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#21509](https://github.com/etcd-io/etcd/issues/21509) | Add riscv64 to supported architectures | Closed, 2026-06-04, feature did not land | High | Closed because Prow has no riscv64 nodes. RISE TSC offered Scaleway EM-RV1 machines to SIG-k8s-infra around this time; no confirmation of Prow integration found. |
| [#21510](https://github.com/etcd-io/etcd/pull/21510) | server: add riscv64 to supported architectures | Closed, 2026-03-29, not merged | High | One-line fix to `checkSupportArch()`. Blocked on Prow CI infrastructure, not on code. Maintainer: "No plans." |
| [#14517](https://github.com/etcd-io/etcd/pull/14517) | Adding support for RISC-V | Closed, 2023-03-18, not merged | Medium | Went stale after maintainers requested a CI-first, two-phase plan that was never executed. |
| [#14522](https://github.com/etcd-io/etcd/issues/14522) | Extending CI pipeline, on behalf of 64bit RISC-V environment | Closed, 2023-04-02, stale | Medium | CI-prerequisite scoping issue for #14517; never implemented. |
| [#15490](https://github.com/etcd-io/etcd/pull/15490) | feat: add riscv64 support | Closed, 2023-04-21, not merged | Medium | Draft, never taken out of draft. |
| [#13504](https://github.com/etcd-io/etcd/pull/13504) | Is it necessary to avoid setting ETCD_UNSUPPORTED_ARCH=riscv64 | Closed, 2022-04-18, not merged | Medium | Earliest riscv64 attempt found (opened 2021-11-25). |

**Correctness bugs.** No open correctness or performance bug specific to riscv64 was found in `etcd-io/etcd`. A targeted search for a riscv64 NaN/floating-point issue returned no matches; no evidence supports that premise, so none is reported. etcd is reported to run correctly on riscv64 hardware once `ETCD_UNSUPPORTED_ARCH=riscv64` is set, based on self-reported testing in issue #21509 (BananaPi F3, SpacemiT K1). [NEEDS VERIFICATION: independent reproduction on server-class riscv64 hardware.] For context, arm64 (a Tier-1, fully supported architecture) has had its own robustness-test flakiness on record (#17593, closed, with a maintainer noting a possible underlying arm64 correctness issue around snapshot transfer between members); this does not apply to riscv64 but indicates that even supported architectures carry open per-arch risk.

---

## 12. Objections and Upstream Blockers

**Stated objections and blockers, in priority order:**

1. **Prow CI has no riscv64 hardware nodes (hard, external blocker).** etcd's CI-of-record is Kubernetes Prow, which requires dedicated physical machines, not cloud-hosted or third-party GitHub Actions runners. RISE's riscv64 runners use GitHub Actions and cannot substitute for Prow hardware. Maintainer @ivanvc stated this explicitly in the PR #21510 discussion (March 2026).
2. **Maintainer stance: "No plans" (soft, organizational blocker).** @serathius's response reflects that the maintainer team is not willing to drive Prow hardware provisioning itself; it does not reflect any code-level objection to riscv64.
3. **Personnel requirement.** Beyond hardware, SIG-k8s-infra needs a party to provision/maintain riscv64 Prow nodes and a party to triage riscv64-specific test failures on etcd's CI job. RISE's Scaleway EM-RV1 offer addresses the hardware half; the triage-personnel half remains unaddressed in the research reviewed.

**Path to resolution, as documented in the source threads:**
- RISE provides Scaleway EM-RV1 machines to SIG-k8s-infra.
- SIG-k8s-infra integrates the machines into the Prow test pool (status as of this research: not confirmed).
- A party commits to ongoing riscv64 test-failure triage for etcd's CI job.
- PR #21510 (the one-line `checkSupportArch()` change) is reopened and merged.
- `linux/riscv64` is added to `scripts/build-binary.sh` and `scripts/build-docker.sh`'s platform lists.

The code change required in etcd itself is trivial; the entire blocker is CI infrastructure and organizational ownership of that infrastructure, not source-code readiness.

---

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- etcd is not an optimization-purpose project (it is infrastructure software with no architecture-specific hot-path code), so no optimization-level rating applies.

**Justification.** etcd has no upstream riscv64 CI at all: a direct read of etcd-io/etcd's 11 `.github/workflows/*.yml` files (all `ubuntu-latest`/x86_64) plus `server/etcdmain/etcd.go`'s `checkSupportArch()` at HEAD (commit `7583cc6`) shows riscv64 is still absent from the supported-arch list, and the one attempt to add it, [PR #21510](https://github.com/etcd-io/etcd/pull/21510), was closed unmerged after a maintainer stated "No plans" to add riscv64 nodes to etcd's Prow-based CI. However, Ubuntu 26.04 "resolute" ships `etcd-client` and `etcd-server` 3.5.16-10 for riscv64 in universe/ports, confirmed live via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=etcd&suite=resolute&searchon=names&section=all) (also corroborated by Debian sid's buildd riscv64 "Installed" status for etcd 3.5.30-2). This triggers the distribution floor, but since research did not confirm whether the distro build is unpatched, and etcd's own runtime `checkSupportArch()` gate still requires `ETCD_UNSUPPORTED_ARCH=riscv64` to even start on unmodified upstream code, patch status is unconfirmed. This caps the floor at orange (downstream-only) rather than yellow (clean-distro-build).

**Pending work that could change the grade.** Issue #21509/PR #21510 (closed 2026-03-29 and 2026-06-04 respectively) could be revived: RISE TSC offered Scaleway EM-RV1 riscv64 machines to SIG-k8s-infra in the #21509 thread (~June 2026) to integrate into etcd's Prow CI pool, which would unblock the one-line `checkSupportArch()` fix, but no confirmation that Prow integration has actually happened was found. No open PRs currently add riscv64 support.

---

## 14. Investment Analysis

RISE has not funded or structured any work on etcd riscv64 support directly; its only confirmed involvement is the ~June 2026 hardware offer to SIG-k8s-infra. The community fork [go-riscv/etcd](https://github.com/go-riscv/etcd) is independent volunteer work, not RISE-sponsored.

### 14.1 Functional Enablement

The codebase requires one line of change: adding `"riscv64"` to the `checkSupportArch()` allow-list in `server/etcdmain/etcd.go` (the exact change PR #21510 already proposed and validated with a green CI run on RISE runners). No etcd logic needs to be written or modified for riscv64 functionality; this work is entirely gated on CI infrastructure, not code.

### 14.2 Performance Optimization

No etcd-specific assembly or SIMD optimization exists for any platform, so there is no riscv64 performance-optimization work to do within etcd itself. Performance gaps that do exist (pure-Go crypto/hashing fallback paths, Go's own riscv64 optimization backlog) are owned by upstream dependency projects, not by etcd. No etcd-on-riscv64 runtime benchmark exists anywhere in the sources reviewed; any performance claim would require original benchmarking work.

### 14.3 CI/CD Infrastructure

This is the dominant work item and the actual blocker to the grade improving:
- Confirm whether RISE's offered Scaleway EM-RV1 machines have been integrated into the Prow pool, and if not, drive that integration with SIG-k8s-infra.
- Assign an engineer for ongoing riscv64 test-failure triage on etcd's CI job, a prerequisite SIG-k8s-infra has stated is needed alongside hardware.
- Reopen and merge PR #21510's one-line `checkSupportArch()` change once Prow riscv64 coverage exists.
- Add `linux/riscv64` to `scripts/build-binary.sh` and `scripts/build-docker.sh`'s platform lists so upstream release binaries and container images are published.

### 14.4 Ecosystem Enablement

Not applicable as a discrete work item: etcd has no dependent package ecosystem of its own requiring separate riscv64 enablement (see Section 10 note below). The nearest adjacent ecosystem concern is Kubernetes' own riscv64 effort, which depends on etcd's support but is tracked separately.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Reopen and merge the one-line `checkSupportArch()` change (PR #21510 equivalent) | 0.1 | Any contributor | Critical |
| CI/CD | Confirm/drive RISE-to-Prow hardware integration with SIG-k8s-infra | 2-4 | RISE Project + SIG-k8s-infra | Critical |
| CI/CD | Assign riscv64 test-failure triage engineer for etcd's Prow CI job | Ongoing | Qualcomm/RISE contributor | Critical |
| CI/CD | Add `linux/riscv64` to `scripts/build-binary.sh` and `scripts/build-docker.sh` | 0.5 | Any contributor | High |
| Validation | Determine and, if needed, patch the riscv64 build/startup-gate status of the Ubuntu 26.04 and Debian sid distro packages | 0.5-1 | Qualcomm/RISE contributor | High |
| Validation | Run etcd benchmarks (ops/sec, latency) on server-class riscv64 hardware versus amd64/arm64 baseline | 2-3 | Qualcomm infra team | High |
| Validation | Run the full E2E test suite on riscv64 hardware once Prow coverage exists | 1-2 | Any contributor with Prow access | High |
| Performance | Profile crypto-heavy etcd paths (TLS, mTLS) to quantify the x/crypto pure-Go fallback penalty | 1-2 | Qualcomm/RISE contributor | Medium |
| Dependency hygiene | Add `project-reports` coverage for bbolt and etcd-io/raft, with a targeted riscv64 atomic-alignment check for bbolt | 0.5-1 | Any contributor | Medium |

---

## 15. References

- [etcd-io/etcd repository](https://github.com/etcd-io/etcd)
- [etcd homepage](https://etcd.io/)
- [etcd Supported Platforms (v3.6)](https://etcd.io/docs/v3.6/op-guide/supported-platform/)
- [etcd CNCF project page](https://www.cncf.io/projects/etcd/)
- [SIG-etcd README](https://github.com/kubernetes/community/blob/master/sig-etcd/README.md)
- [PR #10834 - vendor: update x/sys and x/net modules to support Risc-V (merged 2019-08-29)](https://github.com/etcd-io/etcd/pull/10834)
- [PR #13504 - Is it necessary to avoid setting ETCD_UNSUPPORTED_ARCH=riscv64 (closed 2022-04-18)](https://github.com/etcd-io/etcd/pull/13504)
- [PR #14517 - Adding support for RISC-V (closed 2023-03-18)](https://github.com/etcd-io/etcd/pull/14517)
- [Issue #14522 - Extending CI pipeline, on behalf of 64bit RISC-V environment (closed 2023-04-02)](https://github.com/etcd-io/etcd/issues/14522)
- [PR #15490 - feat: add riscv64 support (closed 2023-04-21)](https://github.com/etcd-io/etcd/pull/15490)
- [Issue #21509 - Add riscv64 to supported architectures (closed 2026-06-04)](https://github.com/etcd-io/etcd/issues/21509)
- [PR #21510 - server: add riscv64 to supported architectures (closed 2026-03-29)](https://github.com/etcd-io/etcd/pull/21510)
- [go-riscv/etcd community fork](https://github.com/go-riscv/etcd)
- [etcd 3.5.30-2 Debian buildd riscv64 status](https://buildd.debian.org/status/package.php?p=etcd&suite=sid)
- [Ubuntu 26.04 "resolute" etcd package search (riscv64)](https://packages.ubuntu.com/search?keywords=etcd&suite=resolute&searchon=names&section=all)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [golang/go #27532 - riscv64 support tracking](https://github.com/golang/go/issues/27532)
- [golang/go #64345 - cmd/compile,runtime: race support for riscv64 (closed)](https://github.com/golang/go/issues/64345)
- [golang/go #50615 - bytes,strings: tests take ~100x as long on riscv (open)](https://github.com/golang/go/issues/50615)
- [PyPI etcd package](https://pypi.org/pypi/etcd/json)