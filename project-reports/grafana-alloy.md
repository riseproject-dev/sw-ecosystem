---
title: Grafana Alloy
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: runtime-dependency
    criticality: critical
  - name: coreos/go-systemd
    relation: runtime-dependency
    criticality: critical
  - name: systemd
    relation: runtime-dependency
    criticality: critical
  - name: beyla
    relation: runtime-dependency
    criticality: critical
  - name: go.opentelemetry.io/ebpf-profiler
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: viceroy
    relation: build-dependency
    criticality: critical
  - name: Prometheus
    relation: runtime-dependency
    criticality: critical
  - name: async-profiler
    relation: runtime-dependency
    criticality: optional
  - name: golang.org/x/crypto
    relation: runtime-dependency
    criticality: optional
  - name: klauspost/compress
    relation: runtime-dependency
    criticality: optional
  - name: cespare/xxhash
    relation: runtime-dependency
    criticality: optional
  - name: Wazero
    relation: runtime-dependency
    criticality: optional
  - name: klauspost/cpuid
    relation: runtime-dependency
    criticality: optional
  - name: segmentio/asm
    relation: runtime-dependency
    criticality: optional
  - name: minio/sha256-simd
    relation: runtime-dependency
    criticality: optional
  - name: minio/md5-simd
    relation: runtime-dependency
    criticality: optional
  - name: node_exporter
    relation: runtime-dependency
    criticality: optional
  - name: cadvisor
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="grafana-alloy" %}

# Grafana Alloy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (no-ci-no-distro)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Grafana Alloy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Grafana Alloy is an open source, OpenTelemetry-compatible observability pipeline agent produced and governed by Grafana Labs. It was announced at GrafanaCON 2024 as a fork of Grafana Agent Flow. The repository is [grafana/alloy](https://github.com/grafana/alloy) and the project homepage is [grafana.com/oss/alloy](https://grafana.com/oss/alloy/). The license is Apache License 2.0.

The project is primarily Go. It collects metrics, logs, traces, and profiles and forwards them to Grafana-stack backends (Loki, Mimir, Tempo, Pyroscope) and OpenTelemetry-compatible endpoints. It ships as static binaries, OCI container images, and Linux packages (deb/rpm). The latest release as of this report is [v1.20.1](https://github.com/grafana/alloy/releases/tag/v1.20.1).

Governance is single-vendor. `GOVERNANCE.md` defines three roles (Team Members, Maintainers, and a single Project), a rough-consensus-to-supermajority decision ladder, and states directly that "changes to this document are made by Grafana Labs." The current maintainer list per `GOVERNANCE.md` is 7 people, all Grafana Labs employees (Erik Baranowski, William Dumont, Matt Durham, Robert Fratto, Piotr Gwizdala, Paulin Todev, Paschalis Tsilias). `CODEOWNERS` assigns every sub-area to Grafana-internal GitHub teams only (`@grafana/grafana-alloy-maintainers`, `@grafana/docs-tooling`, `@grafana/grafana-alloy-profiling-maintainers`, `@grafana/beyla`, `@grafana/db-o11y-squad`). No external corporate co-maintainers are identified, and the project has no CNCF, Apache, or Linux Foundation affiliation; [grafana.com/oss/alloy](https://grafana.com/oss/alloy/) describes it only as led by Grafana Labs.

Grafana Alloy is **not a RISE Project member**. [riseproject.dev/members](https://riseproject.dev/) lists Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General Members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE); neither Grafana nor Alloy appears.

Community culture toward new ports is demand-driven rather than open-ended. Grafana markets Alloy as a "big tent" collector open to new telemetry-format/vendor integrations (Prometheus, OpenTelemetry, Mimir, Loki, Tempo, Pyroscope), but that openness has not extended to CPU-architecture support: the one concrete riscv64 request was explicitly declined by a maintainer citing low expected demand (Section 2).

## 2. Port History and Upstreaming Timeline

There is exactly one tracking issue and one implementation PR for riscv64 in grafana/alloy. Neither resulted in shipped code, and no commit in the repository's history mentions riscv or riscv64 (`search_commits` for both terms returns 0 results).

| Date | Event | Source |
|---|---|---|
| 2024-06-12 | Issue opened: "Add riscv binaries," requesting official riscv64 Linux release binaries | [Issue #1036](https://github.com/grafana/alloy/issues/1036) |
| 2024-08-23 | Community PR opened: "Build Alloy for linux/riscv64," adding riscv64 to the (then-Drone-based) build, Docker, and packaging targets | [PR #1526](https://github.com/grafana/alloy/pull/1526) |
| 2024-09-02 | PR #1526 self-closed unmerged by its own author, citing CI tooling complexity | [PR #1526](https://github.com/grafana/alloy/pull/1526) |
| 2024-10-05 | PR #1526 locked as "frozen-due-to-age" | [PR #1526](https://github.com/grafana/alloy/pull/1526) |
| 2025-01-20 | Maintainer @wildum moves Issue #1036 to "Likely Decline" on the Alloy proposals project board, citing "lack of popularity for this type of binary" | [Issue #1036](https://github.com/grafana/alloy/issues/1036) |
| 2025-02-24 | Project board status changed to "Declined" | [Issue #1036](https://github.com/grafana/alloy/issues/1036) |
| 2025-04-14 | Issue #1036 closed, `state_reason: not_planned` | [Issue #1036](https://github.com/grafana/alloy/issues/1036) |
| 2025-05-15 | Issue #1036 locked as "frozen-due-to-age" | [Issue #1036](https://github.com/grafana/alloy/issues/1036) |

**Issue #1036 ("Add riscv binaries"):** Opened by @gouthamve (author association: NONE, not a maintainer). The requester runs Alloy on a RISC-V board; in their words, "the dependency on journald doesn't make cross-compilation easy and compiling Alloy on the device itself takes more than 20mins." Only one comment exists on the issue in total: the timeline above is reconstructed from the project-board status changes and the close event, not from visible discussion. GitHub's `closed_by_pull_requests` linkage points to PR #1526, but that PR was itself closed unmerged, so #1036 was never actually resolved by it.

**PR #1526 ("Build Alloy for linux/riscv64"):** Opened by community contributor @macabu. The author added `linux/riscv64` to the binary build, Docker image, and packaging targets (5 files changed, 40 additions / 7 deletions, 1 commit `564431c`), and validated the resulting binary on real RISC-V hardware: confirmed as an `ELF 64-bit LSB executable, UCB RISC-V, RVC, double-float ABI`, correctly dynamically linked, and observed sending metrics to Loki. The change targeted `.drone/drone.yml` and `.drone/pipelines/crosscompile.jsonnet` (Alloy's CI was still Drone-based in August 2024), plus `CHANGELOG.md`, `tools/ci/docker-containers`, and `tools/make/packaging.mk`. The author flagged uncertainty about the Drone pipeline's generated/signed YAML directly in the PR: "I believe this should be regenerated by one of the maintainers?" No maintainer ever reviewed, commented on, or engaged with the PR (confirmed via two independent comment-extraction passes; only the author and the automated CLA-assistant bot participated). After 10 days of silence the author closed it: "Rabbit hole is deeper (closing for now)." The branch `macabu/build-linux-riscv64` was deleted on closure.

**Assessment:** The technical work in PR #1526 (build/package/Docker target wiring) was not the blocker; the binary ran correctly on real hardware. The blocker was twofold: (1) the author lacked the maintainer tooling/permissions needed to regenerate the Drone CI signature, and no maintainer stepped in, and (2) once the issue did reach maintainer attention four months later, it was explicitly declined on stated popularity grounds rather than revisited using the PR's working approach. The repository has since migrated its CI fully from Drone to GitHub Actions, so PR #1526's diff is now stale and would need to be reimplemented against `.github/workflows/build.yml` and `publish-alloy-linux.yml` from scratch. This is not merely inactivity; it is a governance-level rejection.

## 3. Upstream Support Tier

Grafana Alloy has no published platform-tiering document (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/`; a file-finder search of the repository returned no matches). Support is binary and maintainer-discretionary: a platform is either in the release matrix or it is explicitly called out as unsupported. Per `docs/sources/set-up/supported-platforms.md` and the official install docs, Linux/amd64 and Linux/arm64 are supported; other OSes/architectures the build happens to produce are described as "possible, but isn't recommended or supported."

Actual CI/release matrix, confirmed by direct inspection of `.github/workflows/build.yml` at HEAD `1767e6500dc5cc47690475829396f4446c03cf74` (2026-09-30) and the [v1.20.1 release assets](https://github.com/grafana/alloy/releases/tag/v1.20.1):

| OS | Architecture | In CI build matrix | In v1.20.1 release assets |
|---|---|---|---|
| Linux | amd64 | Yes | Yes (deb, rpm, zip) |
| Linux | arm64 | Yes | Yes (deb, rpm, zip) |
| Linux | ppc64le / ppc64el | Yes | Yes (deb, rpm, zip) |
| Linux | s390x | Yes | Yes (deb, rpm, zip) |
| Linux | riscv64 | **No** | **No** |
| Windows | amd64 | Yes | Yes |
| macOS (darwin) | amd64, arm64 | Yes | Yes |
| FreeBSD | amd64 | Yes | Yes |

ppc64le and s390x are built and shipped in CI/releases but are not listed in the "Supported Platforms" documentation page, suggesting they are best-effort/downstream-sponsored builds rather than formally supported tiers either -- there is no documented lower-tier category a third party could use to add riscv64 under reduced obligations. The governance model (Section 1) means a new architecture requires Grafana Labs sponsorship to be added at all.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The core of Alloy (OpenTelemetry pipeline `otelcol.*`, Prometheus scraping, Loki log forwarding, Tempo tracing, Faro frontend observability) is pure Go with no architecture-specific source files. Repository-wide `git grep`/code-search for `riscv`, `riscv64`, `__riscv`, `GOARCH=riscv64`, and `vfloat32m1_t` (a RISC-V Vector intrinsic type) found **zero** Alloy-authored architecture-specific code; the only "riscv" string anywhere in the repository is three incidental `@esbuild/linux-riscv64` / `@rollup/rollup-linux-riscv64-*` npm optional-platform-binary entries in `internal/web/ui/package-lock.json`, a lockfile for the frontend UI's JS bundler tooling -- unrelated to Alloy's own Go binary or CI. A `filename:*_arm64.go` code search also returned 0 hits, confirming Alloy has no per-architecture Go source files for any target architecture, including arm64: cross-arch support is handled entirely through Go's `GOARCH` cross-compilation and the CI release matrix, not hand-written per-arch branches.

Several components are nonetheless hard-gated to amd64/arm64 by Go build tags and embedded platform-specific binaries:

| Component | riscv64 status | Mechanism |
|---|---|---|
| `pyroscope.ebpf` (eBPF continuous CPU profiling) | Missing | `ebpf_linux.go`: `//go:build linux && (arm64 \|\| amd64)`; `ebpf_placeholder.go` compiles in on riscv64, logs a warning, and does nothing |
| `pyroscope.java` (Java profiling via async-profiler) | Missing | `java.go`: `//go:build (linux \|\| darwin) && (amd64 \|\| arm64)`; `java_stub.go` compiles in on riscv64; embedded tarballs exist only as `async-profiler-4.4-linux-x64.tar.gz` and `async-profiler-4.4-linux-arm64.tar.gz` -- no riscv64 async-profiler binary exists upstream to embed |
| `loki.source.journal` (systemd journal ingestion, via `coreos/go-systemd`) | Reduced / conditional | Build tag `//go:build linux && cgo && promtail_journal_enabled` has no architecture restriction; would compile on riscv64 given CGO plus riscv64 `libsystemd-dev`, which is not currently available in Alloy's build image (Section 5). Without the tag, a no-op stub compiles in |
| `beyla` (eBPF auto-instrumentation) | Missing | `Makefile` defines only `BEYLA_BINARY_AMD64` / `BEYLA_BINARY_ARM64`; no riscv64 Beyla binary exists to embed |
| BoringCrypto / FIPS-mode TLS | Missing | Release pipeline restricts the BoringCrypto variant to `linux/amd64,linux/arm64`; no riscv64 BoringCrypto `.syso` exists in the Go toolchain itself -- a Go toolchain limitation, not an Alloy-specific one |

All other components (metrics/log/trace pipelines) are pure Go with no architecture gates and would cross-compile to riscv64 without source changes.

## 5. Build System, Cross-Compilation, and Toolchain

**Language/toolchain:** Go 1.26.7, per the pinned base image `grafana/alloy-build-image:v0.1.35` (`build-tools/build-image/Dockerfile`).

**Build entry points:** top-level `Makefile`, `build-tools/make/packaging.mk` (per-GOARCH dist targets), `build-tools/make/build-container.mk`, and `Dockerfile` (multi-stage, BuildKit-only). The `Makefile` drives cross-compilation through native Go env vars:
```
GOOS   ?= $(shell go env GOOS)
GOARCH ?= $(shell go env GOARCH)
GOARM  ?= $(shell go env GOARM)
CGO_ENABLED ?= 1
```
The Docker build passes `GOOS="$TARGETOS" GOARCH="$TARGETARCH" ... GO_TAGS="netgo embedalloyui promtail_journal_enabled" ... make alloy`.

**C cross-compilation toolchain:** CGO builds (required for the `promtail_journal_enabled`/journald tag) use `rfratto/viceroy:v0.4.0` with `CC=viceroycc`, a GCC-based cross-compiler dispatcher. The build image's apt sources are explicitly restricted: `deb [arch=amd64,arm64,armhf,i386] https://ftp.debian.org/debian bullseye main`. riscv64 is not in this architecture allowlist, so no C cross-compiler (`gcc-riscv64-linux-gnu`) or `libsystemd-dev` for riscv64 is available in the build image, and `viceroycc` has no riscv64 dispatch entry.

**Docker image platforms** (`scripts/docker-containers` / `tools/ci/docker-containers`):
```
BUILD_PLATFORMS=linux/amd64,linux/arm64,linux/ppc64le,linux/s390x
BUILD_PLATFORMS_BORINGCRYPTO=linux/amd64,linux/arm64
```
`linux/riscv64` is absent from both.

**Official Linux binary targets in `packaging.mk`:** `dist/alloy-linux-{amd64,arm64,ppc64le,s390x}`. No `dist/alloy-linux-riscv64` target exists.

**QEMU usage:** Found only in `.github/workflows/create_build_image.yml` (`docker/setup-qemu-action`, used to build the `alloy-build-image` itself for `linux/amd64,linux/arm64`) and in `publish-alloy-linux.yml` (`multiarch/qemu-user-static`, used for existing Docker multi-arch image publishing of amd64/arm64/ppc64le/s390x). Neither use is for riscv64 emulation or compilation.

**Known build failures / requirements to add riscv64:**
1. Add `gcc-riscv64-linux-gnu` and `libsystemd-dev:riscv64` to the build image's apt allowlist (currently restricted to amd64/arm64/armhf/i386 on Debian bullseye).
2. Add a `viceroycc` dispatch entry for riscv64, or set `CC=riscv64-linux-gnu-gcc` explicitly for a riscv64 target.
3. Add a `dist/alloy-linux-riscv64` Makefile target in `packaging.mk`.
4. Add `linux/riscv64` to `BUILD_PLATFORMS` in the Docker containers script.
5. Add riscv64 to the GitHub Actions matrix in `.github/workflows/build.yml` (currently `[amd64, arm64, ppc64le, s390x]`) and to `publish-alloy-linux.yml`.
6. `beyla` and `go.opentelemetry.io/ebpf-profiler` (eBPF stack unwinders) and `async-profiler` (Java profiling) have no riscv64 builds upstream; those tags/components would need to be dropped from a riscv64 build or fixed upstream first.

PR #1526 implemented approximately items 3-4-6 (partially) against the now-obsolete Drone CI system; items 1-2 and the GitHub Actions equivalent of 5 were never addressed. A minimal riscv64 build dropping CGO (`CGO_ENABLED=0`, no `promtail_journal_enabled`, no Beyla/eBPF-profiler/async-profiler tags) reduces to a plain `GOOS=linux GOARCH=riscv64 go build`, which requires none of items 1-2, but loses journal ingestion, eBPF auto-instrumentation, eBPF profiling, and Java profiling.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | riscv64 status | Notes |
|---|---|---|
| OpenTelemetry pipeline (`otelcol.*`) | Full | Pure Go, no arch gates |
| Prometheus scraping (`prometheus.*`) | Full | Pure Go, no arch gates |
| Loki log forwarding (`loki.write`, `loki.process`) | Full | Pure Go, no arch gates |
| Tempo tracing | Full | Pure Go, no arch gates |
| Faro frontend observability | Full | Pure Go, no arch gates |
| Process discovery (`discovery.process`) | Full | Linux-only, arch-agnostic |
| systemd journal ingestion (`loki.source.journal`) | Reduced | No source-level arch gate, but CGO + riscv64 `libsystemd-dev` is not available in the build image; no-op stub compiles in if the tag is dropped |
| eBPF auto-instrumentation (Beyla) | Missing | Hard-coded to amd64/arm64 in Beyla's own `Makefile` |
| eBPF continuous profiling (`pyroscope.ebpf`) | Missing | Hard-gated to amd64/arm64; no-op placeholder on riscv64 |
| Java profiling (`pyroscope.java`) | Missing | Hard-gated to amd64/arm64; no riscv64 async-profiler binary exists upstream |
| BoringCrypto / FIPS TLS | Missing | amd64/arm64 only; Go toolchain limitation, not Alloy-specific |
| Release binaries (deb/rpm/zip) | Missing | Not in the build/packaging matrix |
| OCI container images | Missing | Not in `BUILD_PLATFORMS` |

The core telemetry pipeline (metrics, logs, traces) is fully portable at the source level. The concrete gaps are in eBPF-based instrumentation/profiling, Java profiling, FIPS crypto, and all distribution artifacts. No NaN/floating-point correctness issues specific to riscv64 are recorded anywhere in grafana/alloy or its direct dependencies (Section 11); this is a coverage gap, not a correctness gap.

## 7. CI/CD Infrastructure

**Zero riscv64 CI exists in grafana/alloy**, confirmed by two independent methods at HEAD `1767e6500dc5cc47690475829396f4446c03cf74` (2026-09-30):

1. A direct recursive case-insensitive grep (`grep -rliE "riscv|riscv64"`) across all 62 files in `.github/workflows/` returned zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository root.
2. GitHub's own code-search index (`search_code`), which indexes file content repo-wide, independently returns the same result: `riscv repo:grafana/alloy` and `riscv64 repo:grafana/alloy` each return exactly 1 hit total (the `package-lock.json` esbuild/rollup lockfile entries described in Section 4), and scoping the same query to `path:.github/workflows` or `language:YAML` returns 0 results.

`build.yml`'s Linux matrix is `[amd64, arm64, ppc64le, s390x]` (plus `[amd64, arm64]` for the boringcrypto variant), on GitHub-hosted x86 runners, with Darwin arm64/amd64, Windows amd64, and FreeBSD amd64 as the only other targets. There is no self-hosted riscv64 runner, no riscv64 `runs-on` entry, and no riscv64-specific trigger of any kind.

| Coverage | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build (CI) | Yes | Yes | No |
| Test (CI) | Yes | Yes | No |
| Release publishing | Yes | Yes | No |

The [RISE RISC-V Runners](https://riseproject.dev/blog) service (free managed riscv64 GitHub Actions runners, label `ubuntu-24.04-riscv`, running on real RISC-V hardware) is not used by grafana/alloy; no RISE runner label appears in any workflow file, and Alloy is absent from the RISE runner user list.

## 8. Distribution and Release Status

**v1.20.1 release assets** (25 total, confirmed directly against `github.com/grafana/alloy/releases/expanded_assets/v1.20.1`):
```
alloy-1.20.1-1.{amd64,arm64,ppc64el,s390x}.deb
alloy-1.20.1-1.{amd64,arm64,ppc64le,s390x}.rpm
alloy-boringcrypto-linux-{amd64,arm64}.zip
alloy-darwin-{amd64,arm64}.zip
alloy-freebsd-amd64.zip
alloy-installer-windows-amd64.exe(.zip)
alloy-linux-{amd64,arm64,ppc64le,s390x}.zip
alloy-mixin-dashboards-v1.20.1.zip
alloy-windows-amd64.exe.zip
SHA256SUMS
source zip / tar.gz
release attestation (json)
```
Zero of the 25 assets contain "riscv". This was independently re-verified via direct WebFetch against the live GitHub releases page in a separate verification pass, with identical results.

**Other channels, all checked live:**
- **PyPI:** `grafana-alloy` does not exist (`GET https://pypi.org/pypi/grafana-alloy/json` -> HTTP 404). Expected: Alloy is a Go binary, not a Python package; this channel is moot by construction.
- **RISE GitLab wheel builder:** `gitlab.com/api/v4/projects/56254198/packages/pypi/simple/grafana-alloy/` redirects to the PyPI URL above, which 404s. No RISE-built wheel exists, consistent with no upstream PyPI package to mirror.
- **Ubuntu 26.04 ("Resolute"):** `packages.ubuntu.com` search for `grafana-alloy` across all sections and all architectures returns "Sorry, your search gave no results." The package does not exist in Ubuntu's archive at all (any architecture) -- Grafana ships Alloy through its own apt/yum repositories, not Debian/Ubuntu-maintained packaging.
- **Debian:** not tracked (HTTP 404 on tracker.debian.org).
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at)): no `grafana-alloy`/`alloy` listing.

No official or community-maintained riscv64 binary for Grafana Alloy exists on any distribution channel. The only riscv64 binary ever built was PR #1526 author @macabu's personal hardware build, which was never published or redistributed. A user wanting riscv64 today would have to build unofficially and unsupported: `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 make alloy`, dropping CGO-dependent tags (journald) and any eBPF/Java-profiling components, with no upstream guarantee of correctness.

## 9. Dependencies

Table covers every dependency listed as a direct dependency of Grafana Alloy, using the exact names given, assessed for riscv64 build/test/release status and architecture-specific concerns (CGO, eBPF/JIT, SIMD/crypto acceleration).

| Dependency | Role | Criticality | riscv64 status | Notes |
|---|---|---|---|---|
| Go | Language runtime, GC, stdlib | Critical (runtime) | Builds | Official Go port since Go 1.14 (binary tarballs since Go 1.21); `linux/riscv64` is a standard cross-compile target |
| coreos/go-systemd | Go bindings to libsystemd/journald, used by `loki.source.journal` | Critical (runtime) | Builds with stub when CGO tag absent | CGO path requires riscv64 `libsystemd-dev`, not currently in Alloy's build image |
| systemd | C library (`libsystemd`) linked via CGO for journal ingestion | Critical (runtime) | Not available in build image for riscv64 | Explicit blocker cited by the Issue #1036 requester: "the dependency on journald doesn't make cross-compilation easy" |
| beyla | eBPF auto-instrumentation (HTTP/gRPC span generation) | Critical (runtime) | Missing | `Makefile` hardcodes `BEYLA_BINARY_AMD64`/`BEYLA_BINARY_ARM64` only; no riscv64 build |
| go.opentelemetry.io/ebpf-profiler | eBPF-based continuous CPU profiling stack unwinder | Critical (runtime) | Missing | No riscv64 stack unwinder implemented upstream |
| GCC | C cross-compiler, dispatched via `viceroycc` for CGO builds | Critical (build) | Not available for riscv64 | Build image's apt allowlist (Debian bullseye) is restricted to `amd64,arm64,armhf,i386`; no `gcc-riscv64-linux-gnu` |
| viceroy | Cross-compilation toolchain container/dispatcher (`rfratto/viceroy:v0.4.0`) | Critical (build) | No riscv64 dispatch entry | Would need a new architecture target added upstream in viceroy itself |
| Prometheus | Core metrics scraping engine, TSDB, PromQL | Critical (runtime) | Builds | Official riscv64 binaries since v2.46.0 (Jul 2023); Docker images since v3.10.0 (Feb 2026) per prior verification; no open riscv64 correctness bugs found |
| async-profiler | Embedded binary used by `pyroscope.java` for JVM profiling | Optional (runtime) | Missing | Embedded tarballs exist only for `linux-x64` and `linux-arm64`; no riscv64 async-profiler build exists upstream |
| golang.org/x/crypto | TLS/crypto primitives (AES-GCM, ChaCha20-Poly1305, Curve25519) | Optional (runtime) | Builds (pure-Go fallback) | Official Go project; riscv64 is an official Go port. No riscv64-specific assembly exists, so no SIMD-accelerated path is used; throughput is not independently measured in this research [NEEDS VERIFICATION: no riscv64 vs amd64/arm64 TLS throughput figures found in any source checked] |
| klauspost/compress | zstd/s2/flate/gzip compression for telemetry pipelines, remote-write, WAL | Optional (runtime) | Builds (pure-Go fallback) | amd64-specific asm in zstd/s2 is guarded by build tags; generic Go fallback used on riscv64. No open riscv64 issues found (search surfaced only an unrelated arm64 test-timeout issue, #532) |
| cespare/xxhash | xxHash-64 for metric label fingerprinting | Optional (runtime) | Builds (pure-Go fallback) | No riscv64 assembly exists; falls back to the generic Go path via its `!amd64,!arm64` build tag |
| Wazero | Embedded WASM interpreter/JIT runtime (scripting/plugin execution) | Optional (runtime) | Builds; interpreter-only on riscv64 | No wazevo JIT backend exists for riscv64 (0 files under `backend/isa/riscv64/`) -- architecturally absent by design, not a bug. Native riscv64 CI exists upstream on RISE's `ubuntu-24.04-riscv` hardware (no QEMU, since upstream PR #2486, 2026-04-11). Existing project report at `project-reports/wazero.md` (color: blue) covers this dependency independently |
| klauspost/cpuid | x86 CPUID-based feature detection gating SIMD dispatch in sibling libraries (md5-simd, sha256-simd, compress) | Optional (runtime) | Builds; returns a benign/empty feature set | CPUID has no RISC-V equivalent to probe. Upstream issue #158 "Support RISC-V" is closed with no linked PR; consumers relying on this for SIMD dispatch simply skip the accelerated path on riscv64 |
| segmentio/asm | Hand-written AMD64 SIMD assembly for string/ASCII operations | Optional (runtime) | Builds (documented generic-Go fallback outside amd64) | No riscv64-specific issues found |
| minio/sha256-simd | SIMD-accelerated SHA256 | Optional (runtime) | Builds (generic Go fallback expected outside amd64/arm64 asm paths; not directly confirmed in source this session) | No riscv64-specific issue found |
| minio/md5-simd | SIMD-accelerated multi-block MD5 (historically AVX2/AMD64-targeted) | Optional (runtime) | [NEEDS VERIFICATION] | riscv64 fallback behavior not independently confirmed; a full issue search for this repository could not be completed due to persistent GitHub API rate limiting during research |
| node_exporter | Host hardware/OS metrics (bundled/integrated component) | Optional (runtime) | Builds; riscv64 binaries since v1.7.0 (Nov 2023), Docker images since v1.11.1 | Open non-blocking riscv64 test issues: [#3180](https://github.com/prometheus/node_exporter/issues/3180) (e2e test fails on an x86-specific fixture), [#2296](https://github.com/prometheus/node_exporter/issues/2296) (test failure open since v1.3.1) |
| cadvisor | Container resource metrics for Kubernetes | Optional (runtime) | Builds; riscv64 CPU clock fix merged Jan 2020 ([PR #2364](https://github.com/google/cadvisor/pull/2364)) | No open riscv64 issues found |

**Additional indirect dependencies identified via research** (not required entries, included for completeness): `golang/snappy` (pure Go, no riscv64 issues found; not to be confused with the C++ `google/snappy`, which has its own report at `project-reports/snappy.md`), `pierrec/lz4/v4` (pure Go, no riscv64 issues found), `KimMachineGun/automemlimit`, `elastic/go-freelru`, and `hashicorp/golang-lru` (all pure Go memory-limit/LRU-cache utilities with no architecture-specific code and low riscv64 risk; not independently searched for issues this session given the lower risk profile).

The two dependencies that constitute a hard functional ceiling, not merely a performance gap, are `beyla` and `go.opentelemetry.io/ebpf-profiler`: both require riscv64 eBPF stack-unwinder implementations that do not exist upstream in either project, and neither project has an open riscv64 tracking issue.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [grafana/alloy #1036](https://github.com/grafana/alloy/issues/1036) | Add riscv binaries | Closed, `not_planned` | Feature request | Only riscv64 issue in the repository; explicitly declined by a maintainer (Section 2) |
| [grafana/alloy #1526](https://github.com/grafana/alloy/pull/1526) | Build Alloy for linux/riscv64 | Closed, unmerged | Implementation attempt | Only riscv64 PR in the repository; technically validated, abandoned unreviewed |
| [golang/go #78161](https://github.com/golang/go/issues/78161) | riscv64 memory corruption / inlining miscompile | Open (in the Go toolchain, not Alloy) | Correctness | Affects any Go binary built for riscv64, including a hypothetical Alloy build |
| [golang/go #74683](https://github.com/golang/go/issues/74683) | FIPS + PIE broken on riscv64 | Open (Go toolchain) | Correctness | Relevant to the (currently amd64/arm64-only) BoringCrypto/FIPS build variant |
| [golang/go #79275](https://github.com/golang/go/issues/79275) | J-type relocation overflow on riscv64 | Open (Go toolchain) | Build correctness | Go toolchain issue, not Alloy-specific |
| [prometheus/node_exporter #3180](https://github.com/prometheus/node_exporter/issues/3180) | e2e test fails on riscv64 (x86-specific fixture) | Open | Test infra | Bundled/integrated dependency, non-blocking for Alloy's core |
| [prometheus/node_exporter #2296](https://github.com/prometheus/node_exporter/issues/2296) | Test failure under RISC-V | Open since v1.3.1 | Test infra | Bundled/integrated dependency, non-blocking for Alloy's core |

Zero open issues mentioning riscv64 exist in grafana/alloy itself beyond the closed #1036/#1526 pair; this was independently reconfirmed via three separate GitHub issue-search queries ("riscv", "riscv64", "risc-v") all returning the same single closed result, and via GitHub's code-search index returning zero hits outside a single unrelated npm lockfile entry. No NaN/floating-point correctness issues specific to riscv64 are recorded in grafana/alloy or its direct dependencies. No riscv64 performance benchmarks for Alloy exist in any source checked (GitHub, Grafana docs, RISE Project blog, general web search) -- there is nothing to benchmark, since no riscv64 build has ever been published.

## 12. Objections and Upstream Blockers

**Governance veto, stated explicitly.** Grafana Labs holds unilateral governance authority (Section 1). Issue #1036 was moved to "Likely Decline" and then "Declined" on the internal proposals board by maintainer @wildum, with a recorded rationale: "investing efforts into it now does not seem worth it given the lack of popularity for this type of binary." This is a concrete, attributed maintainer objection, not silent inactivity -- it is the single strongest blocker identified in this research.

**eBPF subsystem is a structural gap, not an Alloy-specific one.** `pyroscope.ebpf` and the underlying `go.opentelemetry.io/ebpf-profiler` and `beyla` dependencies all hard-code `linux && (arm64 || amd64)`. Closing this gap requires riscv64 eBPF stack-unwinder implementations in those upstream projects, none of which have started that work as of this research.

**Build image and toolchain gaps.** `grafana/alloy-build-image:v0.1.35` and the `viceroy:v0.4.0` cross-compilation container do not include a riscv64 GCC cross-compiler or riscv64 `libsystemd-dev`. Both would need upstream changes (to Alloy's own build image and to the separate `viceroy` project) before `loki.source.journal` could be built for riscv64 with full CGO functionality.

**Go runtime correctness risk.** Three open Go-toolchain bugs on riscv64 (including a memory-corruption/inlining miscompile, [#78161](https://github.com/golang/go/issues/78161)) mean any Go binary compiled for riscv64, Alloy included, carries correctness risk until those are resolved upstream in `golang/go`.

**CI-system obsolescence.** PR #1526 targeted Drone CI (`.drone/`); the repository has since migrated fully to GitHub Actions. The PR's changes cannot be applied as-is and would require a full rewrite against `.github/workflows/build.yml` and `publish-alloy-linux.yml`.

**Acceptance probability:** Low without a change in Grafana Labs' stated position. The technical path (Section 5) is well-understood and was partially demonstrated as working by PR #1526's author. The blocker is organizational: a maintainer explicitly declined the feature on demand grounds, and no new signal (RISE involvement, renewed community PR, changed maintainer stance) has appeared since April 2025.

## 13. Readiness Assessment

- **Color:** orange (no-ci-no-distro)
- **Release provider:** none
- **Justification:** Grafana Alloy has zero riscv64 CI (a grep across all 62 GitHub Actions workflow files, including [build.yml](https://github.com/grafana/alloy/blob/main/.github/workflows/build.yml)'s `[amd64, arm64, ppc64le, s390x]` matrix, found no riscv references) and ships no riscv64 binaries among the 25 assets in the [v1.20.1 release](https://github.com/grafana/alloy/releases/tag/v1.20.1); it is also absent from Ubuntu, Debian, PyPI, and the Arch RISC-V port, so no distribution floor applies either. The only concrete riscv64 attempt, [PR #1526](https://github.com/grafana/alloy/pull/1526), was self-closed unmerged by its author in Sept 2024, and the tracking request, [Issue #1036](https://github.com/grafana/alloy/issues/1036), was explicitly moved to "Declined" on the project board and closed `not_planned` in April 2025, with maintainer wildum citing "lack of popularity for this type of binary" -- a governance-level rejection, not just absent CI.
- **Pending work that could change the grade:** none identified. No open riscv64 PR, no renewed issue, and no RISE Project involvement with Grafana Alloy were found in this research.

## 14. Investment Analysis

RISE has no funded work on Grafana Alloy or on observability tooling generally; the closest adjacent RISE-funded work is Go runtime acceleration (relevant to every Go-based tool on riscv64, not Alloy specifically) and the RISE RISC-V Runners CI service (available for free but unused by this project). No sizing below assumes or double-counts RISE work that does not exist for this project.

### 14.1 Functional Enablement

The core Alloy pipeline (metrics, logs, traces via OTel/Prometheus/Loki/Tempo) is pure Go and cross-compiles to riscv64 today with `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0`, producing a functional agent minus journald ingestion, eBPF auto-instrumentation, eBPF profiling, and Java profiling.

Adding journald support requires: riscv64 `gcc-riscv64-linux-gnu` and `libsystemd-dev` in the build image, a `viceroycc` riscv64 dispatch entry, and re-enabling the `promtail_journal_enabled` tag with CGO linkage verified. PR #1526's author's binary was dynamically linked without journald appearing in its `ldd` output, suggesting the journal-disabled path may be the pragmatic near-term target.

Adding eBPF auto-instrumentation (Beyla) and eBPF profiling (`ebpf-profiler`) requires riscv64 stack-unwinder implementations in those two separate upstream projects -- out of scope for Alloy-side work alone and not estimable without a design review of each unwinder's architecture.

Adding Java profiling requires a riscv64 `async-profiler` build upstream, followed by an `asprof_linux_riscv64.go` embedding it in Alloy -- entirely dependent on `async-profiler` upstream, not estimable from Alloy-side work alone.

### 14.2 Performance Optimization

Data not available: no benchmark data for Grafana Alloy on riscv64 exists in any source checked (GitHub, Grafana docs, RISE Project blog, general web search). Performance risk can be inferred qualitatively from the dependency gaps in Section 9 (no riscv64 SIMD assembly in `golang.org/x/crypto`, `cespare/xxhash`, `klauspost/compress`, `segmentio/asm`, `minio/sha256-simd`, `minio/md5-simd`; all fall back to generic Go paths), but no measured throughput or latency figures exist to quantify the gap.

### 14.3 CI/CD Infrastructure

The RISE RISC-V Runners service (free, `ubuntu-24.04-riscv` label, real RISC-V hardware) provides a zero-hardware-cost path to add riscv64 CI to grafana/alloy. Adding it requires only a new job in `.github/workflows/build.yml` targeting that runner label, plus maintainer approval to merge the workflow change -- which is precisely the organizational blocker identified in Section 12.

### 14.4 Ecosystem Enablement

Data not available: the RISE Project has no funded work on Grafana Alloy or observability tooling, and no dependent-package ecosystem (npm/PyPI/Maven/Kubernetes-operator) requiring separate riscv64 enablement exists for this project (Alloy is distributed as OS packages and standalone binaries/images, not as a library consumed by a package ecosystem).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Build riscv64 binary without journald (`CGO_ENABLED=0`, no `promtail_journal_enabled`) | 1 | Alloy contributor | Critical |
| Functional | Add riscv64 to build image: `gcc-riscv64-linux-gnu` + `libsystemd-dev` | 2 | Alloy build-image maintainer | High |
| Functional | Add riscv64 cross-compiler dispatch to `viceroycc` | 2 | viceroy maintainer | High |
| Functional | Add riscv64 Makefile target and packaging in `packaging.mk` | 1 | Alloy contributor | High |
| Functional | Add `linux/riscv64` to Docker `BUILD_PLATFORMS` | 0.5 | Alloy contributor | High |
| CI/CD | Add riscv64 job to `.github/workflows/build.yml` using RISE runners | 1 | Alloy contributor | High |
| CI/CD | Add riscv64 release publishing to the release-artifact workflow | 1 | Alloy contributor | High |
| Functional | Implement riscv64 eBPF stack unwinder in `go.opentelemetry.io/ebpf-profiler` | Data not available: no effort estimate possible without detailed upstream design review | ebpf-profiler upstream | Medium |
| Functional | Implement riscv64 support in `beyla` | Data not available: no effort estimate possible without detailed upstream design review | beyla upstream | Medium |
| Functional | Produce riscv64 `async-profiler` binary and add `asprof_linux_riscv64.go` | Data not available: depends entirely on async-profiler upstream | async-profiler upstream | Low |
| Go runtime | Fix memory corruption miscompile ([#78161](https://github.com/golang/go/issues/78161)) | Data not available: tracked in golang/go | Go team | Critical (blocks production use of any Go binary on riscv64) |
| Go runtime | Fix FIPS+PIE on riscv64 ([#74683](https://github.com/golang/go/issues/74683)) | Data not available: tracked in golang/go | Go team | High |
| Governance | Engage Grafana Labs to reverse the "Not Planned" decision on Issue #1036 | Non-technical; depends on relationship and prioritization signals | Chip company + Grafana Labs | Critical (blocks all upstream merge) |

The governance blocker is the highest-risk item and sits ahead of all technical work: without Grafana Labs reversing the explicit "Declined" decision on Issue #1036, any functional or CI work produces a downstream fork rather than an upstream-accepted port. A formal vendor engagement, not a GitHub issue reply, is the realistic prerequisite for any upstreaming path, since the prior attempt (PR #1526, with a working validated binary) received zero maintainer engagement before the request was declined on demand grounds.

## 15. References

- [grafana/alloy repository](https://github.com/grafana/alloy)
- [Grafana Alloy homepage](https://grafana.com/oss/alloy/)
- [Grafana Alloy v1.20.1 release](https://github.com/grafana/alloy/releases/tag/v1.20.1)
- [Issue #1036: Add riscv binaries](https://github.com/grafana/alloy/issues/1036)
- [PR #1526: Build Alloy for linux/riscv64](https://github.com/grafana/alloy/pull/1526)
- [Grafana Alloy build.yml workflow](https://github.com/grafana/alloy/blob/main/.github/workflows/build.yml)
- [Grafana Alloy Supported Platforms documentation](https://grafana.com/docs/alloy/latest/set-up/supported-platforms/)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/)
- [RISE python-wheels / wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [golang/go #78161: riscv64 memory corruption/inlining miscompile](https://github.com/golang/go/issues/78161)
- [golang/go #74683: FIPS+PIE broken on riscv64](https://github.com/golang/go/issues/74683)
- [golang/go #79275: J-type relocation overflow on riscv64](https://github.com/golang/go/issues/79275)
- [prometheus/node_exporter #3180: e2e test fails on riscv64](https://github.com/prometheus/node_exporter/issues/3180)
- [prometheus/node_exporter #2296: test failure under RISC-V](https://github.com/prometheus/node_exporter/issues/2296)
- [google/cadvisor PR #2364: riscv64 CPU clock fix](https://github.com/google/cadvisor/pull/2364)
- [klauspost/cpuid issue #158: Support RISC-V](https://github.com/klauspost/cpuid/issues/158)
- [tetratelabs/wazero project report](https://github.com/tetratelabs/wazero) (internal report: `project-reports/wazero.md`, color blue)
- [Arch Linux RISC-V port database](https://archriscv.felixc.at)
- [Ubuntu package search](https://packages.ubuntu.com/search?keywords=grafana-alloy&suite=resolute&searchon=names&section=all)