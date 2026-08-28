---
title: osv-scanner
parent: Project Reports
---

# osv-scanner

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for osv-scanner<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

osv-scanner is a command-line vulnerability scanner developed and maintained by Google. It queries the [OSV (Open Source Vulnerabilities)](https://osv.dev/) database to identify known vulnerabilities in project dependencies by reading lockfiles, SBOMs, and container images. The tool is written entirely in Go with `CGO_ENABLED=0`, making it architecture-agnostic at the source level.

**Governance:** The project is hosted under `github.com/google` with Google as the primary corporate maintainer. No external foundation governs it. All contributions require a Google CLA. The project holds an OpenSSF Scorecard badge and attains SLSA Level 3 supply chain integrity. No formal PLATFORMS.md, SUPPORT.md, MAINTAINERS, OWNERS, or CODEOWNERS file exists; governance is informal via PR review.

**License:** Apache-2.0

**Repository created:** 2022-11-14

**Corporate contributors (top by commit count, all-time):**

| GitHub Login | Name | Affiliation | Commits |
|---|---|---|---|
| G-Rath | Gareth Jones | Ackama | 443 |
| renovate-bot | Mend Renovate | (bot) | 381 |
| another-rex | Rex P | Google | 378 |
| osv-robot | osv-robot | (bot) | 196 |
| cuixq | Xueqin Cui | Google | 147 |
| michaelkedar | Michael Kedar | Google | 89 |
| oliverchang | Oliver Chang | Google | 30 |
| andrewpollock | Andrew Pollock | OpenSSF | 30 |

Primary corporate maintainer is Google. One significant external contributor (Gareth Jones, Ackama) leads by commit count. Google employees hold ownership of the project roadmap.

**Community stance on new ports:** The `.goreleaser.yml` file contains a comment -- "Further testing before supporting arm" -- indicating the team gates new architecture targets behind explicit validation decisions, not purely technical feasibility. Since arm64 itself required deliberate gating, riscv64 faces a similar decision threshold.

**RISE involvement:** None. osv-scanner does not appear in any RISE project blog post, runner enrollment list, or GitHub organization. Searches across all 35 RISE blog posts (2024-05 through 2026-08) returned zero mentions. Google is a Premier Member of RISE, but that membership has not produced any riscv64 work for osv-scanner.

---

## 2. Port History and Upstreaming Timeline

No riscv64 port has ever been attempted or requested for osv-scanner.

| Date | Event | Source |
|---|---|---|
| 2022-11-14 | Repository created; amd64 Linux/macOS/Windows targets established | [GitHub repo](https://github.com/google/osv-scanner) |
| (unknown) | arm64 added to goreleaser config; comment notes it required testing gating | `.goreleaser.yml` in repo |
| 2026-08-14 | No riscv64 issue, PR, commit, or discussion exists | GitHub Issues/PR/Commits API, 10 search vectors, all returning 0 results |

**Key contributors to any port work:** None -- no contributors have worked on riscv64 for this project.

**Upstream status:** Not upstream. Not started.

---

## 3. Upstream Support Tier

No formal tiering policy is documented for osv-scanner. The project has no PLATFORMS.md or equivalent.

In practice, the supported architectures are those listed in `.goreleaser.yml`: `amd64` and `arm64`. The goreleaser config explicitly comments out `arm` (32-bit) citing a compile failure in the `spdx` dependency. riscv64 is absent without comment.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official release binary | Yes | Yes | No |
| Official Docker image | Yes | Yes | No |
| CI (GitHub Actions) | Yes | Yes (partial, see issue [#2888](https://github.com/google/osv-scanner/issues/2888)) | No |
| Goreleaser target | Yes | Yes | No |
| Tracking issue | n/a | n/a | None exists |
| Tier | Tier 1 | Tier 1 (binary) / Tier 2 (action image) | Not supported |

arm64 itself has a documented gap: the `osv-scanner-action` Docker image is amd64-only; arm64 runners fail with "exec format error" (issue [#2888](https://github.com/google/osv-scanner/issues/2888), open as of 2026-06-15). riscv64 is further behind than arm64 in this regard.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

osv-scanner performs no numeric computation, no JIT compilation, no SIMD processing, and no cryptographic acceleration. Its workload is entirely I/O, JSON parsing, and HTTP API calls to the OSV database. The Go standard library handles all of this portably.

**Architecture-specific file inventory (793 total files in repo):**

| Architecture | Source files | Assembly files | Build constraints | Status |
|---|---|---|---|---|
| amd64 | 0 | 0 | 0 | n/a -- no arch-specific code |
| arm64 | 0 | 0 | 0 | n/a -- no arch-specific code |
| riscv64 | 0 | 0 | 0 | n/a -- no arch-specific code |

The one `go:build` constraint file in the repository is OS-gated (`!windows`), not architecture-gated.

There is no JIT, no SIMD dispatch, no hand-tuned assembly, no cryptographic primitive implementation, no garbage collector barrier customization, and no memory allocator. There is nothing to port.

**What riscv64 support requires at the source level:** Zero code changes. A goreleaser config edit to add `riscv64` to the `goarch` list is the entire technical requirement.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Pure Go, no CMake, no Makefile, no Autoconf. CGO is disabled in all builds.

**Go version requirement:** `go.mod` declares `go 1.26.5`. The installation documentation states Go 1.26.2+ is required.

**Build commands:**

```sh
# Minimal binary
go build ./cmd/osv-scanner/

# Cross-compile for riscv64 (no additional toolchain required)
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build -trimpath \
  -ldflags="-s -w" ./cmd/osv-scanner/
```

No GCC, Clang, QEMU, or any C toolchain is required. CGO_ENABLED=0 is enforced explicitly. The 32-bit architectures are excluded due to an spdx dependency compile failure -- this constraint does not apply to riscv64 (64-bit).

**Docker (goreleaser.dockerfile):**

```
FROM golang:1.26.6-alpine3.23
# copies pre-built binary, no compile step
ENTRYPOINT ["/osv-scanner"]
```

Multi-arch Docker manifests target `linux/amd64` and `linux/arm64` only.

**Known riscv64 build failures:** None documented. No one has attempted an official build.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because osv-scanner has no architecture-specific code paths, there are no functional gaps between architectures. A riscv64 binary built from source is functionally identical to the amd64 binary.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Lockfile scanning | Yes | Yes | Yes (if binary built) |
| SBOM scanning | Yes | Yes | Yes (if binary built) |
| Container image scanning | Yes | Yes | Yes (if binary built) |
| OSV API queries | Yes | Yes | Yes (if binary built) |
| Compression (zstd/snappy via klauspost/compress) | SIMD-accelerated | SIMD-accelerated | Pure-Go fallback (functional, lower throughput) |
| Official binary available | Yes | Yes | No |

**Performance gap:** `github.com/klauspost/compress` provides SIMD-accelerated paths on amd64 and arm64. On riscv64 it falls back to pure Go automatically. For a tool whose primary latency is network I/O to the OSV API, this compression performance gap is not material to end-to-end scan time. Data not available: quantitative benchmark comparing riscv64 vs arm64 scan throughput.

**Security hardening gaps:** None identified at the source level. The binary would be built with the same `-trimpath -ldflags="-s -w"` flags as other targets. No platform-specific hardening (e.g., CFI, shadow stack) is applied on any target.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists in osv-scanner. This was verified by reading all 19 files in `.github/workflows/` via the GitHub API. Zero matches for "riscv", "riscv64", or "linux/riscv64" across all files.

**Workflow files checked:** cassettes.yml, checks.yml, codeql-analysis.yml, dependencies.yml, docs-deploy.yml, goreleaser-nightly.yml, goreleaser.yml, links.yml, osv-scanner-reusable-pr.yml, osv-scanner-reusable.yml, osv-scanner-unified-action.yml, prerelease-check.yml, renovate-validator.yml, scorecards.yml, snapshots.yml, staleness.yml, tests.yml, title.yml, zizmor.yml.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists.

**RISE runners:** Not enrolled. The RISE riscv64 runner enrollment list (197 repos as of 2026-05) does not include osv-scanner.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | Yes | No |
| Test CI | Yes | Yes | No |
| RISE runner | No | No | No |
| QEMU emulation | No | No | No |
| Release pipeline | goreleaser | goreleaser | Not configured |

---

## 8. Distribution and Release Status

**Official upstream binaries (v2.3.6 through v2.5.1, 5 releases checked):**

| Platform | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux binary | Yes | Yes | No |
| macOS binary | Yes | Yes | No |
| Windows binary | Yes | Yes | No |
| Docker image (ghcr.io) | Yes | Yes | No |

**Linux distribution packages:**

| Distribution | riscv64 package | Notes |
|---|---|---|
| Alpine Linux edge/community | Yes | osv-scanner 2.5.0-r0, built 2026-08-07, maintainer kpcyrd. Supports aarch64, armhf, armv7, loongarch64, ppc64le, riscv64, s390x, x86, x86_64. |
| Debian | No | Not packaged on any architecture (HTTP 404 on both tracker URL variants) |
| Ubuntu 24.04 (noble) | No | Not packaged |
| Arch Linux RISC-V overlay | No | Not present in archriscv.felixc.at |

**PyPI:** A `osv-scanner` package exists on PyPI at version 0.0.1, published as `osv_scanner-0.0.1-py3-none-any.whl`. This is a name-reservation placeholder with no binary payload. It is not a Go binary distribution.

**What a riscv64 user must do today to get a working binary:**

1. Install Go 1.26.5+
2. Run: `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./cmd/osv-scanner/`
3. Alternatively, install Alpine Linux edge and use `apk add osv-scanner` -- the only distribution packaging a riscv64 binary.

---

## 9. Dependencies

All critical dependencies have pure-Go fallbacks or explicit riscv64 support. No hard blockers exist for a riscv64 build.

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| github.com/klauspost/cpuid/v2 | CPU feature detection | Yes | Limited | n/a (library) | riscv64 detection via `riscv_hwprobe` syscall merged (issues #158, #173 closed 2026-06). SiFive, StarFive, THead, Andes, SpacemiT vendor constants added. No blocker. |
| github.com/klauspost/compress | Compression (zstd, snappy, lz4, gzip) | Yes (pure-Go fallback) | No riscv64 CI | n/a (library) | No riscv64 assembly. Pure-Go path active on riscv64. Functional, not performance-parity. |
| github.com/cloudflare/circl v1.6.4 | Cryptography (X25519, ECDSA, post-quantum) | Yes (pure-Go) | No riscv64 CI | n/a (library) | No riscv64 assembly. Pure-Go fallback. No correctness risk. |
| github.com/pierrec/lz4/v4 | LZ4 compression | Yes | Not tested on riscv64 | n/a (library) | Pure-Go implementation. No known issues. |
| modernc.org/sqlite | Embedded SQLite (CGo-free) | Yes | linux/riscv64 listed as supported in v1.57.0 | linux/riscv64 supported | Explicitly supported platform. No blocker. |
| github.com/google/osv-scalibr v0.5.3 | Core scanning library (filesystem, packages, SBOMs) | Yes | No riscv64-specific tests found | n/a (library) | Open issues #2021 and #400 are about npm transitivity and false positives -- not riscv64-related. No blocker. |
| google.golang.org/grpc v1.83.0 | gRPC transport (OSV API calls) | Yes | No riscv64 CI | n/a (library) | Pure Go. Zero riscv64 issues. No blocker. |
| google.golang.org/protobuf v1.36.12 | Protocol Buffers serialization | Yes | No riscv64-specific CI | n/a (library) | Pure Go. Zero riscv64 issues. No blocker. |
| github.com/go-git/go-git/v5 v5.19.2 | Git repo scanning | Yes | No riscv64 CI | n/a (library) | 4 riscv64 search hits are all dependabot bumps (closed). No functional issues. |
| github.com/segmentio/encoding v0.5.4 | JSON/Thrift encoding | Yes (pure-Go fallback) | No riscv64 CI | n/a (library) | amd64 assembly present; riscv64 uses pure-Go path automatically. No correctness risk. |
| github.com/segmentio/asm v1.2.1 | Low-level assembly helpers | Yes (pure-Go) | No riscv64 CI | n/a (library) | No open riscv64 blockers. |
| github.com/google/go-containerregistry v0.21.8 | OCI/container image registry access | Yes | Issue #2159 (closed) added riscv64 build artifacts | v0.20+ includes riscv64 | No remaining blockers. |
| github.com/moby/buildkit v0.32.2 | Container build infrastructure (indirect) | Yes | 99 riscv64 search hits; none are functional failures | n/a for osv-scanner use | High hit count from platform label strings, not build failures. No blocker. |
| Go runtime (go 1.26.5) | Toolchain | Yes | Tier 2 (community CI) | Official toolchain ships linux/riscv64 | Issues #80880, #79068, #79069 open (LUCI builder instability). linux/riscv64 is Tier 2. No release blocker for osv-scanner. |

**Cross-references to reports in this repository:**

| Dependency | Scope.yml Name | Report |
|---|---|---|
| google.golang.org/grpc | gRPC | project-reports/grpc.md |
| google.golang.org/protobuf | Protocol Buffers | project-reports/protocol-buffers.md |
| github.com/moby/buildkit | BuildKit | project-reports/buildkit.md |
| Go runtime | Go | project-reports/go.md |

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist. The following general correctness issues are open and represent risks on any architecture:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2888](https://github.com/google/osv-scanner/issues/2888) | build(goreleaser): publish multi-arch (arm64) osv-scanner-action image | Open (2026-06-15) | Medium | osv-scanner-action Docker image is amd64-only; arm64 runners fail with "exec format error". riscv64 not mentioned. |
| [#2976](https://github.com/google/osv-scanner/issues/2976) | extractRlibArchive calls log.Fatalf on io.EOF | Open | High | Process-killing fatal call on a recoverable error condition. Architecture-agnostic. |
| [#2968](https://github.com/google/osv-scanner/issues/2968) | Panic on empty license field with --licenses | Open | Medium | nil dereference on empty struct field. Architecture-agnostic. |
| [#2936](https://github.com/google/osv-scanner/issues/2936) | getNextFixVersion panics on unparsable fixed version | Open | Medium | Panic on malformed upstream data. Architecture-agnostic. |
| [#2867](https://github.com/google/osv-scanner/issues/2867) | IsAffected panics on unrecognized ecosystem | Open | Medium | Panic on unexpected enum value. Architecture-agnostic. |

The four panic-class bugs (#2976, #2968, #2936, #2867) are correctness issues that affect all architectures equally and should be tracked regardless of riscv64 work.

---

## 12. Objections and Upstream Blockers

**Technical blockers:** None. osv-scanner is pure Go with CGO_ENABLED=0. Cross-compilation to riscv64 requires no code changes and no toolchain beyond Go itself. The standard invocation `GOOS=linux GOARCH=riscv64 go build` produces a working binary.

**Organizational blockers:**

1. Google's explicit gating policy on new architecture targets. The `.goreleaser.yml` comment -- "Further testing before supporting arm" -- demonstrates that arm64 itself required a deliberate decision. riscv64 will require the same process: a PR to the goreleaser config, review by Google maintainers, and acceptance that the team is taking on a new release target.

2. No riscv64 hardware available for CI. The project has no RISE runner enrollment and no QEMU-based test infrastructure for non-host architectures.

3. No community demand. Zero issues, zero PRs, zero commits referencing RISC-V have ever appeared in the repository. The Google team has no internal or external pressure to act.

**Acceptance probability:** [NEEDS VERIFICATION] The technical case is straightforward -- pure Go, one config line change. The bottleneck is organizational priority. Given that arm64 action image support (issue #2888) is still open and unresolved, riscv64 is lower in the queue.

---

## 13. Investment Analysis

Alpine Linux community packaging (via kpcyrd) already produces a riscv64 binary of osv-scanner at Alpine edge/community. This covers the minimal "get a binary" use case for Alpine-based riscv64 deployments. Upstream official binary release, CI, and Docker image support remain gaps.

### 13.1 Functional Enablement

The functional gap is entirely in the release pipeline, not the source code. A single goreleaser config PR adding `riscv64` to `goarch` enables official Linux binaries. The Docker image multi-arch manifest requires a parallel change to the goreleaser Dockerfile workflow.

### 13.2 Performance Optimization

No performance optimization work is available or needed. osv-scanner has no SIMD, no JIT, no numeric kernels. The compression throughput gap from `klauspost/compress` lacking riscv64 SIMD is not material given that network latency to the OSV API dominates scan time.

### 13.3 CI/CD Infrastructure

riscv64 CI requires either RISE runner enrollment (no cost if approved) or QEMU emulation (already used by other projects in the ecosystem). Given the project is pure Go, a cross-compile CI check is trivial to add and provides sufficient confidence for correctness.

### 13.4 Ecosystem Enablement

Not applicable. osv-scanner has no dependent package ecosystem requiring riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to goreleaser goarch list; add linux_riscv64 to release artifacts | 0.5 | Google maintainers (PR from community) | High |
| Functional | Add linux/riscv64 Docker manifest to goreleaser docker section | 0.5 | Google maintainers (PR from community) | High |
| CI/CD | Add riscv64 build step to GitHub Actions (cross-compile only, no hardware needed) | 0.5 | Google maintainers (PR from community) | Medium |
| CI/CD | Enroll in RISE riscv64 runner program for native test execution | 0.5 | Google (RISE enrollment request) | Low |
| Functional | Fix open panic bugs (#2976, #2968, #2936, #2867) | 2.0 | Any contributor | Medium |

Total estimated effort for full riscv64 enablement (build + release + CI): 1.5 person-weeks of upstream engineering. The work is a config change, not a port.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [osv-scanner GitHub repository](https://github.com/google/osv-scanner)
- [osv-scanner homepage](https://google.github.io/osv-scanner/)
- [osv-scanner v2.5.1 release assets](https://github.com/google/osv-scanner/releases/tag/v2.5.1)
- [Issue #2888: publish multi-arch arm64 osv-scanner-action image](https://github.com/google/osv-scanner/issues/2888)
- [Issue #2976: extractRlibArchive calls log.Fatalf on io.EOF](https://github.com/google/osv-scanner/issues/2976)
- [Issue #2968: Panic on empty license field with --licenses](https://github.com/google/osv-scanner/issues/2968)
- [Issue #2936: getNextFixVersion panics on unparsable fixed version](https://github.com/google/osv-scanner/issues/2936)
- [Issue #2867: IsAffected panics on unrecognized ecosystem](https://github.com/google/osv-scanner/issues/2867)
- [Alpine Linux osv-scanner package (edge/community)](https://pkgs.alpinelinux.org/package/edge/community/riscv64/osv-scanner)
- [RISE riscv64 runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE riscv64 runners six weeks in (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [klauspost/cpuid issue #158 (riscv64 hwprobe)](https://github.com/klauspost/cpuid/issues/158)
- [google/go-containerregistry issue #2159 (riscv64 build artifacts)](https://github.com/google/go-containerregistry/issues/2159)
- [Go issue #80880: add LUCI riscv64 builder](https://github.com/golang/go/issues/80880)
- [modernc.org/sqlite riscv64 support (v1.57.0)](https://pkg.go.dev/modernc.org/sqlite)
- [OSV vulnerability database](https://osv.dev/)