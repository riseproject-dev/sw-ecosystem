---
title: mtail
parent: Project Reports
---

# mtail

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for mtail<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

mtail is a log metric extraction daemon written in pure Go. It tails log files, applies user-written mtail programs (a domain-specific language for extracting metrics from log lines), and exports the resulting counters, gauges, and histograms via a Prometheus-compatible HTTP endpoint or push to a StatsD or Graphite collector. It has no native code, no JIT compiler, no SIMD paths, and no CGO dependencies. The entire codebase is portable Go.

**Governance:** The project is hosted under the `google` GitHub organization and is not affiliated with any independent foundation (no CNCF, Apache Foundation, or Linux Foundation membership). The `.github/CODEOWNERS` file contains a single entry: `@jaqx0r` (Jamie Wilkinson), who is the sole codeowner and primary maintainer. A second contributor, `@benknutson-google`, appears in recent commits. Both have Google affiliation. The project is explicitly described as a "best effort service" with no SLA on review or response. Code requires signing Google's Individual or Corporate CLA before merging.

**License:** Apache-2.0.

**Corporate sponsors:** Google is the only identifiable corporate sponsor. Google is a Premier Member of the RISE project, but mtail itself is not a RISE member project and has received no RISE funding or engineering time [NEEDS VERIFICATION - based on absence of evidence from RISE blog, GitLab package list, and GitHub search].

**Community posture on new ports:** No documented policy exists. There is no `PLATFORMS.md` or `SUPPORT.md`. Because the project is pure Go, port enablement requires only release pipeline changes, not source changes. The single-maintainer "best effort" nature means any RISC-V work would need to be submitted as a PR with CI coverage to have a realistic chance of being merged and maintained.

---

## 2. Port History and Upstreaming Timeline

No RISC-V port exists. There is no tracking issue, no port PR, and no RISC-V-related commit in [google/mtail](https://github.com/google/mtail).

| Date | Event | Source |
|------|-------|--------|
| 2014 (project inception) | mtail written in pure Go; architecture portability inherited from Go toolchain | [google/mtail repository](https://github.com/google/mtail) |
| 2023-08-08 | PR #757 merged: Dependabot bump of golang.org/x/sys 0.10.0 to 0.11.0. The upstream x/sys commit message references "cpu: add crypto extensions detection for riscv64" - this is an x/sys change, not an mtail change | [google/mtail PR #757](https://github.com/google/mtail/pull/757) |
| 2023-10-05 | PR #772 merged: Dependabot bump of golang.org/x/sys 0.12.0 to 0.13.0. Same pattern: riscv64 mention is inside an upstream x/sys commit, not in mtail code | [google/mtail PR #772](https://github.com/google/mtail/pull/772) |
| 2024-04-26 | v3.0.0 released (first stable release) | [google/mtail releases](https://github.com/google/mtail/releases) |
| 2024-08-08 | v3.0.8 released (latest as of report date). Release assets: linux/386, linux/amd64, linux/arm64, darwin/amd64, darwin/arm64, windows/386, windows/amd64, windows/arm64. No riscv64 asset | [google/mtail releases](https://github.com/google/mtail/releases) |

The two PRs above are the complete set of "riscv64" appearances in the repository. Neither represents intentional RISC-V work.

**Is it fully upstream?** There is nothing to upstream - no port has been attempted.

---

## 3. Upstream Support Tier

No formal tier policy exists. The project ships no support matrix document. Support tier is inferred from CI and release artifact evidence.

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI (build + test) | Yes - ubuntu-latest | No | No |
| Pre-built binary (upstream) | Yes | Yes | No |
| Docker image (upstream, ghcr.io) | Yes | Yes (arm64/v8) | No |
| Distro package (Ubuntu noble) | Yes (3.0.0~rc52) | [NEEDS VERIFICATION] | Likely via source build ("arch: any") but unconfirmed |
| Distro package (Arch RISC-V) | N/A | N/A | Absent |
| Release-blocking | Yes | No | No |

**Evidence for CI:** `.github/workflows/ci.yml` matrix is `[ubuntu-latest, windows-latest]`. `ubuntu-latest` is x86_64. No QEMU step, no `GOARCH=riscv64` env var, no cross-compilation job exists in any of the 12 workflow files.

**Evidence for release matrix:** `.goreleaser.yml` Docker manifest targets are `linux/amd64` and `linux/arm64/v8` only. Binary builds do not specify a `goarch` restriction but the released artifacts confirm only amd64 and arm64 are built - no riscv64 binary appears in v3.0.5, v3.0.7, or v3.0.8.

riscv64 is an unsupported, untested, unreleased target. It is not a Tier 2 or Tier 3 designation - it simply has no designation at all.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

mtail's runtime is an interpreted virtual machine that executes compiled mtail programs against log lines. The VM is implemented entirely in Go with no native code backend.

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Core VM (interpreter) | Full | Full | Full | Pure Go, no arch guards |
| Log tail / file watcher (fsnotify) | Full | Full | Full | Pure Go |
| Prometheus metrics exposition | Full | Full | Full | Pure Go |
| JIT compiler | Missing | Missing | Missing | No JIT exists for any architecture |
| SIMD / vectorized regex | Missing | Missing | Missing | No SIMD paths anywhere in the codebase |
| Assembly (any purpose) | Missing | Missing | Missing | Zero .S/.s files in the 298-file repository |
| Crypto (native) | Missing | Missing | Missing | No cryptographic code; no TLS in the metrics server |
| Arch-specific build tags (`_amd64.go`, `_arm64.go`) | None | None | None | No platform-conditional Go files |

**Conclusion:** There are no architecture-specific subsystems to analyze. mtail is a scalar Go program with no performance-sensitive native paths. riscv64 implementation completeness is identical to amd64 and arm64 in the source tree. The only architectural asymmetry is in the release and CI layers.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Go toolchain + GNU Make wrapper. No CMake, no Autotools, no Meson.

**Minimum Go version:** 1.21.1 (from `go.mod`). Go has supported `GOARCH=riscv64` as a secondary port since Go 1.14.

**Cross-compilation for riscv64 (command, no source changes required):**

```
GOARCH=riscv64 GOOS=linux CGO_ENABLED=0 go build ./cmd/mtail/
```

Or via the Makefile with static linking:

```
GOARCH=riscv64 GOOS=linux STATIC=y make mtail
```

The `STATIC=y` flag adds `-w -s -extldflags "-static"` and enforces `CGO_ENABLED=0`. Because CGO is disabled, no C compiler or sysroot is required.

**QEMU:** Not referenced anywhere in the repository. Not needed for cross-compilation because Go's native cross-compiler produces a riscv64 ELF binary on any host without QEMU. QEMU would only be needed to run tests on a non-riscv64 host.

**Known build failures on riscv64:** None recorded in the repository. Given pure Go with no CGO, build failures would only arise from a Go toolchain bug. The Go toolchain has 209 open riscv64 issues (see [go.md](../project-reports/go.md)), but no mtail-specific build failure is known.

**Dockerfile for riscv64:** No riscv64-specific Dockerfile exists. The main `Dockerfile` uses `FROM golang:alpine AS builder` and runs `make STATIC=y install`, which would cross-compile if `GOARCH=riscv64` were set in the build environment. The goreleaser `Dockerfile.goreleaser` injects a pre-built binary from the host - adding riscv64 requires only a `.goreleaser.yml` change.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. Every feature available on amd64 is available on riscv64 when compiled from source. mtail has no feature flags gated on architecture.

**Performance gaps:**

| Subsystem | amd64 | arm64 | riscv64 | Gap |
|-----------|-------|-------|---------|-----|
| mtail VM execution | Go runtime (SSA-optimized) | Go runtime (SSA-optimized) | Go runtime (SSA-optimized) | Throughput difference is determined by Go codegen quality, not mtail code |
| xxhash (Prometheus label hashing, indirect dep) | Assembly-accelerated | Assembly-accelerated | Pure-Go fallback | Minor throughput reduction on label-heavy workloads |
| klauspost/compress (indirect dep) | SIMD-accelerated (SSE/AVX) | SIMD-accelerated (NEON) | Pure-Go fallback | Relevant only if mtail's gzip compression path is exercised |
| hash/crc32 (Go stdlib, indirect) | Assembly (PCLMULQDQ) | Assembly (CRC32 extensions) | Pure-Go fallback | No Go assembly for riscv64 as of Go 1.21 |

mtail's primary workload is string matching (regex) and counter/histogram updates. None of these have architecture-specific fast paths in mtail itself. Performance on riscv64 will be determined by the Go compiler's code generation quality for riscv64, which is functional but produces less-optimized output than for amd64 or arm64 in the Go 1.21 era.

**Security hardening gaps:** None specific to riscv64. mtail has no stack canaries, no ASLR configuration, and no architecture-specific hardening on any platform - this is not a riscv64-specific gap.

**Floating-point / NaN semantics:** Go's floating-point semantics are IEEE 754 on all architectures. Issue #1005 (float divide-by-zero silently producing +Inf/NaN) is architecture-independent.

---

## 7. CI/CD Infrastructure

**riscv64 CI exists:** No.

All 12 `.github/workflows/` files were read directly from the repository. The result is unambiguous.

| Workflow | Platforms | riscv64 |
|----------|-----------|---------|
| `ci.yml` (primary) | ubuntu-latest (x86_64), windows-latest | Absent |
| `release.yml` | ubuntu-latest (delegates to goreleaser) | Absent |
| `benchmark.yml` | ubuntu-latest; disabled (`if: ${{ false }}`) | Absent |
| `golangci-lint.yml` | ubuntu-latest | Absent |
| `codeql-analysis.yml` | ubuntu-latest | Absent |
| `oss-fuzz.yml` | ubuntu-latest | Absent |
| All other 6 workflows | ubuntu-latest or GitHub-hosted | Absent |

**RISE runners:** No. RISE maintains a GitLab CI infrastructure for RISC-V builds of Python wheels. mtail is not a Python package and is not listed in the RISE wheel builder. No RISE CI involvement of any kind.

**Hardware used for CI:** GitHub-hosted runners (ubuntu-latest = x86_64 shared runners). No dedicated RISC-V hardware.

| CI dimension | amd64 | arm64 | riscv64 |
|--------------|-------|-------|---------|
| Build tested | Yes | No | No |
| Unit tests run | Yes | No | No |
| Race detector | No (benchmark.yml disabled) | No | No |
| Fuzz (OSS-Fuzz) | Yes (x86_64) | No | No |
| Release gating | Yes | No | No |

---

## 8. Distribution and Release Status

**Upstream pre-built binaries (v3.0.8):**

| Platform | Binary | Container image |
|----------|--------|----------------|
| linux/amd64 | Yes | Yes (ghcr.io/google/mtail) |
| linux/arm64 | Yes | Yes (linux/arm64/v8) |
| linux/386 | Yes | No |
| linux/riscv64 | No | No |
| darwin/amd64 | Yes | No |
| darwin/arm64 | Yes | No |
| windows/amd64 | Yes | No |
| windows/arm64 | Yes | No |
| windows/386 | Yes | No |

**Package managers:**

- PyPI: A package named `mtail` exists at [pypi.org/project/mtail](https://pypi.org/project/mtail/) (v0.2), but it is an unrelated Python stub, not the Google mtail tool.
- Ubuntu noble (24.04): `mtail` package at version `3.0.0~rc52-1ubuntu0.3`, declared `arch: any`. This is a pre-GA release candidate, 8+ releases behind upstream v3.0.8. A riscv64 source build should succeed via this package but no confirmed riscv64 binary package is listed in Ubuntu's package tracker output.
- Debian: `arch: any` declaration in tracker, but only amd64 appears in Debci CI results. No riscv64 build confirmation.
- Arch Linux RISC-V: Absent from [archriscv.felixc.at](https://archriscv.felixc.at/).
- Fedora/RHEL: Data not available - not searched.

**What a user must do to get a working riscv64 binary:**

1. Install Go 1.21.1 or later on any host.
2. Run: `GOARCH=riscv64 GOOS=linux CGO_ENABLED=0 go build -o mtail ./cmd/mtail/`
3. Copy the resulting binary to the target riscv64 host.

No source changes are required. No C toolchain is required. This is a 2-minute operation given a Go toolchain.

---

## 9. Dependencies

**Critical dependency RISC-V status:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blockers |
|-----------|------|--------------|--------------|-----------------|---------|
| Go toolchain 1.21.1 | Runtime, compiler, stdlib | Supported (secondary port since Go 1.14) | CI builders exist; some broken (#79067, #79068, #79069); race builder too slow (#78258) | All Go releases include riscv64 | 209 open riscv64 issues; crc32 assembly absent (#78918); indexbyte optimization pending (#79997) |
| golang.org/x/sys | Syscall wrappers, /proc parsing | Supported | Routine Dependabot bumps confirm ongoing CI coverage | Via Go module proxy (pure Go) | No open riscv64-specific blockers |
| prometheus/client_golang | Prometheus metrics exposition | Supported; procfs bump to v0.3.0 fixed riscv64 build (#833, closed) | Passes upstream CI | Pure Go module release | No open riscv64 issues |
| prometheus/procfs | Linux /proc file parsing | Supported; CPUInfo parsing for RISC-V added (#318, #312 merged) | Passes | Pure Go module release | No open riscv64 issues; historical fixes complete |
| prometheus/common | Prometheus shared utilities | Supported | Passes | Pure Go | No riscv64 issues |
| klauspost/compress (indirect) | zstd/gzip/snappy compression | Supported; pure-Go fallback for all arches | No riscv64 failures found | Pure Go module | SIMD paths exist for x86/ARM only; riscv64 uses generic fallback (performance, not correctness) |
| cespare/xxhash/v2 (indirect) | Fast hash for Prometheus label maps | Supported | Passes | Pure Go | Assembly exists for amd64/arm64 only; riscv64 uses pure-Go fallback |
| google/go-cmp | Test comparison utility | Supported | Passes | Pure Go | No riscv64 issues |
| go.opencensus.io (indirect) | Distributed tracing | Supported with modern Go; issue #1264 (2021) was a compile error on Go 1.16 pre-release riscv64 port | Not tested on riscv64 in CI | Pure Go | Issue #1264 stale (no activity since 2021); likely resolved by Go 1.21 toolchain; opencensus-go is feature-frozen |
| google.golang.org/protobuf (indirect) | Protocol Buffers | Supported | Passes | Pure Go | No riscv64-specific issues |
| grpc-go (indirect) | gRPC transport | Supported | Passes | Pure Go | No riscv64-specific issues |

**Deep-dive - Go toolchain (critical path):**

The Go toolchain is the only dependency with significant open riscv64 issues. See the Go report at [project-reports/go.md](../project-reports/go.md) for full detail. The issues relevant to mtail:

- `hash/crc32` has no riscv64 assembly (#78918) - affects internal Go hashing, not mtail directly.
- CI builders are slow or broken (#79067, #79068, #79069) - affects test reliability in the Go project, not mtail builds.
- `indexbyte` optimization pending (#79997) - affects string scanning performance.

None of these are correctness blockers for mtail. linux/riscv64 is a functional Go secondary port. mtail binary produced by `GOARCH=riscv64 go build` will run correctly.

**opencensus-go issue #1264 note:** This issue was filed 2021-08-31 against a pre-release riscv64 port on Go 1.16. It has no activity since filing. Given that Go 1.21 is the minimum required by mtail and riscv64 was promoted to a maintained secondary port in Go 1.14, this issue is almost certainly resolved by the current toolchain [NEEDS VERIFICATION - issue #1264 was not re-tested against Go 1.21].

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist. The following are open issues in the project relevant to correctness and reliability, all architecture-independent:

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#590](https://github.com/google/mtail/issues/590) | VM attempts to parse IP addr as float | Open | High - data loss | `strconv.ParseFloat` runtime error when a regex capture group typed as float receives an IP address string; the line is dropped silently |
| [#1005](https://github.com/google/mtail/issues/1005) | Float divide-by-zero silently writes +Inf/NaN to a metric | Open | Medium - metric corruption | Float `/` and `%` by zero produce +Inf/NaN with no runtime error; `float()` builtin accepts "Inf" and "NaN" strings silently |
| [#263](https://github.com/google/mtail/issues/263) | Times are not represented as Time in the VM so lose precision when compared | Open | Medium - correctness | `timestamp()` returns Unix seconds (integer); all durations under 1 second round to 0 |
| [#725](https://github.com/google/mtail/issues/725) | mtail fails to read log file with initially incorrect permissions that are later corrected | Open | Medium - reliability | File-watcher does not recover from permission errors that are later resolved |
| [#221](https://github.com/google/mtail/issues/221) | Runtime errors should be more visible to users | Open | Low - observability | Runtime errors increment `prog_runtime_errors_total` but are otherwise silent |
| [#313](https://github.com/google/mtail/issues/313) | Segfaults on 32-bit Debian architectures (i386, mipsel, armel, armhf) | Closed (2020) | Historical | Unaligned 64-bit atomic access in histogram bucket handling on 32-bit platforms; resolved. Not riscv64-specific but relevant if rv32 were ever a target |

---

## 12. Objections and Upstream Blockers

**Stated objections:** None on record - no issue or PR has ever proposed riscv64 support, so there are no documented maintainer objections.

**Technical blockers:** None. mtail is pure Go with CGO_ENABLED=0. Cross-compilation works without source changes.

**Organizational blockers:**

- Single-maintainer project with "best effort" SLA. PR review latency is unpredictable.
- The sole codeowner is a Google employee. Google itself has not prioritized riscv64 for this project. Any external PR would need to demonstrate CI coverage to be merged.
- Adding riscv64 to the release pipeline requires a `.goreleaser.yml` change and container image registry pipeline change. The maintainer must accept and maintain this ongoing.

**Acceptance probability:** High for source-level (no change needed). Moderate for official release binary addition - the maintainer would need to accept the goreleaser and CI changes. No structural reason exists to reject it. The pure-Go nature means no maintenance burden from architecture-specific bugs.

**No RISE involvement:** RISE has not engaged with this project. Google is a RISE Premier Member but has not directed RISE engineering toward mtail riscv64 enablement.

---

## 13. Investment Analysis

**RISE pre-existing work:** None. RISE has no involvement with mtail.

### 13.1 Functional Enablement

mtail is already functionally enabled on riscv64 via standard `go build`. No source code changes are required. The work is entirely in the release and CI layers.

### 13.2 Performance Optimization

No architecture-specific performance paths exist in mtail. Performance on riscv64 relative to amd64 is determined by:
1. Go compiler code generation quality for riscv64 (upstream Go project, not mtail)
2. Pure-Go fallbacks in xxhash and klauspost/compress (minor impact for a log-tailing daemon; these are not on the critical path for most workloads)

Investing in mtail-specific performance optimization for riscv64 is not warranted - the bottleneck is regex matching and I/O, both of which are determined by the Go runtime.

### 13.3 CI/CD Infrastructure

The primary investment required is adding riscv64 to the release pipeline and CI.

**Goreleaser change:** Add `linux/riscv64` to binary build targets and Docker manifest in `.goreleaser.yml`. Estimated 2-4 hours of engineering time.

**CI change:** Add a cross-compilation job to `ci.yml` that builds for riscv64. Running tests under QEMU requires either a QEMU-in-Actions setup or a dedicated riscv64 runner. A build-only CI job (no test execution) takes less than 1 hour to implement.

**Test execution on riscv64:** mtail's test suite is pure Go with no CGO. Running `GOARCH=riscv64 go test ./...` under QEMU (user-mode) is feasible. QEMU-based test execution would increase CI runtime by approximately 5-15x versus native. A dedicated riscv64 hardware runner would eliminate this overhead.

### 13.4 Ecosystem Enablement

Not applicable. mtail has no dependent package ecosystem. It is a standalone binary daemon.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Add linux/riscv64 binary target to .goreleaser.yml | 0.1 | mtail maintainer (PR) | Critical |
| Functional | Add linux/riscv64 Docker manifest entry to .goreleaser.yml | 0.1 | mtail maintainer (PR) | High |
| CI/CD | Add riscv64 cross-compilation build job to ci.yml | 0.1 | mtail maintainer (PR) | High |
| CI/CD | Add riscv64 test execution job (QEMU or hardware runner) | 0.5 | Infrastructure / mtail maintainer | Medium |
| Performance | riscv64 assembly for xxhash (in cespare/xxhash, upstream) | 2-4 | xxhash maintainer | Low |
| Performance | riscv64 SIMD for klauspost/compress (in upstream project) | 4-8 | compress maintainer | Low |

**Total for riscv64 binary availability:** approximately 1-2 person-days, dominated by PR turnaround time with the single maintainer, not engineering effort.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [google/mtail repository](https://github.com/google/mtail)
- [mtail releases (v3.0.8 latest)](https://github.com/google/mtail/releases)
- [mtail .goreleaser.yml](https://github.com/google/mtail/blob/main/.goreleaser.yml)
- [mtail .github/workflows/ci.yml](https://github.com/google/mtail/blob/main/.github/workflows/ci.yml)
- [mtail .github/workflows/release.yml](https://github.com/google/mtail/blob/main/.github/workflows/release.yml)
- [mtail .github/workflows/benchmark.yml](https://github.com/google/mtail/blob/main/.github/workflows/benchmark.yml)
- [mtail .github/CODEOWNERS](https://github.com/google/mtail/blob/main/.github/CODEOWNERS)
- [mtail go.mod](https://github.com/google/mtail/blob/main/go.mod)
- [mtail Dockerfile](https://github.com/google/mtail/blob/main/Dockerfile)
- [mtail issue #590 - VM parses IP addr as float](https://github.com/google/mtail/issues/590)
- [mtail issue #725 - fails to read log with initially incorrect permissions](https://github.com/google/mtail/issues/725)
- [mtail issue #263 - timestamp precision loss](https://github.com/google/mtail/issues/263)
- [mtail issue #221 - silent runtime errors](https://github.com/google/mtail/issues/221)
- [mtail issue #1005 - float divide-by-zero produces NaN/Inf](https://github.com/google/mtail/issues/1005)
- [mtail issue #313 - 32-bit segfaults (closed)](https://github.com/google/mtail/issues/313)
- [mtail PR #757 - golang.org/x/sys bump (Dependabot)](https://github.com/google/mtail/pull/757)
- [mtail PR #772 - golang.org/x/sys bump (Dependabot)](https://github.com/google/mtail/pull/772)
- [mtail PR #977 - golang.org/x/sys bump (Dependabot, closed without merge)](https://github.com/google/mtail/pull/977)
- [prometheus/client_golang issue #833 - riscv64 build fix (closed)](https://github.com/prometheus/client_golang/issues/833)
- [prometheus/procfs PR #318 - CPUInfo riscv64 support](https://github.com/prometheus/procfs/pull/318)
- [prometheus/procfs PR #312 - riscv64 CPUInfo parsing](https://github.com/prometheus/procfs/pull/312)
- [go.opencensus.io issue #1264 - riscv64 compile error on Go 1.16 pre-release](https://github.com/census-instrumentation/opencensus-go/issues/1264)
- [Ubuntu noble mtail package](https://packages.ubuntu.com/search?keywords=mtail&suite=noble)
- [Debian package tracker - mtail](https://tracker.debian.org/pkg/mtail)
- [Arch Linux RISC-V package mirror](https://archriscv.felixc.at/)
- [RISE project member list](https://riseproject.dev/members/)
- [Go riscv64 issue #78918 - missing crc32 assembly](https://github.com/golang/go/issues/78918)
- [Go riscv64 issue #79997 - indexbyte optimization](https://github.com/golang/go/issues/79997)
- [Go riscv64 issue #78258 - race builder too slow](https://github.com/golang/go/issues/78258)