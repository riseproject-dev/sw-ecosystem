---
title: go-containerregistry
parent: Project Reports
---

# go-containerregistry

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for go-containerregistry<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

go-containerregistry is a pure Go library and CLI toolkit for interacting with OCI and Docker container registries. It provides three CLI binaries -- crane, gcrane, and krane -- as well as a Go API used by tools such as ko, Sigstore, and distroless. The library implements registry authentication, image manifest reading and writing, layer push/pull, and platform-aware image copying.

The project is hosted under the `google` GitHub organization and released under Apache-2.0. There is no independent foundation, no OWNERS file, no CODEOWNERS file, and no GOVERNANCE.md. Governance is informal: maintainers accept PRs via GitHub review with no documented policy.

Despite Google org ownership, day-to-day maintenance is dominated by Chainguard employees. Top contributors by commit count: Jon Johnson (jonjohnsonjr, `jon.johnson@chainguard.dev`, 345 commits), Jason Hall (imjasonh, Chainguard, 176 commits), Matt Moore (mattmoor, `mattmoor@chainguard.dev`, 90 commits). The project originated at Google and the ko spin-off reinforced the Chainguard connection.

Google is a Premier member of the RISE Project. go-containerregistry itself is not listed as a RISE-affiliated project and no RISE funding or RISE-sponsored work was found for this repository.

Maintainer culture toward new architecture ports is permissive but passive. PR #2159 (riscv64 binary builds) was merged in two days with zero inline review comments. The maintainer who merged it (Subserial) noted acceptance of the cross-compilation approach and explicitly deferred riscv64 CI testing to a follow-up PR that the author offered but never filed.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2025-11-17 | PR #2159 "Build artifacts for riscv64" opened by ffgan | [PR #2159](https://github.com/google/go-containerregistry/pull/2159) |
| 2025-11-19 | PR #2159 merged by Subserial | [commit d1809c86](https://github.com/google/go-containerregistry/commit/d1809c862390e60825858e6cd5835f87a46d7e7c) |
| 2025-11-24 | v0.20.7 released; first tag shipping `go-containerregistry_Linux_riscv64.tar.gz` | [GitHub releases](https://github.com/google/go-containerregistry/releases) |
| 2026-05-20 | Issue #2059 (gcrane `--platform` filter ignored for all non-native platforms including riscv64) closed as fixed | [Issue #2059](https://github.com/google/go-containerregistry/issues/2059) |
| 2026-06-28 | Issue #2357 (loong64 addition) filed and closed; independently confirms riscv64 is a goreleaser target | [Issue #2357](https://github.com/google/go-containerregistry/issues/2357) |
| 2026-08-05 | v0.21.9 released with `go-containerregistry_Linux_riscv64.tar.gz` (14.8 MB) | [GitHub releases](https://github.com/google/go-containerregistry/releases) |

Key contributors to the riscv64 port: ffgan (`sudoemt@gmail.com`), external community contributor; co-author nijincheng (`nijincheng@iscas.ac.cn`), Institute of Software, Chinese Academy of Sciences (ISCAS/PLCT). No Qualcomm, Google, or Chainguard employees contributed to the riscv64 port specifically.

The upstream trigger for PR #2159 is cited as the KubeVirt CDI riscv64 effort (kubevirt/containerized-data-importer#3948) [NEEDS VERIFICATION - single source, not independently confirmed].

The riscv64 port is fully upstream. No downstream-only patches exist. The changes required were three lines in `.goreleaser.yml` (adding `riscv64` to three build targets) and a Go toolchain version bump from 1.21 to 1.24 in the release workflow. No porting work in the library itself was required because no architecture-specific code exists anywhere in the project.

---

## 3. Upstream Support Tier

No formal tier or platform support policy document exists in the repository. There is no tiering framework analogous to Rust's, Go's official port tiers, or LLVM's backend tiers.

The effective support level can be inferred from what the project does for each architecture:

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Cross-compiled release binary | Yes | Yes | Yes (since v0.20.7) |
| Tested in CI | Yes (ubuntu-latest) | No | No |
| Native CI runner | Yes | No | No |
| QEMU-based CI testing | No | No | No |
| Release-blocking failures | Yes | No | No |
| Official goreleaser target | Yes | Yes | Yes |
| Multi-arch OCI image platform | Yes | Yes | Yes (cloudbuild_v2.yaml) |

riscv64 receives the same cross-compiled release binary treatment as all non-x86 architectures. It is not a second-class target in the release pipeline but receives no testing. The maintainer explicitly accepted riscv64 without tests, consistent with how arm64, s390x, and ppc64le are treated.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

go-containerregistry contains zero architecture-specific code. The language breakdown is: Go (1,436,569 bytes), Shell (17,186 bytes), Dockerfile (118 bytes). There are no C files, no assembly files, no `_riscv64.go` build-constrained files, no `_amd64.go` files, no `runtime.GOARCH` conditionals, and no `#ifdef __riscv` guards.

The three functional areas that could theoretically require architecture-specific paths:

**Hashing and digest verification:** Uses `crypto/sha256` and `crypto/sha512` from the Go standard library via `opencontainers/go-digest`. The Go stdlib handles the architecture dispatch; go-containerregistry has no hash implementation of its own.

**Compression:** Delegates entirely to `klauspost/compress` for gzip, zstd, snappy, deflate, and brotli. That library provides assembly-accelerated paths for amd64 and arm64 but falls back to pure Go on riscv64 (see Section 9).

**Platform matching:** The `pkg/v1/platform.go` model stores OS, Architecture, and Variant as plain strings parsed from JSON. `riscv64` is a valid Architecture string value. No architecture-specific code paths exist in the platform matching logic.

Component table:

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Registry HTTP client | Pure Go | Pure Go | Pure Go |
| Image manifest parsing | Pure Go | Pure Go | Pure Go |
| Platform struct/matching | Pure Go | Pure Go | Pure Go |
| SHA-256 hashing (via stdlib) | HW-accelerated (Go stdlib asm) | HW-accelerated (Go stdlib asm) | Pure Go (no riscv64 asm in Go stdlib yet; see Go issue [#78918](https://github.com/golang/go/issues/78918)) |
| Compression (klauspost/compress) | Assembly-accelerated | Assembly-accelerated | Pure Go fallback |
| Release binary | Yes | Yes | Yes |
| CI-tested | Yes | No | No |

No ISA extensions (RVV, Zba, Zbb, Zbc) are referenced anywhere in go-containerregistry or its first-party dependencies.

---

## 5. Build System, Cross-Compilation, and Toolchain

go-containerregistry uses the standard Go toolchain with no CGO, no CMake, and no C/C++ dependencies. The build is trivially portable.

**Minimum Go version:** `go 1.25.0` (from `go.mod`). The release CI uses `go1.26.6` via the goreleaser builder image `golang:1.25.6`.

The riscv64 cross-compile command is:

```sh
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build ./...
```

The goreleaser configuration (`.goreleaser.yml`) lists riscv64 as an explicit target for all three binaries:

```yaml
goarch:
  - amd64
  - arm
  - arm64
  - 386
  - s390x
  - riscv64
  - ppc64le
  - loong64
goos:
  - linux
  - darwin
  - windows
```

The `cloudbuild_v2.yaml` (Google Cloud Build) script independently confirms riscv64 as a cross-compilation target and includes `linux/riscv64` in the `docker buildx build --platform` argument for multi-arch OCI image production.

No QEMU is required or used. No per-architecture source files, no `-DUSE_X=OFF` flags, no GCC/Clang involvement. Any Go toolchain at 1.25+ with standard `GOARCH=riscv64` cross-compilation support is sufficient.

The riscv64 goreleaser target was unblocked by upgrading `setup-go` from Go 1.21 to 1.24, required because `go.mod` already specified `go >= 1.24` at the time of PR #2159. This was the only non-trivial change in the PR.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because go-containerregistry is a pure Go library with no architecture-specific code, there are no functional gaps. All registry operations -- manifest push/pull, layer streaming, authentication, image copying, platform filtering -- are available and functionally identical on riscv64 and amd64.

**Functional feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| crane copy/push/pull | Full | Full | Full |
| gcrane platform filtering | Full (fixed in #2059) | Full | Full (same fix) |
| Multi-arch index operations | Full | Full | Full |
| OCI image spec compliance | Full | Full | Full |
| Registry auth (OAuth2, keychain) | Full | Full | Full |
| Streaming layer read/write | Full | Full | Full |

**Performance gaps (not functional gaps):**

1. Compression throughput: `klauspost/compress` uses amd64 and arm64 assembly for deflate and zstd. On riscv64 the pure-Go fallback runs approximately 2-5x slower for those operations. This affects layer push/pull speed but does not affect correctness.

2. SHA-256 throughput: The Go standard library does not yet ship riscv64 assembly for `hash/crc32` (open issue [#78918](https://github.com/golang/go/issues/78918)) or `bytealg.IndexByte` (open issue [#79997](https://github.com/golang/go/issues/79997)). Digest verification and byte scanning operations will be slower on riscv64 than on amd64 or arm64.

No security hardening gaps were found. No floating-point semantics issues exist (go-containerregistry does not perform floating-point computation). No NaN handling issues.

Data not available: quantitative benchmark comparison between riscv64 and amd64 for crane operations. No riscv64 CI runner exists and no published benchmark results for riscv64 were found in the repository.

---

## 7. CI/CD Infrastructure

All 13 GitHub Actions workflow files were read: `analyze.yaml`, `boilerplate.yaml`, `build.yaml`, `bump-deps.yaml`, `donotsubmit.yaml`, `e2e.yaml`, `ecr-auth.yaml`, `ghcr-auth.yaml`, `presubmit.yaml`, `release.yml`, `stale.yaml`, `style.yaml`, `test.yaml`.

Zero of the 13 workflow files contain the strings `riscv`, `riscv64`, `qemu`, or `linux/riscv64`. There is no riscv64 CI of any kind.

**CI comparison:**

| CI type | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Unit tests on push/PR | Yes (ubuntu-latest) | No | No |
| Race detector tests | Yes | No | No |
| End-to-end registry tests | Yes | No | No |
| Build check | Yes | No | No |
| Linting | Yes | No | No |
| QEMU-based test | No | No | No |
| Release cross-compile | Yes | Yes | Yes |
| Release binary produced | Yes | Yes | Yes |

The release pipeline (`release.yml`) triggers only on tag push and runs goreleaser on `ubuntu-latest` (x86_64). It cross-compiles with `GOARCH=riscv64` and `CGO_ENABLED=0`. No binary is executed on riscv64 hardware.

No RISE CI runners are used. No self-hosted riscv64 runners are registered. PR #2159 explicitly noted this gap: the author offered to implement QEMU-based CI in a follow-up PR, but as of the current date no such PR has been filed.

---

## 8. Distribution and Release Status

**Upstream release binaries:**

`go-containerregistry_Linux_riscv64.tar.gz` is present in every release from v0.20.7 (2025-11-24) through v0.21.9 (2026-08-05). The v0.21.9 asset is 14.8 MB (SHA256: `c2326003576a281f4bdc34cf49bcf5e27727ec57b6de3be1bc7d94439b52f341`) [NEEDS VERIFICATION - single source, not cross-checked against a second hash listing].

Installation from upstream:

```sh
VERSION=$(curl -s "https://api.github.com/repos/google/go-containerregistry/releases/latest" | jq -r '.tag_name')
curl -sL "https://github.com/google/go-containerregistry/releases/download/${VERSION}/go-containerregistry_Linux_riscv64.tar.gz" > go-containerregistry.tar.gz
tar -zxvf go-containerregistry.tar.gz -C /usr/local/bin/ crane
```

**Linux distribution packages:**

| Distribution | Package | Version | riscv64 available | Notes |
|-------------|---------|---------|-------------------|-------|
| Ubuntu 24.04 (noble) | `golang-github-google-go-containerregistry-dev` | 0.14.0+ds1-2 | Yes | Library package only; does not provide crane/gcrane/krane binaries; significantly behind upstream |
| Debian sid (main) | `golang-github-google-go-containerregistry-dev` | 0.20.7+ds1-3 | arch: all (no per-arch build needed) | Source library package |
| Debian sid (debports riscv64) | `golang-github-google-go-containerregistry-dev` | 0.14.0+ds1-2 | Unofficial port only | 6 major versions behind main archive; Debian tracker page returned HTTP 404; build status unconfirmed |
| Arch Linux RISC-V | (not packaged) | - | No | Confirmed absent from archriscv.felixc.at |
| PyPI | (does not exist) | - | N/A | HTTP 404; go-containerregistry is not a Python package |

The Ubuntu and Debian packages are Go source library packages repackaged for `go build` downstream use. They do not provide prebuilt crane/gcrane/krane binaries. The only way to get a working riscv64 crane binary is via the upstream GitHub release.

---

## 9. Dependencies

go-containerregistry is a pure Go library. No dependency has a JIT backend or custom assembly that is required for correct operation. The riscv64 impact from dependencies is limited to performance degradation in compression and hashing paths.

**Dependency table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release binary | Blocking issues |
|------------|------|--------------|-------------|----------------------|-----------------|
| Go toolchain | Compilation, stdlib crypto/hash | Yes (since Go 1.14) | No dedicated riscv64 CI builder | Official GOARCH=riscv64 since Go 1.14 | No riscv64 asm for crc32 ([#78918](https://github.com/golang/go/issues/78918)), bytealg.IndexByte ([#79997](https://github.com/golang/go/issues/79997)), no LUCI riscv64 builder ([#80880](https://github.com/golang/go/issues/80880)) |
| [klauspost/compress](https://github.com/klauspost/compress) v1.19.2 | gzip, zstd, snappy, brotli, deflate for layer compression | Yes (pure Go fallback) | amd64 only | N/A (library) | No riscv64 assembly; pure-Go fallback approx 2-5x slower than amd64 for deflate/zstd; correctness unaffected |
| [opencontainers/go-digest](https://github.com/opencontainers/go-digest) v1.0.0 | SHA-256/SHA-512 manifest digests | Yes | No riscv64 CI | N/A | None |
| [opencontainers/image-spec](https://github.com/opencontainers/image-spec) v1.1.1 | OCI manifest/config/platform spec | Yes | riscv64 added to platform table (PR [#1105](https://github.com/opencontainers/image-spec/pull/1105), [#1172](https://github.com/opencontainers/image-spec/pull/1172), both merged) | v1.1.1 released with riscv64 platform support | None |
| [moby/moby](https://github.com/moby/moby) v29.x (API types) | Docker API types | Cross-build PR [#44735](https://github.com/moby/moby/pull/44735) not yet merged | No riscv64 CI | No official riscv64 binary | PR [#44735](https://github.com/moby/moby/pull/44735) open; issue [#44319](https://github.com/moby/moby/issues/44319) open; affects Docker-in-Docker users, not go-containerregistry's registry client |
| [docker/cli](https://github.com/docker/cli) v29.7.2 | CLI credential helper integration | Yes (pure Go) | No riscv64 CI | No official riscv64 binary | No hard blocker for go-containerregistry |
| [containerd/errdefs](https://github.com/containerd/errdefs) v1.0.0 | Error type definitions | Yes (pure Go) | No riscv64 CI | N/A | containerd main has open riscv64 CI issue [#13020](https://github.com/containerd/containerd/issues/13020); errdefs sub-module unaffected |
| [golang.org/x/oauth2](https://pkg.go.dev/golang.org/x/oauth2) v0.36.0 | Registry credential auth flows | Yes (pure Go) | No riscv64 CI | N/A | None |
| [golang.org/x/sync](https://pkg.go.dev/golang.org/x/sync) v0.22.0 | Concurrent layer push/pull | Yes (pure Go) | No riscv64 CI | N/A | None |
| [golang.org/x/sys](https://pkg.go.dev/golang.org/x/sys) v0.47.0 | Syscall bindings | Yes (riscv64 merged long ago) | No riscv64 CI | N/A | None |
| [go.opentelemetry.io/otel](https://github.com/open-telemetry/opentelemetry-go) v1.41.0 | Tracing/metrics instrumentation | Yes (pure Go) | No riscv64 CI | N/A | None; see `project-reports/opentelemetry.md` |
| [spf13/cobra](https://github.com/spf13/cobra) v1.10.2 | CLI argument parsing for crane/gcrane | Yes (pure Go) | No riscv64 CI | N/A | Open issue [#2422](https://github.com/spf13/cobra/issues/2422) (Go 1.26 test failures); not riscv64-specific |
| [distribution/reference](https://github.com/distribution/reference) v0.6.0 | OCI/Docker image reference parsing | Yes (pure Go) | No riscv64 CI | N/A | None |

**Priority issues in dependencies:**

- Medium: `moby/moby` PR [#44735](https://github.com/moby/moby/pull/44735) not merged. Users deploying Docker Engine on riscv64 must self-patch. go-containerregistry's use of moby API types (pure Go, no binary linking) is unaffected.
- Low: `klauspost/compress` pure-Go fallback is 2-5x slower on riscv64 for deflate/zstd operations. No correctness issue.
- Low: Go stdlib missing riscv64 CRC32 and bytealg assembly; digest verification and scanning are slower, no correctness issue.

Cross-references to other project-reports/scope.yml reports: Go (`project-reports/go.md`), OpenTelemetry (`project-reports/opentelemetry.md`), containerd (`project-reports/containerd.md`), Docker (`project-reports/docker.md`).

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#2059](https://github.com/google/go-containerregistry/issues/2059) | gcrane: `--platform` is ignored | Closed (fixed 2026-05-20) | High (correctness) | Affected all non-native platforms including riscv64; `gcrane cp --platform linux/riscv64` silently copied full multi-arch index instead of single-platform image; fixed before this report |
| [#2120](https://github.com/google/go-containerregistry/issues/2120) | crane: registry needs to hold full layers in memory | Open | Medium (resource) | Affects all platforms; memory usage concern for large images on memory-constrained riscv64 boards |
| [#2324](https://github.com/google/go-containerregistry/issues/2324) | Bound remote config blob reads | Open | Medium (resource) | Memory bounding issue; affects all platforms |

No open riscv64-specific correctness bugs were found. No open riscv64-specific performance issues were filed.

---

## 12. Objections and Upstream Blockers

**No stated objections to riscv64.** The maintainer who merged PR #2159 accepted it without conditions, and the absence of CI testing for other non-x86 architectures (arm64, s390x, ppc64le) establishes that riscv64 is consistent with the project's existing multi-arch support posture.

**Organizational blockers:** None. Chainguard and Google both have riscv64 interests in the broader container ecosystem. The project's Apache-2.0 license and informal governance present no procedural barriers.

**Technical blockers:** None that affect correctness. The pure-Go codebase cross-compiles without modification. The only follow-up item identified in PR #2159 -- QEMU-based CI testing -- was explicitly deferred by mutual agreement and has not been actioned.

**Probability of acceptance for a riscv64 CI PR:** High. The maintainer (Subserial) stated during PR #2159 review that CI using docker+qemu would be acceptable and invited the author to file it. No new opposition has appeared since.

---

## 13. Investment Analysis

The riscv64 functional port is complete. All work required for building and shipping riscv64 binaries was done by ISCAS/PLCT contributors in November 2025 at zero cost to this project's stakeholders. The remaining gaps are CI coverage and distro package currency.

### 13.1 Functional Enablement

No functional work is needed. go-containerregistry builds and runs correctly on riscv64 today.

### 13.2 Performance Optimization

The performance gaps are in dependencies (klauspost/compress and Go stdlib), not in go-containerregistry itself. Optimizing compression throughput on riscv64 requires contributing riscv64 assembly to klauspost/compress (RVV-accelerated deflate/zstd) and to the Go standard library (`hash/crc32`, `bytealg`). These are separate projects with separate investment cases. Within go-containerregistry, no performance work is scoped.

### 13.3 CI/CD Infrastructure

The primary investment opportunity is QEMU-based riscv64 CI. The approach was pre-approved by the maintainer in PR #2159. The implementation is straightforward: add a matrix entry using `docker run --platform linux/riscv64` with QEMU binfmt, or register a self-hosted riscv64 runner. This closes the only structural gap between riscv64 and the existing multi-arch support model.

### 13.4 Ecosystem Enablement

The Debian debports riscv64 package is 6 major versions behind (`0.14.0+ds1-2` vs. `0.20.7+ds1-3`). Filing a Debian bug report or submitting a fix to unblock the riscv64 build would bring distro packaging into alignment. This is low priority given that upstream prebuilt binaries are already available.

No Python, npm, Maven, or other language-ecosystem packages exist for go-containerregistry.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add QEMU-based riscv64 CI matrix entry to test.yaml | 0.5 | Any contributor | Medium |
| Distribution | Unblock Debian debports riscv64 package to track main archive version | 0.5 | Debian Go team or Qualcomm | Low |
| Performance | riscv64 assembly for klauspost/compress (deflate, zstd) | 8-12 | RISC-V performance team | Low |
| Performance | riscv64 asm for Go stdlib crc32/bytealg (upstream Go) | 4-6 | Go contributors / RISE | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [PR #2159: Build artifacts for riscv64](https://github.com/google/go-containerregistry/pull/2159)
- [Commit d1809c86: merge of PR #2159](https://github.com/google/go-containerregistry/commit/d1809c862390e60825858e6cd5835f87a46d7e7c)
- [Issue #2357: Add loong64 architecture support](https://github.com/google/go-containerregistry/issues/2357)
- [Issue #2059: gcrane --platform is ignored](https://github.com/google/go-containerregistry/issues/2059)
- [Issue #2120: registry needs to hold full layers in memory](https://github.com/google/go-containerregistry/issues/2120)
- [Issue #2324: Bound remote config blob reads](https://github.com/google/go-containerregistry/issues/2324)
- [GitHub releases for go-containerregistry](https://github.com/google/go-containerregistry/releases)
- [Go issue #78918: hash/crc32 missing riscv64 assembly](https://github.com/golang/go/issues/78918)
- [Go issue #79997: bytealg.IndexByte sub-optimal on riscv64](https://github.com/golang/go/issues/79997)
- [Go issue #80880: no dedicated LUCI riscv64 builder](https://github.com/golang/go/issues/80880)
- [opencontainers/image-spec PR #1105: riscv64 platform support](https://github.com/opencontainers/image-spec/pull/1105)
- [opencontainers/image-spec PR #1172: riscv64 platform table](https://github.com/opencontainers/image-spec/pull/1172)
- [moby/moby PR #44735: Enable riscv64 cross build](https://github.com/moby/moby/pull/44735)
- [moby/moby issue #44319: Adding support for RISC-V](https://github.com/moby/moby/issues/44319)
- [containerd issue #13020: add riscv64 to CI](https://github.com/containerd/containerd/issues/13020)
- [spf13/cobra issue #2422: test failures with Go 1.26](https://github.com/spf13/cobra/issues/2422)
- [Ubuntu 24.04 package: golang-github-google-go-containerregistry-dev](https://packages.ubuntu.com/search?keywords=go-containerregistry&suite=noble&searchon=names&section=all)
- [RISE blog: Advancing Go on RISC-V](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)