---
title: Karmada
parent: Project Reports
color: orange
---

# Karmada

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Karmada<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Karmada (Kubernetes Armada) is a **CNCF incubation-stage project** providing multi-cluster orchestration for Kubernetes: a control plane that lets operators manage application deployment, scheduling, and failover across many member Kubernetes clusters from a single API. It is written entirely in Go, licensed **Apache License 2.0** (site documentation is CC-BY-4.0), and governed under `karmada-io/community/GOVERNANCE.md` with a maintainer-run, lazy-consensus model. Governance carries an explicit vendor-neutrality rule: "no single vendor or organization may hold more than 50% of maintainer seats."

Of 13 active maintainers, 5 (about 38%) are Huawei-affiliated (Hongcai Ren, Kevin Wang, Shiyi Xie, Zhen Chang, Zhuang Zhang), below the 50% cap. The remainder come from ByteDance, Bloomberg (3 maintainers), CECloud, Alibaba Cloud, DaoCloud, and Trip.com. Emeritus maintainers include ByteDance, Moore Threads, ICBC, and Tiger Brokers. Huawei engineers dominate the commit history by count. The project website lists supporter logos for Huawei, Alibaba Cloud, DaoCloud, JetBrains, ICBC, Shanghai Pudong Development Bank, China Mobile, Xiaohongshu, VIPKID, and Youzan.

There is no documented community stance, tier policy, or discussion regarding new architecture ports generally, or RISC-V specifically. The closest applicable process is the general subproject-acceptance rule in GOVERNANCE.md (Apache-2.0 license, maintainer sponsorship unaffiliated with the proposer, 2/3 maintainer vote via an issue in `karmada-io/community`), which would be the pathway for a hypothetical riscv64-focused subproject or major build-target contribution, but no such proposal exists in the repository history.

## 2. Port History and Upstreaming Timeline

No riscv64 port exists, so there is no upstreaming timeline to report.

| Date | Event | Source |
|---|---|---|
| 2020-11-10 | Commit `d9bd5d27f` "update vendor/" by Kevin Wang (Huawei) vendors `golang.org/x/sys/unix/*_riscv64.*` as a transitive dependency file set - not a deliberate architecture port, incidental to a routine vendor update | Local `git log` on cloned repo |
| n/a | No riscv64-specific commit, issue, PR, or discussion exists in `karmada-io/karmada` at any point in project history | `git log --all -i --grep="riscv"` (0 results); `git log --all -i -S"riscv"` pickaxe search (only vendor-bump noise) |

Key contributors: none, since no riscv64 work has been attempted. `git log --all -i -S"riscv"` (pickaxe search across the full history) surfaces only vendored dependency bumps (`golang.org/x/sys`, `controller-runtime`, `cluster-api`) that incidentally carry riscv64-tagged files from upstream Go packages - never a Karmada-authored port.

**Is it fully upstream?** Not applicable - there is nothing upstream to assess, since no riscv64 port has been started.

## 3. Upstream Support Tier

No formal architecture support-tier policy exists in Karmada (no alpha/beta/stable arch tiers as some CNCF projects publish). Support tiers are established implicitly through the build/release matrix in `Makefile`, `hack/build.sh`, `hack/docker.sh`, and `.github/workflows/release.yml`.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (all 18-19 workflows) | Yes (all 18-19 workflows) | No - zero riscv64 jobs in any of the 18-19 workflow files |
| CI test execution | Yes (`runs-on: ubuntu-24.04`) | Yes | No |
| Official CLI release binaries (`karmadactl`, `kubectl-karmada`) | Yes, linux + darwin | Yes, linux + darwin | No |
| Container images (controller-manager, scheduler, webhook, etc.) | Yes | Yes | No |
| Release-blocking | Yes (matrix build required for release) | Yes | N/A - not attempted |

Evidence: [release.yml](https://github.com/karmada-io/karmada/blob/master/.github/workflows/release.yml) defines `arch: [amd64, arm64]` as the only CLI build matrix; the `Makefile`'s `mp-image-*` multi-platform target likewise builds only `GOOS=linux GOARCH=amd64` and `GOOS=linux GOARCH=arm64`. Full text of the workflow directory (19 files: ci-image-scanning-on-schedule.yml, ci-image-scanning.yaml, ci-performance-compare.yaml, ci-schedule-compatibility.yaml, ci-schedule.yml, ci.yml, dockerhub-latest-chart.yml, dockerhub-latest-image.yml, dockerhub-released-chart.yml, dockerhub-released-image.yml, fossa.yml, installation-chart.yaml, installation-cli.yaml, installation-operator.yaml, release.yml, swr-latest-image.yml, swr-released-image.yml, update-helm-index.yml, plus OWNERS) was grepped case-insensitively for "riscv" with zero matches.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Karmada is a pure-Go application: `CGO_ENABLED=0` is hardcoded in `hack/build.sh`, so every build produces a statically linked binary with no C toolchain dependency, for any architecture. There is no assembly, no SIMD/RVV intrinsics, no `arch/riscv/` directory, and no JIT compiler of any kind in the codebase. A code search for `#ifdef __riscv repo:karmada-io/karmada` returns zero hits, and this is consistent with the codebase having **no architecture-conditional logic for any architecture** - amd64 and arm64 support come entirely from Go's standard cross-compilation (`GOOS`/`GOARCH`), not hand-authored per-arch code paths.

The only in-repo "riscv" text is inside `vendor/golang.org/x/sys/cpu/` and `vendor/github.com/prometheus/procfs/` - upstream Go-ecosystem files auto-generated for every Go-supported `GOARCH`, not Karmada-authored code. These are not evidence of Karmada riscv64 work and must not be counted as such.

One dependency of note: `github.com/yuin/gopher-lua`, a **direct** dependency, is an embedded pure-Go Lua 5.1 VM (bytecode interpreted, not JIT-compiled) powering Karmada's ResourceInterpreter customization feature (user-supplied Lua scripts for replica calculation, status aggregation, dependency discovery). It has no cgo or assembly and is expected to build/run identically on riscv64; 43 open/closed issues on that project were surveyed with zero riscv64-specific findings.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT / bytecode interpreter (gopher-lua for ResourceInterpreter) | Pure Go, portable | Pure Go, portable | Pure Go, portable - no arch-specific risk |
| SIMD / vectorization | None in Karmada's own code (Go stdlib crypto/hash paths only) | None | None - Karmada has no SIMD dependency of its own |
| Cryptography (via golang.org/x/crypto, transitively) | Assembly-accelerated fast path (blake2b, poly1305, chacha20, sha3) | Assembly-accelerated fast path | Generic Go fallback only - correct, but slower, no riscv64 assembly exists in x/crypto |
| GC / memory allocator | Go runtime, mature | Go runtime, mature | Go runtime, riscv64 GOARCH supported since Go 1.14, but Go's swiss-map SIMD fast path is amd64-only (`golang/go#71255`, open) - non-blocking for correctness, minor perf-only gap |
| Assembly / hand-tuned code paths | N/A - none in Karmada itself | N/A | N/A - Karmada is architecture-agnostic by construction |

Comparison to amd64/arm64: there is no functional gap since the project has no arch-specific code for any target; the only meaningful gaps are in transitive Go-ecosystem dependencies (crypto assembly fast paths, GC SIMD paths) that fall back to portable, correct, generic implementations on riscv64.

## 5. Build System, Cross-Compilation, and Toolchain

Karmada builds with the Go toolchain directly - no CMake, no autotools, no C/C++ toolchain requirement for any target, including riscv64. Go version is pinned at `.go-version` -> **1.26.7**.

Build command (`hack/build.sh`):
```bash
CGO_ENABLED=0 GOOS=${os} GOARCH=${arch} go build \
    -ldflags "${LDFLAGS:-}" \
    -o "_output/bin/${platform}/$target" \
    "${gopkg}"
```

Invocation for riscv64 (unofficial, untested by upstream):
```bash
BUILD_PLATFORMS=linux/riscv64 hack/build.sh <target>
# or via Makefile:
make <target> GOOS=linux GOARCH=riscv64
```

This relies purely on upstream Go's riscv64 cross-compiler support (`GOARCH=riscv64` has been supported since Go 1.14). Because `CGO_ENABLED=0` is hardcoded, no C toolchain is required for any architecture. This would **technically work today** but is entirely unofficial - not built, not tested, not documented by the project.

Container image build path (`hack/docker.sh`) uses `docker buildx build --platform ... --file cluster/images/buildx.Dockerfile`, which is generic (`FROM alpine:3.24.1`, copies `${TARGETPLATFORM}/${BINARY}`) and not riscv64-specific but would in principle accept `linux/riscv64` as `TARGETPLATFORM` if a user drove it manually - again, unsupported/untested by upstream. QEMU (`docker/setup-qemu-action`) is used in `dockerhub-latest-image.yml`, `dockerhub-released-image.yml`, and `swr-*-image.yml` to enable buildx cross-builds, but the actual platform matrix built by those workflows is fixed to `linux/amd64,linux/arm64` in the `Makefile`'s `mp-image-*` target - riscv64 is never passed to QEMU/buildx in any CI job.

No `-D`-style CMake configure flags apply (there is no CMake build). The closest analog is Makefile/env toggles: `GOOS`, `GOARCH`, `BUILD_PLATFORMS`, `OUTPUT_TYPE`, `CGO_ENABLED` (hardcoded to 0).

No known riscv64 build failures were found or reported, because no one has run and reported the result of a riscv64 build in any tracked issue, PR, or CI log.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `karmadactl` / `kubectl-karmada` CLI (official release) | Yes | Yes | No |
| Control-plane component container images (controller-manager, scheduler, webhook, etc.) | Yes | Yes | No |
| CI build validation | Yes | Yes | No |
| CI test execution | Yes | Yes | No |
| Helm chart install path | Yes (arch-agnostic manifest, but references amd64/arm64 images) | Yes | No working image reference exists |
| Manual `go build` cross-compile | Yes (native) | Yes (native or cross) | Technically possible, unofficial, untested |

**Functional gaps:** A user cannot obtain a working Karmada control-plane deployment on riscv64 through any official channel - no release binary, no container image, no distro package. The only path is self-building from source via manual `GOARCH=riscv64 go build`, entirely unsupported and unverified by upstream.

**Performance gaps:** Not separately measurable since no riscv64 build has been produced or benchmarked by any source found (see Section 11). The only latent, non-Karmada-specific performance gap is in transitive dependencies: `golang.org/x/crypto` and `github.com/klauspost/compress` fall back to generic (non-assembly) Go implementations on riscv64 where amd64/arm64 get hand-written assembly fast paths; Go's runtime swiss-map SIMD optimization (`golang/go#71255`) is amd64-only. None of these are documented as causing functional incorrectness on riscv64.

**Security hardening gaps:** Data not available: no source found addressing riscv64-specific hardening (PIE, stack protector, ASLR behavior) for Karmada or its direct build. One adjacent Go toolchain issue was found - `golang/go#74683` "crypto/internal/fips140 broken on RISC-V with `-buildmode=pie`" (open) - but Karmada does not build FIPS-mode or PIE binaries by default, so this does not block a normal Karmada build.

**NaN / floating-point semantics issues:** Data not available: no NaN or floating-point correctness issue tied to Karmada on RISC-V was found in GitHub issue search (`riscv nan floating repo:karmada-io/karmada`, `NaN floating point repo:karmada-io/karmada`: 0 results each) or web search. This is unsurprising given Karmada performs no floating-point-heavy numerical computation as part of its control-plane logic.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for Karmada in any form** - not building, not testing, not even a disabled or manual `workflow_dispatch` stub. This was verified directly against a local clone confirmed byte-identical to `origin/master` HEAD (`806289fda522b143ea87907fc2012ddd56837e0a`, 2026-09-03):

```
$ grep -rni "riscv" .github/workflows/
(no output, exit code 1)
```

Every job in every workflow runs on `runs-on: ubuntu-24.04` (a standard x86_64 GitHub-hosted runner). No ARM runner, no self-hosted riscv64 runner, and no RISE RISC-V runner reference exists anywhere in the workflow set. The only architecture matrix in the entire workflow set is in `release.yml`:
```yaml
strategy:
  matrix:
    target: [karmadactl, kubectl-karmada]
    os: [linux, darwin]
    arch: [amd64, arm64]
```

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | Yes | No |
| CI test | Yes | Yes | No |
| RISE runner usage | No (standard GitHub-hosted x86_64) | No | No - no evidence found in any of RISE's 34 blog posts, member list, or riseproject-dev org repos |
| Hardware | GitHub-hosted `ubuntu-24.04` (x86_64 VM) | Cross-built via QEMU/buildx from x86_64 host for image publishing only | N/A |

## 8. Distribution and Release Status

No official riscv64 binaries exist for Karmada from any channel checked:

- **GitHub releases:** Checked the 5 most recent releases (v1.19.0, v1.18.3, v1.17.6, v1.16.9, v1.19.0-rc.0). `karmadactl` and `kubectl-karmada` are published only for `linux-amd64`, `linux-arm64`, `darwin-amd64`, `darwin-arm64`. Live asset-URL probe against v1.19.0 confirms: `karmadactl-linux-riscv64.tgz` -> HTTP 404; `karmadactl-linux-amd64.tgz` and `karmadactl-linux-arm64.tgz` -> HTTP 200. See [v1.19.0 release](https://github.com/karmada-io/karmada/releases/tag/v1.19.0).
- **PyPI:** [https://pypi.org/pypi/karmada/json](https://pypi.org/pypi/karmada/json) -> HTTP 404. Not applicable in principle (Karmada is a Go project, not distributed via PyPI); the RISE Python wheel builder proxy for "karmada" also resolves through to the same 404.
- **Ubuntu 26.04 (resolute):** Project graph DB query (filtered on `karmada`/`python3-karmada`/`libkarmada`, `suite="resolute"`, `arch="riscv64"`) returned 0 bindings. Live [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Karmada&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" for any architecture, not just riscv64 - Karmada is not packaged for Ubuntu at all.
- **Arch Linux RISC-V port** (`archriscv.felixc.at`): No package named `karmada` listed.

**What a user must do to get a working binary on riscv64 today:** Clone the repository and manually cross-compile with `CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 go build`, entirely unsupported and unverified by upstream, with no CI evidence that the resulting binary functions correctly. Container images would similarly require the user to drive `docker buildx` manually against the generic (untested-for-riscv64) `buildx.Dockerfile`.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Go (toolchain/runtime) | Language/runtime, GC, stdlib crypto/SIMD | Found in Ubuntu 26.04 riscv64 (`golang-go`) | Native riscv64 LUCI builders exist but flaky (`golang/go#79067/79068/79069`, `#81175` open) | Officially supported `GOARCH` since Go 1.14 | Active, mature |
| etcd (`go.etcd.io/etcd/client/v3`) | Karmada's control-plane datastore | Found in Ubuntu 26.04 riscv64 (`etcd-server`, `etcd-client`) | Native riscv64 CI evidence exists (BananaPi F3, SpacemiT K1 rv64gc) | **Officially added 2026-06-04**: [etcd-io/etcd#21509](https://github.com/etcd-io/etcd/issues/21509) "Add riscv64 to supported architectures", closed as completed | Active |
| go.etcd.io/bbolt (indirect) | Embedded KV storage engine under etcd | Not found for riscv64 in Ubuntu 26.04 (Debian pkg exists for amd64/arm64 only) | No riscv64-specific issues found | Ships as part of etcd's riscv64 support | n/a |
| google.golang.org/grpc (gRPC-Go) | RPC transport between Karmada components | Not found as Ubuntu apt package for riscv64 (irrelevant - fetched via Go module proxy, not apt) | No riscv64 issues found | Pure Go, riscv64-safe | n/a |
| golang.org/x/crypto (indirect) | TLS/cert/hash primitives | Not found as Ubuntu apt package for riscv64 (not a build blocker - Go module proxy) | No riscv64-specific issues found | Generic Go fallback on riscv64 for blake2b/poly1305/chacha20/sha3 (correct, no assembly fast path) | n/a |
| github.com/klauspost/compress (indirect) | Compression in HTTP transport paths | Not found as Ubuntu apt package for riscv64 | One nominal hit was actually an aarch64 issue, not riscv64 | Generic Go fallback (amd64-only assembly for some codecs) | n/a |
| github.com/cespare/xxhash/v2 (indirect) | Prometheus metric label hashing | Not found as Ubuntu apt package for riscv64 (the unrelated C reference xxHash library is found on riscv64) | No riscv64 issues found | Pure Go generic fallback (no assembly needed) | n/a |
| github.com/google/cel-go (indirect) | CEL admission-validation interpreter embedded via k8s.io/apiserver | Not found as Ubuntu apt package for riscv64 | GitHub search errored (422) - unresolved data gap | Pure Go, no cgo/assembly - expected to build/run identically | n/a |
| github.com/yuin/gopher-lua (direct) | Embedded Lua VM for ResourceInterpreter customization | Not found as Ubuntu apt package for riscv64 (irrelevant - Go module proxy) | 43 issues surveyed, zero riscv64-specific | Pure Go, expected to build/run identically | n/a |

**Deep-dive:** No dependency in Karmada's tree requires JIT, SIMD, hand-written crypto assembly, or native numerics that would block a riscv64 build - the entire dependency tree is CGO-free. The two consequential findings are: (1) **etcd, the load-bearing control-plane datastore, gained official riscv64 support on 2026-06-04** ([etcd-io/etcd#21509](https://github.com/etcd-io/etcd/issues/21509)), which removes what had been the most significant dependency-level risk; (2) the Ubuntu 26.04 apt-packaging gap across `grpc`, `x/crypto`, `klauspost/compress`, `xxhash`, `gopher-lua`, `cel-go`, and `bbolt` is a red herring for Karmada specifically, since Go projects fetch dependencies from the Go module proxy at build time, not from apt - it would only matter if a distribution intended to package Karmada itself as a `.deb` built entirely from archive Go libraries, which none currently do.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#7866](https://github.com/karmada-io/karmada/pull/7866) | Bump Kubernetes dependencies to v1.36.4 to resolve security concerns | Merged, 2026-08-29; shipped in v1.19.0 | N/A - false positive | Routine CVE-remediation `go.mod`/vendor bump (CVE-2026-56852, CVE-2026-46600). Matched "riscv64" search only because bumping `golang.org/x/sys` pulls in that library's vendored riscv64 CPU-detection stub files. Contains no Karmada-authored riscv64 work. |
| [#1064](https://github.com/karmada-io/karmada/issues/1064) | Support ARM and x86 arch | Closed (completed), opened 2021-12-03, closed 2022-09-27 | N/A - tangential | User question about whether Karmada can manage both arm64 and x86/amd64 **member clusters** (answered yes - Karmada's control plane is architecture-agnostic at the orchestration level). Does not mention riscv64. |
| [#2712](https://github.com/karmada-io/karmada/issues/2712) | cfssl image does not support arm64 | Closed, 2022 | N/A - unrelated architecture | arm64-specific image issue, not riscv64. |

**No correctness bugs exist for riscv64** because no riscv64 build has ever been produced, tested, or reported against by any source checked (GitHub issues, PRs, commits, web search, RISE blog). There is no known-broken state to distinguish from "untested."

## 12. Objections and Upstream Blockers

**Stated objections:** None found - no maintainer or community member has expressed opposition to a riscv64 port. Equally, no one has proposed one.

**Technical blockers:** None identified. Karmada is pure Go with `CGO_ENABLED=0`; the one load-bearing native dependency (etcd) has already gained official riscv64 support upstream. A build would very likely succeed today via manual cross-compilation, though this is unverified since no one has attempted and reported it.

**Organizational blockers:** No riscv64 proposal, tracking issue, or subproject request has ever been filed against `karmada-io/karmada` or `karmada-io/community`, so the formal subproject-acceptance pathway (Apache-2.0 license, unaffiliated maintainer sponsorship, 2/3 maintainer vote per GOVERNANCE.md) has never been invoked for this purpose. There is no RISE membership or funded-project relationship for Karmada, and none of Karmada's corporate maintainer-affiliated companies (Huawei, ByteDance, Bloomberg, Alibaba Cloud, DaoCloud, CECloud, Trip.com) appear among RISE's Premier or General members - so no signal of RISE sponsorship is likely without new external investment.

**Acceptance probability:** [NEEDS VERIFICATION] - no direct evidence either way. Given the absence of any C-toolchain dependency and etcd's completed riscv64 support, a well-formed PR adding a `riscv64` line to the existing `arch:` matrix in `release.yml` and the `Makefile`'s `mp-image-*` targets would face no known technical objection; however, this is an inference from the absence of blockers, not a confirmed maintainer stance, since the proposal has never been made.

## 13. Readiness Assessment

- **Color:** orange (baseline "no upstream riscv64 CI" state)
- **Release provider:** none
- Not an optimization-purpose project - Section 2 (optimization-purpose modifier) of the color model does not apply to a control-plane orchestration tool; optimization_gap = N/A.
- **Justification:** All 19 GitHub Actions workflow files in `karmada-io/karmada` were read directly and contain zero riscv64 jobs, matrix entries, or QEMU cross-arch steps; the [release.yml](https://github.com/karmada-io/karmada/blob/master/.github/workflows/release.yml) build matrix is `os: [linux, darwin]` x `arch: [amd64, arm64]` only. No upstream riscv64 release artifact exists (live probe: `karmadactl-linux-riscv64.tgz` returns 404 against the [v1.19.0 release](https://github.com/karmada-io/karmada/releases/tag/v1.19.0), while amd64/arm64 equivalents return 200). No Linux distribution packages Karmada for any architecture (Ubuntu 26.04 "resolute" [search](https://packages.ubuntu.com/search?keywords=Karmada&suite=resolute&searchon=names&section=all) returns no results; not on PyPI; not on Arch RISC-V), so the yellow/orange distribution floor does not apply either way - there is no downstream package to float the grade from. This is the plain "no upstream CI, no distro package" orange condition.
- **Pending work that could change the grade:** None identified. No open PR, tracking issue, or RISE-funded initiative addresses riscv64 for Karmada specifically - the only trace of Karmada in RISE's ecosystem is an unactioned entry in `riseproject-dev/sw-ecosystem`'s internal report-generation queue, not evidence of involvement. The one adjacent positive signal is that Karmada's datastore dependency, etcd, gained official riscv64 support upstream ([etcd-io/etcd#21509](https://github.com/etcd-io/etcd/issues/21509), closed 2026-06-04) - this removes what had been the most consequential dependency-level blocker, but does not itself change Karmada's own grade, since Karmada's own CI/release matrix still requires a maintainer-accepted change to reach yellow or blue.

## 14. Investment Analysis

Before sizing: RISE has done no work on Karmada. It is not a RISE member project, is not mentioned in any of RISE's 34 blog posts, has no RISE-funded "Project RPxxx" entry, and appears only as an unactioned candidate in RISE's internal report-generation queue (`riseproject-dev/sw-ecosystem/project-reports/.queue.yml`). All investment below is unclaimed.

### 14.1 Functional Enablement

Minimal-risk, low-effort work given the pure-Go, CGO-free codebase and etcd's completed riscv64 support:
- Add `riscv64` to the `arch:` matrix in `release.yml` for `karmadactl`/`kubectl-karmada` CLI builds.
- Add `linux/riscv64` to the `mp-image-*` Makefile target and the buildx platform list in the Docker image workflows (`dockerhub-latest-image.yml`, `dockerhub-released-image.yml`, `swr-*-image.yml`), which already use QEMU for cross-arch builds.
- Verify the resulting binaries and images actually run correctly on riscv64 hardware or QEMU (unverified by any source checked - this is the one piece of genuinely unproven work, since no one has built or run Karmada on riscv64 before).

### 14.2 Performance Optimization

Not applicable as a distinct workstream - Karmada is not an optimization-purpose project and has no architecture-specific hot paths to tune. Any residual performance delta versus amd64/arm64 stems entirely from transitive Go dependencies (`x/crypto`, `klauspost/compress`) using generic fallback code paths rather than assembly fast paths on riscv64; closing this gap is upstream Go-ecosystem work, not Karmada-specific work.

### 14.3 CI/CD Infrastructure

- Add a riscv64 build (and ideally test-execution, likely via QEMU given the absence of confirmed native riscv64 GitHub-hosted runners for this project, or via RISE RISC-V Runners if made available) job to `ci.yml` and `ci-schedule.yml`.
- Wire the new riscv64 target into `release.yml`'s matrix and the multi-platform Docker image workflows.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per instructions. Karmada is a standalone control-plane binary/container image with no dependent package ecosystem (no PyPI, npm, or Maven consumers of "karmada" packages requiring separate riscv64 enablement).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `riscv64` to CLI release build matrix (`release.yml`) | 0.5-1 | Karmada maintainers or external contributor | High |
| Functional | Add `linux/riscv64` to container image buildx platform list (Makefile + Docker workflows) | 0.5-1 | Karmada maintainers or external contributor | High |
| Functional | Verify built binaries/images actually run correctly on riscv64 hardware/QEMU (first-ever validation) | 1-2 | Contributor with riscv64 hardware or CI access | Critical - blocks all downstream claims of "it works" |
| CI/CD | Add riscv64 build job to `ci.yml`/`ci-schedule.yml`, ideally with test execution | 1-2 | Karmada maintainers | Medium |
| Organizational | File a proposal/issue in `karmada-io/community` per the subproject-acceptance pathway, or a direct PR against `release.yml`/Makefile, to establish maintainer buy-in | 0.5 | External contributor + sponsoring maintainer | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [karmada-io/karmada repository](https://github.com/karmada-io/karmada)
- [Karmada homepage](https://karmada.io/)
- [karmada-io/community GOVERNANCE.md](https://github.com/karmada-io/community)
- [PR #7866 - Bump Kubernetes dependencies to v1.36.4](https://github.com/karmada-io/karmada/pull/7866)
- [Issue #1064 - Support ARM and x86 arch](https://github.com/karmada-io/karmada/issues/1064)
- [Issue #2712 - cfssl image does not support arm64](https://github.com/karmada-io/karmada/issues/2712)
- [release.yml workflow](https://github.com/karmada-io/karmada/blob/master/.github/workflows/release.yml)
- [Karmada v1.19.0 release](https://github.com/karmada-io/karmada/releases/tag/v1.19.0)
- [PyPI karmada package lookup (404)](https://pypi.org/pypi/karmada/json)
- [Ubuntu 26.04 resolute package search for Karmada](https://packages.ubuntu.com/search?keywords=Karmada&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=karmada)
- [etcd-io/etcd#21509 - Add riscv64 to supported architectures](https://github.com/etcd-io/etcd/issues/21509)
- [golang/go#71255 - runtime: swiss map SIMD implementation for non-amd64](https://github.com/golang/go/issues/71255)
- [golang/go#74683 - crypto/internal/fips140 broken on RISC-V with -buildmode=pie](https://github.com/golang/go/issues/74683)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject-dev/sw-ecosystem project-reports queue file](https://github.com/riseproject-dev/sw-ecosystem)
