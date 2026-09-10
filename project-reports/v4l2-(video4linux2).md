---
title: V4L2 (Video4Linux2)
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" focus="v4l2-(video4linux2)" %}

# V4L2 (Video4Linux2)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for V4L2 (Video4Linux2)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

V4L2 (Video4Linux2) is the Linux kernel's video capture/output API and driver subsystem (`drivers/media/v4l2-core/`, `include/media/`, `include/uapi/linux/videodev2.h`), part of mainline `torvalds/linux`, not a standalone project with its own repository, foundation, or release cadence.

**Governance.** No separate foundation, nonprofit, or consortium exists for V4L2 or the broader Linux media subsystem; it is governed entirely under the standard Linux kernel process. As of 2026 the media subsystem documents a three-tier "multi-committers model": **Media Subsystem Maintainers** (pull-request mergers, Mauro Carvalho Chehab and Hans Verkuil), **Media Core Maintainers** (framework-area reviewers by consensus: Sakari Ailus, Laurent Pinchart, Hans Verkuil), and **Media Driver Maintainers** (individual driver owners), plus a subset of trusted contributors with direct commit rights. All patches require linux-media mailing-list review with no unresolved objections, and new drivers must pass `v4l2-compliance`/`cec-compliance` conformance testing. MAINTAINERS entry: "MEDIA INPUT INFRASTRUCTURE (V4L/DVB)", M: Mauro Carvalho Chehab, tree `git://linuxtv.org/media.git`.

**License.** Kernel code (`drivers/media/`, `include/media/`) is GPL-2.0; userspace API headers (`include/uapi/linux/videodev2.h`) are dual-licensed for userspace consumption.

**Corporate affiliation of named maintainers:** Mauro Carvalho Chehab (Huawei Hilbert Research Center, previously Red Hat and Intel Deutschland), Laurent Pinchart (founder/owner of Ideas on Board, an embedded Linux/camera consultancy; also libcamera lead architect), Sakari Ailus (Intel). Hans Verkuil's current employer could not be independently confirmed this session [NEEDS VERIFICATION]. There is no vendor sponsorship-tier program (no Gold/Silver/Bronze); corporate involvement is via employer-paid upstream maintainer time.

**Community stance on new ports/drivers:** Open, standard-process, no architecture gatekeeping found. New hardware drivers, including RISC-V SoC drivers, go through the normal linux-media review pipeline (mailing-list review, DT-binding review, `v4l2-compliance` pass, MAINTAINERS entry, merge to staging if not yet mature). No objections to RISC-V specifically were found in the sourced review discussions.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-04-13 | [PATCH v4 0/8] "Add StarFive Camera Subsystem driver" posted by Jack Zhu (StarFive Technologies) - first RISC-V-related V4L2 patch series found | [lore.kernel.org thread](https://lore.kernel.org/lkml/20230413035541.62129-1-jack.zhu@starfivetech.com/T/) (page blocked by anti-scraper protection at fetch time; existence and date confirmed via search index) |
| 2023-09-15 | [PATCH v9 0/8] reviewed by Hans Verkuil; flagged `v4l2-compliance` binary provenance, missing `-m /dev/mediaX` compliance run, "stf camss" vs "starfive-camss" naming inconsistency, "Unknown Function" compliance warning | [lkml.rescloud.iu.edu mirror](https://lkml.rescloud.iu.edu/2309.1/09256.html) |
| 2023-10-17 | [PATCH v10 0/8] converges; Verkuil's remaining concerns: a smatch dead-code warning, a missing `TODO` file (required for staging drivers), and hardcoded ISP parameters (author clarified these are init-time config, not a defect) | [lkml.iu.edu mirror](https://lkml.iu.edu/hypermail/linux/kernel/2310.2/03327.html) |
| 2023-11-16 to 2023-11-23 | Follow-up commits addressing the smatch warning and TODO file actually merged by Hans Verkuil into `drivers/staging/media/starfive/camss` (commits `bba185d`, `b7eedc7`, `e578546`, `e080f33`, `1ee1b01`, `ac7da4a`, `7ad7d7f`, `bc0e8d9`) | torvalds/linux commit history, per verification pass |
| 2024-01-21 | Driver first appears in Linux 6.8-rc1; press coverage confirms landing | [Phoronix, "StarFive RISC-V SoC's Camera Subsystem Driver Added To Linux 6.8"](https://www.phoronix.com/news/Linux-6.8-Media-Drivers) |
| 2024-03-10 | Linux 6.8 stable released, shipping the driver | [Phoronix](https://www.phoronix.com/news/Linux-6.8-Media-Drivers) |
| 2025-03-10 | go2rtc issue #1639 opened - `go build` fails on riscv64 because `internal/v4l2`/`pkg/v4l2/device` tries to compile a cgo C source (`videodev2_arch.c`) with no riscv64 arch support | [github.com/AlexxIT/go2rtc/issues/1639](https://github.com/AlexxIT/go2rtc/issues/1639) |
| 2025-03-13 | go2rtc PR #1651 opened by nakata5321, adding a pure-Go `videodev2_riscv64.go` file (ioctl constants, struct layouts) | [github.com/AlexxIT/go2rtc/pull/1651](https://github.com/AlexxIT/go2rtc/pull/1651) |
| 2025-06-01 to 2025-06-03 | Reviewer vooon (Vladimir Ermakov) notes PR #1651 alone does not build; points to two supplementary OpenWrt packaging patches (build-tag enablement + a fix for a missing `package device` declaration and gofmt formatting) needed to make it buildable | [PR #1651 comment thread](https://github.com/AlexxIT/go2rtc/pull/1651); [OpenWrt patch 0004](https://github.com/openwrt/packages/blob/ec99b0d71459c12b661f95f0b1d439bc3a814735/multimedia/go2rtc/patches/0004-v4l2-eanble-risc-v-64-support.patch); [OpenWrt patch 0005](https://github.com/openwrt/packages/blob/ec99b0d71459c12b661f95f0b1d439bc3a814735/multimedia/go2rtc/patches/0005-v4l2-fix-riscv64-build-and-go-fmt.patch) |
| 2025-09-24 | go2rtc issue #1639 closed - not by merging PR #1651, but by a separate direct commit (`47f32a5f`) that excludes riscv64 from the v4l2 build constraints, sidestepping the compile failure rather than adding riscv64 support; shipped in v1.9.10 | Verification pass against go2rtc git history |
| 2025-2026 (ongoing) | go2rtc PR #1651 remains open/unmerged as of last check | [github.com/AlexxIT/go2rtc/pull/1651](https://github.com/AlexxIT/go2rtc/pull/1651) |

**Is it fully upstream?** The V4L2 core subsystem itself required no RISC-V porting work (architecture-independent code). One real RISC-V SoC driver (StarFive JH7110 camss) is merged and upstream but remains in `drivers/staging/media/`, not graduated to `drivers/media/`. At the application layer, the most-referenced userspace consumer found in this research (go2rtc) has riscv64 explicitly disabled/stubbed rather than supported; the community PR to add real support is unmerged.

## 3. Upstream Support Tier

No formal Tier-1/Tier-2/Tier-3 platform-support policy exists for V4L2 or the Linux media subsystem; architecture support is inherited from whatever the Linux kernel generically supports for a given `ARCH=`. This was confirmed by the absence of any tier document in the sourced research.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel core (V4L2 API/ioctl dispatch) | Full, primary kernel arch | Full, primary kernel arch | Full - arch-independent C, gated only by `HAS_IOMEM` which riscv64 satisfies |
| SoC camera/ISP drivers | Numerous, mature | Numerous, mature (Broadcom/Raspberry Pi, Rockchip, STM32MP, etc.) | One: StarFive JH7110 camss, staging-only, single SoC family |
| Upstream riscv64-specific CI | N/A | N/A | Not found (see Section 7) |
| Official riscv64 release artifact | N/A (kernel source, not a per-arch "release") | N/A | Data not available: no upstream V4L2-specific release channel exists; nearest analog (`v4l-utils`) is distro-published, not upstream-published |

## 4. Technical Architecture and RISC-V-Specific Subsystems

V4L2 core contains no architecture-specific components. It is a device I/O / ioctl API layered over the kernel's generic DMA, mmap, and VFS abstractions. Confirmed by code search of `torvalds/linux`: zero hits for `riscv` under `path:drivers/media`, zero hits for `v4l2` under `path:arch/riscv`, and zero hits for `video4linux` under `path:arch/riscv`. There is no `arch/riscv/` subtree for V4L2, no `.S` assembly file, no JIT backend, and no riscv64 SIMD dispatch path anywhere in the subsystem.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| V4L2 ioctl/core dispatch | Generic C, arch-independent | Generic C, arch-independent | Generic C, arch-independent - identical code path |
| Buffer management (videobuf2, dma-buf) | Generic C | Generic C | Generic C - identical code path |
| SoC camera/ISP driver (StarFive JH7110 camss) | N/A | N/A | Hand-written driver: MIPI CSI-2, parallel-interface, raw-Bayer-to-YUV ISP pipeline, implementing V4L2 + Media Controller + V4L2-subdev APIs; validated with GStreamer 1.18.5 `v4l2src` on VisionFive2 hardware (see [driver documentation](https://www.kernel.org/doc/html/next/admin-guide/media/starfive_camss.html)) |

V4L2 is not an optimization-purpose project in the SIMD/JIT/crypto sense (see Section 13) - it is a device I/O API, not a compute kernel, so there are no ISA-extension-dependent hot paths to assess.

## 5. Build System, Cross-Compilation, and Toolchain

V4L2 has no standalone build system; it builds via the kernel's Kconfig + Kbuild (Makefile) mechanism, same as any other subsystem for any architecture. There is no CMake, no `./configure`, and no Dockerfile. Confirmed by reading `Documentation/admin-guide/media/building.rst`, which contains no RISC-V-specific guidance.

```bash
export ARCH=riscv
export CROSS_COMPILE=riscv64-linux-gnu-

make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
# or: make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- menuconfig

scripts/config -e CONFIG_MEDIA_SUPPORT
scripts/config -m CONFIG_VIDEO_DEV

make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j"$(nproc)"
sudo make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- modules_install
sudo make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- install
```

**"-D" equivalents:** Kconfig symbols, not CMake flags - `CONFIG_MEDIA_SUPPORT`, `CONFIG_VIDEO_DEV`, `CONFIG_MEDIA_CONTROLLER`, `CONFIG_MEDIA_CONTROLLER_DVB`, `CONFIG_AUTOSELECT_ANCILLARY_DRIVERS`. None are riscv64-specific.

**Toolchain minimums** (kernel-wide, per [`Documentation/process/changes.rst`](https://github.com/torvalds/linux/blob/master/Documentation/process/changes.rst)): GCC >= 8.1; Clang/LLVM >= 17.0.1 (only the latest formal LLVM release is supported; the kernel actively drops compatibility workarounds for older versions). No RISC-V-specific binutils minimum is documented; a `riscv64-linux-gnu-` cross GCC >= 8.1 or Clang >= 17 with `LLVM=1` is required in practice [NEEDS VERIFICATION - inferred, not documented fact].

**QEMU:** not addressed in the media-build documentation. QEMU's `virt` machine has no real V4L2 capture hardware; testing a V4L2 driver under QEMU riscv64 would require a virtio-video/virtio-camera paravirtual device, which no sourced kernel documentation addresses.

**Known build failures:** application-level, not kernel-level - go2rtc's `go build` on linux/riscv64 fails with `C source files not allowed when not using cgo or SWIG: videodev2_arch.c` (see Section 2, issue #1639).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Layer | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel V4L2 core/API | Full | Full | Full - no functional gap identified |
| SoC camera drivers available | Many | Many | One (StarFive JH7110 camss), staging-only |
| go2rtc userspace V4L2 consumer | Full (build tags include amd64) | Full (build tags include arm64) | **Stub** - `internal/v4l2/v4l2.go`'s build tag `!(linux && (386 \|\| arm \|\| mipsle \|\| amd64 \|\| arm64))` matches riscv64, so the empty no-op `Init()` compiles instead of the real implementation in `internal/v4l2/v4l2_linux.go`; V4L2 is silently disabled at runtime on riscv64 builds of go2rtc, not merely absent as a build error. Confirmed by direct source read of both files, cloned HEAD as of 2026-09-07. |
| v4l2-compliance conformance testing on riscv64 | Routine | Routine (e.g., StarFive camss review cycle used real hardware) | Confirmed exercised at least once, for the StarFive camss driver's mainline review (Hans Verkuil requested a build from `git://linuxtv.org/v4l-utils.git` rather than a distro-packaged binary, and a full `-m /dev/mediaX` run); no evidence of ongoing/automated riscv64 conformance testing beyond that one driver's review cycle |

**Functional gaps:** the only confirmed functional gap in this research is at the application layer (go2rtc), not in V4L2 core or in the merged StarFive kernel driver.

**Performance gaps:** Data not available: no benchmark numbers (FPS, latency, throughput, DMA/cache behavior) comparing V4L2 on riscv64 vs arm64/amd64 were found in any searched source, despite targeted searches for "V4L2 riscv64 benchmark" and "V4L2 riscv64 vs arm64 performance."

**Security hardening / NaN / floating-point semantics:** Not applicable - V4L2 is an ioctl/buffer-management API with no floating-point or NaN-sensitive code paths identified.

## 7. CI/CD Infrastructure

**No V4L2-specific riscv64 CI was found.** Sources checked and their result:

- `torvalds/linux` GitHub mirror: `https://github.com/torvalds/linux/tree/master/.github` returns **HTTP 404** - no `.github/workflows` directory exists in the kernel tree at all, for any subsystem or architecture.
- `git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git`, `git.linuxtv.org/media_tree.git` (canonical upstream V4L2/media tree), and `lore.kernel.org/linux-media` - all returned **HTTP 403 (Anubis anti-scraper protection)** on every fetch attempt across two independent research passes. These sources remain **unread**, not confirmed-empty; any claim about their CI content, positive or negative, is unverifiable rather than confirmed. An earlier pass in this research incorrectly asserted these sources "confirmed" no CI after receiving 403s - that assertion is rejected here as unsupported (a 403 is not a read).
- [kernelci.org](https://kernelci.org): confirmed general riscv64 architecture/hardware-lab support exists, but no V4L2- or media-subsystem-specific test plan was found referenced anywhere.
- go2rtc (application-level V4L2 consumer): direct fetch of `https://raw.githubusercontent.com/AlexxIT/go2rtc/master/.github/workflows/build.yml` confirms its CI build matrix (Windows amd64/386/arm64; Linux amd64/386/arm64/arm-v7/arm-v6/mipsle; macOS amd64/arm64; FreeBSD amd64/arm64; Docker linux/amd64,386,arm/v6,arm/v7,arm64/v8) contains **zero riscv64 entries**.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream V4L2-specific CI build | Data not available (no subsystem-specific CI config found for any arch; kernel testing is generic) | Data not available | Not found |
| Upstream V4L2-specific CI test execution | Data not available | Data not available | Not found |
| KernelCI general lab coverage | Yes | Yes | Yes (riscv64 labs exist) but no V4L2-specific test plan identified |
| go2rtc CI (application consumer) | Yes (in build matrix) | Yes (in build matrix) | **No** - riscv64 absent from `build.yml` matrix |
| RISE RISC-V runner usage | N/A | N/A | None found - no reference to `riseproject-dev` runners, RISE blog posts, or RISE involvement with V4L2 anywhere in riseproject.dev, its Confluence wiki, or its GitHub org |

## 8. Distribution and Release Status

V4L2 kernel core ships only as part of the mainline Linux kernel source; there is no separate "V4L2 release" or upstream riscv64 binary artifact for the subsystem itself. The closest real-world consumable artifact is the userspace tooling package `v4l-utils` (provides `libv4l2`, `v4l2-ctl`, `media-ctl`).

| Channel | Package | riscv64 status |
|---|---|---|
| Ubuntu 26.04 "resolute" | `v4l-utils` | **Confirmed present**: version 1.32.0-2ubuntu1, architecture riscv64, `universe (ports)` repository, 900.5 kB / 2,888.0 kB installed. Source: direct fetch of [packages.ubuntu.com/resolute/riscv64/v4l-utils](https://packages.ubuntu.com/resolute/riscv64/v4l-utils) |
| Debian trixie (stable) | `v4l-utils` | **Confirmed present**: version 1.30.1-1, riscv64, 763.2 kB / 2,420.0 kB. Source: [packages.debian.org/trixie/riscv64/v4l-utils](https://packages.debian.org/trixie/riscv64/v4l-utils) |
| Debian forky (testing) | `v4l-utils` | Listed for riscv64 at version 1.32.0-5, per search-index result [NEEDS VERIFICATION - not confirmed by direct page fetch] |
| Ubuntu 26.04 "resolute" | `python3-v4l2` (Python bindings for the V4L2 userspace API) | **Confirmed present**: version 0.3.5-0ubuntu1, riscv64, `universe (ports)`, 15.1 kB / 86.0 kB. Source: [packages.ubuntu.com/resolute/riscv64/python3-v4l2](https://packages.ubuntu.com/resolute/riscv64/python3-v4l2) |
| PyPI | `v4l2` (real package name; a literal "v4l2-(video4linux2)" package does not exist and its 404 is not evidence of anything) | Source-distribution-only (sdist tarballs 0.1-0.2, pure-Python ctypes wrapper); no compiled wheels for any architecture, so the riscv64-wheel question does not apply. Source: [pypi.org/pypi/v4l2/json](https://pypi.org/pypi/v4l2/json) |
| Arch Linux RISC-V | `v4l-utils` | Inconclusive - a directory-path guess against archriscv.felixc.at 404'd; this is not evidence of absence and needs a follow-up query against the correct path/API [NEEDS VERIFICATION] |

**Important caveat:** Ubuntu ships `v4l-utils` and `python3-v4l2` for riscv64 via the **"ports" (secondary architecture) lane**, not the primary/main-archive lane. Whether the Ubuntu/Debian packaging applies riscv64-specific patches to build `v4l-utils`, or builds from unmodified upstream source, was not checked in this research - patch status is **unknown** for this package.

**What a user must do to get a working binary today:** for the V4L2 kernel core, build or obtain a riscv64 Linux kernel from any standard distro kernel package or from source (no special steps needed, since V4L2 core is architecture-independent). For userspace tooling, install `v4l-utils` from Ubuntu 26.04 (resolute) universe/ports or Debian trixie/forky. For camera hardware specifically on a StarFive JH7110 board (e.g. VisionFive 2), a kernel >= 6.8 is required for the in-tree `drivers/staging/media/starfive/camss` driver.

## 9. Dependencies

### Kernel-internal (Kconfig symbols, not separate distro packages)

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| `CONFIG_I2C` | Sensor/tuner comms | Yes, arch-independent; riscv64 I2C controller drivers exist in mainline | No riscv64-specific gap found | Part of kernel | None identified |
| `CONFIG_SPI` | SPI-attached sensor comms | Yes, arch-independent | None found | Part of kernel | None |
| `CONFIG_MEDIA_CONTROLLER` | Topology/graph API | Yes | None found | Part of kernel | None |
| `CONFIG_VIDEOBUF2_CORE` / `VIDEOBUF2_V4L2` | Buffer-queue management (mmap/USERPTR/DMABUF) | Yes | None found | Part of kernel | None |
| `CONFIG_DMA_SHARED_BUFFER` (dma-buf) | Zero-copy buffer export/import | Yes, arch-independent | None found | Part of kernel | None |
| `REGMAP_I2C` | Register-access abstraction | Yes | None found | Part of kernel | None |
| `HAS_IOMEM` | Gates whether `MEDIA_SUPPORT` is even offered | riscv64 satisfies this | N/A | N/A | None |

### Userspace / ecosystem (separate distro binary packages)

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| `v4l-utils` / `libv4l` | Userspace tooling (`v4l2-ctl`, `media-ctl`) and `libv4lconvert` wrapper | Ubuntu 26.04 resolute (universe/ports), Debian trixie present | No dedicated upstream riscv64 CI found [NEEDS VERIFICATION] | Ubuntu/Debian ship riscv64 binaries | Patch status unknown |
| `udev` (systemd) | Creates `/dev/videoN` nodes, hotplug events | Ubuntu 26.04 resolute (ports) - `libudev-dev` 259.5-0ubuntu3 | Not verified | Ubuntu Ports riscv64 | Ports-lane (secondary architecture) |
| GStreamer (`gstreamer1.0-plugins-good`, `v4l2src`/`v4l2sink`) | Primary consumer framework | Ubuntu 26.04 resolute (ports) - 1.28.2-2 | ORC SIMD layer got a riscv64 backend (ORC 0.4.42, merged Jan 2026); runtime RVV-detection MR !11768 and ABI-test MR !11773 unmerged as of 2026-06-17; core framework portable C | Debian/Ubuntu ship riscv64 | See `project-reports/gstreamer.md` |
| FFmpeg (`libavdevice` v4l2 input/output) | Primary consumer CLI/framework | Ubuntu 26.04 resolute - 7:8.0.1-3ubuntu2 | 3 dedicated FATE riscv64 CI runners (rv64gc-clang, rv64gc-gcc, rv64gcvb/RVA22+V-gcc), 5531-5532/5532 tests passing | Ubuntu ships riscv64; continuously maintained since Sept 2022 | Single volunteer maintainer (Remi Denis-Courmont), bus-factor risk. See `project-reports/ffmpeg.md` |
| `libdrm` | DMA-BUF interop for zero-copy capture-to-render (optional) | Ubuntu 26.04 resolute - 2.4.131-1 | Not verified | Ubuntu ships riscv64 | Optional path only |
| `linux-libc-dev` (kernel UAPI headers) | Build-time dependency (`linux/videodev2.h`) | Ubuntu 26.04 resolute (ports) - 7.0.0-14.14 | n/a (headers only) | Ubuntu Ports riscv64 | None |

**Summary:** V4L2 kernel core pulls in no dependency with a riscv64 gap - every Kconfig dependency is architecture-independent and gated only by `HAS_IOMEM`. The userspace ecosystem around V4L2 is fully present in Ubuntu 26.04 (resolute) for riscv64, though several (udev, GStreamer, kernel headers, v4l-utils) ship through Ubuntu's secondary "ports" build lane. FFmpeg is the strongest link in the consumer ecosystem, with dedicated upstream riscv64 CI and a near-100% pass rate. `v4l-utils`, udev, and libdrm rest on Ubuntu package presence alone (not a verified upstream/graph source) and are flagged [NEEDS VERIFICATION].

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [go2rtc #1639](https://github.com/AlexxIT/go2rtc/issues/1639) | "Fix support linux + riscv64" | Closed (2025-09-24) | Medium (blocks V4L2 use in this consumer on riscv64) | Closed via a workaround commit (`47f32a5f`) that **excludes** riscv64 from the build rather than adding support; not the same as the community fix in PR #1651 |
| [go2rtc #1651](https://github.com/AlexxIT/go2rtc/pull/1651) | "add riscv64 platform for v4l2 package" | Open, unmerged | Medium | Adds `videodev2_riscv64.go`; reviewer (vooon) confirmed the PR alone does not build without two further OpenWrt patches (build-tag enablement, missing `package device` declaration/gofmt fix); no maintainer plan to merge found |
| StarFive camss smatch warning (v10 review) | Unsigned index check "never less than zero" (dead code) | Resolved prior to merge | Low | Addressed in the follow-up commits that actually landed in Linux 6.8 |
| StarFive camss "Unknown Function" v4l2-compliance warning (v9 review) | Compliance-tool output ambiguity on `stf_isp` subdevice | Resolved/clarified prior to merge | Low | Raised by Hans Verkuil during v9 review |
| VisionFive2 known issue (non-numbered) | "Audio playback noise when using the imx219 sensor with simultaneous audio playback"; error messages with the OV4689 sensor over MIPI-CSI/V4L2 | Open, no discrete issue number located | Low-Medium | SoC/driver-specific, not a V4L2-core bug; source: VisionFive2 GitHub release notes [NEEDS VERIFICATION - no issue tracker link found] |

**Correctness bugs:** none confirmed specific to V4L2-on-riscv64 beyond the items above. Targeted searches for "V4L2 riscv64 bug," "performance issue," and year-scoped queries (2024/2025/2026) returned no RISC-V-specific results; results redirected consistently to ARM (Raspberry Pi, Jetson, Rockchip, STM32MP) V4L2 issues instead.

**Benchmarks:** Data not available - no FPS/latency/throughput/DMA-cache benchmark numbers for V4L2 on riscv64 were found in any searched source.

## 12. Objections and Upstream Blockers

**Kernel/driver layer:** no objections to RISC-V specifically were found. Hans Verkuil's review comments on the StarFive camss series (compliance test provenance, naming consistency, a smatch warning, a missing TODO file) are standard staging-driver acceptance criteria applied uniformly across architectures, not RISC-V-specific gatekeeping. The series converged and merged in Linux 6.8.

**Application layer (go2rtc):** the blocker is organizational, not technical. The technical fix (riscv64 ioctl/struct definitions plus two supplementary patches) has already been proven to work downstream in OpenWrt's packaging of go2rtc, but has not been merged upstream. The maintainer (AlexxIT) instead resolved the reported build failure by excluding riscv64 from the build entirely (commit `47f32a5f`, closing issue #1639), while the community PR (#1651) adding actual riscv64 support remains open and unmerged with no indication of a merge plan. This is the most concrete blocker identified in this research: **an available, working fix exists (validated in OpenWrt) and is not merged**.

**Acceptance probability:** for the kernel layer, no blocker exists; new RISC-V SoC camera drivers follow the normal, non-discriminatory linux-media review process. For the go2rtc application layer, acceptance depends on a maintainer decision that has already gone the other way once (excluding riscv64 rather than adding support); [NEEDS VERIFICATION] whether this reflects an active policy stance or simple prioritization backlog.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro (Ubuntu/Debian)
- **Optimization gap:** N/A - V4L2 is a device I/O/ioctl API, not a compute kernel; it has no primary hot paths whose value proposition depends on architecture-specific optimization (SIMD, JIT, crypto), so the Step 2 optimization-purpose modifier does not apply.
- **Justification:** No upstream riscv64 CI was found for V4L2 despite extensive research: `torvalds/linux` carries no `.github/workflows` directory at all ([confirmed 404](https://github.com/torvalds/linux/tree/master/.github)), the canonical `git.linuxtv.org/media_tree.git` and `lore.kernel.org/linux-media` sources could not be read (403, Anubis anti-scraper protection, on every attempt), and [kernelci.org](https://kernelci.org) has general riscv64 lab coverage but no V4L2/media-specific test plan identified. With no upstream CI signal, the distribution floor applies: Ubuntu 26.04 "resolute" and Debian trixie ship `v4l-utils` (the real-world V4L2 userspace release artifact) for riscv64 (confirmed via direct fetch of [packages.ubuntu.com/resolute/riscv64/v4l-utils](https://packages.ubuntu.com/resolute/riscv64/v4l-utils) and [packages.debian.org/trixie/riscv64/v4l-utils](https://packages.debian.org/trixie/riscv64/v4l-utils)), but whether that packaging applies riscv64-specific patches or builds unmodified upstream source was not checked in this research - per the color model's distribution-floor rule, unknown patch status caps the grade at orange (`downstream-only`), not yellow.
- **Pending work that could change the grade:** (1) confirming whether Ubuntu/Debian's `v4l-utils` packaging is patched or clean would potentially move the grade to yellow (`clean-distro-build`) if unpatched; (2) merging go2rtc PR #1651 (plus the two OpenWrt supplementary patches already proven to work downstream) would close the strongest confirmed application-layer gap, though this affects only one consumer project, not V4L2 itself; (3) no RISE involvement with V4L2 was found anywhere (blog, wheel builder, GitHub org, Confluence wiki), so no RISE-funded work is currently in flight that would change this grade.

## 14. Investment Analysis

RISE has no confirmed involvement with V4L2 (no blog posts, no wheel-builder entry - not applicable, V4L2 is not a Python package - no RISC-V runner usage found in this research), so no prior RISE-funded work needs to be excluded from sizing below.

### 14.1 Functional Enablement

- Confirm and, if needed, complete the patch chain to add real riscv64 support to go2rtc's `internal/v4l2`/`pkg/v4l2/device` package: merge or rebase [PR #1651](https://github.com/AlexxIT/go2rtc/pull/1651) plus the two supplementary OpenWrt patches ([0004](https://github.com/openwrt/packages/blob/ec99b0d71459c12b661f95f0b1d439bc3a814735/multimedia/go2rtc/patches/0004-v4l2-eanble-risc-v-64-support.patch), [0005](https://github.com/openwrt/packages/blob/ec99b0d71459c12b661f95f0b1d439bc3a814735/multimedia/go2rtc/patches/0005-v4l2-fix-riscv64-build-and-go-fmt.patch)) that a third party already validated downstream in OpenWrt's packaging.
- Verify patch status of the Ubuntu/Debian `v4l-utils` riscv64 package (check `.debian/` packaging diffs) to establish whether the distribution floor should sit at yellow instead of orange.
- No functional gap exists in V4L2 kernel core itself; no enablement work is needed there.

### 14.2 Performance Optimization

Not applicable in the SIMD/JIT sense - V4L2 core has no ISA-specific hot paths (see Section 4 and Section 13). No benchmark data exists to establish whether a performance gap exists at all (Section 11); producing a first riscv64-vs-arm64 V4L2 benchmark would be a prerequisite to any optimization work, not optimization work itself.

### 14.3 CI/CD Infrastructure

- No V4L2-specific riscv64 CI exists anywhere identified. Establishing one would likely mean adding a riscv64 lab/board target to KernelCI's media test plans (KernelCI already has general riscv64 lab infrastructure) rather than building new CI infrastructure from scratch.
- Add riscv64 to go2rtc's [`build.yml`](https://raw.githubusercontent.com/AlexxIT/go2rtc/master/.github/workflows/build.yml) CI matrix once functional support (14.1) lands, so regressions are caught automatically.

### 14.4 Ecosystem Enablement

Not applicable as a standalone section per the reporting rule (V4L2 is a kernel API/subsystem, not a project with a large dependent package ecosystem in the PyPI/npm/Maven sense); relevant consumer-project work (GStreamer, FFmpeg, go2rtc) is captured in Sections 9 and 14.1.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Merge/rebase go2rtc PR #1651 + OpenWrt supplementary patches for riscv64 support | 1-2 | go2rtc maintainer / external contributor | Medium |
| Functional | Verify Ubuntu/Debian `v4l-utils` riscv64 packaging patch status | <1 | Distro packaging team | Low |
| CI/CD | Add riscv64 job to go2rtc's GitHub Actions build matrix | <1 | go2rtc maintainer | Low |
| CI/CD | Investigate adding V4L2/media test coverage to KernelCI's existing riscv64 lab infrastructure | 2-4 (exploratory) | KernelCI / linux-media community | Low |
| Performance | Produce a first riscv64-vs-arm64/amd64 V4L2 benchmark (no data currently exists) | 1-2 | Any contributor with riscv64 capture hardware | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [go2rtc issue #1639 - "Fix support linux + riscv64"](https://github.com/AlexxIT/go2rtc/issues/1639)
- [go2rtc PR #1651 - "add riscv64 platform for v4l2 package"](https://github.com/AlexxIT/go2rtc/pull/1651)
- [OpenWrt packages patch 0004 - "v4l2: eanble risc-v 64 support"](https://github.com/openwrt/packages/blob/ec99b0d71459c12b661f95f0b1d439bc3a814735/multimedia/go2rtc/patches/0004-v4l2-eanble-risc-v-64-support.patch)
- [OpenWrt packages patch 0005 - "v4l2: fix riscv64 build and go fmt"](https://github.com/openwrt/packages/blob/ec99b0d71459c12b661f95f0b1d439bc3a814735/multimedia/go2rtc/patches/0005-v4l2-fix-riscv64-build-and-go-fmt.patch)
- [go2rtc CI workflow file (build.yml)](https://raw.githubusercontent.com/AlexxIT/go2rtc/master/.github/workflows/build.yml)
- [LKML - PATCH v4 0/8 "Add StarFive Camera Subsystem driver"](https://lore.kernel.org/lkml/20230413035541.62129-1-jack.zhu@starfivetech.com/T/)
- [LKML mirror - PATCH v9 0/8 "Add StarFive Camera Subsystem driver"](https://lkml.rescloud.iu.edu/2309.1/09256.html)
- [LKML mirror - PATCH v10 0/8 "Add StarFive Camera Subsystem driver"](https://lkml.iu.edu/hypermail/linux/kernel/2310.2/03327.html)
- [Phoronix - "StarFive RISC-V SoC's Camera Subsystem Driver Added To Linux 6.8"](https://www.phoronix.com/news/Linux-6.8-Media-Drivers)
- [RISC-V International ecosystem news - StarFive camera subsystem driver](https://riscv.org/ecosystem-news/2024/01/starfive-risc-v-socs-camera-subsystem-driver-added-to-linux-6-8/)
- [Kernel documentation - StarFive Camera Subsystem driver](https://www.kernel.org/doc/html/next/admin-guide/media/starfive_camss.html)
- [torvalds/linux .github directory (404 - no CI config exists)](https://github.com/torvalds/linux/tree/master/.github)
- [KernelCI](https://kernelci.org)
- [Kernel documentation - Documentation/admin-guide/media/building.rst](https://github.com/torvalds/linux/blob/master/Documentation/admin-guide/media/building.rst)
- [Kernel documentation - Documentation/process/changes.rst](https://github.com/torvalds/linux/blob/master/Documentation/process/changes.rst)
- [Ubuntu 26.04 resolute - v4l-utils riscv64 package](https://packages.ubuntu.com/resolute/riscv64/v4l-utils)
- [Debian trixie - v4l-utils riscv64 package](https://packages.debian.org/trixie/riscv64/v4l-utils)
- [Ubuntu 26.04 resolute - python3-v4l2 riscv64 package](https://packages.ubuntu.com/resolute/riscv64/python3-v4l2)
- [PyPI - v4l2 package JSON API](https://pypi.org/pypi/v4l2/json)
- [RISE Project - member list](https://riseproject.dev/members/)
- [RISE Project - blog](https://riseproject.dev/blog)
- [RISE Project - Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 resolute - GStreamer riscv64 package](https://packages.ubuntu.com/resolute/riscv64/gstreamer1.0-plugins-good) [general search result, not directly fetched this session]
- `project-reports/gstreamer.md` (internal report, referenced in dependency findings)
- `project-reports/ffmpeg.md` (internal report, referenced in dependency findings)