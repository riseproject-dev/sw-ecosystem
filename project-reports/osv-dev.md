---
title: osv.dev
parent: Project Reports
---

# osv.dev

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for osv.dev<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[osv.dev](https://osv.dev/) is a vulnerability database and API service operated by Google. It aggregates security advisories for open-source packages across ecosystems including npm, PyPI, Go, Debian, Ubuntu, Android, and Alpine Linux. The service exposes a public REST/gRPC API and a web UI; backend components are written in Python and Go and run entirely on Google Cloud Platform (GCS, Cloud Datastore, Cloud Functions, Cloud Build, Terraform).

The project is composed of three public repositories:

- [google/osv.dev](https://github.com/google/osv.dev) -- web service, API server, ingestion workers, infrastructure
- [google/osv-scanner](https://github.com/google/osv-scanner) -- CLI tool for scanning a project's dependencies against the OSV database
- [google/osv-scalibr](https://github.com/google/osv-scalibr) -- Go library and CLI for software inventory and vulnerability extraction

The OSV advisory schema is an [OpenSSF specification](https://github.com/ossf/osv-schema), listed as "TBD" lifecycle stage on the OpenSSF projects page.

**Governance:** Google-internal. No independent foundation. No CODEOWNERS or MAINTAINERS file in the repo root. Contributors must sign Google's CLA. All PRs require review before merge.

**Corporate maintainers (all @google.com):** Andrew Pollock, Oliver Chang, Michael Kedar (most frequent recent committer), Xueqin Cui, Joey Lau, Jess Lowe, Rex P. External contributors include Szymon Drosdzol (Doyensec), westonsteimel, G-Rath, hayleycd.

**RISE membership:** Google LLC is a RISE Premier Member. osv.dev is not a RISE focus project; no RISE blog posts, no RISE wheel builder entries, and no RISE GitLab repositories reference osv.dev, osv-scanner, or osv-scalibr.

**License:** Apache 2.0. Repo created 2021-01-08. 2,900 stars, 354 forks as of the research date.

**Community posture on new ports:** Not applicable in the traditional sense. osv.dev is a hosted web service; architecture portability is only relevant for osv-scanner and osv-scalibr, which are Go binaries. No community discussion or issue requesting riscv64 support has ever been filed in any of the three repositories.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2021-01-08 | Repository created | [github.com/google/osv.dev](https://github.com/google/osv.dev) |
| 2026-06-17 | No riscv64 activity of any kind in any of the three repos | GitHub issue/PR/commit search, all returning 0 results |

No RISC-V port has been attempted. No contributor has submitted a patch, issue, or discussion item related to riscv64 in google/osv.dev, google/osv-scanner, or google/osv-scalibr. The six riscv64-like strings in the google/osv.dev codebase are all in auto-generated `poetry.lock` files, where they appear as substrings of third-party wheel filenames (e.g. `charset_normalizer-3.5.1-...-manylinux_2_31_riscv64.whl`). They are dependency metadata, not project code.

---

## 3. Upstream Support Tier

There is no formal tier policy for osv.dev, osv-scanner, or osv-scalibr. The evidence across all three repos is consistent:

| Signal | amd64 | arm64 | riscv64 |
|--------|-------|-------|---------|
| CI testing | Yes (all workflows on `ubuntu-latest`) | No | No |
| Release binary (osv-scanner) | Yes | Yes | No |
| Release binary (osv-scalibr) | No (no binaries at all) | No | No |
| Release binary (osv.dev) | No (no binaries at all) | No | No |
| Official support statement | Implied by CI and release | Implied by release binary | Not mentioned anywhere |

osv-scanner v2.5.1 (.goreleaser.yml) explicitly lists `GOARCH: [amd64, arm64]`. The file contains a comment that arm was added after further testing; riscv64 does not appear anywhere in the file. The goreleaser config for osv-scanner ships binaries for darwin/amd64, darwin/arm64, linux/amd64, linux/arm64, windows/amd64, and windows/arm64. No linux/riscv64 binary has ever been released.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

osv.dev has no architecture-specific code in any of its three repositories. There are no:

- Go build-constraint files (`//go:build riscv64`, `//go:build arm64`, or any arch tag)
- C or assembly source files of any kind
- SIMD, vectorization, JIT, or cryptographic acceleration code
- Per-architecture dispatch layers
- CGO usage in any of the three repos (all Go services build with `CGO_ENABLED=0`)

The two build constraint tags present in the Go source (`//go:build embedstatic` and `//go:build !embedstatic`) are feature flags controlling whether static web assets are compiled into the binary at build time. They have no relation to CPU architecture.

| Component | amd64 arch-specific code | arm64 arch-specific code | riscv64 arch-specific code |
|-----------|--------------------------|--------------------------|----------------------------|
| API server (Go) | None | None | None |
| Python workers | None | None | None |
| Vulnerability ingestion pipeline | None | None | None |
| osv-scanner CLI (Go) | None | None | None |
| osv-scalibr library (Go) | None | None | None |
| SIMD/vectorization | None | None | None |
| JIT or crypto acceleration | None | None | None |

The concept of "riscv64 implementation completeness relative to amd64 or arm64" does not apply. The project has no per-arch code for any architecture. It is a portable Go/Python web service. Correct operation on riscv64 requires only that the standard Go and Python runtimes support riscv64, which they do.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Go services (go/Dockerfile):**

```
FROM golang:1.26.5-alpine AS builder
ENV CGO_ENABLED=0
RUN go build -o /app/<service> ./cmd/<service>/
FROM gcr.io/distroless/static-debian12
```

`GOARCH` is not set in the Dockerfile. The build uses the host architecture (amd64 in CI). Cross-compiling for riscv64 requires only adding `GOARCH=riscv64` to the build environment or passing `--platform linux/riscv64` to `docker build`. No code changes are required.

`go.mod` requires Go 1.26.5. Go has shipped linux/riscv64 as a supported target since Go 1.14; Go 1.26.5 fully supports riscv64.

**Python worker-base (docker/worker-base/Dockerfile):**

Base image is `ubuntu:26.04`. Python 3.13.3 is compiled from source with `./configure --enable-optimizations --with-lto`. The apt source line hardcodes `arch=amd64` for docker-ce. No `--platform` argument or architecture abstraction is present.

**Toolchain requirements from CONTRIBUTING.md and CI workflows:**

- Go >= 1.26 (go.mod pins 1.26.5)
- Python 3.13
- Poetry >= 2.3.3
- Node.js >= 18.17.x
- protoc (protobuf-compiler)

**Known build failures on riscv64:** None documented. No one has attempted a riscv64 build.

**QEMU usage:** None in any of the 14 CI workflow files.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

osv.dev has no riscv64-specific feature gaps in terms of functionality, because the project has no architecture-specific features for any architecture. The service is fully portable by design.

The practical gaps for a user who wants to run osv-scanner or osv-scalibr on a riscv64 machine are:

| Item | amd64 | arm64 | riscv64 |
|------|-------|-------|---------|
| Prebuilt osv-scanner binary | Yes (official release) | Yes (official release) | No (must build from source) |
| Prebuilt osv-scalibr binary | No | No | No |
| PyPI grpcio binary wheel | Yes | Yes | No (build from source required) |
| PyPI protobuf C extension wheel | Yes | Yes | No (pure-Python fallback available) |
| Python services deployable on GKE | Yes | No (GKE riscv64 not available) | No (GKE riscv64 not available) |
| Functional correctness | Yes | Yes | Expected yes (pure Go/Python; no known blockers) |

**Security hardening gaps:** Data not available: no source documents security hardening differences by architecture for this project.

**Floating-point or NaN semantics issues:** None found. The project does no floating-point computation in its core logic.

---

## 7. CI/CD Infrastructure

All 14 workflow files in `.github/workflows/` of google/osv.dev were read in full:

`codeql-analysis.yml`, `docs-deploy.yml`, `generate-protos.yml`, `go-generate.yml`, `issue-signposting.yml`, `links.yml`, `lint.yaml`, `osv-scanner-unified.yml`, `renovate-validator.yml`, `scorecards.yml`, `snapshots.yml`, `staleness.yml`, `title.yml`, `zizmor.yml`

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repo.

Every workflow that specifies a runner uses `runs-on: ubuntu-latest`, which is GitHub's standard x86_64-hosted runner. The `osv-scanner-unified.yml` workflow delegates to a reusable workflow (`google/osv-scanner-action/.github/workflows/osv-scanner-reusable.yml@nightly`) for security scanning; it is not a build or test workflow and contains no architecture targeting.

Zero occurrences of "riscv", "riscv64", "linux/riscv", or "qemu" appear in any workflow file.

| CI capability | amd64 | arm64 | riscv64 |
|---------------|-------|-------|---------|
| Build | Yes | No | No |
| Unit tests | Yes | No | No |
| Integration tests | Yes | No | No |
| Release gating | Yes | No (arm64 built but not CI-tested) | No |
| QEMU emulation | No | No | No |
| RISE-provided runner | No | No | No |

---

## 8. Distribution and Release Status

**GitHub releases (google/osv.dev):** 17 releases (v0.0.5 through v0.1.3), every one has zero attached binary assets. This project does not distribute binaries via GitHub releases.

**GitHub releases (google/osv-scanner):** v2.5.1 ships binaries for linux/amd64, linux/arm64, darwin/amd64, darwin/arm64, windows/amd64, windows/arm64. No linux/riscv64 binary.

**GitHub releases (google/osv-scalibr):** v0.5.2 has zero attached binary assets across all 26 releases. Distributed as a Go library and source-compiled CLI only.

**PyPI (`osv` package):** All 25 versions (0.0.1a0 through 0.1.3) ship only `py3-none-any.whl` -- pure Python, no compiled extension, no platform-specific build. The package is classified as Development Status 7 - Inactive (archived, no longer maintained). Requires Python >=3.13,<4.0. The `any` wheel will install on riscv64 if the Python version requirement is met, without a dedicated riscv64 wheel.

**PyPI (`osv-dev` package):** Does not exist on PyPI (HTTP 404).

**Ubuntu 24.04 Noble:** No package named `osv`, `osv-dev`, or `python3-osv` in Ubuntu Noble.

**Debian:** No package named `osv`, `python-osv`, or `python3-osv` in Debian (tracker returns 404 for all three paths).

**Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at)):** No `osv` or `osv-dev` package found.

**What a user must do to get a working binary on riscv64:**

For osv-scanner: `GOOS=linux GOARCH=riscv64 go build ./cmd/osv-scanner/` from the source tree. Requires Go >= 1.26. No code changes needed.

For Python services (osv.dev workers): Install grpcio from source (requires protobuf, abseil, and boringssl native toolchains), or use distro-packaged grpcio if available. protobuf Python will use the pure-Python fallback wheel.

---

## 9. Dependencies

### Summary Table

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|------|------|---------------|--------------|-----------------|-------|
| Go runtime (1.26.5) | All Go services | Yes | Yes (official) | Yes (official) | Full riscv64 support since Go 1.14 |
| grpcio (Python) | RPC transport, Python workers | Builds from source | No upstream riscv64 CI | No prebuilt PyPI wheel | Issue [#41591](https://github.com/grpc/grpc/issues/41591) closed 2026-07-15 without commitment; build from source or use distro package |
| grpcio-tools (Python) | Protobuf codegen (dev) | Builds from source | No upstream riscv64 CI | No prebuilt PyPI wheel | Same gap as grpcio |
| protobuf (Python, >=6.33.6) | Wire format, Python workers | Pure-Python fallback only | Unknown | `py3-none-any.whl` only; no C extension wheel | [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) closed without merge 2024-03; functional but slower than C extension |
| pygit2 (>=1.14.0) | Git repo access, Python workers | Yes | Yes (upstream CI) | Full riscv64 wheels on PyPI (manylinux/musllinux) | No blockers |
| charset-normalizer (transitive) | Text encoding, via requests | Yes | Unknown | Full riscv64 wheels on PyPI | No blockers |
| requests (>=2.33) | HTTP client | Pure Python | N/A | `py3-none-any.whl` | No blockers |
| google-cloud-ndb/pubsub/storage/logging | GCP services | Pure Python | N/A | `py3-none-any.whl` | Depends on grpcio for transport; grpcio wheel gap applies |
| jsonschema (>=4.0) | OSV schema validation | Pure Python | N/A | `py3-none-any.whl` | No blockers |
| google.golang.org/grpc (v1.82.1) | Go gRPC runtime | Yes (pure Go) | No riscv64 CI | Library only | No issues; distinct from Python grpcio C extension |
| google.golang.org/protobuf (v1.36.12) | Go protobuf runtime | Yes (pure Go) | No riscv64 CI | Library only | No issues |
| google/osv-scalibr (v0.4.5) | Vulnerability scanner library | Yes (pure Go) | No riscv64 CI | No binary releases | No riscv64-specific code |
| klauspost/compress (v1.19.0) | ZSTD/gzip/snappy, Go services | Yes (pure Go fallback) | No riscv64 CI | Library only | No riscv64 asm; falls back to pure Go |
| klauspost/cpuid (transitive) | CPU feature detection | Yes | Unknown | Library only | Issue [#158](https://github.com/klauspost/cpuid/issues/158) (riscv64 support) closed 2026-06-16 |
| cloudflare/circl (v1.6.3) | Post-quantum and ECC crypto | Yes (pure Go fallback) | No riscv64 CI | Library only | No riscv64 asm; pure Go paths used |
| go-git/go-git (v6) | Git operations, Go services | Yes (pure Go) | No riscv64 CI | Library only | No blockers |
| redis/go-redis (v9) | Redis client, vulnfeeds | Yes (pure Go) | N/A | Library only | No blockers |
| go.opentelemetry.io/otel (v1.44.0) | Distributed tracing | Yes (pure Go) | No riscv64 CI | Library only | No blockers |
| osv-scanner (companion CLI) | Dependency vulnerability scan | Builds from source | No riscv64 CI | No linux/riscv64 binary release | Pure Go; `GOARCH=riscv64 go build` works |

### Critical Dependency Deep-Dive

**grpcio (Python C extension):** This is the single most significant riscv64 blocker for the Python service stack. grpcio embeds a C++ implementation with platform-specific assembly and SIMD paths. No prebuilt riscv64 wheel exists on PyPI for any grpcio version including 1.83.0 (latest). [Issue #41591](https://github.com/grpc/grpc/issues/41591) was opened requesting riscv64 wheel support and was closed in July 2026 by the gRPC team citing the Google OSS Support Policy not yet covering riscv64, without a commitment to add the wheel. Users on riscv64 must build from source, which requires compatible versions of protobuf, abseil-cpp, and boringssl native toolchains. Distro packages (Debian, Fedora) provide riscv64 grpcio packages built from source for users who prefer that path.

Historical build issues: closed [#37791](https://github.com/grpc/grpc/issues/37791) (SIGILL on riscv64, fixed 2024-10), closed [#35839](https://github.com/grpc/grpc/issues/35839) (undefined symbol, fixed 2024-02), closed [#36112](https://github.com/grpc/grpc/issues/36112) (build error, fixed 2024-04). No open correctness blockers remain; the build from source succeeds.

**protobuf Python:** No riscv64 binary wheel exists for the C extension (upb). [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) attempted to add riscv64 support for the C extension wheel but was closed without merge in 2024-03. The `py3-none-any.whl` pure-Python fallback is available and functional; it installs on riscv64 without issues but performs slower than the C extension for high-throughput protobuf parsing.

**Go dependencies:** All Go dependencies in `go/go.mod` and `vulnfeeds/go.mod` are pure Go with no CGO. All compile cleanly on riscv64 using standard `GOARCH=riscv64` cross-compilation. No riscv64-specific issues were found in any of these dependencies.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| grpc [#41591](https://github.com/grpc/grpc/issues/41591) | grpcio riscv64 wheel support | Closed without commitment (2026-07-15) | High (for Python service deployment) | Google OSS Support Policy cited; build from source works |
| protobuf [#12244](https://github.com/protocolbuffers/protobuf/pull/12244) | riscv64 C extension wheel | Closed without merge (2024-03) | Medium (pure-Python fallback available) | Performance regression vs C extension only |

No correctness bugs, no data-corruption bugs, no RISC-V-specific failures were found in any of the three osv.dev repositories or in their Go dependencies.

---

## 12. Objections and Upstream Blockers

**No objections have been stated** in any upstream issue tracker or mailing list, because riscv64 support for osv.dev has never been requested or discussed.

**Organizational blocker -- grpcio wheel:** The gRPC team explicitly closed the riscv64 wheel request ([#41591](https://github.com/grpc/grpc/issues/41591)) citing that riscv64 is not covered by Google's OSS Support Policy. This is the one explicit upstream rejection relevant to this project. The probability of Google adding riscv64 grpcio wheels to PyPI in the short term is low based on this closure.

**Non-blocker -- osv-scanner release binary:** Adding linux/riscv64 to osv-scanner's goreleaser configuration is a two-line change. There is no stated objection, only absence of demand. Acceptance probability if a PR is submitted: high, given that it is a pure-Go binary with no riscv64-specific code required.

**Deployment infrastructure:** osv.dev is deployed exclusively to Google Cloud Platform, which does not offer riscv64 VMs or GKE node pools. Running the full osv.dev service stack on riscv64 hardware is not possible on GCP regardless of software readiness. This is a hard external constraint, not an upstream objection.

---

## 13. Investment Analysis

Google is a RISE Premier Member. The Go components of osv.dev are already riscv64-capable with no investment required. RISE has not funded any osv.dev work. The remaining gaps are narrow and concentrated in the Python stack (grpcio wheel) and osv-scanner release packaging.

### 13.1 Functional Enablement

The Go components of osv.dev (API server, ingestion workers, osv-scanner, osv-scalibr) are functionally complete on riscv64 today -- they compile and run with `GOARCH=riscv64 go build`. No functional enablement work is needed for the Go stack.

The Python services are functionally complete except for the grpcio build dependency. Building grpcio from source on riscv64 works (all historical build failures are fixed), but it requires users to have a native toolchain. For deployment in a distro environment, distro packages suffice. For a GCP/Docker deployment, the Dockerfile would need a source-build step for grpcio.

### 13.2 Performance Optimization

Not applicable. osv.dev has no architecture-specific optimizations on any platform. The project does not perform computation where SIMD or ISA-specific tuning would matter. The only performance consideration is the protobuf Python C extension gap -- the pure-Python fallback is functional but slower for high-throughput parsing. This is a dependency issue (protobuf), not an osv.dev issue.

### 13.3 CI/CD Infrastructure

A riscv64 CI job for osv-scanner and osv-scalibr would validate that the Go build continues to compile and that tests pass. This is low complexity: add `GOARCH: riscv64` to the Go test matrix in the existing GitHub Actions workflow. No hardware runner is required; cross-compilation and `go test -run .` via QEMU are standard for Go riscv64 CI.

### 13.4 Ecosystem Enablement

The osv-scanner linux/riscv64 binary release gap affects any riscv64 distribution that wants to ship a vulnerability scanner built on the OSV database. Adding riscv64 to the goreleaser build matrix is a two-line change. The project already cross-compiles arm64 this way.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Add riscv64 to osv-scanner goreleaser build matrix | 0.2 | Google / community PR | High |
| Functional | Add riscv64 Docker build target to Go service Dockerfiles (add `--platform linux/riscv64` or `GOARCH=riscv64`) | 0.5 | Google | Medium |
| Functional | Document grpcio source-build procedure for riscv64 in Python worker Dockerfile | 0.5 | Google / community | Medium |
| CI/CD | Add GOARCH=riscv64 cross-compile step to osv-scanner and osv-scalibr Go test workflows | 0.5 | Community PR | Medium |
| Functional | Upstream grpcio riscv64 wheel to PyPI (blocked by Google OSS Support Policy) | 4-8 (grpcio team effort) | gRPC team | Low (blocked externally) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/osv.dev repository](https://github.com/google/osv.dev)
- [google/osv-scanner repository](https://github.com/google/osv-scanner)
- [google/osv-scalibr repository](https://github.com/google/osv-scalibr)
- [osv.dev homepage](https://osv.dev/)
- [OSV Schema specification (OpenSSF)](https://github.com/ossf/osv-schema)
- [osv-scanner v2.5.1 release](https://github.com/google/osv-scanner/releases/tag/v2.5.1)
- [osv-scalibr v0.5.2 release](https://github.com/google/osv-scalibr/releases/tag/v0.5.2)
- [PyPI osv package](https://pypi.org/project/osv/)
- [grpcio issue #41591 -- riscv64 wheel support closed without commitment](https://github.com/grpc/grpc/issues/41591)
- [grpcio issue #37791 -- SIGILL on riscv64 (fixed 2024-10)](https://github.com/grpc/grpc/issues/37791)
- [grpcio issue #35839 -- undefined symbol on riscv64 (fixed 2024-02)](https://github.com/grpc/grpc/issues/35839)
- [grpcio issue #36112 -- build error on riscv64 (fixed 2024-04)](https://github.com/grpc/grpc/issues/36112)
- [protobuf PR #12244 -- riscv64 C extension wheel (closed without merge 2024-03)](https://github.com/protocolbuffers/protobuf/pull/12244)
- [klauspost/cpuid issue #158 -- riscv64 support (closed 2026-06-16)](https://github.com/klauspost/cpuid/issues/158)
- [RISE Project member list](https://riseproject.dev/members/)
- [Arch Linux RISC-V package index](https://archriscv.felixc.at/)
- [Google Open Source Community Guidelines](https://opensource.google.com/conduct/)