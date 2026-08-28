---
title: OpenTelemetry
categories:
  - observability
---

# OpenTelemetry

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenTelemetry<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

OpenTelemetry is a CNCF graduated project (highest CNCF maturity tier) formed from the merger of OpenTracing and OpenCensus. It defines vendor-neutral APIs, SDKs, and the OpenTelemetry Protocol (OTLP) wire format for collecting and exporting traces, metrics, and logs. All subprojects are licensed under Apache 2.0.

The project has two governing bodies: a Governance Committee (9 members, project-wide policy) and a Technical Committee (9 members, specifications and architecture). Major corporate representation includes Grafana Labs (2 GC + 1 TC), Microsoft (1 GC + 2 TC), Google (2 TC), Splunk (1 GC + 1 TC), Datadog (1 GC), Apple (1 GC), Dynatrace (1 TC), and Snowflake (1 TC).

The components relevant to this report are:

- **opentelemetry-collector** -- Go-based core data pipeline
- **opentelemetry-collector-contrib** -- extended receiver/exporter plugins (Go)
- **opentelemetry-collector-releases** -- packaged distributions (otelcol, otelcol-contrib, otelcol-k8s, otelcol-otlp)
- **opentelemetry-go** -- Go SDK and API
- **opentelemetry-cpp** -- C++ SDK
- **opentelemetry-rust** -- Rust SDK
- **opentelemetry-ebpf-instrumentation** -- zero-code auto-instrumentation via eBPF

---

## 2. Port History and Upstreaming Timeline

All riscv64 work was authored by a single community contributor, Mateusz Urbanek (GitHub: shanduur). No RISE Project involvement has been identified in any related issue, PR, or blog post.

| Date | Event | Reference |
|---|---|---|
| 2025-06-02 | Issue opened requesting riscv64 support in collector-releases | [opentelemetry-collector-releases #968](https://github.com/open-telemetry/opentelemetry-collector-releases/issues/968) |
| 2025-06-02 | PR opened adding riscv64 to collector-releases | [opentelemetry-collector-releases #969](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/969) |
| 2025-06-17 | Companion issue opened in core collector repo | [opentelemetry-collector #13226](https://github.com/open-telemetry/opentelemetry-collector/issues/13226) |
| 2025-07-22 | PR opened adding riscv64 to core collector | [opentelemetry-collector #13458](https://github.com/open-telemetry/opentelemetry-collector/pull/13458) |
| 2025-07-22 | PR opened adding riscv64 to collector-contrib | [opentelemetry-collector-contrib #41496](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41496) |
| 2025-07-24 | collector-contrib PR merged by atoulme | [#41496](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41496) |
| 2025-07-25 | Post-merge Docker build failure: missing telemetrygen_linux_riscv64 binary | [opentelemetry-collector-contrib #41558](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41558) |
| 2025-07-25 | Fix for missing binary merged same day; revert closed without merging | [opentelemetry-collector-contrib #41560](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41560) |
| 2025-07-25 | Core collector PR merged by mx-psi (Pablo Baeyens, Datadog) | [#13458](https://github.com/open-telemetry/opentelemetry-collector/pull/13458) |
| 2025-07-29 | First release shipping riscv64 binaries: v0.131.0 | [NEEDS VERIFICATION] |
| 2025-08-07 | collector-releases PR merged by mowies; follow-up k8s pipeline fix merged same day | [#969](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/969), [#1090](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/1090) |
| 2025-08-12 | First collector-releases tagged release with riscv64: v0.132.0 | [NEEDS VERIFICATION] |
| 2026-03-17 | Fix for docker/setup-qemu-action v4.0.0 breaking riscv64 CI builds | [opentelemetry-collector #14777](https://github.com/open-telemetry/opentelemetry-collector/pull/14777) |
| 2026-04-02 | Issue opened proposing cross-build CI for opentelemetry-go including linux/riscv64 (OPEN) | [opentelemetry-go #8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126) |

The first commit introducing riscv64 to the core collector is identified as commit e8304984, "Add riscv64 arch (#13458)", authored by Mateusz Urbanek on 2025-07-25. The changelog entry in v0.131.0 states: "New Tier 3 platform riscv64 allowing the collector to be built and distributed for this platform."

Review friction was low. For the core collector PR (#13458), the main reviewer requests were a changelog entry and a cspell wordlist update. The PR received three approvals (atoulme, jmacd, mx-psi) before merging. No TC vote or SIG charter was required.

---

## 3. Upstream Support Tier

The opentelemetry-collector project defines three platform tiers:

- **Tier 1:** Full CI on every PR; failures block all releases.
- **Tier 2:** CI at release time only; per-platform failure does not block others; dummy implementations permitted.
- **Tier 3:** Cross-compile only on linux/amd64; zero native testing; binaries published but not validated; community fixes only; no bugfix releases for prior versions.

riscv64 is classified as **Tier 3** across opentelemetry-collector, opentelemetry-collector-contrib, and opentelemetry-collector-releases.

The Tier 3 designation means:
- Build correctness is verified only by cross-compilation on an x86-64 host.
- No tests are executed on riscv64 hardware or emulation.
- The community contact for riscv64 is shanduur (Mateusz Urbanek), listed in platform-support.md.
- A riscv64-specific regression does not block release of other platforms.

The opentelemetry-go SDK has no tier designation for riscv64. It is absent from the compatibility matrix. Issue [#8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126) proposes adding a cross-build CI workflow that would include linux/riscv64, but no workflow file exists on the main branch as of June 2026.

The opentelemetry-cpp, opentelemetry-rust, and opentelemetry-ebpf-instrumentation components have no riscv64 support tier. The eBPF instrumentation component explicitly lists riscv64 as "Out Of Scope" in SUPPORT_MATRIX.md.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

OpenTelemetry (all components in this report) contains **zero architecture-specific code for riscv64**. There are no `_riscv64.go` files with build tags, no `.S` assembly files, no JIT backends, no SIMD dispatch, and no C intrinsics anywhere in the collector codebase. The same is true of the Go SDK and Rust SDK.

This absence is a property of the language choices (Go, Rust), not a gap. Go's standard library and compiler handle all riscv64 backend concerns. The collector cross-compiles to riscv64 using standard `GOOS=linux GOARCH=riscv64 go build` with `CGO_ENABLED=0`.

The following components explicitly do not support riscv64 and have architecture-specific code paths that block a trivial port:

- **opentelemetry-ebpf-instrumentation:** Supported architectures are amd64 and arm64 only. The `asm/` directory contains only `amd/` and `arm/` subdirectories. The `support/` directory contains `support_amd64.go`, `support_arm64.go`, and `support_others.go`. riscv64 would require new eBPF-to-userspace plumbing. The Linux kernel BPF JIT has supported riscv64 since kernel 5.1 (2019) -- the gap is at the OTel project level, not the kernel level.

- **opentelemetry-cpp:** No riscv64 cross-compilation toolchain file exists in the repository. No riscv64 CI job is present. The arm64 CI job was commented out on 2024-11-06 due to lack of runners, meaning the project has no non-x86 CI at present.

---

## 5. Build System, Cross-Compilation, and Toolchain

### Collector (Go)

The collector uses GoReleaser for release builds and GNU Make for development builds. The goreleaser config for the `otelcol` distribution (`distributions/otelcol/.goreleaser.yaml`) includes riscv64 in the Linux `goarch` list:

```
goos: [linux, darwin, windows]
goarch: [386, amd64, arm, arm64, ppc64le, riscv64, s390x]
```

riscv64 is Linux-only. No macOS or Windows riscv64 builds exist.

The goreleaser environment sets:
- `GOARM: "7"` (for arm)
- `GOAMD64: v1`
- `GOPPC64: power8`
- `GORELEASER_PRO_VERSION: v2.16.0`

No equivalent tuning flag for riscv64 (e.g., `GORISCV64`) is set, meaning the build targets the baseline riscv64 ISA with no RVV or other extension.

Docker multi-arch images are built using `docker/setup-qemu-action` and `docker/setup-buildx-action`. The release workflows explicitly declare:

```yaml
platforms: arm64,ppc64le,s390x,riscv64
```

PR [#14777](https://github.com/open-telemetry/opentelemetry-collector/pull/14777) (merged 2026-03-17) added this explicit declaration after `docker/setup-qemu-action@v4.0.0` stopped installing riscv64 by default, breaking CI silently.

Development cross-compile command:
```sh
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 make otelcorecol
```

### C++ SDK

CMake minimum version: 3.16.0. C++ standard minimum: C++14. Active CI compilers: GCC 14 and Clang 18 (Ubuntu 24.04). No riscv64 toolchain file is provided in the repository. No upstream riscv64 build documentation exists.

### Rust SDK

No riscv64 cross-compilation instructions exist in opentelemetry-rust. The CI matrix covers ubuntu-latest, windows-latest, macos-latest, and ubuntu-24.04-arm. riscv64 is not present.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

For the Go-based collector, riscv64 has full feature parity with arm64 and amd64 at the source level. All receiver, processor, and exporter plugins in collector-contrib are available for riscv64 because they are pure Go. The only distinction is that riscv64 carries Tier 3 status (no runtime testing) while amd64 and arm64 are Tier 1 or Tier 2.

For the **eBPF instrumentation** component, the feature gap vs arm64 is total: riscv64 is explicitly out of scope. This component provides zero-code auto-instrumentation without source changes. On amd64 and arm64, it is available. On riscv64, it is not, and no timeline for support has been stated.

For **opentelemetry-cpp**, no riscv64 build has been validated. The C++ SDK provides instrumentation for C++ applications. The feature gap vs arm64 is total at the validated-build level.

For **opentelemetry-go**, the source compiles for riscv64 by virtue of being pure Go, but it is absent from the compatibility matrix. A contributor tested the full test suite on a SiFive VisionFive2 (Linux 5.15.0-starfive, Go 1.22.3 linux/riscv64) and reported tests passing, but the maintainers rejected the documentation update because the compatibility matrix requires active CI coverage, not one-off local test runs. See [opentelemetry-go PR #5420](https://github.com/open-telemetry/opentelemetry-go/pull/5420).

No published benchmark data exists comparing OpenTelemetry performance on riscv64 vs arm64 or amd64.

---

## 7. CI/CD Infrastructure

### Current State (file-verified)

| Repo | Workflow | Job | riscv64 Nature |
|---|---|---|---|
| opentelemetry-collector | `.github/workflows/build-and-test.yml` | `cross-build-collector` | Cross-compile on ubuntu-latest (x86-64); `GOOS=linux GOARCH=riscv64 make otelcorecol`; no tests |
| opentelemetry-collector-contrib | `.github/workflows/build-and-test.yml` | `cross-compile` | Cross-compile on ubuntu-24.04 (x86-64); `GOOS=linux GOARCH=riscv64`; no tests; gated on `ci:full` label for PRs |
| opentelemetry-collector-releases | `distributions/otelcol/.goreleaser.yaml` | `builds` + `dockers` | Release goreleaser config; produces binary and Docker image via buildx; runs at release time |
| opentelemetry-go | none | n/a | Issue [#8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126) proposes cross-build CI including linux/riscv64; no workflow file exists |

Three key properties apply across all CI entries:

1. **No native riscv64 runner is used anywhere.** All builds execute on x86-64 hosts using Go's cross-compilation.
2. **No tests are executed for riscv64.** The CI verifies that the code compiles, not that it runs correctly.
3. **PR-gated CI for collector-contrib excludes riscv64.** The `cross-compile` job fires only on full CI runs (push/merge or the `ci:full` label). Standard PRs only build amd64 and arm64.

The `cross-compile-pr` job in collector-contrib (which runs on every PR) covers `linux/amd64` and `linux/arm64` only. riscv64 regressions introduced by PRs will not be caught until a full CI run or the next release.

### Infra Fragility

The `docker/setup-qemu-action@v4.0.0` change (which silently dropped riscv64 support) required a fix in March 2026. This indicates the CI infrastructure for riscv64 is not actively monitored and breaks without a dedicated maintainer noticing. The fix was authored by the same contributor (shanduur) who introduced riscv64 support originally.

---

## 8. Distribution and Release Status

### GitHub Releases

As of v0.154.0 (released 2026-06-09), the following riscv64 artifacts are published in the opentelemetry-collector-releases GitHub release:

| Artifact | Format |
|---|---|
| `otelcol_0.154.0_linux_riscv64.tar.gz` | tarball |
| `otelcol_0.154.0_linux_riscv64.deb` | Debian package |
| `otelcol_0.154.0_linux_riscv64.rpm` | RPM package |
| `otelcol-contrib_0.154.0_linux_riscv64.tar.gz` | tarball |
| `otelcol-contrib_0.154.0_linux_riscv64.deb` | Debian package |
| `otelcol-contrib_0.154.0_linux_riscv64.rpm` | RPM package |
| `otelcol-k8s_0.154.0_linux_riscv64.tar.gz` | tarball |
| `otelcol-otlp_0.154.0_linux_riscv64.tar.gz` | tarball |
| `otelcol-otlp_0.154.0_linux_riscv64.deb` | Debian package |
| `otelcol-otlp_0.154.0_linux_riscv64.rpm` | RPM package |

Each binary has a paired `.pem`, `.sig`, and `.sbom.json` (Sigstore signatures and SBOM).

### Docker Hub

Multi-arch manifests for `otel/opentelemetry-collector` and `ghcr.io/open-telemetry/opentelemetry-collector-releases/opentelemetry-collector` include `linux/riscv64` as one of seven Linux architectures (386, amd64, arm/v7, arm64, ppc64le, riscv64, s390x). A nightly tag `otel/opentelemetry-collector:nightly-riscv64` exists (44.78 MB compressed) [NEEDS VERIFICATION for size figure].

### Linux Distributions

| Distribution | Package | riscv64 Status | Notes |
|---|---|---|---|
| Debian sid | opentelemetry-cpp / opentelemetry-cpp-dev | Installed (1.23.0-3+b1) | Compiled binary; built on rv-manda-04 |
| Debian sid | python3-opentelemetry-* | Available (arch:all) | Pure Python; no platform-specific build |
| Debian sid | golang-opentelemetry-collector-dev (0.141.0-1) | No riscv64 entry | arch:all Go source package; not a compiled binary |
| Ubuntu 24.04 | golang-opentelemetry-otel-dev (1.16.0-1) | Available (arch:all) | Older version; Go source |
| Arch Linux RISC-V | opentelemetry-* | Unknown | Status page inaccessible at time of research |
| Homebrew | opentelemetry-cpp | Not available | Bottles exist for x86_64 and ARM64 only; no riscv64 bottle |

### PyPI

All opentelemetry-api, opentelemetry-sdk, and related Python packages publish as `py3-none-any.whl` (pure Python, architecture-neutral). No riscv64 wheel exists because no platform-specific wheel of any architecture exists. riscv64 installs identically to any other platform.

---

## 9. Dependencies

### Go-Based Collector Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Go runtime | Compiler and runtime for all Go components | Builds via cross-compile; secondary port | Go upstream has riscv64 builders but 3 of 4 are reported broken | Go module distribution; statically linked into collector binaries | Memory corruption/inlining miscompile ([go#78161](https://github.com/golang/go/issues/78161), open); FIPS+PIE broken ([go#74683](https://github.com/golang/go/issues/74683)); J-type relocation overflow ([go#79275](https://github.com/golang/go/issues/79275)); CI builder hardware fragile |
| gRPC (Go) `google.golang.org/grpc` | OTLP gRPC export transport | Builds (pure Go, inherits cross-compile) | No riscv64-specific CI upstream | Go module, statically linked | No known grpc-go-specific riscv64 blockers; runtime issues inherited from Go |
| Protocol Buffers (Go) `google.golang.org/protobuf` v1.36.11 | OTLP wire serialization | Builds (pure Go) | No riscv64-specific CI | Go module, statically linked | None identified |
| glibc | System C library; required for CGo, native linking | Fully functional since glibc 2.27 (2018) | Debian and Ubuntu distribution CI | Available in all major distros (Debian sid: 2.42-17; Ubuntu 24.04: 2.39) | Deployments on glibc < 2.42 carry crash-class bugs (IFUNC gp-pointer SIGSEGV, hwprobe prototype); Ubuntu 24.04 ships 2.39 |

### C++ SDK Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | Blocking Issues |
|---|---|---|---|---|
| gRPC (C++) v1.81.1 | OTLP gRPC export transport | Not confirmed for riscv64; arm64 CI disabled 2024-11-06 | Not tested | No riscv64 build report; possible blocker for opentelemetry-cpp without community validation |
| Protocol Buffers (C++) v33.6 | OTLP wire format for C++ exporters | Not confirmed; upstream CI covers x86_64 and aarch64 only | Not tested | No upstream riscv64 CI; build may work but is untested |
| OpenSSL | TLS for OTLP exporters | Builds cleanly on riscv64; RVV and Zkn assembly optimizations present | Covered in Debian/Ubuntu downstream builds; no upstream GitHub Actions riscv64 runner | No FIPS CI coverage for riscv64 |
| glibc | System C library | Fully functional since glibc 2.27 | Distribution CI | Same glibc version constraints as above |

### Rust SDK Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | Blocking Issues |
|---|---|---|---|---|
| Tokio (async runtime) | All async I/O | Builds (pure Rust) | No riscv64 CI in opentelemetry-rust | None known |
| Tonic / Prost (gRPC/protobuf) | OTLP gRPC/protobuf transport | Pure Rust; builds on riscv64 | No riscv64 CI coverage | None known |
| pprof v0.14 | Flamegraph profiling (dev/benchmark only, not production) | C/native linkage; riscv64 support unconfirmed | Not tested | Not a production blocker |

### eBPF Instrumentation Dependencies

| Dependency | Role | riscv64 Status | Notes |
|---|---|---|---|
| Linux kernel BPF JIT | eBPF execution | Functional since Linux 5.1 (2019) | Kernel-level gap does not exist; gap is at OTel project level |

---

## 10. Ecosystem Status

**RISE Project involvement:** None. OpenTelemetry is not a RISE Project member. All 26 RISE blog posts (May 2024 through June 2026) were checked; none mention OpenTelemetry, observability, tracing, or telemetry. The RISE Python wheel builder does not list OpenTelemetry. No RISE RFP for OpenTelemetry has been identified.

**Community contributor:** Virtually all riscv64 work across all three collector repos was authored by one community contributor (shanduur, Mateusz Urbanek). No company has declared sponsorship of this work.

**opentelemetry-go cross-build proposal:** Issue [#8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126) (opened 2026-04-02 by user pancsta) proposes a CI cross-build workflow including linux/riscv64. It is blocked on PR [#8120](https://github.com/open-telemetry/opentelemetry-go/pull/8120) (WASM dialer fix). No workflow file has been merged as of June 2026.

**VisionFive2 test run:** A community member (mengzhuo) ran the opentelemetry-go test suite on a SiFive VisionFive2 (Linux 5.15.0-starfive, Go 1.22.3 linux/riscv64) and reported passing. The maintainers closed the resulting PR ([#5420](https://github.com/open-telemetry/opentelemetry-go/pull/5420)) because the compatibility matrix requires CI coverage, not one-off local test runs.

**RISE RISC-V Runners usage:** The RISE RISC-V Runners project (Scaleway EM-RV1 hardware) published a six-weeks report in May 2026 covering 87 organizations across 197 repos. OpenTelemetry is not identified among them.

**Benchmark data:** No published benchmark data exists comparing OpenTelemetry performance on riscv64 vs arm64 or amd64 in any repository, issue, PR, or blog post.

---

## 11. Known Bugs and Active Issues

**OpenTelemetry-specific riscv64 bugs:** None. Searching "riscv" and "riscv64" across all major opentelemetry org repositories returns only automated dependency-bump PRs (`golang.org/x/sys`, gopsutil), none of which are riscv64-specific bugs.

**Upstream dependency bugs affecting riscv64 deployments:**

| Bug | Severity | Status | Impact on OTel |
|---|---|---|---|
| [go#78161](https://github.com/golang/go/issues/78161) Memory corruption/inlining miscompile | Critical | Open, "help wanted" | Any Go binary on riscv64 is potentially affected; no OTel-specific confirmation |
| [go#74683](https://github.com/golang/go/issues/74683) FIPS+PIE broken on riscv64 | High | Open | Affects any deployment requiring FIPS compliance |
| [go#79275](https://github.com/golang/go/issues/79275) J-type relocation overflow | High | Open | Linker-level; could affect large Go binaries |
| Go riscv64 CI builder hardware fragile (3 of 4 builders reported broken) | Medium | Open | Reduces upstream detection of riscv64 regressions |
| glibc < 2.42 crash-class bugs (IFUNC gp-pointer SIGSEGV, hwprobe prototype) | High | Fixed in 2.42 | Ubuntu 24.04 ships glibc 2.39; affected deployments exist |

**Active infrastructure issues:**

- [opentelemetry-go #8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126): Cross-build CI including riscv64 proposed but not merged. Blocked on PR #8120. Status: open.

**Post-merge regressions caught and fixed:**

- After collector-contrib PR #41496 merged (2025-07-24), a release-blocker Docker build failure was immediately triggered: the `telemetrygen` Docker image failed because the riscv64 binary had not been built before the Docker build step. A revert was opened ([#41558](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41558)) and closed without merging after a targeted fix ([#41560](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41560)) landed the same day.
- After collector-releases PR #969 merged (2025-08-07), riscv64 was found missing from the Kubernetes release pipeline, causing a nightly release failure. Fixed by PR [#1090](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/1090) on the same day.
- `docker/setup-qemu-action@v4.0.0` silently dropped riscv64 from its default platform list, breaking riscv64 CI builds until fix PR [#14777](https://github.com/open-telemetry/opentelemetry-collector/pull/14777) was merged in March 2026.

---

## 12. Objections and Upstream Blockers

**Blocker: No runtime testing.** The Tier 3 designation means OTel does not run any tests on riscv64. The Go compiler bugs (go#78161, go#74683, go#79275) represent risk that is not caught by the current CI. A production deployment on riscv64 operates on cross-compiled, untested binaries.

**Blocker: Single point of failure.** All substantive riscv64 work across three repos was authored by one community contributor. The QEMU action regression (PR #14777) was also caught and fixed by the same contributor. There is no redundancy. If this contributor becomes inactive, riscv64 CI maintenance falls to whoever notices failures.

**Blocker: PR-level CI gap in collector-contrib.** Standard PRs do not trigger the riscv64 cross-compile job. Regressions can enter main undetected.

**Blocker: eBPF instrumentation is out of scope.** For deployments requiring zero-code auto-instrumentation (the primary value proposition of opentelemetry-ebpf-instrumentation), riscv64 is not supported and there is no stated roadmap. The Linux kernel eBPF JIT supports riscv64; this is an OTel project-level decision to limit scope, not a kernel limitation.

**Blocker: C++ SDK has no validated riscv64 build.** The opentelemetry-cpp C++ SDK has no riscv64 CI, no toolchain file, and its arm64 CI is disabled. Any C++ application instrumented with the OTel C++ SDK requires a custom build process for riscv64 with no upstream validation.

**Blocker: opentelemetry-go SDK is not in the compatibility matrix.** Any Go service using the opentelemetry-go SDK directly (rather than the pre-built collector binary) is running on an unsupported configuration.

**Non-blocker: Governance receptiveness.** The Tier 3 approval process is lightweight. PR #13458 demonstrates the standard path: provide a changelog entry, add the author as community contact in platform-support.md, demonstrate a successful build. No TC vote is required. The community is not hostile to riscv64 contributions.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The collector binary (Go, statically linked) is functional on riscv64 for all use cases that do not require the eBPF instrumentation component. Binary artifacts and Docker images are published. The primary functional gap is the eBPF auto-instrumentation component.

Enabling eBPF instrumentation on riscv64 requires:
- Implementing riscv64 support in opentelemetry-ebpf-instrumentation (new `support_riscv64.go`, new eBPF uprobe infrastructure)
- The Linux kernel BPF JIT on riscv64 is functional and is not a blocker

This is a significant engineering effort with architecture-specific code required.

### 13.2 Performance Optimization

No baseline performance data exists for OpenTelemetry on riscv64. The collector is pure Go with no architecture-specific optimization. The goreleaser build uses no `GORISCV64` tuning flag (baseline ISA only). Performance investigation would require:
- Establishing baseline benchmarks (throughput, latency, CPU overhead for trace/metric/log pipelines)
- Comparing against arm64 and amd64 on equivalent hardware

Data not available: no riscv64 vs arm64 benchmark figures exist in any upstream source found during research.

### 13.3 CI/CD Infrastructure

The riscv64 CI configuration is fragile. Two regressions in the CI plumbing were introduced within the first year of support (missing binary in Docker build; docker/setup-qemu-action behavior change). Both were fixed by the same single contributor. Recommendations:

- Add riscv64 to the PR-gated `cross-compile-pr` job in collector-contrib (currently covers only amd64 and arm64).
- Add automated monitoring for riscv64-specific build artifacts in release verification.
- Pursue native riscv64 runner access (e.g., Scaleway EM-RV1 via RISE RISC-V Runners or equivalent) to enable actual test execution.

### 13.4 Ecosystem Enablement

The two highest-leverage gaps beyond the collector itself:

1. **opentelemetry-go compatibility matrix inclusion.** Requires CI infrastructure providing native riscv64 test execution. A cross-build CI (proposed in issue #8126) is a partial step but does not satisfy the maintainer requirement.
2. **opentelemetry-cpp riscv64 validation.** Requires providing a riscv64 cross-compilation toolchain file and at minimum a CI build job. The arm64 CI being disabled (since 2024-11-06) suggests the project has limited capacity for non-x86 CI; external contribution would be required.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 support to opentelemetry-ebpf-instrumentation (uprobe infrastructure, support_riscv64.go, eBPF plumbing) | Data not available: no prior estimate in upstream sources | External contributor or sponsoring company | High |
| Functional | Validate opentelemetry-cpp cross-compilation for riscv64; provide toolchain file; document build instructions | 1-2 | External contributor | Medium |
| CI/CD | Add riscv64 to PR-gated cross-compile job in collector-contrib (currently only fires on full CI runs) | < 1 | shanduur or maintainers | High |
| CI/CD | Provision native riscv64 runners (e.g., RISE RISC-V Runners) for opentelemetry-go and collector test execution | 2-4 (infra procurement and integration) | Sponsoring company or CNCF infra | Medium |
| CI/CD | Add opentelemetry-go cross-build CI workflow (issue #8126, blocked on PR #8120) | < 1 (unblocking PR #8120 first) | pancsta or maintainers | Medium |
| Ecosystem | Submit opentelemetry-go to compatibility matrix after CI is established | < 1 | External contributor | Medium |
| Ecosystem | Publish riscv64 baseline benchmarks (collector pipeline throughput, trace overhead) | 2-4 | External contributor | Low |
| Ecosystem | Add opentelemetry-cpp arm64/riscv64 CI runners; re-enable arm64 CI (disabled 2024-11-06) | 2-4 | Sponsoring company | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [opentelemetry-collector-releases #968](https://github.com/open-telemetry/opentelemetry-collector-releases/issues/968) -- original riscv64 feature request
- [opentelemetry-collector-releases #969](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/969) -- Add riscv64 arch (merged 2025-08-07)
- [opentelemetry-collector-releases #1090](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/1090) -- fix: add riscv64 to k8s release pipeline (merged 2025-08-07)
- [opentelemetry-collector #13226](https://github.com/open-telemetry/opentelemetry-collector/issues/13226) -- companion issue, linux/riscv64 Tier 3
- [opentelemetry-collector #13458](https://github.com/open-telemetry/opentelemetry-collector/pull/13458) -- Add riscv64 arch (merged 2025-07-25)
- [opentelemetry-collector #13462](https://github.com/open-telemetry/opentelemetry-collector/issues/13462) -- Add RISC-V (riscv64) Support to OpenTelemetry Collector
- [opentelemetry-collector #14777](https://github.com/open-telemetry/opentelemetry-collector/pull/14777) -- fix: add missing platforms to setup-qemu-action (merged 2026-03-17)
- [opentelemetry-collector-contrib #41496](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41496) -- Add riscv64 arch (merged 2025-07-24)
- [opentelemetry-collector-contrib #41507](https://github.com/open-telemetry/opentelemetry-collector-contrib/issues/41507) -- Add RISC-V (riscv64) Support to OpenTelemetry Collector Contrib
- [opentelemetry-collector-contrib #41558](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41558) -- Revert "Add riscv64 arch" (closed without merge)
- [opentelemetry-collector-contrib #41560](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41560) -- Missing RISC-V binaries (merged 2025-07-25)
- [opentelemetry-go #5420](https://github.com/open-telemetry/opentelemetry-go/pull/5420) -- doc: add riscv64 notes (closed/rejected)
- [opentelemetry-go #8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126) -- ci: add cross-build workflow (open as of June 2026)
- [opentelemetry-go #8120](https://github.com/open-telemetry/opentelemetry-go/pull/8120) -- fix: use default dialer for OTLP http exporter in WASM (open; blocker for #8126)
- [go#78161](https://github.com/golang/go/issues/78161) -- Memory corruption/inlining miscompile on riscv64
- [go#74683](https://github.com/golang/go/issues/74683) -- FIPS+PIE broken on riscv64
- [go#79275](https://github.com/golang/go/issues/79275) -- J-type relocation overflow on riscv64
- [opentelemetry-collector platform support documentation](https://github.com/open-telemetry/opentelemetry-collector/blob/main/docs/platform-support.md)
- [opentelemetry-collector build-and-test.yml](https://github.com/open-telemetry/opentelemetry-collector/blob/main/.github/workflows/build-and-test.yml)
- [opentelemetry-collector-contrib build-and-test.yml](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/.github/workflows/build-and-test.yml)
- [Debian buildd opentelemetry-cpp riscv64](https://buildd.debian.org/status/package.php?p=opentelemetry-cpp&suite=sid)