---
title: CRI-O
parent: Project Reports
color: orange
dependencies:
  - name: runc
    relation: runtime-dependency
    criticality: critical
  - name: containerd
    relation: build-dependency
    criticality: critical
  - name: CRIU
    relation: runtime-dependency
    criticality: optional
  - name: libseccomp
    relation: build-dependency
    criticality: critical
  - name: conmon
    relation: runtime-dependency
    criticality: critical
  - name: conmon-rs
    relation: runtime-dependency
    criticality: optional
  - name: Kata Containers
    relation: runtime-dependency
    criticality: optional
  - name: klauspost/compress
    relation: build-dependency
    criticality: critical
  - name: containers/ocicrypt
    relation: build-dependency
    criticality: optional
  - name: mattn/go-sqlite3
    relation: build-dependency
    criticality: critical
  - name: ulikunitz/xz
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" focus="cri-o" %}

# CRI-O

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for CRI-O<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

CRI-O ([github.com/cri-o/cri-o](https://github.com/cri-o/cri-o), [cri-o.io](https://cri-o.io/)) is a Go implementation of the Kubernetes Container Runtime Interface (CRI) that runs Open Container Initiative (OCI)-compatible container images. It is a **CNCF-graduated project**, licensed **Apache 2.0**. Community coordination happens on `#crio` (Kubernetes Slack) and a public weekly community meeting.

Governance follows a five-tier contribution ladder defined in `GOVERNANCE.md`: Community Member (no gate) -> Org Member (added after a track record) -> Reviewer (sponsored by an approver) -> Approver (final PR-merge authority, minimum 3 months as reviewer, added by simple-majority approver vote) -> Emeritus Approver (retired, reactivatable). Decisions run on lazy consensus; disputes escalate to an approver vote (2/3 majority to remove an approver or amend governance). `GOVERNANCE.md` explicitly requires such votes to "make every reasonable effort" to span more than one employer, a direct safeguard against single-company capture.

Corporate maintainer roster, cross-checked against `git shortlog -sne` over the full commit history:

| Person | Role | Company |
|---|---|---|
| Mrunal Patel, Nalin Dahyabhai, Giuseppe Scrivano, Urvashi Mohnani, Sascha Grunert, Peter Hunt, Sohan Kunkerkar, Ayato Tokubi | Approver | Red Hat |
| Skyler Clark, Qi Wang | Reviewer | Red Hat |
| Fabiano Fidencio | Approver | Intel |
| Krisztian Litkey | Reviewer | Intel |
| Antonio Murdaca, Dan Walsh, Valentin Rothberg, Kir Kolyshkin (emeritus) | Approver (alumni) | Red Hat |
| Samuel Ortiz, Sebastien Boeuf (emeritus) | Approver (alumni) | Intel |

Commit volume is dominated by Red Hat engineers; Sascha Grunert's commit-author email domain shifted from `@suse.com` to `@redhat.com` mid-project, reflecting an employer move. `cri-o.io` additionally names SUSE, Hyper, and IBM as historical contributing organizations, though none currently hold `OWNERS_ALIASES` seats. No single company holds a formal majority lock (approvers span Red Hat and Intel), but Red Hat is by far the primary maintainer-employing sponsor.

**Community culture on new architecture ports:** the one RISC-V feature request the project received (issue [#9873](https://github.com/cri-o/cri-o/issues/9873)) went unaddressed by any maintainer, went stale, and was auto-closed by the lifecycle bot - see Section 2. By contrast, per prior research, other architecture-support requests (s390x packaging gaps, arm64/armv7l Debian build issues) were historically picked up and resolved by maintainers, making riscv64 an outlier that went untouched rather than a case of explicit rejection.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-03-25 | First riscv64-tagged files enter the repo tree, via commit `22c449425` ("update golang.org/x/sys") by Valentin Rothberg (`rothberg@redhat.com`) - a routine Go dependency bump that incidentally added `syscall_linux_riscv64.go`, `zerrors_linux_riscv64.go`, etc. to the vendored `golang.org/x/sys` tree. Not an intentional CRI-O RISC-V enablement effort. | Git history, commit `22c449425` |
| 2026-04-08 | Issue [#9873](https://github.com/cri-o/cri-o/issues/9873) "Provide native RISC-V builds" opened by brianredbeard (RISE-affiliated, GitHub association `NONE`, not a maintainer), proposing CRI-O adopt RISE's free native RISC-V GitHub Actions runners (`ubuntu-24.04-riscv` / `ubuntu-26.04-riscv`, via the `rise-risc-v-runners` GitHub App) in place of cross-compilation. | [Issue #9873](https://github.com/cri-o/cri-o/issues/9873) |
| 2026-08-07 | Issue #9873 auto-closed as `not_planned` by the stale bot (`lifecycle/stale` -> `lifecycle/rotten`), with no maintainer decision, no rejection rationale, and no counter-proposal recorded. | [Issue #9873](https://github.com/cri-o/cri-o/issues/9873) |

**Key contributors:** No individual has contributed riscv64-specific work to CRI-O. The only named individual connected to RISC-V in the project's history is brianredbeard (RISE contributor, filed #9873; no code contribution).

**Is it fully upstream?** No. There is no riscv64 port of any kind, upstream or otherwise. Zero commits in the full git history mention `riscv`, `riscv64`, or `risc-v` (confirmed via `git log --all -i --grep` and the GitHub commit-search API). Zero PRs add or modify riscv64 support - see Section 12 for a breakdown of the Dependabot PRs that surface in "riscv" text searches but do not touch CRI-O's own riscv64 support.

## 3. Upstream Support Tier

CRI-O has no formal, published architecture-tier policy document (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists in the repository - confirmed absent by direct search). Architecture support is defined implicitly by what appears in the CI matrices, the Nix static-build cross targets, and the GitHub release asset list, all of which agree on the same four architectures.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes | yes | no |
| CI tests | yes | yes | no |
| Official release binary | yes | yes | no |
| Release-blocking | yes (native runner) | yes (native runner) | N/A |

Evidence: `.github/workflows/integration.yml` and `.github/workflows/test.yml`, read directly (see Section 7); `flake.nix` cross-target list (see Section 5); GitHub Releases asset listing for the 10 most recent releases (see Section 8).

## 4. Technical Architecture and RISC-V-Specific Subsystems

CRI-O has no architecture-specific subsystems of any kind, for any architecture, not just riscv64. Confirmed via GitHub code search against `cri-o/cri-o` and a local clone at HEAD `e858b76f`:

- No `arch/` directory tree (`path:arch repo:cri-o/cri-o` -> 0 results).
- No `.S` assembly files anywhere in the repository (`extension:S repo:cri-o/cri-o` -> 0 results).
- No per-architecture filename-suffixed Go files (`_amd64.go`, `_arm64.go`, `_ppc64le.go`, `_s390x.go`, `_riscv64.go`) exist for **any** architecture across the 494 non-vendor `.go` files - CRI-O does not split source by CPU architecture via filename convention at all.
- Only two non-vendor `go:build` arch-conditional files exist, and they split on **word size**, not per-ISA: `internal/oci/finished.go` (`linux && !arm && !386`) versus `internal/oci/finished_32.go` (`linux && (arm || 386)`), handling the 32-bit vs 64-bit width of `syscall.Stat_t.Ctim`. riscv64, being 64-bit, transparently falls into the 64-bit generic path via the negative constraint - not because anyone wrote riscv64-specific code, but because it was never excluded.
- The only `runtime.GOARCH` branch in non-test, non-vendor source is a single line in `internal/config/seccomp/seccomp.go`: `if runtime.GOARCH == "s390" || runtime.GOARCH == "s390x"`, adjusting a seccomp flags-table index for s390x's split clone/clone3 syscall ABI. No riscv64 branch exists, and riscv64 has never been exercised against this code path since no CI ever builds or runs CRI-O on riscv64.
- Sanity check confirming the code-search tooling itself works: `func main repo:cri-o/cri-o` -> 89 hits, `amd64 repo:cri-o/cri-o` -> 25 hits. The absence of riscv64 hits is a true negative, not a search failure.

Comparison table:

| Component | amd64 | arm64 | ppc64le | s390x | riscv64 |
|---|---|---|---|---|---|
| Per-arch source file (`_<arch>.go`) | none (generic) | none (generic) | none (generic) | none (generic) | none (does not exist) |
| `go:build` arch guard | generic 64-bit path | generic 64-bit path | generic 64-bit path | 1 guard (seccomp clone/clone3 index) | none |
| SIMD/vector code | none | none | none | none | none |
| Assembly | none | none | none | none | none |

CRI-O's only genuine architecture dependency is indirect, via its **cgo-based** vendored dependency `github.com/seccomp/libseccomp-golang` (`#cgo pkg-config: libseccomp`), which links the C `libseccomp` library at build time. A riscv64 build therefore requires a working cgo cross-toolchain plus a riscv64 `libseccomp` - the latter exists and is packaged for Ubuntu 26.04 riscv64 (see Section 9), but CRI-O's own build system provisions no riscv64 cgo cross-toolchain anywhere (see Section 5).

**Conclusion:** riscv64 is not a "stub" or "partial" implementation - it is completely absent from CRI-O's build/CI/release matrix, even though the pure-Go application code itself contains nothing that would specifically exclude riscv64 if the plumbing (CI, Nix cross-target, Containerfile toolchain case, cgo/libseccomp cross-build) were added.

## 5. Build System, Cross-Compilation, and Toolchain

CRI-O is a **Go project**, not CMake-based - it builds via a plain GNU `Makefile` invoking `go build`, plus an optional Nix flake for fully static release binaries. No `CMakeLists.txt`, `cmake/` directory, or `.cmake` toolchain files exist anywhere outside `vendor/`.

**Standard source build** (`install.md`): `make && sudo make install`, with a `BUILDTAGS` list controlling optional features (seccomp/selinux/apparmor, `containers_image_openpgp`, `containers_image_ostree_stub`, `exclude_graphdriver_btrfs`, `btrfs_noversion`, `exclude_graphdriver_overlay`, `ostree`). No architecture-specific build instructions exist.

**Cross-compilation** (`Makefile`, `local-cross` target): `CROSS_BUILD_TARGETS := bin/crio.cross.windows.amd64 bin/crio.cross.darwin.amd64 bin/crio.cross.linux.amd64` - only these three GOOS/GOARCH pairs are defined. The underlying pattern rule (`bin/crio.cross.%`) is generic (`GOOS=... GOARCH=... go build ...`), so `make bin/crio.cross.linux.riscv64` could technically be invoked since Go's own toolchain supports `linux/riscv64` as a GOARCH - but this target is not defined, tested, or documented by the project.

**Static release build** (`flake.nix`, Nix): `supportedSystems = [ "x86_64-linux" "aarch64-linux" ]`; `crossTargets` = `amd64`, `arm64`, `ppc64le`, `s390x`. No riscv64 cross target exists in the Nix flake used to produce the official static release binaries.

**Development container image** (`hack/Containerfile.dev`, the project's only Dockerfile-equivalent): pins **Go 1.26.4** and hard-codes a `case "${TARGETARCH}"` block with SHA256 checksums per architecture, with an explicit `*) exit 1` fallback for any unrecognized value. **A riscv64 build via this Containerfile fails explicitly.**

**Toolchain version rationale:** the only documented toolchain constraint is the Go compiler version (1.26.4 in the dev Containerfile, tracked via `go.mod`/`GOVERSION`), applied uniformly across architectures - no per-architecture minimum version is documented for any target, riscv64 included.

**QEMU usage:** none documented anywhere in the build system. CRI-O's existing cross-architecture CI (ppc64le, s390x via `test.yml`) uses **Nix cross-compilation**, not QEMU emulation.

**Known build failures:** the `hack/Containerfile.dev` `exit 1` fallback for unrecognized `TARGETARCH` is a confirmed, explicit build failure for riscv64. No other riscv64 build-failure report exists because no riscv64 build has ever been attempted in CI or documented elsewhere.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles from source (`go build`) | yes (CI-verified) | yes (CI-verified) | untested - no build target defined, no CI |
| Passes CRI-O's own test suite | yes | yes | never run |
| Official static/release binary | yes | yes | no |
| Dev-container build (`hack/Containerfile.dev`) | yes | yes | fails (`exit 1` in TARGETARCH case) |
| Seccomp sandboxing (via cgo `libseccomp`) | yes | yes | untested - riscv64 `libseccomp` C library exists upstream, but no cgo cross-toolchain is provisioned in CRI-O's build system |
| Kata Containers (VM-isolated) runtime handler | yes | yes | not available - kata-containers has 5 open riscv64-enablement issues, none merged (see Section 9) |
| Checkpoint/restore (via CRIU) | yes | yes | unverified - Ubuntu ships a riscv64 CRIU binary, but upstream tracking issue `checkpoint-restore/criu#1702` has been open since 2021 |

**Functional gaps:** CRI-O cannot currently run at all on riscv64 - there is no build path that produces a working binary without a user first adding their own CI/Makefile/Containerfile plumbing. This is a total functional gap, not a partial one.

**Performance gaps:** not applicable - CRI-O contains no SIMD/vectorized code on any architecture (Section 4), so there is no missing-SIMD performance delta to measure.

**Security hardening gaps:** seccomp filtering is CRI-O's primary sandboxing mechanism and depends on the cgo-linked `libseccomp` C library and its Go bindings. The C library has riscv64 support merged upstream and packaged in Ubuntu 26.04, but the Go-bindings distro package (`golang-github-seccomp-libseccomp-golang-dev`) is only built for amd64/arm64 in Ubuntu 26.04 - a packaging gap rather than an upstream code gap (see Section 9).

**NaN / floating-point semantics issues:** not applicable - CRI-O is an orchestration daemon with no floating-point-sensitive numerics. No related issues were found.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? No.** Verified by direct read of all 10 workflow files in `.github/workflows/`: `integration.yml`, `nixpkgs.yml`, `osff.yml`, `patch-release.yml`, `release-branch-forward.yml`, `scorecards.yml`, `stale.yml`, `tag-reconciler.yml`, `test.yml`, `verify.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in CRI-O's own repository (the only `.cirrus.yml` in the checkout is inside `vendor/github.com/godbus/dbus/v5/`, a third-party dependency).

`integration.yml` build matrix (verified by direct read):
```yaml
matrix:
  run:
    - runner: ubuntu-latest
      arch: amd64
    - runner: ubuntu-24.04-arm
      arch: arm64
```

`test.yml` "build static" job matrix (verified by direct read): `amd64`, `arm64`, `ppc64le`, `s390x`, each built via `nix build .#crio-${arch}` cross-compilation on `runs-on: ubuntu-latest`; the "unit" test matrix in the same file covers only `amd64` and `arm64`.

Repo-wide grep confirms zero riscv64 references in CI config: `grep -rni "riscv" .github/workflows/` -> no matches. GitHub code search corroborates independently: `"riscv repo:cri-o/cri-o path:.github/workflows"` -> 0 results.

**RISE runners?** Not adopted. Issue [#9873](https://github.com/cri-o/cri-o/issues/9873) proposed exactly this (adding `runs-on: ubuntu-24.04-riscv` / `ubuntu-26.04-riscv` via the `rise-risc-v-runners` GitHub App), and the RISE-side infrastructure was already available at the time of filing (per the [RISE runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). No CRI-O maintainer ever engaged with the request; it was auto-closed as stale.

**Hardware used:** none, for riscv64 - there is no riscv64 CI job of any kind.

Comparison table:

| | amd64 | arm64 | ppc64le | s390x | riscv64 |
|---|---|---|---|---|---|
| CI build job | yes (native runner) | yes (native runner + Nix cross) | yes (Nix cross-build only) | yes (Nix cross-build only) | no |
| CI test execution | yes | yes | no (build-only) | no (build-only) | no |
| RISE runner adoption | N/A | N/A | N/A | N/A | requested (#9873), not adopted |

## 8. Distribution and Release Status

**Official GitHub release binaries:** checked the 10 most recent releases (v1.36.5, v1.35.8, v1.34.13, v1.36.4, v1.35.7, v1.34.12, v1.36.3, v1.35.6, v1.34.11, v1.36.2) at [github.com/cri-o/cri-o/releases](https://github.com/cri-o/cri-o/releases). Asset pattern per release: `cri-o.amd64.vX.tar.gz`, `cri-o.arm64.vX.tar.gz`, `cri-o.ppc64le.vX.tar.gz`, `cri-o.s390x.vX.tar.gz`. **No release contains a riscv64 asset.**

**PyPI:** not applicable / confirmed absent. `https://pypi.org/pypi/cri-o/json` returns **HTTP 404** (expected - CRI-O is a Go binary, not a Python package).

**Ubuntu 26.04 ("resolute"):** CRI-O is **not packaged at all**, for any architecture. Confirmed via a project-graph SPARQL query (0 bindings) and a direct package lookup, [packages.ubuntu.com/resolute/cri-o](https://packages.ubuntu.com/resolute/cri-o): **"No such package."** CRI-O ships via its own community APT/YUM repositories rather than distro archives.

**Arch Linux RISC-V (unofficial repo):** [archriscv.felixc.at](https://archriscv.felixc.at/?q=cri-o) returns no results for `cri-o`.

**What must a user do to get a working binary on riscv64 today?** There is no path. No upstream release asset, no distro package (on any architecture), and no defined build target that succeeds. A user would need to author their own build tooling from scratch: add a Makefile/Nix cross-target, provision a riscv64 cgo toolchain for the `libseccomp` binding, and validate the result manually, since no upstream CI would ever exercise such a build.

## 9. Dependencies

Dependency table (from `go.mod`, HEAD `e858b76f`), cross-checked against Ubuntu 26.04 ("resolute") and each dependency's GitHub issue tracker:

| Dependency | Role in CRI-O | riscv64 build | riscv64 test | riscv64 release | Community / blocking issues |
|---|---|---|---|---|---|
| [runc](https://github.com/opencontainers/runc) | OCI runtime | yes - Ubuntu 26.04 riscv64 | riscv64 added to CI, [#5166](https://github.com/opencontainers/runc/issues/5166) closed 2026-03-12 | yes - riscv64 release artifacts | None open |
| [containerd](https://github.com/containerd/containerd) | Image pull/unpack, shim management | yes - Ubuntu 26.04 riscv64 | **not** in official CI test matrix - [#13020](https://github.com/containerd/containerd/issues/13020) open since 2026-03-12 | untested/unverified | #13020 open - coverage gap |
| [CRIU](https://github.com/checkpoint-restore/criu) / go-criu | Checkpoint/restore | `criu` found in Ubuntu 26.04 riscv64; Go bindings only amd64/arm64 | upstream [#1702](https://github.com/checkpoint-restore/criu/issues/1702) open since 2021-12-18 | Ubuntu ships riscv64 binary, best-effort/unverified upstream | #1702 open since 2021 |
| [libseccomp](https://github.com/seccomp/libseccomp) (C) + libseccomp-golang | Syscall filtering | C lib in Ubuntu 26.04 riscv64; Go-binding package only amd64/arm64 | riscv64 support merged/released since ~2020-2021 | Packaging gap only, not a code gap | Packaging gap only |
| [conmon](https://github.com/containers/conmon) | Per-container monitor | found in Ubuntu 26.04 riscv64 | no riscv64-specific issues | appears built/available | None found |
| [conmon-rs](https://github.com/containers/conmon-rs) | Rust rewrite of conmon | not distro-packaged (cargo/GitHub release only) | no riscv64-specific issues | unconfirmed riscv64gc coverage | Unconfirmed |
| [kata-containers](https://github.com/kata-containers/kata-containers) | Optional VM-isolated runtime | govmm binding only amd64/arm64 | 5 open issues: [#9284](https://github.com/kata-containers/kata-containers/issues/9284), [#10532](https://github.com/kata-containers/kata-containers/issues/10532), [#10226](https://github.com/kata-containers/kata-containers/issues/10226), [#11415](https://github.com/kata-containers/kata-containers/issues/11415), [#10538](https://github.com/kata-containers/kata-containers/issues/10538) | not released for riscv64 | **Largest gap among CRI-O's deps** |
| [klauspost/compress](https://github.com/klauspost/compress) | Compression (SIMD on amd64/some arm64) | distro package only amd64/arm64; pure-Go fallback works | no riscv64-specific issues | works via fallback, no SIMD speedup | None open |
| [cloudflare/circl](https://github.com/cloudflare/circl) | Crypto (transitive) | distro package only amd64/arm64; generic fallback | no riscv64-specific issues | unconfirmed validation | None found |
| [tetratelabs/wazero](https://github.com/tetratelabs/wazero) (indirect) | WASM runtime, JIT only amd64/arm64 | distro package only amd64/arm64 | search tool returned persistent 422 error - unconfirmed | interpreter fallback works, no JIT | Unconfirmed (tooling limitation) |
| [containers/ocicrypt](https://github.com/containers/ocicrypt) | Encrypted-image support | distro package only amd64/arm64; portable Go | no riscv64-specific issues | packaging gap only | None found |
| golang.org/x/crypto (indirect) | Core crypto primitives | distro package only amd64/arm64; generic fallback | no riscv64-specific issues | packaging gap only | None found |
| [mattn/go-sqlite3](https://github.com/mattn/go-sqlite3) (cgo) | Local storage/metadata | found in Ubuntu 26.04 riscv64 | no riscv64-specific issues | ships in Ubuntu 26.04 riscv64 | None found |
| ulikunitz/xz (pure Go) | Image-layer decompression | architecture-agnostic; reference C impl in Ubuntu 26.04 riscv64 | no riscv64-specific issues | works on riscv64 | None found |

**Deep-dive - the two dependencies with genuine architecture-specific risk:**

1. **kata-containers.** The only dependency with active, unresolved, multi-part upstream RISC-V engineering work (runtime, runtime-rs, dragonball VMM, plus a dedicated "VITAMIN-V" onboarding effort). If a riscv64 CRI-O deployment requires the Kata runtime handler, it is not available today.
2. **CRIU / go-criu.** Performs architecture-specific register and parasite-injection work. Ubuntu packages a riscv64 `criu` binary, but the upstream tracking issue has sat open since 2021 - checkpoint/restore correctness on riscv64 should be treated as unverified, not upstream-endorsed.

**Summary:** core execution dependencies (runc, libseccomp C library, conmon, go-sqlite3, xz) are in good shape on riscv64. Remaining gaps split into (a) an Ubuntu Go-module dev-package packaging lag affecting distro-style CRI-O packaging (not `go build` module-mode builds), and (b) genuine unresolved upstream code gaps in kata-containers and, with lower confidence, CRIU.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#9873](https://github.com/cri-o/cri-o/issues/9873) | Provide native RISC-V builds | Closed (`not_planned`, auto-closed by stale bot 2026-08-07) | Feature request, not a bug | Opened 2026-04-08 by brianredbeard (RISE-affiliated, non-maintainer). No maintainer ever engaged. |

**Correctness bugs:** none found. An explicit search (`riscv is:open repo:cri-o/cri-o`) returned **0 results** - there are no open RISC-V correctness bugs, performance bugs, or floating-point/NaN issues, consistent with the fact that no riscv64 build or test has ever run.

**Benchmark data:** essentially absent for CRI-O specifically. No CRI-O-specific riscv64 benchmark was found via web search or on riseproject.dev. The one tangential figure found is from an unaffiliated academic paper, "[On the Containerization and Orchestration of RISC-V architectures for Edge-Cloud computing](https://dl.acm.org/doi/10.1145/3624486.3624490)" (ACM, 2023), which ran KubeEdge + EdgeMesh + CRI-O together on a SiFive-based "Monte Cimone" cluster and reported a combined memory footprint near 250 MB across all three components - not CRI-O-isolated, not RISE-published, primary source returned HTTP 403 (search-snippet data only) - **[NEEDS VERIFICATION]**.

## 12. Objections and Upstream Blockers

**Stated objections:** none. No CRI-O maintainer has ever stated an objection to riscv64 support. Issue #9873 contains no maintainer comment before its stale-bot closure.

**Technical blockers:** no riscv64 target in `flake.nix` or `Makefile`; `hack/Containerfile.dev` hard-fails on unrecognized `TARGETARCH`; the cgo-linked `libseccomp-golang` dependency needs a riscv64 cgo cross-toolchain CRI-O's build system does not provision; downstream, kata-containers has no riscv64 support landed and CRIU's tracking issue remains open since 2021. None of these are hard blockers in principle (Section 4 found nothing riscv64-excluding in the application code itself), but each is unaddressed plumbing.

**Organizational blockers:** the practical blocker is **absence of maintainer attention**, not resistance. RISE's enabling work (hosted native riscv64 GitHub Actions runners) was already complete at the time #9873 was filed; the only remaining step was a CRI-O maintainer adding a workflow job, which never happened before the issue went stale.

**Acceptance probability:** [NEEDS VERIFICATION] - no maintainer sentiment is on record either way. The project's historical pattern of picking up other architecture-support requests (s390x, arm64/armv7l) suggests a well-scoped PR with a working CI job would have a real chance, but this is inference from process pattern, not a documented maintainer statement.

## 13. Readiness Assessment

- **Color:** orange (base case: no upstream riscv64 CI, no riscv64 release artifact, no distribution floor available since CRI-O is not packaged in any Linux distribution at all)
- **Release provider:** none
- Not an optimization-purpose project (no JIT, SIMD, or numerics-driven value proposition) - the Step 2 optimization modifier and Optimization level header field do not apply.
- **Justification:** CRI-O's CI architecture matrices, verified by direct read of all 10 `.github/workflows/*.yml` files, cover only amd64, arm64, ppc64le, and s390x - there is no riscv64 build job, test job, or matrix entry anywhere ([test.yml](https://github.com/cri-o/cri-o/blob/main/.github/workflows/test.yml), [integration.yml](https://github.com/cri-o/cri-o/blob/main/.github/workflows/integration.yml)). No riscv64 asset appears in any of the last 10 GitHub releases, and CRI-O is not packaged in any Linux distribution at all (confirmed absent from Ubuntu 26.04 via both a project-graph query and a direct package lookup), so the distribution floor that would otherwise lift an unpatched build to yellow cannot apply. This is a clean "no upstream CI, no release, no distro package" case; there is no evidence of confirmed breakage that would justify red - riscv64 is simply unaddressed, not broken.
- **Pending work that could change the grade:** issue [#9873](https://github.com/cri-o/cri-o/issues/9873) already identifies the lowest-effort path to at least a yellow/blue grade - adopting RISE's free native riscv64 GitHub Actions runners via a small workflow addition - but it was closed as `not_planned`/stale with zero maintainer engagement, and no replacement issue or PR has been filed since. RISE has no CRI-O project, no blog coverage, and no GitHub repo dedicated to CRI-O in the `riseproject-dev` org - there is no active RISE-funded or RISE-driven effort that would move this grade today. Progress in CRI-O's own dependency chain (runc riscv64 CI/release already landed; containerd riscv64 builds exist but await CI-matrix inclusion per [#13020](https://github.com/containerd/containerd/issues/13020)) reduces downstream rework a future port would need, but does not itself change CRI-O's grade.

## 14. Investment Analysis

**RISE involvement check:** RISE has done no work specific to CRI-O - confirmed by checking all 34 RISE blog posts, the `riseproject-dev` GitHub org (no CRI-O repo, org-scoped search returns 0 results), and the RISE Python wheel-builder listing (not applicable - CRI-O is a Go binary). The only RISE-adjacent fact is that issue #9873's author is RISE-affiliated and RISE's native-runner infrastructure already exists. No sizing below assumes any of this work is already done.

### 14.1 Functional Enablement

Add a `linux.riscv64` cross-build target to the `Makefile`; add a `riscv64` entry to `flake.nix`'s `crossTargets`; add a riscv64 case to `hack/Containerfile.dev`'s `TARGETARCH` table (pinning a verified Go 1.26.4 linux-riscv64 checksum); provision a riscv64 cgo cross-toolchain for the `libseccomp-golang` binding (the C library is already available in Ubuntu 26.04 riscv64); validate the resulting binary manually.

### 14.2 Performance Optimization

Not applicable - CRI-O has no architecture-specific hot paths, SIMD code, or numerics (Section 4).

### 14.3 CI/CD Infrastructure

Lowest-effort, highest-leverage item: adopt RISE's already-available native riscv64 GitHub Actions runners as proposed in [#9873](https://github.com/cri-o/cri-o/issues/9873), adding a build (and ideally test) job mirroring the existing arm64/ppc64le/s390x matrix entries. This is the single action most likely to change CRI-O's readiness color.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's scoping rule. CRI-O has no dependent package ecosystem analogous to Python/npm/Maven; its own upstream dependency chain is covered in Section 9.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to Makefile cross-build targets, flake.nix cross targets, and hack/Containerfile.dev TARGETARCH case | 1-2 | Upstream CRI-O maintainer or external contributor PR | Critical |
| Functional | Provision riscv64 cgo cross-toolchain for libseccomp-golang binding | 1-2 | Upstream CRI-O maintainer or external contributor PR | High |
| CI/CD | Adopt RISE native riscv64 runners in a build (and test) CI job, reviving #9873 | 1 | Upstream CRI-O maintainer, RISE-assisted | Critical |
| Functional (dependency) | Track containerd riscv64 CI-matrix inclusion (#13020) | outside CRI-O's scope; monitor only | containerd upstream | Medium |
| Functional (dependency, optional) | Track kata-containers riscv64 enablement (5 open issues) if VM-isolated runtime is required | outside CRI-O's scope; monitor only | kata-containers upstream | Low |
| Distribution | Publish riscv64 release binaries once CI exists | 1 (mostly automated once CI/Nix targets exist) | Upstream CRI-O maintainer | High |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [CRI-O repository](https://github.com/cri-o/cri-o)
- [CRI-O homepage](https://cri-o.io/)
- [Issue #9873 - Provide native RISC-V builds](https://github.com/cri-o/cri-o/issues/9873)
- [CRI-O .github/workflows/integration.yml](https://github.com/cri-o/cri-o/blob/main/.github/workflows/integration.yml)
- [CRI-O .github/workflows/test.yml](https://github.com/cri-o/cri-o/blob/main/.github/workflows/test.yml)
- [CRI-O GitHub Releases](https://github.com/cri-o/cri-o/releases)
- [Ubuntu 26.04 (resolute) package lookup for cri-o](https://packages.ubuntu.com/resolute/cri-o)
- [Arch Linux RISC-V unofficial repo search](https://archriscv.felixc.at/?q=cri-o)
- [PyPI JSON API for cri-o (404)](https://pypi.org/pypi/cri-o/json)
- [opencontainers/runc issue #5166](https://github.com/opencontainers/runc/issues/5166)
- [containerd/containerd issue #13020](https://github.com/containerd/containerd/issues/13020)
- [checkpoint-restore/criu issue #1702](https://github.com/checkpoint-restore/criu/issues/1702)
- [kata-containers issue #9284](https://github.com/kata-containers/kata-containers/issues/9284)
- [kata-containers issue #10532](https://github.com/kata-containers/kata-containers/issues/10532)
- [kata-containers issue #10226](https://github.com/kata-containers/kata-containers/issues/10226)
- [kata-containers issue #11415](https://github.com/kata-containers/kata-containers/issues/11415)
- [kata-containers issue #10538](https://github.com/kata-containers/kata-containers/issues/10538)
- [RISE Project - Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project blog](https://riseproject.dev/blog)
- ["On the Containerization and Orchestration of RISC-V architectures for Edge-Cloud computing", ACM 2023](https://dl.acm.org/doi/10.1145/3624486.3624490) - [NEEDS VERIFICATION], primary source returned HTTP 403, figures are from search-snippet summaries only
- CRI-O GOVERNANCE.md, MAINTAINERS.md, OWNERS_ALIASES (via local clone, HEAD `e858b76fc08fcb7c54ce9279dcccf31eda92c265`)
