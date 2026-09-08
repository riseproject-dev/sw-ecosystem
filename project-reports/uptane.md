---
title: Uptane
parent: Project Reports
color: orange
---

# Uptane

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Uptane<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Uptane is a security framework for over-the-air (OTA) software updates in automobiles, built on top of The Update Framework (TUF). It originated as an academic project (DHS-funded, 2015-) at NYU Tandon and the University of Michigan Transportation Research Institute, with Southwest Research Institute. In 2018 an "Uptane Alliance" working group formed under IEEE-ISTO and published *IEEE/ISTO 6100.1.0.0* on 2019-07-31. In 2019 Uptane joined the Linux Foundation as a Joint Development Foundation (JDF) project ("Uptane Series"), a step toward ISO standardization. The current standard is v2.1.0, released 2023-06-27, hosted at [uptane/uptane-standard](https://github.com/uptane/uptane-standard).

Uptane is best understood as two distinct artifacts:
1. **The specification** ([uptane/uptane-standard](https://github.com/uptane/uptane-standard)) - a governance/spec-text repository (Markdown -> RFC XML -> HTML/PDF/plaintext via `kramdown-rfc2629` and `xml2rfc`). It contains no source code of any kind (no C/C++/Rust/asm) and produces no compiled or binary artifacts.
2. **The reference implementation and BSP tooling** ([uptane/aktualizr](https://github.com/uptane/aktualizr), a C++ OTA client, and [uptane/meta-updater](https://github.com/uptane/meta-updater), a Yocto/OpenEmbedded BSP layer that packages aktualizr for target boards) - this is the actual deployable software.

**Governance model.** `uptane-standard` follows the Community Specification process (`governance/05-governance.md`): roles are Maintainer(s), Editor(s), and Participants (contributing under a CLA), decisions by consensus. Overriding that is the Uptane Standards Committee, which meets biweekly and approves releases by voice vote or mailing-list majority. Explicitly, "neither an individual nor corporate membership in this organization is required to be active in the Uptane community" - there is no paid membership tier. License is the Community Specification License 1.0.

**Corporate/organizational contributors** (from commit history and the adopters page, not a MAINTAINERS file):
- **HERE Technologies** (via Advanced Telematic Systems) - Jon Oster, heaviest non-academic committer (71+8 commits); HERE OTA Connect is a major Uptane implementation.
- **NYU Tandon** - Justin Cappos (co-creator of TUF/Uptane), Lois Anne DeLong, Marina Moore.
- **Datadog** - Trishank Kuppusamy (TUF/Uptane security lead, post-NYU).
- **Toyota Motor North America** - Allen Cain (12 commits).
- **Toradex** - later commits relate to Torizon, an "Uptane-as-a-service" embedded Linux offering.
- **Foundries.io** - Ricardo Salveti, active `meta-updater` contributor (including the RISC-V board-support work, see Section 2).
- Adopters page also lists Automotive Grade Linux (AGL), Airbiquity (OTAmatic), and GENIVI (via aktualizr integration).

**Community stance on new ports.** No PLATFORMS.md/SUPPORT.md or explicit written policy on adding new hardware/architecture ports exists. `meta-updater`'s general contribution bar (per its CONTRIBUTING.adoc) is: the OTA build succeeds and boots on the platform touched, `oe-selftest` passes, and updates are forward/backward compatible. There is no separate architecture-tier or RFC-style gate for a new machine/ISA port.

## 2. Port History and Upstreaming Timeline

RISC-V support does not exist in `uptane-standard` (architecture is not applicable to an abstract specification). It lives entirely in `uptane/meta-updater`, targeting the SiFive HiFive Unleashed / FU540 board ("freedom-u540").

| Date | Event | Source |
|---|---|---|
| 2019-07-24 / merged 2019-07-25 | Initial RISC-V board support: "sota: add support for freedom-u540", authored by Ricardo Salveti (Foundries.io) | [PR #565](https://github.com/uptane/meta-updater/pull/565) |
| 2019-07-25 / merged 2019-07-29 | Follow-up: "freedom-u540: Remove the fitImage overrides", by Alistair Francis (Western Digital), noting the separate `meta-riscv` Yocto layer now generates the fitImage by default | [PR #570](https://github.com/uptane/meta-updater/pull/570) |
| merged 2025-10-14 | "Update ostree, aktualizr and layer syntax to be compatible with whinlatter" - ports the freedom-u540/RISC-V fitimage code to the new Python-based Yocto class | [PR #143](https://github.com/uptane/meta-updater/pull/143) |
| opened 2026-09-07, open (unmerged) as of 2026-09-08 | "sota: use KERNEL_CONSOLE for platform defaults" - touches Freedom U540/RISC-V among other platforms | [PR #226](https://github.com/uptane/meta-updater/pull/226) |

**Key contributors and orgs:** Ricardo Salveti (Foundries.io) authored the original board support and a later 2025 maintenance update to the fitImage class logic (covering both `freedom-u540` and Raspberry Pi machines together); Alistair Francis (Western Digital) contributed the fitImage-override cleanup. Support depends on the upstream `meta-riscv` Yocto BSP layer for board bring-up (u-boot, OpenSBI) rather than reimplementing it in `meta-updater`.

**Is it fully upstream?** Yes, in the narrow sense that all merged work (#565, #570, #143) lives in the `uptane/meta-updater` mainline with no fork required. Support persists today as `classes/sota_freedom-u540.bbclass` and `conf/include/bblayers/sota_freedom-u540.inc`. However, this is Yocto BSP-layer support for one specific RISC-V board, not general riscv64 CI validation or a distributable riscv64 release artifact (see Sections 3, 7, 8).

## 3. Upstream Support Tier

There is no formal tier policy document for architecture support in either `uptane-standard` or `meta-updater`. Support tiers, to the extent they exist, are implicit: a machine/board either has a BSP config merged into `meta-updater` or it does not.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | N/A (uptane-standard has no compiled code for any arch; `.github/workflows/main.yml` runs on `ubuntu-latest`/x86_64 for docgen only) | No CI evidence found for `meta-updater`/`aktualizr` | No CI evidence found |
| CI tests | N/A / not found | Not found | Not found |
| Release-blocking | No | No | No |
| Official binaries | uptane-standard ships only spec documents (`.html/.pdf/.md/.txt/.xml`); no compiled Uptane software binaries for any architecture were found on any channel | Same as amd64 - none found | Same as amd64 - none found |
| Board-level merged support | N/A | N/A (arm64 boards are supported per-machine in `meta-updater`, not assessed here) | Yes - `freedom-u540` (SiFive HiFive Unleashed), merged 2019, maintained 2025 |

Evidence: `.github/workflows/main.yml` in `uptane/uptane-standard` (full content reproduced in Section 7) is the only CI file in the repository; `meta-updater` has [no GitHub Releases or tags](https://github.com/uptane/meta-updater/releases) ("There aren't any releases here"), confirmed independently against `/tags` as well.

## 4. Technical Architecture and RISC-V-Specific Subsystems

`uptane-standard` contains zero architecture-specific components of any kind (no JIT, no SIMD, no crypto implementation, no assembly) - it is Markdown spec text. A full repo-wide case-insensitive grep for `riscv`, `amd64`, `arm64`, `x86`, and `__riscv` across all 15 tracked files (`CONTRIBUTING.md`, `Dockerfile`, `Dockerfile-CI`, `LICENSE`, `Makefile`, `README.md`, `SECURITY.md`, `_config.yml`, `ci-entrypoint.sh`, `governance/*.md`, `release-artifacts/*.html`, `uptane-standard.md`) returned zero matches for every one of these tokens, on every architecture, not just riscv64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | N/A - not present in this codebase | N/A | N/A |
| SIMD | N/A | N/A | N/A |
| Crypto (Uptane metadata signing) | Delegated to dependencies (OpenSSL, libsodium - see Section 9); no architecture-specific code in Uptane itself | Same | Same |
| Assembly / GC barriers | None | None | None |
| Board bring-up (BSP, in `meta-updater`) | N/A - not a board-support concept for a general-purpose CPU arch | Multiple boards merged (not itemized in this research) | One board merged: `freedom-u540` ([PR #565](https://github.com/uptane/meta-updater/pull/565)), relies on upstream `meta-riscv` for u-boot/OpenSBI |

**Conclusion:** riscv64 support in the Uptane project is not a "stub vs. complete implementation" question at the code level - there is no architecture-specific software implementation category in `uptane-standard` for any ISA. The one real riscv64-specific artifact anywhere in the Uptane ecosystem is the `freedom-u540` Yocto machine configuration in `meta-updater`, which is a board-integration layer, not a compiler/runtime/crypto subsystem.

## 5. Build System, Cross-Compilation, and Toolchain

**`uptane-standard`:** The entire build pipeline converts `uptane-standard.md` to RFC XML via [kramdown-rfc2629](https://github.com/cabo/kramdown-rfc2629) (Ruby gem), then to HTML/plaintext via [xml2rfc](https://xml2rfc.tools.ietf.org/) (Python). Makefile targets: `html`, `xml`, `plaintext`, `open`, and `-docker` variants. The `Dockerfile` (base `ruby:alpine`) installs `xml2rfc` via pip and `kramdown-rfc2629` via gem; `Dockerfile-CI` adds `git`/`make` and an entrypoint script that publishes to `gh-pages`. Neither Dockerfile references any architecture, `--platform` flag, `TARGETARCH`, or QEMU. No compiler is invoked anywhere in this pipeline, so there is no minimum-compiler-version requirement and no cross-compilation concept applies. No riscv64 build failures exist because no build targets any CPU architecture at all.

**`meta-updater`:** Build documentation was not directly re-verified in this research pass (repo not in this session's GitHub MCP allow-list, and not cloned), but the merged PRs (#565, #570, #143) indicate the RISC-V build path is a standard Yocto/bitbake recipe build (`bitbake core-image-...` against a `freedom-u540` MACHINE target), depending on the separate `meta-riscv` layer for the toolchain, u-boot, and OpenSBI bring-up. No QEMU-based CI or cross-compilation-only CI job for riscv64 was found for this repo (see Section 7).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Spec document availability | Yes (architecture-irrelevant) | Yes | Yes |
| Reference client (aktualizr) runs | No riscv64-specific blocker found in aktualizr's own PRs/commits (zero riscv/riscv64 hits); portability rests on its dependencies (Section 9), all of which have riscv64 packages | Not itemized in this research | Not itemized in this research; dependency chain (OpenSSL, libcurl, SQLite, libsodium, libarchive, libostree, Boost, asn1c) resolves in Ubuntu 26.04 riscv64 (ports) with no known blocking issues |
| Board-level Yocto BSP integration (`meta-updater`) | N/A | Multiple boards (not itemized) | One board: `freedom-u540` only |
| Official binary/package (any channel) | None found | None found | None found |

**Functional gaps:** No riscv64-specific functional gap was identified in aktualizr itself - its dependencies build cleanly on riscv64. The gap is one of validation and packaging, not of missing functionality: nobody runs aktualizr's test suite on riscv64 in CI, and nobody publishes a riscv64 binary or package for any Uptane component.

**Performance gaps:** Data not available: no riscv64 performance benchmarks for Uptane/aktualizr were found in any source searched (GitHub, general web search, riseproject.dev). Uptane is not a performance-differentiated project; this is consistent with its purpose (security/OTA-update integrity, not throughput).

**Security hardening gaps:** No riscv64-specific security hardening issue was found for Uptane or aktualizr. Its cryptographic operations are delegated to OpenSSL and libsodium, both of which have riscv64 vector-crypto support (see Section 9).

**NaN / floating-point semantics issues:** Not applicable - Uptane's metadata format and signature verification logic do not depend on floating-point semantics; no such issue was found in any source searched.

## 7. CI/CD Infrastructure

**`uptane-standard`** - complete content of the only CI file in the repository, `.github/workflows/main.yml` (verified twice: once via a fresh shallow clone, once via direct `raw.githubusercontent.com` fetch, byte-identical):

```yaml
name: 'Uptane Standard CI Job'

on:
  push:
    branches:
      - master

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Build and publish artifacts
        env: 
          ACCESS_TOKEN: ${{ secrets.GITHUB_ACCESS_TOKEN }}
        uses: docker://uptane/uptane-standard-ci
```

- Trigger: `push` to `master` only (no `pull_request`, `workflow_dispatch`, or `schedule`).
- Runner: `ubuntu-latest` (x86_64 GitHub-hosted). No self-hosted riscv64 runner, no QEMU setup action, no `buildx --platform` usage.
- Job: renders and publishes the spec document via a Docker container. No test execution occurs in this job at all (it is a docgen/publish job, not a test job), for any architecture.
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `azure-pipelines.yml`, or `.circleci/` directory exists in this repository (confirmed by direct filesystem search of a full clone).

**`meta-updater`:** No CI configuration was directly re-inspected in this research pass. No evidence of a riscv64 CI job was found in the PR/commit search performed (the search covered PR titles, merge status, and dates, not workflow file contents for this repo, since it is outside this session's GitHub MCP allow-list).

**RISE runners:** No evidence found that RISE-provided RISC-V CI runners are used by `uptane-standard`, `aktualizr`, or `meta-updater`. No RISE blog post, wheel-builder listing, or org repository references Uptane in any capacity (see Section 12).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds (uptane-standard) | Yes (docgen job on `ubuntu-latest`) | No | No |
| CI tests (uptane-standard) | No (no test step exists for any arch) | No | No |
| CI builds (meta-updater) | Data not available: workflow files not inspected in this pass | Data not available | Data not available; no evidence of a dedicated riscv64 CI job found |
| Hardware used | GitHub-hosted x86_64 runner | N/A | N/A - no riscv64 CI job found |

## 8. Distribution and Release Status

- **GitHub Releases, `uptane-standard`:** the last 6 releases (2.1.0, 2.0.0, 1.2.0, 1.1.0, 1.0.1, 1.0.0) ship only spec-document assets (`.html`, `.pdf`, `.md`, `.txt`, `.xml`) - [releases page](https://github.com/uptane/uptane-standard/releases). No binary or wheel assets of any kind, on any architecture.
- **GitHub Releases/tags, `meta-updater`:** none exist at all ([releases](https://github.com/uptane/meta-updater/releases), [tags](https://github.com/uptane/meta-updater/tags) both confirm "There aren't any releases here"). This is a Yocto BSP layer, versioned by branch/codename (e.g., compatible with the "whinlatter" Yocto release as of [PR #143](https://github.com/uptane/meta-updater/pull/143)), not by tagged release.
- **PyPI:** `https://pypi.org/pypi/uptane/json` returns HTTP 404 - no package named `uptane` exists on PyPI under this exact name. `https://pypi.org/simple/uptane/` also 404s.
- **RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/uptane/` returns HTTP 302, redirecting to the (404) PyPI simple index - no wheels exist because no upstream PyPI package exists.
- **Ubuntu 26.04 ("resolute"):** [package search](https://packages.ubuntu.com/search?keywords=Uptane&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results." No `uptane`, `python3-uptane`, or `libuptane` package exists for any architecture.
- **Arch Linux RISC-V:** the `archriscv.felixc.at` status page and the live `core`/`extra`/`unsupported` riscv64 repo indexes were grepped directly for "uptane" - zero matches in all three.

**What a user must do to get a working binary today:** There is no official binary of any kind for "Uptane" (the standard) on any channel or architecture. To obtain a running Uptane-based OTA client on riscv64, a user would need to build `aktualizr` from source against its dependencies (all of which are available as riscv64 packages in Ubuntu 26.04, per Section 9) and, for embedded board deployment, build a Yocto image using `meta-updater`'s `freedom-u540` machine configuration together with the upstream `meta-riscv` layer. No prebuilt image or package exists for this path.

## 9. Dependencies

Scoping note: `uptane-standard` has no build manifest of any kind (no CMakeLists.txt, setup.py, go.mod, Cargo.toml, package.json). The dependency analysis below is for `uptane/aktualizr`, the C++ reference implementation that `meta-updater` packages, pulled from its `CMakeLists.txt` and `thirdparty.spdx`.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| [OpenSSL](https://github.com/openssl/openssl) | TLS to Director/Image repos, signature verification | Mainline since May 2022; full Zvk vector-crypto suite, RVV SHA512 | Has a riscv64 CI runner (OS Zoo) with intermittent flakiness | Shipped in all current release branches (3.0-4.0 LTS/dev); Ubuntu 26.04 `libssl-dev` 3.5.5-1ubuntu3 (ports) | None blocking; open perf/robustness issues only (`test_lhash` flaky #30880, musl ext-detection #28118) |
| [libcurl](https://github.com/curl/curl) | HTTPS transport, image download | Fully upstream since the June 2022 atomics fix | riscv64 is a live CI cross-compile target | No downstream fork; Ubuntu 26.04 `libcurl4-openssl-dev` 8.18.0-1ubuntu2 (ports) | No open blockers; routine compiler-warning cleanup only |
| [SQLite](https://sqlite.org/) | Local metadata/inventory DB | Pure portable C, no asm/SIMD/JIT | No dedicated riscv64 CI; maintainers state no riscv hardware access | Ubuntu 26.04 `libsqlite3-dev` 3.46.1-9 (ports) | One historical riscv32 (not riscv64) bug, fixed same day |
| [libsodium](https://github.com/jedisct1/libsodium) | Ed25519 sign/verify for TUF/Uptane metadata | Portable reference C (ref10 curve25519), no arch-specific asm needed | No riscv64-specific CI evidence found | Ubuntu 26.04 `libsodium-dev` 1.0.18-2 (ports) | No riscv64 issues found (search returned only ARM/s390x/ppc64 noise) |
| [libarchive](https://github.com/libarchive/libarchive) | Extracts/verifies update bundles (OSTree delivery) | Portable C | No riscv64-specific CI evidence found | Ubuntu 26.04 `libarchive-dev` 3.8.5-1ubuntu2 (ports) | No riscv64-specific issues found |
| [libostree](https://github.com/ostreedev/ostree) | Primary real-world OTA delivery backend (optional `BUILD_OSTREE`) | Architecture-agnostic content-addressed store logic | No riscv64-specific CI evidence found | Ubuntu 26.04 `libostree-dev` 2025.7-3build1 (ports) | 0 riscv64 hits found |
| Boost (filesystem, log, program_options) | Core utilities: config, logging, filesystem ops | Long-standing GCC/riscv64 support | No riscv64-specific CI evidence found | Ubuntu 26.04 `libboost-log-dev` 1.90.0.1ubuntu3 (ports, implies full riscv64 Boost stack) | Search noise only (unrelated ppc64le/perf issues) |
| asn1c | Build-time only: generates C stubs for DER/ASN.1 encoding of Uptane metadata | Small, portable host tool | N/A (build-time only) | Ubuntu 26.04 `asn1c` 0.9.28+dfsg-6 (main/universe, not ports-restricted) | None found |
| jsoncpp (vendored, pinned 1.8.4) | JSON parsing for server comms | Portable C++, no known riscv issues | - | - | Vendored copy, not linked as a system package |
| googletest (vendored, test-only) | Unit testing only | N/A | - | - | Test-only, excluded from critical-dependency ranking |

**Bottom line:** None of aktualizr's critical native dependencies have a known blocking riscv64 issue. OpenSSL and libcurl (the crypto/network-heaviest dependencies) have mature, actively-maintained riscv64 ports with vector-crypto acceleration; the rest are portable C/C++ with no riscv-specific defects found. Every dependency resolves in Ubuntu 26.04 riscv64 (resolute, ports archive) today. The gap is test coverage, not build support: SQLite explicitly has no riscv hardware in its own CI, and libsodium/libarchive/libostree/Boost show no evidence of dedicated riscv64 CI at all.

[NEEDS VERIFICATION]: the `project-graph` MCP server (which would provide the `hasDependency` transitive-closure query, e.g. for zlib/zstd/xz/lz4/gnutls pulled in via libcurl/libostree) failed to connect (`CONNECTION_CLOSED`) throughout this research and could not be queried. This is a tooling gap, not evidence of absence.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue exists in `uptane-standard` | N/A | N/A | A full grep of all 112 issues in the repo for "risc" (case-insensitive) returned zero matches - see [issues](https://github.com/uptane/uptane-standard/issues) |
| [PR #226](https://github.com/uptane/meta-updater/pull/226) | sota: use KERNEL_CONSOLE for platform defaults (touches Freedom U540/RISC-V among other platforms) | Open, unmerged (opened 2026-09-07) | Low/enhancement (build-config default, not a correctness fix) | Only open riscv64-touching item found anywhere in the Uptane org |

No correctness bugs specific to riscv64 were found for Uptane, aktualizr, or meta-updater in any source searched. No riscv64 performance benchmarks or bug reports exist for Uptane in GitHub issues, general web search, or riseproject.dev, as far as it could be fetched (its blog listing is a client-side-rendered shortcode that could not be fully enumerated via WebFetch - a manual browser check is the one gap this could not close).

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer or committee statement rejecting or deprioritizing riscv64 support was found anywhere in `uptane-standard`, `aktualizr`, or `meta-updater`.

**Technical blockers:** None identified at the dependency level (Section 9). The practical blocker is an absence of investment rather than a known defect: no upstream CI exercises riscv64 for `aktualizr` or `meta-updater`, and no release channel (PyPI, Ubuntu, Arch, GitHub Releases) publishes a riscv64 (or any-architecture) Uptane binary.

**Organizational blockers:** `uptane-standard`'s governance has no formal policy gating new architecture ports; `meta-updater`'s bar for a new machine is the general Yocto contribution checklist (build+boot+update verification, DCO sign-off, `oe-selftest`), reviewed and merged by existing maintainers (historically Patrick/Patti Vacek merged the `freedom-u540` PRs). There is no committee-level "architecture tier" review process that would need to be petitioned.

**RISE involvement:** None. Checked: [riseproject.dev/blog](https://riseproject.dev/blog) (post titles/summaries, no Uptane mention), the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) (80+ riscv64 packages listed, no Uptane), WebSearch queries "RISE project Uptane riscv64" and "riseproject.dev Uptane" (no connection found), and a GitHub org-wide code search across all 25 `riseproject-dev` repos (0 hits for `Uptane`, except one unelaborated backlog line item in `riseproject-dev/sw-ecosystem/project-reports/.queue.yml` listing Uptane as a queued-but-unauthored candidate). This is a backlog entry, not evidence of funding, blog coverage, or runner usage.

**Acceptance probability:** Given the absence of any stated objection and the precedent of three already-merged RISC-V board-support PRs in `meta-updater` (2019, 2019, 2025), a well-formed PR adding riscv64 CI to `aktualizr` or `meta-updater` would likely be accepted on technical merit - there is no organizational resistance on record. However, no such PR currently exists, and no party (upstream, RISE, or a distro) has undertaken this work.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** `uptane-standard` (the specification repository) has no CI that builds or tests any architecture beyond a single x86_64 docgen job ([`.github/workflows/main.yml`](https://github.com/uptane/uptane-standard/blob/master/.github/workflows/main.yml)) and ships only spec-text release assets, never binaries, for any architecture. The actual deployable software in the Uptane ecosystem, `uptane/meta-updater`, has real, upstream-merged RISC-V board-support code (the `freedom-u540` machine, [PR #565](https://github.com/uptane/meta-updater/pull/565), [PR #570](https://github.com/uptane/meta-updater/pull/570), [PR #143](https://github.com/uptane/meta-updater/pull/143)) but no CI validating riscv64 and no releases or tags of any kind ([releases](https://github.com/uptane/meta-updater/releases), [tags](https://github.com/uptane/meta-updater/tags)). No distribution (PyPI, Ubuntu, Arch) packages Uptane for any architecture, so the distribution floor (Section 4 of the color model) does not apply - there is no package to check for patches. This is "no upstream CI, no consumable release, but positive evidence of a real riscv64 code path" - orange rather than grey (this is not an unknown-unknown; concrete merged code and PR history exist) and not yellow (no distro ships an unpatched build to confirm a clean build). This project is not optimization-purpose (it is a security/OTA-update framework, not a performance-differentiated library), so the Step 2 optimization modifier and Optimization level header field do not apply.
- **Pending work that could change the grade:** [PR #226](https://github.com/uptane/meta-updater/pull/226) is open and touches the Freedom U540/RISC-V platform (unmerged as of 2026-09-08); if merged it would not by itself change the color (it is a config-default change, not a CI or release addition). No RISE-funded work or CI-runner engagement exists yet for Uptane beyond an unauthored backlog entry in `riseproject-dev/sw-ecosystem/project-reports/.queue.yml` - adding upstream riscv64 CI to `aktualizr` and/or `meta-updater`, or a RISE-hosted build/test job, would be the concrete step that could move this to yellow (build-only) or blue (build+test, no upstream release) per the color model.

## 14. Investment Analysis

Before sizing: RISE has done no work on Uptane to date (Section 12) - there is no existing RISE investment to net out. All of the following is unfunded, greenfield work.

### 14.1 Functional Enablement

No functional blocker exists in `aktualizr`'s dependency chain (Section 9) - all critical dependencies already build on riscv64 in Ubuntu 26.04. The functional enablement work needed is: (1) confirm `aktualizr` itself builds and its test suite passes on riscv64 (currently unverified - zero riscv64 CI evidence and zero riscv64-tagged issues/PRs in that repo), and (2) exercise the existing `freedom-u540` Yocto machine config in `meta-updater` end-to-end on current `meta-riscv`/OpenSBI/u-boot versions, since the most recent maintenance touch was in 2025 ([PR #143](https://github.com/uptane/meta-updater/pull/143)) and board-support layers bitrot without regular exercise.

### 14.2 Performance Optimization

Not applicable in the traditional sense - Uptane is not a performance-differentiated project (Section 6). No RISC-V-specific optimization work is warranted; standard scalar builds of the dependency stack (OpenSSL, libcurl, etc.) are sufficient, and those dependencies already carry riscv64 vector-crypto acceleration upstream where relevant (OpenSSL's Zvk suite).

### 14.3 CI/CD Infrastructure

The single highest-leverage investment: add a riscv64 build+test job for `aktualizr` (the reference client) and a riscv64 Yocto build job in `meta-updater` exercising the `freedom-u540` machine, ideally on RISE-hosted RISC-V CI runners ([RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). This alone, if it builds and passes tests, would move the color from orange to blue (no upstream release yet) per the model.

### 14.4 Ecosystem Enablement

No package ecosystem exists for Uptane (no PyPI package, no npm package - see Section 8), so there is no dependent-package enablement work to size; Section 10 is correspondingly omitted from this report per the reporting template's scope rule.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify `aktualizr` builds and its unit/integration test suite passes on riscv64; file/fix any issues found | 1-2 | Upstream (aktualizr maintainers) or RISE-sponsored contributor | High |
| Functional | Rebuild and boot-test the `freedom-u540` Yocto image end-to-end on current `meta-riscv`/OpenSBI/u-boot to confirm the 2025-updated fitImage class logic still works | 1-2 | Upstream (meta-updater maintainers, e.g. Foundries.io) | Medium |
| CI/CD | Add a riscv64 build+test CI job for `aktualizr` (GitHub Actions, native or RISE runner) | 1-2 | RISE-sponsored contribution or upstream PR | Critical |
| CI/CD | Add a riscv64 Yocto CI job in `meta-updater` exercising `freedom-u540` | 2-3 | RISE-sponsored contribution or upstream PR | High |
| Distribution | Package `aktualizr` for Ubuntu/Debian riscv64 (no such package exists today, for any architecture) | 2-4 | Distro packager or RISE | Low (no existing package for any arch, so this is greenfield packaging work, not a riscv64-specific gap) |
| Ecosystem | None - no dependent package ecosystem exists | 0 | N/A | N/A |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [uptane/uptane-standard](https://github.com/uptane/uptane-standard) - specification repository
- [Uptane homepage](https://uptane.github.io/)
- [uptane-standard CI workflow](https://github.com/uptane/uptane-standard/blob/master/.github/workflows/main.yml)
- [uptane-standard releases](https://github.com/uptane/uptane-standard/releases)
- [uptane-standard issues](https://github.com/uptane/uptane-standard/issues)
- [uptane/meta-updater](https://github.com/uptane/meta-updater) - Yocto BSP layer
- [meta-updater releases](https://github.com/uptane/meta-updater/releases) (none exist)
- [meta-updater tags](https://github.com/uptane/meta-updater/tags) (none exist)
- [PR #565 - sota: add support for freedom-u540](https://github.com/uptane/meta-updater/pull/565)
- [PR #570 - freedom-u540: Remove the fitImage overrides](https://github.com/uptane/meta-updater/pull/570)
- [PR #143 - Update ostree, aktualizr and layer syntax to be compatible with whinlatter](https://github.com/uptane/meta-updater/pull/143)
- [PR #226 - sota: use KERNEL_CONSOLE for platform defaults](https://github.com/uptane/meta-updater/pull/226)
- [uptane/aktualizr](https://github.com/uptane/aktualizr) - C++ reference implementation
- [PyPI uptane package lookup](https://pypi.org/pypi/uptane/json) (404, package does not exist)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) (no Uptane entry)
- [RISE Python wheel index for uptane](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/uptane/) (redirects to a 404)
- [Ubuntu 26.04 (resolute) package search for Uptane](https://packages.ubuntu.com/search?keywords=Uptane&suite=resolute&searchon=names&section=all) (no results)
- [Arch Linux RISC-V status](https://archriscv.felixc.at/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject.dev](https://riseproject.dev)
- [riseproject.dev members](https://riseproject.dev/members/)
- [OpenSSL](https://github.com/openssl/openssl)
- [curl](https://github.com/curl/curl)
- [SQLite](https://sqlite.org/)
- [libsodium](https://github.com/jedisct1/libsodium)
- [libarchive](https://github.com/libarchive/libarchive)
- [libostree](https://github.com/ostreedev/ostree)