---
title: Mosquitto
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: jemalloc
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="mosquitto" %}

# Mosquitto

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Mosquitto<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Eclipse Mosquitto is an open-source MQTT message broker, plus client libraries (`libmosquitto`, `libmosquittopp`) and command-line tools (`mosquitto_pub`, `mosquitto_sub`, `mosquitto_ctrl`, `mosquitto_passwd`), implementing MQTT versions 5.0, 3.1.1, and 3.1. It is written in portable ISO C99/C11 with no architecture-specific code paths.

**Governance:** Mosquitto is an Eclipse Foundation project under the Eclipse IoT working group (project ID `iot.mosquitto`), with lifecycle status "Mature" on the Eclipse project page. It is dual-licensed EPL-2.0 OR BSD-3-Clause (EDL-1.0), per `NOTICE.md`. Contributions require signing the Eclipse Contributor Agreement (ECA) and DCO-style `Signed-off-by` commits; per `CONTRIBUTING.md`, self-authored patches under 1,000 lines can merge directly, larger or third-party contributions go through Eclipse's IP-review process.

**Committers:** Roger Light (project lead/founder, 2009), Tatsuzo Osawa, Pierre Fersing, Ian Craggs, per the [Eclipse project "who" page](https://projects.eclipse.org/projects/iot.mosquitto/who).

**Corporate sponsors:** Commit-author analysis of the full git history (4,884 commits, 2014-2026) shows Roger Light contributing roughly 89% of commits, split between his personal `atchoo.org` address and a `cedalo.com` address. Cedalo GmbH (cedalo.com), which Roger Light co-founded, employs the effective core dev team (Norbert Heusser, Serhii Orlivskyi, Kai Buschulte, Steve Hamann contribute the next-largest share) and sells "Pro Mosquitto," a commercial edition, plus paid support, while the open-source project remains formally under Eclipse Foundation governance. No other company appears as a maintainer-level sponsor. Independent contributors include Karl Palsson (etactica.com) and Pierre Fersing (bleemeo.com).

**Community culture on new ports:** Low-friction and informal. Because the codebase requires no architecture-specific changes, "porting" reduces to CI/packaging additions. Maintainer @ralight has responded promptly and positively to riscv64-related requests in the past (see Section 2), but there is no formal supported-platforms tier document, and the current riscv64 CI proposal has sat unreviewed for several months (Section 12).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-03-03 | [Issue #3224](https://github.com/eclipse-mosquitto/mosquitto/issues/3224) opened by @xypron (Heinrich Schuchardt): official snap package missing riscv64 build; local snap build "runs fine, no source changes needed" | [Issue #3224](https://github.com/eclipse-mosquitto/mosquitto/issues/3224) |
| 2025-03-08 | Issue #3224 closed: maintainer @ralight enables riscv64 in Launchpad snap-build settings and confirms a working edge-channel build; fix is entirely external (Launchpad config), no in-repo commit | [Issue #3224](https://github.com/eclipse-mosquitto/mosquitto/issues/3224) |
| 2025-06-29 | [Issue #3295](https://github.com/eclipse-mosquitto/mosquitto/issues/3295) opened by @peterwillcn: general request/report on riscv64 (OrangePi-r2s) support | [Issue #3295](https://github.com/eclipse-mosquitto/mosquitto/issues/3295) |
| 2025-07-01 | Issue #3295 closed as completed: maintainer @ralight confirms "the mosquitto snap package supports risc-v already as well"; contributor @karlp notes Mosquitto is "just C" and "runs everywhere," pointing to Alpine's riscv64 packaging | [Issue #3295](https://github.com/eclipse-mosquitto/mosquitto/issues/3295) |
| 2026-03-20 | [Issue #3545](https://github.com/eclipse-mosquitto/mosquitto/issues/3545) opened by @gounthar: "Add riscv64 to CI build matrix," reporting Mosquitto 2.1.2 builds/runs on riscv64 with zero source changes (validated on RISE's `ubuntu-24.04-riscv` runner and on a BananaPi F3) | [Issue #3545](https://github.com/eclipse-mosquitto/mosquitto/issues/3545) |
| 2026-03-20 | [PR #3546](https://github.com/eclipse-mosquitto/mosquitto/pull/3546) opened by @gounthar: "ci: add riscv64 native build workflow," adding a non-blocking (`continue-on-error: true`) CI job on RISE's native riscv64 runner. Closes #3545, references #3224. Still open/unmerged as of this report | [PR #3546](https://github.com/eclipse-mosquitto/mosquitto/pull/3546) |

**Key contributors and orgs:**
- @xypron (Heinrich Schuchardt) - independent, known RISC-V/U-Boot developer - filed the first riscv64-specific issue (#3224).
- @peterwillcn - independent user, filed #3295.
- @gounthar (Bruno Verachten) - independent, first-time contributor to this repo - authored the tracking issue #3545 and the CI PR #3546; had to sign the ECA before the PR could be filed.
- @ralight (Roger Light, project lead, Cedalo) - responded to and resolved both closed riscv64 issues but has not yet reviewed/merged PR #3546.

**Is it fully upstream?** No. The only in-repo riscv64 artifact anywhere in the git history is the unmerged `.github/workflows/alt-arch-riscv64.yml` file added by PR #3546. No commit on the default branch (`master`, HEAD `6aaba32614eb1160ddbfeafd616f9f67e7914a41`) references "riscv" in any form - confirmed by a full-history `git log -S/-G "riscv"` search and a repo-wide case-insensitive grep returning zero matches. The two closed issues were resolved entirely outside the git repository (Launchpad snap-recipe configuration), leaving no trace in the source tree.

## 3. Upstream Support Tier

**Formal tier policy:** None exists. Neither Mosquitto nor the Eclipse Foundation publishes a supported-platforms/architecture-tier document. The Eclipse "Mature" lifecycle status is a general project-maturity rating, not an architecture-specific one.

**Evidence:**
- **CI:** No riscv64 CI runs today. All 14 GitHub Actions workflows (`cifuzz.yml`, `codeql-analysis.yml`, `coverage.yml`, `coverity-scan-develop.yml`, `coverity-scan-fixes.yml`, `delete-old-workflow-runs.yml`, `issue-labler.yml`, `linux-asan.yml`, `linux-build-variants.yml`, `linux.yml`, `lock.yml`, `macos.yml`, `mosquitto-make.yml`, `windows.yml`) run exclusively on `ubuntu-latest`, `macos-latest`, or `windows-2022` runners. A riscv64 job exists only in the unmerged [PR #3546](https://github.com/eclipse-mosquitto/mosquitto/pull/3546).
- **Release-blocking:** N/A - no CI job of any kind is release-blocking for architecture in this project's workflow set beyond the standard cross-platform build/test matrix, and no riscv64 job exists to be blocking or non-blocking in practice today.
- **Official binaries:** None exist for any architecture - the [GitHub Releases page](https://github.com/eclipse-mosquitto/mosquitto/releases) states "There aren't any releases here." Mosquitto is distributed as source plus OS packages, not GitHub release binaries.

**Comparison table:**

| Architecture | Upstream CI builds | Upstream CI tests | Upstream release artifact |
|---|---|---|---|
| amd64 | Yes (`linux.yml`, `linux-build-variants.yml`, `linux-asan.yml`, `macos.yml`, `windows.yml`) | Yes (same workflows) | No (no GitHub Releases exist for any arch) |
| arm64 | Not independently verified in this research pass [NEEDS VERIFICATION] | Not independently verified [NEEDS VERIFICATION] | No |
| riscv64 | No (0 riscv references in any of the 14 workflow files at HEAD) | No | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Mosquitto has **no architecture-specific subsystems of any kind, for any architecture**. Targeted `search_code` queries against the repository for architecture-guard and SIMD/intrinsics patterns all returned zero hits:

| Query | Hits |
|---|---|
| `__riscv` | 0 |
| `__x86_64__` | 0 |
| `__aarch64__` | 0 |
| `__arm__` | 0 |
| `__amd64__` / `SSE2` / `NEON` / `AVX` | 0 |
| assembly files (`extension:s`) | 0 |
| `CMAKE_SYSTEM_PROCESSOR` | 0 |

There is no JIT, no hand-written SIMD, no in-tree cryptographic kernel, and no GC (Mosquitto is not garbage-collected). Cryptography is delegated entirely to OpenSSL (Section 9), a dependency outside this repository. The project's portability comes from writing generic, standard-conforming C, not from maintaining per-architecture code paths - amd64 and arm64 do not get hand-tuned implementations either.

**Comparison table (per architecture, scalar vs hand-tuned):**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core broker logic | Scalar C (generic) | Scalar C (generic) | Scalar C (generic) |
| Crypto/TLS | Delegated to OpenSSL (see Section 9) | Delegated to OpenSSL | Delegated to OpenSSL |
| JSON parsing (cJSON) | Scalar C | Scalar C | Scalar C |
| Networking | POSIX sockets, no arch-specific paths | Same | Same |

This project is **not** optimization-purpose (Section 2 modifier does not apply): its value proposition is protocol-correct MQTT broking, not raw compute throughput, so the absence of RISC-V-specific hot-path code is not a differentiated gap versus amd64/arm64 - all three architectures get the identical generic implementation.

## 5. Build System, Cross-Compilation, and Toolchain

**Build commands (from PR #3546 and README-compiling.md), generic - no riscv64-specific flags exist:**
```
cmake .. -DCMAKE_BUILD_TYPE=Release -DWITH_TESTS=OFF
make -j$(nproc)
```
or, per-distro: `make` directly via `config.mk` on non-Windows/Mac platforms.

**Toolchain requirements:** `cmake_minimum_required(VERSION 3.24)`. No minimum GCC/Clang version is stated anywhere in the repository; the C/C++ standard is set via `CMAKE_C_STANDARD`/`CMAKE_CXX_STANDARD` (C99/C++17), satisfied by any modern GCC or Clang. Build-time dependencies used in the riscv64 validation build (Ubuntu 24.04): `build-essential cmake libssl-dev libcjson-dev libsqlite3-dev libargon2-dev libreadline-dev docbook-xsl xsltproc pkg-config`.

**QEMU usage:** None found in-repo. PR #3546's author notes QEMU (`docker/setup-qemu-action`) as a fallback option if maintainers decline to install the RISE native-runner GitHub App, but this is a proposal, not an implemented path.

**Known build failures:** [Issue #3183](https://github.com/eclipse-mosquitto/mosquitto/issues/3183) ("mosquitto 2.0.20 fails to build on Linux without threads," closed, fixed in 2.0.21) was reported by a user with a `riscv64-buildroot-linux-uclibc-gcc` toolchain, but the underlying bug (missing `mutex` struct member / stray `pthread_*` calls when `WITH_THREADING=no`) was not riscv-specific - it affected any platform building with threading disabled. No riscv64-specific build failure is documented anywhere.

**Explicit build documentation:** None. A full check of `README.md`, `README-compiling.md`, root `CMakeLists.txt` (396 lines), the `cmake/` directory (only `FindCUnit.cmake`, `FindLineEditing.cmake`, `Findargon2.cmake` - no toolchain files), and the `docker/` directory (single-arch Dockerfiles only, no buildx/QEMU/multi-arch variants) found zero riscv64 references. `BUILDING.md`, `INSTALL`, `docs/building.md`, and `docs/cross-compilation.md` do not exist in this repository.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Broker core (pub/sub, retained messages, bridging) | Full | Full [NEEDS VERIFICATION - not independently re-checked] | Full - confirmed builds/runs with zero source changes ([Issue #3545](https://github.com/eclipse-mosquitto/mosquitto/issues/3545)) |
| TLS/TLS-PSK | Full (OpenSSL) | Full (OpenSSL) | Full (OpenSSL builds on riscv64, see Section 9) |
| Client tools (`mosquitto_pub`/`sub`/`ctrl`) | Full | Full | Full - all three build successfully in PR #3546's validation |
| Snap package | Yes | Yes | Yes, since March 2025 ([Issue #3224](https://github.com/eclipse-mosquitto/mosquitto/issues/3224)) |
| Official upstream binary release | None (no GitHub Releases for any arch) | None | None |
| Distro package (Ubuntu/Debian) | Yes | Yes | Yes (Section 8) |
| Upstream CI validation | Yes | [NEEDS VERIFICATION] | No |

**Functional gaps:** None identified. Both closed issues (#3224, #3295) and the open tracking issue (#3545) consistently report that Mosquitto works on riscv64 with zero source changes.

**Performance gaps:** No SIMD-derived performance gap is applicable (Section 4 - no architecture ever gets SIMD-tuned code). No runtime/throughput/latency benchmark data of any kind exists for Mosquitto on riscv64 - the only numeric riscv64 data found anywhere is CI build-compile time from PR #3546 (~1.5 minutes), not broker performance.

**Security hardening gaps:** Not evaluated in this research pass beyond the dependency-level OpenSSL analysis in Section 9. No riscv64-specific hardening issue was found.

**NaN/floating-point semantics issues:** None found. One tangential, non-architecture-specific bug, [Issue #3736](https://github.com/eclipse-mosquitto/mosquitto/issues/3736) ("Integer overflow in mosquitto_pub," open, filed 2026-09-06), involves a float-to-int cast overflow in `client/client_shared.c:1047`, but it is a general C bug unrelated to and not tagged as RISC-V-specific.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist?** No. Confirmed by directly reading all 14 workflow files in `.github/workflows/` at HEAD `6aaba32614eb1160ddbfeafd616f9f67e7914a41`: `cifuzz.yml`, `codeql-analysis.yml`, `coverage.yml`, `coverity-scan-develop.yml`, `coverity-scan-fixes.yml`, `delete-old-workflow-runs.yml`, `issue-labler.yml`, `linux-asan.yml`, `linux-build-variants.yml`, `linux.yml`, `lock.yml`, `macos.yml`, `mosquitto-make.yml`, `windows.yml`. Every `runs-on:` value is `ubuntu-latest`, `macos-latest`, or `windows-2022`. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines.yml` exist in the repository.

**RISE runners?** Proposed but not active. [PR #3546](https://github.com/eclipse-mosquitto/mosquitto/pull/3546) adds a new workflow file, `.github/workflows/alt-arch-riscv64.yml`, targeting the `ubuntu-24.04-riscv` runner label - a native riscv64 GitHub Actions runner provided by the RISE Project (a Scaleway EM-RV1 bare-metal riscv64 server). Per the PR author's own comment, this requires an `eclipse-mosquitto` org admin to install the "RISE risc-v runners" GitHub App before the label resolves to a real machine; without it, the job would sit permanently queued (harmlessly, since the job carries `continue-on-error: true`). This has not been done - verified via `git merge-base --is-ancestor`, confirming the PR's commit `7b329c7` is not an ancestor of `master`.

**Hardware used:** The PR's local validation (not CI) was run on two systems: the RISE native `ubuntu-24.04-riscv` GitHub Actions runner (1m38s build) and a BananaPi F3 (SpacemiT K1, rv64gc, 8 cores @ 1.6GHz; 1m30s wall time / 9min CPU time).

**Comparison table:**

| Architecture | CI exists | Test execution | Release-blocking | Runner type |
|---|---|---|---|---|
| amd64 | Yes (`linux.yml` et al.) | Yes | Yes (standard workflows) | GitHub-hosted `ubuntu-latest` |
| arm64 | [NEEDS VERIFICATION - not confirmed in a dedicated arm64 workflow in this pass] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] |
| riscv64 | No (proposed only, PR #3546 open/unmerged) | No | No (proposed job is non-blocking, `continue-on-error: true`) | Would be RISE native runner (Scaleway EM-RV1), pending org admin app install |

## 8. Distribution and Release Status

**Official upstream binaries:** None exist for any architecture. Direct fetch of [github.com/eclipse-mosquitto/mosquitto/releases](https://github.com/eclipse-mosquitto/mosquitto/releases) returns "There aren't any releases here." `git ls-remote --tags` shows only source-code git tags (up to v2.1.2), no GitHub Release objects with binary assets.

**PyPI:** N/A. `https://pypi.org/pypi/mosquitto/json` returns HTTP 404 - no package named `mosquitto` exists on PyPI (Mosquitto is a C daemon, not a Python package; `paho-mqtt`, a different project, is the Python MQTT client library).

**RISE Python wheel builder:** N/A, consistent with no PyPI package - `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/mosquitto/` redirects to the 404ing PyPI URL.

**npm, Maven, OCI:** Not evaluated as primary channels for this C project in this research pass; the official Docker images (`docker/` directory: `1.6-openssl/`, `2.0-openssl/`, `2.1-alpine/`, `2.1-ubuntu/`, `generic/`, `local/`) are single-architecture Dockerfiles with no buildx/multi-arch/riscv64 variant found in-repo.

**Linux distribution packages (verified via direct HTTP fetch of actual `.deb` files, not just listing pages):**

| Distro | Package | Version | riscv64 | Verification |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" | `mosquitto`, `mosquitto-clients`, `libmosquitto1`, `libmosquitto-dev`, `libmosquittopp1`, `libmosquittopp-dev` | 2.0.22-5build1 (universe) | Yes | `.deb` fetched from `ports.ubuntu.com` returned HTTP 200 |
| Debian trixie (stable) | `mosquitto` | 2.0.21-1 | Yes | `.deb` fetched from `deb.debian.org` returned HTTP 200 |
| Snap (Launchpad) | `mosquitto` snap | edge channel, confirmed working since March 2025 | Yes | [Issue #3224](https://github.com/eclipse-mosquitto/mosquitto/issues/3224) maintainer confirmation |
| Arch Linux RISC-V | - | - | Inconclusive - connection resets during verification, neither confirmed nor refuted | - |
| Fedora | - | - | Not checked in this research pass [NEEDS VERIFICATION] | - |

**What a user must do to get a working binary today:** Install via a downstream distribution's package manager (`apt install mosquitto` on Ubuntu 26.04 resolute or Debian trixie, both confirmed working riscv64 builds from unmodified upstream source), or install the snap. There is no upstream-provided riscv64 binary of any kind (no GitHub Release, no upstream Docker image variant identified). Building from source works out of the box with zero source modifications, per the closed issues and the open tracking issue/PR.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| OpenSSL | TLS/TLS-PSK, required when `WITH_TLS=ON` (default ON) | Yes | Yes (CI runs on linux-riscv64 per upstream project report) | Yes, all archs incl. riscv64 | Well-supported; minor open non-blocking issues: [#28118](https://github.com/openssl/openssl/issues/28118) (musl riscv extension detection), [#30880](https://github.com/openssl/openssl/issues/30880) (flaky test_lhash on linux-riscv64 CI). None release-blocking. |
| jemalloc | Optional broker allocator, `WITH_JEMALLOC` default OFF | Builds after 2026-03-11 fix (commit `c51949e`, `config.sub`/`config.guess` triple recognition) | Not in CI - riscv64 absent from jemalloc's own CI workflows | Source-tarball only, no arch-specific release notes | Weak signal: [#2399](https://github.com/jemalloc/jemalloc/issues/2399) "Does jemalloc support cross build for RISCV64" has sat unanswered ~3 years. Since OFF by default, not a build blocker for stock Mosquitto. |
| argon2 (libargon2) | Password hashing for `mosquitto_passwd`, optional (`WITH_ARGON2` currently commented out in CMake pending threading rework) | No riscv64-specific issues/PRs found - implies portable scalar-C reference path | No CI evidence found | Source releases only | No riscv64-specific attention found, positive or negative. |
| cJSON | Config/dynamic-security-plugin JSON parsing, always required | No riscv64 issues found (architecture-agnostic library) | No CI evidence found | Packaged widely (`libcjson-dev`/`cjson-devel`/`cjson-dev`) | Lowest-risk dependency; pure portable C. |
| libwebsockets | Optional alternative WS backend, not built by default (builtin picohttpparser implementation is ON by default) | No riscv64-specific issues found | No riscv64-specific issues found | Distro-packaged (`libwebsockets-dev`); riscv64 archive availability not independently confirmed here | Under-tested rather than known-broken; only enters the build if `WITH_WEBSOCKETS_BUILTIN=OFF`. |

**Deep-dive - OpenSSL (the only hard-required, category-matching dependency):** OpenSSL's own riscv64 CI runs on a dedicated linux-riscv64 runner and includes RISC-V ISA-extension-specific assembly (Zbb/Zbc/Zkn/Zvk) added since 2022, per this project's own upstream tracking. Open issues are minor (musl-specific extension detection, an occasional flaky test, an asm-to-intrinsics refactor, AES capability-flag correctness) and none block Mosquitto's build or TLS functionality on riscv64.

**Summary judgment:** Mosquitto's only hard-required, risk-relevant dependency is OpenSSL, which is well-supported on riscv64. The two optional dependencies with weaker riscv64 signal (jemalloc, argon2) are off by default and only matter if a downstream integrator explicitly enables them. cJSON is architecture-agnostic and zero-risk. No dependency blocks a standard Mosquitto riscv64 build.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3545](https://github.com/eclipse-mosquitto/mosquitto/issues/3545) | Add riscv64 to CI build matrix | Open | Not a bug - enhancement/tracking | 0 comments, no maintainer response as of this report |
| [#3546](https://github.com/eclipse-mosquitto/mosquitto/pull/3546) | ci: add riscv64 native build workflow | Open (PR) | Not a bug - infra enhancement | Implements #3545; unmerged; blocked on org admin installing RISE GitHub App |
| [#3224](https://github.com/eclipse-mosquitto/mosquitto/issues/3224) | Missing riscv64 snap | Closed (completed) | Packaging only | Resolved via Launchpad config, no in-repo change |
| [#3295](https://github.com/eclipse-mosquitto/mosquitto/issues/3295) | risc-v support | Closed (completed) | Not a bug - informational request | Confirmed working, no code change needed |
| [#3183](https://github.com/eclipse-mosquitto/mosquitto/issues/3183) | mosquitto 2.0.20 fails to build on Linux without threads | Closed (fixed in 2.0.21) | Build break, non-riscv-specific | Reporter used a `riscv64-buildroot-linux-uclibc-gcc` toolchain, but the bug affected any platform with `WITH_THREADING=no` |
| [#3736](https://github.com/eclipse-mosquitto/mosquitto/issues/3736) | Integer overflow in mosquitto_pub | Open | Correctness bug, non-riscv-specific | Float-to-int cast overflow in `client_shared.c:1047`; general C bug, not tagged riscv |

**Correctness bugs specific to RISC-V:** None found. No open or closed issue documents a riscv64-specific runtime correctness failure (crash, NaN handling, segfault, data corruption). Searches for `riscv nan floating`, `riscv segfault/crash`, and `benchmark/throughput/slow riscv` returned nothing riscv-specific.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer has objected to riscv64 support in any issue or PR thread; the tone throughout (#3224, #3295) is affirmative ("runs fine," "supports risc-v already as well").

**Technical blockers:** None. The codebase requires zero source changes to build and run on riscv64, confirmed independently on two riscv64 platforms (RISE native runner, BananaPi F3) per PR #3546.

**Organizational blockers:** The sole concrete blocker is administrative: an `eclipse-mosquitto` org admin/maintainer must install the third-party "[RISE RISC-V Runners](https://github.com/apps/rise-risc-v-runners)" GitHub App for the `ubuntu-24.04-riscv` runner label in PR #3546 to resolve to an actual machine. This is a one-time org-settings action, not a code review task, and it has not happened as of this report (2026-09-07, PR opened 2026-03-20, meaning roughly 5.5 months with zero maintainer engagement on either #3545 or #3546).

**Acceptance probability:** High, based on precedent - maintainer @ralight resolved both prior riscv64-adjacent issues (#3224, #3295) quickly and positively (within days). The current PR is low-risk by design (`continue-on-error: true`, cannot break existing CI) and the author pre-emptively addressed the maintainer's likely operational concern by offering a QEMU-based fallback if the GitHub App is undesirable. The absence of any response after 5.5 months more likely reflects low maintainer bandwidth/prioritization than a substantive objection, but this is inference, not a confirmed maintainer statement [NEEDS VERIFICATION].

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro (Debian/Ubuntu build unmodified upstream source; no upstream-provided riscv64 artifact exists for any architecture)
- **Justification:** No upstream riscv64 CI exists today - a repo-wide grep for "riscv" at master HEAD (`6aaba32614eb1160ddbfeafd616f9f67e7914a41`) returns zero matches across all 14 GitHub Actions workflow files, and the only riscv64 CI proposal, [PR #3546](https://github.com/eclipse-mosquitto/mosquitto/pull/3546), is open, unmerged, and unreviewed by any maintainer. The distribution floor applies and lifts the grade from orange to yellow: Debian trixie and Ubuntu 26.04 resolute both build and ship riscv64 packages (verified via actual HTTP 200 `.deb` fetches) from unmodified upstream source, confirmed unpatched by the repeated maintainer/reporter statement that "no source changes are needed" ([Issue #3224](https://github.com/eclipse-mosquitto/mosquitto/issues/3224), [Issue #3295](https://github.com/eclipse-mosquitto/mosquitto/issues/3295)).
- **Optimization purpose:** Not applicable - Mosquitto is a protocol broker, not a performance-optimization library; Section 2's modifier does not trigger, and there is no RISC-V-specific (or amd64/arm64-specific) hot-path code to grade.
- **Pending work that could change the grade:** Merging [PR #3546](https://github.com/eclipse-mosquitto/mosquitto/pull/3546) and installing the RISE runner GitHub App on the `eclipse-mosquitto` org would establish upstream riscv64 CI. Because the proposed job is build-only (no test execution beyond a binary sanity check: `--version`/`--help`/`file`) and non-blocking (`continue-on-error: true`), merging it as-is would raise CI evidence to "build-only, non-blocking" - under the color model this is still capped at yellow (build-only CI = yellow, not blue), unless the job is later extended to run the test suite and made release-blocking, and unless upstream also begins publishing riscv64 release artifacts directly (currently no GitHub Releases exist for any architecture, so `release_provider: upstream` is not achievable without a broader release-process change).

## 14. Investment Analysis

RISE has not funded or directly engaged with Mosquitto. Per Section 2, Mosquitto is not a RISE member project, has no RISE blog coverage (checked all 34 posts via sitemap), and appears in no `riseproject-dev` GitHub repository beyond a to-evaluate entry in this project's own candidate-tracking files. The only RISE touchpoint is that an independent, unaffiliated contributor (@gounthar) is proposing to use RISE's free public riscv64 CI runners in PR #3546 - this is a community contribution consuming open infrastructure, not RISE-funded work. No prior investment exists to net out against the sizing below.

### 14.1 Functional Enablement

No functional work is needed. The codebase builds and runs on riscv64 with zero source changes, confirmed on two independent riscv64 platforms (RISE runner, BananaPi F3) and by two closed community issues going back to March 2025. This is the strongest possible starting position - there is no code-level gap to close.

### 14.2 Performance Optimization

Not applicable in the traditional sense - Mosquitto has no architecture-specific hot-path code for any architecture (Section 4), so there is no RISC-V-specific optimization backlog to size. If a future investment were made, it would be in the shared, upstream-external dependency layer (OpenSSL's RISC-V crypto-extension coverage, Section 9), not in Mosquitto itself. No runtime performance benchmark exists yet for any architecture comparison; producing one (message throughput/latency on riscv64 vs amd64/arm64 under representative IoT workloads) would be a measurement/validation exercise, not an optimization project.

### 14.3 CI/CD Infrastructure

This is the concrete, actionable gap. Two independent actions are needed:
1. Maintainer review and merge of [PR #3546](https://github.com/eclipse-mosquitto/mosquitto/pull/3546) - a small, self-contained, non-blocking workflow addition already authored and validated by a third-party contributor.
2. An `eclipse-mosquitto` org admin installing the [RISE RISC-V Runners GitHub App](https://github.com/apps/rise-risc-v-runners) - a one-time administrative action.

Neither requires new engineering work from a sponsor; the highest-leverage action available is direct maintainer outreach/advocacy to get the existing PR reviewed, or, if maintainer bandwidth is the blocker, offering a reviewer/co-maintainer with Eclipse committer standing to shepherd it.

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None needed - riscv64 already works with zero source changes | 0 | N/A | N/A |
| CI/CD | Review and merge existing PR #3546 (advocacy/facilitation, not new code) | <0.5 | Community/maintainer relations | High |
| CI/CD | Install RISE RISC-V Runners GitHub App on eclipse-mosquitto org (admin action) | <0.5 | Eclipse Foundation/Cedalo admin | High |
| CI/CD | Extend riscv64 CI job to run the existing test suite (currently build-only) so it can graduate past yellow | 1-2 | Community contributor or sponsor engineer | Medium |
| Release | Establish an upstream riscv64 release artifact channel (currently no GitHub Releases exist for any arch, so this would require a broader release-process change, not a riscv64-specific one) | Out of scope for riscv64-specific investment - would require project-wide release process change | Mosquitto maintainers | Low |
| Validation | Produce a first riscv64 vs amd64/arm64 runtime performance benchmark (throughput/latency under representative MQTT workloads) | 1-2 | Sponsor engineer | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Issue #3545 - Add riscv64 to CI build matrix](https://github.com/eclipse-mosquitto/mosquitto/issues/3545)
- [PR #3546 - ci: add riscv64 native build workflow](https://github.com/eclipse-mosquitto/mosquitto/pull/3546)
- [Issue #3295 - risc-v support](https://github.com/eclipse-mosquitto/mosquitto/issues/3295)
- [Issue #3224 - Missing riscv64 snap](https://github.com/eclipse-mosquitto/mosquitto/issues/3224)
- [Issue #3183 - mosquitto 2.0.20 fails to build on Linux without threads](https://github.com/eclipse-mosquitto/mosquitto/issues/3183)
- [Issue #3736 - Integer overflow in mosquitto_pub](https://github.com/eclipse-mosquitto/mosquitto/issues/3736)
- [Eclipse Mosquitto GitHub Releases page](https://github.com/eclipse-mosquitto/mosquitto/releases) (confirms no releases exist for any architecture)
- [eclipse-mosquitto/mosquitto repository](https://github.com/eclipse-mosquitto/mosquitto)
- [Eclipse project page - iot.mosquitto](https://projects.eclipse.org/projects/iot.mosquitto)
- [Eclipse project committers - iot.mosquitto "who" page](https://projects.eclipse.org/projects/iot.mosquitto/who)
- [Mosquitto homepage](https://mosquitto.org/)
- [Cedalo](https://cedalo.com/)
- [Ubuntu 26.04 "resolute" mosquitto riscv64 package](https://packages.ubuntu.com/resolute/riscv64/mosquitto)
- [Debian trixie mosquitto package](https://packages.debian.org/trixie/riscv64/mosquitto)
- [RISE RISC-V Runners GitHub App](https://github.com/apps/rise-risc-v-runners)
- [RISE Project](https://riseproject.dev/)
- [RISE Project members](https://riseproject.dev/members/)
- [PyPI mosquitto package lookup (404, confirms absence)](https://pypi.org/pypi/mosquitto/json)
- [OpenSSL issue #28118 - Riscv extension detection broken on musl](https://github.com/openssl/openssl/issues/28118)
- [OpenSSL issue #30880 - test_lhash occasionally failing on linux-riscv64 CI](https://github.com/openssl/openssl/issues/30880)
- [jemalloc issue #2399 - Does jemalloc support cross build for RISCV64 target on Linux?](https://github.com/jemalloc/jemalloc/issues/2399)
