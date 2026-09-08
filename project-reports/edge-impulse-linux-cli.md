---
title: Edge Impulse Linux CLI
parent: Project Reports
color: red
---

# Edge Impulse Linux CLI

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse Linux CLI<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Edge Impulse Linux CLI is the Node.js/TypeScript command-line tool and SDK that lets a Linux-based edge device collect data, run inference, and deploy machine-learning models built on the Edge Impulse platform. It is distributed on npm as [`edge-impulse-linux`](https://registry.npmjs.org/edge-impulse-linux) (current version 1.25.2), with bin entries `edge-impulse-linux`, `edge-impulse-linux-runner`, and `edge-impulse-camera-debug`. The source repository is [edgeimpulse/edge-impulse-linux-cli](https://github.com/edgeimpulse/edge-impulse-linux-cli).

The CLI is not itself a compiled inference engine. Its core function is to detect the host CPU architecture and device type, then download a prebuilt, architecture-specific native inference binary ("runner", `.eim` file) from Edge Impulse's own build servers, and orchestrate camera/sensor capture and inference against it.

**Governance and corporate structure.** This is a single-vendor corporate repository, not a foundation project. `package.json` lists the author as "EdgeImpulse Inc. <hello@edgeimpulse.com>" under a Clear BSD (3-Clause-Clear) license, with copyright held by EdgeImpulse Inc. rather than a foundation. There is no `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `GOVERNANCE.md`, `PLATFORMS.md`, or `SUPPORT.md` anywhere in the repository, and no `.github/` directory of any kind (confirmed by direct clone and full-tree inspection). Edge Impulse Inc. was acquired by Qualcomm in March 2025. Of the full commit history (129 commits, 2021-03-30 to 2026-08-27), every identifiable human author is Edge Impulse/Qualcomm staff: Mateusz Majchrzycki (16 commits), Jan Jongboom, co-founder/CTO (13 commits), Jorge Silva (8 commits), Raul James (1 commit), plus an automated "Edge Impulse Firmware Uploader" bot account (89 commits) and an "automatiek" bot (2 commits). No outside or community contributors appear in the history.

**Community culture on new ports.** There is no documented ports process, no tier policy, and no evidence of any prior third-party architecture-port contribution of any kind (ARM, x86, or otherwise) landing from outside Edge Impulse. Officially documented Linux CLI targets, per [Edge Impulse's own documentation](https://docs.edgeimpulse.com/docs/tools/edge-impulse-for-linux), are x86_64, ARMv7, and AARCH64 only.

## 2. Port History and Upstreoming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port work, issue, PR, or commit exists at any point in this repository's history | [GitHub code/issue/PR/commit search, repo:edgeimpulse/edge-impulse-linux-cli](https://github.com/edgeimpulse/edge-impulse-linux-cli) (all riscv-related query variants: 0 results) |

No milestone table can be populated because no riscv64 work has ever occurred. `git log --all -i --grep="riscv\|risc-v"` and `git log --all -p -S"riscv"` (content pickaxe) against the full commit history both return zero matches. A full-tree case-insensitive `grep -ril "riscv"` (excluding `.git`) also returns zero matches. There are no key contributors to list because there is no RISC-V work to attribute. The project is not upstream-supported for RISC-V in any form, partial or complete.

## 3. Upstream Support Tier

No formal tier policy for platform support exists in any project document. The de facto tier list is stated only in product documentation: [docs.edgeimpulse.com/docs/tools/edge-impulse-for-linux](https://docs.edgeimpulse.com/docs/tools/edge-impulse-for-linux) names x86_64, ARMv7, and AARCH64 as supported. This is corroborated at the source level: `RunnerDownloader.getDeploymentType()` in `cli/linux/runner-downloader.ts` contains explicit, hand-built branches only for these architectures (plus macOS x64/arm64).

| Architecture | CI builds | CI tests | Official release/binary | Support status |
|---|---|---|---|---|
| amd64 (x86_64) | N/A (no CI exists) | N/A | Yes, downloaded prebuilt `.eim` runner from Edge Impulse build servers | Fully supported |
| arm64 (AArch64) | N/A (no CI exists) | N/A | Yes, downloaded prebuilt `.eim` runner, plus 5 vendor sub-targets (Renesas RZ/V2L, BrainChip Akida, NVIDIA Jetson Nano/Orin/Orin-6.0, Qualcomm QNN) | Fully supported, most extensively targeted architecture |
| riscv64 | None | None | None | Not supported. Explicit source-level rejection (Section 4) |

There is no CI of any kind in this repository (Section 7), so "CI builds/tests" is N/A across every architecture, not specifically absent for riscv64. Architecture support is instead enforced entirely by the runtime dispatch logic in `runner-downloader.ts`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

This is a pure Node.js/TypeScript codebase with no JIT, no hand-written SIMD, no cryptographic primitives, and no inline assembly of its own. The one place architecture matters is host-CPU detection used to select which prebuilt native `.eim` inference binary to download.

**Component: `RunnerDownloader.getDeploymentType()`** (`cli/linux/runner-downloader.ts`, lines 17-116):

| Architecture | Coverage | Detail |
|---|---|---|
| amd64/x86_64 (Linux) | Full | Dedicated `process.arch === 'x64'` branch to `runner-linux-x86_64`, plus a Akida-device special case |
| arm64/AArch64 (Linux) | Full, extensive | Base case plus 5 hand-built vendor sub-targets: Renesas RZ/V2L DRP-AI (`/dev/drpai0` detection), BrainChip Akida (`/dev/akida0`), NVIDIA Jetson Nano/Orin/Orin-6.0 (CUDA/TensorRT/cuDNN library version sniffing), Qualcomm QNN delegate (`libQnnTFLiteDelegate.so` detection) |
| ARMv7 (32-bit Linux) | Full | Dedicated branch with `uname -m` disambiguation (armv7l vs aarch64) |
| macOS x64/arm64 | Full | Explicit branches for both |
| riscv64 | Absent | No branch, no case, no string anywhere in the function. Falls through to the generic `else` at lines 107-110, which throws: `Unsupported architecture "<arch>", only arm supported for now` |

This is confirmed by direct inspection of the file, not by absence of search results.

**Component: VLM server binaries (llama-server / clip-server)** (`runner.ts`, lines 741-760): maintains an explicit `validArchs = ['x64', 'arm64']` whitelist. A riscv64 host would hit a hard `throw new Error(...'not supported on architecture'...)`.

**Component: test/CI valgrind suppressions** (`library/classifier/valgrind-suppression.ts`): only `aarch64_softmax_i8_suppression` and `x86_softmax_i8_suppression` blocks exist. No riscv64 equivalent, consistent with riscv64 never having been built or tested.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner download / arch dispatch | Full, hand-built branch | Full, hand-built branch with 5 vendor sub-targets | Missing, throws explicit error |
| VLM server binary support | Full (`x64` in `validArchs`) | Full (`arm64` in `validArchs`) | Missing, throws explicit error |
| Valgrind suppressions | Present | Present | Not present |

The CLI itself has no compiled inference runtime; that lives in separate Edge Impulse SDK/EON repositories outside this codebase's scope.

## 5. Build System, Cross-Compilation, and Toolchain

The repository is not a CMake/C++ project. Build is `tsc -p .` (TypeScript compiler only), confirmed by direct clone and full-tree search. There is no `CMakeLists.txt`, no `configure` script, no `Dockerfile*`, no `cmake/` directory, no `.ci/` or `docker/` directory, and no `BUILDING.md` / `INSTALL` / `docs/building.md` / `docs/cross-compilation.md` anywhere in the tree. There is therefore no native toolchain, minimum compiler version, QEMU usage, or cross-compilation infrastructure of any kind to document for this repository. Any riscv64 build failure that would occur is not a compile failure of this repo's own code, but the runtime `throw` in `getDeploymentType()` (Section 4) once the CLI executes on a riscv64 host.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CLI install (npm) | Works | Works | Works, npm package itself is pure JS/TS |
| Native inference runner (`.eim`) download | Works | Works | Fails, no `runner-linux-riscv64` deployment type exists on Edge Impulse's build servers or in the CLI's dispatch logic |
| Camera/sensor data collection | Works | Works | Untested, no reports either way |
| VLM server (llama-server/clip-server) | Works (`x64` whitelisted) | Works (`arm64` whitelisted) | Fails, explicit `validArchs` whitelist excludes it |
| Vendor accelerator sub-targets (Jetson, Akida, RZ/V2L, QNN) | N/A | Full support | N/A, not applicable, no riscv64 equivalent devices targeted |

**Functional gap:** the CLI's primary purpose, downloading and running a device-appropriate ML inference binary, cannot complete on riscv64. The code path is a deterministic, unconditional throw for any architecture outside the explicit allow-list.

**Performance gap:** not applicable, the tool never reaches a runnable state on riscv64 to measure.

**Security hardening / NaN-floating-point semantics:** no data available; no riscv64 execution of this tool has ever been reported (Section 11), so no correctness or floating-point behavior data exists to compare.

## 7. CI/CD Infrastructure

No CI/CD infrastructure of any kind exists in this repository, for any architecture. Verified by direct clone and full-tree inspection: no `.github/workflows/` directory (the `.github/` directory itself does not exist), no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml`. A full-tree search for `*.yml`/`*.yaml` (excluding `node_modules`) returns zero matches anywhere in the repository. There are no RISE runners in use (there is no CI to use them in), and no riscv hardware referenced anywhere.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | No | No | No |
| CI builds | N/A | N/A | N/A |
| CI tests | N/A | N/A | N/A |
| CI publishes release artifact | N/A | N/A | N/A |

This is not "CI exists but skips riscv64"; there is no CI pipeline of any kind covering any architecture, including the two that are officially supported.

## 8. Distribution and Release Status

**GitHub Releases:** none exist. The [repository's Releases page](https://github.com/edgeimpulse/edge-impulse-linux-cli/releases) states "There aren't any releases here." `git tag --sort=-v:refname` in a direct clone returns no tags. Consequently there are zero release assets of any kind, riscv64 or otherwise.

**npm:** the actual distribution channel is [`edge-impulse-linux`](https://registry.npmjs.org/edge-impulse-linux) (v1.25.2). It is a source-distributed package (no `os`/`cpu` gyp restriction fields), so `npm install` itself is architecture-agnostic; the failure occurs at runtime inside `getDeploymentType()` when the CLI tries to select a native runner binary for the host architecture.

**PyPI:** [pypi.org/pypi/edge-impulse-linux-cli/json](https://pypi.org/pypi/edge-impulse-linux-cli/json) returns HTTP 404. No such PyPI package exists under this name; the task's initial premise of a PyPI/Ubuntu Python package was incorrect for this project.

**Ubuntu 26.04 (resolute):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=edge-impulse-linux-cli&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results." Confirmed independently via a project graph DB SPARQL query against the resolute riscv64 archive for names "edge impulse linux cli", "python3-edge-impulse-linux-cli", and "libedge-impulse-linux-cli", all returning empty result sets.

**RISE GitLab wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-linux-cli/` returns a 302 redirect to the same 404 PyPI page. No wheel exists there either.

**Arch Linux RISC-V port:** [archriscv.felixc.at query](https://archriscv.felixc.at/?q=edge%20impulse%20linux%20cli) shows no matching package entry.

**Summary:** no official riscv64 binary or package exists for Edge Impulse Linux CLI in any channel checked (npm, PyPI, Ubuntu, RISE wheel builder, Arch RISC-V port, GitHub Releases). Even where the CLI itself could theoretically be installed via `npm install edge-impulse-linux` on a riscv64 host, the tool's core runner-download function would immediately throw the "Unsupported architecture" error documented in Section 4. There is no path today for a user to obtain a working Edge Impulse Linux CLI deployment on riscv64.

## 9. Dependencies

The project has no CMakeLists.txt, setup.py, go.mod, or Cargo.toml, it is a pure Node.js/TypeScript project defined entirely by `package.json`. Of roughly 20 runtime dependencies, only two carry native code with architecture-specific binaries; the rest (`cbor`, `borc`, `undici`, `ws`, `socket.io`, `express`, `multer`, `npm-registry-fetch`, `@aws-sdk/*`, `commander`, `inquirer`, `uuid`, `tsee`) are pure JavaScript with no architecture-specific code.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| koffi 2.12.1 (pinned) | Dynamic C FFI module generating runtime call trampolines, binds the CLI to Edge Impulse's native `.eim` inferencing runner | Yes, source builds fine, ships `src/koffi/src/abi_riscv64.cc` and `abi_riscv64_asm.S` | Yes, upstream [Koromix/koffi documentation](https://koffi.dev/) lists RISC-V64/Linux-glibc as officially supported and tested (LP64D ABI) | Yes, a prebuilt `linux_riscv64d/koffi.node` binary is bundled inside the exact pinned npm tarball (koffi@2.12.1), confirmed by extraction | Not a blocker for riscv64 enablement |
| sharp 0.32.6 (pinned) | Native image resize/encode bindings on libvips, used for camera-frame preprocessing | Can build from source, Ubuntu 26.04 riscv64 has all needed libvips/codec system packages (`libvips-dev`, `libjpeg-turbo8`, `libwebp7`, `libpng-dev`, etc.) | Not exercised, sharp 0.32.6 (released 2023-09-18) predates any riscv64 CI job upstream | No, sharp's per-arch prebuilt packages (`@img/sharp-linux-riscv64`, `@img/sharp-libvips-linux-riscv64`) were not published until sharp 0.34.5 (2025-11-06), two major versions after the pinned 0.32.6 | Actionable blocker: current upstream sharp (0.35.4) has a dedicated riscv64 CI job (QEMU-emulated `riscv64/debian:trixie`, `-march=rv64gc`, runs `test/unit/io.js`/`raw.js`, publishes riscv64 npm platform packages); fix path is an upstream version bump in edge-impulse-linux-cli, not a riscv64-specific patch |

**Node.js runtime:** the CLI requires `engines.node >= 16`. Node.js itself is available on Ubuntu 26.04 riscv64 (`resolute`, package `nodejs`). Note that sharp's own upstream CI sources riscv64 Node.js tarballs from `unofficial-builds.nodejs.org` rather than `nodejs.org`, suggesting riscv64 is not yet a Tier-1 official Node.js release platform, [NEEDS VERIFICATION] as this was observed only in sharp's CI configuration, not independently confirmed against Node.js's own release tier documentation.

**Bottom line:** koffi is not a riscv64 blocker (a working prebuilt already ships in the pinned version). sharp is an actionable but secondary blocker, it would need a version bump past 0.34.5 to get a tested riscv64 prebuilt. Neither of these dependency issues is the primary reason riscv64 does not work today; the primary and immediate blocker is the CLI's own explicit architecture rejection documented in Section 4.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue or PR exists | N/A | N/A | Confirmed via `mcp__github__search_issues` and `mcp__github__search_pull_requests` scoped to `repo:edgeimpulse/edge-impulse-linux-cli` across query variants "riscv", "riscv64", "risc-v", "risc v" (all `total_count: 0`), re-verified live in a later session pass with identical results |

No correctness bugs, no performance issues, and no feature requests concerning riscv64 exist anywhere in this repository's tracker. This is consistent with riscv64 never having been attempted as a target: there is no tracking issue, no CI-addition PR, and no reported user attempt to run this CLI on riscv64 hardware.

## 12. Objections and Upstream Blockers

**Stated objections:** none exist in writing; Edge Impulse has issued no public statement for or against a riscv64 port.

**Technical blockers:**
1. `RunnerDownloader.getDeploymentType()` unconditionally throws for any architecture outside `{x64, arm64, armv7, macOS x64/arm64}` (Section 4), this is a hard code-level rejection, not merely absence of support.
2. Even if the CLI's dispatch logic were extended, the actual native inference binary (`runner-linux-riscv64`) would need to be built and published by Edge Impulse's separate, server-side build system, which is outside this repository's scope and was not examined in this research.
3. The pinned `sharp` version (0.32.6) predates upstream riscv64 CI/prebuild support (Section 9), a secondary blocker if the primary one is resolved.

**Organizational blockers:** this is a closed, single-vendor (Qualcomm-owned) repository with no external contributors in its full commit history and no open governance process (Section 1). There is no documented path for an outside contributor to propose or land a riscv64 port. Edge Impulse is not a member of the RISE project (Section 14), so no RISE-funded upstreaming channel currently exists for this specific repository either.

**Acceptance probability:** low to unknown, absent any stated interest from Edge Impulse/Qualcomm, any open issue requesting riscv64, or any external community pressure visible in the tracker.

## 13. Readiness Assessment

- **Color:** red
- **Release provider:** none
- **Justification:** Edge Impulse Linux CLI's core architecture-dispatch function, `RunnerDownloader.getDeploymentType()` in [`cli/linux/runner-downloader.ts`](https://github.com/edgeimpulse/edge-impulse-linux-cli/blob/master/cli/linux/runner-downloader.ts), contains a deterministic, unconditional error throw for any host architecture outside its explicit allow-list (x64, arm64, armv7, macOS x64/arm64), a list that does not include riscv64. This is confirmed non-functionality by direct source inspection, not merely absence of testing: any riscv64 host running this CLI's primary function, downloading and running the device-appropriate ML inference binary, will fail deterministically with `Unsupported architecture "riscv64", only arm supported for now`. This is compounded by a total absence of upstream CI (no `.github/workflows` or any other CI configuration exists for any architecture), zero GitHub releases, and zero riscv64 packages across every distribution channel checked (Ubuntu 26.04, PyPI, RISE wheel builder, Arch RISC-V port).
- This is not an optimization-purpose project (it is a device-orchestration/data-collection CLI, not a project whose value proposition is architecture-specific speed), so the optimization modifier of the color model does not apply.
- **Pending work that could change the grade:** none identified. There is no open PR, no open issue, and no RISE involvement of any kind for this repository (Section 14). A grade change would require, at minimum, Edge Impulse itself adding a riscv64 branch to `getDeploymentType()`, building and publishing a `runner-linux-riscv64` binary on its server-side build infrastructure (outside this repo), and bumping the pinned `sharp` dependency past 0.34.5.

## 14. Investment Analysis

**RISE involvement check:** Edge Impulse does not appear on the [RISE project members list](https://riseproject.dev/members/) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm Technologies, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). A full check of all 33 posts on the [RISE blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml) and all 25 repositories in the [riseproject-dev GitHub org](https://github.com/riseproject-dev) found zero mentions of Edge Impulse or this CLI. No RISE-funded work exists to avoid duplicating; every item below is unclaimed.

### 14.1 Functional Enablement

Add a riscv64 branch to `RunnerDownloader.getDeploymentType()` (mirroring the existing arm64/x64 pattern), and extend the `validArchs` whitelist in `runner.ts` for VLM server binaries. This is small in this repository (a few days of engineering), but is gated on Edge Impulse's separate, out-of-scope server-side build system actually producing a working `runner-linux-riscv64` `.eim` binary, which was not investigated here and is likely the larger share of the effort. Bumping the pinned `sharp` dependency from 0.32.6 past 0.34.5 (to pick up riscv64 prebuilts) is a small, independent fix.

### 14.2 Performance Optimization

Not applicable, this is not an optimization-purpose project and no performance data exists to act on (Section 6).

### 14.3 CI/CD Infrastructure

The repository has zero CI for any architecture today. Standing up riscv64 CI would require first standing up CI at all (currently absent even for amd64/arm64), then adding a riscv64 job, ideally using RISE's free managed riscv64 GitHub Actions runners (`riseproject-dev/riscv-runner`, on Scaleway EM-RV1 hardware) given RISE's demonstrated pattern with other projects (e.g. PyTorch CI).

### 14.4 Ecosystem Enablement

Not applicable, see Section 10 omission note below; this CLI has no dependent package ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 branch to `getDeploymentType()` and `validArchs` whitelist | 0.5-1 | Edge Impulse (upstream repo owner) | Critical |
| Functional | Build and publish `runner-linux-riscv64` native inference binary on Edge Impulse's server-side build system | Unknown, out of scope of this repo, not investigated | Edge Impulse (server-side build team) | Critical |
| Functional | Bump pinned `sharp` dependency from 0.32.6 to >=0.34.5 for riscv64 prebuilt support | 0.5 | Edge Impulse or external contributor | Medium |
| CI/CD | Stand up any CI pipeline for this repo (currently none exists for any architecture), then add a riscv64 job, ideally via RISE riscv64 runners | 1-2 | Edge Impulse, potentially with RISE runner infrastructure | Medium |
| Organizational | Establish a documented ports/contribution process, since none exists today | 0.5 | Edge Impulse | Low |

## 15. Updates

(No updates yet, initial report dated 2026-06-17.)

## 16. References

- [Edge Impulse Linux CLI repository](https://github.com/edgeimpulse/edge-impulse-linux-cli)
- [Edge Impulse Linux CLI Releases page ("There aren't any releases here")](https://github.com/edgeimpulse/edge-impulse-linux-cli/releases)
- [Edge Impulse for Linux documentation](https://docs.edgeimpulse.com/docs/tools/edge-impulse-for-linux)
- [edge-impulse-linux npm package](https://registry.npmjs.org/edge-impulse-linux)
- [edge-impulse-linux-cli PyPI JSON endpoint, 404](https://pypi.org/pypi/edge-impulse-linux-cli/json)
- [Ubuntu packages.ubuntu.com search for edge-impulse-linux-cli, resolute suite](https://packages.ubuntu.com/search?keywords=edge-impulse-linux-cli&suite=resolute&searchon=names&section=all)
- [RISE GitLab wheel builder PyPI simple index for edge-impulse-linux-cli](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-linux-cli/)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=edge%20impulse%20linux%20cli)
- [RISE project members list](https://riseproject.dev/members/)
- [RISE project blog sitemap (33 posts)](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE project blog: PyTorch is available on riscv64](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE project blog: Announcing the RISE RISC-V Runners, free native RISC-V CI on GitHub](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [koffi native FFI module documentation](https://koffi.dev/)
- [sharp npm package](https://www.npmjs.com/package/sharp)
- GitHub code/issue/PR/commit search API results for `repo:edgeimpulse/edge-impulse-linux-cli` with riscv, riscv64, risc-v, risc v query variants (all zero results, queried via `mcp__github__search_issues`, `mcp__github__search_pull_requests`, `mcp__github__search_commits`, `mcp__github__search_code`)
- Direct clone of edgeimpulse/edge-impulse-linux-cli, master branch, HEAD `bce14bd3f5dd34a7d844e732d3846a07375a4119`, full-tree inspection of `cli/linux/runner-downloader.ts`, `cli/runner.ts`, `library/classifier/valgrind-suppression.ts`, `package.json`, and repository root
