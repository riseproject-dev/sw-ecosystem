---
title: CoreDNS
parent: Project Reports
color: yellow
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: miekg/dns
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/crypto
    relation: runtime-dependency
    criticality: optional
  - name: quic-go/quic-go
    relation: runtime-dependency
    criticality: optional
  - name: gRPC-Go
    relation: runtime-dependency
    criticality: optional
  - name: etcd
    relation: runtime-dependency
    criticality: optional
  - name: prometheus/client_golang
    relation: runtime-dependency
    criticality: optional
  - name: DataDog/dd-trace-go
    relation: runtime-dependency
    criticality: optional
  - name: go.uber.org/automaxprocs
    relation: runtime-dependency
    criticality: optional
  - name: oschwald/geoip2-golang
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="coredns" %}

# CoreDNS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for CoreDNS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

CoreDNS is a DNS server written entirely in Go, designed as a plugin-based, chain-based request processor. It serves as the default DNS server in Kubernetes clusters (kube-dns replacement) and is used in edge deployments, IoT clusters, and service mesh environments.

CoreDNS is a [CNCF graduated project](https://www.cncf.io/projects/coredns/) (joined CNCF 2017-02-27, graduated 2019-01-24), licensed under Apache License 2.0 and affiliated with The Linux Foundation. This is confirmed live on [coredns.io](https://coredns.io/): "We are a Cloud Native Computing Foundation graduated project."

**Governance:** Maintainer-consensus model. Final disputes escalate to a 5-member Steering Committee with a maximum of one member per organization (1-year elected terms). No single organization may hold more than 1/5 of binding votes. Sub-projects must use Apache-2.0 and have an unaffiliated maintainer. Governance is documented in [GOVERNANCE.md](https://github.com/coredns/coredns/blob/master/GOVERNANCE.md); the maintainer roster is in CODEOWNERS.

**Corporate maintainers (identified affiliations):**
- @chrisohaver - Infoblox
- @johnbelamaric - Google
- @miekg - independent (founder, core author)
- @superq (Ben Kochie) - independent (also a Prometheus maintainer)
- @yongtang - merged the RISC-V port PR

**Community culture on new ports:** Accepting. The loong64 request ([Issue #8136](https://github.com/coredns/coredns/issues/8136), June 2026, resolved via [PR #8137](https://github.com/coredns/coredns/pull/8137)) explicitly cited riscv64 as the established template for non-mainstream architectures ("follows the same pattern as riscv64 which also uses non-official base images") and was resolved in 3 days. The blocking requirement for new architecture additions is: (1) a working base container image (community-provided images are acceptable), and (2) no architecture-specific Dockerfiles - maintainer @superq specifically required this clean approach during review of the riscv64 PR.

**RISE involvement:** None. The RISE blog feed (7 most recent posts as of 2026-09-30, spanning July-September 2026: Kairos on RISC-V, Python Tier 3 support, PyTorch riscv64 wheels, Working Groups moving to GitHub, SALTyRN/RVV codegen, OpenSBI interrupt handling, IREE/YOLOv8n on RVV) does not mention CoreDNS or DNS. A site-scoped search of riseproject.dev for CoreDNS returns no hits. CoreDNS is not listed as a RISE member project, RFP deliverable, or Working Group output. This reconfirms the same finding from an earlier review pass of all 27 then-existing RISE blog posts - no new CoreDNS-related content has appeared since.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2023-03-15 | [PR #5970](https://github.com/coredns/coredns/pull/5970) opened by jjlauer, motivated by running CoreDNS on a VisionFive2 SBC - binary releases only, no Docker | GitHub PR |
| 2023-03-15 | @chrisohaver asks whether container releases should also be covered | PR #5970 comments |
| 2023-03-17 | @chrisohaver gives fork-testing guidance for Docker release changes and requests signed commits | PR #5970 comments |
| 2023-05-20 | Stale bot labels PR #5970 "needs update" after inactivity | PR #5970 |
| 2023-05-27 | PR #5970 auto-closed by stale bot, never merged | GitHub PR |
| 2023-07-06 | [PR #6195](https://github.com/coredns/coredns/pull/6195) opened by chazapis (Antony Chazapis, CARV-ICS-FORTH) - binary and Docker image, validated under QEMU against a RISC-V K3s distro | GitHub PR |
| 2023-07-06 | @superq requests removal of the proposed separate `Dockerfile.riscv64` in favor of build-arg-based base image overrides; chazapis revises and identifies `ghcr.io/go-riscv/distroless` as the community distroless workaround | PR #6195 comments |
| 2023-07-06 | @superq approves | PR #6195 comments |
| 2023-07-10 | PR #6195 merged by @yongtang | GitHub PR merge |
| 2023-08-08 | riscv64 first shipped in v1.11.0 | GitHub Releases |
| 2026-06-03 | [PR #8137](https://github.com/coredns/coredns/pull/8137) (loong64 support) merged, explicitly modeled on the riscv64 build-arg pattern | GitHub PR |
| 2026-08-06 | [PR #8316](https://github.com/coredns/coredns/pull/8316) (pin numeric uid/gid for nonroot user) merged; reviewer confirms the riscv64 nonroot base image also uses uid/gid 65532, requiring no separate handling | GitHub PR |
| 2026-08-19 | riscv64 present in v1.14.7 (latest release as of this report); `coredns_1.14.7_linux_riscv64.tgz` published | GitHub Releases / SourceForge mirror |

**Validation at merge time:** PR #6195's author tested with QEMU alongside a RISC-V build of K3s ("I have tested this in a QEMU setup and it looks like it is working fine"). This was a one-time manual spot check at merge time; no automated riscv64 execution validation exists in CI today (see Section 7). [NEEDS VERIFICATION: whether any post-merge spot checks have been conducted on real riscv64 hardware.]

**No dedicated tracking issue exists** for the riscv64 port in coredns/coredns; the work was carried entirely through pull requests, with PR #6195 as the closest equivalent to a tracking/implementation record, preceded by the abandoned PR #5970.

**RISC-V support is fully upstream** in the main repository. No downstream fork or separate tree is required.

---

## 3. Upstream Support Tier

No formal platform tier policy exists in CoreDNS (no written Tier 1/2/3 classification). Architecture additions are accepted via PR with maintainer review, at maintainer discretion.

**Practical tier assessment based on observable behavior:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Binary release artifact | Yes | Yes | Yes (v1.11.0+) |
| Docker image released | Yes | Yes | Yes (unstable/community base) |
| CI unit/integration tests | Yes (`go.test.yml`, ubuntu-latest) | No | No |
| CI cross-compile smoke check | Yes | Yes | Yes (`test-makefile-release`, every push/PR to master) |
| CI docker-build smoke check (non-dry-run) | Yes | Yes | Yes, but no execution of the resulting binary (see Section 7) |
| Release-blocking on failure | N/A | No | No |
| Distribution packages (apt/dnf/etc.) | No | No | No |

**Conclusion:** riscv64 is a first-class release-artifact target - it gets the same cross-compiled binary and container image as every other Linux architecture CoreDNS supports (amd64, arm, arm64, mips64le, ppc64le, s390x, loong64) - but it is a zero-execution-coverage CI target. The CI that does run on riscv64 (every push/PR to master, via `go.test.yml`) compiles a real riscv64 Go binary and runs a real `docker build --platform=riscv64`, but never executes the resulting binary or any test suite under riscv64: there is no QEMU/binfmt setup anywhere in the repository's workflow files, and the final Docker build stage has no `RUN` instructions to execute in the first place (see Section 7 for the full mechanism). This is the basis for the yellow readiness grade in Section 13.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

CoreDNS is a pure-Go project (>99% Go, `CGO_ENABLED=0` by default). Direct verification against the source (shallow clone at HEAD `f44a91377a0bd2ffbbda1cff6745ba46a37e756c`, plus GitHub code search) confirms:

- Zero `import "C"` usages across all non-vendor `.go` files.
- Zero architecture-specific source files - no `*_riscv64.go`, `*_amd64.go`, `*_arm64.go`, etc. - anywhere in the 358 non-vendor, non-test Go files (checked against the full Go arch-suffix convention: amd64, arm64, riscv64, 386, arm, mips, mips64, mips64le, ppc64, ppc64le, s390x, loong64 - none exist).
- Zero hand-written assembly (`.s`) files outside vendor.
- Zero riscv build tags or `#ifdef`-style guards (code search for `__riscv` and for `.s` assembly files scoped to the repo both return 0 results).

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| DNS wire protocol (miekg/dns) | Go stdlib | Go stdlib | Go stdlib |
| Plugin framework | Go | Go | Go |
| JIT backend | None | None | None |
| Hand-written assembly (.s files) | None (in CoreDNS itself) | None | None |
| SIMD dispatch | None in CoreDNS itself | None in CoreDNS itself | None in CoreDNS itself |
| Arch-specific Go build tags | None | None | None |
| CGO / C intrinsics | None (CGO off) | None (CGO off) | None (CGO off) |
| Crypto (TLS, HKDF) | Go stdlib + golang.org/x/crypto (assembly) | Go stdlib + golang.org/x/crypto (assembly) | Go stdlib + golang.org/x/crypto (generic Go fallback) |
| Compression (gzip, zstd) | klauspost/compress (SIMD path) | klauspost/compress (SIMD path) | klauspost/compress (pure-Go fallback) |

There is no RISC-V ISA extension usage anywhere in CoreDNS itself (no RVV, no Zba/Zbb/Zbc). The only riscv64-specific customization in the entire repository is two build-arg overrides in `Makefile.docker`, selecting alternative base images. This is the expected, complete shape of riscv64 support for a pure-Go network service with no cgo: Go's toolchain has generated native riscv64 machine code since Go 1.14, so a project like CoreDNS requires zero per-architecture source code to run on riscv64. Rating CoreDNS on a "hand-tuned assembly / C intrinsics / scalar fallback / missing" axis - the rubric that applies to low-level libraries such as crypto, codec, or BLAS kernels - is a category error for this application: riscv64 is at exact parity with every one of CoreDNS's 8 supported architectures (amd64, arm, arm64, mips64le, ppc64le, s390x, riscv64, loong64), all of which have zero arch-specific files.

The one subsystem with a real riscv64 performance delta sits one level down, in `golang.org/x/crypto`: AES-GCM and ChaCha20 use hand-written Go assembly on amd64 and arm64, and the generic Go fallback on riscv64. This affects DNS-over-TLS and DNS-over-HTTPS throughput, not correctness (see Sections 6 and 9).

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make plus the Go toolchain. No CMake, no `configure`, no Autotools.

**Go version:** `go.mod` declares a minimum of `go 1.25.0`. The `.go-version` file pins `1.26.4`.

**CGO:** Disabled by default (`CGO_ENABLED=0`). Cross-compilation requires no C toolchain.

**Cross-compile a riscv64 binary:**
```
make SYSTEM="GOOS=linux GOARCH=riscv64"
```
or equivalently:
```
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build -o coredns
```
No special flags, no workarounds, no riscv64-specific `go build` arguments are required.

**Official release build loop** (`Makefile.release:54`):
```
LINUX_ARCH:=amd64 arm arm64 mips64le ppc64le s390x mips riscv64 loong64
```
riscv64 is treated identically to every other Linux architecture at the binary level - it is one `GOARCH` target string among eight, with no emulation needed for this step since Go cross-compilation is pure host-side codegen.

**Docker build for riscv64** (`Makefile.docker:35, 88-98`):
```
LINUX_ARCH:=amd64 arm arm64 mips64le ppc64le s390x riscv64 loong64
...
if [ "${arch}" = "riscv64" ]; then
    DOCKER_ARGS="--build-arg=DEBIAN_IMAGE=debian:unstable-slim --build-arg=BASE=ghcr.io/go-riscv/distroless/static-unstable:nonroot";
fi;
```
This overrides the default base images because, at the time of PR #6195 and still today, `debian:stable-slim` and the official `gcr.io/distroless` images have no riscv64 variant. The build runs `docker build --platform=riscv64 ...` via Docker Buildx.

**QEMU/binfmt usage:** Not required for the Go binary build - `GOARCH=riscv64 go build` produces a native riscv64 binary on any host without QEMU. A direct grep of every workflow YAML file and every Makefile in the repository (`grep -rni "qemu|binfmt|buildx"`) returns zero matches for any explicit QEMU/binfmt setup action (e.g. no `docker/setup-qemu-action`). The `docker build --platform=riscv64` step succeeds on the `ubuntu-latest` (x86_64) CI runner without QEMU only because the Dockerfile's final riscv64-targeted stage contains no `RUN` instructions at all - it is `COPY --from=build /coredns /coredns` plus metadata (`USER`, `WORKDIR`, `EXPOSE`, `ENTRYPOINT`) - so no foreign-architecture code is ever executed during that "build," it is a cross-platform layer copy. This corrects an earlier characterization of this step as a "QEMU cross-build"; no QEMU is invoked anywhere in this repository's CI.

**Known build failures:** None reported. The cross-compile path is standard Go toolchain behavior with no CoreDNS-specific complications.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---------|-------|-------|---------|----------|
| DNS over UDP | Full | Full | Full | None |
| DNS over TCP | Full | Full | Full | None |
| DNS over TLS (DoT) | Full | Full | Full (reduced crypto throughput) | Performance only |
| DNS over HTTPS (DoH) | Full | Full | Full (reduced crypto throughput) | Performance only |
| DNS over QUIC | Full | Full | Full | None |
| gRPC transport | Full | Full | Full | None |
| Plugin system | Full | Full | Full | None |
| etcd backend | Full | Full | Full client-side; requires `ETCD_UNSUPPORTED_ARCH=riscv64` for the etcd server | Operational only |
| DataDog APM (dd-trace-go) | Full | Full | Partial - WAF/AppSec disabled, SIMD JSON parsing disabled | Security/feature gap |
| DataDog WAF (go-libddwaf) | Full | Full | Silently disabled (`WafDisabledError`) | Security feature gap |
| SIMD compression (gzip/zstd) | Hardware-accelerated | Hardware-accelerated | Pure-Go fallback | Performance only |
| Container image base | debian:stable-slim + official distroless | debian:stable-slim + official distroless | debian:unstable-slim + community distroless (`go-riscv/distroless`) | Operational risk |

**Functional gaps:** None for core DNS functionality. CoreDNS on riscv64 resolves DNS queries with full protocol fidelity and no evidence of correctness divergence.

**Security feature gaps:** `DataDog/go-libddwaf` is the one structurally broken dependency on riscv64 - its prebuilt WAF library ships only for Linux/amd64 and Linux/aarch64 (plus macOS), so DataDog's WAF/AppSec features are silently disabled on riscv64 when the DataDog APM plugin is used with security features enabled.

**Performance gaps:** `golang.org/x/crypto` uses hand-written Go assembly for AES-GCM and ChaCha20 on amd64 and arm64; riscv64 falls back to the generic Go path, affecting DoT/DoH throughput. No quantified delta exists - an extensive search (GitHub issues, web search for "CoreDNS riscv64 benchmark," "CoreDNS riscv vs arm64 performance," dnsperf-specific terms, and the CARV-ICS-FORTH org's own tracking) turned up no riscv64-specific benchmark numbers for CoreDNS anywhere in the public record as of 2026-09-30. `klauspost/compress` similarly has no riscv64 SIMD path (generic Go path only), but this affects only logging and gRPC paths, not the DNS hot path.

**NaN / floating-point:** CoreDNS performs no floating-point arithmetic in the DNS processing path. No NaN issues found or expected; a targeted search for RISC-V floating-point/NaN bugs returned no CoreDNS-related hits.

**Security hardening:** No stack canary or CFI differences attributable to architecture - handled uniformly by the Go runtime.

---

## 7. CI/CD Infrastructure

No dedicated riscv64 *execution* CI exists anywhere in the CoreDNS pipeline. This was verified by reading all 12 workflow files present in `.github/workflows/` directly from a shallow clone (HEAD `f44a91377a0bd2ffbbda1cff6745ba46a37e756c`): `cifuzz.yml`, `codeql-analysis.yml`, `depsreview.yml`, `docker.yml`, `go.test.yml`, `golangci-lint.yml`, `make.doc.yml`, `release.yml`, `scorecards.yml`, `stale.yml`, `verify-make-gen.yml`, `yamllint.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

A case-insensitive grep for "riscv" across every workflow file returns exactly one match, in `.github/workflows/go.test.yml:159`, inside job `test-makefile-release`:
```
for arch in amd64 arm arm64 mips64le ppc64le s390x riscv64 loong64; do
```

**What `test-makefile-release` actually does** (runner: `ubuntu-latest`; triggers: `push` to `master` and every `pull_request` - no `workflow_dispatch`, no `schedule`):
1. `make GITHUB_ACCESS_TOKEN=x release -f Makefile.release` - a **real** (non-dry-run) build of release binaries for all 8 `LINUX_ARCH` targets including riscv64.
2. `make ... -n release github-push -f Makefile.release` - **dry-run** only.
3. `make ... -n release docker-push -f Makefile.docker` - **dry-run** only.
4. Copies each arch's binary (including riscv64) into `build/docker/$arch/`.
5. `make ... -f Makefile.docker docker-build` - a **real** (non-dry-run) `docker build --platform=riscv64 ...` invocation.

So the riscv64 binary is genuinely cross-compiled and a genuine `docker build --platform=riscv64` is genuinely executed on every push/PR to master - but, as established in Section 5, that docker build never executes riscv64 code (the final stage has no `RUN` instructions), and no step anywhere runs the compiled riscv64 binary or any CoreDNS test suite under riscv64. This is a build-time smoke/compile check, not a functional or regression test.

| Workflow file | Trigger | riscv64 coverage |
|---------------|---------|-------------------|
| `go.test.yml` (`test-makefile-release` job) | push to master, pull_request | Cross-compile + non-dry-run `docker build --platform=riscv64`; no execution |
| `release.yml` | workflow_dispatch (manual) | Builds riscv64 cross-compiled binary via `Makefile.release`; no test execution |
| `docker.yml` | release: published, workflow_dispatch | Publishes riscv64 Docker image via the same `Makefile.docker` path (real, production push); no test execution |
| `golangci-lint.yml`, `codeql-analysis.yml`, `cifuzz.yml`, and all remaining workflows | various | No architecture matrix; amd64/`ubuntu-latest` only |

No `docker/setup-qemu-action`, no binfmt registration, and no native riscv64 runner exist anywhere in this repository's CI configuration.

**RISE CI runners:** None. CoreDNS does not use RISE-provided infrastructure.

| CI category | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Unit tests on PR | Yes | No | No |
| Integration tests | No | No | No |
| Binary cross-compilation | Yes | Yes | Yes (every push/PR to master) |
| Docker build (real, non-dry-run) | Yes | Yes | Yes (every push/PR to master, no execution inside the image) |
| Lint | Yes | No | No |
| Fuzz (`cifuzz.yml`) | Yes | No | No |

A riscv64-specific regression - one that only manifests at execution time (e.g., in a dependency's arch-conditional code path) - would not be caught before release, since nothing in CI ever runs a riscv64 binary.

---

## 8. Distribution and Release Status

**Official upstream binaries:** `coredns_1.14.7_linux_riscv64.tgz` and its sha256 checksum are published as first-class release assets alongside amd64, arm, arm64, loong64, mips64le, ppc64le, and s390x. This has been the case since v1.11.0 (2023-08-08). This was verified via the project's own SourceForge mirror of the v1.14.7 release manifest (`sourceforge.net/projects/coredns.mirror/files/v1.14.7/`), which lists a full itemized set of 29 files including the riscv64 tarball. A direct WebFetch of the github.com releases page in this same research pass returned a truncated summary that omitted riscv64 and several other architectures entirely; that omission is a tool/summarization artifact, not evidence of absence, and should not be read as a regression from earlier-confirmed availability. [NOTE: direct confirmation against api.github.com was blocked by this session's own GitHub access scoping, not by any absence of the file; the SourceForge mirror listing is the corroborating source used here.]

**Container images:** A `riscv64`-tagged Docker image is published (via `docker.yml`, triggered on `release: published`). The image uses `debian:unstable-slim` (build stage) and `ghcr.io/go-riscv/distroless/static-unstable:nonroot` (final stage) - both community-maintained, based on Debian unstable rather than a production-stable base.

**Distribution packages:** No `coredns` binary package exists in Debian or Ubuntu for *any* architecture, not just riscv64. A full-text package-name search across all Ubuntu suites, sections, and architectures returns exactly one match system-wide: `golang-github-coredns-caddy-dev`, a Go development/library package ("Fork of Caddy v1 with only CoreDNS-relevant components"), architecture `all` (arch-independent) - not the CoreDNS DNS server binary. Debian's own package search returns the identical single match. This was independently confirmed against both `packages.ubuntu.com` (including a riscv64-filtered search) and `packages.debian.org`.

| Distribution | riscv64 CoreDNS package | Status |
|--------------|--------------------------|--------|
| Debian (any suite) | No | No `coredns` binary package exists for any architecture |
| Ubuntu (any suite, incl. 26.04 resolute) | No | No `coredns` binary package exists for any architecture |
| Arch Linux RISC-V (archriscv.felixc.at) | Not confirmed | Page provides no live package search backing; inconclusive, not usable as evidence either way |

**PyPI:** A `coredns-0.0.1.tar.gz` placeholder exists on PyPI (uploaded by Cycode as a dependency-confusion-prevention stub), unrelated to the real Go-based CoreDNS project. Not applicable to riscv64 status in either direction.

**What a user must do to get a working riscv64 binary:** Download `coredns_<version>_linux_riscv64.tgz` directly from GitHub Releases (or its mirrors), or pull the riscv64-tagged Docker image. No package-manager path exists on any distribution, for any architecture.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Go | Build toolchain (compiler, cross-compilation) | Native riscv64 codegen since Go 1.14 | Go stdlib has its own CI; no CoreDNS-specific riscv64 Go test | N/A - toolchain, not shipped by CoreDNS | `go.mod` requires >=1.25.0; `.go-version` pins 1.26.4. No riscv64-specific Go toolchain issue found in this research. |
| miekg/dns | Core DNS wire protocol | Yes (pure Go) | No riscv64 CI in CoreDNS or miekg/dns | Library | No gaps identified. |
| golang.org/x/sys | Low-level syscall bindings | Yes - riscv64 syscall support present upstream (e.g. `unix.riscv_hwprobe`) | Covered by upstream x/sys CI, not CoreDNS-specific | Library | Several CoreDNS dependency-bump PRs (#6240, #7279, #6869, #8139, #8534) surface "riscv" only inside the vendored x/sys changelog text; none required CoreDNS-side code changes. |
| golang.org/x/crypto | TLS, HKDF, ChaCha20, AES-GCM (DoT/DoH) | Yes, generic Go fallback (no riscv64 assembly) | Covered by Go stdlib/x CI | Library | Performance gap: amd64/arm64 use hand-written assembly, riscv64 uses the generic path. Delta is unquantified - no public benchmark exists. |
| quic-go/quic-go | DNS-over-QUIC transport | Yes (pure Go) | No riscv64 CI | Library | No gaps identified. |
| gRPC-Go | gRPC transport (etcd client, OpenTelemetry) | Yes (pure Go) | No riscv64 CI | Library | No gaps identified. |
| etcd | etcd backend plugin client (`go.etcd.io/etcd/client/v3`) | Yes (pure Go client) | No riscv64 CI | Library | Client compiles and runs on riscv64. The etcd *server* (separate project/binary) requires `ETCD_UNSUPPORTED_ARCH=riscv64`; upstream PR #21510 adding riscv64 to etcd's supported-architecture list was closed "No plans," citing no available RISC-V CI hardware - an etcd-project gap, not a CoreDNS one. See `project-reports/etcd.md`. |
| prometheus/client_golang | Metrics exposition | Yes | No riscv64 CI | Library | No gaps identified. |
| DataDog/dd-trace-go | APM tracing plugin | Builds; native features (WAF, SIMD JSON) degrade silently | No riscv64 CI | Library | Only relevant when the DataDog plugin is enabled; not a build blocker. Depends transitively on the two entries below. |
| go.uber.org/automaxprocs | GOMAXPROCS auto-tuning from cgroup limits | Yes (pure Go) | No riscv64 CI | Library | No gaps identified. |
| oschwald/geoip2-golang | MaxMind GeoIP2 reader (geoip plugin) | Yes (pure Go) | No riscv64 CI | Library | No gaps identified. |

**Indirect dependencies surfaced through the above (not independently listed as direct dependencies, but relevant to riscv64 readiness):**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| klauspost/compress | zstd/gzip/snappy compression (used in gRPC and logging paths) | Yes, pure-Go fallback path | No riscv64 CI | Library | No SIMD path on riscv64 (SIMD exists for amd64/arm64); not in the DNS hot path, low priority. |
| klauspost/cpuid/v2 | CPU feature detection (used by dd-trace-go and other deps) | Yes - riscv64 feature detection merged upstream (klauspost/cpuid issues #158, #173) | Not independently verified | Library | No gaps identified. |
| minio/simdjson-go | SIMD JSON parsing (DataDog tracing path) | Builds; `SupportedCPU()` returns false on riscv64 | No riscv64 CI | Library | SIMD parsing disabled on riscv64; falls back to standard parsing. Only affects the DataDog APM plugin's JSON path. |
| DataDog/go-libddwaf | DataDog WAF bindings (CGo, prebuilt static library) | Not supported on riscv64 - prebuilt `libddwaf.a` ships only for linux/amd64 and linux/aarch64 (plus macOS variants) | No | No | Returns `WafDisabledError`; silently disables WAF/AppSec on riscv64. Only affects deployments running the DataDog plugin with WAF enabled. No upstream issue found tracking riscv64 support. |

**Critical dependency notes:** `DataDog/go-libddwaf` is the only dependency in this research that is structurally broken on riscv64 (no build at all, rather than a degraded/fallback path). Every other dependency - direct or indirect - compiles and runs on riscv64; the remaining gaps are either performance-only (missing riscv64 assembly in `golang.org/x/crypto` and missing SIMD in `klauspost/compress`) or an operational workaround one level down the dependency chain (the etcd server binary, not the etcd client CoreDNS actually links).

---

## 11. Known Bugs and Active Issues

No riscv64-specific open bugs or correctness issues exist in the CoreDNS issue tracker as of this research date (2026-09-30). Direct literal searches for `riscv` and `RISC-V` scoped to `coredns/coredns` return zero results; targeted semantic searches (`riscv64 performance`, `riscv64 bug`, `riscv nan floating`) surfaced two issues that on inspection are unrelated to RISC-V:

- [Issue #6151](https://github.com/coredns/coredns/issues/6151) ("major CPU performance regression," closed 2023-08-16) - a generic CPU/allocation regression tied to a proxy refactor (PR #5951), architecture-agnostic, no RISC-V mention.
- [Issue #6682](https://github.com/coredns/coredns/issues/6682) ("context deadline exceeded" in quic_test and "rcode refused," open, filed 2024-05-15) - an IBM Z / s390x (big-endian) build/test issue, not RISC-V.

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [PR #5970](https://github.com/coredns/coredns/pull/5970) | Include a riscv64 build as part of release | Closed (unmerged) | N/A | Closed by stale bot; author did not provide signed commits or respond to the docker-testing request. Superseded by PR #6195. |
| [PR #6195](https://github.com/coredns/coredns/pull/6195) | Add support for RISC-V | Merged | N/A | Merged 2023-07-10; introduced the ongoing dependency on a community (non-official) distroless base image for riscv64. |
| None filed | Docker image uses `debian:unstable-slim` and community distroless for riscv64 | Open, untracked | Medium | Ongoing since July 2023; no upstream official distroless riscv64 image exists yet; no issue filed in coredns/coredns to track progress. |

No correctness bugs, no floating-point/NaN issues, and no crash reports specific to riscv64 were found in any searched source (GitHub issues, web search, or riseproject.dev).

---

## 12. Objections and Upstream Blockers

**Stated objections during RISC-V PR review:** None to the port itself. The only review comments addressed implementation style (no separate per-architecture Dockerfile), which the author resolved before @superq approved.

**Technical blockers:**

1. **Docker base images:** Neither `debian:stable-slim` nor the official `gcr.io/distroless` images have a riscv64 variant, a condition unchanged since PR #6195 merged in July 2023. The current workaround uses `ghcr.io/go-riscv/distroless/static-unstable:nonroot`, a community-maintained image. If this image becomes unmaintained or is deleted, the riscv64 Docker build breaks silently, since no CI step executes or validates the resulting image. [NEEDS VERIFICATION: current maintenance status of `go-riscv/distroless` upstream.]
2. **No riscv64 execution CI:** as established in Section 7, there is no mechanism to detect a riscv64-specific regression before release - CI cross-compiles and packages, but never runs, the riscv64 binary. This gap is shared with every non-amd64 architecture CoreDNS supports (arm64, mips64le, ppc64le, s390x, loong64), so riscv64 is not singled out.
3. **etcd server requires `ETCD_UNSUPPORTED_ARCH=riscv64`:** the CoreDNS etcd plugin is functional but requires operator knowledge of this etcd-side environment variable workaround.

**Organizational blockers:** None. The maintainers accepted the riscv64 PR cleanly on its first design iteration, and riscv64 is now cited by contributors as the reference pattern for adding new architectures (explicitly so for loong64, PR #8137). There is no stated policy against RISC-V contributions.

**Benchmark/performance data:** None exists in the public record. An extensive search (GitHub, general web search, `coredns/presentations`, the CARV-ICS-FORTH org, and riseproject.dev) found no riscv64-vs-arm64 or riscv64-vs-amd64 CoreDNS performance comparison anywhere. [Issue #4906](https://github.com/coredns/coredns/issues/4906) proposes general continuous benchmarking (Bencher CI) but carries no architecture-comparison data and does not mention riscv64.

**Acceptance probability for future riscv64 work:** High. Patches that fix the Docker base image dependency (e.g., once official distroless ships riscv64) or add riscv64 execution testing to CI will be accepted based on current maintainer posture. The 5-member Steering Committee structure, with no single-org majority, further reduces political risk for such contributions.

---

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- CoreDNS is not an optimization-purpose project (pure-Go DNS server application, not a SIMD/perf-critical numerics, compression, or crypto library); no optimization-level rating applies.

**Justification:** Applying the project-color-coding skill's CI table to CoreDNS: upstream CI (`.github/workflows/go.test.yml`, job `test-makefile-release`) cross-compiles a riscv64 Go binary and runs a real (non-dry-run) `docker build --platform=riscv64` on every push/PR to master, but never executes the resulting binary or any test suite under riscv64 (no QEMU/binfmt, no `RUN` steps in the final Docker stage) - this is the "build step, no tests" case, which pins the color to yellow regardless of release status. Release status is upstream (`release_provider: upstream`): official GitHub Release riscv64 binaries (`coredns_<ver>_linux_riscv64.tgz`, merged via [PR #6195](https://github.com/coredns/coredns/pull/6195), shipping since v1.11.0) and multi-arch Docker images for linux/riscv64 are published directly by the CoreDNS project itself (via `release.yml`/`docker.yml`), not by a distro or third party. CoreDNS's pure-Go, no-cgo, no-SIMD architecture means the optimization-purpose modifier does not apply (`is_optimization_purpose: false`, `optimization_gap: N/A`).

**Pending work that could change the grade:** None outstanding that would change the grade today. Moving CoreDNS to blue/green would require upstream to add riscv64 execution testing (e.g., a QEMU-run job in `go.test.yml`) - the binary/release side is already solid; this is a 1-2 person-week CI investment item (Section 14.3). There are no open riscv64-specific bugs, no RISE involvement, and no PRs currently in flight that would alter the classification.

---

## 14. Investment Analysis

RISE has not funded any CoreDNS RISC-V work. All existing riscv64 support was contributed by CARV-ICS-FORTH (Antony Chazapis) as an independent community contribution; no RISE budget, runner, or RFP is attached to CoreDNS.

### 14.1 Functional Enablement

No functional gaps exist for core DNS resolution on riscv64. The etcd plugin requires an operator-level workaround (`ETCD_UNSUPPORTED_ARCH=riscv64`) that is entirely an etcd-project problem, not a CoreDNS one. DataDog WAF being absent on riscv64 is a `go-libddwaf` gap, not a CoreDNS gap. No investment is needed for functional enablement within CoreDNS itself.

### 14.2 Performance Optimization

`golang.org/x/crypto` lacks riscv64 assembly for AES-GCM and ChaCha20, affecting DNS-over-TLS/DoH throughput. The quantified delta is unknown - no benchmark exists anywhere in the public record as of this report. Upstream work on `golang.org/x/crypto` riscv64 assembly would benefit all Go-based TLS applications, not CoreDNS specifically; investment should target that project rather than fund a CoreDNS-specific fix. `klauspost/compress` has no riscv64 SIMD path, but CoreDNS uses it only in logging/gRPC paths, not the DNS hot path - low priority.

### 14.3 CI/CD Infrastructure

No riscv64 execution CI exists; the current `test-makefile-release` job only cross-compiles and packages, with no `RUN` step ever executing riscv64 code. Adding a QEMU-emulated riscv64 execution/test job to `go.test.yml` would close the gap identified in Section 13 as the sole blocker to a higher readiness grade. CoreDNS is one of the simpler cases for QEMU emulation - pure Go, `CGO_ENABLED=0`, no kernel-ABI edge cases or syscall traps from hand-written assembly. Estimated effort: 1-2 person-weeks, primarily the QEMU/binfmt setup in GitHub Actions and confirming the existing test suite passes under emulation.

### 14.4 Ecosystem Enablement

CoreDNS is not distributed via any Linux distribution package manager, for any architecture - the upstream binary or container image is the only distribution path, and this works identically on riscv64 today (with an unstable/community Docker base). No distribution-packaging investment is needed for the primary (Kubernetes container-image) use case. The Docker base-image issue (unstable Debian, community distroless) is the highest-priority operational risk; when official `gcr.io/distroless` adds riscv64, a two-line `Makefile.docker` change resolves it. Investment here should track Google's distroless roadmap rather than fund a CoreDNS-specific fix.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|------------------------|-------|----------|
| CI/CD | Add riscv64 QEMU execution/test job to `go.test.yml` | 1-2 | CoreDNS maintainers + RISC-V contributor | High |
| Performance | Add riscv64 assembly for AES-GCM and ChaCha20 in `golang.org/x/crypto` | 8-16 | golang.org/x/crypto upstream | Medium |
| Container | Migrate riscv64 Docker base images to official stable distroless once upstream supports riscv64 | 0.5 (tracking, plus a 2-line change when distroless ships riscv64) | CoreDNS contributor | Low |
| Functional | `DataDog/go-libddwaf` riscv64 support | Not sized here - requires DataDog ownership | DataDog | Low (niche deployment path only) |
| Functional | etcd `ETCD_UNSUPPORTED_ARCH=riscv64` workaround | 0 for CoreDNS; tracked in the etcd project | etcd maintainers | Low (etcd gap, not CoreDNS) |

---

## 15. References

- [CoreDNS repository (coredns/coredns)](https://github.com/coredns/coredns)
- [CoreDNS homepage](https://coredns.io/)
- [CNCF CoreDNS project page](https://www.cncf.io/projects/coredns/)
- [PR #5970 - Include a riscv64 build as part of release (closed, unmerged)](https://github.com/coredns/coredns/pull/5970)
- [PR #6195 - Add support for RISC-V (merged 2023-07-10)](https://github.com/coredns/coredns/pull/6195)
- [Issue #8136 - Add loong64 build and release support (cites riscv64 as template)](https://github.com/coredns/coredns/issues/8136)
- [PR #8137 - build: add loong64 arch support](https://github.com/coredns/coredns/pull/8137)
- [PR #8316 - image: pin numeric uid/gid for the nonroot user](https://github.com/coredns/coredns/pull/8316)
- [Issue #6151 - major CPU performance regression (not RISC-V related)](https://github.com/coredns/coredns/issues/6151)
- [Issue #6682 - context deadline exceeded / rcode refused on s390x (not RISC-V related)](https://github.com/coredns/coredns/issues/6682)
- [Issue #4906 - continuous benchmarking for CoreDNS](https://github.com/coredns/coredns/issues/4906)
- [CoreDNS v1.14.7 release assets (SourceForge mirror, riscv64 tarball confirmed)](https://sourceforge.net/projects/coredns.mirror/files/v1.14.7/)
- [go-riscv/distroless community RISC-V distroless images](https://github.com/go-riscv/distroless/pkgs/container/distroless%2Fstatic-unstable)
- [Makefile.release (riscv64 in LINUX_ARCH)](https://github.com/coredns/coredns/blob/master/Makefile.release)
- [Makefile.docker (riscv64 Docker base image overrides)](https://github.com/coredns/coredns/blob/master/Makefile.docker)
- [CoreDNS Dockerfile](https://github.com/coredns/coredns/blob/master/Dockerfile)
- [klauspost/cpuid issue #158 - riscv64 support added](https://github.com/klauspost/cpuid/issues/158)
- [klauspost/cpuid issue #173 - riscv64 feature detection merged](https://github.com/klauspost/cpuid/issues/173)
- [etcd PR #21510 - Add riscv64 to supported arch list (closed, "No plans")](https://github.com/etcd-io/etcd/pull/21510)
- [DataDog/go-libddwaf - supported platform list (Linux/amd64 and Linux/aarch64 only)](https://github.com/DataDog/go-libddwaf)
- [CoreDNS GOVERNANCE.md](https://github.com/coredns/coredns/blob/master/GOVERNANCE.md)
- [RISE Project blog feed](https://riseproject.dev/feed/)