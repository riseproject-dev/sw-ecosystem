---
title: CoreDNS
categories:
  - containers
---

# CoreDNS
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for CoreDNS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

CoreDNS is a DNS server written entirely in Go, designed as a plugin-based, chain-based request processor. It serves as the default DNS server in Kubernetes clusters (kube-dns replacement) and is used in edge deployments, IoT clusters, and service mesh environments.

CoreDNS is a [CNCF graduated project](https://www.cncf.io/projects/coredns/) (joined CNCF 2017-02-27, graduated 2019-01-24), licensed under Apache License 2.0 and affiliated with The Linux Foundation.

**Governance:** Maintainer-consensus model. Final disputes escalate to a 5-member Steering Committee with a maximum of one member per organization (1-year elected terms). No single organization may hold more than 1/5 of binding votes. Sub-projects must use Apache-2.0 and have an unaffiliated maintainer. Governance is documented in GOVERNANCE.md; the maintainer roster is in CODEOWNERS.

**Corporate maintainers (identified affiliations):**
- @chrisohaver -- Infoblox
- @johnbelamaric -- Google
- @miekg -- independent (founder, core author)
- @superq (Ben Kochie) -- independent (Prometheus maintainer)
- @yongtang -- merged the RISC-V PR

**Community culture on new ports:** Accepting. The loong64 request ([Issue #8136](https://github.com/coredns/coredns/issues/8136), June 2026) explicitly cited riscv64 as the established template for non-mainstream architectures and was resolved in 3 days. The blocking requirement for new architecture additions is: (1) working base container images (unstable or community sources are acceptable), and (2) no architecture-specific Dockerfiles. The maintainer @superq specifically required this clean approach during review of the riscv64 PR.

**RISE involvement:** None. All 27 RISE blog posts were reviewed; none mention CoreDNS. CoreDNS is not a named RISE RFP deliverable.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2023-03-15 | [PR #5970](https://github.com/coredns/coredns/pull/5970) opened by jjlauer (VisionFive2 hardware testing) -- binary releases only, no Docker | GitHub PR |
| 2023-03-17 | @chrisohaver requests signed commits; jjlauer does not respond | PR #5970 comments |
| 2023-05-27 | PR #5970 closed by stale bot (30-day inactivity + 7-day warning) | GitHub PR |
| 2023-07-06 | [PR #6195](https://github.com/coredns/coredns/pull/6195) opened by chazapis (Antony Chazapis, CARV-ICS-FORTH) -- binary + Docker | GitHub PR |
| 2023-07-06 | @superq reviews and requests no architecture-specific Dockerfile; chazapis revises | PR #6195 comments |
| 2023-07-06 | chazapis discovers [ghcr.io/go-riscv/distroless](https://github.com/go-riscv/distroless/pkgs/container/distroless%2Fstatic-unstable) as community distroless workaround | PR #6195 comments |
| 2023-07-06 | @superq approves | PR #6195 comments |
| 2023-07-10 | PR #6195 merged by @yongtang; commit SHA 7569d132a16dd8778c1f2f7dceeb273a2b8ef115 | GitHub PR merge |
| 2023-08-08 | riscv64 first shipped in v1.11.0 | GitHub Releases |
| 2026-06-09 | riscv64 present in v1.14.4 (latest release); `coredns_1.14.4_linux_riscv64.tgz` published | GitHub Releases |

**Validation at merge time:** PR #6195 author tested with QEMU alongside a RISC-V build of K3s. This was a one-time manual spot check; no automated riscv64 validation exists. [NEEDS VERIFICATION: whether post-merge spot checks have been conducted on real hardware.]

**RISC-V support is fully upstream** in the main repository. No downstream fork or separate tree is required.

---

## 3. Upstream Support Tier

No formal platform tier policy exists in CoreDNS. Architecture additions are accepted via PR with maintainer review. The project has no written tier classification (e.g., Tier 1/2/3).

**Practical tier assessment based on observable behavior:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Binary release artifact | Yes | Yes | Yes (v1.11.0+) |
| Docker image released | Yes | Yes | Yes (unstable base) |
| CI unit tests | Yes (ubuntu-latest) | No | No |
| CI integration tests | No | No | No |
| Docker base image quality | stable-slim + distroless | stable-slim + distroless | unstable-slim + community distroless |
| Release-blocking on failure | N/A | No | No |
| Distribution packages | No (not in Debian/Ubuntu) | No | No |

**Conclusion:** riscv64 is a first-class release artifact target but a zero-coverage testing target. It receives the same cross-compiled binary and container image as all other Linux architectures, with the exception that riscv64 uses non-stable base images due to upstream Debian and Google distroless not shipping stable riscv64 images.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

CoreDNS is a pure-Go project (language composition: >99% Go, CGO_ENABLED=0 by default). There are zero architecture-specific source files in the repository.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| DNS wire protocol (miekg/dns) | Go stdlib | Go stdlib | Go stdlib |
| Plugin framework | Go | Go | Go |
| JIT backend | None | None | None |
| Hand-written assembly (.s files) | None | None | None |
| SIMD dispatch | None in CoreDNS itself | None in CoreDNS itself | None in CoreDNS itself |
| Arch-specific Go build tags | None | None | None |
| CGO / C intrinsics | None (CGO off) | None (CGO off) | None (CGO off) |
| Crypto (TLS, HKDF) | Go stdlib + golang.org/x/crypto | Go stdlib + golang.org/x/crypto | Go stdlib + golang.org/x/crypto (generic fallback) |
| Compression (gzip, zstd) | klauspost/compress (SIMD for amd64/arm64) | klauspost/compress (SIMD for arm64) | klauspost/compress (pure-Go fallback) |

There is no RISC-V ISA extension usage (no RVV, no Zba/Zbb/Zbc). No JIT, no GC barrier hand-tuning, no SIMD dispatch. The riscv64-specific customization in the entire repository is two lines in `Makefile.docker` setting alternative base images.

The only subsystem with a meaningful riscv64 delta is crypto throughput (golang.org/x/crypto uses Go assembly on amd64/arm64 for AES-GCM and ChaCha20; riscv64 uses the generic Go fallback). This affects DNS-over-TLS and DNS-over-HTTPS performance, not correctness.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make + Go toolchain. No CMake, no configure, no Autotools.

**Go version:** `go.mod` declares minimum `go 1.25.0`. The `.go-version` file pins `1.26.4`. Minimum Go 1.25.0 is the stated requirement in README.

**CGO:** Disabled by default (`CGO_ENABLED=0`). Cross-compilation requires no C toolchain.

**Cross-compile riscv64 binary:**
```
make SYSTEM="GOOS=linux GOARCH=riscv64"
```
or equivalently:
```
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build -o coredns
```

No special flags, no workarounds, no riscv64-specific `go build` arguments.

**Official release build loop (from `Makefile.release`):**
```
LINUX_ARCH="amd64 arm arm64 mips64le ppc64le s390x mips riscv64 loong64"
for arch in $LINUX_ARCH; do
    make coredns BINARY=build/linux/$arch/coredns SYSTEM="GOOS=linux GOARCH=$arch"
done
```
riscv64 is treated identically to all other Linux architectures at the binary level.

**Docker build for riscv64:** Requires overriding the default base images because `debian:stable-slim` and `gcr.io/distroless/static-debian12:nonroot` have no riscv64 variants:
```
DOCKER_BUILDKIT=1 docker build --platform=riscv64 \
    --build-arg=DEBIAN_IMAGE=debian:unstable-slim \
    --build-arg=BASE=ghcr.io/go-riscv/distroless/static-unstable:nonroot \
    -t coredns/coredns:riscv64-VERSION \
    build/docker/riscv64
```
This is QEMU-based cross-build on x86; no native riscv64 runner is used.

**QEMU usage:** Not documented or required for building. Cross-compilation via `GOARCH=riscv64` produces a native riscv64 binary without QEMU. QEMU is only invoked indirectly by Docker buildx when building the container image on x86 hosts.

**Known build failures:** None reported. The cross-compile path is standard Go toolchain behavior.

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
| etcd backend | Full | Full | Full (requires `ETCD_UNSUPPORTED_ARCH=riscv64` for etcd server) | Operational only |
| DataDog APM (dd-trace-go) | Full | Full | Partial -- WAF/AppSec disabled | Security feature gap |
| DataDog WAF (go-libddwaf) | Full | Full | Silently disabled (WafDisabledError) | Security feature gap |
| SIMD compression (gzip/zstd) | Hardware-accelerated | Hardware-accelerated | Pure-Go fallback | Performance only |
| Container image base | debian:stable-slim + distroless | debian:stable-slim + distroless | debian:unstable-slim + community distroless | Operational risk |

**Functional gaps:** None for core DNS functionality. CoreDNS on riscv64 resolves DNS queries with full protocol fidelity.

**Security feature gaps:** DataDog WAF (`go-libddwaf`) is silently disabled on riscv64 -- `libddwaf.a` is prebuilt only for Linux/amd64, Linux/aarch64, macOS/amd64, macOS/arm64. This is only relevant if the DataDog APM plugin is enabled.

**Performance gaps:** golang.org/x/crypto uses Go assembly for AES-GCM and ChaCha20 on amd64 and arm64; riscv64 uses the generic Go path. Throughput delta is unquantified -- no benchmarks exist in the public record.

**NaN / floating-point:** CoreDNS performs no floating-point arithmetic in the DNS processing path. No NaN issues.

**Security hardening:** No stack canary or CFI differences attributable to architecture -- all handled by the Go runtime uniformly.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists anywhere in the CoreDNS pipeline. This was verified by reading all 12 workflow files in `.github/workflows/`.

| Workflow file | Trigger | riscv64 coverage |
|---------------|---------|-----------------|
| `go.test.yml` | push to master, pull_request | None -- ubuntu-latest (x86) and windows-latest only |
| `release.yml` | workflow_dispatch (manual) | Builds riscv64 cross-compiled binary; no test execution |
| `docker.yml` | release: published, workflow_dispatch | QEMU cross-builds riscv64 Docker image; no test execution |
| `golangci-lint.yml` | push, pull_request | amd64 only |
| `codeql-analysis.yml` | push, schedule | amd64 only |
| All other workflows | various | No architecture matrix; amd64 only |

No `.cirrus.yml`, no `Jenkinsfile`, no `.gitlab-ci.yml`.

**RISE CI runners:** None. CoreDNS does not use RISE-provided infrastructure.

| CI category | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Unit tests on PR | Yes | No | No |
| Integration tests | No | No | No |
| Binary cross-compilation | Yes | Yes | Yes (manual trigger only) |
| Docker build | Yes | Yes | Yes (release trigger only) |
| Lint | Yes | No | No |
| Fuzz (cifuzz.yml) | Yes | No | No |

A riscv64 regression introduced in a dependency update would not be caught before release.

---

## 8. Distribution and Release Status

**Official upstream binaries:** `coredns_1.14.4_linux_riscv64.tgz` is published as a first-class release asset in [GitHub Releases v1.14.4](https://github.com/coredns/coredns/releases/tag/v1.14.4) alongside amd64, arm, arm64, loong64, mips, mips64le, ppc64le, and s390x. SHA256 checksum file is also provided. This has been the case since v1.11.0 (2023-08-08).

**Container images:** A `riscv64-1.14.4` Docker tag is published to Docker Hub. The image uses `debian:unstable-slim` (build stage) and `ghcr.io/go-riscv/distroless/static-unstable:nonroot` (final stage). These are community-maintained and based on Debian unstable, not a production-stable base.

**Distribution packages:**

| Distribution | riscv64 CoreDNS package | Status |
|--------------|------------------------|--------|
| Debian (bookworm/sid) | No -- `tracker.debian.org/pkg/coredns` returns 404 | Not packaged |
| Ubuntu 24.04 (noble) | No -- packages.ubuntu.com returns no result | Not packaged |
| Arch Linux RISC-V (archriscv.felixc.at) | Not confirmed | CoreDNS is AUR-only on x86; unlikely ported |

**PyPI:** A `coredns-0.0.1.tar.gz` stub exists on PyPI but is an unrelated placeholder, not the CoreDNS server. Not relevant.

**What a user must do to get a working riscv64 binary:** Download `coredns_1.14.4_linux_riscv64.tgz` directly from GitHub Releases, or pull the `coredns/coredns:riscv64-1.14.4` Docker image. No package manager path exists.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|------------|------|--------------|-------------|----------------|-------|
| miekg/dns | Core DNS wire protocol | Yes (pure Go) | No riscv64 CI | Library | No gaps |
| quic-go/quic-go | QUIC / DoQ transport | Yes (pure Go) | No riscv64 CI | Library | No gaps |
| golang.org/x/crypto | TLS, HKDF, ChaCha20, AES-GCM | Yes (generic Go fallback) | Covered by Go stdlib CI | Library | Performance gap: no assembly on riscv64 |
| klauspost/compress | zstd, gzip, snappy (gRPC, logging) | Yes (pure-Go path) | No riscv64 CI | Library | Performance gap: SIMD only on amd64/arm64; generic path on riscv64 |
| klauspost/cpuid/v2 | CPU feature detection | Yes -- riscv64 feature detection merged (issues #158, #173 closed) | Unknown | Library | No gaps |
| minio/simdjson-go | SIMD JSON parsing (DataDog path) | Builds; `SupportedCPU()` returns false on riscv64 | No riscv64 CI | Library | SIMD parsing disabled; only affects DataDog tracing path |
| DataDog/go-libddwaf | DataDog WAF bindings (CGo, prebuilt) | Not supported on riscv64 | No | No | Returns `WafDisabledError` silently; WAF/AppSec absent on riscv64 |
| DataDog/dd-trace-go | DataDog APM tracing | Builds; native features disabled (WAF, SIMD JSON) | No riscv64 CI | Library | Not a build blocker; degraded functionality only |
| go.etcd.io/etcd/client/v3 | etcd client (service discovery backend) | Yes (pure Go client) | No riscv64 CI | Library | etcd server requires `ETCD_UNSUPPORTED_ARCH=riscv64`; maintainers closed riscv64 support PR (#21510) with "No plans." |
| prometheus/client_golang | Prometheus metrics exposition | Yes (historical procfs riscv64 fix #325/#833 resolved) | No riscv64 CI | Library | No gaps |
| google.golang.org/grpc | gRPC (etcd client, OpenTelemetry) | Yes (pure Go) | No riscv64 CI | Library | No issues found |
| go.uber.org/automaxprocs | GOMAXPROCS auto-tuning from cgroup | Yes (pure Go) | No riscv64 CI | Library | No gaps |
| oschwald/geoip2-golang | MaxMind GeoIP2 reader (geoip plugin) | Yes (pure Go) | No riscv64 CI | Library | No gaps |

**Critical dependency notes:**

`DataDog/go-libddwaf` is the only dependency that is structurally broken on riscv64. It ships a prebuilt `libddwaf.a` for Linux/amd64 and Linux/aarch64 only. On riscv64 the library returns `WafDisabledError` and silently disables all WAF features. No issue has been filed upstream. This affects only deployments using the DataDog APM plugin with security features enabled.

`go.etcd.io/etcd` client compiles and runs on riscv64. The etcd server (a separate binary) requires the workaround environment variable `ETCD_UNSUPPORTED_ARCH=riscv64`. The etcd maintainers rejected [PR #21510](https://github.com/etcd-io/etcd/pull/21510) to add riscv64 to the supported architecture list, citing no available RISC-V CI hardware. See `project-reports/etcd.md` for details.

---

## 11. Known Bugs and Active Issues

No riscv64-specific open bugs exist in the CoreDNS issue tracker as of the research date.

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [PR #5970](https://github.com/coredns/coredns/pull/5970) | Include a riscv64 build as part of release | Closed (unmerged) | N/A | Closed by stale bot; author did not provide signed commits. Superseded by PR #6195. |
| [PR #6195](https://github.com/coredns/coredns/pull/6195) | Add support for RISC-V | Merged | N/A | Merged 2023-07-10; introduces dependency on community distroless image (ongoing) |
| None | Docker image uses `debian:unstable-slim` and community distroless for riscv64 | Open (no issue filed) | Medium | Ongoing since July 2023; no upstream distroless stable riscv64 image exists yet; no issue filed to track progress |

No correctness bugs. No floating-point or NaN issues. No crash reports.

---

## 12. Objections and Upstream Blockers

**Stated objections during RISC-V PR review:** None to the port itself. The only review comments addressed implementation style (no separate Dockerfile per architecture), which the author resolved before approval.

**Technical blockers:**

1. Docker base images: `debian:stable-slim` has no riscv64 variant. `gcr.io/distroless/static-debian12:nonroot` has no riscv64 variant. Both have been without riscv64 support since PR #6195 was merged (July 2023). The current workaround uses `ghcr.io/go-riscv/distroless/static-unstable:nonroot`, a community-maintained image. If this image becomes unmaintained or is deleted, the riscv64 Docker build breaks silently with no CI to detect it. [NEEDS VERIFICATION: current maintenance status of go-riscv/distroless upstream.]

2. No riscv64 CI: there is no mechanism to detect regressions pre-release on riscv64. This is a gap shared with arm64 but arm64 at least has hardware available to maintainers.

3. etcd server requires `ETCD_UNSUPPORTED_ARCH=riscv64`: the CoreDNS etcd plugin is functional but requires operator knowledge of this workaround.

**Organizational blockers:** None. The maintainers accepted the riscv64 PR cleanly. There is no stated policy against RISC-V contributions. riscv64 is now cited as the reference pattern for new architecture additions.

**Acceptance probability for future riscv64 work:** High. Patches that fix the Docker base image dependency (e.g., when official distroless ships riscv64) or add riscv64 to CI will be accepted based on current maintainer posture. The project has a 5-member Steering Committee with no single-org majority, reducing political risk.

---

## 13. Investment Analysis

RISE has not funded any CoreDNS RISC-V work. All existing riscv64 support was contributed by CARV-ICS-FORTH (Antony Chazapis) as a community contribution.

### 13.1 Functional Enablement

No functional gaps for core DNS resolution. The etcd plugin requires an operator-level workaround (`ETCD_UNSUPPORTED_ARCH=riscv64`) that is entirely an etcd problem, not a CoreDNS problem. DataDog WAF being absent on riscv64 is a `go-libddwaf` gap, not a CoreDNS gap. No investment needed for functional enablement in CoreDNS itself.

### 13.2 Performance Optimization

golang.org/x/crypto lacks riscv64 assembly for AES-GCM and ChaCha20. This affects DNS-over-TLS and DNS-over-HTTPS throughput. Quantified delta is unknown -- no benchmarks exist. Upstream work on golang.org/x/crypto riscv64 assembly would benefit all Go-based TLS applications, not just CoreDNS. No CoreDNS-specific work is needed; investment should target golang.org/x/crypto if TLS performance matters.

klauspost/compress has no riscv64 SIMD path; generic Go is used. CoreDNS uses this only in logging and gRPC paths, not in the DNS hot path. Low priority.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists. Adding a QEMU-emulated riscv64 test job to `go.test.yml` would provide basic regression coverage with minimal infrastructure cost. A pure-Go project with CGO_ENABLED=0 is one of the simplest cases for QEMU emulation -- no kernel ABI edge cases, no syscall traps from assembly. Estimated effort: 1-2 person-weeks to implement and get merged, primarily the QEMU setup in GitHub Actions and confirming the test suite passes under emulation.

### 13.4 Ecosystem Enablement

CoreDNS is not distributed via any Linux distribution package manager. This means RISC-V deployments must use the upstream binary or container image directly. For Kubernetes-based deployments (where CoreDNS is the default DNS), the container image path is the deployment mechanism, and it works today (though with an unstable base). No distribution packaging investment is needed for the primary use case.

The Docker base image issue (unstable Debian and community distroless) is the highest-priority operational risk. When official `gcr.io/distroless/static-debian12:nonroot` adds riscv64, a 2-line Makefile.docker change resolves it. Investment here should track Google's distroless roadmap rather than fund a CoreDNS-specific fix.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add riscv64 QEMU test matrix to `go.test.yml` | 1-2 | CoreDNS maintainers + RISC-V contributor | High |
| Performance | Add riscv64 assembly for AES-GCM and ChaCha20 in golang.org/x/crypto | 8-16 | golang.org/x/crypto upstream | Medium |
| Container | Migrate riscv64 Docker base images to official stable once upstream supports riscv64 | 0.5 (tracking + 2-line change when distroless ships riscv64) | CoreDNS contributor | Low |
| Functional | DataDog WAF (go-libddwaf) riscv64 support | Not sized here -- requires DataDog ownership | DataDog | Low (niche deployment only) |
| Functional | etcd ETCD_UNSUPPORTED_ARCH=riscv64 workaround | 0 for CoreDNS; tracked in etcd project | etcd maintainers | Low (etcd gap, not CoreDNS) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [CoreDNS repository (coredns/coredns)](https://github.com/coredns/coredns)
- [CoreDNS homepage](https://coredns.io/)
- [CNCF CoreDNS project page](https://www.cncf.io/projects/coredns/)
- [PR #5970 -- Include a riscv64 build as part of release (closed unmerged)](https://github.com/coredns/coredns/pull/5970)
- [PR #6195 -- Add support for RISC-V (merged 2023-07-10)](https://github.com/coredns/coredns/pull/6195)
- [Issue #8136 -- Add loong64 build and release support (closed 2026-06-04, cites riscv64 as template)](https://github.com/coredns/coredns/issues/8136)
- [CoreDNS v1.14.4 release assets (riscv64 binary confirmed)](https://github.com/coredns/coredns/releases/tag/v1.14.4)
- [go-riscv/distroless community RISC-V distroless images](https://github.com/go-riscv/distroless/pkgs/container/distroless%2Fstatic-unstable)
- [Makefile.release (riscv64 in LINUX_ARCH)](https://github.com/coredns/coredns/blob/master/Makefile.release)
- [Makefile.docker (riscv64 Docker base image overrides)](https://github.com/coredns/coredns/blob/master/Makefile.docker)
- [CoreDNS Dockerfile](https://github.com/coredns/coredns/blob/master/Dockerfile)
- [klauspost/cpuid issue #158 -- riscv64 support added](https://github.com/klauspost/cpuid/issues/158)
- [klauspost/cpuid issue #173 -- riscv64 feature detection merged](https://github.com/klauspost/cpuid/issues/173)
- [etcd PR #21510 -- Add riscv64 to supported arch list (closed, "No plans.")](https://github.com/etcd-io/etcd/pull/21510)
- [DataDog/go-libddwaf -- supported platform list (Linux/amd64 and Linux/aarch64 only)](https://github.com/DataDog/go-libddwaf)
- [CoreDNS GOVERNANCE.md](https://github.com/coredns/coredns/blob/master/GOVERNANCE.md)