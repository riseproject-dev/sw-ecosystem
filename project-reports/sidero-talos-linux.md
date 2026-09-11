---
title: Sidero Talos Linux
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="sidero-talos-linux" %}

# Sidero Talos Linux

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Sidero Talos Linux<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Talos Linux is a minimal, immutable, API-managed Linux distribution purpose-built to run Kubernetes, developed by [Sidero Labs, Inc.](https://www.siderolabs.com/) (Goleta, CA; formerly named Talos Systems, Inc., visible in older `@talos-systems.com` commit emails). It is a single-vendor, corporate-led open-source project: there is no `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `GOVERNANCE.md` file in the repository, and `CONTRIBUTING.md` covers only DCO sign-off and conformance testing, defining no steering committee or voting process. Talos Linux (the OS) is licensed [MPL 2.0](https://github.com/siderolabs/talos); the commercial companion product, Talos Omni, is separately licensed BSL 1.1 (source-available, not OSI-open).

Talos is not itself a CNCF-hosted project (sandbox/incubating/graduated); it is Kubernetes-conformance-tested and its backing company holds a CNCF Silver Membership, a paid membership tier, not project governance. Enterprise adopters cited by Sidero Labs include Nokia, Roche, Ubisoft, and Equinix.

Git history (3,000-commit window) shows contribution is overwhelmingly corporate: Andrey Smirnov, 1,312 commits (plus 152 under an older email), Sidero Labs; Noel Georgi, 466 commits (`frezbo.dev`, the top non-corporate-domain committer); Mateusz Urbanek, 155, Sidero Labs; Dmitriy Matrenichev, 123, Sidero Labs; and six more contributors at 19-62 commits each, all Sidero Labs. There is no evidence of an independent community maintainer base.

On new-architecture ports, the community-request culture is passive: the only community ask for a full riscv64 OS port, [Issue #8655](https://github.com/siderolabs/talos/issues/8655), received zero comments from anyone, including maintainers, before being auto-closed by the stale-bot. This is not a documented rejection; it is documented non-engagement.

The RISE Project's own member roster (fetched directly from [riseproject.dev/members/](https://riseproject.dev/members/)) does not include Sidero Labs among its 8 Premier or 12 General members, and no RISE blog post, GitHub repository, or funded effort involving Talos Linux was found (34 RISE blog posts scanned in full; RISE's `kubernetes-riscv` effort explicitly targets k0s, k3s, Kairos, containerd, and upstream Kubernetes, not Talos).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-04-25 | [Issue #8655](https://github.com/siderolabs/talos/issues/8655) opened by kallisti5, requesting full riscv64 OS/installer images (citing StarFive VisionFive 2, SiFive Unmatched/Unleashed) | [Issue #8655](https://github.com/siderolabs/talos/issues/8655) |
| 2025-02-21 | Issue #8655 closed as `not_planned`, labeled `Stale`, zero comments recorded | [Issue #8655](https://github.com/siderolabs/talos/issues/8655) |
| 2025-11-14 | [PR #12225](https://github.com/siderolabs/talos/pull/12225) merged, "feat: add riscv64 build of talosctl" (Mateusz Urbanek / shanduur, Sidero Labs; approved by dsseng). Adds a pure-Go, `CGO_ENABLED=0` riscv64 cross-compile of the `talosctl` CLI client only. First shipped in v1.12.0-beta.0 | [PR #12225](https://github.com/siderolabs/talos/pull/12225) |
| 2025-11-17 | [PR #12242](https://github.com/siderolabs/talos/pull/12242) merged, "fix: add riscv64 talosctl to release artifacts" (shanduur; approved by frezbo). Fixes an omission where the riscv64 `talosctl` binary was compiled but not signed/checksummed/uploaded in the 1.12.0-beta.0 release. Backported to `release-1.12`, first shipped v1.12.0-beta.1 (~2025-12-01) | [PR #12242](https://github.com/siderolabs/talos/pull/12242) |
| 2026-06-19 | [PR #13618](https://github.com/siderolabs/talos/pull/13618) merged into `release-1.12` (majabojarska, Sidero Labs; approved by smira): reverts bundled CoreDNS from 1.14.3 to 1.14.2 because CoreDNS 1.14.3 shipped an amd64-only image manifest, breaking riscv64 (and other non-amd64) Talos image manifests. First shipped v1.12.9 | [PR #13618](https://github.com/siderolabs/talos/pull/13618) |
| 2026-06-19 | [PR #13619](https://github.com/siderolabs/talos/pull/13619) merged into `main`, identical CoreDNS revert for the unstable branch. Also queued for backport to `release-1.13` (status: Proposed) | [PR #13619](https://github.com/siderolabs/talos/pull/13619) |

Incidental, non-riscv64 match: [PR #6039](https://github.com/siderolabs/talos/pull/6039) (containerd 1.6.6 to 1.6.7 dependabot bump, closed unmerged) matched the "riscv" search term only because containerd 1.6.7's release notes mention riscv64 build support; it is not Talos riscv64 work.

**Is it fully upstream?** No. All merged work is upstream-authored and upstream-merged (no forked riscv64 patch set exists), but the scope is narrow: a client CLI cross-compile and two dependency-manifest regression fixes. There is no merged or in-flight work adding a riscv64 Talos OS/kernel/installer image. The single tracking issue for that ask (#8655) is closed `not_planned`.

## 3. Upstream Support Tier

No formal architecture-tier policy exists for Talos. `pkg/machinery/platforms/platforms.go` defines only `ArchAmd64` and `ArchArm64`; every cloud/metal platform in that file lists only those two architectures. A separate platform-tier system exists (Tier 1: AWS, GCP, Equinix Metal; Tier 2: Azure, DigitalOcean, Nocloud, OpenStack, VMware, etc.) but this tiers deployment *platforms*, not CPU architectures, and is documented only in inline source comments, not in any public policy document.

The official support matrix, [docs.siderolabs.com/talos/v1.13/getting-started/support-matrix](https://docs.siderolabs.com/talos/v1.13/getting-started/support-matrix), lists **only amd64 and arm64** as supported Talos CPU architectures as of v1.13. riscv64 is not mentioned anywhere in the current support matrix.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in official support matrix | Yes | Yes | No |
| OS/kernel/installer/imager CI build | Yes | Yes | No |
| OS/kernel/installer/imager release artifact | Yes | Yes | No |
| talosctl CLI client build and release | Yes | Yes | Yes (build-only CI, no tests) |
| Platform-tier classification (`platforms.go`) | Tier 1/2 by cloud | Tier 1/2 by cloud | Not defined (arch not present) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Talos has no architecture-specific subsystems in the sense of JIT, SIMD, crypto, or GC-barrier code, and no such code exists for riscv64. An exhaustive code search (`riscv`, `riscv64`, `vfloat32m1_t`, `rvv`, `path:arch/riscv`, `extension:S riscv`, `__riscv`) found:

- **No `arch/riscv/` directory.**
- **No `.S` assembly files** referencing riscv anywhere in the repo.
- **No RVV intrinsics** (`vfloat32m1_t` and related types: 0 hits).
- **No `#ifdef __riscv`** or equivalent architecture guards anywhere in Go or C code (0 hits).

All riscv64 references in the source tree are Go cross-compilation build tags and CI/release plumbing for the `talosctl` client, confined to a small, consistently reported set of files (reported as 7 code/build files in one exhaustive pass, with a separate enumeration listing an 8th, `CHANGELOG.md`, as a changelog-text mention rather than functional code, a minor discrepancy noted here for completeness):

| Path | Content |
|---|---|
| `cmd/talosctl/cmd/mgmt/nfs_launch.go` | `//go:build linux && (amd64 \|\| arm64 \|\| riscv64)` |
| `pkg/provision/providers/vm/nfs_linux.go` | Same build tag; 147 lines of generic NFS-provisioning code shared across all three arches, no riscv-specific branch |
| `pkg/provision/providers/vm/nfs_other.go` | Negated fallback stub (`!linux \|\| (!amd64 && !arm64 && !riscv64)`), 26 lines, no-op functions |
| `Dockerfile` | `talosctl-linux-riscv64-build` / `talosctl-linux-riscv64` stages, `GOOS=linux GOARCH=riscv64 go build` |
| `Makefile` | `talosctl-linux-riscv64` target |
| `.kres.yaml` | Lists `talosctl-linux-riscv64` as a release artifact |
| `.github/workflows/ci.yaml` | Cosign sign-blob, checksum, and release-upload steps for `talosctl-linux-riscv64` |
| `CHANGELOG.md` | Changelog text noting the riscv64 talosctl addition |

Comparison against amd64/arm64, using direct grep counts on the local clone (`/home/user/siderolabs/talos`, HEAD `850a4384`):

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Go files with arch-specific `go:build` tag | 7 | 5 | 3 (all shared 3-way with amd64/arm64; zero riscv-only files) |
| `_<arch>.go` suffixed files | 0 | 0 | 0 |
| Microarch-tuning file (`pkg/machinery/constants/`) | `amd64.go`, `amd64_v1.go` | none | none |
| `pkg/imager/profile/input.go` arch constant | `amd64 = "amd64"` | `arm64 = "arm64"` | not present |
| Cloud image-profile testdata YAML | amd64 variants exist | 8+ variants (`hcloud-arm64`, `aws-arm64`, `gcp-arm64`, `vultr-arm64`, `installer-arm64`, `metal-uki-arm64`, `upcloud-arm64`, `cloudstack-arm64`, etc.) | zero |
| Matches for "riscv" in `pkg/machinery/imager`, `pkg/imager`, `pkg/installer`, `pkg/kernel`, `cmd/installer` | n/a | n/a | 0 |
| VMware platform support (`vmware_supported.go`) | Yes | Yes | No (falls to `vmware_other.go` no-op stub) |

**Verdict:** amd64 and arm64 are both full, first-class OS targets (kernel/initramfs/installer/imager pipeline, cloud-specific image-profile matrix, VMware platform support). riscv64 has no implementation at all in any package that actually builds a Talos node image; the only concrete riscv64 artifact is the peripheral `talosctl` client cross-compile.

## 5. Build System, Cross-Compilation, and Toolchain

Talos has no CMake-based build system. The actual build system is Go plus Docker Buildx (BuildKit) plus GNU Make, driven by a root `Dockerfile` (68.7 KB, generated and maintained via the `kres` tool from `.kres.yaml`) and a root `Makefile`. Cross-compilation is handled entirely by Go's native `GOOS`/`GOARCH` cross-compiler inside BuildKit stages, not by a GCC/Clang cross-toolchain, and QEMU is not used for the riscv64 pieces that exist.

**Toolchain:** `go.mod` pins `go 1.26.8`; `Makefile` sets `GO_VERSION ?= 1.26`; the build-image tag is `TOOLS ?= v1.15.0-alpha.0-5-g09ccc74` with `ENV GOTOOLCHAIN=local` forcing that exact Go version. Go's riscv64 `GOARCH` has been supported since Go 1.14 (2020), so no version floor is imposed by riscv64 itself, only by whichever Go version Talos happens to pin.

**Why `talosctl-linux-riscv64` works at all:** it is a pure-Go, `CGO_ENABLED=0` static binary (Makefile line 133, Dockerfile line 266) with no C-level OS dependencies, which is why it was trivial to add.

**Build commands (talosctl only; no equivalent exists for the OS):**
```
docker buildx create --driver docker-container --name local \
  --buildkitd-flags '--allow-insecure-entitlement security.insecure' --use

make talosctl-linux-riscv64
# expands to:
docker buildx build --file=Dockerfile --progress=auto \
  --platform=linux/riscv64 --push=false --provenance=false --sbom=false \
  --target=talosctl-linux-riscv64 --output=type=local,dest=_out .
```
Output: `_out/talosctl-linux-riscv64`.

**What does not exist:** no `install-artifacts-riscv64` stage (only `install-artifacts-amd64`, `install-artifacts-arm64`, `install-artifacts-all`, Dockerfile lines 1156-1176); no riscv64 platform stage for any OS package (kernel, musl, grub, sd-boot, apparmor, cryptsetup, containerd, dosfstools, e2fsprogs, systemd-udevd, all staged only `--platform=amd64`/`--platform=arm64`, Dockerfile lines 84-100); no `vmlinuz-riscv64` in `.kres.yaml`'s release artifact list (only `vmlinuz-amd64`, `vmlinuz-arm64`); no riscv64 QEMU integration-test target (`integration-test-provision-linux-amd64`/`-arm64` only, Makefile lines 591/594); no riscv references under `hack/` or `pkg/machinery`.

**Known build failure:** none documented, because a riscv64 OS build is never attempted; there is no failure to record, only an absence of a build target.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Bootable OS image (metal ISO/raw) | Yes | Yes | No |
| Kernel build | Yes | Yes | No |
| Initramfs/installer/imager | Yes | Yes | No |
| Cloud platform images (AWS, GCP, Azure, etc.) | Yes | Yes (partial per platform) | No |
| VMware provider support | Yes | Yes | No (stub fallback) |
| `talosctl` CLI client | Yes | Yes | Yes (build-only CI) |
| QEMU-provisioner NFS-launch helper (dev tooling, host-side) | Yes | Yes | Yes (build-tag only, no riscv-specific logic) |
| Listed in official support matrix | Yes | Yes | No |

**Functional gap:** total. A riscv64 machine cannot run Talos Linux as a node OS today; the architecture cannot boot, join, or operate a Talos-managed Kubernetes cluster. The only functional capability on riscv64 is running the `talosctl` client to remotely manage a cluster whose nodes run amd64 or arm64.

**Performance gap:** not applicable in the SIMD/vectorization sense, since no riscv64 OS build exists to measure. No benchmark data of any kind (riscv64-vs-arm64 or riscv64-vs-amd64) was found in any source searched, including GitHub, general web search, and the RISE Project blog.

**Security hardening gap:** not evaluable, since there is no riscv64 OS build to assess (no riscv64 kernel config, no cryptsetup/LUKS build for riscv64 within Talos's own package build).

**NaN / floating-point semantics issues:** none found. A targeted search for RISC-V NaN/floating-point bug reports in the repo returned zero relevant results (semantic search matches were all unrelated amd64/arm64 issues).

## 7. CI/CD Infrastructure

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository; all CI runs through GitHub Actions. `riscv` appears in exactly one of the repository's workflow files, [`.github/workflows/ci.yaml`](https://github.com/siderolabs/talos/blob/main/.github/workflows/ci.yaml) (5,907 lines, KRES-generated), confined to the `tag` job (lines 5753-5907):

```yaml
'on':
  push:
    branches: [main, release-*]
    tags: [v*]
  pull_request:
    branches: [main, release-*]
...
  tag:
    runs-on:
      group: large
    if: (!startsWith(github.head_ref, 'renovate/') && !startsWith(github.head_ref,
      'dependabot/')) && startsWith(github.ref, 'refs/tags/')
```

- **Trigger:** only fires on a version-tag push (`refs/tags/v*`). It never runs on a normal PR or branch push; the everyday CI a commit gets (build/unit-test/lint) does not touch riscv64 at all.
- **Runner:** `group: large`, a self-hosted x86_64 runner group, not riscv64 hardware and not QEMU-emulated. The build step's `PLATFORM` environment variable is `linux/amd64,linux/arm64` for every actual OS-image build/push step (checked across all 30 occurrences of `PLATFORM:` in the file); riscv64 is absent from `PLATFORM` entirely.
- **What actually happens for riscv64:** the `talosctl-all` make target, as a side effect, cross-compiles `talosctl-linux-riscv64` (`GOOS=linux GOARCH=riscv64 go build`), which is then cosign-signed (`cosign sign-blob --bundle _out/talosctl-linux-riscv64.bundle`), included in `sha256sum.txt`/`sha512sum.txt`, and uploaded as a GitHub Release asset.
- **No** `docker/setup-qemu-action` step, no riscv64-specific `runs-on` group, and no riscv64 integration/e2e test job exists. Regarding the integration-test workflow count: one research pass reported 22 `integration-*-triggered.yaml` files with zero riscv references, and a separate exhaustive pass reported 28 such files, also zero riscv references; both agree on the substantive conclusion (no riscv64 integration testing exists) despite the file-count discrepancy, which is noted here per verification policy.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds OS image | Yes | Yes | No |
| CI runs test suite | Yes | Yes | No (no OS build exists to test; talosctl itself has no riscv64-specific test execution) |
| CI publishes release artifact | Yes (OS + talosctl) | Yes (OS + talosctl) | talosctl only |
| Trigger scope | Every PR/push + tag | Every PR/push + tag | Tag push only |
| Runner type | Self-hosted x86_64 (`large`) plus native/QEMU where applicable | Self-hosted x86_64 (`large`) plus native/QEMU where applicable | Self-hosted x86_64 (`large`), no QEMU riscv64 |
| RISE RISC-V Runner usage | n/a | n/a | None found (no reference to `riseproject-dev` or a RISE runner label anywhere in the workflow set) |

**Bottom line:** claiming "riscv64 CI exists" for Talos is accurate only in the narrow sense that a release-tag-triggered job additionally cross-compiles, signs, and ships a `talosctl` client binary. It is not accurate to describe this as riscv64 CI for Talos Linux the operating system: there is no build, boot, or test of the OS/kernel/image for riscv64 anywhere in the workflow set.

## 8. Distribution and Release Status

**GitHub Releases (the only real distribution channel for Talos):** direct HTTP probes against release assets confirm the pattern holds across the two most recent releases checked:

| Release | `talosctl-linux-riscv64` | `talosctl-linux-amd64` (control) | `kernel-riscv64` | `initramfs-riscv64.xz` | `installer-riscv64.tar` | `metal-riscv64.iso` |
|---|---|---|---|---|---|---|
| v1.14.0 (latest stable) | 200 | 200 | 404 | 404 | 404 | 404 |
| v1.15.0-alpha.0 (latest pre-release) | present | present (not separately re-probed) | absent | absent | absent | absent |

**PyPI:** [`https://pypi.org/pypi/sidero-talos-linux/json`](https://pypi.org/pypi/sidero-talos-linux/json) returns **HTTP 404**. Talos Linux is not distributed as a Python package under any name; this is expected, not a gap, since Talos is an OS/CLI/container-image product, not a Python library.

**Ubuntu 26.04 ("resolute"):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=sidero-talos-linux&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results." No `sidero-talos-linux` package exists in any Ubuntu suite.

**Arch Linux RISC-V port:** [archriscv.felixc.at](https://archriscv.felixc.at/?q=sidero%20talos%20linux) shows no matching package entry.

**Data-quality caveat:** the `project-graph` MCP server (needed for a SPARQL cross-check of Ubuntu 26.04 riscv64 package availability) failed to connect for the entire research session (`CONNECTION_CLOSED`). All Ubuntu/Debian availability statements above come from direct `packages.ubuntu.com` web checks only, not graph-verified as originally intended, and should be re-run once that server is reachable. Separately, the originally specified SPARQL query targeted package names (`sidero-talos-linux`, `python3-sidero-talos-linux`, `libsidero-talos-linux`) that do not match how Talos is actually distributed (it is not a Python or C library package), so a positive result from that query would itself have warranted scrutiny.

**What a user must do to get a working riscv64 artifact:** download `talosctl-linux-riscv64` directly from a [GitHub Release](https://github.com/siderolabs/talos/releases) and run it as a client to manage a cluster whose nodes run amd64 or arm64. There is no path today to obtain a bootable riscv64 Talos node image from any channel.

## 9. Dependencies

The `project-graph` MCP server was unreachable for the entire session, so no dependency rows below are graph-verified; all data comes from direct source inspection of `siderolabs/talos` and `siderolabs/pkgs`, plus web search on upstream project status.

| Dependency | Role in Talos | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| **Go** | Compiles `machined`, `talosctl`, and the entire Go dependency graph | Stable since Go 1.14 (2020) | Part of Go's own official riscv64 test matrix | Official riscv64 tier-2 builds | Why `talosctl-linux-riscv64` "just worked": no Talos-side gap here |
| **Linux kernel** | Boots the node; Talos ships a custom config | Mainline riscv64 support is mature | Upstream kernel CI covers riscv64 | Distro kernels ship riscv64 | Talos itself has **no** riscv64 kernel config in `siderolabs/pkgs`; config exists only for amd64/arm64 |
| **containerd** | Container runtime used by kubelet | riscv64 support upstreamed and working | Community riscv64 CI efforts exist | No official containerd.io riscv64 release binaries; source build works | No riscv64 build target exists in `siderolabs/pkgs`'s containerd package |
| **systemd** | Talos builds a `systemd-udevd` component into the rootfs | Generic riscv64 build exists upstream | Distro-tested (e.g. Ubuntu/Debian systemd riscv64) | Distro-shipped | `systemd-udevd` is staged only `--platform=amd64`/`--platform=arm64` in Talos's own Dockerfile (lines 84-100); not built for riscv64 by Talos |
| **CoreDNS** | Bundled cluster DNS addon | Multi-arch build (amd64, arm, arm64, ppc64le, riscv64, s390x) in v1.14.2 | Upstream CoreDNS test matrix | v1.14.2 ships riscv64; v1.14.3 was released amd64-only, breaking riscv64 manifests, reverted by [PR #13618](https://github.com/siderolabs/talos/pull/13618)/[#13619](https://github.com/siderolabs/talos/pull/13619) | Concrete evidence Talos actively guards riscv64 manifest integrity for bundled images even though the node OS itself has no riscv64 build |
| musl libc | Talos rootfs C library (not glibc) | Supported since musl 1.1.23 | Included in musl's own portability testing | Used as riscv64 libc by Alpine and others | Not used for riscv64 in Talos; no musl build for riscv64 in `siderolabs/pkgs` |
| runc | OCI container runtime | riscv64 upstreamed years ago | Exercised via moby/containerd riscv64 CI efforts | Not part of Talos's riscv64 release | No riscv64 arch stanza in `siderolabs/pkgs` runc package |
| OpenSSL | TLS/crypto used throughout Talos and its Go/Rust deps | Generic C build works; RISC-V vector-crypto assembly (Zvkned/Zvkg/Zvknha/Zvksed/Zvksh/Zvkb) merged upstream | Vector-crypto path tested via QEMU with V-extension; scalar path tested normally | Ships riscv64 in distro packages | Vector-crypto requires VLEN >= 128 hardware, else falls back to generic C |
| GRUB2 (bootloader) | UEFI boot on amd64 nodes | `grub-efi-riscv64` target exists in Debian sid | Reported producing a valid UEFI app but not yet reliably booting Linux on riscv64 in some reports [NEEDS VERIFICATION] | Debian ships `grub-efi-riscv64`; Talos does not build it at all | No riscv64 arch in `siderolabs/pkgs`'s grub package; Talos's riscv64 boot flow is entirely undefined |
| ISA-L (igzip) | SIMD-accelerated gzip on the Talos rootfs (amd64-only today; arm64 uses pigz) | riscv64 RVV support added in ISA-L v2.32 | Early; CI integration for riscv64 still being built out | Not released as riscv64 by Talos | AES self-tests disabled on riscv64 upstream |
| zstd | Compression (SquashFS, artifacts) | Generic riscv64 build works, ships in Debian stable | No RVV-accelerated path yet (upstream issue #4471 open) | Debian/Ubuntu ship riscv64 zstd | Missing RVV vectorization is a performance gap, not a correctness blocker |
| klauspost/cpuid (Go, transitive via klauspost/compress) | CPU-feature detection for compression SIMD dispatch | Supported: uses `riscv_hwprobe` syscall (Linux 6.4+) with `/proc/cpuinfo` fallback | No dedicated riscv64 CI issue found | Shipped as part of the module | Cache/topology info beyond ISA string still limited on riscv64 |
| libseccomp | Syscall filtering for runc/containers | Supported; userspace port passes regression tests | Regression suite passes on riscv64 | Ubuntu/Debian ship `libseccomp2` for riscv64 | None significant |
| cryptsetup / LUKS | Disk encryption (STATE/EPHEMERAL partitions) | Builds on riscv64, no arch-specific asm blockers | Packaged and tested by Debian/Ubuntu | Ubuntu ships riscv64 cryptsetup | No riscv64 arch target in `siderolabs/pkgs` |
| LVM2 / device-mapper | Volume management | Builds on riscv64 generically | Distro-tested | Ubuntu/Debian ship riscv64 | Not built for riscv64 in `siderolabs/pkgs` |
| WireGuard (kernel + wgctrl/wireguard-go) | SideroLink secure networking | In-tree kernel module works on riscv64; wgctrl/wireguard-go is pure Go | Exercised by generic riscv64 kernel CI | Ships wherever the riscv64 kernel ships it | Talos forks wgctrl (`siderolabs/wgctrl-go`) for a Talos-specific socket path; no riscv64-specific issue found |
| etcd / bbolt | Control-plane state store | Pure Go; riscv64 builds cleanly | Part of Go module CI | Not part of Talos's riscv64 artifacts (control-plane nodes need the full OS) | None found specific to riscv64 |
| aws-lc-rs / AWS-LC | Crypto backend pulled in transitively via the sigstore/cosign chain | `riscv64gc-unknown-linux-gnu` supported | musl-target riscv64 bindings still an open ask upstream | Published for riscv64-gnu | Irrelevant to Talos since it doesn't build musl-based Rust artifacts for riscv64 |

**Summary:** every OS-level dependency surveyed has *some* riscv64 upstream support, ranging from mature (kernel, Go, musl, libseccomp, cryptsetup, systemd) to nascent (GRUB EFI boot chain, ISA-L RVV kernels, zstd RVV vectorization). None of that upstream maturity is wired into Talos's own package build; the blocker is structural, at the `siderolabs/pkgs` build-matrix level (`PLATFORM ?= linux/amd64,linux/arm64`), not any single upstream dependency's readiness.

Talos Linux is a system OS distribution and Go CLI tool, not a package with a dependent ecosystem of plugins, extensions, or language-package consumers; Section 10 (Ecosystem Status) is omitted per the report's scoping rule.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#8655](https://github.com/siderolabs/talos/issues/8655) | riscv64 architecture images | Closed, `not_planned`/`Stale` | Feature request, not a bug | Zero comments before closure; the only ask for a full riscv64 OS port |
| [#13618](https://github.com/siderolabs/talos/pull/13618) | CoreDNS 1.14.3 amd64-only regression breaking riscv64 image manifests | Resolved (merged fix) | Correctness/multi-arch regression, medium severity while unfixed | Same-day fix on `release-1.12`; confirms riscv64 is treated as a supported target in Talos's dependency-manifest pipeline |
| [#13619](https://github.com/siderolabs/talos/pull/13619) | Same CoreDNS regression, `main` branch | Resolved (merged fix) | Same as above | Also queued for backport to `release-1.13` |

A direct `state:open riscv repo:siderolabs/talos` search returned **zero results**: there are currently no open riscv-related issues of any kind in the repository. No NaN/floating-point or other correctness bug specific to riscv64 was found in any search.

## 12. Objections and Upstream Blockers

**Stated objections:** none recorded. Issue #8655 received no maintainer comment explaining a rejection; it was closed by the automated stale-bot (`.github/workflows/stale.yml`, auto-close after 180 days idle plus a 7-day warning) after roughly 10 months of zero engagement, not by an explicit maintainer decision.

**Technical blockers:**
- Structural: `siderolabs/pkgs`'s build matrix (`PLATFORM ?= linux/amd64,linux/arm64`) has no riscv64 stanza across roughly 30 arch-gated packages (kernel, musl, runc, containerd, GRUB, OpenSSL, cryptsetup, LVM2, and others).
- Boot chain: no riscv64 GRUB/sd-boot integration exists in Talos; upstream GRUB riscv64-efi support is itself still maturing in some external reports [NEEDS VERIFICATION].
- No riscv64 stage exists in the root `Dockerfile` for any OS component (installer, imager, initramfs, kernel).

**Organizational blockers:**
- Single-vendor governance with no external maintainer voting process; a new architecture port depends entirely on Sidero Labs prioritization.
- No RISE Project membership or funded involvement was found for Sidero Labs/Talos, unlike RISE's active investment in adjacent Kubernetes-ecosystem projects (k0s, k3s, Kairos, containerd, upstream Kubernetes).

**Acceptance probability:** Talos Linux has, since #8655's closure, shipped concrete (if narrow) riscv64 work: the `talosctl` CLI build ([PR #12225](https://github.com/siderolabs/talos/pull/12225)/[#12242](https://github.com/siderolabs/talos/pull/12242)) and active maintenance of riscv64-safe bundled-image manifests ([PR #13618](https://github.com/siderolabs/talos/pull/13618)/[#13619](https://github.com/siderolabs/talos/pull/13619)). This shows Sidero Labs treats riscv64 as a target worth incremental, low-cost support (pure-Go artifacts, manifest hygiene) but is not currently investing in the OS-level port itself. Nothing in the record suggests a full riscv64 OS port PR would be rejected on principle; nothing in the record suggests one is planned or funded either.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI for the OS/node product, the project's primary deliverable)
- **Release provider:** none, for the OS/node image (verified directly: GitHub Release assets for `kernel-riscv64`, `initramfs-riscv64.xz`, `installer-riscv64.tar`, and `metal-riscv64.iso` all return HTTP 404 on the latest stable release, v1.14.0). A distinct, secondary artifact, the `talosctl` management CLI, is released by upstream for riscv64 (`talosctl-linux-riscv64`, confirmed HTTP 200) via a build-only CI step on tagged releases, but this is a client tool, not the OS the project exists to deliver, and does not by itself justify a higher color for the project as a whole.
- **Optimization level:** not applicable. Talos Linux is an OS distribution, not an optimization-purpose project under the color model's test (it would still deliver its value, being a Kubernetes node OS, with generic scalar code on every dependency; no primary value proposition rests on RISC-V-specific vectorization or hand-tuned code). Consistent with this, no RISC-V-specific optimization code exists anywhere in the repository (no `arch/riscv/`, no RVV intrinsics, no assembly), confirmed by exhaustive search.
- **Justification:** the actual Talos node OS (kernel, initramfs, installer, imager) has no riscv64 build, test, or release anywhere in upstream CI ([`.github/workflows/ci.yaml`](https://github.com/siderolabs/talos/blob/main/.github/workflows/ci.yaml), `PLATFORM` env var fixed at `linux/amd64,linux/arm64` across all 30 occurrences in the file), the official support matrix lists only amd64 and arm64 ([docs.siderolabs.com/talos/v1.13/getting-started/support-matrix](https://docs.siderolabs.com/talos/v1.13/getting-started/support-matrix)), and the one tracking issue asking for a riscv64 OS port is closed `not_planned` ([Issue #8655](https://github.com/siderolabs/talos/issues/8655)). No Linux distribution packages Talos Linux at all (PyPI 404, no Ubuntu 26.04 package, no Arch RISC-V listing), so the distribution floor described in the color model does not apply and cannot lift the grade. This is not a "confirmed broken" (red) state, since nothing that exists has been shown to fail; it is a "no upstream CI, no release" (orange) state for the graded artifact.
- **Pending work that could change the grade:** none identified. There is no open PR or issue targeting a riscv64 OS/kernel/installer build, and no RISE Project involvement or funding was found for Sidero Labs or Talos Linux in any channel searched (RISE blog, RISE GitHub org, RISE wheel builder, RISE members list). The only active riscv64-adjacent maintenance is defensive (keeping bundled dependency manifests, like CoreDNS, riscv64-safe) rather than expansive.

## 14. Investment Analysis

RISE has funded no work on Talos Linux specifically (confirmed absence across RISE's blog, GitHub org, and members list); RISE's Kubernetes-ecosystem riscv64 investment targets k0s, k3s, Kairos, containerd, and upstream Kubernetes instead. Nothing below duplicates existing RISE-funded work.

### 14.1 Functional Enablement

The core gap is a full riscv64 stanza across `siderolabs/pkgs` (~30 arch-gated packages: kernel, musl, runc, containerd, GRUB, OpenSSL, cryptsetup, LVM2, and others), a riscv64 kernel config, and new `install-artifacts-riscv64`/imager stages in the Talos `Dockerfile`, plus resolving the riscv64 UEFI boot chain (GRUB/sd-boot). This is greenfield OS-porting work, not a small patch; every one of these components individually has mature-to-nascent riscv64 upstream support (Section 9), so the work is integration, not upstream enablement.

### 14.2 Performance Optimization

Not applicable at this stage: there is no riscv64 OS build to optimize. Once a functional port exists, the ISA-L (igzip) and zstd RVV compression paths (both nascent upstream, Section 9) would be the first natural optimization targets, matching Talos's existing amd64 SIMD-accelerated compression path.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `.github/workflows/ci.yaml` that builds (and, once bootable, boots and tests) the OS image, either via QEMU riscv64 emulation or RISE RISC-V Runners (no evidence RISE runners are currently used by Talos in any workflow). Add a riscv64 `PLATFORM` entry once the OS build exists, and a riscv64 integration/provision test target alongside the existing `integration-test-provision-linux-amd64`/`-arm64` Makefile targets.

### 14.4 Ecosystem Enablement

Not applicable; Talos has no dependent package ecosystem (Section 10 omitted). The one recurring ecosystem-adjacent risk observed in the research, non-riscv64-aware upstream dependency releases (the CoreDNS 1.14.3 amd64-only regression, PR #13618/#13619), is already being caught and fixed by Sidero Labs' own process without external help.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 stanzas across `siderolabs/pkgs` (~30 packages: kernel, musl, runc, containerd, OpenSSL, cryptsetup, LVM2, etc.) | 8-12 (engineering estimate; not sourced from findings) | Sidero Labs / external contributor | High |
| Functional | riscv64 UEFI boot chain (GRUB or sd-boot riscv64-efi integration) | 4-8 (engineering estimate) | Sidero Labs / external contributor | Critical (blocks everything else) |
| Functional | New `install-artifacts-riscv64`/imager Dockerfile stages, riscv64 kernel config | 3-5 (engineering estimate) | Sidero Labs | High |
| CI/CD | riscv64 build+boot+test job in `ci.yaml`, riscv64 QEMU or RISE runner integration | 2-4 (engineering estimate) | Sidero Labs | High |
| CI/CD | riscv64 provision/integration test target (mirroring `integration-test-provision-linux-amd64/-arm64`) | 1-2 (engineering estimate) | Sidero Labs | Medium |
| Performance | RVV-accelerated compression path (ISA-L/zstd) once functional port exists | 1-2 (engineering estimate) | Sidero Labs or upstream ISA-L/zstd contributors | Low (post-functional) |
| Organizational | Reopen and staff Issue #8655 with an explicit roadmap decision (accept or formally decline) | n/a (decision, not engineering effort) | Sidero Labs leadership | Critical (removes ambiguity blocking any contributor investment) |

All effort figures above are engineering judgment estimates for scoping purposes; they are not sourced from the research findings and should be treated as directional, not measured.

## 15. Updates

No updates yet, initial report dated 2026-09-11.

## 16. References

- [Sidero Labs / Talos Linux homepage](https://www.talos.dev/)
- [siderolabs/talos repository](https://github.com/siderolabs/talos)
- [siderolabs/pkgs repository](https://github.com/siderolabs/pkgs)
- [Issue #8655, "riscv64 architecture images"](https://github.com/siderolabs/talos/issues/8655)
- [PR #12225, "feat: add riscv64 build of talosctl"](https://github.com/siderolabs/talos/pull/12225)
- [PR #12242, "fix: add riscv64 talosctl to release artifacts"](https://github.com/siderolabs/talos/pull/12242)
- [PR #13618, "fix: (1.12.9) revert coredns to 1.14.2"](https://github.com/siderolabs/talos/pull/13618)
- [PR #13619, "fix: revert coredns to 1.14.2"](https://github.com/siderolabs/talos/pull/13619)
- [PR #6039, containerd dependabot bump (incidental match, not riscv64 work)](https://github.com/siderolabs/talos/pull/6039)
- [Talos support matrix, v1.13 docs](https://docs.siderolabs.com/talos/v1.13/getting-started/support-matrix)
- [siderolabs/talos CI workflow, `.github/workflows/ci.yaml`](https://github.com/siderolabs/talos/blob/main/.github/workflows/ci.yaml)
- [siderolabs/talos GitHub Releases](https://github.com/siderolabs/talos/releases)
- [PyPI package check for sidero-talos-linux (404)](https://pypi.org/pypi/sidero-talos-linux/json)
- [Ubuntu 26.04 "resolute" package search (no results)](https://packages.ubuntu.com/search?keywords=sidero-talos-linux&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search (no listing)](https://archriscv.felixc.at/?q=sidero%20talos%20linux)
- [RISE Project blog listing](https://riseproject.dev/blog)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project, "RISE RISC-V Runners: six weeks in"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [Sidero Labs, Inc. corporate site](https://www.siderolabs.com/)
