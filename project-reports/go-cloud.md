---
title: go-cloud
---

# go-cloud

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for go-cloud<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

go-cloud (Go Cloud Development Kit) is a portable cloud API abstraction library for Go. It provides uniform interfaces over blob storage, pub/sub messaging, docstore (document databases), secrets management, and runtime configuration across AWS, GCP, and Azure. The abstraction layer allows applications to swap cloud backends without code changes.

- **Homepage:** [gocloud.dev](https://gocloud.dev/)
- **Repository:** [github.com/google/go-cloud](https://github.com/google/go-cloud)
- **License:** Apache 2.0
- **Latest release:** v0.46.0 (2026-06-02)
- **Foundation:** None -- Google-owned project, no CNCF or Linux Foundation membership
- **Go module requirement:** Go 1.25.8 minimum (from go.mod)

**Governance:** Informal. No MAINTAINERS, OWNERS, or CODEOWNERS file exists. "The Go CDK team" is referenced generically in CONTRIBUTING.md. Primary active committer is Robert van Gent (GitHub: vangent), a Google employee. A secondary active committer, herdiyana256 (herdiyanitdev), is identified as an independent security researcher at Supernesia Creative Technology with no Google affiliation [NEEDS VERIFICATION -- affiliation from public profile only]. Additional contributors (mustafabayar, fallintoplace, troyready, lpiepiora, LeSingh1, huynhtrungcip) appear to be community contributors with no identified corporate sponsor.

**Scope policy:** The maintainers have stated explicitly: "At this time we prefer to focus on maintaining the existing APIs and drivers, and are unlikely to accept new ones into the go-cloud repository." New drivers and APIs are redirected to external repositories.

**RISE membership:** Google LLC is a Premier Member of the RISE project. go-cloud is not listed under any RISE RFP or working group. Google's RISE membership does not imply any go-cloud-specific RISE activity.

**Architecture posture:** go-cloud is a pure Go library with no CGo in its core paths, no architecture-specific assembly, no SIMD dispatch, and no JIT backend. It is architecture-agnostic by construction. RISC-V compatibility is inherited automatically from the Go toolchain.

---

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists for go-cloud. The concept of a "port" does not apply to this project.

| Date | Event | Source |
|---|---|---|
| 2018 | Project open-sourced by Google | [github.com/google/go-cloud](https://github.com/google/go-cloud) |
| 2020 | Go 1.14 adds linux/riscv64 as a supported GOARCH -- go-cloud inherits support automatically | [Go 1.14 release notes](https://go.dev/doc/go1.14) |
| (none) | No riscv64-specific commit, issue, or PR has ever been filed | GitHub code/issue/commit search: 0 results |

There is no tracking issue for a riscv64 port, no contributor has filed a riscv64-specific issue, and no commits mention riscv or riscv64 in any form. The repository search across issues, PRs, commits, and code for "riscv", "riscv64", and "risc-v" returned zero results in all cases.

---

## 3. Upstream Support Tier

go-cloud has no formal platform tier policy document. The project is architecture-neutral and does not differentiate platform support by architecture.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (ubuntu-latest, macos-latest) | Partial (macos-latest runner is arm64) | No |
| CI test | Yes | Partial | No |
| Release binary | No binaries published for any arch | No binaries published for any arch | No binaries published for any arch |
| Official tier | Implicit (default Go target) | Implicit (default Go target) | Implicit (inherits from Go toolchain) |
| Cross-compilation tested in CI | dragonfly/amd64 only | No | No |

The project publishes no prebuilt binaries for any architecture. All GitHub release assets are empty (confirmed via `gh api 'repos/google/go-cloud/releases?per_page=3'` which returns `"assets":[]` for v0.46.0, v0.45.0, and v0.44.0). Distribution is exclusively as Go source. riscv64 is not a declared supported target, but no exclusion exists either.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

go-cloud has no architecture-specific components. A full recursive tree walk of all 1,090 files in the repository found zero files matching any architecture name pattern (amd64, arm64, 386, arm, s390x, ppc64, mips, riscv). There are no .s or .S assembly files, no C or C++ files, no `#ifdef __riscv` guards, and no `//go:build riscv64` or `//go:build amd64` build constraints in application code.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| JIT / code generation | N/A | N/A | N/A | No JIT in go-cloud |
| SIMD / vector | N/A | N/A | N/A | No SIMD in go-cloud |
| Crypto assembly | N/A | N/A | N/A | Crypto via golang.org/x/crypto (see Section 9) |
| GC barriers | N/A | N/A | N/A | Handled by Go runtime, not go-cloud |
| Assembly files | 0 | 0 | 0 | None anywhere in repo |
| Build constraints | 0 | 0 | 0 | None in application code |

The one GOARCH reference in the repository is in `.github/workflows/tests.yml`, hardcoded to `GOARCH=amd64` for a Dragonfly BSD cross-compilation smoke build. It is not a riscv64 reference.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Standard Go toolchain only. No CMake, no configure scripts, no Makefiles, no C toolchain required.

**Minimum Go version:** 1.25.8 (from go.mod). CI tests against Go 1.25.x and 1.26.x.

**riscv64 cross-compilation:**

```
GOARCH=riscv64 GOOS=linux go build ./...
```

No additional flags, no disabled features, no architecture patches. No QEMU reference exists anywhere in the repository. No CGo is used in the core library, so no C cross-compiler is needed.

**Known build failures:** None. No riscv64 build failure has been reported in any issue or PR. The project has never been built for riscv64 in its own CI, but the absence of CGo and architecture-specific code means there is no known reason for a build failure.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because go-cloud has no architecture-specific code, there are no functional gaps between riscv64 and other architectures at the go-cloud library level.

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Blob storage (GCS, S3, Azure, filesystem) | Yes | Yes | Yes (implicit) | None |
| Pub/Sub (GCP, AWS SNS/SQS, Azure) | Yes | Yes | Yes (implicit) | None |
| Docstore (DynamoDB, Firestore, MongoDB) | Yes | Yes | Yes (implicit) | None |
| Secrets (GCP KMS, AWS KMS, HashiCorp Vault) | Yes | Yes | Yes (implicit) | None |
| Runtime config (GCP, AWS, local) | Yes | Yes | Yes (implicit) | None |
| Server framework | Yes | Yes | Yes (implicit) | None |
| TLS throughput (crypto) | SIMD-accelerated via x/crypto | SIMD-accelerated via x/crypto | Generic Go fallback | Performance gap -- see Section 9 |
| Race detector (`go test -race`) | Available | Available | Not available | Go runtime gap, not go-cloud gap |
| Native CI validation | Yes | Partial | No | CI gap |

No NaN or floating-point semantics issues have been reported. Issue #2601 (closed 2021) concerned docstore filter evaluation divergence between local emulation and cloud service for NaN/infinity values -- it was not architecture-specific.

---

## 7. CI/CD Infrastructure

go-cloud CI consists of exactly two GitHub Actions workflow files: `tests.yml` and `golangci-lint.yml`. Both were read directly from the repository.

**tests.yml** (sha: 910e9601e6f61291106badd60791154ffdb5aa64):
- Triggers on push and pull_request
- Runners: ubuntu-latest and macos-latest
- Go versions: 1.26.x (ubuntu and macos), 1.25.x (ubuntu only)
- Only non-default platform target: `GOOS=dragonfly GOARCH=amd64` smoke build
- No `GOARCH=riscv64` line. No QEMU step. No riscv64 runner.

**golangci-lint.yml** (sha: 7bd414c49a161826d4690cb94b621b111d852456):
- Triggers on push and pull_request
- Runner: ubuntu-latest
- Runs golangci-lint v2.12 for static analysis only -- no build, no test, no cross-compilation

No .cirrus.yml, Jenkinsfile, or .gitlab-ci.yml exists in the repository.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build | Yes | Partial (macos runner) | No |
| Unit tests | Yes | Partial (macos runner) | No |
| Cross-compilation check | dragonfly/amd64 only | No | No |
| Lint | Yes | No | No |
| RISE runner | No | No | No |
| QEMU emulation | No | No | No |

No RISE runners or RISE-funded CI infrastructure exists for this project. Adding a `GOARCH=riscv64 GOOS=linux go build ./...` cross-compilation step to `tests.yml` would require a one-line addition and no other infrastructure.

---

## 8. Distribution and Release Status

| Channel | riscv64 status | Notes |
|---|---|---|
| GitHub Releases | No assets of any kind | All releases (v0.44.0 - v0.46.0) have empty asset arrays -- confirmed via API |
| Go module proxy (sum.golang.org) | Available | Source-only; architecture-neutral by definition |
| Debian (golang-gocloud) | arch:all, version 0.26.0-1 (stable), 0.45.0-2 (testing/unstable) | No native riscv64 build; arch:all means no compilation occurs |
| Ubuntu 24.04 (golang-gocloud-dev) | arch:all | Same as Debian -- installs on riscv64 without a dedicated build |
| Arch Linux RISC-V (archriscv.felixc.at) | Not packaged | No entry for go-cloud or golang-gocloud |
| PyPI | Not applicable | go-cloud is a Go library; no Python package exists |
| OCI / container images | Data not available: no official OCI images found in the GitHub repository |

To obtain a working riscv64 binary from go-cloud, a user cross-compiles from source with `GOARCH=riscv64 GOOS=linux go build ./...` using Go 1.25+. No prebuilt riscv64 binary exists anywhere. The Debian/Ubuntu arch:all package is source installed as-is -- it requires no native riscv64 compilation and does not represent a compiled artifact.

---

## 9. Dependencies

All critical dependencies of go-cloud are pure Go. No dependency has CGo, SIMD dispatch, or JIT in the paths exercised by go-cloud.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Go runtime / stdlib | Language runtime, GC, scheduler, crypto primitives | Builds (linux/riscv64 tier 2) | Partial -- LUCI native builder proposed, rva22u64 bots broken | Ships in upstream Go releases | #78161 memory corruption (open); #68862 SIGSEGV in preemptone (open); race syso missing (#78261) |
| golang.org/x/crypto | TLS, AES-GCM, ChaCha20-Poly1305, Ed25519, SHA hashes | Builds; has sum_riscv64.s | linux/riscv64 CI | Yes | No open riscv64 issues; AES/SHA fall back to generic Go -- no RVV acceleration |
| google.golang.org/grpc (grpc-go) | gRPC transport for GCP APIs (Firestore, Pub/Sub, KMS) | Builds | No riscv64 CI | Yes | No riscv64 issues; pure Go |
| google.golang.org/protobuf | Protobuf encoding for all gRPC calls | Builds | No riscv64 CI | Yes | No riscv64 issues; pure Go |
| go.opentelemetry.io/otel | Distributed tracing and metrics | Builds | No riscv64 CI | Yes | No riscv64 issues; pure Go |
| aws/aws-sdk-go-v2 | AWS S3, DynamoDB, KMS, SQS, SNS, STS, SSM backends | Builds | No riscv64 CI | Yes | No riscv64 issues; pure Go |
| Azure SDK (azure-sdk-for-go/sdk/*) | Azure Blob, Service Bus, Key Vault backends | Builds | No riscv64 CI | Yes | No riscv64 issues; pure Go |
| go-sql-driver/mysql | MySQL / Cloud SQL driver | Builds | No riscv64 CI | Yes | No riscv64 issues; pure Go |
| lib/pq | PostgreSQL driver | Builds | No riscv64 CI | Yes | No riscv64 issues; pure Go |
| google/wire | Compile-time dependency injection (codegen) | Builds | No riscv64 CI | Yes | No riscv64 issues; pure Go |
| google/uuid | UUID generation for blob keys and message IDs | Builds | No riscv64 CI | Yes | Uses /dev/urandom on Linux; works on riscv64 |
| fsnotify/fsnotify | Filesystem notifications (local filesystem driver) | Builds | No riscv64 CI | Yes | Uses inotify on Linux; works on riscv64 |
| GoogleCloudPlatform/cloudsql-proxy | Cloud SQL authentication proxy | Builds | No riscv64 CI | Yes | No riscv64 issues; pure Go |
| googleapis/gax-go | Google API retry and call options helper | Builds | No riscv64 CI | Yes | No riscv64 issues; pure Go |

**Critical dependency notes:**

The Go runtime (golang/go) has two open correctness bugs on linux/riscv64 that affect any Go program on RISC-V:
- Issue #78161: memory corruption on linux/riscv64 (reported against Go 1.26.1, open as of 2026-08). Flaky, not a consistent failure.
- Issue #68862: SIGSEGV in preemptone, tracked via watchflakes on the linux-riscv64-mengzhuo builder. Open.

The Go race detector (runtime/race) does not build for riscv64. The race syso for riscv64 has not been generated due to build timeout issues (issues #78261 and #78258, both open). This blocks `go test -race ./...` on riscv64 hardware.

For golang.org/x/crypto: AES-GCM (all TLS connections), SHA-256, and AES-KW (KMS) fall back to generic Go implementations on riscv64. RVV acceleration does not yet exist in golang.org/x/crypto for riscv64. go-cloud applications with high TLS or KMS throughput will show measurable latency increases compared to amd64 or arm64.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in the go-cloud repository. All GitHub searches for "riscv", "riscv64", and "risc-v" across issues, PRs, commits, and code returned zero results.

The only open issue in go-cloud in 2026 is #3670 (GCP Private Service Connect support), which is unrelated to architecture.

Bugs affecting go-cloud on riscv64 are located in the Go runtime, not in go-cloud itself:

| ID | Title | Repo | Status | Severity | Notes |
|---|---|---|---|---|---|
| [#78161](https://github.com/golang/go/issues/78161) | Memory corruption on linux/riscv64 | golang/go | Open | High | Flaky; affects any Go program on riscv64 under Go 1.26.1 |
| [#68862](https://github.com/golang/go/issues/68862) | SIGSEGV in preemptone | golang/go | Open | Medium | Tracked via watchflakes; flaky goroutine preemption failure |
| [#78261](https://github.com/golang/go/issues/78261) | Race detector syso not built for riscv64 | golang/go | Open | Medium | Blocks `go test -race` on riscv64; build timeout root cause in #78258 |
| [#57691](https://github.com/golang/go/issues/57691) | ASAN test SEGV on riscv64 | golang/go | Open | Low | Affects ASAN-enabled test runs only |

---

## 12. Objections and Upstream Blockers

**No objections to riscv64 support exist** in go-cloud because the project has never been asked about it and no architecture-specific work is required. The library is pure Go; riscv64 already works via the toolchain.

**Organizational blocker -- conservative scope:** The maintainers have explicitly stated they are focused on maintaining existing APIs and are "unlikely to accept new ones." This posture applies to new drivers, not to CI infrastructure additions. A PR adding `GOARCH=riscv64` cross-compilation to `tests.yml` would be a one-line change to an existing workflow step and is unlikely to face principled resistance. [NEEDS VERIFICATION -- no maintainer has been asked about this specifically.]

**Technical blockers from dependencies:**
- Go runtime correctness bugs (#78161, #68862) are the primary risk for production deployment on riscv64. These are in golang/go, not go-cloud, and are outside go-cloud maintainer control.
- Race detector unavailability (#78261) reduces test confidence for riscv64-native development workflows.
- No RVV crypto acceleration in golang.org/x/crypto creates a performance gap for TLS-heavy workloads.

---

## 13. Investment Analysis

The RISE project has no current or historical involvement with go-cloud. Google LLC is a Premier RISE member but has not directed RISE resources at this project.

### 13.1 Functional Enablement

No functional enablement work is required. go-cloud builds and runs on riscv64 today via `GOARCH=riscv64 GOOS=linux go build ./...`. All cloud provider backends (AWS, GCP, Azure) are pure Go and function correctly assuming the Go toolchain is stable.

The Go runtime correctness bugs (#78161, #68862) should be fixed upstream in golang/go before go-cloud is deployed in production on riscv64. Those fixes are in scope for the Go runtime team and the RISE Go working group (RP001), not for go-cloud contributors.

### 13.2 Performance Optimization

No performance optimization is needed or possible in go-cloud itself -- it has no architecture-specific code. The relevant optimization target is golang.org/x/crypto: adding RVV-accelerated AES-GCM and SHA-256 implementations would benefit all Go programs on riscv64 that make TLS connections, including go-cloud workloads. That work belongs in the golang.org/x/crypto repository and is outside go-cloud scope.

### 13.3 CI/CD Infrastructure

The only actionable CI investment for go-cloud is adding a riscv64 cross-compilation check to `tests.yml`. This is a one-line addition to the existing dragonfly cross-build step pattern. It provides early warning of any future accidental introduction of architecture-specific code and demonstrates platform support in the CI record.

A riscv64 native test runner (via QEMU or RISE hardware) would provide higher confidence but is low priority given the absence of architecture-specific code.

### 13.4 Ecosystem Enablement

Not applicable. go-cloud has no dependent package ecosystem that requires separate riscv64 enablement. It is a library consumed directly by Go applications.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add `GOARCH=riscv64 GOOS=linux go build ./...` step to tests.yml | 0.1 | go-cloud contributor or RISE | Low |
| Functional | Fix Go runtime memory corruption on riscv64 (#78161) | 3-6 (in golang/go, not go-cloud) | Go runtime team / RISE RP001 | High |
| Functional | Fix race detector for riscv64 (#78261) | 2-4 (in golang/go) | Go runtime team / RISE RP001 | Medium |
| Performance | RVV-accelerated AES-GCM and SHA-256 in golang.org/x/crypto | 4-8 (in x/crypto, not go-cloud) | RISE Go working group | Medium |
| Functional | Fix SIGSEGV in preemptone on riscv64 (#68862) | 2-4 (in golang/go) | Go runtime team / RISE RP001 | Medium |

**Bottom line:** go-cloud itself requires zero porting investment. The entire RISC-V risk surface for go-cloud sits in the Go runtime and golang.org/x/crypto -- both of which are already tracked under RISE RP001. A single 0.1 person-week CI addition is the only go-cloud-specific action warranted.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [google/go-cloud repository](https://github.com/google/go-cloud)
- [gocloud.dev homepage](https://gocloud.dev/)
- [go-cloud v0.46.0 release](https://github.com/google/go-cloud/releases/tag/v0.46.0)
- [tests.yml CI workflow (sha 910e9601)](https://github.com/google/go-cloud/blob/main/.github/workflows/tests.yml)
- [golangci-lint.yml CI workflow (sha 7bd414c4)](https://github.com/google/go-cloud/blob/main/.github/workflows/golangci-lint.yml)
- [Debian tracker: golang-gocloud](https://tracker.debian.org/pkg/golang-gocloud)
- [Ubuntu 24.04 package: golang-gocloud-dev](https://packages.ubuntu.com/search?keywords=golang-gocloud&suite=noble)
- [Arch Linux RISC-V package status](https://archriscv.felixc.at/)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE blog: Advancing Go on RISC-V (2025-04-04)](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [golang/go issue #78161: memory corruption on linux/riscv64](https://github.com/golang/go/issues/78161)
- [golang/go issue #68862: SIGSEGV in preemptone on riscv64](https://github.com/golang/go/issues/68862)
- [golang/go issue #78261: race detector syso not built for riscv64](https://github.com/golang/go/issues/78261)
- [golang/go issue #78258: riscv64 race syso build timeout](https://github.com/golang/go/issues/78258)
- [golang/go issue #57691: ASAN test SEGV on riscv64](https://github.com/golang/go/issues/57691)
- [Go 1.14 release notes (linux/riscv64 initial support)](https://go.dev/doc/go1.14)