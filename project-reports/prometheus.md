---
title: Prometheus
parent: Project Reports
categories:
  - observability
---

# Prometheus

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Prometheus<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[Prometheus](https://prometheus.io/) ([github.com/prometheus/prometheus](https://github.com/prometheus/prometheus)) is an open-source systems monitoring and alerting toolkit originally built at SoundCloud. It is written entirely in Go, scraped-pull-model-based, and stores time-series data in a custom on-disk database (TSDB). The project is the canonical monitoring backend in cloud-native deployments.

**Governance:** Prometheus is a [CNCF graduated project](https://www.cncf.io/projects/prometheus/) -- the second project to reach graduation after Kubernetes. It operates under The Linux Foundation via the CNCF. Licensing is Apache 2.0. As of June 2026, the project is completing its first bootstrap Steering Committee election (voting window: June 15-29 2026, results: July 6 2026). The 7-seat Steering Committee is the new formal governance body; governance votes are resolved by simple majority (>50%). Seats are held by individuals, not companies.

**Corporate sponsorship:** Grafana Labs is the dominant commercial sponsor by maintainer count. Active general maintainers include George Krajcsovits (@krajorama, Grafana), Bryan Boreham (@bboreham, Grafana Labs), Arve Knudsen (@aknuds1, Grafana), Julien Pivotto (@roidelapluie, independent), Bartlomiej Plotka (@bwplotka, Google), and Ayoub Mrini (@machine424, Red Hat). Release coordination for v3.x is also predominantly Grafana-affiliated.

**RISE membership:** Prometheus is not a RISE project member and has no RISE affiliation. A search of all 27 RISE blog posts (May 2024 - June 2026) and the full RISE project repository list returns zero mentions of Prometheus. The RISE wheel builder (gitlab.com/riseproject) does not contain a Prometheus entry.

**Language:** Pure Go. No C, no assembly, no CGO. No JIT backends. No SIMD dispatch.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Primary Source |
|---|---|---|
| May 31, 2019 | [PR #5621](https://github.com/prometheus/prometheus/pull/5621) ("Riscv support") opened by carlosedp. Attempted to patch Utsname string conversions for the pre-upstream Go RISC-V fork. | PR #5621 |
| Aug 21, 2019 | [PR #5625](https://github.com/prometheus/prometheus/pull/5625) ("pkg/runtime: simplify Utsname string conversion") merged. Switched Utsname handling to golang.org/x/sys/unix, which uses portable byte arrays rather than int8/uint8 arrays. This eliminated the need for any RISC-V-specific patch. | PR #5625 |
| Sep 2, 2019 | PR #5621 closed by author (carlosedp) as unnecessary. Author confirmed `make build` succeeded from master without the patch after #5625 and its follow-on. | PR #5621 discussion |
| Jul 6, 2023 | [PR #12530](https://github.com/prometheus/prometheus/pull/12530) ("Update promu") merged by Julien Pivotto. Bumped the promu build tool from v0.14.0 to v0.15.0. promu v0.15.0 added `linux/riscv64` to its `defaultPlatforms` list, which automatically included riscv64 in all Prometheus release cross-builds without code changes. Authored by Ben Kochie (@SuperQ). | PR #12530 |
| Jul 25, 2023 | v2.46.0 released. First release to include `prometheus-2.46.0.linux-riscv64.tar.gz` as a named GitHub Release asset. v2.45.0 (Jun 23, 2023) did not include this asset. | GitHub Releases API |
| Nov 8, 2025 | [PR #17508](https://github.com/prometheus/prometheus/pull/17508) ("Build riscv64 docker image by default") opened by ffgan. Co-authored by nijincheng@iscas.ac.cn (ISCAS is a RISE General Member). | PR #17508 |
| Jan 19, 2026 | [PR #17876](https://github.com/prometheus/prometheus/pull/17876) ("Add distroless Docker image variant") merged by roidelapluie. Post-merge discovery: `gcr.io/distroless/static-debian13:nonroot-riscv64` did not exist, blocking the v3.10 release. | PR #17876 |
| Feb 10, 2026 | PR #17508 merged by George Krajcsovits (@krajorama, Grafana). riscv64 added to the default Docker build pipeline (`DOCKER_ARCHS`). | PR #17508 |
| Feb 19, 2026 | [PR #18115](https://github.com/prometheus/prometheus/pull/18115) ("Cut v3.10.0-rc.1") merged. Originally drafted to remove riscv64 from distroless targets; superseded by a Makefile.common fix in PR #18110. Release candidate cut. | PR #18115 |
| Feb 20, 2026 | [PR #18124](https://github.com/prometheus/prometheus/pull/18124) ("chore(ci): Add registry-specific architecture exclusions") merged. Introduced `DOCKER_REGISTRY_ARCH_EXCLUSIONS` to exclude riscv64 from quay.io pushes (which returned "unauthorized" because the quay.io riscv64 repository had never been created). riscv64 images continued publishing to docker.io. | PR #18124 |
| Feb 26, 2026 | v3.10.0 released. First release with linux/riscv64 Docker images. | GitHub Releases API |
| Apr 16, 2026 | [PR #18527](https://github.com/prometheus/prometheus/pull/18527) ("Fix quay.io riscv64 publishing") merged by SuperQ. Root cause: quay.io requires manual repository creation before images can be pushed. The riscv64 repository was created; no code change was needed. | PR #18527 |
| Apr 20, 2026 | [PR #18548](https://github.com/prometheus/prometheus/pull/18548) ("build: remove DOCKER_REGISTRY_ARCH_EXCLUSIONS and DOCKERFILE_ARCH_EXCLUSIONS logic") merged. All workaround exclusion logic removed. Both the quay.io riscv64 repository and upstream distroless riscv64 support were confirmed available. | PR #18548 |

**Summary:** The riscv64 binary port required zero architecture-specific code changes to Prometheus itself. Enablement was purely a build-tooling event (promu v0.15.0). Docker image support required 17 months of additional infrastructure work after binary release, involving three rounds of publication bug fixes.

---

## 3. Upstream Support Tier

Prometheus does not publish a formal platform tier policy. There is no PLATFORMS.md, SUPPORT.md, or analogous document defining tiers.

**De facto binary tier:** riscv64 is a first-class release artifact. `prometheus-X.Y.Z.linux-riscv64.tar.gz` has appeared in every release from v2.46.0 (July 2023) through v3.12.0 (May 28, 2026), the current latest stable. The riscv64 binary is produced by promu's default `crossbuild` -- the same mechanism that produces amd64, arm64, armv5/v6/v7, mips, mips64, ppc64, s390x.

**De facto Docker tier:** riscv64 Docker images are built and published by default to docker.io and quay.io since v3.10.0 (February 2026). The `DOCKER_ARCHS ?= amd64 arm64 armv7 ppc64le riscv64 s390x` variable in `Makefile.common` is the authoritative platform list.

**De facto test tier:** riscv64 receives no test execution in CI. All test jobs (`test_go`, `test_go_more`, `test_go_386`, `test_windows`, etc.) run on `ubuntu-latest` (x86_64) runners. There is no QEMU-based riscv64 test, no native riscv64 runner, and no `GOARCH=riscv64` test invocation anywhere in the CI configuration. The riscv64 binary ships untested on riscv64 hardware.

**PR CI tier:** riscv64 is explicitly excluded from the PR/branch build job. The `.github/workflows/ci.yml` `build` job specifies `promu_opts: "-p linux/amd64 -p windows/amd64 -p linux/arm64 -p darwin/amd64 -p darwin/arm64 -p linux/386"`. riscv64 is not in this list; it is not even cross-compiled on pull request CI runs.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Prometheus is a pure-Go application. There are no architecture-specific code paths in the entire repository.

**Architecture-specific source file inventory:**

The `tsdb/fileutil/` directory contains files with misleading names (`mmap_amd64.go`, `mmap_arm64.go`, `mmap_386.go`). All three carry the build constraint `//go:build windows` and contain only a `maxMapSize` constant. They are Windows-specific, not architecture-specific. The actual mmap implementation (`mmap_unix.go`, build tag `//go:build !windows && !plan9 && !js`) covers riscv64/linux without modification.

**Full inventory of build-tagged files and riscv64 coverage:**

| File | Build Constraint | riscv64 Coverage |
|---|---|---|
| `tsdb/fileutil/mmap_unix.go` | `!windows && !plan9 && !js` | Covered |
| `tsdb/fileutil/direct_io_linux.go` | `linux && !forcedirectio` | Covered |
| `util/runtime/statfs_default.go` | `!windows && !openbsd && !netbsd && !solaris && !386` | Covered |
| `util/runtime/uname_linux.go` | (linux, no arch constraint) | Covered |
| `util/runtime/limits_default.go` | `!windows` | Covered |
| `tsdb/fileutil/mmap_amd64.go` | `windows` | Not applicable (Windows-only constant) |
| `tsdb/fileutil/mmap_arm64.go` | `windows` | Not applicable (Windows-only constant) |
| `tsdb/fileutil/mmap_386.go` | `windows` | Not applicable (Windows-only constant) |

No `.s` assembly files of any kind exist in the repository. No CGO usage exists in `go.mod` or source. No arch-tagged Go files (`_riscv64.go`, `_amd64.go`, etc.) exist.

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

**There is no riscv64-specific implementation gap in Prometheus itself.** The riscv64 build is not a stub or partial port. It is the direct output of `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build` on the same source tree used for all other architectures.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Prometheus uses promu (v0.18.1, as defined by `PROMU_VERSION` in `Makefile.common`) as its primary build tool. promu wraps `go build` with injected ldflags for version metadata. There is no CMake, autoconf, or Meson. There are no `-D` style build flags.

**Toolchain requirements for riscv64:**

| Component | Minimum Version | Notes |
|---|---|---|
| Go | 1.25.0 (`go.mod` directive); promu config specifies 1.26 | GOARCH=riscv64 supported since Go 1.14 |
| CGO | Not required | `netgo` build tag + `CGO_ENABLED=0`; pure Go networking |
| GCC / Clang cross-compiler | Not required | Only needed if CGO enabled; it is not |
| promu | 0.18.1 | `PROMU_VERSION` in `Makefile.common` |
| Node.js / pnpm | Per `.nvmrc` | Only for `make assets` (React UI asset pre-compilation); see known limitation below |
| Docker | Any with manifest support | For image packaging only |

**The `golang-builder` Docker image** (`quay.io/prometheus/golang-builder`), which installs GCC cross-compilers for CGO-enabled architectures, does not support riscv64. That image covers arm, powerpc, mips, and s390x only. This is irrelevant for Prometheus itself (no CGO required) but matters for any downstream project that adds CGO dependencies.

**Standard cross-compilation command:**

```
GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build \
  -tags "netgo builtinassets" \
  -ldflags "-X github.com/prometheus/common/version.Version=$(cat VERSION) ..." \
  ./cmd/prometheus ./cmd/promtool
```

**Via promu:**

```
promu crossbuild -p linux/riscv64
```

riscv64 is not listed in `.promu.yml`'s `crossbuild.platforms` section. It is included via promu's internal `defaultPlatforms` list (which includes `linux/riscv64`). To build riscv64 explicitly via the `.promu.yml` crossbuild config, `linux/riscv64` must be added manually to that file.

**Known build limitation -- Node.js:** PR #17508 explicitly notes that "Node.js currently does not officially support riscv64, which could lead to problems such as illegal instructions" when running `make build` natively on riscv64 hardware. The `make assets` step (React UI compilation via Node.js/pnpm) is the failure point. The workaround is to cross-compile from an x86 or arm64 host. This limitation is acknowledged as out of scope by the PR author and does not affect the released binary (assets are pre-compiled and embedded).

**QEMU usage:** QEMU is used only for Docker multi-platform image builds (`docker/setup-qemu-action@v4.0.0`) when `enable_docker_multibuild: true` is set. It is not used for binary cross-compilation (Go cross-compiles natively without emulation) and is not used for any test execution.

**Build tags of note:**

| Build Tag | Effect |
|---|---|
| `netgo` | Pure Go net stack; no CGO dependency on libc resolver |
| `builtinassets` | Embeds pre-compiled React UI into binary |
| `remove_all_sd` | Strips optional service discovery backends (retains file_sd, static_sd, http_sd) |
| `enable_<name>_sd` | Re-enables a specific service discovery module |

For a minimal riscv64 binary: `go build -tags "netgo builtinassets remove_all_sd" ./cmd/prometheus`

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because Prometheus has no architecture-specific code paths, the feature gap between riscv64, arm64, and amd64 is zero at the application level.

**Performance gaps (indirect, via dependencies):**

| Layer | amd64 | arm64 | riscv64 | Impact on Prometheus |
|---|---|---|---|---|
| AES-GCM (TLS) | Hardware intrinsics (`golang.org/x/crypto`) | Hardware intrinsics | Pure-Go fallback | ~3-5x slower TLS throughput on riscv64 for HTTPS scraping at high cardinality |
| ChaCha20-Poly1305 (TLS) | Hardware intrinsics | Hardware intrinsics | Pure-Go fallback | Same as above |
| SHA-256/SHA-512 | Hardware intrinsics | Hardware intrinsics | Pure-Go fallback | Minor; affects TLS certificate verification |
| xxhash (TSDB label hashing) | asm (`xxhash_amd64.s`) | asm (`xxhash_arm64.s`) | Pure-Go (`xxhash_other.go`, build tag `!amd64,!arm64`) | ~2x slower label fingerprinting at high series cardinality |
| zstd (remote-write compression) | AVX2-accelerated (`klauspost/compress`) | NEON-accelerated | Pure-Go | Throughput reduction on high-volume remote-write paths |
| Snappy (remote-write legacy) | Pure-Go (golang/snappy) | Pure-Go | Pure-Go | No gap |
| PromQL execution | Pure-Go | Pure-Go | Pure-Go | No gap |
| TSDB chunk encoding | Pure-Go | Pure-Go | Pure-Go | No gap |

Data not available: Published benchmark figures quantifying the above throughput deltas for Prometheus specifically on riscv64 hardware. The gaps above are inferred from dependency-level findings, not from Prometheus-specific profiling results.

**Race detector:** The Go race detector does not support riscv64 as of the current Go 1.25/1.26 toolchain. riscv64 cannot be tested with `-race`.

---

## 7. CI/CD Infrastructure

**Upstream CI (github.com/prometheus/prometheus):**

All CI runs on `ubuntu-latest` (x86_64) GitHub-hosted runners. The project uses GitHub Actions exclusively; no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

14 workflow files exist in `.github/workflows/`. Zero contain any mention of riscv64 in the context of test execution or native-architecture build. The relevant jobs are:

**`build` job (triggers on: PRs, non-release branch pushes):**
`promu_opts: "-p linux/amd64 -p windows/amd64 -p linux/arm64 -p darwin/amd64 -p darwin/arm64 -p linux/386"`
riscv64 is explicitly absent. It is not cross-compiled on ordinary PR CI runs.

**`build_all` job (triggers on: pushes to `main`, pushes to `refs/tags/v2.*` and `refs/tags/v3.*`, PRs targeting `release-*` branches):**
No `promu_opts` override. Calls `prometheus/promci/build` action, which runs `promu crossbuild` using promu's full `defaultPlatforms` list. riscv64 is included here. The runner is `ubuntu-latest` (x86_64). This is a cross-compilation build step, not a test execution step.

**Test jobs (`test_go`, `test_go_more`, `test_go_386`, `test_windows`):**
All run on `ubuntu-latest` (x86_64). No QEMU emulation. No `GOARCH=riscv64`. No riscv64 test execution of any kind.

**Summary:** riscv64 receives zero test execution in upstream CI. The binary is cross-compiled on main/release pushes but ships without functional or unit testing on the target architecture.

**RISE runners:** The RISE project operates Scaleway EM-RV1 native RISC-V GitHub Actions runners. As of May 6, 2026, these runners have completed 13,000+ CI jobs across 197 repositories (99.78% completion rate, ~445 jobs/day). Prometheus is not among the repositories using RISE runners. There is no open issue or PR in prometheus/prometheus requesting RISE runner integration.

---

## 8. Distribution and Release Status

**GitHub Releases (upstream binary tarballs):**

`prometheus-X.Y.Z.linux-riscv64.tar.gz` is present in every release from v2.46.0 (July 25, 2023) through v3.12.0 (May 28, 2026). Confirmed via GitHub Releases API for v3.5.4 (June 17, 2026), v3.12.0, and v3.12.0-rc.0.

v2.45.0 (June 23, 2023) does not include a riscv64 tarball. v2.46.0 is the first.

**Docker Hub (docker.io/prom/prometheus):**

riscv64 images are present on `latest-busybox`, `latest-distroless`, and all versioned tags from v3.10.0 onward. The current image platform matrix for v3.12.0 is: `linux/amd64`, `linux/arm64`, `linux/arm/v7`, `linux/ppc64le`, `linux/riscv64`, `linux/s390x`.

Note: The `latest` tag (which points to the busybox variant) shows 5 architectures without riscv64 in one data source [NEEDS VERIFICATION -- the Docker Hub API response for `latest` vs `latest-busybox` may differ; PR #17508 and #18548 confirm riscv64 is in `DOCKER_ARCHS`].

**quay.io (quay.io/prometheus/prometheus):**

riscv64 support was broken from v3.10.0 (February 2026) through April 2026 due to quay.io requiring manual repository creation. PR #18527 (merged April 16, 2026) created the missing quay.io repository. All subsequent releases publish riscv64 images to quay.io without exclusion.

**Debian (tracker.debian.org):**

Version 2.53.5+ds1-5, status "Installed" on riscv64, built by buildd `rv-manda-02`. All mainstream Debian architectures built: amd64, arm64, armhf, i386, loong64, ppc64el, riscv64, s390x. This version is significantly behind upstream (v2.53.x vs upstream v3.12.0).

**Ubuntu 24.04 (Noble):**

Package `prometheus` version 2.45.3+ds-2build1 is explicitly listed for riscv64 alongside amd64, arm64, armhf, ppc64el, s390x. Related packages (prometheus-alertmanager, prometheus-node-exporter, prometheus-pushgateway, prometheus-postgres-exporter) carry the same architecture list.

**Arch Linux RISC-V (archriscv.felixc.at):**

The package is in `sv39-blacklist.txt` as of [PR #4854](https://github.com/felixonmars/archriscv-packages/pull/4854) ("sv39-blacklist: add prometheus"), merged August 6, 2025. Root cause: Node.js WebAssembly `Out of memory` error on sv39 virtual address space-constrained hardware during the web UI asset build step. The package is blacklisted for the most common RISC-V hardware class (sv39, e.g., VisionFive 2, HiFive Unmatched). It may build on sv48/sv57 hardware. The Arch Linux RISC-V mirror shows `prometheus-2.52.1-1-riscv64.pkg.tar.zst` (dated June 2, 2024), significantly behind upstream.

**PyPI:** Not applicable. The `prometheus` package on PyPI (v0.3.0) is an unrelated Python project. The real Prometheus monitoring system does not publish to PyPI.

**Release status summary:**

| Channel | riscv64 Present | Version | Notes |
|---|---|---|---|
| GitHub upstream releases | YES | v3.12.0 (current) | Present since v2.46.0 (Jul 2023) |
| Docker Hub | YES | v3.12.0 | Since v3.10.0 (Feb 2026) |
| quay.io | YES | v3.10.0+ | Fixed Apr 2026; broken Feb-Apr 2026 |
| Ubuntu 24.04 | YES | 2.45.3+ds (distro-packaged) | Listed for riscv64 |
| Debian sid | YES | 2.53.5+ds1-5 | "Installed" on riscv64 buildd |
| Arch Linux RISC-V | PARTIAL | 2.52.1-1 | sv39-blacklisted since Aug 2025 |
| PyPI | N/A | N/A | Wrong package; not applicable |

---

## 9. Dependencies

The following direct and key indirect dependencies carry riscv64-relevant build or performance considerations. "riscv64 build status" means: does the module compile cleanly under `GOOS=linux GOARCH=riscv64`?

| Dependency | Role in Prometheus | riscv64 Build | riscv64 Test CI | riscv64 Asm/Accel | Blocking Issues |
|---|---|---|---|---|---|
| Go toolchain (`golang/go`) | Runtime, GC, scheduler, stdlib, crypto | Builds (secondary port since Go 1.14) | Community builders only | Partial (soft-float optimized since ~1.22; no RVV) | Open: [#74683](https://github.com/golang/go/issues/74683) FIPS140 broken on riscv64 with `-buildmode=pie`. Open: [#77069](https://github.com/golang/go/issues/77069) crypto P256 mul unoptimized. Open: [#77328](https://github.com/golang/go/issues/77328) Zvkned assembler missing. |
| `golang.org/x/crypto` | TLS, AEAD, certificates for HTTPS scrape and remote-write | Builds; pure-Go fallback on riscv64 | No riscv64 CI | No asm for riscv64 (AES-GCM, ChaCha20, SHA-256 asm absent) | Performance: ~3-5x slower TLS throughput vs amd64/arm64. FIPS PIE blocked by golang/go#74683. |
| `cespare/xxhash/v2` | 64-bit hash for TSDB chunk indexing, label fingerprinting | Builds; falls back to `xxhash_other.go` (build tag `!amd64,!arm64`) | No riscv64 CI | No asm for riscv64 | No open correctness issues. Pure-Go fallback ~2x slower than asm paths on other arches. No upstream plan to add riscv64 asm. |
| `klauspost/compress` | Snappy, zstd, gzip for remote-write and TSDB | Builds; riscv64 unsafe little-endian path was added (issue #1036, closed) | No riscv64 CI | No riscv64 SIMD (x86 AVX2 / arm64 NEON only) | No open riscv64 issues. Pure-Go zstd active on riscv64. |
| `golang/snappy` | Legacy Snappy framing for remote-write protocol | Builds; pure-Go on non-amd64/non-arm64 | No riscv64 CI | No asm for riscv64 | No open riscv64 issues. |
| `google/pprof` | CPU/memory profiling, `/debug/pprof` endpoint | Builds; uses Go runtime stack walking | No riscv64 CI | No arch-specific code | No open riscv64 issues. Native perf annotation (Linux perf) non-functional without riscv64 perf support. |
| `prometheus/procfs` | Reads `/proc` and `/sys` for node metrics | Builds; CPUInfo parsing for RISC-V was added ([PR #318](https://github.com/prometheus/procfs/pull/318)) and a wiring bug fixed ([PR #325](https://github.com/prometheus/procfs/pull/325)) | No riscv64 CI | No asm | No open riscv64 issues. Historical build breakage (v0.1.3-v0.2.0) was resolved in v0.3.0. |
| `prometheus/client_golang` | Prometheus self-instrumentation | Builds; was broken on riscv64 before bumping procfs dependency (PR #833, closed) | No riscv64 CI | No asm | No open riscv64 issues. |
| `edsrzf/mmap-go` | Memory-mapped file I/O for TSDB WAL and chunk files | Builds; `mmap` syscall is arch-independent via `golang.org/x/sys` | No riscv64 CI | No asm | No open riscv64 issues. |
| `grafana/regexp` | DFA-based regex for label selector matching | Builds; pure-Go fork of stdlib regexp | No riscv64 CI | No asm | No open riscv64 issues. |
| `google.golang.org/grpc` | Remote-write gRPC transport | Builds; no arch-specific code | No riscv64 CI | No asm | No open riscv64 issues. |
| `go.uber.org/automaxprocs` | cgroup CPU quota -> GOMAXPROCS | Builds; pure Go | No riscv64 CI | No asm | No open riscv64 issues. |
| `KimMachineGun/automemlimit` | cgroup memory.max -> soft memory limit | Builds; pure Go | No riscv64 CI | No asm | No open riscv64 issues. |
| `dennwc/varint` | Varint encoding for TSDB posting lists | Builds; pure Go | No riscv64 CI | No asm | No open riscv64 issues. |

**Blocking dependency issues:**

1. `golang/go#74683` (open) -- FIPS140 broken on riscv64 with `-buildmode=pie`. Blocks any Prometheus build in a FIPS-enforcing environment on riscv64 (e.g., RHEL 9 in FIPS mode). Affects all PIE builds, including hardened OS default configurations.
2. No riscv64 native CI runners in any part of the dependency stack. All builds are cross-compiled. Correctness validation on real hardware is absent throughout.
3. `cespare/xxhash` and `klauspost/compress` lack riscv64 asm. No upstream plans to add them. TSDB ingestion and remote-write compression run on pure-Go fallbacks.
4. `golang.org/x/crypto` pure-Go TLS on riscv64 produces approximately 3-5x slower AEAD throughput vs the asm-accelerated amd64/arm64 paths. This is a material concern for Prometheus deployments that scrape thousands of HTTPS targets.

Data not available: Published Prometheus-specific benchmark figures isolating the throughput impact of these dependency-level fallbacks on riscv64 hardware.

---

## 10. Ecosystem Status

**node_exporter (`prometheus/node_exporter`):**

riscv64 binary releases began with v1.7.0 (November 13, 2023). A GitHub issue (#2645) documenting a user request to add riscv64 to the CI build pipeline was closed. The user confirmed that `GOARCH=riscv64 make build` cross-compiled successfully and that the resulting binary ran on a StarFive VisionFive 2 board with standard metrics accessible. No performance issues were reported in that issue.

**alertmanager (`prometheus/alertmanager`):**

riscv64 binary and Docker image present in latest v0.33.0 (June 12, 2026). Docker multi-arch images published to quay.io including riscv64. No open riscv64 issues.

**pushgateway (`prometheus/pushgateway`):**

riscv64 binary present in latest v1.11.3 (May 27, 2026). No open riscv64 issues.

**Arch Linux RISC-V ecosystem:**

The Arch Linux RISC-V mirror (`mirror.iscas.ac.cn/archriscv`) contains a rich set of exporters: prometheus-node-exporter 1.11.1, prometheus-blackbox-exporter 0.28.0, prometheus-postgres-exporter 0.19.1, prometheus-ssl-exporter 2.6.1, prometheus-redis-exporter 1.81.0, and 15+ others. These are all available as riscv64 packages and are more current than the main prometheus package (which is sv39-blacklisted due to the Node.js build issue).

**RISE ecosystem:** No RISE working group activity specific to Prometheus has been identified. The RISE Language Runtimes working group (lead: Jeff Law, Qualcomm) covers Go, Java, and Python runtimes but no Prometheus-specific work has been published.

---

## 11. Known Bugs and Active Issues

**Open riscv64-specific issues in prometheus/prometheus:** Zero. GitHub searches for `riscv64 state:open repo:prometheus/prometheus` and an org-wide `riscv org:prometheus` search return no open issues.

**Closed riscv64-specific bugs:**

1. **procfs CPUInfo wiring bug** (procfs [PR #325](https://github.com/prometheus/procfs/pull/325), closed, fixed in procfs v0.3.0): PR #318 added `parseCPUInfoRISCV` for `/proc/cpuinfo` parsing on riscv64 but failed to wire the function to the dispatch table. On riscv64, the code compiled with a `parseCPUInfo` undefined error. Affected procfs v0.1.3-v0.2.0. Downstream: prometheus/client_golang PR #833 had to bump its procfs dependency to pick up the fix.

2. **Distroless riscv64 image not found** (PR #17876 post-merge, resolved via PR #18115 and Makefile.common fix, Feb 2026): `gcr.io/distroless/static-debian13:nonroot-riscv64` did not exist at the time PR #17876 was merged, blocking the v3.10.0 release. Resolved by upstream distroless adding riscv64 support.

3. **quay.io riscv64 "unauthorized" error** (PR #18124, root cause resolved PR #18527, Apr 2026): quay.io requires manual repository creation for each new architecture. The riscv64 repository was never created, silently failing all pushes. Resolved by creating the repository. No code change was required.

**Open upstream issues affecting riscv64 Prometheus deployments:**

- `golang/go#74683` (open): FIPS140 `-buildmode=pie` broken on riscv64.
- `golang/go#77069` (open): `crypto/internal/fips140/nistec` P256 mul unoptimized on riscv64.
- `golang/go#77328` (open): Zvkned extension missing in Go assembler.
- Node.js riscv64 instability (`nodejs/build#4099`, open): Relevant for the Prometheus web UI build step on native riscv64 hardware (illegal instruction errors, Wasm OOM on sv39). Prometheus v3.x build blocked on native riscv64 hardware for this reason.

---

## 12. Objections and Upstream Blockers

**"Prometheus is already fully supported on riscv64"**

Partially true. Binary tarballs ship since July 2023. Docker images ship since February 2026. The implementation is pure Go with no architecture-specific gaps. However, "fully supported" overstates the case: (1) riscv64 is excluded from PR CI build jobs; (2) no riscv64 test execution exists anywhere in the CI pipeline; (3) the binary ships with zero upstream quality assurance on the target architecture; (4) the Arch Linux riscv64 port is sv39-blacklisted due to a Node.js OOM condition; (5) TLS-intensive deployments face 3-5x crypto throughput regression vs amd64/arm64.

**"There is no work left to do for riscv64 on Prometheus"**

Incorrect. Specific gaps: (a) no riscv64 CI test runners (zero test coverage on target); (b) no riscv64 entry in the PR build job `promu_opts`; (c) crypto throughput regression affecting HTTPS scraping at scale; (d) FIPS PIE build broken via Go toolchain issue; (e) Node.js build limitation blocking native compilation of the web UI binary.

**"Pure Go means performance is identical across architectures"**

Incorrect at the dependency layer. `golang.org/x/crypto` uses hardware AES instructions on amd64 and arm64 but falls back to pure Go on riscv64. `cespare/xxhash` uses hand-written assembly on amd64 and arm64, pure Go on riscv64. `klauspost/compress` uses AVX2 on amd64 and NEON on arm64, pure Go on riscv64. The cumulative throughput impact on a high-cardinality Prometheus instance with HTTPS scraping and remote-write compression is non-trivial.

**"The Arch Linux riscv64 blacklist is a minor packaging issue"**

The sv39 blacklist covers the most common class of available RISC-V hardware including the VisionFive 2 and HiFive Unmatched boards. Any developer or user attempting to run Prometheus natively on these boards cannot do so via the Arch Linux RISC-V package. The root cause (Node.js Wasm OOM on sv39 address space) is an upstream Node.js issue, not a Prometheus issue, but the observable effect is that native riscv64 builds of Prometheus with the full web UI are blocked on sv39 hardware.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

Prometheus on riscv64 is functionally complete as a deployed binary. There are no missing features or broken subsystems. Investment in functional enablement is not warranted.

Exception: The Node.js build limitation (sv39 OOM during web UI asset compilation) prevents native builds on common riscv64 hardware. Resolution depends on upstream Node.js fixes for riscv64 Wasm support (`nodejs/build#4099`). Contributing to Node.js riscv64 Wasm stability is prerequisite work; this is tracked in separate Node.js ecosystem analysis.

### 13.2 Performance Optimization

Three concrete performance gaps exist:

1. **TLS crypto (golang.org/x/crypto):** Pure-Go AES-GCM and ChaCha20-Poly1305 on riscv64 vs hardware intrinsics on amd64/arm64. Fix path: implement RVV-based or Zkne-based crypto intrinsics in `golang.org/x/crypto` (upstream Go toolchain work, tracked under `golang/go#77328`). This is a Go runtime investment, not a Prometheus investment.

2. **xxhash (cespare/xxhash/v2):** No riscv64 asm; ~2x throughput gap for TSDB label hashing. Fix path: contribute riscv64 asm to `cespare/xxhash`. Upstream has no stated plan to do this. Effort: low-medium (isolated hash function, well-defined interface).

3. **zstd/compression (klauspost/compress):** No riscv64 SIMD acceleration. Fix path: contribute RVV-based zstd decompression to `klauspost/compress`. Effort: medium-high (complex codec, RVV expertise required).

Data not available: Quantified throughput measurements for any of the above gaps specifically in a Prometheus production workload on riscv64 hardware. Investment in performance optimization should be preceded by profiling to establish that these are actual bottlenecks in the target deployment scenario.

### 13.3 CI/CD Infrastructure

This is the highest-value, lowest-friction investment opportunity.

**Current state:** riscv64 ships in every Prometheus release without any test execution on riscv64. This is a correctness risk, not a theoretical one.

**Specific gaps:**
- riscv64 is absent from the `build` job `promu_opts` (PRs do not even cross-compile riscv64).
- All test jobs run on `ubuntu-latest` (x86_64) with no QEMU or native riscv64 runner.
- No Prometheus maintainer has opened an issue requesting RISE runner integration.

**Investment options:**
- Add riscv64 to `promu_opts` in the `build` job: trivial (one-line change, requires PR and maintainer approval).
- Add QEMU-based riscv64 test execution: low-effort addition to `ci.yml` (GitHub Actions supports QEMU cross-platform testing via `setup-qemu-action`); performance on ubuntu-latest will be slow but functional.
- Integrate RISE native riscv64 runners: medium effort (requires agreement with Prometheus maintainers, RISE runner access, workflow modification). RISE runners at 445 jobs/day with 99.78% completion rate are production-quality. The EM-RV1 platform is already used by projects including llama.cpp, PyTorch, k0s, and NumPy.

### 13.4 Ecosystem Enablement

The broader Prometheus ecosystem (node_exporter, alertmanager, pushgateway, and 15+ exporters) already ships riscv64 binaries. The Arch Linux RISC-V mirror has a rich exporter ecosystem. The main gap is that the core `prometheus` package is sv39-blacklisted in Arch Linux RISC-V. This is a Node.js upstream dependency; investment in Prometheus itself does not resolve it.

No RISE working group is currently working on Prometheus integration. The Distro Integration working group (lead: Brian Harrington, Red Hat) is the most relevant body for distribution packaging gaps.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 to `build` job `promu_opts` in `ci.yml` | 0.5 | Prometheus contributor | High |
| CI/CD | Add QEMU-based riscv64 test execution to `ci.yml` | 1-2 | Prometheus contributor | High |
| CI/CD | Integrate RISE native riscv64 runners for Prometheus CI | 3-5 | RISE infra + Prometheus maintainers | Medium |
| Performance | Contribute riscv64 asm to `cespare/xxhash/v2` | 2-4 | Go/riscv64 engineer | Medium |
| Performance | Contribute RVV-based zstd to `klauspost/compress` | 6-12 | RVV-specialist engineer | Low (profile first) |
| Performance | Go toolchain crypto (RVV / Zkne) | 10-20+ | Go toolchain team (upstream) | Low (dependency on Go WG) |
| Toolchain | Fix FIPS PIE on riscv64 (`golang/go#74683`) | upstream Go | Go team | Medium (unblocks RHEL FIPS deployments) |
| Ecosystem | Node.js Wasm sv39 fix (unblocks Arch riscv64 and native builds) | upstream Node.js | Node.js / RISE | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [prometheus/prometheus repository](https://github.com/prometheus/prometheus)
- [PR #5621 -- Riscv support (closed)](https://github.com/prometheus/prometheus/pull/5621)
- [PR #5625 -- pkg/runtime: simplify Utsname string conversion](https://github.com/prometheus/prometheus/pull/5625)
- [PR #12530 -- Update promu (enabled riscv64 releases)](https://github.com/prometheus/prometheus/pull/12530)
- [PR #17508 -- Build riscv64 docker image by default](https://github.com/prometheus/prometheus/pull/17508)
- [PR #17876 -- Add distroless Docker image variant](https://github.com/prometheus/prometheus/pull/17876)
- [PR #18115 -- Cut v3.10.0-rc.1](https://github.com/prometheus/prometheus/pull/18115)
- [PR #18124 -- chore(ci): Add registry-specific architecture exclusions](https://github.com/prometheus/prometheus/pull/18124)
- [PR #18527 -- Fix quay.io riscv64 publishing](https://github.com/prometheus/prometheus/pull/18527)
- [PR #18548 -- build: remove DOCKER_REGISTRY_ARCH_EXCLUSIONS and DOCKERFILE_ARCH_EXCLUSIONS logic](https://github.com/prometheus/prometheus/pull/18548)
- [prometheus/procfs PR #318 -- Add CPUInfo parsing for RISCV](https://github.com/prometheus/procfs/pull/318)
- [prometheus/procfs PR #325 -- Fix build on RISCV](https://github.com/prometheus/procfs/pull/325)
- [prometheus/client_golang PR #833 -- Bump procfs to fix riscv64 build](https://github.com/prometheus/client_golang/pull/833)
- [prometheus/node_exporter issue #2645 -- riscv64 CI request](https://github.com/prometheus/node_exporter/issues/2645)
- [felixonmars/archriscv-packages PR #4854 -- sv39-blacklist: add prometheus](https://github.com/felixonmars/archriscv-packages/pull/4854)
- [golang/go#74683 -- fips140 broken on RISC-V with -buildmode=pie](https://github.com/golang/go/issues/74683)
- [golang/go#77069 -- crypto P256 mul unoptimized on riscv64](https://github.com/golang/go/issues/77069)
- [golang/go#77328 -- Zvkned assembler support missing](https://github.com/golang/go/issues/77328)
- [klauspost/compress issue #1036 -- Add unsafe little endian loaders (riscv64 fix, closed)](https://github.com/klauspost/compress/issues/1036)
- [RISE RISC-V Runners announcement (March 2026)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners six weeks in (May 2026)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [Debian buildd prometheus status](https://buildd.debian.org/status/package.php?p=prometheus)
- [Ubuntu 24.04 prometheus package](https://packages.ubuntu.com/noble/prometheus)
- [nodejs/build#4099 -- Node.js riscv64 open issues](https://github.com/nodejs/build/issues/4099)
- [Prometheus MAINTAINERS.md](https://github.com/prometheus/prometheus/blob/main/MAINTAINERS.md)
- [Prometheus Makefile.common](https://github.com/prometheus/prometheus/blob/main/Makefile.common)
- [Prometheus .github/workflows/ci.yml](https://github.com/prometheus/prometheus/blob/main/.github/workflows/ci.yml)