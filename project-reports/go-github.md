---
title: go-github
---

# go-github

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for go-github<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[go-github](https://github.com/google/go-github) is a pure-Go client library for the GitHub v3 REST API. It wraps HTTP endpoints as typed Go methods, handles pagination, authentication (OAuth2, PAT, JWT), and rate-limit signaling. It contains no C, no assembly, no cgo, and no SIMD. Every operation is network I/O followed by JSON (de)serialization using the standard `encoding/json` package.

**License:** BSD-3-Clause.

**Governance:** Hosted under the `google` GitHub organization. No independent foundation membership. Maintainer-led model: a `REVIEWERS` file lists community reviewers. Becoming a reviewer requires submitting a PR adding one's username. All contributors must sign the Google CLA; Google retains redistribution rights with no copyright transfer. PRs are squash-merged only; linear history is enforced. AI-assisted contributions are permitted with disclosure.

**Corporate sponsors and top contributors:**

| Handle | Name | Organization |
|--------|------|--------------|
| gmlewis | Glenn Lewis | Historically Google (primary author) |
| willnorris | Will Norris | Tailscale |
| alexandear | Oleksandr Redko | Independent |
| stevehipwell | Steve Hipwell | LexisNexis Risk Solutions |
| dmitshur | Dmitri Shuralyov | Google, Go team |
| wlynch | Billy Lynch | Chainguard |

The project originated at Google and lives under the `google` org. Active maintenance is distributed across Google, LexisNexis, Tailscale, Chainguard, and independent contributors. Google LLC is a RISE Premier Member, but go-github itself is not listed as a RISE project and has received no RISE-funded work.

**Community stance on new ports:** Not applicable. go-github is architecture-neutral by design. It compiles and runs on any platform the Go toolchain supports. No port approval process exists and none is needed.

---

## 2. Port History and Upstreaming Timeline

There is no RISC-V port history for go-github because no port was ever required. The library is pure Go. RISC-V support was inherited automatically when the Go toolchain gained `linux/riscv64` in Go 1.14 (released February 2020).

| Date | Event | Source |
|------|-------|--------|
| Feb 2020 | Go 1.14 ships with `linux/riscv64` support; go-github becomes riscv64-compatible with zero changes | [Go 1.14 release notes](https://go.dev/doc/go1.14) |
| 2025-04 | RISE RP001 blog post describes Go runtime/compiler RISC-V improvements (vectorized bytealg, crypto, math/big); go-github benefits as a transitive consumer of the Go runtime | [RISE blog 2025-04-04](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/) |

No go-github-specific porting commits, tracking issues, or milestones exist. `gh search commits "riscv repo:google/go-github"` returns 0 results. `gh search commits "riscv64 repo:google/go-github"` returns 0 results.

---

## 3. Upstream Support Tier

go-github has no formal platform tier policy. The project's implicit position is: "runs on everything Go supports." Since Go ships official `linux/riscv64` tarballs with each release and go-github requires no architecture-specific code, riscv64 is de facto fully supported.

**Comparison: amd64 vs arm64 vs riscv64**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Compiles | Yes | Yes | Yes |
| Tests pass | Yes (CI-verified) | Not CI-verified [NEEDS VERIFICATION] | Not CI-verified [NEEDS VERIFICATION] |
| Official binary release | N/A - library only | N/A | N/A |
| Architecture-specific code | None | None | None |
| Formal tier designation | None | None | None |

CI runs only on `ubuntu-latest` (x86-64) and `windows-latest`. No arm64 or riscv64 runner exists. Given zero architecture-specific code, test failures on non-x86 would indicate a Go toolchain defect, not a go-github defect.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

go-github has no architecture-specific subsystems. The complete inventory:

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| HTTP client / REST API layer | Pure Go | Pure Go | Pure Go | net/http from stdlib |
| JSON serialization | Pure Go | Pure Go | Pure Go | encoding/json from stdlib |
| Authentication (OAuth2, PAT, JWT) | Pure Go | Pure Go | Pure Go | No crypto assembly in go-github itself |
| Pagination / rate-limit helpers | Pure Go | Pure Go | Pure Go | |
| Assembly files (.s/.S) | 0 | 0 | 0 | Confirmed by full tree scan of 628 files |
| Arch-suffix Go files (_riscv64.go etc.) | 0 | 0 | 0 | Confirmed by full tree scan |
| JIT | None | None | None | |
| SIMD | None | None | None | |
| GC barriers | Inherited from Go runtime | Inherited | Inherited | Not in go-github source |

The only RISC-V-adjacent signal is transitive: go-github depends on `golang.org/x/crypto`, and a dependency bump (Dependabot PR #4465, closed without merge, superseded) referenced an upstream commit adding riscv64 Poly1305 assembly. This benefits TLS connection setup on riscv64 but is not a go-github change.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Standard Go modules. No CMake, no autoconf, no Makefile, no Dockerfile.

**Required toolchain:** Go 1.25.0 (from `go.mod`). The project tracks Go N and N-1 stable releases.

**Build commands:**

```
go build ./...
go test -race -covermode atomic -coverprofile coverage.txt ./...
```

**Cross-compilation for riscv64** (no project-specific steps required):

```
GOARCH=riscv64 GOOS=linux go build ./...
GOARCH=riscv64 GOOS=linux go test -c ./...
```

No GCC/Clang toolchain is required. No cgo is used. No QEMU is needed to build or cross-compile. Running the compiled test binary natively requires a riscv64 host or QEMU user-mode emulation, but go-github itself documents neither.

**Known build failures on riscv64:** None found. `gh search issues "riscv repo:google/go-github"` returns 0 results.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

There are no functional gaps between riscv64, arm64, and amd64 for go-github. The library exposes GitHub REST API endpoints. All functionality is conditional on network access and API availability, not CPU architecture.

| Feature area | amd64 | arm64 | riscv64 | Gap |
|-------------|-------|-------|---------|-----|
| REST API coverage (all endpoints) | Full | Full | Full | None |
| Authentication methods | Full | Full | Full | None |
| Pagination | Full | Full | Full | None |
| Webhook parsing | Full | Full | Full | None |
| Rate-limit handling | Full | Full | Full | None |
| JSON streaming | Full | Full | Full | None |

**Performance:** go-github is I/O-bound (network + JSON). CPU architecture does not materially affect throughput. No architecture-specific benchmark data exists. The one open performance issue (#4195, proposing `sync.Pool` for request buffers) is generic and applies equally to all architectures.

**Security hardening:** No architecture-specific hardening exists in go-github. The Go runtime provides stack bounds checking and memory safety uniformly across all supported architectures.

**Floating-point:** Not applicable. go-github performs no floating-point computation.

---

## 7. CI/CD Infrastructure

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI runner exists | Yes (`ubuntu-latest`, `windows-latest`) | No | No |
| Go versions tested | stable, oldstable | - | - |
| Race detector enabled | Yes (`-race`) | - | - |
| Coverage reporting | Yes | - | - |
| RISE runner in use | No | No | No |

**Workflow files:**

- `.github/workflows/tests.yml` - runs `go test -race` on `ubuntu-latest` and `windows-latest` with Go stable and oldstable. No architecture matrix. No riscv64 entry.
- `.github/workflows/linter.yml` - runs `check-generated`, `golangci-lint`, `check-openapi` on `ubuntu-latest` only.

These are the only two CI files in the repository. No `.cirrus.yml`, `.travis.yml`, Jenkinsfile, or `.gitlab-ci.yml` exists.

**RISE runners:** go-github is not listed among RISE runner users. The RISE "Six Weeks In" blog post (2026-05-12) names llama.cpp, PyTorch, post-quantum crypto, NumPy, k0s, and Kairos; go-github is absent.

---

## 8. Distribution and Release Status

go-github is a Go library. Upstream does not ship precompiled binaries. GitHub releases (v86.0.0 through v90.0.0 checked) have `"assets": []` - zero binary assets of any kind.

**Package availability:**

| Distribution | Package name | Version | riscv64 status |
|-------------|-------------|---------|----------------|
| Ubuntu 24.04 (Noble) | `golang-github-google-go-github-dev` | 60.0.0-1 | arch:all - installs on riscv64 without architecture-specific build |
| Debian sid | `golang-github-google-go-github-dev` | 60.0.0-2 | arch:all - same as above |
| Arch Linux RISC-V (archriscv.felixc.at) | Not packaged | - | Not available |
| PyPI | Not applicable | - | Not a Python package |

**What a user must do:** `go get github.com/google/go-github/v70@latest` (or current major version). The Go module proxy delivers source; the local Go toolchain compiles it. No riscv64-specific steps.

Note: Debian and Ubuntu package version 60.0.0 while upstream is at v90+. The packaging lag is significant but not a riscv64-specific issue.

---

## 9. Dependencies

go-github declares two direct module dependencies beyond the Go standard library.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|-----------|------|---------------|--------------|-----------------|-----------------|
| Go runtime (golang.org/go) | Language runtime, GC, goroutines, net/http, crypto/tls | Supported since Go 1.14; GORISCV64 profiles rva20u64/rva22u64/rva23u64 | linux/riscv64 builders exist upstream; bbw-2 and bbw-3 broken as of 2026-06-14; LUCI builder being added (issue #80880) | Official linux/riscv64 tarballs shipped with each Go release | Builder instability is an upstream Go infrastructure issue, not a go-github blocker |
| google/go-cmp v0.7.0 | Test-only deep equality comparisons | Pure Go, compiles on any GOARCH | CI covers ubuntu-latest and macos-latest; no riscv64 runner, but no arch-gated code | Go module source, no binary release needed | None |
| google/go-querystring v1.2.0 | URL query-string encoding for API request structs | Pure Go, reflection-based, no arch-specific code | CI covers ubuntu-latest and windows-latest; no riscv64 runner, but no arch-gated code | Go module source, no binary release needed | None |

The only dependency with riscv64-specific engineering is the Go runtime. RISE RP001 has delivered vectorized `internal/bytealg`, crypto assembly (md5, sha256, sha512), `math/big` assembly, runtime extension detection, and Bitmanip compiler output for riscv64. These improvements benefit all Go programs including go-github transparently.

Neither go-cmp nor go-querystring appear in `scope.yml` and neither requires architecture-specific work.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist. `gh search issues "riscv repo:google/go-github"` and `gh search issues "riscv64 repo:google/go-github"` both return 0 results.

**General open issues with potential relevance:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| #4195 | perf: Boost decoding throughput and eliminate payload buffer allocations in core client | Open | Low | Proposes sync.Pool for request buffers and json.Unmarshal over json.NewDecoder. Claims ~30-50% CPU time reduction per decode cycle. Generic - applies equally to all architectures. Maintainers have not verified the benchmark numbers. |
| #4457 | Including an enterprise team as a reviewer for an environment results an unmarshal error | Open | Medium | JSON unmarshalling correctness bug. Not architecture-specific. |
| #4365 | Auth transports add credentials after cross-origin redirects | Open | Medium | Security/correctness issue. Not architecture-specific. |

**Correctness bugs on riscv64:** None found.

---

## 12. Objections and Upstream Blockers

No upstream objections, stated or implied, to riscv64 exist. The project's architecture-neutral design means riscv64 is already supported. There are no organizational blockers, no porting gatekeepers, and no technical blockers.

The sole external dependency that could block riscv64 use is the Go toolchain itself. The two broken Go linux/riscv64 builders (bbw-2 and bbw-3, open since 2026-06-14) are infrastructure issues that could delay Go patch releases but do not block library compilation or use. See `project-reports/go.md` for details.

---

## 13. Investment Analysis

go-github requires no RISC-V investment. It is a pure-Go library that has been riscv64-compatible since Go 1.14 shipped in February 2020 with no action from go-github maintainers or any third party.

RISE has not funded any go-github work and none is warranted.

### 13.1 Functional Enablement

No work required. All API functionality works on riscv64 today.

### 13.2 Performance Optimization

No work required. The library is I/O-bound. CPU architecture does not limit throughput. The one open performance proposal (#4195) is generic and not RISC-V-specific; contributing to its resolution would benefit all architectures equally.

### 13.3 CI/CD Infrastructure

The only actionable item would be adding a riscv64 CI runner to `tests.yml` to provide explicit verification. Given zero architecture-specific code, the expected return on this investment is low: a riscv64 CI job would validate the Go toolchain's riscv64 port, not any go-github logic. If RISE riscv64 runners are free, adding one is low-cost and improves downstream confidence.

Effort: 1-2 person-days to open a PR adding `ubuntu-24.04-riscv` to the test matrix and obtain maintainer approval.

### 13.4 Ecosystem Enablement

Not applicable. go-github is a library consumed by applications. There is no dependent package ecosystem that requires separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add riscv64 runner to tests.yml | 0.1 | External contributor | Low |
| Functional | None required | 0 | - | - |
| Performance | None required | 0 | - | - |
| Ecosystem | None required | 0 | - | - |

**Total estimated investment: less than one person-day.**

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [go-github repository](https://github.com/google/go-github)
- [go-github tests.yml CI workflow](https://github.com/google/go-github/blob/master/.github/workflows/tests.yml)
- [go-github linter.yml CI workflow](https://github.com/google/go-github/blob/master/.github/workflows/linter.yml)
- [go-github open issue #4195: perf: Boost decoding throughput](https://github.com/google/go-github/issues/4195)
- [go-github open issue #4457: enterprise team reviewer unmarshal error](https://github.com/google/go-github/issues/4457)
- [go-github open issue #4365: auth transports add credentials after cross-origin redirects](https://github.com/google/go-github/issues/4365)
- [go-github Dependabot PR #4465: Bump golang.org/x/crypto](https://github.com/google/go-github/pull/4465)
- [Go 1.14 release notes - linux/riscv64 support](https://go.dev/doc/go1.14)
- [Ubuntu 24.04 package: golang-github-google-go-github-dev](https://packages.ubuntu.com/noble/golang-github-google-go-github-dev)
- [Debian tracker: golang-github-google-go-github](https://tracker.debian.org/pkg/golang-github-google-go-github)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- [RISE blog: Advancing Go on RISC-V (2025-04-04)](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE blog: RISC-V Runners Six Weeks In (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE blog: Announcing the RISE RISC-V Runners (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE member list](https://riseproject.dev/members/)
- [Go issue #79068: linux/riscv64 builder bbw-2 broken](https://github.com/golang/go/issues/79068)
- [Go issue #79069: linux/riscv64 builder bbw-3 broken](https://github.com/golang/go/issues/79069)
- [Go issue #80880: add LUCI linux/riscv64 builder](https://github.com/golang/go/issues/80880)
- [google/go-cmp repository](https://github.com/google/go-cmp)
- [google/go-querystring repository](https://github.com/google/go-querystring)