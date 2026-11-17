---
title: Grafana Loki
parent: Project Reports
color: yellow
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: klauspost/compress
    relation: runtime-dependency
    criticality: critical
  - name: klauspost/cpuid
    relation: runtime-dependency
    criticality: optional
  - name: pierrec/lz4
    relation: runtime-dependency
    criticality: optional
  - name: golang/snappy
    relation: runtime-dependency
    criticality: optional
  - name: cespare/xxhash
    relation: runtime-dependency
    criticality: optional
  - name: zeebo/xxh3
    relation: runtime-dependency
    criticality: optional
  - name: RoaringBitmap/roaring
    relation: runtime-dependency
    criticality: optional
  - name: apache/arrow-go
    relation: runtime-dependency
    criticality: critical
  - name: parquet-go/parquet-go
    relation: runtime-dependency
    criticality: critical
  - name: bbolt
    relation: runtime-dependency
    criticality: critical
  - name: modernc.org/sqlite
    relation: runtime-dependency
    criticality: optional
  - name: golang.org/x/crypto
    relation: runtime-dependency
    criticality: optional
  - name: Prometheus
    relation: runtime-dependency
    criticality: critical
  - name: prometheus/client_golang
    relation: runtime-dependency
    criticality: critical
  - name: gRPC-Go
    relation: runtime-dependency
    criticality: critical
  - name: etcd
    relation: runtime-dependency
    criticality: optional
  - name: andybalholm/brotli
    relation: runtime-dependency
    criticality: optional
  - name: ebitengine/purego
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="grafana-loki" %}

# Grafana Loki

**Author:** Ludovic Henry ([@luhenry](https://github.com/luhenry))<br/>
**Date:** 2026-11-17<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Grafana Loki<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Loki is a log aggregation system written in pure Go ([repository](https://github.com/grafana/loki), [homepage](https://grafana.com/oss/loki/)). It has no JIT, no jemalloc and no C++ dependency. `go.mod` declares Go 1.27.4. It is released under AGPLv3.

Governance: Loki is led by Grafana Labs and is not in the CNCF, LF or Apache. The governance doc (`docs/sources/community/governance.md`) says changes to it are made by Grafana Labs. Decisions use rough consensus, then a majority vote of team members. Team membership needs at least 3 months of contributions and a supermajority vote.

Sponsors and maintainers: the governance doc lists 20 team members. 17 are marked Grafana Labs, one is at Alibaba Cloud (liguozhong), one at Red Hat (periklis), and two have no company listed. `CODEOWNERS` assigns `*` to `@grafana/loki-team`. Grafana Labs is not a RISE member ([RISE members](https://riseproject.dev/members), page dated 2026-01-09).

Culture on new ports: there is no formal policy. Maintainer chaudum first said on 2026-04-15 "We don't really have the capacity [to] deal with possible riscv quirks" and that extra architectures lengthen CI. After a team discussion he reported feedback "mostly positive, with maintainability concerns" and merged a best-effort, non-blocking build ([issue #21217](https://github.com/grafana/loki/issues/21217)). The effective stance: accept a port when it carries no maintenance obligation for Grafana.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-03-20 | gounthar opens issue #21217 "Add riscv64 release binaries". Native build on BananaPi F3 (SpacemiT K1) works with no source changes. | [#21217](https://github.com/grafana/loki/issues/21217) |
| 2026-03-20 | gounthar opens PR #21220, adding `riscv64` to the `build-loki-binary.yml` goarch matrix (+1/-1). | [#21220](https://github.com/grafana/loki/pull/21220) |
| 2026-04-15 | chaudum is hesitant (capacity, CI time). gounthar reports native build times and proposes `continue-on-error: true`. | [#21217](https://github.com/grafana/loki/issues/21217) |
| 2026-04-17 | chaudum opens PR #21597 (best effort). Same day he comments on #21217 that team feedback was mostly positive. | [#21597](https://github.com/grafana/loki/pull/21597) |
| 2026-04-20 | PR #21597 merged as commit 76e65d7f; #21217 closed as completed. A Cursor Bugbot review comment is posted after the merge (unzipped binary, no checksum). | [#21597](https://github.com/grafana/loki/pull/21597) |
| 2026-05-11 | #21220 closed unmerged by gounthar in favour of #21597. | [#21220](https://github.com/grafana/loki/pull/21220) |
| 2026-05-13 | Backports #21846 (release-3.6.x) and #21847 (release-3.7.x) merged by sandeepsukhani. | [#21846](https://github.com/grafana/loki/pull/21846), [#21847](https://github.com/grafana/loki/pull/21847) |
| 2026-11-04 / 2026-11-07 | Pre-releases v4.0.0-rc.2 and rc.3 carry a bare `loki-linux-riscv64` asset. | [v4.0.0-rc.3 asset](https://github.com/grafana/loki/releases/download/v4.0.0-rc.3/loki-linux-riscv64) |

Key contributors: gounthar (community, no affiliation shown) originated the request; chaudum (Christian Haudum, Grafana Labs) implemented it; sandeepsukhani (Grafana Labs) did the backports.

Fully upstream: yes for the build step. Loki has no architecture-specific code of its own, so there is nothing to upstream beyond CI and release configuration.

Discrepancy: the earlier research claimed the build "first shipped in release 3.9.0". Verification found release PRs #22415, #22492 and #22761 ("Release 3.9.0") closed unmerged on 2026-11-13, and no `v3.9.0` tag. Their changelogs list #21597 only as queued. The claim is not supported and is not used here. The first release that carries the asset is not confirmed; rc.2 is the earliest one with the asset that was checked [NEEDS VERIFICATION]. rc.1 was not checked.

## 3. Upstream Support Tier

There is no formal tier policy. No `PLATFORMS.md` or `SUPPORT.md` was found. PR #21597 states: "The Grafana Loki maintainers do not officially support RISC-V architecture. Any fixes are maintained by the community." The step is `continue-on-error: true`, so there is "no guarantee that the build is included in the release artifacts."

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In `crosscompile.mk` platforms | yes | yes | yes (line 9) |
| Container image matrix (`images.yml`) | yes | yes | no |
| Release `forPlatform` runner lists | yes | yes | no (mapping to `ubuntu-26.04-riscv` exists in `runner.libsonnet`, unused) |
| Release-blocking | yes | yes (not separately verified) | no, `continue-on-error` |
| Native test CI | yes | Data not available: arm64 test jobs were not enumerated | none |
| Official stable release binary | yes (3.7.10) | yes (3.7.10) | no (3.7.10, 3.6.21) |

Source for the riscv64 column: a local clone of `main` at `5cefe46c` and grep of `.github/`, `Makefile` and `crosscompile.mk` for riscv/qemu. The amd64 and arm64 cells come from the 3.7.10 asset list and the `forPlatform` finding.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Loki's own code has no architecture-specific parts: 0 `*_amd64`, `*_arm64`, `*_riscv64` or `.s` files outside `vendor/`, no `go:build` lines for these architectures, no `__riscv` guards, and no `import "C"` in non-vendor Go. Code searches for `rvv`, `vfloat32m1_t`, `extension:s` and `"go:build" riscv64` returned 0 hits.

Vendored `_$arch.go`/`.s` file counts: amd64 573, arm64 375, riscv64 100. Only 11 riscv64 `.s` files exist, in `ebitengine/purego` (6), `golang.org/x/sys` (unix and cpu asm), and `x/crypto` poly1305 (`sum_riscv64.s`). 45 vendored directories have `*_amd64.s`; only 6 also have riscv64 files, 39 do not.

| Component | amd64 | arm64 | riscv64 | Quality on riscv64 |
|---|---|---|---|---|
| Loki own code | portable Go | portable Go | portable Go | n/a |
| zstd / s2 / huff0 (klauspost/compress) | assembly | assembly | none vendored | scalar Go (fallback not verified) |
| parquet-go, arrow-go, roaring, xxhash, xxh3, snappy, lz4 | assembly in several | assembly in several | none | scalar Go (fallback not verified) |
| poly1305 (x/crypto) | assembly | assembly | `sum_riscv64.s` present | assembly |
| syscall / CPU probe (x/sys) | yes | yes | yes | present |
| purego | yes | yes | yes (6 .s files) | present; open calling-convention bug #546 |

ISA extensions used: none identified. The riscv64 binary was built with Go defaults; no RVV or Zb* use was found. The cross-compile succeeds in CI, which suggests fallbacks exist, but this was not verified per dependency.

## 5. Build System, Cross-Compilation, and Toolchain

Loki is built with the Go toolchain, CGO off. Not present in the repository: `BUILDING.md`, `CMakeLists.txt`, `Dockerfile.riscv64`, riscv64 toolchain files. `README.md` has no riscv or qemu mention.

Commands (from `crosscompile.mk`):
- Single binary: `make dist/loki-linux-riscv64`
- All three binaries (loki, logcli, lokitool) for riscv64: `make cross-build CROSS_BUILD_PLATFORMS="linux/riscv64"`
- Underlying recipe: `CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build $(GO_FLAGS) -o dist/<bin>-linux-riscv64 ./cmd/<bin>`
- Release path, inside `golang:1.27.4`: run `install_workflow_dependencies.sh dist` from `.github/vendor/github.com/grafana/loki-release/workflows/`, then `make dist/loki-linux-riscv64`, with `BUILD_IN_CONTAINER=false`.

Toolchain: `GO_VERSION := 1.27.4` in the `Makefile`; `go.mod` declares `go 1.27.4`. No GCC/Clang minimum, because CGO is off. CGO is on only for `loki-canary-boringcrypto` (`GOEXPERIMENT=boringcrypto`), which is not on the riscv64 path.

QEMU: none for riscv64. `OCI_PLATFORMS` covers `linux/amd64,linux/arm64` only. `docker/setup-qemu-action` appears in image/release jobs, but no riscv64 platform is in their matrices.

Native build (not the shipped path), from [#21217](https://github.com/grafana/loki/issues/21217): 29m10s wall on a RISE `ubuntu-24.04-riscv` runner, 22m24s on a BananaPi F3 (8 cores at 1.6 GHz). The binary was 208 MB, dynamically linked. A single run each; nothing was run on arm64 for comparison.

Known build failures: none found. Data not available: history of the optional step's runs. Failures would be silent because of `continue-on-error`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `loki` server binary | released | released | rc.2 / rc.3 only |
| `logcli`, `loki-canary`, `lokitool` | released | released | not released (rc.3 has only `loki`) |
| deb / rpm / zip packaging | yes | yes | no |
| Docker image | yes | yes | no |
| Checksum in `SHA256SUMS` | yes | yes | no (open Bugbot comment on #21597) |
| Tests | yes | yes (not verified) | none |

Functional gaps: no riscv64 container image, no packages, no tools other than `loki`, no tests. Functional correctness at runtime is untested by upstream; the only evidence is gounthar's report that the binary builds and runs on a BananaPi F3 [NEEDS VERIFICATION: single-source, run scope not described].

Performance gaps: Data not available. No riscv64 runtime benchmarks (throughput, ingest, query, latency) were found. Searches "riscv64 performance", "riscv nan floating" in the repo and web returned nothing relevant. Vendored SIMD-assisted code (compression, hashing, parquet) runs scalar on riscv64, but the delta is unmeasured.

Security hardening gaps: Data not available beyond the missing checksum entry. The unzipped riscv64 binary cannot be verified against `SHA256SUMS`.

NaN / floating-point: no issues found in the search of the repo.

## 7. CI/CD Infrastructure

riscv64 CI is a single build step. Verified on a clone of `main` at `5cefe46c` (27 workflow files grepped):
- Step "build optional artifacts" in the `dist` job of `minor-release-pr.yml`, `major-release-pr.yml` and `patch-release-pr.yml` (line 163 in each) runs `make dist/loki-linux-riscv64`.
- It has `continue-on-error: true` and runs only if `pr_created` is true.
- Runner: `ubuntu-x64`, an x86 Grafana runner label, inside `golang:1.27.4`.
- Triggers: `push` to `k[0-9]+` (minor), `release-[0-9]+.0.0` (major), `release-[0-9]+.[0-9]+.x` (patch). No `pull_request`, no `workflow_dispatch` in the lines checked.
- `.github/release-workflows.jsonnet` lines 52, 73 and 94 set `distOptionalTargets=['dist/loki-linux-riscv64']`.
- `runner.libsonnet:5` maps `linux/riscv64` to `ubuntu-26.04-riscv` (comment points to the RISE runners app), but no generated workflow uses it.
- The step builds a binary and runs nothing on it.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Release build | yes | yes | cross-compile, optional |
| PR-time build | yes | yes (arm and arm64 are in the `build-loki-binary.yml` matrix, per #21220) | no |
| Native runner | `ubuntu-x64` | Data not available | none |
| Tests | yes | Data not available | none |
| QEMU | n/a | in image jobs | none |

RISE runners: none used. The free `ubuntu-24.04-riscv` runners ([RISE announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) were proposed in #21217 and not adopted. The Bugbot review also notes the optional step runs after zipping, so the binary is uploaded raw.

## 8. Distribution and Release Status

| Channel | riscv64? | Evidence |
|---|---|---|
| GitHub v4.0.0-rc.3 (pre-release, 2026-11-07) | yes, bare binary | 49 assets, one `loki-linux-riscv64`; no zip, logcli, canary, lokitool, deb, rpm or checksum |
| GitHub v4.0.0-rc.2 (pre-release, 2026-11-04) | yes, bare binary | same asset; only searched for "riscv" |
| GitHub v3.7.10 (stable, 2026-11-13) | no | 48 assets, none riscv |
| GitHub v3.6.21 (stable, 2026-11-13) | no | no riscv string in release data |
| Ubuntu 26.04 (resolute) | no package found | graph query empty; Ubuntu `loki` 2.4.7.4 is an unrelated genetics tool |
| PyPI `grafana-loki`, RISE wheel index | no | HTTP 404 on both |
| Arch Linux RISC-V | not confirmed | search could not be run |
| Docker/OCI | no | no riscv64 entry in `images.yml` |

Discrepancy: backports #21846 and #21847 merged on 2026-05-13, yet v3.7.10 and v3.6.21 carry no riscv64 asset. The cause was not investigated. Possible reasons include `continue-on-error` failures or the step running only on release-PR creation; neither is confirmed. The Ubuntu check searched only the string "Grafana Loki", so a package under another name is not ruled out.

Getting a working binary: download `loki-linux-riscv64` from the v4.0.0-rc.3 pre-release (unverified against checksums, `loki` only), or run `make dist/loki-linux-riscv64` with Go 1.27.4.

## 9. Dependencies

Loki is built from `go.mod`; a missing Ubuntu `-dev` package does not block a Go build. The project graph found no Go library `-dev` packages for any of these, so graph confirmation is absent for all rows. The build/test/release columns below come from issue-search hits and file counts, not from builds. "Not checked" means no riscv64 data was gathered.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Go | build-dependency, critical | Available: `golang-go`, `golang-1.25-go`, `golang-1.26-go` in resolute riscv64. `go.mod` asks for 1.27.4, newer than the 1.26 resolute ships | n/a | n/a | see [RISE Go post](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/) |
| klauspost/compress | runtime, critical | No riscv64 assembly vendored; fallback expected, not verified | #532 (arm64, closed, 2022) shows s2/zstd tests take 13-22 min on slow hardware; riscv64 may need longer timeouts | n/a | No riscv64 issue found |
| klauspost/cpuid | runtime, optional | #158 "Support RISC-V" closed; fix in pinned v2.4.1 not checked | n/a | n/a | Loki bumps #25677, #25357, #22822, #22875 mention riscv64 CPU detection |
| pierrec/lz4 | runtime, optional | No riscv64 assembly; fallback not verified | n/a | n/a | No riscv64 issue found |
| golang/snappy | runtime, optional | No riscv64 assembly; no issue found | n/a | n/a | none |
| cespare/xxhash | runtime, optional | No riscv64 assembly; no issue found | n/a | n/a | none |
| zeebo/xxh3 | runtime, optional | Assembly is amd64 only; fallback not verified | n/a | n/a | none |
| RoaringBitmap/roaring | runtime, optional | No riscv64 issue found (#346 is arm64 popcount, closed) | n/a | n/a | none |
| apache/arrow-go | runtime, critical | No riscv64 assembly; no issue found | n/a | n/a | #983 (open) is arm64 NEON, shows partial portability of assembly |
| parquet-go/parquet-go | runtime, critical | No riscv64 assembly; no issue found | n/a | n/a | #6 (arm64 CI, closed) |
| bbolt | runtime, critical | No riscv64 issue; #848 is arm64 only (closed) | n/a | n/a | none |
| modernc.org/sqlite | runtime, optional | Not checked; ships per-architecture transpiled code | n/a | n/a | none checked |
| golang.org/x/crypto | runtime, optional | riscv64 poly1305 assembly vendored; otherwise not checked | n/a | n/a | none checked |
| Prometheus | runtime, critical | Not checked | n/a | n/a | none checked |
| prometheus/client_golang | runtime, critical | Not checked | n/a | n/a | none checked |
| gRPC-Go | runtime, critical | Not checked | n/a | n/a | none checked |
| etcd | runtime, optional | Not checked | n/a | n/a | none checked |
| andybalholm/brotli | runtime, optional | Not checked | n/a | n/a | none checked |
| ebitengine/purego | runtime, optional | #382 "Support RISCV" closed; 6 riscv64 .s files vendored | n/a | n/a | #546 (open): on loong64 and riscv64, float arguments beyond the eighth go on the stack instead of in registers. Matters only if purego is used on riscv64; Loki likely pulls it in indirectly via gopsutil [NEEDS VERIFICATION] |

Indirect and additional: `zombiezen/go-sqlite` (no riscv64 issue found), `modernc.org/libc` and `memory` (not checked), `golang.org/x/sys` (riscv64 assembly vendored; Loki bumps #10252, #10436, #10800 mention riscv_hwprobe), `shirou/gopsutil` (#20347 riscv cpu parser).

Deep-dive: the vendored SIMD-bearing libraries (compression, hashing, columnar) have no riscv64 assembly; whether each falls back to pure Go was not verified. The successful cross-compile implies they compile. The open purego #546 is the only riscv64-specific correctness bug found among dependencies. Dependency status reports exist in the repository for lz4, snappy, xxhash, sqlite, golang-org-x-crypto, prometheus, prometheus-client_golang, grpc-go, etcd, brotli and go (project-reports/); they were referenced, not re-read here.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#21217](https://github.com/grafana/loki/issues/21217) | Add riscv64 release binaries | closed 2026-04-20 | n/a | Fixed by #21597 |
| [#21220](https://github.com/grafana/loki/pull/21220) | Add riscv64 to cross-compilation matrix | closed unmerged | n/a | Superseded by #21597 |
| Bugbot thread on [#21597](https://github.com/grafana/loki/pull/21597) | riscv64 binary uploaded unzipped without SHA256 checksum | unresolved, no fix found | Medium (per Bugbot) | Binary is not in `SHA256SUMS` |
| [#6944](https://github.com/grafana/loki/issues/6944) | Unaligned 64-bit atomic panic | open | n/a to RISC-V | 32-bit ARM only |
| purego #546 | float args beyond eighth on stack (riscv64, loong64) | open | possible | Upstream dependency |

Correctness bugs: no open RISC-V correctness or performance bugs were found in grafana/loki. The searches were semantic, so zero results is not proof of absence.

## 12. Objections and Upstream Blockers

- Stated objections (chaudum, 2026-04-15): no capacity for riscv quirks; each architecture lengthens an already long CI. Resolved by making the build best effort and non-blocking.
- Technical blockers: none found for the cross-compile.
- Organizational blockers: maintainers do not officially support RISC-V. Fixes are community-maintained. Grafana is not a RISE member, and there is no RISE involvement with Loki (38 RISE blog posts checked, none mention Loki; no `riseproject-dev` repo for Loki).
- Acceptance probability: the best-effort build is already accepted. Acceptance of native riscv64 CI or official support is Data not available; the only signal is that Grafana accepts ports with no maintenance obligation. gounthar offered to help with riscv64 issues.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream

Justification: Loki is pure Go. Since [PR #21597](https://github.com/grafana/loki/pull/21597) (merged 2026-04-20), its release-PR workflows cross-compile `make dist/loki-linux-riscv64` on an x86 runner with `continue-on-error`, and nothing runs tests on riscv64. That is build-only CI. Upstream publishes a bare `loki-linux-riscv64` binary, but only in the v4.0.0-rc.2 and rc.3 pre-releases; stable 3.7.10 and 3.6.21 have none. Maintainers say they do not officially support RISC-V.

Pending work: no open Loki RISC-V work was found. #21217 is closed, #21220 was closed unmerged, and backports #21846 and #21847 are merged. Remaining gaps are the unzipped riscv64 binary missing from `SHA256SUMS` and the lack of a native riscv64 test job. Loki could use the free RISE `ubuntu-24.04-riscv` runners that gounthar proposed in #21217. RISE has no direct involvement with Loki.

## 14. Investment Analysis

RISE check: RISE has no Loki work, funded or otherwise (blog, RFP and repo searches found nothing). RISE provides free native runners, which lowers the CI cost. All effort figures below are estimates by the author, not derived from upstream data.

### 14.1 Functional Enablement

Fix the release step so the riscv64 binary is zipped, checksummed and uploaded in stable releases (the Bugbot finding). Investigate why 3.7.10 and 3.6.21 lack the asset despite merged backports. Add `logcli`, `loki-canary` and `lokitool` to the optional targets.

### 14.2 Performance Optimization

No benchmark exists. First step is a baseline of ingest and query throughput against arm64. Riscv64 assembly for compression and hashing (zstd, s2, xxhash, parquet) would be in the vendored dependencies and goes upstream to those projects. Sizing is deferred until a baseline shows a gap.

### 14.3 CI/CD Infrastructure

Add a native test job on RISE `ubuntu-24.04-riscv` runners, `continue-on-error` initially, since a full Loki native build took 29m10s on a RISE runner. Run unit tests for the critical dependencies (bbolt, compression) on riscv64.

### 14.4 Ecosystem Enablement

Not applicable: no dependent package ecosystem. An OCI image for riscv64 would need a base image and is a follow-up.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Zip, checksum and upload riscv64 binary; find why stable releases lack it | 1-2 | Loki release maintainers or community | High |
| Functional | Add logcli, canary and lokitool riscv64 targets | 1 | Community / us | Medium |
| CI/CD | Native riscv64 build and test job on RISE runners | 2-3 | Us, with Grafana review | High |
| Performance | Baseline benchmarks vs arm64 | 2-3 | Us | Medium |
| Performance | riscv64 assembly for hot dependency paths | Not sized (needs baseline) | Dependency upstreams | Low |
| Functional | riscv64 OCI image | 2 | Us / Grafana | Low |

## 15. References

- [Issue #21217: Add riscv64 release binaries](https://github.com/grafana/loki/issues/21217)
- [PR #21597: Include linux/riscv64 Loki build in releases](https://github.com/grafana/loki/pull/21597)
- [PR #21220: add riscv64 to cross-compilation build matrix](https://github.com/grafana/loki/pull/21220)
- [PR #21847: release-3.7.x workflows backport](https://github.com/grafana/loki/pull/21847)
- [PR #21846: release-3.6.x workflows backport](https://github.com/grafana/loki/pull/21846)
- [Issue #6944: unaligned atomic panic on 32-bit ARM](https://github.com/grafana/loki/issues/6944)
- [grafana/loki repository](https://github.com/grafana/loki)
- [Grafana Loki homepage](https://grafana.com/oss/loki/)
- [v4.0.0-rc.3 riscv64 asset](https://github.com/grafana/loki/releases/download/v4.0.0-rc.3/loki-linux-riscv64)
- [RISE members](https://riseproject.dev/members)
- [RISE RISC-V runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE: Advancing Go on RISC-V](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [Cloud-V page on Loki (third party, predates #21597)](https://cloud-v-10xe.github.io/RISC-V-software/loki/)
- Local evidence: `crosscompile.mk`, `.github/release-workflows.jsonnet`, `.github/workflows/{minor,major,patch}-release-pr.yml`, `.github/vendor/github.com/grafana/loki-release/workflows/runner.libsonnet` at commit `5cefe46c11b11d9a6a32519ebb60f9a9a4bd86c1`
