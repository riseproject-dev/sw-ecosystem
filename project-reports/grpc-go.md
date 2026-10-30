---
title: gRPC-Go
parent: Project Reports
color: green
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: google.golang.org/protobuf
    relation: runtime-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: build-dependency
    criticality: optional
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/net
    relation: runtime-dependency
    criticality: critical
  - name: cespare/xxhash
    relation: runtime-dependency
    criticality: critical
  - name: golang/glog
    relation: runtime-dependency
    criticality: optional
  - name: google/go-cmp
    relation: test-dependency
    criticality: optional
  - name: gonum
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="grpc-go" %}

# gRPC-Go

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for gRPC-Go<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

gRPC-Go ([grpc/grpc-go](https://github.com/grpc/grpc-go)) is the Go implementation of gRPC, the RPC framework described at [grpc.io](https://grpc.io/). It is a source-only Go module. The research found no cgo (`import "C"`), no `.c`, `.h`, `.s` or `.S` files, and no JIT or SIMD code in the tree. The module requires `go 1.26.0` in `go.mod`. The README requires "any one of the two latest major" Go releases, and CI tests Go 1.26 and 1.27.

**Foundation and license.** grpc.io describes gRPC as a CNCF incubation project. The repository `LICENSE` file is Apache 2.0. `GOVERNANCE.md` defers to the gRPC-wide rules in `grpc/grpc-community`.

**Governance model**
- The repositories are the source of truth. Decisions follow PR, discussion, then Maintainer accept or refuse.
- Disputes can go to a "[vote]" PR that stays open at least two weeks. A simple majority of that repo's Maintainers decides, one vote each.
- Cross-language or breaking changes need a gRFC.
- The Steering Committee has 7 seats, held by individuals and not employers. Maintainers elect it annually by ranked-choice vote. It requests CNCF support and manages the gRPC brand.
- Only Maintainers can do releases.

**Corporate maintainers.** `MAINTAINERS.md` lists 6 active maintainers.

| Maintainer | Company |
|---|---|
| arjan-bal | Google LLC |
| arvindbr8 | Google LLC |
| dfawley | Google LLC |
| easwars | Google LLC |
| gtcooke94 | Google LLC |
| atollena | Datadog, Inc. |

That is 5 of 6 at Google and 1 at Datadog. There are 17 emeritus maintainers with no company listed.

**Recent activity.** Author counts from `git log` for the last 12 months:
- Easwar Swaminathan: 80 commits.
- eshitachandwani: 67.
- Pranjali-2501: 57.
- Arjan Singh Bal: 54.
- Madhav Bissa: 29.

Easwar Swaminathan and Arjan Singh Bal are listed maintainers. The other three are not. Their employers are unconfirmed. This is based on a 3000-commit shallow clone covering 2019-11-21 to 2026-10-29.

**Community culture on new ports.** Data not available: no platform policy document exists. The repo has no `PLATFORMS.md`, `SUPPORT.md` or `docs/platforms/`, and the governance text covers only new repositories, not ports. Contributions follow the standard PR and maintainer-review flow. The de facto first-class platforms are amd64, arm64 and 386 (see Section 3).

**RISE relationship.** [RISE members](https://riseproject.dev/members/) list Google LLC as a Premier member. Datadog and CNCF are not listed. gRPC-Go is not named as a RISE project or priority. RISE has no direct gRPC-Go work (see Section 14).

## 2. Port History and Upstreaming Timeline

There is no riscv64 port to track. gRPC-Go is pure Go, so riscv64 support comes from the Go toolchain. Searches of `riscv`, `riscv64` and `RISC-V` found no issue, commit or code reference in grpc/grpc-go, with one exception: PR #9450. The "RISC-V" spelling was not searched for issues.

| Date | Event | Source |
|---|---|---|
| 2019-11-21 to 2026-10-29 | Fetched commit window of 3000 commits contains no commit message mentioning riscv or risc-v. History before 2019-11-21 is not covered. | Local clone at bc90736 (see [grpc-go](https://github.com/grpc/grpc-go)) |
| Date not available (Ubuntu groovy) | golang-google-grpc-dev 1.27.1-1 riscv64 binary published | [Launchpad](https://launchpad.net/ubuntu/groovy/riscv64/golang-google-grpc-dev/1.27.1-1) |
| Date not available (Fedora 41) | golang-google-grpc-1.54.0-1.fc41.riscv64.rpm built on the ISCAS Koji instance | [ISCAS Koji](https://openkoji.iscas.ac.cn/koji/rpminfo?rpmID=8176) |
| 2025-04-04 | RISE publishes the Go-on-RISC-V progress post. It does not mention gRPC. | [RISE blog](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/) |
| 2026-09-29 | External PR #9450 opened (non-zeroing buffer pool, benchmarked on a riscv64 board) | [PR #9450](https://github.com/grpc/grpc-go/pull/9450) |
| 2026-10-09 | PR #9450 closed. Merged or unmerged status is not verified. | [PR #9450](https://github.com/grpc/grpc-go/pull/9450) |
| 2026-10-29 | `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...` succeeds at HEAD bc90736 with Go 1.26.0 on x86_64 | Local clone build |
| Date not available | Debian sid ships golang-google-grpc-dev 1.81.1-1, Architecture: all | [Debian](https://packages.debian.org/sid/golang-google-grpc-dev) |

**Key contributors.**
- lxq015 authored PR #9450. GitHub association is NONE (external contributor). Employer not available.
- Ludovic Henry and Mark Ryan authored the RISE Go post. They are not gRPC-Go contributors.

**Is it fully upstream?** There is nothing to upstream: no riscv64-specific code is needed or present. Data not available: whether the Debian, Fedora or Ubuntu riscv64 builds carry riscv64-specific patches was not checked.

## 3. Upstream Support Tier

**Formal tier policy.** None exists. No `PLATFORMS.md`, `SUPPORT.md` or `docs/platforms/` was found in the clone. Governance does not address platforms.

**Evidence from CI and releases.**
- [testing.yml](https://github.com/grpc/grpc-go/blob/master/.github/workflows/testing.yml) covers amd64 (Go 1.26 and 1.27, plus `-race`), 386 (`GOARCH=386`) and arm64 (runner `ubuntu-24.04-arm`). It has no riscv64 job.
- [release.yml](https://github.com/grpc/grpc-go/blob/master/.github/workflows/release.yml) builds `protoc-gen-go-grpc` for goos linux, darwin and windows and goarch 386, amd64 and arm64.
- The gRPC site states grpc-go has continuous testing on ARM64 ([gRPC on Arm64](https://grpc.io/blog/grpc-on-arm64/)). No equivalent statement exists for riscv64.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI job | Yes (Go 1.26, 1.27, `-race`) | Yes (`ubuntu-24.04-arm`) | None |
| Official release binaries (`protoc-gen-go-grpc`) | Yes | Yes | None |
| Stated support in docs | Not stated | Stated on grpc.io | Not stated |
| Builds (pure Go) | Yes | Yes | Yes (cross-build verified, 2026-10-29) |
| Test suite result | Run in CI | Run in CI | Never run |

## 4. Technical Architecture and RISC-V-Specific Subsystems

gRPC-Go has no architecture-specific layer. Findings:
- No `.s` assembly (search `extension:s repo:grpc/grpc-go` returned 0).
- No cgo.
- No RVV intrinsics (`vfloat32m1_t` search returned 0).
- No `arch/riscv/` directory, no JIT backends, no SIMD dispatch.
- No ISA extension use (RVV, Zba, Zbb or other).

A GitHub code search for `GOARCH` or `go:build` tags returned 0 results, but the clone shows two test-only arch tags:
- `channelz/service/service_sktopt_test.go`: `linux && (386 || amd64)`.
- `internal/xds/httpfilter/fault/fault_test.go`: `!386`.

Neither blocks riscv64. The clone is the authoritative source for build tags.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned assembly in grpc-go | None | None | None |
| C intrinsics / cgo | None | None | None |
| JIT | None | None | None |
| SIMD dispatch | None | None | None |
| Go code (whole library) | Portable | Portable | Portable, builds |
| Test-only arch tags | channelz test applies (linux 386/amd64) | Not applicable | Not applicable |

The work that determines riscv64 quality for gRPC-Go sits in the Go toolchain and standard library. The [RISE Go post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/) reports the following:
- Official linux-riscv64 binaries since Go 1.21.
- The Go assembler supports many vector operations, and the runtime detects available extensions at startup.
- `internal/bytealg` is vectorized.
- `math/big` has hand-written assembly.
- md5, sha256 and sha512 have scalar assembly.
- Profile targeting for RVA20, RVA22 and RVA23.
- Remaining work: better Vector support in the compiler, Compressed instruction support, and testing infrastructure.

Data not available: a per-component comparison of these Go standard library implementations against amd64 and arm64 was not researched.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** There is no CMake, configure script or riscv64-specific Dockerfile. None of `BUILDING.md`, `INSTALL`, `docs/building.md`, `CMakeLists.txt`, `Dockerfile.riscv64` or `.ci/docker/` exists. A case-insensitive search for "riscv" over the whole tree returned zero matches. The only Dockerfiles are five unrelated image builds (`examples/features/csm_observability/{client,server}`, `interop/observability`, `interop/xds/{client,server}`). Four use `golang:1.26-alpine` and one uses `golang:1.26`, and they build with `go build -tags osusergo,netgo .`.

**Commands.** The repo documents no riscv64 commands. These follow from the Go toolchain and the repo's Makefile conventions:

```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go test -c -o <out>.test ./<pkg>
```

The repo's own targets are `go build google.golang.org/grpc/...` and `go test -cpu 1,4 -timeout 7m google.golang.org/grpc/...`. On native hardware, use the same commands without `GOOS` and `GOARCH`.

**Toolchain versions and why.** Go 1.26.0 or newer is required because `go.mod` declares `go 1.26.0`. No C compiler is required, so no C cross-toolchain is needed.

**Verified.** `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...` succeeded with Go 1.26.0 on x86_64 at bc90736. It took about 51 seconds and printed no errors.

**QEMU.** A test run would be `qemu-riscv64 ./pkg.test` from inside the package directory, since tests read relative `testdata/` paths. No test has been run, so the riscv64 test result is unknown.

**Known build failures.** None found.

The riscv64 build was run, not just inferred: `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...` succeeds at HEAD bc90736 (Section 2).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Library builds | Yes | Yes | Yes |
| Library tests run upstream | Yes | Yes | No |
| `-race` testing upstream | Yes | Not stated | No |
| Prebuilt `protoc-gen-go-grpc` | Yes | Yes | No |
| Debian arch:all package | Yes | Yes | Yes (arch:all) |

**Functional gaps.** None found. The source-level feature set is architecture-independent. Test pass rate on riscv64 is unknown.

**Performance gaps.**
- Data not available: no gRPC-Go benchmark numbers for riscv64 versus arm64 or amd64 exist in any source reached. The gRPC-Go benchmark results found were x86 only:
  - [Nexthink](https://nexthink.com/blog/comparing-grpc-performance) reported "390k reqs/sec" for a Go gRPC echo server.
  - [kmcd.dev](https://kmcd.dev/posts/benchmarking-go-grpc/) reported "over 20,000 requests per second" on an Intel NUC.
  - The [FOSDEM 2025 slides](https://fosdem.org/2025/events/attachments/fosdem-2025-4231-high-performance-grpc/slides/236895/High_Perf_yKkr4P8.pdf) report grpc 1.66 or later reduces allocations. On x86 VMs, a custom codec can cut unary CPU use by about 10%.
- The only riscv64 data point is PR #9450. Its description reports Spacemit X60 (single core) 65KB unary RPC results: average latency down 16.5% with no compression, 5.5% with nop compression and 6.4% with gzip, with allocations per op unchanged. [NEEDS VERIFICATION] This comes from search result text only. The PR body and comments could not be read, and the merge status is unknown.
- Go-toolchain-level gap, not gRPC specific: [golang/go#77541](https://github.com/golang/go/issues/77541) claims RISC-V is about 20-40% slower than ARM64 on many CPU-intensive workloads (go1.25.6, `GORISCV64=rva23u64`, Bent suite, hardware unnamed). The report names kanzi-go and wazero benchmarks, not gRPC. The cause analyzed is address recomputation for large stack frames (`ADDI`, `ADDI`, `SH3ADD` versus one `ADD` on ARM64). It is a single user's report. [NEEDS VERIFICATION] Two 2026 comments in that issue are promotional and are disregarded.

**Security hardening gaps.** Data not available: no hardening differences were researched.

**NaN / floating-point semantics.** Search "riscv nan floating" on grpc/grpc-go returned 0 hits. No issues found.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist?** No. [testing.yml](https://github.com/grpc/grpc-go/blob/master/.github/workflows/testing.yml) was read from the local clone at bc90736 and contains amd64, 386 and arm64 jobs only.

**Evidence for the CI findings.** The workflow contents come from the clone. A GitHub code search for `.github` returned 0 results and was not treated as evidence.

**RISE runners.** No evidence that grpc/grpc-go uses the RISE runner. Indirectly, the [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels) workflow `build-adbc-driver-flightsql.yml` runs on `ubuntu-24.04-riscv` and fetches the Go module graph, including grpc-go, fresh each run. This builds grpc-go as a transitive dependency but does not run its test suite. RISE reports 24,000 jobs, 700k minutes, 116 organizations and 264 repositories on GitHub RISC-V runners ([RVI Summit EU 2026 slides](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf)).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Test job in testing.yml | Yes (Go 1.26, 1.27, `-race`) | Yes (`ubuntu-24.04-arm`) | None |
| 32-bit variant job | 386 | Not applicable | Not applicable |
| Release build matrix | Yes | Yes | None |
| Hardware | GitHub-hosted | GitHub-hosted arm | None used |

## 8. Distribution and Release Status

**Official riscv64 binaries.** None. The only compiled release artifact found is `protoc-gen-go-grpc`, built for 386, amd64 and arm64 ([release.yml](https://github.com/grpc/grpc-go/blob/master/.github/workflows/release.yml)). The GitHub releases listing was not read, so release asset names are unverified.

| Channel | Status | Source |
|---|---|---|
| Debian sid | golang-google-grpc-dev 1.81.1-1, Architecture: all (installs on riscv64) | [Debian](https://packages.debian.org/sid/golang-google-grpc-dev) |
| Ubuntu groovy | golang-google-grpc-dev 1.27.1-1 riscv64 binary | [Launchpad](https://launchpad.net/ubuntu/groovy/riscv64/golang-google-grpc-dev/1.27.1-1) |
| Ubuntu focal | golang-google-grpc-dev listed | [Launchpad blueprint](https://blueprints.launchpad.net/ubuntu/focal/+package/golang-google-grpc-dev) |
| Ubuntu (version 1.66.3) | riscv64 and arm64 packages reported [NEEDS VERIFICATION], single source, not re-fetched | RISE research summary |
| Ubuntu 26.04 (resolute) | Inconclusive: packages.ubuntu.com returned HTTP 500 twice | Not available |
| Fedora 41 riscv64 | golang-google-grpc-1.54.0-1.fc41.riscv64.rpm on ISCAS Koji | [ISCAS Koji](https://openkoji.iscas.ac.cn/koji/rpminfo?rpmID=8176) |
| Nixpkgs | protoc-gen-go-grpc lists riscv64-linux | [mynixos](https://mynixos.com/nixpkgs/package/protoc-gen-go-grpc) |
| Arch Linux RISC-V | Not listed in a search for grpc-go; detailed status page not checked | [archriscv](https://archriscv.felixc.at/?q=grpc-go) |
| PyPI | Not applicable: [grpc-go on PyPI](https://pypi.org/pypi/grpc-go/json) returns HTTP 404 | PyPI |
| RISE wheel index | Not applicable: 404 after redirect to PyPI | [wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) |

**What a user must do.** gRPC-Go is consumed as Go source. A user needs a Go toolchain for riscv64 (official linux-riscv64 Go binaries have existed since Go 1.21 per the RISE post) and Go 1.26.0 or newer for the current module version. The user runs `go build` natively or with `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0`. No riscv64-specific step is needed. Distro `-dev` packages provide the source tree for distro-packaged Go builds.

## 9. Dependencies

Versions come from `go.mod` at bc90736. Per-dependency riscv64 test and release status was not verified. "Inferred" means the finding rests on general knowledge of pure-Go portability, not a checked source.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community / report |
|---|---|---|---|---|---|
| Go | build-dependency, critical. `go 1.26.0` required | Supported. Report `go.md` rates it green. Official linux-riscv64 binaries since Go 1.21 | Not checked here | Not checked here | RISE project RP001 (Henry, Ryan); Go riscv64 tracking in golang/go#27532 |
| google.golang.org/protobuf | runtime-dependency, critical. v1.36.12 | Inferred OK (pure Go) | Not verified | Not verified | Data not available |
| Protocol Buffers | build-dependency, optional (code generation) | Data not available: protoc riscv64 status was not searched | Data not available | Data not available | Data not available |
| golang.org/x/sys | runtime-dependency, critical. v0.48.0. Low-level OS bindings | Inferred OK; the riscv64 build of grpc-go succeeded | Not verified | Not verified | Listed as a critical dependency in the Go report |
| golang.org/x/net | runtime-dependency, critical. v0.60.0. HTTP/2, networking | Inferred OK (pure Go); the riscv64 build succeeded | Not verified | Not verified | Data not available |
| cespare/xxhash | runtime-dependency, critical. v2.3.0 (xxHash64) | Inferred OK via pure-Go fallback; no riscv64 assembly [NEEDS VERIFICATION] | Not verified | Not verified | Not covered by `project-reports/xxhash.md`, which covers the C library Cyan4973/xxHash |
| golang/glog | runtime-dependency, optional. v1.2.5. Logging | Inferred OK (pure Go) | Not verified | Not verified | Data not available |
| google/go-cmp | test-dependency, optional. v0.7.0 | Inferred OK (pure Go) | Not verified | Not verified | Data not available |
| gonum | test-dependency, optional. gonum.org/v1/gonum v0.17.0 | Inferred OK; assembly kernels have pure-Go fallbacks [NEEDS VERIFICATION] | Not verified | Not verified | Data not available |

**Indirect dependencies (from go.mod).** All are inferred OK as pure Go or generated code; none were verified on riscv64.

| Name | Role | riscv64 status |
|---|---|---|
| golang.org/x/text v0.42.0 | Unicode and text | Inferred OK |
| golang.org/x/oauth2, golang.org/x/sync | Auth and concurrency helpers | Inferred OK |
| golang/protobuf v1.5.4 | Legacy protobuf shim | Inferred OK |
| planetscale/vtprotobuf | Fast protobuf codegen | Inferred OK |
| go-jose/go-jose/v4 v4.1.5 | JOSE/JWT crypto, builds on Go stdlib crypto | Inferred OK |
| google/uuid v1.6.0 | UUIDs | Inferred OK |
| spiffe/go-spiffe/v2 v2.8.2 | Workload identity and TLS | Inferred OK |
| go.opentelemetry.io/otel (api, sdk, metric, trace, contrib/detectors/gcp) | Telemetry | Inferred OK |
| cncf/xds/go, envoyproxy/go-control-plane, protoc-gen-validate, cel.dev/expr, genproto, go-logr | xDS, generated protobuf types, logging API | Inferred OK |

**Deep dive.**
- **Go toolchain and standard library.** This is the single critical dependency for riscv64. Crypto, TLS, `math/big` and byte-scanning routines live here, with the hand-written riscv64 assembly listed in Section 4. RISE has funded work on it (RP001). A RISE wiki roadmap item "Add RISC-V boards to Go upstream CI" (LR_02_0029) exists; it is a roadmap entry and not a result.
- **SIMD or assembly in third-party dependencies.** The research found none in grpc-go itself. Whether cespare/xxhash and gonum ship amd64/arm64 assembly with a pure-Go fallback for riscv64 is inferred, not confirmed. A successful whole-module riscv64 build implies every module imported by non-test packages compiled, but the research did not enumerate which of the above that covers.
- **Recursion.** x/net pulls x/text; protobuf and xDS types are generated Go. No third-level dependency with JIT, SIMD or cgo was identified. Data not available: no dependency graph walk beyond `go.mod` was performed.

**Graph names to query once the tool is connected (suite resolute):** `golang-go`, `golang-github-cespare-xxhash-dev`, `golang-golang-x-sys-dev`, `golang-golang-x-net-dev`, `golang-golang-x-text-dev`, `golang-google-protobuf-dev`, `golang-github-golang-protobuf-1-5-dev`, `golang-gonum-v1-gonum-dev`, `golang-github-go-jose-go-jose-dev`, `golang-github-golang-glog-dev`, `golang-github-google-go-cmp-dev`, `golang-github-google-uuid-dev`, `golang-github-spiffe-go-spiffe-dev`, `golang-opentelemetry-otel-dev`, `golang-google-grpc-dev`.

## 11. Known Bugs and Active Issues

No open RISC-V bug was found in grpc/grpc-go. Issue searches `riscv`, `riscv64 performance`, `riscv nan floating` and `RISC-V architecture support` returned 0 hits.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#9450](https://github.com/grpc/grpc-go/pull/9450) (PR) | codec: use a non-zeroing buffer pool for proto marshaling/unmarshaling | Closed 2026-10-09, merge status unverified. Label "Status: Requires Reporter Clarification" | Low (performance only) | External author lxq015. 6 comments unread. References issue #8790 and PR #9421, both unread. [NEEDS VERIFICATION] |
| [#3612](https://github.com/grpc/grpc-go/issues/3612) | Potential bugs on old cores: using 64-bit functions sync/atomic | Closed 2020-05-12, locked | Not applicable | Concerns 64-bit atomics on old 32-bit cores. Does not mention RISC-V. False positive |
| [golang/go#77541](https://github.com/golang/go/issues/77541) | RISC-V instruction bloat from large stack frame offsets | Open, help wanted, Backlog milestone | Medium (toolchain performance, not gRPC specific) | Single-user report. Cause analyzed as stack address rematerialization |

**Correctness bugs.** None found.

## 12. Objections and Upstream Blockers

- **Stated objections.** None found. There is no riscv64 issue or PR discussion upstream to quote.
- **Technical blockers.** None identified. The riscv64 build succeeds with no arch-specific code. The remaining unknown is the test suite result, which has not been run.
- **Organizational blockers.** There is no riscv64 CI. Adding one requires a maintainer-approved PR. Five of six active maintainers work at Google. The closure of PR #9450 with the label "Status: Requires Reporter Clarification" suggests maintainers requested clarification, but the reason was not read. [NEEDS VERIFICATION]
- **Acceptance probability.** Data not available: no maintainer statement on new platforms exists. The arm64 job in testing.yml is the precedent for a hosted-runner job, and Google is a RISE Premier member. Both are inference, not evidence of acceptance. No numeric probability is offered.

## 13. Readiness Assessment

- **Color:** green
- **Release provider:** upstream

**Justification.** Step 0 applies. The grpc-go library is source-only pure Go with no cgo, no `.s` or `.c` files and no arch build tags that block riscv64, so it is architecture-independent and inherits riscv64 from the Go toolchain. `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...` succeeded on the [grpc-go checkout at bc90736](https://github.com/grpc/grpc-go) (HEAD, 2026-10-29), and Debian sid ships [golang-google-grpc-dev 1.81.1 as Architecture: all](https://packages.debian.org/sid/golang-google-grpc-dev).

**Caveats (confidence medium).**
- Upstream has no riscv64 CI ([testing.yml](https://github.com/grpc/grpc-go/blob/master/.github/workflows/testing.yml) covers amd64, 386, arm64).
- The test suite was never run on riscv64.
- The only compiled release artifacts (`protoc-gen-go-grpc`, [release.yml](https://github.com/grpc/grpc-go/blob/master/.github/workflows/release.yml)) are built for 386, amd64 and arm64 only.
- If a grader reads those binaries as disqualifying Step 0, the fallback is orange/downstream-only (no CI; distro patch status unchecked).
- The graded color is green by the Step 0 rule (pure Go, no compiled artifacts), so the absence of riscv64 CI is not penalized.
- No `project-reports/grpc-go.md` exists (report_date none, verified_date none; as_of 2026-10-29 from the local clone build). delta_vs_report: n/a.

**Pending work that could change the grade.**
- No riscv64 tracking issue or riscv commits exist upstream.
- External PR [#9450](https://github.com/grpc/grpc-go/pull/9450) (non-zeroing buffer pool, benchmarked on Spacemit X60 riscv64, closed 2026-10-09, merge status unverified) is performance-only, not support.
- There is no direct RISE work on gRPC-Go. It is a dependency of many tracked projects (etcd, containerd, prometheus, etc.) and a transitive dependency of the RISE-built adbc-driver-flightsql wheel on ubuntu-24.04-riscv.
- A riscv64 job in testing.yml (the arm64 job is the precedent), or a RISE-runner test job, would make this a defensible blue or green on CI evidence rather than by the Step 0 shortcut.
- Unchecked: the Ubuntu 26.04 riscv64 package, whether Debian or Fedora riscv64 builds carry riscv64-specific patches, and riscv64 test results.

## 14. Investment Analysis

**RISE coverage check.** RISE has no direct gRPC-Go involvement:
- No blog post names gRPC-Go. The posts examined were from [the feed](https://riseproject.dev/feed/) (2026-06-26 to 2026-10-20) plus the 2025-04-04 Go post.
- No repository in the riseproject-dev org targets gRPC-Go (43 repos in the org).
- No funded work or Developer Appreciation Program award for gRPC-Go was found. That program pays 500 EUR for small contributions and 3,000 EUR for large ones ([RVI Summit slides](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf)).
- Wiki pages were seen only as search snippets, not read in full.
- RISE does work on the Go runtime (RP001), which gRPC-Go inherits.
- `riseproject-dev/sw-ecosystem` tracks gRPC-Go in `projects.yml` (repo `https://github.com/grpc/grpc-go`, synonym "gRPC (Go)"). Its reports list gRPC-Go as a dependency of etcd, grafana, adk-go, openyurt, kmesh, gvisor, karmada, mtail, coredns, metal3-io, cadvisor, go-cloud, redis-operator, interlink, containerd, cloudnativepg, prometheus, opentelemetry, certificate-transparency-go, differential-privacy and probably others. The count (21 of 24 reports) comes from a single code-search page of 23 hits and may be incomplete.

Effort figures below are sizing estimates by the author, not sourced from the research. They assume no unexpected test failures.

### 14.1 Functional Enablement

Run the grpc-go test suite on riscv64: first under `qemu-riscv64`, then on native hardware (Spacemit X60 is the one board shown in the research). Triage failures, including tests with arch tags. If the suite passes, file the results upstream and in a new `project-reports/grpc-go.md`. Failures would be Go-toolchain or timing issues, since grpc-go has no arch code.

### 14.2 Performance Optimization

Establish the first riscv64 gRPC-Go baseline using the repo's `benchmark` directory and `run_bench.sh`. None exists today. Determine the fate of PR #9450 and its related #8790 and #9421, then decide whether to reopen the non-zeroing buffer pool work with the reported X60 numbers. Track golang/go#77541 as the toolchain-level performance factor. No sourced performance-gap figure for gRPC-Go itself exists, so sizing is limited to measurement.

### 14.3 CI/CD Infrastructure

Propose an upstream PR adding a riscv64 test job to testing.yml, using the arm64 job as the template and either a RISE `ubuntu-24.04-riscv` runner or QEMU. Optionally add riscv64 to the `protoc-gen-go-grpc` build matrix in release.yml. This is the item that would move the grade from Step 0 to CI-evidenced green.

### 14.4 Ecosystem Enablement

Dependents (etcd, containerd, prometheus and others) are pure-Go projects that consume gRPC-Go as source, so they gain nothing further from riscv64-specific work here. Confirm the transitive modules (x/sys, x/net, xxhash, gonum) behave on riscv64, and check the Ubuntu 26.04 riscv64 package.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Run full test suite under QEMU user-mode and on native riscv64 hardware, triage failures | 2 | RISE / Qualcomm | High |
| Functional | Write `project-reports/grpc-go.md` and run the unchecked graph and distro-patch queries | 0.5 | RISE | Medium |
| CI/CD | Upstream PR adding a riscv64 job to testing.yml (RISE runner or QEMU) | 2 | RISE with grpc-go maintainers | High |
| CI/CD | Add riscv64 to the `protoc-gen-go-grpc` release matrix | 0.5 | RISE with grpc-go maintainers | Low |
| Performance | Baseline gRPC-Go benchmarks on riscv64 versus arm64; determine #9450 status | 2 | RISE | Medium |
| Performance | Follow-up optimizations driven by baseline (scope unknown until measured) | Data not available | RISE | Low |
| Ecosystem | Verify transitive module behavior (x/sys, x/net, xxhash, gonum) and Ubuntu 26.04 package | 1 | RISE | Low |

## 15. References

- [grpc/grpc-go repository](https://github.com/grpc/grpc-go)
- [gRPC homepage](https://grpc.io/)
- [gRPC on Arm64](https://grpc.io/blog/grpc-on-arm64/)
- [grpc-go testing.yml](https://github.com/grpc/grpc-go/blob/master/.github/workflows/testing.yml)
- [grpc-go release.yml](https://github.com/grpc/grpc-go/blob/master/.github/workflows/release.yml)
- [grpc-go PR #9450](https://github.com/grpc/grpc-go/pull/9450)
- [grpc-go issue #3612](https://github.com/grpc/grpc-go/issues/3612)
- [golang/go issue #77541](https://github.com/golang/go/issues/77541)
- [openbao issue #42 (cites golang/go#27532 for Go riscv64 support)](https://github.com/openbao/openbao/issues/42)
- [Debian sid golang-google-grpc-dev](https://packages.debian.org/sid/golang-google-grpc-dev)
- [Ubuntu groovy riscv64 golang-google-grpc-dev 1.27.1-1](https://launchpad.net/ubuntu/groovy/riscv64/golang-google-grpc-dev/1.27.1-1)
- [Ubuntu focal golang-google-grpc-dev](https://blueprints.launchpad.net/ubuntu/focal/+package/golang-google-grpc-dev)
- [Fedora 41 riscv64 golang-google-grpc on ISCAS Koji](https://openkoji.iscas.ac.cn/koji/rpminfo?rpmID=8176)
- [Nixpkgs protoc-gen-go-grpc](https://mynixos.com/nixpkgs/package/protoc-gen-go-grpc)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=grpc-go)
- [PyPI grpc-go lookup (404)](https://pypi.org/pypi/grpc-go/json)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE: Advancing Go on RISC-V](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE members](https://riseproject.dev/members/)
- [RVI Summit EU 2026 slides (Henry, Egge)](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf)
- [riseproject-dev/sw-ecosystem](https://github.com/riseproject-dev/sw-ecosystem)
- [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels)
- [Nexthink gRPC performance comparison](https://nexthink.com/blog/comparing-grpc-performance)
- [kmcd.dev Go gRPC benchmark](https://kmcd.dev/posts/benchmarking-go-grpc/)
- [FOSDEM 2025 High Performance gRPC slides](https://fosdem.org/2025/events/attachments/fosdem-2025-4231-high-performance-grpc/slides/236895/High_Perf_yKkr4P8.pdf)