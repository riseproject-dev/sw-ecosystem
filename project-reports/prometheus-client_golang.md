---
title: prometheus/client_golang
parent: Project Reports
color: green
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: prometheus/procfs
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="prometheus-client_golang" %}

# prometheus/client_golang

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for prometheus/client_golang<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

prometheus/client_golang is the Go instrumentation library for Prometheus. Its Go module path is `github.com/prometheus/client_golang`. Repository: [prometheus/client_golang](https://github.com/prometheus/client_golang).

- **Language and structure:** The code is pure Go. The tree has no assembly files, no riscv64-specific source and no architecture build tags. The only cgo is `prometheus/process_collector_mem_cgo_darwin.go`, which is macOS only.
- **License:** Apache-2.0.
- **Versioning:** It "generally follows Semantic Versioning". Breaking changes to the experimental API client do not trigger a new major release.
- **Go support policy:** It supports the two most recent major Go releases. Older versions may work, but fixes and support are given only for the currently supported releases. Details are said to be in `RELEASE.md`, which was not read.
- **Maintainers:** `MAINTAINERS.md` lists three people and no employers: Arianna Vespri (@vesari), Bartlomiej Plotka (@bwplotka) and Kemal Akkoyun (@kakkoyun). Company affiliations were not verified, so none are assigned here.
- **Foundation:** The README links the CNCF Slack channel `#prometheus-client_golang`, which does not by itself show foundation membership. The repository has no governance document beyond `MAINTAINERS.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `RELEASE.md` and `SECURITY.md`.
- **Community stance on new ports:** Data not available: nothing found addresses new architecture ports. Searches covered the repository page and the issue and PR searches listed in Section 15.
- **RISE membership:** The RISE members page lists 8 premier and 12 general members. Prometheus and client_golang appear in neither tier. Whether the Prometheus project or its maintainers' employers are RISE members is unconfirmed.

## 2. Port History and Upstreaming Timeline

There is no port in the usual sense. The library needed one dependency fix to build on riscv64, and that fix is upstream.

| Date | Event | Source |
|---|---|---|
| 2021-01-22 | PR #833 "Bump prometheus/procfs to 0.3.0 to fix building on riscv64" opened by zhsj | [PR #833](https://github.com/prometheus/client_golang/pull/833) |
| 2021-01-25 | PR #833 merged (merge commit `b8fcd28`; date is the merge commit date). It picks up prometheus/procfs PR #325, which fixed the riscv64 build failure (undefined `parseCPUInfo`) | [PR #833](https://github.com/prometheus/client_golang/pull/833) |
| 2021-03-18 | v1.10.0 tagged. It is the first tag containing #833; v1.9.0 (2020-12-17) does not contain it | Anonymous clone, tag ancestry check |
| 2023-08-14 | PR #1331 merged: golang.org/x/sys 0.10.0 to 0.11.0. The x/sys changelog includes "unix: add riscv_hwprobe for riscv64". No RISC-V change in this repo. First release v1.17.0 (2023-09-27) | [PR #1331](https://github.com/prometheus/client_golang/pull/1331) |
| 2024-10-01 | PR #1632 merged: x/sys 0.24.0 to 0.25.0. The changelog mentions RISC-V extension detection and hwprobe for kernel 6.10. No RISC-V change in this repo. First release v1.21.0 (2025-02-17) | [PR #1632](https://github.com/prometheus/client_golang/pull/1632) |
| 2026-06-02 | PR #2014 merged: x/sys 0.43.0 to 0.45.0. The changelog mentions "cpu: detect zbc extension on riscv64". No RISC-V change in this repo. First release v1.24.0 (2026-07-20) | [PR #2014](https://github.com/prometheus/client_golang/pull/2014) |
| 2026-10-08 | Go module proxy lists v1.25.0 as latest | [Go module proxy](https://proxy.golang.org/github.com/prometheus/client_golang/@latest) |

- **Key contributors:** zhsj authored #833. The employer is not stated. Dependabot authored #1331, #1632 and #2014.
- **Fully upstream:** Yes. The only riscv64 fix, #833, is merged on the main branch. No out-of-tree patches or forks were found.
- **Release attribution:** The CHANGELOG lists "[BUGFIX] Fix build on riscv64. #833" in the v1.11.0 section, but the merge commit `b8fcd28` (2021-01-25) is contained in v1.10.0, the earliest tag that includes it (`git tag --contains`). This report uses v1.10.0.
- **procfs:** #833 bumped prometheus/procfs to 0.3.0 to fix the riscv64 build. The current `go.mod` pins procfs v0.22.0 and golang.org/x/sys v0.49.0, and requires `go 1.26.0`.
- **First RISC-V commit:** `0c0d90f` (2021-01-23, Shengjing Zhu), "Bump prometheus/procfs to 0.3.0 to fix building on riscv64", merged by `b8fcd28` (PR #833, 2021-01-25).

## 3. Upstream Support Tier

- **Formal architecture tier policy:** None. The repository root has no `PLATFORMS.md`, `SUPPORT.md` or `docs/platforms/`. The only support policy is for Go versions (`supported_go_versions.json`: 1.27 stable and 1.26 oldstable), not architectures.
- **CI evidence:** `.github/workflows/test.yml` runs the tests on Linux amd64 (`ubuntu-latest`), Linux arm64 (`ubuntu-24.04-arm`), macOS and Windows against the supported Go versions. It has no riscv64 job (Section 7).
- **Official binaries:** None. client_golang is a library and ships no binaries. `Makefile.common` lists riscv64 in `DOCKER_ARCHS`, which is the shared Prometheus build template.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture-specific source files | 0 | 0 | 0 |
| In `DOCKER_ARCHS` (Makefile.common) | yes | yes | yes |
| Upstream CI | Yes (`ubuntu-latest`) | Yes (`ubuntu-24.04-arm`) | None |
| Known build break | none found | none found | procfs break, fixed in v1.10.0 |
| Tier policy | none found | none found | none found |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Code search against HEAD `315e020` found no architecture-specific code. Results come from search fragments, not whole files, and `go.mod` was not read.

| Query | Hits |
|---|---|
| `riscv` / `riscv64` | 3 files: `CHANGELOG.md`, `Makefile.common`, `.dockerignore` (documentation or build configuration only) |
| `vfloat32m1_t`, `rvv` | 0 |
| `extension:s` (assembly) | 0 |
| `go:build` with architecture tags | 0 (including amd64) |
| `import "C"` (cgo) | 1: `prometheus/process_collector_mem_cgo_darwin.go` |
| `GOARCH` | 2: the version collector and its test, which report the architecture as a label |
| Files named `_amd64.go`, `_arm64.go`, `_riscv64.go`, `_linux.go` | 0 |

| Component | amd64 | arm64 | riscv64 | Rating on riscv64 |
|---|---|---|---|---|
| Hand-written assembly | none | none | none | not applicable |
| C intrinsics / cgo | none (darwin-only cgo) | none (darwin-only cgo) | none | not applicable |
| JIT, SIMD dispatch, crypto, GC barriers | none found | none found | none found | not applicable |
| Core (registry, collectors, `promhttp`, `promauto`) | portable Go | portable Go | portable Go | scalar |
| Linux process collector | via procfs | via procfs | via procfs | scalar, depends on procfs |

No ISA extensions (RVV, Zba, Zbb) are used. No `arch/riscv/` directory exists. The `.dockerignore` entry `!.build/linux-riscv64/` and the `Makefile.common` entry are build configuration from the shared Prometheus template.

## 5. Build System, Cross-Compilation, and Toolchain

- **Build documentation:** The repository has no BUILDING.md. The README documents usage, not building, and the `Makefile` includes `Makefile.common` and defines `deps` and `test` targets. There is no Dockerfile, only a `.dockerignore`.
- **Build commands:** `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...` at HEAD `315e020` (2026-10-29) with Go 1.26.0 on x86_64 produced no errors. The tests were not run on riscv64 (hardware or QEMU).
- **Toolchain:** The Go toolchain is the only build dependency. Official linux-riscv64 Go binaries have been on go.dev/dl since Go 1.21, per the [RISE Go post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/). The current `go.mod` requires `go 1.26.0`.
- **QEMU usage:** None documented. A test run would be `go test -exec qemu-riscv64 ./prometheus/` with `GOOS=linux GOARCH=riscv64`. It has not been run.
- **Known build failures:** One. Before #833, riscv64 builds failed with undefined `parseCPUInfo` in procfs (fixed by procfs PR #325, picked up in #833).
- **Benchmarks:** `prometheus/benchmark_test.go` exists, so `go test -bench` can be run locally on riscv64 hardware.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Registry, collectors, `promhttp`, `promauto` | yes | yes | yes (portable Go) |
| Linux process collector (procfs) | yes | yes | yes, with procfs of at least 0.3.0 |
| Darwin process memory (cgo) | not applicable | not applicable | not applicable |

- **Functional gaps:** None found. The code has no riscv64-specific paths to be missing.
- **Performance gaps:** No published riscv64 benchmark or performance data exists. Searches covered GitHub issues, the web and the RISE blog. The code has no SIMD, so no vector-optimization gap applies.
- **Security hardening gaps:** Data not available: nothing was searched or found.
- **NaN / floating-point semantics:** The only related item is closed issue [#530](https://github.com/prometheus/client_golang/issues/530) (see Section 11). It involved conversion of integers too large for a float64 on s390x, ppc64el and arm64. RISC-V was not tested, and no RISC-V NaN issue was found (a "riscv nan floating" search returned 0 results).

## 7. CI/CD Infrastructure

Read from a clone at HEAD `315e020`. The workflows are `approve-workflows.yml`, `automerge-dependabot.yml`, `codeql-analysis.yml`, `golangci-lint.yml`, `govulncheck.yml`, `scorecard.yml`, `test.yml`, `update-go-versions.yml` and `validate.yml`. `test.yml` has Linux, Linux arm64 (`ubuntu-24.04-arm`), macOS and Windows test jobs. A search of the workflow directory for `riscv` finds nothing. There is no `.gitlab-ci.yml`, `Jenkinsfile` or `.cirrus.yml`. The shared `Makefile.common` lists riscv64 in `DOCKER_ARCHS`, but the repository has no Dockerfile.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Workflow files read | no | no | no |
| CI jobs | Linux, macOS, Windows tests | Linux arm64 tests | None |
| RISE runner usage | not applicable | not applicable | none found |
| Hardware | GitHub-hosted | GitHub-hosted arm runner | None |

RISE offers native RISC-V GitHub runners ([announcement, 2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/); [six weeks in, 2026-05-12](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)). No evidence was found that client_golang uses them.

## 8. Distribution and Release Status

| Channel | Status | Source |
|---|---|---|
| Go module proxy | Source-only, architecture-independent. Latest v1.25.0 (2026-10-08) | [proxy.golang.org](https://proxy.golang.org/github.com/prometheus/client_golang/@latest) |
| GitHub release binaries | Data not available (release listing denied). It is likely a source-only library, but this was not verified | n/a |
| PyPI | Not applicable. The literal name returned HTTP 404; it is a Go module | n/a |
| Debian | `golang-github-prometheus-client-golang-dev` is architecture "all" (1.21.1 in trixie, 1.23.0-1 in sid) | [Debian package](https://packages.debian.org/golang-github-prometheus-client-golang) |
| Ubuntu jammy riscv64 | Package `golang-github-prometheus-client-golang-dev` version 1.11.0-3 exists | [Ubuntu jammy riscv64](https://packages.ubuntu.com/zh-cn/jammy/riscv64/golang-github-prometheus-client-golang-dev) |
| Ubuntu 26.04 (resolute) | Unknown. packages.ubuntu.com returned HTTP 500 on both fetches. The package is expected to be arch "all" [NEEDS VERIFICATION] | n/a |
| Arch Linux RISC-V | Not listed or inconclusive. Arch does not package Go libraries as binaries | [archriscv](https://archriscv.felixc.at/?q=prometheus%2Fclient_golang) |
| Prometheus server (consumer) | Official `prom/prometheus-linux-riscv64` image on Docker Hub; Alpine v3.22 community riscv64 package | [Docker Hub](https://hub.docker.com/r/prom/prometheus-linux-riscv64), [Alpine](https://pkgs.alpinelinux.org/package/v3.22/community/riscv64/prometheus) |

**What a user must do:** import the module and build with the Go riscv64 toolchain. Buildability is not the same as a published riscv64 binary, and none exists because none applies. On Debian-family systems the architecture-independent `-dev` package supplies the source.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Go | build-dependency, critical | yes. Official linux-riscv64 binaries since Go 1.21 | Data not available | upstream (go.dev/dl) | RISE project RP001 improves the Go runtime on RISC-V |
| prometheus/procfs | runtime-dependency, critical | yes, since the PR #833 / procfs PR #325 fix. Current pin v0.22.0 | Data not available | source via Go modules | procfs 0.3.0 fixed the riscv64 build |
| golang.org/x/sys | runtime-dependency, critical | yes. Current pin v0.49.0; bumps #1331, #1632 and #2014 changed nothing for RISC-V in this repo | Data not available | source via Go modules | x/sys has RISC-V work: riscv_hwprobe (0.11.0), extension detection (0.25.0), zbc detection (0.45.0) |

- **Go:** The [RISE Go post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/) describes RP001. It covers RVV and Bitmanip use in the compiler and runtime, assembler vector support, runtime extension detection, faster `internal/bytealg`, RVA20/RVA22/RVA23 profile selection, `math/big` assembly, faster md5/sha256/sha512 and plugin support. The post gives no quantitative numbers.
- **prometheus/procfs:** This is the critical riscv64 dependency. It reads `/proc`, which is architecture-sensitive, and its riscv64 build failure was the only RISC-V break in this repo's history. The first known good version is 0.3.0 per #833. The v0.6.0 claim in other sources is unreconciled (see Section 2). The recursion was not performed, because procfs's own dependency list was not read.
- **golang.org/x/sys:** It provides syscall and CPU-feature packages including `cpu`. Its RISC-V changelog items are listed above. Neither the pinned version nor its riscv64 test status was read.
- **Indirect dependencies:** Not assessed.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #833](https://github.com/prometheus/client_golang/pull/833) | Bump prometheus/procfs to 0.3.0 to fix building on riscv64 | merged 2021-01-25 | build break, resolved | Only RISC-V-specific change |
| [Issue #530](https://github.com/prometheus/client_golang/issues/530) | TestCounterAddLarge fails on some architectures | closed 2019-05-04 | correctness (not RISC-V) | Opened 2019-01-22 against v0.9.0. Fixed by PR #567 |

- **Open RISC-V issues:** None found. `riscv`, `riscv64` and "riscv64 bug" issue searches returned 0 results (the "riscv64 performance" search returned only #530).
- **Correctness bugs (highlighted):** Issue #530 failed on s390x, ppc64el and arm64, while amd64, i386 and armhf passed. The float counter read 0 instead of 2^64 (18446744073709551616), and the integer counter read 18446744073709551615 instead of 0. Maintainer beorn7 attributed it to how integers too large for a float64 are converted. RISC-V was not tested. This is a float-conversion class of bug that could in principle recur on any architecture, so running `TestCounterAddLarge` on riscv64 is worthwhile.
- **Tracking issue:** None.

## 12. Objections and Upstream Blockers

- **Stated objections:** None found. No issue or PR discusses opposition to riscv64.
- **Technical blockers:** None found. The code is pure Go, and the one known dependency issue was fixed in 2021.
- **Organizational blockers:** None found. Unverified: whether the CI has riscv64 coverage, which maintainers would need to accept or maintain.
- **Acceptance probability:** Not applicable for source changes, because none are needed. A CI addition would be the only upstream ask, and there is no basis for estimating its acceptance.

## 13. Readiness Assessment

- **Color:** green
- **Release provider:** upstream
- **Justification:** Step 0 shortcut. client_golang is a pure-Go library with no assembly, no arch build tags and no riscv64-specific code. The only cgo is darwin-only. It is published as architecture-independent source via the [Go module proxy](https://proxy.golang.org/github.com/prometheus/client_golang/@latest), so it inherits riscv64 from the Go toolchain. Its only riscv64 problem was a procfs build break, fixed in [PR #833](https://github.com/prometheus/client_golang/pull/833) (merged 2021-01-25, first shipped in v1.10.0). The later x/sys bumps (#1331, #1632, #2014) change nothing for RISC-V in this repo. Confidence is medium. The CI workflows, `go.mod` and a riscv64 build were checked from a clone, and the tests were not run on riscv64.
- **Pending work that could change the grade:** None. There is no riscv64 tracking issue, no open RISC-V PRs, and no RISE involvement found. Unverified: riscv64 test results and Ubuntu 26.04 package status. These would change the grade only if a riscv64 build or test break were found.

## 14. Investment Analysis

**RISE coverage check:** No RISE blog post, repository, runner usage or funded work for client_golang was found (feed of 10 posts back to 2026-06-26, an index of 37 posts, and searches of `org:riseproject-dev`). RISE's Go work (RP001) benefits client_golang indirectly through the Go runtime and toolchain. Effort figures below are planning estimates, not research findings.

### 14.1 Functional Enablement

No source changes are needed. The one verification item is to read `go.mod`, confirm the procfs and x/sys pins, and run `go build ./... && go test ./...` with `GOARCH=riscv64` (including `TestCounterAddLarge`) on real hardware or under QEMU.

### 14.2 Performance Optimization

The library has no SIMD or assembly, so there is no optimization work to size. The one item is to run `go test -bench` in `prometheus/` on riscv64 hardware to produce the first published numbers, since none exist.

### 14.3 CI/CD Infrastructure

Confirm whether upstream CI covers riscv64. If it does not, propose a riscv64 test job using the RISE RISC-V runners. Any upstream CI change depends on maintainer agreement.

### 14.4 Ecosystem Enablement

Not applicable. Dependents consume the library as Go source and inherit riscv64 from the toolchain.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Read go.mod, verify procfs and x/sys pins, run build and test on riscv64 | 0.5 | RISE / platform team | Medium |
| Performance | Run `go test -bench` on riscv64 and publish results | 0.5 | RISE / platform team | Low |
| CI/CD | Check upstream CI; propose riscv64 job on RISE runners if absent | 1 | RISE with upstream maintainers | Medium |
| Ecosystem | None | 0 | not applicable | Low |

## 15. References

- [prometheus/client_golang repository](https://github.com/prometheus/client_golang)
- [PR #833: Bump prometheus/procfs to 0.3.0 to fix building on riscv64](https://github.com/prometheus/client_golang/pull/833)
- [PR #1331: Bump golang.org/x/sys from 0.10.0 to 0.11.0](https://github.com/prometheus/client_golang/pull/1331)
- [PR #1632: bump golang.org/x/sys from 0.24.0 to 0.25.0](https://github.com/prometheus/client_golang/pull/1632)
- [PR #2014: bump golang.org/x/sys from 0.43.0 to 0.45.0](https://github.com/prometheus/client_golang/pull/2014)
- [PR #779: go vet string(int) fixes (unrelated)](https://github.com/prometheus/client_golang/pull/779)
- [Issue #530: TestCounterAddLarge fails on some architectures](https://github.com/prometheus/client_golang/issues/530)
- [Go module proxy: client_golang latest](https://proxy.golang.org/github.com/prometheus/client_golang/@latest)
- [sapcc/maia PR #102 (release notes entry for the riscv64 build fix)](https://github.com/sapcc/maia/pull/102)
- [Discussion #1239 on limited hardware (not RISC-V specific)](https://github-redirect.dependabot.com/prometheus/client_golang/discussions/1239)
- [Debian: golang-github-prometheus-client-golang](https://packages.debian.org/golang-github-prometheus-client-golang)
- [Debian sid: golang-github-prometheus-client-golang-dev (arch all, 1.23.0-1)](https://packages.debian.org/zh-cn/sid/i386/golang-github-prometheus-client-golang-dev)
- [Ubuntu jammy riscv64: golang-github-prometheus-client-golang-dev 1.11.0-3](https://packages.ubuntu.com/zh-cn/jammy/riscv64/golang-github-prometheus-client-golang-dev)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=prometheus%2Fclient_golang)
- [Docker Hub: prom/prometheus-linux-riscv64](https://hub.docker.com/r/prom/prometheus-linux-riscv64)
- [Alpine v3.22 riscv64 prometheus package](https://pkgs.alpinelinux.org/package/v3.22/community/riscv64/prometheus)
- [RISE: Advancing Go on RISC-V (2025-04-04)](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE: Announcing the RISE RISC-V Runners (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE: RISC-V Runners, six weeks in (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE blog index](https://riseproject.dev/category/blog/)
- [RISE members](https://riseproject.dev/members/)
- [RISE wheel builder (Python only, no client_golang)](https://riseproject.gitlab.io/python/wheel_builder/)