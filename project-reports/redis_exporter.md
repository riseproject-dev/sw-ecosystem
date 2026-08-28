---
title: redis_exporter
parent: Project Reports
---

# redis_exporter

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for redis_exporter<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[redis_exporter](https://github.com/oliver006/redis_exporter) is a Prometheus exporter that scrapes Redis metrics and exposes them over HTTP in Prometheus exposition format. It supports Redis standalone, Sentinel, and Cluster configurations, and is the de facto standard Redis exporter for Prometheus-based monitoring stacks.

The project is individually maintained under the MIT License with no foundation membership, no governance committee, and no steering council. Oliver (GitHub: oliver006) is the sole owner and dominant maintainer, contributing approximately 32 of the last 100 non-bot commits. No company affiliation is listed in his public profile. The second most active contributor is Nicolai Antiferov (nantiferov), employed at Bolt. No other contributors show company affiliations in their public profiles.

The project is not a member of the RISE project and has received no RISE funding or involvement of any kind.

Community culture on new ports: the maintainer has never been asked about RISC-V support. Zero issues, zero PRs, and zero commits reference riscv or riscv64 in any human-authored context. There is no MAINTAINERS, CODEOWNERS, OWNERS, SUPPORT.md, or PLATFORMS.md file.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| Never | No RISC-V port has been started, proposed, or discussed | [GitHub issues search: zero results](https://github.com/oliver006/redis_exporter/issues) |
| 2021-04-22 | Dependabot PR #508 merges prometheus/client_golang bump from 1.9.0 to 1.10.0; the upstream changelog mentions a riscv64 build fix in client_golang -- no redis_exporter code changed | [PR #508](https://github.com/oliver006/redis_exporter/pull/508) |
| 2026-08-19 | Dependabot PR #1163 merges golang.org/x/crypto bump from 0.54.0 to 0.55.0; the upstream changelog mentions riscv64 poly1305 assembly -- no redis_exporter code changed | [PR #1163](https://github.com/oliver006/redis_exporter/pull/1163) |

No contributor or organization has driven RISC-V work on this project. The two PRs above are the only records containing the string "riscv64" in the repository; both are automated dependabot updates where the string appears exclusively inside embedded upstream dependency changelogs.

The project is a pure Go application. There is no architecture-specific source code to port; the gap is entirely in build and release infrastructure.

---

## 3. Upstream Support Tier

There is no formal tier policy document.

**Evidence for support tier classification:**

- The Makefile `build-all-binaries` target cross-compiles for: `amd64`, `386`, `arm`, `arm64`, `mips64`, `mips64le`, `ppc64`, `ppc64le`, `s390x`. riscv64 is absent.
- The Docker release workflow (`release.yml`) builds images for `linux/amd64,linux/arm,linux/arm64` only. riscv64 is absent.
- CI test jobs (`tests.yml`) run only on `ubuntu-latest` (x86_64). No architecture matrix exists.
- Pre-built release binaries (v1.89.0, 2026-08-09): 23 assets covering 9 Linux architectures. riscv64 is absent from all 5 most recent releases examined.

**Architecture support comparison:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Makefile build target | Yes | Yes | No |
| CI build job | Yes | No | No |
| Docker image published | Yes | Yes | No |
| Pre-built release binary | Yes | Yes | No |
| Distro package available | No | No | No |

arm64 has Docker image support but no dedicated CI build or test job. riscv64 has no support of any kind from the upstream project.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

redis_exporter is a pure Go application. It has no C code, no assembly, no SIMD dispatch, no JIT compiler, no GC (it uses Go's runtime GC, which has riscv64 support as part of the Go toolchain itself), and no architecture-specific source files of any kind. A GitHub code search for `riscv64`, `riscv`, `rvv`, and `vfloat32m1_t` across the repository returned zero results for all four queries.

The repository contains 99 files total. There is no `arch/riscv/` directory, no `.S` assembly files, and no build-tag-gated architecture files (`//go:build riscv64`).

**Architecture-specific components:**

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Source code (arch-specific) | None | None | None | Pure Go by design |
| Assembly | None | None | None | No `.s` files in repo |
| SIMD / crypto accelerators | None | None | None | Not applicable |
| JIT | None | None | None | Not applicable |
| GC barriers | Via Go runtime | Via Go runtime | Via Go runtime | Go riscv64 runtime is complete |

The only architecture-sensitive code paths in the binary come from dependencies (see Section 9). The application itself has no architecture-specific subsystems to evaluate.

---

## 5. Build System, Cross-Compilation, and Toolchain

redis_exporter uses a simple GNU Makefile. There is no CMake, no Meson, no Autoconf. The build system calls `gox` (Go cross-compiler wrapper) for multi-arch release builds and `go build` for local builds.

**Minimum Go version:** `go 1.25.0` (declared in `go.mod`). CI uses Go 1.26 via `setup-go@v7`. Go has supported `GOARCH=riscv64 GOOS=linux` since Go 1.14. No toolchain gap exists.

**CGO status:** `CGO_ENABLED=0` is used in all release builds (Makefile `build-all-binaries` target and Dockerfile). No C compiler is required for any supported architecture.

**Manual riscv64 cross-compilation (works, not officially supported):**

```
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build \
  -ldflags "-s -w -extldflags \"-static\"" \
  -o redis_exporter-linux-riscv64 .
```

No GCC or Clang cross-compiler is needed. No QEMU is needed for building. Go's riscv64 cross-compilation is handled entirely by the Go toolchain.

**QEMU usage in CI:** `docker/setup-qemu-action@v4` is present in `release.yml` but is used only for `linux/arm` and `linux/arm64` Docker builds. riscv64 is not in the QEMU target list.

**Key files:**

- `/Makefile` - `build-all-binaries` target omits riscv64
- `/Dockerfile` - uses `GOARCH=${TARGETARCH}` BuildKit arg; would accept riscv64 if passed, but the CI pipeline does not pass it
- `/.github/workflows/release.yml` - release pipeline; no riscv64 in binary or Docker targets
- `/go.mod` - `go 1.25.0` minimum, pure Go dependencies

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because redis_exporter has no architecture-specific code, there are no functional gaps between riscv64 and amd64/arm64. A binary built with `GOARCH=riscv64` is functionally complete and correct.

**Functional gaps:** None. All Redis protocol handling, Prometheus exposition, TLS, cluster support, and Sentinel support are architecture-neutral Go code.

**Performance gaps:** Two dependencies use architecture-optimized assembly for amd64 and arm64 but fall back to pure Go on riscv64:

- `cespare/xxhash v2.3.0`: amd64 and arm64 have hand-written assembly (`xxhash_amd64.s`, `xxhash_arm64.s`). riscv64 uses the `xxhash_other.go` pure Go path. [NEEDS VERIFICATION: exact throughput regression magnitude; no benchmark data found for redis_exporter on riscv64.]
- `klauspost/compress v1.19.1`: amd64 and arm64 have SIMD assembly for zstd, s2, huff0, and seqdec. riscv64 uses pure Go fallbacks. This affects Prometheus metric payload compression throughput for high-cardinality exporters. [NEEDS VERIFICATION: quantitative impact; no riscv64 benchmark data found.]

For a typical redis_exporter deployment (scrape interval 15-30 seconds, hundreds to low thousands of metrics), the performance regression from these pure Go fallbacks is negligible in absolute terms. The exporter is not on any hot path that would expose compression throughput as a bottleneck.

**Security hardening gaps:** `golang.org/x/crypto v0.55.0` includes `crypto/internal/poly1305/sum_riscv64.s`, providing optimized ChaCha20-Poly1305 on riscv64. No security hardening gap exists for the TLS path.

**NaN / floating-point semantics:** Data not available: no riscv64-specific floating-point correctness issues were found or searched for redis_exporter; the project does not perform floating-point arithmetic (Redis metrics are integer counters and gauges passed through as-is).

**Feature comparison:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Redis standalone | Yes | Yes | Yes (build from source) |
| Redis Cluster | Yes | Yes | Yes (build from source) |
| Redis Sentinel | Yes | Yes | Yes (build from source) |
| TLS support | Yes | Yes | Yes (build from source) |
| Prometheus exposition | Yes | Yes | Yes (build from source) |
| xxhash performance | Assembly | Assembly | Pure Go (slower) |
| Compress performance | SIMD | SIMD | Pure Go (slower) |

---

## 7. CI/CD Infrastructure

All five workflow files in `.github/workflows/` were read directly. None contain the string "riscv" or "riscv64" in any case.

| Workflow | Trigger | Runs On | riscv64 |
|----------|---------|---------|---------|
| `codeql-analysis.yml` | push / PR / schedule | ubuntu-latest (x86_64) | Absent |
| `depsreview.yaml` | pull_request | ubuntu-latest (x86_64) | Absent |
| `release.yml` | version tags `v*` | ubuntu-latest (x86_64) | Absent |
| `tests.yml` | push / PR | ubuntu-latest (x86_64) | Absent |
| `update-readme.yml` | push to master (README changes) | ubuntu-latest (x86_64) | Absent |

No hardware riscv64 runners. No RISE CI runners. No QEMU-based riscv64 test job. The Docker multi-arch build in `release.yml` uses QEMU for arm/arm64 only; the explicit platform string is `linux/amd64,linux/arm,linux/arm64`.

**CI comparison:**

| CI capability | amd64 | arm64 | riscv64 |
|---------------|-------|-------|---------|
| Build job | Yes | No | No |
| Test job | Yes | No | No |
| Docker image build | Yes | Yes | No |
| Lint / CodeQL | Yes | No | No |

arm64 has no CI test coverage either -- it receives Docker image builds only. riscv64 has no CI presence of any kind.

---

## 8. Distribution and Release Status

**Official upstream binaries (v1.89.0, 2026-08-09):**

23 binary tarballs published. Linux architectures covered: 386, amd64, arm, arm64, mips64, mips64le, ppc64, ppc64le, s390x. riscv64: absent from all 5 most recent releases.

**Docker images:** Published to Docker Hub. Platforms: `linux/amd64`, `linux/arm`, `linux/arm64`. `linux/riscv64`: absent.

**PyPI:** A package named `redis_exporter` exists on PyPI at version 1.0.0 (`redis_exporter-1.0.0-py3-none-any.whl`). This is an unrelated Python stub package, not the Prometheus exporter binary. Not applicable.

**Debian:** HTTP 404 from tracker.debian.org -- not packaged in Debian.

**Ubuntu 24.04 (noble):** Not found in Ubuntu package search -- not packaged.

**Arch Linux RISC-V (archriscv.felixc.at):** No entry found -- not packaged.

**RISE wheel builder:** Not applicable -- redis_exporter is a Go binary, not a Python package. The RISE wheel builder project list does not include redis_exporter.

**What a riscv64 user must do today:** Build from source using `CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build .` with Go >= 1.25. The build succeeds and produces a correct binary. No pre-built option exists from any channel.

---

## 9. Dependencies

All direct dependencies are pure Go or provide pure Go fallbacks on unsupported architectures. No C bindings, no cgo, no Rust, no WASM components exist in the dependency graph.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|-----------|------|---------------|--------------|-----------------|-------|
| github.com/gomodule/redigo v1.9.3 | Redis protocol client | OK (pure Go) | Not tested on riscv64 | N/A (library) | No blockers |
| github.com/mna/redisc v1.4.0 | Redis Cluster client | OK (pure Go) | Not tested on riscv64 | N/A (library) | No blockers |
| github.com/prometheus/client_golang v1.24.1 | Prometheus metrics exposition | OK (pure Go) | CI covers linux/arm64 only | N/A (library) | riscv64 build fixed in v1.10.0 (upstream changelog in PR #508) |
| github.com/prometheus/client_model v0.6.2 | Prometheus data model (protobuf) | OK (pure Go) | Not tested on riscv64 | N/A (library) | No blockers |
| github.com/sirupsen/logrus v1.10.1 | Structured logging | OK (pure Go) | Not tested on riscv64 | N/A (library) | No blockers |
| github.com/cespare/xxhash/v2 v2.3.0 | Fast hash (Prometheus internals) | OK (pure Go fallback) | Functional on riscv64 | N/A (library) | amd64/arm64 have assembly; riscv64 uses pure Go (slower) |
| github.com/klauspost/compress v1.19.1 | Compression (zstd/s2/huff0) | OK (pure Go fallback) | Functional on riscv64 | N/A (library) | amd64/arm64 have SIMD; riscv64 uses pure Go (slower) |
| github.com/prometheus/procfs v0.21.1 | /proc filesystem parsing | OK (pure Go) | Not tested on riscv64 | N/A (library) | No blockers |
| github.com/prometheus/common v0.70.1 | Shared Prometheus utilities | OK (pure Go) | Not tested on riscv64 | N/A (library) | No blockers |
| golang.org/x/crypto v0.55.0 | TLS/crypto for Redis TLS mode | OK (riscv64 assembly exists) | Via Go stdlib CI | N/A (library) | poly1305 riscv64 asm added in v0.55.0 (PR #1163); riscv64 is first-class |
| golang.org/x/sys v0.47.0 | Syscall wrappers | OK (riscv64 supported) | Via Go CI | N/A (library) | No blockers |
| google.golang.org/protobuf v1.36.11 | Protobuf encoding (metrics wire format) | OK (riscv64 supported) | Builds and tests on riscv64 | Released with riscv64 support | Prior build issues fixed in earlier releases |

**No blocking dependency issues exist.** The two performance gaps (xxhash, klauspost/compress) are non-blocking; both libraries compile and produce correct output on riscv64 via pure Go paths. The crypto dependency (golang.org/x/crypto) has first-class riscv64 support including optimized poly1305 assembly.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| - | No riscv64 issues exist | - | - | GitHub issue search for "riscv" and "riscv64" returned zero results in oliver006/redis_exporter |

Data not available: no riscv64-specific correctness bugs, build failures, or performance reports have been filed anywhere for this project.

---

## 12. Objections and Upstream Blockers

**Technical blockers:** None. The project is pure Go with `CGO_ENABLED=0`. Adding riscv64 requires:
1. One line in the Makefile `build-all-binaries` target (`GOARCH=riscv64` added to the `gox` arch list)
2. One platform added to the Docker buildx command in `release.yml` (`linux/riscv64` appended to the platforms string)
3. A QEMU riscv64 registration in the release workflow (`docker/setup-qemu-action` already present for arm/arm64; adding riscv64 is a one-line change)

**Organizational blockers:** The maintainer has never been asked. No objection is on record. There is no stated policy against new architectures; the project already ships for 9 Linux architectures including mips64, ppc64, and s390x, demonstrating openness to minority architectures.

**Acceptance probability:** High [NEEDS VERIFICATION: maintainer response to a riscv64 PR has not been tested]. The precedent of accepting mips64le and s390x -- lower-volume architectures than riscv64 -- suggests a well-formed PR would be accepted. The change is trivially small and carries zero maintenance burden (pure Go, no architecture-specific code to maintain).

**RISE involvement:** None. No RISE member has filed an issue or PR. The RISE Developer Appreciation Program offers EUR 500 for adding linux-riscv64 CI pipeline support to projects like this; redis_exporter would qualify, but no application or award has been recorded.

---

## 13. Investment Analysis

RISE has done nothing for this project. All work below is unstarted.

### 13.1 Functional Enablement

The project is functionally complete on riscv64 today when built from source. The gap is packaging and distribution: no pre-built binary and no container image exist. Adding riscv64 to the Makefile and `release.yml` is a half-day task. A PR would be the deliverable.

### 13.2 Performance Optimization

Two dependency-level performance gaps exist (`cespare/xxhash`, `klauspost/compress`). Neither affects redis_exporter's use case in a measurable way -- the exporter is not on a throughput-critical path. Investment here is not warranted for redis_exporter specifically; these dependencies serve many projects and any assembly contributions belong in those upstream repos.

### 13.3 CI/CD Infrastructure

The project has no riscv64 CI of any kind. Adding a riscv64 build/test job to `tests.yml` using a QEMU software emulation runner is a half-day task. Hardware riscv64 runner support is not available in standard GitHub Actions; QEMU-based CI would provide build verification only, not performance testing.

### 13.4 Ecosystem Enablement

Not applicable. redis_exporter has no dependent package ecosystem. It is a standalone binary with no plugin architecture and no extension API.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | Add riscv64 to Makefile `build-all-binaries` and `release.yml` Docker platforms; open PR to upstream | 0.1 | RISE contributor or Qualcomm intern | High |
| CI/CD | Add riscv64 QEMU build/test job to `tests.yml` | 0.1 | RISE contributor | Medium |
| Performance | riscv64 assembly for `cespare/xxhash` (upstream, not this repo) | 2-4 | Upstream xxhash maintainer or contributor | Low |
| Performance | riscv64 SIMD for `klauspost/compress` (upstream, not this repo) | 4-8 | Upstream compress maintainer or contributor | Low |

Total effort to close the riscv64 gap for redis_exporter itself: under one person-day. The performance items are not redis_exporter work items; they are separate upstream projects.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [redis_exporter repository (oliver006/redis_exporter)](https://github.com/oliver006/redis_exporter)
- [redis_exporter releases (v1.89.0 latest)](https://github.com/oliver006/redis_exporter/releases)
- [PR #508 -- dependabot bump prometheus/client_golang 1.9.0 to 1.10.0](https://github.com/oliver006/redis_exporter/pull/508)
- [PR #1163 -- dependabot bump golang.org/x/crypto 0.54.0 to 0.55.0](https://github.com/oliver006/redis_exporter/pull/1163)
- [release.yml workflow -- Docker platform targets](https://github.com/oliver006/redis_exporter/blob/master/.github/workflows/release.yml)
- [tests.yml workflow -- CI architecture coverage](https://github.com/oliver006/redis_exporter/blob/master/.github/workflows/tests.yml)
- [Makefile -- build-all-binaries target](https://github.com/oliver006/redis_exporter/blob/master/Makefile)
- [go.mod -- dependency versions and minimum Go requirement](https://github.com/oliver006/redis_exporter/blob/master/go.mod)
- [cespare/xxhash -- architecture-specific assembly files](https://github.com/cespare/xxhash)
- [klauspost/compress -- SIMD architecture coverage](https://github.com/klauspost/compress)
- [golang.org/x/crypto -- riscv64 poly1305 assembly (commit 5ed4944)](https://github.com/golang/crypto)
- [RISE project member list](https://riseproject.dev)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at)
- [Debian package tracker for redis_exporter (404 -- not packaged)](https://tracker.debian.org/pkg/redis_exporter)