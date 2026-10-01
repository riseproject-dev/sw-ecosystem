---
title: Prometheus
parent: Project Reports
color: yellow
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: promu
    relation: build-dependency
    criticality: critical
  - name: Node.js
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: build-dependency
    criticality: optional
  - name: golang.org/x/crypto
    relation: runtime-dependency
    criticality: optional
  - name: cespare/xxhash
    relation: runtime-dependency
    criticality: optional
  - name: klauspost/compress
    relation: runtime-dependency
    criticality: optional
  - name: golang/snappy
    relation: runtime-dependency
    criticality: optional
  - name: pprof
    relation: runtime-dependency
    criticality: optional
  - name: prometheus/procfs
    relation: runtime-dependency
    criticality: critical
  - name: prometheus/client_golang
    relation: runtime-dependency
    criticality: critical
  - name: edsrzf/mmap-go
    relation: runtime-dependency
    criticality: critical
  - name: grafana/regexp
    relation: runtime-dependency
    criticality: optional
  - name: gRPC-Go
    relation: runtime-dependency
    criticality: critical
  - name: automaxprocs
    relation: runtime-dependency
    criticality: optional
  - name: automemlimit
    relation: runtime-dependency
    criticality: optional
  - name: dennwc/varint
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="prometheus" %}

# Prometheus

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Prometheus<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[Prometheus](https://prometheus.io/) ([github.com/prometheus/prometheus](https://github.com/prometheus/prometheus)) is an open-source systems monitoring and alerting toolkit originally built at SoundCloud. It is written entirely in Go, uses a scrape-pull model, and stores time-series data in a custom on-disk database (TSDB). It is the canonical monitoring backend in cloud-native deployments.

**Governance:** Prometheus is a [CNCF graduated project](https://www.cncf.io/projects/prometheus/), the second project to reach graduation after Kubernetes, and operates under The Linux Foundation via the CNCF. Licensing is Apache 2.0 (the Linux Foundation holds certain Prometheus trademarks). Governance is documented at prometheus.io/governance/: a 7-seat Steering Committee (staggered 2-year terms, annual elections) oversees bylaws, GitHub org administration, and financial planning. Below it sits a 3-tier contributor ladder (Contributor, Member, Maintainer), tracked per-repo via `MAINTAINERS.md`/`CODEOWNERS`. Decisions default to consensus, falling back to majority vote among Steering Committee members; inactive members (no contributions for 6+ months, or fewer than 20 contributions/year) can be removed by majority vote. The current Steering Committee: Arthur Sens (Grafana Labs), Bartlomiej Plotka (Google), Ben Kochie (independent), Bryan Boreham (Grafana Labs), Jan Fajerski (Red Hat), Kemal Akkoyun (Datadog), Solomon Jacobs (Checkmk GmbH). Seats are held by individuals, not companies.

**Corporate sponsorship:** Grafana Labs is by far the dominant corporate sponsor of maintainer time. General maintainers per `MAINTAINERS.md`: Bryan Boreham (Grafana Labs), Ayoub Mrini, Julien Pivotto (independent), Gyorgy Krajcsovits (Grafana Labs), Bartlomiej Plotka (Google), Arve Knudsen. Subsystem maintainers skew heavily Grafana-affiliated (Jesus Vazquez, Ganesh Vernekar, Arthur Silva Sens, Kyle Eckhart, and v3 release coordinators Carrie Edwards, Fiona Liao, Nico Pazos, Owen Williams, Jan Fajerski, Tom Braack). Other employers represented among area maintainers: Hetzner Cloud (Jonas Lammler, Julian Tolle), Scaleway (Remy Leone), STACKIT (Jan-Otto Kropke). Google, Red Hat, Datadog, Checkmk, Hetzner, and Scaleway are also represented but at lower density than Grafana Labs.

**RISE membership:** No evidence was found that Prometheus is a RISE member project or that RISE has funded Prometheus-specific work. A site search of riseproject.dev for "Prometheus" returns zero results; a review of the 7 most recent RISE blog posts (through 2026-09-28) contains no mention of Prometheus; the riseproject-dev GitHub org (52 repos) contains no Prometheus repo; and the RISE Python wheel builder (riseproject.gitlab.io/python/wheel_builder/, 80+ packages) does not list Prometheus. RISE's 20-member roster (8 Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; 12 General, including ISCAS) does not include Prometheus as an entity (it is a software project, not a RISE member company). One contributor to the riscv64 Docker-image PR, co-author nijincheng@iscas.ac.cn, is affiliated with the Institute of Software Chinese Academy of Sciences (ISCAS), a RISE General Member, but this is an individual contribution, not an institutional RISE engagement.

**Language:** Pure Go. No C, no assembly, no CGO, no JIT backend, no SIMD dispatch of its own.

## 2. Port History and Upstreaming Timeline

| Date | Event | Primary Source |
|---|---|---|
| 2019-05-31 | [PR #5621](https://github.com/prometheus/prometheus/pull/5621) ("Riscv support") opened by carlosedp, patching Utsname string conversions for a pre-upstream experimental Go-RISCV toolchain fork. | PR #5621 |
| 2019-08-21 | [PR #5625](https://github.com/prometheus/prometheus/pull/5625) ("pkg/runtime: simplify Utsname string conversion") merged, switching Utsname handling to `golang.org/x/sys/unix`'s portable byte-array representation, removing the need for any RISC-V-specific patch. | PR #5625 |
| 2019-09-02 | PR #5621 closed by its author as unnecessary, confirming `make build` succeeded from master without the patch once mainline Go/`x/sys` gained native riscv64 support. | PR #5621 discussion |
| 2023-07-06 | [PR #12530](https://github.com/prometheus/prometheus/pull/12530) ("Update promu") merged (author Ben Kochie/SuperQ, merged by Julien Pivotto). Bumped the `promu` build tool to add riscv64 to its default crossbuild platform list, with no Prometheus code changes required. Commit: [4edf8999](https://github.com/prometheus/prometheus/commit/4edf8999da266339c0a27172976de5fd0de53596) ("Update promu to support riscv64"). | PR #12530 |
| 2023-07-25 | v2.46.0 released, the first release to include `prometheus-2.46.0.linux-riscv64.tar.gz` as a GitHub Release asset. v2.45.0 (2023-06-23) did not include this asset. | GitHub Releases |
| 2025-11-08 | [PR #17508](https://github.com/prometheus/prometheus/pull/17508) ("Build riscv64 docker image by default") opened by ffgan, co-authored with nijincheng@iscas.ac.cn and Ben Kochie. Adds riscv64 to the default Docker build/publish pipeline (`Makefile.common` `DOCKER_ARCHS`), mirroring the existing s390x pattern; riscv64 was already in promu's default crossbuild list and Prometheus already cross-compiled cleanly for it, so this PR only turns on image *publishing*. Commit: [90166d3d](https://github.com/prometheus/prometheus/commit/90166d3ddb0be9986f5d32a35379d7b35a7636c2). | PR #17508 |
| 2026-01-19 | [PR #17876](https://github.com/prometheus/prometheus/pull/17876) ("Add distroless Docker image variant") merged. Post-merge it was discovered that `gcr.io/distroless/static-debian13:nonroot-riscv64` did not exist, blocking the v3.10 release. | PR #17876 |
| 2026-02-10 | PR #17508 merged by George Krajcsovits (Grafana). riscv64 added to the default Docker build pipeline. | PR #17508 |
| 2026-02-18/19 | [PR #18115](https://github.com/prometheus/prometheus/pull/18115) ("Cut v3.10.0-rc.1", branch `codesome/distroless-riscv64`) opened by Ganesh Vernekar (codesome) to remove riscv64 from the build process and unblock the release. Discussion: SuperQ wanted the fix centralized in `Makefile.common`; Plotka raised a "do it right vs. ship now" tradeoff; Pivotto accepted either this PR or the alternative, [PR #18110](https://github.com/prometheus/prometheus/pull/18110). codesome ultimately merged #18110 and repurposed #18115 into simply cutting the v3.10.0-rc.1 release candidate (merged 2026-02-19). | PR #18115, #18110 |
| 2026-02-19 | [PR #18110](https://github.com/prometheus/prometheus/pull/18110) ("chore: Exclude riscv64 from distroless images", branch `roidelapluie/riskv64`) merged into `release-3.10` by Julien Pivotto. Body: "Upstream distroless does not support riskv64 yet." Adds `DOCKERFILE_ARCH_EXCLUSIONS ?= Dockerfile.distroless:riscv64`. SuperQ asked for this to live in `Makefile.common` since "we will probably be doing this in several downstream repos"; codesome merged anyway to unblock the release, deferring the refactor to a follow-up. | PR #18110 |
| 2026-02-20 | [Issue #18123](https://github.com/prometheus/prometheus/issues/18123) ("s390x is not pushed to quay.io because quay does not support ris[c]v64") opened and closed same day by Julien Pivotto. Once riscv64 image publishing went live, quay.io rejected pushes with "unauthorized," which blocked the entire multi-arch manifest (including s390x) from reaching quay.io; only Docker Hub carried the full architecture set. | Issue #18123 |
| 2026-02-20 | [PR #18124](https://github.com/prometheus/prometheus/pull/18124) ("chore(ci): Add registry-specific architecture exclusions") merged same day by Julien Pivotto. Introduces `DOCKER_REGISTRY_ARCH_EXCLUSIONS` and a `registry_arch_is_excluded` function so riscv64 is skipped on quay.io specifically while continuing to publish to docker.io, keeping other architectures (e.g. s390x) in the quay.io manifest. Approved by Plotka ("Thanks!"). Commit: [6acbd1aa](https://github.com/prometheus/prometheus/commit/6acbd1aa42131c7fcd22b84dc05cca9a1995fbb8). | PR #18124 |
| 2026-02-24/26 | v3.10.0 released, the first stable release with linux/riscv64 Docker images (to docker.io; quay.io still excluded). | GitHub Releases |
| 2026-04-16 | [PR #18527](https://github.com/prometheus/prometheus/pull/18527) ("Fix quay.io riscv64 publishing", branch `superq/quay_riscv`) merged same day by Ben Kochie. Root cause of the #18123 "unauthorized" error: quay.io requires manual per-architecture repository creation, and nobody had created one for riscv64. No code change was required beyond creating the repository; reviewer Pivotto's comment was simply "what x)". Commit: [a2e00013](https://github.com/prometheus/prometheus/commit/a2e000133bf29343235c9699bffab1ebc1d08ab2). | PR #18527 |
| 2026-04-20 | [PR #18548](https://github.com/prometheus/prometheus/pull/18548) ("build: remove DOCKER_REGISTRY_ARCH_EXCLUSIONS and DOCKERFILE_ARCH_EXCLUSIONS logic") merged same day by Julien Pivotto, with SuperQ's approval. Two commits close the loop: `7f31983` removes `DOCKER_REGISTRY_ARCH_EXCLUSIONS` ("registry misconfiguration issues have been fixed," i.e. #18527 created the quay.io repo), and `dd03bb4` removes `DOCKERFILE_ARCH_EXCLUSIONS` ("Upstream distroless now supports all architectures," resolving the #18110 blocker). This marks the formal end of the riscv64 Docker-publishing rollout. | PR #18548 |

**Summary:** The riscv64 binary port required zero architecture-specific code changes to Prometheus itself; enablement was a pure build-tooling event (promu's platform list). Docker image support took roughly five months of additional infrastructure work after PR #17508 (November 2025 to April 2026), driven entirely by registry-configuration problems (missing distroless riscv64 variant, missing quay.io repository) rather than anything in the Prometheus codebase. As of PR #18548 (2026-04-20), both workarounds have been removed and riscv64 image/binary publishing is stable with no open exclusions.

## 3. Upstream Support Tier

Prometheus publishes no formal platform-tier policy. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists in the repository. A reviewer on PR #17508 summarized the de facto stance: "Prometheus itself has good support for riscv64, so it's normal to successfully cross-compile the results here" - new ports are accepted pragmatically once the underlying Go toolchain and `promu` support the target, rather than through a formal RFC or tier process. riscv64 is treated the same as other secondary architectures (s390x, mips, ppc64) in this regard.

**De facto binary tier:** riscv64 is a first-class release artifact. `prometheus-X.Y.Z.linux-riscv64.tar.gz` has appeared in every release from v2.46.0 (July 2023) through the current stable, confirmed via direct asset-list checks on v3.1.0, v3.15.0, and others; v2.45.0 (June 2023) is confirmed absent.

**De facto Docker tier:** riscv64 Docker images are built and published to docker.io by default since v3.10.0 (February 2026), and to quay.io since PR #18527 (April 2026). The authoritative platform list is `DOCKER_ARCHS ?= amd64 arm64 armv7 ppc64le riscv64 s390x` in `Makefile.common`.

**De facto test tier:** riscv64 receives no test execution anywhere in CI. All test jobs run on `ubuntu-latest` (x86_64) GitHub-hosted runners. There is no QEMU-based riscv64 test, no native riscv64 runner, and no `GOARCH=riscv64` test invocation anywhere in the CI configuration.

**PR CI tier:** riscv64 is explicitly excluded from the PR-triggered `build` job. `.github/workflows/ci.yml`'s `build` job specifies `promu_opts: "-p linux/amd64 -p windows/amd64 -p linux/arm64 -p darwin/amd64 -p darwin/arm64 -p linux/386"`; riscv64 is not in this list and is not cross-compiled on ordinary pull-request CI runs. A repo-wide grep of `.github/workflows/` across all 15 workflow files confirms zero matches for "riscv" anywhere.

**Comparison table:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PR build job (`build`) | Yes | Yes | No |
| `build_all` crossbuild (main/tags) | Yes | Yes | Yes |
| Test execution in CI | Yes (native) | No (cross-build only, no QEMU test confirmed) | No |
| GitHub Release binary | Yes | Yes | Yes (since v2.46.0) |
| Docker Hub image | Yes | Yes | Yes (since v3.10.0) |
| quay.io image | Yes | Yes | Yes (since PR #18527, April 2026) |
| Distro packages (Debian/Ubuntu) | Yes | Yes | Yes |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Prometheus is a pure-Go application with no architecture-specific code paths anywhere in the repository. This was independently verified three times across this research: via GitHub code search for `#ifdef __riscv`, `filename:*_riscv64.go`, `filename:*_amd64.go`, `filename:*_arm64.go`, `"go:build amd64"`, `extension:s` (assembly), and `GOARCH riscv64` (all zero hits except the three non-code matches below); via a direct local grep of a cloned working copy; and via the dependency-level analysis in Section 9.

**The only three repo-wide matches for "riscv64"** are not source code:
1. `Makefile.common` line 93: `DOCKER_ARCHS ?= amd64 arm64 armv7 ppc64le riscv64 s390x` - the Docker multi-arch build/push target list (PR #17508's actual change).
2. `.dockerignore`: `!.build/linux-riscv64/` - a build-output-directory exclusion pattern.
3. `web/ui/pnpm-lock.yaml`: transitive npm lockfile entries for optional native binaries of frontend build tools (`@rollup/rollup-linux-riscv64-musl`, `@unrs/resolver-binding-linux-riscv64-musl`) - third-party JS tooling for the React UI build step, not Prometheus runtime code.

The `tsdb/fileutil/` directory contains files with misleading names (`mmap_amd64.go`, `mmap_arm64.go`, `mmap_386.go`); all three carry the build constraint `//go:build windows` and contain only a `maxMapSize` constant - they are Windows-specific, not architecture-specific. The actual mmap implementation (`mmap_unix.go`, build tag `!windows && !plan9 && !js`) covers riscv64/linux without modification.

**Full inventory of build-tagged files and riscv64 coverage:**

| File | Build Constraint | riscv64 Coverage |
|---|---|---|
| `tsdb/fileutil/mmap_unix.go` | `!windows && !plan9 && !js` | Covered |
| `tsdb/fileutil/direct_io_linux.go` | `linux && !forcedirectio` | Covered |
| `util/runtime/statfs_default.go` | `!windows && !openbsd && !netbsd && !solaris && !386` | Covered |
| `util/runtime/uname_linux.go` | linux, no arch constraint | Covered |
| `util/runtime/limits_default.go` | `!windows` | Covered |
| `tsdb/fileutil/mmap_amd64.go` | `windows` | Not applicable (Windows-only constant) |
| `tsdb/fileutil/mmap_arm64.go` | `windows` | Not applicable (Windows-only constant) |
| `tsdb/fileutil/mmap_386.go` | `windows` | Not applicable (Windows-only constant) |

No `.s` assembly files exist anywhere in the repository. No CGO usage exists in `go.mod` or source. No arch-tagged Go files (`_riscv64.go`, `_amd64.go`) exist for application logic.

**Subsystem assessment:**

| Subsystem | riscv64 Status | Notes |
|---|---|---|
| TSDB storage engine | Scalar / full parity | Pure Go; mmap via `golang.org/x/sys/unix` (arch-agnostic) |
| PromQL engine | Scalar / full parity | Pure Go interpreter; no vectorized evaluation |
| Scrape engine | Scalar / full parity | Pure Go HTTP client |
| Remote write | Scalar / full parity | Pure Go gRPC/HTTP |
| WAL (write-ahead log) | Scalar / full parity | Pure Go; mmap via `unix.Mmap` |
| Uname/sysinfo | Scalar / full parity | `golang.org/x/sys/unix.ByteSliceToString` |
| Web UI binary embedding | Scalar / full parity | `builtinassets` build tag; compiled from pre-built React assets |

On the hand-tuned/intrinsics/scalar/missing scale this section asks about, every Prometheus-authored subsystem is "scalar, full parity" because none of amd64, arm64, or riscv64 has an architecture-specific implementation in this codebase at all - the comparison is not meaningful at the application layer. The architecture-specific gaps that do exist live one layer down, in dependencies (Section 9).

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Prometheus uses [promu](https://github.com/prometheus/promu) as its primary build tool, wrapping `go build` with injected ldflags for version metadata. There is no CMake, autoconf, or Meson, and no `-D`-style build flags. `promu` is pinned via `PROMU_VERSION` in `Makefile.common`.

**Toolchain requirements for riscv64:**

| Component | Version / Source | Why Needed |
|---|---|---|
| Go | `go 1.26.7` minimum per `go.mod`; `.promu.yml` pins `go: version: 1.27` for release builds | GOARCH=riscv64 has been supported by the Go toolchain since Go 1.14; no Prometheus-side version floor is riscv64-specific |
| CGO | Not required | Builds use `CGO_ENABLED=0` with the `netgo` build tag; Go's native cross-compiler handles riscv64 directly |
| GCC / Clang cross-compiler | Not required | Only needed if CGO were enabled; it is not |
| promu | Pinned in `Makefile.common` | riscv64 has been in promu's default crossbuild platform list since PR #12530 (2023-07-06) |
| Node.js / pnpm | Per `web/ui/.nvmrc`; npm >= 10 | Only for `make assets` (React UI asset pre-compilation); irrelevant to the riscv64 backend binary itself, but see the known limitation below |
| QEMU | `docker/setup-qemu-action` | Used only for Docker multi-platform image builds when `enable_docker_multibuild: true` is set; not used for binary cross-compilation (Go cross-compiles natively) and not used for any test execution |

**Exact commands to cross-build for riscv64** (from the repository's own README "Building the Docker image" section):

```
git clone https://github.com/prometheus/prometheus.git
cd prometheus
make promu
promu crossbuild -p linux/riscv64
make common-docker-riscv64
```

Direct `go build` equivalent:

```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build \
  -tags "netgo builtinassets" \
  -ldflags "-X github.com/prometheus/common/version.Version=$(cat VERSION) ..." \
  ./cmd/prometheus ./cmd/promtool
```

riscv64 is not listed in `.promu.yml`'s `crossbuild.platforms` section (which lists OS families, not architectures); it is included via promu's internal default architecture list.

**Known build limitation - Node.js on native riscv64 hardware:** PR #17508 explicitly notes that "Node.js currently does not officially support riscv64, which could lead to problems such as illegal instructions" when running `make build` natively on riscv64 hardware. The `make assets` step (React UI compilation via Node.js/pnpm) is the failure point; the author treated this as out of scope. The workaround is to cross-compile from an x86 or arm64 host, which is how all official riscv64 release artifacts are produced. This limitation does not affect downloaded binaries (assets are pre-compiled and embedded) but it does block native `make build` on riscv64 hardware, and it is the same root cause behind the Arch Linux RISC-V `sv39-blacklist` entry for `prometheus` (Section 8).

**Build tags of note:** `netgo` (pure-Go net stack, no CGO libc resolver dependency), `builtinassets` (embeds pre-compiled React UI into the binary), `remove_all_sd` (strips optional service-discovery backends, retaining file_sd/static_sd/http_sd), and `enable_<name>_sd` (re-enables a specific service-discovery module). A minimal riscv64 binary: `go build -tags "netgo builtinassets remove_all_sd" ./cmd/prometheus`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because Prometheus has no architecture-specific application code, the feature gap between riscv64, arm64, and amd64 is zero at the application level - every feature available on amd64 is available on riscv64. The gaps that exist are all at the dependency layer (performance, not functionality):

| Layer | amd64 | arm64 | riscv64 | Impact on Prometheus |
|---|---|---|---|---|
| AES-GCM (TLS) | Hardware intrinsics (`golang.org/x/crypto`) | Hardware intrinsics | Pure-Go fallback | Materially slower TLS throughput on riscv64 for HTTPS scraping at high cardinality |
| ChaCha20-Poly1305 (TLS) | Hardware intrinsics | Hardware intrinsics | Pure-Go fallback | Same as above |
| SHA-256/SHA-512 | Hardware intrinsics | Hardware intrinsics | Pure-Go fallback | Minor; affects TLS certificate verification |
| xxhash (TSDB label hashing) | Hand-written asm | Hand-written asm | Pure-Go (`xxhash_other.go`, build tag `!amd64,!arm64`) | Slower label fingerprinting at high series cardinality |
| zstd (remote-write compression) | AVX2-accelerated (`klauspost/compress`) | NEON-accelerated | Pure-Go | Throughput reduction on high-volume remote-write paths |
| Snappy (remote-write legacy) | Pure-Go (`golang/snappy`) | Pure-Go | Pure-Go | No gap |
| PromQL execution | Pure-Go | Pure-Go | Pure-Go | No gap |
| TSDB chunk encoding | Pure-Go | Pure-Go | Pure-Go | No gap |

Data not available: published, quantified benchmark figures isolating these throughput deltas for Prometheus specifically on riscv64 hardware. No search (GitHub issues/PRs across the Prometheus org, web search for "Prometheus riscv64 benchmark," RISE blog) produced any such figures; the gaps above are inferred from dependency-level findings, not from Prometheus-specific profiling.

**Security hardening:** The Go race detector does not support riscv64 under the current Go toolchain, so riscv64 builds cannot be tested with `-race`. FIPS140 mode combined with `-buildmode=pie` is broken on riscv64 in the Go toolchain itself ([golang/go#74683](https://github.com/golang/go/issues/74683), open), which would block a Prometheus build in a FIPS-enforcing environment (e.g. RHEL 9 FIPS mode) on riscv64.

**NaN / floating-point semantics:** No RISC-V-specific NaN or floating-point correctness issue was found anywhere in the Prometheus org's repositories (`prometheus/prometheus`, `prometheus/node_exporter`, `prometheus/procfs`).

## 7. CI/CD Infrastructure

Prometheus uses GitHub Actions exclusively; no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository (confirmed by repo-wide GitHub code search for each filename, zero results). 15 workflow files exist in `.github/workflows/`: `ci.yml`, `buf.yml`, `buf-lint.yml`, `lock.yml`, `stale.yml`, `fuzzing.yml`, `repo_sync.yml`, `prombench.yml`, `scorecards.yml`, `govulncheck.yml`, `codeql-analysis.yml`, `approve-workflows.yml`, `check_release_notes.yml`, `automerge-dependabot.yml`, `container_description.yml`. A direct read of `ci.yml` in full (487 lines), cross-checked against a repo-wide case-insensitive grep for "riscv," confirms zero matches anywhere in `.github/workflows/`.

**`build` job** (the job that actually runs on pull requests): `promu_opts: "-p linux/amd64 -p windows/amd64 -p linux/arm64 -p darwin/amd64 -p darwin/arm64 -p linux/386"`. riscv64 is absent; it is not even cross-compiled on ordinary PR runs. Runner: `ubuntu-latest` (x86_64).

**`build_all` job:** no `-p` override, so it falls back to promu's default crossbuild platform list, which includes riscv64 (a cross-compilation step, not a test-execution step). Runner: `ubuntu-latest` (x86_64). There is a discrepancy in this research between two independent checks of this job's trigger conditions: one direct read states it runs "only on release tags `v2.*`/`v3.*`, release-branch PRs, or pushes to `main`" (i.e., it does run on some PRs, specifically those targeting `release-*` branches), while the readiness-grading pass characterizes it as running "solely on pushes to `main`/release tags, not on PRs" at all. Both agree on the key fact driving the readiness grade: riscv64 is never cross-compiled, let alone tested, on the ordinary PR-triggered `build` job that gates regular pull requests. [NEEDS VERIFICATION: exact trigger set for `build_all`, specifically whether release-branch PRs are included.]

**Test jobs** (`test_go`, `test_go_more`, `test_go_386`, `test_windows`): all run on `ubuntu-latest` (x86_64). No QEMU emulation, no `GOARCH=riscv64`, no riscv64 test execution of any kind.

**Docker image publishing** (`publish_main`/`publish_release` in `ci.yml`, triggered only on push to `main` or on release tags, never on PRs): these jobs call an external composite action, `prometheus/promci/publish_main` (pinned by SHA), which in turn calls `prometheus/promci-images/publish`, a third, separate repository. A clone of `promci` was grepped directly and also shows zero matches for "riscv" - the riscv64 Docker build is driven by reading `Makefile.common`'s `DOCKER_ARCHS` list inside that external action chain, not by anything spelled out in `prometheus/prometheus`'s own workflow YAML.

**Comparison table:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PR-triggered `build` job | Yes | Yes | No |
| `build_all` crossbuild | Yes | Yes | Yes (build only, no tests) |
| Unit/integration test execution | Yes | No evidence of native arm64 test execution either (cross-build only) | No |
| Docker image publish | Yes | Yes | Yes (via external `promci`/`promci-images` action chain reading `Makefile.common`) |

**RISE runners:** The RISE project operates native riscv64 GitHub Actions runners (Scaleway EM-RV1 hardware). Prometheus has no known integration with them - no open PR or issue in `prometheus/prometheus` requests riscv64 be added to the PR-triggered build job, the test suite, or RISE runner infrastructure.

## 8. Distribution and Release Status

**GitHub Releases (upstream binary tarballs):** `prometheus-X.Y.Z.linux-riscv64.tar.gz` is present in every release from v2.46.0 (2023-07-25) onward, confirmed by a direct, successful download check against v3.15.0 (`prometheus-3.15.0.linux-riscv64.tar.gz`, Content-Length 106,822,592 bytes - a real binary, not a placeholder) and by tag-ancestry checks against a local clone. v2.45.0 (2023-06-23) is confirmed absent. Current stable as of this research includes v3.15.0 (2026-09-24) and v3.12.0 (2026-05-28).

**Docker Hub (docker.io/prom/prometheus):** riscv64 images present on versioned tags from v3.10.0 onward. The v3.12.0 image platform matrix is `linux/amd64`, `linux/arm64`, `linux/arm/v7`, `linux/ppc64le`, `linux/riscv64`, `linux/s390x`. [NEEDS VERIFICATION: whether the `latest` tag (pointing to the busybox variant) carries riscv64 identically to versioned tags - one data source showed 5 architectures without riscv64 for `latest` specifically, though `DOCKER_ARCHS` and PR #17508/#18548 confirm riscv64 is in the default build matrix.]

**quay.io (quay.io/prometheus/prometheus):** Broken for riscv64 from v3.10.0 (February 2026) through PR #18527 (2026-04-16), due to quay.io requiring manual per-architecture repository creation. Fixed by creating the missing repository; no code change required. All releases from v3.12.0 onward (first stable release after the fix, 2026-05-28) publish riscv64 images to quay.io without exclusion, confirmed closed out by PR #18548 (2026-04-20) removing the exclusion logic.

**Debian (tracker.debian.org / buildd):** `prometheus` version 2.53.5+ds1-5 (sid), status "Installed" on riscv64, built by buildd `rv-manda-02`. All mainstream Debian architectures are built: amd64, arm64, armhf, i386, loong64, ppc64el, riscv64, s390x. This Debian version (2.53.x) lags significantly behind upstream (v3.12.0/v3.15.0).

**Ubuntu 24.04 (Noble):** Package `prometheus` 2.45.3+ds-2build1 lists riscv64 alongside amd64, arm64, armhf, ppc64el, s390x. Related packages (prometheus-alertmanager, prometheus-node-exporter, prometheus-pushgateway, prometheus-postgres-exporter) carry the same architecture list.

**Ubuntu 26.04 (resolute):** Package `prometheus` 2.53.5+ds1-3 (section `net`, universe) lists architectures amd64, arm64, armhf, ppc64el, riscv64, s390x, with real package/installed sizes (17,918.9 kB / 88,679.0 kB) confirming a genuine build, not a placeholder entry. The same riscv64 row with real sizes is also present on `noble` (24.04 LTS) and `questing` (25.10), so riscv64 Ubuntu packaging is not a recent or one-off addition.

**Arch Linux RISC-V (archriscv.felixc.at / felixonmars/archriscv-packages):** The `prometheus` package is in `sv39-blacklist.txt` as of [PR #4854](https://github.com/felixonmars/archriscv-packages/pull/4854) ("sv39-blacklist: add prometheus"), merged 2025-08-06. Root cause: a Node.js WebAssembly "Out of memory" error on sv39 virtual-address-space-constrained hardware during the web UI asset build step (the same Node.js limitation noted in Section 5). The package is blacklisted for the most common RISC-V hardware class (sv39, e.g. VisionFive 2, HiFive Unmatched); it may build on sv48/sv57 hardware. The Arch Linux RISC-V mirror's last successful build, `prometheus-2.52.1-1-riscv64.pkg.tar.zst` (2024-06-02), is significantly behind upstream.

**PyPI:** Not applicable. The `prometheus` package on PyPI (last release 0.3.0, source-only sdist, no wheels) is an unrelated, unmaintained Python client library by a different author, not the Go-based Prometheus server. Checking it for riscv64 relevance is a category error; it is noted here only to preempt confusion.

**What a user must do to get a working binary:** On x86_64/arm64/ppc64le/s390x Linux, `apt install prometheus` (Debian/Ubuntu) or download the official `linux-riscv64` tarball from GitHub Releases both work out of the box. On sv39 RISC-V hardware under Arch Linux specifically, the official repository package is unavailable and the user must either use the upstream GitHub tarball directly or build on sv48/sv57 hardware.

**Release status summary:**

| Channel | riscv64 Present | Version | Notes |
|---|---|---|---|
| GitHub upstream releases | Yes | v3.15.0 (current) | Present since v2.46.0 (Jul 2023) |
| Docker Hub | Yes | v3.12.0+ | Since v3.10.0 (Feb 2026) |
| quay.io | Yes | v3.12.0+ | Broken Feb-Apr 2026, fixed by PR #18527 |
| Ubuntu 24.04 / 26.04 | Yes | 2.45.3+ds / 2.53.5+ds1-3 | Listed for riscv64 on both releases |
| Debian sid | Yes | 2.53.5+ds1-5 | "Installed" on riscv64 buildd |
| Arch Linux RISC-V | Partial | 2.52.1-1 | sv39-blacklisted since Aug 2025 |
| PyPI | N/A | N/A | Wrong package; not applicable |

## 9. Dependencies

"riscv64 Build" means: does the module compile cleanly under `GOOS=linux GOARCH=riscv64`? Build-dependencies are tools required to produce the binary/image; runtime-dependencies are Go modules linked into the shipped binary.

| Dependency | Role | riscv64 Build | riscv64 Test CI | riscv64 Release | Notes / Blocking Issues |
|---|---|---|---|---|---|
| Go | Compiler/runtime toolchain (build-dependency, critical) | Supported since Go 1.14 (secondary port) | Community builders only, not GitHub-hosted | N/A | Open: [golang/go#74683](https://github.com/golang/go/issues/74683) FIPS140 broken with `-buildmode=pie` on riscv64. Open: [golang/go#77069](https://github.com/golang/go/issues/77069) crypto P256 mul unoptimized on riscv64. Open: [golang/go#77328](https://github.com/golang/go/issues/77328) Zvkned assembler support missing. |
| promu | Cross-build/release tool (build-dependency, critical) | N/A (build tool) | N/A | N/A | riscv64 added to default crossbuild platform list via PR #12530 (2023-07-06); this is the single event that enabled all subsequent riscv64 binary releases. |
| Node.js | Web UI asset build (build-dependency, critical) | Officially unsupported on riscv64 | N/A | N/A | PR #17508: "Node.js currently does not officially support riscv64, which could lead to problems such as illegal instructions." This blocks native `make build` on riscv64 hardware and is the root cause of the Arch Linux `sv39-blacklist` entry for `prometheus` (PR #4854). Does not affect cross-compiled release binaries, which embed pre-built assets. |
| QEMU | Docker multi-platform image build emulation (build-dependency, optional) | N/A | N/A | N/A | Used only for Docker image builds (`docker/setup-qemu-action`), not for binary cross-compilation (Go cross-compiles natively) and not for test execution. |
| golang.org/x/crypto | TLS/AEAD for HTTPS scrape and remote-write (runtime-dependency, optional) | Builds; pure-Go fallback | No riscv64 CI | N/A (part of Go module graph) | No AES-GCM/ChaCha20/SHA asm for riscv64; materially slower TLS throughput vs amd64/arm64. Blocked upstream by golang/go#74683, #77069, #77328. |
| cespare/xxhash | 64-bit hashing for TSDB indexing/fingerprinting (runtime-dependency, optional) | Builds; falls back to `xxhash_other.go` (build tag `!amd64,!arm64`) | No riscv64 CI | N/A (vendored Go module) | No riscv64 asm; no upstream plan to add it. No open correctness issues. |
| klauspost/compress | Snappy/zstd/gzip for remote-write and TSDB (runtime-dependency, optional) | Builds; a riscv64 unsafe little-endian path was added (issue #1036, closed) | No riscv64 CI | N/A | No riscv64 SIMD (x86 AVX2 / arm64 NEON only); pure-Go zstd active on riscv64. No open riscv64 issues. |
| golang/snappy | Legacy Snappy framing for remote-write (runtime-dependency, optional) | Builds; pure-Go on non-amd64/non-arm64 | No riscv64 CI | N/A | No open riscv64 issues. |
| pprof | CPU/memory profiling, `/debug/pprof` endpoint (runtime-dependency, optional) | Builds; Go runtime stack walking, no arch-specific code | No riscv64 CI | N/A | No open riscv64 issues; native Linux-perf annotation non-functional without riscv64 perf support. |
| prometheus/procfs | `/proc` and `/sys` parsing for node metrics (runtime-dependency, critical) | Builds; RISC-V CPUInfo parsing added ([procfs PR #318](https://github.com/prometheus/procfs/pull/318)), with a dispatch-wiring bug fixed in [procfs PR #325](https://github.com/prometheus/procfs/pull/325) | No riscv64 CI | N/A | Historical build breakage (v0.1.3-v0.2.0, `parseCPUInfo` undefined on riscv64) resolved in v0.3.0. No open issues. |
| prometheus/client_golang | Prometheus self-instrumentation (runtime-dependency, critical) | Builds; was broken on riscv64 before bumping its procfs dependency ([PR #833](https://github.com/prometheus/client_golang/pull/833), closed) | No riscv64 CI | N/A | No open riscv64 issues. |
| edsrzf/mmap-go | Memory-mapped I/O for TSDB WAL/chunks (runtime-dependency, critical) | Builds; `mmap` syscall is arch-independent via `golang.org/x/sys` | No riscv64 CI | N/A | No open riscv64 issues. |
| grafana/regexp | DFA-based regex for label selector matching (runtime-dependency, optional) | Builds; pure-Go fork of stdlib regexp | No riscv64 CI | N/A | No open riscv64 issues. |
| gRPC-Go | Remote-write gRPC transport (runtime-dependency, critical) | Builds; no arch-specific code | No riscv64 CI | N/A | No open riscv64 issues. Note: a separate C++ "gRPC" core project exists with its own report; this entry is the Go implementation only. |
| automaxprocs | cgroup CPU quota to GOMAXPROCS (runtime-dependency, optional) | Builds; pure Go | No riscv64 CI | N/A | No open riscv64 issues. |
| automemlimit | cgroup memory.max to soft memory limit (runtime-dependency, optional) | Builds; pure Go | No riscv64 CI | N/A | No open riscv64 issues. |
| dennwc/varint | Varint encoding for TSDB posting lists (runtime-dependency, optional) | Builds; pure Go | No riscv64 CI | N/A | No open riscv64 issues. |

**Deep-dive on the dependencies with numerics/crypto-adjacent content:**

- **golang.org/x/crypto** is the highest-priority dependency gap. It provides the TLS stack used for HTTPS scraping and remote-write; on amd64/arm64 it dispatches to hardware AES-GCM/ChaCha20-Poly1305/SHA intrinsics, and on riscv64 it falls back to pure-Go implementations. Three open upstream Go issues constrain any fix: golang/go#74683 (FIPS140 + `-buildmode=pie` broken on riscv64), golang/go#77069 (P256 multiplication unoptimized), and golang/go#77328 (Zvkned vector-crypto extension support missing from the Go assembler). These are Go toolchain issues, not something fixable inside `golang.org/x/crypto` or Prometheus alone.
- **cespare/xxhash** and **klauspost/compress** both lack riscv64-specific assembly/SIMD paths and fall back to portable Go. Neither has an open upstream issue or stated roadmap item for riscv64 acceleration.
- **prometheus/procfs** is the one dependency in this list with riscv64-specific *source* (CPUInfo parsing), and it is also the one dependency with a documented, now-resolved riscv64 correctness bug (the dispatch-wiring defect fixed in procfs PR #325).

**Blocking dependency issues, summarized:**
1. `golang/go#74683` (open): FIPS140 broken on riscv64 with `-buildmode=pie`, blocking Prometheus builds in FIPS-enforcing environments on riscv64.
2. No riscv64 native CI runners anywhere in the dependency stack; all builds are cross-compiled, so correctness validation on real riscv64 hardware is absent throughout the supply chain, not just in Prometheus's own CI.
3. `cespare/xxhash` and `klauspost/compress` lack riscv64 asm with no upstream plan to add it; TSDB ingestion and remote-write compression run on pure-Go fallbacks.
4. `golang.org/x/crypto` pure-Go TLS on riscv64 is materially slower than the asm-accelerated amd64/arm64 paths, a concern for Prometheus deployments scraping large numbers of HTTPS targets.

Data not available: Prometheus-specific benchmark figures isolating the throughput impact of any of these dependency-level fallbacks on riscv64 hardware.

## 10. Ecosystem Status

Prometheus itself is a standalone Go binary with no dependent package ecosystem in the Python/npm/Maven/Kubernetes-operator sense - nothing installs "a Prometheus plugin" the way one installs a pip or npm package. However, Prometheus anchors a companion ecosystem of exporters and auxiliary binaries (node_exporter, alertmanager, pushgateway, blackbox_exporter, and dozens of third-party exporters) that must each independently ship riscv64 builds for a riscv64 Prometheus deployment to have full observability parity with amd64/arm64 deployments. That ecosystem's riscv64 status:

**node_exporter (`prometheus/node_exporter`):** riscv64 binary releases began with v1.7.0 (2023-11-13); [node_exporter#2645](https://github.com/prometheus/node_exporter/issues/2645) ("ci: build riscv64 binaries," closed 2023-07-18) confirmed `GOARCH=riscv64 make build` cross-compiled successfully and ran on a StarFive VisionFive 2 board under go1.20.2. Container images lagged: [node_exporter#3311](https://github.com/prometheus/node_exporter/issues/3311) ("Provide linux/riscv64 container images") was open reporting riscv64 images were missing after a regression, and was closed 2026-04-09 once fixed. Two open correctness issues remain: [node_exporter#3180](https://github.com/prometheus/node_exporter/issues/3180) (open since 2024-11-10) - the end-to-end test suite fails on riscv64 because expected output includes x86-only CPU bug/flag metrics (`node_cpu_bug_info` with `cpu_meltdown`/`mds`/`spectre_v1`/`spectre_v2`, `node_cpu_flag_info` with `aes`/`avx`/`avx2`) that don't exist in riscv64's `/proc/cpuinfo`; the reporter suggests these collectors should be guarded to x86_64 only, but no fix has landed. [node_exporter#2296](https://github.com/prometheus/node_exporter/issues/2296) (open since 2022-02-25) reports `go test ./...` and the end-to-end test script failing on riscv64 (Linux 5.11, node_exporter 1.3.1) with a log attached but no diagnosed root cause in the issue body.

**alertmanager (`prometheus/alertmanager`):** riscv64 binary and Docker image present in the current release; multi-arch images including riscv64 are published to quay.io. No open riscv64 issues found.

**pushgateway (`prometheus/pushgateway`):** riscv64 binary present in the current release. No open riscv64 issues found.

**prometheus/procfs:** Fixed a riscv64-specific CPUInfo-parsing wiring bug (PR #325, discussed in Section 9).

**Arch Linux RISC-V exporter ecosystem:** The Arch Linux RISC-V mirror carries a wide set of exporter packages (prometheus-node-exporter, prometheus-blackbox-exporter, prometheus-postgres-exporter, prometheus-ssl-exporter, prometheus-redis-exporter, and others), all available as riscv64 packages and generally more current than the core `prometheus` package itself, which is sv39-blacklisted (Section 8).

**RISE ecosystem:** No RISE working group activity specific to Prometheus or its exporter ecosystem was identified in blog posts, repository listings, or site search.

**Assessment:** The core `prometheus` server and its primary companion binaries (node_exporter, alertmanager, pushgateway) are all riscv64-buildable and distributed, but the ecosystem's test coverage on riscv64 is weaker than its binary coverage - two of node_exporter's open issues are specifically riscv64 test failures, one unresolved for close to four years.

## 11. Known Bugs and Active Issues

**Open riscv64-specific issues in `prometheus/prometheus` itself:** Zero. Searches for `riscv64 state:open repo:prometheus/prometheus` and an org-wide `riscv org:prometheus` search return no open issues against the core repository.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [procfs PR #325](https://github.com/prometheus/procfs/pull/325) | Fix build on RISCV | Closed (fixed in procfs v0.3.0) | Correctness | PR #318 added `parseCPUInfoRISCV` for `/proc/cpuinfo` parsing on riscv64 but failed to wire the function into the dispatch table, causing a `parseCPUInfo` undefined compile error on riscv64 for procfs v0.1.3-v0.2.0. `prometheus/client_golang` PR #833 had to bump its procfs dependency to pick up the fix. |
| PR #17876 / #18110 | Distroless riscv64 image not found | Closed (resolved Feb 2026) | Release-blocking | `gcr.io/distroless/static-debian13:nonroot-riscv64` did not exist when PR #17876 merged, blocking v3.10.0; resolved once upstream distroless added riscv64 support and the temporary exclusion (PR #18110) was removed by PR #18548. |
| Issue #18123 / PR #18124 / PR #18527 | quay.io riscv64 "unauthorized" error | Closed (resolved Apr 2026) | Release-blocking | quay.io requires manual per-architecture repository creation; the riscv64 repo was never created, silently failing all pushes. Resolved by creating the repository (PR #18527); the interim exclusion (PR #18124) was removed by PR #18548. |
| [node_exporter#3180](https://github.com/prometheus/node_exporter/issues/3180) | End-to-end test fails on riscv64 machine | Open (since 2024-11-10) | Correctness (test suite) | x86-only CPU bug/flag metrics are expected in test output but don't exist on riscv64's `/proc/cpuinfo`. |
| [node_exporter#2296](https://github.com/prometheus/node_exporter/issues/2296) | Fail to test with version 1.3.1 under RISC-V | Open (since 2022-02-25) | Correctness (test suite) | `go test ./...` and end-to-end tests fail on riscv64; no diagnosed root cause published. |
| [golang/go#74683](https://github.com/golang/go/issues/74683) | FIPS140 broken on riscv64 with `-buildmode=pie` | Open | Build-blocking (FIPS environments) | Go toolchain issue, not Prometheus-specific, but blocks Prometheus builds in FIPS-enforcing riscv64 environments. |
| [golang/go#77069](https://github.com/golang/go/issues/77069) | crypto P256 mul unoptimized on riscv64 | Open | Performance | Go toolchain issue. |
| [golang/go#77328](https://github.com/golang/go/issues/77328) | Zvkned assembler support missing | Open | Performance | Go toolchain issue. |
| [felixonmars/archriscv-packages PR #4854](https://github.com/felixonmars/archriscv-packages/pull/4854) | sv39-blacklist: add prometheus | Merged (2025-08-06) | Packaging | Node.js WebAssembly OOM on sv39 address-space-constrained riscv64 hardware during web UI asset build; Prometheus is unbuildable via the Arch Linux RISC-V repo on the most common RISC-V hardware class. |

The two open node_exporter test-suite failures are the only unresolved riscv64 correctness issues identified anywhere in the Prometheus organization's repositories; all issues against `prometheus/prometheus` itself are closed.

## 12. Objections and Upstream Blockers

**"Prometheus is already fully supported on riscv64."** Partially true. Binary tarballs ship since July 2023; Docker images ship (stably, with all workarounds removed) since April 2026; the implementation is pure Go with no architecture-specific gaps. "Fully supported" overstates the case on five points: (1) riscv64 is excluded from the PR-triggered `build` CI job; (2) no riscv64 test execution exists anywhere in CI; (3) the shipped binary carries zero upstream quality assurance on the target architecture; (4) the Arch Linux riscv64 port is sv39-blacklisted due to a Node.js OOM condition; (5) TLS-heavy deployments face a real crypto throughput regression vs amd64/arm64.

**"There is no work left to do for riscv64 on Prometheus."** Incorrect. Specific gaps: riscv64 absent from the PR build job's `promu_opts`; zero riscv64 test coverage on target hardware; crypto throughput regression affecting HTTPS scraping at scale; FIPS-mode PIE builds broken via a Go toolchain issue; a Node.js build limitation blocking native compilation of the web UI binary on common riscv64 hardware; two long-open node_exporter test failures in the companion ecosystem.

**"Pure Go means performance is identical across architectures."** Incorrect at the dependency layer. `golang.org/x/crypto` uses hardware AES instructions on amd64 and arm64 but falls back to pure Go on riscv64. `cespare/xxhash` uses hand-written assembly on amd64 and arm64, pure Go on riscv64. `klauspost/compress` uses AVX2 on amd64 and NEON on arm64, pure Go on riscv64. The cumulative throughput impact on a high-cardinality Prometheus instance doing HTTPS scraping and remote-write compression is non-trivial, even though no Prometheus-specific benchmark quantifies it.

**"The Arch Linux riscv64 blacklist is a minor packaging issue."** The sv39 blacklist covers the most common class of currently available RISC-V hardware, including the VisionFive 2 and HiFive Unmatched boards. A developer or user on this hardware cannot obtain Prometheus via the Arch Linux RISC-V package at all. The root cause (Node.js Wasm OOM on sv39 address space) is an upstream Node.js issue, not a Prometheus issue, but the observable effect blocks native full-UI builds of Prometheus on sv39 hardware.

**Organizational posture:** The chain of PRs closing out the Docker rollout (#17508 through #18548) shows an engaged, responsive maintainer group (Pivotto, Kochie/SuperQ, Vernekar, Plotka) that treats riscv64 problems as ordinary release-blocking bugs to be fixed quickly (same-day merges on #18124, #18527, #18548), not as a lower-priority architecture. No maintainer has expressed reluctance to support riscv64. The gap is one of unaddressed scope (CI test coverage, PR-build inclusion) rather than active resistance - no open PR or issue requests riscv64 be added to CI, meaning nobody has yet proposed the fix for the acceptance committee to evaluate.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream

Prometheus's PR-triggered CI job (`build` in [.github/workflows/ci.yml](https://github.com/prometheus/prometheus/blob/main/.github/workflows/ci.yml)) explicitly excludes riscv64 from its `promu_opts` platform list, and the only job that touches riscv64 at all (`build_all`, which runs solely on pushes to `main`/release tags, not on PRs) does a build-only crossbuild via promu's default platform list - a repo-wide grep of `.github/workflows/` confirmed zero "riscv" matches, and no workflow file runs tests on riscv64 (QEMU or native). Per the skill's CI evidence rule, build-yes/test-no caps this at yellow regardless of release status. Upstream does publish riscv64 artifacts directly (GitHub Release tarballs since v2.46.0 in 2023; Docker Hub and quay.io images since v3.10.0, via [PR #17508](https://github.com/prometheus/prometheus/pull/17508) and [PR #18527](https://github.com/prometheus/prometheus/pull/18527)), so `release_provider` is upstream, but that release channel alone cannot raise the grade past yellow without test execution in CI. Prometheus is a monitoring/alerting toolkit, not a project whose stated value proposition is RISC-V-specific performance, so the optimization-level modifier does not apply to it.

**Pending work that could change the grade:** The Docker-image riscv64 rollout chain (PR #17508 -> issue #18123 -> PR #18124 -> PR #18115/#18110 -> PR #18527 -> PR #18548) closed out in April 2026 with all registry workarounds removed, so riscv64 image/binary publishing is now stable. No open PR or issue was found requesting riscv64 be added to the PR-triggered build job or to test execution; RISE operates native riscv64 CI runners used by other projects, but Prometheus has no known integration with them. Upstream Go toolchain gaps (golang/go#74683 FIPS140+PIE on riscv64, golang/go#77069, golang/go#77328) and lack of riscv64 asm in dependencies like cespare/xxhash and klauspost/compress are noted performance caveats but do not affect the CI-based color.

## 14. Investment Analysis

RISE has not funded or published any Prometheus-specific work (Section 1), so no existing RISE investment needs to be netted out of the sizing below.

### 14.1 Functional Enablement

Prometheus on riscv64 is functionally complete as a deployed binary; there are no missing features or broken subsystems at the application level. Investment in functional enablement of Prometheus itself is not warranted.

The one functional gap is build-environment, not runtime: the Node.js limitation (sv39 Wasm OOM during web UI asset compilation) prevents native `make build` on common riscv64 hardware and causes the Arch Linux RISC-V sv39-blacklist entry. Resolution depends on upstream Node.js fixes for riscv64 Wasm stability; this is Node.js ecosystem work, not Prometheus-repository work.

### 14.2 Performance Optimization

Three concrete, independently-sized gaps:

1. **TLS crypto (`golang.org/x/crypto`):** pure-Go AES-GCM/ChaCha20-Poly1305 vs hardware intrinsics on amd64/arm64. Fix path: RVV- or Zkne-based crypto intrinsics in `golang.org/x/crypto`/the Go toolchain (tracked under golang/go#77328). This is Go runtime investment, not Prometheus-repository investment.
2. **xxhash (`cespare/xxhash/v2`):** no riscv64 asm; a real throughput gap for TSDB label hashing with no upstream plan to close it. Fix path: contribute riscv64 asm. Effort: low-medium (isolated hash function, well-defined interface).
3. **zstd/compression (`klauspost/compress`):** no riscv64 SIMD acceleration. Fix path: contribute RVV-based zstd decompression. Effort: medium-high (complex codec, RVV expertise required).

Data not available: quantified throughput measurements for any of the above specifically in a Prometheus production workload on riscv64 hardware. Investment here should be preceded by profiling to confirm these are actual bottlenecks in the target deployment scenario, since no such profiling currently exists.

### 14.3 CI/CD Infrastructure

This is the highest-value, lowest-friction investment opportunity, and the direct driver of the yellow grade.

**Current state:** riscv64 ships in every Prometheus release without any test execution on riscv64 anywhere in CI - a real correctness risk given the Prometheus-org has at least two documented, currently-open riscv64 test failures in the companion node_exporter project (Section 10/11).

**Investment options:**
- Add riscv64 to the PR-triggered `build` job's `promu_opts`: trivial, one-line change, requires a PR and maintainer approval. Directly addresses the CI gap driving the yellow grade's build-only characterization.
- Add QEMU-based riscv64 test execution to `ci.yml`: low-effort addition using `setup-qemu-action`; slow but functional on `ubuntu-latest`.
- Integrate RISE native riscv64 runners for Prometheus CI: medium effort, requires agreement with Prometheus maintainers and RISE runner access/workflow integration (no existing integration found).
- Investigate and resolve the two open node_exporter riscv64 test failures (#3180, #2296) as a prerequisite or parallel track, since they represent known, unaddressed test-suite breakage in the ecosystem closest to Prometheus itself.

### 14.4 Ecosystem Enablement

The broader Prometheus ecosystem (node_exporter, alertmanager, pushgateway, and the Arch Linux RISC-V exporter set) already ships riscv64 binaries with generally good coverage. The primary remaining gaps are: the core `prometheus` package's Arch Linux sv39-blacklist status (a Node.js upstream dependency, not resolvable by Prometheus-repository investment), and the two open node_exporter test-suite failures. No RISE working group is currently engaged with Prometheus or its ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 to `build` job `promu_opts` in `ci.yml` | 0.5 | Prometheus contributor | High |
| CI/CD | Add QEMU-based riscv64 test execution to `ci.yml` | 1-2 | Prometheus contributor | High |
| CI/CD | Integrate RISE native riscv64 runners for Prometheus CI | 3-5 | RISE infra + Prometheus maintainers | Medium |
| Ecosystem | Diagnose and fix node_exporter riscv64 test failures (#3180, #2296) | 1-3 | Go/riscv64 engineer | Medium |
| Performance | Contribute riscv64 asm to `cespare/xxhash/v2` | 2-4 | Go/riscv64 engineer | Medium |
| Performance | Contribute RVV-based zstd to `klauspost/compress` | 6-12 | RVV-specialist engineer | Low (profile first) |
| Performance | Go toolchain crypto (RVV / Zkne) | 10-20+ | Go toolchain team (upstream) | Low (dependency on Go WG) |
| Toolchain | Fix FIPS PIE on riscv64 (golang/go#74683) | Upstream Go | Go team | Medium (unblocks RHEL FIPS deployments) |
| Build | Node.js Wasm sv39 fix (unblocks Arch riscv64 native builds) | Upstream Node.js | Node.js / RISE | Medium |

## 15. References

- [prometheus/prometheus repository](https://github.com/prometheus/prometheus)
- [prometheus/prometheus .github/workflows/ci.yml](https://github.com/prometheus/prometheus/blob/main/.github/workflows/ci.yml)
- [Prometheus Makefile.common](https://github.com/prometheus/prometheus/blob/main/Makefile.common)
- [Prometheus MAINTAINERS.md](https://github.com/prometheus/prometheus/blob/main/MAINTAINERS.md)
- [PR #5621 - Riscv support (closed)](https://github.com/prometheus/prometheus/pull/5621)
- [PR #5625 - pkg/runtime: simplify Utsname string conversion](https://github.com/prometheus/prometheus/pull/5625)
- [PR #12530 - Update promu (enabled riscv64 releases)](https://github.com/prometheus/prometheus/pull/12530)
- [PR #17508 - Build riscv64 docker image by default](https://github.com/prometheus/prometheus/pull/17508)
- [PR #17876 - Add distroless Docker image variant](https://github.com/prometheus/prometheus/pull/17876)
- [Issue #18123 - s390x is not pushed to quay.io because quay does not support riscv64](https://github.com/prometheus/prometheus/issues/18123)
- [PR #18110 - chore: Exclude riscv64 from distroless images](https://github.com/prometheus/prometheus/pull/18110)
- [PR #18115 - Cut v3.10.0-rc.1](https://github.com/prometheus/prometheus/pull/18115)
- [PR #18124 - chore(ci): Add registry-specific architecture exclusions](https://github.com/prometheus/prometheus/pull/18124)
- [PR #18527 - Fix quay.io riscv64 publishing](https://github.com/prometheus/prometheus/pull/18527)
- [PR #18548 - build: remove DOCKER_REGISTRY_ARCH_EXCLUSIONS and DOCKERFILE_ARCH_EXCLUSIONS logic](https://github.com/prometheus/prometheus/pull/18548)
- [prometheus/procfs PR #318 - Add CPUInfo parsing for RISCV](https://github.com/prometheus/procfs/pull/318)
- [prometheus/procfs PR #325 - Fix build on RISCV](https://github.com/prometheus/procfs/pull/325)
- [prometheus/client_golang PR #833 - Bump procfs to fix riscv64 build](https://github.com/prometheus/client_golang/pull/833)
- [prometheus/node_exporter issue #2645 - ci: build riscv64 binaries](https://github.com/prometheus/node_exporter/issues/2645)
- [prometheus/node_exporter issue #3311 - Provide linux/riscv64 container images](https://github.com/prometheus/node_exporter/issues/3311)
- [prometheus/node_exporter issue #3180 - end-to-end test fails on riscv64 machine](https://github.com/prometheus/node_exporter/issues/3180)
- [prometheus/node_exporter issue #2296 - Fail to test with version 1.3.1 under RISC-V](https://github.com/prometheus/node_exporter/issues/2296)
- [felixonmars/archriscv-packages PR #4854 - sv39-blacklist: add prometheus](https://github.com/felixonmars/archriscv-packages/pull/4854)
- [golang/go#74683 - fips140 broken on RISC-V with -buildmode=pie](https://github.com/golang/go/issues/74683)
- [golang/go#77069 - crypto P256 mul unoptimized on riscv64](https://github.com/golang/go/issues/77069)
- [golang/go#77328 - Zvkned assembler support missing](https://github.com/golang/go/issues/77328)
- [klauspost/compress issue #1036 - Add unsafe little endian loaders (riscv64 fix, closed)](https://github.com/klauspost/compress/issues/1036)
- [Debian buildd prometheus status](https://buildd.debian.org/status/package.php?p=prometheus)
- [Debian package tracker - prometheus](https://tracker.debian.org/pkg/prometheus)
- [Ubuntu 24.04 prometheus package](https://packages.ubuntu.com/noble/prometheus)
- [Ubuntu 26.04 (resolute) prometheus package](https://packages.ubuntu.com/resolute/prometheus)
- [nodejs/build#4099 - Node.js riscv64 open issues](https://github.com/nodejs/build/issues/4099)
- [RISE Project blog index](https://riseproject.dev/blog)
- [RISE Project - Advancing Go on RISC-V: Progress Through the RISE Project](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)