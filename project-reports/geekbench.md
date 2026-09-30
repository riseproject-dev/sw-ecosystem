---
title: Geekbench
parent: Project Reports
color: yellow
dependencies:
  - name: zlib
    relation: runtime-dependency
    criticality: critical
  - name: LZ4
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: critical
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: SQLite
    relation: runtime-dependency
    criticality: critical
  - name: libjpeg-turbo
    relation: runtime-dependency
    criticality: critical
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: FreeType
    relation: runtime-dependency
    criticality: optional
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: LLVM
    relation: runtime-dependency
    criticality: critical
  - name: Lua
    relation: runtime-dependency
    criticality: optional
  - name: Python
    relation: runtime-dependency
    criticality: critical
  - name: draco
    relation: runtime-dependency
    criticality: optional
  - name: astc-encoder
    relation: runtime-dependency
    criticality: optional
  - name: LiteRT
    relation: runtime-dependency
    criticality: critical
  - name: XNNPACK
    relation: runtime-dependency
    criticality: critical
  - name: OpenCV
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: Intel Embree
    relation: runtime-dependency
    criticality: critical
  - name: PDFium
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="geekbench" %}

# Geekbench

**Author:** Ludovic HENRY <mail@ludovic.dev><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Geekbench<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Geekbench is a proprietary, closed-source, cross-platform CPU benchmark developed and distributed by Primate Labs Inc., a privately held Canadian company. Governance is entirely single-vendor: there is no open-source license, no foundation, no steering committee, and no community contribution path. All platform-support decisions, including whether and how to support RISC-V, are made unilaterally by Primate Labs. There is no MAINTAINERS file, no tiered-platform policy, and no public RFC or port-acceptance process, because there is no public repository for any of that to live in.

The freemium model requires users who run the benchmark for free to upload results to [browser.geekbench.com](https://browser.geekbench.com/). A Pro license permits offline use and standalone result storage on most platforms.

Primate Labs is not a member of the RISE Project (riseproject.dev). Confirmed against the current RISE member list: Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General Members (Akeana, Andes, ESWIN, ISCAS, Canonical, Douyin Vision, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) do not include Primate Labs. No RISE blog post mentions Geekbench in any context; 9 posts specifically identified (2024-05-15 through 2026-07-30) and a broader 28-post check both returned zero mentions. Primate Labs is not listed as a RISC-V International member and no announcement to that effect was found.

The two repositories under the [primatelabs](https://github.com/primatelabs) GitHub organization are auxiliary tooling only: [geekbench-tools](https://github.com/primatelabs/geekbench-tools) (Python/Ruby scripts for parsing legacy Geekbench 2/3/4 XML result files) and [geekbench-swift](https://github.com/primatelabs/geekbench-swift) (Swift reference implementations of Geekbench workloads, pure scalar, no SIMD for any architecture). Neither contains RISC-V-specific code, nor any RISC-V-related issues or pull requests, nor any `.github/workflows` files. The benchmark engine itself is closed source and not public anywhere. The URL `https://github.com/primaeval/geekbench`, sometimes cited as a possible source repo, returns HTTP 404; `primaeval` is an unrelated GitHub user with 126 unrelated public repositories (Kodi addons).

Because Geekbench has no public issue tracker, the only public record of RISC-V work is Primate Labs' own release-note changelog entries and threads on the Primate Labs community support forum (support.primatelabs.com, formerly primatelabs.tenderapp.com).

## 2. Port History and Upstreaming Timeline

All RISC-V support is delivered through proprietary binary releases. There is no open-source patch history, no upstream PR against Geekbench's own code, and no public commit to inspect. The table below is built from Primate Labs' own changelog entries (the closest available equivalent to a tracking record), cross-checked against direct HTTP probes of the CDN tarballs.

| Date | Event | Source |
|---|---|---|
| March 2021 [NEEDS VERIFICATION -- single source] | Geekbench 5.4 released; first RISC-V64 (Linux) support introduced | Community RISC-V benchmark submissions |
| 2023-09-12 | Geekbench 6.2.0 released: "Introduce support for RISC-V." First GB6 `LinuxRISCVPreview` tarball, Linux-only, no Pro-license support | [Primate Labs release notes](https://www.primatelabs.com/release/geekbench6/); CDN probe [Geekbench-6.2.0-LinuxRISCVPreview.tar.gz](https://cdn.geekbench.com/Geekbench-6.2.0-LinuxRISCVPreview.tar.gz), HTTP 200, 194,584,006 bytes, Last-Modified matches exactly |
| 2025-01-28 | Geekbench 6.4.0 released: "Introduce support for RISC-V Vector Extensions." Adds RVV support for SIMD-heavy workloads; also improves Linux ARM/RISC-V CPU-topology detection | [Primate Labs release notes](https://www.primatelabs.com/release/geekbench6/); [AppleInsider coverage](https://appleinsider.com/articles/25/01/28/new-geekbench-update-adds-risc-v-and-improves-arm-extension-support); CDN probe [Geekbench-6.4.0-LinuxRISCVPreview.tar.gz](https://cdn.geekbench.com/Geekbench-6.4.0-LinuxRISCVPreview.tar.gz), HTTP 200, 224,159,886 bytes, Last-Modified matches exactly |
| 2026-04-07 | Geekbench 6.7.0 released: "Improve CPU identification on Linux/RISC-V" (reports actual CPU name instead of raw ISA string). RISC-V Linux build remains labeled "preview" | [Primate Labs release notes](https://www.primatelabs.com/release/geekbench6/); CDN probe [Geekbench-6.7.0-LinuxRISCVPreview.tar.gz](https://cdn.geekbench.com/Geekbench-6.7.0-LinuxRISCVPreview.tar.gz), HTTP 200, 224,570,490 bytes |
| 2026-06-08 | [NixOS/nixpkgs #523562](https://github.com/nixos/nixpkgs/pull/523562) merged: "geekbench_6: 6.4.0->6.7.1, move to by-name, support riscv64" -- third-party packaging of the unmodified upstream binary for riscv64-linux | NixOS/nixpkgs PR page (fetched and confirmed merged) |
| 2026-07-03 | [NixOS/nixpkgs #530806](https://github.com/nixos/nixpkgs/pull/530806) merged: backport of #523562 to nixpkgs release-26.05 | NixOS/nixpkgs PR page (fetched and confirmed merged) |

A GB6.1.0 CDN probe returned HTTP 404 for the RISC-V path, confirming riscv64 support was genuinely absent before 6.2.0 rather than a CDN gap.

No external contributor, individual or corporate, has been identified as author of the RISC-V port; all development is internal to Primate Labs. "Upstreaming" in the open-source sense does not apply -- Geekbench has no upstream other than Primate Labs itself. The only genuine third-party "PR" artifacts found anywhere connected to "Geekbench riscv64" are the two nixpkgs packaging PRs above, which package the vendor binary rather than modify Geekbench's own code.

## 3. Upstream Support Tier

Primate Labs has not published a formal platform-support tier policy. The "Preview" label applied to non-x86-64 Linux builds is the only tier signal available, and Primate Labs staff have confirmed in a support-forum reply (2025-07-06) that the Linux/RISC-V build ships "without support, including no Pro-license support," and that offline/air-gapped use on RISC-V requires negotiating a Corporate License directly.

The "Preview" label appears to be a durable convention rather than a stepping-stone to a full-tier release: ARM64 Linux has shipped as `LinuxARMPreview` in every Geekbench 6 release with no promotion to a non-preview name [NEEDS VERIFICATION -- inferred from CDN filename pattern, not a published Primate Labs statement], and riscv64 has followed the identical pattern for three years (Sept 2023 to Apr 2026) across three tracked releases without change in tier.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tarball label | `Linux` | `LinuxARMPreview` | `LinuxRISCVPreview` |
| First GB6 availability | GB6.0 (Feb 2023) | GB6.0 (Feb 2023) | GB6.2.0 (Sep 2023) |
| Latest confirmed version | 6.7.x | 6.7.x [NEEDS VERIFICATION] | 6.7.0 (confirmed Apr 2026) |
| Official release binary | Yes | Yes (Preview label) | Yes (Preview label) |
| Pro-license / offline support | Yes | [NEEDS VERIFICATION] | No, confirmed by Primate Labs staff, Jul 2025 |
| Package manager distribution | None from Primate Labs | None from Primate Labs | None from Primate Labs; unofficial NixOS packaging only |
| Result-browser upload supported | Yes | Yes | Yes, confirmed via community runs across multiple boards |
| Explicit vector-extension support | AVX2/AVX-512 (assumed, source closed) | NEON/SVE (assumed, source closed) | RVV, added GB6.4.0 (Jan 2025), per official announcement |
| CI test-execution evidence (any kind) | None discoverable (closed source) | None discoverable (closed source) | None discoverable (closed source) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Geekbench's benchmark engine is closed source. No public repository exposes its SIMD kernels, JIT compiler, or assembly routines, and this is true for amd64 and arm64 as much as for riscv64 -- there is no asymmetry in transparency, only in maturity of support. The following is derived from what can be inferred from binary availability, official release notes, and the open-source `geekbench-swift` reference implementation (which is explicitly a pure-Swift educational port with no SIMD intrinsics for any architecture and is not representative of the production binary).

**Workload categories in Geekbench 6:** CPU integer workloads (File Compression via zlib/zstd/lzma, Navigation, HTML5 Browser, SQLite, PDF Renderer, Text Processing, Asset Compression, Object Detection, Background Blur, Portrait Mode, Horizon Detection, Object Removal, HDR); CPU floating-point workloads (FFT, Ray Tracer, Structure from Motion, Machine Learning subtests, Clang compilation, Camera); a separate GPU compute suite (not relevant to CPU riscv64 status).

| Subsystem | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD/vector acceleration | Present (AVX2/AVX-512 assumed, source closed) | Present (NEON/SVE assumed, source closed) | Present since GB6.4.0 (RVV, per official changelog); level of tuning unconfirmable, source closed |
| JIT compiler | Not applicable (compiled benchmark) | Not applicable | Not applicable |
| Crypto acceleration | OpenSSL with hardware AES (assumed) | OpenSSL with hardware AES (assumed) | OpenSSL; no hardware AES observed on any tested RISC-V board |
| Architecture-specific assembly | Unknown, source closed | Unknown, source closed | Unknown, source closed |
| RISC-V ISA extensions used | N/A | N/A | RVV stated in GB6.4.0 changelog; no further ISA-extension detail (Zvfh, Zbb, etc.) published |
| Open-source architecture code | None (closed) | None (closed) | None (closed) |

**Architecture-code-completeness verdict (best obtainable without source access):** the riscv64 backend is real and evolving, not a token or stub implementation -- two distinct feature-level changelog entries over 16 months (initial bring-up 6.2.0, then dedicated RVV support 6.4.0) plus a later CPU-identification fix (6.7.0) represent genuine, multi-release engineering investment. It is nonetheless second-tier relative to x86/ARM: still preview-only and still without Pro-license support three years after initial bring-up, with only one SIMD-specific feature announcement (RVV) and nothing further in three subsequent tracked releases. Best classification: partial, intrinsics-or-equivalent-level vector support, not confirmable at the assembly-vs-intrinsics level because the source is closed.

**Observed benchmark performance on riscv64 hardware** (public GB6 runs uploaded to browser.geekbench.com):

| Device | SoC | Cores | Clock | GB6 Single-Core | GB6 Multi-Core | Date |
|---|---|---|---|---|---|---|
| StarFive VisionFive 2 | StarFive JH7110 | 4 | 1.5 GHz | 74 | 218 | Jan 2023 |
| Milk-V Mars CM | StarFive JH7110 | 4 | 1.5 GHz | 74 | 219 | Oct 2023 |
| Milk-V Mars | StarFive JH7110 | 4 | 1.5 GHz | 74 | 218 | Jul 2024 |
| Milk-V Jupiter | SpacemiT X60 | 8 | 1.8 GHz | 78 | 356 | Jul 2024 |
| HiFive Premier P550 | SiFive P550 | 4 | 1.4 GHz | 136 | 424 | 2024 |
| Banana Pi BPI-F3 | SpacemiT K1 | 8 | 2.0 GHz | ~128-131 | ~534-569 | 2024-25 |
| DC-ROMA AI PC Mainboard II | SiFive P550 | 8 | 1.8 GHz | 174 | 640 | Oct 2025 |
| SpacemiT K3 (Pico-ITX, GB7 Preview) | SpacemiT K3 | 16 physical | -- | 363 | 2,019 (only 8 of 16 cores scaled; kernel affinity-mask bug) | -- |
| Sophgo Mango (best RISC-V observed, third-party) | -- | -- | -- | ~147 | ~1,300 | 2024 |

Sources: [geerlingguy/sbc-reviews #10](https://github.com/geerlingguy/sbc-reviews/issues/10), [#22](https://github.com/geerlingguy/sbc-reviews/issues/22), [#46](https://github.com/geerlingguy/sbc-reviews/issues/46), [#47](https://github.com/geerlingguy/sbc-reviews/issues/47), [#65](https://github.com/geerlingguy/sbc-reviews/issues/65), [#82](https://github.com/geerlingguy/sbc-reviews/issues/82); [SpacemiT K3 review](https://tinycomputers.io/posts/spacemit-k3-pico-itx-review.html); [ben3d.ca "RISC-V in 2024 Is Slow"](https://ben3d.ca/blog/risc-v-in-2024-is-slow).

For comparison: a Raspberry Pi 4 (Cortex-A72, 2019) scores approximately SC=300, MC=800; Raspberry Pi 5 (ARM) approximately SC=1,000, MC=2,200; Apple M4-series approximately SC=3,800, MC=15,000. The ben3d.ca analysis concluded the fastest RISC-V CPU it found is roughly 25x slower single-core than top Apple silicon and roughly 7x slower than a Raspberry Pi 5; this specific "25x" framing was disputed on Hacker News by a commenter who noted Geekbench (pre-6.4) lacked RVV/bitmanip-aware code paths and that on the more ISA-neutral Clang-compile subtest a SiFive P550 outperforms a Cortex-A72 -- a genuine discrepancy between sources, both retained here. A cnx-software reviewer covering the Milk-V Jupiter (GB6.3.0, Aug 2024) explicitly stated scores "can't be used to compare the performance against other systems due to the current software situation," i.e., unoptimized compiler paths and missing SIMD acceleration systematically deflate RISC-V scores relative to hardware capability. SiFive's claim (May 2026) that the P570 Gen 3 achieves greater than 2x Geekbench score-per-GHz over the P550 Gen 1 remains [NEEDS VERIFICATION -- source blocked HTTP 403].

## 5. Build System, Cross-Compilation, and Toolchain

This documentation does not exist because Geekbench is closed-source, precompiled software distributed only as vendor binaries. There is no cmake/configure build system, no documented toolchain-version requirement, no `-DUSE_X=OFF`-style flags, and no Dockerfile for riscv64 (or for any architecture) to report. End users never compile Geekbench; they download a precompiled binary. Direct fetches of `www.geekbench.com` and `www.geekbench.com/preview/` both returned HTTP 403 (bot/WAF protection), consistent across every attempt made during this research.

The two open-source Primate Labs repositories are irrelevant to the production binary: `geekbench-swift` uses Swift Package Manager and `geekbench-tools` is Python/Ruby scripting for legacy result-file parsing.

Downstream, non-Primate-Labs packaging confirms the binary-only nature of distribution: the Gentoo ebuild for `app-benchmarks/geekbench` points its `SRC_URI` straight at the CDN tarball and invokes no `cmake`/`configure`/`make` step. [bobolopolis/meta-geekbench](https://github.com/bobolopolis/meta-geekbench) is an MIT-licensed Yocto/OpenEmbedded layer that fetches and repackages the prebuilt riscv64/aarch64/x86_64 CDN tarballs for embedded Linux targets; it does not build from source [NEEDS VERIFICATION -- single source]. The two NixOS/nixpkgs PRs (#523562, #530806) likewise package the vendor binary rather than compile it. No official Primate Labs Dockerfile exists; third-party wrapper images (`chrisdaish/docker-geekbench`, `e7db/docker-geekbench`, etc.) only `wget`/`curl` the tarball into a container. QEMU usage observed in the wild is limited to running the precompiled riscv64 binary inside a `riscv-virtio,qemu` guest to emulate the OS, not a cross-build toolchain step.

Data not available: internal build toolchain, minimum compiler version, or any build-failure history, since none of this is public.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| Binary available | Yes | Yes | Yes (CDN tarball, confirmed through GB6.7.0) | None |
| Result upload to browser.geekbench.com | Yes | Yes | Yes, confirmed via community runs | None |
| ML workloads (LiteRT-backed) | Functional | Functional | Non-functional / no RISC-V build support | Critical |
| ML workloads (XNNPACK-backed) | Functional | Functional | Partially functional; f32 paths work, FP16/Zvfh paths fail in CI | Medium |
| Image processing (OpenCV DNN) | Functional | Functional | Broken: RVV DNN engine regression, Apr 2025, unresolved | Medium |
| CPU integer workloads | Optimized | Optimized | Functional; optimization level unconfirmed | Low |
| CPU float workloads | Optimized | Optimized | Functional since GB6.4.0 RVV support; tuning level unconfirmed | Low |
| JPEG acceleration | libjpeg-turbo SIMD | libjpeg-turbo SIMD | Scalar in shipped distro versions; RVV merged to dev branch, not yet in a stable release | Low |
| File compression (zstd) | Optimized | Optimized | Partial RVV; several optimization PRs unreviewed for months | Low |
| AES workload | Hardware AES | Hardware AES | Software AES; no hardware AES observed on tested boards | Low |
| Pro license / offline mode | Yes | [NEEDS VERIFICATION] | No, confirmed absent by Primate Labs staff, Jul 2025 | Medium (usability, not correctness) |
| Package manager install | None (vendor site only) | None (vendor site only) | None from Primate Labs; unofficial NixOS packaging only | Parity with amd64/arm64 |

**ML workload severity detail:** Geekbench 6's Object Detection, Background Blur, Speech Recognition, Portrait Mode, and Horizon Detection workloads are implemented via [LiteRT](https://github.com/google-ai-edge/LiteRT) (formerly TFLite). LiteRT has zero RISC-V entries in any CMakeLists, BUILD file, or CI configuration; its riscv64 build documentation page returns HTTP 404; a community build attempt ([issue #37](https://github.com/google-ai-edge/LiteRT/issues/37)) failed with XNNPACK disabled on RISC-V, and no roadmap exists. These workloads are estimated at roughly 30-40% of total Geekbench 6 score weight [NEEDS VERIFICATION -- estimate from research synthesis, not a published Primate Labs scoring document]. This is a caveat on score accuracy rather than a factor applied to Geekbench's own readiness grade, since Geekbench's product is the measurement tool, not the ML runtime itself.

**Performance gap:** Data not available for an exact scalar-vs-SIMD delta per workload; the general pattern from community submissions (JH7110 SC=74 vs Cortex-A72 SC=300, a roughly 3-4x single-core gap) reflects a combination of lower IPC and clock speed on current RISC-V silicon plus incomplete SIMD acceleration in the dependency stack, not a single isolable cause.

## 7. CI/CD Infrastructure

No CI pipeline for Geekbench's own engine exists in any publicly accessible location, for any architecture, because the source is closed. This was directly re-verified: a fetch of `www.geekbench.com` returned HTTP 403 with zero bytes of content (no `.github/workflows`, `.gitlab-ci.yml`, `Jenkinsfile`, or buildbot config could be read because nothing was returned), and a targeted search for "Geekbench riscv64 CI config file github.com OR gitlab.com OR buildbot" returned zero Geekbench-specific hits -- every match was unrelated infrastructure for other projects. `primatelabs/geekbench-tools` and `primatelabs/geekbench-swift` both have zero `.github/workflows` files and no RISC-V code.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Public CI exists | No (closed source) | No (closed source) | No (closed source) |
| RISE runners used | No | No | No |
| Open CI YAML inspectable | No | No | No |
| Hardware runner type | Unknown | Unknown | Unknown |

Any riscv64 CI relevant to the Geekbench ecosystem exists only in Geekbench's third-party dependencies (e.g., XNNPACK's `cmake-linux-riscv64` job, zstd's QEMU-based riscv64 CI), never in Geekbench itself. The correct, fully substantiated statement is: Geekbench ships a riscv64 preview binary; no CI/CD configuration file of any kind for Geekbench, riscv64 or otherwise, has been found or read, and the project's closed-source nature means none is publicly discoverable.

## 8. Distribution and Release Status

Geekbench is distributed exclusively as proprietary binary tarballs directly from Primate Labs' own CDN. No package manager from Primate Labs distributes it.

URL pattern: `https://cdn.geekbench.com/Geekbench-<version>-LinuxRISCVPreview.tar.gz`

Confirmed via direct HTTP HEAD checks (with a negative-filename control to rule out a soft-404/catch-all server; the control and a near-miss filename both correctly returned 404/153 bytes):

| Version | HTTP status | Content-Length | Last-Modified |
|---|---|---|---|
| 6.1.0 | 404 Not Found | -- | -- (confirms genuine absence before 6.2.0) |
| 6.2.0 | 200 OK | 194,584,006 B | 2023-09-12 |
| 6.4.0 | 200 OK | 224,159,886 B | 2025-01-28 |
| 6.7.0 | 200 OK | 224,570,490 B | 2026-04-07 |

**Package manager status:**

| Channel | Status |
|---|---|
| PyPI | Not available; `pypi.org/pypi/geekbench/json` returns HTTP 404, no package named `geekbench` exists for any architecture |
| RISE Python wheel builder | Not applicable/not available; redirects to the same nonexistent PyPI project |
| Debian | Not packaged |
| Ubuntu 26.04 ("resolute") | Not available; `packages.ubuntu.com` search returns "Sorry, your search gave no results" for `geekbench`, `python3-geekbench`, and `libgeekbench`, across all architectures including riscv64 |
| Arch Linux RISC-V (archriscv.felixc.at) | Not available; full page fetched, zero matches for "geekbench" |
| NixOS/nixpkgs | Available: `geekbench_6` package, riscv64-linux supported since [#523562](https://github.com/nixos/nixpkgs/pull/523562) (merged 2026-06-08), backported to release-26.05 via [#530806](https://github.com/nixos/nixpkgs/pull/530806) (merged 2026-07-03). Packages the unmodified official upstream binary |
| GitHub Releases (primatelabs) | Not used; no public releases page exists |
| Flatpak/Snap | Data not available: not searched |

**What a user must do to run Geekbench 6 on riscv64:** either (a) download the tarball directly from `cdn.geekbench.com/Geekbench-6.7.0-LinuxRISCVPreview.tar.gz`, extract, and run the ELF binary, accepting the freemium result-upload requirement unless a license key is supplied; or (b) on NixOS, install the `geekbench_6` package from nixpkgs, which fetches and installs the same vendor binary. No other Linux distribution offers an automated installation path.

## 9. Dependencies

Geekbench's workloads are built on third-party open-source libraries and formats, as documented in Primate Labs' own Geekbench 6 CPU Workloads documentation and corroborated by downstream packaging metadata (e.g., the AUR `geekbench6` package). Geekbench's own build/link manifest is not public (closed source, no CMakeLists/Cargo.toml/package.json available), so riscv64 readiness for each dependency is drawn from this repository's own per-project research reports.

| Dependency | Role in Geekbench | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| zlib | Runtime dependency, critical. General-purpose compression; File Compression workload; PDF rendering | Builds (portable C) | Tests pass via OpenBSD/QEMU CI only; no native Linux riscv64 job | Ships, scalar only, no RVV assembly path | RVV Adler-32 PR [#1099](https://github.com/madler/zlib/pull/1099) unreviewed since Oct 2025 |
| LZ4 | Runtime dependency, optional. Compression codec, File Compression workload | Builds, but only in a low-priority "Tier 3" QEMU-cross CI group with MIPS/M68K/SPARC | Non-release-blocking | No official riscv64 binaries; source tarballs and Windows binaries only | Lowest-priority CI tier per upstream `cross-platform.yml` |
| zstd | Runtime dependency, critical. Compression codec, File Compression workload | Builds under QEMU CI (since Jul 2025), scoped to PRs against dev/release branches only | Tests mostly pass under QEMU; not release-blocking | Ships in distros; no official GitHub riscv64 binaries; partial RVV kernels merged | 5 RVV optimization PRs unreviewed 2-6 months: [#4557](https://github.com/facebook/zstd/pull/4557), [#4596](https://github.com/facebook/zstd/pull/4596), [#4622](https://github.com/facebook/zstd/pull/4622), [#4629](https://github.com/facebook/zstd/pull/4629), [#4668](https://github.com/facebook/zstd/pull/4668) |
| xz | Runtime dependency, optional. Asset Compression workload (LZMA2) | Builds | Tests pass, 100% code coverage of riscv.c | Ships; `LZMA_FILTER_RISCV` since 5.6.2, stable since 5.8.0 (Mar 2025) | None known |
| SQLite | Runtime dependency, critical. SQLite workload; Photo Library and Text Processing metadata | Builds (portable C); no riscv64 hardware/emulation in upstream test infra | Best-effort/community-reported only, no upstream CI | Ships; 3.53.0+ has a riscv64 `__uint128_t` fix | Maintainers report no access to RISC-V hardware; `hwtime.h` cycle counter returns 0 on riscv64 (profiling builds only, no correctness impact) |
| libjpeg-turbo | Runtime dependency, critical. JPEG codec, HTML5 Browser and Photo Library workloads | RVV SIMD merged to dev branch (Feb 2026); no riscv64 CI upstream | No CI validation; manual testing only (e.g., OrangePi RV2) | Stable 3.1.x (pre-RVV) is what distros ship; 3.2 with RVV is dev-only | Maintainer explicitly declined official riscv64 release binaries ([issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885)); single, unpaid maintainer cited funding deficit |
| libpng | Runtime dependency, optional. PNG codec, HTML5 Browser and PDF-image workloads | RVV support exists in source but is disabled by default in the build system | No automated riscv64 CI; manual/ad-hoc validation (SpacemiT K1, Banana Pi F3, JH7110) | No official binaries policy documented | Maintainer acknowledged a missed `-march=rv64gv` flag allowed a bad intrinsic to land (PR #766/#771), required follow-up fix |
| FreeType | Runtime dependency, optional. Font rasterization for PDF rendering | Builds (portable C) | Tests pass | Ships, widely packaged | None known |
| ICU | Runtime dependency, optional. Text Processing workload (Unicode) | Builds (portable C++) | Tests pass | Ships, widely packaged | None known |
| LLVM | Runtime dependency, critical. Clang workload (incremental C++ compilation) | Builds by default (`LLVM_TARGETS_TO_BUILD`), Tier 2 RISC-V backend, but not part of the required pre-merge gate (unlike x86_64/AArch64/Windows/macOS) | Not a required/blocking check | Ships in LLVM releases; no upstream release binaries specifically for riscv64 | De facto well-supported in practice (SiFive-maintained) but no formal tier declaration |
| Lua | Runtime dependency, optional. Interpreter compiled by the Clang workload | No CI at all, for any architecture; "compiles unmodified on any ISO C platform" | No release-blocking tests, any architecture | Source-only for all architectures; Debian riscv64 package confirmed present (5.4.8-2) | None identified; riscv64 treated identically to every other architecture |
| Python | Runtime dependency, critical. Text Processing workload | riscv64 buildbot exists but is tagged "unstable" | Untiered per PEP 11; no CI failure blocks riscv64 | No Steering-Council-approved support tier; no sponsoring core developer | riscv64 sits below even Tier 3 (Android/iOS/FreeBSD/s390x); no PEP proposes promotion |
| draco | Runtime dependency, optional. 3D geometry compression, Asset Compression workload | No riscv64 CI, no toolchain file, scalar fallback only (no SIMD) | No CI of any kind | Source-only for every architecture (zero release assets on any tag) | No upstream tier at all; Debian/Ubuntu packages are downstream-only |
| astc-encoder | Runtime dependency, optional. ASTC texture codec, Asset Compression workload | Data not available: no dedicated status report exists in this repository yet | Data not available | Data not available | Not yet researched in depth |
| LiteRT | Runtime dependency, critical. Backend for ML-based workloads (Object Detection, Background Blur, Speech Recognition, Object Removal, HDR) | Does not build; zero RISC-V entries in any CMakeLists, BUILD file, or CI config; build docs page 404s | None | None | CRITICAL: no RISC-V support at all, build fails with XNNPACK disabled ([issue #37](https://github.com/google-ai-edge/LiteRT/issues/37)), no roadmap |
| XNNPACK | Runtime dependency, critical. Neural-net inference kernels backing LiteRT and used directly | Builds; dedicated `cmake-linux-riscv64` CI since Dec 2023, 300+ RISC-V kernel files, RVV f32/int8/fp16 kernels present | Partial: 100+ FP16 (Zvfh) test failures in CI ([issue #9886](https://github.com/google/XNNPACK/issues/9886)); `XNN_ENABLE_RISCV_FP16_VECTOR` enabled unconditionally causes regressions on hardware lacking Zvfh | Source-pinned, no independently versioned release | f32 inference paths functional; fp16 acceleration broken; [issue #4650](https://github.com/google/XNNPACK/issues/4650) (cpuinfo build failure) open 3+ years |
| OpenCV | Runtime dependency, critical. Background Blur, Horizon Detection, Object Removal image processing | Builds | Partial: RVV DNN engine broken (regression, Apr 2025, marked high priority, unresolved); G-API failures since 2021 | Ships in distros | MEDIUM: DNN-engine regression blocks neural-inference paths used by several workloads |
| OpenSSL | Runtime dependency, optional. AES-XTS encryption workload | Builds; full cross-compile CI | Tests pass (Zkn, Zvk, Zbb, Zbc) | Ships in all stable releases | None known |
| Intel Embree | Runtime dependency, critical. Ray Tracer workload | Data not available: not tracked with its own status report in this repository | Data not available | Data not available | Not yet researched in depth |
| PDFium | Runtime dependency, critical. PDF Renderer workload | Data not available: not tracked with its own status report in this repository; it is a Chromium sub-component and is not the same package as the Chromium report on file | Data not available | Data not available | Not yet researched in depth |
| zlib-ng (indirect, alternative to zlib in some builds) | Accelerated DEFLATE | Builds: RVV + Zbc implementations present in `arch/riscv/` | Tests pass under QEMU; Clang riscv64 CI coverage broken | Ships on Alpine Linux edge for riscv64 | [Issue #1670](https://github.com/zlib-ng/zlib-ng/issues/1670): unaligned-access bug in `chunkset_rvv.c`, open |
| GCC (indirect, `gcc-libs`: libstdc++/libgcc) | C++ runtime linkage (AUR packaging dependency) | riscv64 is a long-established GCC target | Not independently assessed here | Ships | Not tracked with its own status report in this repository |
| musl (indirect) | C standard library used to build the Lua interpreter inside the Clang workload | Data not available | Data not available | Data not available | Not tracked with its own status report in this repository |

**Critical dependency deep-dive, LiteRT:** the single largest functional gap in Geekbench 6 on riscv64. Zero RISC-V entries exist in any CMakeLists.txt, BUILD file, or CI workflow; the official riscv64 build-documentation page 404s; a community build attempt ([issue #37](https://github.com/google-ai-edge/LiteRT/issues/37)) failed because XNNPACK is disabled on RISC-V at the LiteRT level; there is no public Google commitment to RISC-V support despite Google being a RISE Premier Member.

**Critical dependency deep-dive, XNNPACK:** has dedicated `cmake-linux-riscv64` CI since December 2023 and 300+ RISC-V kernel files, including RVV f32/int8/fp16 kernels, which is materially better-supported than LiteRT itself. [Issue #9886](https://github.com/google/XNNPACK/issues/9886) (Apr 2026) documents 100+ FP16 (Zvfh) test failures in current CI, caused by the FP16 vector flag being enabled unconditionally regardless of actual Zvfh hardware support. The f32 inference paths are functional; fp16 acceleration is broken in CI.

## 11. Known Bugs and Active Issues

No public Geekbench bug tracker is accessible (closed source, no issue tracker of any kind). The following is drawn from third-party hardware reviews, Primate Labs' own support forum, and dependency-level issue trackers.

| ID / source | Issue | Severity | Notes |
|---|---|---|---|
| Informal, reported via Star64 community testing | CPU-topology vector-detection false positive: naive substring match on the ISA string finds "v" inside "rv64" and falsely reports a vector unit that isn't present | Low | No formal bug number; partially addressed by GB6.4.0's improved Linux ARM/RISC-V topology detection |
| No formal number; documented before GB6.4.0 | Missing RVV/SIMD code paths pre-6.4.0: SIMD-shaped subtests (Gaussian Blur, Structure from Motion, Machine Learning) scored near zero on RVV-capable and scalar RISC-V cores alike, understating real performance | Medium (historical, fixed) | Fixed in GB6.4.0 per official release notes, Jan 2025 |
| Documented at tinycomputers.io | Asymmetric-core / big.LITTLE-style topology misdetection on SpacemiT K3: reports "1 Processor, 16 Cores," mislabels all cores as "X100," reports "Cluster 1: 0 Cores," and only benchmarks 8 of 16 physical cores because the kernel affinity mask restricts any process to cores 0-7 or 8-15 | Medium | No upstream issue number found; correctness-affecting (under-reports multi-core score) |
| [Primate Labs support forum #86039](https://primatelabs.tenderapp.com/discussions/geekbench/86039-geekbench-6-pro-risc-v-64-bit-download) | No Geekbench 6 Pro RISC-V binary available on the official download page | Low | Filed 2024-07-10 by a reseller (Koreansoft Inc.); no public resolution found |
| [Primate Labs support forum #83490](https://support.primatelabs.com/discussions/geekbench/83490-pro-version-riscv-consult) | "Pro version RISCV consult": whether GB6 Pro can measure RISC-V Linux performance via CLI, and whether a RISC-V Pro license is permanent | Low | Open/unresolved; no visible staff reply in fetched content |
| [Primate Labs support forum #89560](https://support.primatelabs.com/discussions/geekbench/89560-how-to-view-geekbench-riscv-test-results-offline) | No offline result-viewing on RISC-V; Linux/RISC-V build is preview-only with no Pro-license support | Medium (usability) | Closed/answered: Primate Labs staff ("John," 2025-07-06) confirmed a Corporate License is the only path to offline/air-gapped use |
| [geerlingguy/sbc-reviews #65](https://github.com/geerlingguy/sbc-reviews/issues/65), [#82](https://github.com/geerlingguy/sbc-reviews/issues/82) | CPU identification failure: processor shown as "Unknown" on HiFive Premier P550 | Low | Ecosystem-wide RISC-V identification gap, not Geekbench-specific; partly addressed by GB6.7.0 |
| [geerlingguy/sbc-reviews #46](https://github.com/geerlingguy/sbc-reviews/issues/46), [#47](https://github.com/geerlingguy/sbc-reviews/issues/47) | Multiple Phoronix Test Suite benchmarks failed to compile on Milk-V Mars and Milk-V Jupiter | Medium | Indicates broader RISC-V software-compatibility gaps affecting adjacent tooling, not Geekbench itself |
| geeky-gadgets.com 2025 SBC roundup | Geekbench 6 "inconsistencies," some boards (e.g., VisionFive 2) failing to complete tests | Low-Medium | No exact numeric scores published in fetchable text |
| [LiteRT #37](https://github.com/google-ai-edge/LiteRT/issues/37) | No RISC-V build support at all | Critical (for ML workloads) | All ML-backed Geekbench workloads non-functional or scalar-fallback as a result |
| [XNNPACK #9886](https://github.com/google/XNNPACK/issues/9886) | 100+ FP16 test failures in CI (Apr 2026) | Medium | FP16 inference acceleration disabled; affects ML workload quality |
| OpenCV RVV DNN engine regression | Broken since Apr 2025, marked high priority, unresolved | Medium | Affects Background Blur and Horizon Detection workloads |
| [zlib-ng #1670](https://github.com/zlib-ng/zlib-ng/issues/1670) | Unaligned-access bug in `chunkset_rvv.c` | Medium (correctness) | File Compression workload correctness risk where zlib-ng is used as backend |

No Geekbench-specific floating-point NaN or result-correctness bug reports for riscv64 were found in any accessible source; the correctness-relevant items above are at the dependency and kernel level (zlib-ng unaligned access, kernel syscall-overhead regression noted below), not in Geekbench's own reported scoring.

**Adjacent, non-Geekbench kernel finding:** a RISC-V generic-entry conversion (commit f0bddf50) caused a 14% Unixbench syscall-benchmark regression from kernel 6.1 to 6.6 (dynamic instructions per syscall rising from ~200 to ~250), which would depress any Geekbench subtests sensitive to syscall overhead. No formal issue number cited; raised on an [LKML thread](https://lkml.iu.edu/hypermail/linux/kernel/2402.2/09742.html). This affects the Linux kernel underlying the test system, not Geekbench code.

## 12. Objections and Upstream Blockers

**Proprietary closed source, no contribution path:** Geekbench is not open source. No external contributor can submit a patch for RISC-V SIMD acceleration, add a workload, or fix a bug in the benchmark engine itself. All improvement requires Primate Labs to prioritize it internally. This is the fundamental constraint on any investment strategy targeting Geekbench directly: RISC-V hardware vendors who want better scores must either wait on Primate Labs' own roadmap or engage them commercially. No contribution path exists for the engine; the only concrete public work items that exist at all are in Geekbench's open-source dependencies.

**LiteRT has no RISC-V roadmap:** the single largest functional gap for Geekbench 6 on riscv64. Without it, the ML workload suite (an estimated 30-40% of total score weight [NEEDS VERIFICATION]) either fails outright or falls back to unoptimized scalar paths. Primate Labs cannot fix this unilaterally; it requires Google (LiteRT's owner, a RISE Premier Member) or a third party to port LiteRT to riscv64, and no such port has been announced.

**"Preview" label permanence is unconfirmed:** ARM64 has carried a "Preview" label throughout all of Geekbench 6 despite being a mature, widely used platform, so the label does not reliably predict eventual promotion. What criteria, if any, Primate Labs uses to promote a platform out of "Preview" is not publicly documented, leaving the long-term status of the riscv64 port uncertain.

**Benchmark cross-architecture comparability:** the cnx-software reviewer explicitly warned that riscv64 Geekbench scores are not directly comparable to other architectures given absent SIMD paths (pre-6.4.0) and unoptimized toolchains. This limits Geekbench's utility as a competitive-evaluation tool for RISC-V silicon procurement decisions until the dependency stack (particularly LiteRT and XNNPACK FP16) matures, independent of whatever Geekbench itself does.

**No RISE relationship:** confirmed across 28 RISE blog posts (May 2024 through July 2026), the RISE member list, and the riseproject-dev GitHub org (python-wheels, riscv-runner, gcc-postcommit-ci, sw-ecosystem repos) -- zero mentions of Geekbench or Primate Labs anywhere. There is no existing RISE investment, funding, RFP, or working-group item to build on or avoid duplicating.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** upstream

Geekbench is closed-source (Primate Labs), so there is no public repository and therefore no upstream CI of any kind to inspect for any architecture, confirmed via direct HTTP 403 on geekbench.com and the absence of a GitHub org hosting the benchmark engine. However, Primate Labs directly and repeatedly ships official riscv64 Linux "Preview" binaries from its own CDN, independently verified through HTTP checks whose dates match the claimed release dates: [Geekbench 6.2.0](https://cdn.geekbench.com/Geekbench-6.2.0-LinuxRISCVPreview.tar.gz) (Sep 2023), [6.4.0](https://cdn.geekbench.com/Geekbench-6.4.0-LinuxRISCVPreview.tar.gz) (Jan 2025, adding RVV support), and [6.7.0](https://cdn.geekbench.com/Geekbench-6.7.0-LinuxRISCVPreview.tar.gz) (Apr 2026). These binaries are confirmed functional across years of real-world use on diverse RISC-V hardware (StarFive VisionFive 2, Milk-V Mars and Jupiter, HiFive Premier P550, DC-ROMA, SpacemiT K3), all producing valid, non-error scores per [geerlingguy/sbc-reviews #82](https://github.com/geerlingguy/sbc-reviews/issues/82) and related threads. This exceeds a bare "no CI, no release" orange case. A Linux distribution, [NixOS/nixpkgs #523562](https://github.com/nixos/nixpkgs/pull/523562) (merged 2026-06-08), packages this same unmodified official upstream binary for riscv64, satisfying the distribution floor needed for an upgrade to yellow.

The grade is capped at yellow rather than blue or green because there is zero CI test-execution evidence of any kind, impossible to inspect given the closed source, and because the Linux/RISC-V build remains permanently labeled "Preview" with no Pro-license or offline support, per Primate Labs staff confirmation as of July 2025 ([support thread #89560](https://support.primatelabs.com/discussions/geekbench/89560-how-to-view-geekbench-riscv-test-results-offline)). No package-manager distribution exists on PyPI, Ubuntu 26.04, Debian, or Arch RISC-V, all confirmed absent via direct checks. Geekbench itself is not treated as an optimization-purpose project: its stated value proposition is being an accurate cross-platform performance-measurement tool, not a RISC-V-specific SIMD/compression/crypto/numerics library in its own right, though its accuracy is itself gated by dependency-level RISC-V gaps (e.g., LiteRT has zero RISC-V support, per [LiteRT issue #37](https://github.com/google-ai-edge/LiteRT/issues/37)), which is noted here as a caveat rather than applied as a grade cap.

**Pending work that could change the grade:**
- Open: LiteRT riscv64 port ([google-ai-edge/LiteRT issue #37](https://github.com/google-ai-edge/LiteRT/issues/37)), no roadmap; would close the ML workload gap.
- Open: XNNPACK FP16/Zvfh test failures ([google/XNNPACK issue #9886](https://github.com/google/XNNPACK/issues/9886)).
- Open: OpenCV RVV DNN engine regression (Apr 2025, unresolved).
- Open: 5 unreviewed zstd RVV optimization PRs ([#4557](https://github.com/facebook/zstd/pull/4557), [#4596](https://github.com/facebook/zstd/pull/4596), [#4622](https://github.com/facebook/zstd/pull/4622), [#4629](https://github.com/facebook/zstd/pull/4629), [#4668](https://github.com/facebook/zstd/pull/4668)).
- Merged: [NixOS/nixpkgs #523562](https://github.com/nixos/nixpkgs/pull/523562) (riscv64 packaging, 2026-06-08) and its backport [#530806](https://github.com/nixos/nixpkgs/pull/530806) (2026-07-03) -- this is what raised the grade to yellow.
- No RISE involvement with Geekbench or Primate Labs found: not a RISE member, zero mentions across 28 RISE blog posts.

## 14. Investment Analysis

RISE has no existing Geekbench-specific investment: confirmed by zero mentions across 28 RISE blog posts and absence from the riseproject-dev GitHub org. The following analysis covers work not already done or funded.

### 14.1 Functional Enablement

The highest-value functional work is enabling LiteRT on riscv64, which would directly unblock all ML-backed Geekbench workloads and numerous other ML-dependent applications well beyond Geekbench. This is an upstream LiteRT/Google problem, not something Primate Labs can fix. A narrower second-order item is the XNNPACK FP16 fix ([issue #9886](https://github.com/google/XNNPACK/issues/9886)), a scoped code fix rather than a new port. Fixing OpenCV's RVV DNN engine regression (high priority, open since Apr 2025) would directly benefit the Background Blur and Horizon Detection workloads.

### 14.2 Performance Optimization

The zstd optimization backlog (5 open RVV PRs unreviewed for 2-6 months) is low-effort, high-yield: the patches already exist and need review pressure or contributor time to land, directly improving the File Compression workload. libjpeg-turbo 3.2 stable release is gated on Primate Labs' or the community's willingness to cut a release; the RVV SIMD work is already merged to dev. The Photo Library workload benefits once 3.2 reaches distros. Data not available: quantified performance improvement per workload for any of the above, since no benchmarking data comparing scalar vs. RVV paths for these specific dependency versions was found.

### 14.3 CI/CD Infrastructure

Not applicable to Geekbench itself, closed source with no public CI to build. For the dependency stack, RISE already operates hardware runners for open-source projects, but LiteRT, XNNPACK, and OpenCV do not currently use RISE runners for their riscv64 jobs; onboarding them would be dependency-level work, not Geekbench-specific.

### 14.4 Ecosystem Enablement

No package ecosystem applies to Geekbench itself: it has no plugins, extensions, or dependent downstream packages, distributed as a single binary tarball. (Section 10 is omitted for this reason.)

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | LiteRT riscv64 port: enable build, integrate XNNPACK backend, validate inference workloads | Data not available: scope requires a LiteRT codebase audit | Google (RISE Premier Member) or contractor | Critical |
| Functional | XNNPACK FP16 (Zvfh) fix: resolve [issue #9886](https://github.com/google/XNNPACK/issues/9886), fix unconditional `XNN_ENABLE_RISCV_FP16_VECTOR` | 2-4 | Qualcomm, SiFive, or Google XNNPACK team | High |
| Functional | OpenCV RVV DNN engine: fix Apr 2025 regression, restore riscv64 neural-inference path | 4-8 | OpenCV community, RISE Enablement WG | High |
| Performance | zstd RVV optimization PRs: review and land [#4557](https://github.com/facebook/zstd/pull/4557), [#4596](https://github.com/facebook/zstd/pull/4596), [#4622](https://github.com/facebook/zstd/pull/4622), [#4629](https://github.com/facebook/zstd/pull/4629), [#4668](https://github.com/facebook/zstd/pull/4668) | 1-2 (review only; patches already written) | RISE Enablement WG | Medium |
| Performance | libjpeg-turbo 3.2 stable release: pressure or assist Primate Labs / distro maintainers to adopt 3.2 with RVV | 1 (coordination) | RISE or Canonical | Low |
| Functional | zlib-ng unaligned-access bug fix: resolve [issue #1670](https://github.com/zlib-ng/zlib-ng/issues/1670) in `chunkset_rvv.c` | 1-2 | RISE Enablement WG | Medium |
| Business development | Engage Primate Labs directly: request public tier-policy documentation, RVV workload optimization commitment, and removal of the "Preview" label | 0 (business development, not engineering) | Chip vendor BD team | Medium |

## 15. References

- [Primate Labs Geekbench 6 release notes](https://www.primatelabs.com/release/geekbench6/)
- [AppleInsider: Geekbench 6.4 adds RISC-V and improves ARM extension support](https://appleinsider.com/articles/25/01/28/new-geekbench-update-adds-risc-v-and-improves-arm-extension-support)
- [Primate Labs support forum #83490: "pro version RISCV consult"](https://support.primatelabs.com/discussions/geekbench/83490-pro-version-riscv-consult)
- [Primate Labs support forum #89560: "How to View Geekbench RISCV Test Results Offline?"](https://support.primatelabs.com/discussions/geekbench/89560-how-to-view-geekbench-riscv-test-results-offline)
- [Primate Labs support forum #86039: Geekbench 6 Pro RISC-V 64-bit download](https://primatelabs.tenderapp.com/discussions/geekbench/86039-geekbench-6-pro-risc-v-64-bit-download)
- [Geekbench 6 EULA](https://www.primatelabs.com/legal/eula-v6.html)
- [primatelabs/geekbench-tools on GitHub](https://github.com/primatelabs/geekbench-tools)
- [primatelabs/geekbench-swift on GitHub](https://github.com/primatelabs/geekbench-swift)
- [Geekbench CDN: Geekbench-6.2.0-LinuxRISCVPreview.tar.gz](https://cdn.geekbench.com/Geekbench-6.2.0-LinuxRISCVPreview.tar.gz)
- [Geekbench CDN: Geekbench-6.4.0-LinuxRISCVPreview.tar.gz](https://cdn.geekbench.com/Geekbench-6.4.0-LinuxRISCVPreview.tar.gz)
- [Geekbench CDN: Geekbench-6.7.0-LinuxRISCVPreview.tar.gz](https://cdn.geekbench.com/Geekbench-6.7.0-LinuxRISCVPreview.tar.gz)
- [NixOS/nixpkgs #523562: geekbench_6 riscv64 support](https://github.com/nixos/nixpkgs/pull/523562)
- [NixOS/nixpkgs #530806: backport to release-26.05](https://github.com/nixos/nixpkgs/pull/530806)
- [bobolopolis/meta-geekbench: Yocto/OE layer packaging Geekbench binaries for riscv64](https://github.com/bobolopolis/meta-geekbench)
- [geerlingguy/sbc-reviews #10, StarFive VisionFive 2](https://github.com/geerlingguy/sbc-reviews/issues/10)
- [geerlingguy/sbc-reviews #22, Milk-V Mars CM](https://github.com/geerlingguy/sbc-reviews/issues/22)
- [geerlingguy/sbc-reviews #46, Milk-V Mars](https://github.com/geerlingguy/sbc-reviews/issues/46)
- [geerlingguy/sbc-reviews #47, Milk-V Jupiter](https://github.com/geerlingguy/sbc-reviews/issues/47)
- [geerlingguy/sbc-reviews #65, HiFive Premier P550](https://github.com/geerlingguy/sbc-reviews/issues/65)
- [geerlingguy/sbc-reviews #82, DC-ROMA AI PC Mainboard II](https://github.com/geerlingguy/sbc-reviews/issues/82)
- [SpacemiT K3 Pico-ITX review](https://tinycomputers.io/posts/spacemit-k3-pico-itx-review.html)
- [ben3d.ca: "RISC-V in 2024 Is Slow"](https://ben3d.ca/blog/risc-v-in-2024-is-slow)
- [Hacker News discussion of ben3d.ca's RISC-V analysis](https://news.ycombinator.com/item?id=41925511)
- [Jeff Geerling: Milk-V Jupiter review](https://www.jeffgeerling.com/blog/2024/milk-v-jupiter-first-itx-risc-v-board-ive-tested/)
- [RISE Project RP009: LLVM SPEC Optimization](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog index](https://riseproject.dev/blog)
- [LiteRT issue #37: riscv64 build failure](https://github.com/google-ai-edge/LiteRT/issues/37)
- [XNNPACK issue #9886: 100+ FP16 test failures on riscv64](https://github.com/google/XNNPACK/issues/9886)
- [XNNPACK issue #4650: cpuinfo build failure, open 3+ years](https://github.com/google/XNNPACK/issues/4650)
- [libjpeg-turbo issue #885: maintainer declines riscv64 release binaries](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885)
- [zstd PR #4557](https://github.com/facebook/zstd/pull/4557), [#4596](https://github.com/facebook/zstd/pull/4596), [#4622](https://github.com/facebook/zstd/pull/4622), [#4629](https://github.com/facebook/zstd/pull/4629), [#4668](https://github.com/facebook/zstd/pull/4668)
- [zlib-ng issue #1670: unaligned-access bug in chunkset_rvv.c](https://github.com/zlib-ng/zlib-ng/issues/1670)
- [zlib PR #1099: RVV Adler-32, unreviewed since Oct 2025](https://github.com/madler/zlib/pull/1099)
- [LKML: RISC-V generic-entry syscall-overhead regression thread](https://lkml.iu.edu/hypermail/linux/kernel/2402.2/09742.html)
- [Wikipedia: Geekbench](https://en.wikipedia.org/wiki/Geekbench)