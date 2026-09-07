---
title: balenaOS
parent: Project Reports
color: orange
---

# balenaOS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for balenaOS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

balenaOS is a minimal, container-focused Linux distribution built by balena.io for IoT/edge device fleets. Its core container runtime is [balena-engine](https://github.com/balena-os/balena-engine), a hard fork of Docker/Moby's `moby/moby` engine, kept in sync with upstream via periodic rebase/merge. balena.io is a privately held commercial company (copyright notice: "2026 Balena, all rights reserved"). There is no independent foundation affiliation (no Linux Foundation, Apache Foundation, or comparable umbrella governance body) - "open in the open" is balena's community-participation stance, not a formal foundation governance structure.

balena-engine's own `MAINTAINERS` file is the upstream Moby/Docker project's maintainers file, inherited verbatim ("This file describes the maintainer groups within the moby/moby project... project/GOVERNANCE.md"). balena has not authored an independent maintainer-governance document for this repo. The maintainer roster is dominated by Docker, Inc. employees (thajeztah, tonistiigi, vvoland, rumpl, corhere, laurazard, robmry, all docker.com emails), with additional affiliations at Red Hat, Mirantis, Huawei, IBM, Google, and Microsoft. No listed core maintainer carries a balena.io email. balena's own engineering contributions appear as a distinct, smaller layer on top of the inherited Moby codebase (CI bot `accounts+flowzone-github@balena.io`, plus named individuals Roman Mazur, Kyle Harding, Vipul Gupta, Paulo Castro, Leandro Motta Barros, each with single-digit commit counts against a 40,739-commit total history).

License: Apache License 2.0.

**Community culture on new ports:** balena's documentation (`docs.balena.io/reference/os/customer-board-support`) is explicit: *"We do not currently support customers who wish to bring up balenaOS on new hardware themselves."* New architecture/board enablement is not accepted via community pull requests or a public tiering process - it is gatekept behind balena's paid Custom Device Support (CDS) commercial offering. This is materially different from community-driven distro or Yocto-style ports.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-06-26 | `bridge: add riscv64 build tags` lands in balena-engine's history (inherited from upstream Moby PR #2389, authored by Tonis Tiigi/tonistiigi, Docker Inc.) | [commit 3780098](https://github.com/balena-os/balena-engine/commit/3780098cd6be0a82f725fa4e2412b33e3be95276) |
| 2019-06-27 | `vendor: update netns to 7109fa855, for riscv64` (inherited upstream PR #2412) | [commit 84fdfbd](https://github.com/balena-os/balena-engine/commit/84fdfbdae3ad0efce8dacf8b3e6aa06954b68119) |
| 2019-07-02 | `Update modules to support riscv64` (inherited upstream Moby PR #39423, carlosedp) | [commit 527f9f7](https://github.com/balena-os/balena-engine/commit/527f9f75d6b815f548c34feffdbab3f31471a942) |
| 2019-08-21 | `bump x/sys to fix riscv64 epoll` (inherited upstream Moby PR #39726, carlosedp) | [commit 0537236](https://github.com/balena-os/balena-engine/commit/0537236e5a88a4e16f921cd88b7fcaef8d052fe8) |
| 2020-04-04 | `Add riscv64 support to the build scripts` (inherited upstream Moby PR #40664, carlosedp) | [commit 846b557](https://github.com/balena-os/balena-engine/commit/846b557cb87967f5968f86a210175507ec4aac54) |
| 2022-05-13 | `seccomp: support riscv64` (inherited upstream Moby PR #43553, AkihiroSuda) | [commit f1dd6bf](https://github.com/balena-os/balena-engine/commit/f1dd6bf84e28930e1ccd903361f9284fb22d3b8a) |
| 2022-08-05 | containerd v1.6.7 vendor bump adds ppc64le/riscv64 builds | [commit 4e46d9f](https://github.com/balena-os/balena-engine/commit/4e46d9f963b5f7cec5022e2f9528acda08b6134a) |
| 2023-07-19 | Dockerfile runc v1.1.8 bump - "addition of RISC-V support" in runc | [commit df86d85](https://github.com/balena-os/balena-engine/commit/df86d855f57bd28163f156941e52d6182167ef40) |
| 2024-01-23 | fix host-gateway-ip label - buildx output example incidentally lists `linux/riscv64` as a platform | [commit b8cc2e8](https://github.com/balena-os/balena-engine/commit/b8cc2e8c66df73d58543feb34c9e35e01a5e29f4) |
| 2024-09-10 | `seccomp: add riscv64 mapping` (25.0 backport, inherited upstream Moby PR #48465, gdams) | [commit 5a91b94](https://github.com/balena-os/balena-engine/commit/5a91b941b8c3e08cee3f0078ebad78a1efaddae5) |

**Key contributors and their organizations:** Tonis Tiigi (Docker Inc.), carlosedp [NEEDS VERIFICATION - affiliation not independently confirmed], AkihiroSuda (independent/Docker ecosystem maintainer), gdams (Docker Inc. / Adoptium). None of these individuals are balena.io employees.

**Is it fully upstream?** All riscv64-related commits in this history are inherited passively from upstream Moby/Docker Engine through balena-engine's periodic rebase/merge process - they were never opened as GitHub Issues or Pull Requests against `balena-os/balena-engine` itself (confirmed by zero-hit PR/issue searches against this repo). Direct verification of the cited upstream PR numbers (#2389, #39423, #2412, #39726, #40664, #43553, #48465) against `github.com/balena-os/balena-engine/pull/<N>` returned HTTP 404 for every one - none exist as PR objects in this repository (balena-os/balena-engine's own PR numbering currently tops out around #505). **There is no balena-authored or balena-reviewed riscv64 porting effort.** No master tracking issue for a riscv64 port exists anywhere in the `balena-os` organization (checked across `balena-engine`, `meta-balena`, `balena-supervisor`, `balena-os`, `balena-generic`, `balena-allwinner`, `balena-os-device-support`).

## 3. Upstream Support Tier

**Formal tier policy:** None exists in the engine repository itself - no `PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/`, `OWNERS`, or `CODEOWNERS` file defines an architecture-support tier system. The operative policy lives in balena's product documentation and is restrictive: devices are either already on balena's official supported-devices list, or brought up only through paid Custom Device Support. There is no open, community-driven pathway to add a new CPU architecture.

**Evidence (CI, release-blocking, official binaries):**
- CI: zero riscv64 references across all 12 `.github/workflows/*.yml` files (confirmed by direct grep of the cloned repository at HEAD `338143c`, branch `release/v25.0`).
- Build matrix: `docker-bake.hcl`'s `_platforms` target (which feeds both `binary-cross`/`all-cross` and is read dynamically by `bin-image.yml` and `ci.yml`) excludes riscv64.
- Official binaries: GitHub release v20.10.43 ships tarballs for amd64, arm64, armv5e, armv6l, and armv7hf only - no riscv64 asset.

**Comparison table:**

| Architecture | CI build | CI test | Official release binary | In `_platforms` build matrix |
|---|---|---|---|---|
| amd64 | Yes | Yes | Yes | Yes |
| arm64 | Yes (dedicated `arm64.yml`, `ubuntu-24.04-arm` runner) | Yes | Yes | Yes |
| riscv64 | No | No | No | No |

Source: [docker-bake.hcl](https://github.com/balena-os/balena-engine/blob/master/docker-bake.hcl), [.github/workflows/](https://github.com/balena-os/balena-engine/tree/master/.github/workflows).

## 4. Technical Architecture and RISC-V-Specific Subsystems

balena-engine is a Go daemon (container orchestration/lifecycle management) with no JIT and no numerics/SIMD hot paths of its own - it is not an optimization-purpose project. The relevant "architecture-specific" surface is limited to OCI seccomp syscall-filtering tables and a network-helper build stub.

**First-party balena-engine code touching riscv64 (4 files total, all boilerplate/plumbing, no compute code):**

| File | Lines | RISC-V content | Quality |
|---|---|---|---|
| `profiles/seccomp/default_linux.go` | 829 | Adds `specs.ArchRISCV64` to the arch table; allows `riscv_flush_icache` syscall gated to `Arches: ["riscv64"]` | Generic OCI runtime-spec boilerplate shared by every architecture, not riscv64-specific engineering |
| `profiles/seccomp/seccomp_linux.go` | 168 | `"riscv64": specs.ArchRISCV64` and `"riscv64": "riscv64"` lookup-table entries | Same as above |
| `profiles/seccomp/default.json` | 832 | Generated JSON mirror of the above `.go` file | Auto-generated |
| `Dockerfile` (line 418) | - | `FROM scratch AS vpnkit-linux-riscv64` | **Explicit no-op stub** - "use dummy scratch stage to avoid build to fail for unsupported platforms." VPNKit (the network-proxy helper) has no riscv64 build; the component is simply absent on RISC-V. |

No `arch/riscv/` directory, no balena-engine-authored `.S` assembly files, no JIT, and no SIMD dispatch exist anywhere in the engine's own source tree.

**Vendored third-party riscv64 code present but not balena's own:** `vendor/golang.org/x/sys/{unix,cpu}` (including real ISA-extension detection via `riscv_hwprobe` exposing `HasC`, `HasV`, `HasZba`, `HasZbb`, `HasZbs` - but this is Go runtime plumbing, unused by balena-engine for any dispatch decision), `vendor/golang.org/x/net`, `vendor/github.com/moby/buildkit/util/archutil` (QEMU-emulation detection stubs), `vendor/go.etcd.io/bbolt`, `vendor/github.com/prometheus/procfs`, `vendor/github.com/creack/pty`. None contain RVV intrinsics or hand-written SIMD kernels.

**Comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Seccomp arch/syscall table | Full (generic table entry) | Full (generic table entry) | Present (generic table entry only - not riscv64-specific engineering) |
| vpnkit network helper | Real binary (`djs55/vpnkit`) | Real binary (`djs55/vpnkit`) | **Missing** (`FROM scratch` dummy stub) |
| Dedicated CI source files | N/A | 1 (`arm64.yml`) | 0 |

This project is not optimization-purpose (per Step 2 of the readiness color model - it is a container runtime, not a performance-differentiated algorithm library), so the optimization-level cap does not apply.

## 5. Build System, Cross-Compilation, and Toolchain

balena-engine has no CMake-based build system for its own code (confirmed: no `CMakeLists.txt`, no `cmake/` directory, no `BUILDING.md`, `docs/building.md`, `docs/cross-compilation.md`, or `Dockerfile.riscv64` anywhere in the repo). It is a Go project built via **Make -> Docker Buildx Bake -> one multi-stage Dockerfile** using the `tonistiigi/xx` cross-compilation wrapper.

**Entry points (Makefile):**
```
make binary       # bake binary
make dynbinary    # bake dynbinary
make cross        # bake binary-cross   (all _platforms)
make all          # bake all
```

**Official cross-compile platform matrix** (`docker-bake.hcl`, target `_platforms`, feeding `binary-cross`, `all-cross`, `bin-image-cross`):
```
linux/amd64, linux/arm/v5, linux/arm/v6, linux/arm/v7,
linux/arm64, linux/ppc64le, linux/s390x, windows/amd64
```
riscv64 is absent from this list and from `binary-smoketest`'s equivalent list.

**Toolchain versions pinned in `Dockerfile`:** Go 1.23.9, base image `golang:1.23.9-bookworm` (Debian 12), `tonistiigi/xx` v1.6.1.

**Why the pinned base likely excludes riscv64:** riscv64 only became an official Debian *release* architecture with Debian 13 "trixie" (2025). balena-engine's Dockerfile pins `BASE_DEBIAN_DISTRO="bookworm"` (Debian 12), which predates that - under bookworm, riscv64 cross packages (`gcc-riscv64-linux-gnu`, `libseccomp-dev:riscv64`, `libapparmor-dev:riscv64`) are only available via the unofficial `debian-ports` archive, not bookworm's main apt sources. This is the most likely practical reason riscv64 is excluded from `_platforms` - `xx-apt-get` would need extra, untested apt-source wiring. [NEEDS VERIFICATION - no explicit maintainer statement confirms this as the stated reason; this is an inference from the toolchain configuration.]

**QEMU usage:** CI uses `docker/setup-qemu-action@v3` solely to register `binfmt_misc` handlers so Buildx can emulate non-native-arch stages for smoke tests and base images. Actual compilation uses native-`$BUILDPLATFORM` + `xx` cross-compilation, not QEMU emulation. Since riscv64 isn't in any bake platform list, QEMU/riscv64 is never exercised in this repo's CI.

**Known build failures:** None documented for riscv64 specifically, because riscv64 is never attempted in the build matrix - there is no build to fail. The one riscv64 reference (`FROM scratch AS vpnkit-linux-riscv64`) is a deliberate placeholder to avoid a build failure if riscv64 were ever added to the platform list, precisely because no real riscv64 vpnkit binary exists upstream (`djs55/vpnkit`).

The one CMake invocation in the codebase (for `tini`/PID-1 helper, vendored from `krallin/tini`) has no riscv64-specific configuration and applies identically across all platforms via the `xx` cross-gcc wrapper.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core daemon (build/run) | Yes | Yes | **No - excluded from build matrix** |
| Container runtime (runc) integration | Yes | Yes | Not exercised (daemon itself doesn't build) |
| containerd integration | Yes | Yes | Not exercised |
| Seccomp default profile | Yes | Yes | Table entry present but never exercised (no riscv64 binary to run it) |
| VPNKit networking helper | Yes (real binary) | Yes (real binary) | **No - explicit dummy stub** |
| Official release binary | Yes | Yes | **No** |
| CI test execution | Yes | Yes | **No** |

**Functional gaps:** balena-engine cannot be built through its own official pipeline for riscv64 at all - this is a complete functional gap, not a partial one. Nothing downstream of "does the binary exist" can be assessed (no engine binary means no container execution, no image management, no CRI layer to evaluate on real riscv64 hardware).

**Performance gaps:** Not assessable - there is no riscv64 binary to benchmark. No published benchmark data exists (see Section 11).

**Security hardening gaps:** The seccomp default profile's riscv64 arch table entry and the `riscv_flush_icache` syscall allowance are present in source but never exercised in production since no riscv64 build ships. Whether the syscall allow-list is actually complete and safe for riscv64 in practice is unverified because it has never run on real hardware through balena's own pipeline.

**NaN / floating-point semantics issues:** No data found - not applicable at this level (no compute-hot-path code; RISC-V floating point NaN-boxing/canonicalization would be a concern in a numerics library, not a container daemon).

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? No.** Confirmed by directly reading all 12 workflow files in the local clone (`.dco.yml`, `.test-prepare.yml`, `.test.yml`, `.windows.yml`, `arm64.yml`, `bin-image.yml`, `buildkit.yml`, `ci.yml`, `test.yml`, `validate-pr.yml`, `windows-2019.yml`, `windows-2022.yml`) plus `docker-bake.hcl` and `Dockerfile`. A case-insensitive grep for `riscv|RISCV|RISC-V` across every workflow file returned zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.

**RISE runners?** None referenced anywhere in the CI configuration. No RISE Project involvement of any kind was found for balenaOS (see Section 12).

**Hardware used for existing CI:** `ubuntu-24.04` (x86) runners for `ci.yml`/`bin-image.yml`; a dedicated `ubuntu-24.04-arm` runner for `arm64.yml`. No riscv64 runner, self-hosted or otherwise, appears anywhere. Note also that `bin-image.yml`'s push/merge steps are gated on `github.repository == 'moby/moby'` - i.e. this workflow is the literal inherited upstream Moby workflow, not a balena-specific pipeline, reinforcing that riscv-adjacent history here is inherited Moby/Docker content rather than balena engineering.

**Comparison table:**

| Architecture | Dedicated CI workflow | Test execution | Runner type |
|---|---|---|---|
| amd64 | `ci.yml`, `bin-image.yml`, `test.yml` | Yes | `ubuntu-24.04` |
| arm64 | `arm64.yml` | Yes | `ubuntu-24.04-arm` |
| riscv64 | None | No | None |

Source: [.github/workflows/](https://github.com/balena-os/balena-engine/tree/master/.github/workflows), [docker-bake.hcl](https://github.com/balena-os/balena-engine/blob/master/docker-bake.hcl).

## 8. Distribution and Release Status

**Official binaries for riscv64: none.** GitHub release v20.10.43 (latest, 7 assets) lists only:
- `balena-engine-v20.10.43-amd64.tar.gz`
- `balena-engine-v20.10.43-arm64.tar.gz`
- `balena-engine-v20.10.43-armv5e.tar.gz`
- `balena-engine-v20.10.43-armv6l.tar.gz`
- `balena-engine-v20.10.43-armv7hf.tar.gz`
- Source code (zip, tar.gz)

Verified twice (initial research pass and independent adversarial verification pass), both against the live GitHub releases page for [balena-os/balena-engine](https://github.com/balena-os/balena-engine/releases).

**PyPI:** Not applicable - balenaOS is not a Python package. Checking `https://pypi.org/pypi/balenaos/json` (in case a companion Python tool exists under that name) returned HTTP 404 - no such package exists on PyPI at all.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/balenaos/` returns an HTTP 302 redirect straight to the (nonexistent) upstream PyPI page - no independent RISE-built package exists.

**npm, Maven, OCI:** Not applicable to this project's distribution model in the ways checked; no evidence of npm or Maven packaging was found or expected for a Go container-engine binary.

**Ubuntu 26.04 (resolute):** Search for `balenaOS`/`balenaos` across all sections and architectures returned "Sorry, your search gave no results." No package exists.

**Arch Linux RISC-V (archriscv.felixc.at):** No matching `balenaos` entry found.

**Debian, Fedora:** Not independently checked (balena-engine/balenaOS is not a standard Debian/Fedora source package to begin with - it ships as a purpose-built OS image, not a distro-packaged binary).

**What must a user do to get a working binary?** There is currently no path to a working riscv64 balena-engine binary through any official or community channel checked. A user would need to build balena-engine from source themselves, first adding `linux/riscv64` to `docker-bake.hcl`'s `_platforms` list and resolving the Debian-bookworm-base cross-toolchain gap described in Section 5 - this is unsupported, untested territory with no upstream guidance.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| `klauspost/compress` v1.17.4 | zstd/S2/gzip compression for OCI layers | Yes (generic Go fallback, no riscv64 asm) | Yes (arch-agnostic Go tests) | N/A (library) | No open riscv64 issue found |
| `klauspost/cpuid/v2` v2.0.9 | SIMD-capability detection | Yes (falls to `Generic` feature set) | Yes | N/A (library) | Issue [klauspost/cpuid#158 "Support RISC-V"](https://github.com/klauspost/cpuid/issues/158), opened 2025-03-21, closed 2026-06-16 (`completed`) |
| `minio/sha256-simd` v1.0.0 | Accelerated SHA-256 | Yes (`sha256block_other.go` generic fallback) | Yes (functionally correct, no SIMD) | N/A (library) | No riscv64 issue found |
| `cilium/ebpf` v0.16.0 | eBPF program loading | Yes (pure Go, arch-agnostic) | Unknown - no confirmed riscv64 CI upstream | Yes | Minor: no riscv64 hardware CI runner (per `project-reports/runc.md` Section 9) |
| `go.etcd.io/bbolt` v1.3.7 | mmap-based KV store (containerd metadata) | Yes, since ~May 2019 | Yes | N/A (library) | No open riscv64 issues |
| `seccomp/libseccomp-golang` v0.10.0 + libseccomp (C) | Syscall filtering (BPF) | Yes, since libseccomp-golang v0.9.2 / libseccomp v2.5.0 (2020-2021) | Yes | Yes (Debian/Ubuntu/Arch all ship riscv64) | Fully resolved - see `project-reports/libseccomp.md` |
| `opencontainers/runc` (Dockerfile builds upstream v1.2.5 directly, not the vendored `balena-os/balena-runc` fork) | OCI container runtime | Yes, upstream since v1.2.0 (2022) | No - no riscv64 CI in upstream runc | Yes, upstream release binaries since v1.2.0 | See `project-reports/runc.md`; CI gap only |
| `containerd/containerd` (vendor.mod replaces with fork `balena-os/balena-containerd`, pinned commit) | Container lifecycle/image/CRI layer | Upstream: Yes, since v1.6.8 (2022) | Upstream: 0 riscv64 tests in CI (PR #13124 open, unmerged, blocked on org-admin action) | Upstream: Yes | See `project-reports/containerd.md` |

**Deep-dive - forks vs. upstream:** `balena-os/balena-runc`'s own hand-maintained `Makefile` `localcross`/`release` target only cross-compiles armel/armhf/arm64/ppc64le - no riscv64 - but this fork's Makefile is not what builds the shipped binary (the Dockerfile builds upstream `opencontainers/runc` directly). `balena-os/balena-containerd` has zero riscv64 issues/PRs and no `riscv` string anywhere in its Makefile or CI workflow (`flowzone.yml`) - this fork's own riscv64 posture relative to upstream containerd is unverified/untracked.

**Net assessment:** Every individual dependency that matters for riscv64 (compression, SIMD/crypto helpers, eBPF, mmap storage, seccomp) is either riscv64-clean upstream or degrades gracefully to a generic/pure-Go path with no correctness blocker. runc and containerd have upstream riscv64 build support (with CI-test gaps documented in their own reports). **The actual gap is balena-engine's own platform matrix, which has never included `linux/riscv64` and has no tracked issue requesting it** - this is a build-matrix and CI-enablement problem, not a dependency-compatibility problem.

**Note on graph-database verification:** The `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout this research, across multiple independent attempts. Ubuntu 26.04 "resolute" riscv64 package status for these dependencies was therefore verified only via `packages.ubuntu.com` web search (for balenaOS itself) and via cross-reference to already-published reports (`containerd.md`, `runc.md`, `libseccomp.md`) for the individual Go-module/C dependencies. This should be re-run in a session where the graph server is reachable.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-specific issues or PRs exist | N/A | N/A | Confirmed by exhaustive search across `balena-os/balena-engine` and the entire `balena-os` GitHub organization (`balena-engine`, `meta-balena`, `balena-supervisor`, `balena-os`, `balena-generic`, `balena-allwinner`, `balena-os-device-support`). All apparent "riscv64" search hits were semantic false positives about unrelated ARMv5/ARMv6/aarch64 topics, or (in one case, [balena-os/balena-os#271](https://github.com/balena-os/balena-os/issues/271)) an incidental mention of "riscv64" inside a pasted JSON blob of Docker Hub's supported-architecture list, not a substantive topic. |

**Correctness bugs:** None found - there is no riscv64 build to have correctness bugs in.

**No published performance benchmarks exist.** WebSearch for "balenaOS riscv64 benchmark," "balenaOS riscv64 vs arm64 performance," and site-restricted GitHub searches returned no genuine data - only unrelated general RISC-V benchmark suites and balena's own ARM64/x86_64-focused announcements.

## 12. Objections and Upstream Blockers

**Stated objections:** None found in balena-engine's own issue tracker specifically opposing riscv64 - because no one has ever requested it there. The structural objection is procedural, not technical: balena's documented policy states *"We do not currently support customers who wish to bring up balenaOS on new hardware themselves,"* directing all new-architecture/board work through the paid Custom Device Support offering rather than community contribution.

**Technical blockers:**
1. `docker-bake.hcl`'s `_platforms` list has never included `linux/riscv64` - a build-matrix change is needed before anything else can happen.
2. The Dockerfile's base image (`golang:1.23.9-bookworm`, i.e. Debian 12) predates Debian's official riscv64 release architecture status (achieved with Debian 13 "trixie" in 2025), meaning riscv64 cross-toolchain packages (`gcc-riscv64-linux-gnu`, `libseccomp-dev:riscv64`, etc.) are not available from bookworm's main apt sources without extra, untested apt-source wiring via `xx-apt-get`. [NEEDS VERIFICATION as the maintainers' actual stated reason - this is an inference from configuration, not a documented decision.]
3. VPNKit (a required networking helper component) has no riscv64 build upstream (`djs55/vpnkit` ships only amd64/arm64), which is why the Dockerfile already carries a dummy `scratch` stub for it - this component would need either a real riscv64 port or an accepted "networking helper absent on riscv64" tradeoff.

**Organizational blockers:** balena.io is a commercial entity with a paid-support-only model for new hardware bring-up; there is no public roadmap or community RFC process for riscv64 enablement to enter through. No RISE Project engagement, membership, or funded work involving balenaOS was found anywhere (see below), so there is no external body currently pushing this forward either.

**RISE involvement check:** Fetched all 34 RISE blog posts (2024-05-15 through 2026-08-24) - zero mention of balenaOS. Checked RISE's 8 Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and 12 General Members (Akeana, Andes, ESWIN, BOSC, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) - balena/balenaOS is not a member. GitHub search of the `riseproject-dev` org (`balenaOS`, `balena`) found only an incidental npm transitive dependency (`@balena/dockerignore`) in an unrelated RISE tooling repo's lockfile - not project involvement.

**Acceptance probability:** Low without external investment. Given the commercial CDS gatekeeping model and zero balena-authored interest signal (no issue, no PR, no roadmap mention across 6+ years of available riscv64 upstream code in dependencies), a riscv64 port would most plausibly happen through either (a) a paying customer commissioning it via CDS, or (b) an external contributor/organization (e.g., RISE) doing the work and submitting it upstream, since there's no evidence balena is independently prioritizing this.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Optimization gap:** N/A (balena-engine is a container runtime/orchestration daemon, not an optimization-purpose project per the color model's Step 2 test - it delivers its value through orchestration correctness, not through architecture-specific algorithmic speedups, so no ISA-extension coverage assessment applies)
- **Justification:** No upstream riscv64 CI exists - confirmed by direct grep of all 12 `.github/workflows/*.yml` files, `docker-bake.hcl`, and the `Dockerfile` in [balena-os/balena-engine](https://github.com/balena-os/balena-engine), all returning zero riscv64 matches. `docker-bake.hcl`'s `_platforms` list, which drives the entire build/release matrix, excludes `linux/riscv64` entirely. No riscv64 asset ships in [GitHub releases](https://github.com/balena-os/balena-engine/releases) (v20.10.43: amd64, arm64, armv5e, armv6l, armv7hf only), and no distribution channel checked (Ubuntu 26.04 resolute, Arch Linux RISC-V, PyPI) has a riscv64 package for balenaOS/balena-engine, so the distribution floor that would otherwise upgrade an "orange" to "yellow" does not apply - there is no downstream package to floor on. This places the project at orange: no upstream CI, no release, no distro fallback, and no positive evidence of confirmed breakage (which would require red) or insufficient data (which would require grey) - the negative evidence here is concrete and consistent across every channel checked.
- **Pending work that could change the grade:** None identified. No open PR adds riscv64 to `docker-bake.hcl` or `.github/workflows/`. No RISE Project engagement, membership, funded RFP, or blog coverage of balenaOS was found in any search performed. The underlying dependency chain (containerd, runc, libseccomp, klauspost/compress, cilium/ebpf, bbolt) is largely riscv64-ready upstream per their own project reports, meaning a future enablement effort would primarily be a build-matrix and CI-integration task on balena-engine's side rather than a dependency-remediation task - but no such effort is currently visible or scheduled.

## 14. Investment Analysis

RISE has done no work on balenaOS specifically (see Section 12) - no sizing offset applies. However, RISE-adjacent work on balena-engine's direct dependencies (containerd, runc, libseccomp) has already resolved most of the lower-layer risk; the sizing below assumes that work is reused as-is and focuses only on balena-engine's own gap.

### 14.1 Functional Enablement

Add `linux/riscv64` to `docker-bake.hcl`'s `_platforms` and `bin-image-cross` targets; resolve the Debian-bookworm cross-toolchain gap for riscv64 (either via `debian-ports` wiring in `xx-apt-get` or by bumping the build base past Debian 13/trixie); confirm the daemon builds and boots end-to-end with the upstream (already riscv64-capable) `runc` v1.2.x and `balena-os/balena-containerd` fork. VPNKit's dummy stub means the networking helper will be absent on riscv64 unless a real port is sourced or the gap is explicitly accepted for this platform.

### 14.2 Performance Optimization

Not applicable as a distinct workstream - balena-engine is not optimization-purpose, and its dependencies (compression, hashing) already have functionally correct generic-Go/scalar fallbacks on riscv64. Any future SIMD-path work (e.g., klauspost/compress riscv64 asm) would be upstream library work, not balena-engine-specific.

### 14.3 CI/CD Infrastructure

Add a riscv64 job analogous to the existing `arm64.yml` workflow, using either QEMU emulation (consistent with how `bin-image.yml` handles other cross-arch smoke tests) or a native riscv64 runner if available (e.g., via RISE's runner infrastructure, unconfirmed availability for this org). Wire test execution, not just build, to avoid landing at yellow (build-only) instead of blue/green.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's own scoping rule, since balena-engine is a standalone runtime/tool with no dependent package ecosystem (npm/PyPI/Maven consumers) that would need separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `linux/riscv64` to `docker-bake.hcl` platform lists and validate daemon build | 2-4 | balena-engine maintainers | High |
| Functional | Resolve Debian bookworm-base riscv64 cross-toolchain gap (debian-ports wiring or base-image bump) | 1-3 | balena-engine maintainers | High |
| Functional | Decide/implement VPNKit riscv64 handling (real port or accepted gap) | 1-2 (if accepted gap) / unknown (if real port needed) | balena-engine maintainers / VPNKit upstream | Medium |
| CI/CD | Add riscv64 CI job (build + test execution, QEMU or native runner) | 1-2 | balena-engine maintainers | High |
| Organizational | Establish a public path for architecture/board contributions outside paid CDS, or explicitly scope riscv64 as CDS-only | N/A (policy decision) | balena.io product/business leadership | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [balena-os/balena-engine repository](https://github.com/balena-os/balena-engine)
- [balena.io homepage](https://www.balena.io/)
- [balena-os/balena-engine docker-bake.hcl](https://github.com/balena-os/balena-engine/blob/master/docker-bake.hcl)
- [balena-os/balena-engine .github/workflows/](https://github.com/balena-os/balena-engine/tree/master/.github/workflows)
- [balena-os/balena-engine Dockerfile](https://github.com/balena-os/balena-engine/blob/master/Dockerfile)
- [balena-os/balena-engine MAINTAINERS](https://github.com/balena-os/balena-engine/blob/master/MAINTAINERS)
- [balena-os/balena-engine releases](https://github.com/balena-os/balena-engine/releases)
- [balena docs: customer board support policy](https://docs.balena.io/reference/os/customer-board-support)
- [commit 3780098 - bridge: add riscv64 build tags](https://github.com/balena-os/balena-engine/commit/3780098cd6be0a82f725fa4e2412b33e3be95276)
- [commit 84fdfbd - vendor: update netns for riscv64](https://github.com/balena-os/balena-engine/commit/84fdfbdae3ad0efce8dacf8b3e6aa06954b68119)
- [commit 527f9f7 - Update modules to support riscv64](https://github.com/balena-os/balena-engine/commit/527f9f75d6b815f548c34feffdbab3f31471a942)
- [commit 0537236 - bump x/sys to fix riscv64 epoll](https://github.com/balena-os/balena-engine/commit/0537236e5a88a4e16f921cd88b7fcaef8d052fe8)
- [commit 846b557 - Add riscv64 support to the build scripts](https://github.com/balena-os/balena-engine/commit/846b557cb87967f5968f86a210175507ec4aac54)
- [commit f1dd6bf - seccomp: support riscv64](https://github.com/balena-os/balena-engine/commit/f1dd6bf84e28930e1ccd903361f9284fb22d3b8a)
- [commit 4e46d9f - containerd v1.6.7 vendor bump](https://github.com/balena-os/balena-engine/commit/4e46d9f963b5f7cec5022e2f9528acda08b6134a)
- [commit df86d85 - runc v1.1.8 bump, RISC-V support](https://github.com/balena-os/balena-engine/commit/df86d855f57bd28163f156941e52d6182167ef40)
- [commit b8cc2e8 - host-gateway-ip label fix](https://github.com/balena-os/balena-engine/commit/b8cc2e8c66df73d58543feb34c9e35e01a5e29f4)
- [commit 5a91b94 - seccomp: add riscv64 mapping (25.0 backport)](https://github.com/balena-os/balena-engine/commit/5a91b941b8c3e08cee3f0078ebad78a1efaddae5)
- [balena-os/balena-os issue #271](https://github.com/balena-os/balena-os/issues/271)
- [balena-os/balena-engine issue #141](https://github.com/balena-os/balena-engine/issues/141)
- [balena-os/balena-engine issue #143](https://github.com/balena-os/balena-engine/issues/143)
- [klauspost/cpuid issue #158 - Support RISC-V](https://github.com/klauspost/cpuid/issues/158)
- [riseproject.dev](https://riseproject.dev/)
- [riseproject.dev/blog](https://riseproject.dev/blog/)
- [riseproject.dev/members](https://riseproject.dev/members/)
- [PyPI balenaos package lookup (404)](https://pypi.org/pypi/balenaos/json)
- [Ubuntu package search for balenaOS (resolute)](https://packages.ubuntu.com/search?keywords=balenaOS&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- Related project reports in this repository: `project-reports/containerd.md`, `project-reports/runc.md`, `project-reports/libseccomp.md`
