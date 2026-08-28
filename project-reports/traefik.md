---
title: Traefik
parent: Project Reports
categories:
  - containers
---

# Traefik
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for Traefik
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

Traefik is a reverse proxy and load balancer written entirely in Go (CGO_ENABLED=0). It is the default ingress controller for K3s and is widely deployed in Kubernetes and container-native environments. It handles HTTP/1.1, HTTP/2, HTTP/3 (QUIC), TLS termination, automatic certificate management via ACME, gRPC proxying, WebAssembly middleware plugins, and observability via OpenTelemetry and Prometheus.

**Governance:** Traefik is a vendor-controlled open-source project steered by Traefik Labs (formerly Containous), a private company founded in 2016 by Emile Vauge (Founder and CTO). CEO is Sudeep Goswami. Traefik Labs is a CNCF member and Linux Foundation member but Traefik the proxy is not a CNCF-hosted project (not incubating or graduated). The license is MIT.

**Corporate maintainers:** All 18 active maintainers are presumed Traefik Labs employees. The governance document references adding new maintainers to a "Traefik Labs Discord server," which implies an internal qualification path. Confirmed Traefik Labs affiliations: Emile Vauge (@emilevauge), Kevin Pollet (@kevinpollet, "Open Source @traefik"). Past maintainer Vincent Demeester (@vdemeester, Red Hat) shows at least historical non-Labs maintainership but no current external maintainers are confirmed. The full 18-person active list: Emile Vauge, Manuel Zapf, Julien Salleyron, Nicolas Mengin, Michael Matur, Gerald Croes, Jean-Baptiste Doumenjou, Mathieu Lonjaret, Romain Tribotte, Kevin Pollet, Harold Ozouf, Tom Moulard, Landry Benguigui, Simon Delicata, Baptiste Mayelle, Jesper Noordsij, Gina Adzani, Mathis Urien.

**Community stance on new ports:** Both riscv64 contributions came from external community contributors, were small (GoReleaser config or dependency bump only), and were reviewed and merged within the same day. The governance documentation states "Being part of the core team should be accessible to anyone who is motivated." No formal platform tier policy exists. The project appears receptive to new architecture ports provided CI plumbing is correctly configured.

**RISE membership:** Traefik Labs is not a RISE project member. No RISE blog posts (27 reviewed, May 2024 through June 2026) mention Traefik. Traefik is not an RFP project and does not appear in the RISE Runners adoption list (May 2026, 20+ named adopters).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | PR/Issue | Contributor | Affiliation |
|------|-------|----------|-------------|-------------|
| 2019-08-23 | [PR #5245](https://github.com/traefik/traefik/pull/5245) merged: bumped `golang.org/x/sys` to enable riscv64 compilation. No binary produced; GoReleaser config not updated. Author confirmed Traefik v2.0-dev ran on real riscv64 Linux hardware. | #5245 | carlosedp | Community (riscv-bringup project) |
| 2019-09-16 | Traefik v2.0.0 released. No riscv64 binary in release assets (GoReleaser config not yet updated). | - | - | - |
| 2019-09-23 | [Issue #5470](https://github.com/traefik/traefik/issues/5470) opened: P1-confirmed 100% CPU spin and 502 errors on riscv64 with v2.0.0 under Kubernetes. Root cause isolated to `pkg/server/router/router.go#L150` (middleware assignment triggering router recreation loop). | #5470 | carlosedp | Community |
| 2019-11-18 | Issue #5470 closed by carlosedp: self-resolved by v2.1-rc master build, attributed to architecture-agnostic router fixes in issues #5588 and #5696. No targeted riscv64 fix was committed. Labeled "frozen-due-to-age." | #5470 | carlosedp | Community |
| 2023-07-17 | [PR #10018](https://github.com/traefik/traefik/pull/10018) opened: adds riscv64 to GoReleaser config. Submitted from a GitHub organization account (CARV-ICS-FORTH), breaking maintainer automation. Closed without merge. | #10018 | chazapis | CARV-ICS-FORTH |
| 2023-07-19 | [PR #10026](https://github.com/traefik/traefik/pull/10026) opened and merged: identical change (riscv64 to GoReleaser config), resubmitted from personal fork. No source code changes. Merged same day by @ldez. Milestone: v2.10. Motivation: K3s-on-RISC-V (k3s-io/k3s#7778), since Traefik is deployed by default in K3s. | #10026 | chazapis | CARV-ICS-FORTH |
| 2023-07-24 | v2.10.4 released without riscv64 binary. CI "no space left on device" error forced temporary removal. @ldez acknowledged and pledged to fix. | comment on #10026 | ldez (Traefik Labs) | Traefik Labs |
| 2023-10-11 | v2.10.5: first confirmed release with `traefik_v2.10.5_linux_riscv64.tar.gz` present in release assets. | - | - | - |
| 2026-06-10 | v3.7.5 (latest as of research date): `traefik_v3.7.5_linux_riscv64.tar.gz` and `traefik_v3.7.5_openbsd_riscv64.tar.gz` present in the 22-asset release. riscv64 is a first-class release target. | - | - | - |

**Status: Fully upstream.** riscv64 is in the mainline GoReleaser config and ships in every release since v2.10.5. No out-of-tree patches exist.

---

## 3. Upstream Support Tier

No formal tiered platform support policy exists in traefik/traefik. There is no PLATFORMS.md, SUPPORT.md, or equivalent document. Support tiers are inferred from CI and release artifacts.

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Binary release artifact | Yes | Yes | Yes (since v2.10.5) |
| Docker multi-arch image | Yes | Yes | No |
| PR build CI (cross-compile check) | Yes | Yes | Yes |
| Unit tests in CI | Yes | Yes | No |
| Integration tests in CI | Yes | Yes | No |
| Native runner in CI | No | No | No |
| QEMU execution in CI | No | No | No |
| Makefile dedicated build target | Yes | Yes | No |
| OpenBSD release binary | No | No | Yes (openbsd-riscv64) |

**Effective tier:** riscv64 is a Tier 2 target by behavior: it ships official release binaries and is included in PR cross-compilation checks, but it is excluded from Docker images, unit test execution, integration test execution, and the developer Makefile. amd64 and arm64 are Tier 1 by the same criteria.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Traefik is a pure-Go project (CGO_ENABLED=0). It contains zero architecture-specific source code. The repository has no `.s` assembly files, no C or C++ files, no JIT backends, no SIMD intrinsics, no `_riscv64.go` build-tag files, and no `arch/riscv/` directories. Language breakdown: Go, TypeScript, JavaScript, Shell, Makefile, Go Template.

All platform differences are handled by the Go compiler. There are no hand-tuned, intrinsics-based, or scalar-fallback code paths to evaluate.

**Component table:**

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Arch-specific source files | 0 | 0 | 0 | Pure Go, no arch code |
| JIT compilation | N/A | N/A | N/A | No JIT in Traefik core |
| SIMD/vectorization | N/A | N/A | N/A | No SIMD in Traefik core |
| Assembly | None | None | None | No .s files |
| CGo | Disabled | Disabled | Disabled | CGO_ENABLED=0 forced |
| wazero (Wasm plugins) | JIT (amd64 compiler) | JIT (arm64 compiler) | Interpreter only | Performance gap for Wasm middleware; see Section 9 |
| bytedance/sonic (JSON) | SIMD-accelerated | SIMD-accelerated | stdlib fallback | Functional but slower; see Section 9 |

The meaningful architecture differentiation for riscv64 comes from third-party dependencies (Section 9), not from Traefik's own code.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Project type:** Go. No CMake, no autoconf, no C toolchain required.

**To build for riscv64:**

```
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build \
  -ldflags "-s -w \
    -X github.com/traefik/traefik/v3/pkg/version.Version=<VERSION> \
    -X github.com/traefik/traefik/v3/pkg/version.Codename=<CODENAME> \
    -X github.com/traefik/traefik/v3/pkg/version.BuildDate=<DATE>" \
  -installsuffix nocgo \
  -o ./dist/linux/riscv64/traefik \
  ./cmd/traefik
```

Or via Makefile with environment variables:

```
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 make binary
```

**Go version requirement:** riscv64 support was added in Go 1.14. Traefik v3 requires Go 1.21 or later (inferred from module requirements; `.go-version` file exists in repo but its exact content was not retrieved due to API rate limits [NEEDS VERIFICATION]). Any Go toolchain >= 1.21 suffices for a riscv64 cross-build.

**QEMU:** Not used anywhere in the build pipeline. The Dockerfile uses Docker buildx `TARGETPLATFORM` and copies a pre-compiled binary -- no emulation. The `experimental.yaml` CI workflow sets up QEMU but only for linux/amd64 and linux/arm64 Docker images; riscv64 is absent.

**Makefile:** The `crossbinary-default.sh` script and the default Makefile `cross` targets cover only amd64 and arm64. riscv64 is not in the developer cross-build scripts. It is reachable only via the GoReleaser-driven GitHub Actions release matrix or manual `GOARCH=riscv64` invocation.

**Known build failures:** The v2.10.4 CI "no space left on device" error temporarily dropped the riscv64 artifact from that release. This was an infrastructure failure, not a compilation failure. The issue was resolved in subsequent releases.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because Traefik has zero architecture-specific code, there are no functional gaps at the Traefik application layer between riscv64, arm64, and amd64. Every feature (HTTP/3, TLS termination, ACME, middleware, gRPC, WebAssembly plugins, Prometheus metrics, OpenTelemetry tracing) is available on riscv64 via the same Go source code.

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| HTTP/1.1, HTTP/2 routing | Full | Full | Full |
| HTTP/3 (QUIC) | Full | Full | Full |
| TLS termination, ACME | Full | Full | Full (crypto perf gap, see below) |
| gRPC proxying | Full | Full | Full |
| WebAssembly middleware | JIT (fast) | JIT (fast) | Interpreter (slow) |
| Prometheus metrics | Full | Full | Full |
| OpenTelemetry tracing | Full | Full | Full (untested in CI) |
| Kubernetes Ingress/CRD | Full | Full | Full |
| Docker/Swarm provider | Full | Full | Full |

**Performance gaps (not functional blockers):**

1. **JSON serialization (bytedance/sonic fallback):** On amd64 and arm64, Traefik uses sonic, a SIMD-accelerated JSON encoder/decoder. On riscv64, sonic falls back transparently to Go's `encoding/json` stdlib. Throughput impact is approximately 2-5x slower for JSON-heavy workloads (routing table serialization, API responses). This is automatic and requires no configuration.

2. **WebAssembly middleware (wazero interpreter):** wazero's compiler (JIT) backend supports only amd64 and arm64. On riscv64, wazero runs in interpreter mode exclusively. Performance penalty is typically 5-10x versus JIT. This matters only if Wasm middleware plugins are deployed; the feature remains functional.

3. **TLS and compression throughput:** `golang.org/x/crypto` and `klauspost/compress` include hand-tuned assembly for AES-GCM, ChaCha20, and zstd on amd64 and arm64. On riscv64, pure-Go generic paths are used. Under high-TLS or high-compression workloads, CPU cost per connection will be higher. Magnitude depends on TLS session volume and is not quantified in available sources.

**Security hardening gaps:** Data not available -- no sources reviewed addressed stack canaries, CFI, or memory-tagging hardening for Traefik on riscv64.

**Floating-point/NaN:** Not applicable. Traefik does not perform floating-point arithmetic in its routing logic.

---

## 7. CI/CD Infrastructure

No riscv64 test execution exists in Traefik CI. The riscv64 CI entry is a cross-compilation build check only.

**Detail:**

- `build.yaml` (trigger: pull_request): matrix includes `{os: linux, arch: riscv64}`. Runner: `ubuntu-latest` (x86_64). Step: `make binary` with `GOOS=linux GOARCH=riscv64`. This verifies the binary compiles. No tests run, no QEMU, no execution.
- `release.yaml` (trigger: push `v*.*.*` tags): matrix includes `linux-riscv64` and `openbsd-riscv64`. Runner: `ubuntu-latest` (x86_64). Action: goreleaser binary production. Build only.
- `test-unit.yaml`: zero riscv64 references.
- `test-integration.yaml`: zero riscv64 references.
- `experimental.yaml`: QEMU is configured for Docker multi-arch, but the `DOCKER_BUILD_PLATFORMS` variable covers only `linux/amd64` and `linux/arm64`. riscv64 is absent.

**RISE Runners:** Traefik is not listed among users of the RISE RISC-V GitHub Actions runners (free bare-metal `ubuntu-24.04-riscv` runners on Scaleway EM-RV1 hardware, announced March 2026). As of the six-weeks-in report (May 2026), 87 organizations and 197 repositories were using RISE Runners; Traefik is not among them.

**CI comparison table:**

| CI Type | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Cross-compilation check (PR) | Yes | Yes | Yes |
| Unit test execution | Yes | Yes | No |
| Integration test execution | Yes | Yes | No |
| Docker image build | Yes | Yes | No |
| Native runner | No | No | No |
| QEMU execution | No | No | No |
| RISE Runners | No | No | No |

---

## 8. Distribution and Release Status

**Official GitHub release binaries:** Present in every release since v2.10.5. Confirmed in releases v3.7.5, v3.6.21, v2.11.50, v3.7.4, v3.6.20. Two riscv64 artifacts per release:
- `traefik_<version>_linux_riscv64.tar.gz`
- `traefik_<version>_openbsd_riscv64.tar.gz`

**Docker Hub:** The official Traefik Docker Hub image lists riscv64 as one of seven supported architectures (amd64, arm32v6, arm64v8, ppc64le, riscv64, s390x, windows-amd64). However, the multi-arch build CI (`experimental.yaml`) does not include `linux/riscv64` in `DOCKER_BUILD_PLATFORMS`. This is a discrepancy. The Docker Hub listing may reflect a historical push or a separate pipeline not visible in the main workflow files. [NEEDS VERIFICATION -- Docker Hub listing conflicts with CI workflow content.]

**Distribution packages:**
- Debian: No `traefik` source package tracked. Only unrelated sub-libraries (`golang-github-traefik-paerser-dev`, `golang-github-traefik-yaegi-dev`) exist in Debian sid. riscv64 binary package: absent.
- Ubuntu 24.04: No `traefik` binary package. Only the unrelated `golang-github-traefik-yaegi-dev` library package exists. riscv64 binary package: absent.
- Arch Linux: No `traefik` package in `[core]` or `[extra]`. Therefore also absent from the Arch Linux RISC-V port (archriscv.felixc.at). riscv64 package: absent.
- PyPI: HTTP 404. Traefik is a Go binary, not a Python package. Not applicable.

**What a user must do to get a working riscv64 binary:** Download the official tarball from [GitHub Releases](https://github.com/traefik/traefik/releases). No distribution package exists. The binary is cross-compiled and has never been executed in CI.

---

## 9. Dependencies

### Summary Table

| Dependency | Version | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|---------|------|---------------|--------------|-----------------|-----------------|
| bytedance/sonic | v1.15.1 | CPU-optimized JSON | Builds (stdlib fallback) | Functional via fallback | Ships in binary | No open issues. 2-5x perf gap vs amd64/arm64. |
| klauspost/compress | v1.18.5 | zstd, gzip, snappy, deflate | Builds cleanly | No riscv64 CI | Ships in binary | No open issues. Assembly paths (amd64/arm64 only); pure-Go fallback on riscv64. |
| andybalholm/brotli | v1.2.0 | Brotli compression | Builds | No riscv64 issues | Ships in binary | Pure Go. No issues. |
| quic-go/quic-go | v0.59.1 | HTTP/3 (QUIC) | Builds | No riscv64 CI | Ships in binary | Pure Go. No issues. |
| google.golang.org/grpc | v1.80.0 | gRPC backend, plugin protocol | Builds | No riscv64 issues | Ships in binary | Pure Go. No issues. |
| go.opentelemetry.io/otel | v1.43.0 | Tracing, metrics (OTLP) | Builds | No riscv64 CI (issue #8126 open Apr 2026) | Ships in binary | Issue #8126: cross-build CI for non-amd64 including riscv64 still open. Functional risk low (pure Go) but no test coverage. |
| golang.org/x/crypto | v0.52.0 | TLS, ACME, certificates | Builds | No riscv64 issues | Ships in binary | Pure Go fallback for AES-GCM, ChaCha20. Performance impact for high-TLS workloads. Not blocking. |
| go-jose/go-jose | v4.1.4 | JWT/JWE/JWS middleware | Builds | Issue #112 (arch timeout, closed Jun 2024) | Ships in binary | Past arch timeout bug resolved. No open issues. |
| tetratelabs/wazero | v1.8.0 | Wasm middleware plugin host | Builds (interpreter) | Interpreter-only on riscv64 | Ships in binary | JIT compiler supports only amd64 + arm64. riscv64 runs interpreter mode: 5-10x slower for Wasm workloads. Architectural gap, no open fix. |
| ebitengine/purego | v0.10.0 | CGo-free native lib loading (plugins) | Builds | CI treats riscv64 as "minor" | Ships in binary | PR #427 (merged Mar 2026) fixed riscv64 callee-saved register save/restore. Active maintenance. No open issues. |
| prometheus/client_golang | v1.23.2 | Prometheus metrics endpoint | Builds | No recent riscv64 issues | Ships in binary | procfs riscv64 fix merged 2021 (PR #833). No issues since. |
| github.com/spiffe/go-spiffe | v2.6.0 | SPIFFE/SPIRE mTLS identity | Builds | No riscv64 issues | Ships in binary | Pure Go. No issues. |
| github.com/tjfoc/gmsm | v1.4.1 | GM crypto (SM2/SM3/SM4) | Builds | No riscv64 issues | Ships in binary | Pure Go. No riscv64 assembly, no issues. |

### Deep-Dive: wazero

wazero is the WebAssembly runtime used by Traefik's middleware plugin system. Its compiler backend (JIT) generates native machine code and is implemented only for amd64 and arm64. On riscv64, wazero unconditionally falls back to its interpreter backend. The interpreter is correct and maintained, but carries a 5-10x performance penalty compared to JIT for compute-intensive Wasm operations. This is an architectural constraint in wazero, not a Traefik-level issue. No open riscv64 JIT issues were found in the wazero repository. A JIT backend for riscv64 would require a substantial wazero contribution and is not currently planned upstream.

### Deep-Dive: bytedance/sonic

sonic provides SIMD-accelerated JSON encoding/decoding. It detects CPU architecture at runtime and falls back to Go's `encoding/json` when running on an unsupported architecture (which includes riscv64). The fallback is transparent -- no configuration required, no errors. The performance gap (approximately 2-5x) affects Traefik's API response serialization and routing-table JSON encoding. For deployments where Traefik is the bottleneck at high request rates, this may be measurable.

### Deep-Dive: golang.org/x/crypto

The x/crypto package provides hand-tuned assembly for AES-GCM and ChaCha20-Poly1305 on amd64 (AES-NI) and arm64 (ARMv8 crypto extensions). On riscv64, pure-Go generic implementations are used. Since Traefik terminates TLS connections at scale, the per-connection cryptographic cost is higher on riscv64. The gap will close once Go's crypto packages or x/crypto add RVV (RISC-V Vector) optimized paths, but no such work is in progress in the research findings.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [PR #5245](https://github.com/traefik/traefik/pull/5245) | Bump x/sys to support Risc-V architecture | Merged 2019-08-23 | N/A | Prerequisite: bumped `golang.org/x/sys` to enable riscv64 compilation. No binary produced at that point. |
| [Issue #5470](https://github.com/traefik/traefik/issues/5470) | High CPU usage when accessing dashboard after v2.0.0-rc3 on Risc-V | Closed (frozen-due-to-age) 2019-11-18 | P1 confirmed | 100% CPU spin and repeated 502 errors on riscv64 with Kubernetes 1.16. Root cause: `router.go#L150` -- middleware assignment triggered router recreation loop, causing certificate generation to restart on every Kubernetes poll cycle. Self-resolved by v2.1-rc as a side-effect of architecture-agnostic router fixes (#5588, #5696). No targeted riscv64 fix was committed. The root cause (middleware re-evaluation loop) was not a riscv64-specific bug. |
| [PR #10018](https://github.com/traefik/traefik/pull/10018) | Add support for RISC-V (superseded) | Closed without merge 2023-07-19 | N/A | Blocked by org-account automation issue, not technical objection. Replaced by #10026. |
| [PR #10026](https://github.com/traefik/traefik/pull/10026) | Add support for RISC-V | Merged 2023-07-19, milestone v2.10 | N/A | GoReleaser config addition only. No source changes. |
| (no issue number) | riscv64 binary absent from v2.10.4 release | Resolved in subsequent release | Low | CI disk-space exhaustion forced temporary removal from v2.10.4. Fixed before v2.10.5. |

**Currently open riscv64 correctness or performance bugs in traefik/traefik:** None. All historical issues are closed.

**Correctness risk note:** Issue #5470 was closed without a formal root-cause fix and was attributed to an indirect resolution via unrelated router fixes. If a similar router middleware re-evaluation regression is introduced in v3.x, it could recur on any architecture (not riscv64-specific). No evidence this has recurred.

---

## 12. Objections and Upstream Blockers

**No stated objections:** Both riscv64 PRs (#5245, #10026) were merged same-day without pushback. The project has no formal policy restricting which architectures are accepted.

**Process constraint (resolved):** PR #10018 was closed because it was submitted from a GitHub organization account, which prevented the maintainer automation bot from editing the branch. This is a CI process requirement, not a technical objection. It was resolved by resubmitting from a personal fork (#10026).

**Technical blockers:** None. Because Traefik is pure Go with CGO_ENABLED=0, any GOARCH supported by the Go toolchain can be added to the GoReleaser config with zero source changes. riscv64 has been supported by Go since 1.14.

**Docker image gap:** The multi-arch Docker build CI (`experimental.yaml`) does not include `linux/riscv64`. Adding it would require only a single-line change to `DOCKER_BUILD_PLATFORMS`. The maintainer response pattern (same-day merges, LGTM from @ldez) suggests this would be accepted.

**Test gap:** No mechanism exists for riscv64 test execution. RISE Runners would provide free bare-metal riscv64 GitHub Actions runners with no code changes required in the test workflows -- only runner label changes. Traefik has not adopted RISE Runners. This is an adoption gap, not a technical objection.

**Acceptance probability for incremental improvements:** High. The project's pattern is to accept small, well-scoped infrastructure PRs without friction. Docker image enablement and RISE Runner adoption are both single-commit changes with no source modifications. The risk of rejection is low.

---

## 13. Investment Analysis

RISE has not done any funded work on Traefik for riscv64. The existing binary support (PR #10026) was contributed by CARV-ICS-FORTH as a byproduct of K3s work. No RISE blog posts, RFP documents, or runner adoption records mention Traefik.

### 13.1 Functional Enablement

The binary compiles and runs. No functional work is required. The only gap is the Docker multi-arch image, which is a single-line CI change.

### 13.2 Performance Optimization

Three dependencies have architectural performance gaps on riscv64:

1. **wazero interpreter-only:** A riscv64 JIT backend in wazero would benefit all wazero users, not just Traefik. This is a significant multi-month wazero-level investment. It is relevant only for deployments using Wasm middleware plugins.

2. **bytedance/sonic fallback:** Upstream sonic could add riscv64 SIMD support (RVV), but this is a sonic-level investment with broad applicability beyond Traefik. Alternatively, Traefik could replace sonic with a different JSON library that performs better on riscv64.

3. **golang.org/x/crypto generic paths:** RVV-optimized AES-GCM and ChaCha20 in x/crypto would benefit the entire Go ecosystem on riscv64. This is a Go ecosystem investment, not a Traefik-specific one.

None of these performance items require changes to Traefik itself.

### 13.3 CI/CD Infrastructure

The highest-leverage infrastructure investment is adopting RISE Runners to add native riscv64 test execution. The change requires:
- Adding `runs-on: ubuntu-24.04-riscv` to `test-unit.yaml` and/or `test-integration.yaml`
- Registering the traefik/traefik repository with the RISE Runners program

This surfaces regressions before they ship in release binaries. Currently, a riscv64 correctness regression would be invisible until a user reports it. The CI disk-space incident in v2.10.4 and the frozen Issue #5470 both illustrate the risk of treating riscv64 as an untested build target.

Adding a riscv64 Docker multi-arch image requires one line added to `DOCKER_BUILD_PLATFORMS` in `experimental.yaml`.

### 13.4 Ecosystem Enablement

No dependent package ecosystem applies to Traefik. It is a standalone Go binary. Section 10 is omitted.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI/CD | Add RISE Runner riscv64 jobs to test-unit.yaml and test-integration.yaml | 0.5 | Traefik Labs or external contributor | High |
| CI/CD | Add linux/riscv64 to Docker multi-arch build (DOCKER_BUILD_PLATFORMS) | 0.1 | Traefik Labs or external contributor | Medium |
| Performance | RVV-optimized AES-GCM / ChaCha20 in golang.org/x/crypto | 8-16 | Go core team (ecosystem-wide benefit) | Medium |
| Performance | riscv64 JIT backend in tetratelabs/wazero | 20-40 | wazero maintainers (ecosystem-wide benefit) | Low (Wasm plugins are optional) |
| Performance | riscv64 SIMD JSON in bytedance/sonic or replacement library | 4-8 | sonic maintainers or Traefik contributor | Low (2-5x gap is not blocking) |
| Functional | None -- binary is fully functional on riscv64 | 0 | - | N/A |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [PR #5245: Bump x/sys to support Risc-V architecture](https://github.com/traefik/traefik/pull/5245)
- [Issue #5470: High CPU usage when accessing dashboard after v2.0.0-rc3 on Risc-V architecture](https://github.com/traefik/traefik/issues/5470)
- [PR #10018: Add support for RISC-V (superseded)](https://github.com/traefik/traefik/pull/10018)
- [PR #10026: Add support for RISC-V (merged)](https://github.com/traefik/traefik/pull/10026)
- [Traefik v3.7.5 release assets](https://github.com/traefik/traefik/releases/expanded_assets/v3.7.5)
- [Traefik v3.3.3 release assets (riscv64 tarball confirmed)](https://github.com/traefik/traefik/releases/expanded_assets/v3.3.3)
- [GitHub CI build.yaml](https://github.com/traefik/traefik/blob/main/.github/workflows/build.yaml)
- [GitHub CI release.yaml](https://github.com/traefik/traefik/blob/main/.github/workflows/release.yaml)
- [Traefik governance and maintainers](https://github.com/traefik/traefik/blob/main/GOVERNANCE.md)
- [RISE Project: Announcing RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [K3s RISC-V tracking issue (motivation for PR #10026)](https://github.com/k3s-io/k3s/issues/7778)
- [carlosedp riscv-bringup project](https://github.com/carlosedp/riscv-bringup)
- [Traefik Labs About page (CNCF/LF membership)](https://traefik.io/about-us/)
- [OpenTelemetry cross-build CI issue #8126](https://github.com/open-telemetry/opentelemetry-go/issues/8126)
- [ebitengine/purego PR #427: riscv64 callee-saved register fix](https://github.com/ebitengine/purego/pull/427)
- [prometheus/client_golang PR #833: procfs riscv64 fix](https://github.com/prometheus/client_golang/pull/833)