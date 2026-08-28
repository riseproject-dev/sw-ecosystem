---
title: cadvisor
---

# cadvisor

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for cadvisor<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

cAdvisor (Container Advisor) is a Go daemon that collects, aggregates, and exports resource usage and performance metrics for running containers by parsing `/proc`, sysfs, and cgroups. It is vendored into Kubernetes' kubelet as the source of container-level stats and can also run standalone.

**Governance:** cAdvisor is hosted under the `google` GitHub org, not under CNCF or the Kubernetes org. Per the project's own roadmap document (`docs/roadmap.md`, added January 2026 by Sergey Kanzhelev), the maintainers explicitly describe it as "a Google project, rather than a kubernetes project," and flag this as a governance problem: "Google outsized ownership and responsibility for this project with limited OSS governance model." Community coordination happens informally through Kubernetes' `#sig-node` Slack channel and discuss.kubernetes.io, but cAdvisor has no formal SIG ownership. License is Apache 2.0 ("Copyright 2014 The cAdvisor Authors").

**Critical context:** the roadmap document states K8s intends to stop vendoring cAdvisor by 2027; machine-level metrics are transitioning to container runtimes directly, and standalone-mode users are being redirected to the OpenTelemetry Collector. The document states cAdvisor "will be placed in maintenance mode and eventually closed" absent a third party (or CNCF) taking it over. This is a first-order consideration for any RISC-V investment: the project is on a sunset trajectory, not a growth trajectory.

**Maintainers and corporate affiliation** (from README.md `Community` section, cross-checked against live GitHub profiles):
- @bobbypage (David Porter) - Google
- @iwankgb - Independent
- @creatone - Independent
- @dims (Davanum Srinivas) - listed as VMware in README, but current GitHub profile shows Nvidia; authored the June 2026 `lib` module refactor, so actively committing
- @mrunalp (Mrunal Patel) - Red Hat
- @haircommander (frequent collaborator) - Red Hat
- Emeritus: @dashpole, @dchen1107 (Google), @derekwaynecarr (Red Hat)

Active corporate sponsorship is effectively Google + Red Hat + Nvidia, plus independents. No SiFive or RISC-V-silicon-vendor employees hold maintainer status.

**Community culture on new ports:** the sole RISC-V PR was merged in ~11 days with a one-word "lgtm" review and a friendly closing comment - a positive, low-friction reception for a minimal patch. But the project's broader posture toward *expanding the officially supported architecture surface* is closed: maintainer @dims responded "probably not gonna happen!" (December 2025) to [issue #3703](https://github.com/google/cadvisor/issues/3703), a request for arm/v7 multi-arch images that would have required a single line added to a workflow matrix. Given this precedent and the documented 2026-2027 deprecation trajectory, a request to add riscv64 to the official release/container matrix today should be expected to meet similar resistance.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-12-27 | PR [#2364](https://github.com/google/cadvisor/pull/2364) opened by carlosedp: "Ignore CPU clock for riscv64" | [PR #2364](https://github.com/google/cadvisor/pull/2364) |
| 2020-01-06 | dashpole (Google) reviews with "lgtm", approves | [PR #2364](https://github.com/google/cadvisor/pull/2364) |
| 2020-01-06/07 | CI flake (unrelated UI-asset-diff check, also affecting concurrent PR #2367) forces a rebase onto prerequisite PR #2370 | [PR #2364](https://github.com/google/cadvisor/pull/2364) |
| 2020-01-07 | PR #2364 merged (commit `77aef51a9bbc04f81e176d96ab0d310f4c728c1f`, merge commit `64af92094a4103b16b986c606722967362b89606`) | [PR #2364](https://github.com/google/cadvisor/pull/2364) |
| 2020-02-29 | First release containing the change: **v0.36.0** (verified via `gh api compare` ancestry: v0.35.0 and v0.35.1 predate/exclude it; v0.36.0 is confirmed ancestor) | [google/cadvisor releases](https://github.com/google/cadvisor/releases) |
| 2026 (undated) | Code relocated from `machine/machine.go` to `lib/machine/machine.go` during a broader module restructuring; riscv64 logic itself untouched since 2020 | [lib/machine/machine.go](https://github.com/google/cadvisor/blob/master/lib/machine/machine.go) |

**Key contributor:** Carlos de Paula (GitHub: carlosedp), whose GitHub bio identifies him as "RISC-V Ambassador / Red Hat Architect." The port originated from a RISC-V community advocate at Red Hat, not from Google or a RISC-V silicon vendor.

**Is it fully upstream?** Yes, in the narrow sense that the entire scope of work (a 13-line diff) is merged and has shipped in every release since v0.36.0 (2020). No, in the sense that this is a compile/runtime-safety guard, not an enablement of riscv64 as a supported build/release/CI target. No further riscv64 PRs, issues, or follow-up work exist in six-plus years since. Two other PRs matched keyword search ([#2990](https://github.com/google/cadvisor/pull/2990), [#2991](https://github.com/google/cadvisor/pull/2991)) but are Dependabot version bumps that only mention "riscv64" inside an unrelated upstream dependency's changelog text; both were closed unmerged (superseded) and have no bearing on cadvisor's own riscv64 status.

## 3. Upstream Support Tier

There is no formal architecture-tier policy document in the repository. In practice, tier status is defined by inclusion in the CI test matrix, the release-binaries matrix, and the container-publish matrix - and riscv64 is absent from all three.

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI test matrix (`test.yml`) | Yes (implicit, `ubuntu-24.04` runner) | Not separately tested (no cross-arch test job for any arch) | No |
| Release binary matrix (`release-binaries.yml`, `matrix.arch`) | Yes | Yes | No |
| Container publish matrix (`publish-container.yml`, `platforms:`) | Yes | Yes | No |
| Dedicated Dockerfile | Primary `deploy/Dockerfile` | Primary `deploy/Dockerfile` (multi-arch) | None |
| Official GitHub release binary | `cadvisor-<ver>-linux-amd64`, every release | `cadvisor-<ver>-linux-arm64`, every release | None, any release |
| Blocking status for merges | N/A (native) | Not CI-gated on arm64-specific tests, but included in release gating | Not applicable - no target exists to gate |

arm64 achieves parity with amd64 purely through infrastructure inclusion (CI matrix membership, release matrix membership, container matrix membership) rather than through arm64-specific code - the Go-level code footprint for arm64 (`isAArch64()`) is comparably minimal to riscv64's (`isRiscv64()`). This confirms that the gap for riscv64 is entirely an infrastructure/policy gap, not a code-complexity gap: the code is essentially ready, but nobody has proposed the one-line matrix additions, and the one comparable precedent (arm/v7 request, issue #3703) was rejected by a maintainer.

Sources: [.github/workflows/test.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/test.yml), [.github/workflows/release-binaries.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/release-binaries.yml), [.github/workflows/publish-container.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/publish-container.yml), [issue #3703](https://github.com/google/cadvisor/issues/3703).

## 4. Technical Architecture and RISC-V-Specific Subsystems

cAdvisor has no JIT, no SIMD-dispatch code, no cryptographic primitives, no hand-written assembly, and no GC-barrier code of its own (it is a pure-Go daemon relying on the Go runtime's own GC). Repo-wide searches for `.s`/`.asm` files, RVV intrinsics (`vfloat32m1_t`), and ISA-extension identifiers (`zba`, `zbb`) all returned zero matches across the entire 3,335-entry repository tree. There is no per-architecture directory layout (no `arch/riscv/`-style structure) anywhere in the codebase for any target architecture.

The **entire** RISC-V-specific (and, by extension, entire architecture-specific for non-x86) code surface is a single helper in `lib/machine/machine.go` (326 lines total):

```go
// riscv64 changes
func isRiscv64() bool {
    return strings.Contains(machineArch, "riscv64")
}
```

called from exactly one site, inside `GetClockSpeed()`:

```go
// s390/s390x, mips64, riscv64, aarch64 and arm32 changes
if isMips64() || isSystemZ() || isAArch64() || isArm32() || isRiscv64() {
    return 0, nil
}
```

**Effect:** on riscv64, cAdvisor unconditionally returns a clock speed of `0, nil` rather than attempting to parse `/proc/cpuinfo`'s `cpu MHz` field (a field riscv64 kernels do not reliably expose in that format) or fall through to the sysfs `cpufreq/cpuinfo_max_freq` path. riscv64 is grouped with four other non-x86 architectures (mips64, s390x, aarch64, arm32) and receives no unique treatment.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CPU clock-speed detection | Full `/proc/cpuinfo` regex + sysfs parse | Skipped (`isAArch64()` guard, returns 0) | Skipped (`isRiscv64()` guard, returns 0) |
| SIMD / vectorized code | None in project | None in project | None in project |
| JIT / codegen | Not applicable (monitoring daemon) | Not applicable | Not applicable |
| Assembly | None (0 `.s` files repo-wide) | None | None |
| Perf-counter backend (libpfm, cgo) | Builds (native x86_64 support in libpfm4) | Builds (arm64 supported in libpfm4) | **Does not build** - libpfm4 4.11.0 upstream `config.mk` `ARCH` detection has no riscv64 mapping (confirmed via code search of `wcohen/libpfm4`: zero "riscv" matches in the source tree) |
| NVM/Optane backend (libipmctl, cgo) | x86_64-only by design, currently disabled repo-wide (issue #3482) | Not applicable (x86_64-only) | Not applicable (x86_64-only) |
| Test fixtures for arch-specific parsing | Implicit (default path) | `cpuinfo_arm`, `cpuinfo_rpi4`, dedicated `testdata_rpi4/` directory | **None** - no `cpuinfo_riscv64` fixture exists; the `isRiscv64()` skip-behavior is not unit-tested against a riscv64-shaped `/proc/cpuinfo` sample |

The `isRiscv64()` guard has one call site and no dedicated test coverage. This is a defensive/negative guard (prevents a misparse), not a positive capability (it produces no riscv64-specific data - clock speed is simply reported as 0/unavailable, same as on arm64/s390x/mips64/arm32).

## 5. Build System, Cross-Compilation, and Toolchain

cAdvisor has no CMake, no configure script, and no riscv64-specific build documentation. It is built via `go build` wrapped by a Makefile and `build/build.sh`. Confirmed absent: `CMakeLists.txt` (repo-wide code search for `filename:CMakeLists.txt` returns zero results), `cmake/` directory, `docs/cross-compilation.md`, `docs/building.md`.

**Effective build command for riscv64** (mechanically, untested by upstream CI):
```bash
GOARCH=riscv64 GOOS=linux GO_CGO_ENABLED=0 GO_FLAGS="-tags=netgo" ./build/build.sh
# equivalently:
GOARCH=riscv64 GO_CGO_ENABLED=0 make build
```

**Toolchain requirements:**
- Go >= 1.25.0 (hard requirement in `go.mod`, `cmd/go.mod`, `lib/go.mod` - note `docs/development/build.md` states "Go 1.14," which is stale documentation, not the real floor)
- No C/C++ cross-toolchain required for the default `CGO_ENABLED=0` path - Go's native riscv64 codegen has existed since Go 1.14 (2020) and requires no C compiler
- A riscv64 cross-gcc (e.g. `gcc-riscv64-linux-gnu`) is required only if building with `CGO_ENABLED=1` for the optional `-tags=libpfm` or `-tags=libipmctl` build variants; no minimum version is documented anywhere, because this path has never been exercised for riscv64

**Known build failure (inferred, not reproduced):** the primary `deploy/Dockerfile` unconditionally builds `-tags=libpfm,netgo` for every architecture except where `libipmctl` is explicitly x86_64-gated. Because upstream libpfm4 4.11.0's `config.mk` has no riscv64 `ARCH`/`CONFIG_PFMLIB_ARCH_*` mapping, the Dockerfile's `make -e -C libpfm-4.11.0` step would very likely fail (or silently produce a non-functional library) if built with `--platform linux/riscv64` today. This is inference from source inspection of libpfm4's `config.mk`, not a reproduced build log - no riscv64 build environment was available to confirm the exact failure mode.

**QEMU:** `publish-container.yml` invokes `docker/setup-qemu-action@v3` with no `platforms:` input, which per the action's own defaults installs emulation for `platforms: "all"` (including riscv64) - but this capability sits unused, since the subsequent `docker/build-push-action@v6` step explicitly pins `platforms: linux/amd64,linux/arm64`. `build/check_container.sh` and `build/release.sh` (manual/legacy scripts) list `arches=(amd64 arm arm64 s390x)` - riscv64 is absent from both.

**Base image availability, if riscv64 were added:** `golang:1.25-alpine3.23` and `alpine:3.23` both have confirmed riscv64 images (Docker Hub API). Alpine's `edge/riscv64` repo has riscv64 builds of all the runtime deps the Dockerfile installs (`ndctl-dev`, `device-mapper`, `zfs`, `thin-provisioning-tools`). The blocker is purely the libpfm4 cgo build step, not base-image or Alpine-package availability.

**Minimal path to a working upstream riscv64 build:** (1) add `riscv64` to `release-binaries.yml`'s `matrix.arch` (trivial - already `CGO_ENABLED=0`, pure Go, no libpfm entanglement in the release-binaries path); (2) add `linux/riscv64` to `publish-container.yml`'s `platforms:` list - but this would fail at the Dockerfile's unconditional libpfm4 build step unless the Dockerfile is patched to arch-gate `libpfm` the same way it already gates `libipmctl`.

Sources: [build/build.sh](https://github.com/google/cadvisor/blob/master/build/build.sh), [deploy/Dockerfile](https://github.com/google/cadvisor/blob/master/deploy/Dockerfile), [.github/workflows/release-binaries.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/release-binaries.yml), [.github/workflows/publish-container.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/publish-container.yml).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Container stats collection (cgroups v1/v2, via `opencontainers/cgroups`) | Full | Full | Full (pure-Go dependency, no arch gating) |
| CPU clock-speed reporting | Full (`/proc/cpuinfo` + sysfs) | Unavailable (returns 0, by design) | Unavailable (returns 0, by design - identical to arm64) |
| Perf-counter metrics (`-tags=libpfm`) | Full | Full | **Not buildable** (libpfm4 has no riscv64 ARCH mapping) |
| NVM/Optane metrics (`-tags=libipmctl`) | Full (x86_64-gated; currently disabled repo-wide via issue #3482) | Not applicable | Not applicable |
| Official binary release | Yes | Yes | No |
| Official container image | Yes | Yes | No |
| CI-verified build | Yes | Not separately verified (no dedicated cross-arch CI job for any arch) | No CI job exists at all |

**Functional gaps:** none in the core stats-collection path (cgroups parsing is pure Go and architecture-agnostic). The one functional gap - perf-counter support via libpfm4 - is a third-party dependency limitation, not a cadvisor-specific gap, and it is disabled by default in the standard build config (`plain.sh`) for every architecture; only users explicitly opting into `-tags=libpfm` would notice it.

**Performance gaps:** not applicable. cAdvisor has no SIMD-accelerated code paths on any architecture; there is no missing-vectorization performance delta to quantify because none of its arithmetic-heavy paths use vector intrinsics on amd64 or arm64 either.

**Security hardening gaps:** Data not available: no riscv64-specific hardening flags, seccomp filters, or fortification settings were found or referenced anywhere in the research findings for cadvisor's own build.

**NaN/floating-point semantics issues:** Data not available: no floating-point or NaN-handling issue specific to riscv64 was found in cadvisor's issue/PR history (zero open or closed issues mention this).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by fetching and grepping the full raw content of all 5 files in `.github/workflows/` (`gh api repos/google/cadvisor/contents/.github/workflows/<file>`, base64-decoded):

| File | grep -in "riscv" result |
|---|---|
| `test.yml` | NO MATCH |
| `publish-container.yml` | NO MATCH |
| `release-binaries.yml` | NO MATCH |
| `tag-lib-module.yml` | NO MATCH |
| `stale.yaml` | NO MATCH |

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `azure-pipelines.yml`, `.circleci/config.yml`, or `.drone.yml` exists at repo root (all HTTP 404) - GitHub Actions is the sole CI system.

**What each workflow does:**
- `test.yml` (trigger: every push/PR): jobs `test`, `test-integration`, `test-integration-crio`; runner `ubuntu-24.04` only, no arch matrix dimension at all (matrix varies Go version and build config, not CPU architecture)
- `publish-container.yml` (trigger: tag push `v*` or manual): uses QEMU + Buildx but pins `platforms: linux/amd64,linux/arm64` in the actual build step
- `release-binaries.yml` (trigger: tag push `v*` or manual): `strategy.matrix.arch: [amd64, arm64]`, builds via `docker run --platform linux/${arch} golang:1.25 ...`
- `tag-lib-module.yml`: git tag mirroring, no arch dimension
- `stale.yaml`: issue/PR bot automation, no arch dimension

**Runner type:** every job across every workflow runs on `ubuntu-latest` or `ubuntu-24.04` - standard GitHub-hosted x86_64 runners. No self-hosted or riscv64-labeled runner exists anywhere in the repo.

**RISE runners:** no evidence found that cadvisor uses or has ever used RISE's native RISC-V GitHub Actions runners (announced 2026-03-24 per the RISE blog). No riscv64 job exists to attach such a runner to in the first place.

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Test job exists | Yes (implicit) | No dedicated cross-arch test | No |
| Release-binary job | Yes | Yes | No |
| Container-publish job | Yes | Yes | No |
| Native or RISE riscv64 runner in use | N/A | N/A | No - no job exists to use one |

Sources: [.github/workflows/test.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/test.yml), [.github/workflows/release-binaries.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/release-binaries.yml), [.github/workflows/publish-container.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/publish-container.yml), [.github/workflows/tag-lib-module.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/tag-lib-module.yml), [.github/workflows/stale.yaml](https://github.com/google/cadvisor/blob/master/.github/workflows/stale.yaml).

## 8. Distribution and Release Status

**No riscv64 binary or package exists for cadvisor on any channel checked.**

**GitHub Releases:** verified via `gh release view`/`gh release list` on the 5 most recent releases (v0.60.1 to v0.60.5, spanning 2026-06-21 to 2026-07-11). Every release ships exactly 2 assets:
```
cadvisor-<version>-linux-amd64
cadvisor-<version>-linux-arm64
```
No riscv64 asset in any release, ever.

**Container images:** `docker manifest inspect ghcr.io/google/cadvisor:latest` shows a manifest list containing only `amd64` and `arm64` platform entries (plus attestation/unknown entries). No riscv64 image is published.

**PyPI:** not applicable - cadvisor is a Go binary with no PyPI presence at all (`https://pypi.org/pypi/cadvisor/json` returns HTTP 404). No npm or Maven distribution either (Data not available: no npm/Maven package search performed, none plausible for a Go daemon).

**RISE wheel builder:** not applicable, consistent with no PyPI presence - the RISE gitlab package mirror redirects to the same 404.

**Debian:** the package is **removed from the archive entirely**. `tracker.debian.org/pkg/cadvisor` states explicitly: "This package is not in any development repository. This probably means that the package has been removed." Removal history shows repeated entries: `[2022-03-16] cadvisor REMOVED from testing`, plus earlier removals in 2018-11-02, 2016-09-02, 2016-05-17. The last known package version anywhere on the tracker is `cadvisor_0.38.7+ds1-2` (ancient). The buildd status page shows "No entry in riscv64 database" for every architecture, consistent with the package not building anywhere currently. A `cadvisor` riscv64 package does exist via Debian's unofficial **debports** (non-main-archive) channel, version `0.38.7+ds1-2+b6` - but this is explicitly an unofficial port, not something upstream Debian's main archive or cadvisor itself produces or tests.

**Ubuntu:** absent from 24.04 (noble) and 25.10 (questing) - confirmed via `packages.ubuntu.com` search returning "Sorry, your search gave no results." It was present in 22.04 LTS (jammy) as `cadvisor 0.38.7+ds1-2ubuntu2` for `amd64 arm64 armhf ppc64el riscv64 s390x` (synced from Debian before Debian's 2022-03-16 removal), meaning it was dropped from Ubuntu somewhere between jammy and noble, in lockstep with Debian's removal.

**Arch Linux:** no cadvisor package in the official `extra` repo, and zero occurrences of "cadvisor" in the Arch Linux RISC-V port's full package-status table (`archriscv.felixc.at/.status/status.htm`, 4,729 rows parsed, 0 matches). Only unofficial, user-submitted AUR PKGBUILDs exist (`cadvisor` and `cadvisor-bin`, both 0.60.5-1) - these are architecture-agnostic source build scripts, not confirmed riscv64 binaries, and are not part of the tracked Arch RISC-V binary repo.

**Other distros (Repology cross-check):** package exists at various versions on Gentoo/AUR/openSUSE Tumbleweed (0.60.5), NixOS unstable (0.56.2), Fedora (0.45.0), but riscv64-specific build support on these could not be confirmed from available pages [NEEDS VERIFICATION] - Gentoo's package page returned 404 and the NixOS search page returned no data via WebFetch during this research.

**What a user must do to get a working riscv64 binary today:** build from source via `GOARCH=riscv64 GO_CGO_ENABLED=0 make build` (mechanically works per Section 5, but is entirely unverified by upstream CI/release automation), or use Debian's unofficial debports build if targeting a Debian-based riscv64 system.

## 9. Dependencies

cAdvisor is pure Go; there is no CMakeLists.txt, setup.py, or Cargo.toml. Dependency risk for riscv64 is concentrated in two optional, disabled-by-default cgo-gated collectors (perf/libpfm, NVM/libipmctl) plus the OCI runtime-client libraries.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Community/Notes |
|---|---|---|---|---|---|
| [libpfm4](https://github.com/wcohen/libpfm4) | Optional cgo backend, `-tags=libpfm`, HW perf-counter events | **No** - upstream `config.mk` ARCH detection has no riscv64 mapping; zero "riscv" matches in source tree | N/A | No upstream GitHub releases for any arch (source-only) | No riscv64 issues open on repo. See `project-reports/libpfm4.md` |
| [libipmctl](https://github.com/intel/ipmctl) | Optional cgo backend, `-tags=libipmctl`, Intel Optane/NVM | x86_64-only by design (project comment cites [intel/ipmctl#163](https://github.com/intel/ipmctl/issues/163)); currently disabled repo-wide via [issue #3482](https://github.com/google/cadvisor/issues/3482) | N/A | Not in Debian/Ubuntu riscv64 archives | Not in project-reports/scope.yml |
| [opencontainers/runc](https://github.com/opencontainers/runc) | Container-runtime client (cgroups, Intel RDT) | Yes - added v1.2.0 via [PR #3446](https://github.com/opencontainers/runc/pull/3446), backported to 1.1.x via [PR #3905](https://github.com/opencontainers/runc/pull/3905) | Yes - in CI matrix | Yes - `runc.riscv64` + `.asc` every release since v1.2.0 | [Issue #5166](https://github.com/opencontainers/runc/issues/5166) closed/resolved. See `project-reports/runc.md` |
| [opencontainers/cgroups](https://github.com/opencontainers/cgroups) | cgroups v1/v2 management, used pervasively | Yes - pure Go, no arch-specific code | Yes (inherited) | N/A (library) | None found |
| [opencontainers/runtime-spec](https://github.com/opencontainers/runtime-spec) | OCI spec definitions (seccomp arch enums) | Yes | Yes | N/A (spec package) | [PR #1059](https://github.com/opencontainers/runtime-spec/pull/1059) and [PR #1217](https://github.com/opencontainers/runtime-spec/pull/1217) merged, released in v1.1.0 |
| [containerd/containerd](https://github.com/containerd/containerd) | CRI/containerd shim client | Yes | Partial - riscv64 CI test matrix still an **open** ask | Yes - binaries shipped since v1.6.8 | Open: [issue #13020](https://github.com/containerd/containerd/issues/13020) and [PR #13124](https://github.com/containerd/containerd/pull/13124). See `project-reports/containerd.md` |
| [moby/moby](https://github.com/moby/moby) (`api`, `client`) | Docker Engine API client | Yes (client is pure Go) | Yes | **No** - moby/moby ships no official riscv64 release binaries; see [PR #52162](https://github.com/moby/moby/pull/52162) | Open gap upstream; cadvisor's client-library usage itself unaffected. See `project-reports/docker.md` |
| [golang.org/x/sys](https://pkg.go.dev/golang.org/x/sys) | Low-level syscall bindings (perf, devicemapper, machine detection) | Yes - long-standing support | Yes | N/A (library) | None open |
| [klauspost/compress](https://github.com/klauspost/compress) | Compression codec (containerd/OTel dependency chain) | Yes - explicit `riscv64` build tag in fast-path unsafe loader (`internal/le/unsafe_enabled.go`) | Yes | N/A (library) | None open |
| [google.golang.org/grpc](https://github.com/grpc/grpc-go) | RPC client for containerd communication | Yes (pure Go) | Yes | No binary release assets for any arch (source-distributed). See `project-reports/grpc.md` | None |
| [prometheus/client_golang](https://github.com/prometheus/client_golang), prometheus/common | Metrics exposition | Yes (pure Go) | Yes | N/A (library) | None. See `project-reports/prometheus.md` |
| [google.golang.org/protobuf](https://pkg.go.dev/google.golang.org/protobuf) | Protobuf runtime | Yes (pure-Go runtime; unrelated to protoc/C++ core's riscv64 gap) | Yes | N/A (library) | protoc/protobuf-cpp maintainers have declined riscv64 support (see `project-reports/protocol-buffers.md`), but cadvisor only consumes the pure-Go runtime, not protoc codegen |
| [mistifyio/go-zfs](https://github.com/mistifyio/go-zfs) | ZFS CLI wrapper, subprocess-based, no cgo | Yes (pure Go) | Untested directly but no arch-specific code | N/A (library) | No riscv64 issues found |
| devicemapper (`dmsetup`/`thin_ls` wrappers) | Shells out via `os/exec`, no cgo | Yes (pure Go wrapper; depends on host tool presence) | N/A | N/A | Not a Go dependency - a runtime host-tool dependency |

**Deep-dive on the one blocking dependency (libpfm4):** libpfm4 4.11.0's `ARCH` detection (`uname -m` mapped in `config.mk`) covers `x86_64, i386, mips, powerpc, sparc, arm, aarch64/arm64, s390x, cell` - riscv64 falls through with no `CONFIG_PFMLIB_ARCH_*` set, meaning the unconditional `make -e -C libpfm-4.11.0` step in `deploy/Dockerfile` would very likely fail or produce a non-functional library on riscv64. No riscv64 issue is open on the `wcohen/libpfm4` mirror requesting support. This is the single genuine dependency-level blocker in cadvisor's dependency graph, and it only affects the optional `-tags=libpfm` build variant - not the default release/container build path.

**Key finding:** no dependency blocks cadvisor's *own* default riscv64 build. The actual gap is cadvisor's own CI and release pipeline configuration (Section 7/8), not its dependency graph, which is riscv64-capable across the board except for the optional libpfm4 cgo path.

Existing related reports referenced: `project-reports/runc.md`, `project-reports/containerd.md`, `project-reports/docker.md`, `project-reports/libpfm4.md`, `project-reports/go.md`, `project-reports/grpc.md`, `project-reports/prometheus.md`, `project-reports/protocol-buffers.md`.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | (no riscv64 issue exists) | - | - | Zero open issues and zero closed issues mention "riscv", "riscv64", or "RV64" anywhere in the repository's history (exhaustive `gh search issues` across open/closed states, title/body/comments) |
| [PR #2364](https://github.com/google/cadvisor/pull/2364) | Ignore CPU clock for riscv64 | Merged (2020-01-07) | N/A (enhancement, not a bug fix) | The sole riscv64-related change in project history; no regressions or follow-up bug reports in 6+ years |
| [PR #2990](https://github.com/google/cadvisor/pull/2990) | build(deps): bump prometheus/client_golang | Closed, unmerged | N/A | False-positive keyword match (changelog text of an unrelated upstream dependency); no cadvisor-specific riscv64 relevance |
| [PR #2991](https://github.com/google/cadvisor/pull/2991) | build(deps): bump prometheus/client_golang in /cmd | Closed, unmerged | N/A | Same false positive as #2990, /cmd module variant |
| [Issue #3703](https://github.com/google/cadvisor/issues/3703) | Multi-arch images for arm/v7 | Closed, rejected | N/A (not riscv64, but directly relevant precedent) | Maintainer @dims: "probably not gonna happen!" - signals a high bar for adding any new architecture to the official image matrix |

**Correctness bugs:** none found. No open issue alleges a functional or correctness defect specific to riscv64 - the entire riscv64 surface area is too small (one guard clause) to have generated bug reports.

## 12. Objections and Upstream Blockers

**Stated objections:** none specific to riscv64 exist in the issue/PR history - there has never been a riscv64 feature request or tracking issue to object to. The closest analogous data point is maintainer @dims's rejection of an arm/v7 multi-arch image request ([issue #3703](https://github.com/google/cadvisor/issues/3703), December 2025): "probably not gonna happen!"

**Technical blockers:**
1. `libpfm4` (optional `-tags=libpfm` perf-counter backend) has no riscv64 support upstream - would need to be arch-gated in `deploy/Dockerfile` (the same way `libipmctl` is already gated to x86_64) before a riscv64 container image build could succeed with the default Dockerfile as written.
2. No riscv64 entry exists in `release-binaries.yml`'s or `publish-container.yml`'s matrices - purely a configuration gap, not a code gap, for the default `CGO_ENABLED=0` release-binary path.
3. No riscv64 test fixture (`cpuinfo_riscv64`) exists, so even the one riscv64-specific behavior (`isRiscv64()` skip) has no regression-test coverage.

**Organizational blockers:**
1. The project's own roadmap document states an intent to deprecate cadvisor entirely by 2027 in favor of OpenTelemetry Collector and container-runtime-native metrics - any new architecture-enablement investment competes against a sunset timeline.
2. Google's "outsized ownership... with limited OSS governance model" (maintainers' own words) means architecture-support decisions rest with a small, Google-dominated maintainer group that has already declined a comparably trivial arm/v7 request.
3. No RISC-V silicon vendor or RISE-affiliated engineer holds maintainer or frequent-contributor status on this repo.

**Acceptance probability:** for a minimal "add riscv64 to the release/container matrix" PR, mirroring the arm/v7 precedent, **low-to-medium** - the code change would be trivial (append one array entry, similar to how riscv64 was mechanically added to other Go-based OCI-ecosystem projects like runc and containerd), but the maintainers have shown reluctance to expand the officially supported architecture surface even for simpler asks, and the project's declared trajectory is toward maintenance-mode/closure rather than growth. A narrowly scoped "keep compiling cleanly on riscv64" contribution (e.g., a riscv64 entry in `test.yml`'s build step, without pushing for official release/container status) would face substantially less resistance, consistent with the low-friction reception PR #2364 received in 2019-2020.

## 13. Investment Analysis

Before sizing new work: RISE has no documented involvement with cadvisor. Cross-checked the RISE blog (31 posts enumerated via sitemap, zero mention cadvisor), the RISE Python wheel builder (~70 packages, cadvisor not listed - moot, since cadvisor has no PyPI presence at all), and the `riseproject-dev` GitHub org (48 repos, zero name/description/code matches for "cadvisor"). One adjacent repo, `riseproject-dev/kubernetes-riscv` (a RISC-V fork of kubernetes/kubernetes), vendors `github.com/google/cadvisor v0.56.2` in its `go.mod` as a transitive kubelet dependency, but this is not a dedicated cadvisor port or benchmark effort - its own open issues (#1 build arm64/amd64 images, #2 ZTE Corp K8s/etcd Tier-2 proposal) do not mention cadvisor. Google LLC is a RISE Premier Member, but that membership is org-wide (chip/toolchain-focused working groups) with no documented connection to cadvisor specifically. **No RISE-funded work on cadvisor exists to deduct from the estimates below.**

### 13.1 Functional Enablement

The core stats-collection path (cgroups parsing, container runtime clients) is pure Go and already functionally complete on riscv64 by inheritance from its dependencies (Section 9). The only functional gap is the optional `-tags=libpfm` perf-counter path, which requires either (a) upstream libpfm4 riscv64 support (external dependency, not cadvisor's to fix) or (b) arch-gating it out of the riscv64 Dockerfile build (small, cadvisor-side fix). Adding a `cpuinfo_riscv64` test fixture to exercise `isRiscv64()` is a small, self-contained addition.

### 13.2 Performance Optimization

Not applicable. cAdvisor has no SIMD/vectorized code on any architecture, so there is no riscv64-specific performance-optimization backlog to fund.

### 13.3 CI/CD Infrastructure

Adding riscv64 to `test.yml` (build-only smoke test), `release-binaries.yml` (matrix entry, trivial given existing `CGO_ENABLED=0` pure-Go release path), and `publish-container.yml` (platform entry, requires the Dockerfile libpfm4 gating fix from 13.1 first) are each small, mechanical PRs modeled directly on the existing arm64 matrix entries.

### 13.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale below. cAdvisor is consumed as a vendored dependency inside kubelet/Kubernetes; it does not itself host a plugin/package ecosystem that third parties extend on riscv64. (Kubernetes' own riscv64 status is out of scope for this report.)

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `cpuinfo_riscv64` test fixture, exercise `isRiscv64()` in unit tests | 0.5 | Any contributor | Low |
| Functional | Arch-gate `-tags=libpfm` out of `deploy/Dockerfile` for riscv64 (mirror existing `libipmctl` x86_64 gating) | 0.5 | Any contributor | Medium |
| CI | Add `riscv64` build-only job to `test.yml` (compile-check, no execution needed given no native riscv64 runner in CI today) | 0.5 | Any contributor | Medium |
| CI/Release | Add `riscv64` to `release-binaries.yml`'s `matrix.arch` | 0.5 | Any contributor, needs maintainer sign-off | Medium |
| CI/Release | Add `linux/riscv64` to `publish-container.yml`'s `platforms:` (blocked on libpfm4 gating fix above) | 1.0 | Any contributor, needs maintainer sign-off | Medium |
| Organizational | Engage @dims/@bobbypage/@mrunalp to gauge appetite given the arm/v7 precedent and the 2027 deprecation roadmap before investing further | 0.5 (advocacy) | RISE/community liaison | High (gates everything else) |
| Upstream (external) | File/fund a riscv64 support request against `wcohen/libpfm4` (not cadvisor's repo) | Not sized here - see `project-reports/libpfm4.md` | External | Low (only matters if perf-counter feature is required) |

**Total estimated effort for cadvisor-side work:** approximately 3 person-weeks, contingent on maintainer receptivity (see Objection/Organizational-blocker discussion in Section 12). Given the project's stated 2027 deprecation trajectory, this should be weighed as a low-cost, low-durability investment - any silicon-vendor effort here has a bounded shelf life unless a successor project (OpenTelemetry Collector's container-metrics receiver, or a CNCF-adopted fork) picks up cadvisor's role.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [google/cadvisor PR #2364 - "Ignore CPU clock for riscv64"](https://github.com/google/cadvisor/pull/2364)
- [google/cadvisor PR #2990 - dependency bump (false-positive match)](https://github.com/google/cadvisor/pull/2990)
- [google/cadvisor PR #2991 - dependency bump (false-positive match)](https://github.com/google/cadvisor/pull/2991)
- [google/cadvisor issue #3703 - arm/v7 multi-arch image request, rejected](https://github.com/google/cadvisor/issues/3703)
- [google/cadvisor issue #3482 - libipmctl disablement](https://github.com/google/cadvisor/issues/3482)
- [google/cadvisor issue #2786 - multiarch docker image enhancement request](https://github.com/google/cadvisor/issues/2786)
- [google/cadvisor PR #3141 - multi-arch image build support (ppc64le/s390x)](https://github.com/google/cadvisor/pull/3141)
- [lib/machine/machine.go (current)](https://github.com/google/cadvisor/blob/master/lib/machine/machine.go)
- [README.md (Community section)](https://github.com/google/cadvisor/blob/master/README.md)
- [docs/roadmap.md](https://github.com/google/cadvisor/blob/master/docs/roadmap.md)
- [docs/development/build.md](https://github.com/google/cadvisor/blob/master/docs/development/build.md)
- [LICENSE](https://github.com/google/cadvisor/blob/master/LICENSE)
- [.github/workflows/test.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/test.yml)
- [.github/workflows/release-binaries.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/release-binaries.yml)
- [.github/workflows/publish-container.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/publish-container.yml)
- [.github/workflows/tag-lib-module.yml](https://github.com/google/cadvisor/blob/master/.github/workflows/tag-lib-module.yml)
- [.github/workflows/stale.yaml](https://github.com/google/cadvisor/blob/master/.github/workflows/stale.yaml)
- [deploy/Dockerfile](https://github.com/google/cadvisor/blob/master/deploy/Dockerfile)
- [deploy/Dockerfile.ppc64le](https://github.com/google/cadvisor/blob/master/deploy/Dockerfile.ppc64le)
- [build/build.sh](https://github.com/google/cadvisor/blob/master/build/build.sh)
- [build/check_container.sh](https://github.com/google/cadvisor/blob/master/build/check_container.sh)
- [build/release.sh](https://github.com/google/cadvisor/blob/master/build/release.sh)
- [google/cadvisor releases](https://github.com/google/cadvisor/releases)
- [wcohen/libpfm4 (upstream mirror)](https://github.com/wcohen/libpfm4)
- [opencontainers/runc PR #3446](https://github.com/opencontainers/runc/pull/3446)
- [opencontainers/runc PR #3905](https://github.com/opencontainers/runc/pull/3905)
- [opencontainers/runc issue #5166](https://github.com/opencontainers/runc/issues/5166)
- [opencontainers/runtime-spec PR #1059](https://github.com/opencontainers/runtime-spec/pull/1059)
- [opencontainers/runtime-spec PR #1217](https://github.com/opencontainers/runtime-spec/pull/1217)
- [containerd/containerd issue #13020](https://github.com/containerd/containerd/issues/13020)
- [containerd/containerd PR #13124](https://github.com/containerd/containerd/pull/13124)
- [moby/moby PR #52162](https://github.com/moby/moby/pull/52162)
- [klauspost/compress - internal/le/unsafe_enabled.go](https://github.com/klauspost/compress)
- [RISE Project site](https://riseproject.dev)
- [RISE Project members](https://riseproject.dev/members)
- [riseproject-dev/kubernetes-riscv](https://github.com/riseproject-dev/kubernetes-riscv)
- [Debian package tracker: cadvisor](https://tracker.debian.org/pkg/cadvisor)
- [Debian buildd status: cadvisor](https://buildd.debian.org/status/package.php?p=cadvisor)
- [Ubuntu packages search: cadvisor](https://packages.ubuntu.com/search?keywords=cadvisor&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V status page](https://archriscv.felixc.at/.status/status.htm)
- [PyPI: cadvisor (404, not present)](https://pypi.org/pypi/cadvisor/json)