---
title: Kairos
parent: Project Reports
color: yellow
dependencies:
  - name: Docker
    relation: build-dependency
    criticality: optional
  - name: containerd
    relation: build-dependency
    criticality: optional
  - name: runc
    relation: build-dependency
    criticality: optional
  - name: go-tpm
    relation: build-dependency
    criticality: optional
  - name: go-tpm-tools
    relation: build-dependency
    criticality: optional
  - name: circl
    relation: build-dependency
    criticality: optional
  - name: LZ4
    relation: runtime-dependency
    criticality: optional
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: systemd
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" focus="kairos" %}

# Kairos

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Kairos<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Kairos is a Go-based immutable Linux meta-distribution and OS-image build toolchain for edge and Kubernetes deployments, comprising a monorepo (`kairos-io/kairos`: agent, SDK, kairos-init, kcrypt, immucore) plus satellite repos (`hadron` for base OS images, `AuroraBoot` for image assembly/release). It is a **CNCF Sandbox project**, structured as "a Series of LF Projects, LLC," licensed **Apache 2.0**.

Governance follows a Contributor -> Approver -> Maintainer -> Administrator ladder modeled on Kyverno's governance, with new maintainers nominated and voted in via the CNCF `gitvote` bot (4-week window, 100% pass threshold for maintainer votes). Of six active maintainers, five (all four Administrators: Ettore Di Giacinto, Dimitris Karakasilis, Itxaka Serrano Garcia, Mauro Morales, plus Maintainer Rishi Anand) are employed by **Spectro Cloud**, the project's de facto corporate sponsor, official enterprise-support provider, and the only entry in the project's own `CONTRIBUTING_ORGANIZATIONS.md`. One maintainer (William Rizzo) is from Mirantis, but Mirantis is not yet a formalized "Contributing Organization." The project's own documentation flags this single-sponsor concentration as a blocker to CNCF Incubation graduation, which requires demonstrated multi-organization backing. Cited real-world adopters: CLASTIX, DeEEP Network, imec, Spectro Cloud.

Community culture toward the riscv64 port is pragmatic and community-driven rather than gatekept: maintainers ran an explicit feasibility spike before committing resources, built out CI incrementally repo-by-repo, and published an open call inviting outside riscv64 hardware owners to test ("Report what breaks, and we'll work through the fixes together" - [kairos.io blog, 2026-08-28](https://kairos.io/blog/2026/08/28/kairos-riscv64-open-invitation/)), while being transparent that support remains incomplete: "this isn't an official Kairos release... there's no official riscv64 support yet either."

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-03-31 | Earliest riscv64 commit: `feat: Add riscv64 architecture support in goreleaser config` (kairos-agent#1175), authored by Itxaka Serrano Garcia (Spectro Cloud) | [PR list, kairos-agent#1175](https://github.com/kairos-io/kairos) |
| 2026-04-13 | Issue [#4039](https://github.com/kairos-io/kairos/issues/4039) "[SPIKE] Kairos / Hadron on riscv64" opened by mauromorales; notes access to native riscv64 CI hardware via `riseproject-dev/riscv-runner-app` | [#4039](https://github.com/kairos-io/kairos/issues/4039) |
| 2026-04-20 | hadron#307 "feat: add RISC-V (riscv64) architecture support" merged | hadron#307 |
| 2026-05-13 | Issue #4039 (SPIKE) closed as done | [#4039](https://github.com/kairos-io/kairos/issues/4039) |
| 2026-05-15 | AuroraBoot#509 "feat: add riscv64 architecture support" merged; issue [#4083](https://github.com/kairos-io/kairos/issues/4083) "Full riscv64 support: tracking issue" opened | AuroraBoot#509, [#4083](https://github.com/kairos-io/kairos/issues/4083) |
| 2026-05-17 | kairos-sdk#762 "Add riscv64 platform support" merged | sdk#762 |
| 2026-05-18 | kairos-agent#1216 riscv64 platform detection merged | agent#1216 |
| 2026-05-19 | hadron#368 "Enable kairos-init and ISO build for riscv64" merged | hadron#368 |
| 2026-05-20 | Issue [#4089](https://github.com/kairos-io/kairos/issues/4089) UPX/immucore QEMU-TCG crash opened; still open, blocked on upstream | [#4089](https://github.com/kairos-io/kairos/issues/4089) |
| 2026-05-22 | kairos-init#352 riscv64 UPX overrides + Fedora GRUB EFI packages merged | kairos-init#352 |
| 2026-06-04 | kairos-agent#1230 "skip shim copy on riscv64 EFI install" merged | agent#1230 |
| 2026-07-10 | AuroraBoot#635 "use SDK riscv64 GRUB EFI search paths for ISO builds" merged | AuroraBoot#635 |
| 2026-07-13 | kairos-init#398, kairos-sdk#806 fix Debian/openSUSE riscv64 GRUB EFI package/path issues, closing issue [#4235](https://github.com/kairos-io/kairos/issues/4235) | init#398, sdk#806, [#4235](https://github.com/kairos-io/kairos/issues/4235) |
| 2026-08-21 | hadron#572 "un-split riscv64 pipeline, drop native runner" merged | hadron#572 |
| 2026-08-24 | kairos#4377 "ci(master): build riscv64 on every master push, not release-only" merged | [kairos#4377](https://github.com/kairos-io/kairos/pull/4377) |
| 2026-08-28 | kairos-docs#680 "Kairos on RISC-V: An Open Invitation to Test It" merged and published as blog post | [blog](https://kairos.io/blog/2026/08/28/kairos-riscv64-open-invitation/) |
| 2026-08-31 | Issue [#4419](https://github.com/kairos-io/kairos/issues/4419) "riscv64 support: tracking epic" opened, superseding #4083 | [#4419](https://github.com/kairos-io/kairos/issues/4419) |
| 2026-09-02 | Issue #4083 closed as `not_planned` (checklist had gone stale) | [#4083](https://github.com/kairos-io/kairos/issues/4083) |
| 2026-09-07 | AuroraBoot#758 "re-enable riscv64 releases, don't let one arch block the manifest" merged | AuroraBoot#758 |
| 2026-09-08 | kairos-io/kairos v4.3.0 released, shipping riscv64 binary tarballs | [Releases](https://github.com/kairos-io/kairos/releases) |

**Key contributors:** Mauro Morales and Itxaka Serrano Garcia (both Spectro Cloud) drove the majority of the port; reviews from Dimitris Karakasilis (jimmykarily, Spectro Cloud). Numerous commits carry AI-pair-programming attribution ("Made-with: Cursor," "Co-Authored-By: Claude...").

**Is it fully upstream?** No. The master tracking epic [#4419](https://github.com/kairos-io/kairos/issues/4419) is open as of 2026-09-08 with its own definition of done ("a riscv64 Kairos image boots under emulation and on real hardware, built and released by a CI path that runs without a manual carve-out") explicitly unmet. Four items remain open across the ecosystem: kairos#4390 (draft, changes requested), AuroraBoot#760 (open), AuroraBoot#779 (open), hadron#573 (draft).

## 3. Upstream Support Tier

No formal, documented architecture-tier policy exists (no `PLATFORMS.md` or equivalent found in the repo or docs site). The project's own stated posture, from the August 2026 blog post, is that riscv64 is **"experimental and not officially released."**

Evidence for tier assignment (all confirmed by direct read of `.github/workflows/*.yml` in `kairos-io/kairos` at HEAD `83cd7e9`, 2026-09-08):
- `pr.yaml` (every pull request): `matrix_scope: ci` throughout, which resolves to amd64+arm64 only. **riscv64 is never built or tested on any PR.**
- `master.yaml` (push to master) and `release.yaml` (release tags `v*`): `matrix_scope: full`, which does include riscv64 - but only as a Go cross-compiled binary build (`GOARCH=riscv64`, `CGO_ENABLED=0`) on standard `ubuntu-latest` x86_64 runners. No QEMU, no native riscv64 hardware, no test execution.
- Release binaries for riscv64 are published upstream: v4.3.0 (2026-09-08) ships `kairos-v4.3.0-linux-riscv64.tar.gz`, `kairos-init-...`, `kairos-installer-...`, `kcrypt-challenger-...`, `provider-kairos-...` ([expanded_assets/v4.3.0](https://github.com/kairos-io/kairos/releases/tag/v4.3.0)).

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PR-gated CI | yes | yes | no |
| Master/release CI build | yes | yes | yes (cross-compiled binaries only) |
| Test execution in this repo | yes | yes (implied by ISO test matrices) | no |
| ISO/image build in this repo | yes | yes (arm64-core, arm64-rpi3, arm64-rpi4 cells) | no (0 cells) |
| Multi-arch container image publish | yes | yes | no (buildx hardcoded to `linux/amd64,linux/arm64`) |
| FIPS variant | yes | yes | no (explicitly excluded) |
| Official binary release | yes | yes | yes (v4.3.0) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Kairos is **not** a compiler, JIT, or numerics/SIMD codebase. Code searches confirmed zero hits for `vfloat32m1_t`, `rvv`, `extension:S`, `path:arch/riscv`, and `Zba OR Zbb OR Zicsr` across the repository, and a local filesystem check found no `arch/riscv*` directories or `.S` assembly files. **There is no vector/RVV code, no hand-written RISC-V assembly, and no JIT backend anywhere in the project.**

All riscv64-specific logic is at the OS-packaging/build-tooling level:

| File | Purpose | ISA extensions | Status |
|---|---|---|---|
| `kairos-init/pkg/values/packagemaps.go` | Per-distro/arch package name maps (kernel, GRUB, no-shim) | None | Complete |
| `sdk/utils/utils.go` (`GetEfiGrubFiles`, `GetEfiLiveGrubFiles`) | Enumerates candidate `grub.efi` paths per distro for riscv64 (no shim exists) | None | Complete |
| `agent/pkg/utils/grub.go` | Installs GRUB to target device; skips shim copy on riscv64, writes fallback EFI file directly | None | Complete |
| `kairos-init/pkg/stages/steps_init.go` | Build-stage kernel-linking special case: Debian riscv64 kernels named `vmlinux-*` not `vmlinuz-*` | None | Complete |
| `kairos-init/pkg/bundled/bundled_fips_riscv64.go` | `//go:build riscv64` stub providing empty FIPS byte slices (FIPS not built for riscv64) | None | Complete stub (intentional no-op) |

Architecture-constant plumbing: `ArchRiscv = "riscv64"` (`sdk/types/platform/platform.go`), `ArchRiscv64` + `GetFallBackEfi -> "BOOTRISCV64.EFI"` (`agent/pkg/constants/constants.go`), `ArchRiscV64` (`kairos-init/pkg/values/values.go`). `kairos-init/main.go` refuses `--fips` when `runtime.GOARCH == "riscv64"`.

Since Kairos has no SIMD/JIT/crypto-acceleration component on **any** architecture, a per-component amd64/arm64/riscv64 comparison table is not meaningful here; this confirms it is not an optimization-purpose project (see Section 13).

## 5. Build System, Cross-Compilation, and Toolchain

Kairos is a Go monorepo, not CMake-based: no `CMakeLists.txt`, no cmake toolchain file, no `BUILDING.md` exist. `go.mod` pins **Go 1.26.8** exactly (`go-version-file: go.mod` in CI). riscv64 binaries build with `CGO_ENABLED=0` - **no C toolchain is required at all** for riscv64; pure Go cross-compilation handles it.

Build commands:
```
make kairos              ARCH=riscv64 VARIANT=default
make kcrypt-challenger    ARCH=riscv64 VARIANT=default
make kairos-installer     ARCH=riscv64 VARIANT=default
make provider-kairos      ARCH=riscv64 VARIANT=default
make binaries ARCH=riscv64        # skips FIPS automatically
make image-kairos-init ARCH=riscv64
ARCH=riscv64 scripts/build-iso.sh
```
Internally: `GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 go build -trimpath -ldflags='-s -w -X .../version.Version=$(VERSION)'`.

There are no `-DUSE_X=OFF`-style flags (no CMake); the closest equivalent is `Makefile`'s `ifneq ($(ARCH),riscv64)` guard, which skips the FIPS build step entirely on riscv64.

**QEMU usage** is two distinct, unrelated things, and riscv64 is excluded from both in this repo:
1. **Build-time emulation** (`docker/setup-qemu-action`, used to cross-build container images on `ubuntu-latest`): hardcoded to `--platform "linux/amd64,linux/arm64"` only - riscv64 excluded, despite a stale `kairos-init/Dockerfile` comment claiming `linux/riscv64` buildx support (confirmed documentation/CI mismatch).
2. **Boot/install QEMU testing** (`reusable-qemu-test.yaml`): zero riscv64 references - no automated boot-level QEMU test exists for riscv64 images in this repo.

A `master.yaml` maintainer comment documents the known cost: *"riscv64 under QEMU is slow (observed ~2h+ for a from-scratch riscv64 build elsewhere in the org)"* - the stated reason riscv64 initially only built on release tags, until PR [#4377](https://github.com/kairos-io/kairos/pull/4377) moved it to every master push.

The actual riscv64 ISO does **not** get built in `kairos-io/kairos`; per `master.yaml`'s own comment, it is built downstream in `kairos-io/hadron`, whose Makefile `curl`s this repo's `images/Dockerfile` and runs `docker build --platform=linux/riscv64` against it.

**Known build failures (all with riscv64-specific fixes, statuses as noted):**
- Missing openSUSE riscv64 GRUB EFI path - fixed, [sdk#806](https://github.com/kairos-io/kairos-sdk) (commit `1032b9b`).
- Missing Debian/Ubuntu `grub-efi-riscv64` package entries, breaking ISO generation - fixed, closing [#4235](https://github.com/kairos-io/kairos/issues/4235).
- Debian/Ubuntu's monolithic `grubriscv64.efi` path mismatch with AuroraBoot's search path - PR [#4390](https://github.com/kairos-io/kairos/pull/4390), **still open (draft), changes requested**; reviewer itxaka-agent disputes the stated root cause, noting the SDK's search list already includes the monolithic path (per AuroraBoot#635, merged 2026-07-10).
- UPX-compressed `immucore` segfaults under `qemu-system-riscv64 -accel tcg` on Linux (works fine on macOS/UTM) - open, blocked on upstream, [#4089](https://github.com/kairos-io/kairos/issues/4089).
- `build-kairos-init` broken on riscv64/master from a missing FIPS stub - fixed, commit `cb61a33`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Per-component binary release tarballs | yes | yes | yes (v4.3.0) |
| Multi-arch container image (kairos-init, kcrypt-challenger) | yes | yes | no |
| ISO/OS image build in `kairos-io/kairos` | yes | yes | no (built in `hadron` instead) |
| Bootable OS image (org-wide, via hadron+AuroraBoot) | yes | yes | yes, but explicitly labeled "experimental, not officially released" |
| QEMU boot/functional test automation | yes | yes | no |
| FIPS 140-3 variant | yes | yes | no (explicitly excluded) |
| PR-triggered CI coverage | yes | yes | no |
| Shim-based secure boot chain | yes | yes | no (no shim package exists; boots `grub.efi`/`BOOTRISCV64.EFI` directly) |

**Functional gaps:** no shim-based secure-boot chain on riscv64 (architectural, not a defect - no riscv64 shim package exists upstream in any distro per the findings); no FIPS 140-3 variant on riscv64; UPX/QEMU-TCG interaction blocks Linux-hosted QEMU testing of `immucore` specifically (the same ISO boots under QEMU/UTM on macOS, per [#4084](https://github.com/kairos-io/kairos/issues/4084)).

**Performance gaps:** Data not available - no published performance benchmarks (timings, throughput, or amd64/arm64 comparisons) exist for Kairos on riscv64. The [RISE "six weeks in" blog post](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) gives job-count statistics for other projects (llama.cpp, PyTorch, ML-DSA/ML-KEM) but zero numbers for Kairos. The [kairos.io riscv64 blog post](https://kairos.io/blog/2026/08/28/kairos-riscv64-open-invitation/) states the image is tested only under QEMU emulation, not real hardware, with no performance data. Searches explicitly targeting "Kairos riscv64 benchmark" returned nothing.

**Security hardening gaps:** no shim on riscv64 (different, not necessarily worse, secure-boot posture - no comparative data available); FIPS unavailable on riscv64.

**NaN / floating-point semantics:** Data not available - not applicable; Kairos is an OS-image build toolchain, not numeric software, and no floating-point-related riscv64 issues were found in a targeted search.

## 7. CI/CD Infrastructure

Verified by direct read of all 24 workflow files in `kairos-io/kairos/.github/workflows/` at HEAD `83cd7e9` (only 6 files reference "riscv" at all: `_build-iso.yaml`, `_build-kairos-init.yaml`, `_build-kairos.yaml`, `_build-kcrypt-challenger.yaml`, `master.yaml`, `release.yaml`).

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PR CI build | yes | yes | no (`pr.yaml` uses `matrix_scope: ci` throughout - zero riscv occurrences, confirmed by grep) |
| Master/release CI build | yes | yes | yes, binary cross-compile only (`matrix_scope: full`) |
| ISO/image build workflows | yes | yes (arm64-core, arm64-rpi3, arm64-rpi4 cells) | no (0 cells in any `build-iso*` matrix) |
| QEMU boot test | yes | (test jobs present) | no (`reusable-qemu-test.yaml` has zero riscv references) |
| Multi-arch container image publish | yes | yes | no (`_build-image-kairos-init.yaml` and `_build-image-kcrypt-challenger.yaml` hardcode `--platform "linux/amd64,linux/arm64"`) |
| Dedicated runner label | `ubuntu-latest` | `ubuntu-latest`/`ubuntu-24.04-arm` | none found in `kairos-io/kairos` workflows |

**RISE runner usage:** The separate `kairos-io/kairos-init` repo's `test.yml` sets `runs-on: ubuntu-24.04-riscv` for its riscv64 test-matrix entry, matching RISE's documented runner label format. RISE's own blog post ["RISC-V Runners: six weeks in"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) (2026-05-12) explicitly names Kairos as a consumer: *"Enabling Kairos to ship and validate on RISC-V matters for the broader edge/IoT story; we are happy to be the CI substrate for that."* This is a stated CI-infrastructure relationship, not proof-positive that this exact runner instance is RISE-operated (self-hosted runner registration isn't visible from workflow YAML alone), but it is corroborated by the blog post.

Notably, `kairos-io/kairos` itself (the monorepo, as distinct from `kairos-init`) has **no riscv64 runner label wired into any of its 24 workflow files** as of this HEAD, despite issue [#4039](https://github.com/kairos-io/kairos/issues/4039) claiming "access to native hardware for the CI using [riseproject-dev/riscv-runner-app](https://github.com/riseproject-dev/riscv-runner-app)." If such hardware access exists, it is not currently used by this repo's build/test jobs - only Go cross-compilation on `ubuntu-latest`.

Kairos is not a RISE Premier or General member (checked against the full 20-member list); its relationship to RISE is CI-runner infrastructure consumption via `kairos-io/kairos-init`, not membership or a funded RFP/grant [NEEDS VERIFICATION beyond the absence of a found grant record].

## 8. Distribution and Release Status

- **GitHub Releases (kairos-io/kairos):** v4.3.0 (2026-09-08) ships riscv64 binary tarballs directly - `kairos-init-v4.3.0-linux-riscv64.tar.gz`, `kairos-installer-v4.3.0-linux-riscv64.tar.gz`, `kairos-v4.3.0-linux-riscv64.tar.gz`, `kcrypt-challenger-v4.3.0-linux-riscv64.tar.gz`, `provider-kairos-v4.3.0-linux-riscv64.tar.gz`, confirmed via the [expanded_assets/v4.3.0](https://github.com/kairos-io/kairos/releases/tag/v4.3.0) endpoint.
- **Ubuntu 26.04 (resolute):** No package named `kairos`, `python3-kairos`, or `libkairos` exists for any architecture - both a project-graph SPARQL query and a direct [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Kairos&suite=resolute&searchon=names&section=all) returned zero results. Kairos is a standalone OS distribution, not a distro-packaged application.
- **PyPI:** A same-named `kairos` PyPI package exists but is a distinct, unrelated Python job-scheduling library (0.0.1-0.10.1, source-only `.tar.gz`, no wheels of any kind, no riscv64 or any-architecture binary distribution). Not to be confused with kairos-io/kairos.
- **Full bootable riscv64 OS image/ISO:** Not published by `kairos-io/kairos` itself. Produced by the `kairos-io/hadron` + `AuroraBoot` pipeline, which the project's own August 2026 blog post explicitly describes as experimental and not an official release.

**What a user must do to get a working riscv64 artifact:** For the individual Go binaries (agent, installer, kairos-init, kcrypt-challenger, provider-kairos), download the release tarballs directly from [kairos-io/kairos GitHub Releases](https://github.com/kairos-io/kairos/releases) (e.g., v4.3.0). For a bootable OS image, there is currently no stable, official, "just works" download path: a user must follow the experimental `kairos-io/hadron` + `AuroraBoot` pipeline referenced in the ["riscv64 open invitation" blog post](https://kairos.io/blog/2026/08/28/kairos-riscv64-open-invitation/) and test under QEMU emulation, with the known unresolved UPX/immucore crash on Linux-hosted QEMU-TCG (issue [#4089](https://github.com/kairos-io/kairos/issues/4089)) as an active caveat.

## 9. Dependencies

| # | Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| 1 | containerd | OCI image/layer management | builds (Go cross-compile) | not in official upstream CI matrix | Ubuntu ships riscv64 binary | containerd/containerd#13020 "Add linux/riscv64 to CI test matrix" (open) |
| 2 | Docker/Moby | Docker-compatible engine API | Ubuntu-packaged | Ubuntu-packaged | Ubuntu ships riscv64 `docker.io` | moby/moby#44319 "Adding support for RISC-V" (open) - upstream Moby's own riscv64 support still tracked despite Ubuntu packaging it |
| 3 | runc | OCI runtime spawned by containerd/Docker | yes | yes | riscv64 CI + release artifacts added | opencontainers/runc#5166 (closed/resolved) |
| 4 | klauspost/compress | Compression (zstd/deflate/s2), vendored Go module | builds - portable Go fallback (no riscv64 SIMD asm path) | none reported | vendored, not separately released | only amd64/arm64 have hand-tuned asm |
| 5 | google/go-tpm, go-tpm-tools | TPM 2.0 client for measured boot / kcrypt attestation | no explicit riscv64 CI coverage found | none found | none found | go-tpm-tools#703 "Build failure on ppc64el and s390x" (open) - signals broader non-amd64/arm64 portability gaps |
| 6 | golang.org/x/crypto | Core crypto primitives | yes (Go's officially supported riscv64 GOARCH since Go 1.14) | yes (Go upstream test suite) | yes | 0 riscv64 issues found |
| 7 | cloudflare/circl | Crypto (PQC/elliptic curves), transitive via attestation/TLS | at risk - some primitives lack a portable/generic implementation | untested on riscv64 | n/a | cloudflare/circl#120 "generic implementation of circl/ecc/p384" (open) |
| 8 | anatol/luks.go | Pure-Go LUKS library for kcrypt disk encryption | unknown | unknown | unknown | low-traffic repo, no riscv64 issues found either way |
| 9 | LZ4 (pierrec/lz4 + system liblz4) | Compression | builds/ships | generic (non-SIMD) code path | Ubuntu ships riscv64 | lz4/lz4#1635 "RISC-V Architecture Optimizations" (closed, not merged) - riscv64 runs the portable path |
| 10 | xz / liblzma | Compression for OS image artifacts | builds/ships | riscv64 perf flag considered upstream | Ubuntu ships riscv64 | tukaani-project/xz#146 (closed) - upstream has engaged with riscv64-specific tuning |
| 11 | systemd (coreos/go-systemd + system systemd) | Init/service manager of built OS | builds/ships | mostly clean, occasional runtime quirks | Ubuntu ships riscv64 | systemd#39192 "systemd-detect-virt Permission denied" on Ubuntu 25.10 riscv64/qemu (closed) |
| 12 | grub-efi-riscv64, squashfs-tools, e2fsprogs, dosfstools | Boot chain / image build tooling (system packages) | ships | Ubuntu-packaged | Ubuntu ships riscv64 | out of go.mod scope; distro-level, all confirmed present in Ubuntu 26.04 riscv64 (resolute) |

**Key takeaway:** Kairos itself is Go-native and riscv64-clean at the language level (Go's toolchain and stdlib crypto have full riscv64 support since Go 1.14). The real risk sits one layer down, in the container/OCI toolchain it wraps: containerd's riscv64 CI coverage is not yet upstream, and Moby/Docker's own riscv64 story is an open upstream ask - even though Ubuntu 26.04 already packages both for riscv64, putting the distro ahead of some upstream CI coverage. `cloudflare/circl`'s open "generic implementation" gap (#120) is the one genuine crypto-portability flag among vendored Go dependencies. System-level OS-build packages (systemd, cryptsetup, grub-efi-riscv64, xz-utils, liblz4, squashfs-tools, e2fsprogs, dosfstools, runc) are all confirmed present in Ubuntu 26.04 riscv64 (resolute), so the OS-image build pipeline Kairos drives has no missing-package blockers on that distro.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#4089](https://github.com/kairos-io/kairos/issues/4089) | UPX-packed immucore crashes under QEMU TCG on Linux | Open, blocked on upstream | High (correctness, blocks Linux-hosted QEMU testing) | Segfault (`memfd:upx`, signal 11) under `qemu-system-riscv64 -accel tcg`; does not reproduce under QEMU/UTM on macOS. Workaround: `SKIP_UPX=1`. Companion fix kairos-init#352 addressed part of the pathway; residual TCG interaction unresolved. |
| [#4419](https://github.com/kairos-io/kairos/issues/4419) | riscv64 support: tracking epic (supersedes #4083) | Open | N/A (tracking) | Definition of done explicitly unmet: no CI path builds and releases a riscv64 image that boots under emulation and on real hardware without manual carve-outs. |
| [#4312](https://github.com/kairos-io/kairos/issues/4312) | riscv64: re-evaluate hadron's split preset-all pipeline | Open (chore) | Low | Argues a QEMU SIGSEGV workaround no longer reproduces (21/21 clean reruns); proposes collapsing CI back to stock runners; warm-cache timing cost not yet measured. |
| [PR #4390](https://github.com/kairos-io/kairos/pull/4390) | fix(riscv64): symlink Debian/Ubuntu's monolithic grubriscv64.efi | Open (draft), changes requested | Medium | Reviewer disputes stated root cause and comment accuracy; DCO sign-off missing; blocked on author response. |
| [#4308](https://github.com/kairos-io/kairos/issues/4419#) (referenced in #4419) | hadron ttl.sh image handoff has no auth | Open, not started | Unspecified | Sub-item of #4419 epic. |

**Closed for context (not open):** [#4084](https://github.com/kairos-io/kairos/issues/4084) (riscv64 live ISO boot fix - resolved), [#4235](https://github.com/kairos-io/kairos/issues/4235) (grub-efi-riscv64 package fix - resolved), [#4083](https://github.com/kairos-io/kairos/issues/4083) (closed `not_planned`, superseded by #4419), [#4039](https://github.com/kairos-io/kairos/issues/4039) (feasibility spike - completed), [#4418](https://github.com/kairos-io/kairos/issues/4418) (community testing call - completed).

**Correctness bugs specifically:** Only [#4089](https://github.com/kairos-io/kairos/issues/4089) is a confirmed unresolved correctness/crash bug on riscv64. No floating-point/NaN-related issues were found (searched explicitly; not applicable to an OS-image build toolchain).

## 12. Objections and Upstream Blockers

**Technical blockers:**
- [#4089](https://github.com/kairos-io/kairos/issues/4089): UPX/immucore crash under QEMU-TCG on Linux is explicitly "blocked, needs upstream work" per the tracking epic - no clear resolution owner outside the QEMU/UPX interaction itself.
- PR [#4390](https://github.com/kairos-io/kairos/pull/4390) (GRUB symlink fix) is blocked on unresolved reviewer objections: itxaka-agent's 2026-09-02 review disputes the stated root cause (claims the SDK's search list already covers the monolithic path per AuroraBoot#635, merged 2026-07-10), flags factually inaccurate code comments, and notes a missing DCO sign-off.
- AuroraBoot#760 (pin Dockerfile.riscv64 builder to `$BUILDPLATFORM`) and AuroraBoot#779 (switch the release build to the emulated runner) remain open, indicating the release-image build path for riscv64 is still being stabilized.

**Organizational blockers:**
- `CONTRIBUTING_ORGANIZATIONS.md` flags single-sponsor concentration (Spectro Cloud only) as a specific blocker to CNCF Incubation graduation - not riscv64-specific, but relevant to the durability of continued riscv64 investment if Spectro Cloud's priorities shift.
- Repeated disable/re-enable cycles of riscv64 CI in `hadron` (#402 "Disable RISC-V related configurations in CI", #419 "Temporarily disable riscv64 workflow paths from PR and release pipelines") and `AuroraBoot` (#545 "disable the riscv64 release image build," later #758 "re-enable...") indicate organizational hesitation driven by CI cost, not technical rejection. A `master.yaml` maintainer comment states this plainly: riscv64-under-QEMU is "a known cost, not hidden... not something to wave through unreviewed."
- No formal architecture-tier policy document exists; riscv64's status is informally "experimental" per the project's own blog post, not a committed support tier.

**Acceptance probability:** High and trending upward based on activity volume - 37 riscv64-related PRs found across the Kairos ecosystem, 29 merged, only 4 abandoned as superseded CI experiments, 4 still open. The project has published an active open invitation for community testers and maintains a live tracking epic. However, the definition of done is explicitly unmet as of this report (2026-09-08), with one unresolved blocking correctness bug and multiple open PRs still contested in review.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- **Justification:** `kairos-io/kairos`'s own CI builds riscv64 binaries on every master push and release tag (`matrix_scope: full`) and upstream publishes riscv64 release tarballs directly (v4.3.0, [expanded_assets/v4.3.0](https://github.com/kairos-io/kairos/releases/tag/v4.3.0)), but the repo runs **zero tests** against riscv64: no QEMU boot test, no ISO/image build, and pull requests never build riscv64 at all (`pr.yaml` is scoped to `matrix_scope: ci`, which excludes it - confirmed by direct grep of the workflow file). Per the color model's CI evidence rule, a build-only CI posture (build succeeds, no test execution) caps the primary color at yellow regardless of published artifacts. This is reinforced by the actual bootable OS image being produced in a separate repo (`kairos-io/hadron`) whose riscv64 pipeline has been repeatedly disabled and re-enabled, and by the project's own August 2026 blog post stating plainly that riscv64 "isn't an official Kairos release" and has only been tested under QEMU emulation, not real hardware ([kairos.io blog](https://kairos.io/blog/2026/08/28/kairos-riscv64-open-invitation/)).
- **Optimization level:** N/A - Kairos is not an optimization-purpose project (OS-image build toolchain; confirmed absence of any SIMD/JIT/vectorized/hand-assembly code, Section 4).
- **Pending work that could change the grade:** Merging PR [#4390](https://github.com/kairos-io/kairos/pull/4390) (currently blocked on review), resolving issue [#4089](https://github.com/kairos-io/kairos/issues/4089) (blocked on upstream QEMU/UPX interaction), landing AuroraBoot#760 and #779 (stabilizing the release-image build path), and closing the master epic [#4419](https://github.com/kairos-io/kairos/issues/4419) by wiring riscv64 into an actual QEMU boot-test job (in this repo or a stably-enabled hadron equivalent) would move the grade toward blue. Publishing the riscv64 multi-arch container image (currently excluded from buildx) and adding riscv64 to the PR pipeline would further close the gap.

## 14. Investment Analysis

**What RISE has already done:** RISE provides free riscv64 GitHub Actions runner infrastructure (`ubuntu-24.04-riscv` label), which `kairos-io/kairos-init`'s test workflow consumes. This is infrastructure access only - no evidence of a funded RISE grant/RFP specifically for Kairos was found, and Kairos is not a RISE Premier or General member. All riscv64 engineering work to date (37 PRs across the ecosystem, ~5 months of effort) has been community/Spectro-Cloud-funded, not RISE-funded. The sizing below assumes no further RISE-funded engineering, only continued free CI-runner access.

### 14.1 Functional Enablement
- Resolve the UPX/immucore QEMU-TCG crash (#4089) - requires either an upstream UPX fix or a permanent default-disable of UPX compression for riscv64 builds in kairos-init.
- Land the GRUB symlink fix (#4390) after resolving the disputed root-cause review, or close it as already covered by AuroraBoot#635 if the reviewer's claim is confirmed correct.
- Land AuroraBoot#760 (pin Dockerfile.riscv64 to `$BUILDPLATFORM`) and #779 (emulated-runner release build).
- Add riscv64 to the multi-arch container image buildx target for `kairos-init` and `kcrypt-challenger`.

### 14.2 Performance Optimization
Not applicable in the SIMD/JIT sense - Kairos has no such code path on any architecture. The relevant "performance" work is CI-cost reduction: the ~2h+ from-scratch riscv64-under-QEMU build time flagged in `master.yaml`, which currently governs how often riscv64 is exercised.

### 14.3 CI/CD Infrastructure
- Wire an automated riscv64 QEMU boot/functional test into this repo or into a stably-enabled `hadron` pipeline (closing the epic's stated definition of done).
- Add riscv64 to the PR-triggered pipeline (`pr.yaml`) once CI cost/timing is acceptable, per the still-open question in issue #4312.
- Stabilize the hadron/AuroraBoot riscv64 release pipeline to end the disable/re-enable cycle.

### 14.4 Ecosystem Enablement
Section 10 omitted - Kairos is a standalone OS distribution/build toolchain with no dependent package ecosystem (no npm/PyPI/Maven consumers) requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve UPX/immucore QEMU-TCG crash (#4089) | 1-3 (dependent on upstream UPX engagement) | Kairos + upstream UPX | Critical |
| Functional | Land or resolve GRUB symlink fix (#4390) | 0.5-1 | Kairos (Spectro Cloud) | High |
| Functional | Publish riscv64 multi-arch container images | 0.5-1 | Kairos (Spectro Cloud) | Medium |
| CI/CD | Wire automated riscv64 QEMU boot test (close epic #4419) | 2-4 | Kairos (Spectro Cloud) | Critical |
| CI/CD | Stabilize hadron/AuroraBoot riscv64 release pipeline (land #760, #779) | 1-2 | Kairos (Spectro Cloud) | High |
| CI/CD | Extend PR pipeline to include riscv64 (pending #4312 timing evaluation) | 0.5-1 | Kairos (Spectro Cloud) | Medium |
| Organizational | Diversify corporate sponsorship beyond Spectro Cloud (CNCF Incubation blocker) | N/A (not an engineering task) | Kairos governance | Medium (indirect, affects sustained investment) |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [kairos-io/kairos issue #4419 - riscv64 support: tracking epic](https://github.com/kairos-io/kairos/issues/4419)
- [kairos-io/kairos issue #4083 - Full riscv64 support: tracking issue (closed, not_planned)](https://github.com/kairos-io/kairos/issues/4083)
- [kairos-io/kairos issue #4312 - re-evaluate hadron's split preset-all pipeline](https://github.com/kairos-io/kairos/issues/4312)
- [kairos-io/kairos issue #4089 - UPX-packed immucore crashes under QEMU TCG on Linux](https://github.com/kairos-io/kairos/issues/4089)
- [kairos-io/kairos issue #4418 - Call for community support: riscv64 testing](https://github.com/kairos-io/kairos/issues/4418)
- [kairos-io/kairos issue #4235 - Ubuntu/Debian core images missing grub-efi-riscv64](https://github.com/kairos-io/kairos/issues/4235)
- [kairos-io/kairos issue #4084 - riscv64 live ISO fails to boot in UTM/QEMU](https://github.com/kairos-io/kairos/issues/4084)
- [kairos-io/kairos issue #4039 - [SPIKE] Kairos / Hadron on riscv64](https://github.com/kairos-io/kairos/issues/4039)
- [kairos-io/kairos PR #4390 - fix(riscv64): symlink Debian/Ubuntu's monolithic grubriscv64.efi](https://github.com/kairos-io/kairos/pull/4390)
- [kairos-io/kairos PR #4377 - ci(master): build riscv64 on every master push, not release-only](https://github.com/kairos-io/kairos/pull/4377)
- [kairos-io/kairos Releases](https://github.com/kairos-io/kairos/releases)
- [kairos-io/kairos v4.3.0 release](https://github.com/kairos-io/kairos/releases/tag/v4.3.0)
- [kairos.io - Kairos riscv64 open invitation blog post](https://kairos.io/blog/2026/08/28/kairos-riscv64-open-invitation/)
- [RISE - RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE RISC-V Runners documentation](https://riscv-runners.riseproject.dev/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Week 3 of Building a Software Factory: Shipping Kairos 4.2.0](https://www.mauromorales.com/posts/shipping-kairos-4-2-0/)
- [Ubuntu packages.ubuntu.com search - Kairos, resolute suite](https://packages.ubuntu.com/search?keywords=Kairos&suite=resolute&searchon=names&section=all)
- [PyPI kairos package JSON (unrelated project)](https://pypi.org/pypi/kairos/json)
- [containerd/containerd#13020 - Add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd)
- [moby/moby#44319 - Adding support for RISC-V](https://github.com/moby/moby)
- [opencontainers/runc#5166 - Add linux/riscv64 to CI and release artifacts](https://github.com/opencontainers/runc)
- [cloudflare/circl#120 - Develop generic implementation of circl/ecc/p384](https://github.com/cloudflare/circl)
- [lz4/lz4#1635 - [Proposal] RISC-V Architecture Optimizations](https://github.com/lz4/lz4)
- [tukaani-project/xz#146 - Enable TUKLIB_FAST_UNALIGNED_ACCESS for RISC-V?](https://github.com/tukaani-project/xz)
- kairos-io/community MAINTAINERS.md, GOVERNANCE.md, CONTRIBUTING_ORGANIZATIONS.md (local clone reference)
- Local clone used for CI/code analysis: `kairos-io/kairos` at commit `83cd7e90c50a7ceedf356733d9a42f9d296ed568`
