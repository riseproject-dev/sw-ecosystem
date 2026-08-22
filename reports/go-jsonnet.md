---
title: go-jsonnet
---

# go-jsonnet

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for go-jsonnet<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

go-jsonnet is a pure-Go implementation of the [Jsonnet](https://jsonnet.org/) data templating language, hosted under the `google` GitHub organization. It is not affiliated with CNCF, Apache, or the Linux Foundation. It is not a RISE Project member.

There is no formal governance document (no MAINTAINERS, OWNERS, or CODEOWNERS file). Contributions require signing a Google CLA (individual or corporate), per the [CONTRIBUTING file](https://github.com/google/go-jsonnet/blob/master/CONTRIBUTING.md).

All-time contributor rankings by commit count:

| Login | Name | Company | Commits |
|---|---|---|---|
| sbarzowski | Stanislaw Barzowski | (not listed) | 168 |
| sparkprime | Dave Cunningham | Google | 93 |
| johnbartholomew | John Bartholomew | independent | 76 |
| alldroll | Aleksandr Petrov | Meta | 20 |
| jbeda | Joe Beda | independent | 18 |
| jaymebrd | Jayme Bird | ClickHouse | 15 |
| seizethedave | David Grant | Grafana | 7 |

Dave Cunningham (dcunnin@google.com) is listed as package maintainer in `.goreleaser.yml`. Recent day-to-day maintenance has been handled predominantly by John Bartholomew (independent). The project is effectively Google-governed with community contributions but no co-governance arrangement with any company.

Community culture on new ports: the single RISC-V dependency bump (PR #284) sat open for 17 days with one "Any news on this?" ping before being silently merged with a one-word "Thanks" from the maintainer. No objections were raised. No policy exists on platform tiers.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-05-31 | carlosedp opens [PR #284](https://github.com/google/go-jsonnet/pull/284): bump `golang.org/x/sys` to a version containing riscv64 syscall support | [PR #284](https://github.com/google/go-jsonnet/pull/284) |
| 2019-06-17 | PR #284 merged by sparkprime (Dave Cunningham, Google); commit `3ad064e` | [PR #284](https://github.com/google/go-jsonnet/pull/284) |
| 2019-09-16 | v0.14.0 released -- first tagged release containing the merged riscv64 dependency bump | [Releases page](https://github.com/google/go-jsonnet/releases) |

Key contributor: carlosedp (Carlos Eduardo, carlosedp@gmail.com) -- a community contributor known for the [riscv-bringup](https://github.com/carlosedp/riscv-bringup) project that performed routine dependency bumps across the Go ecosystem in 2019.

The port is fully upstream in the sense that the one prerequisite change (PR #284) is merged and in all releases since v0.14.0. go-jsonnet is pure Go with no architecture-specific code, so there is nothing further to upstream. No tracking issue was ever opened.

---

## 3. Upstream Support Tier

No explicit tiered platform support policy exists in this project.

The project is pure Go (`CGO_ENABLED=0` in all release builds). The Go toolchain classifies `linux/riscv64` as Tier 2: build and run supported but the race detector is too slow for production use, and the buildbot infrastructure for riscv64 is intermittently broken (golang/go#78161, golang/go#68862, golang/go#70401). The go-jsonnet project inherits this tier implicitly.

Comparison table:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles from source | Yes | Yes | Yes |
| Official release binaries | Yes | Yes | No |
| CI test coverage | Yes (active) | No (commented out) | No (not listed) |
| Distro packaging (Debian/Ubuntu) | N/A | N/A | N/A -- project not packaged in any distro |
| `.goreleaser.yml` build target | Yes | Yes | No |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

go-jsonnet contains no architecture-specific source code of any kind. The full component inventory:

| Component | Description | Arch-specific code | riscv64 status |
|---|---|---|---|
| Lexer / Parser | Pure Go | None | Full (compiles, runs) |
| Interpreter / VM | Pure Go | None | Full |
| Formatter (`jsonnetfmt`) | Pure Go | None | Full |
| Linter (`jsonnet-lint`) | Pure Go | None | Full |
| Dependency tool (`jsonnet-deps`) | Pure Go | None | Full |
| C bindings (`c-bindings/libjsonnet.cpp`) | C++ wrapper, no arch code | None | Full (no special cross-compiler needed beyond a riscv64 g++) |

There are no JIT backends, no SIMD dispatch, no hand-written assembly (`.S`) files, no RVV/Zba/Zbb/Zbc/Zbs usage, and no crypto assembly. GitHub code search for `riscv`, `riscv64`, `vfloat32m1_t`, `rvv`, and `jit` against `repo:google/go-jsonnet` returns zero results in source files. The only riscv64 reference in the entire repository is in `MODULE.bazel.lock`, which lists standard Go toolchain download URLs including `go1.24.5.linux-riscv64.tar.gz` -- these are upstream Go distribution binaries, not project code.

Comparison table:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Interpreter | Pure Go | Pure Go | Pure Go |
| Lexer | Pure Go | Pure Go | Pure Go |
| C bindings | No arch code | No arch code | No arch code |
| SIMD / vector | None (N/A) | None (N/A) | None (N/A) |
| Assembly | None | None | None |

---

## 5. Build System, Cross-Compilation, and Toolchain

go-jsonnet is a standard Go module. No CMake, autoconf, or custom build script exists.

**Standard Go cross-compilation (recommended):**

```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./cmd/jsonnet
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./cmd/jsonnetfmt
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./cmd/jsonnet-lint
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./cmd/jsonnet-deps
```

Required Go version: 1.24+ (go.mod declares `go 1.24.5`). riscv64 cross-compilation in Go has been stable since Go 1.17. `CGO_ENABLED=0` is the correct setting and matches what goreleaser uses for all release targets. No QEMU is required for build; QEMU would be required only to run tests natively.

**Bazel cross-compilation:**

```
bazel build --platforms=@io_bazel_rules_go//go/toolchain:linux_riscv64 //cmd/jsonnet
```

Requires Bazel 8.5.1 and rules_go 0.59.0 (pinned in `.bazelversion`). The `MODULE.bazel.lock` confirms that the Go 1.24.5 and Go 1.25.0 SDKs include `linux_riscv64` tarballs and their SHA-256 hashes.

**CGO / C-bindings caveat:** The C bindings (`c-bindings/libjsonnet.cpp`) require `CGO_ENABLED=1` and a C++ cross-compiler for riscv64 (e.g., `riscv64-linux-gnu-g++`). The CI matrix uses `CGO_ENABLED=1` for the native amd64 test job only. No documented riscv64 CGO build procedure exists. For pure-Go binaries, this is not relevant.

No known build failures for riscv64. The `.goreleaser.yml` omits riscv64 from its targets -- adding it would require a one-line change per binary target.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Feature matrix:

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Jsonnet evaluation | Full | Full | Full |
| Formatting (`jsonnetfmt`) | Full | Full | Full |
| Linting (`jsonnet-lint`) | Full | Full | Full |
| Dependency resolution (`jsonnet-deps`) | Full | Full | Full |
| C library (`libjsonnet.so`) | Full | Full | Full (requires riscv64 C++ cross-compiler) |
| Native binary release | Yes | Yes | No |
| CI-tested | Yes | No | No |

**Functional gaps:** None. go-jsonnet compiles and runs on riscv64 without modification.

**Performance gaps:** No riscv64-specific performance data exists. The project has no SIMD or vectorized paths on any architecture, so there is no differential to measure.

**Floating-point semantics:** Historical cross-architecture tests revealed floating-point divergences on armv7hl, i686, aarch64, ppc64le, and s390x in transcendental functions (`pow`, `atan`, `tan`) and in 32-bit integer overflow behavior (issue [#362](https://github.com/google/go-jsonnet/issues/362), closed 2020, fixed by adding tolerance in numeric tests via [PR #364](https://github.com/google/go-jsonnet/pull/364)). The s390x variant of this issue ([#767](https://github.com/google/go-jsonnet/issues/767)) remains open; the maintainer has stated s390x is unsupported. riscv64 would face the same category of floating-point divergence if tested, particularly in transcendental functions, but no riscv64-specific instance has been reported.

**Security hardening:** No hardening gaps. The project uses `CGO_ENABLED=0` by default, which eliminates C attack surface. No FIPS mode is required or supported. golang/go#74683 (FIPS 140 + PIE broken on RISC-V) does not affect this project.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists in any configuration file in the repository.

Direct file inventory:

- `.github/workflows/ci.yml`: runs on `ubuntu-latest` (x86_64). The test matrix has two active entries, both `GOARCH: amd64`. Four architectures (arm64, 386, ppc64le, and one other) are present but entirely commented out. The string "riscv" does not appear anywhere in this file.
- `.github/workflows/release.yml`: triggers on `workflow_dispatch`. Runs GoReleaser on `ubuntu-latest`. No architecture matrix.
- `.github/workflows/publish-python.yml`: builds Python wheels on `ubuntu-22.04`, `ubuntu-22.04-arm`, `macos-14`, `macos-latest`. No riscv64 runner. No QEMU emulation.
- `.goreleaser.yml`: release build matrix lists `goarch: [386, amd64, arm, arm64]` for linux/windows/darwin. `riscv64` is absent.
- No `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml` exist.

No RISE runners are used. go-jsonnet does not appear in the RISE runner top-users list (six-week sample, March-May 2026).

Comparison table:

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Test job exists | Yes | No (commented out) | No (not listed) |
| Release binary built | Yes | Yes | No |
| QEMU emulation | N/A | N/A | N/A |
| RISE runner | No | No | No |

---

## 8. Distribution and Release Status

**GitHub Releases:** The latest release is v0.22.0. All releases (v0.22.0, v0.22.0-rc1, v0.21.0, v0.21.0-rc2, v0.21.0-rc1) ship prebuilt tarballs and `.deb` packages for: linux_386, linux_amd64, linux_arm64, linux_armv6, darwin (amd64 and arm64), and windows. No release asset contains "riscv64" in its filename. [Releases page](https://github.com/google/go-jsonnet/releases)

**PyPI:** HTTP 404. go-jsonnet is not published on PyPI. Not applicable.

**Debian unstable:** [tracker.debian.org/pkg/golang-github-google-go-jsonnet](https://tracker.debian.org/pkg/golang-github-google-go-jsonnet) returns HTTP 404. No Debian source package exists for this project. Not packaged.

**Ubuntu 24.04 (noble):** packages.ubuntu.com search returns zero results for go-jsonnet. Not packaged.

**Arch Linux RISC-V:** The archriscv.felixc.at search returned no package listing for go-jsonnet. Given the absence from Debian and Ubuntu, an independent Arch RISC-V port is unlikely [NEEDS VERIFICATION].

**RISE wheel builder:** Not applicable -- go-jsonnet has no PyPI presence.

**What a user on riscv64 must do today:**

```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./cmd/jsonnet
```

This requires a working Go 1.24+ toolchain. No prebuilt binary, no distro package, and no container image is available for riscv64.

---

## 9. Dependencies

Summary table:

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Go toolchain (1.24.5+) | Runtime, compiler, stdlib | Tier 2 supported | Partial -- race detector too slow; builder intermittently broken | No official Tier 1 binaries for riscv64 | golang/go#78161 (memory corruption, open); golang/go#68862 (SIGSEGV in preemptone, open); golang/go#74683 (FIPS+PIE broken, open, does not affect this project); golang/go#70401 (build failures, open) |
| golang.org/x/sys v0.38.0 (indirect) | OS-level syscall abstractions | Builds -- riscv64 epoll_event and endian fixes merged (golang/sys#38, #40, both closed) | No open riscv64 issues | Not released as binaries | None |
| golang.org/x/crypto v0.45.0 (indirect) | Cryptographic primitives | Builds -- pure Go fallback, no riscv64 assembly | No open riscv64 issues | Not released as binaries | None |
| github.com/fatih/color v1.18.0 | Colored terminal output (CLI only) | Builds -- pure Go, delegates to golang.org/x/sys | No riscv64 issues | N/A | None |
| github.com/mattn/go-isatty v0.0.20 (indirect) | TTY detection | Builds -- uses golang.org/x/sys, riscv64 supported since 2019 | No open riscv64 issues | N/A | None |
| github.com/mattn/go-colorable v0.1.13 (indirect) | Windows color output | Builds -- pure Go | N/A | N/A | None |
| github.com/sergi/go-diff v1.3.1 | Diff formatting (lint output) | Builds -- pure Go | No riscv64 issues | N/A | None |
| sigs.k8s.io/yaml v1.4.0 | YAML/JSON interop | Builds -- pure Go | No riscv64 issues | N/A | None |

All direct and indirect dependencies are pure Go with no architecture-specific gaps. The one meaningful risk is in the Go toolchain itself (Tier 2 riscv64, open stability bugs), not in go-jsonnet or its dependencies.

The Go toolchain riscv64 issues of note:
- [golang/go#78161](https://github.com/golang/go/issues/78161): memory corruption/panic on linux/riscv64, open.
- [golang/go#68862](https://github.com/golang/go/issues/68862): SIGSEGV in preemptone on riscv64, open.
- [golang/go#70401](https://github.com/golang/go/issues/70401): gotip-linux-riscv64 build failures, open.
- [golang/go#74683](https://github.com/golang/go/issues/74683): fips140 broken with `-buildmode=pie` on riscv64, open -- does not affect go-jsonnet (CGO_ENABLED=0, no FIPS mode).

---

## 11. Known Bugs and Active Issues

Format and correctness bugs (all platforms including riscv64, all open as of August 2026):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#890](https://github.com/google/go-jsonnet/issues/890) | Bug: std.format %g precision threshold and zero handling | Open | Medium | Two sub-bugs: threshold uses `> precision` instead of `>= precision`; `%.0g` of 0.0 emits `"0e+00"` instead of `"0"` |
| [#889](https://github.com/google/go-jsonnet/issues/889) | Format operator does not detect negative zero (-0.0) sign | Open | Low | `"%f" % (-0.0)` produces `"0.000000"` instead of `"-0.000000"`; uses `s < 0` instead of `math.Signbit(s)` |
| [#888](https://github.com/google/go-jsonnet/issues/888) | std.format %g produces wrong output for small numbers | Open | Medium | `"%.3g" % 0.001234` produces `"0"` instead of `"0.00123"` |
| [#886](https://github.com/google/go-jsonnet/issues/886) | std.abs(0) incorrectly returns -0 (negative zero) | Open | Low | Logic error in abs implementation |
| [#785](https://github.com/google/go-jsonnet/issues/785) | Pathological performance with O(n) objects | Open | High | std.foldl with object merging creates O(n) lookup chains; O(n^2) or worse total cost |
| [#784](https://github.com/google/go-jsonnet/issues/784) | Performance regression between v0.20.0 and master | Open | Medium | 1.44x slowdown on bench.07.jsonnet measured on Apple M1; master unexpectedly using 3.5 CPU cores vs 1 on v0.20.0 |
| [#874](https://github.com/google/go-jsonnet/pull/874) | fix: avoid exponential blowup when extendedObject becomes a DAG | Open PR | High | DAG sharing in `+` on objects causes 2^n visits; fix shows ~2200x improvement on reproducer; not yet merged |
| [#767](https://github.com/google/go-jsonnet/issues/767) | pow6 and stdlib_smoke_test fail on s390x | Open | Low | Maintainer states s390x unsupported; floating-point overflow edge case; riscv64 not affected but indicates same class of issue could appear |

Historical cross-arch floating-point issues (now resolved):
- [#362](https://github.com/google/go-jsonnet/issues/362) (closed 2020): test failures on armv7hl, i686, aarch64, ppc64le, s390x due to transcendental function rounding differences. Fixed via tolerance in tests ([PR #364](https://github.com/google/go-jsonnet/pull/364)).
- [#502](https://github.com/google/go-jsonnet/issues/502) (closed): i686-only smoke test failure.

None of the open bugs (#886-#890, #784, #785, #874) are architecture-specific. They affect all platforms equally.

---

## 12. Objections and Upstream Blockers

No stated objections to riscv64 exist. The single riscv64-related PR (#284) was merged without controversy.

Technical blockers:
1. **No CI testing:** riscv64 is not in the CI matrix. Adding it would require either a riscv64 GitHub Actions runner (not publicly available from GitHub) or QEMU emulation. QEMU-based Go test runs are significantly slower, which may explain why arm64 and ppc64le are commented out in the current CI matrix.
2. **No release binary:** `.goreleaser.yml` omits riscv64. Adding it is a one-line-per-target change. No technical barrier, only a maintainer decision.
3. **Go toolchain Tier 2:** Upstream Go runtime instability on riscv64 (golang/go#78161, golang/go#68862) means that even with a CI job, intermittent failures are possible from the runtime layer rather than go-jsonnet itself.

Organizational blockers:
- Google CLA required for contributions. A PR to add riscv64 to `.goreleaser.yml` would be the appropriate path and is a low-effort change.
- The de-facto maintainer (Dave Cunningham, Google) last merged a PR in 2019 for RISC-V. Recent activity is from John Bartholomew (independent). Response latency for PRs is unknown from available data.

Acceptance probability for a riscv64 addition to goreleaser: high, given the pure-Go nature and the precedent of the 2019 merge.

---

## 13. Investment Analysis

RISE has no involvement with go-jsonnet. No work has been funded or completed by RISE for this project.

### 13.1 Functional Enablement

go-jsonnet already builds and runs correctly on riscv64. No functional enablement work is needed.

### 13.2 Performance Optimization

go-jsonnet has no architecture-specific performance code on any platform. There are no SIMD paths to add. The open performance issues (#784, #785, #874) are algorithmic bugs affecting all architectures. Fixing them benefits riscv64 equally but is not riscv64-specific work.

No riscv64 benchmark data exists. Benchmarking go-jsonnet on riscv64 hardware and comparing to x86_64/arm64 would establish a baseline but is not expected to show architecture-specific gaps.

### 13.3 CI/CD Infrastructure

Adding riscv64 to CI requires one of:
- A QEMU-based CI job using `runs-on: ubuntu-latest` with `docker run --platform linux/riscv64` or cgo-free cross-test -- minimal engineering effort but slow runtime.
- A native riscv64 GitHub Actions runner -- depends on external runner availability.
- RISE-hosted riscv64 runners -- applicable if RISE runner infrastructure supports GitHub Actions workflows for this project.

Adding riscv64 to `.goreleaser.yml`: one line per binary target (four binaries: jsonnet, jsonnetfmt, jsonnet-lint, jsonnet-deps). Goreleaser cross-compiles natively. This is a half-day change.

### 13.4 Ecosystem Enablement

go-jsonnet is not packaged in Debian or Ubuntu, for any architecture. Adding riscv64 to the release binary is a prerequisite for packaging, but the packaging gap is an upstream distro issue independent of riscv64.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 to `.goreleaser.yml` release targets | 0.1 | Community PR (Google CLA required) | High |
| CI/CD | Add riscv64 test job to `.github/workflows/ci.yml` via QEMU | 0.2 | Community PR | Medium |
| Performance | Benchmark go-jsonnet on riscv64 hardware vs x86_64/arm64 | 0.5 | RISE or Qualcomm | Low |
| Bugs | Fix open format string correctness bugs (#886-#890) | 0.5 | Community (multiple reporters already filed) | Medium |
| Bugs | Merge or supersede anti-DAG-blowup PR #874 | 0.3 | Upstream maintainer decision | High (all-arch correctness) |

No functional enablement investment is needed. The two high-priority CI/CD items are low-effort changes whose main dependency is maintainer review bandwidth.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [google/go-jsonnet repository](https://github.com/google/go-jsonnet)
- [PR #284: Update x/sys to a newer version that supports Risc-V architecture](https://github.com/google/go-jsonnet/pull/284)
- [Issue #784: Performance regression between v0.20.0 and master](https://github.com/google/go-jsonnet/issues/784)
- [Issue #785: Pathological performance with O(n) objects](https://github.com/google/go-jsonnet/issues/785)
- [PR #874: fix: avoid exponential blowup when extendedObject becomes a DAG](https://github.com/google/go-jsonnet/pull/874)
- [Issue #886: std.abs(0) incorrectly returns -0 (negative zero)](https://github.com/google/go-jsonnet/issues/886)
- [Issue #888: std.format %g produces wrong output for small numbers](https://github.com/google/go-jsonnet/issues/888)
- [Issue #889: Format operator does not detect negative zero (-0.0) sign](https://github.com/google/go-jsonnet/issues/889)
- [Issue #890: Bug: std.format %g precision threshold and zero handling](https://github.com/google/go-jsonnet/issues/890)
- [Issue #362: Test failures on armv7hl, i686, aarch64, ppc64le, s390x (closed)](https://github.com/google/go-jsonnet/issues/362)
- [Issue #767: pow6 and stdlib_smoke_test fail on s390x](https://github.com/google/go-jsonnet/issues/767)
- [google/go-jsonnet releases](https://github.com/google/go-jsonnet/releases)
- [golang/go#78161: memory corruption/panic on linux/riscv64](https://github.com/golang/go/issues/78161)
- [golang/go#68862: SIGSEGV in preemptone on riscv64](https://github.com/golang/go/issues/68862)
- [golang/go#74683: fips140 broken with -buildmode=pie on riscv64](https://github.com/golang/go/issues/74683)
- [golang/go#70401: gotip-linux-riscv64 build failures](https://github.com/golang/go/issues/70401)
- [golang/go#27532: Go RISC-V upstream effort (2018-2019)](https://github.com/golang/go/issues/27532)
- [carlosedp/riscv-bringup: community RISC-V Go ecosystem bring-up tracker](https://github.com/carlosedp/riscv-bringup)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE blog post: Advancing Go on RISC-V (2025-04-04)](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v/)
- [Debian package tracker search for go-jsonnet](https://tracker.debian.org/pkg/golang-github-google-go-jsonnet)
- [Ubuntu 24.04 noble package search for go-jsonnet](https://packages.ubuntu.com/search?keywords=go-jsonnet&suite=noble)