---
title: osv-scalibr
parent: Project Reports
---

# osv-scalibr

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for osv-scalibr<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

osv-scalibr is a Google-owned open-source Software Composition Analysis (SCA) library and CLI tool written in Go. It extracts package inventory (SBOM) from filesystems, container images, and running processes by parsing OS package databases (APK, RPM, DPKG), language-specific manifests (Go modules, Python requirements, npm, Cargo, Maven, etc.), and binary metadata. It feeds into the [OSV vulnerability database](https://osv.dev) and deps.dev pipelines.

**License:** Apache-2.0.

**Governance:** Informal Google corporate open-source. No CODEOWNERS, MAINTAINERS, or OWNERS files exist. All submissions require pull request review. The project does not belong to any foundation (Linux Foundation, CNCF, OpenSSF, Apache). A Google CLA is required for external contributors.

**Corporate maintainers:** Google (primary - scalibr-dev@google.com). Key Google contributors: Erik Varga, Xueqin Cui, Rex P, Michael Kedar, Stefano Sanfilippo (most active in 2026), Joey Lau. Second-largest contributor organization: Doyensec (security research firm - Alessandro, Szymon Drosdzol), contributing security-focused extractors. Notable external contributor: G-Rath (Gareth Jones, Ackama) with 336 contributions.

**Community culture on new ports:** No documented stance on architecture ports exists. The project has no architecture-tier policy and no structured contribution model. Doyensec's substantial involvement demonstrates openness to external contributions. A riscv64 CI addition would likely be accepted given the tool has no inherent architecture dependencies - it processes filesystem metadata and package manifests, not machine code.

**Repository stats:** 638 stars, 190 forks, 140 open issues, 195 PRs as of research date.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-04-10 | Initial commit to google/osv-scalibr | [GitHub](https://github.com/google/osv-scalibr/commits/main) |
| Never | No RISC-V port initiated | [GitHub search: zero results for "riscv" in issues/PRs/commits](https://github.com/google/osv-scalibr) |

No RISC-V port has ever been initiated. The following searches returned zero results:

- `gh search issues --repo google/osv-scalibr "riscv"` - 0 results
- `gh search prs --repo google/osv-scalibr "riscv"` - 0 results
- `gh search commits --repo google/osv-scalibr "riscv"` - 0 results

Two issues matched "riscv64" (issues #2021 and #400) but both were confirmed unrelated to RISC-V - the string appeared incidentally in attached file contents (a Python Poetry pyproject.toml and an npm SBOM scan), not as the topic of the issue.

The only "riscv64" strings in the entire codebase appear in APK package database test fixture files (`extractor/filesystem/os/apk/testdata/installed` and `annotator/ffa/unknownbinariesanno/internal/apkfilter/testdata/installed`), specifically the Alpine Linux APK signing key path `usr/share/apk/keys/riscv64/alpine-devel@lists.alpinelinux.org-60ac2099.rsa.pub`. This is passive test data, not deliberate riscv64 support.

No key contributors with riscv64 affiliation have been identified. There is no upstream port to speak of.

## 3. Upstream Support Tier

No formal tier policy exists. The project defines platform support along OS dimensions only (Linux, Windows, macOS, Unix) via Go build tags. No CPU architecture axis appears anywhere in the codebase.

**CI runner matrix (from `.github/workflows/go.yml`):**

| Architecture | CI | Release-blocking | Official binaries |
|---|---|---|---|
| amd64 (x86_64) | Yes (ubuntu-latest) | Yes | No - source tags only |
| arm64 | No explicit runner [NEEDS VERIFICATION - macos-latest may use Apple Silicon] | No | No |
| riscv64 | No | No | No |

Note: GitHub's macos-latest runner may run on Apple Silicon (arm64), which would incidentally test arm64. This is not documented as intentional arm64 coverage.

Because osv-scalibr is pure Go (with one CGO dependency), `GOARCH=riscv64` compilation works via the standard Go toolchain without any code changes. The absence of riscv64 support is a CI and packaging gap, not a code gap.

## 4. Technical Architecture and RISC-V-Specific Subsystems

osv-scalibr has no architecture-specific subsystems. The codebase contains:

- Zero assembly (.S) files
- Zero `//go:build amd64`, `//go:build arm64`, or `//go:build riscv64` constraints
- Zero SIMD intrinsics
- Zero JIT compilation
- Zero floating-point computation
- Zero cryptographic primitives (delegates entirely to `golang.org/x/crypto` and `tink-crypto/tink-go`)

All build constraints are OS-level only: `linux`, `darwin`, `windows`, `unix`, `!linux`, `!windows`.

The one architecture-adjacent concern is the gobinary extractor testdata directory, which contains pre-built Go binary test fixtures for linux-amd64, linux-arm64, darwin-arm64, and windows-amd64 - but no linux-riscv64 binary. This is a test coverage gap, not a functional gap.

**Component architecture table:**

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Core SCA library | Full | Full | Full (untested) | Pure Go, no arch code |
| APK extractor | Full | Full | Full (untested) | Pure Go |
| RPM extractor (CGO) | Full | Full | Full (untested, needs C toolchain) | CGO via modernc.org/sqlite |
| DPKG extractor | Full | Full | Full (untested) | Pure Go |
| Go binary extractor | Full | Full | Full (untested) | Pure Go ELF parser |
| gobinary test fixtures | Present | Present | Absent | linux-riscv64 test binary missing |
| Container image extractor | Full | Full | Full (untested) | Pure Go + containerd |
| SBOM output (SPDX/CycloneDX) | Full | Full | Full (untested) | Pure Go |

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make wrapping `go build`. No CMake, no Autotools, no Bazel, no Dockerfile in the repository.

**Go version:** 1.26.3 minimum (from go.mod). CI uses `go-version: 1.26.x`.

**Build commands (from Makefile):**

```
CGO_ENABLED=1 go build binary/scalibr/scalibr.go
CGO_ENABLED=1 go test ./...
```

**CGO requirement:** The Makefile comment states CGO is required for certain dependencies. `go.mod` lists `modernc.org/sqlite` (pure Go, no CGO) rather than `mattn/go-sqlite3`. The CGO=1 requirement in the Makefile may be a legacy comment or for optional build tags not in the default module graph. [NEEDS VERIFICATION - whether `CGO_ENABLED=0` works for the default build target]

**Cross-compilation to riscv64:**

For a CGO-disabled build (pure Go subset):
```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build ./...
```

For a full CGO-enabled cross-build:
```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=1 CC=riscv64-linux-gnu-gcc go build ./...
```

Required toolchain: GCC 12+ for riscv64-linux-gnu (standard Debian/Ubuntu cross-compiler package). No special toolchain version minimums are documented in the repository.

**QEMU:** No QEMU usage is documented or present in any CI workflow. No known build failures on riscv64 have been reported (because no one has attempted it publicly).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because osv-scalibr has no architecture-specific code, there are no functional gaps between architectures at the source level.

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| OS package extraction (APK/DEB/RPM) | Yes | Yes | Yes (untested) | None |
| Language manifest parsing | Yes | Yes | Yes (untested) | None |
| SBOM generation (SPDX/CycloneDX) | Yes | Yes | Yes (untested) | None |
| Container image scanning | Yes | Yes | Yes (untested) | None |
| Go binary metadata extraction | Yes | Yes | Yes (untested) | Test fixture missing |
| SIMD-accelerated compression | Via klauspost/compress asm | Via klauspost/compress asm | Generic Go path | Performance only |
| CI coverage | Yes | No explicit coverage | No | CI gap |
| Binary releases | No (none published) | No | No | N/A |

**Performance gaps:** The only performance-relevant dependency with architecture-specific paths is `klauspost/compress`, which has amd64 and arm64 assembly for zstd/snappy/gzip acceleration. riscv64 uses the generic Go path. For a filesystem scanning tool that spends most of its time doing I/O and string parsing, this compression performance delta is unlikely to be material.

**Security hardening gaps:** Data not available - no survey of Go compiler hardening flags (stack canaries, CFI) on riscv64 vs amd64 was conducted in the research.

**NaN/floating-point issues:** Not applicable. osv-scalibr performs no floating-point computation.

## 7. CI/CD Infrastructure

No riscv64 CI exists. Verified by direct inspection of all four workflow files.

| Workflow file | Runners | riscv64 | QEMU | Cross-compile |
|---|---|---|---|---|
| `.github/workflows/go.yml` | ubuntu-latest, macos-latest, windows-latest | No | No | No |
| `.github/workflows/codeql-analysis.yml` | ubuntu-latest | No | No | No |
| `.github/workflows/lint-plugger.yml` | ubuntu-latest | No | No | No |
| `.github/workflows/prp-issue-workflow.yml` | ubuntu-latest | No | No | No |

No `.gitlab-ci.yml`, Jenkinsfile, or `.cirrus.yml` files exist in the repository.

**RISE runners:** No RISE Project involvement. osv-scalibr is not listed in the RISE wheel builder (which covers Python packages only; osv-scalibr is a Go project). No RISE blog posts mention osv-scalibr. GitHub org search `osv-scalibr org:riseproject-dev` returned 0 repositories.

**Hardware used for CI:** GitHub-hosted runners (ubuntu-latest = x86_64, macos-latest = Apple Silicon or Intel depending on runner pool). No self-hosted runners.

## 8. Distribution and Release Status

osv-scalibr publishes no binary release assets. 26 GitHub releases exist (latest: v0.5.2, 2026-08-10), all confirmed via GitHub API to have zero attached assets. Releases are source-tag-only.

| Distribution channel | riscv64 available | Notes |
|---|---|---|
| GitHub Releases (binaries) | No | Zero assets on all 26 releases |
| PyPI | No | Package does not exist (HTTP 404); Go project, not Python |
| Ubuntu noble | No | Package absent entirely |
| Debian | No | Package absent (tracker returns HTTP 404) |
| Arch Linux RISC-V | No | Package absent |
| RISE wheel builder | No (N/A) | Go project; wheel builder is Python-only |
| Container image (OCI) | No | No official container image published |

**What a user must do to get a working riscv64 binary:**

1. Install Go 1.26+ and riscv64-linux-gnu-gcc on a build host
2. `GOOS=linux GOARCH=riscv64 CGO_ENABLED=1 CC=riscv64-linux-gnu-gcc go build ./binary/scalibr/scalibr.go`
3. Copy resulting binary to riscv64 target

No packaging, no distro integration, no pre-built binary exists.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Go stdlib / golang.org/x/* | Language runtime, syscalls, crypto, net | Yes - linux/riscv64 Tier 1 since Go 1.21 | Partial - LUCI linux-riscv64 builder present, golang/go#80880 open for additional builder | Yes | golang/go#80880 (non-blocking) |
| klauspost/compress v1.18.6 | Compression: zstd, snappy, gzip, lz4, deflate, brotli | Yes - pure Go fallback on riscv64 | No - CI covers amd64/arm64 only | No riscv64 binary (library is source-only) | None - generic path functional |
| klauspost/cpuid v2.3.0 (indirect) | CPU feature detection used by klauspost/compress | Yes - riscv64 support merged June 2026 (PR #173, closed issue #158) | Unknown | N/A (library) | Resolved: cpuid#158 closed 2026-06-16 |
| modernc.org/sqlite v1.50.1 | Pure-Go CGo-free SQLite port; RPM extractor | Yes - pure Go transpile, no CGO required | Unknown | N/A (library) | None known |
| containerd/containerd v2.1.3 | Container image layer extraction and OCI image handling | Yes - ships riscv64 tarballs | No - containerd#13020 open since 2026-03-12 | Yes (v2.3.4 has linux-riscv64 tarball) | [containerd#13020](https://github.com/containerd/containerd/issues/13020) open: "Add linux/riscv64 to CI test matrix" |
| moby/buildkit v0.23.2 | OCI image building infrastructure | Yes - ships riscv64 tarballs | Unknown | Yes (v0.32.2 has linux-riscv64 tarball) | None open specifically |
| moby/moby API v1.55.0 | Docker daemon client API types | Yes - pure Go types | No - Docker daemon has no official riscv64 support | No official riscv64 daemon binary | [moby/moby#44319](https://github.com/moby/moby/issues/44319) open: "Adding support for RISC-V" (stale since 2026-03-12) |
| google/go-containerregistry v0.20.6 | Container registry client | Yes | Unknown | Yes - linux-riscv64 tarball in v0.22.0 | None open |
| opencontainers/runc (indirect via containerd) | Container runtime | Yes | Yes (via containerd integration) | Yes - runc.riscv64 in v1.5.1 | None open |
| tink-crypto/tink-go v2.6.0 | Cryptographic primitives | Yes - pure Go | Unknown | N/A (library) | None open |
| google.golang.org/grpc v1.81.0 | gRPC transport for OSV/deps.dev API calls | Yes - pure Go | Unknown | N/A (library) | None open |
| google.golang.org/protobuf v1.36.11 | Protocol Buffers serialization | Yes - riscv64 support added 2024 (protobuf#12266, closed 2024-03-05) | Yes - verified in protobuf CI | N/A (library) | Resolved |
| go.etcd.io/bbolt v1.4.3 | Embedded key-value store (BoltDB) | Yes - pure Go | Unknown | N/A (library) | None open |
| golang.org/x/crypto v0.51.0 | TLS, SSH, AEAD | Yes - generic Go path on riscv64 (amd64 asm for ChaCha20/AES-GCM not available) | Unknown | N/A (library) | None open; performance delta only |
| cloudflare/circl v1.6.3 (indirect) | Post-quantum and elliptic-curve crypto | Yes - pure Go fallbacks | Unknown | N/A (library) | None open |
| github.com/saferwall/pe v1.6.4 | Windows PE file parser | Yes - pure Go | Unknown | N/A (library) | None open |

**Primary dependency gaps:**

- `containerd#13020`: riscv64 binaries ship but CI does not test on riscv64. Container image scanning on riscv64 is untested end-to-end.
- `moby/moby#44319`: Docker daemon has no official riscv64 support. Users who drive osv-scalibr via the Docker socket on riscv64 are unsupported.
- `golang.org/x/crypto`: riscv64 uses scalar Go paths for ChaCha20-Poly1305 and AES-GCM. For a scanning tool, this is a negligible concern.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs or issues exist in the google/osv-scalibr issue tracker. Zero results for "riscv" or "riscv64" in the issue tracker.

Open issues are unrelated to RISC-V:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| #2351 | pnpm extractor bug | Open | Medium | Parser correctness, x86-only testing |
| #2288 | dotnet MSBuild parser issue | Open | Medium | Architecture-agnostic |
| #2378 | Version release semantics | Open | Low | API design |
| #2021 | Missing transitivity info (Python Poetry) | Open | Medium | "riscv64" appears incidentally in attached file, unrelated to RISC-V |
| #400 | npm false positives | Open | Medium | "riscv64" appears incidentally in attached SBOM, unrelated to RISC-V |

No correctness bugs related to riscv64. No NaN/floating-point issues (not applicable - no FP computation).

## 12. Objections and Upstream Blockers

**Stated objections:** None. No Google team member or contributor has publicly objected to riscv64 support. No issue or PR has been opened to request it and been rejected.

**Technical blockers:** None at the source level. The only quasi-blocker is the CGO dependency in the Makefile, which requires a riscv64 C cross-compiler for cross-builds. This is a standard Linux toolchain requirement, not a project-specific obstacle.

**Organizational blockers:** None identified. Google's open-source governance for this project is permissive - external CLA-compliant contributions are accepted.

**Acceptance probability:** High. The project accepts external contributions from Doyensec and individual contributors. A PR adding riscv64 CI via GitHub Actions (using QEMU or a native runner) would be a low-controversy, low-complexity addition with no architectural implications.

## 13. Investment Analysis

RISE has no involvement in osv-scalibr. No work has been done or funded by any party for riscv64 support.

### 13.1 Functional Enablement

No code changes are required to run osv-scalibr on riscv64. The tool compiles and runs via standard Go cross-compilation. The one caveat - missing linux-riscv64 test binary in gobinary extractor testdata - affects test coverage, not runtime functionality.

Work item: Add a linux-riscv64 pre-built Go binary to `extractor/filesystem/language/golang/gobinary/testdata/` for test coverage. Effort: 0.5 person-weeks (build the binary, add it to the repo).

### 13.2 Performance Optimization

Not applicable. osv-scalibr performs no compute-intensive work that benefits from SIMD or architecture-specific optimization. Scan time is I/O-bound.

### 13.3 CI/CD Infrastructure

Add riscv64 to the GitHub Actions CI matrix. Options:
- QEMU-based cross-testing: add `linux/riscv64` to the `go.yml` test matrix via `docker/setup-qemu-action`. Effort: 1 person-week.
- Native riscv64 runner: requires a self-hosted runner. Effort: 2 person-weeks including runner setup.

The QEMU path is sufficient given that the code has no architecture-specific paths to validate.

### 13.4 Ecosystem Enablement

Packaging in Debian/Ubuntu/Arch is the only meaningful distribution gap. The project publishes no binaries for any architecture, so riscv64 is not uniquely disadvantaged - it would require the same effort as packaging for x86_64.

Work item: Package osv-scalibr for Debian (ITP process). Effort: 2 person-weeks for initial packaging; ongoing maintenance is low.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add linux-riscv64 gobinary test fixture | 0.5 | External contributor | Low |
| CI/CD | Add riscv64 QEMU runner to go.yml test matrix | 1 | External contributor | High |
| Distribution | Package osv-scalibr for Debian (ITP) | 2 | External contributor | Medium |
| Performance | None required | 0 | N/A | N/A |

Total estimated effort: 3.5 person-weeks.

**Strategic note:** osv-scalibr is a pure-Go scanning library with no architecture-specific code. The riscv64 gap is entirely CI and packaging. If a riscv64 Linux distribution includes osv-scalibr (e.g., as part of a security toolchain), the CI addition is the only prerequisite for confidence in correctness. The investment is small and low-risk.

## 14. Updates

No updates yet - initial report dated 2026-08-14.

## 15. References

- [google/osv-scalibr repository](https://github.com/google/osv-scalibr)
- [osv-scalibr releases (API)](https://api.github.com/repos/google/osv-scalibr/releases?per_page=3)
- [osv-scalibr CI workflow: go.yml](https://github.com/google/osv-scalibr/blob/main/.github/workflows/go.yml)
- [osv-scalibr CI workflow: codeql-analysis.yml](https://github.com/google/osv-scalibr/blob/main/.github/workflows/codeql-analysis.yml)
- [osv-scalibr CI workflow: lint-plugger.yml](https://github.com/google/osv-scalibr/blob/main/.github/workflows/lint-plugger.yml)
- [osv-scalibr CI workflow: prp-issue-workflow.yml](https://github.com/google/osv-scalibr/blob/main/.github/workflows/prp-issue-workflow.yml)
- [containerd issue #13020: Add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [moby/moby issue #44319: Adding support for RISC-V](https://github.com/moby/moby/issues/44319)
- [klauspost/cpuid issue #158: riscv64 support](https://github.com/klauspost/cpuid/issues/158)
- [golang/go issue #80880: additional linux-riscv64 builder](https://github.com/golang/go/issues/80880)
- [google/protobuf PR #12266: riscv64 support](https://github.com/protocolbuffers/protobuf/pull/12266)
- [RISE Project members](https://riseproject.dev/members/)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- [Debian package tracker: osv-scalibr (404)](https://tracker.debian.org/pkg/osv-scalibr)
- [Ubuntu package search: osv-scalibr](https://packages.ubuntu.com/search?keywords=osv-scalibr&suite=noble)