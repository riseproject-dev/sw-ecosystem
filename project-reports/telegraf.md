---
title: Telegraf
parent: Project Reports
color: yellow
---

# Telegraf

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Telegraf<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Telegraf is a plugin-driven server agent for collecting, processing, aggregating, and writing metrics, written in Go by InfluxData, Inc. It is the collection component of the InfluxData time-series platform (paired with InfluxDB).

Governance is single-vendor, not foundation-based. Telegraf is not part of CNCF, Apache Software Foundation, Linux Foundation, or any other neutral foundation - it is wholly owned and controlled by InfluxData, Inc. License is MIT. There is no MAINTAINERS, OWNERS, or CODEOWNERS file in the repository; contributions require signing InfluxData's own Contributor License Agreement ([influxdata.com/legal/cla](https://www.influxdata.com/legal/cla/)) before a PR is accepted. InfluxData also sells a paid "Telegraf Enterprise" tier alongside the open-source project - a commercial open-core model, not community governance.

The most active human maintainer is Sven Rebhan (@srebhan, InfluxData employee), with 500+ recent commits and review/merge authority over most external contributions. Joshua Powers (@powersj, InfluxData at the time) authored the riscv64 port. The single largest committer overall is `dependabot[bot]` (1,400+ automated dependency-bump commits), reflecting heavy CI automation rather than a broad external maintainer base.

Community culture toward new architecture ports is pragmatic and welcoming in practice, though undocumented as formal policy. `docs/SUPPORTED_PLATFORMS.md` defines OS-version support windows tied to vendor lifecycles but says nothing about CPU-architecture tiers; it states Telegraf "may work and produce builds for other operating systems and users are welcome to build their own binaries," with bug reports restricted to "supported platforms." In practice, riscv64, loong64, s390x, mips/mipsel, and ppc64le have all been added and are actively maintained in CI, and external hardware-vendor contributors (e.g., Loongson, for loong64 packaging fixes in PR #17381) have gotten architecture-specific fixes merged. No RISE (RISC-V Software Ecosystem) membership or involvement was found for Telegraf or InfluxData.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-10-26 | PR #8317 disables the `inputs.ras` plugin on mips64, mips64le, ppc64le, and riscv64 (a workaround, not enablement - riscv64 was not yet a build target) | [PR #8317 context, CHANGELOG.md](https://github.com/influxdata/telegraf/blob/master/CHANGELOG.md) |
| 2021-12-03 | Issue #10216 opened: "Add support for RISC-V architecture" (feature request citing Go 1.14+ experimental riscv64 support and growing SBC adoption) | [Issue #10216](https://github.com/influxdata/telegraf/issues/10216) |
| 2021-12-13 | PR #10262 opened: "feat: add builds for riscv64" | [PR #10262](https://github.com/influxdata/telegraf/pull/10262) |
| 2021-12-22 | PR #10262 merged by Joshua Powers (@powersj, InfluxData); community-tested by popey (RISC-V VM) and philroche (BeagleV board, Fedora, kernel 5.15.0-61.fc33.riscv64) before merge; issue #10216 closed as completed | [PR #10262](https://github.com/influxdata/telegraf/pull/10262) |
| 2022-01-05 | First shipped release with riscv64 builds: v1.21.2 ("Added riscv64 Linux builds", CHANGELOG.md line 4890) | [CHANGELOG.md](https://github.com/influxdata/telegraf/blob/master/CHANGELOG.md) |
| 2022-12-08/12 | PR #12360 (host-endianness refactor, extends little-endian architecture list including riscv64) and PR #9633 both merged, shipped in v1.25.0 | [PR #12360](https://github.com/influxdata/telegraf/pull/12360) |
| 2026-02-03 | PR #18185 (dependabot gopsutil bump 4.25.11->4.25.12, carries a riscv CPU-parser fix) closed unmerged, superseded | [PR #18185](https://github.com/influxdata/telegraf/pull/18185) |
| 2026-02-17 | PR #18293 (dependabot gopsutil bump 4.25.11->4.26.1) merged, shipped in v1.37.3; brings in upstream gopsutil's "[cpu][linux]: add riscv cpu parser" | [PR #18293](https://github.com/influxdata/telegraf/pull/18293) |
| 2026-09-07 | v1.40.0 released, riscv64 `.deb`/`.rpm`/`.tar.gz` confirmed shipping (verified by direct ELF-header inspection, see Section 8) | [InfluxData downloads](https://www.influxdata.com/blog/apple-m1-and-risc-v-support-for-telegraf/) |

Key contributors: Joshua Powers (@powersj, InfluxData) implemented the port; Sven Rebhan (@srebhan, InfluxData) maintains architecture-detection plumbing (endianness); community testers popey and philroche validated the initial port on a VM and real BeagleV hardware respectively, but neither is a recurring maintainer.

The port is fully upstream. There are no out-of-tree patches, forks, or third-party riscv64 enablement layers - riscv64 is a native target in InfluxData's own Makefile and CircleCI configuration, and the resulting binaries are published on InfluxData's own release infrastructure.

## 3. Upstream Support Tier

No formal, documented tier policy exists for CPU architectures. `docs/SUPPORTED_PLATFORMS.md` covers only OS-version lifecycles. In practice, riscv64 is treated as a first-class packaging target (same Makefile pattern, same CI executor, same release/nightly pipelines as amd64/arm64) but is **not** exercised by the automated test suite - see Section 7 for the CI evidence.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | Yes | Yes | Yes (CircleCI `riscv64-package`, cross-compiled) |
| Upstream CI runs tests | Yes, native, race detector (`test-go-linux`) | Yes, native Apple Silicon via macOS executor (`test-go-mac`) | No - no `test-go-riscv64` job exists |
| Official release binaries | Yes (.deb/.rpm/.tar.gz) | Yes (.deb/.rpm/.tar.gz) | Yes (.deb/.rpm/.tar.gz), confirmed via ELF-header inspection of the shipped binary |
| Release-blocking gate | `test-go-linux` (amd64) | `test-go-mac` | Requires only `test-go-linux` (amd64) to pass first - riscv64 itself is never a merge gate |

Evidence: [.circleci/config.yml](https://github.com/influxdata/telegraf/blob/master/.circleci/config.yml) (full 917-line file read directly); GitHub Actions workflows in `.github/workflows/` contain zero riscv64 references (verified across all 5 files - see Section 7).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Telegraf is a pure Go project with **zero** architecture-specific implementation code for any architecture. There are no assembly files (`.s`) anywhere in the repository, no CGO arch guards, no JIT backend, and no SIMD/intrinsics code. Searches for `filename:_riscv64.go`, `filename:_arm64.go`, `filename:_amd64.go`, `vfloat32m1_t`, `rvv`, and `path:arch/riscv` across the repository confirm this: the only arch-suffixed Go files that exist at all (`pdh_arm64.go`, `pdh_amd64.go` in `plugins/inputs/win_perf_counters`) are Windows-only PDH counter bindings, irrelevant to riscv64 since Telegraf does not target Windows/riscv64.

What does exist is Go `//go:build` constraint gating on generic, platform-agnostic code:

- `internal/host_endianness_le.go` / `host_endianness_be.go`: riscv64 is bucketed with ~9 other little-endian architectures, all resolving to the same `binary.LittleEndian` constant. No arch-specific logic.
- `plugins/outputs/sql/sqlite.go`, `plugins/inputs/sql/drivers_sqlite.go` (+ test): a build-tag allowlist for the pure-Go `modernc.org/sqlite` driver's supported platforms; riscv64/linux is included.
- `plugins/inputs/ras/`: the RAS plugin is disabled on riscv64 (and mips64, mips64le, ppc64le) via build constraints - documented in CHANGELOG.md as PR #8317, "Disable RAS input plugin on specific Linux architectures." This is a functional gap, not a performance gap - RAS (hardware error reporting) is simply unavailable on riscv64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Assembly / SIMD / intrinsics | None (pure Go, no arch code anywhere) | None | None |
| Endianness handling | Generic, full parity | Generic, full parity | Generic, full parity |
| `inputs.ras` plugin | Enabled | Enabled | **Disabled** (build-gated out, PR #8317) |
| SQLite driver (`modernc.org/sqlite`) | Supported | Supported | Supported (pure-Go/transpiled-C, no cgo) |

Because Telegraf is a monitoring/metrics agent, not a performance-optimization library, the Section 2 optimization-purpose modifier in the color model does not apply to this project - see Section 13.

## 5. Build System, Cross-Compilation, and Toolchain

Telegraf is a pure Go project - there is no CMakeLists.txt, no cmake toolchain file, and no Dockerfile specific to riscv64 anywhere in the repository. Because Telegraf builds with `CGO_ENABLED=0`, riscv64 binaries are produced entirely by Go's built-in cross-compiler; no riscv64 GCC/Clang cross-toolchain, sysroot, or QEMU is required to build the daemon.

Exact build command (from [Makefile](https://github.com/influxdata/telegraf/blob/master/Makefile)):

```
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build -ldflags "-w -s" ./cmd/telegraf
```

Package command:

```
make package include_packages="$(make riscv64)"
```

which expands `riscv64` to `linux_riscv64.tar.gz riscv64.rpm riscv64.deb` and shells out to `fpm --architecture riscv64` for the `.deb`/`.rpm` artifacts.

Toolchain requirement: `go.mod` specifies `go 1.27.0`. This floor is driven by general language/toolchain needs elsewhere in the codebase, not by any riscv64-specific requirement - Go's linux/riscv64 port has existed since Go 1.14 (experimental) and stabilized progressively through 1.15-1.17. No GCC/Clang minimum applies because CGO is disabled for all cross-builds.

QEMU is not used anywhere in the build or CI pipeline - confirmed by `grep -in qemu` returning zero matches across `.circleci/config.yml`, `.github/workflows/`, and `scripts/`.

`scripts/check-deps.sh` includes `linux/riscv64` in its list of 18 target platforms for a `go list`-based dependency/license audit (part of the CI `lint-linux` job) - this exercises `go list` in cross-compiled mode but not `go test`.

No known build failures were found for riscv64 in issue history.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core agent (inputs/outputs/processors/aggregators) | Full | Full | Full |
| `inputs.ras` plugin | Available | Available | **Not available** (build-gated out) |
| SQLite driver support (`modernc.org/sqlite`) | Available | Available | Available |
| Native binary execution tested in CI | Yes | Yes (real Apple Silicon via macOS executor) | **No** (cross-compiled and packaged only, never executed in CI) |
| CPU-info parsing correctness (via gopsutil) | Mature | Mature | Improved as of PR #18293 (Feb 2026), which added a dedicated `riscvISAParse()` for rv64 ISA strings in the shared gopsutil `cpu_linux.go` |

**Functional gaps:** `inputs.ras` is unavailable on riscv64. No other functional gap was found in the research.

**Performance gaps:** Not applicable in the SIMD/JIT sense - Telegraf has no hand-tuned or intrinsics code for any architecture, so riscv64 is not "behind" amd64 or arm64 on this axis; none of them have it. Data not available: no published performance benchmarks comparing Telegraf on riscv64 vs. amd64/arm64 (confirmed by searching InfluxData's own blog post, the RISE Project blog, and general web search - none report throughput, CPU%, memory, or latency figures for Telegraf on any architecture).

**Security hardening gaps:** Data not available: no riscv64-specific security-hardening comparison was found or searched for beyond the general build/test posture described in Section 3 and Section 7.

**NaN / floating-point semantics issues:** Data not available: no RISC-V-specific floating-point or NaN-handling issue was found in the issue tracker (see Section 11).

## 7. CI/CD Infrastructure

**GitHub Actions** (`.github/workflows/`: `linter.yml`, `milestones.yml`, `pr-target-branch.yml`, `readme-linter.yml`, `semantic.yml`) contain **zero** riscv64 references, confirmed by reading all five files directly. All run on `ubuntu-latest` and perform only meta-checks (markdown lint, milestone triage, PR target-branch validation, semantic PR-title checks, README lint).

**CircleCI** (`.circleci/config.yml`, 917 lines, full content read) is Telegraf's actual build/test/release pipeline and contains the real riscv64 job:

```yaml
riscv64-package:
  parameters:
    nightly:
      type: boolean
      default: false
  executor: telegraf-ci
  steps:
    - package-build:
        type: riscv64
        nightly: << parameters.nightly >>
```

`executor: telegraf-ci` resolves to the `quay.io/influxdb/telegraf-ci:1.27.0` Docker image running on a `large` resource-class **amd64** CircleCI host - this is cross-compilation, not a native riscv64 runner and not QEMU emulation. The shared `package-build` command runs `make package include_packages="$(make riscv64)"` and stores/persists artifacts; there is no test step, no binary execution, and `grep -in qemu` across the entire CircleCI config returns zero matches.

The `riscv64-package` job's only upstream dependency is `test-go-linux`, which runs Telegraf's Go unit-test suite on amd64 with no `GOARCH` override (unlike `test-go-linux-386`, which explicitly sets `GOARCH=386`). There is no `test-go-linux-riscv64` job and no riscv64 entry in `test-integration`.

The job fires in the `check` workflow (on any branch except `master`, and on tags) and again in the scheduled `nightly` workflow, feeding both the release-signing chain (`package-sign` -> `package-consolidate` -> `release`) and the nightly S3 sync to `s3://dl-influxdata-com/telegraf/nightlies/`.

No RISE RISC-V runner references were found anywhere in the CI configuration. No riscv64 hardware is used at any stage - only amd64-hosted cross-compilation.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (CircleCI, native) | Yes (CircleCI + macOS executor for Mac tests) | Yes (CircleCI, cross-compiled on amd64 host) |
| CI runs tests | Yes, native, with race detector | Yes, on real Apple Silicon (macOS executor) | **No** - packaging job only, no test execution, no QEMU |
| CI publishes release artifact | Yes | Yes | Yes (.deb/.rpm/.tar.gz, release + nightly) |
| Runner type | Native amd64 CircleCI host | Native macOS/Apple Silicon executor | amd64 CircleCI host, cross-compile only |

**Conclusion:** Telegraf continuously cross-compiles and packages riscv64 release artifacts in CircleCI on every non-master PR/tag and nightly, but has zero automated test coverage that actually runs on or emulates riscv64. The only real-world execution validation on record is the one-time manual community testing performed on PR #10262 in December 2021 (a RISC-V VM by popey, and a BeagleV board running Fedora by philroche) - not a recurring, automated CI signal.

## 8. Distribution and Release Status

**Official upstream releases (GitHub Releases / dl.influxdata.com):** riscv64 packages ship with every release. Confirmed via direct download and ELF-header inspection: `telegraf_1.40.0-1_riscv64.deb` (v1.40.0, released 2026-09-07) was downloaded from `dl.influxdata.com`, its control file lists `Architecture: riscv64`, and the extracted `usr/bin/telegraf` binary's ELF header shows `e_machine=243` (`EM_RISCV`), 64-bit, little-endian, `ET_EXEC` - a genuine RISC-V machine-code binary, not a mislabeled or placeholder file. Sibling artifacts `telegraf-1.40.0_linux_riscv64.tar.gz` and `telegraf-1.40.0-1.riscv64.rpm` were confirmed present at full size (~80MB, matching amd64 siblings) on the same CDN. riscv64 packages back through v1.38.1-v1.39.3 were also confirmed present by filename on the GitHub releases pages. Nightlies (`docs/NIGHTLIES.md`) list `telegraf_nightly_riscv64.deb`, `telegraf-nightly.riscv64.rpm`, `telegraf-nightly_linux_riscv64.tar.gz`.

**Ubuntu:** Not in the official archive for any architecture as of 26.04 (resolute) - `packages.ubuntu.com` search for "telegraf" under `suite=resolute` returns "Sorry, your search gave no results." Broadened search shows telegraf existed only in Ubuntu 22.04 (Jammy) universe, version `1.21.4+ds1-0ubuntu2`, with riscv64 among its built architectures (amd64, arm64, armhf, ppc64el, riscv64, s390x) - it was dropped from the archive after Jammy and does not appear in 24.04, 25.10, or 26.04.

**PyPI:** Not applicable. `https://pypi.org/pypi/telegraf/json` returns HTTP 404 - Telegraf is a Go binary agent, not a Python package, and no such PyPI project exists.

**Arch Linux RISC-V port** (`archriscv.felixc.at`): No "telegraf" entry found - not packaged in this unofficial port tracker.

**Third-party trackers:** rpmfind.net and openSUSE Tumbleweed ports list riscv64 Telegraf RPMs, following upstream packaging.

**What a user must do to get a working binary:** download the official `.deb`/`.rpm`/`.tar.gz` directly from InfluxData's release page or `dl.influxdata.com` (or add InfluxData's own APT/YUM repository) - Telegraf is not obtainable via a stock Ubuntu, Debian, Fedora, or Arch riscv64 package repository as of this report.

## 9. Dependencies

Telegraf is a pure-Go project (`go.mod`, module `github.com/influxdata/telegraf`, Go 1.27, ~200 direct + ~360 indirect dependencies) - no CMakeLists.txt/setup.py/Cargo.toml/package.json exists. Because Telegraf uses `CGO_ENABLED=0`, it has no cgo-mandatory C dependencies in its critical path.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| golang/go (toolchain) | Compiler/runtime | OK, long-standing linux/riscv64 port | OK | OK | Go's riscv64 support dates to Go 1.14 |
| klauspost/compress | Compression (s2/zstd/gzip/flate) | OK via generic Go path (amd64/arm64 asm bypassed) | OK | OK | No riscv64-specific issue found |
| golang/snappy | Compression | OK, pure Go, no asm | OK | OK | None found |
| pierrec/lz4/v4 | Compression | OK via generic path (only amd64/arm32 have asm) | OK | OK | riscv64 runs the plain-Go codec, same as most non-x86/arm32 archs |
| andybalholm/brotli | Compression (Go port) | OK, pure Go, no cgo | OK | OK | None found |
| zeebo/blake3 | Hashing | OK, generic fallback exists | OK | OK | Historical arm64-breaking bug (issue #8) was fixed by gating asm to amd64-only |
| minio/highwayhash | Hashing | OK, non-amd64 generic implementation | OK | OK | None found |
| klauspost/cpuid/v2 | CPU feature detection | OK - RISC-V support explicitly added (issue #158, closed 2026-06-16) | OK | OK | Was a real gap, now resolved upstream |
| apache/arrow-go/v18 | Columnar format/numerics | Builds via generic Go path (no riscv64 asm to trip over) | Likely OK | OK | Open arm64-NEON correctness bug (#983) shows this library's asm is not uniformly solid on non-amd64 - recommend explicit riscv64 testing rather than assuming by analogy |
| gonum.org/v1/gonum | Numerics | OK, internal/asm is amd64-only with generic fallback | Historically flaky on non-amd64 in old issues (#1222, #79, both closed) | OK | Watch for numeric edge-case failures |
| modernc.org/sqlite (+ modernc.org/libc) | SQLite driver, transpiled-C-to-Go (not cgo) | Should be OK; modernc.org/libc has added riscv64 support in recent versions | Not independently verified this session | Not independently verified | Telegraf deliberately avoids the cgo `mattn/go-sqlite3` driver, sidestepping C-toolchain cross-compile issues that affect riscv64 |
| segmentio/asm | Low-level byte ops | Expected OK via documented generic-Go fallback | Not verified | Not verified | No issues found |

**Deep-dive - shirou/gopsutil (indirect, via CPU/host stats plugins):** PR #18293 (merged 2026-02-17, shipped v1.37.3) bumped gopsutil/v4 to 4.26.1, pulling in a dedicated `riscvISAParse()` function in the shared `cpu/cpu_linux.go` file, correctly parsing the `rv64`-prefixed ISA string from `/proc/cpuinfo`. This is complete, with no TODO/stub markers, and is the one piece of genuinely RISC-V-specific logic found anywhere in Telegraf's dependency stack.

**projects.yml cross-reference:** None of Telegraf's Go-module dependencies have their own `project-reports/*.md` entry in this repository's scope except Go itself (see `project-reports/go.md`) and `modernc.org/sqlite` (tracked in projects.yml, no report yet). The C/C++ libraries tracked elsewhere in this repository's projects.yml (brotli, SQLite, LZ4, OpenSSL, BoringSSL) are not the artifacts Telegraf links against - Telegraf uses pure-Go reimplementations (andybalholm/brotli, klauspost/compress's own codecs, golang.org/x/crypto) rather than the C libraries, so those reports do not describe Telegraf's exposure.

## 10. Ecosystem Status

Not applicable. Telegraf is a standalone Go binary agent with a plugin architecture compiled into a single executable - it has no dependent package ecosystem (no PyPI, npm, Maven, or Kubernetes-operator consumers) that would separately need riscv64 enablement. This section is omitted per the report's Section 10 scoping rule.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#10216](https://github.com/influxdata/telegraf/issues/10216) | Add support for RISC-V architecture | Closed (completed) | N/A - feature request | Resolved by PR #10262, no follow-up RISC-V bug reports since |

No open issues in `influxdata/telegraf` mention RISC-V or riscv64 (confirmed by searching `riscv64 performance`, `riscv64 bug`, `riscv nan floating`, `riscv64 crash/panic/segfault`, and plain `riscv64` across all issue states). No correctness bugs specific to RISC-V were found. No published performance benchmarks exist for Telegraf on riscv64 in any source checked (InfluxData's own blog, RISE Project blog, general web search).

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support were found anywhere in the issue/PR history - PR #10262 merged nine days after being opened with no blocking review comments, only positive community validation (popey's VM test, philroche's BeagleV hardware test). No technical blockers exist: Telegraf's `CGO_ENABLED=0` build model means there is no C-toolchain cross-compile fragility of the kind that affects cgo-dependent Go projects on riscv64.

The only organizational consideration is that InfluxData is a single-vendor, CLA-gated project with no foundation oversight - acceptance of any future riscv64-related contribution (e.g., adding riscv64 to the automated test matrix) depends entirely on InfluxData's own maintainers (chiefly Sven Rebhan) choosing to prioritize it, with no external governance body to appeal to. Given the project's track record of accepting other niche-architecture ports (loong64, s390x, mips/mipsel, ppc64le) from external contributors, acceptance probability for a well-formed PR (e.g., adding a `test-go-linux-riscv64` job using QEMU) appears high, but this is inference from precedent, not a confirmed statement - [NEEDS VERIFICATION].

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- Not an optimization-purpose project (Telegraf is a monitoring/metrics agent; the "would it still deliver its value with only generic scalar code" test is trivially "yes" - it has no SIMD/JIT/crypto-performance value proposition). The optimization-purpose modifier from the color model's Step 2 therefore does not apply, and no optimization level is assigned.
- **Justification:** Telegraf's upstream CircleCI pipeline builds a riscv64 package on every non-master branch, PR, tag, and nightly run ([.circleci/config.yml](https://github.com/influxdata/telegraf/blob/master/.circleci/config.yml)), and upstream (InfluxData) publishes the resulting `.deb`/`.rpm`/`.tar.gz` artifacts directly on its own release channel, confirmed by ELF-header inspection of the v1.40.0 riscv64 binary showing `EM_RISCV`. However, the `riscv64-package` job never runs Telegraf's Go test suite under `GOARCH=riscv64` - it depends only on `test-go-linux` (amd64 tests) - and no QEMU emulation or riscv64 hardware runner exists anywhere in CI. Per the color model's CI evidence rule, "a job that builds riscv64 but does not run the test suite... counts as build-only. Build-only CI sets the primary color to yellow, not blue or green." That is the deciding fact here.
- **Pending work that could change the grade:** No open PRs or issues addressing riscv64 test execution were found. No RISE involvement exists (confirmed by searching riseproject.dev's blog, member list, and GitHub org - see Sections 1 and 12 research). Adding a `test-go-linux-riscv64` job (via QEMU, since no riscv64 hardware runner currently exists in Telegraf's CI) would be the single change that could move this project from yellow to blue; adding it as a release-blocking gate alongside artifact publication would support green.

## 14. Investment Analysis

RISE has not funded or performed any work on Telegraf - confirmed by searching riseproject.dev's blog (all posts fetched via RSS, none mention Telegraf), the riseproject-dev GitHub org's 25 public repositories (none related to Telegraf), and GitHub code search across `org:riseproject-dev` (only two incidental hits, both references within this repository's own project-reports queue, not RISE work product). All investment items below are therefore fully unaddressed and not double-counted against any existing RISE effort.

### 14.1 Functional Enablement

Functional enablement is essentially complete. The one known gap is `inputs.ras` being disabled on riscv64 (PR #8317) - re-enabling it would require porting or stubbing whatever Linux RAS (Reliability, Availability, Serviceability) kernel interface the plugin depends on for riscv64, which may not even be meaningful on current riscv64 hardware/kernel support for RAS. This is a low-priority, narrow-scope item.

### 14.2 Performance Optimization

Not applicable. Telegraf has no architecture-specific optimization code for any architecture (see Section 4) - there is no "optimization gap" to close on riscv64 relative to amd64/arm64, since none of them receive hand-tuned treatment.

### 14.3 CI/CD Infrastructure

The primary investment opportunity: add a riscv64 test-execution job to `.circleci/config.yml`, most practically via QEMU user-mode emulation (`GOARCH=riscv64 go test` under `qemu-riscv64`) since Telegraf has no existing riscv64 hardware runner and no RISE runner integration. This would require: (1) provisioning or scripting a QEMU-based test execution step parallel to the existing `riscv64-package` build step, (2) triaging any test failures specific to the emulated environment (timing-sensitive tests, filesystem/network assumptions), and (3) optionally wiring it as a required check to support a future green rating. Given Telegraf's pure-Go, no-cgo architecture, this is a moderate-not-large effort.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 established Telegraf has no dependent package ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add QEMU-based riscv64 test execution to CircleCI (`test-go-linux-riscv64` equivalent) | 2-4 | InfluxData maintainers or external contributor (upstream CLA required) | High |
| CI/CD | Wire riscv64 test job as a required/release-blocking check once stable | 1 | InfluxData maintainers | Medium |
| Functional | Investigate/port `inputs.ras` for riscv64 or confirm it is a permanent N/A | 1-2 | InfluxData maintainers or external contributor | Low |
| Dependency hardening | Explicitly test `apache/arrow-go/v18` and `gonum.org/v1/gonum` numeric paths on riscv64 given precedent of arm64-specific bugs in both (issues #983, #1222, #79) | 1 | InfluxData maintainers or external contributor | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Issue #10216 - Add support for RISC-V architecture](https://github.com/influxdata/telegraf/issues/10216)
- [PR #10262 - feat: add builds for riscv64](https://github.com/influxdata/telegraf/pull/10262)
- [PR #12360 - chore: Move host-endianness definition to internal](https://github.com/influxdata/telegraf/pull/12360)
- [PR #9633 - feat(inputs.powerdns_recursor): Support for new PowerDNS recursor control protocol](https://github.com/influxdata/telegraf/pull/9633)
- [PR #18293 - chore(deps): Bump gopsutil/v4 from 4.25.11 to 4.26.1](https://github.com/influxdata/telegraf/pull/18293)
- [PR #18185 - chore(deps): Bump gopsutil/v4 from 4.25.11 to 4.25.12 (superseded)](https://github.com/influxdata/telegraf/pull/18185)
- [.circleci/config.yml](https://github.com/influxdata/telegraf/blob/master/.circleci/config.yml)
- [Makefile](https://github.com/influxdata/telegraf/blob/master/Makefile)
- [CHANGELOG.md](https://github.com/influxdata/telegraf/blob/master/CHANGELOG.md)
- [docs/SUPPORTED_PLATFORMS.md](https://github.com/influxdata/telegraf/blob/master/docs/SUPPORTED_PLATFORMS.md)
- [docs/NIGHTLIES.md](https://github.com/influxdata/telegraf/blob/master/docs/NIGHTLIES.md)
- [InfluxData blog - Apple M1 and RISC-V Support for Telegraf](https://www.influxdata.com/blog/apple-m1-and-risc-v-support-for-telegraf/)
- [InfluxData CLA](https://www.influxdata.com/legal/cla/)
- [Ubuntu packages search - telegraf (resolute/26.04, and all-suite fallback)](https://packages.ubuntu.com/search?keywords=telegraf&searchon=names&suite=resolute&section=all)
- [Arch Linux RISC-V port tracker](https://archriscv.felixc.at/?q=telegraf)
- [PyPI - telegraf (404, not applicable)](https://pypi.org/pypi/telegraf/json)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)
- [PR #8317 context (RAS plugin disabled on riscv64) via CHANGELOG.md](https://github.com/influxdata/telegraf/blob/master/CHANGELOG.md)
- [klauspost/cpuid/v2 issue #158 - Support RISC-V](https://github.com/klauspost/cpuid/issues/158)
- [zeebo/blake3 issue #8 (arm64 asm build-tag bug, fixed)](https://github.com/zeebo/blake3/issues/8)
- [apache/arrow-go issue #983 (open arm64-NEON bug, precedent for cross-arch testing)](https://github.com/apache/arrow-go/issues/983)
