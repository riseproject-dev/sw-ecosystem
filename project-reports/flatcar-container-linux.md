---
title: Flatcar Container Linux
parent: Project Reports
color: orange
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: containerd
    relation: runtime-dependency
    criticality: critical
  - name: runc
    relation: runtime-dependency
    criticality: critical
  - name: Docker
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: libseccomp
    relation: runtime-dependency
    criticality: optional
  - name: LZ4
    relation: runtime-dependency
    criticality: optional
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="flatcar-container-linux" %}

# Flatcar Container Linux

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Flatcar Container Linux<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Flatcar Container Linux is a container-optimized Linux distribution, forked from CoreOS Container Linux. Its build system is a Gentoo Portage/ebuild-based SDK driven by shell scripts (`build_packages`, `build_image`, `setup_board`), not CMake or Autotools; third-party packages are vendored as `.ebuild` files under `sdk_container/src/third_party/portage-stable` and `coreos-overlay`.

Flatcar is legally hosted under the **Cloud Native Computing Foundation (CNCF)** at the Incubating maturity level, accepted August 2, 2024, framed as "a Series of LF Projects, LLC." Governance is flat and community-based: all maintainers form a Maintainer Council that operates by lazy consensus, with formal votes (simple majority, or 2/3 for maintainer removal/charter changes) held via mailing list or the monthly "Flatcar Developer Sync." No `PLATFORMS.md`/tier-policy document exists; architecture support is not formally tiered and follows the same general consensus process as any other change.

Corporate sponsors listed on [flatcar.org](https://www.flatcar.org/): Microsoft, Akamai, Brightbox, Cloudbase Solutions, Giant Swarm, Hetzner, STACKIT. Of the 16 listed maintainers in `Flatcar/MAINTAINERS.md`, at least 7 are Microsoft employees (a legacy of Microsoft's 2022 acquisition of Kinvolk, the company that founded Flatcar as a CoreOS fork), with Cloudbase Solutions (Windows/Hyper-V integration specialists) as the second-largest cluster and one NVIDIA-affiliated maintainer.

Community culture on new ports reads as "interested but unresourced." The project's stated value is *"Community over Product or Company: Sustaining and growing our community takes priority over shipping code or sponsors' organizational goals,"* consistent with the RISC-V request-for-enhancement being left open and unassigned rather than rejected, but with no maintainer engineering time committed to it since February 2025.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-04-09 | ader1990 (Cloudbase Solutions) opens the tracking RFE, stating "Flatcar cannot be built for the RISC-V architecture" | [flatcar/Flatcar#1420](https://github.com/flatcar/Flatcar/issues/1420) |
| 2024-07-10 | ader1990 posts notes on building Gentoo RISC-V on a LicheePi4A board (cross toolchain, U-Boot, kernel, OpenSBI) | [#1420 comment](https://github.com/flatcar/Flatcar/issues/1420) |
| 2024-07-13 | ader1990 confirms Gentoo boots on LicheePi4A with systemd 255 | [#1420 comment](https://github.com/flatcar/Flatcar/issues/1420) |
| 2024-07-15 | chewi (Microsoft) authors commit `abc2f81`, "Support building the SDK for arm64," whose message explicitly states the refactor is "paving the way for riscv support later" | [flatcar/scripts@abc2f81](https://github.com/flatcar/scripts/commit/abc2f81533c7671feb1d4cd8d345f7d22e0c98b3) |
| 2024-07-19 | ader1990 posts WIP cross-build SDK notes; flags a libselinux issue on riscv64; chewi points to an upstream Gentoo fix | [#1420 comment](https://github.com/flatcar/Flatcar/issues/1420) |
| 2024-08-02 | krnowak opens PR #2193 adding dev-cpp/glog, dev-cpp/gflags, etc., "Needed by the RISC-V effort" per ader1990's review comment; gated on upstream Gentoo PR gentoo/gentoo#37991 for u-boot-tools, resolved same week | [flatcar/scripts#2193](https://github.com/flatcar/scripts/pull/2193) |
| 2024-08-05 | ader1990 posts a checklist for "experimental" RISC-V support (overlay changes, profiles, toolchain, hardware testing) | [#1420 comment](https://github.com/flatcar/Flatcar/issues/1420) |
| 2024-08-07 | chewi warns Gentoo is restructuring riscv32/riscv64 keywords; ader1990 notes inconsistent riscv naming across the ecosystem | [#1420 comment](https://github.com/flatcar/Flatcar/issues/1420) |
| 2024-08-20 | ader1990 links a golang-binding compatibility fix needed to build `mayday` on RISC-V | [#1420 comment](https://github.com/flatcar/Flatcar/issues/1420) |
| 2025-01-01 | ader1990 announces a working PoC of Flatcar on RISC-V under QEMU, on a personal branch | [#1420 comment](https://github.com/flatcar/Flatcar/issues/1420) |
| 2025-01-07 | ader1990 publishes a release with a working RISC-V image, bootloader, and QEMU instructions on his personal fork | [ader1990/scripts riscv-poc-07-jan-2025](https://github.com/ader1990/scripts/releases/tag/riscv-poc-07-jan-2025) |
| 2025-02-12 | squillace (Microsoft) expresses interest in testing on MILK-V hardware for Wasm/Kubernetes work; ader1990 clarifies focus is QEMU-only for now | [#1420 comment](https://github.com/flatcar/Flatcar/issues/1420) |
| 2025-02-13 | squillace reports trouble running QEMU under WSL. **No activity recorded on #1420 since this date.** | [#1420 comment](https://github.com/flatcar/Flatcar/issues/1420) |
| 2025-09-01 to 2025-09-05 | Weekly automated portage-stable PR #3233 adds a `sys-kernel/linux-headers` dependency gated on `USE=riscv` to `media-libs/libpng` - incidental, not a deliberate port step | [flatcar/scripts#3233](https://github.com/flatcar/scripts/pull/3233) |
| 2026-05-20 | chewi's arm64-SDK PR #3678 merges (first appears in release `alpha-4722.0.0`, 2026-06-15) - still arm64 work only | [flatcar/scripts#3678](https://github.com/flatcar/scripts/pull/3678) |

Key contributors: **ader1990** (Adrian Vladu, Cloudbase Solutions) drove essentially all hands-on riscv64 porting work; **chewi** (James Le Cuirot, Microsoft) authored the prerequisite arm64/architecture-agnostic refactor and reviewed related Gentoo package issues; **krnowak** (Krzesimir Nowak, Microsoft) merged the dev-package automation PR that ader1990 flagged as RISC-V-motivated.

**Is it fully upstream? No.** No riscv64 board, toolchain registration, or image-build logic has ever been merged into `flatcar/scripts`. The only working artifact - a QEMU-bootable image with bootloader - exists exclusively on ader1990's personal fork (`ader1990/scripts`, tag `riscv-poc-07-jan-2025`, branch `ader1990/riscv-poc-v2`) and has never been submitted as a PR to `flatcar/scripts`.

## 3. Upstream Support Tier

No formal tier policy document exists (`PLATFORMS.md`, `SUPPORT.md`, or equivalent are absent from both `flatcar/scripts` and `flatcar/Flatcar`). Architecture support is instead observable directly from the build system and README.

From `README.md` (verbatim): *"Full SDK initialised with both architectures supported by Flatcar (amd64 and arm64)... While work on a native ARM64 native SDK is ongoing, it's unfortunately not ready yet."* `sdk_lib/setup_boards.sh` only ever calls `./setup_board --board=arm64-usr` and `./setup_board --board=amd64-usr`.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Board defined (`board_options.sh`, `setup_boards.sh`) | Yes | Yes | No |
| CHOST/toolchain registration (`toolchain_util.sh`) | Yes (`x86_64-cros-linux-gnu`) | Yes (`aarch64-cros-linux-gnu`) | No - unmatched CHOST hits `die "Unknown CHOST '$1'"` |
| Coreos-overlay board profile | `coreos/amd64/generic` | `coreos/arm64/generic` | None |
| CI builds + tests | Yes | Yes | No |
| Official release artifact | Yes (all channels) | Yes (all channels) | No |
| Native SDK status | Ready | "Ongoing, not ready yet" per README | Not started |

Data source: [flatcar/scripts README.md](https://github.com/flatcar/scripts), local clone `build_library/toolchain_util.sh` and `sdk_lib/setup_boards.sh` at commit `86db1c3b7df1f1a99a551992ca50a89bb3bf8bfe`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Flatcar itself has no JIT, SIMD, or crypto code of its own - it is an OS build/packaging system, not a numerics or runtime library. The relevant architecture-specific surface is limited to build/boot machinery (QEMU emulation dispatch, bootloader targeting, VM image layout).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| QEMU emulation dispatch (`build_library/catalyst.sh`) | Full (`qemu-x86_64`) | Full (`qemu-aarch64`) | Dead stub: `riscv) QEMU=qemu-riscv64 ;;` exists but is unreachable because `ARCH` can never be set to `"riscv"` |
| GRUB/bootloader arch handling | Full | Full | Missing |
| VM image / disk layout (`vm_image_util.sh`, `build_image_util.sh`) | Full | Full | Missing |
| mantle/kola test framework board validation | Accepted | Accepted | Explicitly **rejected**: `platform/api/oraclecloud/api_test.go` asserts `validateBoard("riscv64-usr")` must return an error |
| Package keywording (portage-stable ebuilds) | Full | Full | Partial - many `~riscv`/`~riscv64` `KEYWORDS` lines exist, but these are unmodified upstream Gentoo metadata, not Flatcar-specific integration |

The single `riscv)` case arm in `catalyst.sh` is confirmed dead code: `get_portage_arch()` in `build_library/toolchain_util.sh` maps CHOST strings to `amd64`/`arm64`/etc. with no `riscv*` branch, so any riscv64 CHOST hits the `*) die "Unknown CHOST '$1'"` fallback before the QEMU dispatch table is ever reached. No other file in the repository (`prefix_util.sh`, `qemu_template.sh`, `grub_install.sh`, `vm_image_util.sh`, `build_image_util.sh`, `prod_image_util.sh`, grub.cfg variants, `generate_au_zip.py`, `extract-initramfs-from-vmlinuz.sh`) contains any riscv branch, dead or otherwise.

Source: local clone verification of `flatcar/scripts` at `86db1c3b7d`, cross-checked with `mcp__github__search_code` (`"riscv-usr" OR "riscv64-usr" org:flatcar` -> 0 results; `"#ifdef __riscv repo:flatcar/scripts"` -> 0 results).

## 5. Build System, Cross-Compilation, and Toolchain

Flatcar's build system is Gentoo Portage/ebuild-based, driven by shell scripts, not CMake. No `CMakeLists.txt`, `configure` script, `cmake/riscv64.cmake`, or `cmake/toolchain-riscv64.cmake` exists in the repository - every `CMakeLists.txt` hit found belongs to individual third-party packages vendored under `sdk_container/src/third_party/portage-stable/` (e.g. `dev-cpp/glog`, `dev-libs/protobuf`), not to Flatcar's own build configuration.

There is no documented, working command to build a riscv64 Flatcar image. Attempting the closest analog (`setup_board --board=riscv64-usr`) would fail: no such board is registered in `board_options.sh` or `setup_boards.sh`, and any riscv64 CHOST fed into `get_portage_arch()` in `toolchain_util.sh` triggers `die "Unknown CHOST '$1'"`.

QEMU usage: the only riscv64-related QEMU reference is the dead `qemu-riscv64` dispatch line in `build_library/catalyst.sh` (Section 4) - it is never invoked through any real build path since no board sets `ARCH=riscv`.

Toolchain minimums: Data not available - no Flatcar-specific riscv64 toolchain requirement is defined anywhere, since no riscv64 board exists to have toolchain requirements. Stock upstream Gentoo RISC-V profile CFLAGS (e.g. `-mabi=lp64d`, `-march=rv32imac` under `profiles/arch/riscv/`) are present as inert upstream boilerplate inherited via the unmodified `portage-stable` mirror, unused by any Flatcar board.

Known build failures: Data not available in a formal, tracked sense from `flatcar/scripts` itself (no riscv64 build is ever attempted in CI). The de facto build-blocking issue is the `die "Unknown CHOST"` fallback described above, confirmed by direct code reading rather than by an observed CI failure log.

Dockerfiles: the only Dockerfiles in the repo (`Dockerfile.sdk-build`, `Dockerfile.sdk-import`, `Dockerfile.sdk-update`, `Dockerfile.lean-arch`, `ci-automation/util/Dockerfile.pigz`) are architecture-agnostic SDK-container Dockerfiles; none is named or scoped to riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Bootable OS image (any channel) | Yes | Yes | No |
| Board definition | Yes | Yes | No |
| Native (non-cross-compiled) SDK | Yes | "Ongoing, not ready yet" per README | Not started |
| CI-validated builds | Yes | Yes | No |
| kola/mantle test coverage | Yes | Yes | Explicitly rejected as unsupported |
| Container runtime stack (containerd, runc) at the dependency level | Fully riscv64-capable upstream | Fully riscv64-capable upstream | Fully riscv64-capable upstream, but irrelevant while no Flatcar riscv64 image exists to run them on |

**Functional gaps:** Flatcar cannot be built for riscv64 at all through its official tooling - there is no partial functionality to describe; the gap is total (no board, no image, no release).

**Performance gaps:** Not applicable - there is no riscv64 image to measure. No performance benchmark data for "Flatcar on RISC-V" was found anywhere; targeted web searches for "Flatcar Container Linux riscv64 benchmark," "riscv64 vs arm64 performance," and `site:riseproject.dev` searches for Flatcar all returned nothing.

**Security hardening gaps:** Not applicable at the OS-image level for the same reason. At the dependency level, the most severe security-relevant gap among Flatcar's critical components is OpenSSL's unresolved AES T-table constant-time issue on riscv64 hardware lacking Zkn/Zvkned extensions (cache-timing key leak; fix PRs [#31080](https://github.com/openssl/openssl/pull/31080)/[#31082](https://github.com/openssl/openssl/pull/31082) unmerged, per `project-reports/openssl.md`) - moot until Flatcar ships any riscv64 image at all, but relevant to future risk once one exists.

**NaN/floating-point semantics issues:** Data not available - none found and none applicable given no riscv64 build path exists to exercise this class of bug.

## 7. CI/CD Infrastructure

No riscv64 CI exists in `flatcar/scripts`. This was verified directly by reading, in full, every CI configuration file in the repository:

- All 13 GitHub Actions workflow files: `cacerts-release.yaml`, `ci.yaml`, `dispatch-kola-tests.yaml`, `firmware-release-main.yaml`, `kernel-release.yaml`, `mantle-releases-main.yml`, `pr-comment-build-dispatcher.yaml`, `pr-workflows.yaml`, `run-kola-tests.yaml`, `update-metadata-glsa.yaml`, `update-portage-stable-packages-from-list.yaml`, `update-sdk.yaml`, `vmware-release-main.yaml`
- The `jenkins/` directory (`jenkins/systemd-run-wrap.sh`)
- Confirmed absent: `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/`, Azure Pipelines, Travis, Drone, Buildkite configs

Case-insensitive grep for "riscv" across all of the above returned **zero matches**. The only "riscv" occurrences anywhere in the repository are Gentoo `KEYWORDS="~riscv"` / `RISCV_KEYWORDS` lines inside third-party `.ebuild` files under `sdk_container/src/third_party/portage-stable/` - upstream Gentoo package metadata, not CI configuration, and not read by any GitHub Actions workflow.

No RISE runner references (`riseproject-dev`, RISE runner labels) were found anywhere in the CI configuration. Verification was performed against a fresh `git fetch origin main`, confirming the local clone matched `origin/main` HEAD `86db1c3b7df1f1a99a551992ca50a89bb3bf8bfe` exactly at the time of the check.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | No |
| CI runs tests | Yes | Yes | No |
| CI publishes release artifact | Yes | Yes | No |
| RISE runner usage | No | No | No |

## 8. Distribution and Release Status

No official riscv64 binaries exist for Flatcar Container Linux. This was checked across every plausible channel:

- **Official releases page** ([flatcar.org/releases](https://www.flatcar.org/releases)): explicitly lists only **amd64 (x86_64)** and **arm64 (AArch64)** as supported architectures across Stable/Beta/Alpha/LTS channels. riscv64 is not mentioned.
- **PyPI** (`https://pypi.org/pypi/flatcar-container-linux/json`): HTTP 404 - not applicable, since Flatcar is a Linux distribution, not a Python package; there is no legitimate PyPI project by this name for any architecture.
- **RISE wheel builder mirror**: redirects to the same PyPI 404 - no package present.
- **Ubuntu 26.04 (Resolute)** (`packages.ubuntu.com` search): "Sorry, your search gave no results" for `flatcar`/`flatcar-container-linux` - the package does not exist in Ubuntu's archive for **any** architecture, not just riscv64.
- **Arch Linux RISC-V port** (archriscv.felixc.at): no matching package.
- **GitHub Releases (`flatcar/scripts`)**: individual asset filenames could not be enumerated directly (this session's GitHub API access was not attached to `flatcar/scripts`, and GitHub's Assets UI did not hydrate via WebFetch). Substituted with an independent git tag/tree search of the cloned repository: `git ls-remote --tags origin | grep -i riscv` returned zero riscv-related tags in the entire tag history, and `find . -iname "*riscv*" -not -path "*/portage-stable/*"` returned zero matches outside vendored Gentoo metadata. Combined with the flatcar.org releases page, this is treated as equivalent-strength evidence that no riscv64 release asset exists. [NEEDS VERIFICATION: direct GitHub release-asset filename enumeration was not completed due to session tooling access limits]
- **project-graph MCP server**: connection failed (`CONNECTION_CLOSED`) across the session, so a SPARQL-based distro-availability check could not be run; this is a tooling gap, not a confirmed-empty result, and is flagged as not executed rather than corroborating evidence either way.

**What a user must do to get a working binary today:** there is no supported path. The only working riscv64 artifact is a QEMU-bootable image published by an individual contributor on a personal fork - [ader1990/scripts, release `riscv-poc-07-jan-2025`](https://github.com/ader1990/scripts/releases/tag/riscv-poc-07-jan-2025), with a newer iteration on branch [`ader1990/riscv-poc-v2`](https://github.com/ader1990/scripts/tree/ader1990/riscv-poc-v2) - explicitly a personal proof-of-concept, not an officially supported or maintained release, and not distributed through any Flatcar-branded channel.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Community/CI note |
|---|---|---|---|---|---|
| Linux kernel | Base kernel Flatcar ships | Full riscv64 port upstream | Kernel's own CI; no Flatcar-specific riscv64 kernel-config work found | Flatcar has no riscv64 image target today | Data not available beyond upstream kernel status |
| glibc | System C library | Yes, since 2.27 (2018); RVV memset merged Dec 2025 | CI broken: both Sourceware riscv64 Buildbot builders offline since mid-2025, recent runs FAILURE | Yes - Debian sid, Ubuntu Noble, Arch RISC-V, Fedora rawhide ship riscv64 glibc | RVV memset IFUNC selects vector path even when RVV is disabled via `prctl()`, causing SIGILL, unresolved; see `project-reports/glibc.md` |
| Go (toolchain) | Builds containerd, runc-dependent tooling | linux/riscv64 supported since Go 1.14, secondary port tier | 3 of 4 native riscv64 builders (mengzhuo/PLCT hardware) broken (#79067-69); race detector unsupported | go.dev/dl ships `go1.26.4.linux-riscv64.tar.gz`; Debian/Ubuntu/Arch ship it | Open critical: #78161 memory-corruption/inlining miscompile; #74683 FIPS140+PIE broken; ~20-40% perf gap vs arm64 (#77541, unfixed); see `project-reports/go.md` |
| containerd | Container runtime | Fully upstream, no out-of-tree patches | Cross-compile CI only; fork CI shows 1752 pass/0 fail; upstream PR #13124 blocked on RISE GitHub App install | riscv64 binaries shipped since v1.6.8 (2022); Debian/Ubuntu ship it | CRIU checkpoint/restore non-functional (upstream CRIU gap); see `project-reports/containerd.md` |
| runc | OCI runtime | Fully upstream since v1.2.0 (2022) | No CI at all on riscv64 (issue #5166 requesting it closed unresolved) | `runc.riscv64` signed binary ships every release since v1.2.0; Debian trixie/sid, Ubuntu, Alpine ship it | Static PIE unavailable (libc gap); see `project-reports/runc.md` |
| Docker/moby | Reference container engine | Compiles from source with manual override; no official riscv64 binary - PR #44735 open as Draft since Jan 2023 | Zero riscv64 CI in moby/moby | No riscv64 directory on download.docker.com; Debian sid/Ubuntu Noble ship downstream repackaged `docker.io` | Blocked on 2 failing iptables-nft tests on Debian trixie; `docker buildx` closed "Not planned" for riscv64; see `project-reports/docker.md` |
| OpenSSL | TLS/crypto | Extensive riscv64 port: scalar Zkn AES/SHA, full Zvk vector-crypto suite | QEMU-only CI, no native runner; extension-matrix CI conditional only | Source-only upstream releases; Debian sid, Ubuntu Noble, Arch RISC-V ship it | Critical open security gap: AES T-table fallback not constant-time without Zkn/Zvkned (cache-timing key leak), fix PRs #31080/#31082 unmerged; musl-based riscv64 (Alpine) loses all HW acceleration (#28118); see `project-reports/openssl.md` |
| libseccomp | Seccomp-BPF filters (used by containerd/runc/Docker) | Fully upstream since v2.5.0 (2020), pure C | No upstream CI for riscv64 (amd64-only CI matrix) | Debian trixie, Ubuntu Noble, Arch RISC-V ship it | None open for riscv64; see `project-reports/libseccomp.md` |
| LZ4 | Compression | Basic support since v1.10.0 (2024); Zicclsm auto-detect merged Sep 2025 | QEMU CI exists, riscv64 grouped in lowest CI tier | Debian sid, Ubuntu Noble ship `liblz4-1`; no PyPI riscv64 wheel | `LZ4_FAST_DEC_LOOP` disabled for riscv64, 3 competing unreviewed PRs; single-maintainer bottleneck; see `project-reports/lz4.md` |
| xz/liblzma | Compression | Full riscv64 BCJ filter merged 2024; no hardware CRC path | No riscv64 CI at all upstream | Debian sid, Ubuntu ports, Arch RISC-V ship it | No open correctness bugs; see `project-reports/xz.md` |
| zstd | Compression | Partial RVV vectorization (2025); Huffman/sequence-decode fast paths still unmerged | QEMU-only CI, PR-triggered only | Debian sid, Ubuntu Noble ship it; no PyPI riscv64 wheel | 6+ open perf PRs stalled on maintainer non-response; arch-detection bug present through v1.5.7; see `project-reports/zstd.md` |

**Deep-dive: OpenSSL** is the most consequential dependency-level finding for a future Flatcar riscv64 image. The AES T-table constant-time gap ([#31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082), both unmerged) means any hardware lacking the Zkn/Zvkned vector-crypto extensions - which describes the majority of currently deployed riscv64 silicon - would leak AES key material via cache timing if Flatcar shipped an image on it today. **glibc's** upstream riscv64 CI is currently non-functional (both Sourceware Buildbot builders offline since mid-2025), meaning regressions surface only via downstream Debian/Ubuntu package builds, not upstream signal. Overall, no dependency-level issue blocks a hypothetical riscv64 image from functioning - the container runtime stack (containerd, runc) is riscv64-clean - but CI coverage across the stack is uniformly weak (QEMU-only or cross-compile-only, no native hardware CI) and several performance PRs are stalled on single-maintainer bottlenecks.

Note: an attempted project-graph SPARQL query against Ubuntu 26.04 ("resolute") for these dependencies' package availability could not be run (`CONNECTION_CLOSED`); the distro-availability claims above are instead sourced from each dependency's own `project-reports/*.md`, which check Debian sid/Ubuntu 24.04 Noble, not 26.04/resolute specifically. [NEEDS VERIFICATION: resolute-specific package availability]

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [flatcar/Flatcar#1420](https://github.com/flatcar/Flatcar/issues/1420) | [RFE] Add RISC-V support for Flatcar Container Linux | Open, no activity since 2025-02-13 | Feature request, not a bug | No assignee, no milestone; body states "Flatcar cannot be built for the RISC-V architecture" |
| mantle test (`platform/api/oraclecloud/api_test.go`) | `validateBoard("riscv64-usr")` expected to error | Passing (by design) | Correctness of test suite, not a defect | Confirms riscv64-usr is affirmatively coded as an unsupported board, not merely absent |
| gentoo/gentoo#37991 [NEEDS VERIFICATION] | Upstream Gentoo u-boot-tools fix blocking Flatcar's dev-package automation PR #2193 | Resolved (merged upstream before PR #2193 merged, per krnowak's comment) | Was a blocking dependency, now resolved | Referenced only via ader1990/krnowak's PR discussion; not independently fetched from gentoo/gentoo in this research pass |

**Correctness bugs specific to Flatcar's own riscv64 code:** none exist to report, because no riscv64 code path is ever reached (Section 4) - there is nothing running to exhibit a correctness bug. This is distinct from, and should not be conflated with, the dependency-level correctness/security issues in Section 9 (OpenSSL AES timing gap, glibc CI outage, Go inlining miscompile), which are properties of upstream projects Flatcar bundles, not of Flatcar's own code.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer has argued against adding RISC-V support. The tone throughout #1420 is uniformly receptive (chewi provided technical assistance twice; squillace from Microsoft expressed active interest in hardware testing).

**Technical blockers:**
- No riscv64-usr board, CHOST registration, or toolchain profile exists in `flatcar/scripts` (Section 3).
- `mantle`'s test suite affirmatively encodes riscv64-usr as rejected, meaning even a future PR adding a riscv64 board would need this test updated.
- Bootloader/hardware support beyond QEMU is explicitly unaddressed - ader1990 stated in the 2025-02-12 comment that the PoC's "focus is QEMU-only for now," and squillace's follow-up attempt to run it under WSL hit unresolved setup trouble, with no further activity recorded.
- Package-level readiness issues surfaced during the PoC (a libselinux issue on riscv64, a golang-binding compatibility fix needed for `mayday`, Gentoo's own riscv32/riscv64 keyword restructuring) were each resolved individually but represent the kind of long-tail work that would recur at scale for a full port.

**Organizational blockers:**
- The entire riscv64 effort has been carried by one contributor (ader1990, Cloudbase Solutions) without a second engineer's sustained involvement; no maintainer has taken ownership of upstreaming the PoC into `flatcar/scripts`.
- No RISE Project involvement exists for Flatcar specifically - confirmed via RISE's full blog archive (34 posts, none mention Flatcar), RISE member lists (Flatcar, Microsoft, and Cloudbase Solutions are not RISE members), the RISE GitHub org (`riseproject-dev`, 25 repos, zero Flatcar-related), and RISE's CI runner infrastructure (explicitly Ubuntu 24.04-based, not Flatcar). The only occurrence of "Flatcar" anywhere in RISE-adjacent tooling is this project's own unreviewed entry in `project-reports/.queue.yml` - an internal tracking-queue placeholder, not evidence of RISE activity.
- No corporate sponsor (Microsoft, Akamai, Brightbox, Cloudbase Solutions, Giant Swarm, Hetzner, STACKIT) has a stated RISC-V roadmap commitment for Flatcar specifically. [NEEDS VERIFICATION: sponsor-level RISC-V intent was not independently confirmed beyond the absence of any public statement]

**Acceptance probability:** the governance model (lazy consensus, no formal architecture-tier gate) suggests a well-executed PR upstreaming a working riscv64 board would likely be reviewed on its technical merits rather than rejected on principle - consistent with chewi's prerequisite arm64 refactor explicitly citing riscv64 as a future beneficiary. However, with zero maintainer-driven activity on #1420 since February 2025 and the working PoC still confined to a personal fork 19+ months after the RFE was filed, near-term (6-12 month) upstreaming without new external engineering investment is unlikely.

## 13. Readiness Assessment

- **Color:** orange (base orange - no upstream CI, no distribution floor applicable)
- **Release provider:** none
- **Optimization gap:** N/A - Flatcar Container Linux is an OS distribution/build system, not an optimization-purpose project (no JIT, SIMD, or performance-differentiating algorithm of its own to grade for ISA-extension coverage).
- **Justification:** Flatcar has no upstream riscv64 CI of any kind - an exhaustive read of all 13 GitHub Actions workflow files and the `jenkins/` directory found zero "riscv" matches ([Section 7](#7-cicd-infrastructure)), and no riscv64 board, CHOST, or toolchain registration exists in `build_library/toolchain_util.sh`. The distribution floor does not apply because no Linux distribution or third party ships a Flatcar riscv64 artifact either - the official [flatcar.org/releases](https://www.flatcar.org/releases) page lists only amd64 and arm64 across all channels, and Ubuntu 26.04's package archive has no `flatcar*` package at all, for any architecture. This is not the "confirmed broken" (red) case, since nothing has regressed - it is a port that has never been engineered into the mainline build system; the only working artifact is a personal contributor's unmerged proof-of-concept fork ([ader1990/scripts](https://github.com/ader1990/scripts/releases/tag/riscv-poc-07-jan-2025)).
- **Pending work that could change the grade:** the tracking issue [flatcar/Flatcar#1420](https://github.com/flatcar/Flatcar/issues/1420) remains open with no maintainer rejection, and one merged prerequisite PR ([flatcar/scripts#3678](https://github.com/flatcar/scripts/pull/3678)) explicitly frames its arm64 SDK refactor as "paving the way for riscv support later." If ader1990's PoC branch (`ader1990/riscv-poc-v2`) were upstreamed as a PR adding a `riscv64-usr` board, CHOST mapping, and CI job, the grade would move to yellow (build-only) or higher depending on whether tests are wired in. No RISE involvement was found that would independently accelerate this.

## 14. Investment Analysis

RISE has not funded, resourced, or otherwise touched Flatcar's RISC-V effort at any level (Section 12) - there is no prior RISE work to net out. All sizing below is therefore for work starting from the current baseline (a personal, unmerged PoC fork).

### 14.1 Functional Enablement

The core work is upstreaming and hardening ader1990's existing PoC (`ader1990/riscv-poc-v2`), not starting from zero: adding a `riscv64-usr` board definition and `riscv-cros-linux-gnu` CHOST to `toolchain_util.sh`/`board_options.sh`, a `coreos-overlay:coreos/riscv/generic` profile analogous to the arm64 one, wiring the dead `catalyst.sh` QEMU dispatch line into a reachable path, updating the mantle test that currently asserts `riscv64-usr` is rejected, and closing the package-level gaps already surfaced during the PoC (libselinux, `mayday`'s golang binding, any remaining Gentoo `~riscv` keyword gaps). Bootloader/hardware support beyond QEMU (the gap squillace hit) is separate follow-on work.

### 14.2 Performance Optimization

Not meaningfully separable from functional enablement at this stage - there is no riscv64 image to optimize yet. Once a board boots, the OpenSSL AES constant-time gap (Section 9) should be treated as a security prerequisite, not a performance nice-to-have, before any production use on hardware lacking Zkn/Zvkned.

### 14.3 CI/CD Infrastructure

Requires adding a riscv64 job to the existing GitHub Actions pipeline (`.github/workflows/ci.yaml` and the kola test dispatch workflows), most plausibly via RISE's Ubuntu-24.04-riscv runners (Section 12 confirms these exist and are unaffiliated with Flatcar today) or QEMU-based emulation matching ader1990's PoC approach, plus updating the mantle test suite to accept `riscv64-usr` as a valid board.

### 14.4 Ecosystem Enablement

Not applicable as a distinct section (Section 10 omitted) - Flatcar is a container OS, not a package ecosystem with dependent third-party packages requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `riscv64-usr` board, CHOST, and coreos-overlay profile; upstream ader1990's PoC branch into `flatcar/scripts` | 4-8 | Flatcar maintainers + ader1990 | Critical |
| Functional | Fix mantle test rejecting `riscv64-usr`; resolve any remaining package-level gaps (libselinux, mayday bindings) | 1-2 | Flatcar maintainers | High |
| Functional | Bootloader/hardware support beyond QEMU (real riscv64 boards: LicheePi 4A, Milk-V, Ventana) | 4-6 | Flatcar maintainers / hardware partners | Medium |
| CI/CD | Wire a riscv64 job into `ci.yaml` and kola test dispatch, using RISE runners or QEMU | 2-4 | Flatcar maintainers | High |
| Security | Track/apply upstream OpenSSL AES constant-time fix ([#31080](https://github.com/openssl/openssl/pull/31080)/[#31082](https://github.com/openssl/openssl/pull/31082)) before any production riscv64 image ships | 0.5 (tracking only, fix owned upstream) | Flatcar security team | Critical (pre-GA) |

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [flatcar/Flatcar#1420 - RFE: Add RISC-V support for Flatcar Container Linux](https://github.com/flatcar/Flatcar/issues/1420)
- [flatcar/scripts#3678 - Support building the SDK for arm64](https://github.com/flatcar/scripts/pull/3678)
- [flatcar/scripts@abc2f81 - Support building the SDK for arm64 (commit)](https://github.com/flatcar/scripts/commit/abc2f81533c7671feb1d4cd8d345f7d22e0c98b3)
- [flatcar/scripts#3233 - Weekly portage-stable package updates 2025-09-01](https://github.com/flatcar/scripts/pull/3233)
- [flatcar/scripts#2193 - Add dev-* packages to automation](https://github.com/flatcar/scripts/pull/2193)
- [flatcar/scripts#1788 - Weekly portage-stable package updates 2024-03-25](https://github.com/flatcar/scripts/pull/1788)
- [ader1990/scripts - riscv-poc-07-jan-2025 release](https://github.com/ader1990/scripts/releases/tag/riscv-poc-07-jan-2025)
- [ader1990/scripts - branch ader1990/riscv-poc-v2](https://github.com/ader1990/scripts/tree/ader1990/riscv-poc-v2)
- [FOSDEM 2025 - Add RISC-V support to your favorite Operating System (slides)](https://archive.fosdem.org/2025/events/attachments/fosdem-2025-6036-add-risc-v-support-to-your-favorite-operating-system/slides/237950/Add_RISC-_XxibU76.pdf)
- [flatcar.org/releases - official supported architectures](https://www.flatcar.org/releases)
- [Flatcar/MAINTAINERS.md](https://github.com/flatcar/Flatcar)
- [Flatcar governance.md](https://github.com/flatcar/Flatcar)
- [riseproject.dev/members - RISE Premier and General members](https://riseproject.dev/members/)
- [riseproject.dev blog archive](https://riseproject.dev/blog)
- [riseproject.dev - RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [PyPI - flatcar-container-linux (404, package does not exist)](https://pypi.org/pypi/flatcar-container-linux/json)
- [Ubuntu packages search - flatcar (no results)](https://packages.ubuntu.com/search?keywords=Flatcar%20Container%20Linux&suite=resolute&searchon=names&section=all)
- [project-reports/glibc.md](https://github.com) (internal report, dependency deep-dive)
- [project-reports/go.md](https://github.com) (internal report, dependency deep-dive)
- [project-reports/containerd.md](https://github.com) (internal report, dependency deep-dive)
- [project-reports/runc.md](https://github.com) (internal report, dependency deep-dive)
- [project-reports/docker.md](https://github.com) (internal report, dependency deep-dive)
- [project-reports/openssl.md](https://github.com) (internal report, dependency deep-dive)
- [project-reports/libseccomp.md](https://github.com) (internal report, dependency deep-dive)
- [project-reports/lz4.md](https://github.com) (internal report, dependency deep-dive)
- [project-reports/xz.md](https://github.com) (internal report, dependency deep-dive)
- [project-reports/zstd.md](https://github.com) (internal report, dependency deep-dive)
- [project-reports/nftables.md](https://github.com) (internal report, dependency deep-dive)
