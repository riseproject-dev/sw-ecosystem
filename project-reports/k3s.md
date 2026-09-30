---
title: k3s
parent: Project Reports
color: orange
dependencies:
  - name: Kubernetes
    relation: runtime-dependency
    criticality: critical
  - name: containerd
    relation: runtime-dependency
    criticality: optional
  - name: runc
    relation: runtime-dependency
    criticality: optional
  - name: etcd
    relation: runtime-dependency
    criticality: critical
  - name: kine
    relation: runtime-dependency
    criticality: optional
  - name: flannel
    relation: runtime-dependency
    criticality: optional
  - name: CNI plugins
    relation: runtime-dependency
    criticality: optional
  - name: CoreDNS
    relation: runtime-dependency
    criticality: optional
  - name: Traefik
    relation: runtime-dependency
    criticality: critical
  - name: local-path-provisioner
    relation: runtime-dependency
    criticality: critical
  - name: Helm
    relation: runtime-dependency
    criticality: optional
  - name: klipper-helm
    relation: runtime-dependency
    criticality: optional
  - name: klipper-lb
    relation: runtime-dependency
    criticality: optional
  - name: libseccomp
    relation: runtime-dependency
    criticality: critical
  - name: AppArmor
    relation: runtime-dependency
    criticality: optional
  - name: SQLite
    relation: runtime-dependency
    criticality: optional
  - name: musl
    relation: runtime-dependency
    criticality: optional
  - name: k3s-root
    relation: runtime-dependency
    criticality: critical
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Docker
    relation: build-dependency
    criticality: critical
  - name: Buildx
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="k3s" %}

# k3s

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for k3s<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

k3s is a lightweight, CNCF Sandbox-level Kubernetes distribution originally created by Rancher Labs and now maintained by SUSE (which acquired Rancher). It packages an embedded Kubernetes control plane, a container runtime (containerd by default), etcd or an etcd-shim (kine), flannel, CoreDNS, Traefik, and a local storage provisioner into a single statically linked binary under 100 MB. Its primary use cases are edge computing, IoT, and resource-constrained environments, which makes RISC-V hardware an architecturally relevant target.

The project is licensed Apache-2.0. Governance is documented in `MAINTAINERS` and `GOVERNANCE.md` and is administered by a Maintainer Council under CNCF Technical Oversight Committee (TOC) oversight, operating by "lazy consensus" with escalation to simple-majority or (for maintainer changes/charter changes) supermajority votes. GOVERNANCE.md states explicitly: "Community over Product or Company: Sustaining and growing our community takes priority over shipping code or sponsors' organizational goals." Major changes require an ADR-style proposal in `docs/adrs/`.

Every listed maintainer in the `MAINTAINERS` file uses a `@suse.com` email address (brandond, briandowns, brooksn, caroline-suse-rancher, cwayne18, dereknola, galal-hussein, manuelbuil, matttrach, mdrahman-suse, Oats87, rancher-max, rbrtbnfgl, ShylajaDevadiga, thomasferrandiz, VestigeJ) except community management, which is split between OrlinVasilev (SAP) and robertsirc (SUSE). `CODEOWNERS` is a single blanket entry, `* @k3s-io/k3s-dev`. Top contributors by commit volume over the last ~1,040 commits (git shortlog, roughly Apr 2025-Sep 2026) are Brad Davidson (420, SUSE), Derek Nola (184, SUSE), dependabot[bot] (70), Rafael/rafaelbreno (48, affiliation not confirmed), github-actions[bot] (44), Manuel Buil (29, SUSE), Michael Fritch (29, SUSE), Vitor Savian (27, SUSE). The active human contributor base is essentially entirely SUSE-employed. This concentration matters for RISC-V: architecture-enablement decisions that touch Rancher/SUSE-owned container image infrastructure (pause image, systemd-node image) are gated on internal SUSE engineering priority, not purely on external contribution volume.

k3s officially releases binaries and container images for three architectures: amd64, arm64, and arm/armhf (ARMv7). The install script and README additionally reference s390x support in some contexts, but riscv64 is not present in any official release asset, and the README's "Requirements" documentation still lists only x86_64, armhf, arm64, and s390x as supported architectures. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists in the repository, so there is no written architecture-tiering policy distinguishing riscv64 from the supported set.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-08-22 | [Issue #6022](https://github.com/k3s-io/k3s/issues/6022): community user reports running a custom-compiled riscv64 k3s v1.21.11 under QEMU, hits an HTTP 403 on metrics-server scraping. First documented riscv64 usage. Closed, no public root cause; attributed to RBAC misconfiguration in the custom setup, not an upstream bug. | [#6022](https://github.com/k3s-io/k3s/issues/6022) |
| 2023-03-27 | [Issue #7151](https://github.com/k3s-io/k3s/issues/7151) opened requesting official riscv64 support. Maintainer brandond repurposes it as the tracking issue: "This has not been prioritized, and we don't have any build infra for riscv64, so at the moment this will be purely experimental." | [#7151](https://github.com/k3s-io/k3s/issues/7151) |
| 2023-05-12 | brandond: "we don't have any hardware for CI or QA so we probably won't have official support any time soon." | [#7151](https://github.com/k3s-io/k3s/issues/7151) |
| 2023-06-14 | [PR #7778](https://github.com/k3s-io/k3s/pull/7778) opened by Antony Chazapis (CARV-ICS-FORTH): riscv64 cross-compilation support for the (then-current) Dapper build environment. No k3s runtime code changes. | [#7778](https://github.com/k3s-io/k3s/pull/7778) |
| 2023-09-11 | brandond tests PR #7778's build on a three-node SiFive HiFive Unmatched cluster (openSUSE Tumbleweed, kernel 6.4.12, k3s v1.28.1+k3s1). Nodes reach Ready with label `kubernetes.io/arch=riscv64`. No workload pods run: "I just can't run anything on it because none of our images currently support riscv64." | [#7778](https://github.com/k3s-io/k3s/pull/7778) |
| 2024-04-03 | [PR #9719](https://github.com/k3s-io/k3s/pull/9719) "Bump libp2p for riscv support" merged (approved by brandond and cwayne18). First release containing it, confirmed by diffing `go.mod` across tags, is **v1.29.4+k3s1** (released 2024-04-25). | [#9719](https://github.com/k3s-io/k3s/pull/9719) |
| 2025-04-25 | Commit `3ce4a635` "Build k3s overhaul (#12200)" by Derek Nola (SUSE) merges, adding "emulation builds to k3s-build.yaml (for arm32 and future riscv64)" - explicitly framed as prep for a not-yet-supported architecture, not enablement itself. | commit `3ce4a635` |
| 2025-06-27 | [Issue #12556](https://github.com/k3s-io/k3s/issues/12556): external "RAX" porting-complexity tool rates k3s "low difficulty" to port (cyclomatic complexity 8,261). Closed same day as a research-validation request, not a real bug report; got no maintainer technical response. | [#12556](https://github.com/k3s-io/k3s/issues/12556) |
| 2026-01-18 | pgonin notes in #7151: "The CNCF does not provide RISC-V build runners as part of its 'standard' service to projects." | [#7151](https://github.com/k3s-io/k3s/issues/7151) |
| 2026-03-24 | Draft [PR #13854](https://github.com/k3s-io/k3s/pull/13854) "[Experiment] Add CI on linux-riscv64" opened by luhenry: GitHub Actions CI using RISE RISC-V Runners (native hardware, not QEMU). No source changes. Remains open/draft as of this report. | [#13854](https://github.com/k3s-io/k3s/pull/13854) |
| 2026-03-26 | luhenry classifies 15 riscv64-only CI failures in PR #13854's own run into 5 buckets (missing Docker images: 7 jobs; missing k3s release images: 2; missing multi-arch manifest entries: 4; Nix installer action lacking a RISCV64-Linux platform mapping: 1; test-setup bug: 1). Quantifies riscv64 as ~10-11x slower than arm64 across the board (median per-package 10.2x); one specific CI run (`luhenry/k3s` Actions run 23554260675, 2026-03-25) shows build-riscv64 52m41s vs build-arm64 6m23s (8.2x) and build-amd64 8m18s (6.4x). | [#13854](https://github.com/k3s-io/k3s/pull/13854) |
| 2026-04-11 | [Issue #13910](https://github.com/k3s-io/k3s/issues/13910) opened by pgonin: proposes installing the RISE RISC-V Runners GitHub App on the k3s-io org, a prerequisite for #13854. | [#13910](https://github.com/k3s-io/k3s/issues/13910) |
| 2026-04-17 | luhenry traces the Nix CI failure to a bug in `nix-installer-action` (missing RISCV64-Linux platform entry), not Nix/nixpkgs itself, after pushback from twz123. | [#13854](https://github.com/k3s-io/k3s/pull/13854) |
| 2026-04-28 | luhenry: "after meeting with @caniszczyk last week, we have the go ahead from the CNCF to engage with maintainers... builds are working but are taking too long." CNCF sign-off to proceed obtained; build-speed remains the blocker. | [#13854](https://github.com/k3s-io/k3s/pull/13854) |
| 2026-06-05 | luhenry: faster RISC-V hardware (Scaleway EM-RV1 class) being provisioned via agreements with Spacemit, Scaleway, Canonical, and RISE; expected online "end-of-July." [NEEDS VERIFICATION - completion not independently confirmed] | [#13910](https://github.com/k3s-io/k3s/issues/13910) |
| 2026-07-21 | Hardware-readiness deadline slips to "end-of-August" per luhenry. | [#13910](https://github.com/k3s-io/k3s/issues/13910) |
| 2026-08-10 | [PR #7778](https://github.com/k3s-io/k3s/pull/7778) closed by chazapis as obsolete ("K3s is not using Dapper anymore"). Notes: "it looks like somewhere during the transition to buildx, riscv64 has been added to the Makefile and I have successfully built the latest K3s version (v1.36.3+k3s1) in a RISC-V VM." Directs further discussion to #7151. | [#7778](https://github.com/k3s-io/k3s/pull/7778) |
| 2026-08-17 - 2026-09-01 | [PR #14529](https://github.com/k3s-io/k3s/pull/14529) "Enable seccomp in riscv64 builds" (author Antony Chazapis/FORTH, merged by Brad Davidson 2026-09-01). External contributor closes a functional gap, over a year after CI/build groundwork was laid by a SUSE maintainer. | [#14529](https://github.com/k3s-io/k3s/pull/14529) |
| 2026-09-18 | [#14641](https://github.com/k3s-io/k3s/issues/14641)-[#14644](https://github.com/k3s-io/k3s/issues/14644), four release-branch-specific clones of tracking issue #7151 (for releases 1.34-1.37), are opened and closed the same day without any linked merge. | [#14641](https://github.com/k3s-io/k3s/issues/14641)-[#14644](https://github.com/k3s-io/k3s/issues/14644) |
| 2026-09-20 | [Issue #13910](https://github.com/k3s-io/k3s/issues/13910) closed "not planned." | [#13910](https://github.com/k3s-io/k3s/issues/13910) |
| 2026-09-23 - 2026-09-24 | [PR #14688](https://github.com/k3s-io/k3s/pull/14688) "Add riscv64 release artifacts" opened by wangyf0611 (built and smoke-tested natively on an openRuyi RISC-V host, 74,449,058-byte binary), closed the next day by maintainer dereknola: "K3s remain 'not ready' for riscv64 releases. CI infra remains 10x slower for riscv64 builds, and associated support images (such as upstream k8s pause image) do not have a riscv64 version... We are not going to add another architecture as an official release until we have that support in place." | [#14688](https://github.com/k3s-io/k3s/pull/14688) |

**Discrepancy flag:** one research pass into this report's source material characterized 2026-09-18 as the date "riscv64 support for k3s was merged and backported... to release branches 1.34, 1.35, 1.36, and 1.37," inferring this from the closure of issues #14641-#14644. A second, more granular pass (direct issue-by-issue review) shows those four issues are backport-tracking clones of #7151 that were opened and closed the same day with no associated PR merge - they track intent, not completion. This is corroborated by the fact that the actual release-artifacts PR, #14688, was opened five days later and explicitly rejected by a maintainer on 2026-09-24 with the statement that k3s remains "not ready" for riscv64 releases. The correct reading is that riscv64 CI/build groundwork has progressed (Makefile, `scripts/version.sh`, seccomp support) but no riscv64 release or CI has landed as of this report's date.

Funding for the original CARV-ICS-FORTH build-script work (PR #7778) is attributed to EU Horizon Europe programs (RISER, AERO, REBECCA); this predates and is independent of RISE Project involvement. [NEEDS VERIFICATION]

## 3. Upstream Support Tier

k3s has no published formal architecture-tier or maturity policy. The implicit policy, stated repeatedly by maintainers, is that an architecture requires dedicated CI/QA hardware before inclusion in the release pipeline; as of 2026-09-24 that bar is explicitly unmet for riscv64 (dereknola, PR #14688).

| Architecture | Status |
|---|---|
| amd64 | Official, fully released |
| arm64 | Official, fully released |
| arm/armhf (ARMv7) | Official, fully released |
| s390x | Referenced in some installer/doc contexts; release-artifact status unclear [NEEDS VERIFICATION] |
| riscv64 | Build-tooling-supported (Makefile, Dockerfile, `scripts/version.sh`), no CI, no official release, explicitly rejected as a release target by a maintainer on 2026-09-24 |

The tracking issue [#7151](https://github.com/k3s-io/k3s/issues/7151) remains open with milestone "Backlog" as of its last recorded update (2026-08-17). "Purely experimental" (brandond's original 2023 framing) is still the accurate characterization as of this report.

## 4. Technical Architecture and RISC-V-Specific Subsystems

k3s is a pure Go application with no architecture-specific source code of its own. Exhaustive code search (queries for `riscv`, `vfloat32m1_t`, `rvv`, `riscv64`, `extension:S ... riscv`, `path:arch/riscv`, `RISCV64`, `Zbb`, `GOARCH riscv`) returns zero hits for RVV intrinsics, `.S` assembly files, any `arch/riscv/` directory, JIT backends, or ISA-extension-gated code paths. All riscv64/riscv matches converge on exactly three files, none of which contain architecture-specific *logic*, only build/CI plumbing that treats riscv64 as an opaque `GOOS/GOARCH` string:

1. `Makefile` - `linux/riscv64` is one entry in the `docker buildx build --platform` list for the local `multiarch-binary`/`release` targets.
2. `scripts/version.sh` - a `case ${ARCH}` block supplies a `K3S_ROOT_SHA256` checksum for the riscv64 k3s-root sysroot tarball.
3. `.github/workflows/build-k3s.yaml` - `riscv64` appears only inside a `runs-on:` conditional that excludes riscv64 from the ARM-runner branch of a ternary expression.

No `//go:build riscv64` constraints exist anywhere in the repository. There are no RVV, Zba, Zbb, Zkn, or Zvk optimizations planned or present, because k3s has no compute-intensive numerical or cryptographic kernels of its own - its crypto and compression work is delegated entirely to Go standard library packages and third-party Go modules (see Section 9).

Because k3s itself carries no architecture-specific code, the correctness risk surface for riscv64 lies one layer down, in the Go toolchain. [golang/go#64917](https://github.com/golang/go/issues/64917) documents that `uint32(math.NaN())` returns `4294967295` on riscv64 versus `0` on every other Go-supported architecture (reported against Go 1.21.5/linux-riscv64; related: `int64(NaN)` returns `MAXINT` on riscv64 versus `0` on arm64/loong64/wasm and `MININT` on amd64/s390x/ppc64). The issue is open, labeled `FrozenDueToAge`/`NeedsInvestigation`, not actively worked, and has caused a real-world test failure in the esbuild project. No riscv64-NaN-conversion failure has been reported against k3s specifically, but any Go code path in k3s (or its dependencies) that converts a NaN float to an integer is a latent, unverified correctness risk on this architecture.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Application logic | Pure Go, no arch-specific code | Pure Go, no arch-specific code | Pure Go, no arch-specific code |
| JIT/codegen | Go toolchain, mature | Go toolchain, mature | Go toolchain, present since Go 1.14 (experimental), first-class since Go 1.22 |
| SIMD/vector use in k3s itself | None | None | None (not applicable - no numeric kernels in k3s) |
| NaN-to-int conversion semantics | Standard (0) | Standard (0) | Diverges (returns max value); upstream Go bug [#64917](https://github.com/golang/go/issues/64917), open |

## 5. Build System, Cross-Compilation, and Toolchain

k3s has **no CMake build system** - this was verified exhaustively: `CMakeLists.txt`, `cmake/riscv64.cmake`, and any `cmake/` directory do not exist anywhere in the repository. The build is pure Go plus Docker Buildx (BuildKit), orchestrated by a single `Makefile` and one generic multi-stage `Dockerfile` (no per-architecture Dockerfile exists).

**Exact riscv64 build command** (from the `Makefile`'s `multiarch-binary`/`release` target):

```
docker buildx build \
    --platform linux/amd64,linux/arm64,linux/arm/v7,linux/riscv64,windows/amd64 \
    --build-arg "GIT_TAG=$GIT_TAG" \
    --build-arg "TREE_STATE=$TREE_STATE" \
    --build-arg "COMMIT=$COMMIT" \
    --build-arg "DIRTY=$DIRTY" \
    -f Dockerfile --target=multiarch-result --output type=local,dest=.,platform-split=false .
```

To build riscv64 alone, the same command is run with `--platform linux/riscv64`. This Makefile target is invoked manually/locally; it is **not** called from any GitHub Actions workflow - `release.yml` (the actual CI release pipeline) builds only `linux/amd64` and `linux/arm64,linux/arm/v7` via the separate `build-k3s.yaml` reusable workflow.

**Toolchain (from the live `Dockerfile`):**

| Layer | Tool/version | Why |
|---|---|---|
| Go | `golang:1.26.8-alpine3.24` (pinned `GOLANG` build-arg); go.mod requires Go 1.26.2 minimum | Base compiler/runtime |
| Cross-compile helper | `tonistiigi/xx:1.6.1` | Provides `xx-go`/`xx-apk`/`xx-cc` wrappers turning Alpine's `clang`+`lld` into a per-`$TARGETARCH` C cross toolchain |
| C compiler | Alpine's `clang lld`, plus (Linux targets) `xx-apk add gcc musl-dev linux-headers zlib-dev zlib-static libseccomp libseccomp-dev libseccomp-static sqlite-dev sqlite-static libselinux libselinux-dev btrfs-progs-dev btrfs-progs-static` | `CGO_ENABLED=1` is required because k3s links sqlite3, libseccomp, and selinux via cgo; pure Go cross-compilation alone is insufficient. No repo comment states a pinned minimum GCC version for this path. |
| Static linking | musl via Alpine + k3s-root's Buildroot toolchain (`BR2_TOOLCHAIN_BUILDROOT_MUSL=y`, GCC 14.3.0 for `riscv64-buildroot-linux-musl`) | `STATIC_BUILD=true` produces a statically linked binary |

Go build tags (`scripts/build`, identical across Linux architectures): `ctrd netcgo osusergo providerless urfave_cli_no_docs sqlite_omit_load_extension`, plus `apparmor seccomp` on Linux, plus `static_build libsqlite3` and `extldflags '-static -lm -ldl -lz -lpthread'` when `STATIC_BUILD=true`, plus `selinux` by default. `CGO_CFLAGS="-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_USE_ALLOCA=1"` is identical across architectures - no riscv64-specific flag exists.

**k3s-root (companion repo, `k3s-io/k3s-root`):** riscv64 support has existed since v0.13.0 ("Added RISC-V support"); the Buildroot config (`buildroot/riscv64config`) sets `BR2_riscv=y`, `BR2_RISCV_64=y`, `BR2_OPTIMIZE_S=y` (size optimization, `-Os`), `BR2_STATIC_LIBS=y`, no ISA-extension flags (no RVV, Zba, Zbb). `scripts/version.sh` in k3s master currently pins k3s-root **v0.15.2** with SHA256 `3b76a4a5bfc5c8623702a3b99e3015cd36b0336dd73c7ba4a765d018dc5a9685` for `k3s-root-riscv64.tar`, fetched from `https://github.com/k3s-io/k3s-root/releases/download/v0.15.2/k3s-root-riscv64.tar` and verified before unpacking. This is the one part of the build chain where riscv64 is treated identically to other architectures in an official release pipeline.

**QEMU usage:** none found anywhere in the k3s CI configuration. k3s builds riscv64 via cross-compilation (`GOARCH=riscv64` plus `xx`'s clang/lld cross toolchain), not QEMU emulation - consistent with `build-k3s.yaml`'s runner-selection logic, which routes any (hypothetical) riscv64 build to the x86 runner rather than QEMU-emulating on an ARM runner. The RISE-runner CI in draft PR #13854 by contrast uses **native riscv64 hardware** (Scaleway EM-RV1), not emulation either.

**Known build failures (from PR #13854's CI run):** `"no match for platform in manifest: not found"` for `rancher/mirrored-pause:3.6`; `"Unable to find image 'rancher/systemd-node:v0.0.8'"`; `"ArchOs (RISCV64-Linux) doesn't map to a supported Nix platform"` (traced to a `nix-installer-action` bug, not Nix/nixpkgs itself). Manual builds (not CI) succeed: chazapis built v1.36.3+k3s1 in a RISC-V VM (Aug 2026); a contributor built and smoke-tested a 74MB riscv64 binary natively on an openRuyi RISC-V host as part of PR #14688 (Sep 2026).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Official release binary | Yes | Yes | No | Never shipped; PR #14688 (add riscv64 release artifacts) explicitly rejected 2026-09-24 |
| Installer (`get.k3s.io` / `install.sh`) support | Yes | Yes | No | `setup_verify_arch()` has no `riscv64` case; the change exists only in unmerged PR #7778 |
| CI build coverage | Yes | Yes | No | No workflow on master passes `linux/riscv64` as a build platform; only a dead conditional fragment references the string |
| CI test coverage | Yes | Yes | No | Same as above; PR #13854 (RISE-runner CI) is unmerged draft |
| Default CRI (containerd) | Yes | Yes | Yes (upstream) | containerd ships riscv64 tarballs; no CI test-matrix entry ([containerd#13020](https://github.com/containerd/containerd/issues/13020), open) |
| Default CNI (flannel) | Yes | Yes | Best-effort | Upstream maintainers marked two riscv64 build-failure issues `wontfix` ([#1988](https://github.com/flannel-io/flannel/issues/1988), [#1853](https://github.com/flannel-io/flannel/issues/1853)) |
| Default ingress (Traefik) | Yes | Yes | Unconfirmed | Added to GoReleaser config in v2.10 (2023); a CI "no space left on device" failure removed riscv64 from the v2.10.4 release; v3.x status not independently reconfirmed in this research pass [NEEDS VERIFICATION] |
| Default storage class (local-path-provisioner) | Yes | Yes | Unconfirmed / contradictory | `rancher/local-path-provisioner` PR #346 closed abandoned (Sep 2024); a separate Oct 2024 comment claims Rancher began shipping the image independently - not reconciled by any source found [NEEDS VERIFICATION] |
| Pod sandbox (pause image) | Yes | Yes | No | `rancher/mirrored-pause:3.6` has no riscv64 manifest; confirmed blocking in PR #13854's CI run and cited explicitly by dereknola in the PR #14688 rejection |
| systemd-node image | Yes | Yes | No | `rancher/systemd-node:v0.0.8` has no riscv64 image; blocks 7 categories of integration tests in PR #13854 |
| klipper-helm / klipper-lb | Yes | Yes | No | Open PRs ([klipper-helm#64](https://github.com/k3s-io/klipper-helm/pull/64), [klipper-lb#56](https://github.com/k3s-io/klipper-lb/pull/56)), status not reconfirmed in this pass [NEEDS VERIFICATION] |
| Airgap bundle | Yes | Yes | No | Platform list in manifest/airgap scripts does not include riscv64 |
| Pod checkpoint/restore (CRIU) | Yes | Partial | No | [criu#1702](https://github.com/checkpoint-restore/criu/issues/1702), open since 2021; not a blocker for basic cluster operation |
| NaN-to-int float conversion | Standard | Standard | Diverges | [golang/go#64917](https://github.com/golang/go/issues/64917), open upstream Go bug; no k3s-specific failure reported |

The pause-image gap is the most operationally severe and the most decisively confirmed: dereknola's 2026-09-24 rejection of PR #14688 names it explicitly as a reason k3s "remain[s] 'not ready'" for riscv64. Without a riscv64 `rancher/mirrored-pause` manifest, no pod sandbox can be created, making a riscv64 k3s control plane that otherwise initializes correctly unable to schedule any user workload.

## 7. CI/CD Infrastructure

**No active riscv64 CI job exists on k3s-io/k3s master.** This was independently verified twice by direct inspection of every workflow file in `.github/workflows/` (one pass enumerated 19 files per the closed-PR record used for the readiness grade; a separate full listing of the directory enumerated 20: `actionlint.yaml, airgap.yaml, build-k3s.yaml, codeql.yml, e2e.yaml, epic.yaml, govulncheck.yml, install.yaml, integration.yaml, issue-filter.yaml, nightly-install.yaml, release.yml, scorecard.yml, stale.yml, trivy-scan.yml, trivy-trigger.yml, unitcoverage.yaml, updatecli.yaml, updatecli_k8s.yaml, validate.yaml` - the count discrepancy does not change the conclusion). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

The string "riscv" appears in exactly one file, one conditional:

```yaml
runs-on: ${{ (!contains(inputs.platforms, 'amd64') && !contains(inputs.platforms, 'windows/') && !contains(inputs.platforms, 'riscv64') && (github.repository_owner == 'k3s-io' && 'cncf-ubuntu-16-64-arm' || 'ubuntu-24.04-arm'))
  || (github.repository_owner == 'k3s-io' && 'cncf-ubuntu-16-64-x86' || 'ubuntu-24.04') }}
```

`build-k3s.yaml` is a reusable workflow (`on: workflow_call` only, no push/PR/schedule trigger of its own), called from `release.yml`, `e2e.yaml`, `install.yaml`, `integration.yaml`, and `nightly-install.yaml`. None of these callers ever passes `linux/riscv64` in the `platforms:` input anywhere on master; observed values are `linux/amd64`, `linux/arm64,linux/arm/v7`, `windows/amd64`, or the default `linux/amd64`. The riscv64 exclusion therefore guards a branch of the runner-selection ternary that is never reached - dead/latent logic, not an active CI path.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (`cncf-ubuntu-16-64-x86`) | Yes (`cncf-ubuntu-16-64-arm`) | No (only a dead runner-selection conditional) |
| Test CI (e2e/integration) | Yes | Yes | No |
| Native hardware runner | Standard CNCF-hosted x86 | Standard CNCF-hosted ARM | None on master; RISE Scaleway EM-RV1 hardware used only in the unmerged draft PR #13854 |
| CI cost multiplier vs arm64 | 1x | 1x | ~8-11x (measured in PR #13854's own runs) |

The only riscv64 CI that exists anywhere runs on a contributor's personal fork (`luhenry/k3s`) via the unmerged, unreviewed draft PR #13854, using RISE RISC-V Runners. Its own measurements: median per-package build slowdown 10.2x vs arm64; one specific run shows build-riscv64 52m41s vs build-arm64 6m23s (8.2x) and build-amd64 8m18s (6.4x); 15 riscv64-specific job failures against zero amd64/arm64 failures in the same run. The organizational prerequisite for turning this into real CI - installing the RISE RISC-V Runners GitHub App on the k3s-io org ([#13910](https://github.com/k3s-io/k3s/issues/13910)) - was closed "not planned" on 2026-09-20. The CNCF does not provide riscv64 build runners as part of its standard service to hosted projects (pgonin, Jan 2026).

## 8. Distribution and Release Status

**GitHub Releases (k3s-io/k3s):** every release checked (`v1.37.1+k3s1`, `v1.36.5+k3s1`, and the five most recent releases in the prior research pass) ships assets for amd64, arm64, and arm/armhf only: `k3s`, `k3s-arm64`, `k3s-armhf`, airgap image tarballs, `k3s-images.txt`, and `sha256sum-{amd64,arm,arm64}.txt`. No asset containing "riscv" or "riscv64" exists in any release. This is architecturally consistent with the `release.yml` workflow (Section 7), which never builds riscv64.

**Official installer (`get.k3s.io` / `install.sh`):** `setup_verify_arch()` recognizes `amd64/x86_64`, `arm64/aarch64`, `arm*`, and `s390x`. Any other architecture, including riscv64, triggers `fatal "Unsupported architecture $ARCH"` and the script aborts. The riscv64 case added in PR #7778 was never merged.

**Linux distribution packaging:** k3s is packaged by **no major Linux distribution for any architecture.** Ubuntu's "resolute" (26.04) suite returns "Sorry, your search gave no results" for a `k3s` package name search across all sections and architectures - confirmed directly against `packages.ubuntu.com`. Debian does not package it. Arch Linux's RISC-V port (`archriscv.felixc.at`) has no `k3s` entry. Because no distribution packages k3s at all, riscv64 packaging is moot rather than merely absent - there is no distribution floor of any kind to apply.

**Package registries:** k3s is distributed exclusively as a Go binary via GitHub Releases and the install script, not as a language-ecosystem package. `https://pypi.org/pypi/k3s/json` returns HTTP 404 (no PyPI project named `k3s` exists, for any architecture). The RISE GitLab wheel builder (`gitlab.com/riseproject/python/wheel_builder`) redirects to PyPI, which also 404s. There is no npm or Maven distribution path, consistent with k3s being a standalone Go binary, not a library.

**What a user must do today to get a working riscv64 k3s binary:** build from source using the (undocumented, unmerged-for-install.sh) manual build path `ARCH=riscv64 SKIP_VALIDATE=true SKIP_IMAGE=true SKIP_AIRGAP=true make`, or use a third-party/community fork. Confirmed working community/unofficial sources: `CARV-ICS-FORTH/kubernetes-riscv64` (patched fork with rebuilt images, cited in a Sept 2026 RISE/Kairos blog post as the basis for booting k3s on riscv64); forks `12345qwert123456/k3s.RISC-V`, `ioito/k3s`, `yunionio/k3s`; and `gounthar/docker-for-riscv64`, which runs weekly native riscv64 k3s builds. None of these are official k3s-io releases, and none were independently verified for correctness or currency in this research pass.

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build | riscv64 release/test | Blocking issues |
|---|---|---|---|---|---|
| Kubernetes | Embedded control plane / kubelet (k3s-io/kubernetes fork) | Critical | Buildable manually | No official riscv64 release | kube-cross image lacks a riscv64 cross-compiler; no riscv64 in `hack/lib/golang.sh` platform arrays; no official pause image (see below) |
| containerd | Default CRI, container lifecycle (k3s-io fork) | Optional (per given dependency list; operationally load-bearing since it is the default runtime) | Yes, builds clean, no patches needed | Yes - upstream containerd v2.3.2+ ships `containerd-*-linux-riscv64.tar.gz` | [containerd#13020](https://github.com/containerd/containerd/issues/13020) open: no riscv64 entry in the CI test matrix; CRIU checkpoint unavailable |
| runc | OCI low-level container runtime (opencontainers/runc) | Optional | Yes - riscv64 support merged in v1.1.8 via [PR #3905](https://github.com/opencontainers/runc/pull/3905) (2023) | Yes - riscv64 release binaries shipped since v1.1.8 | [#3950](https://github.com/opencontainers/runc/issues/3950), open: musl static build broken on riscv64. ([#5166](https://github.com/opencontainers/runc/pull/5166), "Add linux/riscv64 to CI and release artifacts," is closed/superseded - support already existed by the time it was filed.) |
| etcd | Embedded key-value store, control-plane datastore (k3s-io fork) | Critical | Yes, builds and runs on riscv64 | No upstream riscv64 release binary | [#21509](https://github.com/etcd-io/etcd/issues/21509) closed; [PR #21510](https://github.com/etcd-io/etcd/pull/21510) removed the `ETCD_UNSUPPORTED_ARCH=riscv64` startup gate (merged Mar 2026), but upstream etcd still ships no official riscv64 release binary. k3s mitigates by building etcd from its own fork source. |
| kine | etcd-shim datastore abstraction (SQLite/Postgres/MySQL backend) | Optional | Yes | Yes - multiplatform CI extended to riscv64 | [k3s-io/kine#296](https://github.com/k3s-io/kine/issues/296) closed, resolved by [PR #297](https://github.com/k3s-io/kine/pull/297) (~Feb 2025); CI coverage added in [PR #462](https://github.com/k3s-io/kine/pull/462) (~Apr 2025). No open blockers found. |
| flannel | Default CNI overlay (VXLAN/WireGuard) | Optional | Best-effort - riscv64 build added in [PR #1824](https://github.com/flannel-io/flannel/pull/1824) (2023) | Multi-arch images including riscv64 ship, but reliability is best-effort | [#1988](https://github.com/flannel-io/flannel/issues/1988) and [#1853](https://github.com/flannel-io/flannel/issues/1853), both closed **wontfix**. This is the single most concrete upstream "will not fix" data point in the whole dependency chain. |
| CNI plugins | Bridge/loopback/portmap binaries (containernetworking/plugins) | Optional | Yes | Yes - `cni-plugins-linux-riscv64-*.tgz` shipped, merged via [PR #739](https://github.com/containernetworking/plugins/pull/739) (2022) | None found |
| CoreDNS | Cluster DNS | Optional | Yes - [PR #6195](https://github.com/coredns/coredns/pull/6195) merged Jul 2023 | Yes - `coredns_*.linux_riscv64.tgz` ships in releases | None found |
| Traefik | Default ingress/reverse proxy | Critical | Yes - [PR #10026](https://github.com/traefik/traefik/pull/10026) merged Jul 2023 (v2.10) | Partial - added to GoReleaser at v2.10 but a CI "no space left on device" failure pulled riscv64 from the v2.10.4 release; v3.x status not reconfirmed | [NEEDS VERIFICATION] for current v3.x riscv64 artifact availability |
| local-path-provisioner | Default storage class (rancher/local-path-provisioner) | Critical | No confirmed current build | No | [PR #346](https://github.com/rancher/local-path-provisioner/pull/346) closed abandoned (Sep 2024); a separate, unreconciled Oct 2024 comment claims Rancher began shipping the image independently. Contradictory and unresolved - given this dependency's "critical" criticality, this is a standing hard gap for any riscv64 k3s deployment until clarified. |
| Helm | HelmChart CRD management (via helm-controller) | Optional | Yes - [PR #12204](https://github.com/helm/helm/pull/12204) merged, released Helm 3.14.0 (Jan 2024) | Yes, ships riscv64 binaries | Test suite not confirmed fully passing on riscv64 |
| klipper-helm | Helm chart job runner (k3s-io) | Optional | No confirmed | No | [k3s-io/klipper-helm#64](https://github.com/k3s-io/klipper-helm/pull/64) open; status not reconfirmed in this pass |
| klipper-lb | Service load-balancer shim (k3s-io) | Optional | No confirmed | No | [k3s-io/klipper-lb#56](https://github.com/k3s-io/klipper-lb/pull/56) open; status not reconfirmed in this pass |
| libseccomp | Seccomp filtering, linked via cgo in the `seccomp` build tag | Critical | Yes - Alpine `libseccomp`/`libseccomp-dev`/`libseccomp-static` installed via `xx-apk` for the target arch in the Dockerfile; k3s-side integration landed via [PR #14529](https://github.com/k3s-io/k3s/pull/14529) "Enable seccomp in riscv64 builds" (merged 2026-09-01) | riscv64 builds now include seccomp; no separate release channel | This was an open functional gap (riscv64 builds existed without seccomp) closed only in Sep 2026, over a year after CI/build groundwork was first added |
| AppArmor | LSM-based confinement, `apparmor` build tag | Optional | Presumed yes (kernel LSM, not arch-specific by design); no riscv64-specific k3s test found | Not verified | Data not available: no riscv64-specific AppArmor-on-k3s issue or test result was found in any source searched |
| SQLite | Embedded datastore for kine's default backend | Optional | Yes via two paths: `mattn/go-sqlite3` (cgo, bundled C amalgamation - presumed buildable via the same gcc/musl riscv64 toolchain, not explicitly confirmed by a riscv64-specific issue) and `modernc.org/sqlite` (pure Go, no cgo - confirmed riscv64-portable) | Yes for the pure-Go path | None found for either path |
| musl | C library target for static Linux builds | Optional | Yes - Alpine `musl-dev` (via `xx-apk`) for the build container, and k3s-root's own Buildroot `riscv64-buildroot-linux-musl` cross toolchain (GCC 14.3.0) for the bundled sysroot | Yes, shipped in k3s-root riscv64 tarballs | None found specific to k3s; runc's musl-static-build issue ([#3950](https://github.com/opencontainers/runc/issues/3950)) is the nearest related gap, in a different dependency |
| k3s-root | Companion repo providing the static userspace root filesystem (sqlite, libseccomp, etc.) bundled into k3s | Critical | Yes - riscv64 supported since v0.13.0; current pin is v0.15.2, `k3s-root-riscv64.tar` fetched and SHA256-verified by `scripts/version.sh`/`scripts/download` | Yes - official riscv64 tarballs published as k3s-root release assets | [k3s-io/k3s-root#61](https://github.com/k3s-io/k3s-root/issues/61) "Build riscv64 on dedicated runner" (brandond) - infra work toward dedicated riscv64 CI for this repo specifically. This is the one dependency where riscv64 is fully, officially supported today. |
| Go | Primary language runtime/compiler | Critical (build) | Yes - riscv64 experimental since Go 1.14, first-class since Go 1.22; k3s Dockerfile pins `golang:1.26.8-alpine3.24`, go.mod requires Go >=1.26.2 | Every Go release ships riscv64 | The one known Go-level correctness gap is [golang/go#64917](https://github.com/golang/go/issues/64917) (NaN-to-int conversion divergence on riscv64), open, not actively worked |
| GCC | C cross-compiler for cgo dependencies (sqlite3, libseccomp, selinux) | Critical (build) | Yes, via two paths: Alpine's `gcc`/`musl-dev` packages installed through `tonistiigi/xx`'s cross-apk mechanism (k3s build image), and a from-source `riscv64-buildroot-linux-musl` GCC 14.3.0 toolchain (k3s-root build) | N/A (build-time only) | No riscv64-specific gcc/xx issue found |
| Docker | Build orchestration; `docker buildx build` invoked by the Makefile and CI | Critical (build) | Yes - Docker/BuildKit itself is architecture-agnostic for driving cross-builds | N/A (build-time only) | None found specific to riscv64 |
| Buildx | Docker's multi-platform build frontend; explicit `linux/riscv64` platform string support in the Makefile's `--platform` list | Critical (build) | Yes - Buildx accepts `linux/riscv64` as a standard platform string | N/A (build-time only) | None found specific to riscv64 |

**Additional indirect dependencies found via research:**

- `go.etcd.io/bbolt` (embedded B-tree KV used by etcd/kine): pure Go, riscv64-portable; [PR #666](https://github.com/etcd-io/bbolt/pull/666) added a riscv64 `MaxMapSize` constant. No open blockers found.
- `golang.zx2c4.com/wireguard` (wireguard-go, used by flannel's WireGuard backend): pure Go, builds on riscv64 since Go crypto primitives are portable. Zero riscv64 issues found. Note: this project's own status report (`project-reports/wireguard.md`) covers the C kernel-module WireGuard implementation, not `wireguard-go` - a scope mismatch worth flagging if cross-referenced.
- `golang.org/x/crypto`: pure Go, riscv64-portable, no open issues.
- `github.com/klauspost/compress` (zstd/deflate): pure Go with amd64/arm64 assembly fast paths that fall back to generic Go elsewhere (including riscv64); only ARM64-test-timeout issues found, none riscv64-specific.
- `github.com/pierrec/lz4`: not independently checked for riscv64 status; minor indirect dependency.
- OpenSSL (linked transitively via containerd/runc TLS paths in some configurations): ships comprehensive RISC-V assembly optimization (Zkn, Zksh, Zvk, RVV, ChaCha20) since 2022, actively maintained through 2026. No blockers found.

**Hard blockers for a functioning riscv64 k3s cluster today**, synthesized from the table above: (1) k3s itself ships no riscv64 release binary and the installer aborts on riscv64; (2) `rancher/mirrored-pause:3.6` has no riscv64 manifest, so no pod sandbox can be created; (3) `rancher/systemd-node:v0.0.8` has no riscv64 image; (4) `klipper-helm`/`klipper-lb` have no confirmed riscv64 images; (5) `local-path-provisioner`'s riscv64 status is unresolved/contradictory; (6) flannel's riscv64 build reliability is explicitly disclaimed (`wontfix`) by its maintainers; (7) Traefik v3.x riscv64 artifact availability is unconfirmed. None of these seven items is a Go-language or k3s-core-logic problem - every one is either a Rancher/SUSE-owned container image gap or a third-party dependency's own release-artifact gap.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#7151](https://github.com/k3s-io/k3s/issues/7151) | Add support for riscv64 architecture (master tracking issue) | Open, milestone "Backlog" | Tracking | Open since 2023-03-27, 64 comments, last updated 2026-08-17. Umbrella issue; no committed schedule. |
| [#14688](https://github.com/k3s-io/k3s/pull/14688) | Add riscv64 release artifacts | Closed, not merged (2026-09-24) | High (release-blocking) | Maintainer dereknola's rejection is the most current and decisive statement of project stance; cites CI speed and missing support images. |
| [#13854](https://github.com/k3s-io/k3s/pull/13854) | [Experiment] Add CI on linux-riscv64 | Open, draft | High (CI-blocking) | Has informal CNCF go-ahead (2026-04-28) but no reviews/approvals; gated on build-speed optimization. |
| [#13910](https://github.com/k3s-io/k3s/issues/13910) | Add native riscv64 CI using RISE RISC-V GitHub Actions Runners | Closed "not planned" (2026-09-20) | Medium | Organizational prerequisite (GitHub App install on k3s-io org) for #13854; closed despite active progress reported through July 2026. |
| [#14641](https://github.com/k3s-io/k3s/issues/14641)-[#14644](https://github.com/k3s-io/k3s/issues/14644) | [Release-1.3x] Add support for riscv64 architecture | Closed same-day (2026-09-18) | Low | Backport-tracking clones of #7151; closed without action, not evidence of a merge (see Section 2 discrepancy note). |
| [#12556](https://github.com/k3s-io/k3s/issues/12556) | Assessment of the difficulty in porting CPU architecture for k3s | Closed (2025-06-27) | Informational | External tool rated "low difficulty"; no maintainer technical follow-up. |
| [#6022](https://github.com/k3s-io/k3s/issues/6022) | metrics-server HTTP 403 on a custom riscv64 build | Closed | Low | Attributed to custom-setup RBAC misconfiguration, not an upstream bug. |
| [containerd#13020](https://github.com/containerd/containerd/issues/13020) | Add linux/riscv64 to CI test matrix | Open | Medium (dependency) | No CI test coverage for riscv64 in k3s's default CRI, despite riscv64 release tarballs existing. |
| [runc#3950](https://github.com/opencontainers/runc/issues/3950) | musl static build broken on riscv64 | Open | Medium (dependency) | Narrow, well-scoped gap in an otherwise-supported dependency. |
| [flannel#1988](https://github.com/flannel-io/flannel/issues/1988), [flannel#1853](https://github.com/flannel-io/flannel/issues/1853) | riscv64 build/image failures | Closed **wontfix** | High (dependency) | The default CNI's maintainers have explicitly declined to guarantee riscv64 build reliability. |
| [golang/go#64917](https://github.com/golang/go/issues/64917) | `uint32(math.NaN())` returns -1 equivalent on riscv64 vs 0 elsewhere | Open (`FrozenDueToAge`) | Low-to-medium (latent correctness) | Toolchain-level, not k3s-specific; no k3s failure attributed to it yet. |

**Correctness bugs, isolated:** only [golang/go#64917](https://github.com/golang/go/issues/64917) qualifies as a genuine correctness (not availability/CI) issue tied to riscv64, and it sits in the Go compiler, not in k3s's own code. No k3s-specific correctness bug tied to riscv64 was found in this research.

## 12. Objections and Upstream Blockers

**Standing maintainer position**, consistent from 2023 through the most recent (2026-09-24) rejection:

1. **No dedicated CI/QA hardware historically, now partially addressed but still too slow.** brandond (2023, #7778 and #7151): "we don't have any hardware for CI or QA." RISE Project native riscv64 runners (Scaleway EM-RV1) now exist and are used in draft PR #13854, but measured build times remain ~8-11x slower than arm64 as of the most recent measurement (2026-03-26), and this remains dereknola's explicit, current reason for rejecting riscv64 release artifacts: "CI infra remains 10x slower for riscv64 builds" (PR #14688 closure, 2026-09-24).

2. **Rancher/SUSE-owned support images lack riscv64 builds.** brandond (2023, #7778): "I just can't run anything on it because none of our images currently support riscv64." dereknola (2026, #14688): "associated support images (such as upstream k8s pause image) do not have a riscv64 version." This is a three-year-consistent, unresolved blocker, and unlike the CI-speed issue it is controlled entirely by SUSE-internal image-build infrastructure, not by any external contributor.

3. **The CNCF does not provide riscv64 hardware as a standard service.** (pgonin, Jan 2026.) Any riscv64 CI must come from a third-party provider (RISE) or dedicated hardware, and installing the RISE GitHub App on the k3s-io org - an organizational, zero-engineering-effort action - was itself closed "not planned" ([#13910](https://github.com/k3s-io/k3s/issues/13910), 2026-09-20).

4. **flannel's upstream "wontfix" on riscv64 build failures** is an external blocker outside k3s maintainers' control: the default CNI has no guaranteed riscv64 forward compatibility.

**Organizational signal:** CNCF gave informal sign-off for engagement on riscv64 (luhenry, 2026-04-28, referencing a conversation with @caniszczyk), but this cleared a governance step, not the underlying technical/infrastructure blockers, which remain open five months later.

**Acceptance probability, stated plainly:** low in the near term. The most recent, most specific, and most senior-maintainer-authored signal available (dereknola's PR #14688 rejection, 6 days before this report's date) is an explicit refusal, tied to concrete, named, unresolved prerequisites (CI speed, pause-image availability) rather than a vague "not prioritized." Until those two items close, no further riscv64 release-artifact PR is likely to be accepted regardless of code quality.

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci-no-release)
- **Release provider:** none
- **Justification:** k3s ships a compiled Go binary per architecture (not architecture-independent), so the architecture-independence exemption does not apply. Reading all workflow files in `.github/workflows/` shows riscv64 appears only in `build-k3s.yaml`'s dead runner-selection conditional - no upstream workflow (`release.yml`, `e2e.yaml`, `install.yaml`, `integration.yaml`, `nightly-install.yaml`) ever passes `linux/riscv64` as a build platform, so upstream CI neither builds nor tests riscv64 (confirmed at [`.github/workflows/build-k3s.yaml`](https://github.com/k3s-io/k3s/blob/master/.github/workflows/build-k3s.yaml)). The only riscv64 CI that exists runs on a contributor's personal fork via draft [PR #13854](https://github.com/k3s-io/k3s/pull/13854) (unreviewed, ~8-11x slower than arm64). Most decisively, maintainer dereknola closed [PR #14688](https://github.com/k3s-io/k3s/pull/14688) "Add riscv64 release artifacts" on 2026-09-24 (6 days before this report), stating explicitly: "K3s remain 'not ready' for riscv64 releases. CI infra remains 10x slower for riscv64 builds, and associated support images... do not have a riscv64 version... We are not going to add another architecture as an official release until we have that support in place." No riscv64 release asset exists in any GitHub release, and k3s is not packaged by any Linux distribution (Ubuntu resolute has zero k3s packages for any architecture), so no distribution floor applies either. None of the predefined orange sub-types (downstream-only, optimization-absent) apply, since no distribution packages k3s at all and k3s is not an optimization-purpose project - this places it on the "no upstream CI, no release" branch of the orange classification.
- **Pending work that could change the grade:** Open master tracking issue [#7151](https://github.com/k3s-io/k3s/issues/7151) (since 2023-03-27, still "Backlog"). Draft PR [#13854](https://github.com/k3s-io/k3s/pull/13854) adds experimental riscv64 CI via RISE runners but is unmerged and ~8-11x slower than arm64, blocked partly on missing riscv64 versions of `rancher/mirrored-pause` and `rancher/systemd-node`. Issue [#13910](https://github.com/k3s-io/k3s/issues/13910) (installing the RISE RISC-V Runners GitHub App on the k3s-io org) was closed "not planned" on 2026-09-20. PR [#14688](https://github.com/k3s-io/k3s/pull/14688) (add riscv64 release artifacts) was closed/rejected by a maintainer on 2026-09-24. Incremental groundwork has landed - PR [#14529](https://github.com/k3s-io/k3s/pull/14529) "Enable seccomp in riscv64 builds" (merged ~2026-09-01), `linux/riscv64` present in the Makefile and `scripts/version.sh`, and manual builds succeed (chazapis built v1.36.3+k3s1 in a RISC-V VM, Aug 2026; a native openRuyi-hardware build succeeded as part of PR #14688, Sep 2026) - but none of this has yet produced upstream CI or an official release. These are the concrete items to watch for a future color change: (a) resolution of the pause-image/systemd-node riscv64-image gap inside Rancher/SUSE's image infrastructure, (b) promotion of PR #13854 out of draft with passing CI, (c) any reversal on the RISE GitHub App install decision.

## 14. Investment Analysis

Before sizing any of the following, note what RISE has already funded or built: RISE operates the native riscv64 CI runner service used in draft PR #13854 (no cost to k3s to consume, once the org-level GitHub App is installed); RISE's `riseproject-dev/riscv-runner` PR #119 (merged 2026-09-29) builds multi-arch kube-proxy/pause images for amd64/arm64/riscv64 "used when provisioning clusters and configuring containerd" - this is adjacent infrastructure that could reduce the effort of closing the pause-image gap, but it is not yet wired into k3s or the `rancher/mirrored-pause` image itself, and no committed RISE deliverable targets k3s specifically. A May 2026 RISE blog post names k3s only as an "engagement target" alongside Kubernetes and containerd, not a funded work item, and a September 2026 RISE/Kairos blog post again describes k3s only via a third-party fork (CARV-ICS-FORTH), not an official RISE- or SUSE-driven deliverable. SUSE, Rancher, and k3s are not RISE members (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). The `riseproject-dev` GitHub org (52 repos as of the most recent listing) contains no dedicated k3s repository. One research pass found a `riseproject-dev/kubernetes-riscv` repo with a `v1.36.0-riscv64` release cited in the existing body of research; a separate, later full org-repo listing did not surface this repo. This is an unresolved discrepancy [NEEDS VERIFICATION] and should not be relied on for planning without direct confirmation.

### 14.1 Functional Enablement

1. **Install-script riscv64 support:** code exists in unmerged PR #7778; needs review and a rebase against the current (post-Dapper) build system. Low effort, blocked on maintainer review bandwidth, not technical difficulty.
2. **`rancher/mirrored-pause` riscv64 manifest:** the single most critical blocker per the maintainer's own 2026-09-24 statement. Requires Rancher/SUSE-internal image-build/mirror infrastructure work.
3. **`rancher/systemd-node` riscv64 image:** same category as above, blocks 7 integration-test categories.
4. **`klipper-helm`/`klipper-lb` riscv64 images:** open PRs exist; status of merge readiness not reconfirmed in current research - re-verify before sizing.
5. **`local-path-provisioner` riscv64 support:** status is actively contradictory between sources (abandoned PR #346 vs. an unreconciled claim that Rancher began shipping the image). This must be resolved with a direct check before any effort estimate is trusted.
6. **Prior riscv64 release images for upgrade/skew testing:** do not exist; blocks upgrade-path CI once base CI exists.

### 14.2 Performance Optimization

Not warranted at this stage. k3s has zero architecture-specific numeric/crypto/SIMD code of its own (Section 4); the ~8-11x CI build-time slowdown is a property of current-generation RISC-V CI hardware (RISE's Scaleway EM-RV1 class), not an application-level performance deficiency, and affects CI cost/throughput, not runtime behavior. No application-level riscv64 performance data (pod scheduling latency, API server throughput, etcd/kine I/O, network throughput) exists in any source located. The one riscv64 correctness risk identified, the Go NaN-to-int conversion divergence ([golang/go#64917](https://github.com/golang/go/issues/64917)), is a toolchain issue, not something k3s engineering can fix directly; it merits a scoped audit of k3s's own float-to-int conversion paths, not a broad optimization program. Optimization work should wait until (a) k3s has any riscv64 CI at all, and (b) real application-level profiling data exists on target hardware.

### 14.3 CI/CD Infrastructure

1. **Install the RISE RISC-V Runners GitHub App on the k3s-io org:** zero engineering effort, a single organizational decision; was requested and closed "not planned" ([#13910](https://github.com/k3s-io/k3s/issues/13910)). Re-raising this decision is a prerequisite for everything downstream.
2. **Promote PR #13854 from draft to reviewable:** primarily blocked on the image gaps in 14.1 and on build-cache tuning (one contributor demonstrated a 56m19s-to-4m15s improvement via Docker layer caching in a related thread; this has not yet landed in CI). Engineering scope is CI-config-only, no k3s source changes required.
3. **Faster hardware provisioning:** RISE stated it was pursuing faster hardware via Spacemit/Scaleway/Canonical partnerships, with slipping "end of July" then "end of August 2026" target dates. Current completion status is unconfirmed [NEEDS VERIFICATION] and outside k3s's direct control.

### 14.4 Ecosystem Enablement

- **flannel's `wontfix` stance:** an alternative CNI (Calico, Cilium, or a maintained flannel fork) should be evaluated for riscv64 deployments rather than waiting on upstream flannel.
- **Traefik v3.x riscv64 artifact confirmation:** a short verification task, not an engineering task, given the ambiguity between v2.10's GoReleaser addition and the later CI-space failure.
- **Helm test-suite riscv64 gaps:** documented but not fully characterized; not a deployment blocker, a test-coverage gap.
- **etcd's missing official riscv64 release binary:** mitigated for k3s specifically by building etcd from k3s's own fork source; no action required within k3s scope.
- **containerd CI test-matrix gap ([containerd#13020](https://github.com/containerd/containerd/issues/13020)):** outside k3s's control; watch for upstream resolution rather than fork/patch.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Re-request installation of the RISE RISC-V Runners GitHub App on k3s-io org | 0 (org decision) | k3s-io org admin | Critical |
| Functional | Add riscv64 pause-image manifest to Rancher image-mirror infrastructure | 1-2 | SUSE/Rancher | Critical |
| Functional | Add riscv64 systemd-node image | 1-2 | SUSE/Rancher | Critical |
| Functional | Resolve local-path-provisioner riscv64 status (verify, then act) | 0.5 (verify) + 2-3 (if action needed) | Community/SUSE | High |
| Functional | Review, rebase, and merge install-script riscv64 support (from PR #7778) | 1 | k3s maintainers | High |
| Functional | Merge klipper-helm#64 and klipper-lb#56 riscv64 images | 1 each | SUSE/Rancher | High |
| CI/CD | Promote PR #13854 to ready-for-review (post image/cache fixes) | 1-2 | luhenry / RISE | High |
| CI/CD | Apply Docker layer caching to cut riscv64 build time toward arm64 parity | 1 | luhenry / RISE | Medium |
| CI/CD | Wire riscv64 into `release.yml` once base CI is stable | 1 | k3s maintainers | Medium |
| Ecosystem | Evaluate alternative CNI for riscv64 given flannel's wontfix stance | 1-2 | Community | Medium |
| Ecosystem | Verify current Traefik v3.x riscv64 artifact availability | 0.5 | Community | Medium |
| Correctness | Audit k3s's own NaN-to-int float conversion paths against golang/go#64917 | 0.5-1 | k3s maintainers | Low |
| Performance | Application-level profiling on riscv64 target hardware (pod scheduling, API server, etcd/kine I/O) | 2-4 | Engineering | Low |

The engineering-scope work (install script, CI config, klipper-helm/lb) is small and nearly ready to merge; the critical-path bottleneck is entirely inside Rancher/SUSE's image-build and mirror infrastructure and the org-level CI-hardware decision, neither of which additional external code contribution can resolve.

## 15. References

- [k3s-io/k3s Issue #7151 - riscv64 tracking issue](https://github.com/k3s-io/k3s/issues/7151)
- [k3s-io/k3s PR #7778 - Add support for RISC-V](https://github.com/k3s-io/k3s/pull/7778)
- [k3s-io/k3s PR #7285 - WIP: Add riscv64 support (closed)](https://github.com/k3s-io/k3s/pull/7285)
- [k3s-io/k3s PR #9719 - Bump libp2p for riscv support](https://github.com/k3s-io/k3s/pull/9719)
- [k3s-io/k3s Issue #12556 - Assessment of porting difficulty](https://github.com/k3s-io/k3s/issues/12556)
- [k3s-io/k3s Issue #9489 - RISC-V Support (closed)](https://github.com/k3s-io/k3s/issues/9489)
- [k3s-io/k3s Issue #7152 - How to build for riscv64 (closed)](https://github.com/k3s-io/k3s/issues/7152)
- [k3s-io/k3s Issue #6022 - metrics-server on riscv64 (closed)](https://github.com/k3s-io/k3s/issues/6022)
- [k3s-io/k3s PR #13854 - [Experiment] Add CI on linux-riscv64](https://github.com/k3s-io/k3s/pull/13854)
- [k3s-io/k3s Issue #13910 - Add native riscv64 CI using RISE RISC-V Runners](https://github.com/k3s-io/k3s/issues/13910)
- [k3s-io/k3s PR #14688 - Add riscv64 release artifacts (closed)](https://github.com/k3s-io/k3s/pull/14688)
- [k3s-io/k3s PR #14529 - Enable seccomp in riscv64 builds](https://github.com/k3s-io/k3s/pull/14529)
- [k3s-io/k3s Issues #14641-#14644 - release-branch backport clones of #7151](https://github.com/k3s-io/k3s/issues/14641)
- [k3s-io/k3s workflow - build-k3s.yaml](https://github.com/k3s-io/k3s/blob/master/.github/workflows/build-k3s.yaml)
- [k3s-io/k3s-root - riscv64 support and releases](https://github.com/k3s-io/k3s-root)
- [k3s-io/k3s-root Issue #61 - Build riscv64 on dedicated runner](https://github.com/k3s-io/k3s-root/issues/61)
- [k3s-io/kine Issue #296 - Add support for RISC-V 64](https://github.com/k3s-io/kine/issues/296)
- [k3s-io/kine PR #297 - riscv64 support](https://github.com/k3s-io/kine/pull/297)
- [k3s-io/kine PR #462 - multiplatform CI](https://github.com/k3s-io/kine/pull/462)
- [k3s-io/klipper-helm PR #64](https://github.com/k3s-io/klipper-helm/pull/64)
- [k3s-io/klipper-lb PR #56](https://github.com/k3s-io/klipper-lb/pull/56)
- [coredns/coredns PR #6195 - RISC-V support](https://github.com/coredns/coredns/pull/6195)
- [helm/helm PR #12204 - RISC-V support](https://github.com/helm/helm/pull/12204)
- [traefik/traefik PR #10026 - RISC-V support](https://github.com/traefik/traefik/pull/10026)
- [flannel-io/flannel PR #1824 - riscv64 support](https://github.com/flannel-io/flannel/pull/1824)
- [flannel-io/flannel Issue #1988 - riscv64 build failure (wontfix)](https://github.com/flannel-io/flannel/issues/1988)
- [flannel-io/flannel Issue #1853 - riscv64 failed to build images (wontfix)](https://github.com/flannel-io/flannel/issues/1853)
- [containernetworking/plugins PR #739 - riscv64 support](https://github.com/containernetworking/plugins/pull/739)
- [containerd/containerd Issue #13020 - Add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [opencontainers/runc PR #3905 - riscv64 support merged (v1.1.8)](https://github.com/opencontainers/runc/pull/3905)
- [opencontainers/runc Issue #3950 - musl static build broken on riscv64](https://github.com/opencontainers/runc/issues/3950)
- [etcd-io/etcd PR #21510 - remove ETCD_UNSUPPORTED_ARCH for riscv64](https://github.com/etcd-io/etcd/pull/21510)
- [etcd-io/bbolt PR #666 - riscv64 MaxMapSize](https://github.com/etcd-io/bbolt/pull/666)
- [rancher/local-path-provisioner PR #346 - riscv64 (closed abandoned)](https://github.com/rancher/local-path-provisioner/pull/346)
- [checkpoint-restore/criu Issue #1702 - RISC-V support (open since 2021)](https://github.com/checkpoint-restore/criu/issues/1702)
- [golang/go Issue #64917 - NaN-to-int conversion diverges on riscv64](https://github.com/golang/go/issues/64917)
- [RISE Project - Announcing RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project - RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project - How Kairos is Charting the Stepping Stones of RISC-V Productization](https://riseproject.dev/2026/09/28/how-kairos-is-charting-the-stepping-stones-of-risc-v-productization/)
- [Kairos blog - RISC-V64 Open Invitation](https://kairos.io/blog/2026/08/28/kairos-riscv64-open-invitation/)
- [riseproject-dev/riscv-runner PR #119 - multi-arch kube-proxy/pause images](https://github.com/riseproject-dev/riscv-runner)
- [CARV-ICS-FORTH/kubernetes-riscv64](https://github.com/CARV-ICS-FORTH/kubernetes-riscv64)
- [luhenry/k3s Actions run 23554260675 - riscv64/arm64/amd64 build timing](https://github.com/luhenry/k3s/actions/runs/23554260675)