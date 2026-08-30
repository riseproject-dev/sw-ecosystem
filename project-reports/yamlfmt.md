---
title: yamlfmt
parent: Project Reports
color: orange
---

# yamlfmt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for yamlfmt<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[yamlfmt](https://github.com/google/yamlfmt) is a Go-based YAML formatter that normalizes whitespace, indentation, and style in YAML files. It is used primarily in CI pipelines and developer toolchains to enforce consistent YAML formatting across repositories.

The project lives under the `google` GitHub organization but carries an explicit disclaimer in its README: it is not officially supported by Google and is maintained solely by [@braydonk](https://github.com/braydonk) (Braydon Kains, Google Cloud) as a side project. The maintainer wrote yamlfmt during a Google tech-debt sprint and was surprised by its rapid adoption. He has expressed intent to open up contributions but no formal process exists. There are no CODEOWNERS, MAINTAINERS, or PLATFORMS files. The project is not affiliated with CNCF, OpenSSF, Apache, Linux Foundation, or RISE.

The project is licensed under Apache-2.0. Of 154 total commits, 102 (66%) are from the sole maintainer. Community contributors have made small contributions (5-6 commits each) but no co-maintainer has been designated.

The project has no stated policy on new platform ports. No port request of any kind has ever been filed. Given the single-maintainer bandwidth constraints documented in [Discussion #149](https://github.com/google/yamlfmt/discussions/149), a direct PR is the most effective path to any change.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-08-22 | Initial release v0.1.0; Linux/Darwin/Windows x amd64/arm64/386 binaries shipped | [GitHub Releases](https://github.com/google/yamlfmt/releases) |
| 2022-present | Release matrix unchanged; riscv64 never added | [.goreleaser.yaml](https://github.com/google/yamlfmt/blob/main/.goreleaser.yaml) |
| Never | No riscv64 issue, PR, commit, or tracking item filed | GitHub search (0 results across all query types) |

No contributor has ever submitted riscv64-related work. The port history is empty. There is no upstream riscv64 effort in progress.

## 3. Upstream Support Tier

yamlfmt has no formal tier policy. The project ships pre-built binaries for three tiers in practice:

| Architecture | Linux | Darwin | Windows | CI tested |
|---|---|---|---|---|
| amd64 (x86_64) | Yes | Yes | Yes | Yes (ubuntu-latest) |
| arm64 | Yes | Yes | Yes | No |
| 386 (i386) | Yes | No | Yes | No |
| riscv64 | No | No | No | No |

CI runs on `ubuntu-latest` (x86_64) only, testing Go versions 1.23, 1.24, and 1.25. arm64 and 386 binaries are released but never CI-tested. riscv64 is absent from both CI and release artifacts.

The Docker image targets `linux/amd64` and `linux/arm64` only. QEMU is configured in the release workflow but the platforms list explicitly excludes `linux/riscv64`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

yamlfmt is a pure-Go text-processing tool. It has no JIT compiler, no SIMD dispatch, no cryptographic primitives, no assembly, and no CGO. `CGO_ENABLED=0` is hardcoded in both `.goreleaser.yaml` and the `Dockerfile`.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core formatter logic | Pure Go | Pure Go | Pure Go (source-compatible) |
| YAML parser (pkg/yaml, pure-Go libyaml port) | Pure Go | Pure Go | Pure Go (source-compatible) |
| Assembly files (.s) | None | None | None |
| SIMD intrinsics | None | None | None |
| CGO / C extensions | None | None | None |
| Build constraints (go:build) | None | None | None |
| ISA extensions used | None | None | None |

There are zero architecture-specific source files in the repository. The entire codebase (75 .go files) is architecture-agnostic. No riscv64 porting work is required at the source level.

## 5. Build System, Cross-Compilation, and Toolchain

yamlfmt uses a standard Go module build system with a thin Makefile wrapper. There is no CMake, autoconf, or configure script.

**Exact build command for riscv64:**

```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build \
  -ldflags "-s -w" \
  -o dist/yamlfmt \
  ./cmd/yamlfmt
```

**Required toolchain:**

| Requirement | Value | Reason |
|---|---|---|
| Go minimum | 1.22 | go.mod declares `go 1.22` |
| Go recommended | 1.24+ | go.mod toolchain directive is `go1.24.8`; CI tests 1.23/1.24/1.25 |
| riscv64 support in Go since | 1.14 | GOARCH=riscv64 added in Go 1.14; 1.22 is well above this threshold |
| C compiler | Not required | CGO_ENABLED=0; no C code |
| CMake | Not used | Go-only build |

Go 1.26 is available in Ubuntu 26.04 riscv64 (`golang-go 2:1.26~1` in resolute/main), satisfying the 1.22 minimum.

**QEMU:** Used in the release workflow for Docker multi-arch builds (`docker/setup-qemu-action@v3`), but only for `linux/amd64` and `linux/arm64`. No QEMU-based riscv64 emulation is configured anywhere.

**Known build failures on riscv64:** None reported. Cross-compilation is expected to succeed without modification given the pure-Go, CGO-disabled codebase.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| YAML formatting (all modes) | Full | Full | Full (source-compatible) |
| JSON Schema validation | Full | Full | Full (source-compatible) |
| Glob/path matching | Full | Full | Full (source-compatible) |
| Pre-built binary | Yes | Yes | No |
| Docker image | Yes | Yes | No |
| CI test coverage | Yes | No | No |

**Functional gaps:** None. The source code is 100% riscv64-compatible. The gap is entirely in distribution: no pre-built binary, no Docker image, no CI validation.

**Performance gaps:** No SIMD or architecture-specific optimizations exist for any architecture. Performance is identical across amd64, arm64, and riscv64 for equivalent Go toolchain quality. The one documented performance issue (Issue #283, O(n^2) string concatenation on large files) was fixed in PR #284 and is architecture-independent.

**Security hardening gaps:** None architecture-specific. No stack canaries, CFI, or hardening flags are applied on any architecture.

**NaN / floating-point:** Not applicable. yamlfmt is a text formatter; it performs no floating-point arithmetic. NaN/Inf YAML scalars are passed through as opaque strings by the go-yaml v3 library.

## 7. CI/CD Infrastructure

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | ubuntu-latest | None | None |
| Build tested | Yes | No | No |
| Tests run | Yes | No | No |
| Release binary built | Yes (GoReleaser) | Yes (GoReleaser) | No |
| Docker image built | Yes | Yes | No |
| RISE runner used | No | No | No |

CI is implemented entirely in GitHub Actions. Two workflow files exist:

- `.github/workflows/ci.yaml`: triggers on pull_request; runs `run-lint` and `run-test` on `ubuntu-latest` with Go 1.23/1.24/1.25 matrix. No cross-compilation, no QEMU, no riscv64.
- `.github/workflows/release.yaml`: triggers on version tags; uses GoReleaser for binaries and `docker/build-push-action` for images. Docker platforms: `linux/amd64,linux/arm64` only.

No GitLab CI, Jenkins, Cirrus CI, Travis CI, or AppVeyor configuration exists.

RISE RISC-V Runners (free native riscv64 GitHub Actions runners on Scaleway EM-RV1 hardware, announced 2026-03-24) are available but have not been adopted by this project. Adding a `runs-on: ubuntu-24.04-riscv` job would provide native riscv64 CI with no infrastructure cost.

## 8. Distribution and Release Status

| Channel | riscv64 available | Notes |
|---|---|---|
| GitHub Releases (v0.21.0) | No | Assets: Linux/Darwin/Windows x {amd64, arm64}; Linux/Windows x {i386}. Verified for v0.19.0, v0.20.0, v0.21.0 - all identical. |
| Docker Hub (ghcr.io) | No | Platforms: linux/amd64, linux/arm64 only |
| Ubuntu 26.04 (resolute) | No | Not packaged under any candidate name |
| Debian (all suites) | No | No results for yamlfmt on riscv64 or any architecture |
| Snapcraft | No | Architectures: amd64, arm64, armhf, i386 only |
| Homebrew | No | Bottles: arm64 and x86_64 Linux/macOS only |
| Arch Linux RISC-V | No | Not found at archriscv.felixc.at |
| NixOS (unstable) | No | 0 hits |
| PyPI yamlfmt | N/A | mmlb/yamlfmt v1.1.1 is an unrelated pure-Python wrapper; architecture-independent |

**To obtain a working riscv64 binary today**, a user must build from source:

```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build -o yamlfmt ./cmd/yamlfmt
```

This requires only a Go 1.22+ toolchain, which is available in Ubuntu 26.04 riscv64. No other prerequisites exist.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Go toolchain | Compiler / runtime | Yes (since Go 1.14) | Community builders | Yes (Ubuntu 26.04 resolute/main: golang-go 2:1.26~1) | Only arch-sensitive component; see [go.md](go.md) |
| gopkg.in/yaml.v3 | YAML parsing | Yes (pure Go) | Yes (pure Go) | Yes (arch:all, resolute/universe) | 0 riscv64 issues |
| sigs.k8s.io/yaml | YAML/JSON bridge | Yes (pure Go) | Yes (pure Go) | Yes (arch:all, resolute/universe) | 0 riscv64 issues |
| golang.org/x/text | Unicode / encoding | Yes (pure Go) | Yes (pure Go) | Yes (arch:all, resolute/universe) | No SIMD in v0.14.0 |
| santhosh-tekuri/jsonschema v6 | JSON Schema validation | Yes (pure Go) | Yes (pure Go) | No (Ubuntu 26.04 has v5 only) | Version gap is not riscv64-specific |
| go.yaml.in/yaml/v3 | YAML parsing (indirect) | Yes (pure Go) | Yes (pure Go) | No (not packaged in Ubuntu 26.04) | Not riscv64-specific |
| bmatcuk/doublestar v4 | Glob matching | Yes (pure Go) | Yes (pure Go) | Yes (arch:all, resolute/universe) | 0 riscv64 issues |
| google/go-cmp | Deep equality | Yes (pure Go) | Yes (pure Go) | Yes (arch:all, resolute/universe) | 0 riscv64 issues |
| mitchellh/mapstructure | Config decoding | Yes (pure Go) | Yes (pure Go) | Yes (arch:all, resolute/universe) | 0 riscv64 issues |
| sabhiram/go-gitignore | .gitignore matching | Yes (pure Go) | Yes (pure Go) | Yes (arch:all, resolute/universe) | 0 riscv64 issues |
| stretchr/testify | Test assertions | Yes (pure Go) | Yes (pure Go) | Yes (arch:all, resolute/universe) | 0 riscv64 issues |

The Go toolchain is the only architecturally-sensitive dependency. It is fully available for riscv64 in Ubuntu 26.04. All other dependencies are pure Go with no assembly, CGO, SIMD, or arch-specific build tags. Two packaging gaps exist (jsonschema v6, go.yaml.in/yaml/v3) but neither is riscv64-specific - both require source builds on all architectures.

## 11. Known Bugs and Active Issues

**Performance bug (resolved):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#283](https://github.com/google/yamlfmt/issues/283) | Performance issue with large YAML files | Closed (fixed PR #284) | Was critical | O(n^2) string concatenation; 100k-line file took 60-70 min before fix, ~10 sec after (~420x speedup). Architecture-independent. |

**Open correctness bugs (selected):**

| ID | Title | Status | Label | Notes |
|---|---|---|---|---|
| [#320](https://github.com/google/yamlfmt/issues/320) | basic formatter converts implicit null to empty string in flow mappings | Open | - | 2026-08-18 |
| [#313](https://github.com/google/yamlfmt/issues/313) | Non-deterministic output for indented multiline strings | Open | - | 2026-02-10 |
| [#308](https://github.com/google/yamlfmt/issues/308) | kyaml: yaml anchors get replaced | Open | - | 2025-12-24 |
| [#263](https://github.com/google/yamlfmt/issues/263) | Comments in lists handled differently on Linux vs Windows | Open | yaml_v3_problem | 2025-07-15 |
| [#198](https://github.com/google/yamlfmt/issues/198) | Inconsistent formatting depending on platform | Open | yaml_v3_problem | 2024-07-29 |
| [#169](https://github.com/google/yamlfmt/issues/169) | Infinite adding EOL | Open | yaml_v3_problem | 2024-04-23 |
| [#110](https://github.com/google/yamlfmt/issues/110) | Superfluous comma in flow style | Open | yaml_v3_problem | 2023-04-09 |
| [#86](https://github.com/google/yamlfmt/issues/86) | Folded block scalars with whitespace at end | Open | yaml_v3_problem | 2023-01-12 |

50 issues are open in total. 14 carry the `yaml_v3_problem` label, indicating root cause in the upstream go-yaml/yaml v3 library rather than yamlfmt itself. Zero issues are riscv64-specific.

## 12. Objections and Upstream Blockers

**Technical blockers:** None. The source code requires zero changes to build and run on riscv64. The only required change is adding `riscv64` to the GoReleaser configuration.

**Organizational blockers:** The project has a single maintainer with documented bandwidth constraints. No formal port request process exists. No foundation or corporate governance body needs to be consulted. A direct PR adding one line to `.goreleaser.yaml` is the complete path to upstream riscv64 release binaries.

**Acceptance probability:** [NEEDS VERIFICATION] - High, given the trivial nature of the change and the maintainer's stated openness to contributions, but no precedent for platform addition PRs exists in this repository.

**RISE involvement:** None. yamlfmt is not a RISE project, not in any RISE working group, and has not been submitted to the RISE Developer Appreciation Program. RISE's RP001 (Go runtime on RISC-V) improvements benefit yamlfmt indirectly as a Go binary, but no direct RISE work targets yamlfmt.

## 13. Readiness Assessment

- **Color:** Orange (no upstream riscv64 CI)
- **Release provider:** None

yamlfmt has no riscv64 CI of any kind - no runner, no QEMU emulation, no cross-compilation job - and no upstream riscv64 release binary in any version from v0.1.0 through v0.21.0. No distro packages exist for riscv64 in Ubuntu, Debian, Arch Linux RISC-V, NixOS, Snap, or Homebrew. The distribution floor rule does not apply: no distro ships a riscv64 package. The grade is orange.

The source code is 100% riscv64-compatible (pure Go, CGO_ENABLED=0, no arch-specific code), so the orange grade reflects a distribution and CI gap, not an implementation gap. The entire enablement path is a one-line change to `.goreleaser.yaml` plus a CI job addition.

**Pending work that could change the grade:** No open PRs or issues exist for riscv64 support. A PR adding `riscv64` to `.goreleaser.yaml` and a `runs-on: ubuntu-24.04-riscv` CI job (using RISE RISC-V Runners) would move the grade to green upon merge and release.

## 14. Investment Analysis

RISE has no existing or funded work on yamlfmt. All items below are greenfield.

### 14.1 Functional Enablement

Add `riscv64` to `.goreleaser.yaml` `goarch` list. This is a one-line change. No source code modifications are required. The resulting binary is expected to be fully functional on first build given the pure-Go, CGO-disabled codebase.

### 14.2 Performance Optimization

Not applicable. yamlfmt has no architecture-specific performance code on any platform. There is no SIMD, no JIT, no numeric kernel. Performance on riscv64 will be determined entirely by Go toolchain quality for riscv64, which is covered under the Go runtime project (RP001).

### 14.3 CI/CD Infrastructure

Add a `runs-on: ubuntu-24.04-riscv` job to `.github/workflows/ci.yaml` using RISE RISC-V Runners (free, available since 2026-03-24). This provides native hardware CI at no infrastructure cost. The job would mirror the existing `run-test` job with no other changes.

### 14.4 Ecosystem Enablement

Not applicable. yamlfmt is a standalone CLI tool with no dependent package ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to .goreleaser.yaml goarch list | 0.1 | Community / RISE contributor | High |
| CI/CD | Add riscv64 CI job using RISE RISC-V Runners | 0.1 | Community / RISE contributor | High |
| Distribution | File tracking issue for riscv64 support | 0.1 | Community / RISE contributor | Medium |

Total estimated effort: 0.3 person-weeks. This is among the lowest-cost riscv64 enablement tasks possible for any non-trivial Go tool.

## 15. Updates

No updates yet -- initial report dated 2026-06-17.

## 16. References

- [google/yamlfmt repository](https://github.com/google/yamlfmt)
- [yamlfmt releases (v0.21.0)](https://github.com/google/yamlfmt/releases/tag/v0.21.0)
- [.goreleaser.yaml](https://github.com/google/yamlfmt/blob/main/.goreleaser.yaml)
- [.github/workflows/ci.yaml](https://github.com/google/yamlfmt/blob/main/.github/workflows/ci.yaml)
- [.github/workflows/release.yaml](https://github.com/google/yamlfmt/blob/main/.github/workflows/release.yaml)
- [Dockerfile](https://github.com/google/yamlfmt/blob/main/Dockerfile)
- [Discussion #149 - maintainer bandwidth context](https://github.com/google/yamlfmt/discussions/149)
- [Issue #283 - performance issue with large YAML files (closed)](https://github.com/google/yamlfmt/issues/283)
- [Issue #320 - implicit null conversion bug](https://github.com/google/yamlfmt/issues/320)
- [Issue #313 - non-deterministic output for multiline strings](https://github.com/google/yamlfmt/issues/313)
- [Issue #263 - platform-inconsistent comment handling](https://github.com/google/yamlfmt/issues/263)
- [Ubuntu 26.04 (resolute) package search for yamlfmt](https://packages.ubuntu.com/search?keywords=yamlfmt&suite=resolute&searchon=names)
- [Ubuntu 26.04 golang-go package (resolute/main)](https://packages.ubuntu.com/resolute/golang-go)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project members](https://riseproject.dev/members/)
- [Advancing Go on RISC-V: Progress Through the RISE Project (2025-04-04)](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at)
- [NixOS package search](https://search.nixos.org)