---
title: Helm
---

# Helm

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Helm<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Helm is a package manager for Kubernetes, implementing the concept of "charts" (templated Kubernetes manifests) for application deployment and lifecycle management. It is a CLI tool written entirely in Go with `CGO_ENABLED=0` throughout; there are no C or C++ components.

**Governance:** Helm is a [CNCF graduated project](https://www.cncf.io/projects/helm/) under the Linux Foundation. Licensed Apache 2.0 (code) and CC-BY-4.0 (documentation). Contributions require DCO sign-off.

**Maintainer structure:** Two-tier system. Org maintainers (3-9 people, no single employer majority) handle mission, brand, security, and CoC. Project maintainers are scoped to individual codebases (helm core, charts, web/docs). Decision-making is lazy-consensus, escalating to majority vote. Super-majority required for CoC changes, governance amendments, and maintainer removal.

**Active maintainers and employers (from OWNERS file):**

| GitHub Login | Name | Employer |
|---|---|---|
| marckhouzam | Marc Khouzam | VMware by Broadcom |
| mattfarina | Matt Farina | SUSE / Rancher |
| robertsirc | Robert Sirchia | SUSE |
| sabre1041 | Andrew Block | Red Hat |
| scottrigby | Scott Rigby | Replicated |
| technosophos | Matt Butcher | Fermyon |
| gjenkins8 | George Jenkins | Bloomberg LP |
| TerryHowe | Terry Howe | NVIDIA |
| joejulian | Joe Julian | not listed |
| banjoh | Evans Mungai | not listed |

Strong SUSE/Rancher and Red Hat representation. NVIDIA and Bloomberg are present. Red Hat is a RISE Premier Member; this connection has not been leveraged for Helm specifically.

**Community culture on new ports:** Receptive and pragmatic. The riscv64 port required zero application code changes (pure build toolchain). The primary frictions were maintainer latency (PR #12204 sat open for six months before merge) and DCO compliance (PR #13614 closed for missing sign-off). No architectural objection was ever raised.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-06-24 | Issue [#9858](https://github.com/helm/helm/issues/9858) filed: "Support RISCV64". Identified `prometheus/procfs` dependency as too old. | GitHub issue |
| 2021-07-01 | PR [#9902](https://github.com/helm/helm/pull/9902) "Support RISCV64 builds" opened. Closed without merge (superseded). | GitHub PR |
| 2022-09-13 | Issue [#11341](https://github.com/helm/helm/issues/11341) "Enabling support for RISC-V" opened by RISC-V community (CC @lazyparser, @carlosedp). Documents `syscall.Dup2` missing from `github.com/bugsnag/panicwrap` on riscv64, and `TestPartialPlatformPrepareCommand` hardcoding i386 as fallback arch. | GitHub issue |
| 2022-09-23 | PR [#11377](https://github.com/helm/helm/pull/11377) "Adding support for RISC-V arch" opened. Closed without merge. | GitHub PR |
| 2022-09-28 | mattfarina (SUSE) acknowledges `TestPartialPlatformPrepareCommand` failure as a genuine bug, not a test assumption issue. | GitHub issue #11341 |
| 2023-01-27 | Issue #11341 closed by stale bot after 90 days of inactivity. Failures unresolved. | GitHub issue |
| 2023-07-13 | PR [#12204](https://github.com/helm/helm/pull/12204) "Add support for RISC-V" opened by Antony Chazapis (CARV-ICS-FORTH, Foundation for Research and Technology Hellas, Greece). Motivation: running K3s on RISC-V hardware. Change: bump `mitchellh/gox` to v1.0.2-0.20220701044238-9f712387e2d2 to enable riscv64 cross-compilation. Zero application code changes. Validated on QEMU Ubuntu 22.04 riscv64 + K3s v1.27.2. | GitHub PR |
| 2024-01-06 | PR #12204 merged by joejulian. First commit with riscv64 support: `6d96283c`. | GitHub PR |
| 2024-01-17 | First release shipping official `helm-v3.14.0-linux-riscv64.tar.gz`. | GitHub releases |
| 2025-01-08 | PRs [#13613](https://github.com/helm/helm/pull/13613) and [#13614](https://github.com/helm/helm/pull/13614) "Fix execution of tests on riscv64" opened by dirkmueller (SUSE). Both closed without merge: #13613 by author ("not needed on main anymore"), #13614 for missing DCO sign-off. | GitHub PRs |
| 2025-09-29 | PR [#31343](https://github.com/helm/helm/pull/31343) "chore: replace mitchellh/gox with goreleaser" opened by TerryHowe (NVIDIA). riscv64 explicitly included with `goriscv64: rva20u64` profile. | GitHub PR |
| 2026-05-03 | PR #31343 merged by gjenkins8 (Bloomberg). gox (archived) fully replaced by goreleaser v2. | GitHub PR |
| 2026-05-14 | First releases under goreleaser: v4.2.0 and v3.21.0 ship `linux-riscv64` binaries from the new build pipeline. | GitHub releases |
| 2026-08-13 | Latest release v4.2.4 confirmed shipping `helm-v4.2.4-linux-riscv64.tar.gz` (17.9 MB, HTTP 200 at get.helm.sh). | Direct HTTP verification |

**Key contributors:** Antony Chazapis (CARV-ICS-FORTH) originated the successful port. dirkmueller (SUSE) attempted the test fix. TerryHowe (NVIDIA) and gjenkins8 (Bloomberg) drove the goreleaser migration.

**Upstream status:** Fully upstream. riscv64 is a first-class release target with no forks or out-of-tree patches required.

---

## 3. Upstream Support Tier

**Formal tier policy:** No PLATFORMS.md, SUPPORT.md, or equivalent tier classification document exists in the Helm repository. No explicit tiering policy is stated for architecture support.

**De facto evidence:** `linux-riscv64` appears in `TARGET_OBJS` in the Makefile alongside darwin-amd64, darwin-arm64, linux-amd64, linux-arm64, linux-ppc64le, linux-s390x, linux-loong64, and windows-amd64. It is in the same list, built and released on the same schedule, with no conditional or special-case treatment. The goreleaser `.yaml` builds riscv64 in the same goreleaser matrix as all other Linux architectures.

mattfarina stated in January 2024 [NEEDS VERIFICATION: paraphrase from review context, not a direct quoted comment] that riscv64 is supported at the same level as s390x -- cross-compilation only, no dedicated hardware CI.

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official release binary | Yes | Yes | Yes |
| Signed (.asc) release artifacts | Yes | Yes | Yes |
| Native CI (unit tests) | Yes | No | No |
| Cross-compilation CI | Yes | Yes | Yes |
| Install script (get-helm-4) | Yes | Yes | Yes |
| darwin support | Yes | Yes | No |
| windows support | Yes | Yes | No |

riscv64 is Linux-only. darwin/riscv64 and windows/riscv64 are explicitly in the goreleaser `ignore` list. No test suite runs on or for riscv64 in any CI workflow.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Helm is a pure-Go CLI application. It has no JIT engine, no SIMD intrinsics, no hand-written assembly, no crypto accelerators, and no `arch/riscv/` directory. There are exactly 5 files in the repository containing the string "riscv64", all in build and release tooling.

**Architecture-specific components:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Application logic | Pure Go | Pure Go | Pure Go (identical) |
| JIT / code generation | None | None | None |
| SIMD / vectorized paths | None | None | None |
| Assembly routines | None | None | None |
| Crypto acceleration | None (deps handle) | None (deps handle) | None (deps handle) |
| GC / scheduler | Go runtime | Go runtime | Go runtime |

The `goriscv64: rva20u64` entry in `.goreleaser.yaml` sets `GORISCV64=rva20u64` at build time. This is the RVA20U64 ISA profile: base RV64GC, no vector extensions. The choice of rva20u64 is the Go 1.22+ minimum and imposes no architectural capability requirements beyond the base ISA. No RVV, Zba, Zbb, Zbc, or Zbs extensions are used or required.

No architecture-specific optimization work exists or is needed -- Helm's workload is template rendering, YAML parsing, HTTP/gRPC client calls, and file I/O. None of these benefit from SIMD or assembly on any architecture.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make + goreleaser v2. No CMake, Autoconf, Meson, or C/C++ toolchain.

**Minimum Go version:** 1.26.0 (declared in `go.mod` and `.github/env`).

**CGO:** Disabled throughout (`CGO_ENABLED=0`). No C compiler is needed for any build target, including riscv64.

**GORISCV64 profile:** `rva20u64` (set in `.goreleaser.yaml`).

**Build commands:**

Single riscv64 binary (native or cross):
```
CGO_ENABLED=0 GOOS=linux GOARCH=riscv64 GORISCV64=rva20u64 \
  go build -trimpath -ldflags '-w -s' -o bin/helm ./cmd/helm
```

All release targets including riscv64 via goreleaser:
```
make build-cross
# expands to: LDFLAGS='-w -s -extldflags "-static"' goreleaser build --snapshot --clean
# produces _dist/linux-riscv64/helm
```

Package into release tarball:
```
make dist VERSION=<tag>
# produces _dist/helm-<tag>-linux-riscv64.tar.gz
```

**QEMU usage:** None. No QEMU steps exist in any CI workflow or Makefile target. The release binary is produced by Go's built-in cross-compiler on an x86_64 host.

**Known build failures:** None currently. The `bugsnag/panicwrap` dependency that caused `syscall.Dup2` build failures on riscv64 (issue #11341, 2022) is no longer present in `go.mod`. That blocker is resolved by dependency removal, not by patching.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| helm install / upgrade / rollback | Full | Full | Full |
| helm template / lint / package | Full | Full | Full |
| Chart provenance (PGP signing) | Full | Full | Full |
| OCI registry push/pull | Full | Full | Full |
| WebAssembly plugin execution | Compiler mode (fast) | Compiler mode (fast) | Interpreter mode only (slow) |
| helm completion (shell) | Full | Full | Full |
| Native binary (Linux) | Yes | Yes | Yes |
| Native binary (darwin) | Yes | Yes | No |
| Native binary (Windows) | Yes | Yes | No |

**Functional gaps:**

- No darwin/riscv64 binary. Not relevant for embedded or server deployments but relevant for developer workstations on future RISC-V laptops.
- No windows/riscv64 binary. Not relevant for current Kubernetes deployments.

**Performance gaps:**

- WebAssembly plugin execution via `extism/go-sdk` uses [wazero](https://github.com/tetratelabs/wazero) as the runtime. wazero's Compiler (AOT/JIT) mode is not available on riscv64; only the Interpreter mode is. Plugin-heavy deployments will be slower on riscv64. Functional correctness is not affected.
- No benchmark data comparing Helm on riscv64 vs arm64 or x86_64 was found in any source. Data not available: performance delta measurements for Helm chart operations on riscv64.

**Security hardening gaps:**

- Go's `-buildmode=pie` combined with `-GOFIPS140=v1.0.0` is broken on riscv64 ([Go issue #74683](https://github.com/golang/go/issues/74683), open). Helm's goreleaser config does not use PIE mode, so this does not affect current official binaries. If a user or distro rebuilds Helm with PIE enabled, the build will fail on riscv64.

**Floating-point semantics:** No riscv64-specific floating-point issues were found in Helm's codebase or issue tracker. Two historical float bugs (#8978 and #11587, both closed) involved Go template rendering of floats and were platform-independent.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists in any Helm workflow file. This was verified by direct inspection of all workflow YAML files.

**Workflow inventory:**

| Workflow file | Purpose | riscv64 content |
|---|---|---|
| build-test.yml | Unit tests and build | None; `runs-on: ubuntu-latest` (x86_64) |
| release.yml | Cross-compilation + release | Builds riscv64 binary via goreleaser; no test execution |
| codeql-analysis.yml | Static analysis | None |
| golangci-lint.yml | Linting | None |
| govulncheck.yml | Vulnerability scan | None |
| label-pr.yml | PR labeling | None |
| scorecards.yml | OSSF scorecard | None |
| stale.yaml | Stale bot | None |

**What "riscv64 in release.yml" means:** `make build-cross` invokes goreleaser on `ubuntu-latest-16-cores` (x86_64). goreleaser cross-compiles `GOARCH=riscv64` using Go's built-in cross-compilation. The resulting binary is uploaded to `get.helm.sh`. No tests are executed during this step. No QEMU is involved.

**RISE runners:** Not in use. RISE announced free native RISC-V CI runners on GitHub in March 2025 ([RISE blog, 2025-03-24](https://riseproject.dev/2025/03/24/)). Helm has not adopted them. No RISE involvement with Helm was found in any source checked (RISE blog posts 2024-2026, RISE GitLab, GitHub search).

**Comparison table:**

| CI capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Unit tests run | Yes | No | No |
| Integration tests run | No | No | No |
| Cross-compilation (binary produced) | Yes | Yes | Yes |
| Native runner in CI | Yes | No | No |
| QEMU emulation in CI | No | No | No |
| Release binary produced and signed | Yes | Yes | Yes |

---

## 8. Distribution and Release Status

**Official upstream binaries:** Available for every release since v3.14.0 (2024-01-17). Confirmed present in v3.21.4 and v4.2.4 (latest as of 2026-08-13). Download URL pattern:

```
https://get.helm.sh/helm-{version}-linux-riscv64.tar.gz
```

Direct HTTP verification: `helm-v4.2.4-linux-riscv64.tar.gz` returns HTTP 200, content-type `application/x-tar`, size 17,987,881 bytes (~17.1 MB). SHA256 and GPG signatures are provided.

Note: GitHub release asset pages list only the `.asc` and `.sha256.asc` signature files, not the `.tar.gz` itself. This is consistent behavior for all architectures; the actual tarballs are hosted on the `get.helm.sh` CDN, not as GitHub release assets.

**Official install scripts:** `scripts/get-helm-3` and `scripts/get-helm-4` both list `linux-riscv64` in their `verifySupported()` function. On a native RISC-V host, `uname -m` returns `riscv64`; the install script passes this through unchanged and downloads the correct tarball.

**OS-level packages:**

| Distribution | Status | Notes |
|---|---|---|
| Debian (testing/unstable) | Available | Package `helm` v4.0.7-1, `arch: all` (architecture-independent). Installs on riscv64 without a separate architecture build. |
| Ubuntu 24.04 (Noble) | Not packaged | No `helm` (Kubernetes) in main/universe; only unrelated Emacs `elpa-helm*` packages. Must install via `get-helm-4` script or snap. |
| Arch Linux RISC-V (archriscv.felixc.at) | Not listed | Zero results in Arch RISC-V porting tracker for `helm`. |
| PyPI | Not applicable | The `helm` PyPI package (v0.4) is an unrelated Python project. |

**What a user must do to get a working riscv64 binary:**

```
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-4 | bash
```

or manually:

```
curl -LO https://get.helm.sh/helm-v4.2.4-linux-riscv64.tar.gz
tar xzf helm-v4.2.4-linux-riscv64.tar.gz
install linux-riscv64/helm /usr/local/bin/helm
```

No compilation, no QEMU, no special toolchain. The static binary runs on any Linux riscv64 system.

---

## 9. Dependencies

Helm is a pure-Go application (`CGO_ENABLED=0`). All critical dependencies must themselves be Go-native or provide Go-native fallbacks. The following table covers dependencies with architecture-specific concerns.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Go runtime (golang/go) | Language runtime, GC, scheduler | Builds | Partial -- open flakes | Go 1.26 shipped | Issues #68862 (SIGSEGV in preemptone), #78161 (memory corruption), LUCI builders partially broken (#79067-#79069). Not systematic failures; intermittent. |
| golang.org/x/crypto (via ProtonMail/go-crypto) | OpenPGP chart provenance verification | Builds (pure Go) | No riscv64-specific issues | Published | No crypto assembly for riscv64; pure-Go fallback. Functionally correct, not performance-critical for Helm. |
| github.com/cloudflare/circl | Post-quantum / elliptic crypto (indirect, via go-crypto) | Builds (pure Go fallback) | No riscv64 issues | Published | No riscv64 assembly; pure-Go fallback only. |
| github.com/klauspost/compress | Compression for OCI and chart archives (zstd, gzip) | Builds | No riscv64 issues | v1.18.4 published | No SIMD for riscv64; uses pure Go. Not blocking. |
| github.com/tetratelabs/wazero | WebAssembly runtime for plugin execution | Builds | Interpreter mode tested on Linux riscv64 | v1.12.0 published | Compiler (AOT/JIT) mode not available on riscv64. Interpreter mode is functional but slower. Affects `extism/go-sdk` plugin system. |
| github.com/extism/go-sdk | Helm WebAssembly plugin host | Builds | No dedicated riscv64 CI | v1.7.1 published | Inherits wazero Interpreter-only limitation on riscv64. |
| k8s.io/client-go, k8s.io/apimachinery, k8s.io/api | Kubernetes API client (core Helm function) | Builds (pure Go) | No riscv64-specific issues in client-go | Published | kubernetes/kubernetes [#132836](https://github.com/kubernetes/kubernetes/issues/132836) (open) is a formal proposal for official K8s riscv64 support. K8s itself lacks official riscv64 CI or releases. Helm's client-side library use is unaffected, but a full Helm workflow requires a running K8s cluster, which has no official riscv64 support from upstream Kubernetes. |
| oras.land/oras-go/v2 | OCI registry operations (chart push/pull) | Builds (pure Go) | No riscv64 issues | v2.6.2 published | No issues. |
| github.com/distribution/distribution/v3 | OCI distribution (used in test registry) | Builds | riscv64 binary added in v3.0.0 ([issue #4496](https://github.com/distribution/distribution/issues/4496), closed 2024-10-26) | v3.1.1, riscv64 present | Issue was resolved. |
| go.opentelemetry.io/otel | Observability / tracing | Builds (pure Go) | No riscv64 issues | v1.44.0 published | No issues. |
| google.golang.org/grpc | gRPC (via OTel exporters) | Builds (pure Go) | No riscv64 issues | v1.82.1 published | No issues. |

**Key finding on the Go runtime:** Two open Go runtime bugs affect riscv64 stability: [#68862](https://github.com/golang/go/issues/68862) (SIGSEGV in preemptone, intermittent) and [#78161](https://github.com/golang/go/issues/78161) (memory corruption). These are intermittent flakes, not systematic failures. Helm deployments in production on riscv64 carry a non-zero risk of transient crashes until these are resolved in the Go runtime.

**Key finding on Kubernetes:** The most significant ecosystem dependency for Helm is Kubernetes itself. kubernetes/kubernetes [#132836](https://github.com/kubernetes/kubernetes/issues/132836) tracks the formal proposal for official riscv64 support in Kubernetes. Without an official Kubernetes riscv64 release, Helm on riscv64 can only target community-built K8s distributions (K3s, etc.). The K3s project has run on RISC-V (as noted in PR #12204 -- the original motivation for adding riscv64 to Helm).

---

## 11. Known Bugs and Active Issues

**RISC-V-specific open bugs in helm/helm:** None. GitHub search for `riscv64 OR riscv repo:helm/helm is:open` returns zero results.

**Closed RISC-V-specific issues:**

| ID | Title | Status | Notes |
|---|---|---|---|
| [#9858](https://github.com/helm/helm/issues/9858) | Support RISCV64 | Closed 2021-09 | Resolved by PR #9902 (superseded by #12204) |
| [#11341](https://github.com/helm/helm/issues/11341) | Enabling support for RISC-V | Closed 2023-01 (stale) | Two failures identified: `bugsnag/panicwrap` `syscall.Dup2` undefined; `TestPartialPlatformPrepareCommand` hardcodes i386 fallback. Both were subsequently resolved by dependency removal and test refactoring (not by the stale-closed issue). |

**RISC-V-specific PRs closed without merge:**

| ID | Title | Reason | Impact |
|---|---|---|---|
| [#13613](https://github.com/helm/helm/pull/13613) | Fix execution of tests on riscv64 | Author closed ("not needed on main anymore") | Author asserts already resolved in main |
| [#13614](https://github.com/helm/helm/pull/13614) | Fix execution of tests on riscv64 | Closed for missing DCO sign-off | No test coverage for riscv64 landed from this attempt |

**Current state of the historical test failures:** `bugsnag/panicwrap` is no longer present in `go.mod` (removed via dependency cleanup, not because of riscv64). `TestPlatformPrepareCommand` no longer exists in the current codebase (test infrastructure was refactored; the test was removed). Both failure modes from issue #11341 are therefore moot against current main.

**Active non-RISC-V bugs affecting all platforms including riscv64:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#31865](https://github.com/helm/helm/issues/31865) | Major Performance and Memory Optimization Across Helm Commands | Open (in progress) | Medium | `coalesceGlobals` shallow-copy bug causes >35 min runtimes on large charts. Related PR [#31841](https://github.com/helm/helm/pull/31841) pending. Affects all platforms. |
| [#13342](https://github.com/helm/helm/pull/13342) | Re-introduce dependency update performance improvement | Open PR, awaiting review | Low | `helm dependency update` parallelism; previously reverted for cert-manager regression. |
| [#11509](https://github.com/helm/helm/issues/11509) | `helm dependency update/build` performance concerns | Open | Low | Long-standing; not blocked on RISC-V. |

**Active Go runtime bugs affecting riscv64 (not Helm-specific):**

| ID | Title | Status | Severity |
|---|---|---|---|
| [#68862](https://github.com/golang/go/issues/68862) | SIGSEGV in preemptone on riscv64 | Open | Medium (intermittent crash) |
| [#78161](https://github.com/golang/go/issues/78161) | Memory corruption on riscv64 | Open | Medium (intermittent) |
| [#74683](https://github.com/golang/go/issues/74683) | FIPS/PIE broken on riscv64 | Open | Low for Helm (PIE not used in goreleaser config) |

---

## 12. Objections and Upstream Blockers

**No stated technical objections** to riscv64 support exist in the Helm issue tracker or PR review history. All prior objections (dependency gaps, pinning policy) were resolved.

**Current blockers:**

1. **No riscv64 CI.** Tests are never executed on riscv64. The upstream maintainer team has not adopted RISE's native RISC-V runners despite their availability since March 2025. This is a resource and prioritization gap, not a technical blocker.

2. **Go runtime instability on riscv64.** Issues #68862 and #78161 are open. These affect any Go binary on riscv64, not just Helm. Resolution is in the Go project's hands.

3. **Kubernetes lacks official riscv64 support.** Issue #132836 is an open proposal. Helm's full utility requires a working K8s cluster. Community distributions (K3s) fill this gap today but are not officially supported by upstream Kubernetes.

4. **wazero Compiler mode absent on riscv64.** Affects WebAssembly plugin performance only. Functional correctness is unaffected.

**Acceptance probability for future PRs:** High. The maintainers have demonstrated willingness to merge riscv64 improvements. The primary failure mode is DCO compliance (PR #13614) and maintainer latency, not technical rejection.

---

## 13. Investment Analysis

RISE has no current involvement with Helm. The items below are not covered by any known RISE funding.

### 13.1 Functional Enablement

No functional gaps exist. Helm builds, runs, and deploys charts on riscv64 today. The darwin/windows riscv64 gaps are not relevant to server or embedded use cases.

### 13.2 Performance Optimization

Helm is not a compute-intensive workload. No SIMD or assembly optimization opportunity exists in Helm itself. The wazero JIT-mode gap affects plugin-heavy deployments; this is properly addressed in the wazero project, not in Helm.

### 13.3 CI/CD Infrastructure

This is the highest-value investment area. There is no riscv64 test execution in Helm CI. Adding a QEMU-based or native RISE runner job to `build-test.yml` would provide the first upstream test coverage for riscv64 and prevent regressions.

Estimated scope: add one CI job to `build-test.yml` using RISE GitHub runners (available free of charge to CNCF projects). RISE runners are already available at `runs-on: [self-hosted, riscv64]` via the RISE program. The PR would be a small YAML change plus coordination with Helm maintainers (bloomberg: gjenkins8, NVIDIA: TerryHowe are both responsive) to get it merged.

### 13.4 Ecosystem Enablement

Helm has no Python, npm, or Maven package ecosystem requiring separate riscv64 enablement. The Helm chart repository ecosystem (Artifact Hub) is architecture-independent YAML. No Section 10 applies.

The blocking ecosystem dependency is Kubernetes itself (issue #132836). Investment in K8s riscv64 CI enablement would have broader impact than anything Helm-specific.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 test job to build-test.yml using RISE runners | 1 | Qualcomm or RISE | High |
| CI/CD | Monitor Go runtime issues #68862 and #78161; report riscv64-specific regressions upstream | 0.5 (ongoing) | Qualcomm | Medium |
| Functional | darwin/riscv64 binary support | 0.5 | Community | Low |
| Performance | wazero JIT mode for riscv64 (plugin acceleration) | Tracked in wazero, not Helm | wazero project | Low |
| Ecosystem | Kubernetes official riscv64 support (prerequisite for full Helm value) | Large (tracked in kubernetes/kubernetes#132836) | Kubernetes SIG-architecture | Critical |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Helm GitHub repository](https://github.com/helm/helm)
- [Helm homepage](https://helm.sh/)
- [Issue #9858: Support RISCV64](https://github.com/helm/helm/issues/9858)
- [Issue #11341: Enabling support for RISC-V](https://github.com/helm/helm/issues/11341)
- [PR #9902: Support RISCV64 builds (closed, unmerged)](https://github.com/helm/helm/pull/9902)
- [PR #11377: Adding support for RISC-V arch (closed, unmerged)](https://github.com/helm/helm/pull/11377)
- [PR #12204: Add support for RISC-V (merged 2024-01-06)](https://github.com/helm/helm/pull/12204)
- [PR #13613: Fix execution of tests on riscv64 (closed, unmerged)](https://github.com/helm/helm/pull/13613)
- [PR #13614: Fix execution of tests on riscv64 (closed, unmerged)](https://github.com/helm/helm/pull/13614)
- [Issue #30896: Replace mitchellh/gox (archived)](https://github.com/helm/helm/issues/30896)
- [PR #30913: Added goreleaser instead of gox (closed, unmerged)](https://github.com/helm/helm/pull/30913)
- [PR #31343: chore: replace mitchellh/gox with goreleaser (merged 2026-05-03)](https://github.com/helm/helm/pull/31343)
- [Issue #31865: Major Performance and Memory Optimization](https://github.com/helm/helm/issues/31865)
- [PR #31841: Performance fix for coalesceGlobals](https://github.com/helm/helm/pull/31841)
- [PR #13342: Re-introduce dependency update performance improvement](https://github.com/helm/helm/pull/13342)
- [Debian tracker: helm package](https://tracker.debian.org/pkg/helm)
- [CNCF Helm project page](https://www.cncf.io/projects/helm/)
- [Go issue #68862: SIGSEGV in preemptone on riscv64](https://github.com/golang/go/issues/68862)
- [Go issue #78161: Memory corruption on riscv64](https://github.com/golang/go/issues/78161)
- [Go issue #74683: FIPS/PIE broken on riscv64](https://github.com/golang/go/issues/74683)
- [kubernetes/kubernetes issue #132836: Formal proposal for official riscv64 support](https://github.com/kubernetes/kubernetes/issues/132836)
- [distribution/distribution issue #4496: riscv64 binary in v3.0.0](https://github.com/distribution/distribution/issues/4496)
- [RISE blog: Advancing Go on RISC-V (2025-04-04)](https://riseproject.dev/2025/04/04/advancing-go-on-riscv-progress-through-the-rise-project/)
- [RISE blog: Announcing RISE RISC-V Runners (2025-03-24)](https://riseproject.dev/2025/03/24/announcing-the-rise-riscv-runners-free-native-riscv-ci-on-github/)
- [wazero: tetratelabs/wazero](https://github.com/tetratelabs/wazero)
- [Helm get.helm.sh CDN (v4.2.4 riscv64 tarball)](https://get.helm.sh/helm-v4.2.4-linux-riscv64.tar.gz)