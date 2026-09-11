---
title: Hubble
parent: Project Reports
color: orange
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: Cilium
    relation: runtime-dependency
    criticality: critical
  - name: Kubernetes
    relation: test-dependency
    criticality: optional
  - name: Helm
    relation: test-dependency
    criticality: optional
---

# Hubble

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Hubble<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="hubble" %}

## 1. Project Overview

Hubble is a Go-based CLI and gRPC observer/relay tool that provides network flow visibility, service-map, and metrics observability for the [Cilium](https://github.com/cilium/cilium) eBPF-based Kubernetes networking/security stack. It is not a standalone system; it observes and queries the Cilium agent's eBPF datapath and, for L7 (HTTP/gRPC/Kafka/DNS) visibility, the `cilium-envoy` proxy.

Hubble is a component of Cilium, a CNCF project accepted as Incubating 2021-10-13 and **graduated** 2023-10-11. License is Apache 2.0. Governance is not documented at the `cilium/hubble` repo level (no `MAINTAINERS.md`, no separate governance doc); repository ownership is set via `CODEOWNERS`, defaulting to `@cilium/sig-hubble` and deferring to `cilium/cilium`'s flat, single-tier committer model (no maintainer-vs-committer split; roughly 54 listed committers, 16 emeritus).

Corporate affiliation of the parent project's committer roster: Isovalent (47 of ~54, now Cisco-affiliated following the 2024 acquisition), Google (2), Datadog (2), Microsoft (1), AMD (1), Ledger (1), Hedgehog (1), Palantir (1).

No project-specific "community stance on new ports" thread exists for `cilium/hubble` (zero issues/PRs/commits mention RISC-V in that repo). At the parent Cilium level, the closest thing to a stated culture is a maintainer's reply to a riscv64 image request: "maintaining builds for another architecture is non-trivial effort. I would suggest demonstrating that there is a need for such builds, and then stepping up to contribute the necessary changes" ([julianwiedmann on cilium/cilium#37869](https://github.com/cilium/cilium/issues/37869)) -- a "prove demand, then contribute" posture rather than a committed roadmap item.

## 2. Port History and Upstreaming Timeline

No riscv64 port has ever landed, in either `cilium/hubble` or its parent `cilium/cilium`. All activity below is in `cilium/cilium` (Hubble's own repository has zero riscv64 issues, PRs, commits, or code references).

| Date | Event | Source |
|---|---|---|
| 2023-03-17 | `cilium/cilium` issue #24434 "CFP: Support linux/riscv64" filed by ernado, listing three upstream blockers (etcd, distroless, protobuf riscv64 support) | [cilium/cilium#24434](https://github.com/cilium/cilium/issues/24434) |
| 2023-03-17 | Draft PR #24436 "feat: riscv64" opened by ernado; touches `images/hubble-relay/Dockerfile` and `images/cilium/download-hubble.sh` directly, plus CI workflow files and other Dockerfiles | [cilium/cilium#24436](https://github.com/cilium/cilium/pull/24436) |
| 2023-06-11 | #24434 marked stale by bot, closed same day by author "until dependencies are ready" | [cilium/cilium#24434](https://github.com/cilium/cilium/issues/24434) |
| 2023-04-18 | PR #24436 marked stale and auto-closed, unmerged; DCO sign-off failure on one commit was never resolved | [cilium/cilium#24436](https://github.com/cilium/cilium/pull/24436) |
| 2025-02-26 | Issue #37869 "Please provide Cilium images for the riscv64 architecture" filed by liuyixian123; still open | [cilium/cilium#37869](https://github.com/cilium/cilium/issues/37869) |
| 2025-03-03 | Maintainer julianwiedmann responds with "prove demand, then contribute" posture | [cilium/cilium#37869](https://github.com/cilium/cilium/issues/37869) |
| 2025-06-10 | Issue #39977 "CFP: Adding RISC-V as a supported architecture" filed by z1006409356, claiming initial base-image builds and functional testing already done | [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977) |
| 2025-06-17 | Duplicate issue #40076 filed by karry-yky, closed same day, folded into #39977 | [cilium/cilium#40076](https://github.com/cilium/cilium/issues/40076) |
| 2025-09-04 | #39977 auto-closed as stale/not-planned by bot | [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977) |
| 2026-07-09 | luhenry (RISE-affiliated) comments on #39977 that RISE offers RISC-V GitHub Actions runners and that a RISE-CNCF collaboration on this is ongoing | [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977) |
| 2026-07-22 | xypron asks maintainer tklauser to reopen #39977 | [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977) |
| 2026-07-23 | Issue #47451 "CFP/POC: linux/riscv64 support" filed by rastaman, documenting a single-board (Orange Pi RV2 / SpacemiT Ky X1) proof-of-concept with L3/L4 connectivity working, but explicitly excluding `cilium-envoy`/`cilium/proxy` and Hubble L7 metrics validation; closed by the author ~24 minutes after filing | [cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451) |
| 2026-08-18 | Maintainer tklauser reopens and pins #39977 | [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977) |

**Key contributors:** ernado (2023 original CFP + draft PR, organizational affiliation not established [NEEDS VERIFICATION]), z1006409356 (2025 CFP, org not established), rastaman (2026 single-board community POC, org not established), luhenry (RISE / Linux Foundation liaison proposing CI runners for a RISE-CNCF collaboration), tklauser (Cilium/Isovalent maintainer, gatekeeper of the tracking issue's open/closed state).

**Is it fully upstream?** No. Nothing has merged. The only implementation attempt (PR #24436) was never merged and went stale in 2023. As of this report's research date, riscv64 support exists only as an unmerged, single-board community reproduction recipe, not as code in any branch of `cilium/cilium` or `cilium/hubble`.

## 3. Upstream Support Tier

No formal platform-tier policy document exists for either repository: `cilium/hubble` has no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file (all such candidate paths returned 404 on direct fetch). Support tiering is de facto, defined by what the build system and CI target.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Built by CI | yes | yes | no |
| Tests run in CI | yes | yes | no |
| Release-blocking | yes (all 3 workflows run on every push/PR/tag) | yes | no CI exists at all |
| Official binaries published | yes | yes | no |

Source: direct read of [`.github/workflows/tests.yml`](https://github.com/cilium/hubble/blob/main/.github/workflows/tests.yml), [`.github/workflows/integration-tests.yaml`](https://github.com/cilium/hubble/blob/main/.github/workflows/integration-tests.yaml), and [`.github/workflows/release.yml`](https://github.com/cilium/hubble/blob/main/.github/workflows/release.yml) from a clone at HEAD `32b30e0`, plus the `Makefile`'s `local-release` target.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Hubble itself is a pure-Go CLI/gRPC client and server with **no CGO, no hand-written assembly, and no SIMD intrinsics of its own**. A repo-wide search for arch-suffixed files (`*_amd64.go`, `*_arm64.go`, `*_riscv64.go`) and `#ifdef __riscv`-style build tags outside `vendor/` returned zero matches. There is no JIT, no crypto kernel, no GC barrier code that Hubble itself authors or maintains. The only riscv64-related source anywhere in the repository lives in vendored third-party Go dependencies (`golang.org/x/sys/unix`, `github.com/prometheus/procfs`, `github.com/pelletier/go-toml`), which are auto-generated Go-toolchain syscall/type bindings shipped for every supported `GOOS/GOARCH` pair regardless of whether Hubble releases riscv64 binaries.

The architecture-sensitive risk for Hubble is therefore entirely inherited from what it depends on at runtime:

| Component | Role | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Hubble's own code (CLI, gRPC observer/relay) | flow query/display logic | full (pure Go) | full (pure Go) | full in principle (pure Go, GOARCH-portable) but never built/released |
| Linux kernel eBPF JIT | executes the BPF programs Cilium loads | full, mature | full, mature | native JIT merged Linux 5.7+, mature, but requires specific Kconfig (`CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS`, BTF) not enabled on every riscv64 SoC/board |
| `cilium/ebpf` (BPF loader, BTF/CO-RE) | loads/manages BPF programs Hubble reads from | full, CI-covered | full, CI-covered | builds (pure Go) but riscv64 not in CI matrix; project self-describes non-amd64/arm64 archs as "best effort" per [cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451) |
| `cilium/proxy` (Envoy fork, "cilium-envoy") | powers Hubble's L7 (HTTP/gRPC/Kafka/DNS) visibility | full, official image | full, official image | **no riscv64 build at all**; explicitly named as untested/out-of-scope in [cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451): "no upstream riscv64 proxy image... Hubble L7 metrics validation on riscv64" not done |

Bottom line: Hubble has nothing of its own to port. The actual gap is entirely downstream in Cilium's eBPF loader (untested on riscv64) and, more severely, in Envoy (no riscv64 support at all), which directly disables a headline Hubble feature (L7 flow visibility) even in a hypothetical world where Hubble itself shipped riscv64 binaries.

## 5. Build System, Cross-Compilation, and Toolchain

Hubble builds with a plain Go `Makefile`, not CMake. There is no `CMakeLists.txt`, no `cmake/` directory, and no Dockerfile currently present in the repository tree (`git ls-files | grep -i docker` matches only vendored third-party Dockerfiles).

Build command: `CGO_ENABLED=0 go build` (via `make hubble`). Cross-compilation uses native Go `GOOS`/`GOARCH` environment variables, not a toolchain file. The `local-release` target's architecture list is hardcoded per OS:

```
darwin: amd64 arm64
linux:  amd64 arm64
windows: amd64 arm64
```

`riscv64` is not a value anywhere in this loop. `go.mod` declares `go 1.25.0` with `toolchain go1.27.1`. Go's `linux/riscv64` port has been stable since Go 1.14 (2020), so the declared toolchain versions fully support riscv64 as a `GOARCH` target -- this is inherent to the Go toolchain, not something Hubble's build system configures, tests, or documents.

No QEMU usage exists anywhere in the repository (no workflow, Makefile, or doc references `qemu`). No riscv64 build has ever been attempted in CI, so there is no documented build failure to report -- the gap is untested absence, not confirmed breakage. The de facto command that would be needed, inferred by extension of the existing cross-compile pattern (not a command that exists in the repo today):

```
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build -o hubble .
```

Source: `Makefile` and `.github/workflows/*` from clone HEAD `32b30e0`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `hubble` CLI binary available (any channel) | yes (official release) | yes (official release) | no |
| Hubble Observer/Relay gRPC API functional | yes | yes | no official binary to run it on |
| L3/L4 flow visibility (depends on Cilium agent) | yes | yes | blocked upstream at the Cilium-agent level (no official riscv64 Cilium image; only a single-board community POC exists) |
| L7 flow visibility (depends on cilium-envoy) | yes | yes | blocked entirely: no riscv64 Envoy build exists upstream at all |
| Deployment via Kubernetes DaemonSet (standard install path) | yes | yes | no realistic path -- see Section 9, Kubernetes riscv64 is Tier-3/unofficial |

**Functional gap:** total. There is no official riscv64 Hubble binary through any channel, so the functional gap is 100% at the distribution level, independent of what would technically build from source.

**Performance gap:** Data not available: no riscv64 benchmark of Hubble exists in any searched source (GitHub issues, web search, RISE blog). No numeric performance comparison can be reported.

**Security hardening gap:** Data not available: no riscv64-specific security hardening assessment (e.g. BTI/PAC-equivalent, stack-clash protection) was found for Hubble or its immediate dependencies in the research performed.

**NaN / floating-point semantics:** Not applicable. Hubble contains no numeric/floating-point-sensitive code; a targeted search for `riscv nan floating` in `cilium/hubble` returned zero results.

## 7. CI/CD Infrastructure

No riscv64 CI exists for `cilium/hubble`. Confirmed by direct reading of all three workflow files at HEAD `32b30e0`:

- [`.github/workflows/tests.yml`](https://github.com/cilium/hubble/blob/main/.github/workflows/tests.yml) -- unit tests, single job on `ubuntu-24.04`, no matrix, zero `riscv` matches.
- [`.github/workflows/integration-tests.yaml`](https://github.com/cilium/hubble/blob/main/.github/workflows/integration-tests.yaml) -- builds the CLI, stands up a `kind` cluster, deploys Cilium via Helm, runs `hubble observe`/`hubble status` against it; single job on `ubuntu-24.04`, zero `riscv` matches.
- [`.github/workflows/release.yml`](https://github.com/cilium/hubble/blob/main/.github/workflows/release.yml) -- runs `make release`, single job on `ubuntu-24.04`, zero `riscv` matches.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. No QEMU or cross-arch emulation action (`docker/setup-qemu-action` or equivalent) is referenced anywhere. No `strategy.matrix` of any kind is used in any of the three workflows.

**RISE runners:** not wired into `cilium/hubble` or `cilium/cilium` CI today. RISE (Linux Foundation) RISC-V GitHub Actions runners were proposed as the concrete unblocking mechanism by luhenry in [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977) ("There is also an ongoing collaboration between RISE and CNCF for usage of these RISC-V Runners in more CNCF projects"), but as of the research date no implementation exists in either repository's workflow files.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | yes (native GitHub-hosted runner) | yes (cross-compiled in release job) | no |
| Tests executed | yes | yes | no |
| Hardware/emulation | native x86_64 GitHub-hosted runners | Go native cross-compile (no ARM runner needed) | none; RISE runners proposed but not integrated |

## 8. Distribution and Release Status

No riscv64 binary or package exists for Hubble on any channel checked:

- **GitHub Releases** ([cilium/hubble/releases](https://github.com/cilium/hubble/releases)): latest releases (v1.19.4, v1.19.3, v1.18.6, v1.18.5, v1.18.3) each publish exactly `hubble-darwin-amd64.tar.gz`, `hubble-darwin-arm64.tar.gz`, `hubble-linux-amd64.tar.gz`, `hubble-linux-arm64.tar.gz`, `hubble-windows-amd64.tar.gz` (plus checksums and source archives). No riscv64 asset in any release.
- **PyPI** ([pypi.org/pypi/hubble/json](https://pypi.org/pypi/hubble/json)): the package named `hubble` on PyPI is an unrelated, unmaintained (last updated 2016) Python 2 OpenStack env-var tool, not Cilium Hubble. It ships a single pure-Python wheel (`hubble-1.1.6-py2-none-any.whl`); not relevant to this project either way.
- **RISE wheel builder** (`gitlab.com` RISE PyPI proxy for `hubble`): redirects to upstream PyPI; same unrelated package, no riscv64 relevance.
- **Ubuntu 26.04 (resolute)** ([packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Hubble&suite=resolute&searchon=names&section=all)): no package named `hubble`, `python3-hubble`, or `libhubble` exists in the archive at all, on any architecture.
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=hubble)): no package named `hubble` listed.
- **OCI images** (`hubble-relay`): no riscv64 platform tag found; the only implementation attempt touching `images/hubble-relay/Dockerfile` (PR #24436) never merged.

**What a user must do today to get a working riscv64 Hubble binary:** build from source manually via the unofficial `GOOS=linux GOARCH=riscv64 go build` command described in Section 5. There is no verified, published recipe for doing this successfully; the closest available evidence is Cilium's own single-board community POC ([cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451)), which explicitly did not validate Hubble or its L7 features.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| Go | build-dependency, critical | full -- native `linux/riscv64` GOARCH support since Go 1.14 (2020) | full -- covered by Go's own riscv64 test matrix | full -- Go toolchain itself ships for riscv64 | Solved layer; `go.mod` pins `go 1.25.0`, `toolchain go1.27.1`, both well past riscv64 GA |
| Cilium | runtime-dependency, critical | community POC only (single board, Orange Pi RV2/SpacemiT Ky X1, not CI) -- [cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451) | manually validated on one board only, no automated/CI test | no official riscv64 images | Open pinned CFP [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977); open request [cilium/cilium#37869](https://github.com/cilium/cilium/issues/37869); requires kernel `CONFIG_DEBUG_INFO_BTF`, `CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS`, `CONFIG_NETFILTER_XT_TARGET_CT`; no riscv64 CI runner exists |
| Kubernetes | test-dependency, optional (used to run Hubble's integration-test suite via `kind`, and is the standard deployment target for both Cilium and Hubble) | Data not available: no direct riscv64 build verification for Kubernetes performed in this research; distribution assessed as unofficial | N/A | no official riscv64 release artifacts | [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) "Proposal: Official Support for RISC-V Architecture" -- open, Tier-3 tracking |
| Helm | test-dependency, optional (used in `integration-tests.yaml` to deploy Cilium into the `kind` cluster that Hubble's CLI is then tested against) | Data not available: no riscv64-specific research was performed on Helm; its only role found is as a CI tool invoked on the `ubuntu-24.04` x86_64 runner in `integration-tests.yaml` | Data not available | Data not available | No riscv64 issues/PRs surfaced for Helm in this research; not a runtime dependency of shipped Hubble binaries |
| `cilium/ebpf` (v0.20.1, indirect via Cilium) | BPF program loader / BTF-CO-RE used by the Cilium agent Hubble observes | builds (pure Go); riscv64 not in CI matrix | none; project self-describes non-amd64/arm64 as "best effort" | ships via `go.mod` only, no standalone per-arch release | No riscv64-specific issues filed; risk is untested, not confirmed broken |
| `cilium/proxy` (Envoy fork, indirect via Cilium) | Powers Hubble's L7 (HTTP/gRPC/Kafka/DNS) visibility | no riscv64 build | not tested | no riscv64 image published | Explicitly named as out-of-scope/unsolved in [cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451); upstream `envoyproxy/envoy` search returned zero riscv64 issues/PRs |
| Linux kernel riscv64 BPF JIT (indirect, executes what Cilium loads) | Native JIT execution of eBPF programs | mature, merged Linux 5.7+ | covered by upstream kernel selftests | N/A (kernel feature) | Requires specific Kconfig not enabled on every riscv64 SoC/board; cause of misaligned-packet-access failures noted in [cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451) |
| `cloudflare/cfssl` (v1.6.5, indirect via Cilium) | PKI/cert tooling for mTLS cert generation | builds (pure Go) | not separately verified | riscv64 release artifacts added | [cloudflare/cfssl#1386](https://github.com/cloudflare/cfssl/issues/1386) "Introduce riscv64 architecture" -- closed/resolved, no open blockers |
| `vishvananda/netlink`/`netns` (indirect via Cilium) | Linux netlink syscalls for routing/link state | builds (pure Go, generic Linux syscalls) | no riscv64-specific issues found | ships via Go module only | No riscv64 issues filed |
| `google.golang.org/grpc` + `google.golang.org/protobuf` (indirect) | Hubble Observer/Relay gRPC streaming API | builds (pure Go) | no riscv64-specific issues surfaced | ships via Go module only | Covered by Go's native riscv64 support |
| `go.etcd.io/etcd` client v3 (indirect via Cilium) | Optional kvstore client for Cilium's state store | builds (pure Go client) | client usage lower-risk; full etcd server (bbolt mmap) is the more arch-sensitive piece, not exercised by the Hubble binary itself | server-side riscv64 release maturity weaker | [etcd-io/etcd#15490](https://github.com/etcd-io/etcd/issues/15490) "feat: add riscv64 support" cited as a historical blocker in [cilium/cilium#24434](https://github.com/cilium/cilium/issues/24434) |
| `golang.org/x/sys` (indirect) | Arch-specific syscall constants/bindings | native riscv64 support in Go toolchain since Go 1.14 | covered by Go's own riscv64 test matrix | ships via Go module only | Solved layer |

Note on the direct-dependency list as given (Go, Cilium, Kubernetes, Helm): all four appear above using the exact names specified. Additional indirect dependencies surfaced by research (`cilium/ebpf`, `cilium/proxy`, the Linux kernel riscv64 BPF JIT, `cloudflare/cfssl`, `vishvananda/netlink`, gRPC/protobuf, etcd, `golang.org/x/sys`) are included for completeness because they materially determine whether Hubble's runtime dependency (Cilium) is functional on riscv64.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| -- | -- | -- | -- | No open riscv64-related bug or issue exists in `cilium/hubble`. A semantic-search false positive, [cilium/hubble#29](https://github.com/cilium/hubble/issues/29) ("hubble pods get FailedCreatePodSandBox event"), matched loosely on "performance"/"bug" query terms but is an unrelated, already-closed 2019-2020 amd64 Kubernetes networking issue with zero RISC-V content. |

No correctness bugs, no performance regressions, and no NaN/floating-point issues referencing RISC-V exist for Hubble in any searched channel (GitHub issues/PRs/commits/code search, web search, RISE blog).

## 12. Objections and Upstream Blockers

**Stated objections:**
- Maintainer julianwiedmann on [cilium/cilium#37869](https://github.com/cilium/cilium/issues/37869): "maintaining builds for another architecture is non-trivial effort. I would suggest demonstrating that there is a need for such builds, and then stepping up to contribute the necessary changes" -- a demand-and-contribution gate, not a commitment.
- Original 2023 CFP [cilium/cilium#24434](https://github.com/cilium/cilium/issues/24434) was closed by its own author "until dependencies are ready" (etcd, distroless, protobuf riscv64 support -- all since resolved individually, per [cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451)).

**Technical blockers:**
- No riscv64 CI/test signal exists upstream at all -- stated explicitly as the main gating item in [cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451): "No riscv64 CI in the project today... A test signal (real board or QEMU) is the main gating item."
- `cilium/proxy`/Envoy has zero riscv64 support upstream, which directly blocks Hubble's L7 observability feature regardless of any other progress.
- Kernel Kconfig prerequisites (`CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS`, `CONFIG_DEBUG_INFO_BTF`) are not enabled on every riscv64 SoC/board, causing datapath failures on some hardware even when Cilium itself builds.
- Kubernetes itself is Tier-3 for riscv64 ([kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836), open), removing the realistic deployment target Hubble is normally run against (a K8s DaemonSet).

**Organizational blockers:**
- PR #24436, the only implementation attempt, stalled on an unresolved DCO sign-off failure in addition to the dependency blockers, then went stale and was auto-closed.
- Issue #39977 (the current live tracking issue) was itself auto-closed as stale once (2025-09-04) before being manually reopened and pinned by maintainer tklauser (2026-08-18) following a direct request from a community member (xypron).

**Potential unblock / pending work:**
- luhenry (RISE-affiliated) flagged in [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977) that RISE provides free RISC-V GitHub Actions runners and that "there is also an ongoing collaboration between RISE and CNCF for usage of these RISC-V Runners in more CNCF projects" -- this is the concrete path to closing the CI gap, but as of the research date it has not been implemented in either `cilium/cilium` or `cilium/hubble` workflow files.
- #39977 remains open and pinned as of 2026-08-18, indicating active maintainer engagement rather than dismissal.

**Acceptance probability:** Not high in the near term absent the RISE-CNCF CI integration actually landing. The pattern across both 2023 and 2025 attempts was: file CFP, demonstrate partial feasibility, stale-bot closes it, no merged code. The difference in the current (2026) cycle is that a maintainer has actively reopened and pinned the tracking issue and a concrete CI-runner donation is under discussion -- this is a meaningfully different state than prior cycles but has not yet produced a merged implementation.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** No upstream CI exists for riscv64 in `cilium/hubble` (all three GitHub Actions workflows run only on `ubuntu-24.04` x86_64 with no matrix, confirmed by direct file read of [`tests.yml`](https://github.com/cilium/hubble/blob/main/.github/workflows/tests.yml), [`integration-tests.yaml`](https://github.com/cilium/hubble/blob/main/.github/workflows/integration-tests.yaml), and [`release.yml`](https://github.com/cilium/hubble/blob/main/.github/workflows/release.yml)), no riscv64 release binaries are published ([GitHub Releases](https://github.com/cilium/hubble/releases)), and no Linux distribution packages Hubble at all, on any architecture, so the distribution floor (which could lift the grade to yellow for a clean unpatched distro build) does not apply. Hubble is not architecture-independent (it ships a compiled Go binary, GOARCH-specific), and it is not an optimization-purpose project (no SIMD/JIT/crypto kernels of its own -- it is a CLI/observability client), so the Step 2 optimization modifier does not apply.
- **Pending work that could change the grade:** the RISE-CNCF collaboration on RISC-V CI runners flagged in [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977) (open, pinned as of 2026-08-18) is the most concrete path to a riscv64 CI job landing in the parent Cilium project; if that materializes and is subsequently mirrored into `cilium/hubble`'s own workflows, along with resolving the `cilium/proxy`/Envoy riscv64 gap that currently blocks Hubble's L7 feature set, the grade could move to yellow (build-only) or blue (build+test, no upstream release) depending on what is actually implemented.

## 14. Investment Analysis

RISE has not funded or performed any Hubble-specific work: no RISE blog post, GitHub repository, or working-group deliverable references Hubble by name (checked against all 33 RISE blog posts and the 25-repository `riseproject-dev` GitHub org). The only RISE-adjacent activity is a single comment offering CI runners for the parent Cilium project, not yet implemented.

### 14.1 Functional Enablement

Enabling a riscv64 `hubble` binary itself is low effort in isolation -- add `riscv64` to the `Makefile`'s `local-release` `ARCHS` list and the release workflow's asset upload step, since Hubble is pure Go with native riscv64 GOARCH support. However, that binary is not useful until its runtime dependency, Cilium, has a working riscv64 agent image, which today exists only as an unmerged single-board community POC ([cilium/cilium#47451](https://github.com/cilium/cilium/issues/47451)). Real functional enablement is gated on the parent Cilium project's own riscv64 work landing first.

### 14.2 Performance Optimization

Not applicable to Hubble directly -- it has no SIMD/JIT/crypto code of its own. Any performance work belongs to the Linux kernel's riscv64 eBPF JIT (already mature) and to `cilium/ebpf`'s untested-but-buildable loader path. No Hubble-specific performance optimization is warranted.

### 14.3 CI/CD Infrastructure

Adding a riscv64 job to `cilium/hubble`'s three workflows (`tests.yml`, `integration-tests.yaml`, `release.yml`) is straightforward from a YAML-authoring standpoint but requires either QEMU emulation or RISE-donated native runners, and the integration-test job specifically requires a working Cilium riscv64 image to deploy via Helm into the `kind` cluster -- so it is gated on Section 14.1's dependency, not purely a CI-config task.

### 14.4 Ecosystem Enablement

Not applicable in the Section 10 sense -- Hubble has no significant dependent package ecosystem (no PyPI/npm/Maven consumers). Its only "ecosystem" dependency is the Kubernetes/Helm deployment path, both already tracked as their own orange-rated riscv64 gaps.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `riscv64` to Hubble's own `Makefile` ARCHS and release workflow | 0.5-1 | Cilium/Hubble maintainers or community contributor | Low (blocked on Cilium agent readiness below) |
| Functional | Land a working, CI-validated riscv64 Cilium agent image (parent dependency) | Data not available: no effort estimate found in research; existing evidence is a single unmerged single-board POC, not a sized project plan | Cilium maintainers, via CFP [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977) | Critical (hard blocker for any Hubble riscv64 usefulness) |
| Functional | Add riscv64 support to `cilium/proxy` (Envoy fork) to unblock Hubble L7 visibility | Data not available: no upstream Envoy riscv64 effort found at all (zero issues/PRs on `envoyproxy/envoy`); likely substantial given Envoy's own C++/toolchain complexity | Envoy/cilium-proxy maintainers | High (blocks a headline Hubble feature) |
| CI/CD | Wire RISE RISC-V GitHub Actions runners into `cilium/cilium` and `cilium/hubble` workflows | Data not available: proposal exists (luhenry, [cilium/cilium#39977](https://github.com/cilium/cilium/issues/39977)) but no implementation or sizing found | RISE + Cilium maintainers (cross-organizational) | High (removes the core "no CI signal" blocker cited across all threads) |
| CI/CD | Add riscv64 job to Hubble's `tests.yml`/`integration-tests.yaml`/`release.yml` once a Cilium riscv64 image exists | 1-2 | Cilium/Hubble maintainers | Medium (depends on Functional items above) |

## 15. Updates

(No updates yet -- initial report dated 2026-06-17.)

## 16. References

- [cilium/hubble repository](https://github.com/cilium/hubble)
- [cilium/hubble .github/workflows/tests.yml](https://github.com/cilium/hubble/blob/main/.github/workflows/tests.yml)
- [cilium/hubble .github/workflows/integration-tests.yaml](https://github.com/cilium/hubble/blob/main/.github/workflows/integration-tests.yaml)
- [cilium/hubble .github/workflows/release.yml](https://github.com/cilium/hubble/blob/main/.github/workflows/release.yml)
- [cilium/hubble releases](https://github.com/cilium/hubble/releases)
- [cilium/hubble issue #29 (unrelated false-positive match)](https://github.com/cilium/hubble/issues/29)
- [cilium/cilium issue #24434 - CFP: Support linux/riscv64](https://github.com/cilium/cilium/issues/24434)
- [cilium/cilium PR #24436 - feat: riscv64](https://github.com/cilium/cilium/pull/24436)
- [cilium/cilium issue #37869 - Please provide Cilium images for the riscv64 architecture](https://github.com/cilium/cilium/issues/37869)
- [cilium/cilium issue #39977 - CFP: Adding RISC-V as a supported architecture](https://github.com/cilium/cilium/issues/39977)
- [cilium/cilium issue #40076 - RISC-V support for cilium (duplicate)](https://github.com/cilium/cilium/issues/40076)
- [cilium/cilium issue #47451 - CFP/POC: linux/riscv64 support](https://github.com/cilium/cilium/issues/47451)
- [cloudflare/cfssl issue #1386 - Introduce riscv64 architecture](https://github.com/cloudflare/cfssl/issues/1386)
- [etcd-io/etcd issue #15490 - feat: add riscv64 support](https://github.com/etcd-io/etcd/issues/15490)
- [kubernetes/kubernetes issue #132836 - Proposal: Official Support for RISC-V Architecture](https://github.com/kubernetes/kubernetes/issues/132836)
- [PyPI hubble package JSON API (unrelated project)](https://pypi.org/pypi/hubble/json)
- [Ubuntu 26.04 resolute package search for Hubble](https://packages.ubuntu.com/search?keywords=Hubble&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=hubble)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)

---

**Notes on evidence gaps (per Verification policy):**
- The `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) throughout this research; the Ubuntu 26.04 riscv64 package-graph query specified in the standard procedure could not be run. This is a connection failure, not a confirmed "no data" result, and should be re-run once the server is reachable.
- GitHub API access (`mcp__github__*`) to `cilium/hubble` and `cilium/cilium` was not attached in the research session; findings rely on GitHub's cross-repo search endpoints (`search_issues`, `search_pull_requests`, `search_code`, `search_commits`) plus WebFetch on public pages as a substitute for `list_releases`/`get_file_contents`. Where noted above (e.g. GitHub Releases asset lists), this is WebFetch-scraped HTML, not the authenticated API.
- Organizational affiliations for ernado, z1006409356, and rastaman (contributors to the 2023 and 2026 riscv64 attempts) were not established in this research [NEEDS VERIFICATION].