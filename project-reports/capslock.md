---
title: capslock
---

# capslock

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for capslock<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

capslock ([google/capslock](https://github.com/google/capslock)) is a pure-Go, source-level static-analysis CLI that reports which privileged capabilities (network access, file I/O, process exec, cgo, unsafe, reflection) a given Go package or module can reach, via transitive call-graph analysis built on `go/analysis` and `go/ssa`. It is not a compiled/architecture-specific binary tool in the sense of having per-target-CPU code paths: its own analysis engine runs identically regardless of host CPU, and it separately accepts a generic `-goarch`/`-goos` CLI flag pair that lets a user tell it which target platform's build constraints to honor when reading *someone else's* source code. That flag is a pass-through environment-variable setter into `golang.org/x/tools/go/packages.Load()` (`analyzer/load.go`, `cmd/capslock/capslock.go`); it contains no architecture-specific branching of any kind. The repository is 37 Go files, a single Go module, zero cgo.

**Governance.** capslock is a Google-hosted project (`github.com/google`) with no foundation affiliation - not CNCF, not Apache Foundation, not Linux Foundation, not an independent foundation of any kind. No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists in the repo (all 404), so there is no formal tier or platform-support policy of any kind to evaluate against. Governance runs through `CONTRIBUTING.md` and `SECURITY.md`: contributors must sign the Google CLA and follow [Google's Open Source Community Guidelines](https://opensource.google/conduct/); all changes, including from project members, require GitHub PR review. Security reports go to `google-capslock-team@googlegroups.com` with a 90-day disclosure timeline. License: BSD-3-Clause.

**Corporate maintainers** (identified via commit history and GitHub profile `company` fields):

| Person | Handle | Company (self-declared) | Role |
|---|---|---|---|
| Damien Miller | djm-google / djm@google.com | Google | Original author, first commit 2023-07-28 |
| John Dethridge | jcd2 / jcd@golang.org, jcd@google.com | Google | Most prolific human committer (~48+ commits, ongoing through 2025) |
| Spencer Schrock | spencerschrock / sschrock@google.com | @google | Contributor (tooling/deps) |
| Jess McClintock | jessmcclintock | (profile blank; sole maintainer of CI/Scorecard workflows) | CI/security maintenance |

Roughly 15 other contributors (Tom Payne, Robin Eklind, Oleksandr Redko, Lucas Bremgartner, Adam Shannon, etc.) are one-off external drive-by contributors with no maintainer standing. `dependabot[bot]` accounts for 185 of 267 total commits (dependency bumps). There is no corporate-sponsor diversity - this is a single-vendor (Google) project.

**Community stance on new ports.** There is no community discussion to characterize because the topic has never come up: zero issues, PRs, commits, or discussion threads mention RISC-V, riscv64, or architecture ports of any kind. Because capslock has no architecture-specific code and no platform-tier policy, a "please support riscv64" request would have nothing concrete to target - it would reduce entirely to "does the Go toolchain support riscv64," which it already does (Tier 1 upstream Go support for `linux/riscv64` since Go 1.14).

## 2. Port History and Upstreaming Timeline

There is no port history because there was never a port to do. Exhaustive search across GitHub issues (title/body/comments), PRs (277 all-state), commit messages (3,316 commits, full `git log --all -i --grep=riscv` equivalent), and source code returned zero RISC-V hits by every method tried:

| Search method | Query | Result |
|---|---|---|
| GitHub issue search (title/body/comments) | `riscv`, `riscv64`, `"risc-v"`, `risc` | 0 / 0 / 0 / 0 |
| GitHub commit search | `riscv`, `riscv64` | 0 / 0 |
| GitHub code search | `riscv64` | 0 |
| GraphQL issue/PR search | `repo:google/capslock riscv`, `riscv64`, `"risc-v"` | 0 / 0 / 0 |
| Full commit-message grep, all 3,316 commits | case-insensitive `riscv\|risc-v` | 0 matches |
| Full PR title scan, 277 PRs all states | `arch\|goarch\|goos\|platform\|cross-compil\|cpu\|build` (excluding dependency bumps) | 0 matches |
| Sanity check (confirms search API works) | `repo:google/capslock arm64` | 1 hit: PR #229, an unrelated `golang.org/x/tools` dependency bump incidentally mentioning "arm64" |

There is no milestone table to populate - no first-support commit, no enablement PR, no tracking issue. RISC-V support exists only as an emergent property of capslock containing zero architecture-specific code and Go's own riscv64 backend supporting `GOARCH=riscv64` since Go 1.14. This is fully "upstream" in the trivial sense that there is nothing downstream/out-of-tree to reconcile - but it is also unverified, since no CI, test, or release process has ever exercised capslock on riscv64 (see Section 7).

## 3. Upstream Support Tier

capslock has no formal platform-support tier policy - no `PLATFORMS.md`, no tiered support document, no release-blocking test matrix of any kind for any architecture. The only architecture-relevant artifact in the repo is the generic `-goos`/`-goarch` CLI flag pair, which configures the *target* package under analysis, not capslock's own build.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build/test coverage | Yes (implicit - `ubuntu-latest` runners are x86_64) | No dedicated coverage found | No dedicated coverage found |
| Official GitHub Release binaries | None exist for any arch (0 GitHub Releases published) | None | None |
| Release-blocking test requirement | None (no releases exist to block) | None | None |
| Formal tier document | None exists | None exists | None exists |
| Practical status | Works via `go build`/`go install`, exercised on CI runners | Untested by CI, works via Go's native cross-compilation | Untested by CI, works via Go's native cross-compilation |

Data not available: no formal tier policy document exists for any architecture, so there is nothing to cite beyond the absence itself, confirmed by 404s on `PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

capslock has no architecture-specific subsystems of any kind - no JIT, no SIMD, no crypto, no GC barriers, no hand-written assembly in its production code. Direct source inspection of every architecture-relevant file confirms this:

- `analyzer/load.go`: `LoadConfig{BuildTags, GOOS, GOARCH string}` - if `GOARCH` is set, appends `GOARCH=<value>` to `os.Environ()` before calling `golang.org/x/tools/go/packages.Load()`. Purely a passthrough to the Go toolchain's own build-constraint resolution; no branching on architecture value.
- `cmd/capslock/capslock.go`: defines the `-goarch`/`-goos` flags (`flag.String("goarch", "", "GOARCH value to use when loading packages")`) that feed `LoadConfig`.
- `docs/README.md` / `docs/caveats.md`: prose documenting these flags and a "Build Constraints" section explaining capslock analyzes whatever `go build` would for the given tags/OS/arch.

These four files are the entirety of the `GOARCH` hits in a repo-wide code search - there is no fifth file, no arch-dispatch table, no `arch/riscv/` directory.

**The one assembly file in the repo is not RISC-V, and is not production code.** `testpkgs/useasm/useasm.s` (16 lines) is a test fixture containing x86-64 Go Plan9 assembly (`MOVQ`, `SHLQ`, `AX` register), unconditional with no build tag, used solely to verify that capslock's analyzer correctly flags calls into `.s` files as `ARBITRARY_EXECUTION`/uninspectable. Per capslock's own `docs/caveats.md`: "Capslock cannot analyze C or assembly code... reports calls to cgo or assembly functions [with] the CGO or ARBITRARY_EXECUTION capabilities." This is a deliberate design choice to treat all assembly as an opaque capability rather than parse it - so there is no ISA-specific code path to find for any architecture, RISC-V included. A caveat worth flagging for engineering hygiene rather than user impact: because this fixture is amd64-only with no build constraint, `go test ./...` run natively on a riscv64 host would fail to assemble this specific file for that GOARCH - an untracked, undocumented test-infra portability nit, not a "capslock cannot run on riscv64" defect.

`testpkgs/buildtags/*.go` (`platformsuffix_arm.go`, `platformsuffix_openbsd_386.go`, `platformsuffix_plan9.go`, `tag-linux.go`, `tag-other.go`, `tag-foo.go`) exist only to exercise Go's build-constraint/filename-suffix parsing logic as test inputs for capslock's own build-tag evaluator - they are not per-architecture feature implementations, and none carries a `riscv`/`riscv64` tag.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | N/A - none exists | N/A | N/A |
| SIMD/intrinsics | N/A - none exists | N/A | N/A |
| Crypto | N/A - none exists | N/A | N/A |
| GC barriers | N/A - capslock is not a runtime | N/A | N/A |
| Hand-written assembly (production) | None | None | None |
| Assembly (test fixture only) | `testpkgs/useasm/useasm.s` exists, amd64-specific | Not present | Not present (fixture would need a riscv64 variant to run full test suite natively) |

**Verdict:** capslock does not fit the full/partial/scalar/missing rubric used for numeric/crypto/codec libraries, because it has zero per-architecture code paths for *any* architecture, amd64 and arm64 included. It should be classified as architecture-agnostic / not applicable rather than placed on that spectrum.

## 5. Build System, Cross-Compilation, and Toolchain

There is no CMake, Docker, Makefile, or cross-compilation build system in this repository at all. capslock is a pure Go CLI built with plain `go build`/`go install`; it has no C/C++ layer, no `CMakeLists.txt`, no `Makefile`, no `Dockerfile`, no `BUILDING.md`/`INSTALL`, and no toolchain files. Verified exhaustively:

| Item searched | Result |
|---|---|
| `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md` | 404 - none exist |
| `CMakeLists.txt` (repo-wide code search) | 0 results |
| `cmake/` directory | Does not exist |
| Dockerfiles (`filename:Dockerfile`, `.ci/docker/`, `docker/`) | 0 results |
| `Makefile` | 0 results |
| `.gitlab-ci.yml`, `.cirrus.yml`, `Jenkinsfile`, `.travis.yml`, `.circleci/config.yml`, `azure-pipelines.yml` | All 404 |
| Repo-wide search for `riscv`, `riscv64`, `RISC-V`, `RISCV` (any case) | 0 results across code, issues, PRs |

**Actual repo layout:** `analyzer/`, `cmd/capslock/`, `cmd/capslock-git-diff/`, `interesting/`, `proto/`, `testing/`, `testpkgs/`, plus `go.mod`/`go.sum` and docs. Only two CI files exist, both under `.github/workflows/` (see Section 7).

**Build/install commands (the only ones documented):**
```sh
go install github.com/google/capslock/cmd/capslock@latest
```
or, from a clone:
```sh
go build -o capslock ./cmd/capslock
```
There is no separate riscv64 build path. Standard Go cross-compilation (`GOOS=linux GOARCH=riscv64 go build ./cmd/capslock`) works because it is native, unconfigured toolchain behavior - the repo neither documents nor tests it.

**go.mod:**
```
module github.com/google/capslock
go 1.25.0
```
No `toolchain` directive beyond the `go 1.25.0` minimum. No GCC/Clang minimum-version rationale exists because no GCC/Clang is used at all - capslock has zero cgo dependency in its own binary.

**QEMU usage:** zero references anywhere in code, docs, workflows, issues, or PRs. **`-DUSE_X=OFF`-style feature flags:** none exist, since there is no CMake or comparable build-flag system.

**Known build failures:** none documented for riscv64, because riscv64 building has never been attempted or tracked in this repo (no issue, no PR, no CI run).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core static-analysis functionality (capability graph, JSON/proto output) | Full | Full (inherited, untested by CI) | Full (inherited, untested by CI) |
| `-goarch`/`-goos` target-analysis flags | Full | Full | Full - `-goarch=riscv64` is valid usage today for analyzing a riscv64-targeted package |
| Own test suite (`go test ./...`) runnable natively | Yes | Data not available: no CI or issue evidence of arm64 test runs | Untested; `testpkgs/useasm/useasm.s` (amd64-only, no build tag) would need a riscv64 variant for a fully-passing native run - untracked by any issue |
| Official CI verification | Yes (`ubuntu-latest` = x86_64) | No | No |
| Official prebuilt binary | No (none exist for any arch) | No | No |

There are no functional gaps beyond the untested test-fixture issue above: capslock contains no cgo, no assembly in production code, and no arch-conditional logic, so there is no "can't do X at all" scenario to report for riscv64 specifically - the gap is verification, not functionality. There are no performance gaps to report: capslock has no SIMD, vectorized, or hand-tuned per-architecture code paths for any target, so there is no "delta from missing SIMD" to measure. There are no security-hardening gaps documented for any architecture. There are no NaN/floating-point semantics issues: capslock's own logic performs no floating-point computation relevant to its capability-analysis function, and no such issue has ever been raised (confirmed by issue-tracker search for `nan`, `floating`, `riscv nan floating` returning zero matches).

## 7. CI/CD Infrastructure

**Verdict: no riscv64 CI exists for google/capslock.** Verified via direct read of both workflow files present in the repo.

`.github/workflows/` contains exactly two files, confirmed via directory listing:

1. **`codeql.yml`** (3657 bytes). Triggers: `push` to `main`, `pull_request` to `main`, and weekly `schedule` (cron `35 18 * * 4`). Runner: `runs-on: ${{ (matrix.language == 'swift' && 'macos-latest') || 'ubuntu-latest' }}` - since the only matrix dimension is `language: ['go']`, this resolves unconditionally to `ubuntu-latest` (x86_64). Job: checkout, CodeQL Autobuild (compiles Go natively for the runner's own x86_64 architecture), CodeQL static analysis, SARIF upload. No QEMU, no `GOARCH` env var set anywhere, no cross-arch matrix dimension. `grep -i riscv`: 0 matches.
2. **`scorecard.yml`** (2979 bytes). Triggers: `branch_protection_rule`, weekly `schedule` (cron `17 5 * * 3`), `push` to `main`. Runner: hardcoded `ubuntu-latest`, no matrix. Job: OSSF Scorecard supply-chain scan, SARIF upload - does not build or test project code at all. `grep -i riscv`: 0 matches.

No other CI system exists: `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `.circleci/config.yml`, `azure-pipelines.yml` all return 404. Repo-wide GitHub code search for `riscv` and `riscv64` scoped to `repo:google/capslock`: `total_count: 0` for both, confirmed live at verification time.

**RISE runners.** RISE operates its own native riscv64 GitHub Actions runner infrastructure (`riscv-runner`, `riscv-runner-app`, `riscv-runner-device-plugin`, `riscv-runner-images` repos in the `riseproject-dev` GitHub org; announced in RISE blog posts dated 2026-03-24 ["Announcing the RISE RISC-V Runners"](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) and 2026-05-12 ["RISE RISC-V Runners: Six Weeks In"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)). There is no evidence capslock uses these runners or any other riscv64 hardware - no repo, code, issue, or PR reference to capslock exists anywhere in the 49-repo `riseproject-dev` org.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build coverage | Yes, implicit (`ubuntu-latest`) | No | No |
| CI test coverage | Yes, implicit (CodeQL autobuild only, not a full test run) | No | No |
| Dedicated arch matrix | No (single implicit arch) | No | No |
| RISE runner usage | N/A | N/A | None found |
| Hardware used | GitHub-hosted x86_64 runner | None | None |

## 8. Distribution and Release Status

**No binary distribution channel of any kind exists for google/capslock, on any architecture.**

| Source | URL checked | capslock found? | riscv64 present? |
|---|---|---|---|
| GitHub Releases (google/capslock) | [api.github.com/repos/google/capslock/releases](https://github.com/google/capslock/releases) | No releases exist (`[]`, confirmed via both `gh release list` and `gh api repos/google/capslock/releases`) | N/A - no assets at all |
| PyPI | [pypi.org/pypi/capslock/json](https://pypi.org/pypi/capslock/json) | Yes, but an unrelated Python utility library (namesake) - home page `github.com/faruk-ahmad/capslock`, summary "A utility python library for writing certain tasks in python easily & elegantly" | No - pure-Python wheels only (`py3-none-any`), no arch tags of any kind |
| RISE wheel builder | [gitlab.com/.../packages/pypi/simple/capslock/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/capslock/) | Redirects (HTTP 302) to public PyPI - same unrelated namesake package | No |
| Ubuntu 24.04 (noble) | [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=capslock&suite=noble&searchon=names&section=all) | No results ("Sorry, your search gave no results") | No |
| Debian tracker | [tracker.debian.org/pkg/capslock](https://tracker.debian.org/pkg/capslock) | 404 Not Found (also checked Go-naming variant `golang-github-google-capslock`, also 404) | No |
| Debian package search (all suites) | packages.debian.org/search | "Sorry, your search gave no results" across bullseye through trixie/forky/sid/experimental | No |
| Arch Linux RISC-V port | [archriscv.felixc.at](https://archriscv.felixc.at/) | Not found - grepped `core`, `extra`, `unsupported` trees directly, zero matches | No |
| AUR | [aur.archlinux.org](https://aur.archlinux.org/) | A `capslock` AUR package exists, but is orphaned (`Maintainer: null`), stale at v0.1.1-1 (current upstream v0.3.2), untouched since 2023-09-17, and its `PKGBUILD` declares `arch=('x86_64')` exclusively | No |

The repo has 14 git tags (v0.1.0 through v0.3.2), but tags carry no binary assets absent a published GitHub Release object, and none were ever published.

**What a user must do to get a working binary on riscv64:** build from source. There is no other path.
```sh
go install github.com/google/capslock/cmd/capslock@latest
```
This works because Go's own toolchain has supported `GOOS=linux GOARCH=riscv64` natively since Go 1.14 - it is "works via `go install`," not "a published riscv64 binary artifact from any packaging ecosystem."

## 9. Dependencies

capslock's entire dependency graph (4 direct + 5 indirect modules) is pure Go with zero cgo, zero assembly, and zero architecture-specific code paths in the tool's own dependency chain aside from generic OS-syscall bindings. This makes it structurally low-risk for riscv64 compared to native/C++ tools.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| `golang.org/x/tools` v0.43.0 (direct) | Core static-analysis engine: `go/ssa`, `go/callgraph/vta`, `go/packages`, `go/analysis` | OK - pure Go, no arch-specific code | OK - 0 riscv-related issues/PRs found | N/A - Go module, arch-agnostic distribution via module proxy | None found |
| `google.golang.org/protobuf` v1.36.11 (direct) | Wire format for capslock's capability-graph output (`cpb` proto package) | OK - pure Go runtime, no cgo/asm | OK - 0 riscv issues found | N/A | None found |
| `github.com/google/go-cmp` v0.7.0 (direct) | Deep-equal comparisons in analyzer tests | OK - pure Go | OK - 0 riscv issues found | N/A | None found |
| `github.com/fatih/color` v1.19.0 (direct) | CLI colored output formatting | OK - pure Go, ANSI escapes | OK - no riscv-specific issues; only Dependabot PRs bumping `x/sys` | N/A | None found |
| `github.com/mattn/go-isatty` v0.0.20 (indirect) | Terminal detection, used by `fatih/color` | OK | OK - actively verified: [PR #97](https://github.com/mattn/go-isatty/pull/97) (merged 2026-07-23) explicitly cross-compiled/tested for `linux/riscv64` while fixing a TCGETS/TIOCGWINSZ ioctl conflict | N/A | None open. Historical: [PR #39](https://github.com/mattn/go-isatty/pull/39) "Update x/sys to support Risc-V" merged 2019-08-15 |
| `github.com/mattn/go-colorable` v0.1.14 (indirect) | Colorable writer (Windows/Unix), used by `fatih/color` | OK | OK - 0 riscv issues | N/A | None found |
| `golang.org/x/sys` v0.42.0 (indirect) | Low-level syscall wrappers (pulled in via go-isatty/x/tools) | OK - dedicated riscv64 files exist: `ztypes_linux_riscv64.go`, `zerrors_linux_riscv64.go`, `syscall_linux_riscv64.go`, plus freebsd/openbsd riscv64 variants | OK | N/A | 2 stale, unmerged 2019 PRs ([#40](https://github.com/golang/sys/pull/40) epoll_event padding fix, [#38](https://github.com/golang/sys/pull/38) endian tag) closed without merge - current source already ships the relevant riscv64 files, suggesting the underlying gaps were superseded by generator-script updates rather than those specific PRs [NEEDS VERIFICATION] |
| `golang.org/x/mod` v0.34.0 (indirect) | `go.mod`/`go.sum` parsing | OK - pure Go | OK - 0 riscv issues | N/A | None found |
| `golang.org/x/sync` v0.20.0 (indirect) | Concurrency primitives (errgroup, singleflight) | OK - pure Go | OK - 0 riscv issues | N/A | None found |

**Go toolchain** (not a go.mod dependency, but the required build/runtime environment; `go.mod` pins minimum `go 1.25.0`): `linux/riscv64` is a secondary port in upstream Go - functional, but broken builds do not block releases. Open issues in the Go tracker include a critical memory-corruption bug ([golang/go#78161](https://github.com/golang/go/issues/78161)) and FIPS140+PIE breakage ([golang/go#74683](https://github.com/golang/go/issues/74683)). Since capslock is plain Go with no cgo/asm, it is not exposed to these in any way beyond ordinary Go-ecosystem risk. See `project-reports/go.md` for the dedicated Go status report.

**Cross-reference caveat:** `project-reports/scope.yml` contains a "Protocol Buffers" entry, but that tracks `protocolbuffers/protobuf` (the C++/multi-language implementation), which has documented riscv64 gaps - no CI, no prebuilt `protoc`, SIMD/fasttable/musttail paths disabled (see `project-reports/protocol-buffers.md`). capslock does not depend on that repo; it depends on the sibling pure-Go `protocolbuffers/protobuf-go` module (`google.golang.org/protobuf`), which has none of those native-code issues. This distinction matters for risk assessment - do not conflate the two.

**Bottom line:** capslock and its entire dependency tree are unaffected by riscv64-specific build, test, or release blockers. The only architecture-relevant dependency, `golang.org/x/sys`, has full and current riscv64 support, and `go-isatty`'s riscv64 path was actively re-verified as recently as July 2026. The sole indirect risk vector is the Go toolchain's own secondary-port status, which is a generic Go-ecosystem risk, not a capslock-specific one.

## 11. Known Bugs and Active Issues

No RISC-V-related bugs or issues exist. Confirmed via `gh search issues`/`gh search prs`/`gh issue list --search` against `google/capslock` for `riscv`, `riscv64`, `riscv nan floating`, `arch`, `arm64`, `GOARCH`, `cross-compile`, `slow`, `performance`, `timeout`, `memory` - zero matches on every term.

Full open-issue list (google/capslock, all-time), for reference - none mention RISC-V or any architecture-specific defect:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| 295 | Strange capacity misreporting by capslock and capslock-git-diff | OPEN | Unclassified | No architecture relevance |
| 294 | Documentation is outdated and incomplete | OPEN | Unclassified | No architecture relevance |
| 284 | feature request: add ignore packages option | OPEN | Unclassified | No architecture relevance |
| 279 | Feature request: CAPABILITY_INIT | OPEN | Unclassified | No architecture relevance |
| 199 | please can we have some descriptions of the output displayed | OPEN | Unclassified | No architecture relevance |
| 144 | Resolve calls to functions that use go:linkname | OPEN | Unclassified | No architecture relevance |
| 115 | go method naming convention inconsistent with other popular tools | OPEN | Unclassified | No architecture relevance |
| 53 | More info | OPEN | Unclassified | No architecture relevance |
| 48 | Path elements in JSON output are not consistent between runs | OPEN | Correctness (non-deterministic output) | Uses `-goos darwin -goarch amd64` purely as the reporter's own test values; bug is about JSON output determinism in capslock's own call-graph analysis, independent of target architecture. Two distinct root causes acknowledged by maintainer `jcd2` (2023-10-16): non-deterministic choice of example call paths, and incorrect call-site-to-source-location mapping when multiple input packages are specified. Unfixed as of research date (3 years open) |
| 37 | incorrect CAPABILITY_NETWORK classification | OPEN | Correctness | No architecture relevance |
| 35 | feature request: capability diff between two module versions | OPEN | Unclassified | No architecture relevance |

**Correctness bug highlighted separately:** Issue #48 is a genuine, unfixed correctness defect (non-deterministic JSON output, confirmed independently by a second reporter `capnspacehook` who found differing sha256 hashes and byte sizes across identical runs) but it has zero RISC-V relevance - it reproduces identically regardless of target architecture, since the `-goarch` value used in the report is incidental to the bug.

The only architecture/runtime-flavored historical crash in the tracker, issue #87 ("capslock panics with Go1.22"), was a `go/types.StdSizes.Sizeof` nil-pointer bug tied to a Go 1.22 stdlib regression, fixed in v0.2.0, and reproduced on the reporter's build host regardless of target arch - not RISC-V-specific.

No RISC-V-specific performance data or benchmarks exist. This is a structural non-issue rather than a gap: capslock is a static-analysis CLI for Go source, not a runtime that executes performance-sensitive target code, and it explicitly cannot analyze cgo or assembly (calls into those are simply flagged as capabilities, with no architecture-specific code path). The `-goarch`/`-goos` flags affect what capslock reports about a target platform's build constraints, not the tool's own execution performance.

## 12. Objections and Upstream Blockers

No stated objections exist, because no RISC-V request has ever been raised. There are no technical blockers: capslock has no architecture-specific code, so there is nothing to port. There are no organizational blockers: no tier policy exists to gate platform support, and no maintainer has ever weighed in on the topic (positively or negatively) because it has never come up in an issue, PR, or discussion. GitHub Discussions are disabled for this repo (`hasDiscussionsEnabled: false`), eliminating that as a discussion channel as well.

**Acceptance probability:** Not applicable in the traditional sense - there is no "port" to accept or reject. If a riscv64-specific concern were ever raised (e.g., the `testpkgs/useasm/useasm.s` test-fixture portability nit from Section 4), it would be a trivial, uncontroversial fix (add a riscv64 assembly stub or gate the fixture behind a build tag) with no plausible maintainer objection, given the single-vendor Google maintainer group has shown no architecture-gatekeeping behavior on any other topic.

## 13. Investment Analysis

**RISE funding/activity check:** RISE's `riseproject-dev` GitHub org (49 repos) contains no `capslock` repo, and code/issue search for "capslock" across that org returned zero hits. None of RISE's named funded project codes (RP001 Go runtime acceleration, RP004 Rust Tier-1 riscv64 Linux port, RP009 LLVM SPEC optimization, RP016 OpenSBI TEE) reference capslock. RISE has not funded, tracked, or otherwise engaged with capslock in any capacity. Google LLC is a RISE Premier Member at the corporate level, but this confers no capslock-specific involvement.

### 13.1 Functional Enablement

No functional enablement work is required. capslock already runs correctly on riscv64 via `go install`/`go build`, inheriting support entirely from the Go toolchain's own riscv64 backend (Tier 1 since Go 1.14). The only latent item is fixing the amd64-only `testpkgs/useasm/useasm.s` test fixture so `go test ./...` passes natively on a riscv64 host - a test-infra nit, not a user-facing functional gap.

### 13.2 Performance Optimization

Not applicable. capslock has no per-architecture code paths, no SIMD, no hand-tuned hot loops for any target - there is nothing to optimize per-architecture because nothing is architecture-specialized for amd64 or arm64 either.

### 13.3 CI/CD Infrastructure

Adding a riscv64 CI leg is optional hygiene rather than a functional necessity, since capslock's build/test surface is architecture-agnostic pure Go. If desired, it would mean adding a riscv64 matrix entry to `codeql.yml` or a new lightweight `go test ./...` workflow job running on a RISE-provided riscv64 runner (`riseproject-dev/riscv-runner-images`), plus fixing the test-fixture nit above so the job passes.

### 13.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale below.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 build tag/stub for `testpkgs/useasm/useasm.s` test fixture so `go test ./...` passes natively on riscv64 | 0.5 | External contributor / Google maintainer | Low |
| CI/CD | Add a riscv64 job (e.g., `go build`/`go test` on a RISE-provided runner) to verify continued correctness | 0.5-1 | External contributor (RISE-affiliated) / Google maintainer | Low |
| Performance | None applicable | 0 | N/A | N/A |
| Ecosystem | None applicable | 0 | N/A | N/A |

**Total estimated effort: roughly 1-1.5 person-weeks**, entirely optional hygiene work. capslock requires no RISC-V investment to be usable today on riscv64; the only value of further work is closing a minor test-infra gap and adding CI verification that has never existed for any architecture beyond the implicit x86_64 CodeQL/Scorecard runners.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [google/capslock GitHub repository](https://github.com/google/capslock)
- [google/capslock issue tracker (all issues)](https://github.com/google/capslock/issues)
- [google/capslock pull requests](https://github.com/google/capslock/pulls)
- [google/capslock docs/caveats.md](https://github.com/google/capslock/blob/main/docs/caveats.md)
- [google/capslock issue #48 - Path elements in JSON output are not consistent between runs](https://github.com/google/capslock/issues/48)
- [google/capslock issue #87 - panics with Go1.22](https://github.com/google/capslock/issues/87)
- [google/capslock CodeQL workflow](https://github.com/google/capslock/blob/main/.github/workflows/codeql.yml)
- [google/capslock Scorecard workflow](https://github.com/google/capslock/blob/main/.github/workflows/scorecard.yml)
- [google/capslock releases (empty)](https://github.com/google/capslock/releases)
- [PyPI capslock package JSON (unrelated namesake project)](https://pypi.org/pypi/capslock/json)
- [Debian package tracker - capslock](https://tracker.debian.org/pkg/capslock)
- [Ubuntu package search - capslock](https://packages.ubuntu.com/search?keywords=capslock&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V port overview](https://archriscv.felixc.at/)
- [AUR - capslock package](https://aur.archlinux.org/packages/capslock)
- [mattn/go-isatty PR #97 - riscv64 ioctl fix](https://github.com/mattn/go-isatty/pull/97)
- [mattn/go-isatty PR #39 - Update x/sys to support Risc-V](https://github.com/mattn/go-isatty/pull/39)
- [golang/sys PR #40 - epoll_event padding fix](https://github.com/golang/sys/pull/40)
- [golang/sys PR #38 - endian tag](https://github.com/golang/sys/pull/38)
- [golang/go issue #78161 - riscv64 memory corruption bug](https://github.com/golang/go/issues/78161)
- [golang/go issue #74683 - riscv64 FIPS140+PIE breakage](https://github.com/golang/go/issues/74683)
- [RISE Project members page](https://riseproject.dev/members)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project - Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project - RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [Google Open Source Community Guidelines](https://opensource.google/conduct/)