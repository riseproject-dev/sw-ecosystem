---
title: Grafana Alloy
categories:
  - observability
---

# Grafana Alloy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Grafana Alloy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Grafana Alloy is an open source OpenTelemetry-compatible observability pipeline agent produced and governed by Grafana Labs. It was announced at GrafanaCON 2024, forked from Grafana Agent Flow. The repository is [grafana/alloy](https://github.com/grafana/alloy) and the project homepage is [grafana.com/oss/alloy](https://grafana.com/oss/alloy/). The license is Apache-2.0.

The project is approximately 97% Go. It collects metrics, logs, traces, and profiles and forwards them to Grafana-stack backends (Loki, Mimir, Tempo, Pyroscope) and OpenTelemetry-compatible endpoints. It ships as static binaries, OCI container images, and Linux packages (deb/rpm). The latest release at the time of this report is v1.17.0 (June 12, 2026).

Governance is exclusively controlled by Grafana Labs. Per the project's GOVERNANCE.md: "Governance changes are reserved exclusively for Grafana Labs." There is no independent steering committee and no external foundation affiliation (not CNCF, not Linux Foundation, not the RISE Project). All documented CODEOWNERS teams are Grafana Labs org teams: `@grafana/grafana-alloy-maintainers`, `@grafana/docs-tooling`, `@grafana/grafana-alloy-profiling-maintainers`, `@grafana/beyla`, `@grafana/db-o11y-squad`. No external corporate co-maintainers are identified. v1.17.0 credits 31 contributors but the core governance team is entirely Grafana Labs.

---

## 2. Port History and Upstreaming Timeline

There has been one feature request and one community PR. Neither resulted in shipped code. There are zero commits in the repository that mention riscv or riscv64.

**[Issue #1036](https://github.com/grafana/alloy/issues/1036) -- "Add riscv binaries"**
- Opened: June 12, 2024, by @gouthamve
- Closed: April 14, 2025, as "Not Planned"
- Labels: enhancement, proposal, frozen-due-to-age
- Project board: Alloy proposals -- Status: Declined
- Summary: A user running Alloy on a RISC-V board requested official riscv64 Linux binaries in releases. The requester noted that the journald dependency blocks cross-compilation and that native compilation on the device takes over 20 minutes. Zero maintainer comments were recorded. The issue was moved to "Declined" on the project board, then auto-archived and closed. No action was taken at any point.

**[PR #1526](https://github.com/grafana/alloy/pull/1526) -- "Build Alloy for linux/riscv64"**
- Opened: August 23, 2024, by community contributor @macabu
- Closed (not merged): September 2, 2024
- Locked: October 5, 2024 (frozen-due-to-age)
- Linked to: Issue #1036
- Summary: The author added `linux/riscv64` to the binary build, Docker image, and packaging targets. The author validated the resulting binary on real RISC-V hardware -- it ran correctly and sent metrics to Loki. The `ldd` output showed a dynamically linked ELF 64-bit RISC-V executable linked only against `libc.so.6` and the riscv64 dynamic linker. The author removed the Drone CI HMAC signature block from `.drone/drone.yml` because regenerating it requires maintainer-level secrets access to the Drone CI instance. No maintainer ever reviewed or commented on the PR. After 10 days of silence the author closed it with the comment "Rabbit hole is deeper -- closing for now." The branch was deleted on closure. The PR also became obsolete because the repository has since migrated CI from Drone to GitHub Actions.

The complete absence of maintainer engagement across both items, combined with the explicit "Declined" project board status, indicates Grafana Labs has no intent to support riscv64 officially under the current governance model.

---

## 3. Upstream Support Tier

Grafana Alloy has no published platform tiering document (no PLATFORMS.md or equivalent). Support is demand-driven and maintainer-discretionary. The RISC-V declination demonstrates that new architectures require Grafana Labs internal sponsorship to proceed.

Official supported platforms as of v1.17.0, per the [Grafana Alloy Supported Platforms documentation](https://grafana.com/docs/alloy/latest/set-up/supported-platforms/) and confirmed by direct inspection of `build-tools/make/packaging.mk` and `.github/workflows/build.yml`:

| OS | Architectures |
|---|---|
| Linux | amd64, arm64, ppc64le, s390x |
| Windows | amd64 |
| macOS | amd64, arm64 |
| FreeBSD | amd64 |

riscv64 is absent from this list. There is no lower-tier or "best-effort" designation that would allow a third party to maintain a riscv64 port under reduced support obligations -- the governance model does not provide for that.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The core of Alloy -- OpenTelemetry pipeline (otelcol), Prometheus scraping, Loki log forwarding, Tempo tracing, Faro frontend observability -- is pure Go and has no architecture-specific source files. This portion would cross-compile to riscv64 without modification.

Two subsystems are hard-gated to amd64 and arm64 by build tags and embedded binaries:

**`pyroscope.ebpf` -- eBPF continuous CPU profiling**
- File `internal/component/pyroscope/ebpf/ebpf_linux.go`: build tag `//go:build linux && (arm64 || amd64)`
- File `internal/component/pyroscope/ebpf/ebpf_placeholder.go`: build tag `//go:build !(linux && (arm64 || amd64))`
- On riscv64, the placeholder is compiled in. It logs a warning and does nothing. No eBPF profiling is available.

**`pyroscope.java` -- Java profiling via async-profiler**
- File `internal/component/pyroscope/java/java.go`: build tag `//go:build (linux || darwin) && (amd64 || arm64)`
- File `internal/component/pyroscope/java/java_stub.go`: build tag `//go:build (linux && !(amd64 || arm64)) || !(linux || darwin)`
- Embedded binaries: `async-profiler-4.4-linux-x64.tar.gz` and `async-profiler-4.4-linux-arm64.tar.gz`. There is no `asprof_linux_riscv64.go` and no riscv64 async-profiler tarball.
- On riscv64, the stub is compiled in. No Java profiling is available.

**`loki.source.journal` -- systemd journal ingestion**
- Build tag: `//go:build linux && cgo && promtail_journal_enabled`
- No architecture restriction in the build tag. Would compile on riscv64 if CGO is enabled and `libsystemd-dev` for riscv64 is available in the build environment.
- This was the primary blocker cited in Issue #1036. If built without the `promtail_journal_enabled` tag, a no-op stub is compiled in. The PR #1526 author's validated binary was dynamically linked (used CGO) but its `ldd` output showed no journald dependency -- suggesting the tag may have been omitted in that build. [NEEDS VERIFICATION: the exact build tags used in the PR #1526 binary are inferred from `ldd` output, not from the build command used by the author at test time.]

**`boringcrypto` / FIPS-mode TLS**
- The BoringCrypto build variant is restricted to amd64 and arm64 in both the CI matrix and the release pipeline (`BUILD_PLATFORMS_BORINGCRYPTO=linux/amd64,linux/arm64`). There is no riscv64 BoringCrypto `.syso` file in the Go toolchain itself. This is a Go toolchain limitation, not an Alloy limitation.

All other components are pure Go with no architecture-specific source files.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Language and toolchain:** Go 1.26.4 minimum (from `go.mod`). The project is primarily Go with CGO used for specific components.

**Build entry points:**
- `/Makefile` -- top-level
- `/build-tools/make/packaging.mk` -- dist target definitions per GOARCH
- `/build-tools/make/build-container.mk` -- container proxy logic
- `/scripts/docker-containers` -- Docker buildx platform list

**C cross-compilation toolchain:** `rfratto/viceroy:v0.4.0` with `CC=viceroycc`. The Debian cross-build toolchains installed in viceroy are: `crossbuild-essential-{amd64,i386,armel,armhf,arm64,ppc64el,s390x}`. The `crossbuild-essential-riscv64` package (`gcc-riscv64-linux-gnu`) is NOT installed. viceroycc does not dispatch to a riscv64 target.

**Build image:** `grafana/alloy-build-image:v0.1.33` (pinned by digest `sha256:dbdecbfbad6c9ed0b315a7a6da25ef066b795ffc57e887125333b1a352907155`). This image does not include a riscv64 cross-compiler or `libsystemd-dev` for riscv64.

**Official Linux binary targets in `packaging.mk`:**
```
dist/alloy-linux-amd64
dist/alloy-linux-arm64
dist/alloy-linux-ppc64le
dist/alloy-linux-s390x
```
No `dist/alloy-linux-riscv64` target exists in any current file.

**Docker image platforms in `scripts/docker-containers`:**
```
BUILD_PLATFORMS=linux/amd64,linux/arm64,linux/ppc64le,linux/s390x
BUILD_PLATFORMS_BORINGCRYPTO=linux/amd64,linux/arm64
```
`linux/riscv64` is absent from both variables.

**QEMU:** Used in `publish-alloy-linux.yml` via `multiarch/qemu-user-static` for OCI image construction in CI. Not used for binary compilation.

**Requirements to add riscv64 to the build:**
1. Add `gcc-riscv64-linux-gnu` and `libsystemd-dev:riscv64` to the build image (or viceroy)
2. Add a `viceroycc` dispatch entry for riscv64, or set `CC=riscv64-linux-gnu-gcc` explicitly
3. Add a `dist/alloy-linux-riscv64` Makefile target in `packaging.mk`
4. Add `linux/riscv64` to `BUILD_PLATFORMS` in `scripts/docker-containers`
5. Add riscv64 to the GitHub Actions build matrix in `.github/workflows/build.yml`
6. Optionally add deb/rpm packaging targets via `generate_alloy_fpm`

The PR #1526 author implemented items 3, 4, and 6 (partially) against the old Drone CI system. Items 1 and 2 were not addressed, which is consistent with the "rabbit hole is deeper" closure comment.

For a build without `promtail_journal_enabled` (journald disabled), CGO can be dropped (`CGO_ENABLED=0`) and the cross-compilation reduces to a pure `GOOS=linux GOARCH=riscv64 go build`. This removes items 1 and 2 from the requirement list but loses journal ingestion capability.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | riscv64 Status | Notes |
|---|---|---|
| OpenTelemetry pipeline (otelcol.*) | Full | Pure Go, no arch gates |
| Prometheus scraping (prometheus.*) | Full | Pure Go, no arch gates |
| Loki log forwarding (loki.write, loki.process) | Full | Pure Go, no arch gates |
| Tempo tracing | Full | Pure Go, no arch gates |
| Faro frontend observability | Full | Pure Go, no arch gates |
| Process discovery (discovery.process) | Full | Linux-only, arch-agnostic |
| systemd journal ingestion (loki.source.journal) | Reduced | CGO + libsystemd; no arch gate but cross-compilation non-trivial; no-op stub if tag absent |
| eBPF continuous profiling (pyroscope.ebpf) | Missing | Hard-gated to amd64/arm64; no-op placeholder on riscv64 |
| Java profiling (pyroscope.java) | Missing | Hard-gated to amd64/arm64; no riscv64 async-profiler binary |
| BoringCrypto / FIPS TLS | Missing | amd64/arm64 only; Go toolchain limitation |
| Release binaries | Missing | Not in build matrix |
| OCI container images | Missing | Not in BUILD_PLATFORMS |
| deb/rpm packages | Missing | Not packaged |

The core observability pipeline (metrics, logs, traces) is fully portable. The gaps are in profiling (eBPF and Java) and in distribution infrastructure.

---

## 7. CI/CD Infrastructure

**Zero riscv64 CI exists anywhere in the grafana/alloy repository.** This is confirmed by direct inspection of all relevant files.

GitHub Actions workflows checked: `build.yml`, `publish-alloy-linux.yml`, `release-publish-alloy-artifacts.yml`, `docker-images.yml`, `publish-alloy-devel.yml`, `test_linux_system_packages.yml`. Build scripts checked: `scripts/docker-containers`, `build-tools/make/packaging.mk`, `build-tools/make/build-container.mk`, `Makefile`, `Dockerfile`.

The `.github/workflows/build.yml` matrix for Linux:
```yaml
matrix:
  os: [linux]
  arch: [amd64, arm64, ppc64le, s390x]
```
riscv64 is absent. The runner is a GitHub-hosted x86 runner (`github-hosted-ubuntu-x64-large`). There is no QEMU setup step for compilation, no riscv64 self-hosted runner, and no riscv64 cross-compilation step.

The string "riscv" appears in zero of the files enumerated above.

The [RISE Project RISC-V Runners](https://riseproject.dev/blog) service (free managed GitHub Actions runners on Scaleway EM-RV1 hardware, available since March 2026) is not used by grafana/alloy. No RISE runner label (`ubuntu-24.04-riscv`) appears in any grafana/alloy workflow file.

---

## 8. Distribution and Release Status

**v1.17.0 release assets (June 12, 2026) -- complete list confirmed via GitHub API:**

```
alloy-1.17.0-1.amd64.deb
alloy-1.17.0-1.amd64.rpm
alloy-1.17.0-1.arm64.deb
alloy-1.17.0-1.arm64.rpm
alloy-1.17.0-1.ppc64el.deb
alloy-1.17.0-1.ppc64le.rpm
alloy-1.17.0-1.s390x.deb
alloy-1.17.0-1.s390x.rpm
alloy-boringcrypto-linux-amd64.zip
alloy-boringcrypto-linux-arm64.zip
alloy-darwin-amd64.zip
alloy-darwin-arm64.zip
alloy-freebsd-amd64.zip
alloy-installer-windows-amd64.exe
alloy-installer-windows-amd64.exe.zip
alloy-linux-amd64.zip
alloy-linux-arm64.zip
alloy-linux-ppc64le.zip
alloy-linux-s390x.zip
alloy-mixin-dashboards-v1.17.0.zip
alloy-windows-amd64.exe.zip
SHA256SUMS
```

22 assets total. Zero contain "riscv64". riscv64 is not present in any release artifact.

**Other distribution channels:**
- PyPI: `grafana-alloy` package does not exist (HTTP 404 confirmed)
- Debian: `grafana-alloy` is not tracked in Debian (HTTP 404 confirmed via [tracker.debian.org](https://tracker.debian.org/pkg/grafana-alloy))
- Ubuntu 24.04 Noble: package not in Ubuntu (search returns no results confirmed)
- Arch Linux RISC-V port database ([archriscv.felixc.at](https://archriscv.felixc.at)): `grafana-alloy` not present

No official or community-maintained riscv64 binary for Grafana Alloy exists anywhere. The only known riscv64 binary was built by PR #1526 author @macabu on their own hardware; it was never published or redistributed.

---

## 9. Dependencies

Dependencies are assessed for architecture-specific concerns: eBPF/JIT backends, CGO requirements, SIMD/crypto acceleration, and profiling.

| Dependency | Role | riscv64 Status | Blocking Issues |
|---|---|---|---|
| Go runtime (`golang/go`) | Language runtime, GC, stdlib | Secondary port since Go 1.14; binary tarballs on go.dev since Go 1.21 | [#78161](https://github.com/golang/go/issues/78161) memory corruption/inlining miscompile; [#74683](https://github.com/golang/go/issues/74683) FIPS+PIE broken; [#79275](https://github.com/golang/go/issues/79275) J-type relocation overflow; BoringCrypto has no riscv64 `.syso` |
| `coreos/go-systemd` (journald) | `loki.source.journal` via libsystemd CGO | Builds with stub when tag absent; CGO build requires riscv64 `libsystemd-dev` | CGO cross-compilation complexity was the explicit reason Issue #1036 was closed |
| `grafana/beyla` | eBPF auto-instrumentation (HTTP/gRPC spans) | Not supported -- Makefile hardcodes `linux/amd64,linux/arm64` only; JNI native `.so` compiled only for `linux-amd64` and `linux-aarch64` | No riscv64 issue filed |
| `go.opentelemetry.io/ebpf-profiler` | Continuous CPU profiling via eBPF | Not supported -- README states "amd64 and arm64 are supported"; no riscv64 stack unwinder implemented | No riscv64 issue filed |
| `klauspost/compress` | zstd, gzip, S2/Snappy for OTel spans, remote-write, WAL | Builds (pure-Go-compatible path merged Jan 2025); no riscv64 SIMD acceleration | No open riscv64 issues; throughput degraded vs amd64/arm64 |
| `google/cadvisor` | Container resource metrics for Kubernetes | Builds (riscv64 CPU clock fix merged Jan 2020, [PR #2364](https://github.com/google/cadvisor/pull/2364)) | No open riscv64 issues |
| `prometheus/node_exporter` | Host hardware and OS metrics | Builds; binaries released since v1.7.0 (Nov 2023); Docker images added v1.11.1 | [#3180](https://github.com/prometheus/node_exporter/issues/3180) e2e test fails (x86-specific fixture); [#2296](https://github.com/prometheus/node_exporter/issues/2296) test failure (open since v1.3.1) |
| `prometheus/prometheus` | Core metrics scraping, TSDB, PromQL | Builds; binaries since v2.46.0 (Jul 2023); Docker images since v3.10.0 (Feb 2026) | No open riscv64 correctness bugs |
| `golang.org/x/crypto` | TLS (AES-GCM, ChaCha20-Poly1305) | Builds (pure-Go fallback) | No riscv64 assembly for AES-GCM, ChaCha20, Poly1305, Curve25519; approximately 3-5x TLS throughput degradation vs amd64/arm64 [NEEDS VERIFICATION: exact throughput figures not available in research data] |
| `cespare/xxhash/v2` | xxHash-64 for metric label fingerprinting | Builds (pure-Go fallback via `!amd64,!arm64` build tag) | No riscv64 assembly; pure-Go path approximately 2x slower than amd64/arm64 asm [NEEDS VERIFICATION: exact figure not available in research data] |
| `google/pprof` | CPU/memory profiling, flamegraph generation | Builds | No open riscv64 issues |
| `grafana/loki` | Log ingestion and storage | Builds; riscv64 appears in release artifacts | No open riscv64 correctness bugs |
| `grafana/pyroscope` | Continuous profiling backend | Builds (pure-Go mode); eBPF profiling mode has same architecture limitations as ebpf-profiler | No riscv64 issues filed |
| `KimMachineGun/automemlimit` | Maps cgroup `memory.max` to Go soft memory limit | Builds; pure Go | No riscv64 issues |
| `grafana/dskit` | Shared infrastructure toolkit (ring, memberlist, gRPC) | Builds; pure Go | No riscv64 issues |
| `IBM/sarama` | Kafka client | Builds; pure Go | No riscv64 issues |

The two hard-blocking dependencies for full-feature operation are `grafana/beyla` (eBPF auto-instrumentation, amd64/arm64 only) and `go.opentelemetry.io/ebpf-profiler` (continuous profiling, amd64/arm64 only). Both require architecture-specific eBPF stack unwinders and JIT-compiled eBPF programs that do not exist for riscv64. Neither project has an open riscv64 issue.

---

## 10. Ecosystem Status

**RISE Project involvement:** None. Grafana Alloy does not appear in the RISE Project blog (27 posts from May 2024 through June 2026 reviewed), the RISE Project funded project list (RP001-RP016), or any RISE Project GitHub repository. The RISE Project infrastructure uses a Grafana dashboard for monitoring its runner service, but the telemetry collection agent is not identified as Grafana Alloy in any public documentation.

**RISE Project funded projects for context:** The current RISE portfolio covers OpenSBI, EDK2 IOMMU, llama.cpp/GGML RVV optimization, PyTorch ATen operators, Linux kernel CI, Python package support, LLVM, GCC, OpenOCD, QEMU, Rust Tier-1, libjpeg-turbo, FFmpeg H.264, and Go runtime acceleration (RP001). Observability tooling is not in scope.

**Benchmark data:** No benchmark data for Grafana Alloy on riscv64 exists in any public source. No performance measurements, throughput numbers, latency figures, or comparative benchmarks were found across GitHub, the RISE Project blog, or general web search.

**Community build infrastructure:** The [RISE RISC-V Runners](https://riseproject.dev/blog) service (free GitHub Actions runners, label `ubuntu-24.04-riscv`, on Scaleway EM-RV1 hardware) launched March 2026 and is available to open source projects. As of May 2026 it had completed 13,000+ jobs across 197 repos and 87 organizations at 99.78% completion rate. Grafana Alloy is not among the users.

---

## 11. Known Bugs and Active Issues

**In grafana/alloy:** Zero open issues mentioning riscv64 exist in the repository. Issue #1036 (the only riscv64 issue) is closed as "Not Planned." PR #1526 (the only riscv64 PR) is closed, unmerged, and frozen.

**In the Go runtime (blocking):**
- [golang/go #78161](https://github.com/golang/go/issues/78161): memory corruption / inlining miscompile on riscv64
- [golang/go #74683](https://github.com/golang/go/issues/74683): FIPS + PIE broken on riscv64
- [golang/go #79275](https://github.com/golang/go/issues/79275): J-type relocation overflow on riscv64

**In prometheus/node_exporter (non-blocking for Alloy core, affects a bundled component):**
- [#3180](https://github.com/prometheus/node_exporter/issues/3180): e2e test fails on riscv64 (x86-specific CPU bug/flag fixture)
- [#2296](https://github.com/prometheus/node_exporter/issues/2296): test failure under RISC-V (open since v1.3.1)

No NaN / floating-point correctness issues specific to riscv64 are recorded in grafana/alloy or its direct dependencies.

---

## 12. Objections and Upstream Blockers

**Governance veto.** Grafana Labs holds unilateral governance authority. Issue #1036 was explicitly "Declined" on the project board. Without a Grafana Labs team taking ownership of the riscv64 port, no community path exists to add or maintain it. The declination was made without a recorded technical justification and without maintainer comment.

**eBPF subsystem is a permanent gap at current state of the ecosystem.** `pyroscope.ebpf` and `go.opentelemetry.io/ebpf-profiler` both hard-code `linux && (arm64 || amd64)`. Adding riscv64 requires implementing architecture-specific eBPF stack unwinders for riscv64 in those upstream projects. No such work has been started in either project.

**Beyla is architecture-gated.** `grafana/beyla`, the eBPF auto-instrumentation component, is hardcoded to `linux/amd64,linux/arm64` in its Makefile and build scripts. The JNI native libraries are compiled only for `linux-amd64` and `linux-aarch64`. No riscv64 issue exists in that repository.

**Build image and toolchain.** The `grafana/alloy-build-image:v0.1.33` container and the viceroy cross-compilation tool do not include a riscv64 cross-compiler (`gcc-riscv64-linux-gnu`) or `libsystemd-dev:riscv64`. These must be added before `loki.source.journal` can be built for riscv64 with full functionality. The viceroy project would need a new architecture target.

**Go runtime correctness bugs.** Three open bugs in the Go runtime on riscv64 (including a memory corruption miscompile, [#78161](https://github.com/golang/go/issues/78161)) mean that riscv64 builds of any Go application carry correctness risk until those bugs are resolved.

**CI migration obsolescence.** PR #1526 targeted Drone CI (`.drone/`). The repository has since migrated to GitHub Actions (`.github/workflows/`). The PR's changes are against an obsolete CI system and cannot be applied without a full rewrite targeting the current workflow files.

**Drone HMAC secret (historical, now moot).** The immediate blocker that caused PR #1526 to be abandoned was the Drone CI HMAC signature that could only be regenerated by a maintainer. This specific blocker no longer applies given the GitHub Actions migration, but no maintainer engagement occurred and the governance posture has not changed.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The core Alloy pipeline (metrics, logs, traces via OTel, Prometheus, Loki, Tempo) is pure Go and will cross-compile to riscv64 with `GOOS=linux GOARCH=riscv64` and `CGO_ENABLED=0`. This produces a functional agent minus journald ingestion, eBPF profiling, and Java profiling.

To add journald support: add `gcc-riscv64-linux-gnu` and `libsystemd-dev:riscv64` to the build image, update viceroycc, set `promtail_journal_enabled` in the build tag, and verify CGO linkage. The PR #1526 author's binary was dynamically linked without journald appearing in `ldd` output, suggesting this may be straightforward, but the build image work is non-trivial.

To add eBPF profiling (`pyroscope.ebpf`): implement a riscv64 eBPF stack unwinder in `go.opentelemetry.io/ebpf-profiler`. This is significant upstream work in a separate project. No estimate is possible without a detailed review of the unwinder architecture.

To add Java profiling (`pyroscope.java`): produce a riscv64 async-profiler binary (the upstream project at `async-profiler/async-profiler` would need to support riscv64), then add `asprof_linux_riscv64.go` embedding it. This depends entirely on async-profiler upstream work.

### 13.2 Performance Optimization

Data not available: no benchmark data for Grafana Alloy on riscv64 exists in any public source. Performance characteristics can be inferred from dependency gaps (no riscv64 assembly in `golang.org/x/crypto`, `cespare/xxhash/v2`, `klauspost/compress`) but no measured figures are available. The compression and crypto performance gaps are inherited from the Prometheus and Loki dependency stack.

### 13.3 CI/CD Infrastructure

The RISE RISC-V Runners service (free, `ubuntu-24.04-riscv` label, available to open source projects) provides a zero-cost path to add riscv64 CI jobs to grafana/alloy without acquiring hardware. The service ran 13,000+ jobs at 99.78% completion rate through May 2026. Adding riscv64 CI requires only adding a workflow job targeting that runner label. Maintainer approval is required to merge any CI changes.

### 13.4 Ecosystem Enablement

The RISE Project has no funded work on Grafana Alloy or observability tooling. RP001 (Go runtime acceleration for RISC-V) is the most relevant adjacent project -- resolving Go runtime correctness bugs ([#78161](https://github.com/golang/go/issues/78161), [#74683](https://github.com/golang/go/issues/74683), [#79275](https://github.com/golang/go/issues/79275)) would be a prerequisite for production use of any Go-based tool on riscv64, not just Alloy.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Build riscv64 binary without journald (CGO_ENABLED=0, no promtail_journal_enabled) | 1 | Alloy contributor | Critical |
| Functional | Add riscv64 to build image: gcc-riscv64-linux-gnu + libsystemd-dev | 2 | Alloy build-image maintainer | High |
| Functional | Add riscv64 cross-compiler dispatch to viceroycc | 2 | viceroy maintainer | High |
| Functional | Add riscv64 Makefile target and packaging in packaging.mk | 1 | Alloy contributor | High |
| Functional | Add linux/riscv64 to Docker BUILD_PLATFORMS | 0.5 | Alloy contributor | High |
| CI/CD | Add riscv64 job to .github/workflows/build.yml using RISE runners | 1 | Alloy contributor | High |
| CI/CD | Add riscv64 release publishing to release-publish-alloy-artifacts.yml | 1 | Alloy contributor | High |
| Functional | Implement riscv64 eBPF stack unwinder in ebpf-profiler | Data not available: no effort estimate possible without detailed review | ebpf-profiler upstream | Medium |
| Functional | Produce riscv64 async-profiler binary and add asprof_linux_riscv64.go | Data not available: depends on async-profiler upstream | async-profiler upstream | Low |
| Go runtime | Fix memory corruption miscompile (#78161) | Data not available: tracked in golang/go | Go team (RP001 adjacent) | Critical (blocks production use) |
| Go runtime | Fix FIPS+PIE on riscv64 (#74683) | Data not available: tracked in golang/go | Go team | High |
| Governance | Engage Grafana Labs to reverse the "Not Planned" decision on Issue #1036 | Non-technical; depends on relationship and prioritization signals | Chip company + Grafana Labs | Critical (blocks all upstream merge) |

The governance blocker is the highest-risk item. Without Grafana Labs reversing the "Not Planned" decision, all functional and CI work produces a downstream fork rather than upstream inclusion. Grafana Labs declined Issue #1036 silently and did not engage PR #1526 at all. A formal vendor engagement (not a GitHub issue) is the prerequisite for any upstreaming path.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [grafana/alloy repository](https://github.com/grafana/alloy)
- [Grafana Alloy homepage](https://grafana.com/oss/alloy/)
- [Issue #1036: Add riscv binaries](https://github.com/grafana/alloy/issues/1036)
- [PR #1526: Build Alloy for linux/riscv64](https://github.com/grafana/alloy/pull/1526)
- [Grafana Alloy Supported Platforms](https://grafana.com/docs/alloy/latest/set-up/supported-platforms/)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners documentation](https://riscv-runners.riseproject.dev)
- [golang/go #78161: riscv64 memory corruption/inlining miscompile](https://github.com/golang/go/issues/78161)
- [golang/go #74683: FIPS+PIE broken on riscv64](https://github.com/golang/go/issues/74683)
- [golang/go #79275: J-type relocation overflow on riscv64](https://github.com/golang/go/issues/79275)
- [prometheus/node_exporter #3180: e2e test fails on riscv64](https://github.com/prometheus/node_exporter/issues/3180)
- [prometheus/node_exporter #2296: test failure under RISC-V](https://github.com/prometheus/node_exporter/issues/2296)
- [google/cadvisor PR #2364: riscv64 CPU clock fix](https://github.com/google/cadvisor/pull/2364)