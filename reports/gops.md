---
title: gops
---

# gops

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for gops<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[gops](https://github.com/google/gops) is a command-line tool for listing and diagnosing Go processes running on a system. It attaches to a running Go binary via a TCP agent (injected by importing `github.com/google/gops/agent`) and exposes runtime diagnostics: goroutine stacks, heap profiles, CPU profiles, GC stats, and Go version detection. It is used for ad-hoc process inspection, not production observability infrastructure.

The project is hosted under the `google` GitHub organization. It has no MAINTAINERS, OWNERS, or CODEOWNERS file. Governance is informal. The original author is Jaana Dogan (rakyll, Google) who created the project in November 2016 and was its primary contributor through approximately 2019. The de facto current maintainer is Tobias Klauser (tklauser, Cilium/Isovalent), who has handled CI, dependency updates, bug fixes, and Go version compatibility from approximately 2020 onward. There is no foundation affiliation and no RISE Project membership.

The project is not in the `scope.yml` tracking list for this repository. No RISE blog post, RISE webinar transcript, or RISE wheel-builder listing references gops.

License: BSD-3-Clause.

Community stance on new ports: not applicable. gops has no architecture-specific code at any level; it does not require porting. Any platform that the Go toolchain supports (including `linux/riscv64`) builds gops without changes.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Nov 2016 | Project created by Jaana Dogan (Google) | [github.com/google/gops](https://github.com/google/gops) initial commit |
| 2021 | Dependency update for `windows/arm64` (gopsutil + go-ole) | Commit `e9831286` [NEEDS VERIFICATION - single source] |
| Jan 2026 | v0.3.29 released (latest as of research date) | [github.com/google/gops/releases/tag/v0.3.29](https://github.com/google/gops/releases/tag/v0.3.29) |

No RISC-V-specific commit, issue, or PR exists in the repository. A complete search of all 272 issues, 260+ PRs, and commit history returned zero riscv/riscv64 results. No porting work was required or performed; riscv64 support was inherited from the Go toolchain without any changes to gops itself.

---

## 3. Upstream Support Tier

No formal platform tier or support matrix is documented. There is no PLATFORMS.md, SUPPORT.md, or equivalent. The implicit policy is: if Go supports the platform, gops supports the platform.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds from source | Yes | Yes | Yes |
| CI coverage | Yes (ubuntu-latest) | Partial (macos-latest, which is arm64) | No |
| Official pre-built binary | No | No | No |
| Distribution packages | No | No | No |
| Release artifact | Source tag only | Source tag only | Source tag only |

The project ships no pre-built binaries for any architecture. All GitHub releases (v0.3.25 through v0.3.29) have `"assets": []` - empty asset lists confirmed via the GitHub releases API. The absence of riscv64 binaries is not a RISC-V-specific gap; it reflects the project's source-only release policy.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

gops has 28 Go source files and no architecture-specific code of any kind. There is no assembly, no JIT backend, no SIMD dispatch, no crypto primitive implementation, no GC barrier code, and no ISA-specific build tags in the gops codebase itself.

| Component | Description | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Process enumeration (goprocess/) | Uses `debug/buildinfo.ReadFile()` (Go 1.18+) to read ELF/Mach-O/PE generically | Full | Full | Full |
| Agent networking (agent/) | TCP socket with `SO_REUSEPORT` via `golang.org/x/sys/unix`; build tag `!js && !plan9 && !solaris && !windows` includes linux/riscv64 | Full | Full | Full |
| Process statistics | Delegated to `github.com/shirou/gopsutil/v3`; uses generic `_linux.go` path on all Linux architectures | Full | Full | Full |
| Pre-Go-1.18 version detection | `rsc.io/goversion` contains an `amd64Matcher` assembly scanner with no riscv64 equivalent | Full | Partial [NEEDS VERIFICATION] | Gap (moot) |

The pre-1.18 gap in `rsc.io/goversion` is not actionable: gops declares `go 1.18` in its `go.mod`, making the legacy code path unreachable on any architecture under the current build requirements.

No ISA extensions (RVV, Zba, Zbb, Zbc, Vector Crypto) are used or relevant. gops performs no numeric computation, no cryptographic operations, and no memory-bandwidth-sensitive work.

---

## 5. Build System, Cross-Compilation, and Toolchain

gops uses the standard Go module build system. There is no CMake, no Meson, no Bazel, no Makefile, no Dockerfile, and no configure script in the repository.

**Build commands for riscv64:**

```sh
# Cross-compile from any host
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build github.com/google/gops

# Or install directly on a riscv64 host
go install github.com/google/gops@latest
```

**Required Go version:** 1.18 minimum (declared in `go.mod`). Go has supported `linux/riscv64` since Go 1.14. All Go versions that satisfy the gops minimum (1.18+) include riscv64 Linux support.

**CGO:** Not required. The key dependency `github.com/shirou/gopsutil/v3` explicitly tests `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0` in its CI lint matrix, confirming CGO-free cross-compilation works end to end.

**QEMU:** Not required for the build. QEMU would only be needed to execute riscv64 test binaries on non-riscv64 hardware; no CI or documented workflow uses it.

**Known build failures:** None. No build failure reports exist for any platform in the gops issue tracker.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| List running Go processes | Full | Full | Full |
| Attach agent and query stats | Full | Full | Full |
| Heap/CPU profile collection | Full | Full | Full |
| Goroutine stack dump | Full | Full | Full |
| Go version detection (Go 1.18+ binaries) | Full | Full | Full |
| Go version detection (pre-Go-1.18 binaries) | Full | Partial [NEEDS VERIFICATION] | Gap |

The riscv64 gap in pre-Go-1.18 binary version detection is an inherited limitation from `rsc.io/goversion` (which only ships an `amd64Matcher`). In practice this is irrelevant: no production environment should be running Go binaries older than 1.18 in 2026, and gops itself requires Go 1.18 to build.

No functional gaps exist for the primary use cases on `linux/riscv64`. No floating-point semantics issues, NaN-handling bugs, or correctness regressions have been reported. Data not available: independent validation of process inspection correctness on actual riscv64 hardware.

---

## 7. CI/CD Infrastructure

The single CI file is [`.github/workflows/test.yml`](https://github.com/google/gops/blob/master/.github/workflows/test.yml). Its runner matrix covers exactly:

- `ubuntu-latest` (x86_64)
- `macos-latest` (arm64 or x86_64 depending on GitHub runner pool)
- `windows-latest` (x86_64)

Go versions tested: 1.18, 1.22, 1.23. The job runs `go test -race -v ./...` natively on each host. There is no `GOARCH=riscv64` cross-compilation step, no QEMU emulation, no Docker-based cross-arch runner, and no self-hosted riscv64 runner anywhere in the file. The word "riscv" does not appear in the CI file.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | Yes (ubuntu-latest) | Yes (macos-latest) | No |
| Cross-compile check | No | No | No |
| Race detector test | Yes | Yes | No |
| QEMU emulation test | No | No | No |
| RISE CI runner | No | No | No |

No RISE CI infrastructure is involved with this project.

---

## 8. Distribution and Release Status

**Pre-built binaries:** None. All releases from v0.3.25 through v0.3.29 have zero uploaded assets (confirmed via GitHub releases API: `"assets": []`). This is universal, not riscv64-specific.

**Package manager presence:**

| Channel | riscv64 status | Notes |
|---|---|---|
| GitHub Releases | Not available | No binaries for any arch |
| PyPI | Not applicable | Not a Python package |
| Debian | Not packaged | tracker.debian.org/pkg/gops returns HTTP 404 |
| Ubuntu Noble | Not packaged | Only `golang-github-shirou-gopsutil-dev` (different project) found |
| Arch Linux (x86_64) | Not packaged | Only `gopsuinfo` (different project) found |
| Arch Linux RISC-V (archriscv.felixc.at) | Not packaged | No result |
| RISE wheel builder | Not tracked | Not a Python wheel |

**To obtain a working riscv64 binary:**

```sh
go install github.com/google/gops@latest
```

This is the only supported path. It works on any Go-supported platform including `linux/riscv64` with no flags or workarounds.

---

## 9. Dependencies

| Dependency | Version | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|---|
| Go toolchain | >= 1.18 | Compiler, runtime, standard library | Full (since Go 1.14) | Native hardware CI exists (RVA22 bots) | All Go 1.18+ releases | Two CI bots broken as of April 2026 (issues [#79068](https://github.com/golang/go/issues/79068), [#79069](https://github.com/golang/go/issues/79069)); no build blocker |
| [golang.org/x/sys](https://pkg.go.dev/golang.org/x/sys) v0.30.0 | OS syscalls, socket options | Full - 19 riscv64-specific files in unix package | No riscv64 CI runner | Ships in x/sys releases | None |
| [github.com/shirou/gopsutil/v3](https://github.com/shirou/gopsutil) v3.24.5 | Process/CPU/memory/disk stats | Full on Linux (generic `_linux.go` paths) | No riscv64-native CI; CI lint matrix includes `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0` | Ships in gopsutil releases | FreeBSD/riscv64 only: [issue #1425](https://github.com/shirou/gopsutil/issues/1425) (open since 2023-03-02, unmerged fix in [PR #1652](https://github.com/shirou/gopsutil/pull/1652)); Linux unaffected |
| [github.com/spf13/cobra](https://github.com/spf13/cobra) v1.9.1 | CLI argument parsing | Full (pure Go) | Platform-agnostic | Ships regularly | None |
| [github.com/xlab/treeprint](https://github.com/xlab/treeprint) v1.2.0 | ASCII tree output | Full (pure Go) | Platform-agnostic | Stable | None |
| [rsc.io/goversion](https://pkg.go.dev/rsc.io/goversion) v1.2.0 | Go version detection in binaries | Full for Go 1.18+ binaries; amd64-only assembly scanner for pre-1.18 (unreachable) | Platform-agnostic for current code path | Stable | None |
| [github.com/tklauser/go-sysconf](https://github.com/tklauser/go-sysconf) v0.3.12 (indirect) | sysconf() wrapper | Full via x/sys | No riscv64 CI | Transparent | None |
| [github.com/tklauser/numcpus](https://github.com/tklauser/numcpus) v0.6.1 (indirect) | CPU count helper | Full (pure Go + x/sys) | Platform-agnostic | Transparent | None |
| github.com/go-ole/go-ole v1.2.6 (indirect) | Windows COM | Not used on Linux/riscv64 | N/A | N/A | N/A |
| github.com/shoenig/go-m1cpu v0.1.6 (indirect) | Apple M1 CPU detection | Not used on Linux/riscv64 | N/A | N/A | N/A |
| github.com/lufia/plan9stats (indirect) | Plan 9/BSD stats | Not used on Linux | N/A | N/A | N/A |
| github.com/power-devops/perfstat (indirect) | AIX perfstat | Not used on Linux | N/A | N/A | N/A |
| github.com/yusufpapurcu/wmi (indirect) | Windows WMI | Not used on Linux | N/A | N/A | N/A |

The one open RISC-V issue in the dependency tree is [gopsutil#1425](https://github.com/shirou/gopsutil/issues/1425), which affects `disk` stats on FreeBSD/riscv64 only. Linux deployments are unaffected.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [shirou/gopsutil#1425](https://github.com/shirou/gopsutil/issues/1425) | Missing support for riscv64 FreeBSD | Open (since 2023-03-02) | Low | FreeBSD only; compile-time failure for disk stats. Fix proposed in unmerged [PR #1652](https://github.com/shirou/gopsutil/pull/1652). Does not affect Linux/riscv64. |
| golang/go [#79068](https://github.com/golang/go/issues/79068), [#79069](https://github.com/golang/go/issues/79069) | linux-riscv64-rva22u64-mengzhuo bots broken | Open (April 2026) | Medium (Go CI infra) | Affects Go toolchain CI, not gops directly. Go builds for riscv64 remain available. |

No correctness bugs, no riscv64-specific crashes, and no behavioral regressions have been reported for gops on any platform.

---

## 12. Objections and Upstream Blockers

None. Because gops contains no architecture-specific code, there are no porting objections to overcome, no technical blockers, and no organizational resistance. The project maintainer (Tobias Klauser) has a track record of accepting cross-architecture improvements given his background with Cilium's Linux kernel work. If a riscv64 CI runner were contributed, acceptance probability is high [NEEDS VERIFICATION - based on maintainer profile inference, not a stated position].

The only upstream gap that could affect gops is the unmerged [gopsutil PR #1652](https://github.com/shirou/gopsutil/pull/1652) for FreeBSD/riscv64 disk stats, which is not a gops-level issue and does not affect Linux.

---

## 13. Investment Analysis

RISE has not funded or tracked any work on gops. No RISE blog post, webinar transcript, or project listing references gops. All investment sizing below starts from zero.

### 13.1 Functional Enablement

No work required. gops builds and runs on `linux/riscv64` today with `go install github.com/google/gops@latest`. There are no functional gaps on Linux.

### 13.2 Performance Optimization

Not applicable. gops is a diagnostic CLI tool that runs transiently. It performs no computation-intensive work (no numeric kernels, no cryptography, no SIMD-amenable loops). Performance optimization of gops itself has no meaningful impact on any workload.

### 13.3 CI/CD Infrastructure

The highest-value contribution is adding riscv64 to the CI matrix. This would provide early detection of any future regressions as Go toolchain and dependency versions change. The change is a single-file edit to `.github/workflows/test.yml` adding a `linux/riscv64` cross-compile step with QEMU execution, or a self-hosted riscv64 runner entry. Effort is low; the primary dependency is access to a suitable runner.

### 13.4 Ecosystem Enablement

Not applicable. gops is a standalone CLI tool with no dependent package ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add `GOARCH=riscv64` cross-compile + QEMU test step to `.github/workflows/test.yml` | 0.5 | Contributor to google/gops | Low |
| Upstream dep | Review and help land [gopsutil PR #1652](https://github.com/shirou/gopsutil/pull/1652) (FreeBSD/riscv64 disk stats) | 0.5 | Contributor to shirou/gopsutil | Low |

Total estimated investment: 1 person-week. Neither item is blocking for Linux/riscv64 deployments. The CI addition is the only item that provides ongoing regression protection. Both items are nice-to-have, not critical.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/gops repository](https://github.com/google/gops)
- [gops releases](https://github.com/google/gops/releases)
- [gops CI workflow (.github/workflows/test.yml)](https://github.com/google/gops/blob/master/.github/workflows/test.yml)
- [gops go.mod](https://github.com/google/gops/blob/master/go.mod)
- [golang.org/x/sys package](https://pkg.go.dev/golang.org/x/sys)
- [github.com/shirou/gopsutil](https://github.com/shirou/gopsutil)
- [gopsutil issue #1425: Missing support for riscv64 FreeBSD](https://github.com/shirou/gopsutil/issues/1425)
- [gopsutil PR #1652: Add type definitions for riscv64 FreeBSD](https://github.com/shirou/gopsutil/pull/1652)
- [golang/go issue #79068: linux-riscv64-rva22u64-mengzhuo bot broken](https://github.com/golang/go/issues/79068)
- [golang/go issue #79069: linux-riscv64-rva22u64-mengzhuo bot broken](https://github.com/golang/go/issues/79069)
- [golang/go issue #80880: Add SG2042 riscv64 LUCI builder](https://github.com/golang/go/issues/80880)
- [Arch Linux RISC-V package tracker](https://archriscv.felixc.at/)
- [RISE project website](https://riseproject.dev/)
- [RISE blog: Advancing Go on RISC-V](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [rsc.io/goversion package](https://pkg.go.dev/rsc.io/goversion)
- [github.com/tklauser/go-sysconf](https://github.com/tklauser/go-sysconf)
- [github.com/tklauser/numcpus](https://github.com/tklauser/numcpus)