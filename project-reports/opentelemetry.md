---
title: OpenTelemetry
parent: Project Reports
color: yellow
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: gRPC-Go
    relation: runtime-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: optional
  - name: gRPC
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GoReleaser
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: optional
  - name: tokio
    relation: runtime-dependency
    criticality: optional
  - name: Tonic
    relation: runtime-dependency
    criticality: optional
  - name: Prost
    relation: runtime-dependency
    criticality: optional
  - name: pprof-rs
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="opentelemetry" %}

# OpenTelemetry

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenTelemetry<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OpenTelemetry is a CNCF graduated project formed from the 2019 merger of OpenTracing and OpenCensus. It defines vendor-neutral APIs, SDKs, and the OpenTelemetry Protocol (OTLP) wire format for collecting and exporting traces, metrics, and logs. All subprojects are licensed under Apache 2.0.

Governance is layered: a **Governance Committee** (GC, 9 members, staggered 2-year terms, elected by "Members of Standing" via approval voting on the Helios platform; candidates require 3 endorsements from 3 different companies; a hard cap of 2 GC members per company enforces an anti-capture rule, and members must resign within 28 days of a disqualifying employer change) delegates technical decision-making to a **Technical Committee** (TC). **SIGs** (Special Interest Groups) own individual components or languages, with maintainers holding technical authority inside their SIG. Beneath that sit Maintainers (200+), Approvers (100+), Triagers (40+) and General Members (300+), all tracked by individual GitHub identity rather than corporate seat. OpenTelemetry does not publish a maintainer-to-company mapping or formal sponsorship tiers (no CNCF Platinum/Gold/Silver-style list specific to this project); adoption is described loosely as "backed by the CNCF and major cloud providers," with an adopters showcase listing companies such as Alibaba, eBay, GitHub, and Shopify. A prior version of this assessment cited specific per-company GC/TC seat counts (e.g., Grafana Labs 2 GC + 1 TC, Microsoft 1 GC + 2 TC); that breakdown could not be re-confirmed against any primary source in this round of research and is marked **[NEEDS VERIFICATION]**.

The components relevant to this report:

- **opentelemetry-collector** - Go-based core data pipeline
- **opentelemetry-collector-contrib** - extended receiver/exporter/processor plugins (Go)
- **opentelemetry-collector-releases** - packaged distributions (otelcol, otelcol-contrib, otelcol-k8s, otelcol-otlp)
- **opentelemetry-go** - Go SDK and API
- **opentelemetry-cpp** - C++ SDK
- **opentelemetry-rust** - Rust SDK
- **opentelemetry-ebpf-instrumentation (OBI)** - zero-code auto-instrumentation via eBPF

**Community culture on new ports:** pragmatic and low-friction for Tier 3. A single external contributor (shanduur) proposed, built, and landed riscv64 support across three Collector repos within roughly 48 hours of Tier-3 review, with normal approval from two regular maintainers each time. No governance-level gatekeeping was observed; the only resistance encountered was a CI/build-correctness issue (a missing binary), not a policy objection, and it was fixed within a day. This is a markedly different posture than opentelemetry-go, where maintainers explicitly rejected a one-off riscv64 test-pass as insufficient evidence for compatibility-matrix inclusion (see Section 2).

OpenTelemetry is **not** a RISE Project member. RISE Premier members: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm Technologies, Red Hat, SiFive, Tenstorrent. RISE General members: Akeana, Andes Technology, Beijing ESWIN Computing Technology, Beijing Institute of Open Source Chip, Canonical, Douyin Vision (ByteDance), Institute of Software Chinese Academy of Sciences, Microchip Technology, NextSilicon, Quintauris, SpacemiT, ZTE. RISE's RISC-V work centers on Yocto and language runtimes, not OpenTelemetry.

## 2. Port History and Upstreaming Timeline

All substantive riscv64 work was authored by a single community contributor, Mateusz Urbanek (GitHub: shanduur), with no declared corporate or RISE Project sponsorship.

| Date | Event | Source |
|---|---|---|
| 2025-06-02 | Issue opened requesting riscv64 support in collector-releases | [opentelemetry-collector-releases #968](https://github.com/open-telemetry/opentelemetry-collector-releases/issues/968) |
| 2025-06-17 | Master tracking issue opened in the core collector repo, "[arch] New Tier 3 architecture - linux/riscv64" | [opentelemetry-collector #13226](https://github.com/open-telemetry/opentelemetry-collector/issues/13226) |
| 2025-07-22 | PR opened adding riscv64 to core collector | [opentelemetry-collector #13458](https://github.com/open-telemetry/opentelemetry-collector/pull/13458) |
| 2025-07-22/23 | PR opened adding riscv64 to collector-contrib; per-repo issues #13462 (collector) and #41507 (collector-contrib) formally opened | [#41496](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41496), [#41507](https://github.com/open-telemetry/opentelemetry-collector-contrib/issues/41507) |
| 2025-07-24 | Collector-contrib PR #41496 merged (approved by iblancasa and atoulme) | [#41496](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41496) |
| 2025-07-25 | Post-merge Docker build failure: telemetrygen_linux_riscv64 binary never compiled, breaking the release build; revert merged as a release blocker | [opentelemetry-collector-contrib #41558](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41558) |
| 2025-07-25 | Fix landed same day, correctly restoring riscv64 support | [opentelemetry-collector-contrib #41560](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41560) |
| 2025-07-25 | Core collector PR #13458 merged (commit e830498), by mx-psi | [#13458](https://github.com/open-telemetry/opentelemetry-collector/pull/13458) |
| 2025-07-29 | First tagged release shipping riscv64: v1.37.0 / v0.131.0 (collector and collector-contrib), confirmed via CHANGELOG.md diff against the prior tag | collector/collector-contrib CHANGELOG.md |
| 2025-08-07 | Collector-releases PR #969 merged by mowies; k8s release-pipeline gap discovered and fixed same day via #1090 (closing auto-filed bug #1089, "Nightly Release Failed") | [#969](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/969), [#1090](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/1090) |
| 2025-08-12 | First collector-releases tagged release with riscv64: v0.132.0, confirmed via CHANGELOG.md | collector-releases CHANGELOG.md |
| 2026-03-17 | Fix for `docker/setup-qemu-action` silently dropping riscv64 from its default platform list, which had broken riscv64 CI image builds | [opentelemetry-collector #14777](https://github.com/open-telemetry/opentelemetry-collector/pull/14777) |
| 2026-04-02 | Issue opened proposing a cross-build CI workflow for opentelemetry-go including linux/riscv64; blocked on an unrelated open PR (#8120, WASM dialer fix); as of this research, still open and unmerged | [opentelemetry-go #8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126), [#8120](https://github.com/open-telemetry/opentelemetry-go/pull/8120) |

**Precursor, rejected (opentelemetry-go, 2024):** [opentelemetry-go PR #5420](https://github.com/open-telemetry/opentelemetry-go/pull/5420) ("doc: add riscv64 notes"), opened/closed 2024-05-27/28 by mengzhuo, documented a single passing test-suite run on a SiFive VisionFive2 board (Linux 5.15.0-starfive, Go 1.22.3, linux/riscv64) and asked to mark riscv64 as supported in the docs. Maintainers dmathieu and MrAlias rejected it: a one-off local run does not establish ongoing compatibility, and the author was asked to file a proper issue proposing continuous CI infrastructure and demonstrate broader community (not single-contributor) backing. No such CI infrastructure or follow-up issue materialized in opentelemetry-go until #8126 in April 2026, which remains open and blocked.

**Is it fully upstream?** For the Collector ecosystem (collector, collector-contrib, collector-releases), yes: riscv64 is merged to each repo's main branch and shipping in tagged releases as Tier 3. For opentelemetry-go, opentelemetry-cpp, opentelemetry-rust, and opentelemetry-ebpf-instrumentation, no.

## 3. Upstream Support Tier

Per `docs/platform-support.md` in opentelemetry-collector, the project defines three tiers:

- **Tier 1 - "guaranteed to work":** linux/amd64, windows/amd64.
- **Tier 2 - "guaranteed to work with limitations":** darwin/arm64, linux/arm64, windows/arm64.
- **Tier 3 - "guaranteed to build" only, community-supported, cross-compiled, zero native testing:** aix/ppc64, darwin/amd64, js/wasm, linux/386, linux/arm, linux/ppc64le, **linux/riscv64**, linux/s390x, windows/386.

**riscv64 is Tier 3** across opentelemetry-collector, opentelemetry-collector-contrib, and opentelemetry-collector-releases. No documented escalation path from Tier 3 to Tier 2/1 exists; new-platform addition happens informally via PR plus a per-platform community "owner" listed in the doc (@shanduur for riscv64). A Tier 3 regression does not block release of other platforms, and Tier 3 platforms receive no bugfix releases for prior versions.

| Platform | Tier | CI testing | Release-blocking | Owner |
|---|---|---|---|---|
| amd64 | 1 | Full, every PR | Yes | Core maintainers |
| arm64 | 2 | At release time, limitations accepted | Partial | Core maintainers |
| riscv64 | 3 | None (build-only cross-compile) | No | @shanduur (single named community contact) |

**opentelemetry-go:** riscv64 is absent from the compatibility matrix. A cross-build CI workflow is proposed (#8126) but blocked on unmerged PR #8120 and has not landed as of this research. One research pass identified `goarch: riscv64` entries in opentelemetry-go's CI configuration files during a general grep across the org; this conflicts with the deep-dive on #8126/#5420, which found no merged riscv64 cross-build workflow in that repo and explicit maintainer rejection of ad hoc riscv64 claims. This is flagged as a **discrepancy between research passes** [NEEDS VERIFICATION]; the grade's authoritative justification (Section 13) treats opentelemetry-go's riscv64 CI as unmerged/proposed-only, which is the more specific and better-evidenced of the two findings.

**opentelemetry-cpp, opentelemetry-rust, opentelemetry-ebpf-instrumentation:** no riscv64 support tier exists. opentelemetry-ebpf-instrumentation explicitly lists riscv64 as out of scope with no stated roadmap.

## 4. Technical Architecture and RISC-V-Specific Subsystems

A direct review of the diffs for the three merged riscv64 PRs (collector #13458, collector-contrib #41496, collector-releases #969) confirms **zero architecture-specific code was added**. The changes are entirely CI-matrix and release-pipeline plumbing:

- #13458: `.chloggen/rv64.yaml` (changelog), `.github/workflows/build-and-test.yml` (+goarch: riscv64 to the cross-build matrix), `cspell.json` dictionary entries, one line in `docs/platform-support.md`.
- #41496: changelog entry, CI matrix addition (with darwin/windows+riscv64 combinations excluded), `telemetrygen.yml` Docker platform list addition.
- #969: changelog, 9 GitHub Actions workflow files (QEMU platform lists, goarch arrays), 5 goreleaser/build-config files, CONTRIBUTING.md.

No Go source file, assembly, cgo/C intrinsic, SIMD kernel, or `_riscv64.go` build-tagged file exists anywhere in the diffs. This is a property of OpenTelemetry's language choice (pure Go for the Collector, pure Rust for the Rust SDK): the Go and Rust compilers generate riscv64 machine code natively, and OTel never hand-tunes per-architecture code paths for any platform, including amd64. An architecture-specific-code maturity scale (full/intrinsics/scalar-fallback/missing) therefore has no referent for the Collector - it is simply "complete, by virtue of the host language's own riscv64 backend," not a stub.

Two components do have genuine architecture-gated code:

- **opentelemetry-ebpf-instrumentation (OBI):** supported architectures are amd64 and arm64 only. The `asm/` directory contains only `amd/` and `arm/` subdirectories; the `support/` directory contains `support_amd64.go`, `support_arm64.go`, and `support_others.go`. Per `OBI_RECEIVER.md` in opentelemetry-collector-releases, on linux/ppc64le, linux/s390x, and **linux/riscv64** (as well as Windows/macOS), OBI's non-eBPF stub is compiled instead: the receiver registers but does not activate eBPF collection, gated by the build tag `//go:build linux && (amd64 || arm64)`. This is a silent no-op, not an error - a correctness-relevant gap for anyone expecting eBPF-based zero-code auto-instrumentation to actually run on riscv64. The Linux kernel's BPF JIT has supported riscv64 since kernel 5.1 (2019); the gap is purely at the OTel project level.
- **opentelemetry-cpp:** no riscv64 cross-compilation toolchain file exists in the repository, and `INSTALL.md` does not mention riscv64, RISC-V, or any cross-toolchain at all - it states only a general requirement of "a compatible C++ compiler supporting at least C++14," with no version-pinned minimum. The project's own arm64 CI job was commented out on 2024-11-06 for lack of runners, meaning opentelemetry-cpp currently has no non-x86 upstream CI of any kind.
- **opentelemetry-rust:** no riscv64 cross-compilation instructions or CI exist; the CI matrix covers ubuntu-latest, windows-latest, macos-latest, and ubuntu-24.04-arm only.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Collector core data path (Go) | Full, Tier 1 | Full, Tier 2 | Full source parity, Tier 3 (untested) |
| OBI eBPF auto-instrumentation | Full eBPF | Full eBPF | Stub only, silent no-op |
| C++ SDK | CI-validated | CI disabled (2024-11-06) | No toolchain file, no CI |
| Rust SDK | CI-validated | Partial (ubuntu-24.04-arm) | No CI, no toolchain docs |

## 5. Build System, Cross-Compilation, and Toolchain

**Collector (Go), confirmed from raw repository files:** the Go toolchain alone is sufficient; there is no C/C++ cross-compiler requirement because the release build sets `CGO_ENABLED=0`. Go version requirements: `go 1.26.0` (go.mod, opentelemetry-collector-releases and opentelemetry-go), CI `setup-go` action pinned to `~1.26.0` (or `oldstable` in collector-contrib).

Development cross-compile:
```sh
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 make otelcorecol
```
Telemetrygen cross-compile (collector-contrib):
```sh
GOOS=linux GOARCH=riscv64 make telemetrygen
```
Collector builder:
```sh
cd distributions/<distribution-name>
ocb --config manifest.yaml
```
goreleaser build matrix (`cmd/builder/.goreleaser.yaml`, opentelemetry-collector-releases):
```yaml
builds:
  - id: builder-linux
    goos: [linux]
    goarch: [amd64, arm64, ppc64le, riscv64]
    ldflags: ['{{ .Env.LD_FLAGS }}']
    flags: ['{{ .Env.BUILD_FLAGS }}']
env:
  - CGO_ENABLED=0
```
Per-architecture goreleaser tuning flags set `GOARM: "7"`, `GOAMD64: v1`, `GOPPC64: power8`; **no equivalent `GORISCV64` tuning flag is set**, so the build targets the baseline riscv64 ISA with no RVV or other extension enabled.

Docker riscv64 build stanza (same goreleaser file):
```yaml
  - goos: linux
    goarch: riscv64
    dockerfile: Dockerfile
    image_templates:
      - otel/opentelemetry-collector-builder:{{ .Version }}-riscv64
    build_flag_templates:
      - --pull
      - --platform=linux/riscv64
    use: buildx
```
QEMU setup, from `CONTRIBUTING.md` ("Building Multi-Architecture Docker Images"):
```sh
sudo apt-get install qemu binfmt-support qemu-user-static
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
```
In CI, the equivalent is `docker/setup-qemu-action` (e.g. `base-ci-binary.yaml`, `builder-snapshot.yaml`, `telemetrygen.yml`):
```yaml
- uses: docker/setup-qemu-action@... # v4.4.0
  with:
    platforms: amd64,arm64,ppc64le,riscv64
- uses: docker/setup-buildx-action@...
```
followed by `docker build-push-action` with `platforms: linux/amd64,linux/arm64,linux/s390x,linux/ppc64le,linux/riscv64`. QEMU here emulates the target for Docker **image assembly only** - it is not used to run or validate the riscv64 binary; there is no `docker run --platform linux/riscv64` test/validation step anywhere in these workflows.

Release Dockerfiles are architecture-agnostic (same file used for every GOARCH, selected via goreleaser's `--platform` flag or `TARGETARCH`), e.g. `distributions/otelcol-contrib/Dockerfile`:
```dockerfile
FROM alpine:3.24@sha256:... as certs
RUN apk --update add ca-certificates
FROM scratch
ARG USER_UID=10001
ARG USER_GID=10001
USER ${USER_UID}:${USER_GID}
COPY --from=certs /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --chmod=755 otelcol-contrib /otelcol-contrib
COPY config.yaml /etc/otelcol-contrib/config.yaml
ENTRYPOINT ["/otelcol-contrib"]
CMD ["--config", "/etc/otelcol-contrib/config.yaml"]
```

**Known build failures:**
- 2025-07-25: collector-contrib's telemetrygen Docker build failed with `"/telemetrygen_linux_riscv64": not found` because the build pipeline never actually compiled the riscv64 binary before the Dockerfile's COPY step. Reverted ([#41558](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41558)) and re-fixed same day ([#41560](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41560)).
- 2025-08-07: collector-releases' PR #969 added riscv64 everywhere except the Kubernetes release pipeline, causing a nightly release failure (auto-filed as #1089); fixed same day by [#1090](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/1090).
- 2026-03: `docker/setup-qemu-action` stopped installing riscv64 by default, silently breaking riscv64 CI image builds until an explicit platform list was added ([#14777](https://github.com/open-telemetry/opentelemetry-collector/pull/14777)).

**C++ SDK (opentelemetry-cpp):** no CMake flags, cross-toolchain file, or GCC/Clang version requirement tied to riscv64 exist anywhere in the repository or documentation - `INSTALL.md` states only a general C++14 compiler requirement with no version numbers pinned, and no `-DUSE_X=OFF`-style CMake options of any kind exist for this architecture. The riscv64 binaries that do exist (Ubuntu's `opentelemetry-cpp`/`opentelemetry-cpp-dev` packages, Section 8) are built by Debian/Ubuntu's own buildd infrastructure using their standard CMake invocation, independent of any OTel-maintained riscv64 build documentation.

**Rust SDK:** no riscv64 cross-compilation instructions exist in opentelemetry-rust's documentation or CI.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Collector core pipeline (receivers/processors/exporters, pure Go) | Full | Full | Full source parity, Tier 3 untested |
| OBI eBPF zero-code auto-instrumentation | Full | Full | Stub only (silent no-op, no error) |
| opentelemetry-go SDK | Full, in compat matrix | Full, in compat matrix | Not in compat matrix |
| opentelemetry-cpp SDK | CI-validated | CI disabled | No upstream CI, distro-built only |
| opentelemetry-rust SDK | CI-validated | Partial | No CI |

**Functional gaps:** the only true functional gap (something that silently fails to do what it should, rather than simply being untested) is OBI's eBPF auto-instrumentation, which registers on riscv64 but never activates collection. For everything else riscv64-Tier-3-supported, the gap is validation depth (no test execution), not missing functionality.

**Performance gaps:** no `GORISCV64` tuning flag is set in the release build, so riscv64 binaries target the generic riscv64 ISA baseline with no RVV (vector) extension exploited, even though the collector is pure Go with no hand-written SIMD on any architecture, so this is not a riscv64-specific deficit relative to amd64/arm64 - none of the three platforms get hand-tuned SIMD from this codebase.

**Security hardening gaps:** no riscv64-specific hardening gap was identified in the Collector itself. At the dependency level, Go's riscv64 FIPS+PIE combination is broken upstream ([go#74683](https://github.com/golang/go/issues/74683), open), which would affect any FIPS-compliance-requiring OTel deployment on riscv64.

**Floating-point / NaN semantics:** no project-specific floating-point or NaN-handling issues were found for OpenTelemetry on riscv64; none of the searched issue trackers surfaced numerics bugs tied to this architecture.

**Benchmark data:** no published riscv64-specific performance benchmarks exist for OpenTelemetry anywhere - not in the project's own benchmark docs (`opentelemetry.io/docs/specs/otel/performance-benchmark/`, `opentelemetry.io/docs/collector/benchmarks/`), not in `open-telemetry/opentelemetry-benchmarks` or the community `ldb/opentelemetry-benchmark` repo, not in academic literature, and not on the RISE Project blog. Official benchmark dashboards report overhead numbers broken out by language/SDK but not by CPU architecture. **Data not available: no riscv64 vs arm64/amd64 throughput, latency, or CPU-overhead figures exist in any source checked.**

## 7. CI/CD Infrastructure

**riscv64 cross-compile CI exists; riscv64 test-execution CI does not**, confirmed by reading raw workflow file content (not PR summaries) via `raw.githubusercontent.com`:

- **opentelemetry-collector** (`.github/workflows/build-and-test.yml`, job `cross-build-collector`): matrix includes `goos: linux / goarch: riscv64`; the job's only step is `Build` (`make otelcorecol` with `GOARCH=riscv64`). Unit tests run in a separate job (`unittest-matrix`) whose matrix is OS-only (ubuntu-latest/macos/windows); riscv64 is absent from it.
- **opentelemetry-collector-contrib** (`.github/workflows/build-and-test.yml`, job `cross-compile`): matrix includes `os: linux / arch: riscv64 / runner: ubuntu-24.04` (an amd64 GitHub-hosted runner, not RISC-V hardware). The only step is `make GOOS=linux GOARCH=riscv64 otelcontribcollite` - compile only, no test/run step. **This job fires only on full CI runs (push/merge, or the `ci:full` label)** - the `cross-compile-pr` job that runs on every standard pull request covers only linux/amd64 and linux/arm64. riscv64 regressions introduced by a PR are not caught until a full CI run or the next release.
- **opentelemetry-collector-releases** (`.github/workflows/base-ci-goreleaser.yaml`): riscv64 appears only in (1) a goreleaser cross-build matrix and (2) a `docker/setup-qemu-action` step adding riscv64 to the QEMU platforms list for multi-arch Docker image assembly via buildx. There is no `docker run --platform linux/riscv64` or equivalent validation step.
- **opentelemetry-go:** no workflow file implementing riscv64 cross-build CI was confirmed merged; issue [#8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126) proposes one, blocked on unmerged PR #8120. (See Section 3 for the conflicting-evidence note on this point.)

No native riscv64 hardware runner is used anywhere in OpenTelemetry's own CI pipelines. There is no evidence of RISE RISC-V Runner usage by any OpenTelemetry repository (see Section 10).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | Native GitHub-hosted | Native (where available) or emulated | x86-64 host, Go cross-compile |
| Builds code | Yes | Yes | Yes |
| Executes tests | Yes, every PR | Yes, at release time | **No, never** |
| PR-gated (every PR) | Yes | Yes | **No (collector-contrib: full-CI/merge only)** |
| Docker image | Native build | Native/buildx | QEMU-assisted buildx, image assembled but not run |

**Infra fragility:** three distinct CI/build-pipeline failures have occurred in roughly one year of riscv64 support: the telemetrygen missing-binary break (2025-07), the Kubernetes release-pipeline gap (2025-08), and the `docker/setup-qemu-action` silent platform drop (2026-03). All three were diagnosed and fixed by the same single contributor (shanduur authored the first and third; the k8s gap was fixed by mowies).

## 8. Distribution and Release Status

**GitHub Releases (GoReleaser-produced, upstream-direct):** confirmed shipping continuously since the first riscv64 releases (v0.131.0 for collector/collector-contrib, 2025-07-29; v0.132.0 for collector-releases, 2025-08-12). The goreleaser configuration (Section 5) produces, for `linux/riscv64`:

| Artifact type | Format |
|---|---|
| Binary tarball | `.tar.gz` |
| Debian package | `.deb` |
| RPM package | `.rpm` |
| Container image | multi-arch OCI manifest entry (`linux/riscv64`) |

Each binary is accompanied by Sigstore `.pem`/`.sig` signatures and an SBOM (`.sbom.json`). Multi-arch Docker manifests for `otel/opentelemetry-collector` and the GHCR mirror include `linux/riscv64` alongside 386, amd64, arm/v7, arm64, ppc64le, and s390x.

**Linux distribution packaging (confirmed independent of upstream OTel CI):**

| Distribution | Package | riscv64 status | Notes |
|---|---|---|---|
| Ubuntu 26.04 (resolute) | `opentelemetry-cpp`, `opentelemetry-cpp-dev` | **Compiled for riscv64** (1.23.0-3build1, among amd64 arm64 armhf ppc64el riscv64 s390x) | Confirmed live via `packages.ubuntu.com`; universe component |
| Ubuntu 26.04 (resolute) | `python3-opentelemetry-api`, `python3-opentelemetry-sdk`, and all `python3-opentelemetry-*` exporters/propagators | `Architecture: all` | Pure Python, arch-independent |
| Debian sid | `opentelemetry-cpp` / `opentelemetry-cpp-dev` | Installed (1.23.0-3+b1), built on rv-manda-04 | Compiled binary |
| Debian sid | `python3-opentelemetry-*` | `arch:all` | Pure Python |
| Debian sid | `golang-opentelemetry-collector-dev` (0.141.0-1) | `arch:all` Go source package | Not a compiled binary; Debian does not itself produce a riscv64 collector binary package |
| Arch Linux RISC-V (archriscv.felixc.at) | n/a | **Not present** | Confirmed live: no package named or containing "opentelemetry" in the port's package search |
| Homebrew | `opentelemetry-cpp` | Not available | Bottles exist for x86_64 and ARM64 only |

**PyPI:** there is no package literally named `opentelemetry`; the project publishes under prefixed names (`opentelemetry-api`, `opentelemetry-sdk`, `opentelemetry-exporter-otlp`, etc.), each shipping only a `py3-none-any.whl` universal wheel plus a source tarball - no platform-specific wheel of any architecture exists, so riscv64 "support" here is unconditional by design, not a riscv64-specific achievement. The RISE GitLab wheel-builder proxy (`gitlab.com/.../packages/pypi/simple/opentelemetry/`) redirects straight to PyPI's own simple index rather than hosting a dedicated riscv64 build, and resolves to the same 404 because no package is named plain `opentelemetry`.

**What a user must do to get a working binary today:** for the Collector, download the published `linux_riscv64` tarball/.deb/.rpm or pull the `linux/riscv64` manifest entry from the published container image - no source build required. For the C++ SDK, install Ubuntu's `opentelemetry-cpp-dev` package (or build from source with no riscv64-specific guidance, since none is published upstream). For the Go or Rust SDKs used directly (not via the pre-built collector binary), a user is cross-compiling onto an architecture the respective SDK does not validate in CI.

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|---|
| Go | Build-dependency | Critical | Cross-compiles; secondary Go port, confirmed present in Ubuntu 26.04 riscv64 (`golang-go`/`golang-1.23`) | Go upstream has riscv64 builders but 3 of 4 reportedly broken | Statically linked into all collector binaries | [go#78161](https://github.com/golang/go/issues/78161) memory-corruption/inlining miscompile (open); [go#74683](https://github.com/golang/go/issues/74683) FIPS+PIE broken; [go#79275](https://github.com/golang/go/issues/79275) J-type relocation overflow; fragile CI builder hardware |
| gRPC-Go (`google.golang.org/grpc`) | Runtime-dependency | Critical | Builds (pure Go, inherits cross-compile); present in Ubuntu 26.04 riscv64 (`golang-google-grpc-dev`) | No riscv64-specific CI upstream | Go module, statically linked | Inherits Go runtime issues above; none gRPC-Go-specific |
| Protocol Buffers (Go, `google.golang.org/protobuf` v1.36.11) | Runtime-dependency | Critical | Builds (pure Go); present in Ubuntu 26.04 riscv64 (`protobuf-compiler`/`libprotobuf-dev`) | No riscv64-specific CI | Go module, statically linked | None identified |
| glibc | Runtime-dependency | Optional | Fully functional since glibc 2.27 (2018); present in Ubuntu 26.04 riscv64 (`libc6`) | Debian/Ubuntu distro CI | Ubuntu 24.04 ships 2.39, sid ships 2.42-17 | Crash-class bugs below glibc 2.42 (IFUNC gp-pointer SIGSEGV, hwprobe prototype) |
| gRPC (C++, v1.81.1) | Runtime-dependency | Optional | Not confirmed upstream for riscv64; arm64 CI disabled 2024-11-06; present in Ubuntu 26.04 riscv64 (`libgrpc-dev`/`libgrpc++-dev`) | Not tested upstream | No upstream riscv64 CI | Ubuntu packaging exists but no upstream OTel riscv64 validation |
| OpenSSL | Runtime-dependency | Optional | Builds cleanly; RVV/Zkn assembly optimizations present; present in Ubuntu 26.04 riscv64 (`libssl-dev`) | Covered via Debian/Ubuntu downstream; no upstream GH Actions riscv64 runner | n/a | No FIPS CI coverage for riscv64 |
| CMake | Build-dependency | Critical | Primary build system for opentelemetry-cpp; no riscv64-specific toolchain file or version minimum exists in-repo | n/a | Used by Debian/Ubuntu buildd to produce the riscv64 `opentelemetry-cpp` package | Upstream OTel never validates a riscv64 CMake build itself |
| GoReleaser | Build-dependency | Critical | Drives all riscv64 binary/Docker releases across collector/collector-contrib/collector-releases (`goarch: riscv64` in `.goreleaser.yaml`) | n/a | Directly publishes riscv64 tarballs, .deb/.rpm, and Docker images | release_provider is upstream, via this pipeline |
| QEMU | Build-dependency | Critical | Used via `docker/setup-qemu-action`/`docker buildx` to assemble (not execute) riscv64 Docker image layers | n/a | Required for multi-arch image publishing | Silently dropped from `docker/setup-qemu-action` default platform list in 2026-03, requiring fix [#14777](https://github.com/open-telemetry/opentelemetry-collector/pull/14777) |
| GNU make | Build-dependency | Optional | Used for `make otelcorecol`, `make telemetrygen`, `make chlog-new` dev/cross-build targets | n/a | Not used in the final release path (goreleaser drives releases) | None identified |
| tokio | Runtime-dependency | Optional | Pure Rust; builds on riscv64; present in Ubuntu 26.04 riscv64 (`librust-tokio-dev`) | No riscv64 CI in opentelemetry-rust | n/a | None known |
| Tonic | Runtime-dependency | Optional | Pure Rust; builds on riscv64; present in Ubuntu 26.04 riscv64 (`librust-tonic-dev`) | No riscv64 CI coverage | n/a | None known |
| Prost | Runtime-dependency | Optional | Pure Rust; builds on riscv64; present in Ubuntu 26.04 riscv64 (`librust-prost-dev`) | No riscv64 CI coverage | n/a | None known |
| pprof-rs (pprof crate v0.14) | Test-dependency | Optional | C/native linkage; riscv64 support unconfirmed; **not packaged for Debian/Ubuntu on any architecture** (confirmed: `librust-pprof-dev` does not exist in the Ubuntu archive at all) | Not tested | n/a | Dev/benchmark-only flamegraph profiling, not a production blocker |
| Linux kernel BPF JIT (indirect, via OBI) | Runtime-dependency | Optional | Functional on riscv64 since Linux 5.1 (2019) | n/a | n/a | Not a blocker; OBI's riscv64 gap is at the OTel project level, not the kernel |

Protocol Buffers' C++ maintainers have stated riscv64 is explicitly out of roadmap/unsupported (per the Protocol Buffers readiness report cross-reference); this is a deeper-tier risk for OpenTelemetry's C++ SDK specifically, since that SDK's OTLP wire format depends on it.

## 10. Ecosystem Status

OpenTelemetry Collector Contrib carries a large dependent-plugin ecosystem (receivers, processors, exporters, extensions numbering in the hundreds) that inherits riscv64 Tier-3 status automatically because all of it is pure Go compiled through the same cross-build pipeline documented in Section 5 - there is no separate per-plugin riscv64 enablement step.

**RISE Project involvement:** none, as a dedicated initiative. All 34 posts on the RISE Project blog (riseproject.dev/blog, 2024-05-15 through 2026-09-28) were checked by full body text, including the RISC-V Runners CI posts ("Announcing the RISE RISC-V Runners," 2026-03-24; "RISE RISC-V Runners: Six Weeks In," 2026-05-12) - zero mention "OpenTelemetry" anywhere. The RISE Python wheel-builder catalog (`riseproject.gitlab.io/python/wheel_builder/`, 88 packages) does not list OpenTelemetry. None of the 6 `riseproject-dev` GitHub repos (`riscv-runner`, `riscv-runner-sample`, `python-wheels`, `python-wheels-dashboard`, `board-farm`, `sw-ecosystem`) has a dedicated OpenTelemetry project or README mention.

**Incidental downstream exposure (all within `riseproject-dev/python-wheels`, all by contributor luhenry):**

| PR | Package | Merged | OpenTelemetry role |
|---|---|---|---|
| [#2422](https://github.com/riseproject-dev/python-wheels/pull/2422) | grpcio-observability 1.83.1 | 2026-09-28 | Compiles gRPC's OpenTelemetry observability plugin (`grpc_observability._cyobservability`) directly for riscv64 - the closest real RISE-adjacent connection found |
| [#930](https://github.com/riseproject-dev/python-wheels/pull/930) | daft 0.7.24 | 2026-09-06 | `opentelemetry` is one of roughly 50 Rust crates in Daft's internal workspace |
| [#469](https://github.com/riseproject-dev/python-wheels/pull/469) | deltalake | 2026-08-27 | `opentelemetry-{api,sdk}` added only as a test-suite dependency |
| [#294](https://github.com/riseproject-dev/python-wheels/pull/294) | pyarrow | 2026-08-27 | OpenTelemetry explicitly listed as a feature left OFF/disabled for the riscv64 build, "to be enabled incrementally later" |

No RISE-funded project, working-group project (RP-series), or hardware-in-the-loop test is dedicated to OpenTelemetry. RISE Runners are used only generically by the python-wheels builds above, which happen to transitively touch OpenTelemetry crates.

## 11. Known Bugs and Active Issues

**OpenTelemetry-project riscv64 bugs:** none open. Searching "riscv" / "riscv64" across every OTel org repository's issue tracker returns only automated dependency-bump PRs and the closed enhancement/platform-support items below - no open correctness or performance bug is riscv64-specific.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [go#78161](https://github.com/golang/go/issues/78161) | Memory corruption / inlining miscompile on riscv64 | Open, "help wanted" | Critical | Any Go binary on riscv64 is potentially affected; no OTel-specific confirmation of a trigger |
| [go#74683](https://github.com/golang/go/issues/74683) | FIPS+PIE broken on riscv64 | Open | High | Affects FIPS-compliance-requiring deployments |
| [go#79275](https://github.com/golang/go/issues/79275) | J-type relocation overflow | Open | High | Linker-level; could affect large Go binaries such as otelcol-contrib |
| n/a | Go upstream riscv64 CI builder hardware (3 of 4 reportedly broken) | Open | Medium | Reduces upstream detection of riscv64 regressions in the Go toolchain itself |
| n/a | glibc < 2.42 crash-class bugs (IFUNC gp-pointer SIGSEGV, hwprobe prototype) | Fixed in 2.42 | High | Ubuntu 24.04 ships 2.39; affected deployments exist |
| [opentelemetry-go #8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126) | Cross-build CI proposal including riscv64 | Open, blocked on #8120 | n/a (infra) | No merged workflow as of this research |

**Documented functional limitation (not tracked as a bug):** OBI's eBPF auto-instrumentation receiver does not activate on riscv64 - it registers but silently no-ops, per `OBI_RECEIVER.md` and the `//go:build linux && (amd64 || arm64)` tag. No open issue specifically tracks adding riscv64 to OBI in `opentelemetry-ebpf-instrumentation` (that repo's issue search hit a GitHub API rate limit during this research and was not fully queried - worth a follow-up check).

**Post-merge regressions caught and fixed (CI/release pipeline, not product bugs):**
- Telemetrygen Docker build failure after #41496 (2025-07-24/25), reverted via [#41558](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41558) and corrected same day via [#41560](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41560).
- Kubernetes release-pipeline gap after #969 (2025-08-07), fixed same day via [#1090](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/1090).
- `docker/setup-qemu-action` silently dropping riscv64 from its default platform list (2026-03), fixed via [#14777](https://github.com/open-telemetry/opentelemetry-collector/pull/14777).

## 12. Objections and Upstream Blockers

**Blocker: no runtime testing.** Tier 3 means OTel runs zero tests on riscv64. Open Go-toolchain-level bugs (go#78161, go#74683, go#79275) represent risk not caught by current CI. A production riscv64 deployment runs on cross-compiled, never-executed-in-CI binaries.

**Blocker: single point of failure.** All substantive riscv64 work across three repos, plus the subsequent QEMU-regression fix, traces to one community contributor (shanduur) with no declared corporate or RISE Project sponsorship. There is no redundancy; if this contributor becomes inactive, riscv64 CI maintenance falls to whoever happens to notice a failure.

**Blocker: PR-level CI gap in collector-contrib.** The riscv64 cross-compile job fires only on full CI runs (push/merge or the `ci:full` label), not on standard pull requests. Regressions can land on main undetected until the next full run or release.

**Blocker: eBPF instrumentation (OBI) is out of scope.** For deployments requiring zero-code auto-instrumentation - OBI's core value proposition - riscv64 is unsupported with no stated roadmap, despite the underlying Linux kernel eBPF JIT supporting riscv64 since 2019. This is a deliberate OTel project-level scope decision, not a kernel limitation.

**Blocker: C++ SDK has no validated riscv64 build upstream.** opentelemetry-cpp has no riscv64 CI, no toolchain file, and its only non-x86 CI (arm64) is disabled. The riscv64 binaries that do exist (Ubuntu's `opentelemetry-cpp-dev`) are produced entirely by distro infrastructure with no upstream OTel validation. Protocol Buffers' C++ maintainers have separately stated riscv64 is out of their own roadmap, compounding this gap for any C++ exporter relying on protobuf serialization.

**Blocker: opentelemetry-go SDK is not in the compatibility matrix.** Any Go service instrumented directly with the opentelemetry-go SDK (rather than relying on the pre-built collector binary) runs on an architecture the SDK's own maintainers have explicitly declined to certify, pending real CI (#8126, currently blocked).

**Non-blocker: governance receptiveness.** The Tier 3 approval bar is low. PR #13458 demonstrates the standard path: a changelog entry, a community-contact line in `platform-support.md`, and a demonstrated successful build/container-start. No TC vote is required, and the community is not hostile to riscv64 contributions - review friction has been limited to catching build-pipeline correctness gaps, not policy objections.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream

**Justification:** OpenTelemetry's flagship, most-deployed component - the Go-based Collector ecosystem (opentelemetry-collector, opentelemetry-collector-contrib, opentelemetry-collector-releases) - ships riscv64 as an official Tier 3 "guaranteed to build" platform, cross-compiled on x86-64 CI hosts with zero native test execution, per `docs/platform-support.md` and the merged PRs [collector #13458](https://github.com/open-telemetry/opentelemetry-collector/pull/13458), [collector-contrib #41496](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41496) / [#41560](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41560), and [collector-releases #969](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/969) / [#1090](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/1090). Upstream's own GoReleaser pipeline directly publishes riscv64 binaries, .deb/.rpm packages, and Docker images (release_provider: upstream, not a distro or third party). Build-only CI, with no test execution, caps the readiness color at yellow regardless of release availability. OpenTelemetry is an observability/telemetry pipeline, not a performance library, so no optimization-purpose modifier applies and no Optimization level is assigned.

**Pending work that could change the grade:** other core components lag far behind the Collector and would independently rate lower: opentelemetry-go has riscv64 absent from its compatibility matrix (cross-build CI proposed in open issue [#8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126), blocked on unmerged PR #8120; the 2024 PR documenting a one-off passing riscv64 test run, [#5420](https://github.com/open-telemetry/opentelemetry-go/pull/5420), was explicitly rejected by maintainers for lacking CI); opentelemetry-cpp and opentelemetry-rust have no riscv64 CI or toolchain file at all; opentelemetry-ebpf-instrumentation explicitly lists riscv64 as out of scope with no stated roadmap. Within the Collector repos, PR-gated CI still excludes riscv64 in collector-contrib (the cross-compile job runs only on full/merge CI), so regressions can land undetected between releases, and the ecosystem has shown build-pipeline fragility three times in roughly a year (telemetrygen Docker build break, fixed same day; Kubernetes release-pipeline gap, fixed same day; a 2026-03 `docker/setup-qemu-action` upgrade silently dropping riscv64, requiring a fix). All of this has been carried by a single community contributor (shanduur/Mateusz Urbanek) with no declared corporate or RISE Project sponsorship - a change in that single contributor's availability, or a corporate/RISE sponsor stepping in to fund continuous riscv64 hardware-in-the-loop testing for the Collector (which would unlock a Tier 2-equivalent bar) or CI for opentelemetry-go, would be the most direct path to a grade change.

## 14. Investment Analysis

RISE has not funded or sponsored any OpenTelemetry-specific work (Section 10); none of the following sizing assumes credit for RISE involvement that does not exist. The only RISE-adjacent touchpoints found are incidental build-dependency exposure inside `riseproject-dev/python-wheels` (Section 10), which does not advance OpenTelemetry's own riscv64 readiness.

### 14.1 Functional Enablement

The collector binary is functional on riscv64 today for all use cases that do not require OBI's eBPF auto-instrumentation. Enabling eBPF instrumentation on riscv64 requires implementing a `support_riscv64.go` and new eBPF uprobe infrastructure in `opentelemetry-ebpf-instrumentation`; the Linux kernel BPF JIT on riscv64 is already functional and is not a blocker. This is a non-trivial, architecture-specific engineering effort, not a build-flag change.

### 14.2 Performance Optimization

No baseline performance data exists for OpenTelemetry on riscv64 anywhere. The collector is pure Go with no architecture-specific optimization on any platform, and the goreleaser build uses no `GORISCV64` tuning flag (baseline ISA only, no RVV). Establishing a baseline would require original benchmark work: trace/metric/log pipeline throughput, latency, and CPU overhead on riscv64 hardware, compared against equivalent arm64/amd64 hardware. **Data not available** for any starting point; this would be ground-up work.

### 14.3 CI/CD Infrastructure

Recommended, in priority order:
- Add riscv64 to the PR-gated `cross-compile-pr` job in collector-contrib (currently amd64/arm64 only) to close the undetected-regression window - a small, low-risk CI config change.
- Pursue native riscv64 runner access (e.g., RISE RISC-V Runners, or equivalent sponsored hardware) to enable actual test execution on riscv64 for the Collector, moving it toward a Tier 2-equivalent validation bar.
- Monitor and harden the multi-arch Docker/QEMU pipeline, which has already broken silently once (the 2026-03 `setup-qemu-action` regression); add an explicit riscv64 image-smoke-test step so a dropped platform is caught automatically rather than by a single contributor noticing.

### 14.4 Ecosystem Enablement

Two highest-leverage gaps beyond the Collector itself:
1. **opentelemetry-go compatibility-matrix inclusion**, which requires real CI infrastructure providing native (or credibly continuous cross-build) riscv64 test execution - the proposed cross-build workflow (#8126) is a partial step but does not by itself satisfy the maintainers' stated bar (continuous CI plus broader-than-one-contributor backing), per their rejection rationale on PR #5420.
2. **opentelemetry-cpp riscv64 validation**, requiring a riscv64 cross-compilation toolchain file and at minimum a CI build job; the fact that the project's own arm64 CI has been disabled since 2024-11-06 for lack of runners suggests limited internal capacity for non-x86 CI, meaning external contribution and/or runner sponsorship would be required to make progress here.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 support to opentelemetry-ebpf-instrumentation (uprobe infrastructure, support_riscv64.go, eBPF plumbing) | Data not available: no prior estimate found in upstream sources | External contributor or sponsoring company | High |
| Functional | Validate opentelemetry-cpp cross-compilation for riscv64; provide toolchain file; document build instructions | 1-2 | External contributor | Medium |
| CI/CD | Add riscv64 to the PR-gated cross-compile job in collector-contrib (currently fires only on full CI runs) | less than 1 | shanduur or maintainers | High |
| CI/CD | Provision native riscv64 runners for opentelemetry-go and Collector test execution | 2-4 (infra procurement and integration) | Sponsoring company or CNCF infra | Medium |
| CI/CD | Add opentelemetry-go cross-build CI workflow (issue #8126, blocked on PR #8120) | less than 1 (after unblocking #8120) | pancsta or maintainers | Medium |
| CI/CD | Add an automated riscv64 image smoke test to the Docker/QEMU release pipeline to catch silent platform drops | less than 1 | shanduur or maintainers | Medium |
| Ecosystem | Submit opentelemetry-go to the compatibility matrix once continuous CI is established | less than 1 | External contributor | Medium |
| Ecosystem | Publish riscv64 baseline benchmarks (Collector pipeline throughput, trace overhead) | 2-4 | External contributor | Low |
| Ecosystem | Add opentelemetry-cpp riscv64 CI runner; re-enable arm64 CI (disabled 2024-11-06) as a prerequisite | 2-4 | Sponsoring company | Low |

## 15. References

- [opentelemetry-collector-releases #968](https://github.com/open-telemetry/opentelemetry-collector-releases/issues/968) - original riscv64 feature request for collector-releases
- [opentelemetry-collector-releases #969](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/969) - Add riscv64 arch (merged 2025-08-07)
- [opentelemetry-collector-releases #1089](https://github.com/open-telemetry/opentelemetry-collector-releases/issues/1089) - Nightly Release Failed (auto-filed, root cause of #1090)
- [opentelemetry-collector-releases #1090](https://github.com/open-telemetry/opentelemetry-collector-releases/pull/1090) - fix: add riscv64 to k8s release pipeline (merged 2025-08-07)
- [opentelemetry-collector #13226](https://github.com/open-telemetry/opentelemetry-collector/issues/13226) - master tracking issue, "[arch] New Tier 3 architecture - linux/riscv64"
- [opentelemetry-collector #13458](https://github.com/open-telemetry/opentelemetry-collector/pull/13458) - Add riscv64 arch (merged 2025-07-25)
- [opentelemetry-collector #13462](https://github.com/open-telemetry/opentelemetry-collector/issues/13462) - Add RISC-V (riscv64) Support to OpenTelemetry Collector
- [opentelemetry-collector #14777](https://github.com/open-telemetry/opentelemetry-collector/pull/14777) - fix: add missing platforms to setup-qemu-action (merged 2026-03-17)
- [opentelemetry-collector-contrib #41496](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41496) - Add riscv64 arch (merged 2025-07-24)
- [opentelemetry-collector-contrib #41507](https://github.com/open-telemetry/opentelemetry-collector-contrib/issues/41507) - Add RISC-V (riscv64) Support to OpenTelemetry Collector Contrib
- [opentelemetry-collector-contrib #41558](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41558) - Revert "Add riscv64 arch" (release blocker, merged then superseded)
- [opentelemetry-collector-contrib #41560](https://github.com/open-telemetry/opentelemetry-collector-contrib/pull/41560) - Missing RISC-V binaries (merged 2025-07-25)
- [opentelemetry-go #5420](https://github.com/open-telemetry/opentelemetry-go/pull/5420) - doc: add riscv64 notes (closed/rejected, 2024)
- [opentelemetry-go #8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126) - ci: add cross-build workflow including riscv64 (open, blocked)
- [opentelemetry-go #8120](https://github.com/open-telemetry/opentelemetry-go/pull/8120) - fix: use default dialer for OTLP http exporter in WASM (blocker for #8126)
- [go#78161](https://github.com/golang/go/issues/78161) - memory corruption / inlining miscompile on riscv64
- [go#74683](https://github.com/golang/go/issues/74683) - FIPS+PIE broken on riscv64
- [go#79275](https://github.com/golang/go/issues/79275) - J-type relocation overflow on riscv64
- [opentelemetry-collector platform support documentation](https://github.com/open-telemetry/opentelemetry-collector/blob/main/docs/platform-support.md)
- [opentelemetry-collector build-and-test.yml](https://github.com/open-telemetry/opentelemetry-collector/blob/main/.github/workflows/build-and-test.yml)
- [opentelemetry-collector-contrib build-and-test.yml](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/.github/workflows/build-and-test.yml)
- [opentelemetry-collector-releases CONTRIBUTING.md](https://github.com/open-telemetry/opentelemetry-collector-releases/blob/main/CONTRIBUTING.md)
- [Ubuntu 26.04 (resolute) package search: OpenTelemetry](https://packages.ubuntu.com/search?keywords=OpenTelemetry&suite=resolute&searchon=names&section=all)
- [Ubuntu 26.04 python3-opentelemetry-api package detail](https://packages.ubuntu.com/resolute/python3-opentelemetry-api)
- [Debian buildd opentelemetry-cpp riscv64](https://buildd.debian.org/status/package.php?p=opentelemetry-cpp&suite=sid)
- [PyPI opentelemetry-api release files](https://pypi.org/pypi/opentelemetry-api/json)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=opentelemetry)
- [RISE Project wheel builder package catalog](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/python-wheels #2422](https://github.com/riseproject-dev/python-wheels/pull/2422) - grpcio-observability 1.83.1 (OpenTelemetry observability plugin)
- [riseproject-dev/python-wheels #930](https://github.com/riseproject-dev/python-wheels/pull/930) - daft 0.7.24
- [riseproject-dev/python-wheels #469](https://github.com/riseproject-dev/python-wheels/pull/469) - deltalake
- [riseproject-dev/python-wheels #294](https://github.com/riseproject-dev/python-wheels/pull/294) - pyarrow (OpenTelemetry disabled for riscv64 build)
- [RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)