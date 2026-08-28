---
title: go-licenses
---

# go-licenses

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for go-licenses<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[go-licenses](https://github.com/google/go-licenses) is a command-line tool that audits license compliance for Go module dependency graphs. It traverses the module graph of a Go project, identifies the license of each dependency, and can generate CSV reports, save copies of all license files, or check that all licenses satisfy a policy. It contains no runtime, no library, no native code, and no numeric computation. Its workload is file I/O, text pattern matching, and module graph traversal -- all scalar and architecture-neutral.

**Governance.** The project is hosted under the `google` GitHub organization with the explicit disclaimer "This is not an officially supported Google product." No foundation membership, no formal governance document, no MAINTAINERS or CODEOWNERS file. Contributors must sign Google's CLA. The project follows Google's Open Source Community Guidelines.

**Corporate maintainers.**

| Contributor | Affiliation | Commits (approx.) |
|---|---|---|
| Yuan (Bob) Gong (Bobgy) | Google | 32 (primary maintainer) |
| Billy Lynch (wlynch) | Chainguard | 6 |
| Tim Ramlot (inteon) | Unaffiliated | 4 |
| Dave Protasowski (dprotaso) | Unaffiliated | 3 |

The project is effectively Google-maintained with opportunistic external contributions. No corporate co-sponsors. Activity is low: 58 open issues as of the research date, with the last substantive commit in September 2025. At least one open issue (#332) explicitly describes the project as not actively maintained [NEEDS VERIFICATION on current maintainer response].

**RISE involvement.** Google LLC is a Premier Member of the RISE Project. go-licenses is not individually listed by RISE and is not referenced in any RISE blog post. No RISE initiative covers this tool.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| February 2020 (Go 1.14) | linux/riscv64 added as a secondary port to the Go toolchain | [golang/go release notes](https://go.dev/doc/go1.14) |
| (no project-specific date) | go-licenses inherits riscv64 support passively; no porting work performed or required | GitHub search: 0 riscv commits |

No RISC-V-specific commits, issues, or pull requests exist in the google/go-licenses repository. The GitHub API search returned zero results across all vectors: issues, PRs, commits, and web search. There is no port history because there was nothing to port. The tool's architecture-agnostic design means linux/riscv64 has been supported since Go 1.14 with no action from go-licenses maintainers.

**Key contributors to riscv64 support:** None -- support is inherited from the Go toolchain team, not from go-licenses contributors.

**Fully upstream:** Yes, trivially. There are no downstream patches.

## 3. Upstream Support Tier

go-licenses defines no formal tier policy and has no PLATFORMS.md or SUPPORT.md. Because the tool has zero platform-specific code, "tier" in the traditional sense does not apply. The effective support level for any architecture is entirely determined by Go toolchain support for that architecture.

**Go toolchain tier for linux/riscv64:** Secondary port (Tier 2). Builds and releases are produced and published at [go.dev/dl](https://go.dev/dl), but broken riscv64 builders do not block Go releases.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds | Yes | Yes | Yes (inherited) |
| Tests pass | Yes | Yes | Not validated by project CI |
| Official binary from upstream | N/A (source-only releases) | N/A | N/A |
| CI runner exists in project | Yes (ubuntu-latest) | No | No |
| Go toolchain tier | Tier 1 | Tier 1 | Tier 2 (secondary) |

No pre-built binaries are released by the project for any architecture. All releases are source-only tags.

## 4. Technical Architecture and RISC-V-Specific Subsystems

go-licenses contains no architecture-specific code of any kind.

Full repository scan confirmed:

- Zero `.s` assembly files (only `go.sum` lockfiles match `.s` extension search)
- Zero CGo (`import "C"`) usage
- Zero `GOARCH`-conditional build tags (the one `//go:build tags` constraint found is a test fixture for custom build tag verification, not an architecture guard)
- Zero JIT backends
- Zero SIMD or vectorized routines
- Zero cryptographic primitives
- Zero hardware intrinsic usage
- Zero `arch/riscv/` or similar directories

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| License text classifier | Pure Go (no asm) | Pure Go (no asm) | Pure Go (no asm) |
| Module graph traversal | Pure Go | Pure Go | Pure Go |
| File I/O and text scanning | Pure Go | Pure Go | Pure Go |
| CLI parsing (cobra) | Pure Go | Pure Go | Pure Go |

No ISA extensions (RVV, Zba, Zbb, etc.) are relevant or used. There is nothing to rate.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Pure Go modules (`go.mod`/`go.sum`). No CMake, no Makefile, no Bazel, no C/C++ toolchain.

**Minimum Go version:** 1.23.0 (from `go.mod`). CI currently tests with Go 1.25.

**Build commands for riscv64:**

```
GOARCH=riscv64 GOOS=linux go build ./...
GOARCH=riscv64 GOOS=linux go install github.com/google/go-licenses/v2@latest
```

No `-tags`, `-ldflags`, or build flags are required. Cross-compilation is handled entirely by the Go toolchain with no project-specific configuration.

**QEMU:** Not used, not required by the project's CI or build system.

**Dockerfile:** The repository contains one `Dockerfile` based on `golang:1.18`. It does not specify `--platform linux/riscv64`. To build a riscv64 container image, add `--platform linux/riscv64` to the `FROM` lines or invoke `docker buildx build --platform linux/riscv64`. No `Dockerfile.riscv64` exists.

**Known build failures on riscv64:** None specific to go-licenses. The Go toolchain itself has an open J-type relocation overflow bug ([golang/go#79275](https://github.com/golang/go/issues/79275)) that can cause link-time failures for large binaries on riscv64. go-licenses is a small tool and is unlikely to trigger this in practice [NEEDS VERIFICATION -- no test data for go-licenses binary size on riscv64].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because go-licenses has no architecture-specific code paths, there are no functional gaps by construction.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| License CSV report | Full | Full | Full (no porting needed) |
| License file save | Full | Full | Full |
| License policy check | Full | Full | Full |
| Go module graph traversal | Full | Full | Full |
| Custom build tag handling | Full | Full | Full |

**Performance gaps:** Data not available: no benchmarks comparing go-licenses execution time across architectures exist in any surveyed source. Given the tool's workload (file I/O and text scanning), performance differences between architectures would be driven entirely by memory bandwidth and branch prediction, not by missing SIMD or other vectorized acceleration.

**Security hardening gaps:** None specific to go-licenses. The Go toolchain's FIPS140 + PIE combination is broken on riscv64 ([golang/go#74683](https://github.com/golang/go/issues/74683)), but go-licenses does not use FIPS mode.

**Floating-point / NaN issues:** Not applicable. go-licenses performs no floating-point computation.

## 7. CI/CD Infrastructure

The repository contains exactly two workflow files.

**`.github/workflows/go.yml`:**
- Trigger: push to `master`/`main` and tags matching `v*`; pull requests
- Runner: `runs-on: ubuntu-latest` (x86_64 only)
- Steps: `go build -v ./...` and `go test -v ./...` with no `GOARCH` environment variable, no cross-compilation matrix, no QEMU action

**`.github/workflows/golangci-lint.yml`:**
- Trigger: same push/PR triggers
- Runner: `runs-on: ubuntu-latest` (x86_64 only)
- Steps: lint only; no build, no test, no architecture references

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner exists | Yes (ubuntu-latest) | No | No |
| Cross-compilation tested | No | No | No |
| QEMU emulation | No | No | No |
| RISE-hosted runner | No | No | No |
| Nightly build | No | No | No |

No riscv64 CI exists. Any riscv64 compatibility is untested by the project. Compatibility is inherited from the Go toolchain and assumed rather than verified.

## 8. Distribution and Release Status

**Upstream releases:** All releases (v2.0.1, v2.0.0, v2.0.0-alpha.1, v1.6.0, v1.5.0) have zero binary assets. The project distributes exclusively as source via Go module install.

**PyPI:** HTTP 404. go-licenses has no Python package and no presence on PyPI.

**Ubuntu 24.04 (Noble):** Not packaged. Search on [packages.ubuntu.com](https://packages.ubuntu.com) returned no results.

**Debian:** Not packaged. [tracker.debian.org/pkg/go-licenses](https://tracker.debian.org/pkg/go-licenses) returned HTTP 404. packages.debian.org search across all suites returned no results.

**Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at)):** Not present in the Arch RISC-V port repository.

**To obtain a working riscv64 binary, a user must:**

```
GOARCH=riscv64 GOOS=linux go install github.com/google/go-licenses/v2@latest
```

This requires a Go toolchain >= 1.23.0 and internet access to the Go module proxy. No pre-built binary is available from any upstream or distribution channel surveyed.

## 9. Dependencies

go-licenses v2.0.1 (latest release, 2025-09-08) uses Go modules with no CGo dependencies. All dependencies are pure Go.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Go toolchain (golang/go) | Runtime, compiler, stdlib | Yes (secondary port) | Partial -- race builder slow (#78258), 3 RVA22U64 bots broken (#79067-79069) | Yes (since Go 1.14) | Open memory corruption bug #78161 (Go 1.26.1 on linux/riscv64); J-type relocation OOB #79275 |
| golang.org/x/tools | Go AST/package analysis, core license detection engine | Yes (no arch-specific code) | Flaky on riscv64 -- gopls deadline failures (#49321, open since 2021) | Yes | Flakiness is timeout/performance on slow hardware, not correctness |
| google/licenseclassifier/v2 | License text classification algorithm | Yes (pure Go, no asm) | Not tested on riscv64 (no CI matrix) | Yes (Go module) | No architecture-blocking issues |
| golang.org/x/mod | Go module graph parsing | Yes | Tested via Go CI infrastructure | Yes | No riscv64-specific issues |
| golang.org/x/net | HTTP client (transitive via httpreplay) | Yes | Tested via Go CI | Yes | No riscv64-specific issues |
| golang.org/x/text | Unicode text processing | Yes | Tested via Go CI | Yes | No riscv64-specific issues |
| golang.org/x/sync | Concurrency primitives (errgroup) | Yes | Tested via Go CI | Yes | No riscv64-specific issues |
| golang.org/x/sys | Low-level OS syscalls (indirect) | Yes (includes riscv64 syscall tables) | Tested | Yes | No riscv64-specific issues |
| spf13/cobra | CLI flag parsing | Yes | Test failure with Go 1.26 (cobra#2422 -- `%q` format change, not riscv64-specific) | Yes | Not a riscv64 blocker |
| go.opencensus.io | Telemetry/tracing (indirect via go-replayers) | Yes (pure Go) | Not riscv64-specific | Yes | Project in maintenance mode, superseded by OpenTelemetry |
| google/go-cmp | Deep equality (test dependency) | Yes | No riscv64-specific issues | Yes | No concerns |
| k8s.io/klog/v2 | Structured logging | Yes (pure Go) | No riscv64-specific issues | Yes | No concerns |

**Critical dependency deep-dive: Go toolchain**

The Go toolchain is the only dependency with material riscv64-specific risk. Active issues as of the research date:

- [golang/go#78161](https://github.com/golang/go/issues/78161): Memory corruption on linux/riscv64 in Go 1.26.1. Affects any Go binary on riscv64; severity unknown for go-licenses specifically.
- [golang/go#79275](https://github.com/golang/go/issues/79275): J-type relocation overflow (OOB) can cause link-time failure for large binaries. go-licenses is a small binary; unlikely to trigger in practice [NEEDS VERIFICATION].
- [golang/go#74683](https://github.com/golang/go/issues/74683): FIPS140 + `-buildmode=pie` broken on riscv64. go-licenses does not use FIPS mode; not a blocker.
- [golang/go#78258](https://github.com/golang/go/issues/78258): Race detector builder too slow on riscv64. Does not affect production builds.

No other dependency in go-licenses has JIT, SIMD, vectorized numerics, or hardware crypto -- there is nothing to recurse into.

## 11. Known Bugs and Active Issues

**RISC-V-specific bugs in go-licenses:** None. GitHub issue search for "riscv", "riscv64", and "RISC-V" in the google/go-licenses repository returned zero results.

**General open issues of relevance:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| #339 | Apache-2 header not recognized | Open (2026-04-16) | Medium | License detection correctness; architecture-neutral |
| #337 | Go workspaces not properly supported | Open (2025-12-03) | Medium | Functional gap for workspace-mode projects |
| #335 | Misinterprets `./...`, checks stdlib unless on go 1.25 | Open (2025-09-05) | Medium | Correctness bug in scope handling |
| #332 | Project described as not actively maintained | Open (2025-11-07) | High (organizational) | Maintainer bandwidth concern |
| #324 | Fails with `go 1.N.P` go.mod syntax | Open (2025-04-23) | Medium | Compatibility regression with newer go.mod formats |
| #312 | Incompatibility with Go 1.24 | Open (2025-08-05) | High | Toolchain compatibility regression |
| #205 | Prepare for v2 release | Open (2025-11-17) | Low | Release management |

No correctness bugs specific to riscv64 exist. Issue #312 (Go 1.24 incompatibility) and cobra#2422 (Go 1.26 test failure) are cross-architecture issues, not riscv64-specific.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer has objected to riscv64 support; the topic has not been raised.

**Technical blockers:** None. The tool has no architecture-specific code to block or enable. Any platform supported by the Go toolchain is automatically supported.

**Organizational blockers:** Issue #332 describes the project as not actively maintained. Patches requiring maintainer review may face slow or no response [NEEDS VERIFICATION on current maintainer availability].

**Acceptance probability for riscv64-related contributions:** High, because no contribution is needed. If a CI addition were proposed (riscv64 QEMU job), acceptance probability is moderate given low maintainer activity.

## 13. Investment Analysis

### 13.1 Functional Enablement

No functional enablement work is required. go-licenses is fully functional on riscv64 today via `GOARCH=riscv64 GOOS=linux go install`. There are no missing code paths, no porting gaps, and no architecture-specific features to enable.

### 13.2 Performance Optimization

Not applicable. go-licenses has no SIMD, vectorized, or numerically intensive code paths. Performance on riscv64 is bounded by the Go runtime's scalar code generation and system call overhead, not by any go-licenses-specific implementation. No optimization investment in this project would yield measurable impact.

### 13.3 CI/CD Infrastructure

The project has no riscv64 CI. Adding a QEMU-based riscv64 job to `.github/workflows/go.yml` would validate the inherited support claim but would provide marginal value given the tool's architecture-neutral implementation. The main risk is flaky tests from slow QEMU execution rather than actual riscv64 failures.

### 13.4 Ecosystem Enablement

Not applicable. go-licenses is a standalone developer tool with no dependent package ecosystem. It does not expose a library API consumed by other packages, and it has no plugin or extension system.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | N/A | N/A |
| Performance | None applicable | 0 | N/A | N/A |
| CI/CD | Add GOARCH=riscv64 cross-compilation check to go.yml | 0.25 | Contributor (Google or RISE) | Low |
| Ecosystem | None applicable | 0 | N/A | N/A |

Total investment required for riscv64 enablement: effectively zero. The only discretionary item is a trivial CI addition to provide ongoing validation, which has no functional dependency and low priority.

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

## 15. References

- [google/go-licenses GitHub repository](https://github.com/google/go-licenses)
- [go-licenses releases (all versions)](https://github.com/google/go-licenses/releases)
- [go-licenses .github/workflows/go.yml](https://github.com/google/go-licenses/blob/master/.github/workflows/go.yml)
- [go-licenses .github/workflows/golangci-lint.yml](https://github.com/google/go-licenses/blob/master/.github/workflows/golangci-lint.yml)
- [go-licenses go.mod](https://github.com/google/go-licenses/blob/master/go.mod)
- [go-licenses issue #332 -- project not actively maintained](https://github.com/google/go-licenses/issues/332)
- [go-licenses issue #312 -- Go 1.24 incompatibility](https://github.com/google/go-licenses/issues/312)
- [go-licenses issue #205 -- v2 release preparation](https://github.com/google/go-licenses/issues/205)
- [golang/go issue #78161 -- memory corruption on linux/riscv64 in Go 1.26.1](https://github.com/golang/go/issues/78161)
- [golang/go issue #79275 -- J-type relocation OOB on riscv64](https://github.com/golang/go/issues/79275)
- [golang/go issue #74683 -- FIPS140 broken with -buildmode=pie on riscv64](https://github.com/golang/go/issues/74683)
- [golang/go issue #78258 -- race builder too slow on riscv64](https://github.com/golang/go/issues/78258)
- [golang/x/tools issue #49321 -- gopls deadline failures on riscv64](https://github.com/golang/tools/issues/49321)
- [spf13/cobra issue #2422 -- test suite broken on Go 1.26](https://github.com/spf13/cobra/issues/2422)
- [Go 1.14 release notes -- linux/riscv64 added](https://go.dev/doc/go1.14)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE blog: Advancing Go on RISC-V (2025-04-04)](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- [Debian package tracker -- go-licenses (404)](https://tracker.debian.org/pkg/go-licenses)
- [Ubuntu packages search -- Noble](https://packages.ubuntu.com/search?keywords=go-licenses&suite=noble)