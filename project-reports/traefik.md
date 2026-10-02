---
title: Traefik
parent: Project Reports
color: yellow
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: GoReleaser
    relation: build-dependency
    criticality: optional
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: critical
  - name: golang.org/x/crypto
    relation: runtime-dependency
    criticality: critical
  - name: bytedance/sonic
    relation: runtime-dependency
    criticality: optional
  - name: Wazero
    relation: runtime-dependency
    criticality: optional
  - name: klauspost/compress
    relation: runtime-dependency
    criticality: optional
  - name: andybalholm/brotli
    relation: runtime-dependency
    criticality: optional
  - name: tjfoc/gmsm
    relation: runtime-dependency
    criticality: optional
  - name: ebitengine/purego
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="traefik" %}

# Traefik

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Traefik<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Traefik is a reverse proxy and load balancer written entirely in Go (`CGO_ENABLED=0`). It is the default ingress controller for K3s and is widely deployed in Kubernetes and container-native environments. It handles HTTP/1.1, HTTP/2, HTTP/3 (QUIC), TLS termination, automatic certificate management via ACME, gRPC proxying, WebAssembly middleware plugins, and observability via OpenTelemetry and Prometheus.

**Governance:** Traefik is a vendor-controlled open-source project steered by Traefik Labs (formerly Containous SAS, renamed circa 2020, per `LICENSE.md`: "Copyright (c) 2016-2020 Containous SAS; 2020-2025 Traefik Labs"). No CNCF, Linux Foundation, or other foundation affiliation was found in the repository (no `GOVERNANCE.md` naming a foundation) or on [traefik.io](https://traefik.io/); Traefik Labs also sells commercial products (Traefik Hub API Gateway/Management) alongside the OSS proxy. Governance sits entirely inside the company: the maintainer-guidelines document states that all maintainers join "the Traefik Maintainers Discord server that belongs to Traefik Labs." A contributor is promoted to maintainer by vote of existing maintainers (quorum within one month), and must have 2FA enabled and a track record of PRs/reviews. License is MIT.

**Corporate maintainers:** The 18 active maintainers listed in [`docs/content/contributing/maintainers.md`](https://github.com/traefik/traefik/blob/main/docs/content/contributing/maintainers.md) are: Emile Vauge, Manuel Zapf, Julien Salleyron, Nicolas Mengin, Michael Matur, Gerald Croes, Romain Tribotte, Kevin Pollet, Harold Ozouf, Tom Moulard, Landry Benguigui, Simon Delicata, Baptiste Mayelle, Jesper Noordsij, Gina Adzani, Mathis Urien, Kangmin Kim, Nandor Kollar. Top committers by git-log volume (all-time / last ~12 months) are overwhelmingly Traefik Labs staff: Ludovic Fernandez (870 all-time), Emile Vauge (496, co-founder), Romain Tribotte (429 / 188), Kevin Pollet (305 / 153), Michael Matur (276 / 77), plus Julien Salleyron, Tom Moulard (`@traefik.io`), Simon Delicata (`@traefik.io`), and Shedrack Akintayo (`@traefik.io`, 44 commits in 2025). No maintainers affiliated with outside companies (no Microsoft/Google/AWS/Red Hat-style external corporate sponsors) were identified - this is a single-company-dominated maintainer base. A past maintainer, Vincent Demeester (Red Hat), is historical only and not part of the current active list [NEEDS VERIFICATION].

**Community stance on new ports:** Both riscv64 contributions came from external community contributors, were small (GoReleaser config change or dependency bump only), and were reviewed and merged within the same day by maintainer ldez. The guidelines state "Being part of the core team should be accessible to anyone motivated." No formal platform-tier policy exists; the project is receptive to new architecture ports once CI plumbing is correctly configured.

**RISE membership:** Traefik Labs is not a RISE Project member. All 34 RISE blog posts published between May 2024 and September 2026 were reviewed by title, and the four most infrastructure-relevant posts were read in full ("Advancing Go on RISC-V," "Announcing the RISE RISC-V Runners," "RISE RISC-V Runners: Six Weeks In," and the Python/PyPI-on-riscv64 post) - none mention Traefik. RISE's member roster (Premier: Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) does not include Traefik Labs. A GitHub search of the `riseproject-dev` organization (26 repositories) returned zero matches for "Traefik."

## 2. Port History and Upstreaming Timeline

| Date | Event | Source | Contributor | Affiliation |
|---|---|---|---|---|
| 2019-08-23 | [PR #5245](https://github.com/traefik/traefik/pull/5245) merged (milestone v2.0): bumped `golang.org/x/sys` to a version adding riscv64 support, referencing [golang/go#27532](https://github.com/golang/go/issues/27532) and the author's [riscv-bringup](https://github.com/carlosedp/riscv-bringup) tracker. Author posted `uname -a` output showing `riscv64 GNU/Linux` and a working `./traefik version` with `OS/Arch: linux/riscv64`, confirming Traefik's dependency tree compiled and ran on real riscv64 hardware. Three maintainer LGTMs same day (ldez, juliens, nmengin). No release artifact produced; GoReleaser config not yet updated. | PR #5245 | carlosedp | Community |
| 2019-09-23 | [Issue #5470](https://github.com/traefik/traefik/issues/5470) opened: P1-confirmed 100% CPU spin and repeated HTTP 502s on riscv64 with v2.0.0-rc3+ under Kubernetes 1.16. | Issue #5470 | carlosedp | Community |
| 2019-11-18 | Issue #5470 closed, self-resolved by the v2.1-rc master build; no targeted riscv64 fix was committed. Labeled "frozen-due-to-age." | Issue #5470 | carlosedp | Community |
| 2023-07-19 | [PR #10018](https://github.com/traefik/traefik/pull/10018) opened and closed same day: adds `riscv64` to the GoReleaser config, no source changes. Blocked by maintainer ldez for a tooling reason, not a technical one: "PRs from GitHub organization are a problem for our automation because our bot and us cannot edit the PR." Closed in favor of a resubmission from a personal account. | PR #10018 | chazapis | CARV-ICS-FORTH (org fork) |
| 2023-07-19 | [PR #10026](https://github.com/traefik/traefik/pull/10026) opened and merged same day (merge commit `48de3b02309a8f2227c3fff59d0e5f5f2612a2bc`), milestone v2.10: identical change, resubmitted from chazapis's personal fork. Approved "LGTM" by ldez. Motivation stated in the PR body: enabling Traefik, a default K3s component, to run on RISC-V as part of the broader effort to run K3s on RISC-V. | PR #10026 | chazapis | Personal account |
| 2023-07-24 | v2.10.4 released. Despite the merged config change, the riscv64 binary was missing from the release assets; chazapis flagged this on 2023-07-25 and ldez attributed it to a CI "no space left on device" failure that temporarily dropped riscv64 from the release build. | PR #10026 discussion | ldez (Traefik Labs) | Traefik Labs |
| 2023-10-11 | v2.10.5 released: first release confirmed to contain `traefik_v2.10.5_linux_riscv64.tar.gz`. Directly verified via a live HTTP 200 check against the GitHub release-asset URL; the same check against v2.10.4's equivalent URL returns HTTP 404, corroborating the transient CI gap. | [Release v2.10.5](https://github.com/traefik/traefik/releases/download/v2.10.5/traefik_v2.10.5_linux_riscv64.tar.gz) | - | - |
| 2026-10-01 (current) | v3.7.13 (most recent tag as of this report) ships `traefik_v3.7.13_linux_riscv64.tar.gz`, confirmed via a live HTTP 200 check. riscv64 is a continuously maintained, first-class release target through the present. | [Release v3.7.13](https://github.com/traefik/traefik/releases/download/v3.7.13/traefik_v3.7.13_linux_riscv64.tar.gz) | - | - |

**Status: fully upstream.** riscv64 is in the mainline GoReleaser config and ships in every release since v2.10.5. No out-of-tree patches exist, and no master/tracking issue for the riscv64 port was ever opened - the entire port history consists of these three PRs.

## 3. Upstream Support Tier

No formal tiered platform-support policy exists in `traefik/traefik`. There is no `PLATFORMS.md`, `SUPPORT.md`, `OWNERS`, or `CODEOWNERS` file; `SECURITY.md` covers only supported-version policy, not platform tiers. Support tiers are inferred from CI and release-artifact behavior.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub release binary | Yes | Yes | Yes (since v2.10.5) |
| Official Docker Hub multi-arch image (`traefik/traefik`) | Yes | Yes | No |
| Architecture-specific Docker mirror (`riscv64/traefik`) | N/A | N/A | Yes, actively maintained |
| PR build CI (cross-compile check) | Yes | Yes | Yes |
| Unit tests in CI | Yes | Yes | No |
| Integration tests in CI | Yes | Yes | No |
| Native CI runner | No (x86_64 GitHub-hosted) | No (x86_64, cross-compiled) | No |
| QEMU execution in CI | No | No | No |
| Developer Makefile `cross` targets | Yes | Yes | No |
| OpenBSD release binary | No | No | Yes (`openbsd-riscv64`) |

**Effective tier:** riscv64 behaves as a Tier 2 target - it ships official release binaries and is included in PR cross-compilation checks, but is excluded from the official Docker multi-arch image, unit test execution, integration test execution, and the developer cross-build scripts. amd64 and arm64 are Tier 1 by the same criteria.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Traefik is a pure-Go project (`CGO_ENABLED=0` set everywhere: `Makefile`, `build.yaml`, `release.yaml`, `experimental.yaml`, and `.goreleaser.yml.tmpl`). Direct inspection of the cloned repository (commit `fcbfb8aff229498eddc941ea47f7bd18cbc65078`) confirms zero architecture-specific source code:

- Zero `//go:build`-tagged riscv64/amd64/arm64 Go files outside `vendor/`.
- Zero `.s` assembly files anywhere in the repo.
- Zero `import "C"` (cgo) usage.
- Only five incidental calls to `runtime.GOARCH` in the entire codebase (`cmd/version/version.go`, `internal/release/release.go`, and three Kubernetes-provider client files), all used to build a version string or User-Agent header - none are architecture-conditional logic.

There is therefore no "full/partial/scalar" spectrum to evaluate for Traefik's own code: every supported architecture, including riscv64, gets identical treatment from the same portable Go source tree, cross-compiled per target via `GOOS`/`GOARCH`. This is categorically different from a codec, crypto, or numerical-computing project. The only architecture differentiation visible to a Traefik deployment comes from third-party dependencies (Section 9), not from application code.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Arch-specific source files (Traefik core) | 0 | 0 | 0 | Pure Go, no arch code |
| JIT compilation (Traefik core) | N/A | N/A | N/A | No JIT in Traefik core itself |
| SIMD/vectorization (Traefik core) | N/A | N/A | N/A | No SIMD in Traefik core itself |
| Assembly (Traefik core) | None | None | None | No `.s` files |
| CGo | Disabled | Disabled | Disabled | `CGO_ENABLED=0` forced for all targets |
| wazero (Wasm plugin host, dependency) | JIT compiler | JIT compiler | Interpreter only | No riscv64 JIT backend upstream |
| bytedance/sonic (JSON, dependency) | SIMD-accelerated | SIMD-accelerated | `encoding/json` stdlib fallback | Functional, slower |

## 5. Build System, Cross-Compilation, and Toolchain

**Project type:** Go module (`go.mod`). No CMake, no autoconf, no C toolchain. No `CMakeLists.txt`, `BUILDING.md`, or riscv64 cmake toolchain files exist, and none are applicable - these are C/C++ build-system artifacts and this is a pure-Go project.

**Exact command to build for riscv64:**

```
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build \
  -ldflags "-s -w \
    -X github.com/traefik/traefik/v3/pkg/version.Version=<VERSION> \
    -X github.com/traefik/traefik/v3/pkg/version.Codename=<CODENAME> \
    -X github.com/traefik/traefik/v3/pkg/version.BuildDate=<DATE>" \
  -o ./dist/linux/riscv64/traefik \
  ./cmd/traefik
```

Equivalently via `make binary` with `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0` set in the environment, matching what `.github/workflows/build.yaml` runs in CI.

**Toolchain requirement:** `.go-version` pins Go 1.26. The only reason a specific Go version matters for riscv64 is that `GOARCH=riscv64` support was added to the upstream Go compiler in Go 1.14; any Go toolchain from 1.14 onward can produce a riscv64 binary, and Traefik's pinned 1.26 is far beyond that floor. There is no GCC/Clang minimum version, because `CGO_ENABLED=0` means no C compiler is ever invoked.

**QEMU:** Not used anywhere in the riscv64 build or release pipeline. The single root `Dockerfile` uses Docker buildx's `TARGETPLATFORM` build arg and copies a pre-compiled binary into an Alpine base image - no compilation or emulation happens inside it. `experimental.yaml` does configure QEMU, but only for `linux/amd64` and `linux/arm64` Docker image builds; riscv64 is absent from that workflow's `DOCKER_BUILD_PLATFORMS`.

**Developer cross-build scripts:** `script/crossbinary-default.sh` and the Makefile's default `cross` targets cover only amd64 and arm64. riscv64 is reachable only via the GoReleaser-driven release matrix in CI, or a manual `GOARCH=riscv64` invocation - it is not part of the day-to-day developer cross-build workflow.

**Known build failures:** The v2.10.4 "no space left on device" CI error (Section 2) was a build-infrastructure capacity failure, not a compilation failure, and was resolved by v2.10.5. No compilation-level riscv64 build failures have been found in the project's history.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because Traefik has zero architecture-specific application code, there are no functional gaps at the application layer between riscv64, arm64, and amd64. Every feature (HTTP/3, TLS termination, ACME, middleware, gRPC, WebAssembly plugins, Prometheus metrics, OpenTelemetry tracing) is available on riscv64 through the same Go source tree.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| HTTP/1.1, HTTP/2 routing | Full | Full | Full |
| HTTP/3 (QUIC) | Full | Full | Full |
| TLS termination, ACME | Full | Full | Full (pure-Go crypto path, see below) |
| gRPC proxying | Full | Full | Full |
| WebAssembly middleware | JIT (fast) | JIT (fast) | Interpreter (slow) |
| Prometheus metrics | Full | Full | Full |
| OpenTelemetry tracing | Full | Full | Full, but untested in CI on this architecture |
| Kubernetes Ingress/CRD | Full | Full | Full |
| Docker/Swarm provider | Full | Full | Full |

**Performance gaps (not functional blockers), all inherited from dependencies, not Traefik itself:**

1. **JSON serialization (bytedance/sonic fallback):** amd64 and arm64 use sonic's SIMD-accelerated encoder/decoder; riscv64 transparently falls back to Go's `encoding/json` stdlib. Reported impact is approximately 2-5x slower for JSON-heavy workloads (routing-table serialization, API responses). This is automatic and requires no configuration change.
2. **WebAssembly middleware (wazero interpreter):** wazero's JIT compiler backend supports only amd64 and arm64; riscv64 runs interpreter mode exclusively, with a reported 5-10x performance penalty. This only matters when Wasm middleware plugins are deployed.
3. **TLS and compression throughput:** `golang.org/x/crypto` and `klauspost/compress` include hand-tuned assembly for AES-GCM, ChaCha20, and zstd on amd64/arm64; riscv64 uses pure-Go generic paths. Under high TLS-handshake or high-compression workloads, per-connection CPU cost will be higher. Magnitude is not quantified in any source reviewed.

**Security hardening gaps:** Data not available - no source reviewed addressed stack canaries, CFI, or memory-tagging hardening specifically for Traefik on riscv64.

**Floating-point/NaN semantics:** Not applicable. Traefik's routing logic performs no floating-point arithmetic, and no NaN-handling issue for Traefik on any architecture was found in issue search.

## 7. CI/CD Infrastructure

GitHub Actions is the only CI system in this repository - no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist. A full-repo case-insensitive grep for "riscv" returns exactly three hits (outside an unrelated `webui/yarn.lock` native-binary resolver entry): `.github/workflows/build.yaml`, `.github/workflows/release.yaml`, and `.goreleaser.yml.tmpl`. riscv64 CI is cross-compilation only; no test execution, no native runner, and no QEMU step exist anywhere in the repository's workflow configuration.

- [`build.yaml`](https://github.com/traefik/traefik/blob/main/.github/workflows/build.yaml) (trigger: `pull_request`, all branches, docs-path-filtered): build matrix `include`s `{os: linux, arch: riscv64}`. Runner is `ubuntu-latest` (x86_64). Step runs `GOARCH=${{ matrix.arch }} make binary` - a cross-compile that produces an artifact but never executes it.
- [`release.yaml`](https://github.com/traefik/traefik/blob/main/.github/workflows/release.yaml) (trigger: tag push `v*.*.*`, gated to `github.repository == 'traefik/traefik'`): matrix `os` list includes `linux-riscv64` and `openbsd-riscv64`. Runner is `ubuntu-latest`; build step is `goreleaser/goreleaser-action` driving per-target config generated from [`.goreleaser.yml.tmpl`](https://github.com/traefik/traefik/blob/main/.goreleaser.yml.tmpl), whose `goarch` list includes `riscv64` alongside `amd64`, `386`, `arm`, `arm64`, `ppc64le`, `s390x`.
- `test-unit.yaml` and `test-integration.yaml`: zero riscv64 references, confirmed by direct grep. No unit or integration test for Traefik has ever executed on riscv64 hardware or emulation.
- `experimental.yaml`: configures QEMU, but `DOCKER_BUILD_PLATFORMS` covers only `linux/amd64` and `linux/arm64` - riscv64 is absent even here.
- Every other workflow checked (`codeql.yml`, `validate.yaml`, `check_doc.yaml`, `documentation.yaml`, `sync-docker-images.yaml`, `template-webui.yaml`, `test-gateway-api-conformance*.yaml`, `test-knative-conformance.yaml`, `dispatch.yaml`, `close-org-fork-pr.yaml`) has zero riscv references.

| CI type | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Cross-compilation check (PR) | Yes | Yes | Yes |
| Unit test execution | Yes | Yes | No |
| Integration test execution | Yes | Yes | No |
| Docker image build (official namespace) | Yes | Yes | No |
| Native runner | No | No | No |
| QEMU execution | No | No | No |
| RISE Runners adoption | No | No | No |

**RISE Runners:** Traefik has not adopted the RISE RISC-V GitHub Actions runners (free bare-metal `ubuntu-24.04-riscv` runners, [announced March 2026](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). Neither the announcement post nor the ["six weeks in" follow-up](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) mentions Traefik, and no RISE involvement or funding for Traefik was found anywhere in the RISE blog, member roster, or `riseproject-dev` GitHub organization.

## 8. Distribution and Release Status

**Official GitHub release binaries:** Present in every release since v2.10.5, directly confirmed via live HTTP checks (not scraped metadata) against the download URLs:

| URL tested | Result |
|---|---|
| [`.../releases/download/v2.10.5/traefik_v2.10.5_linux_riscv64.tar.gz`](https://github.com/traefik/traefik/releases/download/v2.10.5/traefik_v2.10.5_linux_riscv64.tar.gz) | HTTP 200 |
| [`.../releases/download/v3.7.13/traefik_v3.7.13_linux_riscv64.tar.gz`](https://github.com/traefik/traefik/releases/download/v3.7.13/traefik_v3.7.13_linux_riscv64.tar.gz) | HTTP 200 |
| `.../releases/download/v2.10.4/traefik_v2.10.4_linux_riscv64.tar.gz` | HTTP 404 |

The v2.10.4 404 corroborates the CI disk-space gap documented in Section 2. Each release ships two riscv64 artifacts: `traefik_<version>_linux_riscv64.tar.gz` and `traefik_<version>_openbsd_riscv64.tar.gz`.

**Docker Hub:** The official `traefik/traefik` namespace lists only `linux/amd64` and `linux/arm64` - riscv64 is not published there. A separate architecture-specific mirror namespace, `riscv64/traefik` (the same pattern Docker uses for `arm64v8/`, `s390x/`, `ppc64le/`), does exist and is actively kept in sync with upstream, with `v3.7.13`/`latest` and `v2.11.57` tags present as of this report. A user who only checks the main `traefik/traefik` Docker Hub page will not find a riscv64 image; it must be pulled from the `riscv64/traefik` namespace instead.

**Distribution packages:**
- Ubuntu 26.04 ("resolute"): directly queried via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=traefik&suite=resolute&searchon=names&section=all) across all architectures including riscv64. No `traefik` binary package exists at all, on any architecture. The only name matches are two unrelated Go library dev packages, `golang-github-traefik-paerser-dev` and `golang-github-traefik-yaegi-dev`, both arch `all`.
- Debian: same result - no `traefik` package exists.
- Arch Linux / Arch Linux RISC-V (archriscv.felixc.at): no `traefik` package found in `[core]`/`[extra]`, and nothing found on the RISC-V port mirror either; inconclusive via the method used [NEEDS VERIFICATION].
- PyPI: a package literally named `traefik` ([pypi.org/project/traefik](https://pypi.org/project/traefik/), v1.1.0) exists but is an unrelated, unaffiliated small Python library - not the Go-based Traefik proxy. Its absence of riscv64 wheels carries no information about the real project.

**What a user must do to get a working riscv64 binary or image:** Download the official tarball from [GitHub Releases](https://github.com/traefik/traefik/releases), or pull the `riscv64/traefik` Docker image. No OS distribution package exists for any architecture. The binary is cross-compiled and has never been exercised by Traefik's own test suite on riscv64.

## 9. Dependencies

| Dependency | Role | Relation / Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|---|
| Go | Compiler toolchain | Build-dependency, critical | N/A | N/A | N/A | riscv64 `GOARCH` support added in Go 1.14; Traefik pins Go 1.26 via `.go-version`, far above that floor. No GCC/Clang needed since `CGO_ENABLED=0`. |
| GoReleaser | Release packaging tool | Build-dependency, optional | N/A | N/A | Drives `linux-riscv64`/`openbsd-riscv64` artifact production | Only the tagged-release pipeline depends on it; PR builds use plain `make binary` / `go build` instead. |
| golang.org/x/sys | Low-level syscalls | Runtime-dependency, critical | Builds | No riscv64-specific issues found | Ships in binary | Bumped in [PR #5245](https://github.com/traefik/traefik/pull/5245) (2019) specifically to enable riscv64 compilation; this was the first enabling step in Traefik's riscv64 history, four years before an actual release binary existed. |
| golang.org/x/crypto | TLS, ACME, certificate handling | Runtime-dependency, critical | Builds (pure-Go generic path) | No riscv64-specific issues found | Ships in binary | Hand-tuned assembly for AES-GCM/ChaCha20-Poly1305 exists only for amd64 (AES-NI) and arm64 (ARMv8 crypto extensions); riscv64 uses the generic Go implementation. Performance-only gap, not a correctness issue; no RVV-optimized path exists yet. |
| bytedance/sonic | SIMD-accelerated JSON | Runtime-dependency, optional | Builds (stdlib `encoding/json` fallback) | Functional via fallback | Ships in binary | Detects CPU architecture at runtime and falls back transparently on riscv64 (no SIMD support there). Reported 2-5x throughput gap vs amd64/arm64 for JSON-heavy paths. |
| Wazero | WebAssembly runtime (plugin host) | Runtime-dependency, optional | Builds (interpreter only) | Interpreter-only on riscv64 | Ships in binary | JIT compiler backend exists only for amd64 and arm64. riscv64 always runs the interpreter, with a reported 5-10x performance penalty for Wasm middleware. No riscv64 JIT work is known to be planned upstream. |
| klauspost/compress | zstd, gzip, snappy, deflate | Runtime-dependency, optional | Builds (pure-Go fallback) | No riscv64-specific issues found | Ships in binary | Assembly-accelerated paths exist for amd64/arm64 only; riscv64 uses the pure-Go path. |
| andybalholm/brotli | Brotli compression | Runtime-dependency, optional | Builds (pure Go) | No riscv64-specific issues found | Ships in binary | No architecture-specific code at all; no gap. |
| tjfoc/gmsm | GM cryptography (SM2/SM3/SM4) | Runtime-dependency, optional | Builds (pure Go, no assembly) | No riscv64-specific issues found | Ships in binary | No architecture-specific code; no gap. |
| ebitengine/purego | CGo-free native library loading | Runtime-dependency, optional | Builds | riscv64 support present | Ships in binary | A riscv64 callee-saved register handling fix is reported to have merged upstream [NEEDS VERIFICATION - single source]. |

**Deep dive - wazero:** wazero is the WebAssembly runtime backing Traefik's middleware plugin system. Its compiler (JIT) backend generates native machine code and is implemented only for amd64 and arm64; on riscv64 it unconditionally falls back to the interpreter backend. The interpreter is correct and maintained, but carries a substantial (reported 5-10x) performance penalty versus JIT for compute-intensive Wasm operations. This is an architectural constraint in wazero itself, not a Traefik-level defect, and a riscv64 JIT backend would be a multi-month wazero-level investment with no indication it is currently planned.

**Deep dive - bytedance/sonic:** sonic provides SIMD-accelerated JSON encoding/decoding and detects CPU architecture at runtime, falling back to `encoding/json` on unsupported architectures including riscv64. The fallback requires no configuration and produces no errors; the cost is a 2-5x throughput reduction on API-response and routing-table serialization paths, which matters most for deployments where Traefik itself (not the backend) is the bottleneck at high request rates.

**Deep dive - golang.org/x/crypto:** Hand-tuned assembly for AES-GCM and ChaCha20-Poly1305 exists for amd64 (AES-NI) and arm64 (ARMv8 crypto extensions); riscv64 uses the pure-Go generic implementation. Since Traefik terminates TLS at scale, this raises per-connection cryptographic cost on riscv64. The gap will close only if Go's crypto packages or `x/crypto` add RVV-optimized paths; no such work was found in progress in any source reviewed.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #5245](https://github.com/traefik/traefik/pull/5245) | Bump x/sys to support Risc-V architecture | Merged 2019-08-23 | N/A | Prerequisite enabling step; no binary produced at that point. |
| [Issue #5470](https://github.com/traefik/traefik/issues/5470) | High CPU usage when accessing dashboard after v2.0.0-rc3 on Risc-V | Closed (frozen-due-to-age) 2019-11-18 | P1-confirmed | 100% CPU spin and repeated HTTP 502s on riscv64 under Kubernetes 1.16. Self-resolved by the v2.1-rc master build as a side effect of architecture-agnostic router fixes; no targeted riscv64 fix was committed. This is the only architecture-specific RISC-V bug found in the repository's entire history. |
| [PR #10018](https://github.com/traefik/traefik/pull/10018) | Add support for RISC-V (superseded) | Closed without merge 2023-07-19 | N/A | Blocked purely by org-fork automation tooling, not a technical objection. Replaced by #10026. |
| [PR #10026](https://github.com/traefik/traefik/pull/10026) | Add support for RISC-V | Merged 2023-07-19, milestone v2.10 | N/A | GoReleaser config addition only, no source changes. |
| (no issue number) | riscv64 binary absent from v2.10.4 release | Resolved by v2.10.5 | Low | CI "no space left on device" error forced temporary removal; independently corroborated by a live HTTP 404 on the v2.10.4 riscv64 asset URL versus HTTP 200 on v2.10.5 and v3.7.13. |

**Currently open riscv64 correctness or performance bugs in `traefik/traefik`:** None. GitHub issue search for "riscv", "riscv64", and "RISC-V" against the repository returns zero open results; commit search for the same terms returns zero results (the relevant changes landed entirely via the three PRs above). A tangential search for a "riscv NaN/floating-point" correctness issue found nothing for Traefik on any architecture - only unrelated ISA/toolchain NaN-handling discussions in other repositories (e.g. `riscv-isa-manual`, `llvm-project`).

**Correctness risk note:** Issue #5470 was closed without a formal, isolated root-cause fix and was attributed to an indirect resolution via unrelated router fixes (#5588, #5696). If a similar middleware re-evaluation regression were reintroduced in the v3.x router, it could recur on any architecture - this is not riscv64-specific, and no evidence of recurrence exists.

## 12. Objections and Upstream Blockers

**No stated technical objections:** Both riscv64 PRs (#5245, #10026) were merged same-day without pushback from any maintainer.

**Process constraint (resolved):** PR #10018 was closed solely because it was submitted from a GitHub organization account, which breaks the maintainer automation bot's ability to edit the branch. This was resolved by resubmitting from a personal fork as #10026, which merged the same day.

**Technical blockers:** None. Because Traefik is pure Go with `CGO_ENABLED=0`, any `GOARCH` supported by the upstream Go toolchain can be added to the GoReleaser config with zero source changes. riscv64 has been supported by Go since 1.14.

**Docker image gap:** The official multi-arch Docker build (`experimental.yaml`) does not include `linux/riscv64` in `DOCKER_BUILD_PLATFORMS`, even though the separate `riscv64/traefik` mirror namespace exists. Given the project's same-day-merge pattern for small infrastructure PRs, adding this is low-risk.

**Test gap:** No mechanism exists for riscv64 test execution today. RISE Runners would provide free bare-metal riscv64 GitHub Actions runners requiring only a runner-label change in `test-unit.yaml`/`test-integration.yaml`, with no source modifications. Traefik has not adopted this as of the most recent RISE Runners status report (May 2026).

**No open PRs or issues would currently change the grade.** The one historical riscv64 bug (#5470) was closed in 2019 and is unrelated to the present CI gap.

## 13. Readiness Assessment

**Color:** yellow (build-only-ci)
**Release provider:** upstream

**Justification:** Upstream CI cross-compiles riscv64 ([`build.yaml`](https://github.com/traefik/traefik/blob/main/.github/workflows/build.yaml) on every PR; [`release.yaml`](https://github.com/traefik/traefik/blob/main/.github/workflows/release.yaml) plus [`.goreleaser.yml.tmpl`](https://github.com/traefik/traefik/blob/main/.goreleaser.yml.tmpl) for tagged releases) but never runs the test suite on riscv64 - `test-unit.yaml` and `test-integration.yaml` have zero riscv64 references, and no riscv64 runner or QEMU execution step exists anywhere in CI. Upstream does publish riscv64 release binaries directly, confirmed via live HTTP 200 checks on `v3.7.13` and `v2.10.5` release assets, with riscv64 binaries available since v2.10.5 after [PR #10026](https://github.com/traefik/traefik/pull/10026), so release_provider is upstream - but per the CI-evidence rule, build-only CI (no test execution) caps the color at yellow regardless of release availability. Traefik is a pure-Go reverse proxy with `CGO_ENABLED=0` and zero architecture-specific source code, so the optimization-purpose modifier does not apply (it is infrastructure software, not a speed-differentiated library such as a SIMD/crypto/allocator project).

**Pending work that could change the grade:** No open PRs or issues would change the grade; the one historical riscv64 bug (#5470) was closed in 2019 and is unrelated to the current CI gap. The highest-leverage improvement is adopting RISE RISC-V Runners to add native riscv64 test execution to `test-unit.yaml`/`test-integration.yaml`, which Traefik has not done as of the May 2026 RISE Runners adoption report. No RISE involvement, funding, or blog coverage of Traefik was found.

## 14. Investment Analysis

RISE has not done, and has not funded, any work on Traefik for riscv64. The existing binary support (PR #10026) was contributed by an external developer (CARV-ICS-FORTH-affiliated chazapis) as a byproduct of K3s-on-RISC-V work, entirely independent of RISE. No RISE blog posts, member records, or runner-adoption reports mention Traefik.

### 14.1 Functional Enablement

The binary compiles, runs, and ships for riscv64 today. No functional work is required. The remaining gap is packaging: the official Docker multi-arch image does not include riscv64 (only the separate `riscv64/traefik` mirror namespace does), which is a single-line CI change (`DOCKER_BUILD_PLATFORMS`).

### 14.2 Performance Optimization

Three dependencies carry architectural performance gaps on riscv64, none of which require changes to Traefik itself:

1. **wazero interpreter-only:** A riscv64 JIT backend would benefit all wazero users, not just Traefik. This is a significant, multi-month, wazero-level investment, relevant only to deployments using Wasm middleware plugins.
2. **bytedance/sonic fallback:** A riscv64 SIMD (RVV) path in sonic, or a Traefik-side swap to a JSON library with better riscv64 performance, would close the reported 2-5x gap. Sonic-level or Traefik-level investment, respectively.
3. **golang.org/x/crypto generic paths:** RVV-optimized AES-GCM and ChaCha20 in `x/crypto` would benefit the entire Go ecosystem on riscv64, not Traefik specifically. This is a Go ecosystem investment.

### 14.3 CI/CD Infrastructure

The highest-leverage investment is adopting RISE Runners to add native riscv64 test execution:
- Add `runs-on: ubuntu-24.04-riscv` (or the current RISE Runner label) to `test-unit.yaml` and/or `test-integration.yaml`.
- Register `traefik/traefik` with the RISE Runners program.

This would surface regressions before they ship in release binaries; today a riscv64 correctness regression is invisible until a user reports it, as illustrated by the frozen Issue #5470 and the v2.10.4 CI capacity incident. Adding riscv64 to the official Docker multi-arch build is a separate, much smaller one-line change to `experimental.yaml`.

### 14.4 Ecosystem Enablement

Not applicable. Traefik is a standalone Go binary with no dependent package ecosystem (no npm, PyPI, Maven, or Kubernetes-operator layer built on top of it) that would require separate riscv64 enablement work.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add RISE Runner riscv64 jobs to `test-unit.yaml` and `test-integration.yaml` | 0.5 | Traefik Labs or external contributor | High |
| CI/CD | Add `linux/riscv64` to the official Docker multi-arch build (`DOCKER_BUILD_PLATFORMS` in `experimental.yaml`) | 0.1 | Traefik Labs or external contributor | Medium |
| Performance | RVV-optimized AES-GCM / ChaCha20 in `golang.org/x/crypto` | 8-16 | Go core team (ecosystem-wide benefit) | Medium |
| Performance | riscv64 JIT backend in `tetratelabs/wazero` | 20-40 | wazero maintainers (ecosystem-wide benefit) | Low (Wasm plugins are optional) |
| Performance | riscv64 SIMD JSON in `bytedance/sonic`, or a Traefik-side JSON library swap | 4-8 | sonic maintainers or Traefik contributor | Low (2-5x gap is not blocking) |
| Functional | None - binary is fully functional on riscv64 | 0 | - | N/A |

## 15. References

- [traefik/traefik repository](https://github.com/traefik/traefik)
- [Traefik homepage](https://traefik.io/)
- [PR #5245: Bump x/sys to support Risc-V architecture](https://github.com/traefik/traefik/pull/5245)
- [Issue #5470: High CPU usage when accessing dashboard after v2.0.0-rc3 on Risc-V architecture](https://github.com/traefik/traefik/issues/5470)
- [PR #10018: Add support for RISC-V (superseded)](https://github.com/traefik/traefik/pull/10018)
- [PR #10026: Add support for RISC-V (merged)](https://github.com/traefik/traefik/pull/10026)
- [GitHub CI build.yaml](https://github.com/traefik/traefik/blob/main/.github/workflows/build.yaml)
- [GitHub CI release.yaml](https://github.com/traefik/traefik/blob/main/.github/workflows/release.yaml)
- [.goreleaser.yml.tmpl](https://github.com/traefik/traefik/blob/main/.goreleaser.yml.tmpl)
- [Traefik maintainers document](https://github.com/traefik/traefik/blob/main/docs/content/contributing/maintainers.md)
- [Traefik GitHub Releases](https://github.com/traefik/traefik/releases)
- [v2.10.5 riscv64 release asset (HTTP 200 verified)](https://github.com/traefik/traefik/releases/download/v2.10.5/traefik_v2.10.5_linux_riscv64.tar.gz)
- [v3.7.13 riscv64 release asset (HTTP 200 verified)](https://github.com/traefik/traefik/releases/download/v3.7.13/traefik_v3.7.13_linux_riscv64.tar.gz)
- [Ubuntu 26.04 "resolute" package search for traefik](https://packages.ubuntu.com/search?keywords=traefik&suite=resolute&searchon=names&section=all)
- [PyPI traefik package (unrelated namesquat)](https://pypi.org/project/traefik/)
- [carlosedp riscv-bringup project](https://github.com/carlosedp/riscv-bringup)
- [golang/go issue #27532 (riscv64 Go toolchain support)](https://github.com/golang/go/issues/27532)
- [RISE Project: Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project: RISE RISC-V Runners, Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project: Advancing Go on RISC-V](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [RISE Project blog](https://riseproject.dev/blog/)