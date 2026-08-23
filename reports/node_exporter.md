---
title: node_exporter
---

# node_exporter

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for node_exporter<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

node_exporter is the standard Linux hardware and OS metrics exporter for the Prometheus monitoring system. It runs as a daemon on each monitored host, exposes a `/metrics` HTTP endpoint, and collects ~50 collector modules covering CPU, memory, disk, network, filesystem, NTP, systemd, perf events, and other Linux kernel interfaces via `/proc` and `/sys`.

The project is pure Go. There is no C extension, no JIT, no SIMD, no architecture-specific assembly, and no native dependency beyond the Linux kernel interfaces it reads. The codebase is entirely portable Go.

**Governance:** Prometheus is a [CNCF graduated project](https://www.cncf.io/projects/prometheus/), joining CNCF in 2016 as the second project after Kubernetes. The Linux Foundation holds relevant trademarks. Originally developed at SoundCloud.

**License:** Apache 2.0.

**Maintainers:** Two listed in MAINTAINERS.md:
- Ben Kochie (GitHub: @SuperQ) - dominant human committer; no external employer listed
- Johannes Ziemke (GitHub: @discordianfish) - co-maintainer

No single corporation dominates contributions. Heavy automated activity from PrometheusBot (common-files sync from prometheus/prometheus) and dependabot. Red Hat engineers contributed to Makefile.common historically (2018-2019). No corporate sponsor is formally named for node_exporter itself.

**RISE membership:** Prometheus and node_exporter are not RISE members and have no RISE involvement. Zero RISE blog posts mention node_exporter. The RISE wheel builder index does not list node_exporter (it is a Go binary, not a Python wheel).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-02-25 | First riscv64 issue filed: e2e tests fail on riscv64 Linux 5.11 due to x86-specific CPU fixture data | [Issue #2296](https://github.com/prometheus/node_exporter/issues/2296) |
| 2023-04-01 | Issue filed requesting official riscv64 binary builds; user manually cross-compiled and verified on StarFive VisionFive 2 | [Issue #2645](https://github.com/prometheus/node_exporter/issues/2645) |
| 2023-05-31 | PR #2706 opened to add riscv64 Docker support - closed unmerged; maintainer said no changes needed to node_exporter, promu handles it | [PR #2706](https://github.com/prometheus/node_exporter/pull/2706) |
| 2023-07-06 | SuperQ merges promu update to v0.15.0 in prometheus/prometheus, which adds riscv64 to promu default platforms | promu#254 |
| 2023-07-18 | PrometheusBot syncs common files to node_exporter via PR #2752; riscv64 binary cross-compilation enabled | [PR #2752](https://github.com/prometheus/node_exporter/pull/2752) |
| 2024-11-10 | Second e2e test failure issue filed for riscv64; same root cause (x86-specific CPU metrics in fixture) | [Issue #3180](https://github.com/prometheus/node_exporter/issues/3180) |
| 2025-04-25 | Issue filed that riscv64 Docker images are still absent from Docker Hub and quay.io | [Issue #3311](https://github.com/prometheus/node_exporter/issues/3311) |
| 2025-04-25 | PR #3312 opened to add riscv64 Docker images; receives LGTM from discordianfish; closed without merge when author deleted their repository | [PR #3312](https://github.com/prometheus/node_exporter/pull/3312) |
| 2026-03-09 | PR #3578 opened by new contributor to revive #3312; SuperQ requests minor style fixes | [PR #3578](https://github.com/prometheus/node_exporter/pull/3578) |
| 2026-04-07 | riscv64 Docker images confirmed live on Docker Hub in v1.11.1; PR #3578 closed as redundant; quay.io confirmed not supporting riscv64 | [Issue #3311 closure comment](https://github.com/prometheus/node_exporter/issues/3311) |

**Key contributors:** Ben Kochie (SuperQ) drove the promu upgrade that unblocked riscv64. Community contributors filed all the riscv64 issues; no maintainer has driven riscv64-specific work.

**Upstreaming status:** Fully upstream. riscv64 is a first-class build and release target. No out-of-tree patches exist.

---

## 3. Upstream Support Tier

node_exporter has no formal platform tier policy. No PLATFORMS.md, SUPPORT.md, or tier matrix exists in the repository. All supported architectures receive identical treatment: cross-compiled binaries, Docker images, and release tarballs via the shared promu + CI infrastructure.

**Comparison table:**

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Release binary tarball | Yes | Yes | Yes (since ~v1.7.0, 2023) |
| Docker image (Docker Hub) | Yes | Yes | Yes (since v1.11.1, 2026-04-07) |
| Docker image (quay.io) | Yes | Yes | No - quay.io does not support riscv64 (platform limitation) |
| Native CI runner | Yes (`ubuntu-latest`) | Yes (`ubuntu-24.04-arm`) | No |
| e2e test execution in CI | Yes | Yes | No |
| Functional test execution in CI | Yes | Yes | No |
| Debian sid package | Yes | Yes | Yes (1.11.1-3, built on rv-osuosl-01) |
| Ubuntu 24.04 package | Yes | Yes | Yes (1.7.0-1) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

node_exporter has no architecture-specific subsystems, no JIT, no SIMD, no assembly, and no crypto implementation of its own. It is a pure-Go userspace daemon that reads Linux kernel interfaces.

**Architecture-specific code audit:**

A full search of `riscv64`, `rvv`, `vfloat32m1_t`, `risc-v`, `__riscv`, `_riscv64` across the entire repository returned zero hits in any Go source file. The word "riscv64" appears only in build-system files (Makefile, Makefile.common, .dockerignore). There are no `_riscv*.go` files, no `//go:build riscv64` constraints, no `arch/riscv/` directories, and no `.S` assembly files anywhere in the tree.

The only architecture-tagged Go files in the project target non-Linux platforms:

| File | Arch | OS |
|------|------|----|
| `collector/diskstats_openbsd_amd64.go` | amd64 | OpenBSD |
| `collector/interrupts_openbsd_amd64.go` | amd64 | OpenBSD |
| `collector/meminfo_openbsd_amd64.go` | amd64 | OpenBSD |
| `collector/netdev_openbsd_amd64.go` | amd64 | OpenBSD |
| `collector/sysctl_openbsd_amd64.go` | amd64 | OpenBSD |
| `collector/thermal_darwin_amd64.go` | amd64 | macOS |
| `collector/thermal_darwin_arm64.go` | arm64 | macOS |

There are zero Linux amd64-specific files, zero Linux arm64-specific files, and zero Linux riscv64-specific files.

**Behavior on riscv64 by collector:**

| Collector | riscv64 behavior | Notes |
|-----------|-----------------|-------|
| cpu (basic counters) | Full | Reads `/proc/stat` via procfs; arch-neutral |
| cpu_flag_info, cpu_bug_info | Absent (correct) | Reads `flags` and `bugs` fields from `/proc/cpuinfo`; those fields are Intel-specific and absent on riscv64. Collector emits zero metrics silently - no crash, no error. Causes e2e test failures (issues #2296, #3180) |
| cpu_info (model/vendor) | Absent (correct) | Same root cause as above |
| memory | Full | Reads `/proc/meminfo`; arch-neutral |
| disk, filesystem, netdev, netstat | Full | Reads `/proc`/`/sys`; arch-neutral |
| loadavg, time, uname | Full | Arch-neutral |
| perf | Full (runtime-dependent) | Uses `perf_event_open` syscall via `hodgesds/perf-utils`; syscall is supported on riscv64 Linux. Availability depends on SoC PMU support |
| thermal_throttle | Full (runtime-dependent) | Reads `/sys/devices/system/cpu/cpu*/thermal_throttle/`; silently skips on hardware that does not expose this interface |
| systemd | Full | Uses D-Bus via pure-Go library; arch-neutral |

**Comparison table (arch-specific subsystems):**

| Subsystem | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| JIT | N/A | N/A | N/A |
| SIMD / vectorized paths | None | None | None |
| Assembly | None | None | None |
| Crypto acceleration | Delegated to Go runtime | Delegated to Go runtime | Delegated to Go runtime |
| CPU flag/bug metrics | Present (Intel-specific) | Present (ARM-specific) | Absent - correct, no such fields in `/proc/cpuinfo` |

---

## 5. Build System, Cross-Compilation, and Toolchain

node_exporter uses [promu](https://github.com/prometheus/promu) (Prometheus utility tool) as its build system, with a Makefile wrapping promu commands. No CMake, no Bazel, no meson.

**riscv64 build command (as executed by CI):**

```
GOOS=linux GOARCH=riscv64 \
  CC=riscv64-linux-gnu-gcc \
  CXX=riscv64-linux-gnu-g++ \
  make PREFIX=.build/linux-riscv64 build
```

Equivalently via promu:

```
promu crossbuild -v
```

The `.promu.yml` declares `crossbuild: platforms: [linux, openbsd/amd64]`. The `linux` token expands to all Linux architectures promu knows, which includes `linux/riscv64` (confirmed present in `promu/cmd/crossbuild.go`). riscv64 is not named explicitly in the node_exporter `.promu.yml` - it is picked up by the `linux` wildcard.

**Required toolchain:**

- Go 1.26 (as declared in `.promu.yml` and the CI builder image `quay.io/prometheus/golang-builder:1.26-base`)
- `gcc-riscv64-linux-gnu` and `g++-riscv64-linux-gnu` for CGO (installed directly in the golang-builder Dockerfile alongside `libc6-dev-riscv64-cross`, `libc6-riscv64-cross`, `linux-libc-dev-riscv64-cross`)

The CGO crossbuild (`.promu-cgo.yml`) does NOT target riscv64. It covers only `darwin/amd64`, `darwin/arm64`, `netbsd/amd64`, `netbsd/386`. The riscv64 Linux binary is built without CGO for the primary binary [NEEDS VERIFICATION - the golang-builder Dockerfile installs the riscv64 cross-compiler suggesting CGO is available, but `.promu-cgo.yml` does not list riscv64].

**QEMU:** Not used anywhere in the build process. Cross-compilation is handled entirely by `GOOS`/`GOARCH` Go environment variables plus the gcc cross-compiler for CGO.

**Dockerfiles:** Two architecture-agnostic Dockerfiles exist (`Dockerfile` using busybox base, `Dockerfile.distroless` using distroless). Both accept `ARG ARCH` and `ARG OS` and `COPY .build/${OS}-${ARCH}/node_exporter /bin/node_exporter`. There is no dedicated `Dockerfile.riscv64`. The `.dockerignore` explicitly allows `.build/linux-riscv64/` to reach the Docker build context.

**Known build failures:** None. The cross-compilation has been reliable since promu 0.15.0 (2023). The sole riscv64 build failure in the dependency graph (a procfs build issue) was resolved in procfs v0.3.0, which predates current dependency versions.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---------|-------|-------|---------|----------|
| All /proc-based collectors | Full | Full | Full | None |
| All /sys-based collectors | Full | Full | Full | None |
| CPU topology metrics (cores, threads) | Full | Full | Full | None |
| CPU flag metrics (aes, avx2, etc.) | Present | Present (ARM flags) | Absent | Correct absence - kernel-specific |
| CPU bug metrics (spectre, meltdown) | Present | Present | Absent | Correct absence - Intel/ARM-specific |
| CPU model/vendor string metrics | Present | Present | Absent | Correct absence |
| perf_event_open collectors | Full | Full | Full (hardware-dependent) | None in software |
| Thermal throttle | Present | Present | Present (if SoC exposes sysfs) | Potential hardware gap |
| systemd unit metrics | Full | Full | Full | None |
| NTP offset, network statistics | Full | Full | Full | None |

**Performance gaps:** Data not available. No published benchmarks comparing node_exporter scrape latency or CPU overhead on riscv64 vs arm64 or amd64 were found in GitHub issues, PRs, web searches, or RISE Project materials.

The dominant performance factors for node_exporter are `/proc` and `/sys` read throughput and HTTP serving. Neither involves SIMD. Throughput is bounded by kernel I/O, not CPU ISA. The pure-Go path in dependencies (`golang.org/x/crypto` AES-GCM fallback, `cespare/xxhash` pure-Go hashing) is slower than the assembly-accelerated paths used on amd64 and arm64, but HTTPS scraping performance is not a primary concern for most deployments.

**Security hardening gaps:** None identified. All security hardening (TLS, authentication) is delegated to `prometheus/exporter-toolkit`, which is pure Go and arch-neutral.

**NaN / floating-point issues:** None found. No issues mentioning NaN, floating-point correctness, or numeric semantics specific to riscv64 were found in the repository.

---

## 7. CI/CD Infrastructure

**Actual CI files reviewed:** `.github/workflows/ci.yml`, `.github/workflows/approve-workflows.yml`, `.github/workflows/bsd.yml`, `.github/workflows/golangci-lint.yml`, `.github/workflows/govulncheck.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists.

**Critical finding:** The string "riscv" does not appear anywhere in `ci.yml`. There is no explicit riscv64 configuration in the CI YAML.

riscv64 is covered only as a side effect of `promu crossbuild` expanding the `linux` platform token on an x86 `ubuntu-latest` runner. The CI produces a riscv64 binary but executes zero functional tests against it.

**Comparison table:**

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | `ubuntu-latest` (x86) | `ubuntu-24.04-arm` (native) | None |
| Cross-compilation | N/A | N/A | Yes (on x86 `ubuntu-latest` via promu) |
| `make test` | Yes | Yes | No |
| `make test-e2e` | Yes | Yes (`test_go_arm` job) | No |
| Functional test execution | Yes | Yes | No |
| Docker image built | Yes | Yes | Yes (buildx on x86) |
| Docker image published | Yes (Docker Hub + quay.io) | Yes (Docker Hub + quay.io) | Yes (Docker Hub only; quay.io lacks riscv64 support) |
| RISE-provided runner | No | No | No |
| Release binary produced | Yes | Yes | Yes (cross-compiled) |

**RISE runners:** None. RISE has no involvement with node_exporter CI infrastructure.

---

## 8. Distribution and Release Status

**GitHub upstream releases:**

Every release from at least v1.11.0 through v1.12.1 (the current latest as of 2026-07-14) ships `node_exporter-<version>.linux-riscv64.tar.gz` as a release asset. This is confirmed by direct GitHub API for v1.11.1, v1.12.0, and v1.12.1. The riscv64 binary is a cross-compiled artifact produced on x86 with no functional test coverage on the target architecture.

**Docker images:**

`docker pull --platform linux/riscv64 prom/node-exporter:v1.12.1` works. The Docker Hub manifest for v1.12.1 lists six platforms: `linux/amd64`, `linux/arm64`, `linux/arm/v7`, `linux/ppc64le`, `linux/riscv64`, `linux/s390x`. riscv64 images are published to Docker Hub only. quay.io (`quay.io/prometheus/node-exporter`) does not support riscv64 - this is a quay.io platform limitation, not a node_exporter decision.

**Debian:**

`prometheus-node-exporter` version 1.11.1-3 is installed and built for riscv64 in Debian sid. It was built on `rv-osuosl-01` (an OSU OSL-hosted RISC-V board). All primary Debian architectures (amd64, arm64, armhf, i386, loong64, ppc64el, riscv64, s390x, ppc64) are in the Installed state.

**Ubuntu:**

`prometheus-node-exporter` version 1.7.0-1 is available for riscv64 in Ubuntu 24.04 Noble (`packages.ubuntu.com/noble/prometheus-node-exporter`). Note: this lags upstream significantly (current upstream is 1.12.1).

**Arch Linux RISC-V:** Data not available: the archriscv.felixc.at query page did not return a package listing in the fetched content.

**What a user must do to get a working riscv64 binary:** Download `node_exporter-<version>.linux-riscv64.tar.gz` from the GitHub releases page, or pull `prom/node-exporter:latest` from Docker Hub with `--platform linux/riscv64`, or install `prometheus-node-exporter` from Debian/Ubuntu package repositories. No compilation required.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Go runtime (`golang/go`) | Language runtime, syscall layer, GC | Yes (since Go 1.14) | Partial - open issues #80880 (missing LUCI riscv64 builder), #78918 (missing crc32 asm), #79997 (indexbyte perf) | Yes - official linux/riscv64 binaries | No hard blockers; missing asm optimisations degrade perf, not correctness. See `reports/go.md` |
| `golang.org/x/sys` | Kernel ABI constants, syscall wrappers (uname, netlink, perf) | Yes | No riscv64-specific open issues found | Ships as module | None |
| `golang.org/x/crypto` | TLS 1.3 (via exporter-toolkit), ChaCha20, AES-GCM | Yes | No riscv64-specific open issues found | Ships as module | No hard blockers; AES-GCM and ChaCha20 run on pure-Go fallback on riscv64 (no hardware assist), degrading HTTPS performance but not correctness |
| `prometheus/procfs` | Parses `/proc` and `/sys`; node_exporter primary data source | Yes; historical build failure resolved in v0.3.0 | No new riscv64 open issues | v0.21.1 in node_exporter v1.12.1 | None |
| `prometheus/client_golang` | Metrics exposition, registry | Yes | No riscv64 open issues | Included in v1.12.1 | None |
| `prometheus/exporter-toolkit` | Web listener, TLS config, auth for /metrics | Yes | No riscv64 open issues | Included in v1.12.1 | None |
| `cespare/xxhash/v2` | 64-bit hashing for label fingerprinting | Yes; pure-Go fallback active (no riscv64 asm file) | No riscv64 open issues | Indirect dependency | No hard blockers; pure-Go path ~2x slower than asm path, fully correct |
| `hodgesds/perf-utils` | Linux `perf_event_open` wrappers for perf collector | Yes; uses `golang.org/x/sys` internally | No riscv64 open issues | Indirect dependency | Runtime: perf counter availability depends on SoC PMU; not a build blocker |

**Go runtime deep-dive:** The Go runtime supports `GOARCH=riscv64` since Go 1.14. Missing assembly optimisations (crc32, indexbyte) are open issues in the Go project that affect throughput of string-heavy operations. For node_exporter workloads - dominated by `/proc` reads and HTTP serving - these gaps have low practical impact. Full details in `reports/go.md`.

**golang.org/x/crypto:** AES-GCM has hardware-accelerated asm on amd64 (AES-NI) and arm64 (ARMv8 crypto extensions). On riscv64, the pure-Go fallback activates. For node_exporter's HTTPS endpoint under typical monitoring scrape intervals (every 15-60 seconds), this is not a material concern.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#2296](https://github.com/prometheus/node_exporter/issues/2296) | Fail to test with version 1.3.1 under RISC-V | Open (since 2022-02-25) | Low - test infrastructure only | `go test ./...` and e2e test fail on riscv64 because fixture data contains x86-specific CPU metrics (`node_cpu_flag_info`, `node_cpu_bug_info`). No functional breakage at runtime. Open for 4 years with no activity since 2022-03-07. Fix pattern known (guard metrics as x86-only, per issue #2016 precedent). No PR filed. |
| [#3180](https://github.com/prometheus/node_exporter/issues/3180) | end-to-end test fails on riscv64 machine | Open (since 2024-11-10) | Low - test infrastructure only | Same root cause as #2296. Reproduced on riscv64 hardware with node_exporter 1.8.2 / Go 1.23.2 / Linux 6.6.52. Maintainer invited reporter to submit a fix; no PR filed as of data collection date. |

**No correctness bugs.** The two open issues are test fixture mismatches, not runtime failures. node_exporter operates correctly on riscv64; the tests simply fail because they compare against x86-specific reference output.

No issues involving NaN, floating-point correctness, data corruption, metric inaccuracy, or panics specific to riscv64 were found.

---

## 12. Objections and Upstream Blockers

**No active upstream objections to riscv64 support.** Maintainers have been receptive to riscv64 contributions. The three Docker image PRs (#2706, #3312, #3578) all received maintainer attention; the first was closed because the work was handled automatically, the second because the author deleted their repository (not a technical rejection), and the third because the feature had already landed by the time it was reviewed.

**Technical blockers:**

1. **e2e test fixture is x86-specific** - issues #2296 and #3180, both open. This blocks running the test suite on riscv64 hardware but does not block functional use. The fix pattern is documented (guard x86-only CPU metrics with a build tag or runtime arch check, following issue #2016). Effort: low. No maintainer has prioritized it.

2. **No native riscv64 CI runner** - the project does not have access to a riscv64 GitHub Actions runner. There is no QEMU-based test execution either. riscv64 binaries are shipped without functional test validation in CI. This mirrors the state of other embedded architectures (armv7, ppc64le, s390x) in the same project.

3. **quay.io does not support riscv64** - this is a registry platform limitation, not a node_exporter issue. Docker Hub is the correct registry for riscv64 images.

**Organizational blockers:** None. The two-person maintainer team is small but responsive. The project follows a shared Prometheus infrastructure model (promu, common Makefile) which means riscv64 improvements to shared infrastructure automatically benefit node_exporter.

**Acceptance probability:** High for any well-formed contribution. The e2e test fix and a native CI runner addition would both be accepted based on maintainer behavior observed in the issue tracker.

---

## 13. Investment Analysis

RISE has no involvement with this project. All existing riscv64 work was done by upstream maintainers and community contributors without external investment.

### 13.1 Functional Enablement

node_exporter is functionally complete on riscv64. All collectors work. The only gap is that CPU flag/bug/model metrics are absent because riscv64 `/proc/cpuinfo` does not expose x86-specific fields. This is correct behavior. No functional enablement work is needed.

### 13.2 Performance Optimization

node_exporter has no SIMD, no JIT, and no performance-sensitive inner loops of its own. Performance is bounded by kernel I/O throughput for `/proc`/`/sys` reads and Go HTTP serving. The only riscv64-specific performance gaps are in dependencies (Go runtime missing crc32/indexbyte asm, golang.org/x/crypto pure-Go fallback for AES-GCM). Those are tracked in the Go runtime and x/crypto projects, not here.

No performance optimization work is warranted for node_exporter specifically on riscv64.

### 13.3 CI/CD Infrastructure

The only CI gap with clear engineering value is a native riscv64 runner to execute the e2e test suite. This would require:

1. A RISC-V board or VM accessible to GitHub Actions, or QEMU-based test execution in CI.
2. Fix for the e2e test fixture (issues #2296, #3180) - guard x86-only CPU metrics so the test passes on non-x86 hardware.

The e2e fixture fix is entirely self-contained within node_exporter. It requires identifying which metrics are emitted conditionally on Linux x86 and wrapping the test assertion or the collector registration with an arch check, following the pattern established in issue #2016.

### 13.4 Ecosystem Enablement

Not applicable. node_exporter has no dependent package ecosystem requiring riscv64 enablement. It is a standalone Go binary.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Fix e2e test fixture to guard x86-only CPU metrics (issues #2296, #3180) | 0.5 | Community / upstream | Medium |
| CI/CD | Add QEMU-based riscv64 test execution to `ci.yml` | 1 | Community / upstream | Low |
| Functional | None needed | - | - | - |
| Performance | None needed | - | - | - |
| Ecosystem | None needed | - | - | - |

The e2e fixture fix is the only item with meaningful engineering value. It is small, low-risk, and unblocked. A QEMU-based CI runner would close the test coverage gap but adds CI complexity and is not blocking any production use. The overall investment case for this project is minimal - it already works on riscv64 in production.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [node_exporter GitHub repository](https://github.com/prometheus/node_exporter)
- [Issue #2296 - Fail to test with version 1.3.1 under RISC-V](https://github.com/prometheus/node_exporter/issues/2296)
- [Issue #2645 - ci: build riscv64 binaries](https://github.com/prometheus/node_exporter/issues/2645)
- [Issue #3180 - end-to-end test fails on riscv64 machine](https://github.com/prometheus/node_exporter/issues/3180)
- [Issue #3311 - Provide linux/riscv64 container images](https://github.com/prometheus/node_exporter/issues/3311)
- [PR #2706 - feat(riscv64), riscv64 image support (closed unmerged)](https://github.com/prometheus/node_exporter/pull/2706)
- [PR #3312 - ci(docker): build and publish linux/riscv64 images (closed unmerged)](https://github.com/prometheus/node_exporter/pull/3312)
- [PR #3578 - ci(docker): build and publish linux/riscv64 images (closed unmerged)](https://github.com/prometheus/node_exporter/pull/3578)
- [node_exporter releases - GitHub](https://github.com/prometheus/node_exporter/releases)
- [Ubuntu 24.04 prometheus-node-exporter package](https://packages.ubuntu.com/noble/prometheus-node-exporter)
- [Debian buildd status - prometheus-node-exporter sid](https://buildd.debian.org/status/package.php?p=prometheus-node-exporter&suite=sid)
- [promu - Prometheus utility tool](https://github.com/prometheus/promu)
- [RISE Project homepage](https://riseproject.dev)