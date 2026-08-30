---
title: Vitess
parent: Project Reports
color: orange
---

# Vitess

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Vitess<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Vitess is a horizontal sharding and connection-pooling layer for MySQL, originally developed at YouTube (Google) around 2010 to handle MySQL at massive scale, open-sourced around 2012. Its core components are vtgate (query router), vttablet (per-shard tablet server), vtctld (cluster management), and VTAdmin (web UI). It is written almost entirely in Go with `CGO_ENABLED=0` as the default build mode.

**Governance:** Vitess is a [CNCF Graduated project](https://www.cncf.io/projects/vitess/) (accepted February 5, 2018; graduated November 5, 2019), licensed Apache-2.0. Governance is meritocratic with a Steering Committee; roles progress from contributor to maintainer to Steering Committee member. Decision-making is by consensus with simple majority fallback. Governance documents are at [GOVERNANCE.md](https://github.com/vitessio/vitess/blob/main/GOVERNANCE.md) and [STEERING.md](https://github.com/vitessio/vitess/blob/main/STEERING.md).

**Corporate sponsors:** PlanetScale is the dominant corporate sponsor. Current maintainers with confirmed PlanetScale affiliation include Florent Poinsard (`@planetscale.com`). Past maintainers with confirmed PlanetScale emails include Andres Taylor, Dirkjan Bussink, Rohit Nayak, Shlomi Noach, Nick Van Wiggeren, Noble Mittal, and Manan Gupta. Derek Perkins (Nozzle) and Tim Vaillancourt (independent) are also active maintainers. The project states it is "not controlled by any single company," and CNCF graduation requires demonstrated independence.

**Community culture on new ports:** No formal platform tier policy exists. Platform support is implicitly defined by CI coverage. Maintainer statements on arm64 (the closest proxy for riscv64) are: "contribution welcome" (mattlord, 2023, [issue #10501](https://github.com/vitessio/vitess/issues/10501)); "I don't think there are any plans to add it to the testing suite" (derekperkins, 2021, [issue #7600](https://github.com/vitessio/vitess/issues/7600)); "nobody is doing it, bugs will surely be found" (vmg, 2022, [issue #9797](https://github.com/vitessio/vitess/issues/9797)). The path to acceptance for a new architecture is: open an issue, submit a PR with CI coverage, get maintainer review. No maintainer has publicly opposed new architectures.

---

## 2. Port History and Upstreaming Timeline

There is no riscv64 port of Vitess. The following table covers all confirmed riscv64-relevant events.

| Date | Event | Source |
|------|-------|--------|
| Never | First riscv64 commit | None - zero commits matching `riscv` or `riscv64` in the repository |
| Never | riscv64 tracking issue opened | None - zero issues or PRs mentioning riscv in vitessio/vitess |
| 2022-03-29 | PR #9830 merged: arm64 Docker images for vitess/lite (ubi8/mysql80) | [PR #9830](https://github.com/vitessio/vitess/pull/9830) |
| 2022-03-29 | docker buildx output in PR #9830 review shows `linux/riscv64` in platform list | [PR #9830 comment by mattlord](https://github.com/vitessio/vitess/pull/9830) |
| 2025-05-01 | Arm engineer (ranimandepudi) commits to contributing arm64 CI and Docker work | [Issue #9797](https://github.com/vitessio/vitess/issues/9797) |

**Key contributors:** None for riscv64. The only concrete multi-arch work is PR #9830 (arm64 Docker images) by aquarapid.

**Upstream status:** Not applicable - no port exists.

---

## 3. Upstream Support Tier

Vitess has no formal platform tier policy. There is no `PLATFORMS.md` or `SUPPORT.md`. Support tiers are implicitly defined by CI coverage.

| Platform | CI | Release binaries | Official Docker | Status |
|----------|----|-----------------|-----------------|--------|
| linux/amd64 | Full (all 49 workflows, oracle-vm-16cpu-64gb-x86-64) | Yes (tar.gz, .rpm, .deb) | Yes (amd64 only) | Fully supported |
| linux/arm64 | Partial (unit_test.yml only, mysql80, oracle-vm-16cpu-64gb-arm64) | No | No | Nascent - multiple open requests since 2021 |
| darwin/amd64 | No | No | N/A | Build guide exists [NEEDS VERIFICATION] |
| linux/riscv64 | None | None | None | Not supported, not mentioned |

Evidence for arm64 CI: `unit_test.yml` contains `arch: arm64` entries with `oracle-vm-16cpu-64gb-arm64` runner, mysql80 platform only. This was confirmed by reading all 49 `.github/workflows/` files.

Evidence for riscv64 absence: GitHub code search for `riscv64`, `riscv`, `RISCV`, and `linux/riscv64` in `repo:vitessio/vitess` returns 0 results each. All 49 workflow files, the Makefile, and `build.env` contain zero riscv mentions.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Vitess is pure Go with `CGO_ENABLED=0` as the default. It has exactly two subsystems with architecture-specific assembly, both of which have complete pure-Go fallbacks that activate on riscv64.

### 4.1 128-bit Atomic CAS (`go/atomic2/`)

| File | Architecture | Implementation | ISA extensions |
|------|-------------|----------------|----------------|
| `atomic128_amd64.s` | amd64 | Full - native `LOCK CMPXCHG16B` | CMPXCHG16B |
| `atomic128_arm64.s` | arm64 | Full - hand-tuned `CASPAL` (acquire/release) | LDXP/STXP |
| `atomic128_spinlock.go` | riscv64 (and all others) | Scalar - spinlock via `sync/atomic.Uint64` + `runtime.Gosched()` | None |

Build constraint for the spinlock fallback: `//go:build !amd64 && !arm64`. The fallback is correct but approximately 10-50x slower than a native CAS [NEEDS VERIFICATION on exact ratio].

### 4.2 HighwayHash (`go/vt/vthash/highway/`)

Used for internal row fingerprinting and checksumming.

| File | Architecture | Implementation | ISA extensions |
|------|-------------|----------------|----------------|
| `highwayhash_amd64.s` | amd64 | Full - SSE4.1 | SSE4.1 |
| `highwayhashAVX2_amd64.s` | amd64 | Full - AVX2 (runtime dispatch) | AVX2 |
| `highwayhash_arm64.s` | arm64 | Full - NEON (300 lines) | NEON |
| `highwayhash_ppc64le.s` | ppc64le | Partial - VMX/AltiVec update-only | VMX/AltiVec |
| `highwayhash_ref.go` | riscv64 (and all others) | Scalar - pure-Go generic | None |

Build constraint for the generic fallback: `//go:build noasm || (!amd64 && !arm64 && !ppc64le)`. The fallback calls `initializeGeneric`, `updateGeneric`, `finalizeGeneric` from `highwayhash_generic.go`. Correct but significantly slower than the SIMD paths.

### 4.3 Other

- `go/hack/runtime.s`: 3-line empty stub to force external linking. Architecture-neutral.
- `go/stats/prometheusbackend/`: reads `runtime.GOARCH` as a Prometheus label string. Architecture-neutral.
- No JIT backends anywhere in the repository.
- No `arch/riscv/` directories.
- No CGo, no C files, no `#ifdef __riscv` guards.

**Runtime behavior on riscv64:** Vitess compiles and runs entirely via pure-Go fallbacks. HighwayHash uses `highwayhash_ref.go`; 128-bit atomics use `atomic128_spinlock.go`. No RVV, no Zba/Zbb/Zbc, no assembly of any kind executes on riscv64.

---

## 5. Build System, Cross-Compilation, and Toolchain

Vitess uses a Makefile over standard `go build`. There is no CMake, no Autoconf, no C build system.

### 5.1 Required toolchain versions

| Tool | Version | Source | Notes |
|------|---------|--------|-------|
| Go | >= 1.27.0 | `go.mod` line 3; enforced by `build.env` via `goversion_min()` | Go has supported riscv64 since 1.14 |
| GCC/Clang | Not required | `CGO_ENABLED=0` default | No C toolchain needed for main binaries |
| protoc | 21.3 | `build.env:PROTOC_VER=21.3` | Hard-fails on riscv64 in `bootstrap.sh` - see below |
| etcd | v3.6.7 | `build.env:ETCD_VER=v3.6.7` | Hard-fails on riscv64 in `bootstrap.sh` - see below |
| consul | 2.0.1 | `build.env:CONSUL_VER=2.0.1` | Hard-fails on riscv64 in `bootstrap.sh` - see below |
| ZooKeeper | 3.9.5 | `build.env:ZK_VER=3.9.5` | Java-based, architecture-independent |
| Node.js | >= 16.13.0 | For vtadmin web UI only | Skip with `NOVTADMINBUILD=1` |

### 5.2 Cross-compilation command

The `cross-build` Makefile target:

```makefile
cross-build:
    bash ./build.env
    mkdir -p ${VTROOTBIN}/${GOOS}_${GOARCH}
    CGO_ENABLED=0 GOOS=${GOOS} GOARCH=${GOARCH} go build \
        -trimpath $(EXTRA_BUILD_FLAGS) $(VT_GO_PARALLEL) \
        -ldflags "$(EXTRA_BUILD_LDFLAGS) $(shell tools/build_version_flags.sh)" \
        -tags "$(EXTRA_BUILD_TAGS)" \
        -o ${VTROOTBIN}/${GOOS}_${GOARCH} ./go/...
```

To cross-compile for riscv64:

```bash
source ./build.env
NOVTADMINBUILD=1 GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 make cross-build
# Binaries land in: ${VTROOT}/bin/linux_riscv64/
```

No Go build tags need to be disabled for riscv64. All arch-specific code has automatic pure-Go fallbacks via Go build constraints.

### 5.3 bootstrap.sh blockers

`bootstrap.sh` (invoked by `make tools`) hard-fails on riscv64 for three dependencies. The `install_protoc()`, `install_etcd()`, and `install_consul()` functions each contain a `case $(get_arch) in aarch64|x86_64|arm64)` branch that exits with an error for any other architecture. Workaround:

```bash
BUILD_PROTOC=0 BUILD_CONSUL=0 BUILD_JAVA=0 ./bootstrap.sh
```

Then install `protoc` for riscv64 manually (build from source or use distro package). The `dev.env` file sets `ETCD_UNSUPPORTED_ARCH=arm64` for aarch64; an equivalent `ETCD_UNSUPPORTED_ARCH=riscv64` would be needed for riscv64.

### 5.4 Docker / QEMU

No `Dockerfile.riscv64` exists. No riscv64 Docker support anywhere in the repository. The `docker/bootstrap/build.sh` hardcodes `--platform=linux/amd64`. The `build_docker_image` Makefile macro has explicit handling for `arm64` only.

A riscv64 Docker image build would require modifications to `docker/utils/install_dependencies.sh`, which only handles `amd64` and `arm64` for MySQL packages. Oracle MySQL and Percona XtraBackup have no riscv64 packages; MySQL would need to be sourced from distro packages or built from source.

Notably, in the review of PR #9830 (2022), mattlord's `docker buildx ls` output showed `linux/riscv64` in the platform list alongside `linux/arm64` - the cross-build infrastructure already supports riscv64 at the Docker layer, but no Vitess Dockerfile or CI workflow uses it.

### 5.5 Known build failures

No riscv64 build has been attempted or documented upstream. The Go cross-compilation path (`GOOS=linux GOARCH=riscv64 CGO_ENABLED=0`) is expected to succeed for the pure-Go binary layer. The `bootstrap.sh` failures for protoc, etcd, and consul are confirmed blockers for the development environment setup.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional gaps

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Core vtgate/vttablet/vtctld binaries | Full | Full (cross-compile) | Full (cross-compile, no CI) |
| MySQL wire protocol | Full | Full | Full (pure Go) |
| gRPC inter-component RPC | Full | Full | Full (pure Go) |
| Backup/restore (snappy, lz4, zstd) | Full | Full | Full (pure-Go fallbacks) |
| HighwayHash row fingerprinting | Full (SSE4.1 + AVX2) | Full (NEON) | Scalar fallback only |
| 128-bit atomic CAS | Full (CMPXCHG16B) | Full (CASPAL) | Spinlock fallback only |
| VTAdmin web UI | Full | Full | Full (Node.js, arch-independent) |
| Docker images | Official (amd64) | Unofficial (PR #9830, ubi8 only) | None |
| Release binaries | Official | None | None |
| CI coverage | Full (all workflows) | Partial (unit tests, mysql80 only) | None |
| FIPS compliance | Possible (with BoringCrypto) | Possible | Not viable (Go FIPS+PIE broken, issue #74683 open) |

### 6.2 Performance gaps

No riscv64 benchmark data exists for Vitess. The following gaps are inferred from the architecture-specific code analysis:

- **HighwayHash:** riscv64 uses `highwayhash_ref.go` (pure-Go generic). amd64 uses SSE4.1 or AVX2 with runtime dispatch; arm64 uses NEON. The performance delta is significant for workloads with high row-fingerprinting throughput (e.g., online schema changes, VReplication). No measured numbers are available.
- **128-bit atomics:** riscv64 uses a spinlock. amd64 uses `LOCK CMPXCHG16B`; arm64 uses `CASPAL`. Under contention, the spinlock path will degrade. The impact depends on how frequently 128-bit CAS is exercised in production workloads. No measured numbers are available.

Data not available: riscv64 vs amd64 or arm64 throughput numbers for any Vitess workload. The upstream benchmark system ([arewefastyet](https://benchmark.vitess.io)) runs on Equinix Metal `t1.small.x86` (x86-64) only.

### 6.3 Security hardening gaps

FIPS compliance is not viable on riscv64 with the current Go toolchain. Go FIPS+PIE is broken (Go issue #74683, open). BoringCrypto has no riscv64 `.syso`. Deployments requiring FIPS compliance cannot use riscv64.

### 6.4 Floating-point and correctness

The open evalengine correctness bugs (section 11) are platform-agnostic - they affect all architectures equally. No riscv64-specific floating-point or NaN issues have been identified, because Vitess has never been tested on riscv64.

---

## 7. CI/CD Infrastructure

| Architecture | Runner | Scope | Status |
|-------------|--------|-------|--------|
| amd64 | `oracle-vm-16cpu-64gb-x86-64`, `ubuntu-24.04` | All 49 workflows | Full |
| arm64 | `oracle-vm-16cpu-64gb-arm64`, `ubuntu-24.04-arm` | `unit_test.yml` only, mysql80 only | Partial |
| riscv64 | None | None | Does not exist |

This was confirmed by reading all 49 `.github/workflows/` files. The only non-x86 arch is arm64, and only for mysql80 unit tests. No QEMU emulation, no `linux/riscv64` Docker platform target, no riscv64 runner anywhere in the repository.

**RISE runners:** RISE announced free native RISC-V CI runners on GitHub in March 2026 ([announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). Vitess has not adopted them. RISE has zero involvement with Vitess - no blog posts, no funded projects, no GitHub repos, not listed in the RISE wheel builder.

**Other CI systems:** No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `.appveyor.yml`, `azure-pipelines.yml`, or `.buildkite/pipeline.yml` exist in the repository.

---

## 8. Distribution and Release Status

| Channel | riscv64 available | Notes |
|---------|------------------|-------|
| GitHub Releases (upstream) | No | All releases (v21 through v24) ship exactly 3 assets: `_amd64.deb`, `.x86_64.rpm`, `.tar.gz` (amd64 binary). Zero riscv64 assets across all releases. |
| Docker Hub (`vitess/lite`, `vitess/vttablet`) | No | All tags list `['amd64']` only. Confirmed across 25+ tags. |
| Ubuntu (any suite) | No | Vitess is not packaged in Ubuntu at all - not in Resolute (26.04), Jammy, Noble, or any other suite. |
| Debian | No | Not in Debian (`tracker.debian.org/pkg/vitess` returns 404). |
| Arch Linux / AUR | No | Not in official Arch repos or AUR. |
| Homebrew | No | Bottles exist for `arm64_tahoe`, `arm64_sequoia`, `arm64_sonoma`, `sonoma`, `arm64_linux`, `x86_64_linux` - no riscv64. |
| PyPI | N/A | Vitess is a Go project; no PyPI package exists. |

**What a user must do to get a working binary:** Cross-compile from source using `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 make cross-build` with Go >= 1.27.0. The `bootstrap.sh` development environment setup will fail for protoc, etcd, and consul and requires manual workarounds. No pre-built binary is available from any source.

The release workflow (`.github/workflows/create_release.yml` + `tools/make-release-packages.sh`) runs on a single `ubuntu-24.04` (amd64) runner with no matrix and no cross-compilation step. The `Makefile` supports `GOARCH` override for the `cross-build` target but this is never invoked in the release workflow.

---

## 9. Dependencies

### 9.1 Summary table

| Dependency | Role | riscv64 build | riscv64 test CI | riscv64 release | Notes |
|-----------|------|--------------|-----------------|-----------------|-------|
| Go runtime (>= 1.27.0) | Entire build toolchain | Yes - secondary port | Partial (secondary tier) | Yes (`golang-1.26-go` in Ubuntu resolute/main) | Miscompile bug #80127 fixed in Go 1.27; FIPS+PIE broken (#74683 open) |
| `google.golang.org/grpc` v1.83.0 | All inter-component RPC | Yes - pure Go | No riscv64 CI | Yes (Go module) | No blocking issues |
| `google.golang.org/protobuf` v1.36.12 | Wire format for all gRPC messages | Yes - pure Go | No riscv64 CI | Yes (Go module) | No `protoc` binary for riscv64 from upstream |
| `github.com/go-sql-driver/mysql` v1.10.0 | MySQL wire protocol driver | Yes - pure Go | No riscv64 CI | Yes (Go module) | No runtime issues |
| MySQL 8.4 / 8.0 (runtime) | Backend database | No official Oracle support | No | No Oracle release | Ubuntu 26.04 ships `mysql-server` for riscv64 from `mysql-8.4` source (community build, not Oracle-supported) |
| `go.etcd.io/etcd/client/v3` v3.7.1 | Topology store | Yes - pure Go | No riscv64 CI | No riscv64 release | Maintainers stated "No plans" (PR #21510 closed); `go-riscv/etcd` community fork exists; Ubuntu 26.04 ships `etcd-server` in universe for riscv64 |
| `github.com/klauspost/compress` v1.19.2 | zstd/gzip/deflate/brotli compression | Yes - pure Go with optional asm; riscv64 uses generic path | 1 closed issue | Yes (Go module) | No blocking issues |
| `modernc.org/sqlite` v1.56.0 | Pure-Go SQLite (VTAdmin, schema tracking) | Yes - riscv64 transpile confirmed (GitLab issue #90 closed) | Limited | Yes (Go module) | No blocking issues |
| `github.com/prometheus/client_golang` v1.24.1 | Metrics exposition | Yes - pure Go | 4 riscv64 issues (all closed) | Yes (Go module) | No open blockers |
| `github.com/shirou/gopsutil/v4` v4.26.7 | System metrics | Yes - Linux/riscv64 supported | 16 riscv64 issues (2 open, FreeBSD-specific only) | Yes (Go module) | Linux riscv64 path unaffected by open issues |
| `golang.org/x/sys` v0.47.0 | Syscall wrappers | Yes - riscv64 fixes merged | Included in Go CI | Yes (Go module) | 3 riscv64 issues (all closed) |
| `github.com/cilium/ebpf` v0.22.0 | eBPF helpers (transitive) | Yes - riscv64 Linux string added | Limited | Yes (Go module) | 6 riscv64 issues (all closed) |
| `github.com/golang/snappy` v1.0.0 | Snappy compression | Yes - pure Go | No riscv64 CI | Yes (Go module) | No issues |
| `github.com/pierrec/lz4` v2.6.1 | LZ4 compression | Yes - pure Go | No riscv64 CI | Yes (Go module) | amd64 asm bug (#20778) does not affect riscv64 |
| `github.com/cespare/xxhash/v2` v2.3.0 | Fast hashing | Yes - pure Go | No riscv64 CI | Yes (Go module) | No issues |
| `go.opentelemetry.io/otel` v1.45.0 | Distributed tracing | Yes - pure Go | No riscv64 CI (issue #8126 open) | Yes (Go module) | Compatibility matrix excludes riscv64 |
| `github.com/hashicorp/consul/api/v2` v2.0.0 | Service discovery (optional) | Yes - pure Go | No riscv64 CI | Yes (Go module) | 6 riscv64 issues (all closed, all dependency bumps) |
| `github.com/planetscale/vtprotobuf` v0.6.1 | Optimized protobuf serializer | Yes - pure Go | No riscv64 CI | Yes (Go module) | No issues |
| `filippo.io/edwards25519` v1.2.0 | Ed25519 crypto | Yes - pure Go | No riscv64 CI | Yes (Go module) | No issues |
| `github.com/ebitengine/purego` v0.10.2 | CGo-free dynamic linking (via gopsutil) | Yes - `struct_riscv64.go` + `sys_unix_riscv64.s` present | Limited | Yes (Go module) | PR #397 open (trampoline generalization) - non-blocking |

### 9.2 Critical dependency deep-dives

**MySQL (runtime dependency - hard blocker):** Vitess is a MySQL proxy and sharding layer; it requires a MySQL server to connect to. Oracle has no riscv64 MySQL release. The only riscv64 MySQL PR in the Oracle MySQL repository (#639) was auto-closed by the OCA bot. Ubuntu 26.04 ships `mysql-server` (MySQL 8.4) for riscv64 from the `mysql-8.4` source package, but this is a community build, not Oracle-supported. For production deployments, this is the single most consequential dependency gap.

**etcd (soft blocker for production topology):** etcd is used for topology storage in production Vitess deployments. Upstream maintainers explicitly stated "No plans" for riscv64 (PR #21510 closed). A community fork (`go-riscv/etcd`) exists as a workaround. Ubuntu 26.04 ships `etcd-server` in universe for riscv64. For development and testing, the Ubuntu package is sufficient; for production, the lack of an official upstream release is a risk.

**Go runtime:** The struct-copy miscompile bug (Go issue #80127) that could corrupt `[]byte` fields on riscv64 was fixed in Go 1.27 (backported to 1.25.13 and 1.26.6). Vitess requires `go 1.27.0`, so this is resolved. The remaining open issues are Go FIPS+PIE broken (#74683) and P256 unoptimized (#77069) - neither blocks non-FIPS deployments.

**protoc:** No official riscv64 `protoc` binary is released by Google. This blocks `bootstrap.sh` but does not block building Vitess binaries from a pre-generated source tree. Ubuntu 26.04 ships `protobuf-compiler` for riscv64 in universe.

---

## 11. Known Bugs and Active Issues

### 11.1 riscv64-specific bugs

None. Zero riscv64-specific issues or PRs exist in `vitessio/vitess`.

### 11.2 Architecture-specific bugs (other architectures)

| ID | Title | Status | Severity | Architecture | Notes |
|----|-------|--------|----------|-------------|-------|
| [#20778](https://github.com/vitessio/vitess/pull/20778) | lz4 amd64 assembly decoder bug | Open | High - backup restore fails 4/20 runs | amd64 only | `pierrec/lz4` v2 amd64 asm: `MOVB` spills only low byte across `memmove` call; upper 56 bits corrupted by Go >= 1.24 FSRM/ERMS-vectorized memmove. arm64 unaffected (uses pure-Go decoder). riscv64 unaffected (uses pure-Go decoder). Fix: upgrade to `pierrec/lz4` v4. |

### 11.3 Platform-agnostic correctness bugs

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#20718](https://github.com/vitessio/vitess/pull/20718) | evalengine/mysql/json: JSON and TIME equality wrong | Open | High - wrong results for IN, DISTINCT, hash joins on JSON columns | Compiled vs interpreted evalengine paths disagree. Affects all platforms. |
| [#20623](https://github.com/vitessio/vitess/issues/20623) | evalengine: wrong result for LIKE with NULL pattern in nested expressions | Open | Medium | Affects all platforms. |
| [#20750](https://github.com/vitessio/vitess/issues/20750) | evalengine: CAST to DECIMAL(M,D) does not round to target scale | Open | Medium | Affects all platforms. |

### 11.4 Recently fixed correctness bugs

| ID | Title | Fixed | Notes |
|----|-------|-------|-------|
| [#20724](https://github.com/vitessio/vitess/issues/20724) | mysql/json: reject nan as invalid JSON | 2026-07-28 | Go parser accepted `nan`; MySQL rejects it. Exposed compiled/interpreted path divergence. |
| [#20722](https://github.com/vitessio/vitess/pull/20722) | mysql/json: read numbers the way MySQL does | 2026-07-28 | Vitess parsed `1e1025` as valid; MySQL rejects it. |
| [#20475](https://github.com/vitessio/vitess/issues/20475) | ROUND() on DOUBLE rounds ties away from zero; MySQL rounds half-to-even | 2026-07-04 | `ROUND(2.5e0)` returns 3 in evalengine, 2 in MySQL. Root cause: Go `math.Round` (half-away-from-zero) vs C `std::rint` (IEEE round-half-to-even). Affects all platforms equally. |

### 11.5 Open performance regressions

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#20845](https://github.com/vitessio/vitess/issues/20845) | `OR FALSE` causes 7.27x performance regression | Open | High | Vitess does not recognize `expr OR FALSE = expr`; generates worse execution plan. x86-64 only (RIFT mutation testing). |
| [#17467](https://github.com/vitessio/vitess/issues/17467) | vtgate planning regression for large UNION since v15 | Open | Medium | 2x-30x planning regression (v15 to v19). linux/amd64, RHEL 7.9. |

---

## 12. Objections and Upstream Blockers

### 12.1 Technical blockers

| Blocker | Severity | Notes |
|---------|----------|-------|
| No official Oracle MySQL riscv64 binary | Hard blocker for production | Ubuntu 26.04 ships a community MySQL 8.4 build for riscv64; sufficient for